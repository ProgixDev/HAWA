import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PrayerTimesScreen from '../PrayerTimesScreen';
import PurityStatusCard from '../../components/prayer/PurityStatusCard';
import {usePrayerPurityStatus} from '../../hooks/usePrayerPurityStatus';
import {getConfirmedPeriodHistory} from '../../state/confirmedPeriodHistoryStore';
import {getHasExplicitPeriodDuration, getHasRecordedFirstPeriod, getRecordedPeriodHistory} from '../../state/onboardingPreferences';
import {setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {fr} from '../../i18n/locales/fr';
import {en} from '../../i18n/locales/en';
import {de} from '../../i18n/locales/de';
import {ar} from '../../i18n/locales/ar';

// "Fin prévue vers le …" on the Prayer Times screen: the wiring of predictedPeriodEndDate (cycleMath.ts) to PurityStatusCard. The calculation itself is
// tested in utils/__tests__/predictedPeriodEndDate.test.ts; here: WHEN the screen asks for it (menstruating status, first period recorded, explicit
// length, regular cycle, no end given by her) and what is displayed.

jest.mock('../../hooks/usePrayerPurityStatus', () => ({usePrayerPurityStatus: jest.fn()}));
jest.mock('../../state/confirmedPeriodHistoryStore', () => ({
  ...jest.requireActual('../../state/confirmedPeriodHistoryStore'),
  getConfirmedPeriodHistory: jest.fn(),
}));
jest.mock('../../state/onboardingPreferences', () => ({
  ...jest.requireActual('../../state/onboardingPreferences'),
  getActiveObjective: jest.fn().mockReturnValue('cycle'),
  getHijriAdjustmentDays: jest.fn().mockReturnValue(0),
  setHijriAdjustmentDays: jest.fn(),
  subscribeHijriAdjustmentDays: jest.fn().mockReturnValue(() => {}),
  getHasRecordedFirstPeriod: jest.fn(),
  getHasExplicitPeriodDuration: jest.fn(),
  getRecordedPeriodHistory: jest.fn(),
}));

const mockHook = usePrayerPurityStatus as jest.Mock;
const mockConfirmedHistory = getConfirmedPeriodHistory as jest.Mock;
const mockFirstPeriod = getHasRecordedFirstPeriod as jest.Mock;
const mockExplicit = getHasExplicitPeriodDuration as jest.Mock;
const mockRecorded = getRecordedPeriodHistory as jest.Mock;

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const hookState = (overrides: Record<string, unknown> = {}) => ({
  cyclePreferences: {lastPeriodStart: new Date(2026, 10, 14, 12, 0, 0), periodDuration: 5, cycleDuration: 29, regularity: 'yes'},
  selectedLocation: {city: 'Paris', country: 'France'},
  periodEndDateTime: null,
  schedule: {timezone: 'Europe/Paris', fajrAngle: 18, windows: [], purityWindows: []},
  loading: false,
  error: false,
  now: new Date(2026, 10, 15, 12, 0, 0),
  purityResult: {status: 'menstruating'},
  nextWindow: undefined,
  refresh: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

async function renderNode(element: () => React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{element}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const texts = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => typeof node.props.children === 'string').map(node => node.props.children as string);
const expectedEndText = (renderer: ReactTestRenderer.ReactTestRenderer) => texts(renderer).find(text => text.startsWith('Fin prévue vers le'));
const HINT = 'Les repères de pureté seront actualisés lorsque tu déclareras la fin de tes règles.';

beforeEach(async () => {
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  mockHook.mockReturnValue(hookState());
  mockConfirmedHistory.mockReturnValue([]);
  mockFirstPeriod.mockReturnValue(true);
  mockExplicit.mockReturnValue(true);
  mockRecorded.mockReturnValue([{id: '2026-11-14', startDate: '2026-11-14', endDate: '2026-11-18'}]);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('PrayerTimesScreen — the prediction is asked for only when it can honestly be shown', () => {
  it('menstruating + first period recorded + explicit length + regular cycle + projected end: "Fin prévue vers le 18 novembre", above the usual hint', async () => {
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBe('Fin prévue vers le 18 novembre');
    const all = texts(renderer);
    expect(all).toContain('Menstrues en cours');
    expect(all.indexOf('Fin prévue vers le 18 novembre')).toBeLessThan(all.indexOf(HINT));
  });

  it('the status is not "menstruating" (here: unknown): nothing is displayed', async () => {
    mockHook.mockReturnValue(hookState({purityResult: {status: 'unknown'}}));
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
  });

  it('no first period recorded: the current behaviour is kept (hint only)', async () => {
    mockFirstPeriod.mockReturnValue(false);
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
    expect(texts(renderer)).toContain(HINT);
  });

  it('the period length was not explicitly entered or confirmed: nothing is displayed', async () => {
    mockExplicit.mockReturnValue(false);
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
    expect(texts(renderer)).toContain(HINT);
  });

  it.each(['no', 'unknown'])('%s cycle: nothing is displayed', async regularity => {
    mockHook.mockReturnValue(hookState({cyclePreferences: {lastPeriodStart: new Date(2026, 10, 14, 12), periodDuration: 5, cycleDuration: 29, regularity}}));
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
  });

  it('an end she entered / edited / confirmed on the record (endConfirmed) is not presented as a prediction', async () => {
    mockRecorded.mockReturnValue([{id: '2026-11-14', startDate: '2026-11-14', endDate: '2026-11-18', endConfirmed: true}]);
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
  });

  it('a confirmed occurrence of this period (older data) is not presented as a prediction either', async () => {
    mockConfirmedHistory.mockReturnValue([{id: '2026-11-14', periodStart: '2026-11-14', periodEndDateTime: '2026-11-17T10:00:00.000Z', capturedAt: '2026-11-17T10:00:00.000Z'}]);
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
  });

  it('a declared end (periodEndDateTime) of this period always wins', async () => {
    mockHook.mockReturnValue(hookState({periodEndDateTime: new Date(2026, 10, 15, 9, 0, 0)}));
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
  });

  it('6 Nov + 5 days, still declared in progress on 18 Nov: the passed date is not shown as a forecast', async () => {
    mockHook.mockReturnValue(hookState({
      cyclePreferences: {lastPeriodStart: new Date(2026, 10, 6, 12), periodDuration: 5, cycleDuration: 29, regularity: 'yes'},
      now: new Date(2026, 10, 18, 12, 0, 0),
    }));
    mockRecorded.mockReturnValue([{id: '2026-11-06', startDate: '2026-11-06', endDate: '2026-11-10'}]);
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBeUndefined();
    expect(texts(renderer)).toContain('Menstrues en cours');
  });

  it('14 Nov + 6 days → 19 novembre', async () => {
    mockHook.mockReturnValue(hookState({cyclePreferences: {lastPeriodStart: new Date(2026, 10, 14, 12), periodDuration: 6, cycleDuration: 29, regularity: 'yes'}}));
    mockRecorded.mockReturnValue([{id: '2026-11-14', startDate: '2026-11-14', endDate: '2026-11-19'}]);
    const renderer = await renderNode(() => <PrayerTimesScreen />);
    expect(expectedEndText(renderer)).toBe('Fin prévue vers le 19 novembre');
  });
});

describe('PurityStatusCard — display', () => {
  const props = {periodEndDateTime: null, loading: false, error: false, onEdit: jest.fn()};
  const card = (status: string, expectedEnd: Date | null) =>
    renderNode(() => <PurityStatusCard {...props} expectedEnd={expectedEnd} result={{status} as never} />);

  it('shows the label under "Menstrues en cours" when an estimate is given', async () => {
    const renderer = await card('menstruating', new Date(2026, 10, 18));
    expect(texts(renderer)).toContain('Fin prévue vers le 18 novembre');
  });

  it('shows nothing extra without an estimate, and never outside the menstruating state', async () => {
    expect(texts(await card('menstruating', null)).some(text => text.startsWith('Fin prévue'))).toBe(false);
    expect(texts(await card('unknown', new Date(2026, 10, 18))).some(text => text.startsWith('Fin prévue'))).toBe(false);
  });
});

describe('translations', () => {
  it.each([['fr', fr], ['en', en], ['de', de], ['ar', ar]] as const)('%s defines prayerTimes.purity.expectedEnd with the {{date}} placeholder', (_name, dictionary) => {
    const value = (dictionary as unknown as {prayerTimes: {purity: {expectedEnd?: string}}}).prayerTimes.purity.expectedEnd;
    expect(typeof value).toBe('string');
    expect(value).toContain('{{date}}');
  });

  it('the label is "forecast" wording, never a statement of fact', () => {
    expect(fr.prayerTimes.purity.expectedEnd).toBe('Fin prévue vers le {{date}}');
    expect(en.prayerTimes.purity.expectedEnd).toBe('Expected to end around {{date}}');
  });

  it('English: the same card renders the English label with the date', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderNode(() => <PurityStatusCard expectedEnd={new Date(2026, 10, 18)} loading={false} error={false} onEdit={jest.fn()} periodEndDateTime={null} result={{status: 'menstruating'} as never} />);
    const label = texts(renderer).find(text => text.startsWith('Expected to end around'));
    expect(label).toBeDefined();
    expect(label).toContain('18');
  });
});
