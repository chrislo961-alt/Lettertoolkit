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
{"summary":"...","experience":"...","skills":"..."}

INPUT:
${cvText}`;
}

function importPrompt(language) {
  return `Extract every factual detail from this CV/resume into ${language || "English"}.

Important:
- Preserve facts exactly.
- Do not improve wording yet.
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

Formatting:
- experience: readable plain text, with role/employer sections and bullet lines.
- education: readable plain text.
- skills: concise comma-separated list.`;
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
        const fileData = safeText(body.fileData, 8_500_000);
        const language = safeText(body.language, 40) || "English";

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
        const background = safeText(body.background, 14000);
        const jobAd = safeText(body.jobAd, 12000);

        const prompt = `You are an expert job-application writer.
Write a tailored job application in ${language} for the target role "${targetRole}".

Tone: ${tone}

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

      if (!["improve_cv", "cover_letter"].includes(body.action)) {
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