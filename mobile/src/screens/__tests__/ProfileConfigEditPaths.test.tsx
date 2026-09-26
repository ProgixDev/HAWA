import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import CycleInformationScreen from '../CycleInformationScreen';
import {IrregularLastPeriodScreen, IrregularTrackedItemsScreen} from '../irregular/IrregularOnboardingScreens';
import ContraceptionInformationScreen from '../contraception/ContraceptionInformationScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {
  getCyclePreferences,
  getPeriodHistory,
  setCyclePreferences,
  setSelectedObjective,
  type ObjectiveId,
} from '../../state/onboardingPreferences';
import {getConfirmedPeriodHistory, recordConfirmedPeriodEnd} from '../../state/confirmedPeriodHistoryStore';
import {getIrregularPreferences, setIrregularPreferences} from '../../state/irregularPreferences';
import {getContraceptionPreferences, setContraceptionPreferences} from '../../state/contraceptionPreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';

// M11 — post-onboarding edit paths for the Cycle / Conceive / SOPK /
// Contraception configuration. Profile rows open the SAME onboarding screens
// in {mode:'edit'}; those screens prefill from the current store, save only
// their own group, then goBack() — never continuing the onboarding chain.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const visited: string[] = [];

const Recorder = ({name}: {name: string}) => {
  visited.push(name);
  return <Text>{`stub-${name}`}</Text>;
};

// Every step an edit must NOT continue into (onboarding chain + post-setup).
const CHAIN_STUBS = [
  'CycleReminders',
  'ConceptionTryingDuration',
  'IrregularTrackedItems',
  'IrregularReminders',
  'ContraceptionReminders',
  'PillSchedule',
  'SecuritySetup',
  'Privacy',
  'Summary',
  'Auth',
  'Location',
];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderEdit(name: string, Component: React.ComponentType<never>, params: Record<string, unknown>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen component={Component as React.ComponentType} initialParams={params} name={name} />
              {CHAIN_STUBS.filter(route => route !== name).map(route => (
                <Stack.Screen key={route} name={route}>
                  {() => <Recorder name={route} />}
                </Stack.Screen>
              ))}
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (route: string, params?: unknown) => void}).navigate(name, params);
  });
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

// Innermost pressable carrying the label (a modal backdrop Pressable also
// "contains" every option's text but must not be the one pressed).
const findButton = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node =>
      typeof node.props.onPress === 'function' &&
      (node.props.accessibilityLabel === label || node.findAllByType(Text).some(text => textOf(text) === label)),
  );
  return matches.find(match => !matches.some(other => other !== match && match.findAll(node => node === other).length > 0));
};

const buttonWithText = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const match = findButton(renderer, label);
  if (!match) {throw new Error(`No button "${label}"`);}
  return match;
};

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    await buttonWithText(renderer, label).props.onPress();
  });
  await settle();
};

const currentRoute = () => navRef.getCurrentRoute() as {name: string; params?: Record<string, unknown>} | undefined;

const dayKey = (date: Date) => date.toLocaleDateString('en-CA');

