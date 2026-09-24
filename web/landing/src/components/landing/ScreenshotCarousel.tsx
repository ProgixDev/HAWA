'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Baby,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home,
  Moon,
  Pill,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Sparkles,
} from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import SectionHeading from './SectionHeading';
import { cn } from '@/lib/utils';
import { useInViewport } from '@/lib/useInViewport';

// Real APK screenshots from public/assets/images — the first three follow a
// fixed onboarding-story order (splash/welcome/objective), then every real
// screen*.jpg is included in numerical order (screen7/screen8 don't exist on
// disk and are intentionally skipped, never referenced). Every slide's
// category/title/description describes only what is visibly shown in that
// exact screenshot.
const slides = [
  {
    src: '/assets/images/awa_apk.png',
    alt: 'Deux téléphones affichant l’écran de démarrage et l’écran de bienvenue de l’application AWA',
    category: 'AWA',
    title: 'Découvrez l’univers AWA',
    description:
      'Une expérience pensée pour vous accompagner avec douceur, simplicité et confidentialité.',
    icon: Sparkles,
  },
  {
    src: '/assets/images/screen_welcome.jpg',
    alt: 'Écran de bienvenue de l’application AWA avec le bouton Commencer',
    category: 'Bienvenue',
    title: 'Un espace personnel dès le premier instant',
    description: 'Commencez votre expérience AWA dans une interface calme et intuitive.',
    icon: Heart,
  },
  {
    src: '/assets/images/screen_objectif.jpg',
    alt: 'Écran permettant de choisir son objectif principal parmi huit parcours',
    category: 'Personnalisation',
    title: 'Choisissez votre objectif',
    description:
      'AWA adapte votre expérience selon l’étape de vie et le parcours qui vous correspondent.',
    icon: SlidersHorizontal,
  },
  {
    src: '/assets/images/screen1.jpg',
    alt: 'Calendrier de suivi du cycle affichant les jours de règles, la fenêtre fertile et l’ovulation',
    category: 'Calendrier',
    title: 'Un calendrier pensé pour votre cycle',
    description: 'Visualisez règles, fenêtre fertile et ovulation, en grégorien comme en hijri.',
    icon: CalendarDays,
  },
  {
    src: '/assets/images/screen2.jpg',
    alt: 'Écran des horaires de prière avec la prochaine prière et les horaires du jour',
    category: 'Repères spirituels',
    title: 'Vos horaires de prière, où que vous soyez',
    description:
      'Retrouvez les horaires du jour selon votre position, avec un rappel pour la prochaine prière.',
    icon: Moon,
  },
  {
    src: '/assets/images/screen3.jpg',
    alt: 'Écran de suivi de l’humeur avec sélection d’émotions et niveaux d’énergie',
    category: 'Humeur',
    title: 'Prenez le temps de ressentir',
    description:
      'Notez votre humeur et suivez votre énergie, votre stress et votre irritabilité au quotidien.',
    icon: Smile,
  },
  {
    src: '/assets/images/screen4.jpg',
    alt: 'Bibliothèque de contenus classés par catégories médicales et religieuses',
    category: 'Bibliothèque',
    title: 'Des contenus fiables à portée de main',
    description: 'Explorez des articles médicaux et religieux classés par thématique.',
    icon: BookOpen,
  },
  {
    src: '/assets/images/screen5.jpg',
    alt: 'Articles à la une et nouveautés de la bibliothèque AWA',
    category: 'Bibliothèque',
    title: 'Des articles choisis pour vous',
    description: 'Retrouvez les contenus à la une et les nouveautés de la bibliothèque AWA.',
    icon: BookOpen,
  },
  {
    src: '/assets/images/screen6.jpg',
    alt: 'Écran de suivi des jeûnes à rattraper pendant le Ramadan',
    category: 'Repères spirituels',
    title: 'Votre suivi des jeûnes à rattraper',
    description:
      'Gardez une vue claire sur les jours de jeûne manqués pendant les règles et à rattraper.',
    icon: Moon,
  },
  {
    src: '/assets/images/screen9.jpg',
    alt: 'Écran d’accueil affichant le jour du cycle et la fenêtre fertile',
    category: 'Accueil',
    title: 'Votre cycle, en un coup d’œil',
    description:
      'Jour du cycle, fenêtre fertile et prochaines règles réunis sur votre écran d’accueil.',
    icon: Home,
  },
  {
    src: '/assets/images/screen10.jpg',
    alt: 'Écran d’accueil du suivi de fertilité avec la période la plus fertile',
    category: 'Fertilité',
    title: 'Suivez votre fenêtre de fertilité',
    description:
      'Repérez vos phases de cycle et votre période la plus fertile pour votre projet de conception.',
    icon: HeartHandshake,
  },
  {
    src: '/assets/images/screen11.jpg',
    alt: 'Écran de suivi de la prise de pilule contraceptive du jour',
    category: 'Contraception',
    title: 'Votre prise, jamais oubliée',
    description: 'Suivez votre plaquette au jour le jour et enregistrez chaque prise en un geste.',
    icon: Pill,
  },
  {
    src: '/assets/images/screen12.jpg',
    alt: 'Détails de la méthode de contraception et du schéma de la plaquette',
    category: 'Contraception',
    title: 'Votre méthode, clairement expliquée',
    description: 'Retrouvez le schéma de votre contraception et la date de début de plaquette.',
    icon: Pill,
  },
  {
    src: '/assets/images/screen14.jpg',
    alt: 'Raccourcis vers les horaires de prière, la bibliothèque et les statistiques',
    category: 'Personnalisation',
    title: 'Tout l’essentiel, organisé pour vous',
    description:
      'Accédez en un geste à vos horaires de prière, votre bibliothèque et vos statistiques.',
    icon: SlidersHorizontal,
  },
  {
    src: '/assets/images/screen15.jpg',
    alt: 'Journal quotidien de suivi de contraception',
    category: 'Contraception',
    title: 'Votre suivi, un jour à la fois',
    description:
      'Enregistrez votre prise, vos effets ressentis et vos notes personnelles chaque jour.',
    icon: Pill,
  },
  {
    src: '/assets/images/screen16.jpg',
    alt: 'Écran d’accueil du suivi de grossesse avec la date prévue d’accouchement',
    category: 'Grossesse',
    title: 'Votre grossesse, semaine après semaine',
    description: 'Suivez votre avancée, votre date prévue d’accouchement et le temps restant.',
    icon: Baby,
  },
  {
    src: '/assets/images/screen17.jpg',
    alt: 'Détail hebdomadaire du développement du bébé pendant la grossesse',
    category: 'Grossesse',
    title: 'Votre bébé, semaine après semaine',
    description:
      'Découvrez le développement de votre bébé et les informations clés de chaque semaine.',
    icon: Baby,
  },
  {
    src: '/assets/images/screen18.jpg',
    alt: 'Suivi quotidien de la grossesse avec rendez-vous, examens et symptômes',
    category: 'Grossesse',
    title: 'Un suivi complet au quotidien',
    description: 'Rendez-vous, examens et suivi du jour réunis pour accompagner votre grossesse.',
    icon: Baby,
  },
  {
    src: '/assets/images/screen19.jpg',
    alt: 'Statistiques de grossesse avec progression et suivi du poids',
    category: 'Statistiques',
    title: 'Votre évolution en un coup d’œil',
    description: 'Visualisez votre progression et vos tendances tout au long de votre grossesse.',
    icon: BarChart3,
  },
  {
    src: '/assets/images/screen20.jpg',
    alt: 'Écran d’accueil du suivi post-partum avec lochies et retour du cycle',
    category: 'Post-partum',
    title: 'Votre post-partum, en douceur',
    description: 'Suivez vos lochies, le retour de votre cycle et votre évolution jour après jour.',
    icon: HeartPulse,
  },
  {
    src: '/assets/images/screen21.jpg',
    alt: 'Paramètres permettant d’activer ou désactiver les repères spirituels',
    category: 'Confidentialité',
    title: 'Activez ce qui vous correspond',
    description:
      'Choisissez d’activer ou non les fonctionnalités spirituelles selon vos préférences.',
    icon: ShieldCheck,
  },
] as const;

