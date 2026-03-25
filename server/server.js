require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/suhani_literary';
mongoose.connect(mongoURI)
  .then(() => console.log('🍃 Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/books', require('./routes/books'));

// Admin auth endpoint
app.post('/api/admin/login', (req, res) => {
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
app.post('/api/ocr', async (req, res) => {
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
  res.json({ status: 'ok', message: 'Suhani\'s Literary API is running 🕯️ (File Storage Mode)' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🕯️ Server running on http://localhost:${PORT}`);
  console.log('📦 Data storage: Local JSON files (server/data/)');
});
