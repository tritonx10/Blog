const Article = require('../models/Article');
const slugify = require('slugify');
const storage = require('../lib/storage');

exports.getAllArticles = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 9 } = req.query;

    if (req.isLocalMode) {
      const articles = await storage.getArticles({ category, status, search });
      return res.json({ 
        articles: articles.slice((page - 1) * limit, page * limit), 
        total: articles.length, 
        pages: Math.ceil(articles.length / limit), 
        currentPage: parseInt(page) 
      });
    }

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
      .select('-body -comments')
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
    if (req.isLocalMode) {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) return res.status(404).json({ message: 'Article not found' });
      return res.json(article);
    }
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

    // Auto-generate excerpt & readTime
    const cleanText = body ? body.replace(/<[^>]*>/g, '') : '';
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
    let finalExcerpt = excerpt || (cleanText ? cleanText.split(/\s+/).slice(0, 25).join(' ') + '...' : 'A new exploration...');
    const finalReadTime = readTime || Math.max(1, Math.ceil(wordCount / 200));

    if (req.isLocalMode) {
      const article = await storage.createArticle({ 
        title, excerpt: finalExcerpt, body, category, tags, coverImage, readTime: finalReadTime, wordCount, status 
      });
      return res.status(201).json(article);
    }

    const slug = slugify(title, { lower: true, strict: true });
    const article = await Article.create({ 
      title, slug, excerpt: finalExcerpt, body, category, tags, coverImage, readTime: finalReadTime, wordCount, status 
    });
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { title, body, excerpt, ...rest } = req.body;

    if (req.isLocalMode) {
      const updated = await storage.updateArticle(req.params.id, { title, body, excerpt, ...rest });
      return res.json(updated);
    }

    const updateData = { ...rest };
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (body) {
      updateData.body = body;
      const cleanText = body.replace(/<[^>]*>/g, '');
      const wordCount = cleanText.split(/\s+/).length;
      updateData.wordCount = wordCount;
      updateData.readTime = Math.max(1, Math.ceil(wordCount / 200));
      if (!excerpt && !rest.excerpt) {
        updateData.excerpt = cleanText.split(/\s+/).slice(0, 25).join(' ') + '...';
      }
    }
    if (excerpt) updateData.excerpt = excerpt;
    
    const updated = await Article.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Article not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    if (req.isLocalMode) {
      await storage.deleteArticle(req.params.id);
      return res.json({ message: 'Article deleted locally' });
    }
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

    if (req.isLocalMode) {
      const updated = await storage.addComment('articles', req.params.id, { name: name?.trim() || 'Reader', text: text.trim() });
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json(updated);
    }
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
    if (req.isLocalMode) {
      const updated = await storage.deleteComment('articles', req.params.id, req.params.commentId);
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json(updated);
    }
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Not found' });
    
    article.comments.pull({ _id: req.params.commentId });
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

