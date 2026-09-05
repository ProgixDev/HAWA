import type {Notification} from '@notifee/react-native';

import {recordDeliveredInAppNotification, markDeliveredInAppNotificationRead} from '../inAppNotificationDelivery';
import {handleGenericReminderBackgroundNotification} from '../genericReminderBackgroundHandler';
import {handleConceptionReminderBackgroundNotification} from '../conceptionReminderBackgroundHandler';
import {handlePostpartumNifasBackgroundNotification} from '../postpartumNifasBackgroundNotificationHandler';
import {reconcileInAppNotifications} from '../inAppNotificationReconciliation';
import {
  isGenericReminderNotification,
  getGenericReminderOccurrenceId,
  persistGenericReminderNotification,
} from '../genericReminderNotificationPersistence';
import {
  isConceptionReminderNotification,
  getConceptionReminderOccurrenceId,
  persistConceptionReminderNotification,
} from '../conceptionReminderNotificationPersistence';
import {
  isPostpartumNifasNotification,
  persistPostpartumNifasNotification,
} from '../postpartumNifasNotificationPersistence';
import {MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND} from '../../utils/miscarriageReminderScheduling';
import {POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND} from '../../utils/postpartumReminderScheduling';
import {CYCLE_REMINDER_NOTIFICATION_KIND} from '../../utils/cycleReminderScheduling';
import {addInAppNotification, markInAppNotificationAsRead} from '../../state/inAppNotificationStore';

// Cross-cutting audit: privacy redaction (src/services/pregnancyNotifications.ts)
// only ever overwrites the OS-visible notification.title/notification.body —
// see pregnancyNotifications.test.ts for that guarantee. This file verifies
// the OTHER half of the contract: once a notification carrying that generic
// "AWA" / "Tu as un nouveau rappel AWA." OS payload is actually delivered
// (foreground, background/headless, or reconciled after being missed), it
// must still produce a full, real-content entry in the in-app bell center —
// across all three current persistence architectures (the generic path, and
// TTC/Nifas's own bespoke ones), and it must never be recognized, routed, or
// deduplicated by its title/body text.
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {getDisplayedNotifications: jest.fn().mockResolvedValue([])},
}));
jest.mock('../../state/inAppNotificationStore', () => ({
  addInAppNotification: jest.fn(),
  markInAppNotificationAsRead: jest.fn(),
}));
jest.mock('../postpartumNifasNotificationNavigation', () => ({
  storePendingPostpartumNifasNotification: jest.fn().mockResolvedValue(undefined),
  openPendingPostpartumNifasNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../conceptionReminderNotificationNavigation', () => ({
  storePendingConceptionReminderNotification: jest.fn().mockResolvedValue(undefined),
  openPendingConceptionReminderNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../utils/postpartumNifasReminderScheduling', () => ({
  reconcilePostpartumNifasInAppNotifications: jest.fn().mockResolvedValue(undefined),
}));
// pregnancyNotifications.ts imports the real Notifee native module, which
// several of the scheduler modules below import transitively purely for
// their exported *_NOTIFICATION_KIND string constants.
jest.mock('../pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
  ensureNotificationPermission: jest.fn(),
}));

const mockAddInAppNotification = addInAppNotification as jest.Mock;
const mockMarkInAppNotificationAsRead = markInAppNotificationAsRead as jest.Mock;
const mockGetDisplayed = require('@notifee/react-native').default.getDisplayedNotifications as jest.Mock;

const REDACTED_TITLE = 'AWA';
const REDACTED_BODY = 'Tu as un nouveau rappel AWA.';

function redactedGenericNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'miscarriage-daily-tracking-reminder',
    title: REDACTED_TITLE,
    body: REDACTED_BODY,
    data: {
      hawaNotificationKind: MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND,
      inAppTitle: 'Ton suivi du jour 🌿',
      inAppMessage: 'Si tu le souhaites, prends un moment pour noter comment tu te sens aujourd’hui.',
    },
    ...overrides,
  } as never;
}

function redactedConceptionNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'conception-temperature-reminder',
    title: REDACTED_TITLE,
    body: REDACTED_BODY,
    data: {
      hawaNotificationKind: 'conception-reminder',
      conceptionReminderType: 'temperature',
    },
    ...overrides,
  } as never;
}

function redactedNifasNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'postpartum-nifas-reference',
    title: REDACTED_TITLE,
    body: REDACTED_BODY,
    data: {
      hawaNotificationKind: 'postpartum-nifas',
      nifasReminderType: 'reference',
      inAppTitle: 'Repère du nifas atteint',
      inAppMessage: 'Le repère présenté par AWA a été atteint.',
      articleId: 'nifasfiqh-repere-fiqh',
    },
    ...overrides,
  } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAddInAppNotification.mockResolvedValue(undefined);
  mockMarkInAppNotificationAsRead.mockResolvedValue(undefined);
  mockGetDisplayed.mockResolvedValue([]);
});

