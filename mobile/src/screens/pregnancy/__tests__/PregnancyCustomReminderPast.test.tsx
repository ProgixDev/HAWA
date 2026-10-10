import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Pressable, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import PregnancyNotificationsScreen from '../PregnancyNotificationsScreen';
import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {getCustomReminders, saveCustomReminder} from '../../../state/pregnancyCustomRemindersStore';
import {setAppLanguage, resetAppLanguageForTests} from '../../../state/themePreferences';
import {__resetNotificationServiceForTests} from '../../../services/pregnancyNotifications';
import {resetFakeNotifee} from '../../../testUtils/fakeNotifee';
import i18n from '../../../i18n';

// A one-time custom reminder set for a moment that has already passed used to be stored as "on" and then never
// sent, with nothing said (Phase 1 repair: F2). The sheet now refuses it with the real moment — but only when the
// date / time / repeat is being changed, so an old one-time reminder that already went off can still be edited.
//
// Real screen, real stores, fake notifee. Proves what the screen does; not Android delivery.
jest.mock('@notifee/react-native', () => require('../../../testUtils/fakeNotifee').notifeeModule);
jest.mock('../../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  getPrivacySecuritySettings: jest.fn(() => ({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
  })),
}));

const NOW = new Date(2026, 9, 10, 15, 0, 0); // Sat 10 Oct 2026, 15:00 local — the sheet's default "today 09:00" is past
const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function renderScreen() {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => (
                  <PregnancyNotificationsScreen
                    navigation={navigation as never}
                    route={{key: 'test', name: 'Test', params: {mode: 'edit'}} as never}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const settle = async () => {
  for (let index = 0; index < 3; index += 1) {
    await act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
  }
};

const byLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label)[0];

/** The pressable that contains a Text with exactly this content (the sheet's Save/Cancel have no a11y label). */
function pressableWithText(renderer: ReactTestRenderer.ReactTestRenderer, text: string) {
  const matches = renderer.root
    .findAllByType(Pressable)
    .filter(node => node.findAllByType(Text).some(child => textOf(child) === text));
  return matches[matches.length - 1];
}

let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  jest.useFakeTimers({now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask', 'setTimeout', 'clearTimeout']});
  jest.restoreAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await AsyncStorage.clear();
  resetFakeNotifee();
  __resetNotificationServiceForTests();
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

async function openNewReminderWithTitle(renderer: ReactTestRenderer.ReactTestRenderer, title: string) {
  await act(async () => {
    byLabel(renderer, 'Add a personalized reminder').props.onPress();
  });
  await act(async () => {
    byLabel(renderer, 'Title').props.onChangeText(title);
  });
}

describe('one-time custom reminder in the past', () => {
  it('is refused with the real moment, the sheet stays open and nothing is stored', async () => {
    const renderer = await renderScreen();
    await openNewReminderWithTitle(renderer, 'Prise de sang');

    // The sheet opens on "today 09:00, once" — and it is 15:00.
    await act(async () => {
      await pressableWithText(renderer, 'Save').props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message] = alertSpy.mock.calls[0];
    expect(title).toBe('This time has already passed');
    expect(message).toContain('October 10, 2026');
    expect(message).toContain('09:00');
    expect(message).toContain('would never be sent');
    expect(await getCustomReminders()).toEqual([]);
  });

  it('a repeating reminder is fine: it rolls to its next occurrence', async () => {
    const renderer = await renderScreen();
    await openNewReminderWithTitle(renderer, 'Vitamine');
    await act(async () => {
      await pressableWithText(renderer, 'Every day').props.onPress();
    });

    await act(async () => {
      await pressableWithText(renderer, 'Save').props.onPress();
    });

    expect(alertSpy).not.toHaveBeenCalled();
    expect(await getCustomReminders()).toHaveLength(1);
  });

  it('an old one-time reminder that already went off can still be edited when its time is untouched', async () => {
    await saveCustomReminder({
      id: 'old-1',
      title: 'Ancien rappel',
      date: '2026-10-01',
      time: '09:00',
      repeat: 'once',
      enabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    const renderer = await renderScreen();

    // Open its row, change only the description, save.
    await act(async () => {
      pressableWithText(renderer, 'Ancien rappel').props.onPress();
    });
    await act(async () => {
      byLabel(renderer, 'Description (optional)').props.onChangeText('Apporter le carnet');
    });
    await act(async () => {
      await pressableWithText(renderer, 'Save').props.onPress();
    });

    expect(alertSpy).not.toHaveBeenCalled();
    const stored = await getCustomReminders();
    expect(stored).toHaveLength(1);
    expect(stored[0].description).toBe('Apporter le carnet');
  });
});
