'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Pencil, Power, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminTheme } from '@/data/configuration';
import { INITIAL_THEMES, normalizeConfigurationSearch } from '@/data/configuration';
import { ActionButton, Modal, RowActions } from '@/app/content/components/ContentUI';
import {
  ConfigurationPageHeader,
  ConfigurationSearch,
  FieldLabel,
  fieldClassName,
  PrimaryButton,
  SecondaryButton,
  SessionNotice,
  StatusPill,
  Switch,
  textAreaClassName,
} from './ConfigurationUI';

function ThemePreview({ theme }: { theme: AdminTheme }) {
  return (
    <div
      className="relative flex h-36 items-center justify-center overflow-hidden rounded-[16px] border"
      style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.primary }}
      aria-label={`Aperçu mobile du thème ${theme.name}`}
    >
      <span
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20"
        style={{ backgroundColor: theme.colors.secondary }}
      />
      <span
        className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full opacity-15"
        style={{ backgroundColor: theme.colors.primary }}
      />
      <div
        className="relative h-[112px] w-[64px] rounded-[13px] border p-2 shadow-[0_8px_18px_rgba(36,26,44,0.16)]"
        style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }}
      >
        <div
          className="mx-auto h-1 w-5 rounded-full opacity-35"
          style={{ background: theme.colors.text }}
        />
        <div className="mt-3 h-2 w-8 rounded-full" style={{ background: theme.colors.primary }} />
        <div
          className="mt-1 h-1 w-10 rounded-full opacity-30"
          style={{ background: theme.colors.text }}
        />
        <div
          className="mt-3 h-10 rounded-lg p-1.5"
          style={{ backgroundColor: theme.colors.background }}
        >
          <div
            className="h-1 w-7 rounded-full opacity-60"
            style={{ background: theme.colors.text }}
          />
          <div className="mt-2 flex gap-1">
            <span className="h-3 w-3 rounded-full" style={{ background: theme.colors.primary }} />
            <span className="h-3 w-3 rounded-full" style={{ background: theme.colors.secondary }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeForm({
  theme,
  onCancel,
  onSave,
}: {
  theme: AdminTheme;
  onCancel: () => void;
  onSave: (theme: AdminTheme) => void;
}) {
  const [name, setName] = useState(theme.name);
  const [description, setDescription] = useState(theme.description);
  const [enabled, setEnabled] = useState(theme.enabled);

  return (
    <form
      className="space-y-5 p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...theme, name: name.trim(), description: description.trim(), enabled });
      }}
    >
      <SessionNotice>
        Les couleurs proviennent du registre mobile AWA et restent en lecture seule. Les métadonnées
        sont modifiables pour cette session.
      </SessionNotice>
      <label>
        <FieldLabel>Nom</FieldLabel>
        <input
          required
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClassName}
        />
      </label>
      <label>
        <FieldLabel>Description</FieldLabel>
        <textarea
          required
          rows={3}
          maxLength={120}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={textAreaClassName}
        />
      </label>
      <div className="rounded-xl border border-border bg-white p-3.5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-foreground">Thème disponible</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {theme.isDefault
                ? 'Le thème par défaut doit rester disponible.'
                : 'Visible dans le sélecteur mobile.'}
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={setEnabled}
            label={`Disponibilité de ${theme.name}`}
            disabled={theme.isDefault}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Palette mobile</FieldLabel>
        <div className="flex gap-2">
          {Object.entries(theme.colors).map(([name, color]) => (
            <span
              key={name}
              title={`${name}: ${color}`}
              className="h-8 w-8 rounded-full border border-black/10 shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <SecondaryButton onClick={onCancel}>Annuler</SecondaryButton>
        <PrimaryButton type="submit">Enregistrer</PrimaryButton>
      </div>
    </form>
  );
}

export default function ThemesContent() {
  const [themes, setThemes] = useState(INITIAL_THEMES);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminTheme | null>(null);

  const visible = useMemo(() => {
    const query = normalizeConfigurationSearch(search);
    return themes
      .filter((theme) =>
        normalizeConfigurationSearch(`${theme.name} ${theme.description}`).includes(query)
      )
      .sort((a, b) => a.order - b.order);
  }, [search, themes]);

  const save = (theme: AdminTheme) => {
    setThemes((current) => current.map((item) => (item.id === theme.id ? theme : item)));
    toast.success('Thème mis à jour pour cette session.');
    setEditing(null);
  };

  const toggle = (theme: AdminTheme) => {
    if (theme.isDefault) {
      toast.error('AWA Original est le thème par défaut et ne peut pas être désactivé.');
      return;
    }
    setThemes((current) =>
      current.map((item) => (item.id === theme.id ? { ...item, enabled: !item.enabled } : item))
    );
    toast.success(theme.enabled ? 'Thème désactivé.' : 'Thème activé.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <ConfigurationPageHeader
        title="Thèmes"
        subtitle="Gérez les thèmes disponibles dans l’application mobile."
      />
      <SessionNotice>
        Cette page gère exclusivement les six thèmes visibles de l’application mobile AWA. Le jeu de
        couleurs de l’administration n’est pas modifié.
      </SessionNotice>
      <div className="flex justify-end">
        <ConfigurationSearch
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un thème..."
        />
      </div>
      {visible.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((theme) => (
            <article
              key={theme.id}
              className="rounded-[20px] border border-border bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <ThemePreview theme={theme} />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">{theme.name}</h2>
                    {theme.isDefault && (
                      <span className="rounded-full bg-primary-pale px-2 py-0.5 text-[9px] font-semibold text-primary">
                        Par défaut
                      </span>
                    )}
                    {theme.isPremium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f8f1e7] px-2 py-0.5 text-[9px] font-semibold text-[#9a713e]">
                        <Crown size={9} /> Premium
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{theme.description}</p>
                </div>
                <RowActions label={`Actions pour ${theme.name}`}>
                  <ActionButton onClick={() => setEditing(theme)}>
                    <Pencil size={14} /> Modifier
                  </ActionButton>
                  <ActionButton onClick={() => toggle(theme)}>
                    <Power size={14} /> {theme.enabled ? 'Désactiver' : 'Activer'}
                  </ActionButton>
                </RowActions>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                <div className="flex -space-x-1">
                  {Object.values(theme.colors).map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill active={theme.enabled} />
                  <SecondaryButton onClick={() => setEditing(theme)}>
                    <Pencil size={13} /> Modifier
                  </SecondaryButton>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[20px] border border-border bg-white px-6 py-14 text-center shadow-card">
          <Smartphone className="mx-auto text-primary" size={24} />
          <p className="mt-3 text-sm font-semibold text-foreground">Aucun thème trouvé</p>
          <p className="mt-1 text-xs text-muted-foreground">Essayez une autre recherche.</p>
        </section>
      )}

      <AnimatePresence>
        {editing && (
          <Modal title="Modifier le thème" subtitle={editing.name} onClose={() => setEditing(null)}>
            <ThemeForm
              key={editing.id}
              theme={editing}
              onCancel={() => setEditing(null)}
              onSave={save}
            />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
