'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SpiritualValidationRecord, SpiritualValidationStatus } from '@/types/spiritual';
import {
  ActionButton,
  FieldLabel,
  Modal,
  RowActions,
  SearchInput,
  SelectField,
  formatContentDate,
  inputClassName,
  textareaClassName,
} from '@/app/content/components/ContentUI';
import { useSecuritySession } from '@/stores/securitySessionStore';
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

function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#f5f2f5] p-3">
      <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-xs font-semibold text-foreground">{children}</dd>
    </div>
  );
}

function HistoryList({ record }: { record: SpiritualValidationRecord }) {
  if (!record.history?.length) return null;
  return (
    <div>
      <FieldLabel>Historique des décisions</FieldLabel>
      <ul className="space-y-2">
        {record.history
          .slice()
          .reverse()
          .map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-border bg-white p-3 text-[11px] leading-5 text-muted-foreground"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <ValidationStatusBadge status={entry.previousStatus} />
                  <span aria-hidden="true">→</span>
                  <ValidationStatusBadge status={entry.newStatus} />
                </div>
                <span className="text-[10px]">{formatDateTime(entry.date)}</span>
              </div>
              {entry.comment && <p className="mt-2 text-foreground/80">{entry.comment}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">Par {entry.reviewer}</p>
            </li>
          ))}
      </ul>
    </div>
  );
}

