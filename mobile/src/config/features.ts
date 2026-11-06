/**
 * Feature flags.
 *
 * ONLINE_BACKUP_ENABLED — the optional AWA account with an online, end-to-end encrypted backup. There is no server yet: while this is
 * `false` the "Sauvegarde tes données" reminder on the home screen is never shown, and the "Mes données" screen never shows its signed-in
 * state (nor any text about an online backup, an account backup date, or encryption), even if `accountState.isSignedIn` were `true`.
 * Turn it on only when the backend exists.
 */
export const ONLINE_BACKUP_ENABLED = false;
