import AsyncStorage from '@react-native-async-storage/async-storage';

// "AWA à deux" — the PARTNER's OWN profile first name (PartnerProfileScreen's editable
// "Prénom" row). This is a DIFFERENT concept from awaADeuxPartnerStore's `partnerName`:
//
//  - awaADeuxPartnerStore.partnerName is the name the OWNER typed in for her partner
//    while configuring AWA à deux (`AwaADeuxPartnerNameScreen`) — it is HER entry, read-only
//    from the partner's side, and every owner-side screen keeps reading it unchanged.
//  - This store is the partner's OWN, self-edited first name. Editing it must never write
//    back to awaADeuxPartnerStore — the two stay separate on purpose (see
//    PartnerProfileScreen.tsx's header comment), so a future real partner account can adopt
//    this value cleanly without touching the owner's configuration.
//
// Saved on the device (AsyncStorage), versioned key `@hawa/awa-a-deux-partner-profile/v1`,
// same pattern as awaADeuxPartnerStore. Nothing is sent anywhere — no backend, no partner
// account. An empty string means "not set yet": PartnerProfileScreen falls back to the
// owner-entered partnerName (then to neutral wording) until the partner explicitly saves
// their own first name here, which then becomes the source of truth for partner-side UI.

export const AWA_A_DEUX_PARTNER_PROFILE_STORAGE_KEY = '@hawa/awa-a-deux-partner-profile/v1';
export const PARTNER_PROFILE_FIRST_NAME_MAX_LENGTH = 40;

/** The name as it is stored and displayed: leading / trailing whitespace removed. */
export const normalizePartnerProfileFirstName = (value: string): string => value.trim();

let firstName = '';
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
  typeof value === 'string' ? normalizePartnerProfileFirstName(value).slice(0, PARTNER_PROFILE_FIRST_NAME_MAX_LENGTH) : '';

export const getAwaADeuxPartnerProfileFirstName = (): string => firstName;

export const subscribeAwaADeuxPartnerProfileFirstName = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

export const hydrateAwaADeuxPartnerProfileFirstName = (): Promise<string> => {
  if (hydrated) {return Promise.resolve(firstName);}
  if (!hydration) {
    hydration = AsyncStorage.getItem(AWA_A_DEUX_PARTNER_PROFILE_STORAGE_KEY)
      .then(raw => {
        if (raw && !changedSinceStart) {
          try {
            firstName = sanitize((JSON.parse(raw) as {firstName?: unknown})?.firstName);
          } catch {
            firstName = '';
          }
        }
        hydrated = true;
        notifyListeners();
        return firstName;
      })
      .catch(() => {
        hydration = null; // unreadable: retried later
        return firstName;
      });
  }
  return hydration;
};

const persist = (): Promise<void> => {
  const snapshot = firstName ? JSON.stringify({version: 1, firstName}) : null;
  writeChain = writeChain
    .catch(() => undefined)
    .then(() => (snapshot ? AsyncStorage.setItem(AWA_A_DEUX_PARTNER_PROFILE_STORAGE_KEY, snapshot) : AsyncStorage.removeItem(AWA_A_DEUX_PARTNER_PROFILE_STORAGE_KEY)));
  return writeChain;
};

/**
 * Saves the partner's OWN first name (trimmed). Applied immediately, then written to the
 * device; the returned promise settles when it is saved. A blank name is refused (returns
 * false, nothing changes) — the previous value is kept. Never touches
 * awaADeuxPartnerStore's owner-entered `partnerName`.
 */
export const setAwaADeuxPartnerProfileFirstName = (value: string): {accepted: boolean; saved: Promise<void>} => {
  const next = sanitize(value);
  if (!next) {return {accepted: false, saved: Promise.resolve()};}
  changedSinceStart = true;
  if (next !== firstName) {
    firstName = next;
    notifyListeners();
  }
  return {accepted: true, saved: persist()};
};

/** Forgets the partner's own profile first name (back to "not set"). Test/reset use only. */
export const clearAwaADeuxPartnerProfileFirstName = async (): Promise<void> => {
  changedSinceStart = true;
  firstName = '';
  notifyListeners();
  await persist();
};
