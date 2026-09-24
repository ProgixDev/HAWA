'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Accueil', href: '#home' },
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Aperçu', href: '#overview' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Captures d’écran', href: '#screenshots' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 70);

    const sections = navLinks.map((l) => l.href.replace('#', ''));
    let current = 'home';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 120) {
        current = id;
      }
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-6"
        role="navigation"
        aria-label="Navigation principale"
      >
        <div
          className={cn(
            'mx-auto flex max-w-[1400px] items-center justify-between rounded-[1.6rem] border px-5 py-3.5 backdrop-blur-2xl transition-all duration-500 sm:px-8',
            scrolled
              ? 'border-white/70 bg-white/[0.88] shadow-[0_12px_40px_rgba(54,19,88,0.14)]'
              : 'border-white/20 bg-[#4B076F]/20 shadow-[0_12px_45px_rgba(35,0,61,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]'
          )}
        >
          {/* Brand */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#home');
            }}
            className="flex items-center"
            aria-label="AWA — retour à l’accueil"
          >
            <span
              className={cn(
                'font-display text-xl font-extrabold tracking-[-0.025em] transition-colors duration-300',
                scrolled ? 'gradient-text' : 'text-white'
              )}
            >
              AWA
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden items-center gap-1.5 lg:flex">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.replace('#', '');
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={cn(
                    'relative rounded-full px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 xl:px-5 xl:text-[15px]',
                    scrolled
                      ? isActive
                        ? 'bg-primary/[0.08] text-primary shadow-[inset_0_0_0_1px_rgba(109,27,198,0.08)]'
                        : 'text-foreground/65 hover:bg-primary/[0.05] hover:text-foreground'
                      : isActive
                        ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                        : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className={cn(
                        'absolute bottom-1.5 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full',
                        scrolled
                          ? 'bg-primary shadow-[0_0_8px_rgba(109,27,198,0.45)]'
                          : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.75)]'
                      )}
                    />
                  )}
                </a>
              );
            })}
          </div>

          {/* CTA + Mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href="#download"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#download');
              }}
              className={cn(
                'hidden items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-200 sm:inline-flex',
                scrolled
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-[0_6px_18px_rgba(109,27,198,0.28)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(109,27,198,0.38)]'
                  : 'border border-white/30 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:-translate-y-0.5 hover:bg-white/20'
              )}
            >
              Télécharger
            </a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                'lg:hidden p-2.5 rounded-full transition-all duration-200',
                scrolled ? 'text-foreground hover:bg-secondary' : 'text-white hover:bg-white/15'
              )}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navigation mobile"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <span className="font-display text-lg font-800 gradient-text">AWA</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary text-foreground"
                  aria-label="Fermer le menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-xl text-base font-500 transition-all',
                      activeSection === link.href.replace('#', '')
                        ? 'bg-primary/8 text-primary'
                        : 'text-foreground/75 hover:bg-secondary hover:text-foreground'
                    )}
                    style={
                      activeSection === link.href.replace('#', '')
                        ? { background: 'rgba(109,27,198,0.08)' }
                        : {}
                    }
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              <div className="px-6 py-6 border-t border-border">
                <a
                  href="#download"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('#download');
                  }}
                  className="btn-primary w-full justify-center"
                >
                  Télécharger AWA
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
