import {cancelLocalNotification, scheduleLocalNotification} from '../../services/pregnancyNotifications';
import {setSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {addManualQadaaEntry, hydrateQadaaLedger} from '../../state/qadaaLedgerStore';
import {isRamadan} from '../hijriCalendar';
import {cancelQadaaReminderNotification, syncQadaaReminderNotification} from '../qadaaReminderScheduling';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';

// Phase 4 localization — the post-Ramadan Qadaa reminder is one of the two
// files (with postpartumNifasReminderScheduling.ts) whose sync function
// short-circuits ("canReuseSchedule") and skips rescheduling when the
// persisted schedule already matches, so a language change needs the
// App.tsx orchestrator's cancel-then-sync sequence to actually rebuild the
// notification text — this suite proves both halves of that: the
// short-circuit itself (so "no duplicate scheduling" holds under normal
// repeated syncs), and that cancel-then-sync produces fresh, current-
// language text at the identical fire date.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelLocalNotification: jest.fn().mockResolvedValue(undefined),
}));

const schedule = scheduleLocalNotification as jest.Mock;
const cancel = cancelLocalNotification as jest.Mock;

const ramadanDay = (() => {
  for (let offset = 0; offset < 40; offset += 1) {
    const candidate = new Date(2025, 1, 15 + offset);
    if (isRamadan(candidate) && !isRamadan(new Date(2025, 1, 14 + offset))) {
      return new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate() + 5, 10, 0, 0);
    }
  }
  throw new Error('Ramadan start not found');
})();

beforeAll(() => {
  jest.useFakeTimers({now: ramadanDay, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask']});
});
afterAll(async () => {
  jest.useRealTimers();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

beforeEach(async () => {
  // qadaaReminderNotificationStore.ts is a real, module-level singleton (not
  // reset between tests) — clear whatever the PREVIOUS test scheduled first,
  // so each test starts from a clean slate and its own canReuseSchedule
  // computation isn't polluted by an earlier test's persisted state.
  await cancelQadaaReminderNotification();
  schedule.mockClear();
  cancel.mockClear();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  setSpiritualMarkersEnabled(true);
  await addManualQadaaEntry({quantity: 3, year: 2016, yearSystem: 'gregorian'});
  await hydrateQadaaLedger();
});

describe('syncQadaaReminderNotification — no duplicate scheduling', () => {
  it('re-syncing with nothing changed reuses the existing schedule (schedule() called only once)', async () => {
    await syncQadaaReminderNotification();
    expect(schedule).toHaveBeenCalledTimes(1);

    await syncQadaaReminderNotification();
    await syncQadaaReminderNotification();
    expect(schedule).toHaveBeenCalledTimes(1);
  });
});

describe('syncQadaaReminderNotification — language change', () => {
  it('merely re-syncing after a language change does NOT rebuild the text (the known short-circuit)', async () => {
    await syncQadaaReminderNotification();
    const frCall = schedule.mock.calls[0][0];
    expect(frCall.title).toBe('Jeûnes à rattraper');

    await i18n.changeLanguage('en');
    try {
      schedule.mockClear();
      await syncQadaaReminderNotification();
      expect(schedule).not.toHaveBeenCalled();
    } finally {
      await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
    }
  });

  it('cancel-then-sync (the App.tsx language-resync sequence) rebuilds the SAME fire date with English text', async () => {
    await syncQadaaReminderNotification();
    const frCall = schedule.mock.calls[0][0];
    expect(frCall.title).toBe('Jeûnes à rattraper');

    await i18n.changeLanguage('en');
    try {
      schedule.mockClear();
      await cancelQadaaReminderNotification();
      expect(cancel).toHaveBeenCalledWith(frCall.id);

      await syncQadaaReminderNotification();

      expect(schedule).toHaveBeenCalledTimes(1);
      const enCall = schedule.mock.calls[0][0];
      expect(enCall.id).toBe(frCall.id);
      expect(enCall.fireDate).toEqual(frCall.fireDate);
      expect(enCall.title).toBe('Fasts to make up');
      expect(enCall.title).not.toBe(frCall.title);
      expect(enCall.data.inAppOccurrenceId).toBe(frCall.data.inAppOccurrenceId);
    } finally {
      await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
    }
  });
});
