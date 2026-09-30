'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const navLinks = [
  { label: 'Accueil', href: '#hero' },
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Parcours', href: '#journeys' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Captures', href: '#screenshots' },
  { label: 'FAQ', href: '#faq' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      const handleScrollClose = () => setMenuOpen(false);
      window.addEventListener('scroll', handleScrollClose, { passive: true });
      return () => window.removeEventListener('scroll', handleScrollClose);
    }
  }, [menuOpen]);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const id = href.replace('#', '');
    setActiveSection(id);
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-[0_1px_0_0_var(--border)]'
          : 'bg-white border-b border-border'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="#hero" onClick={() => handleNavClick('#hero')}>
          <div className="flex items-center gap-2">
            <AppLogo size={28} />
            <span className="font-serif text-xl font-semibold tracking-tight text-primary hidden sm:block">
              AWA
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => handleNavClick(link.href)}
              className={`nav-link ${activeSection === link.href.replace('#', '') ? 'active' : ''}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#pricing" className="btn-primary header-download">
            Télécharger
          </a>
          <button
            className="glass-icon-button lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <Icon name={menuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-border px-5 py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => handleNavClick(link.href)}
              className="py-3 text-sm font-medium text-muted-foreground hover:text-primary border-b border-border last:border-0"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#pricing"
            className="btn-primary mt-3 justify-center"
            onClick={() => setMenuOpen(false)}
          >
            Télécharger AWA
          </a>
        </div>
      )}
    </header>
  );
}
