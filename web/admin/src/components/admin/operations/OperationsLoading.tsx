import React from 'react';

export default function OperationsLoading({ table = true }: { table?: boolean }) {
  return (
    <div className="animate-pulse space-y-7" aria-label="Chargement de la page">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="h-7 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-80 max-w-full rounded bg-muted" />
        </div>
        <div className="hidden h-11 w-48 rounded-xl bg-muted sm:block" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-40 rounded-[18px] border border-border bg-white p-5">
            <div className="h-11 w-11 rounded-full bg-muted" />
            <div className="mt-5 h-7 w-24 rounded bg-muted" />
            <div className="mt-2 h-4 w-36 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
        <div className="h-96 rounded-[18px] border border-border bg-white p-5">
          <div className="h-5 w-56 rounded bg-muted" />
          <div className="mt-8 h-72 rounded-xl bg-muted" />
        </div>
        <div className="h-96 rounded-[18px] border border-border bg-white p-5">
          <div className="h-5 w-44 rounded bg-muted" />
          <div className="mx-auto mt-10 h-52 w-52 rounded-full bg-muted" />
        </div>
      </div>
      {table && <div className="h-80 rounded-[18px] border border-border bg-white" />}
    </div>
  );
}
