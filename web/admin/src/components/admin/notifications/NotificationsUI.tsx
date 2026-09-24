'use client';

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import type { NotificationCampaign, NotificationStatus } from '@/data/mock/notifications';
import { AUDIENCE_OPTIONS, audienceLabel } from '@/data/mock/notifications';
import { CURRENT_ADMIN } from '@/config/admin';
import { FieldLabel, inputClassName, textareaClassName } from '@/app/content/components/ContentUI';

// Local (not UTC) calendar-date/clock-time formatters for pre-filling native
// date/time inputs from a stored absolute instant. Using `toISOString()`
// here would silently shift the displayed value by the viewer's UTC offset.
export function formatLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalTimeInput(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const STATUS_LABELS: Record<NotificationStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmée',
  sent: 'Envoyée',
  cancelled: 'Annulée',
};

const STATUS_STYLES: Record<NotificationStatus, string> = {
  draft: 'border-[#e3e1e4] bg-[#f3f2f3] text-[#777178]',
  scheduled: 'border-[#eadfcf] bg-[#faf3e8] text-[#927149]',
  sent: 'border-[#d8ebe2] bg-[#edf7f2] text-[#367b60]',
  cancelled: 'border-[#eedbd8] bg-[#fbefec] text-[#a25f55]',
};

export function CampaignStatusBadge({ status }: { status: NotificationStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function NotificationPreview({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[18px] border border-border bg-[#f6f4f7] p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Aperçu de la notification mobile
      </p>
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-white p-3 shadow-card">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-pale text-primary">
          <Bell size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {title || 'Titre de la notification'}
            </p>
            <span className="shrink-0 text-[10px] text-muted-foreground">maintenant</span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-4 text-muted-foreground">
            {message || 'Le message apparaîtra ici.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export interface CampaignFormValues {
  id: string;
  name: string;
  title: string;
  message: string;
  audienceKey: string;
  deepLink: string;
  scheduledDate: string;
  scheduledTime: string;
}

export function CampaignForm({
  campaign,
  onCancel,
  onSubmit,
}: {
  campaign?: NotificationCampaign;
  onCancel: () => void;
  onSubmit: (values: CampaignFormValues, action: 'draft' | 'schedule' | 'send') => void;
}) {
  const [name, setName] = useState(campaign?.name ?? '');
  const [title, setTitle] = useState(campaign?.title ?? '');
  const [message, setMessage] = useState(campaign?.message ?? '');
  const [audienceKey, setAudienceKey] = useState(campaign?.audienceKey ?? AUDIENCE_OPTIONS[0].key);
  const [deepLink, setDeepLink] = useState(campaign?.deepLink ?? '');
  const initialScheduled = campaign?.scheduledAt ? new Date(campaign.scheduledAt) : undefined;
  const [scheduledDate, setScheduledDate] = useState(
    initialScheduled ? formatLocalDateInput(initialScheduled) : ''
  );
  const [scheduledTime, setScheduledTime] = useState(
    initialScheduled ? formatLocalTimeInput(initialScheduled) : ''
  );
  const [error, setError] = useState('');

  const values: CampaignFormValues = {
    id: campaign?.id ?? `notif-session-${Date.now()}`,
    name: name.trim() || title.trim(),
    title: title.trim(),
    message: message.trim(),
    audienceKey,
    deepLink: deepLink.trim(),
    scheduledDate,
    scheduledTime,
  };

  const validateBase = () => {
    if (!title.trim()) return 'Le titre est requis.';
    if (!message.trim()) return 'Le message est requis.';
    return '';
  };

  const submit = (action: 'draft' | 'schedule' | 'send') => {
    if (action !== 'draft') {
      const baseError = validateBase();
      if (baseError) {
        setError(baseError);
        return;
      }
    }
    if (action === 'schedule' && (!scheduledDate || !scheduledTime)) {
      setError('Choisissez une date et une heure de programmation.');
      return;
    }
    setError('');
    onSubmit(values, action);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <FieldLabel>Nom de campagne (interne, facultatif)</FieldLabel>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={CURRENT_ADMIN.name}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Titre *</FieldLabel>
          <input
            maxLength={65}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError('');
            }}
            className={inputClassName}
          />
          <span className="mt-1 block text-right text-[10px] text-muted-foreground">
            {title.length}/65
          </span>
        </label>
        <label>
          <FieldLabel>Audience *</FieldLabel>
          <select
            value={audienceKey}
            onChange={(event) => setAudienceKey(event.target.value)}
            className={inputClassName}
          >
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label} — {option.estimatedCount.toLocaleString('fr-FR')} utilisatrices
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Message *</FieldLabel>
          <textarea
            rows={3}
            maxLength={178}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setError('');
            }}
            className={textareaClassName}
          />
          <span className="mt-1 block text-right text-[10px] text-muted-foreground">
            {message.length}/178
          </span>
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Deep link / destination (facultatif)</FieldLabel>
          <input
            value={deepLink}
            onChange={(event) => setDeepLink(event.target.value)}
            placeholder="/admin/contenus/articles"
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Date de programmation</FieldLabel>
          <input
            type="date"
            value={scheduledDate}
            onChange={(event) => {
              setScheduledDate(event.target.value);
              setError('');
            }}
            className={inputClassName}
          />
        </label>
        <label>
          <FieldLabel>Heure de programmation</FieldLabel>
          <input
            type="time"
            value={scheduledTime}
            onChange={(event) => {
              setScheduledTime(event.target.value);
              setError('');
            }}
            className={inputClassName}
          />
        </label>
      </div>

      <NotificationPreview title={title} message={message} />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-bg px-3 py-2 text-xs text-danger"
        >
          {error}
        </p>
      )}

      <p className="text-[10px] leading-5 text-muted-foreground">
        Aucun service push n’est connecté à ce projet — aucune notification réelle n’est envoyée.
        Cette page gère des campagnes futures, distinctes des rappels locaux déjà programmés sur
        l’appareil de chaque utilisatrice.
      </p>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary h-10 text-xs">
          Annuler
        </button>
        <button
          type="button"
          onClick={() => submit('draft')}
          className="h-10 rounded-xl border border-border bg-white px-4 text-xs font-semibold text-foreground hover:bg-muted"
        >
          Enregistrer le brouillon
        </button>
        <button
          type="button"
          onClick={() => submit('schedule')}
          className="h-10 rounded-xl border border-primary/30 bg-white px-4 text-xs font-semibold text-primary hover:bg-primary-ghost"
        >
          Programmer
        </button>
        <button
          type="button"
          onClick={() => submit('send')}
          className="btn-primary h-10 px-4 text-xs"
        >
          Envoyer maintenant (simulation)
        </button>
      </div>
    </div>
  );
}

export { audienceLabel };
