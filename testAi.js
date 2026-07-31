import { aiProvider } from './api/aiProvider.js';

async function test() {
  try {
    console.log("Testing text extraction...");
    const result = await aiProvider.invokeLLM("Looking for a Senior Frontend Engineer at Google. $150k - $200k. Remote. Must know React.", "text");
    console.log("Result:", result);
  } catch (err) {
    console.error("Test script failed:", err);
  }
}

test();
