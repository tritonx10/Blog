const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  excerpt: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, enum: ['Poetry', 'Reflections', 'Stories', 'Reviews'], default: 'Reflections' },
  tags: [{ type: String }],
  coverImage: { type: String, default: '' },
  readTime: { type: Number, default: 5 },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  createdAt: { type: Date, default: Date.now },
  comments: [{
    name: { type: String, default: 'Reader' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
