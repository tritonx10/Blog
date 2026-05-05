const slugify = require('slugify');
const supabase = require('../lib/supabase');

exports.getAllPosts = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 9 } = req.query;

    let query = supabase.from('posts').select('id, title, slug, excerpt, body, category, tags, cover_image, read_time, status, created_at', { count: 'exact' });

    if (category) query = query.eq('category', category);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    const { data: posts, count, error } = await query;

    if (error) throw error;

    const mappedPosts = posts.map(p => ({
      _id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      body: p.body,
      category: p.category,
      tags: p.tags,
      coverImage: p.cover_image,
      readTime: p.read_time,
      status: p.status,
      createdAt: p.created_at
    }));

    res.json({ posts: mappedPosts, total: count, pages: Math.ceil(count / limit), currentPage: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPostBySlug = async (req, res) => {
  try {
    const { data, error } = await supabase.from('posts').select('*').eq('slug', req.params.slug).single();
    if (error || !data) return res.status(404).json({ message: 'Post not found' });
    
    const post = {
      _id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      category: data.category,
      tags: data.tags,
      coverImage: data.cover_image,
      readTime: data.read_time,
      status: data.status,
      comments: data.comments,
      createdAt: data.created_at
    };
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, excerpt, body, category, tags, coverImage, readTime, status } = req.body;
    
    let finalExcerpt = excerpt || (body ? body.replace(/<[^>]*>/g, '').split(/\s+/).slice(0, 25).join(' ') + '...' : 'A new story...');
    const words = body ? body.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    let finalReadTime = readTime || Math.max(1, Math.ceil(words / 200));

    const slug = slugify(title, { lower: true, strict: true });
    
    const { data, error } = await supabase.from('posts').insert([{
      title, slug, excerpt: finalExcerpt, body, category, tags, cover_image: coverImage, read_time: finalReadTime, status
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
      readTime: data.read_time,
      status: data.status,
      comments: data.comments,
      createdAt: data.created_at
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, body, excerpt, coverImage, readTime, status, tags, category } = req.body;

    const updateData = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (body !== undefined) {
      updateData.body = body;
      const words = body.replace(/<[^>]*>/g, '').split(/\s+/).length;
      updateData.read_time = Math.max(1, Math.ceil(words / 200));
      if (!excerpt && !req.body.excerpt) {
        updateData.excerpt = body.replace(/<[^>]*>/g, '').split(/\s+/).slice(0, 25).join(' ') + '...';
      }
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImage !== undefined) updateData.cover_image = coverImage;
    if (readTime !== undefined) updateData.read_time = readTime;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;

    const { data, error } = await supabase.from('posts').update(updateData).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Post not found' });
    
    res.json({
      _id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      category: data.category,
      tags: data.tags,
      coverImage: data.cover_image,
      readTime: data.read_time,
      status: data.status,
      comments: data.comments,
      createdAt: data.created_at
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { error } = await supabase.from('posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const { data: post, error: fetchError } = await supabase.from('posts').select('comments').eq('id', req.params.id).single();
    if (fetchError || !post) return res.status(404).json({ message: 'Not found' });

    const comments = post.comments || [];
    comments.push({
      _id: Date.now().toString(),
      name: name?.trim() || 'Reader',
      text: text.trim(),
      createdAt: new Date().toISOString()
    });

    const { data, error } = await supabase.from('posts').update({ comments }).eq('id', req.params.id).select().single();
    if (error) throw error;

    res.json({ _id: data.id, comments: data.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { data: post, error: fetchError } = await supabase.from('posts').select('comments').eq('id', req.params.id).single();
    if (fetchError || !post) return res.status(404).json({ message: 'Not found' });

    const comments = (post.comments || []).filter(c => c._id !== req.params.commentId);

    const { data, error } = await supabase.from('posts').update({ comments }).eq('id', req.params.id).select().single();
    if (error) throw error;

    res.json({ _id: data.id, comments: data.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
