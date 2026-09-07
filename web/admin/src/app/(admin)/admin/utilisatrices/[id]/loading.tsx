import React from 'react';

export default function UserDetailsLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Chargement du compte">
      <div className="h-5 w-44 rounded bg-muted" />
      <div className="h-48 rounded-[22px] border border-border bg-white" />
      <div className="h-12 rounded-[18px] border border-border bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-28 rounded-[18px] border border-border bg-white" />
        ))}
      </div>
    </div>
  );
}
