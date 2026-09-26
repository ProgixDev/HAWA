import AsyncStorage from '@react-native-async-storage/async-storage';

// M2 — the pending "configure another objective" state survives a process kill.
// A RESTART is simulated with jest.resetModules() + re-requiring the graph: all
// module-singleton memory is gone, while the AsyncStorage mock (a Map owned by
// jest.setup.js) is preserved — exactly what killing and relaunching the app does.
const PENDING_KEY = '@hawa/pending-objective-setup/v1';
const ACTIVE_KEY = '@hawa/active-objective';

type Modules = {
  storage: typeof AsyncStorage;
  onboarding: typeof import('../../state/onboardingPreferences');
  pregnancy: typeof import('../../state/pregnancyPreferences');
  miscarriage: typeof import('../../state/miscarriagePreferences');
  flow: typeof import('../../state/objectiveSetupFlow');
  service: typeof import('../objectiveSwitch');
};

const boot = (): Modules => {
  jest.resetModules();
  return {
    storage: require('@react-native-async-storage/async-storage').default,
    onboarding: require('../../state/onboardingPreferences'),
    pregnancy: require('../../state/pregnancyPreferences'),
    miscarriage: require('../../state/miscarriagePreferences'),
    flow: require('../../state/objectiveSetupFlow'),
    service: require('../objectiveSwitch'),
  };
};

let m: Modules;

beforeEach(async () => {
  await AsyncStorage.clear();
  m = boot();
});

const callbacks = () => ({openHome: jest.fn(), openSetup: jest.fn()});
const flush = async () => {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
};

/** Starts an in-app setup of `to` from `from` in the CURRENT session. */
const startSetup = async (from: 'cycle' | 'loss' | 'pregnancy', to: 'pregnancy' | 'loss' | 'conceive') => {
  await m.onboarding.setActiveObjective(from);
  const cb = callbacks();
  const result = await m.service.switchToObjective({from, to, ...cb});
  expect(result).toBe('setup-started');
};

