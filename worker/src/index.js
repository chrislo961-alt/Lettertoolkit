const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders },
  });
}

function safeText(value, max = 12000) {
  return String(value || "").slice(0, max);
}

function buildPrompt(body) {
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
Write a concise, specific cover letter in ${language} based only on the facts provided below.

Rules:
- Do not invent employers, dates, achievements, degrees, certifications, tools, or metrics.
- Do not claim experience the user did not provide.
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
- If a strong claim cannot be supported by the provided CV, do not add it.
- Make the profile concise and job-relevant.
- Rewrite experience into clear achievement-oriented bullets where possible, but do not fabricate numbers.
- Keep skills relevant and deduplicate them.
- Return JSON only with this exact shape:
{"summary":"...","experience":"...","skills":"..."}

INPUT:
${cvText}`;
}

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  const out = responseJson.output || [];
  for (const item of out) {
    const content = item.content || [];
    for (const part of content) {
      if (part.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  return "";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/cv" || request.method !== "POST") {
      return json({ error: "Not found" }, 404);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: "OPENAI_API_KEY is not configured on the Worker." }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    if (!["improve_cv", "cover_letter"].includes(body.action)) {
      return json({ error: "Unsupported action." }, 400);
    }

    const prompt = buildPrompt(body);

    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-5",
        input: prompt,
        max_output_tokens: 1600
      }),
    });

    const apiJson = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("OpenAI error", apiJson);
      return json({ error: apiJson?.error?.message || "AI provider request failed." }, 502);
    }

    const text = extractOutputText(apiJson);
    if (!text) return json({ error: "AI returned no usable text." }, 502);

    try {
      const parsed = JSON.parse(text);
      return json(parsed);
    } catch {
      return json({ error: "AI returned invalid JSON. Try again." }, 502);
    }
  },
};