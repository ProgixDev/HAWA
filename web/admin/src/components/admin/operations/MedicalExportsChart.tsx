'use client';

import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export default function MedicalExportsChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!total) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aucune donnée disponible.
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto h-52 w-full max-w-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} stroke="#fff" strokeWidth={1} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => Number(value).toLocaleString('fr-FR')}
              contentStyle={{
                border: '1px solid #e8e0ef',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(59,49,70,0.1)',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <strong className="mt-1 font-display text-2xl text-foreground">
            {total.toLocaleString('fr-FR')}
          </strong>
        </div>
      </div>
      <ul className="mt-2 space-y-2.5">
        {data.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <strong className="text-foreground">{Math.round((item.value / total) * 100)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
