import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {bytesToUtf8} from '@noble/ciphers/utils.js';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ConceiveStatisticsScreen from '../ConceiveStatisticsScreen';
import ConceiveDashboard from '../../../components/conceive/ConceiveDashboard';
import ConceiveCalendarContent from '../../../components/conceive/ConceiveCalendarContent';
import JournalConceptionReportsScreen from '../../journal/JournalConceptionReportsScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {deleteJournalSection, getAllJournalEntries, saveJournalSection} from '../../../state/dailyJournalStore';
import {decryptIntimacySection, encryptIntimacySection, resolveIntimacySection} from '../../../services/privateJournalEncryption';
import {lockIntimacy, unlockIntimacy} from '../../../state/privateSectionAuthStore';
import {getCyclePreferences, setCyclePreferences} from '../../../state/onboardingPreferences';

// CONCEIVE-01 - "Rapports" saved but not reflected on the Conceive Dashboard nor
// counted in Statistics. ROOT CAUSE: Hermes (the release runtime) has no
// `TextDecoder`; the intimacy payload is AES-GCM encrypted and its decryption
// ended with @noble's `bytesToUtf8` = `new TextDecoder().decode(...)`. Saving
// worked (TextEncoder exists), but EVERY read failed -> "unreadable" -> the
// Dashboard / Statistics / Calendar treated the record as absent. Node and Jest
// have TextDecoder, so it never showed in tests: this file REMOVES it, like the
// device, and checks the whole path with the real screens.
//
// Today is 2026-09-25; the current cycle started 2026-09-20.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const NOW = new Date(2026, 8, 25, 15, 0, 0);
const TODAY = '2026-09-25';
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const texts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);

async function flush() {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function render(element: React.ReactElement, initialRoute?: {name: string; component: React.ComponentType}) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Home">{() => element}</Stack.Screen>
                {initialRoute ? <Stack.Screen component={initialRoute.component} name={initialRoute.name} /> : null}
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const renderDashboard = () =>
  render(<ConceiveDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />);
const renderStats = () => render(<ConceiveStatisticsScreen />);

/** Progress card: which entry points show as completed, and the n / total counter. */
const dashboard = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const completed = renderer.root
    .findAll(node => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.endsWith(', complété'))
    .map(node => (node.props.accessibilityLabel as string).replace(', complété', '').replace(/\s+/g, ' '));
  return {completed: Array.from(new Set(completed)).sort(), counter: texts(renderer).find(text => /complété$/.test(text))};
};

/** "Rapports ce cycle" KPI value. */
const rapportsThisCycle = (renderer: ReactTestRenderer.ReactTestRenderer): string | undefined => {
  const all = texts(renderer);
  const index = all.indexOf('Rapports ce cycle');
  return index >= 0 ? all[index + 1] : undefined;
};

/** Saves a Rapport exactly like the screen does (same encryption call). */
const saveRapport = async (date: string, answer: 'yes' | 'no' = 'yes') =>
  saveJournalSection(date, 'encryptedIntimacy', await encryptIntimacySection({answer, time: '21:30', protection: 'unknown', note: ''}));

/** Drives the REAL Rapports screen: navigate (unlocked), press Enregistrer. */
async function saveRapportThroughTheScreen() {
  unlockIntimacy();
  const screen = await render(<Text>home</Text>, {
    name: 'JournalConceptionReports',
    component: JournalConceptionReportsScreen as unknown as React.ComponentType,
  });
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('JournalConceptionReports');
  });
  await flush();
  const save = screen.root.find(node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => textOf(text) === 'Enregistrer'));
  await act(async () => {
    await save.props.onPress();
  });
  await flush();
  act(() => screen.unmount());
  activeRenderers.splice(activeRenderers.indexOf(screen), 1);
}

const realTextDecoder = globalThis.TextDecoder;

