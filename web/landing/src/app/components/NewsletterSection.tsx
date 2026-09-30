'use client';
import React, { useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section
      className="py-16 md:py-20"
      style={{ background: 'var(--primary)' }}
    >
      <div className="max-w-2xl mx-auto px-5 text-center">
        <div className="flex justify-center mb-6">
          <AppLogo size={36} />
        </div>
        <h2
          className="font-serif mb-3"
          style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: '#FFFFFF', lineHeight: 1.1 }}
        >
          Restez connectée à AWA.
        </h2>
        <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: 'var(--accent)' }}>
          Recevez nos actualités, conseils bien-être et nouvelles fonctionnalités directement
          dans votre boîte mail.
        </p>

        {submitted ? (
          <div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium"
            style={{ background: 'rgba(214,175,186,0.2)', color: 'var(--accent)' }}
          >
            Merci ! Vous êtes inscrite. ✨
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="flex-1 rounded-full px-5 py-3 text-sm outline-none border-none"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                border: '1px solid rgba(214,175,186,0.3)',
              }}
            />
            <button
              type="submit"
              className="btn-glass-light flex-shrink-0"
            >
              S'abonner
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
