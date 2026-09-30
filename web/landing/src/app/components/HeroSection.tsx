import React from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const benefits = [
{ icon: 'LockClosedIcon', label: 'Sûre et privée' },
{ icon: 'SparklesIcon', label: 'Personnalisée' },
{ icon: 'HeartIcon', label: 'À chaque étape' },
{ icon: 'UserIcon', label: 'Pensée pour vous' }];


export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[calc(100vh-3.5rem)] mt-14 flex items-center overflow-hidden bg-white">
      
      {/* Subtle background blush shapes */}
      <div
        className="blush-circle"
        style={{ width: 340, height: 340, top: '-60px', right: '-60px' }} />
      
      <div
        className="blush-circle"
        style={{ width: 200, height: 200, bottom: '60px', right: '30%', opacity: 0.1 }} />
      

      <div className="max-w-6xl mx-auto px-5 w-full py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left: Copy */}
        <div className="flex flex-col items-start">
          <div className="badge-label mb-5 fade-up">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--secondary)' }} />
            
            Suivi du cycle & bien-être
          </div>

          <h1 className="font-serif text-hero text-primary mb-5 fade-up fade-up-delay-1">
            Votre corps change.{' '}
            <span className="italic" style={{ color: 'var(--secondary)' }}>
              Votre suivi aussi.
            </span>
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-md fade-up fade-up-delay-2">
            Du premier jour de votre cycle aux nouvelles étapes de votre vie, AWA vous aide
            à mieux vous comprendre. Simplement, à votre rythme.
          </p>

          <div className="flex flex-wrap gap-3 mb-10 fade-up fade-up-delay-3">
            <a href="#pricing" className="btn-primary">
              Télécharger AWA
              <Icon name="ArrowDownTrayIcon" size={16} />
            </a>
            <a href="#features" className="btn-secondary">
              Découvrir l'application
            </a>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full fade-up fade-up-delay-4">
            {benefits.map((b) =>
            <div
              key={b.label}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border bg-muted text-center">
              
                <Icon name={b.icon as Parameters<typeof Icon>[0]['name']} size={18} className="text-secondary" />
                <span className="text-xs font-medium text-muted-foreground leading-tight">
                  {b.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Phone Mockups */}
        <div className="relative flex items-center justify-center lg:justify-end fade-up fade-up-delay-2">
          <div className="phone-pair relative flex items-end gap-4">
            {/* Main phone */}
            <div className="phone-frame">
              <div className="phone-notch" />
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_44b6e6bde-1790692027298.png"
                alt="AWA app cycle tracking screen showing calendar with marked fertile days and period dates on soft blush background"
                fill
                className="object-cover"
                priority />
              
              {/* Floating detail card */}
              <div
                className="absolute bottom-6 left-4 right-4 rounded-xl p-3"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 16px rgba(73,45,70,0.10)'
                }}>
                
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary">Jour 14</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'var(--muted)', color: 'var(--secondary)' }}>
                    
                    Ovulation
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Période fertile · 5 jours</p>
              </div>
            </div>

            {/* Secondary phone — slightly offset */}
            <div
              className="phone-frame hidden sm:block"
              style={{ marginBottom: '2rem' }}>
              
              <div className="phone-notch" />
              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_44bcd2a27-1790692026568.png"
                alt="AWA app daily journal screen showing mood tracking and symptom logging on light background"
                fill
                className="object-cover" />
              
            </div>
          </div>
        </div>
      </div>
    </section>);

}