beforeEach(() => {
  visited.length = 0;
  resetPremiumStateForTests();
  updatePrivacySecuritySettings({anonymousMode: false});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

afterAll(async () => {
  await setSelectedObjective('cycle');
});

/* ============================================================
   PROFILE ROWS
============================================================ */

const ROW_TITLES = {
  cycle: ['Durée du cycle', 'Durée des règles', 'Régularité du cycle'],
  conceive: ['Durée des essais', 'Repérage de l’ovulation', 'Indicateurs suivis'],
  irregular: ['Dernières règles', 'Éléments suivis'],
  contraception: ['Début du traitement', 'Pause de traitement'],
} as const;

async function renderProfile(objective: ObjectiveId) {
  await setSelectedObjective(objective);
  const navigate = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={{navigate} as never} route={{key: 'p', name: 'Profile'}} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return {renderer, navigate};
}

describe('M11 — Profile configuration rows appear only for the matching objective', () => {
  const ALL_TITLES = Object.values(ROW_TITLES).flat();
  const OBJECTIVES: ObjectiveId[] = ['cycle', 'conceive', 'irregular', 'contraception', 'pregnancy', 'menopause', 'postpartum', 'loss'];

  it.each(OBJECTIVES)('%s shows exactly its own rows', async objective => {
    await setContraceptionPreferences({method: 'pill'});
    const {renderer} = await renderProfile(objective);
    const expected: readonly string[] = objective in ROW_TITLES ? ROW_TITLES[objective as keyof typeof ROW_TITLES] : [];
    for (const title of ALL_TITLES) {
      const present = Boolean(findButton(renderer, title));
      expect({title, present}).toEqual({title, present: expected.includes(title)});
    }
  });

  it('contraception: the treatment-break row is pill-only', async () => {
    await setContraceptionPreferences({method: 'ring'});
    const {renderer} = await renderProfile('contraception');
    expect(findButton(renderer, 'Début du traitement')).toBeTruthy();
    expect(findButton(renderer, 'Pause de traitement')).toBeUndefined();
  });

  it.each([
    ['cycle', 'Durée du cycle', 'CycleInformation', {mode: 'edit', section: 'habits'}],
    ['cycle', 'Durée des règles', 'CycleInformation', {mode: 'edit', section: 'habits'}],
    ['cycle', 'Régularité du cycle', 'CycleInformation', {mode: 'edit', section: 'habits'}],
    ['conceive', 'Durée des essais', 'ConceptionTryingDuration', {mode: 'edit'}],
    ['conceive', 'Repérage de l’ovulation', 'ConceptionOvulationAwareness', {mode: 'edit'}],
    ['conceive', 'Indicateurs suivis', 'ConceptionIndicators', {mode: 'edit'}],
    ['irregular', 'Dernières règles', 'IrregularLastPeriod', {mode: 'edit'}],
    ['irregular', 'Éléments suivis', 'IrregularTrackedItems', {mode: 'edit'}],
    ['contraception', 'Début du traitement', 'ContraceptionInformation', {mode: 'edit'}],
    ['contraception', 'Pause de traitement', 'ContraceptionInformation', {mode: 'edit'}],
  ] as Array<[ObjectiveId, string, string, Record<string, unknown>]>)(
    '%s: "%s" opens %s in edit mode',
    async (objective, title, route, params) => {
      await setContraceptionPreferences({method: 'pill'});
      const {renderer, navigate} = await renderProfile(objective);
      await act(async () => {
        buttonWithText(renderer, title).props.onPress();
      });
      expect(navigate).toHaveBeenCalledWith(route, params);
    },
  );

  it('existing rows are still there (notifications row for each objective, Mon objectif)', async () => {
    const {renderer} = await renderProfile('conceive');
    expect(findButton(renderer, 'Notifications & rappels')).toBeTruthy();
    expect(findButton(renderer, 'Mon objectif')).toBeTruthy();
  });
});

/* ============================================================
   CYCLE — cycle length / period length / regularity
============================================================ */

describe('M11 — Cycle habits edit (CycleInformation, section: habits)', () => {
  const lastStart = new Date(2026, 5, 10, 12, 0, 0);
  const lastEnd = new Date(2026, 5, 14, 12, 0, 0);

  beforeEach(async () => {
    await setSelectedObjective('cycle');
    setCyclePreferences({lastPeriodStart: lastStart, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await recordConfirmedPeriodEnd(lastStart, lastEnd);
  });

  it('prefills the CURRENT values, hides the last-period questions, saves only the habits and goes back', async () => {
    const historyBefore = JSON.stringify(getConfirmedPeriodHistory());
    const renderer = await renderEdit('CycleInformation', CycleInformationScreen as never, {mode: 'edit', section: 'habits'});

    const texts = textsOf(renderer);
    expect(texts).toContain('28 jours');
    expect(texts).toContain('5 jours');
    expect(texts).toContain('Enregistrer');
    expect(texts).not.toContain('Suivant');
    expect(texts).not.toContain('Date de début de tes dernières règles');
    expect(texts).not.toContain('Tes dernières règles sont-elles terminées ?');

    await press(renderer, '28 jours');
    await press(renderer, '30 jours');
    await press(renderer, '5 jours');
    await press(renderer, '6 jours');
    await press(renderer, 'Non');
    await press(renderer, 'Enregistrer');

    const saved = getCyclePreferences();
    expect(saved.cycleDuration).toBe(30);
    expect(saved.periodDuration).toBe(6);
    expect(saved.regularity).toBe('no');
    expect(dayKey(saved.lastPeriodStart)).toBe(dayKey(lastStart));
    expect(JSON.stringify(getConfirmedPeriodHistory())).toBe(historyBefore);
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('each of the three rows can be saved unchanged without altering anything', async () => {
    const before = getCyclePreferences();
    const renderer = await renderEdit('CycleInformation', CycleInformationScreen as never, {mode: 'edit', section: 'habits'});
    await press(renderer, 'Enregistrer');
    const after = getCyclePreferences();
    expect(after).toEqual(before);
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('the full edit (Summary path, no section) keeps asking for the last period and only its label becomes "Enregistrer"', async () => {
    const renderer = await renderEdit('CycleInformation', CycleInformationScreen as never, {mode: 'edit'});
    expect(textsOf(renderer)).toContain('Date de début de tes dernières règles');
    expect(textsOf(renderer)).toContain('Enregistrer');
    await press(renderer, 'Enregistrer');
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('onboarding mode is unchanged: "Suivant" and the onboarding continuation', async () => {
    const renderer = await renderEdit('CycleInformation', CycleInformationScreen as never, {});
    expect(textsOf(renderer)).toContain('Suivant');
    expect(textsOf(renderer)).toContain('Date de début de tes dernières règles');
    await press(renderer, 'Suivant');
    expect(currentRoute()?.name).toBe('CycleReminders');
  });
});

/* ============================================================
   SOPK — last period / tracked items
============================================================ */

describe('M11 — SOPK edit screens (IrregularLastPeriod / IrregularTrackedItems)', () => {
  beforeEach(async () => {
    await setIrregularPreferences({
      cyclePattern: 'irregular',
      lastPeriodDate: '2026-08-15',
      trackedItems: ['acne', 'weight'],
      reminders: {dailyJournalEnabled: true, dailyJournalTime: '20:00', unrecordedPeriodEnabled: true},
    });
  });

  it('last period: prefilled, saved as-is, goBack, nothing else navigated', async () => {
    const renderer = await renderEdit('IrregularLastPeriod', IrregularLastPeriodScreen as never, {mode: 'edit'});
    expect(textsOf(renderer).some(text => text.includes('15') && text.includes('2026'))).toBe(true);
    expect(textsOf(renderer)).toContain('Enregistrer');
    expect(textsOf(renderer)).not.toContain('Suivant');

    await press(renderer, 'Enregistrer');
    expect(getIrregularPreferences().lastPeriodDate).toBe('2026-08-15');
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('last period: "je ne sais pas" clears only that field', async () => {
    const renderer = await renderEdit('IrregularLastPeriod', IrregularLastPeriodScreen as never, {mode: 'edit'});
    await press(renderer, 'Je ne sais pas / Je préfère renseigner plus tard');
    await press(renderer, 'Enregistrer');
    const saved = getIrregularPreferences();
    expect(saved.lastPeriodDate).toBeNull();
    expect(saved.cyclePattern).toBe('irregular');
    expect(saved.trackedItems).toEqual(['acne', 'weight']);
    expect(saved.reminders.dailyJournalTime).toBe('20:00');
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('tracked items: prefilled, edited, saved as its own group, goBack (no IrregularReminders)', async () => {
    const renderer = await renderEdit('IrregularTrackedItems', IrregularTrackedItemsScreen as never, {mode: 'edit'});
    expect(textsOf(renderer)).toContain('Enregistrer');
    expect(textsOf(renderer)).not.toContain('Suivant');

    await press(renderer, 'Douleurs');
    await press(renderer, 'Acné');
    await press(renderer, 'Enregistrer');

    const saved = getIrregularPreferences();
    expect([...saved.trackedItems].sort()).toEqual(['pain', 'weight']);
    expect(saved.lastPeriodDate).toBe('2026-08-15');
    expect(saved.cyclePattern).toBe('irregular');
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('onboarding mode is unchanged: last period still says "Suivant" and continues to tracked items', async () => {
    const renderer = await renderEdit('IrregularLastPeriod', IrregularLastPeriodScreen as never, {});
    expect(textsOf(renderer)).toContain('Suivant');
    await press(renderer, 'Suivant');
    expect(currentRoute()?.name).toBe('IrregularTrackedItems');
  });
});

/* ============================================================
   CONTRACEPTION — treatment start date / treatment break
============================================================ */

describe('M11 — Contraception edit (ContraceptionInformation)', () => {
  it('pill: prefilled, "Enregistrer", unchanged save goes back without touching the pill schedule', async () => {
    await setContraceptionPreferences({
      method: 'pill',
      methodStartDate: '2026-08-01',
      hasTreatmentBreak: true,
      pillScheduleType: 'cyclic',
      activeDays: 21,
      breakDays: 7,
    });
    const renderer = await renderEdit('ContraceptionInformation', ContraceptionInformationScreen as never, {mode: 'edit'});
    expect(textsOf(renderer).some(text => text.includes('août 2026'))).toBe(true);
    expect(textsOf(renderer)).toContain('Enregistrer');
    expect(textsOf(renderer)).not.toContain('Continuer');

    await press(renderer, 'Enregistrer');
    const saved = getContraceptionPreferences();
    expect(saved.methodStartDate).toBe('2026-08-01');
    expect(saved.hasTreatmentBreak).toBe(true);
    expect(saved.pillScheduleType).toBe('cyclic');
    expect(saved.activeDays).toBe(21);
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('pill: changing the break answer re-collects the schedule in EDIT mode (replace), never the reminders step', async () => {
    await setContraceptionPreferences({
      method: 'pill',
      methodStartDate: '2026-08-01',
      hasTreatmentBreak: true,
      pillScheduleType: 'cyclic',
      activeDays: 21,
      breakDays: 7,
    });
    const renderer = await renderEdit('ContraceptionInformation', ContraceptionInformationScreen as never, {mode: 'edit'});
    await press(renderer, 'Non');
    await press(renderer, 'Enregistrer');

    expect(getContraceptionPreferences().hasTreatmentBreak).toBe(false);
    expect(getContraceptionPreferences().pillScheduleType).toBeNull();
    expect(currentRoute()?.name).toBe('PillSchedule');
    expect(currentRoute()?.params).toEqual({mode: 'edit'});
    expect(visited).toEqual(['PillSchedule']);
    expect(visited).not.toContain('ContraceptionReminders');
  });

  it('ring: the pause question is not asked nor rewritten; only the start date is saved', async () => {
    await setContraceptionPreferences({
      method: 'ring',
      methodStartDate: '2026-07-20',
      hasTreatmentBreak: null,
      pillScheduleType: null,
      activeDays: null,
      breakDays: null,
    });
    const renderer = await renderEdit('ContraceptionInformation', ContraceptionInformationScreen as never, {mode: 'edit'});
    expect(textsOf(renderer).some(text => text.includes('pause'))).toBe(false);
    expect(textsOf(renderer)).toContain('Enregistrer');

    await press(renderer, 'Enregistrer');
    expect(getContraceptionPreferences().methodStartDate).toBe('2026-07-20');
    expect(getContraceptionPreferences().hasTreatmentBreak).toBeNull();
    expect(currentRoute()?.name).toBe('Home');
    expect(visited).toEqual([]);
  });

  it('onboarding mode is unchanged: the pause question is asked for every method and pill continues to PillSchedule', async () => {
    await setContraceptionPreferences({
      method: 'ring',
      methodStartDate: '2026-07-20',
      hasTreatmentBreak: false,
    });
    const ringRenderer = await renderEdit('ContraceptionInformation', ContraceptionInformationScreen as never, {});
    expect(textsOf(ringRenderer).some(text => text.includes('pause'))).toBe(true);
    expect(textsOf(ringRenderer)).toContain('Continuer');
    act(() => ringRenderer.unmount());

    await setContraceptionPreferences({method: 'pill', hasTreatmentBreak: true});
    const pillRenderer = await renderEdit('ContraceptionInformation', ContraceptionInformationScreen as never, {});
    await press(pillRenderer, 'Continuer');
    expect(currentRoute()?.name).toBe('PillSchedule');
  });
});

// M4 — the full edit (Summary path) MOVES the existing latest occurrence instead
// of appending a second start, even when the new date is a full cycle away.
describe('M4 — CycleInformation full edit corrects the latest period start', () => {
  it('moving the latest start 21 days forward leaves ONE occurrence (no phantom old start)', async () => {
    await setSelectedObjective('cycle');
    setCyclePreferences({lastPeriodStart: new Date(2026, 4, 12, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    setCyclePreferences({lastPeriodStart: new Date(2026, 5, 10, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const before = getPeriodHistory().map(record => record.startDate);
    expect(before).toEqual(expect.arrayContaining(['2026-05-12', '2026-06-10']));

    const renderer = await renderEdit('CycleInformation', CycleInformationScreen as never, {mode: 'edit'});
    await act(async () => {
      renderer.root
        .find(n => n.props.accessibilityLabel === 'Choisir la date de début de tes dernières règles' && typeof n.props.onPress === 'function')
        .props.onPress();
    });
    await settle();
    await act(async () => {
      renderer.root.find(n => n.props.accessibilityLabel === 'Mois suivant' && typeof n.props.onPress === 'function').props.onPress();
    });
    await act(async () => {
      // Day cells carry no label: the pressable whose only text is "1" (July 1st).
      renderer.root
        .findAll(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => [t.props.children].flat().join('') === '1'))
        .slice(-1)[0]
        .props.onPress();
    });
    await settle();
    await press(renderer, 'Non');
    await press(renderer, 'Enregistrer');

    expect(dayKey(getCyclePreferences().lastPeriodStart)).toBe('2026-07-01');
    const starts = getPeriodHistory().map(record => record.startDate);
    expect(starts).toContain('2026-05-12');
    expect(starts).toContain('2026-07-01');
    expect(starts).not.toContain('2026-06-10');
  });
});
