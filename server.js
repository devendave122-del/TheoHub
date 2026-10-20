import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.set('trust proxy', 1);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.disable('x-powered-by');
app.use(express.json({ limit: '30kb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.static(path.join(__dirname, 'public')));

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(genAI), authConfigured: Boolean(supabase) }));
app.post('/api/theoai', async (req, res) => {
  try {
    if (!genAI) return res.status(503).json({ error: 'AI service is not configured on the server yet.' });
    if (!supabase) return res.status(503).json({ error: 'Account service is not configured on the server yet.' });
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Sign in is required.' });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' });

    const { mode = 'sermon', topic, audience = 'Church congregation', length = 'Medium' } = req.body || {};
    if (typeof topic !== 'string' || topic.trim().length < 3 || topic.length > 5000) return res.status(400).json({ error: 'Enter a topic between 3 and 5,000 characters.' });
    const allowedModes = new Set(['sermon', 'question', 'study']);
    if (!allowedModes.has(mode)) return res.status(400).json({ error: 'Unsupported TheoAI mode.' });
    const system = `You are TheoAI, an assistant for Seventh-day Adventist Bible study and sermon preparation. Be respectful, careful, and transparent. Use Scripture in context. Distinguish explicit biblical text from interpretation and denominational teaching. When discussing SDA positions, identify them as SDA interpretations where appropriate. Never invent quotations, page numbers, article titles, DOI values, or citations. If you cannot verify a source, say so and suggest how to verify it. Provide Bible references as references, not long copyrighted text. Acknowledge differences among Christian traditions when relevant. Encourage the user to consult the biblical text and reliable primary sources. You are not an ordained pastor or a substitute for scholarly review. Avoid claiming certainty where there is disagreement.`;
    const task = mode === 'sermon'
      ? `Create a ${length.toLowerCase()} sermon script/outline for ${audience} on this topic: ${topic}. Include a title, main Bible text, purpose, introduction, 2–4 main points with supporting references, practical applications, conclusion, and a brief appeal. Explain the context of the main passage. Flag any references the user should verify.`
      : mode === 'question'
      ? `Answer this theological question carefully for a Seventh-day Adventist study context: ${topic}. Give a concise answer, relevant Bible passages with contextual explanation, the common SDA understanding if relevant, alternate interpretations if important, and sources or search terms for further verification. Do not invent citations.`
      : `Create a ${length.toLowerCase()} Bible study guide for ${audience} on: ${topic}. Include a key passage, context, learning goals, observation/interpretation/application sections, discussion questions, SDA theological connections where relevant, and a closing application. Mark suggestions for further verification.`;

const result = await genAI.models.generateContent({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  contents: task,
  config: {
    systemInstruction: system,
    maxOutputTokens: length === 'Detailed' ? 3000 : length === 'Short' ? 1000 : 2000
  }
});
    res.json({ text: result.text || 'No text response was returned.' });
  } catch (error) {
    console.error('TheoAI error:', error?.message || error);
    res.status(500).json({ error: 'TheoAI could not complete the request. Please try again later.' });
  }
});

app.get('*splat', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`TheoHub running on http://localhost:${port}`));
