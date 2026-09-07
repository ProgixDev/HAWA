'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Eye, Pencil, Power, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { SubscriptionPlan } from '@/types/subscriptions';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  Modal,
  RowActions,
} from '@/app/content/components/ContentUI';
import PlanModal, { type PlanFormValues } from './PlanModal';
import { formatMoney, SubscriptionPageHeader } from './SubscriptionUI';

type PlanDialog =
  | { type: 'create' }
  | { type: 'edit'; plan: SubscriptionPlan }
  | { type: 'details'; plan: SubscriptionPlan }
  | { type: 'subscribers'; plan: SubscriptionPlan }
  | null;

function valuesToPlan(values: PlanFormValues, current?: SubscriptionPlan): SubscriptionPlan {
  return {
    id: current?.id ?? `plan-${Date.now()}`,
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description.trim(),
    type: values.type,
    price: Number(values.price),
    currency: values.currency,
    billingPeriod: values.billingPeriod,
    discountPercent: values.discountPercent || undefined,
    originalPrice: current?.originalPrice,
    features: values.featuresText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    active: values.active,
    badge: values.badge?.trim() || undefined,
    displayOrder: Number(values.displayOrder),
    subscriberCount: current?.subscriberCount ?? 0,
  };
}

export default function PlansContent({ initialPlans }: { initialPlans: SubscriptionPlan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [dialog, setDialog] = useState<PlanDialog>(null);
  const [togglePlan, setTogglePlan] = useState<SubscriptionPlan | null>(null);
  const [pendingPriceUpdate, setPendingPriceUpdate] = useState<SubscriptionPlan | null>(null);

  const persistPlan = async (plan: SubscriptionPlan) => {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    setPlans((items) => {
      const exists = items.some((item) => item.id === plan.id);
      return (
        exists ? items.map((item) => (item.id === plan.id ? plan : item)) : [...items, plan]
      ).sort((a, b) => a.displayOrder - b.displayOrder);
    });
    setDialog(null);
    toast.success('Plan mis à jour avec succès.');
  };

  const handleSave = async (values: PlanFormValues) => {
    const current = dialog?.type === 'edit' ? dialog.plan : undefined;
    const nextPlan = valuesToPlan(values, current);
    if (current && current.subscriberCount > 0 && current.price !== nextPlan.price) {
      setPendingPriceUpdate(nextPlan);
      setDialog(null);
      return;
    }
    await persistPlan(nextPlan);
  };

  const duplicatePlan = (plan: SubscriptionPlan) => {
    const copy: SubscriptionPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} — copie`,
      code: `${plan.code}_COPY_${plans.length + 1}`,
      badge: undefined,
      active: false,
      subscriberCount: 0,
      displayOrder: Math.max(...plans.map((item) => item.displayOrder)) + 1,
    };
    setPlans((items) => [...items, copy]);
    toast.success('Plan dupliqué dans cette session.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-7">
      <SubscriptionPageHeader
        title="Plans d’abonnement"
        subtitle="Gérez les plans, prix et avantages"
        actionLabel="Créer un plan"
        onAction={() => setDialog({ type: 'create' })}
      />
      <DemoNotice />

      <section className="grid items-stretch gap-5 lg:grid-cols-3" aria-label="Catalogue des plans">
        {plans.map((plan, index) => (
          <motion.article
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative flex min-h-[430px] flex-col rounded-[22px] border bg-card p-5 shadow-card ${
              plan.badge === 'Plus populaire'
                ? 'border-primary/40 ring-1 ring-primary/10'
                : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {plan.name}
                  </h2>
                  {plan.badge && (
                    <span className="rounded-full bg-primary-pale px-2.5 py-1 text-[10px] font-semibold text-primary">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    plan.active ? 'bg-success-bg text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {plan.active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <RowActions label={`Actions pour ${plan.name}`}>
                <ActionButton onClick={() => setDialog({ type: 'details', plan })}>
                  <Eye size={14} /> Voir les détails
                </ActionButton>
                <ActionButton onClick={() => setDialog({ type: 'edit', plan })}>
                  <Pencil size={14} /> Modifier
                </ActionButton>
                <ActionButton onClick={() => duplicatePlan(plan)}>
                  <Copy size={14} /> Dupliquer
                </ActionButton>
                <ActionButton onClick={() => setTogglePlan(plan)}>
                  <Power size={14} /> {plan.active ? 'Désactiver' : 'Activer'}
                </ActionButton>
                <ActionButton onClick={() => setDialog({ type: 'subscribers', plan })}>
                  <Users size={14} /> Voir les abonnés
                </ActionButton>
              </RowActions>
            </div>

            <div className="mt-6">
              {plan.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatMoney(plan.originalPrice, plan.currency)}
                </p>
              )}
              <p className="font-display text-[30px] font-semibold tracking-[-0.035em] text-foreground">
                {formatMoney(plan.price, plan.currency)}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / {plan.billingPeriod === 'monthly' ? 'mois' : 'an'}
                </span>
              </p>
              <p className="mt-2 min-h-10 text-[13px] leading-5 text-muted-foreground">
                {plan.description}
              </p>
            </div>

            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[13px] text-foreground">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                    <Check size={11} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Utilisatrices / abonnées</p>
              <p className="mt-1 font-display text-lg font-semibold text-foreground">
                {plan.subscriberCount.toLocaleString('fr-FR')}
              </p>
            </div>
          </motion.article>
        ))}
      </section>

      <AnimatePresence>
        {(dialog?.type === 'create' || dialog?.type === 'edit') && (
          <PlanModal
            plan={dialog.type === 'edit' ? dialog.plan : undefined}
            onClose={() => setDialog(null)}
            onSave={handleSave}
          />
        )}
        {(dialog?.type === 'details' || dialog?.type === 'subscribers') && (
          <Modal
            title={dialog.type === 'details' ? dialog.plan.name : `Abonnés — ${dialog.plan.name}`}
            onClose={() => setDialog(null)}
          >
            <div className="space-y-4 p-5 sm:p-6">
              {dialog.type === 'details' ? (
                <>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {dialog.plan.description}
                  </p>
                  <dl className="grid gap-3 rounded-xl border border-border bg-white p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Code interne</dt>
                      <dd className="mt-1 font-medium">{dialog.plan.code}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Facturation</dt>
                      <dd className="mt-1 font-medium">
                        {dialog.plan.billingPeriod === 'monthly' ? 'Mensuelle' : 'Annuelle'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Prix</dt>
                      <dd className="mt-1 font-medium">
                        {formatMoney(dialog.plan.price, dialog.plan.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Ordre</dt>
                      <dd className="mt-1 font-medium">{dialog.plan.displayOrder}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="rounded-xl border border-border bg-white p-5 text-center">
                  <p className="font-display text-3xl font-semibold text-foreground">
                    {dialog.plan.subscriberCount.toLocaleString('fr-FR')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    utilisatrices rattachées à ce plan
                  </p>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="btn-secondary h-10"
                >
                  Fermer
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {togglePlan && (
        <ConfirmDialog
          title={togglePlan.active ? 'Désactiver ce plan ?' : 'Activer ce plan ?'}
          message={`${togglePlan.name} compte ${togglePlan.subscriberCount.toLocaleString('fr-FR')} utilisatrices associées. Cette modification reste limitée à la session.`}
          confirmLabel={togglePlan.active ? 'Désactiver' : 'Activer'}
          onCancel={() => setTogglePlan(null)}
          onConfirm={() => {
            setPlans((items) =>
              items.map((item) =>
                item.id === togglePlan.id ? { ...item, active: !item.active } : item
              )
            );
            toast.success(togglePlan.active ? 'Plan désactivé.' : 'Plan activé.');
            setTogglePlan(null);
          }}
        />
      )}

      {pendingPriceUpdate && (
        <ConfirmDialog
          title="Confirmer le changement de prix"
          message={`Ce plan est associé à ${pendingPriceUpdate.subscriberCount.toLocaleString('fr-FR')} utilisatrices. Confirmez l’enregistrement du nouveau tarif.`}
          confirmLabel="Confirmer le tarif"
          onCancel={() => setPendingPriceUpdate(null)}
          onConfirm={() => {
            void persistPlan(pendingPriceUpdate);
            setPendingPriceUpdate(null);
          }}
        />
      )}
    </motion.div>
  );
}
