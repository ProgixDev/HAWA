import fs from 'fs';
import path from 'path';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {setContraceptionPreferences} from '../../state/contraceptionPreferences';
import {setContraceptionIntakeStatus} from '../../state/contraceptionIntakeHistoryStore';
import {setCyclePreferences, hydratePeriodEndDateTime, setPeriodEndDateTime} from '../../state/onboardingPreferences';
import i18n from '../../i18n';

import PeriodEndBottomSheet from '../../components/prayer/PeriodEndBottomSheet';
import ContraceptionCalendarContent from '../../components/contraception/ContraceptionCalendarContent';
import ContraceptionDashboard from '../../components/contraception/ContraceptionDashboard';
import MenstrualFlowScreen from '../journal/MenstrualFlowScreen';

// F17 (display side) — the places that only SHOW a local time with Intl hour12:false rendered midnight as "24:30"
// under the English language: the period-end sheet's time field, the "since ..." line of the menstrual-flow journal,
// and the "taken at" time of a contraception intake (Calendar day card and Dashboard history).
//
// Real components, real stores, English language. The prayer-time cards are NOT here on purpose: they format an
// instant in an EXPLICIT time zone, which this file's local-time helper cannot replace (see the static guard below).
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

// Sat 10 Oct 2026, 00:30 local: the moment itself is the midnight-hour value the screens have to print.
const NOW = new Date(2026, 9, 10, 0, 30, 0);
const TODAY_KEY = NOW.toLocaleDateString('en-CA');

async function flush() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);

async function mount(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(element);
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const insideStack = (screen: () => React.ReactElement) => (
  <SafeAreaProvider initialMetrics={TEST_METRICS}>
    <AwaThemeProvider>
      <JournalSheetProvider>
        <NavigationContainer ref={navRef}>
          <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name="Test">{screen}</Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </JournalSheetProvider>
    </AwaThemeProvider>
  </SafeAreaProvider>
);

beforeEach(async () => {
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  await AsyncStorage.clear();
  resetPremiumStateForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
  await resetAppLanguageForTests();
});

describe('period-end sheet', () => {
  const sheet = (initialDateTime: Date) => (
    <SafeAreaProvider initialMetrics={TEST_METRICS}>
      <AwaThemeProvider>
        <PeriodEndBottomSheet
          initialDateTime={initialDateTime}
          minDateTime={new Date(2026, 9, 5, 8, 0)}
          onClose={jest.fn()}
          onConfirmed={jest.fn()}
          visible
        />
      </AwaThemeProvider>
    </SafeAreaProvider>
  );

  it('prints a 00:30 end time as 00:30', async () => {
    const renderer = await mount(sheet(new Date(2026, 9, 10, 0, 30)));

    expect(allTexts(renderer)).toContain('00:30');
    expect(allTexts(renderer)).not.toContain('24:30');
  });

  it('and so does a time picked at midnight', async () => {
    const renderer = await mount(sheet(new Date(2026, 9, 9, 18, 0)));
    expect(allTexts(renderer)).toContain('18:00');

    const timeField = renderer.root
      .findAllByType(Pressable)
      .find(node => node.findAllByType(Text).some(text => textOf(text) === i18n.t('periodEndBottomSheet.endTimeLabel')));
    await act(async () => {
      timeField!.props.onPress();
    });
    await flush();
    await act(async () => {
      renderer.root.findAllByType(DateTimePicker)[0].props.onValueChange({type: 'set', nativeEvent: {}}, new Date(2026, 9, 10, 0, 45));
    });
    await flush();

    expect(allTexts(renderer)).toContain('00:45');
    expect(allTexts(renderer)).not.toContain('24:45');
  });
});

describe('menstrual flow journal - "since" line of a period in progress', () => {
  it('prints a period start at 00:30 as "... at 00:30"', async () => {
    await setCyclePreferences({
      lastPeriodStart: new Date(2026, 9, 9, 0, 30, 0),
      cycleDuration: 28,
      periodDuration: 5,
      regularity: 'yes',
    });
    await hydratePeriodEndDateTime();
    await setPeriodEndDateTime(null);

    const renderer = await mount(insideStack(() => <MenstrualFlowScreen />));

    const since = allTexts(renderer).filter(text => text.startsWith('Since '));
    expect(since).toHaveLength(1);
    expect(since[0]).toBe('Since October 9, 2026 at 00:30');
  });
});

describe('contraception intake - "taken at" time', () => {
  beforeEach(async () => {
    await setContraceptionPreferences({
      method: 'pill',
      methodStartDate: '2026-09-01',
      hasTreatmentBreak: false,
      pillScheduleType: 'continuous',
      activeDays: null,
      breakDays: null,
      remindersEnabled: false,
      reminderTime: null,
    });
    // Recorded at 00:30 local: recordedAt is the ISO of this very moment.
    await setContraceptionIntakeStatus(TODAY_KEY, 'taken', 'pill');
  });

  it('Calendar day card: "Taken at 00:30"', async () => {
    const renderer = await mount(insideStack(() => <ContraceptionCalendarContent />));

    expect(allTexts(renderer)).toContain('Taken at 00:30');
    expect(allTexts(renderer).some(text => text.includes('24:30'))).toBe(false);
  });

  it('Dashboard history list: the record time is 00:30', async () => {
    const renderer = await mount(
      insideStack(() => (
        <ContraceptionDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'test', name: 'CycleHome'}} />
      )),
    );
    const viewAll = renderer.root
      .findAllByType(Pressable)
      .find(node => node.props.accessibilityLabel === i18n.t('contraceptionDashboard.history.viewAll'));
    expect(viewAll).toBeDefined();
    await act(async () => {
      viewAll!.props.onPress();
    });
    await flush();

    expect(allTexts(renderer)).toContain('00:30');
    expect(allTexts(renderer)).not.toContain('24:30');
  });
});

