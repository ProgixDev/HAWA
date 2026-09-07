'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubscriptionPlan } from '@/types/subscriptions';
import {
  FieldLabel,
  Modal,
  inputClassName,
  textareaClassName,
} from '@/app/content/components/ContentUI';

export interface PlanFormValues {
  name: string;
  code: string;
  description: string;
  type: 'free' | 'premium';
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  discountPercent?: number;
  featuresText: string;
  active: boolean;
  badge?: string;
  displayOrder: number;
}

export default function PlanModal({
  plan,
  onClose,
  onSave,
}: {
  plan?: SubscriptionPlan;
  onClose: () => void;
  onSave: (values: PlanFormValues) => Promise<void>;
}) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    defaultValues: plan
      ? {
          ...plan,
          featuresText: plan.features.join('\n'),
        }
      : {
          name: '',
          code: '',
          description: '',
          type: 'premium',
          price: 0,
          currency: 'EUR',
          billingPeriod: 'monthly',
          discountPercent: 0,
          featuresText: '',
          active: true,
          badge: '',
          displayOrder: 4,
        },
  });

  const submit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await onSave(values);
    } catch {
      setServerError('Impossible d’enregistrer le plan. Veuillez réessayer.');
    }
  });

  return (
    <Modal
      title={plan ? 'Modifier le plan' : 'Créer un plan'}
      subtitle="Les modifications sont conservées pendant cette session d’administration."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
        {serverError && (
          <div
            role="alert"
            className="rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger"
          >
            {serverError}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <FieldLabel>Nom du plan *</FieldLabel>
            <input
              {...register('name', { required: 'Le nom est requis.' })}
              className={inputClassName}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </label>
          <label>
            <FieldLabel>Code interne *</FieldLabel>
            <input
              {...register('code', {
                required: 'Le code interne est requis.',
                pattern: {
                  value: /^[A-Z0-9_]+$/,
                  message: 'Utilisez des lettres majuscules, chiffres ou _.',
                },
              })}
              className={inputClassName}
              placeholder="PREMIUM_MONTHLY"
            />
            {errors.code && <p className="mt-1 text-xs text-danger">{errors.code.message}</p>}
          </label>
        </div>
        <label className="block">
          <FieldLabel>Description *</FieldLabel>
          <textarea
            {...register('description', { required: 'La description est requise.' })}
            rows={3}
            className={textareaClassName}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
          )}
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <FieldLabel>Type *</FieldLabel>
            <select {...register('type')} className={inputClassName}>
              <option value="free">Gratuit</option>
              <option value="premium">Premium</option>
            </select>
          </label>
          <label>
            <FieldLabel>Prix *</FieldLabel>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('price', {
                valueAsNumber: true,
                min: { value: 0, message: 'Le prix doit être positif.' },
              })}
              className={inputClassName}
            />
            {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
          </label>
          <label>
            <FieldLabel>Devise *</FieldLabel>
            <select {...register('currency', { required: true })} className={inputClassName}>
              <option value="EUR">EUR</option>
              <option value="DZD">DZD</option>
              <option value="MAD">MAD</option>
              <option value="CAD">CAD</option>
              <option value="CHF">CHF</option>
            </select>
          </label>
          <label>
            <FieldLabel>Période de facturation *</FieldLabel>
            <select {...register('billingPeriod')} className={inputClassName}>
              <option value="monthly">Mensuel</option>
              <option value="yearly">Annuel</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <FieldLabel>Réduction optionnelle (%)</FieldLabel>
            <input
              type="number"
              min="0"
              max="100"
              {...register('discountPercent', { valueAsNumber: true, min: 0, max: 100 })}
              className={inputClassName}
            />
          </label>
          <label>
            <FieldLabel>Badge optionnel</FieldLabel>
            <input {...register('badge')} className={inputClassName} placeholder="Plus populaire" />
          </label>
          <label>
            <FieldLabel>Ordre d’affichage *</FieldLabel>
            <input
              type="number"
              min="1"
              {...register('displayOrder', { valueAsNumber: true, min: 1 })}
              className={inputClassName}
            />
          </label>
        </div>
        <label className="block">
          <FieldLabel>Fonctionnalités incluses *</FieldLabel>
          <textarea
            {...register('featuresText', { required: 'Ajoutez au moins une fonctionnalité.' })}
            rows={5}
            className={textareaClassName}
            placeholder="Une fonctionnalité par ligne"
          />
          {errors.featuresText && (
            <p className="mt-1 text-xs text-danger">{errors.featuresText.message}</p>
          )}
        </label>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            {...register('active')}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          Plan actif
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary h-10">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary h-10 min-w-32">
            {isSubmitting ? 'Enregistrement…' : plan ? 'Enregistrer' : 'Créer le plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
