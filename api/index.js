import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db } from './db.js';
import { jobs } from './schema.js';
import { eq, desc } from 'drizzle-orm';
import { aiProvider } from './aiProvider.js';
import { clerkMiddleware, requireAuth } from '@clerk/express';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Clerk auth middleware
app.use(clerkMiddleware({
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

// All API routes are protected
app.use('/api', requireAuth());

app.get('/api/jobs', async (req, res) => {
  try {
    const allJobs = await db.select().from(jobs).where(eq(jobs.user_id, req.auth.userId)).orderBy(desc(jobs.created_date));
    res.json(allJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const newJob = await db.insert(jobs).values({ ...req.body, user_id: req.auth.userId }).returning();
    res.json(newJob[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    // First ensure the job belongs to this user
    const existing = await db.select().from(jobs).where(eq(jobs.id, req.params.id));
    if (existing.length === 0 || existing[0].user_id !== req.auth.userId) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }
    const updatedJob = await db.update(jobs)
      .set(req.body)
      .where(eq(jobs.id, req.params.id))
      .returning();
    res.json(updatedJob[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const existing = await db.select().from(jobs).where(eq(jobs.id, req.params.id));
    if (existing.length === 0 || existing[0].user_id !== req.auth.userId) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }
    await db.delete(jobs).where(eq(jobs.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import * as cheerio from 'cheerio';

app.post('/api/ai/invoke', async (req, res) => {
  try {
    const { method, payload } = req.body;
    let result;

    if (method === "url") {
      try {
        const response = await fetch(payload);
        if (!response.ok) throw new Error("Failed to fetch job URL");
        const html = await response.text();
        const $ = cheerio.load(html);
        $('script, style, noscript, iframe, img, svg, head').remove();
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        result = await aiProvider.invokeLLM(text, "url");
      } catch (fetchErr) {
        return res.json({
          success: false,
          stage: "URL Fetch",
          error: fetchErr.message,
          details: `Failed to scrape URL: ${payload}`
        });
      }
    } else if (method === "screenshot") {
      result = await aiProvider.invokeLLM(payload, "screenshot");
    } else if (method === "text") {
      result = await aiProvider.invokeLLM(payload, "text");
    } else {
      return res.json({
        success: false,
        stage: "Request Validation",
        error: "Invalid extraction method",
        details: `Method provided: ${method}`
      });
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

// Global error handler to catch all Express errors (e.g. from clerkMiddleware) and return JSON
app.use((err, req, res, next) => {
  console.error('[Express Global Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
