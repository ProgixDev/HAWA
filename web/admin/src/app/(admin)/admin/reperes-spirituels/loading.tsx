import React from 'react';

export default function SpiritualLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Chargement du module spirituel">
      <div className="h-24 rounded-[20px] bg-white" />
      <div className="h-14 rounded-[18px] bg-white" />
      <div className="h-72 rounded-[20px] bg-white" />
    </div>
  );
}
