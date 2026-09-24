'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Mail, ShieldCheck } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import { fadeUp, viewportConfig } from '@/lib/animations';

const adminLoginUrl = `${(
  process.env.NEXT_PUBLIC_ADMIN_URL || 'https://awa-women-admin.vercel.app'
).replace(/\/+$/, '')}/admin-login`;

const footerLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Confidentialité', href: '#' },
  { label: 'Conditions', href: '#' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#faq' },
];

const socialLinks = [
  {
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'X',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06Z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M20.5 3h-17A2.5 2.5 0 0 0 1 5.5v13A2.5 2.5 0 0 0 3.5 21h17a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 20.5 3ZM8 18H5V9h3v9ZM6.5 7.8A1.75 1.75 0 1 1 6.5 4.3a1.75 1.75 0 0 1 0 3.5ZM19 18h-3v-4.4c0-2.7-3-2.5-3 0V18h-3V9h3v1.5c1.4-2.6 6-2.8 6 2.5v5Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const [year, setYear] = useState('2026');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subError, setSubError] = useState('');

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    setSubError('');
    setSubscribed(true);
  };

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    event.preventDefault();
    const id = href.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative isolate overflow-hidden text-white" aria-label="Pied de page">
      <AnimatedBackground variant="hero" />

      <div
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-[44%] top-[21%] h-28 w-28 rounded-full border border-white/[0.08] animate-pulse-scale" />
        <div className="absolute right-[9%] top-[22%] h-44 w-44 rounded-full border border-white/[0.1] animate-float-slow" />

        <svg
          className="absolute bottom-[25%] left-0 h-40 w-full opacity-25"
          viewBox="0 0 1600 160"
          preserveAspectRatio="none"
        >
          <path
            d="M-50 135C240 10 480 156 760 90c330-78 525-60 900-190"
            fill="none"
            stroke="white"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 md:h-44"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1600 180" preserveAspectRatio="none" className="h-full w-full">
          <path
            d="M0 6C310 96 530 130 820 48c265-75 430-49 780 46V0H0Z"
            fill="rgba(176,89,239,0.42)"
          />
          <path
            d="M0 46c280 94 520 112 805 4C1080-54 1280 4 1600 70V0H0Z"
            fill="rgba(238,77,181,0.36)"
          />
          <path d="M0 0h1600v20c-290 64-440 62-660 6C720-30 505 138 0 22Z" fill="#FFFFFF" />
        </svg>
      </div>

      <div className="relative z-20 mx-auto max-w-[1780px] px-7 pb-7 pt-40 sm:px-10 md:pt-48 lg:px-16 xl:px-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="relative mx-auto max-w-[920px] text-center"
        >
          <div className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-white/88">
            AWA
          </div>
          <h2 className="font-serif text-[clamp(2.35rem,3.8vw,4rem)] leading-[1.08] tracking-[-0.025em] text-white">
            Restez connectée à <span className="text-[#F4ADD7]">AWA.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-relaxed text-white/68 md:text-lg">
            Recevez nos actualités, conseils bien-être et nouvelles fonctionnalités directement dans
            votre boîte mail.
          </p>

          {subscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-7 flex min-h-16 max-w-[660px] items-center justify-center gap-3 rounded-full border border-white/25 bg-white/12 px-6 font-semibold text-white backdrop-blur-xl"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <svg width="16" height="13" viewBox="0 0 16 13" fill="none" aria-hidden="true">
                  <path
                    d="M1 6.5 5.5 11 15 1"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Vous êtes inscrite — merci !
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="mx-auto mt-7 flex max-w-[680px] flex-col gap-3 rounded-[2rem] border border-white/25 bg-white/10 p-1.5 shadow-[0_18px_42px_rgba(27,7,64,0.18)] backdrop-blur-xl sm:flex-row sm:rounded-full"
              noValidate
              aria-label="Inscription à la newsletter"
            >
              <div className="relative min-w-0 flex-1">
                <label htmlFor="newsletter-email" className="sr-only">
                  Adresse e-mail
                </label>
                <Mail
                  className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/75"
                  aria-hidden="true"
                />
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Votre adresse e-mail"
                  className="min-h-14 w-full rounded-full bg-transparent py-3 pl-14 pr-5 text-sm font-medium text-white outline-none placeholder:text-white/50"
                  aria-describedby={subError ? 'sub-error' : undefined}
                />
                {subError && (
                  <p
                    id="sub-error"
                    className="absolute left-5 top-full mt-3 text-left text-xs font-medium text-[#FFD1DC]"
                  >
                    {subError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-full bg-gradient-to-r from-[#EC128F] to-[#6923D0] px-9 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(49,8,88,0.28)] ring-1 ring-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(49,8,88,0.38)]"
              >
                S’abonner
                <ArrowRight
                  size={19}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </form>
          )}

          <div className="mt-9 flex items-center justify-center gap-3">
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.label}
                href="#"
                onClick={(event) => event.preventDefault()}
                aria-label={social.label}
                animate={{ y: [0, index % 2 === 0 ? -5 : -3, 0] }}
                transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/[0.08] text-white/82 shadow-[0_10px_24px_rgba(27,6,61,0.14)] backdrop-blur-md transition-colors hover:bg-white/18 hover:text-white"
              >
                {social.icon}
              </motion.a>
            ))}
          </div>
        </motion.div>

        <div
          className="pointer-events-none absolute left-[10%] top-[47%] hidden -rotate-6 font-serif text-2xl italic leading-[1.3] text-white/42 xl:block"
          aria-hidden="true"
        >
          Votre bien-être
          <br />
          au quotidien.
          <span className="mt-3 block h-px w-14 bg-white/50" />
        </div>
        <div
          className="pointer-events-none absolute right-[8%] top-[36%] hidden rotate-[-7deg] text-right font-serif text-xl italic leading-[1.35] text-white/42 xl:block"
          aria-hidden="true"
        >
          Plus sereine
          <br />
          demain
          <Heart className="ml-auto mt-2 h-7 w-7 text-white/45" strokeWidth={1.3} />
        </div>

        <div className="flex flex-col items-center justify-between gap-8 py-9 lg:flex-row">
          <nav aria-label="Navigation du pied de page">
            <ul className="flex flex-wrap items-center justify-center gap-x-9 gap-y-3 lg:justify-start">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(event) => handleNavClick(event, link.href)}
                    className="text-sm font-semibold text-white/68 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <a
              href={adminLoginUrl}
              className="group mx-auto flex min-h-16 max-w-[290px] items-center justify-between gap-4 rounded-full border border-white/35 bg-white/[0.08] px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(40,7,75,0.15)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/55 hover:bg-white/15 lg:ml-auto lg:mr-0"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck size={24} aria-hidden="true" />
                Espace admin
              </span>
              <ArrowRight
                size={20}
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>

        <div className="pb-1 text-center text-sm font-medium text-white/52">
          © {year} AWA. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
