'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Pencil, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CountryPricing, RegionRevenue } from '@/types/subscriptions';
import CountryFlag from '@/components/users/CountryFlag';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  RowActions,
} from '@/app/content/components/ContentUI';
import CountryPricingModal, { type CountryPricingFormValues } from './CountryPricingModal';
import {
  formatMoney,
  SubscriptionPageHeader,
  tableCellClass,
  tableHeaderClass,
} from './SubscriptionUI';

type PricingDialog =
  | { type: 'create' }
  | { type: 'edit'; pricing: CountryPricing }
  | { type: 'duplicate'; pricing: CountryPricing }
  | null;

export default function CountryPricingContent({
  initialPricing,
  revenue,
}: {
  initialPricing: CountryPricing[];
  revenue: RegionRevenue[];
}) {
  const [pricing, setPricing] = useState(initialPricing);
  const [dialog, setDialog] = useState<PricingDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<CountryPricing | null>(null);

  const savePricing = async (values: CountryPricingFormValues) => {
    const editing = dialog?.type === 'edit' ? dialog.pricing : undefined;
    const duplicate = pricing.some(
      (item) => item.countryCode === values.countryCode && item.id !== editing?.id
    );
    if (duplicate) throw new Error('Une tarification existe déjà pour ce code pays.');
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    const next: CountryPricing = {
      id: editing?.id ?? `price-${values.countryCode.toLowerCase()}-${Date.now()}`,
      ...values,
      countryName: values.countryName.trim(),
      currency: values.currency.trim().toUpperCase(),
      currencySymbol: values.currencySymbol.trim(),
      monthlyPrice: Number(values.monthlyPrice),
      yearlyPrice: Number(values.yearlyPrice),
      taxNote: values.taxNote?.trim() || undefined,
      hasBillingData: editing?.hasBillingData ?? false,
    };
    setPricing((items) =>
      editing ? items.map((item) => (item.id === editing.id ? next : item)) : [...items, next]
    );
    setDialog(null);
    toast.success(
      editing ? 'Tarification mise à jour avec succès.' : 'Tarification ajoutée avec succès.'
    );
  };

  const requestDelete = (item: CountryPricing) => {
    if (item.hasBillingData) {
      toast.error(
        'Cette tarification est liée à des données de facturation et ne peut pas être supprimée.'
      );
      return;
    }
    setDeleteTarget(item);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-7">
      <SubscriptionPageHeader
        title="Tarification par pays"
        subtitle="Gérez les prix des abonnements selon les pays"
        actionLabel="Ajouter un pays"
        onAction={() => setDialog({ type: 'create' })}
      />
      <DemoNotice />

      <section className="rounded-[20px] border border-border bg-card p-5 shadow-card">
        <h2 className="font-display text-base font-semibold text-foreground">
          Répartition des revenus par région
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {revenue.map((item) => (
            <article key={item.region} className="rounded-xl border border-border bg-[#fcfbfa] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{item.region}</p>
                <span className="text-[11px] font-semibold text-primary">
                  {item.percentage.toLocaleString('fr-FR')}%
                </span>
              </div>
              <p className="mt-2 font-display text-lg font-semibold text-foreground">
                {formatMoney(item.revenue, 'EUR')}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-muted/35">
              <tr>
                <th className={tableHeaderClass}>Pays</th>
                <th className={tableHeaderClass}>Devise</th>
                <th className={tableHeaderClass}>Prix mensuel</th>
                <th className={tableHeaderClass}>Prix annuel</th>
                <th className={tableHeaderClass}>Statut</th>
                <th className={`${tableHeaderClass} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pricing.map((item) => (
                <tr key={item.id} className="hover:bg-primary-ghost/35">
                  <td className={tableCellClass}>
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <CountryFlag code={item.countryCode} label={item.countryName} />
                      {item.countryName}
                    </span>
                    {item.taxNote && (
                      <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                        {item.taxNote}
                      </p>
                    )}
                  </td>
                  <td className={`${tableCellClass} font-medium`}>{item.currency}</td>
                  <td className={`${tableCellClass} font-semibold`}>
                    {formatMoney(item.monthlyPrice, item.currency)}
                  </td>
                  <td className={`${tableCellClass} font-semibold`}>
                    {formatMoney(item.yearlyPrice, item.currency)}
                  </td>
                  <td className={tableCellClass}>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.active ? 'bg-success-bg text-success' : 'bg-muted text-muted-foreground'}`}
                    >
                      {item.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className={`${tableCellClass} text-center`}>
                    <RowActions label={`Actions pour ${item.countryName}`}>
                      <ActionButton onClick={() => setDialog({ type: 'edit', pricing: item })}>
                        <Pencil size={14} /> Modifier
                      </ActionButton>
                      <ActionButton onClick={() => setDialog({ type: 'duplicate', pricing: item })}>
                        <Copy size={14} /> Dupliquer
                      </ActionButton>
                      <ActionButton
                        onClick={() => {
                          setPricing((items) =>
                            items.map((current) =>
                              current.id === item.id
                                ? { ...current, active: !current.active }
                                : current
                            )
                          );
                          toast.success(
                            item.active ? 'Tarification désactivée.' : 'Tarification activée.'
                          );
                        }}
                      >
                        <Power size={14} /> {item.active ? 'Désactiver' : 'Activer'}
                      </ActionButton>
                      <ActionButton danger onClick={() => requestDelete(item)}>
                        <Trash2 size={14} /> Supprimer
                      </ActionButton>
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pricing.length && (
            <EmptyState
              title="Aucune tarification configurée"
              description="Ajoutez un pays pour définir ses tarifs mensuel et annuel."
            />
          )}
        </div>
      </section>

      <AnimatePresence>
        {dialog && (
          <CountryPricingModal
            pricing={
              dialog.type === 'edit' || dialog.type === 'duplicate' ? dialog.pricing : undefined
            }
            duplicate={dialog.type === 'duplicate'}
            onClose={() => setDialog(null)}
            onSave={savePricing}
          />
        )}
      </AnimatePresence>

      {deleteTarget && (
        <ConfirmDialog
          title="Supprimer cette tarification ?"
          message={`La tarification ${deleteTarget.countryName} sera supprimée de cette session.`}
          confirmLabel="Supprimer"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            setPricing((items) => items.filter((item) => item.id !== deleteTarget.id));
            setDeleteTarget(null);
            toast.success('Tarification supprimée.');
          }}
        />
      )}
    </motion.div>
  );
}
