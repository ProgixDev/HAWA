'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import { fadeUp, slideLeft, viewportConfig } from '@/lib/animations';
import { cn } from '@/lib/utils';

const storeButtons = [
  {
    label: 'App Store',
    sublabel: 'Télécharger dans l’',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
  {
    label: 'Google Play',
    sublabel: 'Disponible sur',
    icon: (
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <path d="M4 3.2 19.2 16 4 28.8Z" fill="#00C8F0" />
        <path d="m4 3.2 19.1 10.1-3.9 2.7Z" fill="#00E676" />
        <path d="m4 28.8 19.1-10.1-3.9-2.7Z" fill="#536DFE" />
        <path d="m23.1 13.3 4.5 2.4c.5.3.5.9 0 1.2l-4.5 1.8-3.9-2.7Z" fill="#FFCA28" />
      </svg>
    ),
  },
];

interface PhoneMockupProps {
  src: string;
  alt: string;
  className: string;
  rotate: number;
  delay?: number;
}

function PhoneMockup({ src, alt, className, rotate, delay = 0 }: PhoneMockupProps) {
  return (
    <div
      style={{
        rotate: `${rotate}deg`,
        ['--float-y' as string]: '-13px',
        ['--float-dur' as string]: `${6.5 + delay}s`,
        ['--float-delay' as string]: `${delay}s`,
      }}
      className={cn('float-loop absolute', className)}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2.8rem] border-[5px] border-[#211D29] bg-[#17131D] shadow-[0_32px_75px_rgba(23,8,45,0.42)]">
        <AppImage src={src} alt={alt} fill className="object-cover object-center" sizes="310px" />
        <div className="absolute left-1/2 top-4 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black shadow-sm" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
      </div>
    </div>
  );
}

export default function DownloadSection() {
  return (
    <section
      id="download"
      className="cv-auto [--cv-h-m:1196px] [--cv-h-t:997px] [--cv-h-d:715px] overflow-hidden bg-white py-20 md:py-28"
      aria-label="Télécharger AWA"
    >
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#6416C4] via-[#A511C1] to-[#EC087C] shadow-[0_35px_90px_rgba(108,25,171,0.25)] lg:min-h-[620px] lg:rounded-[3.25rem]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-28 -top-40 h-[34rem] w-[34rem] rounded-full bg-[#8A42ED]/45 blur-3xl" />
            <div className="absolute -bottom-56 left-[34%] h-[38rem] w-[38rem] rounded-full bg-[#F127A0]/35 blur-3xl" />
            <div className="absolute -right-28 -top-32 h-[31rem] w-[31rem] rounded-full border-[75px] border-white/[0.06]" />
            <div className="absolute left-[46%] top-[12%] h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.13),transparent_25%),linear-gradient(115deg,rgba(53,9,133,0.16),transparent_48%)]" />
          </div>

          <div className="relative grid min-h-[620px] lg:grid-cols-[0.88fr_1.12fr]">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              className="relative z-30 flex flex-col justify-center px-7 py-16 sm:px-12 lg:px-16 xl:px-20"
            >
              <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#FFC0E5] shadow-[0_0_12px_rgba(255,192,229,0.9)]" />
                Télécharger
              </span>

              <h2 className="mb-6 max-w-2xl text-[clamp(2.7rem,4.7vw,4.8rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-white">
                Emportez AWA
                <span className="block text-[#FFD4EC]">partout avec vous.</span>
              </h2>

              <p className="mb-9 max-w-xl text-base font-medium leading-relaxed text-white/85 sm:text-lg">
                Votre cycle, votre journal et vos repères vous accompagnent chaque jour dans une
                expérience calme, privée et intuitive.
              </p>

              <div className="mb-8 flex flex-wrap gap-3">
                {storeButtons.map((button) => (
                  <a
                    key={button.label}
                    href="#"
                    className="group flex min-h-[68px] min-w-[205px] items-center gap-3.5 rounded-2xl border border-white/15 bg-[#171A23] px-5 py-3 text-white shadow-[0_14px_32px_rgba(27,10,45,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#0F1117] hover:shadow-[0_18px_38px_rgba(27,10,45,0.38)]"
                    aria-label={`${button.sublabel} ${button.label}`}
                  >
                    <span className="flex w-9 shrink-0 items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      {button.icon}
                    </span>
                    <span>
                      <span className="block text-[11px] font-medium leading-none text-white/65">
                        {button.sublabel}
                      </span>
                      <span className="mt-1.5 block text-xl font-semibold leading-none tracking-[-0.02em]">
                        {button.label}
                      </span>
                    </span>
                  </a>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/75">
                <div className="flex gap-1" aria-label="4,8 étoiles sur 5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={17}
                      fill="currentColor"
                      className="text-[#FFD56B]"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="h-4 w-px bg-white/25" />
                <span>4,8/5 · Appréciée par les utilisatrices</span>
              </div>
            </motion.div>

            <motion.div
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              className="relative z-20 h-[490px] overflow-hidden lg:h-full"
            >
              <div className="absolute inset-x-[8%] bottom-[-8%] h-40 rounded-full bg-[#31075A]/35 blur-3xl" />

              <PhoneMockup
                src="/assets/images/clair.png"
                alt="Écran clair de personnalisation AWA"
                className="-top-16 left-[5%] z-10 h-[540px] w-[270px] lg:-top-24 lg:h-[610px] lg:w-[305px]"
                rotate={11}
              />
              <PhoneMockup
                src="/assets/images/dark.png"
                alt="Écran sombre de personnalisation AWA"
                className="left-[42%] top-10 z-20 h-[560px] w-[280px] lg:left-[43%] lg:top-7 lg:h-[640px] lg:w-[320px]"
                rotate={8}
                delay={0.8}
              />
              <PhoneMockup
                src="/assets/images/dark.png"
                alt="Écran sombre AWA"
                className="-bottom-[360px] -left-[8%] z-30 hidden h-[545px] w-[272px] lg:block"
                rotate={-10}
                delay={1.35}
              />

              <div
                style={{ ['--float-y' as string]: '-6px', ['--float-dur' as string]: '4.8s' }}
                className="float-loop absolute bottom-8 left-[8%] z-40 rounded-2xl border border-white/20 bg-white/12 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(36,8,66,0.25)] backdrop-blur-xl lg:bottom-14 lg:left-[18%]"
              >
                Privée · Intuitive · À votre rythme
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
