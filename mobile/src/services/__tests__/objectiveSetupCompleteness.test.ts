import AsyncStorage from '@react-native-async-storage/async-storage';

// M1 — an objective is "configured" only once every REQUIRED step of ITS OWN
// onboarding chain is complete (not merely once its first answer exists), and
// switching to a partly configured objective resumes at the first incomplete
// step. The required/optional split below is derived from the real onboarding
// screens (see the doc comment of getSetupSteps in services/objectiveSwitch.ts).
//
// Every store is a module singleton, so each test loads a FRESH copy of the
// graph on top of an empty AsyncStorage (same pattern as objectiveSwitch.test.ts).
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

const confirmCycle = () =>
  m.onboarding.setCyclePreferences({
    lastPeriodStart: new Date(2026, 8, 1),
    periodDuration: 5,
    cycleDuration: 28,
    regularity: 'yes',
  });

const resume = (objective: Parameters<Modules['service']['getObjectiveResumeRoute']>[0]) =>
  m.service.getObjectiveResumeRoute(objective);
const configured = (objective: Parameters<Modules['service']['isObjectiveConfigured']>[0]) =>
  m.service.isObjectiveConfigured(objective);

describe('no data at all', () => {
  it.each([
    ['cycle', 'CycleInformation'],
    ['conceive', 'CycleInformation'],
    ['contraception', 'ContraceptionMethod'],
    ['irregular', 'IrregularCyclePattern'],
    ['menopause', 'MenopauseStage'],
    ['pregnancy', 'PregnancyDatingSetup'],
    ['postpartum', 'PostpartumDeliveryDate'],
    ['loss', 'MiscarriageDate'],
  ] as const)('%s is unconfigured and resumes at the start of its own chain (%s)', async (objective, route) => {
    await expect(configured(objective)).resolves.toBe(false);
    await expect(resume(objective)).resolves.toBe(route);
  });
});

describe('cycle', () => {
  it('is configured once cycle data is confirmed (its reminders step is optional)', async () => {
    await expect(configured('cycle')).resolves.toBe(false);
    confirmCycle();
    await expect(configured('cycle')).resolves.toBe(true);
    await expect(resume('cycle')).resolves.toBeNull();
  });
});

describe('conceive', () => {
  it('first step only (trying duration) is NOT configured', async () => {
    confirmCycle();
    await m.conception.setConceptionPreferences({tryingDuration: 'under_3_months'});
    await expect(configured('conceive')).resolves.toBe(false);
    await expect(resume('conceive')).resolves.toBe('ConceptionOvulationAwareness');
  });

  it('resumes at each next required step', async () => {
    await m.conception.setConceptionPreferences({tryingDuration: 'under_3_months'});
    // Conception answers exist but the cycle data was never confirmed.
    await expect(resume('conceive')).resolves.toBe('CycleInformation');
    confirmCycle();
    await expect(resume('conceive')).resolves.toBe('ConceptionOvulationAwareness');
    await m.conception.setConceptionPreferences({ovulationAwareness: 'often'});
    await expect(resume('conceive')).resolves.toBe('ConceptionIndicators');
  });

  it('is configured with cycle data + all three required answers; reminders stay optional', async () => {
    confirmCycle();
    await m.conception.setConceptionPreferences({
      tryingDuration: 'starting_now',
      ovulationAwareness: 'not_really',
      indicators: ['cervical_mucus'],
    });
    // Every reminder is still off (opt-in, skipped).
    expect(Object.values(m.conception.getConceptionPreferences().reminders).some(Boolean)).toBe(false);
    await expect(configured('conceive')).resolves.toBe(true);
  });
});

describe('contraception', () => {
  it('method only is NOT configured', async () => {
    await m.contraception.setContraceptionPreferences({method: 'ring'});
    await expect(configured('contraception')).resolves.toBe(false);
    await expect(resume('contraception')).resolves.toBe('ContraceptionInformation');
  });

  it('start date without the pause answer is NOT configured; "Non" (false) is a real answer', async () => {
    await m.contraception.setContraceptionPreferences({method: 'patch', methodStartDate: '2026-08-01'});
    await expect(configured('contraception')).resolves.toBe(false);
    await m.contraception.setContraceptionPreferences({hasTreatmentBreak: false});
    await expect(configured('contraception')).resolves.toBe(true);
  });

  it('ring / patch / other need no pill schedule', async () => {
    await m.contraception.setContraceptionPreferences({method: 'other', methodStartDate: '2026-08-01', hasTreatmentBreak: true});
    await expect(configured('contraception')).resolves.toBe(true);
  });

  it('pill additionally needs its schedule (an explicit "unknown" counts as an answer)', async () => {
    await m.contraception.setContraceptionPreferences({method: 'pill', methodStartDate: '2026-08-01', hasTreatmentBreak: true});
    await expect(configured('contraception')).resolves.toBe(false);
    await expect(resume('contraception')).resolves.toBe('PillSchedule');
    await m.contraception.setContraceptionPreferences({pillScheduleType: 'unknown'});
    await expect(configured('contraception')).resolves.toBe(true);
  });
});

