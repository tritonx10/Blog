const db = require('../lib/db');
const slugify = require('slugify');

const COLLECTION = 'posts';

exports.getAllPosts = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 9 } = req.query;
    let posts = await db.find(COLLECTION);

    // Filtering
    if (category) posts = posts.filter(p => p.category === category);
    if (status) posts = posts.filter(p => p.status === status);
    if (search) {
      const regex = new RegExp(search, 'i');
      posts = posts.filter(p => regex.test(p.title) || regex.test(p.excerpt));
    }

    // Sort by Date Desc
    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = posts.length;
    const startIndex = (page - 1) * limit;
    const paginatedPosts = posts.slice(startIndex, startIndex + parseInt(limit));

    res.json({ 
      posts: paginatedPosts, 
      total, 
      pages: Math.ceil(total / limit), 
      currentPage: parseInt(page) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPostBySlug = async (req, res) => {
  try {
    const post = await db.findOne(COLLECTION, p => p.slug === req.params.slug);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, excerpt, body, category, tags, coverImage, readTime, status } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    const post = await db.create(COLLECTION, { 
      title, slug, excerpt, body, category, tags, coverImage, readTime, status 
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, ...rest } = req.body;
    const updateData = { ...rest };
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    const updated = await db.update(COLLECTION, req.params.id, updateData);
    if (!updated) return res.status(404).json({ message: 'Post not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const success = await db.delete(COLLECTION, req.params.id);
    if (!success) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const post = await db.findById(COLLECTION, req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    
    if (!post.comments) post.comments = [];
    const newComment = {
      _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      name: name?.trim() || 'Reader',
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    
    post.comments.push(newComment);
    const updated = await db.update(COLLECTION, req.params.id, { comments: post.comments });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await db.findById(COLLECTION, req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    
    if (!post.comments) return res.status(404).json({ message: 'No comments' });
    
    post.comments = post.comments.filter(c => c._id !== req.params.commentId);
    const updated = await db.update(COLLECTION, req.params.id, { comments: post.comments });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
