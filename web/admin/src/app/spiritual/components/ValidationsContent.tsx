'use client';

import React, { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { SpiritualValidationRecord, SpiritualValidationStatus } from '@/types/spiritual';
import { SearchInput, SelectField, formatContentDate } from '@/app/content/components/ContentUI';
import {
  BackendNotice,
  FeatureStatusCard,
  PrivacyNotice,
  SpiritualEmptyState,
  SpiritualPageHeader,
  SpiritualTabs,
  ValidationStatusBadge,
} from './SpiritualUI';

type ValidationTab =
  | 'pending_review'
  | 'in_review'
  | 'validated'
  | 'rejected'
  | 'changes_requested'
  | 'all';

const tabs: Array<{ value: ValidationTab; label: string }> = [
  { value: 'pending_review', label: 'En attente' },
  { value: 'in_review', label: 'En revue' },
  { value: 'validated', label: 'Validé' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'changes_requested', label: 'Corrections demandées' },
  { value: 'all', label: 'Toutes' },
];

export default function ValidationsContent({
  validations,
}: {
  validations: SpiritualValidationRecord[];
}) {
  const [tab, setTab] = useState<ValidationTab>('pending_review');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [reviewer, setReviewer] = useState('all');
  const [category, setCategory] = useState('all');
  const reviewers = Array.from(
    new Set(validations.map((item) => item.reviewer).filter((value): value is string => !!value))
  );
  const categories = Array.from(new Set(validations.map((item) => item.category)));
  const filtered = useMemo(
    () =>
      validations.filter(
        (item) =>
          (tab === 'all' || item.status === tab) &&
          (!search ||
            item.contentTitle.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))) &&
          (type === 'all' || item.validationType === type) &&
          (reviewer === 'all' || item.reviewer === reviewer) &&
          (category === 'all' || item.category === category)
      ),
    [category, reviewer, search, tab, type, validations]
  );

  return (
    <div className="min-w-0 space-y-6">
      <SpiritualPageHeader
        title="Validations"
        description="Pilotez les demandes de validation sans attribuer automatiquement de décision ni de validateur."
      />
      <BackendNotice />
      <PrivacyNotice />
      <div className="max-w-xs">
        <FeatureStatusCard enabled={undefined} label="Workflow de validation" />
      </div>
      <SpiritualTabs value={tab} onChange={setTab} items={tabs} />
      <section className="rounded-[18px] border border-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-2">
          <SearchInput
            comfortable
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un contenu..."
          />
          <SelectField compact comfortable label="Type" value={type} onChange={setType}>
            <option value="all">Type de validation</option>
            <option value="religious">Religieuse</option>
            <option value="medical">Médicale</option>
          </SelectField>
          <SelectField
            compact
            comfortable
            label="Validateur"
            value={reviewer}
            onChange={setReviewer}
          >
            <option value="all">Validateur</option>
            {reviewers.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </SelectField>
          <SelectField
            compact
            comfortable
            label="Catégorie"
            value={category}
            onChange={setCategory}
          >
            <option value="all">Catégorie</option>
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </SelectField>
        </div>
      </section>
      <section className="overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                <th className="px-4 py-4">Contenu</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Catégorie</th>
                <th className="px-4 py-4">Soumis par</th>
                <th className="px-4 py-4">Validateur</th>
                <th className="px-4 py-4">Soumission</th>
                <th className="px-4 py-4">Statut</th>
                <th className="px-4 py-4">Mise à jour</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#fbf9fb]">
                  <td className="px-4 py-4 text-sm font-semibold text-foreground">
                    {item.contentTitle}
                  </td>
                  <td className="px-4 py-4 text-[13px]">
                    {item.validationType === 'religious' ? 'Religieuse' : 'Médicale'}
                  </td>
                  <td className="px-4 py-4 text-[13px]">{item.category}</td>
                  <td className="px-4 py-4 text-[13px] text-muted-foreground">
                    {item.submittedBy ?? 'Non renseigné'}
                  </td>
                  <td className="px-4 py-4 text-[13px] text-muted-foreground">
                    {item.reviewer ?? 'Non assigné'}
                  </td>
                  <td className="px-4 py-4 text-[13px] text-muted-foreground">
                    {formatContentDate(item.submittedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <ValidationStatusBadge status={item.status as SpiritualValidationStatus} />
                  </td>
                  <td className="px-4 py-4 text-[13px] text-muted-foreground">
                    {formatContentDate(item.updatedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      aria-label={`Actions pour ${item.contentTitle}`}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="p-5">
            <SpiritualEmptyState
              title="Aucune validation disponible"
              description="Aucun workflow de validation n’est connecté. Aucun validateur, commentaire ou état de décision n’a été inventé."
            />
          </div>
        )}
      </section>
    </div>
  );
}
