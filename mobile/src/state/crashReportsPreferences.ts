import AsyncStorage from '@react-native-async-storage/async-storage';

// Whether the person agreed to send anonymous crash reports (see services/sentry.ts). Kept apart from securityPreferences.ts on purpose:
// that store pulls in the Keychain / app-lock code, and this value must be readable at the very start of the app, before anything else
// (and must never be mixed up with the lock). The key sits under `@awa/security/`, so storageKeyClassifier already files it as a preference.
const CRASH_REPORTS_KEY = '@awa/security/crash-reports-v1';

/** `null` = never asked (the one-time invitation has not been answered yet). */
export type CrashReportsChoice = 'granted' | 'declined' | null;

let choice: CrashReportsChoice = null;
let loadPromise: Promise<CrashReportsChoice> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

/** Reads the stored choice once. Anything that is not exactly 'granted' / 'declined', and a read that fails, is "never asked": consent is
 * never inferred from a broken read — the invitation simply comes back, and until then nothing is sent. */
export function loadCrashReportsChoice(): Promise<CrashReportsChoice> {
  if (!loadPromise) {
    loadPromise = AsyncStorage.getItem(CRASH_REPORTS_KEY)
      .then(value => {
        choice = value === 'granted' || value === 'declined' ? value : null;
        return choice;
      })
      .catch(() => {
        loadPromise = null;
        return null;
      });
  }
  return loadPromise;
}

export const getCrashReportsChoice = (): CrashReportsChoice => choice;
export const isCrashReportsGranted = (): boolean => choice === 'granted';

/** Persists first, then updates memory: a write that fails must not look like an accepted choice. */
export async function setCrashReportsChoice(next: 'granted' | 'declined'): Promise<void> {
  await AsyncStorage.setItem(CRASH_REPORTS_KEY, next);
  choice = next;
  loadPromise = Promise.resolve(next);
  emit();
}

export const subscribeCrashReportsChoice = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Tests only. */
export function resetCrashReportsChoiceForTests(): void {
  choice = null;
  loadPromise = null;
  listeners.clear();
}