function ValidationDetailsDialog({
  record,
  onClose,
}: {
  record: SpiritualValidationRecord;
  onClose: () => void;
}) {
  return (
    <Modal title="Détails de la validation" subtitle={record.contentTitle} onClose={onClose} wide>
      <div className="space-y-5 p-5 sm:p-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="Type de validation">
            {record.validationType === 'religious' ? 'Religieuse' : 'Médicale'}
          </InfoTile>
          <InfoTile label="Catégorie">{record.category}</InfoTile>
          <InfoTile label="Statut actuel">
            <ValidationStatusBadge status={record.status} />
          </InfoTile>
          <InfoTile label="Soumis par">{record.submittedBy ?? 'Non renseigné'}</InfoTile>
          <InfoTile label="Soumission">{formatDateTime(record.submittedAt)}</InfoTile>
          <InfoTile label="Validateur actuel">{record.reviewer ?? 'Non assigné'}</InfoTile>
          <InfoTile label="Dernière mise à jour">{formatDateTime(record.updatedAt)}</InfoTile>
          <InfoTile label="Version">{record.version}</InfoTile>
        </dl>
        {record.reviewerComments && (
          <div>
            <FieldLabel>Dernier commentaire du validateur</FieldLabel>
            <p className="rounded-xl border border-border bg-[#faf8fa] p-3 text-xs leading-5 text-muted-foreground">
              {record.reviewerComments}
            </p>
          </div>
        )}
        <p className="text-[10px] leading-5 text-muted-foreground">
          La publication de ce contenu reste gérée depuis Contenus → Articles ; cette page ne suit
          que la décision de validation.
        </p>
        <HistoryList record={record} />
        <div className="flex justify-end border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary h-10 text-xs">
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ReviewDialog({
  record,
  reviewerOptions,
  onClose,
  onDecision,
}: {
  record: SpiritualValidationRecord;
  reviewerOptions: string[];
  onClose: () => void;
  onDecision: (decision: 'validated' | 'rejected', reviewer: string, comment: string) => void;
}) {
  const [reviewer, setReviewer] = useState(
    record.reviewer && reviewerOptions.includes(record.reviewer) ? record.reviewer : ''
  );
  const [comment, setComment] = useState('');
  const [reviewerError, setReviewerError] = useState('');
  const [commentError, setCommentError] = useState('');

  const submit = (decision: 'validated' | 'rejected') => {
    let hasError = false;
    if (!reviewer || !reviewerOptions.includes(reviewer)) {
      setReviewerError('Sélectionnez un validateur actif éligible.');
      hasError = true;
    } else {
      setReviewerError('');
    }
    if (decision === 'rejected' && !comment.trim()) {
      setCommentError('Indiquez un motif de refus.');
      hasError = true;
    } else {
      setCommentError('');
    }
    if (hasError) return;
    onDecision(decision, reviewer, comment.trim());
  };

  return (
    <Modal title="Examiner la validation" subtitle={record.contentTitle} onClose={onClose} wide>
      <div className="space-y-5 p-5 sm:p-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoTile label="Type de validation">
            {record.validationType === 'religious' ? 'Religieuse' : 'Médicale'}
          </InfoTile>
          <InfoTile label="Catégorie">{record.category}</InfoTile>
          <InfoTile label="Statut actuel">
            <ValidationStatusBadge status={record.status} />
          </InfoTile>
          <InfoTile label="Soumis par">{record.submittedBy ?? 'Non renseigné'}</InfoTile>
          <InfoTile label="Soumission">{formatDateTime(record.submittedAt)}</InfoTile>
          <InfoTile label="Validateur actuel">{record.reviewer ?? 'Non assigné'}</InfoTile>
        </dl>

        <p className="text-[10px] leading-5 text-muted-foreground">
          La publication de ce contenu reste gérée depuis Contenus → Articles ; cette étape
          n’enregistre qu’une décision de validation.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <FieldLabel>Validateur</FieldLabel>
            <select
              value={reviewer}
              onChange={(event) => {
                setReviewer(event.target.value);
                setReviewerError('');
              }}
              className={inputClassName}
            >
              <option value="">Sélectionner un validateur</option>
              {reviewerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {reviewerError && (
              <p role="alert" className="mt-1 text-xs text-danger">
                {reviewerError}
              </p>
            )}
          </label>
        </div>
        <label>
          <FieldLabel>Commentaire</FieldLabel>
          <textarea
            rows={4}
            maxLength={500}
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setCommentError('');
            }}
            placeholder="Motif de la décision, précisions pour l’équipe éditoriale..."
            className={textareaClassName}
          />
          <span className="mt-1 block text-right text-[10px] text-muted-foreground">
            {comment.length}/500
          </span>
          {commentError && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {commentError}
            </p>
          )}
        </label>

        <HistoryList record={record} />

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-border bg-white px-4 text-xs font-semibold text-foreground hover:bg-muted"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => submit('rejected')}
            className="h-10 rounded-xl border border-danger/30 bg-white px-4 text-xs font-semibold text-danger hover:bg-danger-bg"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => submit('validated')}
            className="btn-primary h-10 px-4 text-xs"
          >
            Approuver
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ValidationsContent({
  validations,
}: {
  validations: SpiritualValidationRecord[];
}) {
  const [items, setItems] = useState(validations);
  const [tab, setTab] = useState<ValidationTab>('pending_review');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [reviewer, setReviewer] = useState('all');
  const [category, setCategory] = useState('all');
  const [dialog, setDialog] = useState<{
    mode: 'details' | 'review';
    record: SpiritualValidationRecord;
  } | null>(null);
  const { administrators, roles } = useSecuritySession();

  const reviewers = Array.from(
    new Set(items.map((item) => item.reviewer).filter((value): value is string => !!value))
  );
  const categories = Array.from(new Set(items.map((item) => item.category)));
  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (tab === 'all' || item.status === tab) &&
          (!search ||
            item.contentTitle.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))) &&
          (type === 'all' || item.validationType === type) &&
          (reviewer === 'all' || item.reviewer === reviewer) &&
          (category === 'all' || item.category === category)
      ),
    [category, items, reviewer, search, tab, type]
  );

  const reviewerOptionsFor = (record: SpiritualValidationRecord) => {
    const matchingRoleId =
      record.validationType === 'religious' ? 'religious_reviewer' : 'medical_reviewer';
    const roleById = new Map(roles.map((role) => [role.id, role]));
    const names = administrators
      .filter((administrator) => administrator.status === 'active')
      .filter((administrator) => {
        const role = roleById.get(administrator.roleId);
        return role?.technicalRole === matchingRoleId || role?.technicalRole === 'super_admin';
      })
      .map((administrator) => administrator.name);
    return names.length ? Array.from(new Set(names)) : administrators.map((item) => item.name);
  };

  const applyDecision = (
    record: SpiritualValidationRecord,
    decision: 'validated' | 'rejected',
    reviewerName: string,
    comment: string
  ) => {
    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) => {
        if (item.id !== record.id) return item;
        const historyEntry = {
          id: `hist-${item.id}-${Date.now()}`,
          previousStatus: item.status,
          newStatus: decision,
          reviewer: reviewerName,
          comment,
          date: now,
        };
        return {
          ...item,
          status: decision,
          reviewer: reviewerName,
          updatedAt: now,
          reviewerComments: comment || item.reviewerComments,
          version: item.version + 1,
          history: [...(item.history ?? []), historyEntry],
        };
      })
    );
    toast.success(
      decision === 'validated'
        ? `« ${record.contentTitle} » a été validé.`
        : `« ${record.contentTitle} » a été refusé.`
    );
    setDialog(null);
  };

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
                <th className="px-4 py-4 text-center">Actions</th>
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
                    <RowActions label={`Actions pour ${item.contentTitle}`}>
                      <ActionButton onClick={() => setDialog({ mode: 'details', record: item })}>
                        Voir les détails
                      </ActionButton>
                      <ActionButton onClick={() => setDialog({ mode: 'review', record: item })}>
                        Examiner
                      </ActionButton>
                    </RowActions>
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
              description="Aucun élément ne correspond à ces filtres."
            />
          </div>
        )}
      </section>

      {dialog?.mode === 'details' && (
        <ValidationDetailsDialog record={dialog.record} onClose={() => setDialog(null)} />
      )}
      {dialog?.mode === 'review' && (
        <ReviewDialog
          record={dialog.record}
          reviewerOptions={reviewerOptionsFor(dialog.record)}
          onClose={() => setDialog(null)}
          onDecision={(decision, reviewerName, comment) =>
            applyDecision(dialog.record, decision, reviewerName, comment)
          }
        />
      )}
    </div>
  );
}
