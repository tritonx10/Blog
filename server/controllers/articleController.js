const Article = require('../models/Article');
const slugify = require('slugify');

exports.getAllArticles = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 9 } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(query);

    res.json({ 
      articles, 
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
    const article = await Article.findOne({ slug: req.params.slug });
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
    
    const article = await Article.create({ 
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
    
    const updated = await Article.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updated) return res.status(404).json({ message: 'Article not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const deleted = await Article.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Not found' });
    
    article.comments.push({
      name: name?.trim() || 'Reader',
      text: text.trim()
    });
    
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Not found' });
    
    article.comments.pull({ _id: req.params.commentId });
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

