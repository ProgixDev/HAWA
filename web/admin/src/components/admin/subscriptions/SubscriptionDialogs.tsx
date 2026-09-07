'use client';

import React, { useState } from 'react';
import type {
  ActiveSubscription,
  ManagedSubscriptionStatus,
  SubscriptionPlan,
} from '@/types/subscriptions';
import { COUNTRY_LABELS } from '@/components/users/userPresentation';
import CountryFlag from '@/components/users/CountryFlag';
import {
  FieldLabel,
  Modal,
  inputClassName,
  textareaClassName,
} from '@/app/content/components/ContentUI';
import { formatMoney, formatSubscriptionDate, SubscriptionStatusBadge } from './SubscriptionUI';

export function SubscriptionDetailsModal({
  subscription,
  mode = 'details',
  onClose,
}: {
  subscription: ActiveSubscription;
  mode?: 'details' | 'payments';
  onClose: () => void;
}) {
  const details = [
    ['Utilisatrice', subscription.userName],
    ['E-mail', subscription.email],
    ['Plan actuel', subscription.planName],
    ['Début', formatSubscriptionDate(subscription.startDate)],
    ['Prochaine facturation', formatSubscriptionDate(subscription.nextBillingDate)],
    ['Montant', formatMoney(subscription.amount, subscription.currency)],
    ['Fréquence', subscription.billingPeriod === 'monthly' ? 'Mensuelle' : 'Annuelle'],
    ['Devise', subscription.currency],
    ['Moyen de paiement', subscription.paymentMethod],
    ['Dernier paiement', formatSubscriptionDate(subscription.lastPayment)],
    ['ID abonnement', subscription.id],
    ['Créé le', formatSubscriptionDate(subscription.createdAt, true)],
    ['Mis à jour le', formatSubscriptionDate(subscription.updatedAt, true)],
  ];

  return (
    <Modal
      title={mode === 'payments' ? 'Paiements de l’abonnement' : 'Détails de l’abonnement'}
      subtitle={`${subscription.userName} · ${subscription.id}`}
      onClose={onClose}
      wide
    >
      <div className="space-y-5 p-5 sm:p-6">
        {mode === 'payments' ? (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="grid grid-cols-3 gap-3 border-b border-border bg-muted/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Date</span>
              <span>Référence</span>
              <span className="text-right">Montant</span>
            </div>
            <div className="grid grid-cols-3 gap-3 px-4 py-4 text-[13px] text-foreground">
              <span>{formatSubscriptionDate(subscription.lastPayment)}</span>
              <span className="font-mono text-xs">PAY-{subscription.id.slice(-6)}</span>
              <span className="text-right font-semibold">
                {formatMoney(subscription.amount, subscription.currency)}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <CountryFlag
                  code={subscription.country}
                  label={COUNTRY_LABELS[subscription.country]}
                />
                {COUNTRY_LABELS[subscription.country]}
              </span>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
            <dl className="grid gap-x-6 gap-y-4 rounded-xl border border-border bg-white p-4 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words text-[13px] font-semibold text-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary h-10">
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function EditSubscriptionModal({
  subscription,
  plans,
  onClose,
  onSave,
}: {
  subscription: ActiveSubscription;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSave: (plan: SubscriptionPlan, status: ManagedSubscriptionStatus) => void;
}) {
  const [planId, setPlanId] = useState(subscription.planId);
  const [status, setStatus] = useState(subscription.status);
  const premiumPlans = plans.filter((plan) => plan.type === 'premium' && plan.active);

  return (
    <Modal title="Modifier l’abonnement" subtitle={subscription.userName} onClose={onClose}>
      <form
        className="space-y-5 p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const plan = premiumPlans.find((item) => item.id === planId);
          if (plan) onSave(plan, status);
        }}
      >
        <label className="block">
          <FieldLabel>Plan</FieldLabel>
          <select
            value={planId}
            onChange={(event) => setPlanId(event.target.value)}
            className={inputClassName}
          >
            {premiumPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <FieldLabel>Statut</FieldLabel>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ManagedSubscriptionStatus)}
            className={inputClassName}
          >
            <option value="active">Actif</option>
            <option value="trial">Essai</option>
            <option value="payment_pending">Paiement en attente</option>
            <option value="expiring_soon">Expire bientôt</option>
            <option value="suspended">Suspendu</option>
            <option value="cancelled">Annulé</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary h-10">
            Annuler
          </button>
          <button type="submit" className="btn-primary h-10">
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CancelSubscriptionModal({
  subscription,
  onClose,
  onConfirm,
}: {
  subscription: ActiveSubscription;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      title="Annuler l’abonnement"
      subtitle="Cette action conserve l’abonnement dans l’historique."
      onClose={onClose}
    >
      <form
        className="space-y-5 p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason.trim());
        }}
      >
        <div className="rounded-xl border border-danger/20 bg-danger-bg/60 p-4 text-sm">
          <p className="font-semibold text-foreground">{subscription.userName}</p>
          <p className="mt-1 text-muted-foreground">{subscription.planName}</p>
          <p className="mt-1 text-muted-foreground">
            Renouvellement : {formatSubscriptionDate(subscription.nextBillingDate)}
          </p>
        </div>
        <label className="block">
          <FieldLabel>Motif optionnel</FieldLabel>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className={textareaClassName}
            placeholder="Ajoutez un motif interne…"
          />
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary h-10">
            Retour
          </button>
          <button type="submit" className="btn-danger h-10">
            Confirmer l’annulation
          </button>
        </div>
      </form>
    </Modal>
  );
}