// --- decisions, written down so a regression is visible -----------------------------------------------------------

describe('static guard: stored / displayed LOCAL clock times never go through Intl hour12:false again', () => {
  // The CODE of a file: comments (which explain the very thing being guarded against) are not part of the check.
  const read = (relative: string) =>
    fs
      .readFileSync(path.resolve(__dirname, '..', '..', relative), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');

  // Every site that stores a time, reads one back, or prints a local clock time: converted to utils/timeOfDay.
  const CONVERTED = [
    'screens/CycleRemindersScreen.tsx',
    'screens/MenopauseRemindersScreen.tsx',
    'screens/MiscarriageRemindersScreen.tsx',
    'screens/PostpartumRemindersScreen.tsx',
    'screens/irregular/IrregularOnboardingScreens.tsx',
    'screens/contraception/ContraceptionRemindersScreen.tsx',
    'screens/pregnancy/PregnancyNotificationsScreen.tsx',
    'components/pregnancy/PregnancyEventForm.tsx',
    'screens/journal/MenstrualFlowScreen.tsx',
    'screens/journal/JournalTemperatureScreen.tsx',
    'components/prayer/PeriodEndBottomSheet.tsx',
    'components/contraception/ContraceptionCalendarContent.tsx',
    'components/contraception/ContraceptionDashboard.tsx',
  ];

  it.each(CONVERTED)('%s formats with formatTimeOfDay and has no Intl hour12:false left', relative => {
    const source = read(relative);
    expect(source).not.toMatch(/hour12\s*:\s*false/);
    expect(source).toMatch(/utils\/timeOfDay/);
  });

  // Prayer times are an instant shown in an EXPLICIT time zone (the prayer location's), never stored or parsed back:
  // formatTimeOfDay (device-local) is the wrong tool there, so they stay as they were.
  it.each([
    'components/prayer/NextPrayerCard.tsx',
    'components/prayer/PrayerScheduleList.tsx',
    'components/prayer/PurityStatusCard.tsx',
    'components/home/SpiritualGuidanceCard.tsx',
  ])('%s keeps formatting in an explicit time zone', relative => {
    expect(read(relative)).toMatch(/timeZone/);
  });
});