describe('irregular (SOPK)', () => {
  it('cycle pattern only is NOT configured', async () => {
    await m.irregular.setIrregularPreferences({cyclePattern: 'irregular'});
    await expect(configured('irregular')).resolves.toBe(false);
    // The optional last-period step precedes the missing required one and is re-offered.
    await expect(resume('irregular')).resolves.toBe('IrregularLastPeriod');
  });

  it('pattern + last period without tracked items resumes at the tracked items', async () => {
    await m.irregular.setIrregularPreferences({cyclePattern: 'very_variable', lastPeriodDate: '2026-08-20'});
    await expect(resume('irregular')).resolves.toBe('IrregularTrackedItems');
  });

  it('is configured with pattern + tracked items even when the last period was skipped', async () => {
    await m.irregular.setIrregularPreferences({cyclePattern: 'unknown', trackedItems: ['mood']});
    expect(m.irregular.getIrregularPreferences().lastPeriodDate).toBeNull();
    await expect(configured('irregular')).resolves.toBe(true);
  });
});

describe('menopause', () => {
  it('stage only is NOT configured', async () => {
    await m.menopause.setMenopauseStage('menopause');
    await expect(configured('menopause')).resolves.toBe(false);
    await expect(resume('menopause')).resolves.toBe('MenopauseSymptoms');
  });

  it('resumes at the first incomplete required step', async () => {
    await m.menopause.setMenopauseStage('menopause');
    await m.menopause.setMenopauseTrackedSymptoms(['hot_flashes']);
    await expect(resume('menopause')).resolves.toBe('MenopauseHormonalTreatment');
    await m.menopause.setMenopauseHormonalTreatmentStatus('not_now');
    await expect(resume('menopause')).resolves.toBe('MenopauseLabTracking');
  });

  it('is configured with stage + treatment + labs; an empty symptom selection is allowed', async () => {
    await m.menopause.setMenopauseStage('unsure');
    await m.menopause.setMenopauseHormonalTreatmentStatus('no');
    await m.menopause.setMenopauseLabTracking('none');
    expect(m.menopause.getMenopausePreferences().trackedSymptoms).toEqual([]);
    await expect(configured('menopause')).resolves.toBe(true);
  });
});

describe('pregnancy', () => {
  it('the untouched default is NOT configured', async () => {
    await expect(configured('pregnancy')).resolves.toBe(false);
  });

  it('a real dating date or the explicit "later" answer is configured (tracking/reminder steps are optional)', async () => {
    await m.pregnancy.setPregnancyDating({method: 'later', date: null});
    await expect(configured('pregnancy')).resolves.toBe(true);
    await m.pregnancy.setPregnancyDating({method: 'dueDate', date: new Date(2027, 1, 1).toISOString()});
    await expect(configured('pregnancy')).resolves.toBe(true);
  });
});

describe('postpartum', () => {
  it('is configured once the delivery date is confirmed (type / feeding are skippable)', async () => {
    await expect(configured('postpartum')).resolves.toBe(false);
    await m.postpartum.confirmDelivery(new Date(2026, 8, 10));
    const prefs = m.postpartum.getPostpartumPreferences();
    expect(prefs.deliveryType).toBeNull();
    expect(prefs.feedingType).toBeNull();
    await expect(configured('postpartum')).resolves.toBe(true);
  });
});

