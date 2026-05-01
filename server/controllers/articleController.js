const slugify = require('slugify');
const supabase = require('../lib/supabase');

exports.getAllArticles = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 9 } = req.query;

    let query = supabase.from('articles').select('id, title, slug, excerpt, category, tags, cover_image, word_count, read_time, status, created_at', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: articles, count, error } = await query;

    if (error) throw error;

    const mappedArticles = articles.map(a => ({
      _id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      category: a.category,
      tags: a.tags,
      coverImage: a.cover_image,
      wordCount: a.word_count,
      readTime: a.read_time,
      status: a.status,
      createdAt: a.created_at
    }));

    res.json({ 
      articles: mappedArticles, 
      total: count, 
      pages: Math.ceil(count / limit), 
      currentPage: parseInt(page) 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getArticleBySlug = async (req, res) => {
  try {
    const { data, error } = await supabase.from('articles').select('*').eq('slug', req.params.slug).single();
    if (error || !data) return res.status(404).json({ message: 'Article not found' });
    
    const article = {
      _id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      category: data.category,
      tags: data.tags,
      coverImage: data.cover_image,
      wordCount: data.word_count,
      readTime: data.read_time,
      status: data.status,
      comments: data.comments,
      createdAt: data.created_at
    };
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, excerpt, body, category, tags, coverImage, readTime, status } = req.body;

    const cleanText = body ? body.replace(/<[^>]*>/g, '') : '';
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
    let finalExcerpt = excerpt || (cleanText ? cleanText.split(/\s+/).slice(0, 25).join(' ') + '...' : 'A new exploration...');
    const finalReadTime = readTime || Math.max(1, Math.ceil(wordCount / 200));

    const slug = slugify(title, { lower: true, strict: true });
    
    const { data, error } = await supabase.from('articles').insert([{
      title, slug, excerpt: finalExcerpt, body, category, tags, cover_image: coverImage, word_count: wordCount, read_time: finalReadTime, status
    }]).select().single();

    if (error) throw error;
    
    res.status(201).json({
      _id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      category: data.category,
      tags: data.tags,
      coverImage: data.cover_image,
      wordCount: data.word_count,
      readTime: data.read_time,
      status: data.status,
      comments: data.comments,
      createdAt: data.created_at
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const { title, body, excerpt, coverImage, readTime, status, tags, category } = req.body;

    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (body !== undefined) {
      updateData.body = body;
      const cleanText = body.replace(/<[^>]*>/g, '');
      const wordCount = cleanText.split(/\s+/).length;
      updateData.word_count = wordCount;
      updateData.read_time = Math.max(1, Math.ceil(wordCount / 200));
      if (!excerpt && !req.body.excerpt) {
        updateData.excerpt = cleanText.split(/\s+/).slice(0, 25).join(' ') + '...';
      }
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImage !== undefined) updateData.cover_image = coverImage;
    if (readTime !== undefined) updateData.read_time = readTime;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;

    const { data, error } = await supabase.from('articles').update(updateData).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Article not found' });
    
    res.json({
      _id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      category: data.category,
      tags: data.tags,
      coverImage: data.cover_image,
      wordCount: data.word_count,
      readTime: data.read_time,
      status: data.status,
      comments: data.comments,
      createdAt: data.created_at
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const { error } = await supabase.from('articles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const { data: article, error: fetchError } = await supabase.from('articles').select('comments').eq('id', req.params.id).single();
    if (fetchError || !article) return res.status(404).json({ message: 'Not found' });

    const comments = article.comments || [];
    comments.push({
      _id: Date.now().toString(),
      name: name?.trim() || 'Reader',
      text: text.trim(),
      createdAt: new Date().toISOString()
    });

    const { data, error } = await supabase.from('articles').update({ comments }).eq('id', req.params.id).select().single();
    if (error) throw error;

    res.json({ _id: data.id, comments: data.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { data: article, error: fetchError } = await supabase.from('articles').select('comments').eq('id', req.params.id).single();
    if (fetchError || !article) return res.status(404).json({ message: 'Not found' });

    const comments = (article.comments || []).filter(c => c._id !== req.params.commentId);

    const { data, error } = await supabase.from('articles').update({ comments }).eq('id', req.params.id).select().single();
    if (error) throw error;

    res.json({ _id: data.id, comments: data.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
