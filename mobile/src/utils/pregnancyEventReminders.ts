import {
  cancelLocalNotification,
  scheduleLocalNotificationWithResult,
  type CancelNotificationOptions,
} from '../services/pregnancyNotifications';
import type {PregnancyMedicalEvent, PregnancyReminderOffset} from '../state/pregnancyMedicalEventsStore';
import {
  hydratePregnancyNotificationSettings,
  type PregnancyNotificationSettings,
} from '../state/pregnancyNotificationSettingsStore';
import {PREGNANCY_REMINDER_NOTIFICATION_KIND} from './pregnancyReminderScheduling';
import {areReminderSourcesUnavailable} from './reminderSourceAvailability';
import {parseTimeOfDay} from './timeOfDay';
import i18n from '../i18n';

/** Events without an explicit time are anchored to 09:00 so day/hour-based offsets have something to count back from. */
const DEFAULT_EVENT_TIME = {hours: 9, minutes: 0};

// Keeps a PregnancyMedicalEvent's reminder fields and its real scheduled
// local notification in sync. Every appointment/exam create, update and
// delete must call syncEventReminder()/cancelEventReminder() — this is the
// only place that translates the event's reminderOffset into an actual fire
// date, so Dashboard/Calendar/Appointments can never disagree about when a
// reminder should fire.

export const OFFSET_MINUTES: Record<Exclude<PregnancyReminderOffset, 'custom'>, number> = {
  '30min': 30,
  '1hour': 60,
  '2hours': 120,
  '1day': 24 * 60,
};

// A factory (not a static object) — PregnancyEventForm.tsx/
// PregnancyNotificationsScreen.tsx (components) call this with their own `t`
// from useTranslation(); this file (not a component) calls it with the i18n
// singleton. Both read the exact same keys.
export function reminderOffsetLabels(t: (key: string) => string): Record<PregnancyReminderOffset, string> {
  return {
    '30min': t('notifications.pregnancy.reminderOffsetLabels.30min'),
    '1hour': t('notifications.pregnancy.reminderOffsetLabels.1hour'),
    '2hours': t('notifications.pregnancy.reminderOffsetLabels.2hours'),
    '1day': t('notifications.pregnancy.reminderOffsetLabels.1day'),
    custom: t('notifications.pregnancy.reminderOffsetLabels.custom'),
  };
}

export const REMINDER_OFFSETS: PregnancyReminderOffset[] = ['30min', '1hour', '2hours', '1day', 'custom'];

function notificationIdForEvent(eventId: string): string {
  return `pregnancy-event-${eventId}`;
}

/** Anchors the event to a concrete instant. Events without an explicit time
 * default to 09:00 so day/hour-based offsets still have something to count
 * back from. */
function eventDateTime(event: PregnancyMedicalEvent): Date {
  const [year, month, day] = event.date.split('-').map(Number);
  // parseTimeOfDay reads a legacy "24:30" as 00:30 of the SAME day (what was picked), never the day after.
  const time = parseTimeOfDay(event.time) ?? DEFAULT_EVENT_TIME;
  return new Date(year, month - 1, day, time.hours, time.minutes, 0, 0);
}

/** Pure — the exact instant a reminder would fire for this event, or null if no reminder is configured. */
export function computeEventReminderFireDate(event: PregnancyMedicalEvent): Date | null {
  if (!event.reminderEnabled || !event.reminderOffset) {return null;}

  if (event.reminderOffset === 'custom') {
    const [year, month, day] = event.date.split('-').map(Number);
    const time = parseTimeOfDay(event.reminderTime) ?? DEFAULT_EVENT_TIME;
    return new Date(year, month - 1, day, time.hours, time.minutes, 0, 0);
  }

  const fireDate = eventDateTime(event);
  fireDate.setMinutes(fireDate.getMinutes() - OFFSET_MINUTES[event.reminderOffset]);
  return fireDate;
}

