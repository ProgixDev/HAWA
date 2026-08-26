import AsyncStorage from '@react-native-async-storage/async-storage';

// Canonical onboarding + reminder preferences for the "Cycles irréguliers /
// SOPK" objective (ObjectiveId 'irregular'). Deliberately isolated from
// cyclePreferences in onboardingPreferences.ts (real cycle DATA shared with
// the generic Cycle objective — lastPeriodStart/periodDuration/cycleDuration/
// regularity/period history) — this store only holds SOPK's own onboarding
// answers and reminder choices. Same module-singleton + AsyncStorage pattern
// as conceptionPreferences.ts / cycleReminderPreferences.ts / menopausePreferences.ts.
//
// `cyclePattern` and `trackedItems` are purely descriptive/preference data —
// never used to diagnose PCOS, and never used to classify a long cycle as
// "late" (see src/utils/irregularReminderScheduling.ts, which never computes
// or displays a "days late" value).

export type IrregularCyclePattern = 'regular' | 'irregular' | 'very_variable' | 'unknown';

// Only 'weight' and 'mood' map onto an existing canonical DailyJournalEntry
// section (see src/types/journal.ts's JournalSection). 'acne' has no
// dedicated field anywhere in the app today — it is only ever a free-text
// entry inside symptoms.names (see JournalSymptomsScreen.tsx) — and
// 'hairGrowth' has no structured field at all. These preferences are
// captured as an emphasis/preference signal only; they never create,
// migrate, or gate any journal data.
export type IrregularTrackedItem = 'acne' | 'hairGrowth' | 'weight' | 'pain' | 'mood' | 'fatigue' | 'otherSymptoms';

export type IrregularReminderPreferences = {
  dailyJournalEnabled: boolean;
  /** 'HH:mm', local time — same format as every other AWA reminder time
   * (cycleReminderPreferences.ts's dailyJournalTime, menopausePreferences.ts's
   * *ReminderTime). Null until the user explicitly picks a time; never a
   * fabricated default hour. */
  dailyJournalTime: string | null;
  unrecordedPeriodEnabled: boolean;
};

export type IrregularPreferences = {
  cyclePattern: IrregularCyclePattern | null;
  /** 'YYYY-MM-DD', local date convention (never toISOString()) — null when
   * genuinely not renseigné ("Je ne sais pas / Je préfère renseigner plus
   * tard"), never a fabricated default date. */
  lastPeriodDate: string | null;
  trackedItems: IrregularTrackedItem[];
  reminders: IrregularReminderPreferences;
};

const STORAGE_KEY = '@hawa/irregular-preferences/v1';

const DEFAULT_PREFERENCES: IrregularPreferences = {
  cyclePattern: null,
  lastPeriodDate: null,
  trackedItems: [],
  reminders: {
    dailyJournalEnabled: false,
    dailyJournalTime: null,
    unrecordedPeriodEnabled: false,
  },
};

const VALID_CYCLE_PATTERNS: IrregularCyclePattern[] = ['regular', 'irregular', 'very_variable', 'unknown'];
const VALID_TRACKED_ITEMS: IrregularTrackedItem[] = ['acne', 'hairGrowth', 'weight', 'pain', 'mood', 'fatigue', 'otherSymptoms'];

let preferences: IrregularPreferences = {...DEFAULT_PREFERENCES, reminders: {...DEFAULT_PREFERENCES.reminders}};
const listeners = new Set<() => void>();
let hydration: Promise<IrregularPreferences> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

function sanitizeTrackedItems(value: unknown): IrregularTrackedItem[] {
  if (!Array.isArray(value)) {return [];}
  return value.filter((item): item is IrregularTrackedItem => VALID_TRACKED_ITEMS.includes(item as IrregularTrackedItem));
}

function sanitizeCyclePattern(value: unknown): IrregularCyclePattern | null {
  return VALID_CYCLE_PATTERNS.includes(value as IrregularCyclePattern) ? (value as IrregularCyclePattern) : null;
}

function sanitizeReminders(value: unknown): IrregularReminderPreferences {
  const candidate = (value && typeof value === 'object' ? value : {}) as Partial<IrregularReminderPreferences>;
  return {
    dailyJournalEnabled: candidate.dailyJournalEnabled === true,
    dailyJournalTime: typeof candidate.dailyJournalTime === 'string' ? candidate.dailyJournalTime : null,
    unrecordedPeriodEnabled: candidate.unrecordedPeriodEnabled === true,
  };
}

export const getIrregularPreferences = (): IrregularPreferences => ({
  ...preferences,
  trackedItems: [...preferences.trackedItems],
  reminders: {...preferences.reminders},
});

/** THE single canonical way to persist SOPK preferences — used by both the
 * onboarding screens (src/screens/irregular/IrregularOnboardingScreens.tsx)
 * and Profile → Notifications & rappels (same screen, {mode:'edit'}). Merges
 * a partial update onto the current in-memory state so a caller never has to
 * pass fields it isn't changing. */
export const setIrregularPreferences = async (value: Partial<IrregularPreferences>): Promise<void> => {
  preferences = {
    ...preferences,
    ...value,
    trackedItems: value.trackedItems ? [...value.trackedItems] : preferences.trackedItems,
    reminders: value.reminders ? {...preferences.reminders, ...value.reminders} : preferences.reminders,
  };
  notifyListeners();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
};

export const hydrateIrregularPreferences = (): Promise<IrregularPreferences> => {
  if (hydrated) {
    return Promise.resolve(getIrregularPreferences());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<IrregularPreferences>;
          preferences = {
            cyclePattern: sanitizeCyclePattern(parsed.cyclePattern),
            lastPeriodDate: typeof parsed.lastPeriodDate === 'string' ? parsed.lastPeriodDate : null,
            trackedItems: sanitizeTrackedItems(parsed.trackedItems),
            reminders: sanitizeReminders(parsed.reminders),
          };
          notifyListeners();
        }
        return getIrregularPreferences();
      })
      .catch(() => {
        hydrated = true;
        return getIrregularPreferences();
      });
  }
  return hydration;
};

export const subscribeIrregularPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
