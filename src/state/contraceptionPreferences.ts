import AsyncStorage from '@react-native-async-storage/async-storage';

export type ContraceptionMethod = 'pill' | 'ring' | 'patch' | 'other';

/** Pill-only. 'cyclic' = a real user-entered activeDays/breakDays pair
 * (derived from hasTreatmentBreak === true); 'continuous' = no break in the
 * regimen (hasTreatmentBreak === false) — deliberately carries no day count,
 * since there is no real finite pack length to divide by; 'unknown' = the
 * user explicitly declined to specify (PillScheduleScreen's "Je ne connais
 * pas encore mon schéma" option) rather than AWA guessing one. `null` means
 * not yet configured — either the method isn't pill, or a pill user hasn't
 * reached PillScheduleScreen yet (legacy install, or mid-onboarding). Never
 * defaulted to 'cyclic' with invented 21/7 values — see contraceptionMath.ts
 * / ContraceptionDashboard.tsx for why the old hardcoded 28-day pack was
 * removed. */
export type PillScheduleType = 'continuous' | 'cyclic' | 'unknown';

export type ContraceptionPreferences = {
  method: ContraceptionMethod | null;
  /** yyyy-mm-dd, local — same date-key convention used throughout AWA. */
  methodStartDate: string | null;
  /** null = not yet answered — distinct from `false` ("Non" is a real,
   * valid answer and must never be treated as unanswered). */
  hasTreatmentBreak: boolean | null;
  /** See PillScheduleType. Always null for ring/patch/other. */
  pillScheduleType: PillScheduleType | null;
  /** Real user-entered days of intake — only meaningful (non-null) when
   * `pillScheduleType === 'cyclic'`. Never a fabricated/default value. */
  activeDays: number | null;
  /** Real user-entered days of pause — only meaningful (non-null) when
   * `pillScheduleType === 'cyclic'`. `null`, never `0`, when not applicable
   * (continuous/unknown) — this store distinguishes "not applicable" from a
   * real numeric zero. */
  breakDays: number | null;
  /** Generic reminder enable/disable, meaningful for every method (the
   * displayed copy adapts per method on ContraceptionRemindersScreen, but
   * the underlying preference is the same concept — "remind me or not" —
   * for pill/ring/patch/other, so a single shared field is correct here,
   * not one boolean per method. */
  remindersEnabled: boolean;
  /** 'HH:mm', local time — same shape as
   * pregnancyNotificationSettingsStore.ts's `dailyJournalTime`. Null when no
   * time has been chosen yet (e.g. reminders just enabled, or a legacy
   * install predating this field) — callers must never invent a fallback
   * hour; contraceptionReminderScheduling.ts simply does not schedule until
   * a real time is set. Scheduled via the existing pregnancyNotifications.ts
   * chokepoint — see contraceptionReminderScheduling.ts. */
  reminderTime: string | null;
};

const STORAGE_KEY = '@hawa/contraception-preferences';

const defaultPreferences: ContraceptionPreferences = {
  method: null,
  methodStartDate: null,
  hasTreatmentBreak: null,
  pillScheduleType: null,
  activeDays: null,
  breakDays: null,
  remindersEnabled: false,
  reminderTime: null,
};

let preferences: ContraceptionPreferences = {...defaultPreferences};
let hydration: Promise<ContraceptionPreferences> | null = null;
let hydrated = false;
const listeners = new Set<() => void>();
const notifyListeners = () => listeners.forEach(listener => listener());

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const isMethod = (value: unknown): value is ContraceptionMethod =>
  value === 'pill' || value === 'ring' || value === 'patch' || value === 'other';

const isPillScheduleType = (value: unknown): value is PillScheduleType =>
  value === 'continuous' || value === 'cyclic' || value === 'unknown';

export const getContraceptionPreferences = (): ContraceptionPreferences => ({...preferences});

export const subscribeContraceptionPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const hydrateContraceptionPreferences = (): Promise<ContraceptionPreferences> => {
  // Once the first AsyncStorage read has settled, always return a FRESH
  // snapshot of the live in-memory `preferences` on repeat calls — never the
  // same resolved promise. A forever-memoized promise here previously caused
  // a real bug: ContraceptionDashboard re-hydrates on every focus, and a
  // frozen pre-edit snapshot silently reverted a just-saved method/reminders
  // change after navigating back from edit mode. Same safe pattern as
  // postpartumLochiaStore.ts / contraceptionIntakeHistoryStore.ts.
  if (hydrated) {
    return Promise.resolve(getContraceptionPreferences());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const value: unknown = JSON.parse(raw);
          if (isObject(value)) {
            // Legacy installs only ever wrote `dailyPillReminderEnabled`
            // (pill-only). Migrate it into the new generic field once so an
            // existing pill user who already enabled reminders doesn't lose
            // that choice; never written back under the old key again.
            const remindersEnabled = typeof value.remindersEnabled === 'boolean'
              ? value.remindersEnabled
              : value.dailyPillReminderEnabled === true;
            preferences = {
              method: isMethod(value.method) ? value.method : null,
              methodStartDate: typeof value.methodStartDate === 'string' ? value.methodStartDate : null,
              hasTreatmentBreak: typeof value.hasTreatmentBreak === 'boolean' ? value.hasTreatmentBreak : null,
              pillScheduleType: isPillScheduleType(value.pillScheduleType) ? value.pillScheduleType : null,
              activeDays: typeof value.activeDays === 'number' ? value.activeDays : null,
              breakDays: typeof value.breakDays === 'number' ? value.breakDays : null,
              remindersEnabled,
              reminderTime: typeof value.reminderTime === 'string' ? value.reminderTime : null,
            };
          }
        }
        notifyListeners();
        return getContraceptionPreferences();
      })
      .catch(() => {
        hydrated = true;
        return getContraceptionPreferences();
      });
  }
  return hydration;
};

export const setContraceptionPreferences = async (
  next: Partial<ContraceptionPreferences>,
): Promise<void> => {
  preferences = {...preferences, ...next};
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  notifyListeners();
};
