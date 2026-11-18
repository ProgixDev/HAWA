import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import CycleInformationScreen from '../CycleInformationScreen';
import {
  getCyclePreferences,
  getCycleObservationStartedAt,
  getPeriodEndDateTime,
  getPeriodHistory,
  getRecordedPeriodHistory,
  reloadCycleStateFromStorage,
  setCyclePreferences,
  setHasCompletedOnboarding,
  setPeriodEndDateTime,
  setSelectedObjective,
  type ObjectiveId,
} from '../../state/onboardingPreferences';
import {getConfirmedPeriodHistory, recordConfirmedPeriodEnd, removeConfirmedPeriodOccurrence} from '../../state/confirmedPeriodHistoryStore';
import {LOCAL_ACCOUNT_ID} from '../../state/accountScope';
import {activateProfile, createLocalAccount} from '../../state/localAccounts';
import {setAppLanguage} from '../../state/themePreferences';
import {resetSaveFailureForTests} from '../../services/saveFailure';
import {computeCyclePredictionStatus} from '../../utils/cycleMath';
import i18n from '../../i18n';

// PHASE 4 — cycle configuration (CycleInformationScreen). The real screen over the real cycle stores: what is validated, what is written (and
// what is NOT, when a draft is refused), the state afterwards, and a refused/failed write that must neither announce a save nor navigate.
// Already covered elsewhere and not repeated here: ProfileConfigEditPaths (rows, prefill, unchanged saves, habits edit, onboarding → reminders).
// Dates are deterministic: only `Date` is faked ("today" = Thu 20 Aug 2026, 12:00 local); timers stay real.

const TODAY = new Date(2026, 7, 20, 12, 0, 0);
const START = new Date(2026, 7, 5, 12, 0, 0);
const END = new Date(2026, 7, 9, 12, 0, 0);
const CYCLE_KEY = '@hawa/cycle-preferences';

const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];
const realStorage = {
  setItem: (AsyncStorage.setItem as jest.Mock).getMockImplementation(),
};

const settle = async () => {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await new Promise<void>(resolve => setImmediate(resolve));
    });
  }
};

type Navigation = {navigate: jest.Mock; goBack: jest.Mock; replace: jest.Mock; reset: jest.Mock};

async function mount(params: Record<string, unknown>) {
  const navigation: Navigation = {navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn(), reset: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <CycleInformationScreen navigation={navigation as never} route={{key: 'k', name: 'CycleInformation', params} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  renderers.push(renderer);
  await settle();
  return {renderer, navigation};
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);

// The innermost pressable carrying the label (a modal backdrop also "contains" every option).
const findButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );
  return matches.find(match => !matches.some(other => other !== match && match.findAll(node => node === other).length > 0));
};

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const target = findButton(renderer, label);
  if (!target) {throw new Error(`No button "${label}"`);}
  await act(async () => {
    await target.props.onPress();
  });
  await settle();
}

// a day of the open calendar (the day cells are the only pressables with a 4 px hit slop)
async function pickDay(renderer: ReactTestRenderer.ReactTestRenderer, day: number) {
  const cell = renderer.root.find(
    node => node.type === Pressable && node.props.hitSlop === 4 && node.findAllByType(Text).some(text => textOf(text) === String(day)),
  );
  await act(async () => {
    cell.props.onPress();
  });
  await settle();
}

const dayKey = (date: Date | null) => (date ? date.toLocaleDateString('en-CA') : null);
const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
const yes = () => t('journalIntimacy.yes');
const no = () => t('journalIntimacy.no');
const save = () => t('common.save');
const startField = () => t('cycleInformation.choosePeriodStartDate');
const endField = () => t('cycleInformation.choosePeriodEndDate');
const days = (count: number) => t('averageCycle.days', {count});

