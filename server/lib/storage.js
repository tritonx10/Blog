const fs = require('fs').promises;
const path = require('path');
const slugify = require('slugify');

class StorageManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.isLocalMode = false;
  }

  async init() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      // Create subdirectories for each model
      await fs.mkdir(path.join(this.baseDir, 'posts'), { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'articles'), { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'books'), { recursive: true });
      console.log('📦 Local storage initialized at:', this.baseDir);
    } catch (err) {
      console.error('❌ Failed to initialize local storage:', err.message);
    }
  }

  setLocalMode(val) {
    this.isLocalMode = val;
    if (val) console.log('⚠️ SERVER RUNNING IN LOCAL STORAGE MODE');
  }

  // Helper to read all items from a folder
  async _readAll(collection) {
    const dir = path.join(this.baseDir, collection);
    const files = await fs.readdir(dir);
    const items = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(dir, file), 'utf8');
        items.push(JSON.parse(content));
      }
    }
    return items;
  }

  // Helper to find a specific item by slug
  async _getBySlug(collection, slug) {
    const items = await this._readAll(collection);
    return items.find(i => i.slug === slug);
  }

  // Helper to find a specific item by id
  async _getById(collection, id) {
    try {
      const content = await fs.readFile(path.join(this.baseDir, collection, `${id}.json`), 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // --- Post Operations ---
  async getPosts(query = {}) {
    let posts = await this._readAll('posts');
    if (query.category) posts = posts.filter(p => p.category === query.category);
    if (query.status) posts = posts.filter(p => p.status === query.status);
    if (query.search) {
      const s = query.search.toLowerCase();
      posts = posts.filter(p => p.title.toLowerCase().includes(s) || p.excerpt.toLowerCase().includes(s));
    }
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getPostBySlug(slug) {
    return this._getBySlug('posts', slug);
  }

  async createPost(data) {
    const id = Date.now().toString();
    const post = { 
      _id: id, 
      ...data, 
      comments: [],
      createdAt: data.createdAt || new Date().toISOString(),
      slug: data.slug || slugify(data.title, { lower: true, strict: true })
    };
    await fs.writeFile(
      path.join(this.baseDir, 'posts', `${id}.json`), 
      JSON.stringify(post, null, 2)
    );
    return post;
  }

  async updatePost(id, data) {
    const filePath = path.join(this.baseDir, 'posts', `${id}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    const post = { ...JSON.parse(content), ...data, updatedAt: new Date().toISOString() };
    if (data.title) post.slug = slugify(data.title, { lower: true, strict: true });
    await fs.writeFile(filePath, JSON.stringify(post, null, 2));
    return post;
  }

  async deletePost(id) {
    await fs.unlink(path.join(this.baseDir, 'posts', `${id}.json`));
    return { message: 'Deleted' };
  }

  async addComment(collection, id, commentData) {
    const item = await this._getById(collection, id);
    if (!item) return null;
    if (!item.comments) item.comments = [];
    item.comments.push({ _id: Date.now().toString(), ...commentData, createdAt: new Date().toISOString() });
    await fs.writeFile(path.join(this.baseDir, collection, `${id}.json`), JSON.stringify(item, null, 2));
    return item;
  }

  async deleteComment(collection, id, commentId) {
    const item = await this._getById(collection, id);
    if (!item || !item.comments) return item;
    item.comments = item.comments.filter(c => c._id !== commentId);
    await fs.writeFile(path.join(this.baseDir, collection, `${id}.json`), JSON.stringify(item, null, 2));
    return item;
  }

  // --- Article Operations ---
  async getArticles(query = {}) {
    let articles = await this._readAll('articles');
    if (query.category) articles = articles.filter(a => a.category === query.category);
    if (query.status) articles = articles.filter(a => a.status === query.status);
    return articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getArticleBySlug(slug) {
    return this._getBySlug('articles', slug);
  }

  async createArticle(data) {
    const id = Date.now().toString();
    const article = { _id: id, ...data, comments: [], createdAt: new Date().toISOString() };
    await fs.writeFile(path.join(this.baseDir, 'articles', `${id}.json`), JSON.stringify(article, null, 2));
    return article;
  }

  async updateArticle(id, data) {
    const filePath = path.join(this.baseDir, 'articles', `${id}.json`);
    const article = { ...JSON.parse(await fs.readFile(filePath, 'utf8')), ...data };
    await fs.writeFile(filePath, JSON.stringify(article, null, 2));
    return article;
  }

  async deleteArticle(id) {
    await fs.unlink(path.join(this.baseDir, 'articles', `${id}.json`));
    return { message: 'Deleted' };
  }

  // --- Book Operations ---
  async getBooks(query = {}) {
    let books = await this._readAll('books');
    if (query.genre) books = books.filter(b => b.genre === query.genre);
    if (query.status) books = books.filter(b => b.status === query.status);
    return books.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getBookBySlug(slug) {
    const books = await this._readAll('books');
    return books.find(b => b.slug === slug);
  }

  async readDir(type) {
    const dir = path.join(this.baseDir, type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    try {
      const files = fs.readdirSync(dir);
      return files.filter(f => f.endsWith('.json')).map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
        } catch (e) { return null; }
      }).filter(Boolean);
    } catch (e) { return []; }
  }

  async readById(type, id) {
    const filePath = path.join(this.baseDir, type, `${id}.json`);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(filePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) { return null; }
  }

  async saveToFile(type, id, data) {
    const filePath = path.join(this.baseDir, type, `${id}.json`);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  async createBook(data) {
    const id = Date.now().toString();
    const book = {
      _id: id,
      ...data,
      createdAt: new Date().toISOString(),
      slug: slugify(data.title, { lower: true, strict: true })
    };
    // Use the new saveToFile helper
    await this.saveToFile('books', id, book);
    return book;
  }

  async updateBook(id, data) {
    const book = await this._getById('books', id);
    if (!book) return null;
    const updatedBook = { ...book, ...data };
    if (data.title) updatedBook.slug = slugify(data.title, { lower: true, strict: true });
    // Use the new saveToFile helper
    await this.saveToFile('books', id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id) {
    // Ensure directory exists before attempting to unlink
    const dir = path.join(this.baseDir, 'books');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await fsPromises.unlink(path.join(dir, `${id}.json`));
    return { message: 'Deleted' };
  }
}

const isVercel = process.env.VERCEL === '1';
const baseDataDir = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');

const storage = new StorageManager(baseDataDir);
module.exports = storage;