describe('persisting the pending setup', () => {
  it('stores only {previous, objective} and keeps the in-memory API unchanged', async () => {
    await startSetup('cycle', 'pregnancy');

    expect(m.flow.getPendingObjectiveSetup()).toEqual({previous: 'cycle', objective: 'pregnancy'});
    expect(JSON.parse((await AsyncStorage.getItem(PENDING_KEY)) as string)).toEqual({
      previous: 'cycle',
      objective: 'pregnancy',
    });
  });

  it('writes the pending record BEFORE the active objective moves to the half-configured target', async () => {
    await m.onboarding.setActiveObjective('cycle');
    const setItem = m.storage.setItem as unknown as jest.Mock;
    setItem.mockClear();

    await m.service.switchToObjective({from: 'cycle', to: 'pregnancy', ...callbacks()});

    const keys = setItem.mock.calls.map(call => call[0]);
    expect(keys).toEqual([PENDING_KEY, ACTIVE_KEY]);
  });

  it('a switch to an already configured objective persists nothing', async () => {
    await m.pregnancy.setPregnancyDating({method: 'later', date: null});
    await m.onboarding.setActiveObjective('cycle');

    const result = await m.service.switchToObjective({from: 'cycle', to: 'pregnancy', ...callbacks()});

    expect(result).toBe('activated');
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('completing the chain clears memory and storage; a later restart finds nothing', async () => {
    await startSetup('cycle', 'pregnancy');
    const navigation = {navigate: jest.fn(), reset: jest.fn()};

    m.flow.continueAfterObjectiveSetup(navigation);
    await flush();

    expect(navigation.reset).toHaveBeenCalled();
    expect(m.flow.getPendingObjectiveSetup()).toBeNull();
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();

    m = boot();
    await expect(m.service.restorePendingObjectiveSetupOnStartup()).resolves.toBe('none');
  });

  it('completeObjectiveSetup() alone also clears the persisted record', async () => {
    await startSetup('cycle', 'pregnancy');
    m.flow.completeObjectiveSetup();
    await flush();
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('cancel (Back) restores the previous objective and clears storage; a later restart finds nothing', async () => {
    await startSetup('cycle', 'pregnancy');

    await expect(m.flow.cancelPendingObjectiveSetup()).resolves.toBe('cycle');

    expect(m.onboarding.getActiveObjective()).toBe('cycle');
    expect(await AsyncStorage.getItem(ACTIVE_KEY)).toBe('cycle');
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();

    m = boot();
    await expect(m.service.restorePendingObjectiveSetupOnStartup()).resolves.toBe('none');
    expect(await m.onboarding.hydrateActiveObjective()).toBe('cycle');
  });
});

describe('restart while a setup was pending', () => {
  it('target still unconfigured → the previous objective is restored (memory + storage), pending cleared', async () => {
    await startSetup('cycle', 'pregnancy');
    expect(await AsyncStorage.getItem(ACTIVE_KEY)).toBe('pregnancy'); // parked on the half-configured one

    m = boot(); // process killed, app relaunched
    const result = await m.service.restorePendingObjectiveSetupOnStartup();

    expect(result).toBe('restored');
    expect(m.onboarding.getActiveObjective()).toBe('cycle');
    expect(await AsyncStorage.getItem(ACTIVE_KEY)).toBe('cycle');
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();
    expect(m.flow.getPendingObjectiveSetup()).toBeNull();
  });

  it('partial configuration is neither completed nor deleted by the restore', async () => {
    await m.miscarriage.setMiscarriageDate(new Date(2026, 8, 10));
    await m.miscarriage.setMiscarriageBleedingStatus('no');
    await startSetup('pregnancy', 'loss');

    m = boot();
    await expect(m.service.restorePendingObjectiveSetupOnStartup()).resolves.toBe('restored');

    expect(m.onboarding.getActiveObjective()).toBe('pregnancy');
    await m.miscarriage.hydrateMiscarriagePreferences();
    expect(m.miscarriage.getMiscarriagePreferences()).toMatchObject({
      miscarriageDate: '2026-09-10',
      bleedingStatus: 'no',
      cycleReturnStatus: null,
    });
    await expect(m.service.isObjectiveConfigured('loss')).resolves.toBe(false);
  });

  it('target fully configured by restart time → only the pending flag is cleared, active objective kept', async () => {
    await startSetup('cycle', 'pregnancy');
    // The chain was actually finished (dating saved) right before the kill.
    await m.pregnancy.setPregnancyDating({method: 'dueDate', date: new Date(2027, 1, 1).toISOString()});

    m = boot();
    const result = await m.service.restorePendingObjectiveSetupOnStartup();

    expect(result).toBe('cleared');
    expect(m.onboarding.getActiveObjective()).toBe('pregnancy');
    expect(await AsyncStorage.getItem(ACTIVE_KEY)).toBe('pregnancy');
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('kill between the pending write and the objective change → stale record discarded, nothing changes', async () => {
    await m.onboarding.setActiveObjective('cycle');
    await m.flow.beginObjectiveSetup('cycle', 'pregnancy'); // active objective still 'cycle'

    m = boot();
    const result = await m.service.restorePendingObjectiveSetupOnStartup();

    expect(result).toBe('cleared');
    expect(m.onboarding.getActiveObjective()).toBe('cycle');
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('kill after the previous objective was restored but before the record was removed → discarded, no double restore', async () => {
    await startSetup('cycle', 'pregnancy');
    await m.onboarding.setActiveObjective('cycle'); // cancel got this far, then the process died

    m = boot();
    await expect(m.service.restorePendingObjectiveSetupOnStartup()).resolves.toBe('cleared');
    expect(m.onboarding.getActiveObjective()).toBe('cycle');
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('a setup already begun in the new session is left alone', async () => {
    await startSetup('cycle', 'pregnancy');
    m = boot();
    await m.flow.beginObjectiveSetup('cycle', 'loss');

    await expect(m.service.restorePendingObjectiveSetupOnStartup()).resolves.toBe('none');

    expect(m.flow.getPendingObjectiveSetup()).toEqual({previous: 'cycle', objective: 'loss'});
  });

  it('nothing persisted → no-op and the active objective is untouched', async () => {
    await m.onboarding.setActiveObjective('menopause');
    m = boot();
    await expect(m.service.restorePendingObjectiveSetupOnStartup()).resolves.toBe('none');
    expect(await m.onboarding.hydrateActiveObjective()).toBe('menopause');
  });
});

describe('stale / corrupt persisted state fails safely', () => {
  const persistedGarbage: Array<[string, string]> = [
    ['invalid JSON', '{not json'],
    ['a JSON string', '"cycle"'],
    ['null', 'null'],
    ['an array', '["cycle","pregnancy"]'],
    ['an unknown previous objective', JSON.stringify({previous: 'nope', objective: 'pregnancy'})],
    ['an unknown target objective', JSON.stringify({previous: 'cycle', objective: 'nope'})],
    ['a missing field', JSON.stringify({previous: 'cycle'})],
    ['non-string ids', JSON.stringify({previous: 1, objective: 2})],
    ['identical previous and target', JSON.stringify({previous: 'loss', objective: 'loss'})],
  ];

  it.each(persistedGarbage)('%s → cleared, active objective untouched, nothing restored', async (_label, raw) => {
    await AsyncStorage.setItem(ACTIVE_KEY, 'pregnancy');
    await AsyncStorage.setItem(PENDING_KEY, raw);

    m = boot();
    const result = await m.service.restorePendingObjectiveSetupOnStartup();

    expect(result).toBe('none');
    expect(await AsyncStorage.getItem(PENDING_KEY)).toBeNull();
    expect(await m.onboarding.hydrateActiveObjective()).toBe('pregnancy');
    expect(await AsyncStorage.getItem(ACTIVE_KEY)).toBe('pregnancy');
  });

  it('a storage read failure never crashes startup', async () => {
    m = boot();
    (m.storage.getItem as unknown as jest.Mock).mockRejectedValueOnce(new Error('disk'));
    await expect(m.service.restorePendingObjectiveSetupOnStartup()).resolves.toBe('none');
  });
});
