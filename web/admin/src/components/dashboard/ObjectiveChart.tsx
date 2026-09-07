'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const objectiveData = [
  { name: 'Cycle menstruel', value: 8240, color: '#6F5A8A' },
  { name: 'Essayer de concevoir', value: 4180, color: '#8D79A8' },
  { name: 'Contraception', value: 3960, color: '#B8A6CB' },
  { name: 'SOPK', value: 2840, color: '#4A9B7F' },
  { name: 'Grossesse', value: 2420, color: '#C4882A' },
  { name: 'Post-partum', value: 1680, color: '#5A7EC4' },
  { name: 'Après fausse couche', value: 820, color: '#C45A5A' },
  { name: 'Périménopause', value: 706, color: '#6A6270' },
];

const total = objectiveData.reduce((s, d) => s + d.value, 0);

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  const pct = ((d.value / total) * 100).toFixed(1);
  return (
    <div className="bg-card border border-border rounded-xl shadow-dropdown p-3 min-w-[160px]">
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: d.payload.color }}
        />
        <span className="text-xs font-semibold text-foreground">{d.name}</span>
      </div>
      <p className="text-sm font-bold text-foreground tabular-nums">
        {new Intl.NumberFormat('fr-FR').format(d.value)}
      </p>
      <p className="text-xs text-muted-foreground">{pct}% des utilisatrices</p>
    </div>
  );
}

export default function ObjectiveChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={objectiveData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {objectiveData.map((entry, index) => (
                <Cell
                  key={`cell-obj-${entry.name}`}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {objectiveData.map((d, idx) => (
          <div
            key={`obj-legend-${d.name}`}
            className="flex items-center gap-2.5 group cursor-default"
            onMouseEnter={() => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div
              className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
              style={{ background: d.color }}
            />
            <span className="flex-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
              {d.name}
            </span>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
