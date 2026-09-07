'use client';

import React from 'react';

export default function SpiritualError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl rounded-[22px] border border-border bg-white px-6 py-14 text-center shadow-card">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Impossible de charger ce module
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Les données spirituelles administratives sont momentanément indisponibles.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Réessayer
      </button>
    </section>
  );
}
