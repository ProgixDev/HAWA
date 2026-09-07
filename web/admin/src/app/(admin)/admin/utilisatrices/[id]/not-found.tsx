import React from 'react';
import Link from 'next/link';
import { UserRoundX } from 'lucide-react';
import { ADMIN_ROUTES } from '@/config/adminRoutes';

export default function UserDetailsNotFound() {
  return (
    <section className="mx-auto max-w-xl rounded-[22px] border border-border bg-white px-6 py-14 text-center shadow-card">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-ghost text-primary">
        <UserRoundX size={24} />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-foreground">
        Utilisatrice introuvable
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Aucun compte ne correspond à cet identifiant dans la source de données actuelle.
      </p>
      <Link href={ADMIN_ROUTES.users} className="btn-primary mt-6">
        Retour aux utilisatrices
      </Link>
    </section>
  );
}
