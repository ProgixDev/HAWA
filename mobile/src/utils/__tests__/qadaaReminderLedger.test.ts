import {cancelLocalNotification, scheduleLocalNotification} from '../../services/pregnancyNotifications';
import {setSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {
  addManualQadaaEntry,
  getQadaaLedger,
  hydrateQadaaLedger,
  recordQadaaCompletion,
} from '../../state/qadaaLedgerStore';
import {isRamadan} from '../hijriCalendar';
import {syncQadaaReminderNotification} from '../qadaaReminderScheduling';

// The post-Ramadan reminder must use the SAME balance as the screen: manual
// (historical) days count, completions reduce it, and switching the spiritual
// toggle OFF cancels the notification WITHOUT touching a single Qadaa record.
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
afterAll(() => {
  jest.useRealTimers();
});

describe('qadaa reminder uses the authoritative balance', () => {
  it('manual-only debt schedules the reminder; OFF cancels it but keeps every record; ON schedules again; completing everything cancels', async () => {
    setSpiritualMarkersEnabled(true);
    await hydrateQadaaLedger();

    // Nothing owed: nothing to remind about.
    await syncQadaaReminderNotification();
    expect(schedule).not.toHaveBeenCalled();

    // 3 historical days, no menstrual data at all.
    await addManualQadaaEntry({quantity: 3, year: 2016, yearSystem: 'gregorian'});
    await syncQadaaReminderNotification();
    expect(schedule).toHaveBeenCalledTimes(1);

    // Spiritual OFF: notification cancelled, data untouched.
    const ledgerBefore = JSON.stringify(getQadaaLedger());
    setSpiritualMarkersEnabled(false);
    await syncQadaaReminderNotification();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(getQadaaLedger())).toBe(ledgerBefore);

    // ON again: the same balance is still owed → scheduled again.
    setSpiritualMarkersEnabled(true);
    await syncQadaaReminderNotification();
    expect(schedule).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(getQadaaLedger())).toBe(ledgerBefore);

    // Everything made up: the reminder is cancelled.
    await recordQadaaCompletion({quantity: 3, maxQuantity: 3});
    cancel.mockClear();
    await syncQadaaReminderNotification();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
