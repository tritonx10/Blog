import { useState } from 'react';
import { Send, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CommentSection({ comments = [], onSubmit, onDelete }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_token') === 'admin_authenticated';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    setLoading(true);
    await onSubmit({ name, text });
    setText('');
    setName('');
    setLoading(false);
  };

  return (
    <div className="mt-16 pt-12 border-t border-parchment-dark">
      <h3 className="font-heading text-2xl text-ink mb-8 flex items-center gap-3">
        Reader Thoughts <span className="text-sm px-2 py-1 bg-parchment-dark text-brown rounded-full font-sans">{comments.length}</span>
      </h3>
      
      <form onSubmit={handleSubmit} className="mb-12 bg-white/50 p-6 rounded-2xl border border-parchment-dark shadow-sm">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Your Name (Optional)"
            className="form-input w-full md:w-1/3 bg-transparent border-b-2 border-parchment-dark focus:border-gold rounded-none px-0 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="relative">
          <textarea
            placeholder="Leave a thoughtful review or comment..."
            className="form-input w-full min-h-[100px] resize-y bg-transparent"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !text.trim()}
            className="absolute bottom-3 right-3 p-2 bg-ink text-gold rounded-xl hover:bg-gold hover:text-ink transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-brown-light italic py-8">No thoughts penned yet. Be the first to leave a mark.</p>
        ) : (
          comments.map((comment, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={comment._id || idx} 
              className="p-5 rounded-2xl bg-white/40 border border-parchment-dark/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gold/20 text-gold-dark flex items-center justify-center">
                  <User size={16} />
                </div>
                <div>
                  <h4 className="font-sans font-medium text-ink">{comment.name || 'Anonymous Reader'}</h4>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-brown-lighter font-sans">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    {isAdmin && onDelete && (
                      <button 
                        onClick={() => onDelete(comment._id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <p className="font-body text-brown leading-relaxed pl-11">{comment.text}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
