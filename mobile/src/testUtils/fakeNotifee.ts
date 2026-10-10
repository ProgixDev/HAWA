// A STATEFUL in-memory stand-in for @notifee/react-native.
//
// The package's own jest-mock only RECORDS calls, so a suite using it cannot tell "a reminder is scheduled" from
// "a reminder is on screen", nor notice that a call removed one while meaning the other. This fake keeps the two
// sets apart exactly the way Android does:
//
//   triggers  — what AlarmManager will fire later            (createTriggerNotification / cancelTriggerNotification)
//   displayed — what is in the notification shade right now  (deliverTrigger / cancelDisplayedNotification)
//
// and copies the two behaviours the app's bugs depended on:
//   - notifee.cancelNotification(id) removes BOTH (documented: "removes any displayed notifications or ones with
//     triggers set for the specified ID");
//   - createTriggerNotification throws for a timestamp that is not in the future (notifee's JS validator).
//
// Usage (jest.mock factories may only reference `mock*` variables, so require inside the factory):
//   jest.mock('@notifee/react-native', () => require('../../testUtils/fakeNotifee').notifeeModule);
//   import {fakeNotifeeState, resetFakeNotifee, deliverTrigger} from '../../testUtils/fakeNotifee';
//
// IT PROVES JS BEHAVIOUR ONLY. A passing test here is not evidence that Android delivered anything (see
// docs / the audit): Doze, OEM task killers, channel settings and real AlarmManager timing are not modelled.

const notificationTypes = require('@notifee/react-native/dist/types/Notification');
const androidTypes = require('@notifee/react-native/dist/types/NotificationAndroid');
const triggerTypes = require('@notifee/react-native/dist/types/Trigger');

type TriggerRecord = {notification: any; trigger: any};
type NotifeeEvent = {type: number; detail: any};

export const fakeNotifeeState = {
  /** What Android reports for the app: AuthorizationStatus.AUTHORIZED = 1, DENIED = 0, NOT_DETERMINED = -1. */
  authorizationStatus: 1 as number,
  triggers: new Map<string, TriggerRecord>(),
  displayed: new Map<string, any>(),
  channels: new Map<string, any>(),
  blockedChannels: new Set<string>(),
  /** Registered with notifee.onBackgroundEvent (what index.js does). */
  backgroundHandler: null as null | ((event: NotifeeEvent) => Promise<void> | void),
  foregroundHandler: null as null | ((event: NotifeeEvent) => void),
  /** One-shot failures to inject. */
  createChannelError: null as Error | null,
  createTriggerError: null as Error | null,
  /** Runs inside requestPermission(), e.g. to let time pass while the system dialog is open. */
  onRequestPermission: null as null | (() => void),
};

const state = fakeNotifeeState;

const takeError = (key: 'createChannelError' | 'createTriggerError'): Error | null => {
  const error = state[key];
  state[key] = null;
  return error;
};

const settings = () => ({
  authorizationStatus: state.authorizationStatus,
  android: {alarm: androidTypes.AndroidNotificationSetting?.ENABLED ?? 1},
  ios: {},
  web: {},
});

