'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CountryPricing } from '@/types/subscriptions';
import { FieldLabel, Modal, inputClassName } from '@/app/content/components/ContentUI';

export interface CountryPricingFormValues {
  countryName: string;
  countryCode: CountryPricing['countryCode'];
  currency: string;
  currencySymbol: string;
  monthlyPrice: number;
  yearlyPrice: number;
  active: boolean;
  region: CountryPricing['region'];
  taxNote?: string;
}

export default function CountryPricingModal({
  pricing,
  duplicate = false,
  onClose,
  onSave,
}: {
  pricing?: CountryPricing;
  duplicate?: boolean;
  onClose: () => void;
  onSave: (values: CountryPricingFormValues) => Promise<void>;
}) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CountryPricingFormValues>({
    defaultValues: pricing
      ? {
          ...pricing,
          countryName: duplicate ? `${pricing.countryName} — copie` : pricing.countryName,
        }
      : {
          countryName: '',
          countryCode: 'TN',
          currency: 'TND',
          currencySymbol: 'TND',
          monthlyPrice: 0,
          yearlyPrice: 0,
          active: true,
          region: 'Afrique',
          taxNote: '',
        },
  });

  const submit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await onSave(values);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Impossible d’enregistrer cette tarification.'
      );
    }
  });

  return (
    <Modal
      title={
        pricing && !duplicate
          ? 'Modifier la tarification'
          : duplicate
            ? 'Dupliquer la tarification'
            : 'Ajouter un pays'
      }
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
            <FieldLabel>Pays *</FieldLabel>
            <input
              {...register('countryName', { required: 'Le pays est requis.' })}
              className={inputClassName}
            />
            {errors.countryName && (
              <p className="mt-1 text-xs text-danger">{errors.countryName.message}</p>
            )}
          </label>
          <label>
            <FieldLabel>Code pays *</FieldLabel>
            <select {...register('countryCode', { required: true })} className={inputClassName}>
              <option value="DZ">DZ</option>
              <option value="FR">FR</option>
              <option value="CA">CA</option>
              <option value="BE">BE</option>
              <option value="CH">CH</option>
              <option value="MA">MA</option>
              <option value="TN">TN</option>
            </select>
          </label>
          <label>
            <FieldLabel>Devise *</FieldLabel>
            <input
              {...register('currency', { required: 'La devise est requise.' })}
              className={inputClassName}
              placeholder="EUR"
            />
            {errors.currency && (
              <p className="mt-1 text-xs text-danger">{errors.currency.message}</p>
            )}
          </label>
          <label>
            <FieldLabel>Symbole de devise *</FieldLabel>
            <input
              {...register('currencySymbol', { required: 'Le symbole est requis.' })}
              className={inputClassName}
              placeholder="€"
            />
            {errors.currencySymbol && (
              <p className="mt-1 text-xs text-danger">{errors.currencySymbol.message}</p>
            )}
          </label>
          <label>
            <FieldLabel>Prix mensuel *</FieldLabel>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('monthlyPrice', {
                valueAsNumber: true,
                required: 'Le prix mensuel est requis.',
                min: { value: 0, message: 'Le prix doit être positif.' },
              })}
              className={inputClassName}
            />
            {errors.monthlyPrice && (
              <p className="mt-1 text-xs text-danger">{errors.monthlyPrice.message}</p>
            )}
          </label>
          <label>
            <FieldLabel>Prix annuel *</FieldLabel>
            <input
              type="number"
              min="0"
              step="0.01"
              {...register('yearlyPrice', {
                valueAsNumber: true,
                required: 'Le prix annuel est requis.',
                min: { value: 0, message: 'Le prix doit être positif.' },
              })}
              className={inputClassName}
            />
            {errors.yearlyPrice && (
              <p className="mt-1 text-xs text-danger">{errors.yearlyPrice.message}</p>
            )}
          </label>
          <label>
            <FieldLabel>Région</FieldLabel>
            <select {...register('region')} className={inputClassName}>
              <option value="Europe">Europe</option>
              <option value="Afrique">Afrique</option>
              <option value="Amérique du Nord">Amérique du Nord</option>
              <option value="Moyen-Orient">Moyen-Orient</option>
              <option value="Asie">Asie</option>
            </select>
          </label>
          <label>
            <FieldLabel>Note fiscale</FieldLabel>
            <input {...register('taxNote')} className={inputClassName} placeholder="TVA incluse" />
          </label>
        </div>
        <label className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            {...register('active')}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          Tarification active
        </label>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary h-10">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary h-10 min-w-36">
            {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
