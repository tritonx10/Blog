require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');

const app = express();

// Database Connection
const MONGO_URI = process.env.MONGO_URI;
let lastDbError = null;

if (process.env.VERCEL && !MONGO_URI) {
  lastDbError = "Missing 'MONGO_URI' in Vercel. Please add it to your project environment variables.";
}

if (!lastDbError) {
  mongoose.connect(MONGO_URI || 'mongodb://localhost:27017/suhani_literary', {
    serverSelectionTimeoutMS: 3000,
  })
    .then(() => {
      console.log('🍃 MongoDB connected successfully');
      lastDbError = null;
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err);
      lastDbError = err.message;
    });
}

const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1 && !req.path.includes('health')) {
    return res.status(503).json({ 
      message: 'Database connection failed.',
      error: lastDbError || 'Connection in progress...',
      suggestion: 'Please check your MONGO_URI and ensure Atlas IP whitelist is set to 0.0.0.0/0'
    });
  }
  next();
};

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/posts', checkDbConnection, require('./routes/posts'));
app.use('/api/articles', checkDbConnection, require('./routes/articles'));
app.use('/api/books', checkDbConnection, require('./routes/books'));

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
  res.json({ status: 'ok', message: 'Suhani\'s Literary API is running 🕯️ (MongoDB Mode)' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🕯️ Server running on http://localhost:${PORT}`);
  console.log('📦 Data storage: MongoDB Atlas');
});
