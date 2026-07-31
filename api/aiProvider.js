import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

export class AIProvider {
  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || ''; 
  }

  async invokeLLM(payload, type) {
    const textModel = process.env.TEXT_MODEL || "meta/llama-3.1-8b-instruct";
    const visionModel = process.env.VISION_MODEL || "meta/llama-3.2-11b-vision-instruct";
    const model = type === "screenshot" ? visionModel : textModel;
    
    let systemMessage = `You are a strict JSON extraction engine.
Extract job details from the provided text or screenshot.

CRITICAL RULES:
1. ONLY extract information explicitly present in the job posting. NEVER infer, guess, hallucinate, or invent values.
2. If a field is missing, return null or an empty string. Prefer missing data over incorrect data.
3. Preserve original capitalization and wording whenever possible.
4. Return ONLY a single, valid JSON object.
5. Do NOT use markdown code blocks (e.g., \`\`\`json).
6. Do NOT output any explanations or extra text before or after the JSON.
7. Output must begin with { and end with }.

Extraction rules for fields:
- company: Extract the exact company name only. Do not shorten or modify it.
- job_title: Extract exactly as written. Preserve seniority (Intern, Junior, Senior, Lead, etc.).
- location: Extract the full location exactly. Do NOT merge work mode into the location string.
- work_mode: Detect separately (On-site, Hybrid, Remote).
- salary: Extract only if explicitly mentioned. Preserve currency and range exactly.
- employment_type: Extract exactly (Internship, Full-time, Part-time, Contract, Temporary, Freelance). Do not guess.
- experience: ONLY extract years of experience (e.g. "2+ years"). NEVER treat education requirements as experience.
- education: Extract separately (e.g. "Bachelor's degree", "Master's degree").
- skills: Extract ONLY technical skills explicitly mentioned. Do NOT invent related technologies.
- deadline: Extract only if explicitly present. Preserve the actual date.
- job_url: Preserve the original URL exactly.
- benefits: Extract only explicitly listed benefits.
- notes: Leave empty. Do not generate summaries.

Required JSON Schema:
{
  "company": "",
  "job_title": "",
  "location": "",
  "work_mode": "",
  "salary": "",
  "employment_type": "",
  "experience": "",
  "education": "",
  "skills": [],
  "deadline": "",
  "job_url": "",
  "benefits": [],
  "notes": ""
}`;

    const messages = [
      { role: "system", content: systemMessage }
    ];

    if (type === "screenshot") {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Extract details from this job posting screenshot." },
          { type: "image_url", image_url: { url: payload } }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: `Extract details from this job posting: \n\n${payload}`
      });
    }

    const requestPayload = {
      model: model,
      messages: messages,
      temperature: 0.1,
      top_p: 0.95,
      max_tokens: 1024,
      stream: false
    };

    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      try {
        console.log(`[AI Request] Attempt ${attempt}/${maxAttempts} | Model: ${model} | Provider: NVIDIA`);
        
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
          console.error(`[AI Error] Status: ${response.status} | Duration: ${duration}ms | Msg: ${errText}`);
          if (attempt === maxAttempts) throw new Error(`API returned ${response.status}`);
          continue; // retry
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        console.log(`[AI Success] Status: 200 | Duration: ${duration}ms`);
        console.log("================ RAW MODEL OUTPUT ================");
        console.log(content);
        console.log("==================================================");

        let jsonString = "";
        let sanitizedJson = "";
        try {
          // Clean the content by removing markdown formatting
          let cleanContent = content.trim();
          if (cleanContent.startsWith('```json')) cleanContent = cleanContent.replace(/^```json/i, '');
          else if (cleanContent.startsWith('```')) cleanContent = cleanContent.replace(/^```/, '');
          if (cleanContent.endsWith('```')) cleanContent = cleanContent.replace(/```$/, '');
          cleanContent = cleanContent.trim();

          const firstBrace = cleanContent.indexOf('{');
          const lastBrace = cleanContent.lastIndexOf('}');
          
          if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("No JSON object found in response");
          }
          
          jsonString = cleanContent.substring(firstBrace, lastBrace + 1);
          
          // Basic sanitization of common JSON errors from LLMs (trailing commas, unescaped newlines)
          sanitizedJson = jsonString
            .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
            .replace(/\n/g, "\\n") // Escape literal newlines within strings (naive approach, but helps)
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t");

          // Restore structural newlines for braces/brackets so parse error logs remain readable
          sanitizedJson = sanitizedJson
            .replace(/\\n\s*}/g, "\n}")
            .replace(/{\\n/g, "{\n")
            .replace(/,\s*\\n/g, ",\n");

          const parsed = JSON.parse(sanitizedJson);

          // Post-processing logic to enforce rules
          const sanitizeStr = (val) => (val && typeof val === 'string' && val.trim().toLowerCase() !== 'none' && val.trim().toLowerCase() !== 'null' ? val.trim() : "");
          const sanitizeArr = (val) => (Array.isArray(val) ? val.filter(v => v && v.trim().toLowerCase() !== 'none') : []);

          const processed = {
            company: sanitizeStr(parsed.company),
            job_title: sanitizeStr(parsed.job_title),
            location: sanitizeStr(parsed.location),
            work_mode: sanitizeStr(parsed.work_mode),
            remote: sanitizeStr(parsed.work_mode).toLowerCase() === 'remote' || parsed.remote === true,
            salary: sanitizeStr(parsed.salary),
            employment_type: sanitizeStr(parsed.employment_type),
            experience: sanitizeStr(parsed.experience),
            education: sanitizeStr(parsed.education),
            skills: sanitizeArr(parsed.skills),
            deadline: sanitizeStr(parsed.deadline),
            job_url: sanitizeStr(parsed.job_url),
            benefits: sanitizeArr(parsed.benefits),
            notes: "" // explicitly empty as per rules
          };

          return processed;
        } catch (parseError) {
          console.error("================ PARSE ERROR ================");
          console.error("JSON.parse error:", parseError.message);
          console.error("--- Cleaned response (jsonString):");
          console.error(jsonString);
          console.error("--- Sanitized response (sanitizedJson):");
          console.error(sanitizedJson);
          console.error("=============================================");
          
          if (attempt === maxAttempts) throw new Error("AI returned invalid JSON format.");
        }

      } catch (error) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        if (error.name === 'AbortError') {
          console.error(`[AI Timeout] Duration: >15000ms | Request timed out`);
        } else {
          console.error(`[AI Exception] Duration: ${duration}ms | ${error.message}`);
        }

        if (attempt === maxAttempts) {
          return {
            success: false,
            stage: "AI Provider",
            error: error.name === 'AbortError' ? "Request timed out after 15s" : error.message,
            details: `Model: ${model}, Type: ${type}`
          };
        }
      }
    }
  }
}

export const aiProvider = new AIProvider();
