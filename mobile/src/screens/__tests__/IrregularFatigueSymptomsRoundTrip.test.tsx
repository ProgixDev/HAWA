import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import IrregularJournalEntryScreen from '../IrregularJournalEntryScreen';
import IrregularCalendarContent from '../../components/irregular/IrregularCalendarContent';
import IrregularStatisticsScreen from '../irregular/IrregularStatisticsScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {
  getIrregularJournalEntry,
  hydrateIrregularJournal,
  saveIrregularJournalEntry,
} from '../../state/irregularJournalStore';
import {getJournalEntry} from '../../state/dailyJournalStore';
import {classifyIrregularPeriodDay, getIrregularFatigueSymptoms} from '../../utils/irregularJournalSelectors';

// Real screen, real stores: save "Fatigue & symptômes", reopen it, and check
// that Calendar and Statistics read the SAME symptoms back.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderJournal(category: 'fatigue' | 'period' | 'acne' | 'hairGrowth' | 'pain' | 'mood') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home">{() => <Text>home</Text>}</Stack.Screen>
              <Stack.Screen initialParams={{category}} name="IrregularJournalEntry">
                {() => <IrregularJournalEntryScreen />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate('IrregularJournalEntry');
  });
  await settle();
  return renderer;
}

async function renderPlain(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(textOf);

/** Pressables carrying a Text child equal to `label` (chips / tiles / rows). */
const optionByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.find(
    node =>
      typeof node.props.onPress === 'function' &&
      typeof node.props.accessibilityRole === 'string' &&
      node.findAllByType(Text).some(text => textOf(text) === label),
  );

const isChecked = (renderer: ReactTestRenderer.ReactTestRenderer, label: string): boolean =>
  optionByLabel(renderer, label).props.accessibilityState.checked === true;

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    optionByLabel(renderer, label).props.onPress();
  });
};

const pressSave = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const button = renderer.root.find(
    node =>
      typeof node.props.onPress === 'function' &&
      node.props.accessibilityRole === 'button' &&
      node.findAllByType(Text).some(text => textOf(text) === label),
  );
  await act(async () => {
    await button.props.onPress();
  });
  await settle();
};

