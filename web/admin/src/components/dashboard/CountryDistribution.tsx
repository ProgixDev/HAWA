'use client';

import React from 'react';
import { motion } from 'framer-motion';

const countryData = [
  { country: 'France', users: 11240, premium: 2140, flag: '🇫🇷', pct: 45.2 },
  { country: 'Algérie', users: 6820, premium: 980, flag: '🇩🇿', pct: 27.5 },
  { country: 'Maroc', users: 4180, premium: 740, flag: '🇲🇦', pct: 16.8 },
  { country: 'Tunisie', users: 1640, premium: 280, flag: '🇹🇳', pct: 6.6 },
  { country: 'Belgique', users: 620, premium: 110, flag: '🇧🇪', pct: 2.5 },
  { country: 'Canada', users: 346, premium: 30, flag: '🇨🇦', pct: 1.4 },
];

export default function CountryDistribution() {
  return (
    <div className="space-y-3">
      {countryData?.map((c, idx) => (
        <motion.div
          key={`country-${c?.country}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.06 }}
          className="flex items-center gap-3 group"
        >
          <span className="text-lg flex-shrink-0 w-6 text-center">{c?.flag}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{c?.country}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {new Intl.NumberFormat('fr-FR')?.format(c?.users)}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--muted)' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c?.pct}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, var(--primary) 0%, var(--primary-lighter) 100%)',
                }}
              />
            </div>
          </div>
          <span className="text-xs font-bold text-muted-foreground tabular-nums w-10 text-right flex-shrink-0">
            {c?.pct}%
          </span>
        </motion.div>
      ))}
    </div>
  );
}
