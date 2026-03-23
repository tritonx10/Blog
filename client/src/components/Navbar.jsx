import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/blog', label: 'Blog' },
    { to: '/articles', label: 'Articles' },
    { to: '/books', label: 'Books' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-parchment/90 backdrop-blur-md border-b border-parchment-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <BookOpen size={22} className="text-gold group-hover:text-gold-dark transition-colors" />
          <span className="font-heading text-xl font-semibold text-ink tracking-wide">
            Suhani Gupta
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-gold bg-gold/10'
                    : 'text-brown hover:text-gold hover:bg-gold/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-brown"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-parchment-dark bg-parchment px-4 py-3 flex flex-col gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-4 py-2.5 rounded-lg font-sans text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-gold bg-gold/10'
                    : 'text-brown hover:text-gold hover:bg-gold/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
