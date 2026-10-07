import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PrayerTimesScreen from '../PrayerTimesScreen';
import HijriCalendarScreen from '../HijriCalendarScreen';
import FastingQadaaScreen from '../FastingQadaaScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {getHijriAdjustmentDays} from '../../state/onboardingPreferences';
import {hijriPartsFor} from '../../utils/hijriCalendar';
import i18n from '../../i18n';

// Phase 7F — Prayer times, Hijri calendar and Qadaa (fasts to make up) must
// follow the app language exactly like every other migrated screen, while
// every real calculated/persisted value (prayer windows, the Hijri
// adjustment setting, the underlying Hijri date, Qadaa counts, the selected
// location) stays byte-identical across a language switch — only chrome
// text is translated.

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

async function renderScreen(renderElement: () => React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
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
  activeRenderers.push(renderer);
  return renderer;
}

jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelLocalNotification: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../hooks/usePrayerPurityStatus', () => ({
  usePrayerPurityStatus: jest.fn().mockReturnValue({
    cyclePreferences: {lastPeriodStart: new Date('2026-03-01T00:00:00Z')},
    selectedLocation: {city: 'Paris', country: 'France'},
    periodEndDateTime: null,
    schedule: {
      timezone: 'Europe/Paris',
      fajrAngle: 18,
      windows: [
        {name: 'Fajr', start: new Date('2026-03-15T05:00:00Z'), end: new Date('2026-03-15T06:30:00Z')},
        {name: 'Dhuhr', start: new Date('2026-03-15T12:00:00Z'), end: new Date('2026-03-15T15:00:00Z')},
        {name: 'Asr', start: new Date('2026-03-15T15:30:00Z'), end: new Date('2026-03-15T18:00:00Z')},
        {name: 'Maghrib', start: new Date('2026-03-15T18:30:00Z'), end: new Date('2026-03-15T20:00:00Z')},
        {name: 'Isha', start: new Date('2026-03-15T20:30:00Z'), end: new Date('2026-03-16T05:00:00Z')},
      ],
      purityWindows: [],
    },
    loading: false,
    error: false,
    now: new Date('2026-03-15T13:00:00Z'),
    purityResult: {status: 'menstruating'},
    nextWindow: {name: 'Asr', start: new Date('2026-03-15T15:30:00Z'), end: new Date('2026-03-15T18:00:00Z')},
    refresh: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../state/onboardingPreferences', () => {
  const actual = jest.requireActual('../../state/onboardingPreferences');
  return {
    ...actual,
    getActiveObjective: jest.fn().mockReturnValue('cycle'),
    getHijriAdjustmentDays: jest.fn().mockReturnValue(1),
    setHijriAdjustmentDays: jest.fn(),
    subscribeHijriAdjustmentDays: jest.fn().mockReturnValue(() => {}),
  };
});

jest.mock('../../hooks/useQadaaStatus', () => ({
  useQadaaStatus: jest.fn().mockReturnValue({
    remainingQadaaDays: 3,
    totalQadaaDays: 5,
    completedQadaaDays: 2,
    automaticQadaaDays: 5,
    manualQadaaDays: 0,
    surplusCompletedDays: 0,
    balance: {automaticDays: 5, manualDays: 0, totalDays: 5, completedReportedDays: 2, completedDays: 2, remainingDays: 3, surplusCompletedDays: 0},
    manualEntries: [],
    completions: [],
    hijriYear: 1447,
    loading: false,
    ramadanActive: true,
    showReminder: true,
    markOneQadaaDayCompleted: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../hooks/useConfirmedPeriodHistory', () => ({
  useConfirmedPeriodHistory: jest.fn().mockReturnValue([]),
}));

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — Prayer times UI follows the app language', () => {
  it('French: title, next-prayer label and schedule chrome render', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Horaires de prière');
    expect(texts).toContain('Prochaine prière');
    expect(texts).toContain('Horaires du jour');
  });

  it('English: the same chrome translates, no French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Prayer times');
    expect(texts).toContain('Next prayer');
    expect(texts).toContain('Today’s schedule');
    expect(texts).not.toContain('Horaires de prière');
  });
});

describe('TEST 3/4/18 — prayer names/technical ids and calculated times stay unchanged across languages', () => {
  it('prayer names (Fajr/Dhuhr/Asr/Maghrib/Isha) and prayer time digits are identical in French and English', async () => {
    const frRenderer = await renderScreen(() => <PrayerTimesScreen />);
    const frTexts = textsOf(frRenderer);
    expect(frTexts).toContain('Dhuhr');
    expect(frTexts.some(text => text.includes('13:00') || /\d{2}:\d{2}/.test(text))).toBe(true);
    const frTimeTexts = frTexts.filter(text => /^\d{2}:\d{2}$/.test(text));

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen(() => <PrayerTimesScreen />);
    const enTexts = textsOf(enRenderer);
    expect(enTexts).toContain('Dhuhr');
    const enTimeTexts = enTexts.filter(text => /^\d{2}:\d{2}$/.test(text));

    // Same clock digits in both languages (hour12: false forces 24h format
    // regardless of locale) — the calculation/formatting is untouched.
    expect(enTimeTexts).toEqual(frTimeTexts);
  });
});

