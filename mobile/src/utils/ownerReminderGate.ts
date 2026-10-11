import {isOwnerActive, subscribeActiveProfileId} from '../state/activeProfileStore';

// Some reminders carry OWNER-GLOBAL notification ids (one "TTC fertile window", one "SOPK unrecorded period", one
// post-Ramadan "Qadaa" reminder) yet are derived from PROFILE-scoped records (the cycle, the confirmed periods, the
// daily journal, the Qadaa ledger). Those records always belong to whichever profile is ACTIVE, so a sync that ran
// while a managed (daughter) profile was active used to cancel the owner's reminders (the daughter owes nothing / has
// no confirmed cycle) or re-schedule them from the daughter's data.
//
// The rule these three schedulers apply (see each file): while a managed profile is active they neither schedule,
// cancel nor change anything; once the owner is active again they wait for HER records to have been read before
// deriving anything, so a resync triggered by the switch can never be built from the neutral placeholder a store
// holds between a switch and the end of its read.

// Bumped on EVERY active-profile announcement: a switch, a switch away and straight back (A -> B -> A, which an "is
// it still the same id?" comparison cannot see) and reloadActiveProfileData() (a restore replaced the records).
let profileRevision = 0;
subscribeActiveProfileId(() => {
  profileRevision += 1;
});

export type OwnerProfileData<T> = {
  /** What `load` resolved with. */
  value: T;
  /**
   * Still true — in the tick it is called — only while the owner has remained the active profile since the load
   * began. `await` resumes the caller in a LATER microtask than the one that decided, and a profile switch can run in
   * between: the caller must call this once, right after the await, and read the stores in that same tick.
   */
  isCurrent: () => boolean;
};

/**
 * Runs `load` — the awaited reads of the OWNER's profile-scoped records — until it completes with no profile switch in
 * between. Resolves:
 *   {value, isCurrent}  the owner is active and every record `load` read belongs to her. The caller checks
 *                       `isCurrent()` immediately after its await, then reads the stores SYNCHRONOUSLY (before any
 *                       further await) and derives from them;
 *   null                a managed profile is (or became) active: the caller must change nothing at all.
 *
 * `load` must be the stores' own hydrate functions, which re-read a profile's records when the active profile is not
 * the one they last read; it is simply run again after a switch.
 */
export async function loadOwnerProfileData<T>(load: () => Promise<T>): Promise<OwnerProfileData<T> | null> {
  for (;;) {
    if (!isOwnerActive()) {return null;}
    const revision = profileRevision;
    const value = await load();
    if (revision === profileRevision && isOwnerActive()) {
      return {value, isCurrent: () => revision === profileRevision && isOwnerActive()};
    }
  }
}
