'use client';

import { useSyncExternalStore } from 'react';
import { initialNotificationCampaigns, type NotificationCampaign } from '@/data/mock/notifications';

let state = initialNotificationCampaigns;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;
const getServerSnapshot = () => initialNotificationCampaigns;

export function useNotificationsSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function update(mutate: (current: NotificationCampaign[]) => NotificationCampaign[]) {
  state = mutate(state);
  listeners.forEach((listener) => listener());
}

export function saveCampaign(campaign: NotificationCampaign) {
  update((current) =>
    current.some((item) => item.id === campaign.id)
      ? current.map((item) => (item.id === campaign.id ? campaign : item))
      : [campaign, ...current]
  );
}

export function deleteCampaign(id: string) {
  update((current) => current.filter((item) => item.id !== id));
}
