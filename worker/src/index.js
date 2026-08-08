const allowedOrigins = new Set([
  "https://lettertoolkit.com",
  "https://www.lettertoolkit.com",
]);

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowOrigin = allowedOrigins.has(origin) ? origin : "https://lettertoolkit.com";
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "Origin",
  };
}

function json(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(request),
    },
  });
}

function safeText(value, max = 12000) {
  return String(value || "").slice(0, max);
}

function normalizeFileData(fileData, mimeType, filename) {
  const value = String(fileData || "");
  if (value.startsWith("data:")) return value;

  const lower = String(filename || "").toLowerCase();
  let mime = String(mimeType || "").trim();
  if (!mime) {
    if (lower.endsWith(".pdf")) mime = "application/pdf";
    else if (lower.endsWith(".docx")) mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (lower.endsWith(".txt")) mime = "text/plain";
    else if (lower.endsWith(".html") || lower.endsWith(".htm")) mime = "text/html";
    else mime = "application/octet-stream";
  }
  return `data:${mime};base64,${value}`;
}

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  for (const item of responseJson.output || []) {
    for (const part of item.content || []) {
      if (part.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function parseJsonText(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

function buildTextPrompt(body) {
  const cv = body.cv || {};
  const language = safeText(body.language, 40) || "English";
  const targetRole = safeText(body.targetRole, 120);
  const jobAd = safeText(body.jobAd, 12000);

  const cvText = `
Name: ${safeText(cv.name, 120)}
Target role: ${targetRole}
Location: ${safeText(cv.location, 240)}

Current profile:
${safeText(cv.summary, 5000)}

Experience:
${safeText(cv.experience, 12000)}

Education:
${safeText(cv.education, 6000)}

Skills:
${safeText(cv.skills, 6000)}

Job advertisement:
${jobAd}
`.trim();

  if (body.action === "review_cv") {
    return `Act as a senior CV reviewer and recruiter.
Review this CV in ${language}. If a job advertisement is supplied, evaluate relevance to that job as well.

Rules:
- Never invent facts, employers, dates, education, achievements, metrics or skills.
- Suggestions must preserve the candidate's factual meaning.
- Prioritize clarity, impact, readability, ATS compatibility and relevance.
- Keep the number of suggestions useful and focused (maximum 8).
- "after" must contain replacement text that can safely replace the named field.
- Allowed fields: role, summary, experience, education, skills.
- Score is 0-100 and should reflect the CV as currently written.
- Return JSON only.

Exact JSON shape:
{
  "score": 0,
  "verdict": "",
  "overview": "",
  "suggestions": [
    {
      "field": "summary",
      "title": "",
      "reason": "",
      "before": "",
      "after": ""
    }
  ]
}

CV:
${cvText}

JOB ADVERTISEMENT:
${jobAd || "(none supplied)"}`;
  }

  if (body.action === "translate_cv") {
    return `You are an expert CV editor and translator.
Rewrite the complete CV in ${language}.

Rules:
- Preserve every factual detail.
- Never invent employers, dates, achievements, responsibilities, education, certifications, tools or metrics.
- Translate naturally rather than word-for-word.
- Keep employer names and official product/company names unchanged unless they have a conventional localized form.
- Preserve chronological order and all work history.
- Return JSON only with this exact shape:
{"role":"...","summary":"...","experience":"...","education":"...","skills":"..."}

INPUT:
${cvText}`;
  }

  if (body.action === "cover_letter") {
    return `You are an expert CV and job-application editor.
Write a concise, specific cover letter in ${language} based only on the facts provided.

Rules:
- Never invent employers, dates, achievements, degrees, certifications, tools, or metrics.
- Tailor the letter to the job advertisement.
- Avoid clichés and exaggerated claims.
- Keep it around 250-400 words.
- Return JSON only with this exact shape:
{"coverLetter":"..."}

INPUT:
${cvText}`;
  }

  return `You are an expert CV editor.
Improve the CV for the target job, in ${language}, while preserving factual accuracy.

Rules:
- Never invent employers, dates, responsibilities, achievements, degrees, certifications, tools, or metrics.
- Make the profile concise and job-relevant.
- Rewrite experience into clear achievement-oriented bullets where the source supports it.
- Keep skills relevant and deduplicate them.
- Return JSON only with this exact shape:
{"role":"...","summary":"...","experience":"...","education":"...","skills":"..."}

INPUT:
${cvText}`;
}

function importPrompt(language) {
  return `Extract every factual detail from this CV/resume and present the structured text in ${language || "English"}.

Important:
- Preserve facts exactly.
- Translate descriptive CV text naturally into the requested language while preserving names, employers, dates and factual meaning.
- Do not improve or embellish facts.
- Do not invent missing details.
- Read the entire document, including multiple pages, columns and bullet lists.
- Capture ALL employment history, ALL education, languages and certifications.
- Keep dates and employer names exactly as written when possible.

Return JSON only with this exact shape:
{
  "rawText":"",
  "name":"",
  "role":"",
  "email":"",
  "phone":"",
  "location":"",
  "summary":"",
  "experience":"",
  "education":"",
  "skills":"",
  "languages":"",
  "certifications":"",
  "confidence":{
    "name":"high|medium|low",
    "role":"high|medium|low",
    "email":"high|medium|low",
    "phone":"high|medium|low",
    "location":"high|medium|low",
    "summary":"high|medium|low",
    "experience":"high|medium|low",
    "education":"high|medium|low",
    "skills":"high|medium|low",
    "languages":"high|medium|low",
    "certifications":"high|medium|low"
  }
}

Formatting:
- experience: every role/employer in chronological sections with dates and bullet points.
- education: every education entry with dates if present.
- skills/languages/certifications: concise lists.
- rawText: a faithful plain-text extraction of the CV content.`;
}



function structureImportedCvPrompt(extracted, language) {
  return `You are validating and structuring an already-extracted CV.

Language: ${language || "English"}

Rules:
- Use ONLY the facts in EXTRACTED DATA.
- Never add employers, dates, roles, education, certifications, languages, achievements, metrics or technologies that are not present.
- Preserve the full work history and full education history.
- Improve structure only, not facts.
- If something is uncertain, keep it empty rather than guessing.

Return JSON only with this exact shape:
{
  "name":"",
  "role":"",
  "email":"",
  "phone":"",
  "location":"",
  "summary":"",
  "experience":"",
  "education":"",
  "skills":"",
  "languages":"",
  "certifications":"",
  "confidence":{
    "name":"high|medium|low",
    "role":"high|medium|low",
    "email":"high|medium|low",
    "phone":"high|medium|low",
    "location":"high|medium|low",
    "summary":"high|medium|low",
    "experience":"high|medium|low",
    "education":"high|medium|low",
    "skills":"high|medium|low",
    "languages":"high|medium|low",
    "certifications":"high|medium|low"
  }
}

EXTRACTED DATA:
${JSON.stringify(extracted)}`;
}

async function callResponses(env, input, maxOutputTokens = 1600) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || "gpt-5.6-luna",
      reasoning: { effort: "none" },
      input,
      max_output_tokens: maxOutputTokens,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);

  const apiJson = await apiResponse.json();

  if (!apiResponse.ok) {
    console.error("OpenAI error", JSON.stringify(apiJson));
    throw new Error(apiJson?.error?.message || "AI provider request failed.");
  }

  const text = extractOutputText(apiJson);
  if (!text) throw new Error("AI returned no usable text.");
  return parseJsonText(text);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/cv" || request.method !== "POST") {
      return json(request, { error: "Not found" }, 404);
    }

    if (!env.OPENAI_API_KEY) {
      return json(request, { error: "OPENAI_API_KEY is not configured." }, 500);
    }

    const declaredSize = Number(request.headers.get("content-length") || 0);
    if (declaredSize > 9 * 1024 * 1024) {
      return json(request, { error: "Request is too large." }, 413);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(request, { error: "Invalid JSON body." }, 400);
    }

    try {
      if (body.action === "import_cv") {
        const filename = safeText(body.filename, 180);
        const rawFileData = safeText(body.fileData, 8_500_000);
        const language = safeText(body.language, 40) || "English";
        const fileData = normalizeFileData(rawFileData, safeText(body.mimeType, 120), filename);

        if (!filename || !fileData) {
          return json(request, { error: "Missing file." }, 400);
        }

        // Pass 1: extract the complete document.
        const extractInput = [{
          role: "user",
          content: [
            { type: "input_file", filename, file_data: fileData },
            { type: "input_text", text: importPrompt(language) },
          ],
        }];

        const extracted = await callResponses(env, extractInput, 2600);

        // Pass 2: normalize and verify structure using only extracted facts.
        const structured = await callResponses(
          env,
          structureImportedCvPrompt(extracted, language),
          2200
        );

        return json(request, structured);
      }

      if (body.action === "job_application") {
        const language = safeText(body.language, 40) || "English";
        const targetRole = safeText(body.targetRole, 120);
        const tone = safeText(body.tone, 40) || "professional";
        const applicationStyle = safeText(body.applicationStyle, 40) || "standard";
        const background = safeText(body.background, 14000);
        const jobAd = safeText(body.jobAd, 12000);

        const prompt = `You are an expert job-application writer.
Write a tailored job application in ${language} for the target role "${targetRole}".

Tone: ${tone}
Application style: ${applicationStyle}

Style guidance:
- standard: balanced and professional.
- concise: shorter and tightly focused.
- story: more personal narrative, while remaining professional.
- executive: direct, senior, strategic tone.

Rules:
- Base the application only on the applicant background and job advertisement below.
- Never invent employers, education, dates, certifications, achievements, tools, languages or metrics.
- Make the application specific to the job rather than generic.
- Avoid empty clichés.
- Keep it concise and natural, around 250-450 words.
- Return JSON only with this exact shape:
{"application":"..."}

APPLICANT BACKGROUND:
${background}

JOB ADVERTISEMENT:
${jobAd}`;

        const result = await callResponses(env, prompt, 1700);
        return json(request, result);
      }

      if (body.action === "coach_interview_answer") {
        const language = safeText(body.language, 40) || "English";
        const targetRole = safeText(body.targetRole, 120);
        const mode = safeText(body.mode, 40) || "star";
        const question = safeText(body.question, 2000);
        const focus = safeText(body.focus, 3000);
        const answer = safeText(body.answer, 12000);
        const background = safeText(body.background, 14000);
        const jobAd = safeText(body.jobAd, 12000);

        const prompt = `Act as an experienced interview coach.
Review the candidate's answer for an interview for "${targetRole}".
Write in ${language}.

Question:
${question}

What the recruiter is likely looking for:
${focus}

Candidate answer:
${answer}

Preferred answer style: ${mode}

Candidate background:
${background}

Job advertisement:
${jobAd}

Rules:
- Never invent candidate facts, employers, dates, achievements, qualifications or metrics.
- Score the answer 0-100.
- Feedback must be practical and concise.
- If STAR mode is selected, improve Situation, Task, Action and Result structure only where supported by the candidate's answer/background.
- The improved answer must remain truthful and natural.
- Return JSON only.

Exact JSON:
{
  "score":0,
  "verdict":"",
  "overview":"",
  "feedback":[""],
  "improvedAnswer":""
}`;

        const result = await callResponses(env, prompt, 1700);
        return json(request, result);
      }

      if (body.action === "interview_prep") {
        const language = safeText(body.language, 40) || "English";
        const targetRole = safeText(body.targetRole, 120);
        const background = safeText(body.background, 14000);
        const jobAd = safeText(body.jobAd, 12000);

        const prompt = `Act as an experienced recruiter preparing a candidate for an interview for "${targetRole}".
Write in ${language}.

Create likely interview questions based only on the job advertisement and candidate background.

Rules:
- Do not invent candidate achievements, experience or qualifications.
- Include 6-10 useful questions.
- Include a concise answer guide for each question.
- Focus on how the candidate can answer truthfully using their existing background.
- Include behavioral and role-specific questions where relevant.
- Return JSON only.

Exact JSON:
{
  "overview":"",
  "questions":[
    {"question":"","focus":"","answerGuide":""}
  ]
}

CANDIDATE BACKGROUND:
${background}

JOB ADVERTISEMENT:
${jobAd}`;

        const result = await callResponses(env, prompt, 1800);
        return json(request, result);
      }

      if (body.action === "application_email") {
        const language = safeText(body.language, 40) || "English";
        const targetRole = safeText(body.targetRole, 120);
        const recipient = safeText(body.recipient, 160);
        const application = safeText(body.application, 14000);
        const background = safeText(body.background, 10000);
        const jobAd = safeText(body.jobAd, 10000);

        const prompt = `Write a concise email in ${language} for sending a job application.
Target role: ${targetRole}
Recipient/company: ${recipient || "(not supplied)"}

Rules:
- Keep the email short, professional and natural.
- Mention attached CV/application naturally.
- Do not invent facts or names.
- Return JSON only:
{"subject":"...","email":"..."}

APPLICATION:
${application}

BACKGROUND:
${background}

JOB ADVERTISEMENT:
${jobAd}`;

        const result = await callResponses(env, prompt, 900);
        return json(request, result);
      }

      if (body.action === "analyze_match") {
        const language = safeText(body.language, 40) || "English";
        const targetRole = safeText(body.targetRole, 120);
        const background = safeText(body.background, 14000);
        const jobAd = safeText(body.jobAd, 12000);

        const prompt = `Act as a recruiter.
Compare the applicant background with the job advertisement for "${targetRole}".

Return JSON only with:
{
  "score":0,
  "summary":"",
  "keywords":[""],
  "strengths":[""],
  "gaps":[""]
}

Rules:
- Score 0-100.
- Do not invent experience or qualifications.
- "keywords" should contain 4-10 relevant terms from the job ad that the applicant can truthfully emphasize.
- Keep summary concise and in ${language}.

APPLICANT BACKGROUND:
${background}

JOB ADVERTISEMENT:
${jobAd}`;

        const result = await callResponses(env, prompt, 1300);
        return json(request, result);
      }

      if (body.action === "rewrite_application") {
        const language = safeText(body.language, 40) || "English";
        const targetRole = safeText(body.targetRole, 120);
        const version = safeText(body.version, 40);
        const current = safeText(body.application, 14000);
        const jobAd = safeText(body.jobAd, 12000);

        const styleMap = {
          shorter: "Make it approximately 25% shorter while keeping the strongest relevant points.",
          warmer: "Make it warmer, more human and personable while remaining professional.",
          more_direct: "Make it more direct, concise and confident without sounding arrogant."
        };

        const prompt = `Rewrite this job application in ${language}.
Target role: ${targetRole}
Requested variation: ${styleMap[version] || "Improve clarity while preserving meaning."}

Rules:
- Preserve factual accuracy.
- Do not invent experience, employers, education, achievements, metrics, certifications or skills.
- Keep the application tailored to the job ad.
- Return JSON only: {"application":"..."}

CURRENT APPLICATION:
${current}

JOB ADVERTISEMENT:
${jobAd}`;

        const result = await callResponses(env, prompt, 1500);
        return json(request, result);
      }

      if (body.action === "review_application") {
        const language = safeText(body.language, 40) || "English";
        const targetRole = safeText(body.targetRole, 120);
        const current = safeText(body.application, 14000);
        const background = safeText(body.background, 14000);
        const jobAd = safeText(body.jobAd, 12000);

        const prompt = `Act as a senior recruiter and application editor.
Review the job application in ${language} for the target role "${targetRole}".

Rules:
- Evaluate relevance, specificity, clarity, tone, structure and credibility.
- Never invent facts.
- Score 0-100.
- Give no more than 5 focused feedback items.
- Create an improved version using only facts already present in the application/background.
- Return JSON only.

Exact shape:
{
  "score":0,
  "verdict":"",
  "overview":"",
  "feedback":[{"title":"","reason":""}],
  "improvedApplication":""
}

APPLICATION:
${current}

APPLICANT BACKGROUND:
${background}

JOB ADVERTISEMENT:
${jobAd}`;

        const result = await callResponses(env, prompt, 1800);
        return json(request, result);
      }

      if (!["improve_cv", "cover_letter", "translate_cv", "review_cv", "review_application", "rewrite_application", "analyze_match", "application_email", "interview_prep", "coach_interview_answer"].includes(body.action)) {
        return json(request, { error: "Unsupported action." }, 400);
      }

      const result = await callResponses(env, buildTextPrompt(body), 1600);
      return json(request, result);
    } catch (error) {
      console.error(error);
      return json(request, { error: error.message || "AI request failed." }, 502);
    }
  },
};