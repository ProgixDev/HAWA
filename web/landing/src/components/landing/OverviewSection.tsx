'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Baby,
  Bell,
  Droplet,
  EyeOff,
  FileText,
  Flower2,
  Heart,
  Leaf,
  ScanFace,
  ShieldCheck,
  Smile,
  Sprout,
  Star,
} from 'lucide-react';
import AppImage from '@/components/ui/AppImage';
import SectionHeading from './SectionHeading';
import AnimatedBackground from './AnimatedBackground';
import { staggerContainer, fadeUp } from '@/lib/animations';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'journey',
    label: 'Mon parcours',
    heading: '8 parcours personnalisés',
    intro:
      'Choisissez votre objectif : AWA adapte votre expérience et ses outils à l’étape de vie qui vous correspond.',
    sideNote: 'Un accompagnement à chaque étape de votre vie',
    screen: {
      src: '/assets/images/screen_objectif.jpg',
      alt: 'Écran AWA « Quel est ton objectif principal ? » proposant huit parcours personnalisés',
    },
    features: [
      {
        icon: Droplet,
        title: 'Suivre mon cycle',
        desc: 'Suivez vos règles et comprenez les variations de votre cycle.',
        color: '#F45B8D',
        background: '#FDE8F0',
      },
      {
        icon: Sprout,
        title: 'Essayer de concevoir',
        desc: 'Un suivi dédié pour optimiser votre fertilité.',
        color: '#7A46DF',
        background: '#EEE7FF',
      },
      {
        icon: ShieldCheck,
        title: 'Gérer ma contraception',
        desc: 'Des rappels et un suivi adaptés à votre méthode.',
        color: '#5577EA',
        background: '#E7EDFF',
      },
      {
        icon: Flower2,
        title: 'Cycles irréguliers & SOPK',
        desc: 'Un accompagnement pour mieux comprendre vos cycles et vos symptômes.',
        color: '#E67682',
        background: '#FFE9E8',
      },
      {
        icon: Leaf,
        title: 'Périménopause & ménopause',
        desc: 'Suivez vos symptômes et cette nouvelle étape de vie.',
        color: '#9859D9',
        background: '#F0E7FA',
      },
      {
        icon: Baby,
        title: 'Suivre ma grossesse',
        desc: 'Un accompagnement semaine après semaine.',
        color: '#E963A8',
        background: '#FDE8F4',
      },
      {
        icon: Heart,
        title: 'Post-partum',
        desc: 'Suivez votre récupération et le retour de votre cycle.',
        color: '#42AF8C',
        background: '#E1F6EF',
      },
      {
        icon: Star,
        title: 'Après une fausse couche',
        desc: 'Un espace bienveillant pour vous accompagner.',
        color: '#EC9C4C',
        background: '#FFF0DE',
      },
    ],
  },
  {
    id: 'daily',
    label: 'Mon quotidien',
    heading: 'Votre bien-être, jour après jour.',
    intro:
      'AWA rassemble votre suivi quotidien dans un espace simple et intuitif pour mieux observer vos ressentis et comprendre leur évolution.',
    sideNote: 'Un suivi simple au quotidien',
    screen: {
      src: '/assets/images/screen_journal.jpg',
      alt: 'Écran AWA « Journal quotidien » proposant le suivi du symptôme, de l’humeur, de l’activité physique et du sommeil',
    },
    features: [
      {
        icon: Droplet,
        title: 'Suivi des symptômes',
        desc: 'Notez vos symptômes et leur intensité au fil des jours.',
        color: '#ED278C',
        background: '#FFD6E8',
      },
      {
        icon: Smile,
        title: 'Humeur & bien-être',
        desc: 'Suivez votre humeur, votre énergie, votre sommeil et vos ressentis.',
        color: '#7650EF',
        background: '#E7E2FF',
      },
      {
        icon: FileText,
        title: 'Journal personnel',
        desc: 'Ajoutez vos notes et observations dans votre espace personnel.',
        color: '#3979DE',
        background: '#DFF2FF',
      },
      {
        icon: Bell,
        title: 'Rappels personnalisés',
        desc: 'Recevez les rappels utiles adaptés à votre suivi et à votre parcours.',
        color: '#E73C9C',
        background: '#FAD9EB',
      },
    ],
  },
  {
    id: 'privacy',
    label: 'Ma confidentialité',
    heading: 'Votre intimité reste entre vos mains.',
    intro:
      'AWA est pensée pour vous permettre de suivre votre santé tout en gardant le contrôle sur vos informations personnelles.',
    sideNote: 'Vos données, votre choix',
    screen: {
      src: '/assets/images/anonyme.jpg',
      alt: 'Écran AWA « Mode anonyme » permettant d’utiliser l’application sans associer son identité réelle',
    },
    features: [
      {
        icon: ScanFace,
        title: 'Mode anonyme',
        desc: 'Utilisez AWA avec un pseudonyme, sans afficher votre identité réelle.',
        color: '#7A3CE1',
        background: '#E9DEFF',
      },
      {
        icon: ShieldCheck,
        title: 'Données sensibles protégées',
        desc: 'Vos informations intimes bénéficient d’une protection renforcée.',
        color: '#7358E8',
        background: '#E7E5FF',
      },
      {
        icon: EyeOff,
        title: 'Accès privé',
        desc: 'Protégez l’accès à l’application et à vos espaces sensibles.',
        color: '#8156E5',
        background: '#EBE4FF',
      },
      {
        icon: FileText,
        title: 'Contrôle de vos données',
        desc: 'Consultez, exportez ou supprimez vos informations lorsque vous en avez besoin.',
        color: '#EB5FA4',
        background: '#FFE2EF',
      },
    ],
  },
];

