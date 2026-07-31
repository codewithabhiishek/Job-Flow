import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

export class AIProvider {
  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || ''; 
  }

  async invokeLLM(prompt, type) {
    console.log("Invoking MiniMax via NVIDIA with type:", type);
    
    let systemMessage = `You are an expert AI recruiter assistant. Extract the job details from the provided text into a strict JSON object. 
If the text does not contain a specific field, leave it null. Do not hallucinate.

Required JSON format:
{
  "company": "Company Name",
  "job_title": "Role Name",
  "location": "Location Name (City, State/Country or Remote)",
  "salary": "Salary string exactly as it appears or formatted (e.g. ₹24 LPA)",
  "skills": ["Skill 1", "Skill 2"]
}`;

    const payload = {
      model: "minimaxai/minimax-m3",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: `Extract details from this ${type}: \n\n${prompt}` }
      ],
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
        body: JSON.stringify(payload)
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
