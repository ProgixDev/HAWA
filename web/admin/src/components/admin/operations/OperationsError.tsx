'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function OperationsError({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl rounded-[20px] border border-danger/20 bg-white px-6 py-12 text-center shadow-card">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertTriangle size={22} aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-display text-xl font-semibold text-foreground">
        Impossible de charger les données.
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Une erreur est survenue pendant le chargement de cette section.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-5">
        <RefreshCw size={15} /> Réessayer
      </button>
    </section>
  );
}
