import AsyncStorage from '@react-native-async-storage/async-storage';

// Every store is a module singleton with its own hydration cache, so each
// test loads a FRESH copy of the whole graph on top of an empty AsyncStorage —
// exactly what a cold app start with nothing configured looks like.
type Modules = {
  onboarding: typeof import('../../state/onboardingPreferences');
  conception: typeof import('../../state/conceptionPreferences');
  contraception: typeof import('../../state/contraceptionPreferences');
  irregular: typeof import('../../state/irregularPreferences');
  menopause: typeof import('../../state/menopausePreferences');
  pregnancy: typeof import('../../state/pregnancyPreferences');
  postpartum: typeof import('../../state/postpartumPreferences');
  miscarriage: typeof import('../../state/miscarriagePreferences');
  flow: typeof import('../../state/objectiveSetupFlow');
  service: typeof import('../objectiveSwitch');
};

let m: Modules;

const cyclePrefs = () => ({
  lastPeriodStart: new Date(2026, 8, 1),
  periodDuration: 5,
  cycleDuration: 28,
  regularity: 'yes' as const,
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.resetModules();
  m = {
    onboarding: require('../../state/onboardingPreferences'),
    conception: require('../../state/conceptionPreferences'),
    contraception: require('../../state/contraceptionPreferences'),
    irregular: require('../../state/irregularPreferences'),
    menopause: require('../../state/menopausePreferences'),
    pregnancy: require('../../state/pregnancyPreferences'),
    postpartum: require('../../state/postpartumPreferences'),
    miscarriage: require('../../state/miscarriagePreferences'),
    flow: require('../../state/objectiveSetupFlow'),
    service: require('../objectiveSwitch'),
  };
});

const ALL = ['cycle', 'conceive', 'contraception', 'irregular', 'menopause', 'pregnancy', 'postpartum', 'loss'] as const;

describe('isObjectiveConfigured — nothing configured yet', () => {
  it.each(ALL)('%s is NOT configured on a clean install (placeholders are never a configuration)', async objective => {
    await expect(m.service.isObjectiveConfigured(objective)).resolves.toBe(false);
  });
});

describe('isObjectiveConfigured — reads each objective\'s own existing configuration', () => {
  it('cycle: configured once real cycle data was confirmed', async () => {
    m.onboarding.setCyclePreferences(cyclePrefs());
    await expect(m.service.isObjectiveConfigured('cycle')).resolves.toBe(true);
  });

  it('conceive: needs BOTH confirmed cycle data and its own onboarding answer', async () => {
    await expect(m.service.isObjectiveConfigured('conceive')).resolves.toBe(false);
    m.onboarding.setCyclePreferences(cyclePrefs());
    await expect(m.service.isObjectiveConfigured('conceive')).resolves.toBe(false);
    await m.conception.setConceptionPreferences({tryingDuration: 'starting_now'});
    // Its first step alone is NOT a configuration — see objectiveSetupCompleteness.test.ts.
    await expect(m.service.isObjectiveConfigured('conceive')).resolves.toBe(false);
    await m.conception.setConceptionPreferences({ovulationAwareness: 'sometimes', indicators: ['temperature']});
    await expect(m.service.isObjectiveConfigured('conceive')).resolves.toBe(true);
  });

  it('contraception: configured once the method, its start date and the pause answer were given', async () => {
    await m.contraception.setContraceptionPreferences({
      method: 'ring',
      methodStartDate: '2026-08-01',
      hasTreatmentBreak: false,
    });
    await expect(m.service.isObjectiveConfigured('contraception')).resolves.toBe(true);
  });

  it('irregular: configured once the cycle pattern and the tracked items were answered', async () => {
    await m.irregular.setIrregularPreferences({cyclePattern: 'irregular', trackedItems: ['mood']});
    await expect(m.service.isObjectiveConfigured('irregular')).resolves.toBe(true);
  });

  it('menopause: configured once stage, hormonal-treatment and lab-tracking answers were given', async () => {
    await m.menopause.setMenopauseStage('perimenopause');
    await m.menopause.setMenopauseHormonalTreatmentStatus('no');
    await m.menopause.setMenopauseLabTracking('none');
    await expect(m.service.isObjectiveConfigured('menopause')).resolves.toBe(true);
  });

  it('pregnancy: a real dating date — or an explicit "later" — counts; the untouched default does not', async () => {
    await expect(m.service.isObjectiveConfigured('pregnancy')).resolves.toBe(false);
    await m.pregnancy.setPregnancyDating({method: 'later', date: null});
    await expect(m.service.isObjectiveConfigured('pregnancy')).resolves.toBe(true);
    await m.pregnancy.setPregnancyDating({method: 'lastPeriod', date: null});
    await expect(m.service.isObjectiveConfigured('pregnancy')).resolves.toBe(false);
    await m.pregnancy.setPregnancyDating({method: 'lastPeriod', date: new Date(2026, 5, 1).toISOString()});
    await expect(m.service.isObjectiveConfigured('pregnancy')).resolves.toBe(true);
  });

  it('postpartum: configured once a delivery date was confirmed', async () => {
    await m.postpartum.confirmDelivery(new Date(2026, 8, 10));
    await expect(m.service.isObjectiveConfigured('postpartum')).resolves.toBe(true);
  });

  it('loss: configured once the date and the three follow-up answers were given', async () => {
    await m.miscarriage.setMiscarriageDate(new Date(2026, 8, 10));
    await m.miscarriage.setMiscarriageBleedingStatus('no');
    await m.miscarriage.setMiscarriageCycleReturnStatus('unknown');
    await m.miscarriage.setMiscarriageTryingAgainStatus('not_now');
    await expect(m.service.isObjectiveConfigured('loss')).resolves.toBe(true);
  });
});

