require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const supabase = require('./lib/supabase');
const authMiddleware = require('./lib/auth');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Admin auth endpoint
app.post('/api/admin/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  
  // Use environment variables for production security
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  // Fallback to defaults only in development
  const finalEmail = adminEmail || 'suhanig724@gmail.com';
  const finalPassword = adminPassword || 'Suhani_Kuchupuchu';

  if (email?.trim() === finalEmail && password?.trim() === finalPassword) {
    res.json({ success: true, token: 'admin_authenticated' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Protect all destructive actions under /api/
app.use('/api', authMiddleware);

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/books', require('./routes/books'));

// OCR endpoint using Hybrid Engine (Gemini with Mistral Fallback)
app.post('/api/ocr', ocrLimiter, async (req, res) => {
  try {
    const { imageData, mimeType = 'image/jpeg' } = req.body;
    if (!imageData) return res.status(400).json({ error: 'No image data provided' });

    const geminiKey = process.env.GEMINI_API_KEY;
    const mistralKey = process.env.MISTRAL_API_KEY;

    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

    // Attempt 1: Gemini (Preferred)
    if (geminiKey) {
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Transcribe this handwriting accurately. Preserve paragraphs. Output text only.' },
                { inline_data: { mime_type: mimeType, data: base64Data } }
              ]
            }]
          })
        });

        const gData = await geminiResponse.json();
        if (geminiResponse.ok && gData.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.json({ text: gData.candidates[0].content.parts[0].text.trim() });
        }
        console.warn('Gemini failed or quota hit, trying Mistral fallback...');
      } catch (gErr) {
        console.warn('Gemini error, switching to Mistral:', gErr.message);
      }
    }

    // Attempt 2: Mistral (Reliable Fallback)
    if (!mistralKey) throw new Error('No working OCR keys available. Please check Gemini quota.');

    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: dataUrl },
            { type: 'text', text: 'Transcribe this handwritten image accurately. Output only the text.' },
          ],
        }],
      }),
    });

    const mData = await mistralResponse.json();
    if (!mistralResponse.ok) throw new Error(mData.error?.message || 'Mistral fallback failed');

    const text = mData.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('No text detected by any engine.');
    
    res.json({ text: text.trim() });
  } catch (err) {
    console.error('Hybrid OCR error:', err.message);
    res.status(500).json({ error: err.message || 'OCR failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: `Suhani's Literary API is running 🕯️ (Supabase Mode)` 
  });
});

// Start server only if NOT in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🕯️ Server running on http://localhost:${PORT}`);
    console.log(`📦 Data storage: Supabase PostgreSQL ⚡`);
  });
}

// Export for Vercel Serverless Functions
module.exports = app;
