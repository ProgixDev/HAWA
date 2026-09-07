'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Ban,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  ShieldBan,
  Trash2,
} from 'lucide-react';
import type { UserDetailsRecord } from '@/services/users';
import { COUNTRY_LABELS, formatUserDate, getInitials } from '@/components/users/userPresentation';
import { UserAccountBadge, UserPlanBadge, UserStatusBadge } from '@/components/users/UserBadges';
import CountryFlag from '@/components/users/CountryFlag';
import UserActionDialog, { type UserDialogAction } from './UserActionDialog';
import { USER_DETAIL_TABS, UserDetailSection, type UserDetailTab } from './UserDetailSections';

function isUserDetailTab(value?: string): value is UserDetailTab {
  return USER_DETAIL_TABS.some((tab) => tab.value === value);
}

function isDialogAction(value?: string): value is UserDialogAction {
  return ['suspend', 'disable', 'reactivate', 'delete', 'update'].includes(value ?? '');
}

export default function UserDetailsContent({
  detail,
  initialTab,
  initialAction,
}: {
  detail: UserDetailsRecord;
  initialTab?: string;
  initialAction?: string;
}) {
  const { user } = detail;
  const [tab, setTab] = useState<UserDetailTab>(
    isUserDetailTab(initialTab) ? initialTab : 'overview'
  );
  const [dialog, setDialog] = useState<UserDialogAction | null>(
    isDialogAction(initialAction) ? initialAction : null
  );
  const canSuspend = user.status === 'active' || user.status === 'pending_verification';
  const canDisable = !['disabled', 'inactive', 'deleted'].includes(user.status);
  const canReactivate = ['suspended', 'disabled', 'inactive'].includes(user.status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <Link
        href="/admin/utilisatrices"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Retour aux utilisatrices
      </Link>

      <section className="rounded-[22px] border border-border bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e8dfec] text-lg font-bold text-[#665173]">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
                {user.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                <span>{user.email ?? 'E-mail non renseigné'}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-2">
                  <CountryFlag code={user.country} label={COUNTRY_LABELS[user.country]} />
                  {COUNTRY_LABELS[user.country]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <UserAccountBadge user={user} />
                <UserPlanBadge user={user} />
                <UserStatusBadge status={user.status} />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Inscrite le {formatUserDate(user.createdAt)} · Dernière activité{' '}
                {formatUserDate(user.lastActiveAt, true)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canSuspend && (
              <button
                type="button"
                onClick={() => setDialog('suspend')}
                className="btn-secondary h-10 text-xs"
              >
                <ShieldBan size={15} /> Suspendre
              </button>
            )}
            {canDisable && (
              <button
                type="button"
                onClick={() => setDialog('disable')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#655276] px-4 text-xs font-semibold text-white hover:bg-[#584767]"
              >
                <Ban size={15} /> Désactiver le compte
              </button>
            )}
            <details className="group relative">
              <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-semibold text-foreground hover:bg-muted [&::-webkit-details-marker]:hidden">
                <MoreHorizontal size={15} /> Autres <ChevronDown size={13} />
              </summary>
              <div className="absolute right-0 z-30 mt-1.5 w-56 rounded-xl border border-border bg-white p-1.5 shadow-dropdown">
                <button
                  type="button"
                  onClick={() => setDialog('update')}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#5e5762] hover:bg-muted"
                >
                  <Pencil size={14} /> Modifier le profil
                </button>
                <button
                  type="button"
                  onClick={() => setTab('subscription')}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#5e5762] hover:bg-muted"
                >
                  <CreditCard size={14} /> Voir l’abonnement
                </button>
                {canReactivate && (
                  <button
                    type="button"
                    onClick={() => setDialog('reactivate')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-[#5e5762] hover:bg-muted"
                  >
                    <RotateCcw size={14} /> Réactiver le compte
                  </button>
                )}
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  onClick={() => setDialog('delete')}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger-bg"
                >
                  <Trash2 size={14} /> Supprimer le compte
                </button>
              </div>
            </details>
          </div>
        </div>
      </section>

      <aside className="rounded-xl border border-[#e6dfd0] bg-[#fbf6eb] px-4 py-3 text-[12px] leading-5 text-[#806b48]">
        Source de démonstration locale : les informations affichées proviennent du jeu de données
        centralisé du projet. Les données mobiles sensibles ne sont ni disponibles ni affichées.
      </aside>

      <nav
        aria-label="Sections du compte"
        className="overflow-x-auto rounded-[18px] border border-border bg-white shadow-card"
      >
        <div className="flex min-w-max px-2">
          {USER_DETAIL_TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`relative px-3.5 py-3.5 text-[13px] font-semibold transition-colors ${
                tab === item.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.label}
              {tab === item.value && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <UserDetailSection tab={tab} detail={detail} />

      {dialog && <UserActionDialog action={dialog} user={user} onClose={() => setDialog(null)} />}
    </motion.div>
  );
}
