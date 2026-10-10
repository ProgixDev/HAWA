import {isActiveProfileDataUnavailable, isStructuredKeyUnavailable} from '../services/secureAsyncStorage';

// One shared answer to "may this reminder scheduler trust what its stores returned?".
//
// A store whose encrypted record could not be READ (corrupted ciphertext, lost key, locked Keystore) falls back to its
// default state — and defaults are not data: a default "reminders on/off", an empty history, the default objective
// ('cycle'), an unset delivery date. A scheduler that derives from them would schedule a reminder the user never
// chose, or — just as wrong — cancel one she did. So every objective scheduler asks this first and, when a source is
// unreadable, leaves whatever is already scheduled EXACTLY as it is; a later sync (after the data is readable again)
// reconciles. See the same rule in cycleReminderScheduling.ts and docs/security/phase9-design.md §6.

/** The record that says WHICH objective is active — every objective's scheduler is gated on it. Owner-wide key. */
export const ACTIVE_OBJECTIVE_BASE = '@hawa/active-objective';

export type ReminderSources = {
  /** Storage keys that are NOT profile-scoped (the objective stores: pregnancy, postpartum, loss, contraception, …). */
  ownerBases?: readonly string[];
  /** Storage keys scoped to the active profile (cycle settings, confirmed periods, the daily journal, Qadaa). */
  profileBases?: readonly string[];
  /** The active objective gates the scheduler too. Only a managed profile's Cycle reminders do not depend on it. */
  includeObjective?: boolean;
};

export function areReminderSourcesUnavailable({ownerBases = [], profileBases = [], includeObjective = true}: ReminderSources): boolean {
  if (includeObjective && isStructuredKeyUnavailable(ACTIVE_OBJECTIVE_BASE)) {return true;}
  if (ownerBases.some(base => isStructuredKeyUnavailable(base))) {return true;}
  return profileBases.length > 0 && isActiveProfileDataUnavailable(profileBases);
}