/** Whether the global "Notifications & rappels" switch for this kind of event is on. */
export function isEventCategoryEnabled(
  event: Pick<PregnancyMedicalEvent, 'type'>,
  settings: Pick<PregnancyNotificationSettings, 'appointmentsEnabled' | 'examsEnabled'>,
): boolean {
  return event.type === 'exam' ? settings.examsEnabled : settings.appointmentsEnabled;
}

/** What a reminder request amounts to, before anything is handed to Android. */
export type EventReminderEvaluation =
  /** The event has no reminder (switch off, or no lead time chosen). */
  | {state: 'off'}
  /** A reminder is requested but its time cannot be computed (malformed date/time). */
  | {state: 'invalid'}
  /** A reminder is requested but the global switch for this kind of event is off. */
  | {state: 'category-disabled'; fireDate: Date}
  /** The reminder time is already in the past. */
  | {state: 'past'; fireDate: Date}
  /** The reminder can be scheduled for `fireDate`. */
  | {state: 'ready'; fireDate: Date};

/**
 * Pure. Used live by the appointment form (to show the real reminder time before
 * saving) and by syncEventReminder(), so what the screen says and what gets
 * scheduled can never disagree.
 */
export function evaluateEventReminder(
  event: PregnancyMedicalEvent,
  settings: Pick<PregnancyNotificationSettings, 'appointmentsEnabled' | 'examsEnabled'>,
  now: Date = new Date(),
): EventReminderEvaluation {
  if (!event.reminderEnabled || !event.reminderOffset) {return {state: 'off'};}
  const fireDate = computeEventReminderFireDate(event);
  if (!fireDate || Number.isNaN(fireDate.getTime())) {return {state: 'invalid'};}
  if (!isEventCategoryEnabled(event, settings)) {return {state: 'category-disabled', fireDate};}
  if (fireDate.getTime() <= now.getTime()) {return {state: 'past', fireDate};}
  return {state: 'ready', fireDate};
}

/**
 * Whether saving `next` changes what the reminder is ASKING for compared with
 * what was stored. Used so an old event whose reminder time has legitimately
 * passed can still have its notes edited without being told off about it.
 */
export function reminderRequestChanged(
  previous: PregnancyMedicalEvent | undefined,
  next: PregnancyMedicalEvent,
): boolean {
  if (!previous) {return true;}
  return (
    previous.date !== next.date ||
    !sameClockTime(previous.time, next.time) ||
    Boolean(previous.reminderEnabled) !== Boolean(next.reminderEnabled) ||
    (previous.reminderOffset ?? null) !== (next.reminderOffset ?? null) ||
    !sameClockTime(previous.reminderTime, next.reminderTime)
  );
}

/** The same time of day, however it is written: a legacy "24:30" (what an en-US build stored for 00:30) equals
 * "00:30". Values that are not a time of day are compared as they are. */
function sameClockTime(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = a ?? null;
  const right = b ?? null;
  if (left === right) {return true;}
  const parsedLeft = parseTimeOfDay(left);
  const parsedRight = parseTimeOfDay(right);
  return parsedLeft !== null && parsedRight !== null
    && parsedLeft.hours === parsedRight.hours
    && parsedLeft.minutes === parsedRight.minutes;
}

/** What syncEventReminder() actually did. Never thrown — always returned. */
export type EventReminderSyncOutcome =
  /** The reminder is scheduled for `fireDate`. */
  | {status: 'scheduled'; fireDate: Date}
  /** The event has no reminder; any pending one was cancelled. */
  | {status: 'not-requested'}
  /** Requested, but the global switch for this kind of event is off — nothing scheduled. */
  | {status: 'category-disabled'; fireDate: Date}
  /** Requested, but the reminder time has already passed — nothing scheduled. */
  | {status: 'past'; fireDate: Date}
  /** Requested, but Android notifications are off for the app — nothing scheduled. */
  | {status: 'permission-denied'; fireDate: Date}
  /** Requested, but the reminders channel is blocked in Android settings — nothing scheduled. */
  | {status: 'channel-blocked'; fireDate: Date}
  /** The notification settings cannot be read right now: whatever is scheduled was left as it is. */
  | {status: 'unavailable'}
  /** Requested, but Android refused or the computed time was invalid — nothing scheduled. */
  | {status: 'failed'; fireDate: Date | null; error?: unknown};

