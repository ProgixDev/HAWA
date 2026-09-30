'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const freeFeatures = [
  'Suivi du cycle',
  'Journal quotidien',
  'Mode anonyme',
  'Contenus de base',
];

const premiumFeatures = [
  'Statistiques avancées',
  'Export médical PDF/CSV',
  'Contenus éducatifs approfondis',
  'Historique illimité',
  'Thèmes visuels supplémentaires',
];

export default function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const price = billing === 'monthly' ? '4,99 €' : '3,99 €';
  const priceNote =
    billing === 'annual' ? 'facturé 47,88 € / an' : '';

  return (
    <section id="pricing" className="pricing-section py-16 md:py-20 bg-muted">
      <div className="max-w-6xl mx-auto px-5">
        <div className="pricing-heading fade-up">
          <div>
            <h2 className="pricing-title font-serif text-primary">
              Choisissez ce qui{' '}
              <span className="italic text-secondary">vous convient.</span>
            </h2>
            <p className="pricing-subtitle text-muted-foreground">
              Des fonctionnalités essentielles gratuites, et encore plus d'outils avec
              Premium.
            </p>
          </div>

          <div className="pricing-billing-control" aria-label="Période de facturation">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`billing-option ${billing === 'monthly' ? 'active' : ''}`}
              aria-pressed={billing === 'monthly'}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className={`billing-switch ${billing === 'annual' ? 'active' : ''}`}
              aria-label="Changer la période de facturation"
              aria-pressed={billing === 'annual'}
            >
              <span
                className="billing-switch-thumb"
                style={{ transform: billing === 'annual' ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`billing-option billing-option-annual ${billing === 'annual' ? 'active' : ''}`}
              aria-pressed={billing === 'annual'}
            >
              Annuel
              <span className="billing-discount">−20 %</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="pricing-cards fade-up fade-up-delay-1">
          {/* Free */}
          <div className="pricing-card-free">
            <div className="pricing-card-header">
              <p className="pricing-eyebrow text-muted-foreground">
                Gratuit
              </p>
              <div className="pricing-price-row">
                <span className="pricing-price font-serif text-primary">0 €</span>
                <span className="pricing-period text-muted-foreground">/ mois</span>
              </div>
            </div>
            <ul className="pricing-feature-list">
              {freeFeatures.map((f) => (
                <li key={f} className="pricing-feature text-foreground">
                  <Icon name="CheckCircleIcon" size={19} className="text-secondary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button type="button" className="pricing-cta pricing-cta-free">
              Commencer gratuitement
            </button>
          </div>

          {/* Premium */}
          <div className="pricing-card-premium">
            <div className="pricing-premium-glow" aria-hidden="true" />
            <div className="pricing-card-header relative z-10">
              <div className="flex items-center justify-between gap-4">
                <p className="pricing-eyebrow text-accent">
                  Premium
                </p>
                <span className="pricing-popular-badge">
                  Populaire
                </span>
              </div>
              <div className="pricing-price-row">
                <span className="pricing-price font-serif text-white">{price}</span>
                <span className="pricing-period text-accent">/ mois</span>
              </div>
              <p className={`pricing-note text-accent ${priceNote ? '' : 'invisible'}`}>
                {priceNote || 'Facturation annuelle'}
              </p>
            </div>
            <ul className="pricing-feature-list relative z-10">
              {premiumFeatures.map((f) => (
                <li key={f} className="pricing-feature text-white">
                  <Icon name="CheckCircleIcon" size={19} className="text-accent flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button type="button" className="pricing-cta pricing-cta-premium relative z-10">
              Choisir Premium
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
