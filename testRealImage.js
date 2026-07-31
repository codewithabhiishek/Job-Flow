import { aiProvider } from './api/aiProvider.js';
import fetch from 'node-fetch'; // wait, node-fetch isn't installed. We'll use built-in fetch.

async function test() {
  try {
    console.log("Fetching a sample job description image...");
    // Just create a canvas and draw some text if we were in browser, 
    // but in node we can use an image url and convert it to base64.
    // Or we can just pass an image URL? The payload expects base64.
    
    // Let's use a public placeholder image with some text
    const res = await fetch("https://dummyimage.com/600x400/000/fff&text=Software+Engineer+Intern+at+Google.+Requires+React+and+Node.js.+Remote.");
    const buffer = await res.arrayBuffer();
    const base64Image = "data:image/png;base64," + Buffer.from(buffer).toString('base64');
    
    console.log("Sending payload of size:", base64Image.length);
    const result = await aiProvider.invokeLLM(base64Image, "screenshot");
    console.log("Parsed Result:", result);
  } catch (err) {
    console.error("Test script failed:", err);
  }
}

test();
