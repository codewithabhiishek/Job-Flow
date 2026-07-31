import express from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';

const app = express();
app.use(clerkMiddleware({
  secretKey: 'dummy',
  publishableKey: 'dummy'
}));

app.use('/api', requireAuth());

app.post('/api/jobs', (req, res) => {
  res.json({ userId: req.auth.userId });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

const server = app.listen(3002, async () => {
  try {
    const res = await fetch('http://localhost:3002/api/jobs', { method: 'POST' });
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Fetch err:", err);
  }
  server.close();
});
