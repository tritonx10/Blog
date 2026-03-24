import { Link } from 'react-router-dom';
import { BookOpen, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-parchment-dark bg-parchment-dark/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <BookOpen size={20} className="text-gold" />
          <span className="font-heading text-lg font-semibold text-ink">Suhani Gupta</span>
        </div>

        <div className="flex gap-6 font-sans text-sm text-brown-lighter">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <Link to="/blog" className="hover:text-gold transition-colors">Blog</Link>
          <Link to="/articles" className="hover:text-gold transition-colors">Articles</Link>
          <Link to="/books" className="hover:text-gold transition-colors">Books</Link>
        </div>

        <p className="font-sans text-sm text-brown-lighter flex items-center gap-1.5">
          Made with <Heart size={14} className="text-gold fill-gold" /> · © {new Date().getFullYear()} Suhani Gupta
        </p>
      </div>
    </footer>
  );
}
