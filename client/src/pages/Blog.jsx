import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPosts } from '../lib/api';
import PostCard from '../components/PostCard';
import { GridSkeleton } from '../components/Loader';
import { Search, Feather } from 'lucide-react';

const CATEGORIES = ['All', 'Poetry', 'Reflections', 'Stories', 'Reviews'];

export default function Blog() {
  const [posts, setPosts] = useState([]);
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
    getPosts(params)
      .then((res) => {
        setPosts(res.data.posts);
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
          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center">
            <Feather size={18} className="text-gold" />
          </div>
        </div>
        <h1 className="font-heading text-5xl text-ink mb-3">The Blog</h1>
        <p className="font-body text-brown-lighter italic text-lg">
          Poetry, reflections, stories, and more
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCategory(c)}
              className={`badge px-4 py-1.5 cursor-pointer transition-all duration-200 ${
                category === c
                  ? 'bg-gold text-white'
                  : 'bg-parchment-dark text-brown hover:bg-gold/15 hover:text-gold'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="sm:ml-auto relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-lighter" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={handleSearch}
            className="pl-9 pr-4 py-2 border border-parchment-dark rounded-full font-sans text-sm text-brown bg-white placeholder-brown-lighter focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <GridSkeleton count={9} />
      ) : posts.length === 0 ? (
        <div className="py-24 text-center text-brown-lighter font-body italic">
          No posts found. Try a different filter.
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {posts.map((post) => (
            <PostCard key={post._id} post={post} type="blog" />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full font-sans text-sm transition-all ${
                p === page
                  ? 'bg-gold text-white'
                  : 'bg-parchment-dark text-brown hover:bg-gold/15 hover:text-gold'
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
