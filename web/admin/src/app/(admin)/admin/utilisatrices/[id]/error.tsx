'use client';

import React from 'react';

export default function UserDetailsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto max-w-xl rounded-[22px] border border-border bg-white px-6 py-14 text-center shadow-card">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Impossible de charger le compte
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Une erreur est survenue pendant le chargement des informations administratives.
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Réessayer
      </button>
    </section>
  );
}
