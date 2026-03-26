const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  excerpt: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, default: 'Essay' },
  tags: [{ type: String }],
  coverImage: { type: String, default: '' },
  wordCount: { type: Number, default: 0 },
  readTime: { type: Number, default: 10 },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  createdAt: { type: Date, default: Date.now },
  comments: [{
    name: { type: String, default: 'Reader' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

articleSchema.index({ status: 1, createdAt: -1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Article', articleSchema);
