import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, LayoutDashboard, FileText, BookOpen, Plus, 
  Trash2, Edit3, Save, X, Eye, EyeOff, LogOut, Check, AlertCircle, ChevronDown, Upload 
} from 'lucide-react';
import { 
  adminLogin, getPosts, getArticles, getBooks, 
  createPost, updatePost, deletePost, addPostComment, deletePostComment,
  createArticle, updateArticle, deleteArticle, addArticleComment, deleteArticleComment,
  createBook, updateBook, deleteBook, addBookComment, deleteBookComment
} from '../lib/api';
import TipTapEditor from '../components/TipTapEditor';
import { Spinner } from '../components/Loader';
import api from '../lib/api';

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
  const [expandedChapterIndex, setExpandedChapterIndex] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // ── Helpers ──────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check size (limit to 2MB for Base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large. Please use an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingItem(prev => ({ ...prev, coverImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ── Auth ──────────────────────────────────────────────
  async function handleLogin(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await adminLogin(email.trim(), password.trim());
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
      if (activeTab === 'posts') res = await getPosts({ limit: 20 });
      else if (activeTab === 'articles') res = await getArticles({ limit: 20 });
      else if (activeTab === 'books') res = await getBooks({ limit: 20 });
      
      const data = res.data.posts || res.data.articles || res.data.books || [];
      setItems(data);
      // Backend should now ideally return this flag or we can check via health
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
  async function handleDelete(id, confirmed = false) {
    if (!confirmed) {
      setConfirmDialog({ type: 'post', id });
      return;
    }
    
    try {
      if (activeTab === 'posts') await deletePost(id);
      else if (activeTab === 'articles') await deleteArticle(id);
      else if (activeTab === 'books') await deleteBook(id);
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      const apiError = err.response?.data?.error;
      alert(`Delete failed: ${apiError || 'Unknown error'}`);
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
    setFormMsg({ type: '', text: '' });
  }

  function handleEdit(item) {
    setEditingItem({ ...item });
    setIsFormOpen(true);
    setFormMsg({ type: '', text: '' });
  }

  useEffect(() => {
    if (!isFormOpen) {
      setFormMsg({ type: '', text: '' });
      setExpandedChapterIndex(null);
    }
  }, [isFormOpen]);

  async function handleDeleteCommentFromAdmin(commentId, confirmed = false) {
    if (!confirmed) {
      setConfirmDialog({ type: 'comment', id: commentId });
      return;
    }
    try {
      let res;
      if (activeTab === 'posts') res = await deletePostComment(editingItem._id, commentId);
      else if (activeTab === 'articles') res = await deleteArticleComment(editingItem._id, commentId);
      else if (activeTab === 'books') res = await deleteBookComment(editingItem._id, commentId);
      
      setEditingItem(prev => ({ ...prev, comments: res.data.comments }));
    } catch (err) {
      alert('Failed to delete comment.');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setFormMsg({ type: '', text: '' });
    try {
      const isUpdate = !!editingItem._id;
      let res;
      
      const sanitizedItem = { ...editingItem };
      // Strip fields that don't belong to the current model
      if (activeTab === 'posts' || activeTab === 'articles') {
        delete sanitizedItem.synopsis;
        delete sanitizedItem.genre;
        delete sanitizedItem.year;
        delete sanitizedItem.chapters;
        delete sanitizedItem.externalLink;
        delete sanitizedItem.featured;
      } else if (activeTab === 'books') {
        delete sanitizedItem.body;
        delete sanitizedItem.excerpt;
        delete sanitizedItem.readTime;
      }

      if (activeTab === 'posts') {
        res = isUpdate ? await updatePost(editingItem._id, sanitizedItem) : await createPost(sanitizedItem);
      } else if (activeTab === 'articles') {
        res = isUpdate ? await updateArticle(editingItem._id, sanitizedItem) : await createArticle(sanitizedItem);
      } else if (activeTab === 'books') {
        res = isUpdate ? await updateBook(editingItem._id, sanitizedItem) : await createBook(sanitizedItem);
      }

      setFormMsg({ type: 'success', text: `Successfully ${isUpdate ? 'updated' : 'created'}!` });
      setTimeout(() => {
        setIsFormOpen(false);
        fetchData();
      }, 1500);
    } catch (err) {
      console.error('Save error:', err);
      const apiError = err.response?.data?.error;
      const apiMsg = err.response?.data?.message;
      let errorText = 'Save failed. Please check your internet connection and Atlas settings.';
      if (apiMsg) {
         errorText = typeof apiMsg === 'string' ? apiMsg : JSON.stringify(apiMsg);
      } else if (apiError) {
         errorText = typeof apiError === 'string' ? apiError : (apiError.message || JSON.stringify(apiError));
      } else if (err.message) {
         errorText = err.message;
      }

      setFormMsg({ 
        type: 'error', 
        text: errorText 
      });
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
              onChange={(e) => setEmail(e.target.value.trim())}
              className="w-full px-4 py-3 bg-parchment-dark/30 border border-parchment-dark rounded-xl focus:outline-none focus:border-gold transition-colors font-sans text-brown"
              placeholder="admin@example.com"
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
            {loading ? <Spinner size="sm" className="" /> : 'Enter Sanctuary'}
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brown/40 backdrop-blur-sm p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="w-full max-w-4xl bg-parchment rounded-2xl shadow-warm-lg overflow-hidden flex flex-col max-h-[95vh] focus-within:ring-0"
            >
              <form onSubmit={handleSave} className="flex flex-col min-h-0">
                {/* Header */}
                <div className="px-8 py-5 border-b border-parchment-dark flex items-center justify-between sticky top-0 bg-parchment z-10">
                  <h2 className="font-heading text-2xl text-ink">
                    {editingItem._id ? 'Edit' : 'Create New'} {activeTab === 'books' ? 'Book' : (activeTab === 'articles' ? 'Article' : 'Post')}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={loading} className="btn-gold flex items-center gap-2">
                       {loading ? <Spinner size="sm" className="" /> : <><Save size={18} /> Save Changes</>}
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
                            required={activeTab !== 'books'}
                            value={editingItem.excerpt}
                            onChange={(e) => setEditingItem({ ...editingItem, excerpt: e.target.value })}
                            className="form-input"
                            placeholder="A brief taste (auto-generated if left blank)..."
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="form-label">Synopsis</label>
                          <textarea
                            rows={3}
                            value={editingItem.synopsis}
                            required={activeTab === 'books'}
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
                        <label className="form-label">Cover Image</label>
                        <div className="relative group">
                          {editingItem.coverImage ? (
                            <div className="relative rounded-xl overflow-hidden border border-parchment-dark shadow-sm bg-white">
                              <img src={editingItem.coverImage} className="w-full h-48 object-cover" alt="Cover Preview" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <label className="cursor-pointer p-2 bg-white rounded-full text-brown hover:bg-gold hover:text-white transition-colors" title="Change Image">
                                  <Upload size={18} />
                                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                                <button 
                                  type="button" 
                                  onClick={() => setEditingItem(prev => ({ ...prev, coverImage: '' }))}
                                  className="p-2 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                  title="Remove Image"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-parchment-dark rounded-xl bg-parchment/30 hover:bg-parchment/50 hover:border-gold transition-all cursor-pointer group">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold/20 transition-colors">
                                  <Upload size={20} className="text-gold" />
                                </div>
                                <p className="mb-1 text-sm text-brown font-sans font-medium">Upload Cover Image</p>
                                <p className="text-xs text-brown-lighter font-sans italic text-center px-4">JPG, PNG or WEBP (Max 2MB)</p>
                              </div>
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                          )}
                        </div>
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
                          onClick={() => {
                            const newIndex = editingItem.chapters?.length || 0;
                            setEditingItem({
                              ...editingItem,
                              chapters: [...(editingItem.chapters || []), { title: 'Untitled Chapter', content: '', order: newIndex + 1 }]
                            });
                            setExpandedChapterIndex(newIndex);
                          }}
                          className="text-xs font-sans font-medium text-gold hover:text-gold-dark flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Chapter
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {(editingItem.chapters || []).map((chap, i) => {
                          const isExpanded = expandedChapterIndex === i;
                          return (
                            <div key={i} className="border border-parchment-dark rounded-xl bg-white overflow-hidden">
                              <div 
                                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-parchment/50 transition-colors"
                                onClick={() => setExpandedChapterIndex(isExpanded ? null : i)}
                              >
                                <span className="font-sans text-xs text-gold-dark font-medium">{String(i + 1).padStart(2, '0')}</span>
                                <div className="flex-1 font-heading text-lg text-ink">
                                  {chap.title || 'Untitled Chapter'}
                                </div>
                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDialog({ type: 'chapter', index: i })}
                                    className="text-brown-lighter hover:text-red-500 p-2"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className="text-brown-lighter"
                                  >
                                    <ChevronDown size={18} />
                                  </motion.div>
                                </div>
                              </div>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-5 pb-5 border-t border-parchment-dark/50 pt-5"
                                  >
                                    <div className="mb-4">
                                      <label className="form-label">Chapter Title</label>
                                      <input
                                        type="text"
                                        value={chap.title}
                                        onChange={(e) => {
                                          const newChaps = [...editingItem.chapters];
                                          newChaps[i].title = e.target.value;
                                          setEditingItem({ ...editingItem, chapters: newChaps });
                                        }}
                                        className="form-input"
                                        placeholder="Chapter Title"
                                      />
                                    </div>
                                    <div>
                                      <label className="form-label">Chapter Content</label>
                                      <TipTapEditor
                                        content={chap.content}
                                        onChange={(html) => {
                                          const newChaps = [...editingItem.chapters];
                                          newChaps[i].content = html;
                                          setEditingItem({ ...editingItem, chapters: newChaps });
                                        }}
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reader Reviews Management */}
                  {editingItem._id && (
                    <div className="space-y-6 pt-8 border-t border-parchment-dark">
                      <div className="flex items-center justify-between">
                        <label className="form-label mb-0 text-gold-dark">Reader Thoughts ({editingItem.comments?.length || 0})</label>
                      </div>
                      <div className="space-y-3">
                        {(editingItem.comments || []).map((comment, i) => (
                          <div key={comment._id || i} className="flex items-center justify-between p-4 bg-white border border-parchment-dark rounded-xl gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-sans font-medium text-ink">{comment.name || 'Anonymous'}</p>
                                <span className="text-[10px] text-brown-lighter font-sans uppercase tracking-wider">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm font-body text-brown-lighter line-clamp-2 italic">"{comment.text}"</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfirmDialog({ type: 'comment', id: comment._id || comment.id })}
                              className="p-2 text-brown-lighter hover:text-red-500 transition-colors"
                              title="Delete Review"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                        {(editingItem.comments || []).length === 0 && (
                          <p className="text-center py-6 text-brown-lighter italic font-sans text-sm">No reviews for this piece yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brown/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl shadow-warm p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-heading text-2xl text-ink mb-2">Delete this item?</h3>
              <p className="font-sans text-sm text-brown-lighter mb-6">
                This action is permanent and cannot be undone. Are you completely sure?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-5 py-2.5 rounded-full font-sans text-sm font-medium border border-parchment-dark text-brown hover:bg-parchment transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmDialog.type === 'post') {
                      handleDelete(confirmDialog.id, true);
                    } else if (confirmDialog.type === 'comment') {
                      handleDeleteCommentFromAdmin(confirmDialog.id, true);
                    } else if (confirmDialog.type === 'chapter') {
                      const newChaps = editingItem.chapters.filter((_, idx) => idx !== confirmDialog.index);
                      setEditingItem({ ...editingItem, chapters: newChaps });
                      if (expandedChapterIndex === confirmDialog.index) setExpandedChapterIndex(null);
                    }
                    setConfirmDialog(null);
                  }}
                  className="px-5 py-2.5 rounded-full font-sans text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                >
                  Yes, Delete
                </button>
              </div>
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
