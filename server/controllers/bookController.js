const slugify = require('slugify');
const supabase = require('../lib/supabase');

exports.getAllBooks = async (req, res) => {
  try {
    const { genre, status, search, page = 1, limit = 8 } = req.query;

    let query = supabase.from('books').select('id, title, slug, synopsis, genre, year, cover_image, external_link, chapters, status, featured, created_at', { count: 'exact' });

    if (genre) query = query.eq('genre', genre);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,synopsis.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: books, count, error } = await query;

    if (error) throw error;

    const mappedBooks = books.map(b => ({
      _id: b.id,
      title: b.title,
      slug: b.slug,
      synopsis: b.synopsis,
      genre: b.genre,
      year: b.year,
      coverImage: b.cover_image,
      externalLink: b.external_link,
      chapters: b.chapters,
      status: b.status,
      featured: b.featured,
      createdAt: b.created_at
    }));

    res.json({ 
      books: mappedBooks, 
      total: count, 
      pages: Math.ceil(count / limit), 
      currentPage: parseInt(page) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookBySlug = async (req, res) => {
  try {
    const { data, error } = await supabase.from('books').select('*').eq('slug', req.params.slug).single();
    if (error || !data) return res.status(404).json({ message: 'Book not found' });
    
    const book = {
      _id: data.id,
      title: data.title,
      slug: data.slug,
      synopsis: data.synopsis,
      genre: data.genre,
      year: data.year,
      coverImage: data.cover_image,
      chapters: data.chapters,
      externalLink: data.external_link,
      status: data.status,
      featured: data.featured,
      comments: data.comments,
      createdAt: data.created_at
    };
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBookChapters = async (req, res) => {
  try {
    const { data, error } = await supabase.from('books').select('chapters').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Book not found' });
    res.json(data.chapters || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, synopsis, genre, year, coverImage, status, chapters, featured, externalLink } = req.body;
    
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!synopsis?.trim()) return res.status(400).json({ message: 'Synopsis is required' });

    const slug = slugify(title, { lower: true, strict: true });
    
    const { data, error } = await supabase.from('books').insert([{
      title, slug, synopsis, genre, year, cover_image: coverImage, status, chapters, featured, external_link: externalLink
    }]).select().single();

    if (error) throw error;
    
    res.status(201).json({
      _id: data.id,
      title: data.title,
      slug: data.slug,
      synopsis: data.synopsis,
      genre: data.genre,
      year: data.year,
      coverImage: data.cover_image,
      chapters: data.chapters,
      externalLink: data.external_link,
      status: data.status,
      featured: data.featured,
      comments: data.comments,
      createdAt: data.created_at
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { title, synopsis, genre, year, coverImage, status, chapters, featured, externalLink } = req.body;

    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (synopsis !== undefined) updateData.synopsis = synopsis;
    if (genre !== undefined) updateData.genre = genre;
    if (year !== undefined) updateData.year = year;
    if (coverImage !== undefined) updateData.cover_image = coverImage;
    if (status !== undefined) updateData.status = status;
    if (chapters !== undefined) updateData.chapters = chapters;
    if (featured !== undefined) updateData.featured = featured;
    if (externalLink !== undefined) updateData.external_link = externalLink;

    const { data, error } = await supabase.from('books').update(updateData).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Book not found' });
    
    res.json({
      _id: data.id,
      title: data.title,
      slug: data.slug,
      synopsis: data.synopsis,
      genre: data.genre,
      year: data.year,
      coverImage: data.cover_image,
      chapters: data.chapters,
      externalLink: data.external_link,
      status: data.status,
      featured: data.featured,
      comments: data.comments,
      createdAt: data.created_at
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { error } = await supabase.from('books').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const { data: book, error: fetchError } = await supabase.from('books').select('comments').eq('id', req.params.id).single();
    if (fetchError || !book) return res.status(404).json({ message: 'Not found' });

    const comments = book.comments || [];
    comments.push({
      _id: Date.now().toString(),
      name: name?.trim() || 'Reader',
      text: text.trim(),
      createdAt: new Date().toISOString()
    });

    const { data, error } = await supabase.from('books').update({ comments }).eq('id', req.params.id).select().single();
    if (error) throw error;

    res.json({ _id: data.id, comments: data.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { data: book, error: fetchError } = await supabase.from('books').select('comments').eq('id', req.params.id).single();
    if (fetchError || !book) return res.status(404).json({ message: 'Not found' });

    const comments = (book.comments || []).filter(c => String(c._id || c.id) !== String(req.params.commentId));

    const { data, error } = await supabase.from('books').update({ comments }).eq('id', req.params.id).select().single();
    if (error) throw error;

    res.json({ _id: data.id, comments: data.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
