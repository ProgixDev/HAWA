'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChartDataPoint } from '@/types';

interface UserGrowthChartProps {
  data: ChartDataPoint[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-dropdown p-4 min-w-[180px]">
      <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
        {label}
      </p>
      {payload.map((entry) => (
        <div
          key={`tooltip-${entry.name}`}
          className="flex items-center justify-between gap-6 mb-1.5"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {new Intl.NumberFormat('fr-FR').format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradPremium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{
            fontSize: 11,
            fill: 'var(--muted-foreground)',
            fontFamily: 'var(--font-manrope)',
          }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          tick={{
            fontSize: 11,
            fill: 'var(--muted-foreground)',
            fontFamily: 'var(--font-manrope)',
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-manrope)', paddingTop: 16 }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Utilisatrices totales"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#gradTotal)"
          dot={false}
          activeDot={{ r: 5, fill: 'var(--primary)', strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="secondary"
          name="Abonnées Premium"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#gradPremium)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--success)', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
