const Post = require('../models/Post');
const slugify = require('slugify');

exports.getAllPosts = async (req, res) => {
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

    const posts = await Post.find(query)
      .select('-body -comments')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({ 
      posts, 
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
    const post = await Post.findOne({ slug: req.params.slug });
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
    
    // Auto-generate excerpt if missing
    let finalExcerpt = excerpt;
    if (!finalExcerpt && body) {
      finalExcerpt = body.replace(/<[^>]*>/g, '').split(/\s+/).slice(0, 25).join(' ') + '...';
    }

    // Auto-calculate readTime if missing
    let finalReadTime = readTime;
    if (!finalReadTime && body) {
      const words = body.replace(/<[^>]*>/g, '').split(/\s+/).length;
      finalReadTime = Math.max(1, Math.ceil(words / 200));
    }

    const post = await Post.create({ 
      title, slug, excerpt: finalExcerpt || 'A new story...', body, category, tags, coverImage, readTime: finalReadTime || 5, status 
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, body, excerpt, ...rest } = req.body;
    const updateData = { ...rest };
    
    if (title) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }

    if (body) {
      updateData.body = body;
      // Auto-calculate readTime
      const words = body.replace(/<[^>]*>/g, '').split(/\s+/).length;
      updateData.readTime = Math.max(1, Math.ceil(words / 200));
      
      // Auto-generate excerpt if still empty
      if (!excerpt && !rest.excerpt) {
        updateData.excerpt = body.replace(/<[^>]*>/g, '').split(/\s+/).slice(0, 25).join(' ') + '...';
      }
    }
    
    if (excerpt) updateData.excerpt = excerpt;
    
    const updated = await Post.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updated) return res.status(404).json({ message: 'Post not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { name, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    
    post.comments.push({
      name: name?.trim() || 'Reader',
      text: text.trim()
    });
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Not found' });
    
    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
