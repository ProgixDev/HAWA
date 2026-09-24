'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CalendarDays,
  TrendingUp,
  Thermometer,
  Weight,
  Droplets,
  FileText,
  Bell,
  BarChart2,
  BookOpen,
  ShieldCheck,
  Cloud,
  Smile,
  Moon,
  Zap,
  Activity,
  Heart,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react';
import SectionHeading from './SectionHeading';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: CalendarDays,
    title: 'Suivi du cycle',
    description:
      'Enregistrez le début, la fin et le flux de vos règles grâce à un calendrier doux et intuitif, pensé pour votre rythme.',
    color: 'from-[#6D1BC6] to-[#9A22CE]',
  },
  {
    icon: TrendingUp,
    title: 'Prédictions des règles',
    description:
      'Des prévisions intelligentes basées sur votre historique de cycle personnel, pas de simples moyennes.',
    color: 'from-[#9A22CE] to-[#C020A0]',
  },
  {
    icon: Zap,
    title: 'Ovulation et fenêtre de fertilité',
    description: 'Identifiez vos jours fertiles et vos estimations d’ovulation en toute clarté.',
    color: 'from-[#C020A0] to-[#D51A9B]',
  },
  {
    icon: Activity,
    title: 'Suivi des symptômes',
    description:
      'Enregistrez maux de tête, crampes, ballonnements et plus de 30 autres symptômes pour repérer vos tendances personnelles.',
    color: 'from-[#D51A9B] to-[#FA0076]',
  },
  {
    icon: Smile,
    title: 'Suivi de l’humeur',
    description:
      'Enregistrez vos émotions quotidiennes et découvrez le lien entre votre humeur et les phases de votre cycle.',
    color: 'from-[#FA0076] to-[#ED3EA4]',
  },
  {
    icon: Heart,
    title: 'Suivi de la douleur',
    description:
      'Suivez l’intensité et la localisation de la douleur pour partager des données utiles avec votre professionnel de santé.',
    color: 'from-[#ED3EA4] to-[#9A22CE]',
  },
  {
    icon: Thermometer,
    title: 'Température corporelle',
    description:
      'Enregistrez votre température basale pour affiner le suivi de l’ovulation et la compréhension de votre cycle.',
    color: 'from-[#6D1BC6] to-[#5B63FB]',
  },
  {
    icon: Weight,
    title: 'Suivi du poids',
    description:
      'Surveillez les variations de poids au fil de votre cycle et repérez les tendances hormonales dans le temps.',
    color: 'from-[#5B63FB] to-[#702DDA]',
  },
  {
    icon: Droplets,
    title: 'Hydratation',
    description:
      'Gardez le contrôle de votre consommation d’eau quotidienne grâce à des rappels adaptés à votre phase de cycle.',
    color: 'from-[#702DDA] to-[#9A22CE]',
  },
  {
    icon: FileText,
    title: 'Notes personnelles',
    description:
      'Un journal quotidien privé pour consigner librement pensées, ressentis et observations.',
    color: 'from-[#9A22CE] to-[#D51A9B]',
  },
  {
    icon: Bell,
    title: 'Notifications intelligentes',
    description:
      'Des rappels au bon moment pour les prédictions de règles, les fenêtres de fertilité et le suivi quotidien — jamais intrusifs.',
    color: 'from-[#D51A9B] to-[#FA0076]',
  },
  {
    icon: BarChart2,
    title: 'Statistiques mensuelles',
    description:
      'De beaux graphiques et résumés de tendances pour comprendre votre corps au fil des mois.',
    color: 'from-[#FA0076] to-[#6D1BC6]',
  },
  {
    icon: Moon,
    title: 'Historique du cycle',
    description:
      'Une archive complète de vos données de cycle — toujours accessible, toujours privée.',
    color: 'from-[#6D1BC6] to-[#702DDA]',
  },
  {
    icon: BookOpen,
    title: 'Bibliothèque éducative',
    description:
      'Des articles fondés sur des données scientifiques sur votre cycle, vos hormones et la santé féminine — expliqués clairement.',
    color: 'from-[#702DDA] to-[#C020A0]',
  },
  {
    icon: ShieldCheck,
    title: 'Confidentialité et mode anonyme',
    description:
      'Utilisez AWA avec un pseudonyme. Aucun nom réel requis. Votre vie privée est une fonctionnalité à part entière.',
    color: 'from-[#C020A0] to-[#FA0076]',
  },
  {
    icon: Cloud,
    title: 'Sauvegarde cloud',
    description:
      'Une sauvegarde chiffrée pour protéger vos données sur tous vos appareils sans jamais compromettre votre vie privée.',
    color: 'from-[#FA0076] to-[#ED3EA4]',
  },
];

const CARD_GAP = 20;

