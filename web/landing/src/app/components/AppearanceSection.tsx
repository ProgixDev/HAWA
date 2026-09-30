import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const benefits = [
{ icon: 'SunIcon', label: 'Mode clair et sombre' },
{ icon: 'SwatchIcon', label: 'Plusieurs palettes de couleurs' },
{ icon: 'AdjustmentsHorizontalIcon', label: 'Personnalisation à tout moment' }];


export default function AppearanceSection() {
  return (
    <section className="py-16 md:py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="fade-up">
            <div className="badge-label mb-5">
              <Icon name="PaintBrushIcon" size={12} />
              Apparence
            </div>
            <h2 className="font-serif text-section-title text-primary mb-4">
              Une application{' '}
              <span className="italic" style={{ color: 'var(--secondary)' }}>
                qui vous ressemble.
              </span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm">
              Choisissez votre style et personnalisez l'expérience selon vos préférences. AWA s'adapte à votre quotidien, visuellement et fonctionnellement.
            </p>
            <ul className="flex flex-col gap-4">
              {benefits.map((b) =>
              <li key={b.label} className="flex items-center gap-3">
                  <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--muted)' }}>
                  
                    <Icon
                    name={b.icon as Parameters<typeof Icon>[0]['name']}
                    size={18}
                    className="text-secondary" />
                  
                  </span>
                  <span className="text-sm font-medium text-foreground">{b.label}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Right: Two phones */}
          <div className="phone-pair flex items-end justify-center lg:justify-end gap-4 fade-up fade-up-delay-1">
            {/* Light mode phone */}
            <div className="phone-frame">
              <div className="phone-notch" />
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_4d9b11192-1790692027774.png"
                alt="AWA app light mode interface showing clean white calendar and cycle tracking on bright background"
                fill
                className="object-cover" />
              
              <div
                className="absolute bottom-4 left-0 right-0 flex justify-center">
                
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                  
                  Mode clair
                </span>
              </div>
            </div>

            {/* Dark mode phone — slightly taller */}
            <div
              className="phone-frame"
              style={{ background: '#1a1118' }}>
              
              <div className="phone-notch" style={{ background: '#f7eff2' }} />
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_1ec747079-1767082981808.png"
                alt="AWA app dark mode interface showing statistics and charts on deep dark background"
                fill
                className="object-cover opacity-90" />
              
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(73,45,70,0.85)', color: '#F7EFF2', border: '1px solid rgba(214,175,186,0.3)' }}>
                  
                  Mode sombre
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