describe('loss', () => {
  it('date only is NOT configured', async () => {
    await m.miscarriage.setMiscarriageDate(new Date(2026, 8, 10));
    await expect(configured('loss')).resolves.toBe(false);
    await expect(resume('loss')).resolves.toBe('MiscarriageBleeding');
  });

  it('resumes at each next required step', async () => {
    await m.miscarriage.setMiscarriageDate(new Date(2026, 8, 10));
    await m.miscarriage.setMiscarriageBleedingStatus('variable');
    await expect(resume('loss')).resolves.toBe('MiscarriageCycleReturn');
    await m.miscarriage.setMiscarriageCycleReturnStatus('no');
    await expect(resume('loss')).resolves.toBe('MiscarriageTryingAgain');
  });

  it('is configured with the date and the three follow-up answers (reminders optional)', async () => {
    await m.miscarriage.setMiscarriageDate(new Date(2026, 8, 10));
    await m.miscarriage.setMiscarriageBleedingStatus('no');
    // A cycle-return date is an event that already happened (M36): never after today
    // (real clock 2026-09-26) and never before the loss date (2026-09-10).
    await m.miscarriage.setMiscarriageCycleReturnStatus('yes', new Date(2026, 8, 20));
    await m.miscarriage.setMiscarriageTryingAgainStatus('soon');
    expect(m.miscarriage.getMiscarriagePreferences().dailyTrackingReminderEnabled).toBe(false);
    await expect(configured('loss')).resolves.toBe(true);
  });
});

describe('switchToObjective — resume vs dashboard', () => {
  const callbacks = () => ({openHome: jest.fn(), openSetup: jest.fn()});

  it('a partially configured objective resumes its chain (setup-started) at the first incomplete step', async () => {
    await m.onboarding.setActiveObjective('cycle');
    await m.miscarriage.setMiscarriageDate(new Date(2026, 8, 10));
    await m.miscarriage.setMiscarriageBleedingStatus('no');
    const cb = callbacks();

    const result = await m.service.switchToObjective({from: 'cycle', to: 'loss', ...cb});

    expect(result).toBe('setup-started');
    expect(cb.openSetup).toHaveBeenCalledWith('MiscarriageCycleReturn');
    expect(cb.openHome).not.toHaveBeenCalled();
    expect(m.onboarding.getActiveObjective()).toBe('loss');
    expect(m.flow.getPendingObjectiveSetup()).toEqual({previous: 'cycle', objective: 'loss'});
    // Nothing partial was deleted or completed.
    expect(m.miscarriage.getMiscarriagePreferences()).toMatchObject({bleedingStatus: 'no', cycleReturnStatus: null});
  });

  it('a conceive with only its first step resumes at its second step', async () => {
    await m.onboarding.setActiveObjective('cycle');
    confirmCycle();
    await m.conception.setConceptionPreferences({tryingDuration: 'over_1_year'});
    const cb = callbacks();
    await expect(m.service.switchToObjective({from: 'cycle', to: 'conceive', ...cb})).resolves.toBe('setup-started');
    expect(cb.openSetup).toHaveBeenCalledWith('ConceptionOvulationAwareness');
  });

  it('a pill user without a schedule resumes at the pill schedule', async () => {
    await m.onboarding.setActiveObjective('cycle');
    await m.contraception.setContraceptionPreferences({method: 'pill', methodStartDate: '2026-08-01', hasTreatmentBreak: false});
    const cb = callbacks();
    await expect(m.service.switchToObjective({from: 'cycle', to: 'contraception', ...cb})).resolves.toBe('setup-started');
    expect(cb.openSetup).toHaveBeenCalledWith('PillSchedule');
  });

  it('a fully configured objective opens its dashboard (activated), no pending setup', async () => {
    await m.onboarding.setActiveObjective('cycle');
    await m.menopause.setMenopauseStage('perimenopause');
    await m.menopause.setMenopauseHormonalTreatmentStatus('track');
    await m.menopause.setMenopauseLabTracking('both');
    const cb = callbacks();

    const result = await m.service.switchToObjective({from: 'cycle', to: 'menopause', ...cb});

    expect(result).toBe('activated');
    expect(cb.openHome).toHaveBeenCalledTimes(1);
    expect(cb.openSetup).not.toHaveBeenCalled();
    expect(m.onboarding.getActiveObjective()).toBe('menopause');
    expect(m.flow.getPendingObjectiveSetup()).toBeNull();
    expect(await AsyncStorage.getItem('@hawa/pending-objective-setup/v1')).toBeNull();
  });

  it('Back out of a resumed chain restores the previous objective and keeps the partial data', async () => {
    await m.onboarding.setActiveObjective('pregnancy');
    await m.irregular.setIrregularPreferences({cyclePattern: 'irregular'});
    const cb = callbacks();
    await m.service.switchToObjective({from: 'pregnancy', to: 'irregular', ...cb});
    expect(cb.openSetup).toHaveBeenCalledWith('IrregularLastPeriod');

    await expect(m.flow.cancelPendingObjectiveSetup()).resolves.toBe('pregnancy');

    expect(m.onboarding.getActiveObjective()).toBe('pregnancy');
    expect(m.irregular.getIrregularPreferences().cyclePattern).toBe('irregular');
    await expect(configured('irregular')).resolves.toBe(false);
  });
});