export default function OverviewSection() {
  const [activeTab, setActiveTab] = useState('journey');

  const currentTab = tabs?.find((t) => t?.id === activeTab) ?? tabs?.[0];
  const compactList = currentTab.features.length > 4;

  return (
    <section
      id="overview"
      className="cv-auto [--cv-h-m:1560px] [--cv-h-t:1420px] [--cv-h-d:957px] relative overflow-hidden pb-36 pt-20 md:pb-44 md:pt-24"
      aria-label="Aperçu : pourquoi AWA"
    >
      <AnimatedBackground variant="gradient" />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(150,65,216,0.34),transparent_38%),linear-gradient(115deg,rgba(34,14,126,0.4),transparent_48%,rgba(222,54,159,0.18))]" />
        <div className="absolute -right-40 top-12 h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <div className="absolute -left-64 bottom-[-8rem] h-[30rem] w-[44rem] rotate-12 rounded-[50%] border border-white/15" />
        <div className="absolute -left-48 bottom-[-11rem] h-[26rem] w-[40rem] rotate-6 rounded-[50%] border border-[#E792DD]/30" />
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6">
        <SectionHeading
          eyebrow="Pourquoi AWA"
          title="Une expérience qui s’adapte<br/><span style='color:#F1B4E0'>à votre parcours.</span>"
          subtitle="AWA vous accompagne avec des outils personnalisés selon votre objectif, votre rythme et chaque étape de votre vie."
          light
          className="mb-7"
          titleClassName="text-[clamp(2rem,4vw,3.35rem)] font-extrabold tracking-[-0.035em]"
        />

        {/* Tabs */}
        <div className="mb-12 flex justify-center">
          <div className="flex w-full max-w-[650px] gap-1 rounded-full border border-white/20 bg-[#351080]/35 p-1 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex-1 rounded-full px-3 py-3 text-xs font-semibold transition-colors duration-300 sm:text-sm',
                  activeTab === tab.id ? 'text-white' : 'text-white/70 hover:text-white'
                )}
                aria-pressed={activeTab === tab.id}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="overview-active-tab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F365B8] to-[#A936F1] shadow-[0_8px_22px_rgba(180,46,218,0.38),inset_0_1px_0_rgba(255,255,255,0.28)]"
                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Phone */}
          <div className="relative isolate order-2 flex justify-center lg:order-1">
            {/* Tight wrapper sized to the phone itself, so the floating card
                (an absolutely-positioned child) is placed relative to the
                phone's real edge instead of this column's wider centered
                flex box — otherwise its position can land on top of the
                phone at viewport widths where the column has less spare
                width than the card needs. */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`note-${activeTab}`}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.35 }}
                  className="absolute right-full top-[30%] z-30 mr-4 hidden w-36 flex-col items-center gap-2 rounded-[1.6rem] border border-white/25 bg-white/15 px-3 py-3 text-center text-xs font-semibold leading-[1.45] text-white shadow-[0_16px_40px_rgba(20,5,70,0.3)] backdrop-blur-2xl xl:flex 2xl:w-[220px] 2xl:flex-row 2xl:items-center 2xl:gap-4 2xl:px-5 2xl:py-4 2xl:mr-5 2xl:text-left 2xl:text-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 shadow-inner">
                    <Heart
                      size={20}
                      fill="currentColor"
                      className="text-white"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-pretty">{currentTab.sideNote}</span>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 30, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10"
                >
                  <div className="float-loop relative">
                    <div
                      className="w-[240px] h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl"
                      style={{
                        background: '#0a0a0a',
                        border: '3px solid rgba(255,255,255,0.18)',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10" />
                      <AppImage
                        src={currentTab?.screen?.src}
                        alt={currentTab?.screen?.alt}
                        fill
                        className="object-contain"
                        sizes="240px"
                      />

                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
                        }}
                      />
                    </div>
                    {/* Glow */}
                    <div
                      className="absolute -inset-8 rounded-full blur-3xl opacity-40 pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(ellipse, rgba(250,0,118,0.4) 0%, transparent 70%)',
                      }}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Feature list */}
          <div className="order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
              >
                <motion.h3
                  variants={fadeUp}
                  className="mb-2 text-2xl font-extrabold leading-tight text-white md:text-[2rem]"
                >
                  {currentTab.heading}
                </motion.h3>
                <motion.p
                  variants={fadeUp}
                  className="mb-7 max-w-xl text-sm leading-relaxed text-white/70 md:text-base"
                >
                  {currentTab.intro}
                </motion.p>

                <div className={cn(compactList ? 'space-y-2.5' : 'space-y-5')}>
                  {currentTab.features.map((feat) => {
                    const FeatureIcon = feat.icon;

                    return (
                      <motion.div
                        key={feat.title}
                        variants={fadeUp}
                        className="group flex items-start gap-4"
                      >
                        <div
                          className={cn(
                            'flex shrink-0 items-center justify-center rounded-full border border-white/25 shadow-[0_8px_22px_rgba(25,8,76,0.16)] transition-transform duration-300 group-hover:scale-110',
                            compactList ? 'h-11 w-11' : 'h-14 w-14'
                          )}
                          style={{ backgroundColor: feat.background, color: feat.color }}
                        >
                          <FeatureIcon
                            size={compactList ? 20 : 24}
                            strokeWidth={2.3}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="pt-0.5">
                          <h4
                            className={cn(
                              'mb-0.5 font-bold leading-snug text-white',
                              compactList ? 'text-sm' : 'text-base md:text-lg'
                            )}
                          >
                            {feat.title}
                          </h4>
                          <p
                            className={cn(
                              'leading-relaxed text-white/65',
                              compactList ? 'text-xs' : 'text-sm md:text-base'
                            )}
                          >
                            {feat.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full" aria-hidden="true">
        <svg viewBox="0 0 1440 130" preserveAspectRatio="none" className="h-24 w-full md:h-32">
          <path
            d="M0,42 C240,88 420,112 650,88 C860,66 1060,18 1240,46 C1320,58 1385,46 1440,30 L1440,130 L0,130 Z"
            fill="rgba(239,151,220,0.42)"
          />
          <path
            d="M0,65 C245,105 445,126 670,102 C900,77 1080,38 1260,65 C1335,76 1392,62 1440,50 L1440,130 L0,130 Z"
            fill="rgba(246,192,230,0.72)"
          />
          <path
            d="M0,88 C270,119 470,134 700,115 C930,96 1115,68 1280,85 C1350,92 1400,84 1440,76 L1440,130 L0,130 Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </section>
  );
}
