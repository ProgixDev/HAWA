import React from 'react';

export default function SubscriptionsLoading() {
  return (
    <div className="animate-pulse space-y-7" aria-label="Chargement des abonnements">
      <div className="h-20 rounded-[20px] bg-white" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-40 rounded-[20px] bg-white" />
        ))}
      </div>
      <div className="h-96 rounded-[20px] bg-white" />
    </div>
  );
}
