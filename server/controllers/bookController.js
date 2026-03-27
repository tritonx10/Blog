const Book = require('../models/Book');
const slugify = require('slugify');
const storage = require('../lib/storage');

exports.getAllBooks = async (req, res) => {
  try {
    const { genre, status, search, page = 1, limit = 8 } = req.query;

    if (req.isLocalMode) {
      const books = await storage.getBooks({ genre, status, search });
      return res.json({ 
        books: books.slice((page - 1) * limit, page * limit), 
        total: books.length, 
        pages: Math.ceil(books.length / limit), 
        currentPage: parseInt(page) 
      });
    }

    const query = {};
    
    if (genre) query.genre = genre;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { synopsis: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query)
      .select('-chapters -comments')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Book.countDocuments(query);

    res.json({ 
      books, 
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
    if (req.isLocalMode) {
      const book = await storage.getBookBySlug(req.params.slug);
      if (!book) return res.status(404).json({ message: 'Book not found' });
      return res.json(book);
    }
    const book = await Book.findOne({ slug: req.params.slug });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookChapters = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book.chapters || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, synopsis, genre, year, coverImage, status, chapters, featured, externalLink } = req.body;
    
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!synopsis?.trim()) return res.status(400).json({ message: 'Synopsis is required' });

    if (req.isLocalMode) {
      const book = await storage.createBook({ 
        title, synopsis, genre, year, coverImage, status, chapters, featured, externalLink 
      });
      return res.status(201).json(book);
    }

    const slug = slugify(title, { lower: true, strict: true });
    const book = await Book.create({ 
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

    if (req.isLocalMode) {
      const updated = await storage.updateBook(req.params.id, { title, ...rest });
      return res.json(updated);
    }

    const updateData = { ...rest };
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    
    const updated = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Book not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    if (req.isLocalMode) {
      await storage.deleteBook(req.params.id);
      return res.json({ message: 'Book deleted locally' });
    }
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    if (req.isLocalMode) {
      const updated = await storage.addComment('books', req.params.id, { name: name?.trim() || 'Reader', text: text.trim() });
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json(updated);
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Not found' });
    
    book.comments.push({
      name: name?.trim() || 'Reader',
      text: text.trim()
    });
    
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    if (req.isLocalMode) {
      const updated = await storage.deleteComment('books', req.params.id, req.params.commentId);
      if (!updated) return res.status(404).json({ message: 'Not found' });
      return res.json(updated);
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Not found' });
    
    book.comments.pull({ _id: req.params.commentId });
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

