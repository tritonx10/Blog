import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORY_COLORS = {
  Poetry: 'bg-sage/20 text-sage-dark',
  Reflections: 'bg-gold/15 text-gold-dark',
  Stories: 'bg-brown/10 text-brown-light',
  Reviews: 'bg-parchment-dark text-brown-lighter',
  Default: 'bg-parchment-dark text-brown-lighter',
};

export default function PostCard({ post, type = 'blog' }) {
  const href = `/${type}/${post.slug}`;
  const color = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Default;

  return (
    <Link to={href} className="group block card h-full">
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden bg-parchment-dark shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]">
        {post.coverImage ? (
          <>
            <img
              src={post.coverImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none"
            />
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-heading text-5xl text-gold/30">✦</span>
          </div>
        )}
        {post.category && (
          <span className={`badge absolute top-3 left-3 ${color}`}>
            {post.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-heading text-xl text-ink group-hover:text-gold transition-colors duration-200 leading-snug line-clamp-2">
          {post.title}
        </h3>
        <p className="font-body text-brown-lighter text-sm leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between text-xs font-sans text-brown-lighter">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{post.readTime || 5} min read</span>
          </div>
          <span>{post.createdAt ? format(new Date(post.createdAt), 'dd MMM yyyy') : ''}</span>
        </div>
      </div>
    </Link>
  );
}
