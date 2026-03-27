require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const storage = require('./lib/storage');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection (Cached for Serverless)
let lastFailureTime = 0;
const FAILURE_RETRY_DELAY = 30 * 1000; // Try again after 30 seconds if it failed
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://tritonx10:Suhani_Atlas_2026@cluster0.tqfdiey.mongodb.net/suhani_literary?retryWrites=true&w=majority';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Initialize Storage (Atlas + Local JSON Fallback)
storage.init();

async function connectToDatabase() {
  const now = Date.now();
  if (now - lastFailureTime < FAILURE_RETRY_DELAY) return null;

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.log('🔗 Connecting to Atlas...');
    const opts = {
      bufferCommands: true, 
      serverSelectionTimeoutMS: 10000, // 10s for cold starts
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 1, // Recommended for Vercel
    };

    cached.promise = mongoose.connect(mongoURI, opts).then((m) => {
      console.log('🍃 Connected to MongoDB Atlas');
      storage.setLocalMode(false);
      lastFailureTime = 0;
      
      // BACKGROUND SYNC (Quietly)
      try {
        const Post = require('./models/Post');
        const Article = require('./models/Article');
        const Book = require('./models/Book');
        storage.syncToAtlas(Post, Article, Book).catch(() => null);
      } catch (e) {}

      return m;
    }).catch((err) => {
      console.error('❌ Atlas connection failed:', err.message);
      lastFailureTime = Date.now();
      cached.promise = null;
      storage.setLocalMode(true);
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    return null;
  }
}

// Eagerly connect
connectToDatabase();

app.use(async (req, res, next) => {
  if (req.path === '/api/admin/login' || req.path === '/api/health') return next();

  const conn = await connectToDatabase();
  // Attach storage mode to request for controllers
  req.isLocalMode = !conn;
  next();
});

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per hour
  message: { error: 'OCR quota reached, please try again later' }
});

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/books', require('./routes/books'));

// Admin auth endpoint
app.post('/api/admin/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'suhanig724@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'Suhani_Kuchupuchu';

  if (email?.trim() === adminEmail && password?.trim() === adminPassword) {
    res.json({ success: true, token: 'admin_authenticated' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// OCR endpoint using Mistral Pixtral Vision (free tier, key stays server-side)
app.post('/api/ocr', ocrLimiter, async (req, res) => {
  try {
    const { imageData, mimeType = 'image/jpeg' } = req.body;
    if (!imageData) return res.status(400).json({ error: 'No image data provided' });

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'MISTRAL_API_KEY not configured on server' });

    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: dataUrl },
            {
              type: 'text',
              text: `You are an expert handwriting transcription assistant.
Transcribe EVERY word visible in this handwritten image as accurately as possible.
Preserve the original paragraph structure — use a blank line between distinct paragraphs or sections.
DO NOT add any commentary, preamble, or explanation.
DO NOT include bullet points unless the handwriting itself uses them.
OUTPUT only the transcribed text, nothing else.`,
            },
          ],
        }],
        max_tokens: 2048,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Mistral OCR failed');
    }

    const text = data?.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('No text detected in the image.');
    res.json({ text });
  } catch (err) {
    console.error('OCR error:', err.message);
    res.status(500).json({ error: err.message || 'OCR failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const isLocal = storage.isLocalMode;
  res.json({ 
    status: 'ok', 
    message: `Suhani's Literary API is running 🕯️ (${isLocal ? 'Local Storage Mode' : 'MongoDB Atlas Mode'})` 
  });
});

// Start server only if NOT in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🕯️ Server running on http://localhost:${PORT}`);
    console.log(`📦 Data storage: ${storage.isLocalMode ? 'Local JSON files (server/data/)' : 'MongoDB Atlas 🍃'}`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
