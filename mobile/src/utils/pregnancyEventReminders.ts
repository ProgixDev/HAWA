import {cancelLocalNotification, scheduleLocalNotification} from '../services/pregnancyNotifications';
import type {PregnancyMedicalEvent, PregnancyReminderOffset} from '../state/pregnancyMedicalEventsStore';
import {getPregnancyNotificationSettings} from '../state/pregnancyNotificationSettingsStore';
import {PREGNANCY_REMINDER_NOTIFICATION_KIND} from './pregnancyReminderScheduling';
import i18n from '../i18n';

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
  const [hours, minutes] = (event.time ?? '09:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
}

/** Pure — the exact instant a reminder would fire for this event, or null if no reminder is configured. */
export function computeEventReminderFireDate(event: PregnancyMedicalEvent): Date | null {
  if (!event.reminderEnabled || !event.reminderOffset) {return null;}

  if (event.reminderOffset === 'custom') {
    const [year, month, day] = event.date.split('-').map(Number);
    const [hours, minutes] = (event.reminderTime ?? '09:00').split(':').map(Number);
    return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
  }

  const fireDate = eventDateTime(event);
  fireDate.setMinutes(fireDate.getMinutes() - OFFSET_MINUTES[event.reminderOffset]);
  return fireDate;
}

/** Schedules (or cancels, if the reminder is off/in the past/its category is
 * disabled in "Notifications & rappels") the real local notification for
 * this event. Call after every save. */
export async function syncEventReminder(event: PregnancyMedicalEvent): Promise<void> {
  const id = notificationIdForEvent(event.id);
  const settings = getPregnancyNotificationSettings();
  const categoryEnabled = event.type === 'exam' ? settings.examsEnabled : settings.appointmentsEnabled;
  const fireDate = categoryEnabled ? computeEventReminderFireDate(event) : null;

  if (!fireDate) {
    await cancelLocalNotification(id);
    return;
  }

  const typeLabel = i18n.t(`notifications.pregnancy.eventTypeLabels.${event.type}`);
  const title = i18n.t('notifications.pregnancy.eventUpcomingTitle', {type: typeLabel});
  // event.title is the appointment/exam's own user-typed title — never translated.
  const body = event.time ? `${event.title} · ${event.time}` : event.title;

  await scheduleLocalNotification({
    id,
    title,
    body,
    fireDate,
    data: {
      hawaNotificationKind: PREGNANCY_REMINDER_NOTIFICATION_KIND,
      pregnancyReminderType: 'event',
      inAppTitle: title,
      inAppMessage: body,
    },
  });
}

/** Cancels the notification tied to a deleted event. Call after every delete. */
export async function cancelEventReminder(eventId: string): Promise<void> {
  await cancelLocalNotification(notificationIdForEvent(eventId));
}
