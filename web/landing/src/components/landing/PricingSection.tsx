'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Gift, Sparkles } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { staggerContainer, fadeUp, viewportConfig } from '@/lib/animations';
import { cn } from '@/lib/utils';

/* Configurable pricing — replace with real values */
const PRICING = {
  MONTHLY_PRICE: '4.99',
  YEARLY_PRICE: '39.99',
  YEARLY_MONTHLY_EQUIV: '3.33',
};

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: Gift,
    price: null,
    interval: null,
    priceNote: 'Gratuit à vie',
    description:
      'Les outils essentiels pour suivre votre quotidien dans un espace intime et apaisant.',
    features: [
      'Suivi du cycle',
      'Journal quotidien',
      'Mode pudeur',
      'Repères spirituels de base (calendrier hijri, indicateur de statut)',
    ],
    cta: 'Commencer gratuitement',
    featured: false,
    iconClass: 'from-[#F1E8FF] to-[#FCE8F5] text-[#8D35D3]',
  },
  {
    id: 'monthly',
    name: 'Premium mensuel',
    icon: Sparkles,
    price: PRICING.MONTHLY_PRICE,
    interval: '/ mois',
    priceNote: 'Facturation mensuelle',
    description: 'Toutes les fonctionnalités Premium avec un abonnement renouvelé chaque mois.',
    features: [
      'Statistiques avancées',
      'Export médical PDF/CSV',
      'Contenus éducatifs approfondis',
      'Historique illimité',
      'Thèmes visuels supplémentaires',
    ],
    cta: 'Choisir Premium mensuel',
    featured: false,
    iconClass: 'from-[#7B2BD2] to-[#C52BD3] text-white',
  },
  {
    id: 'yearly',
    name: 'Premium annuel',
    icon: Crown,
    price: PRICING.YEARLY_PRICE,
    interval: '/ an',
    priceNote: `Soit $${PRICING.YEARLY_MONTHLY_EQUIV} / mois`,
    description: 'Les mêmes fonctionnalités Premium, avec un tarif plus avantageux à l’année.',
    badge: 'Meilleure offre · −33 %',
    features: [
      'Statistiques avancées',
      'Export médical PDF/CSV',
      'Contenus éducatifs approfondis',
      'Historique illimité',
      'Thèmes visuels supplémentaires',
    ],
    cta: 'Choisir Premium annuel',
    featured: true,
    iconClass: 'from-white/25 to-white/10 text-white',
  },
];

export default function PricingSection() {
  const scrollToDownload = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-gradient-to-b from-white via-[#FCF9FF] to-[#F8F3FD] py-24 md:py-32"
      aria-label="Tarifs"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#CDA9F4]/20 blur-3xl" />
        <div className="absolute -bottom-44 -left-24 h-[30rem] w-[30rem] rounded-full bg-[#F2A8D1]/20 blur-3xl" />
        <div className="absolute left-1/2 top-[42%] h-72 w-[52rem] -translate-x-1/2 rounded-full bg-[#D9C2F5]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-6">
        <SectionHeading
          eyebrow="Tarifs"
          title="Trois formules,<br/><span class='gradient-text'>simplement.</span>"
          subtitle="Choisissez entre AWA Gratuit, Premium mensuel ou Premium annuel. Une tarification claire, sans frais cachés."
          className="mb-16"
          titleClassName="text-[clamp(2.5rem,4vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#30253E]"
          subtitleClassName="mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-[#777089] md:text-lg"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-7"
        >
          {plans.map((plan) => {
            const PlanIcon = plan.icon;

            return (
              <motion.article
                key={plan.id}
                variants={fadeUp}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                  'group relative flex min-h-[650px] flex-col overflow-hidden rounded-[2.25rem] border p-7 shadow-[0_20px_65px_rgba(62,35,92,0.09)] md:p-8',
                  plan.featured
                    ? 'border-white/20 bg-gradient-to-br from-[#6420C6] via-[#9723D0] to-[#E01791] text-white shadow-[0_28px_75px_rgba(128,31,190,0.28)] md:-translate-y-4'
                    : 'border-[#E8DDF2] bg-white/85 text-[#332A3E] backdrop-blur-xl'
                )}
              >
                <div
                  className={cn(
                    'absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
                    plan.featured ? 'via-white/70' : 'via-[#B27ADD]/60'
                  )}
                  aria-hidden="true"
                />

                {plan.badge && (
                  <span className="absolute right-6 top-6 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-md">
                    {plan.badge}
                  </span>
                )}

                <div
                  className={cn(
                    'mb-7 flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-gradient-to-br shadow-[0_12px_28px_rgba(92,37,145,0.16)]',
                    plan.iconClass
                  )}
                >
                  <PlanIcon size={25} strokeWidth={2.1} aria-hidden="true" />
                </div>

                <div className="mb-7 min-h-[120px]">
                  <h3
                    className={cn(
                      'mb-3 text-2xl font-extrabold tracking-[-0.025em]',
                      plan.featured ? 'text-white' : 'text-[#30253E]'
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={cn(
                      'text-sm font-medium leading-relaxed',
                      plan.featured ? 'text-white/75' : 'text-[#7B7485]'
                    )}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  className={cn(
                    'mb-7 rounded-2xl border px-5 py-4',
                    plan.featured ? 'border-white/15 bg-white/10' : 'border-[#ECE3F4] bg-[#FAF7FD]'
                  )}
                >
                  {plan.price ? (
                    <div className="flex items-end gap-2">
                      <span
                        className={cn(
                          'text-[2.8rem] font-extrabold leading-none tracking-[-0.045em]',
                          plan.featured ? 'text-white' : 'gradient-text'
                        )}
                      >
                        ${plan.price}
                      </span>
                      <span
                        className={cn(
                          'mb-1 text-sm font-semibold',
                          plan.featured ? 'text-white/70' : 'text-[#81798B]'
                        )}
                      >
                        {plan.interval}
                      </span>
                    </div>
                  ) : (
                    <div className="gradient-text text-[2.5rem] font-extrabold leading-none tracking-[-0.04em]">
                      Gratuit
                    </div>
                  )}
                  <p
                    className={cn(
                      'mt-2 text-xs font-semibold',
                      plan.featured ? 'text-white/65' : 'text-[#928A9C]'
                    )}
                  >
                    {plan.priceNote}
                  </p>
                </div>

                <ul className="mb-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                          plan.featured ? 'bg-white/20' : 'bg-[#F0E6FA]'
                        )}
                      >
                        <Check
                          size={12}
                          strokeWidth={3}
                          className={plan.featured ? 'text-white' : 'text-[#8533CE]'}
                          aria-hidden="true"
                        />
                      </span>
                      <span
                        className={cn(
                          'text-sm font-medium leading-snug',
                          plan.featured ? 'text-white/85' : 'text-[#554D61]'
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#download"
                  onClick={scrollToDownload}
                  className={cn(
                    'mt-auto inline-flex min-h-14 w-full items-center justify-center rounded-full px-5 text-center text-sm font-bold shadow-lg transition-all duration-300 hover:-translate-y-0.5',
                    plan.featured
                      ? 'bg-white text-[#7C28C9] hover:bg-[#FFF8FD]'
                      : 'bg-gradient-to-r from-[#7626D0] to-[#D51AA5] text-white hover:shadow-[0_14px_30px_rgba(137,35,201,0.28)]'
                  )}
                >
                  {plan.cta}
                </a>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
