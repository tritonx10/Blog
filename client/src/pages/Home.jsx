import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPosts, getBooks } from '../lib/api';
import PostCard from '../components/PostCard';
import BookCard from '../components/BookCard';
import { GridSkeleton, Spinner } from '../components/Loader';
import { ArrowRight, Feather, BookOpen } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

export default function Home() {
  const [latestPosts, setLatestPosts] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    getPosts({ status: 'Published', limit: 3 })
      .then((res) => setLatestPosts(res.data.posts))
      .finally(() => setLoadingPosts(false));
    getBooks({ status: 'Published', limit: 6 })
      .then((res) => setFeaturedBooks(res.data.books))
      .finally(() => setLoadingBooks(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* ── Hero ────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-parchment via-parchment-dark/30 to-parchment">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-10 w-64 h-64 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-sage/8 blur-3xl" />
        </div>

        <div className="relative text-center px-6 max-w-3xl mx-auto flex flex-col items-center gap-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center"
          >
            <Feather size={26} className="text-gold" />
          </motion.div>

          <motion.h1
            {...fadeUp}
            className="font-heading text-5xl md:text-7xl text-ink leading-[1.1] tracking-tight"
          >
            Words That Live <br />
            <span className="italic text-gold">Between Pages</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-body text-xl text-brown-lighter leading-relaxed max-w-xl"
          >
            A space for poetry, stories, reflections, and the quiet magic of
            literature. Welcome to my literary corner.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="flex items-center gap-4 flex-wrap justify-center"
          >
            <Link to="/blog" className="btn-gold">Read the Blog</Link>
            <Link to="/books" className="btn-outline">Explore Books</Link>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-brown-lighter/60">
          <span className="font-sans text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="w-px h-8 bg-gradient-to-b from-gold/50 to-transparent"
          />
        </div>
      </section>

      {/* ── Latest Posts ────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <h2 className="section-title">Latest from the Blog</h2>
            <p className="section-subtitle">Fresh words, warm stories</p>
          </div>
          <Link to="/blog" className="hidden sm:flex items-center gap-1.5 text-gold font-sans text-sm hover:gap-2.5 transition-all">
            View all <ArrowRight size={15} />
          </Link>
        </motion.div>

        {loadingPosts ? (
          <GridSkeleton count={3} />
        ) : latestPosts.length === 0 ? (
          <EmptyState icon={<Feather size={32} className="text-gold/40" />} message="No posts yet — check back soon!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post, i) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <PostCard post={post} type="blog" />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-6 sm:hidden text-center">
          <Link to="/blog" className="btn-outline">View all posts</Link>
        </div>
      </section>

      {/* ── Divider ornament ────────────────── */}
      <div className="flex items-center gap-4 px-6 max-w-6xl mx-auto w-full">
        <div className="flex-1 h-px bg-parchment-dark" />
        <span className="text-gold/50 font-heading text-xl">✦</span>
        <div className="flex-1 h-px bg-parchment-dark" />
      </div>

      {/* ── Books ───────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <h2 className="section-title">Books & Writings</h2>
            <p className="section-subtitle">Longer works and collected stories</p>
          </div>
          <Link to="/books" className="hidden sm:flex items-center gap-1.5 text-gold font-sans text-sm hover:gap-2.5 transition-all">
            View all <ArrowRight size={15} />
          </Link>
        </motion.div>

        {loadingBooks ? (
          <GridSkeleton count={3} />
        ) : featuredBooks.length === 0 ? (
          <EmptyState icon={<BookOpen size={32} className="text-gold/40" />} message="No books yet — coming soon!" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBooks.map((book, i) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <BookCard book={book} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-brown-lighter">
      {icon}
      <p className="font-body italic">{message}</p>
    </div>
  );
}
