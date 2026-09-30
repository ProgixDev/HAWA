import React from 'react';
import Icon from '@/components/ui/AppIcon';

const features = [
  {
    icon: 'CalendarDaysIcon',
    title: 'Cycle & calendrier',
    description:
      'Suivez vos règles, l\'ovulation, les périodes fertiles et consultez votre historique complet.',
  },
  {
    icon: 'PencilSquareIcon',title: 'Journal quotidien',description:'Enregistrez vos symptômes, humeur, douleurs, température, poids, hydratation et notes.',
  },
  {
    icon: 'ChartBarIcon',title: 'Analyses & tendances',description:'Des statistiques claires pour mieux comprendre votre cycle et vos changements au fil du temps.',
  },
  {
    icon: 'ShieldCheckIcon',title: 'Confidentialité',description:'Vos données vous appartiennent. Mode anonyme, sauvegarde sécurisée et contrôle total.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="max-w-xl mb-10 fade-up">
          <h2 className="font-serif text-section-title text-primary mb-3">
            L'essentiel pour{' '}
            <span className="italic" style={{ color: 'var(--secondary)' }}>
              comprendre votre corps.
            </span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            Des outils simples et complets pour un suivi clair, intuitif et adapté à votre
            quotidien.
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feat, i) => (
            <div
              key={feat.title}
              className={`card-feature fade-up fade-up-delay-${i + 1}`}
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4"
                style={{ background: 'var(--muted)' }}
              >
                <Icon
                  name={feat.icon as Parameters<typeof Icon>[0]['name']}
                  size={20}
                  className="text-secondary"
                />
              </div>
              <h3 className="text-card-title font-semibold text-primary mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
