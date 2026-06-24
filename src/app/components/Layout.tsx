import { Outlet, Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { BedDouble, Compass, Menu, X } from 'lucide-react';
import { WhatsAppButton } from './WhatsAppButton';
import { useState, useEffect } from 'react';

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Inicio', icon: BedDouble },
    { path: '/descubre', label: 'Descubre BCN', icon: Compass },
  ];

  const isHeroPage = location.pathname === '/' || location.pathname === '/descubre';

  return (
    <div className="min-h-screen bg-white">

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || !isHeroPage
            ? 'bg-white border-b border-slate-100 shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="bg-[#E05A2B] p-2.5 rounded-xl">
                  <BedDouble className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className={`text-xl font-bold tracking-tight transition-colors ${
                  scrolled || !isHeroPage ? 'text-slate-900' : 'text-white'
                }`}>
                  BCN Rooms
                </h1>
                <p className={`text-xs transition-colors ${
                  scrolled || !isHeroPage ? 'text-slate-400' : 'text-white/60'
                }`}>
                  Tu hogar en Barcelona
                </p>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className="relative group"
                  >
                    <motion.div
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                        isActive
                          ? scrolled || !isHeroPage
                            ? 'bg-orange-50 text-[#E05A2B]'
                            : 'bg-white/15 text-white'
                          : scrolled || !isHeroPage
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://wa.me/34600000000"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  scrolled || !isHeroPage
                    ? 'bg-[#E05A2B] text-white hover:bg-[#c94e23]'
                    : 'bg-white text-[#E05A2B] hover:bg-white/90'
                }`}
              >
                Contactar
              </a>
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl transition-colors ${
                scrolled || !isHeroPage
                  ? 'hover:bg-slate-100 text-slate-700'
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden py-4 border-t border-slate-100 bg-white"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map(({ path, label, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                        isActive
                          ? 'bg-orange-50 text-[#E05A2B]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 px-4">
                <WhatsAppButton fullWidth />
              </div>
            </motion.div>
          )}
        </div>
      </header>

      <main className="relative">
        <Outlet />
      </main>

      {/* Footer — limpio, oscuro, sin gradients de colores */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#E05A2B] p-2.5 rounded-xl">
                  <BedDouble className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg tracking-tight">BCN Rooms</span>
                  <p className="text-xs text-slate-400">Tu hogar en Barcelona</p>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md text-sm">
                Habitaciones de calidad en los mejores barrios de Barcelona.
                Tu experiencia en la ciudad, sin complicaciones.
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-4 text-sm tracking-wide uppercase text-slate-300">Contacto</h5>
              <div className="space-y-3 text-slate-400 text-sm">
                <p>info@bcnrooms.com</p>
                <p>WhatsApp 24/7</p>
                <p>Barcelona, España</p>
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-4 text-sm tracking-wide uppercase text-slate-300">Barrios</h5>
              <div className="space-y-2 text-slate-400 text-sm">
                <p className="hover:text-[#E05A2B] transition-colors cursor-pointer">Gràcia</p>
                <p className="hover:text-[#E05A2B] transition-colors cursor-pointer">Eixample</p>
                <p className="hover:text-[#E05A2B] transition-colors cursor-pointer">Barceloneta</p>
                <p className="hover:text-[#E05A2B] transition-colors cursor-pointer">El Born</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">&copy; 2024 BCN Rooms. Todos los derechos reservados.</p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-[#E05A2B] transition-colors">Privacidad</a>
              <a href="#" className="hover:text-[#E05A2B] transition-colors">Términos</a>
              <a href="#" className="hover:text-[#E05A2B] transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}