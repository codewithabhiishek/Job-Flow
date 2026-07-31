import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { db } from './db.js';
import { jobs } from './schema.js';
import { eq, desc } from 'drizzle-orm';
import { aiProvider } from './aiProvider.js';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173']
}));
app.use(express.json({ limit: '5mb' }));

// Clerk auth middleware
app.use(clerkMiddleware({
  publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 reqs per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 reqs per user per minute
  keyGenerator: (req) => {
    const auth = getAuth(req);
    return auth?.userId || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'AI Rate limit exceeded, please try again later.' }
});

// All API routes are protected and rate limited
app.use('/api', apiLimiter);
app.use('/api', requireAuth());

// Validation Schemas
const jobSchema = z.object({
  company: z.string().max(255),
  logo: z.string().max(1000).optional().or(z.literal('')),
  job_title: z.string().max(255).optional().or(z.literal('')),
  location: z.string().max(255).optional().or(z.literal('')),
  salary: z.string().max(100).optional().or(z.literal('')),
  employment_type: z.string().max(100).optional().or(z.literal('')),
  experience: z.string().max(100).optional().or(z.literal('')),
  remote: z.boolean().optional(),
  skills: z.array(z.string().max(100)).max(50).optional(),
  job_url: z.string().max(2000).optional().or(z.literal('')),
  deadline: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(10000).optional().or(z.literal('')),
  status: z.string().max(50).optional().or(z.literal('')),
  applied_date: z.string().max(100).optional().or(z.literal('')),
  reply_date: z.string().max(100).optional().or(z.literal('')),
  interview_date: z.string().max(100).optional().or(z.literal('')),
  source: z.string().max(100).optional().or(z.literal(''))
});

app.get('/api/jobs', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const allJobs = await db.select().from(jobs).where(eq(jobs.user_id, userId)).orderBy(desc(jobs.created_date));
    res.json(allJobs);
  } catch (error) {
    console.error("[GET /api/jobs] error", error.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

app.post('/api/jobs', async (req, res) => {
  console.log("---- REQUEST RECEIVED ----");
  console.log("URL:", req.url, "| Method:", req.method);
  
  try {
    const { userId } = getAuth(req);
    console.log("Auth User ID:", userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const validation = jobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: validation.error.errors });
    }

    const rawPayload = {
      ...validation.data,
      remote: validation.data.remote || false,
      skills: validation.data.skills || [],
      user_id: userId
    };

    // Explicitly strip undefined values to prevent Drizzle parameter mismatch bugs
    const dbPayload = Object.fromEntries(
      Object.entries(rawPayload).filter(([_, v]) => v !== undefined)
    );

    console.log("Executing DB Query...");
    const newJob = await db.insert(jobs).values(dbPayload).returning();
    
    res.json(newJob[0]);
  } catch (error) {
    console.error("DB query failed");
    res.status(500).json({ success: false, error: "Database insertion failed" });
  }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // First ensure the job belongs to this user
    const existing = await db.select().from(jobs).where(eq(jobs.id, req.params.id));
    if (existing.length === 0 || existing[0].user_id !== userId) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }
    const validation = jobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: validation.error.errors });
    }

    const dbPayload = Object.fromEntries(
      Object.entries(validation.data).filter(([_, v]) => v !== undefined)
    );

    const updatedJob = await db.update(jobs)
      .set(dbPayload)
      .where(eq(jobs.id, req.params.id))
      .returning();
    res.json(updatedJob[0]);
  } catch (error) {
    console.error("[PUT /api/jobs] error", error.message);
    res.status(500).json({ success: false, error: "Database update failed" });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const existing = await db.select().from(jobs).where(eq(jobs.id, req.params.id));
    if (existing.length === 0 || existing[0].user_id !== userId) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }
    await db.delete(jobs).where(eq(jobs.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/jobs] error", error.message);
    res.status(500).json({ success: false, error: "Database deletion failed" });
  }
});

import { urlExtractor } from './urlExtractor.js';

const aiInvokeSchema = z.object({
  method: z.enum(['url', 'screenshot', 'text']),
  payload: z.string().min(1).max(5000000)
});

app.post('/api/ai/invoke', aiLimiter, async (req, res) => {
  try {
    const validation = aiInvokeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, stage: 'Request Validation', error: 'Invalid input', details: validation.error.errors });
    }
    const { method, payload } = validation.data;
    
    if (method === 'screenshot' && !payload.startsWith('data:image/')) {
      return res.status(400).json({ success: false, stage: 'Request Validation', error: 'Invalid image format', details: 'Payload must be a valid base64 data URI.' });
    }

    let result;

    if (method === "url") {
      try {
        const cleanPayload = await urlExtractor.extract(payload);
        result = await aiProvider.invokeLLM(cleanPayload, "url");
      } catch (fetchErr) {
        // If the extractor rejects it as non-job, return exactly as requested
        if (fetchErr.message === "This URL is not an individual job posting.") {
          return res.json({
            success: false,
            error: fetchErr.message
          });
        }
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
  console.error('[Express Global Error]', process.env.NODE_ENV !== 'production' ? err.message : 'Internal error occurred');
  res.status(err.status || 500).json({
    success: false,
    error: err.status === 413 ? 'Payload Too Large' : 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;
