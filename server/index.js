import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { jobs } from './schema.js';
import { eq, desc } from 'drizzle-orm';
import { aiProvider } from './aiProvider.js';

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

app.get('/api/jobs', requireAuth, async (req, res) => {
  try {
    const allJobs = await db.select().from(jobs).where(eq(jobs.user_id, req.userId)).orderBy(desc(jobs.created_date));
    res.json(allJobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/jobs', requireAuth, async (req, res) => {
  try {
    const newJob = await db.insert(jobs).values({ ...req.body, user_id: req.userId }).returning();
    res.json(newJob[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/jobs/:id', requireAuth, async (req, res) => {
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
  try {
    await db.delete(jobs).where(eq(jobs.id, req.params.id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/invoke', requireAuth, async (req, res) => {
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
  res.json({ file_url: 'https://example.com/dummy.pdf' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