const AUTOPLAY_MS = 4500;
// Real screenshot aspect ratio shared by every screen*.jpg (598×1280);
// awa_apk.png is intentionally wider and simply letterboxes via
// object-contain instead of being cropped.
const SCREEN_ASPECT = '598 / 1280';

const mod = (value: number, length: number) => ((value % length) + length) % length;

type SlotOffset = -2 | -1 | 0 | 1 | 2;

const SLOT_OFFSETS: SlotOffset[] = [-2, -1, 0, 1, 2];

// Default is 3 visible slides (-1, 0, 1) at every size, per the "prefer 3 if
// cleaner" rule — the ±2 outer previews only switch on at 2xl (≥1536px),
// where there is genuinely enough width to add them without crowding the
// center. Spacing below is deliberately generous (a small real GAP between
// adjacent cards, not an overlap) to avoid the earlier "pile" problem.
const SLOT_VISIBILITY: Record<SlotOffset, string> = {
  [-2]: 'hidden 2xl:block',
  [-1]: 'hidden sm:block',
  0: 'block',
  1: 'hidden sm:block',
  2: 'hidden 2xl:block',
};

const SLOT_WIDTH: Record<SlotOffset, string> = {
  [-2]: '2xl:w-[150px]',
  [-1]: 'w-[128px] sm:w-[158px] lg:w-[180px] 2xl:w-[188px]',
  0: 'w-[168px] sm:w-[206px] lg:w-[232px] 2xl:w-[242px]',
  1: 'w-[128px] sm:w-[158px] lg:w-[180px] 2xl:w-[188px]',
  2: '2xl:w-[150px]',
};