describe('getObjectiveSetupRoute', () => {
  it('starts each objective at its own first onboarding screen', () => {
    const route = m.service.getObjectiveSetupRoute;
    expect(route('cycle', false)).toBe('CycleInformation');
    expect(route('contraception', false)).toBe('ContraceptionMethod');
    expect(route('irregular', false)).toBe('IrregularCyclePattern');
    expect(route('menopause', false)).toBe('MenopauseStage');
    expect(route('pregnancy', false)).toBe('PregnancyDatingSetup');
    expect(route('postpartum', false)).toBe('PostpartumDeliveryDate');
    expect(route('loss', false)).toBe('MiscarriageDate');
  });

  it('conceive only asks for cycle information when none was confirmed', () => {
    expect(m.service.getObjectiveSetupRoute('conceive', false)).toBe('CycleInformation');
    expect(m.service.getObjectiveSetupRoute('conceive', true)).toBe('ConceptionTryingDuration');
  });
});

describe('switchToObjective', () => {
  const callbacks = () => ({openHome: jest.fn(), openSetup: jest.fn()});

  it('CASE A — an already configured objective is activated and its dashboard opened, no setup', async () => {
    await m.pregnancy.setPregnancyDating({method: 'lastPeriod', date: new Date(2026, 5, 1).toISOString()});
    await m.onboarding.setActiveObjective('cycle');
    const cb = callbacks();

    const result = await m.service.switchToObjective({from: 'cycle', to: 'pregnancy', ...cb});

    expect(result).toBe('activated');
    expect(m.onboarding.getActiveObjective()).toBe('pregnancy');
    expect(cb.openHome).toHaveBeenCalledTimes(1);
    expect(cb.openSetup).not.toHaveBeenCalled();
    expect(m.flow.getPendingObjectiveSetup()).toBeNull();
  });

  it('CASE B — a never configured objective starts ITS onboarding chain', async () => {
    await m.onboarding.setActiveObjective('cycle');
    const cb = callbacks();

    const result = await m.service.switchToObjective({from: 'cycle', to: 'pregnancy', ...cb});

    expect(result).toBe('setup-started');
    // The chain's own screens branch on the ACTIVE objective, so it is set.
    expect(m.onboarding.getActiveObjective()).toBe('pregnancy');
    expect(cb.openSetup).toHaveBeenCalledWith('PregnancyDatingSetup');
    expect(cb.openHome).not.toHaveBeenCalled();
    expect(m.flow.getPendingObjectiveSetup()).toEqual({previous: 'cycle', objective: 'pregnancy'});
  });

  it('CASE B for every unconfigured objective opens that objective\'s own first screen', async () => {
    const expected: Record<string, string> = {
      cycle: 'CycleInformation',
      conceive: 'CycleInformation',
      contraception: 'ContraceptionMethod',
      irregular: 'IrregularCyclePattern',
      menopause: 'MenopauseStage',
      pregnancy: 'PregnancyDatingSetup',
      postpartum: 'PostpartumDeliveryDate',
      loss: 'MiscarriageDate',
    };
    for (const objective of ALL) {
      const cb = callbacks();
      await m.onboarding.setActiveObjective(objective === 'cycle' ? 'loss' : 'cycle');
      m.flow.resetObjectiveSetupFlowForTests();
      await m.service.switchToObjective({from: objective === 'cycle' ? 'loss' : 'cycle', to: objective, ...cb});
      expect(cb.openSetup).toHaveBeenCalledWith(expected[objective]);
    }
  });

  it('does nothing when the objective is unchanged', async () => {
    const cb = callbacks();
    const result = await m.service.switchToObjective({from: 'cycle', to: 'cycle', ...cb});
    expect(result).toBe('unchanged');
    expect(cb.openHome).not.toHaveBeenCalled();
    expect(cb.openSetup).not.toHaveBeenCalled();
  });

  it('never deletes data: Cycle → Pregnancy → Postpartum → Cycle still finds the Cycle data', async () => {
    m.onboarding.setCyclePreferences(cyclePrefs());
    await m.onboarding.setActiveObjective('cycle');
    await m.postpartum.confirmDelivery(new Date(2026, 8, 10));
    const cb = callbacks();

    await m.service.switchToObjective({from: 'cycle', to: 'pregnancy', ...cb}); // unconfigured → setup
    m.flow.completeObjectiveSetup();
    await m.pregnancy.setPregnancyDating({method: 'lastPeriod', date: new Date(2026, 5, 1).toISOString()});
    await m.service.switchToObjective({from: 'pregnancy', to: 'postpartum', ...cb}); // configured
    await m.service.switchToObjective({from: 'postpartum', to: 'cycle', ...cb}); // configured

    expect(m.onboarding.getActiveObjective()).toBe('cycle');
    expect(m.onboarding.getHasConfirmedCycleData()).toBe(true);
    expect(m.onboarding.getCyclePreferences().cycleDuration).toBe(28);
    expect(m.onboarding.getRecordedPeriodHistory()).toHaveLength(1);
    expect(m.postpartum.getPostpartumPreferences().deliveryDate).toBe(new Date(2026, 8, 10).toLocaleDateString('en-CA'));
    expect(m.pregnancy.getPregnancyDating().date).not.toBeNull();
    // The stored cycle blob is untouched in AsyncStorage as well.
    expect(await AsyncStorage.getItem('@hawa/cycle-preferences')).not.toBeNull();
  });
});

