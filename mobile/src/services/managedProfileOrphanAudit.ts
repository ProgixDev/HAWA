import AsyncStorage from '@react-native-async-storage/async-storage';

import {OWNER_PROFILE_ID} from '../state/activeProfileStore';
import {MANAGED_PROFILES_STORAGE_KEY, getManagedProfiles} from '../state/managedProfilesStore';
import {getDeletedManagedProfileIds} from '../state/deletedManagedProfiles';
import {isAwaStorageKey, splitProfileKey} from './storageKeyClassifier';

// READ-ONLY audit of profile-scoped data that no longer has a profile: every record stored for a managed
// profile id that is not in the managed-profile list (a profile deleted before deletion cleaned up after
// itself, or whose cleanup was interrupted). It NEVER writes, removes or "fixes" anything — it only reports
// what it can prove and, just as importantly, what it cannot:
//   - an id is only ever taken from a `:profile:<id>` key suffix, a record's own `profileId`, or the list of
//     deleted ids — never guessed, never inferred from a key prefix;
//   - an orphan is "safe to remove" only when the app itself recorded that the profile was deleted (it is in
//     the deleted-ids list). An id with data but neither a profile record nor a deletion record is reported as
//     AMBIGUOUS (the list could simply be unreadable or damaged) and is left for an explicit decision.

const IN_APP_NOTIFICATION_PREFIX = '@hawa/in-app-notifications/v2/item/';

/** What each profile-scoped storage base holds, in words — never shown to a user, only to whoever reads the report. */
export const PROFILE_KEY_CATEGORIES: readonly {base: string; category: string}[] = [
  {base: '@hawa/cycle-preferences', category: 'cycle settings and recorded periods'},
  {base: '@hawa/period-end-datetime', category: 'confirmed period end'},
  {base: '@hawa/confirmed-period-history', category: 'confirmed period history'},
  {base: '@hawa/cycle-reminder-preferences', category: 'cycle reminder preferences'},
  {base: '@hawa/daily-journal', category: 'daily journal (symptoms, mood, flow, temperature, weight…)'},
  {base: 'awa:qadaa:ledger', category: 'Qadaa ledger'},
  {base: '@hawa/remaining-qadaa-days', category: 'Qadaa counters'},
  {base: '@awa/backup', category: "the profile's own backup copy"},
];

const categoryOf = (base: string): string =>
  PROFILE_KEY_CATEGORIES.find(entry => base.startsWith(entry.base))?.category ?? 'unrecognized profile-scoped data';

export type OrphanedProfileReport = {
  profileId: string;
  /** The app recorded the user's intent to delete this profile. */
  deletionRecorded: boolean;
  keyCount: number;
  keys: string[];
  categories: string[];
  inAppNotificationCount: number;
  /** True only when the deletion was recorded AND nothing about the data is unrecognized. */
  safeToRemove: boolean;
  ambiguity: string | null;
};

export type OrphanAuditReport = {
  /** False when the profile list could not be read: nothing can then be called an orphan. */
  complete: boolean;
  checkedKeyCount: number;
  orphans: OrphanedProfileReport[];
  /** Why the audit is incomplete, if it is. */
  limitation: string | null;
};

export async function auditManagedProfileOrphans(): Promise<OrphanAuditReport> {
  // The list is read DIRECTLY: hydrateManagedProfiles() swallows a failed read and answers with an empty
  // list, which here would turn every live profile's data into a false "orphan".
  let knownIds: Set<string>;
  try {
    const raw = await AsyncStorage.getItem(MANAGED_PROFILES_STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(stored)) {
      throw new Error('unexpected shape');
    }
    knownIds = new Set([
      ...stored.map(item => (item && typeof item === 'object' ? String((item as {id?: unknown}).id ?? '') : '')),
      ...getManagedProfiles().map(profile => profile.id),
    ]);
  } catch {
    return {complete: false, checkedKeyCount: 0, orphans: [], limitation: 'The managed profile list could not be read.'};
  }
  knownIds.add(OWNER_PROFILE_ID);
  const deletedIds = new Set(await getDeletedManagedProfileIds().catch(() => [] as string[]));

  const allKeys = await AsyncStorage.getAllKeys();
  const byProfile = new Map<string, {keys: string[]; categories: Set<string>; notifications: number}>();
  const entryFor = (profileId: string) => {
    let entry = byProfile.get(profileId);
    if (!entry) {
      entry = {keys: [], categories: new Set<string>(), notifications: 0};
      byProfile.set(profileId, entry);
    }
    return entry;
  };

  for (const key of allKeys) {
    if (!isAwaStorageKey(key)) {continue;}
    const {baseKey, profileId} = splitProfileKey(key);
    if (profileId) {
      if (!knownIds.has(profileId)) {
        const entry = entryFor(profileId);
        entry.keys.push(key);
        entry.categories.add(categoryOf(baseKey));
      }
      continue;
    }
    if (key.startsWith(IN_APP_NOTIFICATION_PREFIX)) {
      try {
        const notificationProfileId = (JSON.parse((await AsyncStorage.getItem(key)) ?? 'null') as {profileId?: string} | null)?.profileId;
        if (notificationProfileId && !knownIds.has(notificationProfileId)) {
          entryFor(notificationProfileId).notifications += 1;
        }
      } catch {
        // an unreadable notification is simply not attributed to anyone
      }
    }
  }

  const orphans: OrphanedProfileReport[] = [...byProfile.entries()].map(([profileId, entry]) => {
    const deletionRecorded = deletedIds.has(profileId);
    const unrecognized = entry.categories.has('unrecognized profile-scoped data');
    let ambiguity: string | null = null;
    if (!deletionRecorded) {
      ambiguity = 'No deletion record: the profile may have been deleted before deletions were recorded, or its record may be missing or damaged.';
    } else if (unrecognized) {
      ambiguity = 'Some keys are not of a known kind.';
    }
    return {
      profileId,
      deletionRecorded,
      keyCount: entry.keys.length,
      keys: entry.keys.sort(),
      categories: [...entry.categories].sort(),
      inAppNotificationCount: entry.notifications,
      safeToRemove: deletionRecorded && !unrecognized,
      ambiguity,
    };
  });

  return {complete: true, checkedKeyCount: allKeys.length, orphans: orphans.sort((a, b) => a.profileId.localeCompare(b.profileId)), limitation: null};
}
