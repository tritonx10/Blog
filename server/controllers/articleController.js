const db = require('../lib/db');
const slugify = require('slugify');

const COLLECTION = 'articles';

exports.getAllArticles = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 9 } = req.query;
    let articles = await db.find(COLLECTION);

    // Filtering
    if (category) articles = articles.filter(a => a.category === category);
    if (status) articles = articles.filter(a => a.status === status);
    if (search) {
      const regex = new RegExp(search, 'i');
      articles = articles.filter(a => regex.test(a.title) || regex.test(a.excerpt));
    }

    // Sort
    articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = articles.length;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + parseInt(limit));

    res.json({ 
      articles: paginatedArticles, 
      total, 
      pages: Math.ceil(total / limit), 
      currentPage: parseInt(page) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const article = await db.findOne(COLLECTION, a => a.slug === req.params.slug);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, excerpt, body, category, tags, coverImage, readTime, status } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    
    // Simple word count calculation from HTML
    const wordCount = body ? body.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    
    const article = await db.create(COLLECTION, { 
      title, slug, excerpt, body, category, tags, coverImage, readTime, wordCount, status 
    });
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { title, body, ...rest } = req.body;
    const updateData = { ...rest };
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (body) {
      updateData.body = body;
      updateData.wordCount = body.replace(/<[^>]*>/g, '').split(/\s+/).length;
    }
    const updated = await db.update(COLLECTION, req.params.id, updateData);
    if (!updated) return res.status(404).json({ message: 'Article not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const success = await db.delete(COLLECTION, req.params.id);
    if (!success) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const item = await db.findById(COLLECTION, req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    
    if (!item.comments) item.comments = [];
    const newComment = {
      _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      name: name?.trim() || 'Reader',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    
    item.comments.push(newComment);
    const updated = await db.update(COLLECTION, req.params.id, { comments: item.comments });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const item = await db.findById(COLLECTION, req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    
    if (!item.comments) return res.status(404).json({ message: 'No comments' });
    
    item.comments = item.comments.filter(c => c._id !== req.params.commentId);
    const updated = await db.update(COLLECTION, req.params.id, { comments: item.comments });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