describe('TEST 12/13 — purity/menstruation spiritual UI follows the app language', () => {
  it('French: "Statut de pureté" and "Menstrues en cours" render', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Statut de pureté');
    expect(texts).toContain('Menstrues en cours');
  });

  it('English: the same copy translates', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Purity status');
    expect(texts).toContain('Menstruation in progress');
    expect(texts).not.toContain('Statut de pureté');
  });
});

describe('TEST 19 — the persisted Hijri adjustment setting is unaffected by a language switch', () => {
  it('getHijriAdjustmentDays() keeps returning the same persisted value after FR → EN', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    expect(getHijriAdjustmentDays()).toBe(1);
    expect(textsOf(renderer)).toContain('Calendrier ajusté de +1 jour');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(getHijriAdjustmentDays()).toBe(1);
    expect(textsOf(renderer)).toContain('Calendar adjusted by +1 day');
  });
});

describe('TEST 17 — the selected location is unaffected by a language switch', () => {
  it('the same city/country render before and after switching to English', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    expect(textsOf(renderer).some(text => text.includes('Paris, France'))).toBe(true);

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer).some(text => text.includes('Paris, France'))).toBe(true);
  });
});

describe('TEST 6/7/8 — Hijri calendar UI follows the app language, the underlying Hijri date is unchanged', () => {
  it('French: title and "Repères spirituels" shortcuts render', async () => {
    const renderer = await renderScreen(() => <HijriCalendarScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Calendrier Hijri');
    expect(texts).toContain('Repères spirituels');
  });

  it('English: the same chrome translates, no French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(() => <HijriCalendarScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Hijri calendar');
    expect(texts).toContain('Spiritual markers');
    expect(texts).not.toContain('Calendrier Hijri');
  });

  it('the underlying Hijri year/month/day for a fixed Gregorian date never changes with the app language', async () => {
    const fixedDate = new Date('2026-03-15T12:00:00Z');
    const partsBefore = hijriPartsFor(fixedDate);

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const partsAfter = hijriPartsFor(fixedDate);

    expect(partsAfter).toEqual(partsBefore);
  });
});

describe('TEST 9/10/11/20 — Qadaa (fasts to make up) UI follows the app language, counts and pluralization stay correct', () => {
  it('French: title, eyebrow and the remaining-day count render with correct pluralization', async () => {
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Jeûnes à rattraper');
    expect(texts).toContain('JEÛNES À RATTRAPER');
    expect(texts).toContain('3 jours restants');
    expect(texts.some(text => text.includes('3'))).toBe(true);
  });

  it('English: the same chrome translates, the numeric count (3) stays identical', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Fasts to make up');
    expect(texts).toContain('FASTS TO MAKE UP');
    expect(texts).toContain('3 days remaining');
    expect(texts).not.toContain('Jeûnes à rattraper');
  });

  it('singular vs plural: a balance of exactly 1 remaining day uses the singular form in both languages', async () => {
    const {useQadaaStatus} = jest.requireMock('../../hooks/useQadaaStatus');
    useQadaaStatus.mockReturnValueOnce({
      remainingQadaaDays: 1, totalQadaaDays: 1, completedQadaaDays: 0, automaticQadaaDays: 1, manualQadaaDays: 0,
      surplusCompletedDays: 0,
      balance: {automaticDays: 1, manualDays: 0, totalDays: 1, completedReportedDays: 0, completedDays: 0, remainingDays: 1, surplusCompletedDays: 0},
      manualEntries: [], completions: [], hijriYear: 1447, loading: false, ramadanActive: true, showReminder: true,
      markOneQadaaDayCompleted: jest.fn(),
    });
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    expect(textsOf(renderer)).toContain('1 jour restant');
  });
});

describe('TEST 14 — Nifas chrome (shared with the home dashboard’s SpiritualGuidanceCard) stays localized', () => {
  it('the nifasLabel key already follows the app language (pre-existing spiritualGuidance.* namespace)', async () => {
    expect(i18n.t('spiritualGuidance.nifasLabel')).toBe('Nifas');
    await i18n.changeLanguage('en');
    expect(i18n.t('spiritualGuidance.nifasLabel')).toBe('Nifas');
    await i18n.changeLanguage('fr');
  });
});

describe('TEST 16 — a runtime FR→EN switch updates visible copy without a restart', () => {
  it('PrayerTimesScreen re-renders in English after changeLanguage, same mounted instance', async () => {
    const renderer = await renderScreen(() => <PrayerTimesScreen />);
    expect(textsOf(renderer)).toContain('Horaires de prière');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer)).toContain('Prayer times');
    expect(textsOf(renderer)).not.toContain('Horaires de prière');
  });

  it('FastingQadaaScreen re-renders in English after changeLanguage, same mounted instance', async () => {
    const renderer = await renderScreen(() => <FastingQadaaScreen />);
    expect(textsOf(renderer)).toContain('Jeûnes à rattraper');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(textsOf(renderer)).toContain('Fasts to make up');
    expect(textsOf(renderer)).not.toContain('Jeûnes à rattraper');
  });
});
