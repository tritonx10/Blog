import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, LayoutDashboard, FileText, BookOpen, Plus, 
  Trash2, Edit3, Save, X, Eye, EyeOff, LogOut, Check, AlertCircle 
} from 'lucide-react';
import { 
  adminLogin, getPosts, getArticles, getBooks, 
  createPost, updatePost, deletePost,
  createArticle, updateArticle, deleteArticle,
  createBook, updateBook, deleteBook
} from '../lib/api';
import TipTapEditor from '../components/TipTapEditor';
import { Spinner } from '../components/Loader';

const TABS = [
  { id: 'posts', label: 'Blog Posts', icon: <FileText size={18} /> },
  { id: 'articles', label: 'Articles', icon: <FileText size={18} className="text-sage-dark" /> },
  { id: 'books', label: 'Books', icon: <BookOpen size={18} className="text-gold" /> },
];

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // ── Auth ──────────────────────────────────────────────
  async function handleLogin(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await adminLogin(email, password);
      if (res.data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', res.data.token);
      }
    } catch (err) {
      setLoginError('Invalid password. Try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token === 'admin_authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  }

  // ── Data ──────────────────────────────────────────────
  async function fetchData() {
    setItemsLoading(true);
    try {
      let res;
      if (activeTab === 'posts') res = await getPosts({ limit: 100 });
      else if (activeTab === 'articles') res = await getArticles({ limit: 100 });
      else if (activeTab === 'books') res = await getBooks({ limit: 100 });
      
      const data = res.data.posts || res.data.articles || res.data.books || [];
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items');
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, activeTab]);

  // ── CRUD Ops ──────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'posts') await deletePost(id);
      else if (activeTab === 'articles') await deleteArticle(id);
      else if (activeTab === 'books') await deleteBook(id);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  }

  function handleAdd() {
    setEditingItem({
      title: '', excerpt: '', synopsis: '', body: '', content: '',
      category: activeTab === 'posts' ? 'Reflections' : (activeTab === 'articles' ? 'Literary' : ''),
      genre: activeTab === 'books' ? 'Fiction' : '',
      status: 'Draft', coverImage: '', readTime: 5, year: new Date().getFullYear(),
      tags: [], featured: false, chapters: []
    });
    setIsFormOpen(true);
  }

  function handleEdit(item) {
    setEditingItem({ ...item });
    setIsFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setFormMsg({ type: '', text: '' });
    try {
      const isUpdate = !!editingItem._id;
      let res;
      
      if (activeTab === 'posts') {
        res = isUpdate ? await updatePost(editingItem._id, editingItem) : await createPost(editingItem);
      } else if (activeTab === 'articles') {
        res = isUpdate ? await updateArticle(editingItem._id, editingItem) : await createArticle(editingItem);
      } else if (activeTab === 'books') {
        res = isUpdate ? await updateBook(editingItem._id, editingItem) : await createBook(editingItem);
      }

      setFormMsg({ type: 'success', text: `Successfully ${isUpdate ? 'updated' : 'created'}!` });
      setTimeout(() => {
        setIsFormOpen(false);
        fetchData();
      }, 1500);
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || 'Save failed' });
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────
  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md card p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-gold" />
        </div>
        <h1 className="font-heading text-3xl text-ink mb-2">Admin Gate</h1>
        <p className="font-body text-brown-lighter mb-8 italic">Please enter the secret candle-light passphrase.</p>
        
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-sans font-medium text-brown-lighter uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-parchment-dark/30 border border-parchment-dark rounded-xl focus:outline-none focus:border-gold transition-colors font-sans text-brown"
              placeholder="suhanig724@gmail.com"
              disabled={loading}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-sans font-medium text-brown-lighter uppercase tracking-wider mb-2">Passphrase</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-parchment-dark/30 border border-parchment-dark rounded-xl focus:outline-none focus:border-gold transition-colors font-sans text-brown"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          {loginError && <p className="text-red-500 text-sm italic">{loginError}</p>}
          <button type="submit" className="btn-gold w-full mt-2 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Enter Sanctuary'}
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutDashboard size={20} className="text-gold" />
            <h1 className="font-heading text-4xl text-ink">Dashboard</h1>
          </div>
          <p className="font-body text-brown-lighter italic">Managing your literary world.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleAdd} className="btn-gold flex items-center gap-2">
            <Plus size={18} /> New {activeTab === 'books' ? 'Book' : (activeTab === 'articles' ? 'Article' : 'Post')}
          </button>
          <button onClick={handleLogout} className="btn-outline text-brown hover:border-brown hover:bg-brown hover:text-white flex items-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-sans text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-ink text-white shadow-warm'
                : 'bg-parchment-dark/50 text-brown hover:bg-parchment-dark'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {itemsLoading ? (
        <div className="py-24"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item._id} className="card p-5 flex flex-col gap-4 border border-parchment-dark">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-heading text-lg text-ink line-clamp-2">{item.title}</h3>
                <span className={`badge ${item.status === 'Published' ? 'bg-sage/20 text-sage-dark' : 'bg-gold/15 text-gold-dark'}`}>
                  {item.status}
                </span>
              </div>
              <p className="font-body text-brown-lighter text-sm line-clamp-3 italic">
                {item.excerpt || item.synopsis || 'No summary provided.'}
              </p>
              <div className="mt-auto pt-4 flex items-center justify-end gap-2 border-t border-parchment-dark">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-brown-lighter hover:text-gold transition-colors"
                  title="Edit"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2 text-brown-lighter hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
                {/* View link could go here */}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 py-20 text-center text-brown-lighter font-body italic border-2 border-dashed border-parchment-dark rounded-2xl">
              No items here yet. Light your first candle.
            </div>
          )}
        </div>
      )}

      {/* Form Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brown/40 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-4xl bg-parchment rounded-2xl shadow-warm-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <form onSubmit={handleSave} className="flex flex-col h-full">
                {/* Header */}
                <div className="px-8 py-5 border-b border-parchment-dark flex items-center justify-between sticky top-0 bg-parchment z-10">
                  <h2 className="font-heading text-2xl text-ink">
                    {editingItem._id ? 'Edit' : 'Create New'} {activeTab === 'books' ? 'Book' : (activeTab === 'articles' ? 'Article' : 'Post')}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={loading} className="btn-gold flex items-center gap-2">
                       {loading ? <Spinner size="sm" /> : <><Save size={18} /> Save Changes</>}
                    </button>
                    <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 text-brown-lighter hover:text-ink">
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {formMsg.text && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${formMsg.type === 'success' ? 'bg-sage/10 text-sage-dark' : 'bg-red-500/10 text-red-500'}`}>
                      {formMsg.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                      <span className="font-sans text-sm font-medium">{formMsg.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          required
                          value={editingItem.title}
                          onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                          className="form-input"
                          placeholder="Untitled Masterpiece"
                        />
                      </div>

                      {activeTab !== 'books' ? (
                        <div>
                          <label className="form-label">Excerpt (Summary)</label>
                          <textarea
                            rows={3}
                            value={editingItem.excerpt}
                            onChange={(e) => setEditingItem({ ...editingItem, excerpt: e.target.value })}
                            className="form-input"
                            placeholder="A brief taste of the journey..."
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="form-label">Synopsis</label>
                          <textarea
                            rows={3}
                            value={editingItem.synopsis}
                            onChange={(e) => setEditingItem({ ...editingItem, synopsis: e.target.value })}
                            className="form-input"
                            placeholder="The complete arc of the story..."
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {activeTab === 'posts' && (
                          <div>
                            <label className="form-label">Category</label>
                            <select
                              value={editingItem.category}
                              onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                              className="form-input"
                            >
                              <option>Poetry</option>
                              <option>Reflections</option>
                              <option>Stories</option>
                              <option>Reviews</option>
                            </select>
                          </div>
                        )}
                        {activeTab === 'articles' && (
                          <div>
                            <label className="form-label">Category</label>
                            <select
                              value={editingItem.category}
                              onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                              className="form-input"
                            >
                              <option>Literary</option>
                              <option>Opinion</option>
                              <option>Culture</option>
                              <option>Essays</option>
                            </select>
                          </div>
                        )}
                        {activeTab === 'books' && (
                          <div>
                            <label className="form-label">Genre</label>
                            <input
                              type="text"
                              value={editingItem.genre}
                              onChange={(e) => setEditingItem({ ...editingItem, genre: e.target.value })}
                              className="form-input"
                              placeholder="Fiction / Mythology"
                            />
                          </div>
                        )}
                        <div>
                          <label className="form-label">Status</label>
                          <select
                            value={editingItem.status}
                            onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                            className="form-input"
                          >
                            <option>Draft</option>
                            <option>Published</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                       <div>
                        <label className="form-label">Cover Image URL</label>
                        <input
                          type="text"
                          value={editingItem.coverImage}
                          onChange={(e) => setEditingItem({ ...editingItem, coverImage: e.target.value })}
                          className="form-input"
                          placeholder="https://images.unsplash.com/..."
                        />
                        {editingItem.coverImage && (
                          <img src={editingItem.coverImage} className="mt-3 w-full h-32 object-cover rounded-lg border border-parchment-dark" alt="Preview" />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {activeTab !== 'books' ? (
                          <div>
                            <label className="form-label">Read Time (min)</label>
                            <input
                              type="number"
                              value={editingItem.readTime}
                              onChange={(e) => setEditingItem({ ...editingItem, readTime: parseInt(e.target.value) })}
                              className="form-input"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="form-label">Year</label>
                            <input
                              type="number"
                              value={editingItem.year}
                              onChange={(e) => setEditingItem({ ...editingItem, year: parseInt(e.target.value) })}
                              className="form-input"
                            />
                          </div>
                        )}
                        {activeTab === 'books' && (
                          <div className="flex items-end pb-3">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={editingItem.featured}
                                onChange={(e) => setEditingItem({ ...editingItem, featured: e.target.checked })}
                                className="w-5 h-5 rounded border-parchment-dark text-gold focus:ring-gold"
                              />
                              <span className="font-sans text-sm font-medium text-brown-lighter group-hover:text-gold transition-colors">Featured Book</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {activeTab === 'books' && (
                        <div>
                          <label className="form-label">External Buy/Read Link</label>
                          <input
                            type="text"
                            value={editingItem.externalLink}
                            onChange={(e) => setEditingItem({ ...editingItem, externalLink: e.target.value })}
                            className="form-input"
                            placeholder="Amazon / GoodReads URL"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Editor (for Posts/Articles) */}
                  {activeTab !== 'books' && (
                    <div>
                      <label className="form-label">Body Content</label>
                      <TipTapEditor
                        content={editingItem.body}
                        onChange={(html) => setEditingItem({ ...editingItem, body: html })}
                      />
                    </div>
                  )}

                  {/* Chapters Editor (for Books) */}
                  {activeTab === 'books' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <label className="form-label mb-0">Book Chapters</label>
                        <button
                          type="button"
                          onClick={() => setEditingItem({
                            ...editingItem,
                            chapters: [...(editingItem.chapters || []), { title: 'Untitled Chapter', content: '', order: (editingItem.chapters?.length || 0) + 1 }]
                          })}
                          className="text-xs font-sans font-medium text-gold hover:text-gold-dark flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Chapter
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {(editingItem.chapters || []).map((chap, i) => (
                          <div key={i} className="p-5 border border-parchment-dark rounded-xl bg-white space-y-4">
                            <div className="flex items-center gap-4">
                              <span className="font-sans text-xs text-gold-dark font-medium">{i + 1}</span>
                              <input
                                type="text"
                                value={chap.title}
                                onChange={(e) => {
                                  const newChaps = [...editingItem.chapters];
                                  newChaps[i].title = e.target.value;
                                  setEditingItem({ ...editingItem, chapters: newChaps });
                                }}
                                className="flex-1 font-sans text-sm border-none focus:ring-0 p-0 text-ink placeholder-brown-lighter font-medium"
                                placeholder="Chapter Title"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newChaps = editingItem.chapters.filter((_, idx) => idx !== i);
                                  setEditingItem({ ...editingItem, chapters: newChaps });
                                }}
                                className="text-brown-lighter hover:text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <TipTapEditor
                              content={chap.content}
                              onChange={(html) => {
                                const newChaps = [...editingItem.chapters];
                                newChaps[i].content = html;
                                setEditingItem({ ...editingItem, chapters: newChaps });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .form-label {
          display: block;
          text-xs;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          color: #8B6A50;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #FAF6EF;
          border-width: 1px;
          border-color: #F0E9DC;
          border-radius: 0.75rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: #3B2A1A;
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 200ms;
        }
        .form-input:focus {
          outline: none;
          border-color: #C9A84C;
        }
      `}</style>
    </div>
  );
}
