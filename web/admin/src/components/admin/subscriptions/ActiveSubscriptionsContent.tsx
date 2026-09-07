'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Eye, Pencil, ReceiptText, RotateCcw, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import type {
  ActiveSubscription,
  BillingPeriod,
  ManagedSubscriptionStatus,
  SubscriptionPlan,
} from '@/types/subscriptions';
import { COUNTRY_LABELS } from '@/components/users/userPresentation';
import CountryFlag from '@/components/users/CountryFlag';
import {
  ActionButton,
  EmptyState,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
  Tabs,
} from '@/app/content/components/ContentUI';
import {
  downloadCsv,
  formatMoney,
  formatSubscriptionDate,
  SubscriptionPageHeader,
  SubscriptionStatusBadge,
  subscriptionStatusLabels,
  tableCellClass,
  tableHeaderClass,
} from './SubscriptionUI';
import {
  CancelSubscriptionModal,
  EditSubscriptionModal,
  SubscriptionDetailsModal,
} from './SubscriptionDialogs';

type PlanTab = 'all' | BillingPeriod;
type SubscriptionDialog = {
  type: 'details' | 'payments' | 'edit' | 'cancel';
  subscription: ActiveSubscription;
} | null;

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function ActiveSubscriptionsContent({
  initialSubscriptions,
  plans,
}: {
  initialSubscriptions: ActiveSubscription[];
  plans: SubscriptionPlan[];
}) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [tab, setTab] = useState<PlanTab>('all');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [country, setCountry] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState<SubscriptionDialog>(null);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return subscriptions.filter((subscription) => {
      const matchesSearch =
        !query ||
        normalize(subscription.userName).includes(query) ||
        normalize(subscription.email).includes(query) ||
        normalize(subscription.userId).includes(query) ||
        normalize(subscription.id).includes(query);
      return (
        matchesSearch &&
        (tab === 'all' || subscription.billingPeriod === tab) &&
        (planFilter === 'all' || subscription.planId === planFilter) &&
        (country === 'all' || subscription.country === country) &&
        (status === 'all' || subscription.status === status)
      );
    });
  }, [country, planFilter, search, status, subscriptions, tab]);

  useEffect(() => setPage(1), [country, planFilter, search, status, tab, pageSize]);

  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const premiumPlans = plans.filter((plan) => plan.type === 'premium');
  const countries = Array.from(new Set(subscriptions.map((item) => item.country)));

  const clearFilters = () => {
    setSearch('');
    setTab('all');
    setPlanFilter('all');
    setCountry('all');
    setStatus('all');
  };

  const exportRows = () => {
    downloadCsv(
      `awa-abonnements-actifs-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'ID abonnement',
        'ID utilisatrice',
        'Nom',
        'E-mail',
        'Plan',
        'Statut',
        'Début',
        'Renouvellement',
        'Montant',
        'Devise',
      ],
      filtered.map((item) => [
        item.id,
        item.userId,
        item.userName,
        item.email,
        item.planName,
        subscriptionStatusLabels[item.status],
        item.startDate,
        item.nextBillingDate ?? '',
        item.amount,
        item.currency,
      ])
    );
    toast.success(`Export généré avec succès — ${filtered.length} lignes.`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-7">
      <SubscriptionPageHeader
        title="Abonnements actifs"
        subtitle="Liste des utilisatrices avec un abonnement actif"
        actionLabel="Exporter"
        onAction={exportRows}
      />

      <section className="overflow-hidden rounded-[20px] border border-border bg-card shadow-card">
        <Tabs
          value={tab}
          onChange={setTab}
          comfortable
          items={[
            { value: 'all', label: 'Tous', count: 4280 },
            { value: 'monthly', label: 'Mensuel', count: 3438 },
            { value: 'yearly', label: 'Annuel', count: 842 },
          ]}
        />
        <div className="flex flex-col gap-3 border-b border-border p-4 xl:flex-row xl:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Nom, e-mail, ID utilisatrice…"
            comfortable
          />
          <div className="grid gap-3 sm:grid-cols-3 xl:flex">
            <SelectField
              label="Plan"
              value={planFilter}
              onChange={setPlanFilter}
              compact
              comfortable
            >
              <option value="all">Tous les plans</option>
              {premiumPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Pays" value={country} onChange={setCountry} compact comfortable>
              <option value="all">Tous les pays</option>
              {countries.map((code) => (
                <option key={code} value={code}>
                  {COUNTRY_LABELS[code]}
                </option>
              ))}
            </SelectField>
            <SelectField label="Statut" value={status} onChange={setStatus} compact comfortable>
              <option value="all">Tous les statuts</option>
              {(
                Object.entries(subscriptionStatusLabels) as Array<
                  [ManagedSubscriptionStatus, string]
                >
              ).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw size={14} /> Effacer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse">
            <thead className="bg-muted/35">
              <tr>
                <th className={tableHeaderClass}>Utilisatrice</th>
                <th className={tableHeaderClass}>Plan</th>
                <th className={tableHeaderClass}>Statut</th>
                <th className={tableHeaderClass}>Début</th>
                <th className={tableHeaderClass}>Prochain renouvellement</th>
                <th className={tableHeaderClass}>Montant</th>
                <th className={`${tableHeaderClass} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((subscription) => (
                <tr key={subscription.id} className="transition-colors hover:bg-primary-ghost/35">
                  <td className={`${tableCellClass} min-w-[245px]`}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-pale text-xs font-bold text-primary">
                        {subscription.userName
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-semibold">{subscription.userName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{subscription.email}</p>
                        <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <CountryFlag
                            code={subscription.country}
                            label={COUNTRY_LABELS[subscription.country]}
                          />
                          {COUNTRY_LABELS[subscription.country]}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={tableCellClass}>
                    <span className="font-semibold">{subscription.planName}</span>
                  </td>
                  <td className={tableCellClass}>
                    <SubscriptionStatusBadge status={subscription.status} />
                  </td>
                  <td className={tableCellClass}>
                    {formatSubscriptionDate(subscription.startDate)}
                  </td>
                  <td className={tableCellClass}>
                    {formatSubscriptionDate(subscription.nextBillingDate)}
                  </td>
                  <td className={`${tableCellClass} font-semibold`}>
                    {formatMoney(subscription.amount, subscription.currency)}
                  </td>
                  <td className={`${tableCellClass} text-center`}>
                    <RowActions label={`Actions pour ${subscription.userName}`}>
                      <ActionButton
                        onClick={() => router.push(`/admin/utilisatrices/${subscription.userId}`)}
                      >
                        <UserRound size={14} /> Voir l’utilisatrice
                      </ActionButton>
                      <ActionButton onClick={() => setDialog({ type: 'details', subscription })}>
                        <Eye size={14} /> Voir l’abonnement
                      </ActionButton>
                      <ActionButton onClick={() => setDialog({ type: 'edit', subscription })}>
                        <Pencil size={14} /> Modifier l’abonnement
                      </ActionButton>
                      <ActionButton onClick={() => setDialog({ type: 'payments', subscription })}>
                        <ReceiptText size={14} /> Voir les paiements
                      </ActionButton>
                      {subscription.status !== 'cancelled' && (
                        <ActionButton
                          danger
                          onClick={() => setDialog({ type: 'cancel', subscription })}
                        >
                          <CreditCard size={14} /> Annuler l’abonnement
                        </ActionButton>
                      )}
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pageRows.length && (
            <EmptyState
              title="Aucun abonnement trouvé"
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
        {dialog?.type === 'details' && (
          <SubscriptionDetailsModal
            subscription={dialog.subscription}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog?.type === 'payments' && (
          <SubscriptionDetailsModal
            subscription={dialog.subscription}
            mode="payments"
            onClose={() => setDialog(null)}
          />
        )}
        {dialog?.type === 'edit' && (
          <EditSubscriptionModal
            subscription={dialog.subscription}
            plans={plans}
            onClose={() => setDialog(null)}
            onSave={(plan, nextStatus) => {
              setSubscriptions((items) =>
                items.map((item) =>
                  item.id === dialog.subscription.id
                    ? {
                        ...item,
                        planId: plan.id,
                        planName: plan.name as ActiveSubscription['planName'],
                        billingPeriod: plan.billingPeriod,
                        status: nextStatus,
                        updatedAt: new Date().toISOString(),
                      }
                    : item
                )
              );
              setDialog(null);
              toast.success('Abonnement mis à jour avec succès.');
            }}
          />
        )}
        {dialog?.type === 'cancel' && (
          <CancelSubscriptionModal
            subscription={dialog.subscription}
            onClose={() => setDialog(null)}
            onConfirm={(reason) => {
              setSubscriptions((items) =>
                items.map((item) =>
                  item.id === dialog.subscription.id
                    ? {
                        ...item,
                        status: 'cancelled',
                        nextBillingDate: undefined,
                        updatedAt: new Date().toISOString(),
                      }
                    : item
                )
              );
              setDialog(null);
              toast.success(
                reason ? `Abonnement annulé — motif enregistré.` : 'Abonnement annulé.'
              );
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
