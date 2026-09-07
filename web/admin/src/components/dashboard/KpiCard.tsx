'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Star,
  TrendingUp,
  UserPlus,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import type { KpiMetric } from '@/types';

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={20} />,
  Activity: <Activity size={20} />,
  Star: <Star size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  UserPlus: <UserPlus size={20} />,
  Percent: <Percent size={20} />,
};

const colorConfig = {
  primary: {
    icon: 'text-primary',
    iconBg: 'bg-primary-pale',
    badge: 'bg-primary-pale text-primary',
  },
  success: {
    icon: 'text-success',
    iconBg: 'bg-success-bg',
    badge: 'bg-success-bg text-success',
  },
  warning: {
    icon: 'text-warning',
    iconBg: 'bg-warning-bg',
    badge: 'bg-warning-bg text-warning',
  },
  danger: {
    icon: 'text-danger',
    iconBg: 'bg-danger-bg',
    badge: 'bg-danger-bg text-danger',
  },
  info: {
    icon: 'text-info',
    iconBg: 'bg-info-bg',
    badge: 'bg-info-bg text-info',
  },
};

interface KpiCardProps {
  metric: KpiMetric;
  index: number;
}

export default function KpiCard({ metric, index }: KpiCardProps) {
  const colors = colorConfig[metric.color];
  const TrendIcon =
    metric.trend === 'up' ? ArrowUpRight : metric.trend === 'down' ? ArrowDownRight : Minus;
  const trendColor =
    metric.trend === 'up'
      ? 'text-success'
      : metric.trend === 'down'
        ? 'text-danger'
        : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      className="stat-card group relative overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-5 transition-opacity group-hover:opacity-10"
        style={{ background: 'var(--primary)' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${colors.iconBg}`}>
            <span className={colors.icon}>{iconMap[metric.icon]}</span>
          </div>
          {metric.change !== undefined && (
            <div
              className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold ${
                metric.trend === 'up'
                  ? 'bg-success-bg text-success'
                  : metric.trend === 'down'
                    ? 'bg-danger-bg text-danger'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <TrendIcon size={12} />
              {Math.abs(metric.change)}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {metric.label}
          </p>
          <div className="font-display text-2xl font-bold text-foreground">
            <AnimatedCounter
              value={
                typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value))
              }
              format={metric.format ?? 'number'}
              duration={1000 + index * 100}
            />
          </div>
          {metric.changeLabel && (
            <p className="text-xs text-muted-foreground">{metric.changeLabel}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