beforeEach(() => {
  resetPremiumStateForTests();
  // Pinned to mid-afternoon: statistics window entries at noon of their day, so a
  // real-clock run before 12:00 would not yet see today's entries.
  jest.useFakeTimers({advanceTimers: true, now: new Date(2026, 8, 25, 15, 0, 0)});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('SOPK "Fatigue & symptômes" — save, reopen, read elsewhere', () => {
  it('E. saves level + associated symptoms at the canonical location only', async () => {
    const renderer = await renderJournal('fatigue');
    await press(renderer, 'Forte');
    await press(renderer, 'Nausées');
    await press(renderer, 'Crampes');
    await pressSave(renderer, 'Enregistrer mon suivi');

    await hydrateIrregularJournal();
    const entry = getIrregularJournalEntry(todayKey());
    expect(entry?.fatigue).toBe('Forte');
    expect(entry?.symptoms).toEqual(['Nausées', 'Crampes']);
    expect(entry?.details?.fatigue).not.toHaveProperty('symptoms');
  });

  it('E. REOPEN: the saved level and symptoms are still selected', async () => {
    const renderer = await renderJournal('fatigue');
    expect(isChecked(renderer, 'Forte')).toBe(true);
    expect(isChecked(renderer, 'Nausées')).toBe(true);
    expect(isChecked(renderer, 'Crampes')).toBe(true);
    expect(isChecked(renderer, 'Ballonnements')).toBe(false);
  });

  it('E. Calendar detail reads the same symptoms', async () => {
    const renderer = await renderPlain(<IrregularCalendarContent />);
    expect(allTexts(renderer)).toContain('Forte · 2 symptômes associés');
  });

  it('E. Statistics receive the same symptoms', async () => {
    const renderer = await renderPlain(<IrregularStatisticsScreen />);
    const texts = allTexts(renderer);
    expect(texts).toContain('Nausées · 1 jour');
    expect(texts).toContain('Crampes · 1 jour');
  });

  it('E. EDIT then REMOVE: changing and clearing symptoms updates what every reader sees', async () => {
    const renderer = await renderJournal('fatigue');
    await press(renderer, 'Nausées'); // deselect
    await press(renderer, 'Ballonnements'); // add
    await pressSave(renderer, 'Enregistrer mon suivi');
    expect(getIrregularFatigueSymptoms(getIrregularJournalEntry(todayKey()))).toEqual(['Crampes', 'Ballonnements']);
    unmount(renderer);

    const again = await renderJournal('fatigue');
    await press(again, 'Crampes');
    await press(again, 'Ballonnements');
    await pressSave(again, 'Enregistrer mon suivi');
    expect(getIrregularFatigueSymptoms(getIrregularJournalEntry(todayKey()))).toEqual([]);
    expect(getIrregularJournalEntry(todayKey())?.fatigue).toBe('Forte');

    unmount(again);
    const calendar = await renderPlain(<IrregularCalendarContent />);
    expect(allTexts(calendar)).toContain('Forte');
    expect(allTexts(calendar).some(text => /symptômes? associés?/.test(text))).toBe(false);
  });
});

function unmount(renderer: ReactTestRenderer.ReactTestRenderer) {
  act(() => {
    renderer.unmount();
  });
  activeRenderers.splice(activeRenderers.indexOf(renderer), 1);
}

describe('SOPK "Règles" journal — Non / Spotting are saved distinctly, neither as a period', () => {
  it('Spotting: saved as spotting (SOPK status) with a NON-flow shared record', async () => {
    const renderer = await renderJournal('period');
    await press(renderer, 'Spotting');
    await press(renderer, 'Légère');
    await pressSave(renderer, 'Enregistrer mes règles');

    await hydrateIrregularJournal();
    const entry = getIrregularJournalEntry(todayKey());
    expect(entry?.details?.period?.status).toBe('spotting');
    expect(entry?.period).toBe('Spotting · Légère');
    const shared = await getJournalEntry(todayKey());
    expect(shared?.flow?.intensity).toBe('none');
    expect(classifyIrregularPeriodDay(shared?.flow, entry)).toBe('spotting');
  });

  it('Non: saved as "no bleeding" — never a period day', async () => {
    const renderer = await renderJournal('period');
    await press(renderer, 'Non');
    await pressSave(renderer, 'Enregistrer mes règles');

    const entry = getIrregularJournalEntry(todayKey());
    expect(entry?.details?.period?.status).toBe('no');
    const shared = await getJournalEntry(todayKey());
    expect(shared?.flow?.intensity).toBe('none');
    expect(classifyIrregularPeriodDay(shared?.flow, entry)).toBe('no-bleeding');
  });

  it('Oui + intensity: an actual period day', async () => {
    const renderer = await renderJournal('period');
    await press(renderer, 'Oui');
    await press(renderer, 'Modérée');
    await pressSave(renderer, 'Enregistrer mes règles');

    const entry = getIrregularJournalEntry(todayKey());
    const shared = await getJournalEntry(todayKey());
    expect(shared?.flow?.intensity).toBe('moderate');
    expect(classifyIrregularPeriodDay(shared?.flow, entry)).toBe('period');
  });
});

describe('SOPK tracking categories still save and reopen (regression)', () => {
  it('pain (never saved yet) does not pick up the fatigue symptoms saved the same day', async () => {
    // Fatigue symptoms live at the entry's top level; the pain screen used to
    // fall back on them and show "Crampes" as if it were a pain zone.
    await saveIrregularJournalEntry(todayKey(), 'fatigue', 'Forte', {symptoms: ['Crampes', 'Nausées']});
    const renderer = await renderJournal('pain');
    const checkedChips = renderer.root.findAll(
      node => node.props.accessibilityRole === 'checkbox' && node.props.accessibilityState?.checked === true,
    );
    expect(checkedChips).toHaveLength(0);
  });

  it.each([
    ['acne', 'Légère', 'Enregistrer mon suivi'],
    ['hairGrowth', 'Légère', 'Enregistrer mon suivi'],
    ['pain', 'Modérée', 'Enregistrer mes douleurs'],
    ['mood', 'Bien', 'Enregistrer mon humeur'],
  ] as const)('%s: choose "%s", save, reopen', async (category, option, saveLabel) => {
    const renderer = await renderJournal(category);
    await press(renderer, option);
    await pressSave(renderer, saveLabel);
    expect(getIrregularJournalEntry(todayKey())?.[category]).toBe(option);
    unmount(renderer);

    const again = await renderJournal(category);
    expect(isChecked(again, option)).toBe(true);
  });
});
