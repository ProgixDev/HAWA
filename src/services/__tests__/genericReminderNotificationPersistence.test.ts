import {
  isGenericReminderNotification,
  getGenericReminderOccurrenceId,
  persistGenericReminderNotification,
} from '../genericReminderNotificationPersistence';
import {MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND} from '../../utils/miscarriageReminderScheduling';
import {addInAppNotification, markInAppNotificationAsRead} from '../../state/inAppNotificationStore';

// pregnancyNotifications.ts imports the real Notifee native module at the
// top level, which isn't available in the Jest environment — every one of
// the 7 scheduler modules genericReminderNotificationPersistence.ts imports
// (for their *_NOTIFICATION_KIND constants only) themselves import
// pregnancyNotifications.ts, so it must be replaced outright here too, same
// pattern as e.g. postpartumReminderScheduling.test.ts.
jest.mock('../pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
  ensureNotificationPermission: jest.fn(),
}));
jest.mock('../../state/inAppNotificationStore', () => ({
  addInAppNotification: jest.fn(),
  markInAppNotificationAsRead: jest.fn(),
}));

const mockAddInAppNotification = addInAppNotification as jest.Mock;
const mockMarkInAppNotificationAsRead = markInAppNotificationAsRead as jest.Mock;

function miscarriageNotification(overrides: Partial<{id: string}> = {}) {
  return {
    id: overrides.id ?? 'miscarriage-daily-tracking-reminder',
    data: {
      hawaNotificationKind: MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
      inAppTitle: 'Ton suivi du jour 🌿',
      inAppMessage: 'Si tu le souhaites, prends un moment pour noter comment tu te sens aujourd’hui.',
    },
  } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAddInAppNotification.mockResolvedValue(undefined);
  mockMarkInAppNotificationAsRead.mockResolvedValue(undefined);
});

describe('genericReminderNotificationPersistence — Miscarriage kind', () => {
  it('recognizes the Miscarriage daily-tracking kind', () => {
    expect(isGenericReminderNotification(miscarriageNotification())).toBe(true);
  });

  it('does not recognize an unrelated/unknown kind', () => {
    expect(
      isGenericReminderNotification({id: 'x', data: {hawaNotificationKind: 'something-else'}} as never),
    ).toBe(false);
  });

  it('persists a DELIVERED Miscarriage notification into the in-app store with correct tagging', async () => {
    await persistGenericReminderNotification(miscarriageNotification());

    expect(mockAddInAppNotification).toHaveBeenCalledTimes(1);
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.type).toBe(MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND);
    expect(saved.title).toBe('Ton suivi du jour 🌿');
    expect(saved.message).toBe(
      'Si tu le souhaites, prends un moment pour noter comment tu te sens aujourd’hui.',
    );
    expect(saved.route).toBe('miscarriage-journal');
    expect(saved.read).toBe(false);
  });

  it('repeated daily deliveries produce distinct occurrence IDs (Monday vs Tuesday)', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-02T19:00:00'));
    await persistGenericReminderNotification(miscarriageNotification());
    const mondayId = mockAddInAppNotification.mock.calls[0][0].id;

    jest.setSystemTime(new Date('2026-03-03T19:00:00'));
    await persistGenericReminderNotification(miscarriageNotification());
    const tuesdayId = mockAddInAppNotification.mock.calls[1][0].id;

    expect(mondayId).not.toBe(tuesdayId);
    expect(mondayId).toBe('miscarriage-daily-tracking-reminder:2026-03-02');
    expect(tuesdayId).toBe('miscarriage-daily-tracking-reminder:2026-03-03');

    jest.useRealTimers();
  });

  it('the same real firing (same notifee id, same day) always resolves to the same occurrence id — the actual duplicate-prevention contract the store relies on', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-02T19:00:00'));
    const first = getGenericReminderOccurrenceId(miscarriageNotification());
    const second = getGenericReminderOccurrenceId(miscarriageNotification());
    expect(first).toBe(second);
    jest.useRealTimers();
  });

  it('marks the notification read when delivered via a press (read=true)', async () => {
    await persistGenericReminderNotification(miscarriageNotification(), true);

    expect(mockAddInAppNotification).toHaveBeenCalledTimes(1);
    expect(mockAddInAppNotification.mock.calls[0][0].read).toBe(true);
    expect(mockMarkInAppNotificationAsRead).toHaveBeenCalledWith(
      mockAddInAppNotification.mock.calls[0][0].id,
    );
  });

  it('never persists anything for a notification with no id', async () => {
    await persistGenericReminderNotification(undefined);
    expect(mockAddInAppNotification).not.toHaveBeenCalled();
  });
});
