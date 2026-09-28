import AsyncStorage from '@react-native-async-storage/async-storage';
import type {CycleRegularity} from './onboardingPreferences';

// Profiles the main user MANAGES on someone else's behalf (today: a daughter whose
// cycle she tracks) — completely separate from the main user's OWN account and from
// AWA à deux (no partner/sharing/connection/invitation concept here at all; see the
// header comments in src/screens/managedProfile/*.tsx). This is FRONTEND-ONLY for
// now: this store only remembers WHICH managed profiles exist and their own
// basic/cycle-setup info. No profile-scoped cycle dashboard/data isolation exists
// yet — that is a later phase, and this store must not be mistaken for it.
//
// Storage: key `@hawa/managed-profiles/v1` (versioned), same
// hydrate/get/subscribe/add/persist pattern as qadaaLedgerStore.ts. Invalid records
// are dropped individually so one corrupted entry can never hide the rest.
//
// Privacy: `profileImageUri` (optional) is a LOCAL file URI only (from the camera or
// the phone's gallery, via react-native-image-picker) — it is never uploaded, never
// sent to any API, and never leaves the device. See CLAUDE.md §6.

export type ManagedProfileType = 'daughter';

export type ManagedProfile = {
  id: string;
  type: ManagedProfileType;
  firstName: string;
  /** Local date key (`en-CA`, e.g. "2012-03-15") — never a UTC-shifted ISO slice
   * (CLAUDE.md's mandated date-key convention). */
  birthDate: string;
  hasHadFirstPeriod: boolean;
  /** Only meaningful when `hasHadFirstPeriod` is true — null otherwise, never fabricated. */
  lastPeriodDate: string | null;
  periodLength: number | null;
  cycleLength: number | null;
  /** Only meaningful when `hasHadFirstPeriod` is true — null otherwise, never
   * fabricated (never inferred from cycleLength/periodLength/age — see
   * ManagedProfileCycleSetupScreen.tsx). Same canonical 'yes'/'no'/'unknown'
   * representation onboardingPreferences.ts's own CyclePreferences.regularity
   * already uses everywhere else. */
  regularity: CycleRegularity | null;
  /** Local file URI of a camera/gallery photo (see privacy note above) — optional; a
   * missing value means "show the default fille.png illustration", never a remote URL. */
  profileImageUri: string | null;
  createdAt: string;
};

export type AddManagedProfileInput = {
  /** Optional idempotency key: submitting the same id twice creates ONE profile. */
  id?: string;
  type: ManagedProfileType;
  firstName: string;
  birthDate: string;
  hasHadFirstPeriod: boolean;
  lastPeriodDate?: string | null;
  periodLength?: number | null;
  cycleLength?: number | null;
  regularity?: CycleRegularity | null;
  profileImageUri?: string | null;
};

export const MANAGED_PROFILES_STORAGE_KEY = '@hawa/managed-profiles/v1';
export const MANAGED_PROFILE_FIRST_NAME_MAX_LENGTH = 40;

let profiles: ManagedProfile[] = [];
const listeners = new Set<() => void>();
let hydration: Promise<ManagedProfile[]> | null = null;
let hydrated = false;
let writeChain: Promise<void> = Promise.resolve();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// Same idiom as qadaaLedgerStore.ts's newId() — there is no uuid package in this
// project, and this one is RN-safe (no crypto.randomUUID() dependency).
let idCounter = 0;
const newId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const isIsoString = (value: unknown): value is string =>
  typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

const isCycleRegularity = (value: unknown): value is CycleRegularity =>
  value === 'yes' || value === 'no' || value === 'unknown';

const sanitizeProfile = (value: unknown): ManagedProfile | null => {
  if (!value || typeof value !== 'object') {return null;}
  const c = value as Partial<ManagedProfile>;
  if (typeof c.id !== 'string' || !c.id) {return null;}
  if (c.type !== 'daughter') {return null;}
  if (typeof c.firstName !== 'string' || !c.firstName.trim()) {return null;}
  if (typeof c.birthDate !== 'string' || !c.birthDate) {return null;}
  if (typeof c.hasHadFirstPeriod !== 'boolean') {return null;}
  if (!isIsoString(c.createdAt)) {return null;}
  return {
    id: c.id,
    type: 'daughter',
    firstName: c.firstName.trim().slice(0, MANAGED_PROFILE_FIRST_NAME_MAX_LENGTH),
    birthDate: c.birthDate,
    hasHadFirstPeriod: c.hasHadFirstPeriod,
    lastPeriodDate: c.hasHadFirstPeriod && typeof c.lastPeriodDate === 'string' ? c.lastPeriodDate : null,
    periodLength: c.hasHadFirstPeriod && typeof c.periodLength === 'number' ? c.periodLength : null,
    cycleLength: c.hasHadFirstPeriod && typeof c.cycleLength === 'number' ? c.cycleLength : null,
    regularity: c.hasHadFirstPeriod && isCycleRegularity(c.regularity) ? c.regularity : null,
    profileImageUri: typeof c.profileImageUri === 'string' && c.profileImageUri ? c.profileImageUri : null,
    createdAt: c.createdAt,
  };
};

