'use client';

import React from 'react';

import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const adminUrl =
  process.env.NEXT_PUBLIC_ADMIN_URL || 'https://awa-women-admin.vercel.app/admin-login';

const links = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Parcours', href: '#journeys' },
  { label: 'Confidentialité', href: '#privacy' },
  { label: 'Conditions', href: '#' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#' },
];

const socialLinks = [
  { icon: 'GlobeAltIcon', href: '#', label: 'Site web' },
  { icon: 'EnvelopeIcon', href: 'mailto:hello@awa.app', label: 'Email' },
];

export default function Footer() {
  return (
    <footer
      className="border-t"
      style={{ background: 'var(--primary)', borderColor: 'rgba(214,175,186,0.15)' }}
    >
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Logo + tagline */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AppLogo size={28} />
              <span className="font-serif text-lg font-semibold text-white">AWA</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              À votre rythme, à chaque étape.
            </p>
          </div>

          {/* Center: Links */}
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium transition-colors"
                style={{ color: 'rgba(214,175,186,0.8)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(214,175,186,0.8)')}
              >
                {l.label}
              </a>
            ))}
            <a
              href={adminUrl}
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(214,175,186,0.5)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(214,175,186,0.5)')}
            >
              Espace admin
            </a>
          </nav>

          {/* Right: Social */}
          <div className="flex items-center gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(214,175,186,0.15)', color: 'var(--accent)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(214,175,186,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    'rgba(214,175,186,0.15)';
                }}
              >
                <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={15} />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(214,175,186,0.15)', color: 'rgba(214,175,186,0.5)' }}
        >
          <span>© 2026 AWA. Tous droits réservés.</span>
          <div className="flex gap-4">
            <a
              href="#"
              className="hover:text-white transition-colors"
              style={{ color: 'rgba(214,175,186,0.5)' }}
            >
              Politique de confidentialité
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors"
              style={{ color: 'rgba(214,175,186,0.5)' }}
            >
              CGU
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
