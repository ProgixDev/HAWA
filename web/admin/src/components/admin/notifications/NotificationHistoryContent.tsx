'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import type { NotificationCampaign } from '@/data/mock/notifications';
import { audienceLabel } from '@/data/mock/notifications';
import { useNotificationsSession } from '@/stores/notificationsSessionStore';
import { ADMIN_ROUTES } from '@/config/adminRoutes';
import {
  ActionButton,
  DemoNotice,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
  formatContentDate,
} from '@/app/content/components/ContentUI';
import { CampaignStatusBadge } from './NotificationsUI';

type StatusFilter = 'all' | 'sent' | 'cancelled';
type PeriodFilter = 'all' | '7d' | '30d';

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function NotificationHistoryContent() {
  const router = useRouter();
  const campaigns = useNotificationsSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [details, setDetails] = useState<NotificationCampaign | null>(null);

  const referenceTime = Date.now();
  const settled = useMemo(
    () => campaigns.filter((item) => item.status === 'sent' || item.status === 'cancelled'),
    [campaigns]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr-FR');
    const dayLimits: Record<Exclude<PeriodFilter, 'all'>, number> = { '7d': 7, '30d': 30 };
    return settled
      .filter(
        (item) =>
          (statusFilter === 'all' || item.status === statusFilter) &&
          (!query || `${item.name} ${item.title}`.toLocaleLowerCase('fr-FR').includes(query)) &&
          (periodFilter === 'all' ||
            (item.sentAt &&
              referenceTime - new Date(item.sentAt).getTime() <=
                dayLimits[periodFilter] * 86_400_000))
      )
      .sort(
        (a, b) =>
          new Date(b.sentAt ?? b.createdAt).getTime() - new Date(a.sentAt ?? a.createdAt).getTime()
      );
  }, [periodFilter, referenceTime, search, settled, statusFilter]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Historique"
        subtitle="Campagnes envoyées ou annulées — mesures agrégées de démonstration."
        actionLabel="Nouvelle notification"
        onAction={() => router.push(ADMIN_ROUTES.notifications.new)}
      />
      <DemoNotice />

      <section className="rounded-[18px] border border-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-2">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher une campagne..."
          />
          <SelectField
            compact
            label="Statut"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="sent">Envoyée</option>
            <option value="cancelled">Annulée</option>
          </SelectField>
          <SelectField
            compact
            label="Période"
            value={periodFilter}
            onChange={(value) => {
              setPeriodFilter(value as PeriodFilter);
              setPage(1);
            }}
          >
            <option value="all">Toutes les dates</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
          </SelectField>
        </div>
      </section>

      <section className="min-w-0 rounded-[18px] border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                <th className="px-4 py-3.5">Campagne</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5">Livraisons</th>
                <th className="px-4 py-3.5">Taux d’ouverture</th>
                <th className="px-4 py-3.5">Créé par</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {visible.map((campaign) => {
                const openRate =
                  campaign.deliveredCount && campaign.openedCount
                    ? Math.round((campaign.openedCount / campaign.deliveredCount) * 100)
                    : undefined;
                return (
                  <tr key={campaign.id} className="hover:bg-[#fbf9fb]">
                    <td className="px-4 py-3.5">
                      <p className="max-w-[220px] truncate text-xs font-semibold text-foreground">
                        {campaign.name}
                      </p>
                      <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-muted-foreground">
                        {campaign.title}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-muted-foreground">
                      {audienceLabel(campaign.audienceKey)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-muted-foreground">
                      {formatDateTime(campaign.sentAt ?? campaign.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold text-foreground">
                      {campaign.deliveredCount?.toLocaleString('fr-FR') ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] font-semibold text-primary">
                      {openRate !== undefined ? `${openRate}%` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-muted-foreground">
                      {campaign.createdBy}
                    </td>
                    <td className="px-4 py-3.5">
                      <RowActions label={`Actions pour ${campaign.name}`}>
                        <ActionButton onClick={() => setDetails(campaign)}>
                          <Eye size={14} /> Voir les détails
                        </ActionButton>
                      </RowActions>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length && (
            <EmptyState
              title="Aucun historique disponible"
              description="Les campagnes envoyées ou annulées apparaîtront ici."
            />
          )}
        </div>
        <Pagination
          page={safePage}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <AnimatePresence>
        {details && (
          <Modal
            title={details.name}
            subtitle={audienceLabel(details.audienceKey)}
            onClose={() => setDetails(null)}
          >
            <div className="space-y-4 p-5 sm:p-6">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Titre', details.title],
                  ['Message', details.message || '—'],
                  ['Statut', <CampaignStatusBadge key="status" status={details.status} />],
                  ['Date', formatDateTime(details.sentAt ?? details.createdAt)],
                  ['Livraisons', details.deliveredCount?.toLocaleString('fr-FR') ?? '—'],
                  ['Ouvertures', details.openedCount?.toLocaleString('fr-FR') ?? '—'],
                  ['Créé par', details.createdBy],
                  ['Créée le', formatContentDate(details.createdAt)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl bg-[#f5f2f5] p-3">
                    <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-[10px] leading-5 text-muted-foreground">
                Livraisons et taux d’ouverture sont des agrégats de démonstration — aucun service
                push réel n’est connecté.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetails(null)}
                  className="btn-secondary h-10 text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
