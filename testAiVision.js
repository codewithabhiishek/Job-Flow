import { aiProvider } from './api/aiProvider.js';

async function test() {
  try {
    console.log("Testing screenshot extraction...");
    // A tiny 1x1 transparent PNG
    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const result = await aiProvider.invokeLLM(base64Image, "screenshot");
    console.log("Result:", result);
  } catch (err) {
    console.error("Test script failed:", err);
  }
}

test();
