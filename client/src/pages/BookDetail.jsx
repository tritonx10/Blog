import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getBookBySlug, addBookComment, deleteBookComment } from '../lib/api';
import { Spinner } from '../components/Loader';
import CommentSection from '../components/CommentSection';
import { ArrowLeft, BookOpen, Share2, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function BookDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);

  useEffect(() => {
    getBookBySlug(slug)
      .then((res) => setBook(res.data))
      .catch(() => setError('Book not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddComment = async (data) => {
    try {
      const res = await addBookComment(book._id, data);
      setBook(res.data);
    } catch (err) {
      alert('Failed to post comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await deleteBookComment(book._id, commentId);
      setBook(res.data);
    } catch (err) {
      alert('Failed to delete comment.');
    }
  };

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: book.title, text: book.synopsis, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return <Spinner />;
  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="font-body text-brown-lighter italic text-lg">{error}</p>
      <button onClick={() => navigate('/books')} className="btn-gold mt-6">← Back to Books</button>
    </div>
  );

  const sortedChapters = [...(book.chapters || [])].sort((a, b) => a.order - b.order);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full"
    >
      {/* Back */}
      <button
        onClick={() => navigate('/books')}
        className="flex items-center gap-2 text-brown-lighter hover:text-gold transition-colors mb-10 font-sans text-sm"
      >
        <ArrowLeft size={16} /> Back to Books
      </button>

      {/* Hero */}
      <div className="flex flex-col md:flex-row gap-10 mb-14">
        {/* Cover */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div className="w-52 h-72 rounded-xl overflow-hidden shadow-warm-lg bg-parchment-dark">
            {book.coverImage ? (
              <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center flex-col gap-3 bg-gradient-to-br from-brown/10 to-gold/10">
                <BookOpen size={40} className="text-gold/50" />
                <span className="font-heading text-sm text-brown-lighter text-center px-4">{book.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-4">
          <div>
            <p className="font-sans text-xs text-gold tracking-widest uppercase mb-2">
              {book.genre}{book.year ? ` · ${book.year}` : ''}
            </p>
            <h1 className="font-heading text-4xl md:text-5xl text-ink leading-tight">{book.title}</h1>
          </div>

          <p className="font-body text-brown leading-relaxed text-lg">{book.synopsis}</p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-2">
            {book.externalLink && (
              <a
                href={book.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold flex items-center gap-2"
              >
                <ExternalLink size={15} /> Read / Buy
              </a>
            )}
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-sm font-medium transition-all duration-200 ${
                copied ? 'bg-sage/20 text-sage-dark' : 'btn-outline'
              }`}
            >
              {copied ? <><Check size={15} /> Copied!</> : <><Share2 size={15} /> Share</>}
            </button>
          </div>
        </div>
      </div>

      {/* Chapters */}
      {sortedChapters.length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-parchment-dark" />
            <h2 className="font-heading text-2xl text-ink">Chapters</h2>
            <div className="flex-1 h-px bg-parchment-dark" />
          </div>

          <div className="flex flex-col gap-3">
            {sortedChapters.map((chapter, i) => (
              <div
                key={chapter._id || i}
                className="card border border-parchment-dark"
              >
                <button
                  onClick={() => setExpandedChapter(expandedChapter === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-sans text-xs text-gold font-medium">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-heading text-lg text-ink">{chapter.title}</span>
                  </div>
                  {expandedChapter === i ? (
                    <ChevronUp size={18} className="text-brown-lighter flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-brown-lighter flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedChapter === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-6 pb-6 prose-literary text-base"
                        dangerouslySetInnerHTML={{ __html: chapter.content }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      <CommentSection comments={book.comments} onSubmit={handleAddComment} onDelete={handleDeleteComment} />
    </motion.div>
  );
}
