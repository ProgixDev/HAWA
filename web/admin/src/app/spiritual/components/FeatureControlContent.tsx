'use client';

import React, { useState } from 'react';
import { CalendarDays, History, Link2, Settings, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type {
  SpiritualArticle,
  SpiritualAuditEntry,
  SpiritualEvent,
  SpiritualFeatureConfiguration,
  SpiritualReminder,
} from '@/types/spiritual';
import { saveSpiritualConfiguration } from '@/services/spiritual';
import {
  BackendNotice,
  FeatureStatusCard,
  PrivacyNotice,
  SpiritualEmptyState,
  SpiritualModal,
  SpiritualPageHeader,
  SpiritualTabs,
  ValidationStatusBadge,
} from './SpiritualUI';

type HijriTab = 'overview' | 'settings' | 'events' | 'sync' | 'history';
type RamadanTab = 'overview' | 'settings' | 'events' | 'content' | 'notifications' | 'history';
type NifasTab = 'overview' | 'settings' | 'reminders' | 'content' | 'validation' | 'history';
type FeatureTab = HijriTab | RamadanTab | NifasTab;
type FeatureKind = 'hijri' | 'ramadan' | 'nifas';

const TAB_SETS: Record<FeatureKind, Array<{ value: FeatureTab; label: string }>> = {
  hijri: [
    { value: 'overview', label: "Vue d'ensemble" },
    { value: 'settings', label: 'Paramètres' },
    { value: 'events', label: 'Événements' },
    { value: 'sync', label: 'Synchronisation' },
    { value: 'history', label: 'Historique' },
  ],
  ramadan: [
    { value: 'overview', label: "Vue d'ensemble" },
    { value: 'settings', label: 'Paramètres' },
    { value: 'events', label: 'Événements' },
    { value: 'content', label: 'Contenus' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'history', label: 'Historique' },
  ],
  nifas: [
    { value: 'overview', label: "Vue d'ensemble" },
    { value: 'settings', label: 'Paramètres' },
    { value: 'reminders', label: 'Rappels' },
    { value: 'content', label: 'Contenus' },
    { value: 'validation', label: 'Validation' },
    { value: 'history', label: 'Historique' },
  ],
};

const COPY: Record<FeatureKind, { title: string; description: string }> = {
  hijri: {
    title: 'Calendrier Hijri',
    description:
      'Contrôlez l’affichage du calendrier Hijri sans déclarer de source officielle non connectée.',
  },
  ramadan: {
    title: 'Ramadan / Qadaa',
    description:
      'Gérez les marqueurs, contenus et rappels avec uniquement des données agrégées et non sensibles.',
  },
  nifas: {
    title: 'Nifas',
    description:
      'Gérez le repère AWA, les rappels et contenus éducatifs avec une formulation religieuse neutre.',
  },
};

function BooleanDraftField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3.5">
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[18px] border border-border bg-white p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-foreground">{value}</p>
    </article>
  );
}

