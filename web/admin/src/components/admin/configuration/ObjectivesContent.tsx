'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Baby,
  CalendarDays,
  Heart,
  HeartPulse,
  MoonStar,
  Pencil,
  Pill,
  Plus,
  Power,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminObjective, ObjectiveIconName } from '@/data/configuration';
import { INITIAL_OBJECTIVES, normalizeConfigurationSearch } from '@/data/configuration';
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

const OBJECTIVE_ICONS = {
  cycle: CalendarDays,
  conceive: Heart,
  contraception: Pill,
  irregular: Activity,
  pregnancy: HeartPulse,
  postpartum: Baby,
  loss: Sparkles,
  menopause: MoonStar,
};

function ObjectiveIcon({ objective }: { objective: AdminObjective }) {
  const Icon = OBJECTIVE_ICONS[objective.icon];
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
      style={{ backgroundColor: `${objective.color}18`, color: objective.color }}
    >
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

function ObjectiveForm({
  objective,
  names,
  nextOrder,
  onCancel,
  onSave,
}: {
  objective?: AdminObjective;
  names: string[];
  nextOrder: number;
  onCancel: () => void;
  onSave: (objective: AdminObjective) => void;
}) {
  const [name, setName] = useState(objective?.name ?? '');
  const [description, setDescription] = useState(objective?.description ?? '');
  const [icon, setIcon] = useState<ObjectiveIconName>(objective?.icon ?? 'cycle');
  const [color, setColor] = useState(objective?.color ?? '#6f5a8a');
  const [active, setActive] = useState(objective?.active ?? true);
  const [onboardingVisible, setOnboardingVisible] = useState(objective?.onboardingVisible ?? true);
  const [experimental, setExperimental] = useState(objective?.experimental ?? false);
  const [order, setOrder] = useState(objective?.order ?? nextOrder);
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const duplicate = names.some(
      (item) =>
        normalizeConfigurationSearch(item) === normalizeConfigurationSearch(cleanName) &&
        normalizeConfigurationSearch(item) !== normalizeConfigurationSearch(objective?.name ?? '')
    );
    if (duplicate) {
      setError('Un objectif porte déjà ce nom.');
      return;
    }
    const baseId = normalizeConfigurationSearch(cleanName).replace(/[^a-z0-9]+/g, '-');
    onSave({
      id: objective?.id ?? `session-${baseId || Date.now()}`,
      name: cleanName,
      description: description.trim(),
      icon,
      color,
      active,
      onboardingVisible,
      experimental,
      order: Math.max(1, order),
    });
  };

  return (
    <form className="space-y-5 p-5 sm:p-6" onSubmit={submit}>
      <SessionNotice>
        Les identifiants des objectifs mobiles existants restent immuables. Un nouvel objectif est
        ajouté uniquement à cette session d’administration.
      </SessionNotice>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <FieldLabel>Nom</FieldLabel>
          <input
            required
            maxLength={60}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            className={fieldClassName}
          />
          {error && <span className="mt-1 block text-[10px] text-danger">{error}</span>}
        </label>
        <label className="sm:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <textarea
            required
            maxLength={140}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={textAreaClassName}
          />
          <span className="mt-1 block text-right text-[10px] text-muted-foreground">
            {description.length}/140
          </span>
        </label>
        <label>
          <FieldLabel>Icône</FieldLabel>
          <select
            value={icon}
            onChange={(event) => setIcon(event.target.value as ObjectiveIconName)}
            className={fieldClassName}
          >
            <option value="cycle">Calendrier</option>
            <option value="conceive">Cœur</option>
            <option value="contraception">Contraception</option>
            <option value="irregular">Activité</option>
            <option value="pregnancy">Santé</option>
            <option value="postpartum">Post-partum</option>
            <option value="loss">Soutien</option>
            <option value="menopause">Ménopause</option>
          </select>
        </label>
        <label>
          <FieldLabel>Ordre</FieldLabel>
          <input
            type="number"
            min={1}
            max={99}
            value={order}
            onChange={(event) => setOrder(Number(event.target.value))}
            className={fieldClassName}
          />
        </label>
        <label>
          <FieldLabel>Couleur</FieldLabel>
          <div className="flex gap-2">
            <input
              aria-label="Couleur de l’objectif"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-11 w-14 rounded-xl border border-border bg-white p-1.5"
            />
            <input
              value={color}
              onChange={(event) => setColor(event.target.value)}
              pattern="#[0-9A-Fa-f]{6}"
              className={fieldClassName}
            />
          </div>
        </label>
      </div>
      <div className="space-y-2.5 rounded-xl border border-border bg-white p-3.5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-foreground">Objectif actif</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Disponibilité générale de l’objectif dans l’application.
            </p>
          </div>
          <Switch checked={active} onChange={setActive} label="Objectif actif" />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
          <div>
            <p className="text-xs font-semibold text-foreground">Visible dans l’onboarding</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Apparaît dans l’écran de sélection d’objectif à la création du compte.
            </p>
          </div>
          <Switch
            checked={onboardingVisible}
            onChange={setOnboardingVisible}
            label="Visible dans l’onboarding"
          />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-2.5">
          <div>
            <p className="text-xs font-semibold text-foreground">Fonctionnalité expérimentale</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Affiche un badge « Expérimental » dans la liste des objectifs.
            </p>
          </div>
          <Switch
            checked={experimental}
            onChange={setExperimental}
            label="Fonctionnalité expérimentale"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <SecondaryButton onClick={onCancel}>Annuler</SecondaryButton>
        <PrimaryButton type="submit">{objective ? 'Enregistrer' : 'Ajouter'}</PrimaryButton>
      </div>
    </form>
  );
}

