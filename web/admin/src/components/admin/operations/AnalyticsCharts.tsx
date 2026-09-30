'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AnalyticsDataset } from '@/types/adminOperations';

const tooltipStyle = {
  border: '1px solid #E9DFE5',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(59,49,70,0.1)',
  fontSize: 12,
};

const formatNumber = (value: number) => value.toLocaleString('fr-FR');

export function AnalyticsUserGrowthChart({ data }: { data: AnalyticsDataset['userGrowth'] }) {
  if (!data.length) {
    return <ChartEmptyState />;
  }
  return (
    <div className="h-[330px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="analyticsTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#492D46" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#492D46" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="analyticsActive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C45F7C" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#C45F7C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E9DFE5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#716a78' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#716a78' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
            width={42}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatNumber(Number(value))} />
          <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#492D46"
            strokeWidth={2.4}
            fill="url(#analyticsTotal)"
          />
          <Area
            type="monotone"
            dataKey="active"
            name="Actives"
            stroke="#C45F7C"
            strokeWidth={2.2}
            fill="url(#analyticsActive)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AcquisitionChart({ data }: { data: AnalyticsDataset['acquisition'] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <ChartEmptyState />;
  return (
    <div className="flex min-h-[280px] w-full flex-wrap items-center justify-center gap-x-4 gap-y-3 pt-2">
      <div className="relative h-[200px] w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={57}
              outerRadius={84}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => formatNumber(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <strong className="mt-1 font-display text-xl text-foreground">
            {formatNumber(total)}
          </strong>
        </div>
      </div>
      <ul className="w-full min-w-[160px] max-w-[210px] flex-1 space-y-2.5">
        {data.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
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

export function RetentionChart({ data }: { data: AnalyticsDataset['retention'] }) {
  if (!data.length) return <ChartEmptyState />;
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#E9DFE5" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#716a78' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 11, fill: '#716a78' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => `${Number(value).toFixed(0)}%`}
          />
          <Bar
            dataKey="value"
            name="Rétention"
            fill="#D6AFBA"
            radius={[8, 8, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubscriptionPerformanceChart({
  data,
}: {
  data: AnalyticsDataset['subscriptions'];
}) {
  if (!data.length) return <ChartEmptyState />;
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 16, right: 24, left: 32, bottom: 0 }}
        >
          <CartesianGrid stroke="#E9DFE5" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#716a78' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => Number(value).toLocaleString('fr-FR')}
          />
          <YAxis
            type="category"
            dataKey="plan"
            tick={{ fontSize: 11, fill: '#514b58' }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatNumber(Number(value))} />
          <Bar dataKey="users" name="Utilisatrices" radius={[0, 8, 8, 0]} maxBarSize={28}>
            {data.map((item) => (
              <Cell key={item.plan} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Aucune donnée disponible pour cette période.
    </div>
  );
}