function SettingsPanel({
  kind,
  configuration,
  onChange,
  onSave,
}: {
  kind: FeatureKind;
  configuration: SpiritualFeatureConfiguration;
  onChange: (configuration: SpiritualFeatureConfiguration) => void;
  onSave: () => void;
}) {
  const set = <K extends keyof SpiritualFeatureConfiguration>(
    key: K,
    value: SpiritualFeatureConfiguration[K]
  ) => onChange({ ...configuration, [key]: value });

  return (
    <section className="rounded-[20px] border border-border bg-[#faf8fa] p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-ghost text-primary">
          <Settings size={18} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Paramètres</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Les changements restent en brouillon jusqu’à confirmation serveur.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <BooleanDraftField
          label="Fonctionnalité activée"
          value={configuration.enabled}
          onChange={(value) => set('enabled', value)}
        />
        {kind === 'hijri' && (
          <>
            <label className="rounded-xl border border-border bg-white px-4 py-3">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                Ajustement Hijri
              </span>
              <select
                value={configuration.hijriAdjustmentDays ?? 0}
                onChange={(event) =>
                  set('hijriAdjustmentDays', Number(event.target.value) as -1 | 0 | 1)
                }
                className="input-field h-10 bg-white"
              >
                <option value={-1}>-1 jour</option>
                <option value={0}>0 jour</option>
                <option value={1}>+1 jour</option>
              </select>
            </label>
            <label className="rounded-xl border border-border bg-white px-4 py-3">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                Affichage par défaut
              </span>
              <select
                value={configuration.calendarDisplayMode ?? 'gregorian'}
                onChange={(event) =>
                  set('calendarDisplayMode', event.target.value as 'gregorian' | 'hijri' | 'dual')
                }
                className="input-field h-10 bg-white"
              >
                <option value="gregorian">Grégorien</option>
                <option value="hijri">Hijri</option>
                <option value="dual">Double</option>
              </select>
            </label>
            <BooleanDraftField
              label="Afficher la date Hijri"
              value={configuration.showHijriDate}
              onChange={(value) => set('showHijriDate', value)}
            />
            <BooleanDraftField
              label="Afficher aussi la date grégorienne"
              value={configuration.showGregorianDate}
              onChange={(value) => set('showGregorianDate', value)}
            />
            <BooleanDraftField
              label="Afficher les marqueurs islamiques"
              value={configuration.showIslamicMarkers}
              onChange={(value) => set('showIslamicMarkers', value)}
            />
            <BooleanDraftField
              label="Notifications d’événements"
              value={configuration.eventNotifications}
              onChange={(value) => set('eventNotifications', value)}
            />
          </>
        )}
        {kind === 'ramadan' && (
          <>
            <BooleanDraftField
              label="Suivi Qadaa activé"
              value={configuration.qadaaEnabled}
              onChange={(value) => set('qadaaEnabled', value)}
            />
            <BooleanDraftField
              label="Marqueurs Ramadan"
              value={configuration.showRamadanMarkers}
              onChange={(value) => set('showRamadanMarkers', value)}
            />
            <BooleanDraftField
              label="Contenus éducatifs"
              value={configuration.educationalContentEnabled}
              onChange={(value) => set('educationalContentEnabled', value)}
            />
            <BooleanDraftField
              label="Rappels locaux"
              value={configuration.localRemindersEnabled}
              onChange={(value) => set('localRemindersEnabled', value)}
            />
            <BooleanDraftField
              label="Rappels après Ramadan"
              value={configuration.postRamadanRemindersEnabled}
              onChange={(value) => set('postRamadanRemindersEnabled', value)}
            />
            <BooleanDraftField
              label="Notifications spirituelles"
              value={configuration.spiritualNotificationsEnabled}
              onChange={(value) => set('spiritualNotificationsEnabled', value)}
            />
          </>
        )}
        {kind === 'nifas' && (
          <>
            <div className="rounded-xl border border-border bg-white px-4 py-3.5">
              <p className="text-xs font-semibold text-foreground">Repère retenu par AWA</p>
              <p className="mt-1 text-sm font-semibold text-primary">
                {configuration.nifasReferenceDays ?? 40} jours
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Ce repère central n’est pas présenté comme une règle universelle.
              </p>
            </div>
            <BooleanDraftField
              label="Rappels Nifas"
              value={configuration.nifasRemindersEnabled}
              onChange={(value) => set('nifasRemindersEnabled', value)}
            />
            <BooleanDraftField
              label="Message de fin de repère"
              value={configuration.nifasCompletionMessageEnabled}
              onChange={(value) => set('nifasCompletionMessageEnabled', value)}
            />
            <BooleanDraftField
              label="Liens vers les contenus éducatifs"
              value={configuration.nifasEducationalLinksEnabled}
              onChange={(value) => set('nifasEducationalLinksEnabled', value)}
            />
          </>
        )}
      </div>
      {kind === 'hijri' && (
        <p className="mt-4 rounded-xl bg-[#f4f1f5] px-4 py-3 text-xs leading-5 text-muted-foreground">
          Le calendrier peut être ajusté manuellement selon la référence retenue. Aucune
          synchronisation officielle d’observation lunaire n’est configurée.
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onSave} className="btn-primary h-10">
          Enregistrer les paramètres
        </button>
      </div>
    </section>
  );
}

function EventsPanel({ events }: { events: SpiritualEvent[] }) {
  if (!events.length)
    return (
      <SpiritualEmptyState
        title="Aucun événement configuré"
        description="Aucune date religieuse ou règle de calcul n’a été inventée dans le jeu de données administratif."
      />
    );
  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <article key={event.id} className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm font-semibold">{event.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {event.hijriDate ?? 'Date Hijri non renseignée'} ·{' '}
            {event.gregorianDate ?? 'Date grégorienne non renseignée'}
          </p>
        </article>
      ))}
    </div>
  );
}

