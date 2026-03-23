const db = require('../lib/db');
const slugify = require('slugify');

const COLLECTION = 'books';

exports.getAllBooks = async (req, res) => {
  try {
    const { genre, status, search, page = 1, limit = 8 } = req.query;
    let books = await db.find(COLLECTION);

    // Filtering
    if (genre) books = books.filter(b => b.genre === genre);
    if (status) books = books.filter(b => b.status === status);
    if (search) {
      const regex = new RegExp(search, 'i');
      books = books.filter(b => regex.test(b.title) || regex.test(b.synopsis));
    }

    // Sort
    books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = books.length;
    const startIndex = (page - 1) * limit;
    const paginatedBooks = books.slice(startIndex, startIndex + parseInt(limit));

    res.json({ 
      books: paginatedBooks, 
      total, 
      pages: Math.ceil(total / limit), 
      currentPage: parseInt(page) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookBySlug = async (req, res) => {
  try {
    const book = await db.findOne(COLLECTION, b => b.slug === req.params.slug);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookChapters = async (req, res) => {
  try {
    const book = await db.findById(COLLECTION, req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book.chapters || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, synopsis, genre, year, coverImage, status, chapters, featured, externalLink } = req.body;
    const slug = slugify(title, { lower: true, strict: true });
    
    const book = await db.create(COLLECTION, { 
      title, slug, synopsis, genre, year, coverImage, status, chapters, featured, externalLink 
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { title, ...rest } = req.body;
    const updateData = { ...rest };
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    const updated = await db.update(COLLECTION, req.params.id, updateData);
    if (!updated) return res.status(404).json({ message: 'Book not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const success = await db.delete(COLLECTION, req.params.id);
    if (!success) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
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