export const notifee = {
  // --- channels ---------------------------------------------------------------------------------------------
  createChannel: jest.fn(async (channel: any) => {
    const error = takeError('createChannelError');
    if (error) {throw error;}
    state.channels.set(channel.id, channel);
    return channel.id as string;
  }),
  isChannelBlocked: jest.fn(async (channelId: string) => state.blockedChannels.has(channelId)),
  getChannel: jest.fn(async (channelId: string) => state.channels.get(channelId) ?? null),

  // --- permission -------------------------------------------------------------------------------------------
  getNotificationSettings: jest.fn(async () => settings()),
  requestPermission: jest.fn(async () => {
    state.onRequestPermission?.();
    return settings();
  }),
  openNotificationSettings: jest.fn(async () => undefined),

  // --- scheduling -------------------------------------------------------------------------------------------
  createTriggerNotification: jest.fn(async (notification: any, trigger: any) => {
    const error = takeError('createTriggerError');
    if (error) {throw error;}
    if (typeof trigger?.timestamp !== 'number') {
      throw new Error("notifee.createTriggerNotification(*) 'trigger.timestamp' expected a number value.");
    }
    if (trigger.timestamp <= Date.now()) {
      throw new Error("notifee.createTriggerNotification(*) 'trigger.timestamp' date must be in the future.");
    }
    state.triggers.set(notification.id, {notification, trigger});
    return notification.id as string;
  }),
  cancelTriggerNotification: jest.fn(async (id: string) => {
    state.triggers.delete(id);
  }),
  cancelDisplayedNotification: jest.fn(async (id: string) => {
    state.displayed.delete(id);
  }),
  /** Documented notifee semantics: BOTH the pending trigger and the displayed notification. */
  cancelNotification: jest.fn(async (id: string) => {
    state.triggers.delete(id);
    state.displayed.delete(id);
  }),
  getTriggerNotificationIds: jest.fn(async () => Array.from(state.triggers.keys())),
  getTriggerNotifications: jest.fn(async () =>
    Array.from(state.triggers.values()).map(record => ({notification: record.notification, trigger: record.trigger})),
  ),
  getDisplayedNotifications: jest.fn(async () =>
    Array.from(state.displayed.entries()).map(([id, notification]) => ({id, date: Date.now(), notification})),
  ),
  displayNotification: jest.fn(async (notification: any) => {
    state.displayed.set(notification.id, notification);
    return notification.id as string;
  }),

  // --- events (index.js registers the background handler) ---------------------------------------------------
  onBackgroundEvent: jest.fn((handler: (event: NotifeeEvent) => Promise<void> | void) => {
    state.backgroundHandler = handler;
  }),
  onForegroundEvent: jest.fn((handler: (event: NotifeeEvent) => void) => {
    state.foregroundHandler = handler;
    return () => {
      state.foregroundHandler = null;
    };
  }),
  getInitialNotification: jest.fn(async () => null),
  setBadgeCount: jest.fn(async () => undefined),
};

// Anything the app calls that this fake does not model (badge counts, categories, foreground services...) answers
// with an async no-op instead of "undefined is not a function", so booting the real App module under the fake is
// possible. Modelled methods above are untouched, and a test can still assert on them.
const notifeeWithFallback: typeof notifee = new Proxy(notifee, {
  get(target, property, receiver) {
    if (property in target || typeof property === 'symbol' || property === 'then') {
      return Reflect.get(target, property, receiver);
    }
    return jest.fn(async () => undefined);
  },
});

export const notifeeModule = {
  __esModule: true,
  default: notifeeWithFallback,
  ...notificationTypes,
  ...androidTypes,
  ...triggerTypes,
};

const REPEAT_STEP_MS: Record<number, number> = {0: 3_600_000, 1: 86_400_000, 2: 604_800_000};

/**
 * Simulates AlarmManager firing a scheduled trigger and notifee showing it: the notification moves from
 * `triggers` to `displayed` (a repeating trigger is re-armed for its next occurrence, as notifee does).
 * Returns the delivered notification.
 */
export function deliverTrigger(id: string, nowMs: number = Date.now()): any {
  const record = state.triggers.get(id);
  if (!record) {
    throw new Error(`fakeNotifee: no scheduled trigger "${id}" to deliver`);
  }
  state.displayed.set(id, record.notification);
  const step = REPEAT_STEP_MS[record.trigger.repeatFrequency as number];
  if (step) {
    let next = record.trigger.timestamp as number;
    while (next <= nowMs) {next += step;}
    state.triggers.set(id, {notification: record.notification, trigger: {...record.trigger, timestamp: next}});
  } else {
    state.triggers.delete(id);
  }
  return record.notification;
}

/** Sends an event to the handler index.js registered with notifee.onBackgroundEvent (a headless task). */
export async function emitBackgroundEvent(type: number, notification: any): Promise<void> {
  await state.backgroundHandler?.({type, detail: {notification}});
}

export const scheduledIds = (): string[] => Array.from(state.triggers.keys()).sort();
export const displayedIds = (): string[] => Array.from(state.displayed.keys()).sort();

export function resetFakeNotifee(): void {
  state.authorizationStatus = 1;
  state.triggers.clear();
  state.displayed.clear();
  state.channels.clear();
  state.blockedChannels.clear();
  state.backgroundHandler = null;
  state.foregroundHandler = null;
  state.createChannelError = null;
  state.createTriggerError = null;
  state.onRequestPermission = null;
  Object.values(notifee).forEach(fn => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      (fn as jest.Mock).mockClear();
    }
  });
}
