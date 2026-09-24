'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  Baby,
  BarChart3,
  ChevronRight,
  Download,
  Droplet,
  Feather,
  Flower2,
  Heart,
  Leaf,
  Moon,
  ShieldCheck,
  Sprout,
  Star,
} from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import AnimatedBackground from './AnimatedBackground';
import { cn } from '@/lib/utils';

const heroScreenshots = [
  {
    src: '/assets/images/awa_apk.png',
    alt: 'Présentation de l’application AWA sur deux téléphones aux tons violets',
  },
  {
    src: '/assets/images/screen1.1.png',
    alt: 'Photo d’une main tenant un téléphone affichant l’écran calendrier AWA avec suivi du cycle, jours de règles, fenêtre fertile et ovulation',
  },
  {
    src: '/assets/images/screen2.2.png',
    alt: 'Photo d’une main tenant un téléphone affichant l’écran des horaires de prière AWA avec la prochaine prière et les horaires du jour',
  },
  {
    src: '/assets/images/screen4.4.png',
    alt: 'Photo d’une main tenant un téléphone affichant l’écran de la bibliothèque AWA avec les catégories d’articles santé et pratique religieuse',
  },
  {
    src: '/assets/images/screen5.5.png',
    alt: 'Photo d’une main tenant un téléphone affichant l’écran « À la une » de la bibliothèque AWA avec un article sur les phases du cycle',
  },
];

const lifeStages = [
  {
    label: 'Suivre mon cycle',
    icon: Droplet,
    color: '#F45B8D',
    background: '#FDEAF1',
  },
  {
    label: 'Essayer de concevoir',
    icon: Sprout,
    color: '#45AB8B',
    background: '#EAF7F4',
  },
  {
    label: 'Gérer ma contraception',
    icon: ShieldCheck,
    color: '#6F7EF7',
    background: '#EDF0FF',
  },
  {
    label: 'Cycles irréguliers & SOPK',
    icon: Flower2,
    color: '#D96BD3',
    background: '#FAECFA',
  },
  {
    label: 'Périménopause & ménopause',
    icon: Leaf,
    color: '#6ABA6A',
    background: '#EDF8EB',
  },
  {
    label: 'Suivre ma grossesse',
    icon: Baby,
    color: '#7288F5',
    background: '#EEF1FF',
  },
  {
    label: 'Post-partum',
    icon: Heart,
    color: '#EB5C92',
    background: '#FDEBF2',
  },
  {
    label: 'Après une fausse couche',
    icon: Star,
    color: '#F0A653',
    background: '#FFF2E3',
  },
];

const heroFloatingCards = [
  {
    label: 'Mieux comprendre votre corps',
    icon: Feather,
    position: '-left-[13rem] top-10',
    delay: 0.2,
  },
  {
    label: 'Des repères spirituels si vous le souhaitez',
    icon: Moon,
    position: '-left-[13.5rem] bottom-16',
    delay: 1.1,
  },
  {
    label: 'À chaque étape de votre vie',
    icon: Heart,
    position: '-right-[13rem] top-8',
    delay: 0.7,
  },
  {
    label: 'Vos données vous appartiennent',
    icon: ShieldCheck,
    position: '-right-[13.75rem] top-[11.5rem]',
    delay: 1.5,
  },
  {
    label: 'Des statistiques claires et utiles',
    icon: BarChart3,
    position: '-right-[13rem] bottom-14',
    delay: 2.1,
  },
];

