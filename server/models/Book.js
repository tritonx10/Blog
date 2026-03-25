const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, default: 0 }
});

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  synopsis: { type: String, required: true },
  coverImage: { type: String, default: '' },
  genre: { type: String, default: 'Fiction' },
  year: { type: Number, default: new Date().getFullYear() },
  chapters: [chapterSchema],
  externalLink: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  comments: [{
    name: { type: String, default: 'Reader' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Book', bookSchema);
