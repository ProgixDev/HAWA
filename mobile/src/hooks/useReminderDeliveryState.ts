import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState} from 'react-native';

import {getReminderDeliveryState, type ReminderDeliveryState} from '../services/pregnancyNotifications';

/**
 * Live, non-prompting view of whether a reminder could be delivered right now
 * (Android notifications on? reminders channel blocked?).
 *
 * Re-read on mount and every time the app returns to the foreground — which is
 * exactly what happens when she comes back from Android's settings after turning
 * notifications on — so a notice that said "off" clears itself without a restart.
 * The answer is never remembered across reads.
 *
 * `active` lets a screen read it only while it matters (a reminder switch is on).
 */
export function useReminderDeliveryState(active = true): {
  state: ReminderDeliveryState;
  /** True only for a state the person has to fix in Android's settings. */
  blocked: boolean;
  refresh: () => Promise<ReminderDeliveryState>;
} {
  const [state, setState] = useState<ReminderDeliveryState>('unknown');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async (): Promise<ReminderDeliveryState> => {
    const next = await getReminderDeliveryState();
    if (mounted.current) {
      setState(next);
    }
    return next;
  }, []);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    refresh().catch(() => {});
    const subscription = AppState.addEventListener('change', appState => {
      if (appState === 'active') {
        refresh().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [active, refresh]);

  return {state, blocked: state === 'notifications-off' || state === 'channel-blocked', refresh};
}
