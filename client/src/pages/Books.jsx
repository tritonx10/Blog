import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getBooks } from '../lib/api';
import BookCard from '../components/BookCard';
import { GridSkeleton } from '../components/Loader';
import { BookOpen } from 'lucide-react';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    getBooks({ status: 'Published', page, limit: 12 })
      .then((res) => {
        setBooks(res.data.books);
        setTotalPages(res.data.pages);
      })
      .finally(() => setLoading(false));
  }, [page]);

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
          <div className="w-10 h-10 rounded-full bg-brown/10 flex items-center justify-center">
            <BookOpen size={18} className="text-brown-light" />
          </div>
        </div>
        <h1 className="font-heading text-5xl text-ink mb-3">Books & Writings</h1>
        <p className="font-body text-brown-lighter italic text-lg">
          Longer works, collected stories, and full manuscripts
        </p>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : books.length === 0 ? (
        <div className="py-24 text-center text-brown-lighter font-body italic">
          No books published yet — check back soon!
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
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