export default function FeatureControlContent({
  kind,
  configuration: initialConfiguration,
  events,
  reminders,
  history,
  linkedArticles,
}: {
  kind: FeatureKind;
  configuration: SpiritualFeatureConfiguration;
  events: SpiritualEvent[];
  reminders: SpiritualReminder[];
  history: SpiritualAuditEntry[];
  linkedArticles: SpiritualArticle[];
}) {
  const [tab, setTab] = useState<FeatureTab>('overview');
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const [confirmSave, setConfirmSave] = useState(false);
  const save = async () => {
    try {
      await saveSpiritualConfiguration(configuration);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enregistrement indisponible.');
    }
    setConfirmSave(false);
  };
  const overview =
    kind === 'hijri'
      ? [
          ['Date Hijri actuelle', 'Non disponible'],
          ['Équivalent grégorien', 'Non disponible'],
          [
            'Ajustement',
            configuration.hijriAdjustmentDays === undefined
              ? 'Non configuré'
              : `${configuration.hijriAdjustmentDays > 0 ? '+' : ''}${configuration.hijriAdjustmentDays} jour`,
          ],
          ['Prochain événement', 'Non renseigné'],
        ]
      : kind === 'ramadan'
        ? [
            ['Prochaine période', 'Non calculée'],
            ['Utilisation Qadaa', 'Donnée agrégée indisponible'],
            ['Contenus liés', String(linkedArticles.length)],
            ['Notifications planifiées', String(reminders.length)],
          ]
        : [
            ['Repère retenu par AWA', `${configuration.nifasReferenceDays ?? 40} jours`],
            [
              'Configuration des rappels',
              configuration.nifasRemindersEnabled === undefined
                ? 'Non configurée'
                : configuration.nifasRemindersEnabled
                  ? 'Activée'
                  : 'Désactivée',
            ],
            ['Articles liés', String(linkedArticles.length)],
            ['Dernière mise à jour', configuration.updatedAt ?? 'Non renseignée'],
          ];

  return (
    <div className="min-w-0 space-y-6">
      <SpiritualPageHeader title={COPY[kind].title} description={COPY[kind].description} />
      <BackendNotice />
      <PrivacyNotice />
      <SpiritualTabs value={tab} onChange={setTab} items={TAB_SETS[kind]} />
      {tab === 'overview' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <FeatureStatusCard enabled={configuration.enabled} />
            {overview.map(([label, value]) => (
              <Metric key={label} label={label} value={value} />
            ))}
          </div>
          {kind === 'hijri' && (
            <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-primary" size={19} />
                <h2 className="font-display text-lg font-semibold">Aperçu du calendrier</h2>
              </div>
              <div className="mt-4">
                <SpiritualEmptyState
                  title="Aperçu indisponible"
                  description="Aucun moteur de conversion Hijri n’est connecté à ce projet administratif."
                />
              </div>
            </section>
          )}
        </>
      )}
      {tab === 'settings' && (
        <SettingsPanel
          kind={kind}
          configuration={configuration}
          onChange={setConfiguration}
          onSave={() => setConfirmSave(true)}
        />
      )}
      {tab === 'events' && (
        <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-semibold">Événements</h2>
          <EventsPanel events={events} />
        </section>
      )}
      {tab === 'sync' && (
        <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
          <SpiritualEmptyState
            title="Aucune synchronisation officielle"
            description="Aucune source fiable de synchronisation lunaire n’est configurée. L’ajustement reste manuel selon la référence retenue."
          />
        </section>
      )}
      {(tab === 'notifications' || tab === 'reminders') && (
        <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-semibold">
            {tab === 'notifications' ? 'Notifications' : 'Rappels'}
          </h2>
          {reminders.length ? (
            <div className="grid gap-3">
              {reminders.map((item) => (
                <article key={item.id} className="rounded-xl border border-border p-4">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <SpiritualEmptyState
              title="Aucun modèle configuré"
              description="Aucun texte de notification ou de rappel n’a été inventé."
            />
          )}
        </section>
      )}
      {tab === 'content' && (
        <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <Link2 size={18} className="text-primary" />
            <h2 className="font-display text-lg font-semibold">Contenus liés</h2>
          </div>
          {linkedArticles.length ? (
            <div className="grid gap-3">
              {linkedArticles.map((article) => (
                <article
                  key={article.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">{article.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {article.category} · {article.access === 'FREE' ? 'Gratuit' : 'Premium'}
                    </p>
                  </div>
                  <ValidationStatusBadge status={article.validationStatus} />
                </article>
              ))}
            </div>
          ) : (
            <SpiritualEmptyState
              title="Aucun contenu lié"
              description="Aucune association de contenu n’est disponible pour ce module."
            />
          )}
        </section>
      )}
      {tab === 'validation' && (
        <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
          <SpiritualEmptyState
            title="Aucune validation Nifas"
            description="Aucun workflow de validation Nifas n’est fourni par la source actuelle."
          />
        </section>
      )}
      {tab === 'history' && (
        <section className="rounded-[20px] border border-border bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <History size={18} className="text-primary" />
            <h2 className="font-display text-lg font-semibold">Historique administratif</h2>
          </div>
          {history.length ? (
            <div>
              {history.map((item) => (
                <p key={item.id}>{item.action}</p>
              ))}
            </div>
          ) : (
            <SpiritualEmptyState
              title="Aucun historique disponible"
              description="Aucun service d’audit spirituel n’est connecté à ce projet."
            />
          )}
        </section>
      )}
      {confirmSave && (
        <SpiritualModal
          title="Confirmer ces paramètres ?"
          subtitle={COPY[kind].title}
          onClose={() => setConfirmSave(false)}
        >
          <div className="space-y-4 p-5 sm:p-6">
            <BackendNotice />
            <p className="text-sm leading-6 text-muted-foreground">
              Cette configuration ne sera envoyée qu’après confirmation. Sans backend connecté,
              aucun changement ne sera appliqué.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmSave(false)}
                className="btn-secondary h-10"
              >
                Annuler
              </button>
              <button type="button" onClick={save} className="btn-primary h-10">
                <ShieldCheck size={15} /> Confirmer
              </button>
            </div>
          </div>
        </SpiritualModal>
      )}
    </div>
  );
}
