import React from 'react';
import { Clock3 } from 'lucide-react';

interface AdminRouteNoticeProps {
  section: string;
  title: string;
}

export default function AdminRouteNotice({ section, title }: AdminRouteNoticeProps) {
  return (
    <section className="mx-auto max-w-3xl rounded-[22px] border border-border bg-card px-6 py-14 text-center shadow-card sm:px-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-ghost text-primary">
        <Clock3 size={24} aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {section}
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Cette section est correctement intégrée à la navigation AWA. Son interface métier n’est pas
        encore disponible dans la version actuelle du projet.
      </p>
    </section>
  );
}
