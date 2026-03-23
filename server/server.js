require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/posts', require('./routes/posts'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/books', require('./routes/books'));

// Admin auth endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (email?.trim() === adminEmail && password?.trim() === adminPassword) {
    res.json({ success: true, token: 'admin_authenticated' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Suhani\'s Literary API is running 🕯️ (Vercel KV Mode)' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🕯️ Server running on http://localhost:${PORT}`);
  console.log('📦 Data storage: Vercel KV (Redis)');
});
