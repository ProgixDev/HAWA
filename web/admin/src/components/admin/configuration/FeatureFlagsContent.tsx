'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  BookOpen,
  Download,
  Palette,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdminFeatureFlag, FeatureFlagCategory } from '@/data/configuration';
import { INITIAL_FEATURE_FLAGS, normalizeConfigurationSearch } from '@/data/configuration';
import {
  ConfigurationPageHeader,
  ConfigurationSearch,
  SessionNotice,
  Switch,
} from './ConfigurationUI';

type Filter = 'Toutes' | FeatureFlagCategory;

const FILTERS: Filter[] = ['Toutes', 'Fonctionnalités', 'Contenu', 'Premium'];

const FLAG_ICONS = {
  library: BookOpen,
  moon: Sparkles,
  export: Download,
  chart: BarChart3,
  palette: Palette,
  anonymous: ShieldCheck,
  bell: Bell,
  reminder: TimerReset,
};

function FlagIcon({ flag }: { flag: AdminFeatureFlag }) {
  const Icon = FLAG_ICONS[flag.icon];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-primary-ghost text-primary">
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
}

export default function FeatureFlagsContent() {
  const [flags, setFlags] = useState(INITIAL_FEATURE_FLAGS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('Toutes');

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((item) => [
          item,
          item === 'Toutes' ? flags.length : flags.filter((flag) => flag.category === item).length,
        ])
      ) as Record<Filter, number>,
    [flags]
  );

  const visible = useMemo(() => {
    const query = normalizeConfigurationSearch(search);
    return flags.filter(
      (flag) =>
        (filter === 'Toutes' || flag.category === filter) &&
        normalizeConfigurationSearch(`${flag.name} ${flag.description}`).includes(query)
    );
  }, [filter, flags, search]);

  const toggle = (flag: AdminFeatureFlag, enabled: boolean) => {
    setFlags((current) =>
      current.map((item) => (item.id === flag.id ? { ...item, enabled } : item))
    );
    toast.success(`${flag.name} ${enabled ? 'activé' : 'désactivé'} pour cette session.`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <ConfigurationPageHeader
        title="Feature Flags"
        subtitle="Activez ou désactivez les fonctionnalités de l’application."
      />
      <SessionNotice>
        Aucun service distant de feature flags n’est connecté. Les interrupteurs prévisualisent la
        configuration pendant cette session uniquement.
      </SessionNotice>
      <section className="overflow-hidden rounded-[20px] border border-border bg-white shadow-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <ConfigurationSearch
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une fonctionnalité..."
          />
          <div className="-mx-1 flex overflow-x-auto px-1" aria-label="Filtrer les feature flags">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={`relative shrink-0 rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors ${
                  filter === item
                    ? 'bg-primary-pale text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item} <span className="ml-1 opacity-65">{counts[item]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border/80">
          {visible.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#fbf9fb] sm:px-5"
            >
              <FlagIcon flag={flag} />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-foreground">{flag.name}</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{flag.description}</p>
              </div>
              <span className="hidden rounded-full bg-[#f1edf3] px-2.5 py-1 text-[9px] font-semibold text-[#6c587c] sm:inline-flex">
                {flag.category}
              </span>
              <Switch
                checked={flag.enabled}
                onChange={(enabled) => toggle(flag, enabled)}
                label={`${flag.enabled ? 'Désactiver' : 'Activer'} ${flag.name}`}
              />
            </div>
          ))}
          {!visible.length && (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-foreground">Aucun flag trouvé</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Modifiez la recherche ou le filtre sélectionné.
              </p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