export default function HeroSection() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const phoneRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 80, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % heroScreenshots.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!phoneRef.current || window.innerWidth < 768) return;
    const rect = phoneRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    rotateY.set(dx * 8);
    rotateX.set(-dy * 6);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden lg:min-h-[900px]"
      aria-label="Section principale"
    >
      <AnimatedBackground variant="hero" />

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 pt-24 pb-0 w-full">
        <div className="grid min-h-[calc(100vh-96px)] items-center gap-12 lg:grid-cols-2 lg:gap-8 lg:pb-32">
          {/* Left: Copy */}
          <div className="flex flex-col items-start justify-center lg:pr-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.09] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md sm:text-xs"
            >
              <span className="h-2 w-2 rounded-full bg-[#54DE82] shadow-[0_0_9px_rgba(84,222,130,0.8)]" />
              Votre corps. Votre parcours. Votre intimité.
            </motion.div>

            {/* Headline */}
            <div className="overflow-hidden mb-6">
              <motion.h1
                className="text-[clamp(2.65rem,4.5vw,4rem)] font-extrabold leading-[1.01] tracking-[-0.045em] text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.1)]"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                Chaque étape de votre vie mérite un suivi{' '}
                <span
                  className="inline"
                  style={{
                    WebkitTextFillColor: 'transparent',
                    background: 'linear-gradient(90deg, #F6B3DA 0%, #EF8FCC 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  qui vous ressemble.
                </span>
              </motion.h1>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mb-8 max-w-xl text-[16px] font-medium leading-[1.55] text-[#F1E5F7] sm:text-[17px]"
            >
              AWA vous accompagne à chaque étape de votre santé féminine : cycle, fertilité,
              contraception, SOPK, périménopause, grossesse, post-partum et après une fausse couche.
              Un suivi personnalisé, intime et sécurisé, pensé pour évoluer avec vous.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="mb-10 flex flex-wrap gap-4"
            >
              <a
                href="#download"
                className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#F064B8] to-[#C62BD7] px-8 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(167,25,194,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(167,25,194,0.48)]"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Download size={18} strokeWidth={2.7} aria-hidden="true" />
                Télécharger AWA
              </a>
              <a
                href="#features"
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-2 border-white/75 bg-white/[0.03] px-8 text-[15px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Découvrir AWA
                <ChevronRight size={18} strokeWidth={2.7} aria-hidden="true" />
              </a>
            </motion.div>
          </div>

          {/* Right: Phone */}
          <motion.div
            ref={phoneRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center items-center h-[540px] lg:h-auto"
            style={{ perspective: 1200 }}
          >
            <motion.div
              style={{ rotateX: springX, rotateY: springY }}
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
              className="relative"
            >
              {/* Main phone */}
              <div
                className="relative w-[260px] h-[520px] rounded-[2.5rem] overflow-hidden shadow-2xl phone-glow"
                style={{
                  background: '#0a0a0a',
                  border: '3px solid rgba(255,255,255,0.15)',
                  boxShadow:
                    '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
              >
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />

                {/* Screen content */}
                <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
                  {heroScreenshots.map((screen, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0"
                      animate={{
                        opacity: i === currentScreen ? 1 : 0,
                        scale: i === currentScreen ? 1 : 1.05,
                      }}
                      transition={{ duration: 0.8, ease: 'easeInOut' }}
                    >
                      <AppImage
                        src={screen.src}
                        alt={screen.alt}
                        fill
                        className="object-cover"
                        priority={i === 0}
                        sizes="260px"
                      />
                    </motion.div>
                  ))}
                  {/* Screen overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
                    }}
                  />
                </div>

                {/* Side buttons */}
                <div className="absolute right-[-4px] top-24 w-1 h-12 bg-gray-700 rounded-l-sm" />
                <div className="absolute left-[-4px] top-20 w-1 h-8 bg-gray-700 rounded-r-sm" />
                <div className="absolute left-[-4px] top-32 w-1 h-8 bg-gray-700 rounded-r-sm" />
              </div>

              {/* Screen dots */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5">
                {heroScreenshots.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentScreen(i)}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === currentScreen ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                    )}
                    aria-label={`Afficher la capture ${i + 1}`}
                  />
                ))}
              </div>

              {/* Floating cards around the phone */}
              {heroFloatingCards.map((card, index) => {
                const FloatingIcon = card.icon;

                return (
                  <motion.div
                    key={card.label}
                    animate={{ y: [0, -7 - (index % 3) * 2, 0] }}
                    transition={{
                      duration: 4.6 + index * 0.35,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      delay: card.delay,
                    }}
                    className={cn(
                      'absolute z-20 hidden w-[195px] items-center gap-3.5 rounded-[1.35rem] border border-white/20 bg-gradient-to-br from-white/[0.18] to-[#F06BC8]/[0.16] px-4 py-3.5 text-white shadow-[0_16px_38px_rgba(31,5,69,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl xl:flex',
                      card.position
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.12] text-[#FFD2EE] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                      <FloatingIcon size={22} strokeWidth={2.35} aria-hidden="true" />
                    </span>
                    <span className="text-[12px] font-bold leading-[1.3] text-white/95">
                      {card.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Women’s health journeys — positioned in the white space below the phone. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 mx-auto mb-6 mt-3 w-[calc(100%-2rem)] max-w-[1420px] rounded-[1.75rem] border border-white/80 bg-white/[0.94] px-3 py-4 shadow-[0_20px_55px_rgba(54,14,91,0.12)] backdrop-blur-xl sm:px-5 lg:absolute lg:bottom-6 lg:left-6 lg:right-6 lg:mb-0 lg:mt-0 lg:w-auto"
        aria-label="Les parcours de santé accompagnés par AWA"
      >
        <div className="grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-4 lg:grid-cols-8 lg:gap-2">
          {lifeStages.map((stage) => {
            const StageIcon = stage.icon;

            return (
              <div
                key={stage.label}
                className="group flex min-w-0 flex-col items-center gap-2.5 rounded-2xl px-1 py-1 text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: stage.background, color: stage.color }}
                >
                  <StageIcon size={21} strokeWidth={2.4} aria-hidden="true" />
                </span>
                <span className="max-w-[9.5rem] text-[11px] font-semibold leading-[1.25] text-[#43267A] xl:text-xs">
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Asymmetric background cut-out; content stays above it so the phone floats into white space. */}
      <div
        className="absolute bottom-[-1px] left-0 z-[1] w-full leading-none pointer-events-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 330"
          preserveAspectRatio="none"
          className="block h-[180px] w-full md:h-[250px] lg:h-[330px]"
        >
          <path
            d="M0,105 C105,235 230,310 355,300 C500,290 650,155 790,92 C875,54 930,78 1000,124 C1105,192 1195,222 1295,132 C1350,82 1395,70 1440,70 L1440,330 L0,330 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
}
