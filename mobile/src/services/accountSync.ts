/**
 * Called once after an account has been created successfully (RegistrationScreen), so the data already on the phone can be attached to
 * the new account.
 *
 * TODO(backend): upload the local data (encrypted) to the new account and set `accountState.lastBackupAt`. There is no server yet, so
 * this does nothing: the data stays on the phone, nothing is sent, and no screen claims otherwise (see ONLINE_BACKUP_ENABLED).
 */
export async function syncLocalDataToAccount(): Promise<void> {
  // intentionally empty
}
