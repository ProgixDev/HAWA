'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { month: 'Avr', free: 19840, premium: 3410 },
  { month: 'Mai', free: 20360, premium: 3620 },
  { month: 'Juin', free: 20980, premium: 3780 },
  { month: 'Jul', free: 21420, premium: 3940 },
  { month: 'Aoû', free: 20566, premium: 4280 },
  { month: 'Sep', free: 20566, premium: 4280 },
];

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
  const total = (payload[0]?.value ?? 0) + (payload[1]?.value ?? 0);
  const premiumVal = payload.find((p) => p.name === 'Premium')?.value ?? 0;
  const rate = total > 0 ? ((premiumVal / total) * 100).toFixed(1) : '0';

  return (
    <div className="bg-card border border-border rounded-2xl shadow-dropdown p-4 min-w-[180px]">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
        {label}
      </p>
      {payload.map((entry) => (
        <div
          key={`bar-tooltip-${entry.name}`}
          className="flex items-center justify-between gap-4 mb-1.5"
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
      <div className="mt-2 pt-2 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Taux Premium : <span className="font-bold text-primary">{rate}%</span>
        </p>
      </div>
    </div>
  );
}

export default function PremiumConversionChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{
            fontSize: 11,
            fill: 'var(--muted-foreground)',
            fontFamily: 'var(--font-manrope)',
          }}
          axisLine={false}
          tickLine={false}
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
          wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-manrope)', paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="free" name="FREE" fill="var(--primary-lighter)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="premium" name="Premium" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
