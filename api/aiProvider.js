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
    
    let systemMessage = `You are an expert AI recruiter assistant. Extract the job details from the provided text or image into a strict JSON object. 
If the text does not contain a specific field, leave it null. Do not hallucinate.

Required JSON format:
{
  "company": "Company Name",
  "job_title": "Role Name",
  "location": "Location Name (City, State/Country or Remote)",
  "salary": "Salary string exactly as it appears or formatted",
  "employment_type": "Full-time, Part-time, Contract, etc.",
  "experience": "Junior, Mid-level, Senior, or specific years",
  "remote": true or false,
  "job_url": "URL if available",
  "deadline": "YYYY-MM-DD or string",
  "skills": ["Skill 1", "Skill 2"]
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
        console.log(`[AI Raw Output] ${content}`);

        try {
          // Extract the JSON object using substring from first '{' to last '}'
          const firstBrace = content.indexOf('{');
          const lastBrace = content.lastIndexOf('}');
          
          if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("No JSON object found in response");
          }
          
          const jsonString = content.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonString);
        } catch (parseError) {
          console.error("[AI Parse Error] Failed to parse JSON from response.", parseError);
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
