import {OWNER_PROFILE_ID} from './activeProfileStore';

// One tiny, shared helper used by every profile-scoped health store
// (confirmedPeriodHistoryStore.ts, dailyJournalStore.ts, the cyclePreferences/
// periodEndDateTime keys inside onboardingPreferences.ts, generalHealthStore.ts,
// qadaaStore.ts, qadaaLedgerStore.ts) so they all use the SAME scoping strategy
// instead of each inventing its own (per this feature's own "don't create a
// different scoping strategy for every store" requirement).
//
// The OWNER's key is left BYTE-IDENTICAL to that store's original, pre-multi-profile
// key — her existing data is found under it exactly as before, with zero migration
// step and zero risk of data loss/duplication (CLAUDE.md, "backward compatibility").
// Only a managed (daughter) profile's data lives under a distinctly suffixed key.
export const profileScopedKey = (baseKey: string, profileId: string): string =>
  profileId === OWNER_PROFILE_ID ? baseKey : `${baseKey}:profile:${profileId}`;

// The suffix alone, for callers that need to recognize ANY key belonging to
// one managed profile without knowing its base key in advance (e.g.
// backupService.ts's daughter-scoped export/delete/restore, which must
// filter across every profile-scoped store at once). Never meaningful for
// OWNER_PROFILE_ID — her keys are bare/unsuffixed and indistinguishable by
// shape alone from account-level global keys, which is exactly why a
// profile-scoped backup/delete only ever exists for a managed profile.
export const profileKeySuffix = (profileId: string): string => `:profile:${profileId}`;
