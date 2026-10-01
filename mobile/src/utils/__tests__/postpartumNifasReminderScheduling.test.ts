import {cancelLocalNotifications, scheduleLocalNotification} from '../../services/pregnancyNotifications';
import {setActiveObjective, setSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {confirmDelivery} from '../../state/postpartumPreferences';
import {
  cancelPostpartumNifasReminders,
  syncPostpartumNifasReminders,
  NIFAS_WARNING_NOTIFICATION_ID,
  NIFAS_REFERENCE_NOTIFICATION_ID,
} from '../postpartumNifasReminderScheduling';
import i18n from '../../i18n';

// Phase 4 localization — Postpartum's Nifas reminders are the other file
// (with qadaaReminderScheduling.ts) whose sync function short-circuits
// ("canReuseSchedule") and skips rescheduling once a schedule already
// matches the current delivery date/config version, so a language change
// needs the App.tsx orchestrator's cancel-then-sync sequence to actually
// rebuild the notification text. Uses REAL stores (not mocked) — only the
// Notifee-backed chokepoint is mocked, same convention as
// qadaaReminderScheduling.test.ts / qadaaReminderLedger.test.ts.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelLocalNotifications: jest.fn().mockResolvedValue(undefined),
}));

const schedule = scheduleLocalNotification as jest.Mock;
const cancel = cancelLocalNotifications as jest.Mock;

const callFor = (id: string) => schedule.mock.calls.map(([c]) => c).find(c => c.id === id);

beforeAll(async () => {
  await setActiveObjective('postpartum');
  setSpiritualMarkersEnabled(true);
  await confirmDelivery(new Date(2026, 7, 1)); // 2026-08-01
});

afterAll(async () => {
  await i18n.changeLanguage('fr');
});

beforeEach(async () => {
  // postpartumNifasReminderStore.ts is a real, module-level singleton — clear
  // whatever the PREVIOUS test scheduled first so each test starts clean.
  await cancelPostpartumNifasReminders();
  schedule.mockClear();
  cancel.mockClear();
});

describe('syncPostpartumNifasReminders — no duplicate scheduling', () => {
  it('re-syncing with nothing changed reuses the existing schedule (schedule() called only once per notification)', async () => {
    await syncPostpartumNifasReminders();
    expect(schedule).toHaveBeenCalledTimes(2); // warning + reference

    await syncPostpartumNifasReminders();
    await syncPostpartumNifasReminders();
    expect(schedule).toHaveBeenCalledTimes(2);
  });
});

describe('syncPostpartumNifasReminders — language change', () => {
  it('merely re-syncing after a language change does NOT rebuild the text (the known short-circuit)', async () => {
    await syncPostpartumNifasReminders();
    const frWarning = callFor(NIFAS_WARNING_NOTIFICATION_ID);
    expect(frWarning.title).toBe('Repère du nifâs à venir');

    await i18n.changeLanguage('en');
    try {
      schedule.mockClear();
      await syncPostpartumNifasReminders();
      expect(schedule).not.toHaveBeenCalled();
    } finally {
      await i18n.changeLanguage('fr');
    }
  });

  it('cancel-then-sync (the App.tsx language-resync sequence) rebuilds the SAME fire dates with English text', async () => {
    await syncPostpartumNifasReminders();
    const frWarning = callFor(NIFAS_WARNING_NOTIFICATION_ID);
    const frReference = callFor(NIFAS_REFERENCE_NOTIFICATION_ID);
    expect(frWarning.title).toBe('Repère du nifâs à venir');
    expect(frReference.title).toBe('Le repère des 40 jours retenu par AWA est atteint');

    await i18n.changeLanguage('en');
    try {
      schedule.mockClear();
      await cancelPostpartumNifasReminders();
      expect(cancel).toHaveBeenCalledWith([NIFAS_WARNING_NOTIFICATION_ID, NIFAS_REFERENCE_NOTIFICATION_ID]);

      await syncPostpartumNifasReminders();

      const enWarning = callFor(NIFAS_WARNING_NOTIFICATION_ID);
      const enReference = callFor(NIFAS_REFERENCE_NOTIFICATION_ID);

      expect(enWarning.fireDate).toEqual(frWarning.fireDate);
      expect(enWarning.title).toBe('Your nifas reference point is coming up');
      expect(enWarning.title).not.toBe(frWarning.title);

      expect(enReference.fireDate).toEqual(frReference.fireDate);
      expect(enReference.title).toBe('AWA’s 40-day reference point has been reached');
      expect(enReference.title).not.toBe(frReference.title);
    } finally {
      await i18n.changeLanguage('fr');
    }
  });
});
