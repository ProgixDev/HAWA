// One place that knows every OWNER-ONLY store: the stores that memoise their first read of a record that is NOT
// profile-scoped (objective, pregnancy / postpartum / loss / conception / contraception / SOPK / menopause preferences,
// the notification settings, the Nifas and Qadaa reminder snapshots, the spiritual-markers choice ...).
//
// Profile-scoped stores re-read through `reloadActiveProfileData()` (activeProfileStore.ts). The owner-only ones have no
// such signal, so after a flow that rewrites or deletes the stored records behind their back they kept serving — and a
// later edit wrote back — data that no longer existed, and a later resync derived reminders from that stale memory.
//
// Each store registers itself at module load (a store that was never imported has nothing in memory to be stale: its
// first hydrate reads the real storage). Two operations, for two situations:
//
//   reloadAllOwnerStores()        — storage CHANGED and holds the truth (backup restore, "delete tracked data"): every
//                                   registered store drops its memory and re-reads its record. Never writes a default.
//                                   A read that fails as "unavailable" is not latched as empty (the store's own hydrate
//                                   keeps the key write-protected and retryable), and subscribers are notified.
//   resetAllOwnerStoresToDefaults() — storage was WIPED ("Delete account"): every store goes back to its defaults in
//                                   memory with NO read and NO write (a read can persist derived keys, and the storage
//                                   must stay empty). A later hydrate reads the (empty or new) storage normally.
//
// Dependency-free on purpose: stores import this module, so it must import none of them.

export type OwnerStoreReloader = {
  /** Drops the in-memory copy (defaults), invalidates any read in flight, re-reads storage, notifies subscribers. */
  reload: () => Promise<unknown>;
  /** Defaults in memory only: no storage read, no storage write. Notifies subscribers. */
  resetToDefaults: () => void;
};

const registry = new Map<string, OwnerStoreReloader>();

/** Registers (or replaces — hot reload, tests re-importing a module) a store under a unique name. */
export const registerOwnerStore = (name: string, reloader: OwnerStoreReloader): void => {
  registry.set(name, reloader);
};

/** Storage changed and holds the truth: every registered owner store re-reads it. Never throws. */
export const reloadAllOwnerStores = async (): Promise<void> => {
  await Promise.allSettled([...registry.values()].map(entry => entry.reload()));
};

/** Storage was wiped: every registered owner store goes back to its defaults, in memory only. Never throws. */
export const resetAllOwnerStoresToDefaults = (): void => {
  registry.forEach(entry => {
    try {
      entry.resetToDefaults();
    } catch {
      // one store's listener failing must not stop the others from being reset
    }
  });
};

/** Test-only: the registered store names. */
export const __registeredOwnerStoresForTests = (): string[] => [...registry.keys()].sort();
