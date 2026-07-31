import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { aiProvider } from './api/aiProvider.js';

const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/api/ai/invoke', async (req, res) => {
  try {
    const { method, payload } = req.body;
    let result;
    if (method === "text") {
      result = await aiProvider.invokeLLM(payload, "text");
    }
    res.json(result);
  } catch (error) {
    res.json({
      success: false,
      stage: "Server Processing",
      error: error.message,
      details: "An unexpected server error occurred."
    });
  }
});

app.listen(3002, () => console.log('Test server ready'));
