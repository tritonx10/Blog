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

  // --- Post Operations ---
  async getPosts(query = {}) {
    let posts = await this._readAll('posts');
    // Basic filtering
    if (query.category) posts = posts.filter(p => p.category === query.category);
    if (query.status) posts = posts.filter(p => p.status === query.status);
    if (query.search) {
      const s = query.search.toLowerCase();
      posts = posts.filter(p => p.title.toLowerCase().includes(s) || p.excerpt.toLowerCase().includes(s));
    }
    return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async createPost(data) {
    const id = Date.now().toString();
    const post = { 
      _id: id, 
      ...data, 
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

  // --- Article Operations ---
  async getArticles(query = {}) {
    let articles = await this._readAll('articles');
    if (query.category) articles = articles.filter(a => a.category === query.category);
    if (query.status) articles = articles.filter(a => a.status === query.status);
    return articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async createArticle(data) {
    const id = Date.now().toString();
    const article = { _id: id, ...data, createdAt: new Date().toISOString() };
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

  async createBook(data) {
    const id = Date.now().toString();
    const book = { 
      _id: id, 
      ...data, 
      createdAt: new Date().toISOString(),
      slug: slugify(data.title, { lower: true, strict: true })
    };
    await fs.writeFile(path.join(this.baseDir, 'books', `${id}.json`), JSON.stringify(book, null, 2));
    return book;
  }

  async updateBook(id, data) {
    const filePath = path.join(this.baseDir, 'books', `${id}.json`);
    const book = { ...JSON.parse(await fs.readFile(filePath, 'utf8')), ...data };
    if (data.title) book.slug = slugify(data.title, { lower: true, strict: true });
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
    return book;
  }

  async deleteBook(id) {
    await fs.unlink(path.join(this.baseDir, 'books', `${id}.json`));
    return { message: 'Deleted' };
  }
}

const isVercel = process.env.VERCEL === '1';
const baseDataDir = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');

const storage = new StorageManager(baseDataDir);
module.exports = storage;
