'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Check,
  ChevronRight,
  Globe2,
  Info,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/app/content/components/ContentUI';
import { ADMIN_ROUTES } from '@/config/adminRoutes';
import { DEFAULT_GLOBAL_SETTINGS } from '@/data/configuration';
import {
  ConfigurationPageHeader,
  FieldLabel,
  fieldClassName,
  PrimaryButton,
  SecondaryButton,
  SessionNotice,
  textAreaClassName,
} from './ConfigurationUI';

type EditableSettings = {
  appName: string;
  description: string;
};

const DEFAULT_EDITABLE: EditableSettings = {
  appName: DEFAULT_GLOBAL_SETTINGS.appName,
  description: DEFAULT_GLOBAL_SETTINGS.description,
};

function SettingsCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-border bg-white p-5 shadow-card sm:p-6">
      <header className="mb-5 flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-primary-ghost text-primary">
          {icon}
        </span>
        <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function ManagedSetting({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-[#fbf9fb] p-3 transition-colors hover:border-primary/25 hover:bg-primary-ghost focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
          {description}
        </span>
      </span>
      <ChevronRight
        size={15}
        className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
      />
    </Link>
  );
}

export default function GlobalSettingsContent() {
  const [saved, setSaved] = useState<EditableSettings>(DEFAULT_EDITABLE);
  const [draft, setDraft] = useState<EditableSettings>(DEFAULT_EDITABLE);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [error, setError] = useState('');
  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [draft, saved]);

  const save = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.appName.trim()) {
      setError('Le nom de l’application est requis.');
      return;
    }
    if (!draft.description.trim()) {
      setError('La description est requise.');
      return;
    }
    setError('');
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    const next = { appName: draft.appName.trim(), description: draft.description.trim() };
    setDraft(next);
    setSaved(next);
    setSaving(false);
    toast.success('Paramètres enregistrés pour cette session.');
  };

  const reset = () => {
    setDraft(DEFAULT_EDITABLE);
    setSaved(DEFAULT_EDITABLE);
    setError('');
    setResetOpen(false);
    toast.success('Les paramètres éditables ont été réinitialisés.');
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-w-0 space-y-6"
      onSubmit={save}
    >
      <ConfigurationPageHeader
        title="Paramètres globaux"
        subtitle="Configurez les paramètres généraux de l’application."
        action={
          <PrimaryButton type="submit" disabled={saving || !dirty}>
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : dirty ? (
              <Save size={15} aria-hidden="true" />
            ) : (
              <Check size={15} aria-hidden="true" />
            )}
            {saving ? 'Enregistrement...' : dirty ? 'Enregistrer' : 'Enregistré'}
          </PrimaryButton>
        }
      />

      <SessionNotice>
        Aucun backend de configuration n’est connecté. Les champs éditables sont conservés pendant
        cette session ; les valeurs techniques proviennent de l’application mobile.
      </SessionNotice>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 text-xs text-danger"
        >
          {error}
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <SettingsCard icon={<Info size={18} />} title="Informations de l’application">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <label>
              <FieldLabel>Nom de l’application</FieldLabel>
              <input
                required
                maxLength={50}
                value={draft.appName}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, appName: event.target.value }));
                  setError('');
                }}
                className={fieldClassName}
              />
            </label>
            <label>
              <FieldLabel>Version actuelle</FieldLabel>
              <input
                readOnly
                aria-readonly="true"
                value={DEFAULT_GLOBAL_SETTINGS.version}
                className={fieldClassName}
              />
              <span className="mt-1 block text-[9px] text-muted-foreground">
                Issue des métadonnées de build
              </span>
            </label>
            <label className="sm:col-span-2">
              <FieldLabel>Description</FieldLabel>
              <textarea
                required
                maxLength={160}
                rows={4}
                value={draft.description}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, description: event.target.value }));
                  setError('');
                }}
                className={textAreaClassName}
              />
              <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                {draft.description.length}/160
              </span>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard icon={<Globe2 size={18} />} title="Paramètres régionaux">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <FieldLabel>Langue par défaut</FieldLabel>
              <select value={DEFAULT_GLOBAL_SETTINGS.language} disabled className={fieldClassName}>
                <option>Français</option>
              </select>
              <span className="mt-1 block text-[9px] text-muted-foreground">
                Seule langue actuellement prise en charge
              </span>
            </label>
            <label>
              <FieldLabel>Fuseau horaire</FieldLabel>
              <input
                readOnly
                aria-readonly="true"
                value={DEFAULT_GLOBAL_SETTINGS.timezone}
                className={fieldClassName}
              />
            </label>
            <label className="sm:col-span-2">
              <FieldLabel>Format de date</FieldLabel>
              <input
                readOnly
                aria-readonly="true"
                value={DEFAULT_GLOBAL_SETTINGS.dateFormat}
                className={fieldClassName}
              />
            </label>
          </div>
        </SettingsCard>

        <SettingsCard icon={<BookOpen size={18} />} title="Paramètres de contenu">
          <div className="space-y-3">
            <ManagedSetting
              icon={<BookOpen size={16} />}
              title="Articles et contenu religieux"
              description="Gérés depuis la source unique Feature Flags."
              href={ADMIN_ROUTES.configuration.flags}
            />
            <ManagedSetting
              icon={<Palette size={16} />}
              title="Thèmes personnalisés"
              description="Disponibilité et métadonnées gérées dans Thèmes."
              href={ADMIN_ROUTES.configuration.themes}
            />
          </div>
        </SettingsCard>

        <SettingsCard icon={<ShieldCheck size={18} />} title="Confidentialité de l’application">
          <div className="rounded-xl border border-border bg-[#fbf9fb] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-success" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Données locales et mode anonyme
                </p>
                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  AWA stocke actuellement les données sur l’appareil. Le mode anonyme est piloté par
                  le flag existant, sans imposer de validation e-mail ni d’approbation manuelle.
                </p>
                <Link
                  href={ADMIN_ROUTES.configuration.flags}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-light"
                >
                  Gérer le mode anonyme <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-[18px] border border-border bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold text-foreground">
            Réinitialiser les paramètres éditables
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            La version, la langue et les sources de configuration ne seront pas modifiées.
          </p>
        </div>
        <SecondaryButton onClick={() => setResetOpen(true)}>
          <RotateCcw size={13} /> Réinitialiser
        </SecondaryButton>
      </div>

      <AnimatePresence>
        {resetOpen && (
          <ConfirmDialog
            title="Réinitialiser les paramètres ?"
            message="Seuls le nom et la description éditables de cette session seront restaurés à leurs valeurs par défaut."
            confirmLabel="Réinitialiser"
            onCancel={() => setResetOpen(false)}
            onConfirm={reset}
          />
        )}
      </AnimatePresence>
    </motion.form>
  );
}
