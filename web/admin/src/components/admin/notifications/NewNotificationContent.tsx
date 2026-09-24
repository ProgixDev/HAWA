'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { audienceEstimatedCount, type NotificationCampaign } from '@/data/mock/notifications';
import { saveCampaign } from '@/stores/notificationsSessionStore';
import { CURRENT_ADMIN } from '@/config/admin';
import { ADMIN_ROUTES } from '@/config/adminRoutes';
import { CalendarClock } from 'lucide-react';
import { CampaignForm, type CampaignFormValues } from './NotificationsUI';

export default function NewNotificationContent() {
  const router = useRouter();

  const handleSubmit = (values: CampaignFormValues, action: 'draft' | 'schedule' | 'send') => {
    const now = new Date();
    const base: NotificationCampaign = {
      id: values.id,
      name: values.name || values.title || 'Campagne sans titre',
      title: values.title,
      message: values.message,
      audienceKey: values.audienceKey,
      deepLink: values.deepLink || undefined,
      status: 'draft',
      createdBy: CURRENT_ADMIN.name,
      createdAt: now.toISOString(),
    };

    if (action === 'draft') {
      saveCampaign(base);
      toast.info('Brouillon enregistré pour cette session.');
      return;
    }

    if (action === 'schedule') {
      const scheduledAt = new Date(`${values.scheduledDate}T${values.scheduledTime}:00`);
      saveCampaign({ ...base, status: 'scheduled', scheduledAt: scheduledAt.toISOString() });
      toast.info('Notification programmée pour cette session — aucun service push n’est connecté.');
      router.push(ADMIN_ROUTES.notifications.scheduled);
      return;
    }

    const delivered = audienceEstimatedCount(values.audienceKey);
    saveCampaign({
      ...base,
      status: 'sent',
      sentAt: now.toISOString(),
      deliveredCount: delivered,
      openedCount: Math.round(delivered * 0.42),
    });
    toast.info('Envoi simulé — aucune notification réelle n’a été transmise.');
    router.push(ADMIN_ROUTES.notifications.history);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Notifications
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-[28px]">
            Nouvelle notification
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Composez une campagne future — indépendante des rappels locaux déjà programmés sur
            l’appareil.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(ADMIN_ROUTES.notifications.scheduled)}
          className="btn-secondary h-10 shrink-0 text-xs"
        >
          <CalendarClock size={15} /> Voir les campagnes programmées
        </button>
      </div>
      <section className="rounded-[18px] border border-border bg-white p-5 shadow-card sm:p-6">
        <CampaignForm
          onCancel={() => router.push(ADMIN_ROUTES.dashboard)}
          onSubmit={handleSubmit}
        />
      </section>
    </motion.div>
  );
}
