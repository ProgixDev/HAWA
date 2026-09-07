'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Eye, MessageSquareReply, UserCheck, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ManagedUser } from '@/types';
import type {
  AdminSupportTicket,
  SupportCategory,
  SupportOverview,
  SupportPriority,
  SupportStatus,
} from '@/types/adminOperations';
import {
  ActionButton,
  ConfirmDialog,
  DemoNotice,
  EmptyState,
  FieldLabel,
  inputClassName,
  Modal,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
  SortButton,
  textareaClassName,
} from '@/app/content/components/ContentUI';
import {
  formatAdminDate,
  OperationsMetricCard,
  OperationsStatusBadge,
  PriorityBadge,
  SectionHeading,
  supportCategoryLabels,
  supportPriorityLabels,
  supportStatusLabels,
} from './OperationsUI';

type SupportSortField = 'id' | 'user' | 'subject' | 'priority' | 'date' | 'status';
type DateFilter = 'all' | '7d' | '30d' | '90d';

interface SupportFormValues {
  userId: string;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  message: string;
}

const categories = Object.keys(supportCategoryLabels) as SupportCategory[];
const statuses = Object.keys(supportStatusLabels) as SupportStatus[];
const priorities = Object.keys(supportPriorityLabels) as SupportPriority[];

function CreateSupportModal({
  users,
  onClose,
  onCreate,
}: {
  users: ManagedUser[];
  onClose: () => void;
  onCreate: (values: SupportFormValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupportFormValues>({
    defaultValues: {
      userId: '',
      subject: '',
      category: 'application',
      priority: 'medium',
      message: '',
    },
  });

  return (
    <Modal
      title="Nouvelle demande"
      subtitle="Créer une demande au nom d’une utilisatrice"
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
        <label className="block">
          <FieldLabel>Sujet *</FieldLabel>
          <input
            {...register('subject', {
              required: 'Le sujet est requis.',
              minLength: { value: 5, message: 'Ajoutez un sujet plus précis.' },
            })}
            className={inputClassName}
          />
          {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <FieldLabel>Catégorie *</FieldLabel>
            <select {...register('category')} className={inputClassName}>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {supportCategoryLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <FieldLabel>Priorité *</FieldLabel>
            <select {...register('priority')} className={inputClassName}>
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {supportPriorityLabels[item]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <FieldLabel>Message *</FieldLabel>
          <textarea
            {...register('message', {
              required: 'Le message est requis.',
              minLength: { value: 10, message: 'Le message doit contenir au moins 10 caractères.' },
            })}
            rows={5}
            className={textareaClassName}
          />
          {errors.message && <p className="mt-1 text-xs text-danger">{errors.message.message}</p>}
        </label>
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

function TicketDetailsModal({
  ticket,
  onClose,
  onUpdate,
}: {
  ticket: AdminSupportTicket;
  onClose: () => void;
  onUpdate: (ticket: AdminSupportTicket) => void;
}) {
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const sendReply = async () => {
    if (!reply.trim()) {
      toast.error('Écrivez une réponse avant l’envoi.');
      return;
    }
    setSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    onUpdate({
      ...ticket,
      status: ticket.status === 'new' ? 'in_progress' : ticket.status,
      assignedTo: ticket.assignedTo ?? 'Admin',
      updatedAt: new Date().toISOString(),
      messages: [
        ...ticket.messages,
        {
          id: `MSG-${Date.now()}`,
          senderName: 'Admin',
          senderRole: 'admin',
          content: reply.trim(),
          createdAt: new Date().toISOString(),
          internal,
        },
      ],
    });
    setReply('');
    setInternal(false);
    setSending(false);
    toast.success(internal ? 'Note interne ajoutée.' : 'Réponse envoyée.');
  };

  return (
    <Modal
      title={`${ticket.id} — ${ticket.subject}`}
      subtitle="Détails et conversation"
      onClose={onClose}
      wide
    >
      <div className="space-y-5 p-5 sm:p-6">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Utilisatrice', ticket.userName],
            ['E-mail', ticket.userEmail],
            ['Catégorie', supportCategoryLabels[ticket.category]],
            ['Créé le', formatAdminDate(ticket.createdAt, true)],
            ['Dernière mise à jour', formatAdminDate(ticket.updatedAt, true)],
            ['Assigné à', ticket.assignedTo ?? 'Non assigné'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-white px-4 py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Statut"
            value={ticket.status}
            onChange={(value) => {
              const next = value as SupportStatus;
              onUpdate({ ...ticket, status: next, updatedAt: new Date().toISOString() });
              toast.success(
                next === 'resolved' ? 'Ticket marqué comme résolu.' : 'Statut mis à jour.'
              );
            }}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {supportStatusLabels[item]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Priorité"
            value={ticket.priority}
            onChange={(value) => {
              onUpdate({
                ...ticket,
                priority: value as SupportPriority,
                updatedAt: new Date().toISOString(),
              });
              toast.success('Priorité mise à jour.');
            }}
          >
            {priorities.map((item) => (
              <option key={item} value={item}>
                {supportPriorityLabels[item]}
              </option>
            ))}
          </SelectField>
          <div>
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Assignation
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdate({ ...ticket, assignedTo: 'Admin', updatedAt: new Date().toISOString() });
                toast.success('Ticket assigné avec succès.');
              }}
              disabled={ticket.assignedTo === 'Admin'}
              className="btn-secondary h-10 w-full disabled:opacity-50"
            >
              <UserCheck size={14} />{' '}
              {ticket.assignedTo === 'Admin' ? 'Assigné à Admin' : 'M’assigner'}
            </button>
          </div>
        </div>

        <section>
          <SectionHeading title="Conversation" />
          <div className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-[#f8f6f9] p-4">
            {ticket.messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[88%] rounded-xl border px-4 py-3 ${message.internal ? 'border-warning/25 bg-warning-bg' : message.senderRole === 'admin' ? 'ml-auto border-primary/20 bg-primary-pale' : 'border-border bg-white'}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <strong className="text-foreground">{message.senderName}</strong>
                  <span>{formatAdminDate(message.createdAt, true)}</span>
                  {message.internal && (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 font-semibold text-warning">
                      Note interne
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[13px] leading-5 text-foreground">{message.content}</p>
              </article>
            ))}
          </div>
        </section>

        {ticket.status !== 'closed' && (
          <section className="space-y-3">
            <label className="block">
              <FieldLabel>
                {internal ? 'Écrire une note interne…' : 'Écrire une réponse…'}
              </FieldLabel>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                rows={4}
                className={textareaClassName}
                placeholder={
                  internal
                    ? 'Cette note restera visible uniquement par l’administration.'
                    : 'Écrire une réponse...'
                }
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(event) => setInternal(event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                Note interne — non envoyée à l’utilisatrice
              </label>
              <button
                type="button"
                onClick={sendReply}
                disabled={sending}
                className="btn-primary h-10"
              >
                <MessageSquareReply size={15} />{' '}
                {sending ? 'Envoi…' : internal ? 'Ajouter la note' : 'Envoyer la réponse'}
              </button>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}

export default function SupportContent({
  initialData,
  users,
}: {
  initialData: SupportOverview;
  users: ManagedUser[];
}) {
  const [tickets, setTickets] = useState(initialData.tickets);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SupportStatus | 'all'>('all');
  const [category, setCategory] = useState<SupportCategory | 'all'>('all');
  const [priority, setPriority] = useState<SupportPriority | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortField, setSortField] = useState<SupportSortField>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [closeTicket, setCloseTicket] = useState<AdminSupportTicket | null>(null);
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? null;
  const filtersActive =
    Boolean(query) ||
    status !== 'all' ||
    category !== 'all' ||
    priority !== 'all' ||
    dateFilter !== 'all';

  const filteredTickets = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr-FR');
    const referenceTime = new Date('2026-09-06T23:59:59Z').getTime();
    const dayLimits: Record<Exclude<DateFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };
    return tickets
      .filter((ticket) => {
        const searchable =
          `${ticket.id} ${ticket.userName} ${ticket.userEmail} ${ticket.subject}`.toLocaleLowerCase(
            'fr-FR'
          );
        const matchesDate =
          dateFilter === 'all' ||
          referenceTime - new Date(ticket.createdAt).getTime() <=
            dayLimits[dateFilter] * 86_400_000;
        return (
          (!normalized || searchable.includes(normalized)) &&
          (status === 'all' || ticket.status === status) &&
          (category === 'all' || ticket.category === category) &&
          (priority === 'all' || ticket.priority === priority) &&
          matchesDate
        );
      })
      .sort((left, right) => {
        const values: Record<SupportSortField, [string | number, string | number]> = {
          id: [left.id, right.id],
          user: [left.userName, right.userName],
          subject: [left.subject, right.subject],
          priority: [priorities.indexOf(left.priority), priorities.indexOf(right.priority)],
          date: [left.createdAt, right.createdAt],
          status: [supportStatusLabels[left.status], supportStatusLabels[right.status]],
        };
        const [a, b] = values[sortField];
        const result =
          typeof a === 'number' && typeof b === 'number'
            ? a - b
            : String(a).localeCompare(String(b), 'fr');
        return sortDirection === 'asc' ? result : -result;
      });
  }, [category, dateFilter, priority, query, sortDirection, sortField, status, tickets]);

  useEffect(() => setPage(1), [query, status, category, priority, dateFilter, pageSize]);
  const visibleTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

  const updateTicket = (next: AdminSupportTicket) =>
    setTickets((items) => items.map((item) => (item.id === next.id ? next : item)));
  const handleSort = (field: SupportSortField) => {
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
    setCategory('all');
    setPriority('all');
    setDateFilter('all');
    toast.success('Filtres réinitialisés.');
  };
  const createTicket = async (values: SupportFormValues) => {
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    const user = users.find((item) => item.id === values.userId);
    if (!user) throw new Error('Unknown user');
    const now = new Date().toISOString();
    const next: AdminSupportTicket = {
      id: `SUP-${String(1249 + tickets.length).padStart(6, '0')}`,
      userId: user.id,
      userDisplayId: user.displayId,
      userName: user.name,
      userEmail: user.email ?? '—',
      subject: values.subject.trim(),
      category: values.category,
      priority: values.priority,
      status: 'new',
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `MSG-${Date.now()}`,
          senderName: user.name,
          senderRole: 'user',
          content: values.message.trim(),
          createdAt: now,
          internal: false,
        },
      ],
    };
    setTickets((items) => [next, ...items]);
    setCreateOpen(false);
    toast.success('Demande de support créée avec succès.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-7">
      <PageHeader
        eyebrow="Assistance"
        title="Support"
        subtitle="Gérez les demandes d’assistance et accompagnez vos utilisatrices"
        actionLabel="Nouvelle demande"
        onAction={() => setCreateOpen(true)}
      />
      <DemoNotice />
      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="Indicateurs support"
      >
        {initialData.kpis.map((kpi, index) => (
          <OperationsMetricCard key={kpi.id} {...kpi} index={index} />
        ))}
      </section>
      <section className="min-w-0 overflow-hidden rounded-[18px] border border-border bg-white shadow-card">
        <div className="border-b border-border px-5 py-4">
          <SectionHeading
            title="Demandes récentes"
            subtitle="Suivi des conversations et demandes d’assistance"
          />
        </div>
        <div className="flex flex-wrap gap-2 border-b border-border bg-[#fcfbfd] p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Rechercher une utilisatrice ou un sujet..."
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
            {statuses.map((item) => (
              <option key={item} value={item}>
                {supportStatusLabels[item]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Catégorie"
            value={category}
            onChange={(value) => setCategory(value as typeof category)}
            compact
            comfortable
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {supportCategoryLabels[item]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Priorité"
            value={priority}
            onChange={(value) => setPriority(value as typeof priority)}
            compact
            comfortable
          >
            <option value="all">Toutes les priorités</option>
            {priorities.map((item) => (
              <option key={item} value={item}>
                {supportPriorityLabels[item]}
              </option>
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
              Réinitialiser les filtres
            </button>
          )}
        </div>
        {visibleTickets.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] border-collapse text-left">
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
                      label="Sujet"
                      field="subject"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Priorité"
                      field="priority"
                      activeField={sortField}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3">
                    <SortButton
                      label="Date"
                      field="date"
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
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleTickets.map((ticket) => (
                  <tr key={ticket.id} className="text-[12px] hover:bg-primary-ghost/50">
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-primary">
                      #{ticket.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{ticket.userName}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{ticket.userEmail}</p>
                    </td>
                    <td className="max-w-[260px] px-4 py-3.5">
                      <p className="truncate font-medium text-foreground">{ticket.subject}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {ticket.assignedTo ? `Assigné à ${ticket.assignedTo}` : 'Non assigné'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {supportCategoryLabels[ticket.category]}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {formatAdminDate(ticket.createdAt, true)}
                    </td>
                    <td className="px-4 py-3.5">
                      <OperationsStatusBadge
                        status={ticket.status}
                        label={supportStatusLabels[ticket.status]}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <RowActions label={`Actions pour ${ticket.id}`}>
                        <ActionButton onClick={() => setSelectedId(ticket.id)}>
                          <Eye size={14} /> Voir
                        </ActionButton>
                        {!ticket.assignedTo && (
                          <ActionButton
                            onClick={() => {
                              updateTicket({
                                ...ticket,
                                assignedTo: 'Admin',
                                status: ticket.status === 'new' ? 'in_progress' : ticket.status,
                                updatedAt: new Date().toISOString(),
                              });
                              toast.success('Ticket assigné avec succès.');
                            }}
                          >
                            <UserCheck size={14} /> Assigner
                          </ActionButton>
                        )}
                        {ticket.status !== 'closed' && (
                          <ActionButton onClick={() => setSelectedId(ticket.id)}>
                            <MessageSquareReply size={14} /> Répondre
                          </ActionButton>
                        )}
                        {!['resolved', 'closed'].includes(ticket.status) && (
                          <ActionButton
                            onClick={() => {
                              updateTicket({
                                ...ticket,
                                status: 'resolved',
                                updatedAt: new Date().toISOString(),
                              });
                              toast.success('Ticket marqué comme résolu.');
                            }}
                          >
                            <CheckCircle2 size={14} /> Marquer résolu
                          </ActionButton>
                        )}
                        {ticket.status !== 'closed' && (
                          <ActionButton onClick={() => setCloseTicket(ticket)} danger>
                            <XCircle size={14} /> Fermer
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
            title="Aucune demande de support trouvée."
            description="Modifiez les filtres ou créez une nouvelle demande."
          />
        )}
        <Pagination
          page={page}
          total={filteredTickets.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizes={[10, 25, 50, 100]}
        />
      </section>
      <AnimatePresence>
        {createOpen && (
          <CreateSupportModal
            users={users}
            onClose={() => setCreateOpen(false)}
            onCreate={createTicket}
          />
        )}
        {selectedTicket && (
          <TicketDetailsModal
            ticket={selectedTicket}
            onClose={() => setSelectedId(null)}
            onUpdate={updateTicket}
          />
        )}
      </AnimatePresence>
      {closeTicket && (
        <ConfirmDialog
          title="Fermer ce ticket ?"
          message={`${closeTicket.id} sera marqué comme fermé. La conversation restera consultable.`}
          confirmLabel="Fermer le ticket"
          onCancel={() => setCloseTicket(null)}
          onConfirm={() => {
            updateTicket({ ...closeTicket, status: 'closed', updatedAt: new Date().toISOString() });
            setCloseTicket(null);
            toast.success('Ticket fermé.');
          }}
        />
      )}
    </motion.div>
  );
}