// Invalid PROFILES are dropped individually so one damaged record can never hide
// the rest of the list; unparsable JSON yields an empty list.
const parseProfiles = (raw: string | null): ManagedProfile[] => {
  if (!raw) {return [];}
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {return [];}
    const seen = new Set<string>();
    return parsed
      .map(sanitizeProfile)
      .filter((item): item is ManagedProfile => {
        if (!item || seen.has(item.id)) {return false;}
        seen.add(item.id);
        return true;
      });
  } catch {
    return [];
  }
};

// Writes are serialized and each one carries the snapshot taken when it was
// requested, so the last write on disk is always the latest in-memory state.
const persist = (): Promise<void> => {
  const snapshot = JSON.stringify(profiles);
  writeChain = writeChain.catch(() => undefined).then(() => AsyncStorage.setItem(MANAGED_PROFILES_STORAGE_KEY, snapshot));
  return writeChain;
};

export const getManagedProfiles = (): ManagedProfile[] => profiles;

export const subscribeManagedProfiles = (listener: () => void) => {
  listeners.add(listener);
  return () => {listeners.delete(listener);};
};

/** A failed AsyncStorage read does not mark the store as hydrated (a later call
 * retries) and every mutation refuses to run until it is, so an unreadable
 * store can never be silently overwritten by an empty one. */
export const hydrateManagedProfiles = (): Promise<ManagedProfile[]> => {
  if (hydrated) {return Promise.resolve(profiles);}
  if (!hydration) {
    hydration = AsyncStorage.getItem(MANAGED_PROFILES_STORAGE_KEY)
      .then(raw => {
        profiles = parseProfiles(raw);
        hydrated = true;
        notifyListeners();
        return profiles;
      })
      .catch(() => {
        hydration = null;
        return profiles;
      });
  }
  return hydration;
};

const ensureWritable = async (): Promise<void> => {
  await hydrateManagedProfiles();
  if (!hydrated) {throw new Error('[managedProfilesStore] Managed profiles could not be read; refusing to write.');}
};

/** Adds one managed profile (persisted only on this final, explicit call — never
 * from the in-progress draft). Same `id` twice → the first one is returned
 * unchanged, so an accidental double-submit can never create two profiles. */
export const addManagedProfile = async (input: AddManagedProfileInput, now: Date = new Date()): Promise<ManagedProfile> => {
  const firstName = input.firstName.trim();
  if (!firstName) {throw new Error('[managedProfilesStore] A managed profile needs a first name.');}
  if (!input.birthDate) {throw new Error('[managedProfilesStore] A managed profile needs a birth date.');}
  await ensureWritable();
  const id = input.id ?? newId('daughter');
  const existing = profiles.find(profile => profile.id === id);
  if (existing) {return existing;}
  const profile: ManagedProfile = {
    id,
    type: input.type,
    firstName: firstName.slice(0, MANAGED_PROFILE_FIRST_NAME_MAX_LENGTH),
    birthDate: input.birthDate,
    hasHadFirstPeriod: input.hasHadFirstPeriod,
    lastPeriodDate: input.hasHadFirstPeriod ? input.lastPeriodDate ?? null : null,
    periodLength: input.hasHadFirstPeriod ? input.periodLength ?? null : null,
    cycleLength: input.hasHadFirstPeriod ? input.cycleLength ?? null : null,
    regularity: input.hasHadFirstPeriod ? input.regularity ?? null : null,
    // Optional in every case (Oui or Non) — a photo is never required to create a profile.
    profileImageUri: input.profileImageUri ?? null,
    createdAt: now.toISOString(),
  };
  profiles = [...profiles, profile];
  notifyListeners();
  await persist();
  return profile;
};

