// Whether the BULK resync of every objective's reminders (services/reminderResync.ts) may run right now.
//
// "Delete account" empties storage, but every store keeps its previous copy in memory for the life of the JS process.
// A bulk resync — a language or privacy change, notifications switched on in Android settings, a time-zone change or
// the periodic foreground refresh — re-derives every reminder from those copies, so one that ran before the app was
// restarted would bring back reminders built from data that no longer exists.
//
// After a full account wipe the bulk resync is therefore suspended. It never needs to run for the deleted account
// (nothing is scheduled), and it is lifted as soon as the person chooses an objective again — the first thing a new
// account does — from which point the stores hold the NEW account's data. The per-objective syncs are not affected:
// they run from their own store subscriptions and read what was just written.
//
// A separate, dependency-free module on purpose: the screen that wipes the account must be able to suspend the resync
// without importing every objective's scheduler.
let suspended = false;

export const suspendBulkReminderResync = (): void => {
  suspended = true;
};

export const resumeBulkReminderResync = (): void => {
  suspended = false;
};

export const isBulkReminderResyncSuspended = (): boolean => suspended;
