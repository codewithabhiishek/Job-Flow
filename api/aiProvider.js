import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// ─── Job Posting JSON schema enforced at inference level ───────────────────────
const JOB_JSON_SCHEMA = {
  name: "job_posting",
  strict: true,
  schema: {
    type: "object",
    properties: {
      company:         { type: "string" },
      job_title:       { type: "string" },
      location:        { type: "string" },
      work_mode:       { type: "string" },
      salary:          { type: "string" },
      employment_type: { type: "string" },
      experience:      { type: "string" },
      education:       { type: "string" },
      skills:          { type: "array", items: { type: "string" } },
      deadline:        { type: "string" },
      job_url:         { type: "string" },
      source:          { type: "string" },
      benefits:        { type: "array", items: { type: "string" } },
      notes:           { type: "string" }
    },
    required: [
      "company", "job_title", "location", "work_mode",
      "salary", "employment_type", "experience", "education",
      "skills", "deadline", "job_url", "source", "benefits", "notes"
    ],
    additionalProperties: false
  }
};

// ─── Extraction instructions (embedded in user turn for vision; system for text) ─
const EXTRACTION_INSTRUCTIONS = `You are a strict JSON extraction engine. Extract job details from the provided content.

RULES:
1. ONLY extract information EXPLICITLY present. NEVER guess, infer, or hallucinate values.
2. If a field is missing, return "" (empty string) or [] (empty array). Never return "None" or "null" as a string.
3. Return ONLY a single valid JSON object. No markdown. No prose. No code fences.
4. Output must begin with { and end with }.

Field extraction rules:
- company: Exact company name. Do not shorten.
- job_title: Exact title as written. Preserve seniority (Intern, Junior, Senior, etc.).
- location: Full location only. Do NOT include remote/hybrid here.
- work_mode: One of: "On-site" | "Hybrid" | "Remote" | "" (leave empty if unclear).
- salary: Only if explicitly stated. Preserve currency and original format.
- employment_type: One of: "Internship" | "Full-time" | "Part-time" | "Contract" | "Freelance" | "".
- experience: Years of experience only (e.g. "2+ years"). Not education.
- education: Degree requirement only (e.g. "Bachelor's degree in CS").
- skills: Only explicit technical skills. Do NOT invent related technologies.
- deadline: Application deadline date if explicitly stated, else "".
- job_url: Leave "" unless a URL is visible in the content.
- source: The platform name where the job is posted (e.g. "LinkedIn", "Indeed", "Wellfound", "Naukri", "Glassdoor", "Company Website"). Leave "" if unknown.
- benefits: Only explicitly listed benefits (health, equity, etc.).
- notes: Always "".`;

export class AIProvider {
  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || '';
  }

  async invokeLLM(payload, type) {
    const textModel   = process.env.TEXT_MODEL   || "meta/llama-3.1-8b-instruct";
    const visionModel = process.env.VISION_MODEL || "meta/llama-3.2-11b-vision-instruct";
    const model       = type === "screenshot" ? visionModel : textModel;

    // ── Build messages ────────────────────────────────────────────────────────
    let messages;

    if (type === "screenshot") {
      // ROOT CAUSE FIX:
      // Llama 3.2 Vision silently drops the `system` role when an image is present.
      // The entire instruction set MUST be embedded in the `user` turn.
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              // Prepend ALL instructions into the user message — the only reliably
              // processed turn for multimodal requests.
              text: `${EXTRACTION_INSTRUCTIONS}\n\nExtract job posting details from the screenshot below:`
            },
            {
              type: "image_url",
              image_url: { url: payload }
            }
          ]
        }
      ];
    } else {
      // Text / URL — system message works fine here.
      messages = [
        { role: "system", content: EXTRACTION_INSTRUCTIONS },
        { role: "user",   content: `Extract job details from this content:\n\n${payload}` }
      ];
    }

    // ── Request payload ───────────────────────────────────────────────────────
    const requestPayload = {
      model,
      messages,
      temperature: 0.05,   // as deterministic as possible
      top_p: 0.9,
      max_tokens: 2048,    // schema-enforced JSON needs more room than prose
      stream: false,
      // ROOT CAUSE FIX #2:
      // Enforce structured output at the inference engine level.
      // This makes it IMPOSSIBLE for the model to output prose or Markdown.
      response_format: {
        type: "json_schema",
        json_schema: JOB_JSON_SCHEMA
      }
    };

    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;
      const startTime  = Date.now();
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30000);

      try {
        console.log(`[AI Request] Attempt ${attempt}/${maxAttempts} | Model: ${model} | Type: ${type}`);

        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[AI Error] Status: ${response.status} | ${duration}ms | ${errText}`);
          if (attempt === maxAttempts) throw new Error(`NVIDIA API returned ${response.status}: ${errText}`);
          continue;
        }

        const data    = await response.json();
        const content = data.choices[0].message.content;

        console.log(`[AI Success] ${duration}ms | Model: ${model}`);
        console.log("================ RAW MODEL OUTPUT ================");
        console.log(content);
        console.log("==================================================");

        // ── Parse ─────────────────────────────────────────────────────────────
        let jsonString = "";
        try {
          // With response_format: json_schema the content WILL be valid JSON.
          // The brace-extraction is kept as a safety net for edge cases.
          const firstBrace = content.indexOf('{');
          const lastBrace  = content.lastIndexOf('}');
          if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON object in response");

          jsonString     = content.substring(firstBrace, lastBrace + 1);
          const parsed   = JSON.parse(jsonString);

          const sanitizeStr = (v) =>
            v && typeof v === 'string' && !['none','null','n/a','undefined'].includes(v.trim().toLowerCase())
              ? v.trim()
              : "";
          const sanitizeArr = (v) =>
            Array.isArray(v) ? v.filter(x => x && !['none','null'].includes((x+'').trim().toLowerCase())) : [];

          const processed = {
            company:         sanitizeStr(parsed.company),
            job_title:       sanitizeStr(parsed.job_title),
            location:        sanitizeStr(parsed.location),
            work_mode:       sanitizeStr(parsed.work_mode),
            remote:          sanitizeStr(parsed.work_mode).toLowerCase() === 'remote' || parsed.remote === true,
            salary:          sanitizeStr(parsed.salary),
            employment_type: sanitizeStr(parsed.employment_type),
            experience:      sanitizeStr(parsed.experience),
            education:       sanitizeStr(parsed.education),
            skills:          sanitizeArr(parsed.skills),
            deadline:        sanitizeStr(parsed.deadline),
            job_url:         sanitizeStr(parsed.job_url),
            benefits:        sanitizeArr(parsed.benefits),
            notes:           ""
          };

          console.log(`[AI Parsed] company="${processed.company}" title="${processed.job_title}" location="${processed.location}"`);
          return processed;

        } catch (parseError) {
          console.error("================ PARSE ERROR ================");
          console.error("JSON.parse error:", parseError.message);
          console.error("String attempted:", jsonString || content);
          console.error("=============================================");
          if (attempt === maxAttempts) throw new Error("AI returned invalid JSON format.");
        }

      } catch (error) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        if (error.name === 'AbortError') {
          console.error(`[AI Timeout] Request timed out after ${duration}ms`);
        } else {
          console.error(`[AI Exception] ${duration}ms | ${error.message}`);
        }

        if (attempt === maxAttempts) {
          return {
            success: false,
            stage: "AI Provider",
            error: error.name === 'AbortError' ? "Request timed out after 30s" : error.message,
            details: `Model: ${model}, Type: ${type}`
          };
        }
      }
    }
  }
}

export const aiProvider = new AIProvider();
