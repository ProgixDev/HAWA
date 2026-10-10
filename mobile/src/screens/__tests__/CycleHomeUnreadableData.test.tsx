import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {setActiveObjective} from '../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {__markUnavailableForTests, forgetUnavailableStructuredKeys} from '../../services/secureAsyncStorage';
import i18n from '../../i18n';
import HomeScreen from '../HomeScreen';

// Found on a real Android runtime (emulator): with the cycle records unreadable, Cycle Home said
// "No periods recorded yet" and offered "My period started" — an empty history, not "cannot be shown".

jest.mock('../../services/countryDetection', () => ({detectCountryCode: jest.fn().mockResolvedValue(null)}));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('c'),
    requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
    createTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
    getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
  },
  AlarmType: {SET: 0, SET_AND_ALLOW_WHILE_IDLE: 1, SET_EXACT: 2, SET_EXACT_AND_ALLOW_WHILE_IDLE: 3, SET_ALARM_CLOCK: 4},
  AndroidImportance: {HIGH: 4},
  AndroidVisibility: {PRIVATE: 1},
  AuthorizationStatus: {NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1},
  RepeatFrequency: {NONE: -1, HOURLY: 0, DAILY: 1, WEEKLY: 2},
  TriggerType: {TIMESTAMP: 0, INTERVAL: 1},
}));

const Stack = createNativeStackNavigator();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const active: ReactTestRenderer.ReactTestRenderer[] = [];
const textOf = (node: ReactTestRenderer.ReactTestInstance): string =>
  [node.props.children].flat(Infinity).map(child => (typeof child === 'string' || typeof child === 'number' ? String(child) : '')).join('');
const texts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf).filter(value => value.trim());

const settle = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function mount() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <JournalSheetProvider>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen component={HomeScreen as never} name="Home" />
              </Stack.Navigator>
            </JournalSheetProvider>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  active.push(renderer);
  await settle();
  return renderer;
}

beforeEach(async () => {
  await resetActiveProfileForTests();
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  forgetUnavailableStructuredKeys();
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
  await act(async () => {
    await setActiveObjective('cycle');
  });
});

afterEach(() => {
  act(() => {
    active.splice(0).forEach(renderer => renderer.unmount());
  });
  forgetUnavailableStructuredKeys();
});

describe('Cycle Home with records that cannot be read', () => {
  it('control: a genuinely empty history still shows the normal empty state and the period CTA', async () => {
    const value = texts(await mount());
    expect(value).toContain(i18n.t('cycleHome.preFirstPeriod.title'));
    expect(value).toContain(i18n.t('cycleHome.myPeriodStartedCta'));
  });

  it.each(['@hawa/confirmed-period-history', '@hawa/cycle-preferences'])(
    'unreadable %s: says the data cannot be read — no empty-history message, no "period started" invitation',
    async key => {
      __markUnavailableForTests(key);
      const value = texts(await mount());
      expect(value).toContain(i18n.t('dataSafety.banner.title'));
      expect(value).toContain(i18n.t('dataSafety.banner.body'));
      expect(value).not.toContain(i18n.t('cycleHome.preFirstPeriod.title'));
      expect(value).not.toContain(i18n.t('cycleHome.preFirstPeriod.subtitleOwner'));
      expect(value).not.toContain(i18n.t('cycleHome.myPeriodStartedCta'));
    },
  );

  it('an unreadable record of ANOTHER domain does not hide a healthy cycle home', async () => {
    __markUnavailableForTests('@hawa/pregnancy-journal/v1');
    const value = texts(await mount());
    expect(value).toContain(i18n.t('cycleHome.preFirstPeriod.title')); // empty because nothing is recorded, not because of the other key
  });
});