/** True when a reminder was asked for and is NOT going to be delivered. */
export function isEventReminderUndelivered(outcome: EventReminderSyncOutcome): boolean {
  return outcome.status !== 'scheduled' && outcome.status !== 'not-requested';
}

/** Schedules (or cancels, if the reminder is off/in the past/its category is
 * disabled in "Notifications & rappels") the real local notification for
 * this event, and reports what happened. Call after every save.
 *
 * `knownSettings` lets a caller that has just read the settings (the bulk
 * resync) avoid re-reading them once per event. Otherwise they are read here, so
 * the category switches are never judged from never-hydrated defaults. */
export async function syncEventReminder(
  event: PregnancyMedicalEvent,
  knownSettings?: PregnancyNotificationSettings,
): Promise<EventReminderSyncOutcome> {
  const id = notificationIdForEvent(event.id);
  const settings = knownSettings ?? (await hydratePregnancyNotificationSettings());
  // The category switches come from the notification settings: when that record cannot be read the defaults would
  // decide (reminders ON) — a reminder the user may have turned off. Leave the notification as it is.
  if (areReminderSourcesUnavailable({ownerBases: ['@hawa/pregnancy-notification-settings']})) {
    return {status: 'unavailable'};
  }

  const evaluation = evaluateEventReminder(event, settings);

  if (evaluation.state === 'off') {
    await cancelLocalNotification(id);
    return {status: 'not-requested'};
  }
  if (evaluation.state === 'invalid') {
    await cancelLocalNotification(id);
    return {status: 'failed', fireDate: null};
  }
  if (evaluation.state === 'category-disabled') {
    await cancelLocalNotification(id);
    return {status: 'category-disabled', fireDate: evaluation.fireDate};
  }

  const typeLabel = i18n.t(`notifications.pregnancy.eventTypeLabels.${event.type}`);
  const title = i18n.t('notifications.pregnancy.eventUpcomingTitle', {type: typeLabel});
  // event.title is the appointment/exam's own user-typed title — never translated.
  const body = event.time ? `${event.title} · ${event.time}` : event.title;

  // 'past' goes through the chokepoint too: it is what cancels the stale trigger of a reminder that was moved
  // into the past, and it answers with the same shape for every outcome.
  const result = await scheduleLocalNotificationWithResult({
    id,
    title,
    body,
    fireDate: evaluation.fireDate,
    data: {
      hawaNotificationKind: PREGNANCY_REMINDER_NOTIFICATION_KIND,
      pregnancyReminderType: 'event',
      inAppTitle: title,
      inAppMessage: body,
    },
  });

  if (result.scheduled) {
    return {status: 'scheduled', fireDate: result.fireDate};
  }
  switch (result.reason) {
    case 'past':
      return {status: 'past', fireDate: result.fireDate};
    case 'permission-denied':
      return {status: 'permission-denied', fireDate: result.fireDate};
    case 'channel-blocked':
      return {status: 'channel-blocked', fireDate: result.fireDate};
    default:
      return {status: 'failed', fireDate: result.fireDate, error: result.error};
  }
}

/** Cancels the notification tied to a deleted event. Call after every delete.
 * Pass `{dismissDisplayed: true}` for the user's own delete so a copy of the reminder that is
 * already in the notification shade goes too; a synchronisation never does. */
export async function cancelEventReminder(
  eventId: string,
  options: CancelNotificationOptions = {},
): Promise<void> {
  await cancelLocalNotification(notificationIdForEvent(eventId), options);
}