beforeAll(() => {
  // The device runtime: TextEncoder yes, TextDecoder NO.
  delete (globalThis as {TextDecoder?: unknown}).TextDecoder;
});
afterAll(() => {
  (globalThis as {TextDecoder?: unknown}).TextDecoder = realTextDecoder;
});

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  lockIntimacy();
  jest.useFakeTimers({advanceTimers: true, now: NOW});
  setCyclePreferences({...getCyclePreferences(), lastPeriodStart: new Date(2026, 8, 20), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('root cause - the device runtime has no TextDecoder', () => {
  it('the runtime under test really has no TextDecoder, and @noble bytesToUtf8 throws there', () => {
    expect(typeof (globalThis as {TextDecoder?: unknown}).TextDecoder).toBe('undefined');
    expect(() => bytesToUtf8(new Uint8Array([0x61]))).toThrow();
  });

  it('the intimacy payload still decrypts (own UTF-8 decoder), including Arabic text', async () => {
    const payload = await encryptIntimacySection({answer: 'yes', note: 'ملاحظة 😊 é'});
    expect(await decryptIntimacySection(payload)).toEqual({answer: 'yes', note: 'ملاحظة 😊 é'});
    const resolved = await resolveIntimacySection({id: 'x', date: TODAY, encryptedIntimacy: payload});
    expect(resolved).toEqual({data: {answer: 'yes', note: 'ملاحظة 😊 é'}, corrupted: false});
  });
});

describe('CONCEIVE-01 - Rapports through the real screen', () => {
  it('1. no Rapport today -> Dashboard incomplete, Statistics 0', async () => {
    const renderer = await renderDashboard();
    expect(dashboard(renderer).completed).toEqual([]);
    expect(rapportsThisCycle(await renderStats())).toBe('0');
  });

  it('2+3. save today (real screen) -> Dashboard "Rapports" completed AND Statistics "Rapports ce cycle" = 1', async () => {
    await saveRapportThroughTheScreen();
    const renderer = await renderDashboard();
    expect(dashboard(renderer).completed).toEqual(['Rapports']);
    expect(dashboard(renderer).counter).toBe('1 / 4 complété');
    expect(rapportsThisCycle(await renderStats())).toBe('1');
  });

  it('the saved record stays available after reopening the Rapports screen and after a restart (rehydration from storage)', async () => {
    await saveRapportThroughTheScreen();
    // "Restart": nothing but AsyncStorage survives - read straight from storage.
    const [entry] = await getAllJournalEntries();
    expect(entry.encryptedIntimacy).toBeDefined();
    expect((await resolveIntimacySection(entry)).data?.answer).toBe('yes');
    expect(dashboard(await renderDashboard()).completed).toEqual(['Rapports']);
  });

  it('4. a Rapport on ANOTHER day only leaves today incomplete', async () => {
    await saveRapport('2026-09-22');
    expect(dashboard(await renderDashboard()).completed).toEqual([]);
  });
});

describe('CONCEIVE-01 - Statistics current-cycle counting', () => {
  it('5. a historical Rapport inside the current cycle counts (Sept 22 -> 1)', async () => {
    await saveRapport('2026-09-22');
    expect(rapportsThisCycle(await renderStats())).toBe('1');
  });

  it('6. Rapports outside the current cycle (before it, or in the future) are excluded', async () => {
    await saveRapport('2026-09-10'); // previous cycle
    await saveRapport('2026-09-19'); // the day before the cycle starts
    await saveRapport('2026-09-27'); // future
    expect(rapportsThisCycle(await renderStats())).toBe('0');
  });

  it('several valid Rapports in the cycle are all counted; "no" answers are not', async () => {
    await saveRapport('2026-09-21');
    await saveRapport('2026-09-23');
    await saveRapport(TODAY);
    await saveRapport('2026-09-24', 'no');
    expect(rapportsThisCycle(await renderStats())).toBe('3');
  });

  it('7. an empty / cleared Rapport is not counted and not shown as completed', async () => {
    await saveRapport(TODAY);
    await deleteJournalSection(TODAY, 'encryptedIntimacy');
    expect(rapportsThisCycle(await renderStats())).toBe('0');
    expect(dashboard(await renderDashboard()).completed).toEqual([]);
  });
});

describe('CONCEIVE-01 - the other indicators and the Calendar are unchanged', () => {
  it('9-11. Température, Glaire and Test LH still complete the Dashboard (Rapports stays incomplete)', async () => {
    await saveJournalSection(TODAY, 'temperature', {value: 36.6, unit: 'C'});
    await saveJournalSection(TODAY, 'cervicalMucus', {type: 'eggWhite'});
    await saveJournalSection(TODAY, 'lhTest', {result: 'positive'});
    const state = dashboard(await renderDashboard());
    expect(state.completed).toEqual(['Glaire cervicale', 'Température basale', 'Test LH'].sort());
    expect(state.counter).toBe('3 / 4 complété');
    // ...and adding the Rapport completes the fourth.
    await saveRapport(TODAY);
    expect(dashboard(await renderDashboard()).counter).toBe('4 / 4 complété');
  });

  it('12. the Calendar reads the same record: today shows Rapports "Enregistré"', async () => {
    await saveRapport(TODAY);
    const calendar = await render(<ConceiveCalendarContent />);
    const all = texts(calendar);
    // (the LAST 'Rapports' is the selected-day row; the first is the legend)
    expect(all[all.lastIndexOf('Rapports') + 1] ?? '').toBe('Enregistré');
  });
});

describe('CONCEIVE-01 - privacy', () => {
  it('no plaintext duplicate is ever persisted: storage holds only the encrypted payload', async () => {
    await saveRapportThroughTheScreen();
    await renderDashboard();
    await renderStats();
    const keys = await AsyncStorage.getAllKeys();
    const values = await Promise.all(keys.map(async key => (await AsyncStorage.getItem(key)) ?? ''));
    const journal = JSON.parse((await AsyncStorage.getItem('@hawa/daily-journal/v1')) as string) as Record<string, unknown>[];
    expect(Object.keys(journal[0]).sort()).toEqual(['date', 'encryptedIntimacy', 'id']); // no plain `intimacy` section
    const dump = values.join(' ');
    expect(dump).not.toContain('21:30'); // no decrypted detail (time / protection) anywhere
    expect(dump).not.toContain('answer');
    expect(dump).not.toContain('protection');
  });
});