/**
 * Deletes ONE managed profile by its stable `id` (never by array index or
 * firstName — two daughters could share a first name). Returns false when no
 * profile with that id exists.
 *
 * Scope, deliberately narrow: this removes only the `ManagedProfile` record
 * itself. No profile-scoped cycle/journal/statistics data exists yet (that is a
 * later phase — see CLAUDE.md/TODO.md), so there is nothing else of hers to
 * clean up today; when that phase lands, its own per-profile stores should each
 * delete their own `id`-scoped records here too, rather than this function
 * growing untested knowledge of stores it doesn't own. The photo referenced by
 * `profileImageUri` (a raw camera/gallery URI, never copied into app-owned
 * storage — see the store's own header note) is NOT deleted: it is either the
 * OS's own camera-capture cache or the user's own gallery photo, and this
 * store must never delete a file it does not own.
 *
 * Never touches the mother's own account/cycle data, AWA à deux, or any other
 * store — and never wipes the whole local database, only this one record from
 * this store's own key (see persist() above).
 */
export const deleteManagedProfile = async (id: string): Promise<boolean> => {
  await ensureWritable();
  if (!profiles.some(profile => profile.id === id)) {return false;}
  profiles = profiles.filter(profile => profile.id !== id);
  notifyListeners();
  await persist();
  return true;
};

// No daughter-scoped cycle dashboard exists yet (a later phase — see
// ManagedProfileSuccessScreen.tsx). "Accéder au profil de {firstName}" cannot
// navigate anywhere real today, so instead it leaves this one-shot signal for
// ProfileScreen to pick up on its next focus and reopen "Gérer les profils" —
// a safe, honest placeholder instead of ever showing the mother's own data as
// if it were the daughter's.
let reopenManageProfilesSheetRequested = false;

export const requestReopenManageProfilesSheet = (): void => {
  reopenManageProfilesSheetRequested = true;
};

export const consumeReopenManageProfilesSheetRequest = (): boolean => {
  const requested = reopenManageProfilesSheetRequested;
  reopenManageProfilesSheetRequested = false;
  return requested;
};

/**
 * Updates an EXISTING profile's first-period/cycle-setup fields — used only
 * when the mother records her daughter's first period AFTER the profile
 * already exists (from CycleHomeScreen's/CalendarScreen's "Ses premières
 * règles ont commencé" action, via managedProfileCycleSeed.ts's own
 * recordManagedProfileFirstPeriod orchestrator). The profile-CREATION flow
 * (ManagedProfileFirstPeriodScreen.tsx/ManagedProfileCycleSetupScreen.tsx)
 * never calls this — it writes these same fields directly via
 * addManagedProfile() instead.
 *
 * id-scoped (never by array index or firstName — two daughters could share a
 * first name). No-op (returns null) if the profile no longer exists — e.g. it
 * was deleted from another device/session in between; the caller's own
 * cyclePreferences write still stands on its own, it just won't be mirrored
 * onto a record that isn't there anymore.
 *
 * `periodLength`/`cycleLength` accept `null` deliberately: recording a first-
 * ever period only tells us the DATE — her habitual durations are not asked
 * at that moment, so they must stay unknown here too (never the internal
 * 5/28-day computation placeholder — see onboardingPreferences.ts's
 * `hasConfirmedCycleDuration` field comment for the parallel rule on the
 * cyclePreferences side of this same write).
 */
export const recordManagedProfileFirstPeriod = async (
  id: string,
  update: {lastPeriodDate: string; periodLength: number | null; cycleLength: number | null; regularity: CycleRegularity},
): Promise<ManagedProfile | null> => {
  await ensureWritable();
  const index = profiles.findIndex(profile => profile.id === id);
  if (index === -1) {return null;}
  const updated: ManagedProfile = {
    ...profiles[index],
    hasHadFirstPeriod: true,
    lastPeriodDate: update.lastPeriodDate,
    periodLength: update.periodLength,
    cycleLength: update.cycleLength,
    regularity: update.regularity,
  };
  profiles = [...profiles.slice(0, index), updated, ...profiles.slice(index + 1)];
  notifyListeners();
  await persist();
  return updated;
};

/** Test-only reset — mirrors the reset helpers other AsyncStorage-backed stores in
 * this codebase expose for test isolation. */
export const resetManagedProfilesForTests = async (): Promise<void> => {
  profiles = [];
  hydrated = true;
  hydration = Promise.resolve(profiles);
  reopenManageProfilesSheetRequested = false;
  notifyListeners();
  try {
    await AsyncStorage.removeItem(MANAGED_PROFILES_STORAGE_KEY);
  } catch {
    // best-effort cleanup only
  }
};
