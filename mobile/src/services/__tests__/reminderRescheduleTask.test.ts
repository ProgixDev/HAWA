import fs from 'fs';
import path from 'path';

import reminderRescheduleTask, {
  REMINDER_RESCHEDULE_TASK_NAME,
  rescheduleAllReminders,
} from '../reminderRescheduleTask';
import {resyncAllReminderNotifications} from '../reminderResync';

// The headless JS task Android starts after a time-zone change, a clock change or an app update (F14).
// JS contract only: that Android really delivers the broadcast and starts the service is NOT proven here.
jest.mock('../reminderResync', () => ({
  resyncAllReminderNotifications: jest.fn(),
}));

const resync = resyncAllReminderNotifications as jest.Mock;

beforeEach(() => {
  resync.mockReset();
  resync.mockResolvedValue(undefined);
});

describe('reminderRescheduleTask', () => {
  it('re-syncs every reminder with force (the kinds that skip "unchanged" snapshots must re-schedule too)', async () => {
    await reminderRescheduleTask({reason: 'android.intent.action.TIMEZONE_CHANGED'});

    expect(resync).toHaveBeenCalledTimes(1);
    expect(resync).toHaveBeenCalledWith({force: true});
  });

  it('works without data (an unknown reason must not matter)', async () => {
    await expect(reminderRescheduleTask()).resolves.toBeUndefined();
    expect(resync).toHaveBeenCalledWith({force: true});
  });

  it('contains a failure: the task never rejects (a rejection would crash / retry the headless context)', async () => {
    resync.mockRejectedValueOnce(new Error('native module unavailable'));

    await expect(reminderRescheduleTask({reason: 'x'})).resolves.toBeUndefined();
  });

  it('is idempotent: broadcasts arriving together share one run, and a later run is just another full resync', async () => {
    let release!: () => void;
    resync.mockImplementationOnce(() => new Promise<void>(resolve => {release = resolve;}));

    const first = rescheduleAllReminders();
    const second = rescheduleAllReminders(); // TIME_SET + TIMEZONE_CHANGED in the same instant
    expect(second).toBe(first);
    release();
    await Promise.all([first, second]);
    expect(resync).toHaveBeenCalledTimes(1);

    await reminderRescheduleTask();
    expect(resync).toHaveBeenCalledTimes(2);
  });

  it('a failed run does not poison later ones', async () => {
    resync.mockRejectedValueOnce(new Error('boom'));
    await reminderRescheduleTask();
    await reminderRescheduleTask();

    expect(resync).toHaveBeenCalledTimes(2);
  });
});

describe('the task module stays inside its remit', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../reminderRescheduleTask.ts'), 'utf8');
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('only imports the shared resync: no stores, no migration, no storage, no direct notifee', () => {
    const imports = Array.from(code.matchAll(/from\s+'([^']+)'/g)).map(match => match[1]);
    expect(imports).toEqual(['./reminderResync']);
    expect(code).not.toMatch(/migrat|AsyncStorage|notifee|fetch\(/i);
  });

  it('is the task registered in index.js under the same name the native service starts', () => {
    const indexJs = fs.readFileSync(path.resolve(__dirname, '../../../index.js'), 'utf8');
    expect(indexJs).toMatch(/registerHeadlessTask\(\s*REMINDER_RESCHEDULE_TASK_NAME\s*,\s*\(\)\s*=>\s*reminderRescheduleTask\s*\)/);
    expect(REMINDER_RESCHEDULE_TASK_NAME).toBe('AwaReminderRescheduleTask');
  });
});
