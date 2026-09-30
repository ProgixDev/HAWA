'use client';

import React from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  SubscriptionDistributionItem,
  SubscriptionEvolutionPoint,
} from '@/types/subscriptions';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid var(--border)',
  boxShadow: '0 8px 32px rgba(59, 49, 70, 0.12)',
  fontSize: 12,
};

export function SubscriptionEvolutionChart({ data }: { data: SubscriptionEvolutionPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        Aucune donnée d’abonnement disponible pour cette période.
      </div>
    );
  }

  return (
    <div className="h-[340px] w-full" aria-label="Évolution des abonnements">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
          <CartesianGrid stroke="#E9DFE5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#73646F' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 8000]}
            ticks={[0, 2000, 4000, 6000, 8000]}
            tickFormatter={(value) => (value === 0 ? '0' : `${value / 1000}k`)}
            tick={{ fontSize: 11, fill: '#73646F' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend verticalAlign="top" align="center" height={46} wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#492D46"
            strokeWidth={2.25}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="newSubscriptions"
            name="Nouveaux"
            stroke="#C45F7C"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="cancelled"
            name="Annulés"
            stroke="#A95562"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubscriptionDistributionChart({ data }: { data: SubscriptionDistributionItem[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        Aucune donnée d’abonnement disponible pour cette période.
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[280px] w-full flex-wrap items-center justify-center gap-x-4 gap-y-3 pt-2"
      aria-label="Répartition des abonnements"
    >
      <div className="relative h-[210px] w-[210px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={61}
              outerRadius={90}
              paddingAngle={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} stroke="#ffffff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => Number(value).toLocaleString('fr-FR')}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-1 font-display text-[25px] font-bold text-foreground">
            {total.toLocaleString('fr-FR')}
          </p>
        </div>
      </div>
      <ul className="w-full min-w-[160px] max-w-[210px] flex-1 space-y-4">
        {data.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </span>
            <strong className="shrink-0 text-foreground">
              {Math.round((item.value / total) * 100)}%
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartSkeleton() {
  return <div className="h-[340px] animate-pulse rounded-xl bg-muted" />;
}
