import AsyncStorage from '@react-native-async-storage/async-storage';

// "AWA à deux" sharing choices: which pieces of information the user lets her partner
// see. Saved on the device (AsyncStorage), versioned key `@hawa/awa-a-deux-sharing/v1`.
//
// Nothing here is sent anywhere: AWA has no backend, no partner account and no pairing
// yet. What IS in place is the single rule for "what may the partner see"
// (src/utils/awaADeuxSharing.ts: computePartnerVisibility / buildPartnerSnapshot).
// The partner preview already goes through it, and so must the future partner view /
// sync — the switches are never just hidden in the UI.
//
// Only these ten choices exist, on purpose: personal notes, intimacy, detailed
// symptoms, medical results, medication, contraception adherence, loss bleeding,
// lochia, Nifas and every religious / spiritual information (Qadaa, prayer, purity)
// are outside this sharing design.

export type SharingKey =
  | 'cycleDay'
  | 'nextPeriod'
  | 'periodStatus'
  | 'fertileWindow'
  | 'ovulation'
  | 'fertilityStatus'
  | 'pregnancyWeek'
  | 'dueDate'
  | 'babyDevelopment'
  | 'mood'
  | 'dailyAdvice';

export type SharingToggles = Record<SharingKey, boolean>;

/** Nothing is shared without a choice, except the two the flow has always started with. */
export const DEFAULT_SHARING_TOGGLES: SharingToggles = {
  cycleDay: true,
  nextPeriod: true,
  periodStatus: false,
  fertileWindow: false,
  ovulation: false,
  fertilityStatus: false,
  pregnancyWeek: false,
  dueDate: false,
  babyDevelopment: false,
  mood: false,
  dailyAdvice: true,
};

export const SHARING_KEYS = Object.keys(DEFAULT_SHARING_TOGGLES) as SharingKey[];

export const AWA_A_DEUX_SHARING_STORAGE_KEY = '@hawa/awa-a-deux-sharing/v1';

let toggles: SharingToggles = {...DEFAULT_SHARING_TOGGLES};
const listeners = new Set<() => void>();
let hydration: Promise<SharingToggles> | null = null;
let hydrated = false;
let writeChain: Promise<void> = Promise.resolve();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Unknown keys are dropped, a missing or non-boolean value falls back to its default.
const sanitize = (value: unknown): SharingToggles => {
  const result = {...DEFAULT_SHARING_TOGGLES};
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of SHARING_KEYS) {
      if (typeof record[key] === 'boolean') {result[key] = record[key] as boolean;}
    }
  }
  return result;
};

const persist = (): Promise<void> => {
  const snapshot = JSON.stringify({version: 1, toggles});
  writeChain = writeChain
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(AWA_A_DEUX_SHARING_STORAGE_KEY, snapshot));
  return writeChain;
};

export const getSharingToggles = (): SharingToggles => toggles;

export const subscribeSharingToggles = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

export const hydrateSharingToggles = (): Promise<SharingToggles> => {
  if (hydrated) {return Promise.resolve(toggles);}
  if (!hydration) {
    hydration = AsyncStorage.getItem(AWA_A_DEUX_SHARING_STORAGE_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as {toggles?: unknown};
            toggles = sanitize(parsed?.toggles);
          } catch {
            toggles = {...DEFAULT_SHARING_TOGGLES};
          }
        }
        hydrated = true;
        notifyListeners();
        return toggles;
      })
      .catch(() => {
        // Unreadable: stay un-hydrated (retried later) and never overwrite what may be there.
        hydration = null;
        return toggles;
      });
  }
  return hydration;
};

/**
 * Turns one choice on or off — applied immediately, then saved. Waits for the first
 * read so the saved choices are never overwritten by the defaults.
 */
export const setSharingToggle = async (key: SharingKey, value: boolean): Promise<void> => {
  await hydrateSharingToggles();
  if (!hydrated) {throw new Error('[awaADeuxSharingStore] Saved sharing choices could not be read; refusing to write.');}
  if (toggles[key] === value) {return;}
  toggles = {...toggles, [key]: value};
  notifyListeners();
  await persist();
};
