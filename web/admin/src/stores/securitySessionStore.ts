'use client';

import { useSyncExternalStore } from 'react';
import {
  INITIAL_SECURITY_ADMINISTRATORS,
  INITIAL_SECURITY_ROLES,
  type SecurityAdministrator,
  type SecurityRole,
} from '@/data/security';

export type SecuritySessionState = {
  administrators: SecurityAdministrator[];
  roles: SecurityRole[];
};

const INITIAL_STATE: SecuritySessionState = {
  administrators: INITIAL_SECURITY_ADMINISTRATORS,
  roles: INITIAL_SECURITY_ROLES,
};

let state = INITIAL_STATE;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL_STATE;

export function useSecuritySession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function updateSecuritySession(
  update: (current: SecuritySessionState) => SecuritySessionState
) {
  state = update(state);
  listeners.forEach((listener) => listener());
}

export function saveAdministrator(administrator: SecurityAdministrator) {
  updateSecuritySession((current) => ({
    ...current,
    administrators: current.administrators.some((item) => item.id === administrator.id)
      ? current.administrators.map((item) => (item.id === administrator.id ? administrator : item))
      : [...current.administrators, administrator],
  }));
}

export function deleteAdministrator(id: string) {
  updateSecuritySession((current) => ({
    ...current,
    administrators: current.administrators.filter((item) => item.id !== id),
  }));
}

export function saveRole(role: SecurityRole) {
  updateSecuritySession((current) => ({
    ...current,
    roles: current.roles.some((item) => item.id === role.id)
      ? current.roles.map((item) => (item.id === role.id ? role : item))
      : [...current.roles, role],
  }));
}

export function deleteRole(id: string) {
  updateSecuritySession((current) => ({
    ...current,
    roles: current.roles.filter((item) => item.id !== id),
  }));
}