// a stored cycle: period 5–9 Aug (confirmed), 5 days / 28 days / regular
async function seedConfirmedCycle() {
  await setSelectedObjective('cycle');
  await setCyclePreferences({lastPeriodStart: START, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
  await setPeriodEndDateTime(END);
  await recordConfirmedPeriodEnd(START, END);
}

const failWrites = (matches: string) =>
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    if (key.includes(matches)) {throw new Error('disk full');}
    return realStorage.setItem?.(key, value);
  });
const restoreWrites = () => (AsyncStorage.setItem as jest.Mock).mockImplementation(realStorage.setItem);

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.useFakeTimers({
    now: TODAY,
    doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'hrtime'],
  });
  restoreWrites();
  resetSaveFailureForTests();
  await AsyncStorage.clear();
  await reloadCycleStateFromStorage();
  for (const occurrence of getConfirmedPeriodHistory()) {
    await removeConfirmedPeriodOccurrence(new Date(occurrence.periodStart));
  }
  await setPeriodEndDateTime(null);
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  restoreWrites();
  alertSpy.mockRestore();
  jest.useRealTimers();
  act(() => {
    renderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('dates of the last period: what is refused, and that nothing is written', () => {
  beforeEach(seedConfirmedCycle);

  it('a start date in the future is refused: error under the field, nothing written, no navigation', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, startField());
    await pickDay(renderer, 25); // 25 Aug 2026 > today
    await press(renderer, save());
    expect(textsOf(renderer)).toContain(t('cycleInformation.futureDateError'));
    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe('2026-08-05');
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('picking a valid date afterwards removes the error and the save goes through', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, startField());
    await pickDay(renderer, 25);
    await press(renderer, save());
    expect(textsOf(renderer)).toContain(t('cycleInformation.futureDateError'));
    await press(renderer, startField());
    await pickDay(renderer, 4);
    expect(textsOf(renderer)).not.toContain(t('cycleInformation.futureDateError'));
    await press(renderer, save());
    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe('2026-08-04');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('"ended: yes" without an end date is refused', async () => {
    await setPeriodEndDateTime(null);
    await removeConfirmedPeriodOccurrence(START);
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, yes());
    await press(renderer, save());
    expect(textsOf(renderer)).toContain(t('cycleInformation.missingEndDateError'));
    expect(getPeriodEndDateTime()).toBeNull();
    expect(getConfirmedPeriodHistory()).toEqual([]);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('an end date before the start is refused, an end date in the future too', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, endField());
    await pickDay(renderer, 2); // before 5 Aug
    await press(renderer, save());
    expect(textsOf(renderer)).toContain(t('cycleInformation.endBeforeStartError'));
    await press(renderer, endField());
    await pickDay(renderer, 28); // after today
    await press(renderer, save());
    expect(textsOf(renderer)).toContain(t('cycleInformation.futureDateError'));
    expect(textsOf(renderer)).not.toContain(t('cycleInformation.endBeforeStartError'));
    expect(dayKey(getPeriodEndDateTime())).toBe('2026-08-09');
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('answering "no" hides the end date and drops its error', async () => {
    const {renderer} = await mount({mode: 'edit'});
    await press(renderer, endField());
    await pickDay(renderer, 2);
    await press(renderer, save());
    expect(textsOf(renderer)).toContain(t('cycleInformation.endBeforeStartError'));
    await press(renderer, no());
    expect(textsOf(renderer)).not.toContain(t('cycleInformation.endBeforeStartError'));
    expect(findButton(renderer, endField())).toBeUndefined();
  });

  it('a stored end older than the start is not shown as if it ended this period', async () => {
    await setPeriodEndDateTime(new Date(2026, 6, 1, 12, 0, 0));
    const {renderer} = await mount({mode: 'edit'});
    expect(findButton(renderer, endField())).toBeUndefined();
  });

  it('the calendar moves by month and a day of the previous month can be chosen', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, startField());
    await press(renderer, t('calendar.previousMonth'));
    await pickDay(renderer, 28); // 28 Jul 2026
    await press(renderer, no()); // (the end of the period is then not required)
    await press(renderer, save());
    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe('2026-07-28');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});

describe('what a save writes, and what it takes back', () => {
  beforeEach(seedConfirmedCycle);

  it('"yes" with a new end: the end, the confirmed occurrence and the period history all agree', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, endField());
    await pickDay(renderer, 8);
    await press(renderer, save());
    expect(dayKey(getPeriodEndDateTime())).toBe('2026-08-08');
    const confirmed = getConfirmedPeriodHistory();
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0].id).toBe('2026-08-05');
    expect(dayKey(new Date(confirmed[0].periodEndDateTime))).toBe('2026-08-08');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('the onboarding of ANOTHER local profile keeps its answers in its own records and never writes the shared confirmed-period history', async () => {
    const sharedBefore = getConfirmedPeriodHistory();
    const created = await createLocalAccount('onboarding@example.com');
    if (!created.ok) {throw new Error('unreachable');}
    try {
      await activateProfile(created.account.id); // its onboarding is NOT complete
      await setCyclePreferences({lastPeriodStart: START, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
      await setPeriodEndDateTime(END);
      const {renderer, navigation} = await mount({mode: 'edit'});
      await press(renderer, endField());
      await pickDay(renderer, 8);
      await press(renderer, save());

      expect(navigation.goBack).toHaveBeenCalledTimes(1);
      expect(dayKey(getPeriodEndDateTime())).toBe('2026-08-08'); // its own period end
      expect(getConfirmedPeriodHistory()).toEqual(sharedBefore); // the shared medical history: not appended, not edited
    } finally {
      await activateProfile(LOCAL_ACCOUNT_ID);
    }
    // the original profile still has exactly its own period end and the same shared history
    expect(dayKey(getPeriodEndDateTime())).toBe('2026-08-09');
    expect(getConfirmedPeriodHistory()).toEqual(sharedBefore);
  });

  it('once the local profile\'s onboarding is complete, a genuine confirmation IS recorded in the shared history (the guard is about initialisation only)', async () => {
    const created = await createLocalAccount('genuine@example.com');
    if (!created.ok) {throw new Error('unreachable');}
    try {
      await activateProfile(created.account.id);
      await setHasCompletedOnboarding(true);
      await setCyclePreferences({lastPeriodStart: START, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
      await setPeriodEndDateTime(END);
      const {renderer} = await mount({mode: 'edit'});
      await press(renderer, endField());
      await pickDay(renderer, 8);
      await press(renderer, save());
      expect(getConfirmedPeriodHistory().map(item => dayKey(new Date(item.periodEndDateTime)))).toContain('2026-08-08');
    } finally {
      await activateProfile(LOCAL_ACCOUNT_ID);
    }
  });

  it('"no": the end is cleared and the confirmed occurrence of THIS period is retracted; an older confirmed period stays', async () => {
    await setCyclePreferences({lastPeriodStart: new Date(2026, 6, 8, 12, 0, 0), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await recordConfirmedPeriodEnd(new Date(2026, 6, 8, 12, 0, 0), new Date(2026, 6, 12, 12, 0, 0));
    await setCyclePreferences({lastPeriodStart: START, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await setPeriodEndDateTime(END);
    expect(getConfirmedPeriodHistory().map(item => item.id).sort()).toEqual(['2026-07-08', '2026-08-05']);

    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, no());
    await press(renderer, save());
    expect(getPeriodEndDateTime()).toBeNull();
    expect(getConfirmedPeriodHistory().map(item => item.id)).toEqual(['2026-07-08']);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('moving the start of the confirmed latest period corrects it: the old start leaves the history, the new one takes its place', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, startField());
    await pickDay(renderer, 3);
    await press(renderer, save());
    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe('2026-08-03');
    expect(getPeriodHistory().map(record => record.startDate)).toContain('2026-08-03');
    expect(getPeriodHistory().map(record => record.startDate)).not.toContain('2026-08-05');
    expect(getConfirmedPeriodHistory().map(item => item.id)).toEqual(['2026-08-03']);
    expect(dayKey(getPeriodEndDateTime())).toBe('2026-08-09');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('a correction that would overlap an earlier period falls back to the plain save, without an error message', async () => {
    await setCyclePreferences({lastPeriodStart: new Date(2026, 6, 10, 12, 0, 0), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await setCyclePreferences({lastPeriodStart: START, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, startField());
    await press(renderer, t('calendar.previousMonth'));
    await pickDay(renderer, 12); // 12 Jul: inside 10–14 Jul
    await press(renderer, no());
    await press(renderer, save());
    expect(alertSpy).not.toHaveBeenCalled();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe('2026-07-12');
  });

  it('the shortest and longest durations on offer can be chosen and are stored', async () => {
    const {renderer} = await mount({mode: 'edit', section: 'habits'});
    await press(renderer, days(5));
    const options = (label: number) => Boolean(findButton(renderer, days(label)));
    expect([options(2), options(10), options(1), options(11)]).toEqual([true, true, false, false]);
    await press(renderer, days(2));
    await press(renderer, days(28));
    expect([options(20), options(40), options(19), options(41)]).toEqual([true, true, false, false]);
    await press(renderer, days(40));
    await press(renderer, save());
    expect(getCyclePreferences().periodDuration).toBe(2);
    expect(getCyclePreferences().cycleDuration).toBe(40);
  });

  it('"I don\'t know" starts an observation window at the period start, and saving again keeps it', async () => {
    const {renderer} = await mount({mode: 'edit', section: 'habits'});
    await press(renderer, t('managedProfile.cycleSetup.unknown'));
    await press(renderer, save());
    expect(getCyclePreferences().regularity).toBe('unknown');
    expect(dayKey(getCycleObservationStartedAt())).toBe('2026-08-05');

    const again = await mount({mode: 'edit', section: 'habits'});
    await press(again.renderer, days(5));
    await press(again.renderer, days(6));
    await press(again.renderer, save());
    expect(getCyclePreferences().periodDuration).toBe(6);
    expect(dayKey(getCycleObservationStartedAt())).toBe('2026-08-05');
  });

  it('the dates and durations are read back from storage after a restart', async () => {
    const {renderer} = await mount({mode: 'edit'});
    await press(renderer, startField());
    await pickDay(renderer, 4);
    await press(renderer, days(28));
    await press(renderer, days(31));
    await press(renderer, save());
    await reloadCycleStateFromStorage();
    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe('2026-08-04');
    expect(getCyclePreferences().cycleDuration).toBe(31);
    expect(getRecordedPeriodHistory().map(record => record.startDate)).toContain('2026-08-04');
  });
});

describe('predictions follow the saved configuration', () => {
  const nextPeriod = () => {
    const prefs = getCyclePreferences();
    return computeCyclePredictionStatus(prefs, prefs.regularity, getRecordedPeriodHistory().map(record => new Date(`${record.startDate}T12:00:00`)), getCycleObservationStartedAt(), TODAY);
  };

  beforeEach(seedConfirmedCycle);

  it('a longer cycle moves the predicted next period by the same number of days', async () => {
    const before = nextPeriod();
    expect(before.mode).toBe('exact');
    const {renderer} = await mount({mode: 'edit', section: 'habits'});
    await press(renderer, days(28));
    await press(renderer, days(30));
    await press(renderer, save());
    const after = nextPeriod();
    expect(after.mode).toBe('exact');
    if (before.mode === 'exact' && after.mode === 'exact') {
      expect(dayKey(before.date)).toBe('2026-09-02'); // 5 Aug + 28
      expect(dayKey(after.date)).toBe('2026-09-04'); // 5 Aug + 30
      expect(after.averageCycleLength).toBe(30);
    }
  });

  it('answering "no" to the regularity switches the prediction from one exact date to a window', async () => {
    expect(nextPeriod().mode).toBe('exact');
    const {renderer} = await mount({mode: 'edit', section: 'habits'});
    await press(renderer, no());
    await press(renderer, save());
    expect(getCyclePreferences().regularity).toBe('no');
    expect(nextPeriod().mode).toBe('window');
  });

  it('a new last-period start moves the prediction with it', async () => {
    const {renderer} = await mount({mode: 'edit'});
    await press(renderer, startField());
    await pickDay(renderer, 3);
    await press(renderer, save());
    const after = nextPeriod();
    expect(after.mode === 'exact' && dayKey(after.date)).toBe('2026-08-31'); // 3 Aug + 28
  });
});

describe('a refused or failed write: no false confirmation, no navigation, the draft stays', () => {
  beforeEach(seedConfirmedCycle);

  it('habits edit: the alert is shown once, the stored values are back to what they were, the screen keeps the choice, and a retry saves', async () => {
    const {renderer, navigation} = await mount({mode: 'edit', section: 'habits'});
    await press(renderer, days(28));
    await press(renderer, days(30));
    failWrites(CYCLE_KEY);
    await press(renderer, save());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe(t('saveFailure.title'));
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(getCyclePreferences().cycleDuration).toBe(28); // rolled back in memory
    expect(textsOf(renderer)).toContain(days(30)); // the draft is still there

    restoreWrites();
    await press(renderer, save());
    expect(getCyclePreferences().cycleDuration).toBe(30);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it('full edit: a refused write of the cycle shows the alert, does not navigate and does not leave a new end behind', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, endField());
    await pickDay(renderer, 8);
    failWrites(CYCLE_KEY);
    await press(renderer, save());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(dayKey(getPeriodEndDateTime())).toBe('2026-08-09');
    expect(getConfirmedPeriodHistory().map(item => dayKey(new Date(item.periodEndDateTime)))).toEqual(['2026-08-09']);
  });

  it('onboarding: a failed write does not continue to the next step', async () => {
    await setSelectedObjective('cycle');
    const {renderer, navigation} = await mount({});
    failWrites(CYCLE_KEY);
    await press(renderer, t('cycleInformation.next'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('the button is free again after a failure (it is not stuck on "saving")', async () => {
    const {renderer} = await mount({mode: 'edit'});
    failWrites(CYCLE_KEY);
    await press(renderer, save());
    expect(textsOf(renderer)).toContain(save());
    expect(textsOf(renderer)).not.toContain(t('periodStartSheet.saving'));
  });
});

describe('where a successful save leads', () => {
  it('a "Configure your cycle" shortcut from a dashboard returns to it instead of continuing the onboarding', async () => {
    await setSelectedObjective('conceive');
    const {renderer, navigation} = await mount({fromDashboardCTA: true});
    await press(renderer, no());
    await press(renderer, t('cycleInformation.next'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it.each([
    ['conceive', 'ConceptionTryingDuration'],
    ['cycle', 'CycleReminders'],
  ] as Array<[ObjectiveId, string]>)('onboarding with the %s objective continues to %s', async (objective, route) => {
    await setSelectedObjective(objective);
    const {renderer, navigation} = await mount({});
    await press(renderer, no());
    await press(renderer, t('cycleInformation.next'));
    expect(navigation.navigate).toHaveBeenCalledWith(route);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});

describe('a second tap while the save is still running', () => {
  const slowWrites = () =>
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
      await new Promise<void>(resolve => setTimeout(resolve, 80));
      return realStorage.setItem?.(key, value);
    });
  const buttonNow = (renderer: ReactTestRenderer.ReactTestRenderer) => (findButton(renderer, save()) ?? findButton(renderer, t('periodStartSheet.saving')))!;
  const tapTwice = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    await act(async () => {
      buttonNow(renderer).props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 30));
    });
    await act(async () => {
      buttonNow(renderer).props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 600));
    });
    await settle();
  };

  beforeEach(seedConfirmedCycle);

  it('full edit: the button is held while saving, so the screen is left once', async () => {
    const {renderer, navigation} = await mount({mode: 'edit'});
    await press(renderer, days(28));
    await press(renderer, days(30));
    slowWrites();
    await tapTwice(renderer);
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(getCyclePreferences().cycleDuration).toBe(30);
  });

  const cycleWrites = (spy: jest.SpyInstance) => spy.mock.calls.filter(call => String(call[0]).includes(CYCLE_KEY)).length;
  const buttonLabelNow = (renderer: ReactTestRenderer.ReactTestRenderer) => textsOf(renderer).find(text => text === save() || text === t('periodStartSheet.saving'));

  describe('habits edit (one in-flight guard, released afterwards)', () => {
    const habits = {mode: 'edit', section: 'habits'};
    const chooseThirty = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
      await press(renderer, days(28));
      await press(renderer, days(30));
    };

    it('two taps 30 ms apart during an 80 ms write: one save, one goBack(), the button is held ("saving") meanwhile', async () => {
      const {renderer, navigation} = await mount(habits);
      await chooseThirty(renderer);
      slowWrites();
      const spy = jest.spyOn(AsyncStorage, 'setItem');
      spy.mockClear();
      await act(async () => {
        buttonNow(renderer).props.onPress();
        await new Promise<void>(resolve => setTimeout(resolve, 30));
      });
      expect(buttonLabelNow(renderer)).toBe(t('periodStartSheet.saving'));
      expect(buttonNow(renderer).props.disabled).toBe(true);
      await act(async () => {
        buttonNow(renderer).props.onPress();
        await new Promise<void>(resolve => setTimeout(resolve, 600));
      });
      await settle();
      expect(cycleWrites(spy)).toBe(1);
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
      expect(getCyclePreferences().cycleDuration).toBe(30);
    });

    it('two calls in the very same tick (before any re-render): one save, one goBack()', async () => {
      const {renderer, navigation} = await mount(habits);
      await chooseThirty(renderer);
      const spy = jest.spyOn(AsyncStorage, 'setItem');
      spy.mockClear();
      const target = buttonNow(renderer);
      await act(async () => {
        await Promise.all([target.props.onPress(), target.props.onPress()]);
      });
      await settle();
      expect(cycleWrites(spy)).toBe(1);
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('after a successful save the button is usable again (the guard is released)', async () => {
      const {renderer, navigation} = await mount(habits);
      await chooseThirty(renderer);
      await press(renderer, save());
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
      expect(buttonLabelNow(renderer)).toBe(save());
      expect(buttonNow(renderer).props.disabled).toBeFalsy();
      await press(renderer, days(30));
      await press(renderer, days(33));
      await press(renderer, save());
      expect(getCyclePreferences().cycleDuration).toBe(33);
      expect(navigation.goBack).toHaveBeenCalledTimes(2); // a second, deliberate save is a second save
    });

    it('after a failed save the guard is released too: the button is usable again and the retry saves once', async () => {
      const {renderer, navigation} = await mount(habits);
      await chooseThirty(renderer);
      failWrites(CYCLE_KEY);
      await press(renderer, save());
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(navigation.goBack).not.toHaveBeenCalled();
      expect(buttonLabelNow(renderer)).toBe(save());
      expect(buttonNow(renderer).props.disabled).toBeFalsy();

      restoreWrites();
      const spy = jest.spyOn(AsyncStorage, 'setItem');
      spy.mockClear();
      await act(async () => {
        await Promise.all([buttonNow(renderer).props.onPress(), buttonNow(renderer).props.onPress()]);
      });
      await settle();
      expect(cycleWrites(spy)).toBe(1);
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
      expect(getCyclePreferences().cycleDuration).toBe(30);
    });
  });
});
