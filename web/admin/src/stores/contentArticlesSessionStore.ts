'use client';

import { useSyncExternalStore } from 'react';
import { contentArticles } from '@/data/mock/content';
import type { Article } from '@/types';

// Shared session-scoped article state — mirrors the existing
// securitySessionStore/notificationsSessionStore pattern. This exists so
// Articles' mutations (create/edit/delete/publish/duplicate/bulk actions)
// are visible to Categories' article counts and delete-guard within the
// same session, instead of each screen keeping its own disconnected copy
// of the same mock array.
let state = contentArticles;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;
const getServerSnapshot = () => contentArticles;

export function useArticlesSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Same functional-updater shape as React's `setState`, so existing
// `setArticles((current) => ...)` call sites can be rebound to this
// unchanged.
export function setArticlesSession(mutate: (current: Article[]) => Article[]) {
  state = mutate(state);
  listeners.forEach((listener) => listener());
}