export default function FeaturesSection() {
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [cardStep, setCardStep] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const maxStart = Math.max(0, features.length - visibleCount);
  const isPaused = manualPaused || hoverPaused || prefersReducedMotion;

  const prev = useCallback(() => {
    setStartIndex((current) => (current <= 0 ? maxStart : current - 1));
  }, [maxStart]);

  const next = useCallback(() => {
    setStartIndex((current) => (current >= maxStart ? 0 : current + 1));
  }, [maxStart]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateCarouselSize = () => {
      const width = viewport.clientWidth;
      const nextVisibleCount = width >= 1024 ? 4 : width >= 640 ? 2 : 1;
      const cardsWidth = width - CARD_GAP * (nextVisibleCount - 1);

      setVisibleCount(nextVisibleCount);
      setCardStep(cardsWidth / nextVisibleCount + CARD_GAP);
      setStartIndex((current) =>
        Math.min(current, Math.max(0, features.length - nextVisibleCount))
      );
    };

    updateCarouselSize();
    const resizeObserver = new ResizeObserver(updateCarouselSize);
    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (isPaused || maxStart === 0) return;

    const interval = window.setInterval(next, 3600);
    return () => window.clearInterval(interval);
  }, [isPaused, maxStart, next]);

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-secondary pb-24 pt-16 md:pb-32 md:pt-20"
      aria-label="Fonctionnalités"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-5 blob-purple" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-5 blob-magenta" />
        {[...Array(5)]?.map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary opacity-20"
            style={{
              top: `${20 + i * 15}%`,
              left: `${5 + i * 20}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-[1240px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <SectionHeading
            eyebrow="Fonctionnalités"
            title="Des fonctionnalités puissantes,<br/><span class='gradient-text sm:whitespace-nowrap'>pensées pour votre quotidien.</span>"
            subtitle="Tout ce qu’il vous faut pour mieux comprendre votre cycle et votre bien-être, dans une expérience calme et intuitive."
            centered={false}
            className="w-full max-w-[920px] md:flex-1"
            titleClassName="text-[clamp(2.25rem,3.8vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#2F2340]"
            subtitleClassName="max-w-2xl text-[17px] font-medium leading-[1.65] text-[#777089] md:text-xl"
          />

          {/* Carousel controls */}
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-primary/10 bg-white/70 p-1.5 shadow-[0_10px_30px_rgba(73,35,118,0.08)] backdrop-blur-xl">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 hover:bg-primary hover:text-white"
              aria-label="Fonctionnalités précédentes"
            >
              <ChevronLeft size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button
              onClick={() => setManualPaused((paused) => !paused)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7826D2] to-[#E31591] text-white shadow-[0_7px_18px_rgba(122,38,210,0.28)] transition-transform duration-200 hover:scale-105"
              aria-label={
                manualPaused
                  ? 'Reprendre le défilement automatique'
                  : 'Mettre le défilement en pause'
              }
            >
              {manualPaused ? (
                <Play size={16} fill="currentColor" aria-hidden="true" />
              ) : (
                <Pause size={16} fill="currentColor" aria-hidden="true" />
              )}
            </button>
            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-all duration-200 hover:bg-primary hover:text-white"
              aria-label="Fonctionnalités suivantes"
            >
              <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Horizontally sliding cards */}
        <div
          ref={viewportRef}
          className="overflow-hidden py-5"
          role="region"
          aria-roledescription="carrousel"
          aria-label="Carrousel des fonctionnalités AWA"
          onMouseEnter={() => setHoverPaused(true)}
          onMouseLeave={() => setHoverPaused(false)}
          onMouseDown={(e) => {
            dragStartX.current = e.clientX;
          }}
          onMouseUp={(e) => {
            const delta = e.clientX - dragStartX.current;
            if (Math.abs(delta) > 50) {
              if (delta < 0) next();
              else prev();
            }
          }}
        >
          <motion.div
            className="flex gap-5"
            animate={{ x: -startIndex * cardStep }}
            transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 0.9 }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.article
                  key={feature.title}
                  className="group relative min-h-[310px] shrink-0 cursor-default overflow-hidden rounded-[2rem] border border-white bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(249,246,255,0.92))] p-7 shadow-[0_18px_50px_rgba(73,35,118,0.09)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-2 hover:border-primary/20 hover:shadow-[0_26px_65px_rgba(109,27,198,0.16)]"
                  style={{
                    flexBasis: `calc((100% - ${CARD_GAP * (visibleCount - 1)}px) / ${visibleCount})`,
                  }}
                  aria-label={`${index + 1} sur ${features.length} : ${feature.title}`}
                >
                  <div
                    className={cn(
                      'absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gradient-to-br opacity-[0.12] blur-2xl transition-transform duration-500 group-hover:scale-125',
                      feature.color
                    )}
                    aria-hidden="true"
                  />
                  <div
                    className={cn(
                      'absolute inset-x-8 top-0 h-[3px] rounded-b-full bg-gradient-to-r opacity-75',
                      feature.color
                    )}
                    aria-hidden="true"
                  />

                  <div className="relative mb-7 flex items-start justify-between">
                    <div
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_25px_rgba(109,27,198,0.22)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110',
                        feature.color
                      )}
                    >
                      <Icon size={24} strokeWidth={2.2} aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold tracking-[0.12em] text-primary/25">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="relative mb-3 text-lg font-bold leading-snug text-[#30213F]">
                    {feature.title}
                  </h3>
                  <p className="relative text-[13.5px] leading-6 text-muted-foreground">
                    {feature.description}
                  </p>

                  <div className="absolute bottom-6 left-7 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    AWA
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>

        {/* Pagination dots */}
        <div
          className="mt-7 flex flex-wrap justify-center gap-2"
          role="tablist"
          aria-label="Pages de fonctionnalités"
        >
          {Array.from({ length: maxStart + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setStartIndex(i)}
              role="tab"
              aria-selected={i === startIndex}
              aria-label={`Page de fonctionnalités ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === startIndex
                  ? 'w-8 bg-gradient-to-r from-primary to-accent shadow-[0_0_12px_rgba(109,27,198,0.35)]'
                  : 'w-1.5 bg-primary/20 hover:bg-primary/40'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
