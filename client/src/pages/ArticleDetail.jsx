import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getArticleBySlug, addArticleComment, deleteArticleComment } from '../lib/api';
import { Spinner } from '../components/Loader';
import CommentSection from '../components/CommentSection';
import { ArrowLeft, Clock, Share2, Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ArticleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getArticleBySlug(slug)
      .then((res) => setArticle(res.data))
      .catch(() => setError('Article not found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddComment = async (data) => {
    try {
      const res = await addArticleComment(article._id, data);
      setArticle(res.data);
    } catch (err) {
      alert('Failed to post comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await deleteArticleComment(article._id, commentId);
      setArticle(res.data);
    } catch (err) {
      alert('Failed to delete comment.');
    }
  };

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: article.title, text: article.excerpt, url });
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
      <Link to="/articles" className="btn-gold mt-6 inline-block">← Back to Articles</Link>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-16 w-full"
    >
      <button
        onClick={() => navigate('/articles')}
        className="flex items-center gap-2 text-brown-lighter hover:text-sage-dark transition-colors mb-10 font-sans text-sm"
      >
        <ArrowLeft size={16} /> Back to Articles
      </button>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        {article.category && (
          <span className="badge bg-sage/20 text-sage-dark">{article.category}</span>
        )}
        <div className="flex items-center gap-1.5 text-brown-lighter font-sans text-sm">
          <Calendar size={14} />
          <span>{article.createdAt ? format(new Date(article.createdAt), 'dd MMMM yyyy') : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-brown-lighter font-sans text-sm">
          <Clock size={14} />
          <span>{article.readTime || 5} min read</span>
        </div>
      </div>

      <h1 className="font-heading text-4xl md:text-5xl text-ink leading-tight mb-5">{article.title}</h1>

      {article.excerpt && (
        <p className="font-body text-xl text-brown-lighter italic leading-relaxed mb-8 border-l-4 border-sage pl-5">
          {article.excerpt}
        </p>
      )}

      {article.coverImage && (
        <div className="rounded-2xl overflow-hidden mb-10 shadow-warm bg-parchment-dark">
          <img src={article.coverImage} alt={article.title} className="w-full object-contain max-h-[500px]" />
        </div>
      )}

      {article.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {article.tags.map((t) => (
            <span key={t} className="badge bg-parchment-dark text-brown-lighter text-xs">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mb-10">
        <div className="flex-1 h-px bg-parchment-dark" />
        <span className="text-sage/50 font-heading text-lg">✦</span>
        <div className="flex-1 h-px bg-parchment-dark" />
      </div>

      <div
        className="prose-literary"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />

      <div className="mt-16 pt-8 border-t border-parchment-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="font-body text-brown-lighter italic text-sm">Enjoyed reading? Share it with someone.</p>
        <button
          onClick={handleShare}
          className={`flex items-center gap-2 px-5 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200 ${
            copied ? 'bg-sage/20 text-sage-dark' : 'border border-sage text-sage-dark hover:bg-sage hover:text-white'
          }`}
        >
          {copied ? <><Check size={15} /> Link Copied!</> : <><Share2 size={15} /> Share</>}
        </button>
      </div>

      <CommentSection comments={article.comments} onSubmit={handleAddComment} onDelete={handleDeleteComment} />
    </motion.div>
  );
}
