import AsyncStorage from '@react-native-async-storage/async-storage';

// Ids of managed profiles the user explicitly DELETED. A deleted profile must not come back by accident:
// restoring an older backup rewrites every stored key (the profile list and each profile-scoped key
// included), which would silently resurrect a profile — and the tracking data — that was deleted after the
// backup was taken. backupService.restoreBackup() consults this list and skips them.
//
// Written BEFORE a deletion starts destroying anything (see services/managedProfileDeletion.ts), so it
// records the user's deletion INTENT: an id still in the profile list is a deletion to finish, an id no
// longer in it is a completed one. It carries no health data, just opaque profile ids. Global (not profile-scoped) on purpose.

export const DELETED_MANAGED_PROFILES_STORAGE_KEY = '@hawa/deleted-managed-profile-ids/v1';

/** Tolerant parser — a damaged value is an empty list, never an exception. */
export const parseDeletedManagedProfileIds = (raw: string | null | undefined): string[] => {
  if (!raw) {return [];}
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
  } catch {
    return [];
  }
};

let writeChain: Promise<void> = Promise.resolve();

export const getDeletedManagedProfileIds = async (): Promise<string[]> =>
  parseDeletedManagedProfileIds(await AsyncStorage.getItem(DELETED_MANAGED_PROFILES_STORAGE_KEY));

/** Serialized read-modify-write: two deletions can never lose each other's id. Idempotent. */
export const markManagedProfileDeleted = (profileId: string): Promise<void> => {
  const run = writeChain.catch(() => undefined).then(async () => {
    const current = await getDeletedManagedProfileIds();
    if (current.includes(profileId)) {return;}
    await AsyncStorage.setItem(DELETED_MANAGED_PROFILES_STORAGE_KEY, JSON.stringify([...current, profileId]));
  });
  writeChain = run;
  return run;
};
