import dotenv from 'dotenv';
dotenv.config();

export class AIProvider {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'minimax';
    this.apiKey = process.env.MINIMAX_API_KEY || ''; // Generic API key
  }

  async invokeLLM(prompt, systemPrompt) {
    if (this.provider === 'minimax') {
      return this.invokeMinimax(prompt, systemPrompt);
    }
    if (this.provider === 'gemini') {
      return this.invokeGemini(prompt, systemPrompt);
    }
    throw new Error(`Unsupported AI provider: ${this.provider}`);
  }

  async invokeMinimax(prompt, systemPrompt) {
    console.log("Invoking Minimax with prompt:", prompt);
    return { company: "Mock Company", job_title: "Mock Job", location: "Remote", salary: "$100k-$150k", skills: ["React", "Node"] };
  }

  async invokeGemini(prompt, systemPrompt) {
    console.log("Invoking Gemini with prompt:", prompt);
    return { company: "Mock Company", job_title: "Mock Job", location: "Remote", salary: "$100k-$150k", skills: ["React", "Node"] };
  }
}

export const aiProvider = new AIProvider();
