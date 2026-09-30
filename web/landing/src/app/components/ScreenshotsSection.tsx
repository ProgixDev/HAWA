'use client';
import React, { useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const screenshots = [
{
  label: 'Mon cycle',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_4c926c9cd-1790692027261.png",
  alt: 'AWA cycle calendar screen showing marked period and fertile days with clean calendar interface on soft background'
},
{
  label: 'Mes symptômes',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_41867585f-1790692026490.png",
  alt: 'AWA symptom logging screen showing mood icons and physical symptom checklist on light background'
},
{
  label: 'Statistiques',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_49cb46462-1790692025678.png",
  alt: 'AWA statistics screen showing cycle length chart and trend analysis graphs on clean white background'
},
{
  label: 'Bibliothèque',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_4879300fb-1790692067721.png",
  alt: 'AWA educational library screen showing health articles and wellness content in organized grid layout'
},
{
  label: 'Apparence',
  src: "https://img.rocket.new/generatedImages/rocket_gen_img_45ae238aa-1790692025586.png",
  alt: 'AWA appearance settings screen showing theme color palettes and light dark mode options on soft background'
}];


export default function ScreenshotsSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' });
    }
  };

  return (
    <section id="screenshots" className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 fade-up">
          <div>
            <h2 className="font-serif text-section-title text-primary mb-2">
              Découvrez AWA{' '}
              <span className="italic" style={{ color: 'var(--secondary)' }}>
                en images.
              </span>
            </h2>
            <p className="text-muted-foreground text-base">
              Une interface claire, intuitive et pensée pour votre quotidien.
            </p>
          </div>
          {/* Scroll buttons — desktop */}
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="glass-icon-button">
              
              <Icon name="ChevronLeftIcon" size={16} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="glass-icon-button">
              
              <Icon name="ChevronRightIcon" size={16} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div ref={trackRef} className="screenshot-track fade-up">
          {screenshots.map((s) =>
          <div key={s.label} className="screenshot-item">
              <div className="phone-frame">
                <div className="phone-notch" />
                <AppImage
                src={s.src}
                alt={s.alt}
                fill
                className="object-cover" />
              
              </div>
              <p className="text-xs font-medium text-muted-foreground text-center mt-3">
                {s.label}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>);

}
