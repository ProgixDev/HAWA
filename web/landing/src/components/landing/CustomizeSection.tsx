'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Paintbrush, Palette, RotateCcw, Sparkles } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import { slideLeft, slideRight, viewportConfig } from '@/lib/animations';

const customizationFeatures = [
  { icon: Palette, label: 'Choisissez entre le mode clair et le mode sombre' },
  { icon: Paintbrush, label: 'Découvrez plusieurs thèmes et palettes de couleurs' },
  { icon: Sparkles, label: 'Adaptez l’ambiance visuelle à vos préférences' },
  { icon: RotateCcw, label: 'Changez de thème à tout moment' },
];

const storeButtons = [
  {
    label: 'App Store',
    sublabel: 'Télécharger dans l’',
    href: '#download',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    label: 'Google Play',
    sublabel: 'Disponible sur',
    href: '#download',
    icon: (
      <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
        <path d="M4 3.2 19.2 16 4 28.8Z" fill="#00C8F0" />
        <path d="m4 3.2 19.1 10.1-3.9 2.7Z" fill="#00E676" />
        <path d="m4 28.8 19.1-10.1-3.9-2.7Z" fill="#536DFE" />
        <path d="m23.1 13.3 4.5 2.4c.5.3.5.9 0 1.2l-4.5 1.8-3.9-2.7Z" fill="#FFCA28" />
      </svg>
    ),
  },
];

export default function CustomizeSection() {
  const scrollToDownload = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="relative overflow-hidden bg-[#FCFBFF] pb-20 pt-24 md:pb-24 md:pt-32"
      aria-label="Personnalisation"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-32 -top-52 h-[52rem] w-[52rem] rounded-full border-[95px] border-[#F1E8FF]/70" />
        <div className="absolute right-[8%] top-[12%] h-[34rem] w-[34rem] rounded-full bg-[#EDE1FF]/45 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <motion.div
            variants={slideRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="flex flex-col"
          >
            <span className="mb-6 inline-flex w-fit items-center rounded-full bg-[#F1E9FA] px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#8040C8]">
              Personnalisation
            </span>

            <h2 className="mb-6 font-serif text-[clamp(2.5rem,4.2vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-[#252735]">
              AWA, selon
              <span className="mt-2 block bg-gradient-to-r from-[#7135D4] via-[#AC31D2] to-[#E12A9B] bg-clip-text text-transparent sm:whitespace-nowrap">
                vos préférences.
              </span>
            </h2>

            <p className="mb-8 max-w-xl text-lg leading-[1.65] text-[#77768B] md:text-xl">
              Personnalisez l’apparence d’AWA pour créer une expérience visuelle qui vous ressemble,
              de jour comme de nuit.
            </p>

            <div className="mb-9 space-y-3.5">
              {customizationFeatures.map((feature, index) => {
                const FeatureIcon = feature.icon;

                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="group flex items-center gap-4"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F4ECFF] to-[#E9D9FF] text-[#8536D2] shadow-[0_8px_22px_rgba(108,45,187,0.1)] transition-transform duration-300 group-hover:scale-110">
                      <FeatureIcon size={22} strokeWidth={2.25} aria-hidden="true" />
                    </span>
                    <span className="text-[15px] font-medium leading-snug text-[#39354A] md:text-base">
                      {feature.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mb-5 flex flex-wrap gap-4">
              {storeButtons.map((button) => (
                <a
                  key={button.label}
                  href={button.href}
                  onClick={scrollToDownload}
                  className="group flex min-h-[76px] min-w-[235px] items-center gap-4 rounded-[2rem] bg-gradient-to-b from-[#28303F] to-[#1B202B] px-7 py-3.5 text-white shadow-[0_14px_32px_rgba(26,31,43,0.2)] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(26,31,43,0.28)]"
                  aria-label={`${button.sublabel} ${button.label}`}
                >
                  <span className="flex w-10 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    {button.icon}
                  </span>
                  <span>
                    <span className="block text-xs font-medium leading-none text-white/70">
                      {button.sublabel}
                    </span>
                    <span className="mt-1.5 block text-[1.45rem] font-semibold leading-none tracking-[-0.02em]">
                      {button.label}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <p className="text-sm text-[#9591A5]">
              AWA sera bientôt disponible sur iOS et Android.
            </p>
          </motion.div>

          <motion.div
            variants={slideLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportConfig}
            className="relative mx-auto flex h-[610px] w-full max-w-[680px] items-center justify-center lg:h-[680px]"
          >
            <div className="pointer-events-none absolute inset-x-[8%] bottom-[4%] h-32 rounded-full bg-[#8B45D0]/25 blur-3xl" />

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6.2, ease: 'easeInOut', repeat: Infinity }}
              className="absolute left-[5%] top-[5%] z-20"
              style={{ rotate: -5 }}
            >
              <div className="relative h-[550px] w-[275px] overflow-hidden rounded-[3rem] border-[4px] border-[#28232D] bg-white shadow-[0_35px_85px_rgba(61,35,94,0.28)] lg:h-[610px] lg:w-[305px]">
                <div className="absolute left-1/2 top-4 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
                <AppImage
                  src="/assets/images/clair.png"
                  alt="Présentation AWA dans le téléphone en thème clair"
                  fill
                  className="object-cover object-center"
                  sizes="(min-width: 1024px) 305px, 275px"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-[#6D1BC6]/5" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -9, 0] }}
              transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity, delay: 0.9 }}
              className="absolute right-[3%] top-[8%] z-10"
              style={{ rotate: 6 }}
            >
              <div className="relative h-[520px] w-[260px] overflow-hidden rounded-[2.85rem] border-[4px] border-[#211C29] bg-[#17121F] shadow-[0_30px_75px_rgba(43,24,68,0.3)] lg:h-[575px] lg:w-[288px]">
                <div className="absolute left-1/2 top-4 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
                <AppImage
                  src="/assets/images/dark.png"
                  alt="Présentation AWA dans le téléphone en thème sombre"
                  fill
                  className="object-cover object-center"
                  sizes="(min-width: 1024px) 288px, 260px"
                />
                <div className="pointer-events-none absolute inset-0 bg-[#171121]/20 mix-blend-multiply" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-black/20" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
              className="absolute right-0 top-[30%] hidden max-w-[150px] text-center font-serif text-lg italic leading-snug text-[#8E55D2] xl:block"
            >
              Un thème pour chaque humeur
              <span className="mx-auto mt-2 block h-px w-14 bg-[#A96ADC]" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
