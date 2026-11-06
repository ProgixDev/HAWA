import {ONLINE_BACKUP_ENABLED} from '../config/features';

// The optional AWA account, as far as the interface is concerned. There is no backend yet: nobody is ever signed in (`isSignedIn` is
// `false` from launch) and the data lives only on the phone. In memory only — it is not persisted until real authentication exists.
// Everything account-related in the UI (the "Mes données" signed-in state, the home reminder card) reads THIS state together with the
// ONLINE_BACKUP_ENABLED flag (see `isAccountUiActive`).

export type AccountState = {
  isSignedIn: boolean;
  /** The account's e-mail, or an empty string. */
  email: string;
  /** When the last online backup finished, or `null`. */
  lastBackupAt: Date | null;
};

const SIGNED_OUT: AccountState = {isSignedIn: false, email: '', lastBackupAt: null};

let state: AccountState = SIGNED_OUT;
const listeners = new Set<() => void>();

export const getAccountState = (): AccountState => state;

export function setAccountState(next: Partial<AccountState>): void {
  state = {...state, ...next};
  listeners.forEach(listener => listener());
}

/** Back to "no account": the data stays on the phone. */
export function signOutAccount(): void {
  setAccountState(SIGNED_OUT);
}

export const subscribeAccountState = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

/** True only when the online backup feature is on AND someone is signed in: the one condition for showing the signed-in state. */
export const isAccountUiActive = (account: AccountState = state): boolean => ONLINE_BACKUP_ENABLED && account.isSignedIn;
