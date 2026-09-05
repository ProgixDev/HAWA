import AsyncStorage from '@react-native-async-storage/async-storage';

// Postpartum tracking configuration — created the moment a real pregnancy
// delivery is confirmed (see confirmDelivery() below). Deliberately isolated
// from pregnancyPreferences.ts (dating/tracking/reminders) and from
// onboardingPreferences.ts (Cycle) — its own storage key, its own in-memory
// singleton, same module pattern as pregnancyPreferences.ts. Confirming a
// delivery never touches or deletes Pregnancy data; the delivery date is
// simply the canonical start of postpartum tracking going forward.
export type PostpartumDeliveryType =
  | 'vaginal'
  | 'planned_csection'
  | 'emergency_csection'
  | 'prefer_not_to_say';

// Product context only — later feeds the "Retour du cycle" section (feeding
// affects postpartum amenorrhea/cycle-return expectations), but no
// prediction logic reads this yet; this task only persists the answer.
export type PostpartumFeedingType =
  | 'exclusive_breastfeeding'
  | 'mixed'
  | 'exclusive_bottle'
  | 'unknown';

export type PostpartumPreferences = {
  /** 'YYYY-MM-DD' (local calendar day), same convention as the rest of the
   * project's journal/appointment date fields — never null once a delivery
   * has been confirmed. */
  deliveryDate: string | null;
  /** ISO timestamp of the moment postpartum tracking was activated —
   * distinct from deliveryDate itself (a custom past date can be chosen),
   * kept only in case a future screen needs to know when this was set up. */
  startedAt: string | null;
  /** Optional product context only (e.g. tailoring recovery content later)
   * — never used for medical diagnosis. Null until chosen; the user may
   * explicitly decline via 'prefer_not_to_say' rather than being forced to
   * pick a real answer. */
  deliveryType: PostpartumDeliveryType | null;
  /** Optional product context only. Null means "not yet answered"; a real
   * 'unknown' value (from "Je ne sais pas encore") is an explicit answer
   * and must be preserved, never collapsed back to null. */
  feedingType: PostpartumFeedingType | null;
  /** 'YYYY-MM-DD' — the first REAL menstrual period explicitly confirmed by
   * the user since delivery (see recordFirstPostpartumPeriod below). Null
   * means the cycle has not resumed yet. Deliberately never inferred from
   * lochia bleeding or any other signal — only an explicit user action sets
   * this. */
  firstPostpartumPeriodDate: string | null;
  /** Optional "Suivi quotidien" reminder onboarding (PostpartumRemindersScreen)
   * — a separate, user-configurable, recurring health-tracking reminder,
   * deliberately independent from the automatic religious Nifas J35/J40
   * reminders (see postpartumNifasReminderStore.ts, never touched by this
   * field). `dailyTrackingReminderTime` is 'HH:mm' local time, same format
   * as menopausePreferences.ts's own reminder times — never a second time
   * format. `null` until the user explicitly picks a time; never a
   * fabricated default hour. */
  dailyTrackingReminderEnabled: boolean;
  dailyTrackingReminderTime: string | null;
};

const STORAGE_KEY = '@hawa/postpartum-preferences/v1';
const DEFAULT_PREFERENCES: PostpartumPreferences = {
  deliveryDate: null,
  startedAt: null,
  deliveryType: null,
  feedingType: null,
  firstPostpartumPeriodDate: null,
  dailyTrackingReminderEnabled: false,
  dailyTrackingReminderTime: null,
};

let postpartumPreferences: PostpartumPreferences = {...DEFAULT_PREFERENCES};
const listeners = new Set<() => void>();
let hydration: Promise<PostpartumPreferences> | null = null;
let hydrated = false;

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const isValidDeliveryType = (value: unknown): value is PostpartumDeliveryType =>
  value === 'vaginal' || value === 'planned_csection' || value === 'emergency_csection' || value === 'prefer_not_to_say';

const isValidFeedingType = (value: unknown): value is PostpartumFeedingType =>
  value === 'exclusive_breastfeeding' || value === 'mixed' || value === 'exclusive_bottle' || value === 'unknown';