export default function ObjectivesContent() {
  const [objectives, setObjectives] = useState(INITIAL_OBJECTIVES);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<AdminObjective | 'new' | null>(null);

  const visible = useMemo(() => {
    const query = normalizeConfigurationSearch(search);
    return [...objectives]
      .sort((a, b) => a.order - b.order)
      .filter((objective) =>
        normalizeConfigurationSearch(`${objective.name} ${objective.description}`).includes(query)
      );
  }, [objectives, search]);

  const saveObjective = (objective: AdminObjective) => {
    const exists = objectives.some((item) => item.id === objective.id);
    setObjectives((current) =>
      exists
        ? current.map((item) => (item.id === objective.id ? objective : item))
        : [...current, objective]
    );
    toast.success(exists ? 'Objectif mis à jour.' : 'Objectif ajouté à cette session.');
    setEditing(null);
  };

  const toggle = (objective: AdminObjective) => {
    setObjectives((current) =>
      current.map((item) => (item.id === objective.id ? { ...item, active: !item.active } : item))
    );
    toast.success(objective.active ? 'Objectif désactivé.' : 'Objectif activé.');
  };

  const move = (objective: AdminObjective, direction: -1 | 1) => {
    setObjectives((current) => {
      const ordered = [...current].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((item) => item.id === objective.id);
      const target = index + direction;
      if (target < 0 || target >= ordered.length) return current;
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      return ordered.map((item, itemIndex) => ({ ...item, order: itemIndex + 1 }));
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <ConfigurationPageHeader
        title="Objectifs"
        subtitle="Gérez les objectifs disponibles dans l’application."
        action={
          <PrimaryButton onClick={() => setEditing('new')}>
            <Plus size={15} aria-hidden="true" /> Ajouter un objectif
          </PrimaryButton>
        }
      />
      <SessionNotice />
      <section className="overflow-visible rounded-[20px] border border-border bg-white shadow-card">
        <div className="border-b border-border p-4">
          <ConfigurationSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un objectif..."
          />
        </div>
        <div className="divide-y divide-border/80">
          {visible.map((objective, index) => (
            <motion.article
              layout
              key={objective.id}
              className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-[#fbf9fb] sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ObjectiveIcon objective={objective} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">{objective.name}</h2>
                    {objective.experimental && (
                      <span className="rounded-full bg-[#fff3df] px-2 py-0.5 text-[9px] font-semibold text-[#9a713e]">
                        Expérimental
                      </span>
                    )}
                    {!objective.onboardingVisible && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        Masqué à l’onboarding
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {objective.description}
                  </p>
                </div>
              </div>
              <div className="ml-14 flex items-center justify-between gap-3 sm:ml-0 sm:justify-end">
                <StatusPill active={objective.active} />
                <SecondaryButton onClick={() => setEditing(objective)}>
                  <Pencil size={13} aria-hidden="true" /> Modifier
                </SecondaryButton>
                <RowActions label={`Actions pour ${objective.name}`}>
                  <ActionButton onClick={() => toggle(objective)}>
                    <Power size={14} /> {objective.active ? 'Désactiver' : 'Activer'}
                  </ActionButton>
                  <ActionButton onClick={() => move(objective, -1)}>
                    <ArrowUp size={14} /> Monter
                  </ActionButton>
                  <ActionButton onClick={() => move(objective, 1)}>
                    <ArrowDown size={14} /> Descendre
                  </ActionButton>
                </RowActions>
              </div>
              <span className="sr-only">Position {index + 1}</span>
            </motion.article>
          ))}
          {!visible.length && (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-foreground">Aucun objectif trouvé</p>
              <p className="mt-1 text-xs text-muted-foreground">Essayez une autre recherche.</p>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {editing && (
          <Modal
            title={editing === 'new' ? 'Ajouter un objectif' : 'Modifier l’objectif'}
            subtitle={editing === 'new' ? undefined : editing.name}
            onClose={() => setEditing(null)}
          >
            <ObjectiveForm
              key={editing === 'new' ? 'new' : editing.id}
              objective={editing === 'new' ? undefined : editing}
              names={objectives.map((item) => item.name)}
              nextOrder={objectives.length + 1}
              onCancel={() => setEditing(null)}
              onSave={saveObjective}
            />
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
