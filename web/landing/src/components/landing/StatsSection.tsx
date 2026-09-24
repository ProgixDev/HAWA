'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Download, Activity, Star } from 'lucide-react';
import { staggerContainer, fadeUp, viewportConfig } from '@/lib/animations';

/* Demo/placeholder values — replace with real data */
const stats = [
  {
    icon: Users,
    value: 50000,
    suffix: '+',
    label: 'Utilisatrices ravies',
    gradient: 'from-[#7225D2] to-[#A829D8]',
    glow: 'bg-[#8D34D8]',
  },
  {
    icon: Download,
    value: 80000,
    suffix: '+',
    label: 'Téléchargements',
    gradient: 'from-[#9924D4] to-[#D51A9B]',
    glow: 'bg-[#C32AB9]',
  },
  {
    icon: Activity,
    value: 35000,
    suffix: '+',
    label: 'Utilisatrices actives',
    gradient: 'from-[#CF1DA8] to-[#F20778]',
    glow: 'bg-[#EB258E]',
  },
  {
    icon: Star,
    value: 4.8,
    suffix: '/5',
    label: 'Avis positifs',
    gradient: 'from-[#E61798] to-[#8A24D4]',
    glow: 'bg-[#B52BC6]',
    isFloat: true,
  },
];

function useCountUp(target: number, isFloat: boolean, active: boolean) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(isFloat ? parseFloat((eased * target).toFixed(1)) : Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, isFloat, active]);

  return count;
}

function StatCard({ stat, active }: { stat: (typeof stats)[number]; active: boolean }) {
  const Icon = stat.icon;
  const count = useCountUp(stat.value, stat.isFloat ?? false, active);

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -7 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative isolate overflow-hidden rounded-[2rem] border border-[#E9DFF4] bg-white/80 px-6 py-8 text-center shadow-[0_18px_55px_rgba(70,42,105,0.08)] backdrop-blur-xl md:px-7 md:py-9"
    >
      <div
        className={`absolute -right-12 -top-14 -z-10 h-36 w-36 rounded-full ${stat.glow} opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.13]`}
        aria-hidden="true"
      />
      <div
        className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${stat.gradient} shadow-[0_14px_30px_rgba(128,34,202,0.24)] ring-4 ring-white transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105`}
      >
        <Icon size={27} strokeWidth={2.1} className="text-white" aria-hidden="true" />
      </div>
      <div
        className={`mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-[clamp(2.5rem,4vw,3.35rem)] font-extrabold leading-none tracking-[-0.045em] text-transparent tabular-nums`}
      >
        {stat.isFloat ? count.toFixed(1) : count.toLocaleString('fr-FR')}
        <span className="ml-0.5 text-[0.72em]">{stat.suffix}</span>
      </div>
      <div className="text-base font-semibold text-[#625B70]">{stat.label}</div>
      <div
        className={`mx-auto mt-5 h-1 w-10 rounded-full bg-gradient-to-r ${stat.gradient} opacity-55 transition-all duration-300 group-hover:w-16 group-hover:opacity-100`}
        aria-hidden="true"
      />
    </motion.div>
  );
}

export default function StatsSection() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="cv-auto [--cv-h-m:1238px] [--cv-h-t:674px] [--cv-h-d:435px] relative overflow-hidden bg-gradient-to-b from-[#FCFAFF] via-[#F7F3FC] to-[#FCFAFF] py-20 md:py-24"
      aria-label="Statistiques"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 -top-32 h-80 w-80 rounded-full bg-[#C9A7F5]/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#F0A6CF]/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#DCCBED] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.55 }}
          className="mb-10 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5D8F2] bg-white/75 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7B34C6] shadow-[0_8px_24px_rgba(97,54,139,0.07)]">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#7A2BD0] to-[#EC178A]" />
            AWA en chiffres
          </span>
          <h2 className="mt-5 text-[clamp(2rem,3.2vw,3rem)] font-extrabold tracking-[-0.035em] text-[#30253E]">
            Une communauté qui grandit avec vous.
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} active={active} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