describe('Recognition never depends on the OS-visible title/body', () => {
  it('generic kinds are recognized purely from data.hawaNotificationKind', () => {
    expect(isGenericReminderNotification(redactedGenericNotification())).toBe(true);
    expect(
      isGenericReminderNotification({id: 'x', title: REDACTED_TITLE, body: REDACTED_BODY, data: {}} as never),
    ).toBe(false);
  });

  it('TTC is recognized purely from data.hawaNotificationKind', () => {
    expect(isConceptionReminderNotification(redactedConceptionNotification())).toBe(true);
  });

  it('Nifas is recognized purely from data.hawaNotificationKind', () => {
    expect(isPostpartumNifasNotification(redactedNifasNotification())).toBe(true);
  });
});

describe('Persistence recovers the REAL content despite a redacted OS payload', () => {
  it('generic reminder (Miscarriage kind): stores the real title/message, not "AWA"', async () => {
    await persistGenericReminderNotification(redactedGenericNotification());

    expect(mockAddInAppNotification).toHaveBeenCalledTimes(1);
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Ton suivi du jour 🌿');
    expect(saved.message).toBe('Si tu le souhaites, prends un moment pour noter comment tu te sens aujourd’hui.');
    expect(saved.title).not.toBe(REDACTED_TITLE);
    expect(saved.message).not.toBe(REDACTED_BODY);
    expect(saved.type).toBe(MISCARRIAGE_DAILY_TRACKING_NOTIFICATION_KIND);
    expect(saved.read).toBe(false);
  });

  it('generic reminder (Postpartum daily-tracking kind): also recovers real content when redacted', async () => {
    await persistGenericReminderNotification(
      redactedGenericNotification({
        id: 'postpartum-daily-tracking-reminder',
        data: {
          hawaNotificationKind: POSTPARTUM_DAILY_TRACKING_NOTIFICATION_KIND,
          inAppTitle: 'Ton suivi du jour',
          inAppMessage: 'Prends un moment pour noter comment tu te sens aujourd’hui.',
        },
      } as never),
    );

    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Ton suivi du jour');
    expect(saved.message).toBe('Prends un moment pour noter comment tu te sens aujourd’hui.');
  });

  it('generic reminder (Cycle kind) falls back to a generic in-app label only when the scheduler omitted inAppTitle/inAppMessage — never to the redacted OS strings', async () => {
    await persistGenericReminderNotification({
      id: 'cycle-reminder',
      title: REDACTED_TITLE,
      body: REDACTED_BODY,
      data: {hawaNotificationKind: CYCLE_REMINDER_NOTIFICATION_KIND},
    } as never);

    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).not.toBe(REDACTED_TITLE);
    expect(saved.message).not.toBe(REDACTED_BODY);
  });

  it('TTC: stores the real content resolved from data.conceptionReminderType, not "AWA"', async () => {
    await persistConceptionReminderNotification(redactedConceptionNotification());

    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).not.toBe(REDACTED_TITLE);
    expect(saved.message).not.toBe(REDACTED_BODY);
    expect(saved.title.length).toBeGreaterThan(0);
  });

  it('Nifas: stores data.inAppTitle/inAppMessage, not "AWA"', async () => {
    await persistPostpartumNifasNotification(redactedNifasNotification());

    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Repère du nifas atteint');
    expect(saved.message).toBe('Le repère présenté par AWA a été atteint.');
    expect(saved.data).toEqual({articleId: 'nifasfiqh-repere-fiqh'});
  });

  it('a normal (non-redacted) notification persists identically — redaction changes nothing about persistence', async () => {
    await persistGenericReminderNotification(redactedGenericNotification({title: 'Ton suivi du jour 🌿', body: 'Si tu le souhaites...'}));
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Ton suivi du jour 🌿');
    expect(saved.message).toBe('Si tu le souhaites, prends un moment pour noter comment tu te sens aujourd’hui.');
  });
});

describe('Occurrence IDs / deduplication are unaffected by redaction', () => {
  it('generic occurrence id is derived from notification.id + date, never from title/body', () => {
    const real = getGenericReminderOccurrenceId(redactedGenericNotification({title: 'Real', body: 'Real body'}));
    const redacted = getGenericReminderOccurrenceId(redactedGenericNotification());
    expect(real).toBe(redacted);
  });

  it('TTC occurrence id is derived from notification.id + date, never from title/body', () => {
    const real = getConceptionReminderOccurrenceId(redactedConceptionNotification({title: 'Real', body: 'Real body'}));
    const redacted = getConceptionReminderOccurrenceId(redactedConceptionNotification());
    expect(real).toBe(redacted);
  });
});

