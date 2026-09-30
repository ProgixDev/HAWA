'use client';
import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

const faqs = [
  {
    q: 'Qu\'est-ce qu\'AWA ?',
    a: 'AWA est une application mobile dédiée à la santé féminine et au suivi du cycle menstruel. Elle vous permet de suivre votre cycle, enregistrer vos symptômes, accéder à des analyses personnalisées et naviguer chaque étape de votre vie reproductive en toute confiance.',
  },
  {
    q: 'Comment fonctionne le suivi du cycle ?',
    a: "Vous saisissez le premier jour de vos règles et AWA calcule automatiquement vos prochaines dates, votre fenêtre d'ovulation et vos périodes fertiles. Plus vous utilisez l'application, plus les prédictions s'affinent grâce à votre historique personnel.",
  },
  {
    q: 'Mes données sont-elles privées ?',a: 'Oui. Vos données de santé sont stockées de manière chiffrée et ne sont jamais partagées avec des tiers. AWA ne revend aucune donnée personnelle. Vous gardez le contrôle total sur vos informations à tout moment.',
  },
  {
    q: 'Puis-je utiliser AWA sans créer de profil public ?',a: 'Absolument. AWA propose un mode anonyme qui vous permet d\'utiliser toutes les fonctionnalités de base sans créer de compte lié à votre identité. Aucune adresse email ni information personnelle n\'est requise pour commencer.',
  },
  {
    q: 'Comment les prédictions sont-elles calculées ?',
    a: "AWA utilise vos données historiques de cycle pour calculer des prédictions personnalisées. L'algorithme prend en compte la durée moyenne de vos cycles, la variabilité et les symptômes enregistrés pour affiner les estimations au fil du temps.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 md:py-20 bg-muted">
      <div className="max-w-3xl mx-auto px-5">
        {/* Header */}
        <div className="mb-10 fade-up">
          <h2 className="font-serif text-section-title text-primary mb-3">
            Vos questions,{' '}
            <span className="italic" style={{ color: 'var(--secondary)' }}>
              nos réponses.
            </span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="fade-up fade-up-delay-1">
          {faqs?.map((item, i) => (
            <div key={i} className="accordion-item">
              <button
                className="w-full flex items-center justify-between gap-4 py-4 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'var(--accent)', color: 'var(--primary)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item?.q}</span>
                </div>
                <span className="glass-icon-button glass-icon-button-small pointer-events-none">
                  <Icon
                    name={openIndex === i ? 'MinusIcon' : 'PlusIcon'}
                    size={14}
                    className="text-muted-foreground flex-shrink-0"
                  />
                </span>
              </button>
              {openIndex === i && (
                <div className="pb-4 pl-9">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item?.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
