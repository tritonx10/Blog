const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

class Storage {
  constructor() {
    this.isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    this.baseDir = this.isVercel ? '/tmp/data' : path.join(__dirname, '../data');
    this.isLocalMode = false;
  }

  init() {
    try {
      const dirs = ['', 'posts', 'articles', 'books'];
      dirs.forEach(d => {
        const p = path.join(this.baseDir, d);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      });
      console.log('📦 Hybrid storage initialized at:', this.baseDir);
    } catch (err) {
      console.error('❌ Failed to init storage:', err.message);
    }
  }

  setLocalMode(val) { this.isLocalMode = val; }

  // --- Core CRUD ---
  _getById(type, id) {
    try {
      const p = path.join(this.baseDir, type, `${id}.json`);
      if (!fs.existsSync(p)) return null;
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) { return null; }
  }

  _save(type, id, data) {
    try {
      const dir = path.join(this.baseDir, type);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const p = path.join(dir, `${id}.json`);
      fs.writeFileSync(p, JSON.stringify(data, null, 2));
    } catch (e) { console.error(`Failed to save ${type}:`, e.message); }
  }

  _getAll(type) {
    try {
      const dir = path.join(this.baseDir, type);
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
          catch(e) { return null; }
        })
        .filter(Boolean)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) { return []; }
  }

  _delete(type, id) {
    try {
      const p = path.join(this.baseDir, type, `${id}.json`);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {}
  }

  // --- Exposed Methods ---
  async getPosts() { return this._getAll('posts'); }
  async createPost(data) {
    const id = Date.now().toString();
    const post = { _id: id, ...data, createdAt: new Date().toISOString(), slug: slugify(data.title, { lower: true, strict: true }) };
    this._save('posts', id, post);
    return post;
  }
  async getPostBySlug(slug) {
    return this._getAll('posts').find(p => p.slug === slug);
  }
  async updatePost(id, data) {
    const p = this._getById('posts', id);
    if (!p) return null;
    const upd = { ...p, ...data };
    if (data.title) upd.slug = slugify(data.title, { lower: true, strict: true });
    this._save('posts', id, upd);
    return upd;
  }
  async deletePost(id) { this._delete('posts', id); return { message: 'Deleted' }; }

  // Articles
  async getArticles() { return this._getAll('articles'); }
  async createArticle(data) {
    const id = Date.now().toString();
    const art = { _id: id, ...data, createdAt: new Date().toISOString(), slug: slugify(data.title, { lower: true, strict: true }) };
    this._save('articles', id, art);
    return art;
  }
  async getArticleBySlug(slug) {
    return this._getAll('articles').find(a => a.slug === slug);
  }
  async updateArticle(id, data) {
    const a = this._getById('articles', id);
    if (!a) return null;
    const upd = { ...a, ...data };
    if (data.title) upd.slug = slugify(data.title, { lower: true, strict: true });
    this._save('articles', id, upd);
    return upd;
  }
  async deleteArticle(id) { this._delete('articles', id); return { message: 'Deleted' }; }

  // Books
  async getBooks() { return this._getAll('books'); }
  async getBookBySlug(slug) { return this._getAll('books').find(b => b.slug === slug); }
  async createBook(data) {
    const id = Date.now().toString();
    const b = { _id: id, ...data, createdAt: new Date().toISOString(), slug: slugify(data.title, { lower: true, strict: true }) };
    this._save('books', id, b);
    return b;
  }
  async updateBook(id, data) {
    const b = this._getById('books', id);
    if (!b) return null;
    const upd = { ...b, ...data };
    if (data.title) upd.slug = slugify(data.title, { lower: true, strict: true });
    this._save('books', id, upd);
    return upd;
  }
  async deleteBook(id) { this._delete('books', id); return { message: 'Deleted' }; }

  // Comments
  async addComment(type, id, comment) {
    const item = this._getById(type, id);
    if (!item) return null;
    if (!item.comments) item.comments = [];
    item.comments.push({ _id: Date.now().toString(), ...comment, createdAt: new Date().toISOString() });
    this._save(type, id, item);
    return item;
  }
  async deleteComment(type, id, commentId) {
    const item = this._getById(type, id);
    if (!item || !item.comments) return null;
    item.comments = item.comments.filter(c => c._id !== commentId);
    this._save(type, id, item);
    return item;
  }

  // --- SYNC ENGINE ---
  async syncToAtlas(Post, Article, Book) {
    try {
      const posts = this._getAll('posts');
      for (const p of posts) {
        const existing = await Post.findOne({ _id: p._id }).catch(() => null);
        if (!existing) {
          console.log(`Syncing post: ${p.title}`);
          await Post.create(p).catch(() => null);
        }
        this._delete('posts', p._id);
      }

      const articles = this._getAll('articles');
      for (const a of articles) {
        const existing = await Article.findOne({ _id: a._id }).catch(() => null);
        if (!existing) {
          console.log(`Syncing article: ${a.title}`);
          await Article.create(a).catch(() => null);
        }
        this._delete('articles', a._id);
      }

      const books = this._getAll('books');
      for (const b of books) {
        const existing = await Book.findOne({ _id: b._id }).catch(() => null);
        if (!existing) {
          console.log(`Syncing book: ${b.title}`);
          await Book.create(b).catch(() => null);
        }
        this._delete('books', b._id);
      }
    } catch (e) {
      console.error('Sync failed:', e.message);
    }
  }
}

module.exports = new Storage();
