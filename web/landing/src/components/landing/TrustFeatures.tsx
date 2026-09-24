'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CalendarDays, Sparkles, Heart } from 'lucide-react';
import { staggerContainer, fadeUp, viewportConfig } from '@/lib/animations';
import Icon from '@/components/ui/AppIcon';


const benefits = [
  {
    icon: ShieldCheck,
    title: 'Privé et sécurisé',
    description: 'Vos données vous appartiennent. Pas de publicité, jamais de revente de vos informations de santé.',
    color: 'from-[#6D1BC6] to-[#9A22CE]',
  },
  {
    icon: CalendarDays,
    title: 'Suivi du cycle',
    description: 'Enregistrez règles, symptômes et variations quotidiennes grâce à une interface intuitive et apaisante.',
    color: 'from-[#9A22CE] to-[#D51A9B]',
  },
  {
    icon: Sparkles,
    title: 'Analyses personnalisées',
    description: 'AWA apprend vos habitudes et vous propose des prédictions pertinentes, adaptées à vous.',
    color: 'from-[#D51A9B] to-[#FA0076]',
  },
  {
    icon: Heart,
    title: 'Pensé pour les femmes',
    description: 'Conçu avec soin autour de vrais besoins — pas un simple traqueur de santé repeint en rose.',
    color: 'from-[#FA0076] to-[#6D1BC6]',
  },
];

export default function TrustFeatures() {
  return (
    <section className="relative bg-white py-16 md:py-20 overflow-hidden" aria-label="Principaux avantages">
      <div className="max-w-[1240px] mx-auto px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {benefits?.map((item) => {
            const Icon = item?.icon;
            return (
              <motion.div
                key={item?.title}
                variants={fadeUp}
                className="group flex flex-col items-start gap-4 p-6 rounded-2xl border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item?.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={22} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-700 text-foreground mb-1.5">{item?.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item?.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}