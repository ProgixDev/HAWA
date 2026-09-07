'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Filter, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { SubscriptionHistoryEvent, SubscriptionHistoryType } from '@/types/subscriptions';
import { COUNTRY_LABELS } from '@/components/users/userPresentation';
import {
  EmptyState,
  FieldLabel,
  Modal,
  Pagination,
  SearchInput,
  SelectField,
  inputClassName,
} from '@/app/content/components/ContentUI';
import {
  downloadCsv,
  formatMoney,
  formatSubscriptionDate,
  HistoryStatusBadge,
  historyStatusLabels,
  SubscriptionPageHeader,
  tableCellClass,
  tableHeaderClass,
} from './SubscriptionUI';

const typeLabels: Record<SubscriptionHistoryType, string> = {
  new_subscription: 'Nouvel abonnement',
  renewal: 'Renouvellement',
  plan_change: 'Changement de plan',
  cancellation: 'Annulation',
  payment_failure: 'Échec de paiement',
  refund: 'Remboursement',
  reactivation: 'Réactivation',
};

interface HistoryFilters {
  type: string;
  plan: string;
  country: string;
  from: string;
  to: string;
}

const emptyFilters: HistoryFilters = { type: 'all', plan: 'all', country: 'all', from: '', to: '' };

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function SubscriptionHistoryContent({
  events,
}: {
  events: SubscriptionHistoryEvent[];
}) {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<HistoryFilters>(emptyFilters);
  const [filters, setFilters] = useState<HistoryFilters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<SubscriptionHistoryEvent | null>(null);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return events.filter((event) => {
      const timestamp = new Date(event.occurredAt).getTime();
      const from = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
      const to = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : null;
      const matchesSearch =
        !query ||
        normalize(event.userName).includes(query) ||
        normalize(event.email).includes(query) ||
        normalize(event.userId).includes(query) ||
        normalize(event.subscriptionId).includes(query);
      return (
        matchesSearch &&
        (filters.type === 'all' || event.type === filters.type) &&
        (filters.plan === 'all' || event.planName === filters.plan) &&
        (filters.country === 'all' || event.country === filters.country) &&
        (!from || timestamp >= from) &&
        (!to || timestamp <= to)
      );
    });
  }, [events, filters, search]);

  useEffect(() => setPage(1), [filters, pageSize, search]);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const countries = Array.from(new Set(events.map((event) => event.country)));

  const clearFilters = () => {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setSearch('');
  };

  const exportRows = () => {
    downloadCsv(
      `awa-historique-abonnements-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Date',
        'Utilisatrice',
        'E-mail',
        'Action',
        'Plan',
        'Montant',
        'Devise',
        'Statut',
        'ID abonnement',
      ],
      filtered.map((event) => [
        event.occurredAt,
        event.userName,
        event.email,
        typeLabels[event.type],
        event.planName,
        event.amount ?? '',
        event.currency,
        historyStatusLabels[event.status],
        event.subscriptionId,
      ])
    );
    toast.success(`Export généré avec succès — ${filtered.length} activités.`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-7">
      <SubscriptionPageHeader
        title="Historique des abonnements"
        subtitle="Suivez toutes les activités liées aux abonnements"
        actionLabel="Exporter"
        onAction={exportRows}
      />

      <section className="overflow-hidden rounded-[20px] border border-border bg-card shadow-card">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Nom, e-mail, ID…"
              comfortable
            />
            <div className="grid gap-3 sm:grid-cols-3 xl:flex">
              <SelectField
                label="Type"
                value={draft.type}
                onChange={(value) => setDraft((current) => ({ ...current, type: value }))}
                compact
                comfortable
              >
                <option value="all">Tous les types</option>
                {(Object.entries(typeLabels) as Array<[SubscriptionHistoryType, string]>).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </SelectField>
              <SelectField
                label="Plan"
                value={draft.plan}
                onChange={(value) => setDraft((current) => ({ ...current, plan: value }))}
                compact
                comfortable
              >
                <option value="all">Tous les plans</option>
                <option value="Gratuit">Gratuit</option>
                <option value="Premium Mensuel">Premium Mensuel</option>
                <option value="Premium Annuel">Premium Annuel</option>
              </SelectField>
              <SelectField
                label="Pays"
                value={draft.country}
                onChange={(value) => setDraft((current) => ({ ...current, country: value }))}
                compact
                comfortable
              >
                <option value="all">Tous les pays</option>
                {countries.map((code) => (
                  <option key={code} value={code}>
                    {COUNTRY_LABELS[code]}
                  </option>
                ))}
              </SelectField>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block">
              <FieldLabel>Du</FieldLabel>
              <input
                type="date"
                value={draft.from}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, from: event.target.value }))
                }
                className={inputClassName}
              />
            </label>
            <label className="block">
              <FieldLabel>Au</FieldLabel>
              <input
                type="date"
                value={draft.to}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, to: event.target.value }))
                }
                className={inputClassName}
              />
            </label>
            <button type="button" onClick={() => setFilters(draft)} className="btn-primary h-11">
              <Filter size={14} /> Filtrer
            </button>
            <button type="button" onClick={clearFilters} className="btn-ghost h-11">
              <RotateCcw size={14} /> Effacer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1010px] border-collapse">
            <thead className="bg-muted/35">
              <tr>
                <th className={tableHeaderClass}>Date</th>
                <th className={tableHeaderClass}>Utilisatrice</th>
                <th className={tableHeaderClass}>Type d’action</th>
                <th className={tableHeaderClass}>Plan</th>
                <th className={tableHeaderClass}>Montant</th>
                <th className={tableHeaderClass}>Statut</th>
                <th className={`${tableHeaderClass} text-center`}>Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((event) => (
                <tr key={event.id} className="hover:bg-primary-ghost/35">
                  <td className={tableCellClass}>
                    {formatSubscriptionDate(event.occurredAt, true)}
                  </td>
                  <td className={`${tableCellClass} min-w-[210px]`}>
                    <p className="font-semibold">{event.userName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{event.email}</p>
                  </td>
                  <td className={tableCellClass}>{typeLabels[event.type]}</td>
                  <td className={tableCellClass}>{event.planName}</td>
                  <td className={`${tableCellClass} font-semibold`}>
                    {event.amount === undefined ? '—' : formatMoney(event.amount, event.currency)}
                  </td>
                  <td className={tableCellClass}>
                    <HistoryStatusBadge status={event.status} />
                  </td>
                  <td className={`${tableCellClass} text-center`}>
                    <button
                      type="button"
                      onClick={() => setSelected(event)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-primary-ghost"
                    >
                      <Eye size={14} /> Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <EmptyState
              title="Aucune activité pour cette période"
              description="Aucun résultat ne correspond à vos filtres."
            />
          )}
        </div>
        <Pagination
          page={page}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizes={[10, 25, 50, 100]}
        />
      </section>

      <AnimatePresence>
        {selected && (
          <Modal
            title="Détails de l’activité"
            subtitle={selected.id}
            onClose={() => setSelected(null)}
            wide
          >
            <div className="space-y-5 p-5 sm:p-6">
              <dl className="grid gap-x-6 gap-y-4 rounded-xl border border-border bg-white p-4 sm:grid-cols-2">
                {[
                  ['Date de transaction', formatSubscriptionDate(selected.occurredAt, true)],
                  ['Utilisatrice', `${selected.userName} (${selected.userId})`],
                  ['ID abonnement', selected.subscriptionId],
                  ['Plan', selected.planName],
                  ['Plan précédent', selected.previousPlan ?? '—'],
                  [
                    'Montant',
                    selected.amount === undefined
                      ? '—'
                      : formatMoney(selected.amount, selected.currency),
                  ],
                  ['Type d’action', typeLabels[selected.type]],
                  ['Statut du paiement', historyStatusLabels[selected.status]],
                  ['Référence', selected.paymentReference ?? '—'],
                  ['Motif d’échec', selected.failureReason ?? '—'],
                  ['Acteur', selected.actor],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words text-[13px] font-semibold text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-secondary h-10"
                  onClick={() => setSelected(null)}
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
