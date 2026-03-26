import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getArticles } from '../lib/api';
import PostCard from '../components/PostCard';
import { GridSkeleton } from '../components/Loader';
import { Search, FileText } from 'lucide-react';

const CATEGORIES = ['All', 'Literary', 'Opinion', 'Culture', 'Essays'];

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = { status: 'Published', page, limit: 9 };
    if (category !== 'All') params.category = category;
    if (debouncedSearch) params.search = debouncedSearch;
    getArticles(params)
      .then((res) => {
        setArticles(res.data.articles);
        setTotalPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }, [category, debouncedSearch, page]);

  function handleCategory(c) {
    setCategory(c);
    setPage(1);
  }

  function handleSearch(e) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
            <FileText size={18} className="text-sage-dark" />
          </div>
        </div>
        <h1 className="font-heading text-5xl text-ink mb-3">Articles</h1>
        <p className="font-body text-brown-lighter italic text-lg">
          Essays, opinions, and literary explorations
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCategory(c)}
              className={`badge px-4 py-1.5 cursor-pointer transition-all duration-200 ${
                category === c
                  ? 'bg-sage text-white'
                  : 'bg-parchment-dark text-brown hover:bg-sage/15 hover:text-sage-dark'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-lighter" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={handleSearch}
            className="pl-9 pr-4 py-2 border border-parchment-dark rounded-full font-sans text-sm text-brown bg-white placeholder-brown-lighter focus:outline-none focus:border-sage transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <GridSkeleton count={9} />
      ) : articles.length === 0 ? (
        <div className="py-24 text-center text-brown-lighter font-body italic">
          No articles found. Try a different filter.
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {articles.map((article) => (
            <PostCard key={article._id} post={article} type="articles" />
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full font-sans text-sm transition-all ${
                p === page
                  ? 'bg-sage text-white'
                  : 'bg-parchment-dark text-brown hover:bg-sage/15 hover:text-sage-dark'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