describe('Foreground delivery (notificationForegroundHandlers.ts -> inAppNotificationDelivery.ts)', () => {
  it('DELIVERED: a redacted generic notification is still persisted with real content, unread', async () => {
    await recordDeliveredInAppNotification(redactedGenericNotification());

    expect(mockAddInAppNotification).toHaveBeenCalledTimes(1);
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Ton suivi du jour 🌿');
    expect(saved.read).toBe(false);
  });

  it('PRESS: a redacted generic notification is persisted (real content) then explicitly marked read', async () => {
    // markDeliveredInAppNotificationRead persists via recordDeliveredInAppNotification
    // (always unread on that first write) and then separately calls
    // markInAppNotificationAsRead for the same occurrence id — two store
    // calls reaching the same end state, unlike the background handlers'
    // single persistGenericReminderNotification(notification, true) call.
    const notification = redactedGenericNotification();
    await markDeliveredInAppNotificationRead(notification);

    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Ton suivi du jour 🌿');
    expect(mockMarkInAppNotificationAsRead).toHaveBeenCalledWith(saved.id);
  });

  it('routes a redacted TTC notification to its own bespoke persistence, still recovering real content', async () => {
    await recordDeliveredInAppNotification(redactedConceptionNotification());
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).not.toBe(REDACTED_TITLE);
  });

  it('routes a redacted Nifas notification to its own bespoke persistence, still recovering real content', async () => {
    await recordDeliveredInAppNotification(redactedNifasNotification());
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Repère du nifas atteint');
  });
});

describe('Background/headless delivery (index.js -> the three background handlers)', () => {
  it('generic background handler persists a redacted notification with real content', async () => {
    await handleGenericReminderBackgroundNotification('delivered', redactedGenericNotification());
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Ton suivi du jour 🌿');
    expect(saved.read).toBe(false);
  });

  it('generic background handler on press persists read=true', async () => {
    await handleGenericReminderBackgroundNotification('press', redactedGenericNotification());
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.read).toBe(true);
  });

  it('TTC background handler persists a redacted notification with real content', async () => {
    await handleConceptionReminderBackgroundNotification('delivered', redactedConceptionNotification());
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).not.toBe(REDACTED_TITLE);
  });

  it('Nifas background handler persists a redacted notification with real content', async () => {
    await handlePostpartumNifasBackgroundNotification('delivered', redactedNifasNotification());
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Repère du nifas atteint');
  });

  it('the same real firing produces the SAME occurrence id whether observed via foreground or background delivery — true dedup regardless of entry point', async () => {
    const notification = redactedGenericNotification();
    await recordDeliveredInAppNotification(notification);
    const foregroundId = mockAddInAppNotification.mock.calls[0][0].id;

    mockAddInAppNotification.mockClear();
    await handleGenericReminderBackgroundNotification('delivered', notification);
    const backgroundId = mockAddInAppNotification.mock.calls[0][0].id;

    expect(backgroundId).toBe(foregroundId);
  });
});

describe('Reconciliation (app foreground after a missed background callback)', () => {
  it('picks up a redacted, currently-displayed generic notification and persists its real content', async () => {
    mockGetDisplayed.mockResolvedValue([{notification: redactedGenericNotification()}]);

    await reconcileInAppNotifications();

    expect(mockAddInAppNotification).toHaveBeenCalledTimes(1);
    const saved = mockAddInAppNotification.mock.calls[0][0];
    expect(saved.title).toBe('Ton suivi du jour 🌿');
  });

  it('reconciling twice for the same displayed notification does not duplicate the in-app entry (addInAppNotification is id-idempotent; here we just confirm the same id is produced both times)', async () => {
    mockGetDisplayed.mockResolvedValue([{notification: redactedGenericNotification()}]);
    await reconcileInAppNotifications();
    const firstId = mockAddInAppNotification.mock.calls[0][0].id;

    mockAddInAppNotification.mockClear();
    await reconcileInAppNotifications();
    const secondId = mockAddInAppNotification.mock.calls[0][0].id;

    expect(secondId).toBe(firstId);
  });

  it('ignores displayed notifications unrelated to any known reminder kind', async () => {
    mockGetDisplayed.mockResolvedValue([{notification: {id: 'unrelated', title: 'x', body: 'y', data: {}}}]);
    await reconcileInAppNotifications();
    expect(mockAddInAppNotification).not.toHaveBeenCalled();
  });
});
