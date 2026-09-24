'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import SectionHeading from './SectionHeading';
import { cn } from '@/lib/utils';
import { useInViewport } from '@/lib/useInViewport';

/* Demo testimonials — replace with verified customer reviews before publication */
const testimonials = [
  {
    name: 'Camille L.',
    role: 'Professeure de yoga',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_19106e4a5-1766497106346.png',
    avatarAlt:
      'Femme souriante aux cheveux bruns portant une tenue décontractée dans une pièce lumineuse et aérée',
    quote:
      'Avec AWA, j’ai enfin l’impression de comprendre mon cycle plutôt que de le subir. L’interface est tellement apaisante que j’ai hâte de faire mon suivi chaque jour.',
    stars: 5,
  },
  {
    name: 'Priya M.',
    role: 'Ingénieure logicielle',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1cc1c95ae-1772530900753.png',
    avatarAlt:
      'Jeune femme aux longs cheveux bruns souriant avec assurance dans un bureau baigné de lumière naturelle',
    quote:
      'J’ai essayé cinq applications de suivi de cycle différentes. AWA est la seule qui respecte réellement ma vie privée. Simple, intelligente et vraiment utile.',
    stars: 5,
  },
  {
    name: 'Sofia R.',
    role: 'Nutritionniste',
    avatar: 'https://images.unsplash.com/photo-1494954108838-6f615dddcf76',
    avatarAlt:
      'Femme aux cheveux bouclés auburn riant dans un cadre extérieur chaleureux et ensoleillé',
    quote:
      'Le suivi des symptômes m’a aidée à faire des liens que je n’avais jamais remarqués. Ma médecin a été impressionnée par les données que j’ai pu lui montrer.',
    stars: 5,
  },
  {
    name: 'Aisha K.',
    role: 'Enseignante',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d4551b80-1765511200828.png',
    avatarAlt:
      'Femme confiante aux cheveux naturels portant une tenue professionnelle dans un espace intérieur lumineux',
    quote:
      'Ce que je préfère, c’est le mode anonyme. Je peux utiliser AWA sans créer de profil public ni m’inquiéter pour mes données.',
    stars: 5,
  },
  {
    name: 'Lucía F.',
    role: 'Designer graphique',
    avatar: 'https://img.rocket.new/generatedImages/rocket_gen_img_1d42537de-1763301843773.png',
    avatarAlt:
      'Jeune femme au sourire chaleureux et à la tenue décontractée dans un espace de travail créatif moderne',
    quote:
      'Un design magnifique et des fonctionnalités bien pensées. Le suivi de l’humeur associé aux phases du cycle m’a apporté des éclairages précieux.',
    stars: 5,
  },
];

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInViewport(sectionRef);
  const autoRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const dragStartX = useRef(0);

  const stopAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
  }, []);

  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setCurrent((index) => (index + 1) % testimonials.length);
    }, 5500);
  }, []);

  useEffect(() => {
    if (!inView) return;
    startAuto();
    return stopAuto;
  }, [inView, startAuto, stopAuto]);

  const goTo = (index: number) => {
    stopAuto();
    setCurrent(index);
    startAuto();
  };

  const previous = () => goTo((current - 1 + testimonials.length) % testimonials.length);
  const next = () => goTo((current + 1) % testimonials.length);
  const testimonial = testimonials[current];

  return (
    <section
      ref={sectionRef}
      className="cv-auto [--cv-h-m:1090px] [--cv-h-t:691px] [--cv-h-d:737px] relative isolate overflow-hidden bg-gradient-to-br from-[#36108F] via-[#7217BC] to-[#D71991] py-24 md:py-32"
      aria-label="Témoignages d’utilisatrices"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-52 top-1/4 h-[38rem] w-[38rem] rounded-full border-[90px] border-white/[0.04]" />
        <div className="absolute -right-44 -top-52 h-[36rem] w-[36rem] rounded-full bg-[#EE5DB6]/20 blur-3xl" />
        <div className="absolute bottom-[-45%] left-[35%] h-[34rem] w-[34rem] rounded-full bg-[#AF69F2]/20 blur-3xl" />
        <div className="absolute right-[8%] top-[22%] h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.10),transparent_33%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1260px] px-6">
        <SectionHeading
          eyebrow="Témoignages"
          title="Plébiscitée par les femmes<br/><span class='text-white'>en quête de clarté.</span>"
          subtitle="Découvrez comment AWA accompagne leur quotidien avec douceur, simplicité et confidentialité."
          light
          className="mb-14"
          titleClassName="text-[clamp(2.4rem,4.2vw,4.1rem)] font-extrabold leading-[1.03] tracking-[-0.04em]"
          subtitleClassName="mx-auto max-w-2xl text-base font-medium text-white/[0.78] md:text-lg"
        />

        <div
          className="relative mx-auto max-w-[1080px]"
          onMouseEnter={stopAuto}
          onMouseLeave={startAuto}
          onTouchStart={(event) => {
            dragStartX.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            const delta = event.changedTouches[0].clientX - dragStartX.current;
            if (Math.abs(delta) > 50) {
              if (delta < 0) next();
              else previous();
            }
          }}
        >
          <AnimatePresence mode="wait">
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, x: 35, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -35, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="grid min-h-[390px] overflow-hidden rounded-[2.5rem] border border-white/[0.22] bg-white/[0.07] shadow-[0_30px_80px_rgba(23,6,63,0.3)] backdrop-blur-2xl md:grid-cols-[0.36fr_0.64fr]"
            >
              <div className="relative flex flex-col items-center justify-center overflow-hidden border-b border-white/15 bg-[#32107C]/30 px-8 py-10 text-center md:border-b-0 md:border-r">
                <div className="absolute -left-12 -top-14 h-40 w-40 rounded-full bg-[#E857B6]/25 blur-3xl" />
                <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-white/25 shadow-[0_18px_40px_rgba(22,5,60,0.3)]">
                  <AppImage
                    src={testimonial.avatar}
                    alt={testimonial.avatarAlt}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <h3 className="text-xl font-bold text-white">{testimonial.name}</h3>
                <p className="mt-1 text-sm font-medium text-white/70">{testimonial.role}</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/10 px-3.5 py-2 text-xs font-semibold text-white">
                  <CheckCircle2 size={15} className="text-white" aria-hidden="true" />
                  Avis vérifié
                </div>
              </div>

              <div className="relative flex flex-col justify-center px-7 py-10 sm:px-10 md:px-12 lg:px-14">
                <Quote
                  size={72}
                  fill="currentColor"
                  className="absolute right-8 top-7 text-white/[0.15]"
                  aria-hidden="true"
                />

                <div
                  className="mb-7 flex items-center gap-1.5"
                  aria-label={`${testimonial.stars} étoiles sur 5`}
                >
                  {Array.from({ length: testimonial.stars }).map((_, index) => (
                    <Star
                      key={index}
                      size={20}
                      fill="currentColor"
                      className="text-[#FFD56B] drop-shadow-[0_4px_8px_rgba(255,201,74,0.22)]"
                      aria-hidden="true"
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-white/90">5,0</span>
                </div>

                <blockquote className="relative text-[clamp(1.2rem,2vw,1.65rem)] font-medium leading-[1.55] tracking-[-0.015em] text-white">
                  “{testimonial.quote}”
                </blockquote>

                <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-white/[0.72]">
                  <span className="h-px w-10 bg-gradient-to-r from-[#FF9ED4] to-transparent" />
                  Expérience AWA
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          <button
            type="button"
            onClick={previous}
            className="absolute -left-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-[0_12px_28px_rgba(28,7,65,0.25)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/25 md:flex lg:-left-6"
            aria-label="Témoignage précédent"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute -right-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-[0_12px_28px_rgba(28,7,65,0.25)] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:bg-white/25 md:flex lg:-right-6"
            aria-label="Témoignage suivant"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-9 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={previous}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white md:hidden"
            aria-label="Témoignage précédent"
          >
            <ChevronLeft size={21} aria-hidden="true" />
          </button>

          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Navigation des témoignages"
          >
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => goTo(index)}
                role="tab"
                aria-selected={index === current}
                aria-label={`Afficher le témoignage ${index + 1}`}
                className={cn(
                  'h-2.5 rounded-full transition-all duration-300',
                  index === current
                    ? 'w-10 bg-white shadow-[0_0_16px_rgba(255,255,255,0.45)]'
                    : 'w-2.5 bg-white/30 hover:bg-white/55'
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white md:hidden"
            aria-label="Témoignage suivant"
          >
            <ChevronRight size={21} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
