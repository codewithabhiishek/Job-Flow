import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { jobs } from './schema.js';
import { eq, desc } from 'drizzle-orm';
import { aiProvider } from './aiProvider.js';
import { demoJobs } from '../src/data/demoJobs.js';

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware placeholder (In production, use Clerk Express middleware)
const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = userId;
  next();
};

const HAS_DB = !!process.env.DATABASE_URL;

// In-Memory fallback for Demo Mode
let mockJobs = demoJobs.map(job => ({ ...job, user_id: 'user_demo_123' }));
let nextId = 116;

app.get('/api/jobs', requireAuth, async (req, res) => {
  if (!HAS_DB) {
    const userJobs = mockJobs.filter(j => j.user_id === req.userId).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return res.json(userJobs);
  }
  try {
    const allJobs = await db.select().from(jobs).where(eq(jobs.user_id, req.userId)).orderBy(desc(jobs.created_date));
    res.json(allJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', requireAuth, async (req, res) => {
  if (!HAS_DB) {
    const newJob = { id: nextId++, user_id: req.userId, created_date: new Date().toISOString(), ...req.body };
    mockJobs.push(newJob);
    return res.json(newJob);
  }
  try {
    const newJob = await db.insert(jobs).values({ ...req.body, user_id: req.userId }).returning();
    res.json(newJob[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', requireAuth, async (req, res) => {
  if (!HAS_DB) {
    const idx = mockJobs.findIndex(j => j.id == req.params.id && j.user_id === req.userId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockJobs[idx] = { ...mockJobs[idx], ...req.body };
    return res.json(mockJobs[idx]);
  }
  try {
    const updatedJob = await db.update(jobs)
      .set(req.body)
      .where(eq(jobs.id, req.params.id))
      .returning();
    res.json(updatedJob[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/jobs/:id', requireAuth, async (req, res) => {
  if (!HAS_DB) {
    mockJobs = mockJobs.filter(j => !(j.id == req.params.id && j.user_id === req.userId));
    return res.json({ success: true });
  }
  try {
    await db.delete(jobs).where(eq(jobs.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/invoke', requireAuth, async (req, res) => {
  if (!HAS_DB) {
    return res.json({
      company: "Fake AI Extracted Company",
      job_title: "Mock AI Role",
      salary: "$150k",
      skills: ["Mock", "AI", "Data"],
      remote: true,
      status: "saved"
    });
  }
  try {
    const { prompt, systemPrompt } = req.body;
    const result = await aiProvider.invokeLLM(prompt, systemPrompt);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', requireAuth, async (req, res) => {
  // Placeholder for file upload
  res.json({ file_url: 'https://example.com/dummy.png' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} ${!HAS_DB ? '(IN-MEMORY DEMO MODE)' : ''}`);
});