describe('objective setup flow — finishing and backing out', () => {
  const navigation = () => ({navigate: jest.fn(), reset: jest.fn()});

  it('first-launch onboarding is unchanged: the chain still continues to SecuritySetup', () => {
    const nav = navigation();
    m.flow.continueAfterObjectiveSetup(nav);
    expect(nav.navigate).toHaveBeenCalledWith('SecuritySetup');
    expect(nav.reset).not.toHaveBeenCalled();
  });

  it('an in-app setup flow ends on the dashboard instead of the security/auth tail', () => {
    const nav = navigation();
    m.flow.beginObjectiveSetup('cycle', 'pregnancy');
    m.flow.continueAfterObjectiveSetup(nav);
    expect(nav.reset).toHaveBeenCalledWith({index: 0, routes: [{name: 'MainTabs', params: {screen: 'CycleHome'}}]});
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(m.flow.getPendingObjectiveSetup()).toBeNull();
  });

  it('Back out of an unfinished chain restores the previous objective', async () => {
    await m.onboarding.setActiveObjective('cycle');
    const cb = {openHome: jest.fn(), openSetup: jest.fn()};
    await m.service.switchToObjective({from: 'cycle', to: 'menopause', ...cb});
    expect(m.onboarding.getActiveObjective()).toBe('menopause');

    const restored = await m.flow.cancelPendingObjectiveSetup();

    expect(restored).toBe('cycle');
    expect(m.onboarding.getActiveObjective()).toBe('cycle');
    expect(m.flow.getPendingObjectiveSetup()).toBeNull();
    expect(await AsyncStorage.getItem('@hawa/active-objective')).toBe('cycle');
  });

  it('cancel is a no-op when nothing is pending', async () => {
    await m.onboarding.setActiveObjective('pregnancy');
    await expect(m.flow.cancelPendingObjectiveSetup()).resolves.toBeNull();
    expect(m.onboarding.getActiveObjective()).toBe('pregnancy');
  });
});