const isValidPreferences = (value: unknown): value is Partial<PostpartumPreferences> => {
  if (!value || typeof value !== 'object') {return false;}
  const candidate = value as Partial<PostpartumPreferences>;
  return (
    (candidate.deliveryDate === null || typeof candidate.deliveryDate === 'string') &&
    (candidate.startedAt === null || typeof candidate.startedAt === 'string') &&
    // deliveryType/feedingType may be absent on data persisted before those
    // fields existed.
    (candidate.deliveryType === undefined || candidate.deliveryType === null || isValidDeliveryType(candidate.deliveryType)) &&
    (candidate.feedingType === undefined || candidate.feedingType === null || isValidFeedingType(candidate.feedingType)) &&
    // Absent on data persisted before this field existed.
    (candidate.firstPostpartumPeriodDate === undefined ||
      candidate.firstPostpartumPeriodDate === null ||
      typeof candidate.firstPostpartumPeriodDate === 'string') &&
    // Absent on data persisted before these fields existed.
    (candidate.dailyTrackingReminderEnabled === undefined || typeof candidate.dailyTrackingReminderEnabled === 'boolean') &&
    (candidate.dailyTrackingReminderTime === undefined ||
      candidate.dailyTrackingReminderTime === null ||
      typeof candidate.dailyTrackingReminderTime === 'string')
  );
};

export const getPostpartumPreferences = (): PostpartumPreferences => ({...postpartumPreferences});

export const setPostpartumPreferences = async (value: PostpartumPreferences): Promise<void> => {
  postpartumPreferences = {...value};
  notifyListeners();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(postpartumPreferences));
};

/** THE single canonical way to record "delivery really happened on this
 * date" — used by PregnancyDashboard's "J'ai accouché" CTA (and nowhere
 * else; do not duplicate this call). Only persists postpartum state; it
 * deliberately does NOT switch activeObjective itself, so callers stay in
 * control of that separate, explicit step (same separation Cycle keeps
 * between period-history data and the objective selector). */
export const confirmDelivery = async (deliveryDate: Date): Promise<void> => {
  await setPostpartumPreferences({
    ...postpartumPreferences,
    deliveryDate: deliveryDate.toLocaleDateString('en-CA'),
    startedAt: new Date().toISOString(),
  });
};

/** THE single canonical way to record the delivery type — used by
 * PostpartumDeliveryTypeScreen (and nowhere else; do not duplicate this
 * call). Product context only, never a medical record. */
export const setDeliveryType = async (deliveryType: PostpartumDeliveryType): Promise<void> => {
  await setPostpartumPreferences({...postpartumPreferences, deliveryType});
};

/** THE single canonical way to record the feeding choice — used by
 * PostpartumFeedingScreen (and nowhere else; do not duplicate this call).
 * Product context only, never a medical record; no prediction logic reads
 * this value yet. */
export const setFeedingType = async (feedingType: PostpartumFeedingType): Promise<void> => {
  await setPostpartumPreferences({...postpartumPreferences, feedingType});
};

/** THE single canonical way to record "the real first menstrual period
 * since delivery happened on this date" — used by
 * PostpartumCycleReturnScreen (and nowhere else; do not duplicate this
 * call). Lochia bleeding must never be passed here — only an explicit,
 * user-confirmed menstrual period counts as the cycle resuming. */
export const recordFirstPostpartumPeriod = async (date: Date): Promise<void> => {
  await setPostpartumPreferences({
    ...postpartumPreferences,
    firstPostpartumPeriodDate: date.toLocaleDateString('en-CA'),
  });
};

/** THE single canonical way to record the optional "Suivi quotidien" reminder
 * answer — used by PostpartumRemindersScreen, in BOTH onboarding and Profile
 * → Santé générale → Notifications & rappels edit mode (and nowhere else; do
 * not duplicate this call). Never infers a schedule: the time comes only
 * from what the user explicitly picked on that screen. Completely
 * independent of the Nifas J35/J40 reminders (postpartumNifasReminderStore.ts). */
export const setPostpartumDailyTrackingReminder = async (value: {
  dailyTrackingReminderEnabled: boolean;
  dailyTrackingReminderTime: string | null;
}): Promise<void> => {
  await setPostpartumPreferences({...postpartumPreferences, ...value});
};

export const hydratePostpartumPreferences = (): Promise<PostpartumPreferences> => {
  if (hydrated) {
    return Promise.resolve(getPostpartumPreferences());
  }
  if (!hydration) {
    hydration = AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        hydrated = true;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isValidPreferences(parsed)) {
            postpartumPreferences = {...DEFAULT_PREFERENCES, ...parsed};
            notifyListeners();
          }
        }
        return getPostpartumPreferences();
      })
      .catch(() => {
        hydrated = true;
        return getPostpartumPreferences();
      });
  }
  return hydration;
};

export const subscribePostpartumPreferences = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};
