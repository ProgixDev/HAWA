import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import type {ObjectiveId} from '../../state/onboardingPreferences';
import SpiritualGuidanceCard from '../../components/home/SpiritualGuidanceCard';
import {MENSTRUAL_PURITY_OBJECTIVES, objectiveShowsMenstrualPurity} from '../../utils/spiritualObjectiveScope';
import {getActiveObjective} from '../../state/onboardingPreferences';
import PrayerTimesScreen from '../PrayerTimesScreen';

// M48 — UI consistency only (same canonical usePrayerPurityStatus() state ->
// same display): the objectives whose dashboard SpiritualGuidanceCard shows
// the Menstrues/Pureté badge must be the objectives whose Prayer Times screen
// shows the purity card. No purity/prayer rule is exercised here.

jest.mock('../../hooks/usePrayerPurityStatus', () => ({
  usePrayerPurityStatus: jest.fn().mockReturnValue({
    cyclePreferences: {},
    selectedLocation: {city: 'Paris', country: 'France'},
    periodEndDateTime: null,
    schedule: {timezone: 'Europe/Paris', fajrAngle: 18, windows: [], purityWindows: []},
    loading: false,
    error: false,
    now: new Date('2026-01-15T12:00:00Z'),
    isMenstruating: true,
    purityResult: {status: 'unknown'},
    nextWindow: undefined,
    refresh: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../state/onboardingPreferences', () => {
  const actual = jest.requireActual('../../state/onboardingPreferences');
  return {
    ...actual,
    getActiveObjective: jest.fn().mockReturnValue('cycle'),
    getHijriAdjustmentDays: jest.fn().mockReturnValue(0),
    setHijriAdjustmentDays: jest.fn(),
    subscribeHijriAdjustmentDays: jest.fn().mockReturnValue(() => {}),
  };
});

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderNode(renderElement: () => React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{renderElement}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

const ALL_OBJECTIVES: ObjectiveId[] = [
  'cycle',
  'conceive',
  'contraception',
  'irregular',
  'menopause',
  'pregnancy',
  'postpartum',
  'loss',
];

// How each dashboard configures its SpiritualGuidanceCard (verified against the
// dashboard sources below): Cycle/Conceive/SOPK pass no restricting `objective`
// (default 'cycle', the full purity section); every other objective passes its own value.
const CARD_OBJECTIVE_PROP: Record<ObjectiveId, 'cycle' | 'pregnancy' | 'postpartum' | 'miscarriage' | 'contraception' | 'menopause'> = {
  cycle: 'cycle',
  conceive: 'cycle',
  irregular: 'cycle',
  contraception: 'contraception',
  menopause: 'menopause',
  pregnancy: 'pregnancy',
  postpartum: 'postpartum',
  loss: 'miscarriage',
};

describe('Prayer Times purity card vs dashboard purity badge, per objective', () => {
  it.each(ALL_OBJECTIVES)('%s: Prayer Times shows PurityStatusCard exactly when the dashboard card shows the purity badge', async objective => {
    (getActiveObjective as jest.Mock).mockReturnValue(objective);

    const prayer = await renderNode(() => <PrayerTimesScreen />);
    const prayerShowsPurity = prayer.root.findAll(node => node.props.children === 'Statut de pureté').length > 0;

    const card = await renderNode(() => (
      <SpiritualGuidanceCard isMenstruating locationConfigured objective={CARD_OBJECTIVE_PROP[objective]} />
    ));
    const cardShowsPurity = card.root.findAll(node => node.props.children === 'Menstrues').length > 0;

    expect(prayerShowsPurity).toBe(cardShowsPurity);
    expect(prayerShowsPurity).toBe(objectiveShowsMenstrualPurity(objective));
  });

  it('the period-based objectives (cycle, conceive, irregular) show purity; the others never do', () => {
    expect([...MENSTRUAL_PURITY_OBJECTIVES].sort()).toEqual(['conceive', 'cycle', 'irregular']);
    ['contraception', 'menopause', 'pregnancy', 'postpartum', 'loss'].forEach(objective => {
      expect(objectiveShowsMenstrualPurity(objective as ObjectiveId)).toBe(false);
    });
  });

  it('guard: the dashboards configure SpiritualGuidanceCard as the table above assumes', () => {
    const cardOpening = (relative: string): string => {
      const source = fs.readFileSync(path.resolve(__dirname, relative), 'utf8');
      const match = source.match(/<SpiritualGuidanceCard[\s\S]*?\/>/);
      return match ? match[0] : '';
    };
    // No `objective=` (or Cycle's default) => full purity section.
    expect(cardOpening('../../components/conceive/ConceiveDashboard.tsx')).not.toMatch(/objective=/);
    expect(cardOpening('../../components/irregular/IrregularDashboard.tsx')).not.toMatch(/objective=/);
    expect(cardOpening('../CycleHomeScreen.tsx')).not.toMatch(/objective="(pregnancy|postpartum|miscarriage|contraception|menopause)"/);
    expect(cardOpening('../../components/pregnancy/PregnancyDashboard.tsx')).toMatch(/objective="pregnancy"/);
    expect(cardOpening('../../components/postpartum/PostpartumDashboard.tsx')).toMatch(/objective="postpartum"/);
    expect(cardOpening('../../components/miscarriage/MiscarriageDashboard.tsx')).toMatch(/objective="miscarriage"/);
    expect(cardOpening('../../components/contraception/ContraceptionDashboard.tsx')).toMatch(/objective="contraception"/);
    expect(cardOpening('../../components/menopause/MenopauseDashboard.tsx')).toMatch(/objective="menopause"/);
  });
});
