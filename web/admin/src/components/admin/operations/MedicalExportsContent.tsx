'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Plus, RefreshCw, RotateCcw, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ManagedUser } from '@/types';
import type {
  MedicalExportFormat,
  MedicalExportOverview,
  MedicalExportRequest,
  MedicalExportStatus,
  MedicalExportType,
} from '@/types/adminOperations';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  FieldLabel,
  formatFileSize,
  inputClassName,
  Modal,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
  SortButton,
} from '@/app/content/components/ContentUI';
import MedicalExportsChart from './MedicalExportsChart';
import {
  formatAdminDate,
  medicalExportStatusLabels,
  medicalExportTypeLabels,
  OperationsMetricCard,
  OperationsStatusBadge,
  SectionHeading,
} from './OperationsUI';

type ExportSortField = 'id' | 'user' | 'type' | 'requestedAt' | 'status' | 'size';
type SortDirection = 'asc' | 'desc';
type DateFilter = 'all' | '7d' | '30d' | '90d';

interface ExportFormValues {
  userId: string;
  type: MedicalExportType;
  period: '30d' | '3m' | '12m' | 'all' | 'custom';
  format: MedicalExportFormat;
  startDate?: string;
  endDate?: string;
}

const statusOptions: MedicalExportStatus[] = [
  'pending',
  'processing',
  'completed',
  'failed',
  'expired',
  'cancelled',
];
const typeOptions = Object.keys(medicalExportTypeLabels) as MedicalExportType[];
const formatOptions: MedicalExportFormat[] = ['PDF', 'CSV', 'ZIP'];

