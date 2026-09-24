'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Copy, Eye, Pencil, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationCampaign } from '@/data/mock/notifications';
import { audienceLabel } from '@/data/mock/notifications';
import { useNotificationsSession, saveCampaign } from '@/stores/notificationsSessionStore';
import { CURRENT_ADMIN } from '@/config/admin';
import { ADMIN_ROUTES } from '@/config/adminRoutes';
import {
  ActionButton,
  ConfirmDialog,
  EmptyState,
  Modal,
  PageHeader,
  Pagination,
  RowActions,
  SearchInput,
  SelectField,
  formatContentDate,
} from '@/app/content/components/ContentUI';
import { CampaignForm, CampaignStatusBadge, type CampaignFormValues } from './NotificationsUI';

type StatusFilter = 'all' | 'draft' | 'scheduled';

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

export default function ScheduledNotificationsContent() {
  const router = useRouter();
  const campaigns = useNotificationsSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [details, setDetails] = useState<NotificationCampaign | null>(null);
  const [editing, setEditing] = useState<NotificationCampaign | null>(null);
  const [cancelling, setCancelling] = useState<NotificationCampaign | null>(null);

  const pending = useMemo(
    () => campaigns.filter((item) => item.status === 'draft' || item.status === 'scheduled'),
    [campaigns]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr-FR');
    return pending.filter(
      (item) =>
        (statusFilter === 'all' || item.status === statusFilter) &&
        (!query || `${item.name} ${item.title}`.toLocaleLowerCase('fr-FR').includes(query))
    );
  }, [pending, search, statusFilter]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const duplicate = (campaign: NotificationCampaign) => {
    saveCampaign({
      ...campaign,
      id: `notif-session-${Date.now()}`,
      name: `${campaign.name} — copie`,
      status: 'draft',
      scheduledAt: undefined,
      sentAt: undefined,
      deliveredCount: undefined,
      openedCount: undefined,
      createdBy: CURRENT_ADMIN.name,
      createdAt: new Date().toISOString(),
    });
    toast.info('Campagne dupliquée en brouillon pour cette session.');
  };

  const handleEditSubmit = (values: CampaignFormValues, action: 'draft' | 'schedule' | 'send') => {
    if (!editing) return;
    const now = new Date();
    if (action === 'send') {
      saveCampaign({
        ...editing,
        title: values.title,
        message: values.message,
        audienceKey: values.audienceKey,
        deepLink: values.deepLink || undefined,
        status: 'sent',
        sentAt: now.toISOString(),
      });
      toast.info('Envoi simulé — aucune notification réelle n’a été transmise.');
      router.push(ADMIN_ROUTES.notifications.history);
      setEditing(null);
      return;
    }
    const scheduledAt =
      action === 'schedule' && values.scheduledDate && values.scheduledTime
        ? new Date(`${values.scheduledDate}T${values.scheduledTime}:00`).toISOString()
        : editing.scheduledAt;
    saveCampaign({
      ...editing,
      name: values.name || values.title,
      title: values.title,
      message: values.message,
      audienceKey: values.audienceKey,
      deepLink: values.deepLink || undefined,
      status: action === 'schedule' ? 'scheduled' : 'draft',
      scheduledAt: action === 'schedule' ? scheduledAt : undefined,
    });
    toast.info('Campagne mise à jour pour cette session.');
    setEditing(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Programmées"
        subtitle="Brouillons et campagnes programmées, en attente d’envoi."
        actionLabel="Nouvelle notification"
        onAction={() => router.push(ADMIN_ROUTES.notifications.new)}
      />

      <section className="rounded-[18px] border border-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap gap-2">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Rechercher une campagne..."
          />
          <SelectField
            compact
            label="Statut"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="scheduled">Programmée</option>
          </SelectField>
        </div>
      </section>

      <section className="min-w-0 rounded-[18px] border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-[#faf8fa] text-[9px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                <th className="px-4 py-3.5">Campagne</th>
                <th className="px-4 py-3.5">Audience</th>
                <th className="px-4 py-3.5">Date programmée</th>
                <th className="px-4 py-3.5">Statut</th>
                <th className="px-4 py-3.5">Créé par</th>
                <th className="px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {visible.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-[#fbf9fb]">
                  <td className="px-4 py-3.5">
                    <p className="max-w-[240px] truncate text-xs font-semibold text-foreground">
                      {campaign.name}
                    </p>
                    <p className="mt-0.5 max-w-[240px] truncate text-[10px] text-muted-foreground">
                      {campaign.title}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-muted-foreground">
                    {audienceLabel(campaign.audienceKey)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-muted-foreground">
                    {formatDateTime(campaign.scheduledAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-muted-foreground">
                    {campaign.createdBy}
                  </td>
                  <td className="px-4 py-3.5">
                    <RowActions label={`Actions pour ${campaign.name}`}>
                      <ActionButton onClick={() => setDetails(campaign)}>
                        <Eye size={14} /> Voir
                      </ActionButton>
                      <ActionButton onClick={() => setEditing(campaign)}>
                        <Pencil size={14} /> Modifier
                      </ActionButton>
                      <ActionButton onClick={() => duplicate(campaign)}>
                        <Copy size={14} /> Dupliquer
                      </ActionButton>
                      <ActionButton danger onClick={() => setCancelling(campaign)}>
                        <XCircle size={14} /> Annuler
                      </ActionButton>
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <EmptyState
              title="Aucune campagne en attente"
              description="Les brouillons et notifications programmées apparaîtront ici."
            />
          )}
        </div>
        <Pagination
          page={safePage}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <AnimatePresence>
        {details && (
          <Modal
            title={details.name}
            subtitle={audienceLabel(details.audienceKey)}
            onClose={() => setDetails(null)}
          >
            <div className="space-y-4 p-5 sm:p-6">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Titre', details.title],
                  ['Message', details.message || '—'],
                  ['Statut', <CampaignStatusBadge key="status" status={details.status} />],
                  ['Programmée pour', formatDateTime(details.scheduledAt)],
                  ['Créé par', details.createdBy],
                  ['Créée le', formatContentDate(details.createdAt)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl bg-[#f5f2f5] p-3">
                    <dt className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="mt-1 text-xs font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetails(null)}
                  className="btn-secondary h-10 text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </Modal>
        )}
        {editing && (
          <Modal
            wide
            title="Modifier la campagne"
            subtitle={editing.name}
            onClose={() => setEditing(null)}
          >
            <div className="p-5 sm:p-6">
              <CampaignForm
                key={editing.id}
                campaign={editing}
                onCancel={() => setEditing(null)}
                onSubmit={handleEditSubmit}
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {cancelling && (
        <ConfirmDialog
          title="Annuler cette campagne ?"
          message={`« ${cancelling.name} » ne sera pas envoyée et sera déplacée vers l’historique.`}
          confirmLabel="Annuler la campagne"
          onCancel={() => setCancelling(null)}
          onConfirm={() => {
            saveCampaign({ ...cancelling, status: 'cancelled' });
            toast.info('Campagne annulée.');
            setCancelling(null);
          }}
        />
      )}
    </motion.div>
  );
}
