import React from 'react';
import Icon from '@/components/ui/AppIcon';

const blocks = [
  {
    icon: 'UserCircleIcon',
    title: 'Mode anonyme',
    description: 'Utilisez l\'application sans profil public. Aucune information personnelle requise.',
  },
  {
    icon: 'LockClosedIcon',
    title: 'Sauvegarde sécurisée',
    description: 'Vos informations restent accessibles et protégées, chiffrées sur vos appareils.',
  },
  {
    icon: 'ShieldCheckIcon',
    title: 'Vos données, votre choix',
    description: 'Gardez le contrôle total sur vos informations. Exportez ou supprimez à tout moment.',
  },
];

export default function PrivacySection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left */}
          <div className="fade-up">
            <div className="badge-label mb-5">
              <Icon name="ShieldCheckIcon" size={12} />
              Confidentialité
            </div>
            <h2 className="font-serif text-section-title text-primary mb-4">
              Un espace personnel.{' '}
              <span className="italic" style={{ color: 'var(--secondary)' }}>
                À votre image.
              </span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              AWA est conçue pour respecter votre intimité et vous offrir un contrôle clair
              sur vos données.
            </p>
          </div>

          {/* Right: 3 blocks */}
          <div className="flex flex-col gap-5">
            {blocks.map((b, i) => (
              <div
                key={b.title}
                className={`flex items-start gap-4 p-5 rounded-xl border border-border bg-muted fade-up fade-up-delay-${i + 1}`}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--background)' }}
                >
                  <Icon
                    name={b.icon as Parameters<typeof Icon>[0]['name']}
                    size={18}
                    className="text-secondary"
                  />
                </span>
                <div>
                  <h3 className="font-semibold text-primary text-sm mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