function CreateExportModal({
  users,
  onClose,
  onCreate,
}: {
  users: ManagedUser[];
  onClose: () => void;
  onCreate: (values: ExportFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExportFormValues>({
    defaultValues: { userId: '', type: 'complete', period: '30d', format: 'PDF' },
  });
  const period = watch('period');

  return (
    <Modal
      title="Nouvelle demande d’export"
      subtitle="La demande crée uniquement une tâche de génération, sans exposer de données médicales."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onCreate)} className="space-y-4 p-5 sm:p-6">
        <label className="block">
          <FieldLabel>Utilisatrice *</FieldLabel>
          <select
            {...register('userId', { required: 'Sélectionnez une utilisatrice.' })}
            className={inputClassName}
          >
            <option value="">Sélectionner une utilisatrice</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} — {user.email}
              </option>
            ))}
          </select>
          {errors.userId && <p className="mt-1 text-xs text-danger">{errors.userId.message}</p>}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <FieldLabel>Type d’export *</FieldLabel>
            <select {...register('type')} className={inputClassName}>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {medicalExportTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <FieldLabel>Format *</FieldLabel>
            <select {...register('format')} className={inputClassName}>
              {formatOptions.map((format) => (
                <option key={format}>{format}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <FieldLabel>Période *</FieldLabel>
          <select {...register('period')} className={inputClassName}>
            <option value="30d">30 derniers jours</option>
            <option value="3m">3 derniers mois</option>
            <option value="12m">12 derniers mois</option>
            <option value="all">Historique complet</option>
            <option value="custom">Période personnalisée</option>
          </select>
        </label>
        {period === 'custom' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <FieldLabel>Date de début *</FieldLabel>
              <input
                type="date"
                {...register('startDate', { required: 'La date de début est requise.' })}
                className={inputClassName}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-danger">{errors.startDate.message}</p>
              )}
            </label>
            <label>
              <FieldLabel>Date de fin *</FieldLabel>
              <input
                type="date"
                {...register('endDate', {
                  required: 'La date de fin est requise.',
                  validate: (value, values) =>
                    !value ||
                    !values.startDate ||
                    value >= values.startDate ||
                    'La date de fin est invalide.',
                })}
                className={inputClassName}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-danger">{errors.endDate.message}</p>
              )}
            </label>
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary h-10">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary h-10 min-w-36">
            {isSubmitting ? 'Création…' : 'Créer la demande'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExportDetailsModal({
  request,
  onClose,
}: {
  request: MedicalExportRequest;
  onClose: () => void;
}) {
  const details = [
    ['Export ID', request.id],
    ['Utilisatrice', request.userName],
    ['E-mail', request.userEmail],
    ['User ID', request.userDisplayId],
    ['Type', medicalExportTypeLabels[request.type]],
    ['Période', request.period],
    ['Format', request.format],
    ['Statut', medicalExportStatusLabels[request.status]],
    ['Date de demande', formatAdminDate(request.requestedAt, true)],
    ['Démarré le', formatAdminDate(request.startedAt, true)],
    ['Terminé le', formatAdminDate(request.completedAt, true)],
    ['Taille', request.sizeBytes ? formatFileSize(request.sizeBytes) : '—'],
    ['Expiration', formatAdminDate(request.expiresAt, true)],
    ['Demandé par', request.requestedBy],
  ];

  return (
    <Modal title={`Détails — ${request.id}`} onClose={onClose} wide>
      <div className="space-y-4 p-5 sm:p-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-white px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        {request.errorMessage && (
          <div className="rounded-xl border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger">
            <strong>Erreur :</strong> {request.errorMessage}
          </div>
        )}
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary h-10">
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function MedicalExportsContent({
  initialData,
  users,
}: {
  initialData: MedicalExportOverview;
  users: ManagedUser[];
}) {
  const [requests, setRequests] = useState(initialData.requests);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<MedicalExportStatus | 'all'>('all');
  const [type, setType] = useState<MedicalExportType | 'all'>('all');
  const [format, setFormat] = useState<MedicalExportFormat | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortField, setSortField] = useState<ExportSortField>('requestedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [details, setDetails] = useState<MedicalExportRequest | null>(null);
  const [confirmation, setConfirmation] = useState<{
    action: 'cancel' | 'delete';
    request: MedicalExportRequest;
  } | null>(null);

  const filtersActive =
    Boolean(query) ||
    status !== 'all' ||
    type !== 'all' ||
    format !== 'all' ||
    dateFilter !== 'all';

  const filteredRequests = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr-FR');
    const referenceTime = new Date('2026-09-06T23:59:59Z').getTime();
    const dayLimits: Record<Exclude<DateFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const items = requests.filter((request) => {
      const searchable =
        `${request.id} ${request.userId} ${request.userDisplayId} ${request.userName} ${request.userEmail}`.toLocaleLowerCase(
          'fr-FR'
        );
      const matchesDate =
        dateFilter === 'all' ||
        referenceTime - new Date(request.requestedAt).getTime() <=
          dayLimits[dateFilter] * 86_400_000;
      return (
        (!normalized || searchable.includes(normalized)) &&
        (status === 'all' || request.status === status) &&
        (type === 'all' || request.type === type) &&
        (format === 'all' || request.format === format) &&
        matchesDate
      );
    });

    return items.sort((left, right) => {
      const values: Record<ExportSortField, [string | number, string | number]> = {
        id: [left.id, right.id],
        user: [left.userName, right.userName],
        type: [medicalExportTypeLabels[left.type], medicalExportTypeLabels[right.type]],
        requestedAt: [left.requestedAt, right.requestedAt],
        status: [medicalExportStatusLabels[left.status], medicalExportStatusLabels[right.status]],
        size: [left.sizeBytes ?? 0, right.sizeBytes ?? 0],
      };
      const [leftValue, rightValue] = values[sortField];
      const comparison =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue), 'fr');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [dateFilter, format, query, requests, sortDirection, sortField, status, type]);

  useEffect(() => setPage(1), [query, status, type, format, dateFilter, pageSize]);
  const visibleRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: ExportSortField) => {
    if (field === sortField)
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetFilters = () => {
    setQuery('');
    setStatus('all');
    setType('all');
    setFormat('all');
    setDateFilter('all');
    toast.success('Filtres réinitialisés.');
  };

  const createRequest = async (values: ExportFormValues) => {
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    const user = users.find((item) => item.id === values.userId);
    if (!user) throw new Error('Unknown user');
    const periodLabels: Record<Exclude<ExportFormValues['period'], 'custom'>, string> = {
      '30d': '30 derniers jours',
      '3m': '3 derniers mois',
      '12m': '12 derniers mois',
      all: 'Historique complet',
    };
    const customPeriod =
      values.period === 'custom'
        ? `${values.startDate ?? '—'} – ${values.endDate ?? '—'}`
        : periodLabels[values.period];
    const next: MedicalExportRequest = {
      id: `EXP-2026-${String(90 + requests.length).padStart(4, '0')}`,
      userId: user.id,
      userDisplayId: user.displayId,
      userName: user.name,
      userEmail: user.email ?? '—',
      type: values.type,
      period: customPeriod,
      format: values.format,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      requestedBy: 'Admin',
    };
    setRequests((items) => [next, ...items]);
    setCreateOpen(false);
    toast.success('Demande d’export créée avec succès.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-7">
      <PageHeader
        eyebrow="Gestion des données"
        title="Exports médicaux"
        subtitle="Gérez et suivez les demandes d’export des données médicales"
        actionLabel="Nouvelle demande d’export"
        onAction={() => setCreateOpen(true)}
      />
      <DemoNotice />

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Indicateurs exports médicaux"
      >
        {initialData.kpis.map((kpi, index) => (
          <OperationsMetricCard key={kpi.id} {...kpi} index={index} />
        ))}
      </section>

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
          <div className="border-b border-border px-5 py-4">
            <SectionHeading
              title="Dernières demandes d’export"
              subtitle="Liste des dernières demandes d’export de données médicales"
            />
          </div>
          <div className="flex flex-wrap gap-2 border-b border-border bg-[#fcfbfd] p-4">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher une utilisatrice..."
              comfortable
            />
            <SelectField
              label="Statut"
              value={status}
              onChange={(value) => setStatus(value as typeof status)}
              compact
              comfortable
            >
              <option value="all">Tous les statuts</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {medicalExportStatusLabels[item]}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Type"
              value={type}
              onChange={(value) => setType(value as typeof type)}
              compact
              comfortable
            >
              <option value="all">Tous les types</option>
              {typeOptions.map((item) => (
                <option key={item} value={item}>
                  {medicalExportTypeLabels[item]}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Format"
              value={format}
              onChange={(value) => setFormat(value as typeof format)}
              compact
              comfortable
            >
              <option value="all">Tous les formats</option>
              {formatOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectField>
            <SelectField
              label="Période"
              value={dateFilter}
              onChange={(value) => setDateFilter(value as DateFilter)}
              compact
              comfortable
            >
              <option value="all">Toutes les dates</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">3 derniers mois</option>
            </SelectField>
            {filtersActive && (
              <button type="button" onClick={resetFilters} className="btn-ghost h-10 px-3 text-xs">
                <RotateCcw size={14} /> Réinitialiser les filtres
              </button>
            )}
          </div>

          {visibleRequests.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left">
                <thead className="bg-[#f8f6f9] text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">
                      <SortButton
                        label="ID"
                        field="id"
                        activeField={sortField}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <SortButton
                        label="Utilisatrice"
                        field="user"
                        activeField={sortField}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <SortButton
                        label="Type d’export"
                        field="type"
                        activeField={sortField}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3">Période</th>
                    <th className="px-4 py-3">Format</th>
                    <th className="px-4 py-3">
                      <SortButton
                        label="Date de demande"
                        field="requestedAt"
                        activeField={sortField}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <SortButton
                        label="Statut"
                        field="status"
                        activeField={sortField}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <SortButton
                        label="Taille"
                        field="size"
                        activeField={sortField}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleRequests.map((request) => (
                    <tr key={request.id} className="text-[12px] hover:bg-primary-ghost/50">
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-primary">
                        {request.id}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{request.userName}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {request.userEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {medicalExportTypeLabels[request.type]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                        {request.period}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-primary-pale px-2 py-1 text-[10px] font-bold text-primary">
                          {request.format}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                        {formatAdminDate(request.requestedAt, true)}
                      </td>
                      <td className="px-4 py-3.5">
                        <OperationsStatusBadge
                          status={request.status}
                          label={medicalExportStatusLabels[request.status]}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                        {request.sizeBytes ? formatFileSize(request.sizeBytes) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <RowActions label={`Actions pour ${request.id}`}>
                          <ActionButton onClick={() => setDetails(request)}>
                            <Eye size={14} /> Voir les détails
                          </ActionButton>
                          {request.status === 'failed' && (
                            <ActionButton
                              onClick={() => {
                                setRequests((items) =>
                                  items.map((item) =>
                                    item.id === request.id
                                      ? {
                                          ...item,
                                          status: 'processing',
                                          errorMessage: undefined,
                                          startedAt: new Date().toISOString(),
                                        }
                                      : item
                                  )
                                );
                                toast.success('Export relancé.');
                              }}
                            >
                              <RefreshCw size={14} /> Relancer
                            </ActionButton>
                          )}
                          {(request.status === 'pending' || request.status === 'processing') && (
                            <ActionButton
                              onClick={() => setConfirmation({ action: 'cancel', request })}
                              danger
                            >
                              <XCircle size={14} /> Annuler
                            </ActionButton>
                          )}
                          {(request.status === 'cancelled' || request.status === 'expired') && (
                            <ActionButton
                              onClick={() => setConfirmation({ action: 'delete', request })}
                              danger
                            >
                              <Trash2 size={14} /> Supprimer
                            </ActionButton>
                          )}
                        </RowActions>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Aucune demande d’export trouvée."
              description="Modifiez vos filtres ou créez une nouvelle demande d’export."
            />
          )}
          <Pagination
            page={page}
            total={filteredRequests.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizes={[10, 25, 50, 100]}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-[18px] border border-border bg-white p-5 shadow-card">
            <SectionHeading title="Types d’exports" />
            <MedicalExportsChart data={initialData.distribution} />
          </div>
          <div className="rounded-[18px] border border-border bg-[#f8f4fa] p-5 shadow-card">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-pale text-primary">
              <ShieldCheck size={21} aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-base font-semibold text-foreground">
              Confidentialité & sécurité
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Toutes les exportations sont protégées et traitées conformément à notre politique de
              confidentialité.
            </p>
            <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
              Les fichiers ne sont disponibles que lorsque le service sécurisé de génération est
              connecté.
            </p>
          </div>
        </aside>
      </section>

      <AnimatePresence>
        {createOpen && (
          <CreateExportModal
            users={users}
            onClose={() => setCreateOpen(false)}
            onCreate={createRequest}
          />
        )}
        {details && <ExportDetailsModal request={details} onClose={() => setDetails(null)} />}
      </AnimatePresence>
      {confirmation && (
        <ConfirmDialog
          title={
            confirmation.action === 'cancel' ? 'Annuler cet export ?' : 'Supprimer cette demande ?'
          }
          message={
            confirmation.action === 'cancel'
              ? `La génération de ${confirmation.request.id} sera arrêtée.`
              : `${confirmation.request.id} sera retiré de cette liste.`
          }
          confirmLabel={confirmation.action === 'cancel' ? 'Annuler l’export' : 'Supprimer'}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            if (confirmation.action === 'cancel') {
              setRequests((items) =>
                items.map((item) =>
                  item.id === confirmation.request.id ? { ...item, status: 'cancelled' } : item
                )
              );
              toast.success('Export annulé.');
            } else {
              setRequests((items) => items.filter((item) => item.id !== confirmation.request.id));
              toast.success('Demande supprimée.');
            }
            setConfirmation(null);
          }}
        />
      )}
    </motion.div>
  );
}
