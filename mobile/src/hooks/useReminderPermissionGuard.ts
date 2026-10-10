import {useCallback, useState} from 'react';

import {ensureNotificationPermission, type ReminderDeliveryState} from '../services/pregnancyNotifications';
import {useReminderDeliveryState} from './useReminderDeliveryState';

/**
 * The permission half of a "reminders" screen's save button, shared by every objective's reminders step so they all
 * behave the way CycleRemindersScreen does: a save that switches a reminder on asks Android for notification
 * permission, and when that is refused the screen STAYS, explains why and says how to fix it.
 *
 *   const guard = useReminderPermissionGuard(anyReminderSwitchIsOn);
 *   ...
 *   // after the choices are persisted:
 *   if (!(await guard.allowSave(atLeastOneReminderIsEnabled))) {return;}
 *   goToNext();
 *   ...
 *   {anyReminderSwitchIsOn ? (
 *     <NotificationPermissionNotice
 *       onContinue={guard.saveBlocked ? goToNext : undefined}
 *       onRecheck={guard.refresh}
 *       state={guard.state}
 *     />
 *   ) : null}
 *
 * `reminderOn` is "at least one reminder switch is on right now": Android is only asked (without a dialog) while it
 * matters, so a person who already refused notifications sees the guidance BEFORE pressing save.
 */
export function useReminderPermissionGuard(reminderOn: boolean): {
  /** For <NotificationPermissionNotice state>. */
  state: ReminderDeliveryState;
  /** For <NotificationPermissionNotice onRecheck>: re-reads Android's answer. */
  refresh: () => Promise<ReminderDeliveryState>;
  /** True once a save was stopped because notifications are not allowed: offer "Continue without notifications". */
  saveBlocked: boolean;
  /**
   * Call AFTER the choices were persisted. Resolves true when the screen may carry on (no reminder is enabled, or
   * Android lets AWA notify) and false when it must stay on the screen because notifications are not allowed.
   * Asking for the permission only happens when `reminderEnabled` is true — never merely for opening the screen.
   */
  allowSave: (reminderEnabled: boolean) => Promise<boolean>;
} {
  const {state, refresh} = useReminderDeliveryState(reminderOn);
  const [saveBlocked, setSaveBlocked] = useState(false);

  const allowSave = useCallback(
    async (reminderEnabled: boolean): Promise<boolean> => {
      if (!reminderEnabled) {
        setSaveBlocked(false);
        return true;
      }
      const granted = await ensureNotificationPermission();
      setSaveBlocked(!granted);
      // The system dialog's answer is not seen by the foreground listener until later: re-read it now so the
      // notice names the real problem (notifications off vs reminders channel blocked) straight away.
      refresh().catch(() => {});
      return granted;
    },
    [refresh],
  );

  return {
    // After a blocked save the notice must stay visible even when Android's own answer could not be read back
    // ('unknown'): the request itself said no, and "Continue without notifications" lives inside the notice, so
    // hiding it would leave her on the screen with no explanation and no way on.
    state: saveBlocked && state === 'unknown' ? 'notifications-off' : state,
    refresh,
    saveBlocked,
    allowSave,
  };
}
