'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { CURRENT_ADMIN } from '@/config/admin';

const dateRanges = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: '3m', label: '3 mois' },
  { id: '12m', label: '12 mois' },
];

export default function DashboardHeader() {
  const [selectedRange, setSelectedRange] = useState('30d');

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Bonjour, {CURRENT_ADMIN.name} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Voici un aperçu de l&apos;activité AWA aujourd&apos;hui.
        </p>
      </div>

      <div className="flex items-center gap-2 p-1 rounded-xl border border-border bg-card shadow-card flex-shrink-0">
        <CalendarDays size={15} className="text-muted-foreground ml-2" />
        {dateRanges?.map((range) => (
          <button
            key={range?.id}
            onClick={() => setSelectedRange(range?.id)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              selectedRange === range?.id
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {selectedRange === range?.id && (
              <motion.div
                layoutId="date-range-bg"
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{range?.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
