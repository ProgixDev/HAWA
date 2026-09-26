import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ContraceptionDashboard from '../ContraceptionDashboard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setContraceptionPreferences} from '../../../state/contraceptionPreferences';
import {deleteContraceptionIntakeRecord, setContraceptionIntakeStatus} from '../../../state/contraceptionIntakeHistoryStore';
import {addDays} from '../../../utils/cycleMath';

// contraceptionReminderScheduling schedules through the Notifee-backed
// chokepoint; replaced so no real scheduling is attempted.
jest.mock('../../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderDashboard() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <ContraceptionDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const unmountAll = () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
};

const texts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const hasText = (renderer: ReactTestRenderer.ReactTestRenderer, value: string) =>
  texts(renderer).some(text => text.includes(value));

const hasLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label).length > 0;

const dateKey = (date: Date) => date.toLocaleDateString('en-CA');
const daysAgo = (count: number) => dateKey(addDays(new Date(), -count));

const CYCLIC_21_7 = {
  method: 'pill' as const,
  hasTreatmentBreak: true,
  pillScheduleType: 'cyclic' as const,
  activeDays: 21,
  breakDays: 7,
};

beforeEach(async () => {
  resetPremiumStateForTests();
  await setContraceptionPreferences({
    method: null,
    methodStartDate: null,
    hasTreatmentBreak: null,
    pillScheduleType: null,
    activeDays: null,
    breakDays: null,
    remindersEnabled: false,
    reminderTime: null,
  });
});

afterEach(unmountAll);

describe('ContraceptionDashboard — pill BREAK day (cyclic schedule)', () => {
  it('ACTIVE day: still shows "Pilule à prendre" and the intake actions', async () => {
    await act(async () => {
      await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(4)}); // pack day 5
    });
    const renderer = await renderDashboard();
    expect(hasText(renderer, 'Pilule à prendre')).toBe(true);
    expect(hasText(renderer, 'Jour d’arrêt')).toBe(false);
    expect(hasLabel(renderer, 'Prise effectuée')).toBe(true);
  });

  it('BREAK day: no "Pilule à prendre", no intake actions, "Jour d’arrêt" instead', async () => {
    await act(async () => {
      await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(21)}); // pack day 22
    });
    const renderer = await renderDashboard();
    expect(hasText(renderer, 'Pilule à prendre')).toBe(false);
    expect(hasText(renderer, 'N’oublie pas d’enregistrer ta prise')).toBe(false);
    expect(hasText(renderer, 'Jour d’arrêt')).toBe(true);
    expect(hasText(renderer, 'Période d’arrêt')).toBe(true); // progress ring footnote
    expect(hasLabel(renderer, 'Prise effectuée')).toBe(false);
  });

  it('LAST break day (pack day 28) is a break day; the next pack starts active again', async () => {
    await act(async () => {
      await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(27)}); // pack day 28
    });
    const lastBreak = await renderDashboard();
    expect(hasText(lastBreak, 'Jour d’arrêt')).toBe(true);
    unmountAll();

    await act(async () => {
      await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(28)}); // pack day 1 of pack 2
    });
    const nextPack = await renderDashboard();
    expect(hasText(nextPack, 'Pilule à prendre')).toBe(true);
    expect(hasText(nextPack, 'Jour d’arrêt')).toBe(false);
  });

  it('a status the user really recorded on a break day is never hidden', async () => {
    await act(async () => {
      await setContraceptionPreferences({...CYCLIC_21_7, methodStartDate: daysAgo(22)}); // pack day 23
      await setContraceptionIntakeStatus(dateKey(new Date()), 'taken', 'pill');
    });
    const renderer = await renderDashboard();
    expect(hasText(renderer, 'Jour d’arrêt')).toBe(false);
    expect(hasText(renderer, 'Pilule à prendre')).toBe(false);
    expect(hasText(renderer, 'Enregistré')).toBe(true);
    await act(async () => {
      await deleteContraceptionIntakeRecord(dateKey(new Date()));
    });
  });

  it.each([
    ['continuous', {method: 'pill' as const, hasTreatmentBreak: false, pillScheduleType: 'continuous' as const}],
    ['unknown', {method: 'pill' as const, hasTreatmentBreak: null, pillScheduleType: 'unknown' as const}],
  ])('%s schedule: NEVER a break day (unchanged pill-taking state)', async (_name, prefs) => {
    await act(async () => {
      await setContraceptionPreferences({...prefs, methodStartDate: daysAgo(40), activeDays: null, breakDays: null});
    });
    const renderer = await renderDashboard();
    expect(hasText(renderer, 'Jour d’arrêt')).toBe(false);
    expect(hasText(renderer, 'Pilule à prendre')).toBe(true);
    expect(hasLabel(renderer, 'Prise effectuée')).toBe(true);
  });

  it.each(['ring', 'patch', 'other'] as const)('%s: never a pill break day', async method => {
    await act(async () => {
      await setContraceptionPreferences({method, methodStartDate: daysAgo(40)});
    });
    const renderer = await renderDashboard();
    expect(hasText(renderer, 'Jour d’arrêt')).toBe(false);
    expect(hasText(renderer, 'Période d’arrêt')).toBe(false);
  });
});

describe('ContraceptionDashboard — reminder indicator per method', () => {
  const setup = async (prefs: Parameters<typeof setContraceptionPreferences>[0]) => {
    await act(async () => {
      await setContraceptionPreferences({methodStartDate: daysAgo(3), ...prefs});
    });
    return renderDashboard();
  };

  it('pill with reminders ON → "Rappels activés"; OFF → "Rappels désactivés"', async () => {
    const on = await setup({method: 'pill', remindersEnabled: true});
    expect(hasText(on, 'Rappels activés')).toBe(true);
    unmountAll();
    const off = await setup({method: 'pill', remindersEnabled: false});
    expect(hasText(off, 'Rappels désactivés')).toBe(true);
    expect(hasText(off, 'Rappels activés')).toBe(false);
  });

  it.each(['ring', 'patch'] as const)('%s never shows "Rappels activés", even with a stale enabled flag', async method => {
    const renderer = await setup({method, remindersEnabled: true});
    expect(hasText(renderer, 'Rappels activés')).toBe(false);
    expect(hasText(renderer, 'Tes rappels sont activés')).toBe(false);
    expect(hasText(renderer, 'Rappels non disponibles')).toBe(true);
  });

  it('Pill (reminders ON) → Ring: the dashboard stops claiming reminders are on; back to Pill restores it', async () => {
    const renderer = await setup({method: 'pill', remindersEnabled: true});
    expect(hasText(renderer, 'Rappels activés')).toBe(true);

    await act(async () => {
      await setContraceptionPreferences({method: 'ring'});
    });
    expect(hasText(renderer, 'Rappels activés')).toBe(false);
    expect(hasText(renderer, 'Rappels non disponibles')).toBe(true);

    await act(async () => {
      await setContraceptionPreferences({method: 'pill'});
    });
    expect(hasText(renderer, 'Rappels activés')).toBe(true);
  });

  it('Pill → Patch behaves like Pill → Ring', async () => {
    const renderer = await setup({method: 'pill', remindersEnabled: true});
    await act(async () => {
      await setContraceptionPreferences({method: 'patch'});
    });
    expect(hasText(renderer, 'Rappels activés')).toBe(false);
    expect(hasText(renderer, 'Rappels non disponibles')).toBe(true);
  });

  it('other keeps following the flag', async () => {
    const renderer = await setup({method: 'other', remindersEnabled: true});
    expect(hasText(renderer, 'Rappels activés')).toBe(true);
  });
});
