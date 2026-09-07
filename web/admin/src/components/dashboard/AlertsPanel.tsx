'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import type { AlertItem } from '@/types';

const severityConfig = {
  warning: {
    icon: <AlertTriangle size={15} />,
    bg: 'bg-warning-bg',
    border: 'border-warning/20',
    text: 'text-warning',
    dot: 'bg-warning',
    countBg: 'bg-warning text-white',
  },
  danger: {
    icon: <AlertCircle size={15} />,
    bg: 'bg-danger-bg',
    border: 'border-danger/20',
    text: 'text-danger',
    dot: 'bg-danger',
    countBg: 'bg-danger text-white',
  },
  info: {
    icon: <Info size={15} />,
    bg: 'bg-info-bg',
    border: 'border-info/20',
    text: 'text-info',
    dot: 'bg-info',
    countBg: 'bg-info text-white',
  },
};

interface AlertsPanelProps {
  alerts: AlertItem[];
}

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="space-y-2.5">
      {alerts.map((alert, idx) => {
        const cfg = severityConfig[alert.severity];
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.07 }}
          >
            <Link href={alert.href}>
              <div
                className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border} hover:shadow-sm transition-all duration-200 cursor-pointer group`}
              >
                <div className={`flex-shrink-0 ${cfg.text}`}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    <span className={`font-bold ${cfg.text}`}>{alert.count}</span> {alert.label}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className={`flex-shrink-0 ${cfg.text} opacity-0 group-hover:opacity-100 transition-opacity`}
                />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
