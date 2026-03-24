import { Link } from 'react-router-dom';
import { BookOpen, ExternalLink } from 'lucide-react';

export default function BookCard({ book }) {
  return (
    <Link to={`/books/${book.slug}`} className="group block card h-full">
      {/* Cover */}
      <div className="relative h-64 overflow-hidden bg-parchment-dark">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brown/10 to-gold/10">
            <BookOpen size={40} className="text-gold/50" />
            <span className="font-heading text-sm text-brown-lighter px-4 text-center">{book.title}</span>
          </div>
        )}
        {book.featured && (
          <span className="badge absolute top-3 left-3 bg-gold text-white">
            ✦ Featured
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg text-ink group-hover:text-gold transition-colors duration-200 leading-snug">
            {book.title}
          </h3>
          {book.externalLink && (
            <ExternalLink size={16} className="text-brown-lighter flex-shrink-0 mt-0.5" />
          )}
        </div>
        <p className="font-sans text-xs text-gold font-medium tracking-wide uppercase">
          {book.genre} {book.year ? `· ${book.year}` : ''}
        </p>
        <p className="font-body text-brown-lighter text-sm leading-relaxed line-clamp-3">
          {book.synopsis}
        </p>
      </div>
    </Link>
  );
}
