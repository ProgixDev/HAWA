import AsyncStorage from '@react-native-async-storage/async-storage';

// M49 — the Nifas "Compris" acknowledgement is keyed to its delivery date and
// must NOT be wiped by unrelated events: objective switches, the spiritual
// toggle, lochia close/reopen, or a restart. A different delivery date (a new
// journey) still never inherits it. No Nifas threshold / prayer rule is
// touched or exercised: only the persisted acknowledgement's lifecycle.
//
// A RESTART is simulated with jest.resetModules() + re-requiring the graph while
// the AsyncStorage mock (owned by jest.setup.js) keeps its data — same pattern
// as src/services/__tests__/objectiveSetupPersistence.test.ts.

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelLocalNotifications: jest.fn().mockResolvedValue(undefined),
}));

const NIFAS_KEY = '@hawa/postpartum-nifas-reminders/v1';
const DELIVERY = '2026-08-19';
const NEW_DELIVERY = '2026-09-20';
const at = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

type Modules = {
  onboarding: typeof import('../onboardingPreferences');
  preferences: typeof import('../postpartumPreferences');
  lochia: typeof import('../postpartumLochiaStore');
  nifas: typeof import('../postpartumNifasReminderStore');
  scheduling: typeof import('../../utils/postpartumNifasReminderScheduling');
};

const boot = (): Modules => {
  jest.resetModules();
  return {
    onboarding: require('../onboardingPreferences'),
    preferences: require('../postpartumPreferences'),
    lochia: require('../postpartumLochiaStore'),
    nifas: require('../postpartumNifasReminderStore'),
    scheduling: require('../../utils/postpartumNifasReminderScheduling'),
  };
};

let m: Modules;

const stored = async () => JSON.parse((await AsyncStorage.getItem(NIFAS_KEY)) ?? '{}') as Record<string, unknown>;
const isAcknowledged = async (date: string) => {
  await m.nifas.hydratePostpartumNifasReminderState();
  return m.nifas.isPostpartumNifasCompletionAcknowledged(date);
};

/** Postpartum active, markers ON, delivery confirmed, reminders scheduled. */
const startPostpartum = async () => {
  await m.onboarding.setActiveObjective('postpartum');
  m.onboarding.setSpiritualMarkersEnabled(true);
  await m.preferences.confirmDelivery(at(DELIVERY));
  await m.scheduling.syncPostpartumNifasReminders();
};

const acknowledge = async () => {
  await m.nifas.setPostpartumNifasCompletionAcknowledged(DELIVERY);
  expect(await isAcknowledged(DELIVERY)).toBe(true);
};

beforeEach(async () => {
  await AsyncStorage.clear();
  m = boot();
});

describe('Nifas acknowledgement lifecycle', () => {
  it('is persisted keyed to the delivery date once the popup is acknowledged', async () => {
    await startPostpartum();
    expect(await isAcknowledged(DELIVERY)).toBe(false);
    await acknowledge();

    const raw = await stored();
    expect(raw.deliveryDate).toBe(DELIVERY);
    expect(raw.completionAcknowledged).toBe(true);
    // Scheduling data written by the sync is not overwritten by the acknowledgement.
    expect(raw.warningOccurrenceId).toEqual(expect.any(String));
    expect(raw.referenceFireAt).toEqual(expect.any(String));
  });

  it('survives leaving the postpartum objective and coming back', async () => {
    await startPostpartum();
    await acknowledge();

    await m.onboarding.setActiveObjective('cycle');
    await m.scheduling.syncPostpartumNifasReminders(); // what the App.tsx subscription runs
    expect(await isAcknowledged(DELIVERY)).toBe(true);
    const away = await stored();
    expect(away.completionAcknowledged).toBe(true);
    expect(away.deliveryDate).toBe(DELIVERY);
    // Only the SCHEDULE snapshot is cleared while away.
    expect(away.warningFireAt).toBeNull();
    expect(away.referenceOccurrenceId).toBeNull();

    await m.onboarding.setActiveObjective('postpartum');
    await m.scheduling.syncPostpartumNifasReminders();
    expect(await isAcknowledged(DELIVERY)).toBe(true);
    const back = await stored();
    expect(back.completionAcknowledged).toBe(true);
    expect(back.warningFireAt).toEqual(expect.any(String)); // reminders rescheduled
  });

  it('survives the spiritual-markers toggle OFF -> ON', async () => {
    await startPostpartum();
    await acknowledge();

    m.onboarding.setSpiritualMarkersEnabled(false);
    await m.scheduling.syncPostpartumNifasReminders();
    expect(await isAcknowledged(DELIVERY)).toBe(true);

    m.onboarding.setSpiritualMarkersEnabled(true);
    await m.scheduling.syncPostpartumNifasReminders();
    expect(await isAcknowledged(DELIVERY)).toBe(true);
    expect((await stored()).completionAcknowledged).toBe(true);
  });

  it('is hydrated from storage after a restart (also after an objective switch)', async () => {
    await startPostpartum();
    await acknowledge();
    await m.onboarding.setActiveObjective('cycle');
    await m.scheduling.syncPostpartumNifasReminders();

    m = boot(); // process killed and relaunched: memory gone, storage kept
    expect(m.nifas.isPostpartumNifasCompletionAcknowledged(DELIVERY)).toBe(false); // before hydration
    expect(await isAcknowledged(DELIVERY)).toBe(true);

    await m.onboarding.setActiveObjective('postpartum');
    await m.scheduling.syncPostpartumNifasReminders();
    expect(await isAcknowledged(DELIVERY)).toBe(true);
  });

  it('survives lochia close and reopen (same delivery date = same episode)', async () => {
    await startPostpartum();
    await acknowledge();

    await m.lochia.markPostpartumLochiaEnded('2026-09-01');
    await m.scheduling.syncPostpartumNifasReminders(); // lochia ended -> reminders cleared
    expect(await isAcknowledged(DELIVERY)).toBe(true);

    await m.lochia.reopenPostpartumLochiaTracking();
    await m.scheduling.syncPostpartumNifasReminders();
    expect(await isAcknowledged(DELIVERY)).toBe(true);
    expect((await stored()).warningFireAt).toEqual(expect.any(String));
  });

  it('a genuinely new journey (different delivery date) does not inherit it', async () => {
    await startPostpartum();
    await acknowledge();

    await m.preferences.confirmDelivery(at(NEW_DELIVERY), {startsNewJourney: true});
    await m.scheduling.syncPostpartumNifasReminders();

    expect(await isAcknowledged(NEW_DELIVERY)).toBe(false);
    expect(await isAcknowledged(DELIVERY)).toBe(false);
    expect((await stored()).completionAcknowledged).toBe(false);

    await m.nifas.setPostpartumNifasCompletionAcknowledged(NEW_DELIVERY);
    expect(await isAcknowledged(NEW_DELIVERY)).toBe(true);
  });

  it('an acknowledgement given while a sync is in flight is not overwritten by that sync', async () => {
    await startPostpartum();
    m.onboarding.setSpiritualMarkersEnabled(false);
    const pendingSync = m.scheduling.syncPostpartumNifasReminders();
    const pendingAck = m.nifas.setPostpartumNifasCompletionAcknowledged(DELIVERY);
    await Promise.all([pendingSync, pendingAck]);
    m.onboarding.setSpiritualMarkersEnabled(true);
    await m.scheduling.syncPostpartumNifasReminders();

    expect(await isAcknowledged(DELIVERY)).toBe(true);
    expect((await stored()).completionAcknowledged).toBe(true);
  });
});
