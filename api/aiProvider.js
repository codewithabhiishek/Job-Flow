import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

export class AIProvider {
  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || ''; 
  }

  async invokeLLM(payload, type) {
    console.log("Invoking MiniMax via NVIDIA with type:", type);
    
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
      model: type === "screenshot" ? "meta/llama-3.2-90b-vision-instruct" : "minimaxai/minimax-m3",
      messages: messages,
      temperature: 0.1,
      top_p: 0.95,
      max_tokens: 1024,
      stream: false
    };

    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("NVIDIA API Error:", err);
        throw new Error("Failed to extract data via AI.");
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Try to parse the JSON output from the model
      try {
        const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(cleaned);
      } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", content);
        throw new Error("AI returned invalid JSON format.");
      }

    } catch (error) {
      console.error(error);
      throw new Error("AI provider error.");
    }
  }
}

export const aiProvider = new AIProvider();