// translateX values give each adjacent card its own clear footprint (center
// half-width + neighbor half-width + a small explicit gap), so cards sit
// side by side with breathing room instead of stacking on top of each
// other. Rotation stays subtle (4–9deg) per the requested ranges.
const SLOT_TRANSFORM: Record<SlotOffset, string> = {
  [-2]: '2xl:-translate-x-[404px] -rotate-[9deg]',
  [-1]: '-translate-x-[150px] sm:-translate-x-[184px] lg:-translate-x-[208px] 2xl:-translate-x-[218px] -rotate-[6deg]',
  0: 'translate-x-0 rotate-0',
  1: 'translate-x-[150px] sm:translate-x-[184px] lg:translate-x-[208px] 2xl:translate-x-[218px] rotate-[6deg]',
  2: '2xl:translate-x-[404px] rotate-[9deg]',
};

const SLOT_DEPTH: Record<SlotOffset, string> = {
  [-2]: 'z-10 opacity-50',
  [-1]: 'z-20 opacity-90',
  0: 'z-30 opacity-100',
  1: 'z-20 opacity-90',
  2: 'z-10 opacity-50',
};

export default function ScreenshotCarousel() {
  const [current, setCurrent] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInViewport(sectionRef);
  const dragStartX = useRef(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const total = slides.length;

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  }, []);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setCurrent((index) => mod(index + 1, total));
    }, AUTOPLAY_MS);
  }, [total]);

  // Autoplay only while the gallery is on screen: no timer, re-render or image swap while the
  // user is reading another part of the page.
  useEffect(() => {
    if (!inView) return;
    startAutoplay();
    return stopAutoplay;
  }, [inView, startAutoplay, stopAutoplay]);

  // Manual navigation restarts the autoplay timer instead of stacking a
  // second interval, so playback always continues afterwards.
  const goTo = (index: number) => {
    stopAutoplay();
    setCurrent(mod(index, total));
    startAutoplay();
  };

  const previous = () => goTo(current - 1);
  const next = () => goTo(current + 1);
  const active = slides[current];
  const ActiveIcon = active.icon;

  return (
    <section
      id="screenshots"
      ref={sectionRef}
      className="cv-auto [--cv-h-m:859px] [--cv-h-t:878px] [--cv-h-d:995px] relative overflow-hidden bg-gradient-to-b from-[#FBFAFE] via-white to-[#F8F3FC] py-24 md:py-32"
      aria-label="Captures d’écran de l’application"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-[#CEAEF1]/18 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[#F2AFD3]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1420px] px-5 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Captures d’écran"
          title="Découvrez AWA<br/><span class='gradient-text'>sous tous ses angles.</span>"
          subtitle="Explorez une interface calme, intuitive et personnalisable, pensée pour votre quotidien."
          className="mb-14"
          titleClassName="text-[clamp(2.5rem,4vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#30253E]"
          subtitleClassName="mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-[#777089] md:text-lg"
        />

        <div
          className="relative isolate overflow-hidden rounded-[2.5rem] border border-[#E8DCF2] bg-gradient-to-br from-[#F0E4FB] via-[#FCF9FF] to-[#FCE6F3] px-4 pb-28 pt-10 shadow-[0_32px_85px_rgba(74,39,107,0.13)] sm:px-8 sm:pb-32 lg:rounded-[3.25rem] lg:pb-36 lg:pt-14"
          role="region"
          aria-roledescription="carousel"
          aria-label="Captures d’écran de l’application AWA"
          tabIndex={0}
          onMouseEnter={stopAutoplay}
          onMouseLeave={startAutoplay}
          onFocus={stopAutoplay}
          onBlur={startAutoplay}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              next();
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              previous();
            }
          }}
          onTouchStart={(event) => {
            dragStartX.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            const delta = event.changedTouches[0].clientX - dragStartX.current;
            if (Math.abs(delta) > 45) {
              if (delta < 0) next();
              else previous();
            }
          }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute left-1/2 top-[13%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#B785EA]/22 to-[#EE83C2]/20 blur-3xl" />
            <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full border-[48px] border-white/45" />
            <div className="absolute -bottom-36 -right-28 h-80 w-80 rounded-full border-[55px] border-[#DCC4F0]/25" />
            <div className="absolute right-[10%] top-[12%] h-40 w-40 rounded-full border border-[#B78CDC]/25" />
          </div>

          {/* Stage — up to 5 fixed slots (-2..2), but only -1/0/1 render past
              `hidden` below 2xl (see SLOT_VISIBILITY). Each slot always shows
              the screenshot at (current + offset), so looping is plain
              modulo arithmetic and at most 5 <Image> instances ever mount —
              the other 17+ screenshots are never rendered until they rotate
              into one of these slots. */}
          <div className="relative mx-auto flex h-[380px] max-w-[1000px] items-center justify-center sm:h-[450px] lg:h-[500px] 2xl:h-[540px]">
            {SLOT_OFFSETS.map((offset) => {
              const index = mod(current + offset, total);
              const slide = slides[index];
              return (
                <div
                  key={offset}
                  className={cn(
                    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                    SLOT_VISIBILITY[offset]
                  )}
                >
                  <div
                    className={cn(
                      'transition-transform duration-500 ease-out',
                      SLOT_TRANSFORM[offset],
                      SLOT_DEPTH[offset]
                    )}
                  >
                    <div
                      className={cn(
                        'relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[#F4EEFB] shadow-[0_20px_45px_rgba(56,24,82,0.18)] lg:rounded-[2.2rem]',
                        offset === 0 &&
                          'border-white shadow-[0_38px_85px_rgba(56,24,82,0.32)] ring-1 ring-white/80',
                        SLOT_WIDTH[offset]
                      )}
                      style={{ aspectRatio: SCREEN_ASPECT }}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: offset >= 0 ? 16 : -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: offset >= 0 ? -16 : 16 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-0"
                        >
                          <AppImage
                            src={slide.src}
                            alt={slide.alt}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 168px, (max-width: 1024px) 206px, 242px"
                            priority={offset === 0 && current === 0}
                            loading={offset === 0 && current === 0 ? 'eager' : 'lazy'}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom information bar — updates with the active screenshot. */}
          <div className="absolute inset-x-5 bottom-5 z-40 flex flex-col items-stretch gap-5 rounded-[1.7rem] border border-white/70 bg-white/75 px-5 py-4 shadow-[0_16px_40px_rgba(72,39,101,0.12)] backdrop-blur-2xl sm:inset-x-8 sm:flex-row sm:items-center sm:justify-between md:px-7 lg:bottom-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex min-w-0 max-w-2xl items-center gap-4"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7627D0] to-[#E31A99] text-white shadow-[0_10px_24px_rgba(124,38,198,0.22)]">
                  <ActiveIcon size={22} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-[0.14em] text-[#8A49BE]">
                    {active.category}
                  </span>
                  <span className="mt-1 block truncate text-sm font-bold text-[#392F43] sm:text-base">
                    {active.title}
                  </span>
                  <span className="mt-1 hidden text-xs font-medium text-[#7C7285] lg:block">
                    {active.description}
                  </span>
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="flex shrink-0 items-center justify-center gap-3">
              <button
                type="button"
                onClick={previous}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DDCEE9] bg-white text-[#7B2BC7] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B786DC] hover:shadow-md"
                aria-label="Capture précédente"
              >
                <ChevronLeft size={21} aria-hidden="true" />
              </button>

              {/* Compact progress indicator instead of 22 individual dots,
                  which would be visually noisy at this slide count. */}
              <div
                className="flex flex-col items-center gap-1.5"
                aria-label="Navigation des captures d’écran"
              >
                <div
                  className="h-1.5 w-20 overflow-hidden rounded-full bg-[#E5D9F0] sm:w-28"
                  role="progressbar"
                  aria-valuenow={current + 1}
                  aria-valuemin={1}
                  aria-valuemax={total}
                  aria-label={`Capture ${current + 1} sur ${total}`}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#7627D0] to-[#DE1B9F]"
                    animate={{ width: `${((current + 1) / total) * 100}%` }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-[#8A7C99]">
                  {current + 1} / {total}
                </span>
              </div>

              <button
                type="button"
                onClick={next}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#DDCEE9] bg-white text-[#7B2BC7] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B786DC] hover:shadow-md"
                aria-label="Capture suivante"
              >
                <ChevronRight size={21} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
