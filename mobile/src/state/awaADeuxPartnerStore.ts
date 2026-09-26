import AsyncStorage from '@react-native-async-storage/async-storage';

// "AWA à deux": the first name of the user's partner, as she typed it on the
// "Comment s'appelle votre partenaire ?" screen. It is the ONE source of truth for every
// AWA à deux screen (sharing, preview, invitation, connection, dashboard): screens read it
// through useAwaADeuxPartnerName() and never hold a name of their own.
//
// Saved on the device (AsyncStorage), versioned key `@hawa/awa-a-deux-partner/v1`, same
// pattern as awaADeuxSharingStore. Nothing is sent anywhere — no backend, no partner
// account. An empty string means "not configured yet": there is deliberately NO fallback
// name here (screens use neutral wording such as "votre partenaire" instead).
// The value stays updatable (setAwaADeuxPartnerName), e.g. from a future AWA à deux settings screen.

export const AWA_A_DEUX_PARTNER_STORAGE_KEY = '@hawa/awa-a-deux-partner/v1';
export const PARTNER_NAME_MAX_LENGTH = 40;

/** The name as it is stored and displayed: leading / trailing whitespace removed. */
export const normalizePartnerName = (value: string): string => value.trim();

let partnerName = '';
const listeners = new Set<() => void>();
let hydration: Promise<string> | null = null;
let hydrated = false;
// True once the name was set in this session: a slower read of the disk must never replace it.
let changedSinceStart = false;
let writeChain: Promise<void> = Promise.resolve();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const sanitize = (value: unknown): string =>
  typeof value === 'string' ? normalizePartnerName(value).slice(0, PARTNER_NAME_MAX_LENGTH) : '';

export const getAwaADeuxPartnerName = (): string => partnerName;

export const subscribeAwaADeuxPartnerName = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

export const hydrateAwaADeuxPartnerName = (): Promise<string> => {
  if (hydrated) {return Promise.resolve(partnerName);}
  if (!hydration) {
    hydration = AsyncStorage.getItem(AWA_A_DEUX_PARTNER_STORAGE_KEY)
      .then(raw => {
        if (raw && !changedSinceStart) {
          try {
            partnerName = sanitize((JSON.parse(raw) as {partnerName?: unknown})?.partnerName);
          } catch {
            partnerName = '';
          }
        }
        hydrated = true;
        notifyListeners();
        return partnerName;
      })
      .catch(() => {
        hydration = null; // unreadable: retried later
        return partnerName;
      });
  }
  return hydration;
};

const persist = (): Promise<void> => {
  const snapshot = partnerName ? JSON.stringify({version: 1, partnerName}) : null;
  writeChain = writeChain
    .catch(() => undefined)
    .then(() => (snapshot ? AsyncStorage.setItem(AWA_A_DEUX_PARTNER_STORAGE_KEY, snapshot) : AsyncStorage.removeItem(AWA_A_DEUX_PARTNER_STORAGE_KEY)));
  return writeChain;
};

/**
 * Saves the partner's name (trimmed). Applied immediately, then written to the device;
 * the returned promise settles when it is saved. A blank name is refused (returns false,
 * nothing changes) — the previous name is kept.
 */
export const setAwaADeuxPartnerName = (value: string): {accepted: boolean; saved: Promise<void>} => {
  const next = sanitize(value);
  if (!next) {return {accepted: false, saved: Promise.resolve()};}
  changedSinceStart = true;
  if (next !== partnerName) {
    partnerName = next;
    notifyListeners();
  }
  return {accepted: true, saved: persist()};
};

/** Forgets the partner name (back to "not configured"). */
export const clearAwaADeuxPartnerName = async (): Promise<void> => {
  changedSinceStart = true;
  partnerName = '';
  notifyListeners();
  await persist();
};
