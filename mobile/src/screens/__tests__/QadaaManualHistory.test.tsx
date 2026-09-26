import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Pressable, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import FastingQadaaScreen from '../FastingQadaaScreen';
import {useQadaaStatus, type QadaaStatus} from '../../hooks/useQadaaStatus';
import {isRamadan} from '../../utils/hijriCalendar';
import {buildQadaaRamadanYearOptions} from '../../utils/qadaaManualEntryForm';
import {setSelectedObjective, setSpiritualMarkersEnabled} from '../../state/onboardingPreferences';
import {
  getConfirmedPeriodHistory,
  recordConfirmedPeriodEnd,
  removeConfirmedPeriodOccurrence,
} from '../../state/confirmedPeriodHistoryStore';
import {
  addManualQadaaEntry,
  getQadaaLedger,
  hydrateQadaaLedger,
  removeManualQadaaEntry,
  undoQadaaCompletion,
  updateManualQadaaEntry,
  type QadaaManualEntry,
} from '../../state/qadaaLedgerStore';

// Real stores, real hook, real screen — only the notification chokepoint is
// stubbed. Restart / migration / persistence details live in
// src/state/__tests__/qadaaLedgerStore.test.ts; here the whole feature is
// exercised the way the user drives it.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelLocalNotification: jest.fn().mockResolvedValue(undefined),
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const localDay = (base: Date, offset: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);

// First day of Ramadan 1446 (2025) in the runtime's own calendar — found, not
// hard-coded, so the test never depends on ICU's tables.
const RAMADAN_1446_START = (() => {
  for (let offset = 0; offset < 40; offset += 1) {
    const candidate = new Date(2025, 1, 15 + offset);
    if (isRamadan(candidate) && !isRamadan(new Date(2025, 1, 14 + offset))) {return candidate;}
  }
  throw new Error('Ramadan start not found');
})();

// A confirmed period covering EXACTLY `days` days of Ramadan 1446.
const confirmRamadanPeriod = (days: number, firstDayOffset = 2) =>
  recordConfirmedPeriodEnd(localDay(RAMADAN_1446_START, firstDayOffset), localDay(RAMADAN_1446_START, firstDayOffset + days - 1));

async function flush() {
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function render(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => element}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await flush();
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const allTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const buttonByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(Pressable).find(node => node.props.accessibilityLabel === label);
const inputByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(TextInput).find(node => node.props.accessibilityLabel === label);

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const button = buttonByLabel(renderer, label);
  expect(button).toBeDefined();
  await act(async () => {
    await button!.props.onPress();
  });
  await flush();
}

async function type(renderer: ReactTestRenderer.ReactTestRenderer, label: string, value: string) {
  const input = inputByLabel(renderer, label);
  expect(input).toBeDefined();
  await act(async () => {
    input!.props.onChangeText(value);
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  // The stores are module singletons: bring them back to "nothing" explicitly.
  await hydrateQadaaLedger();
  for (const entry of [...getQadaaLedger().manualEntries]) {await removeManualQadaaEntry(entry.id);}
  for (const entry of [...getQadaaLedger().completions]) {await undoQadaaCompletion(entry.id);}
  for (const occurrence of getConfirmedPeriodHistory()) {await removeConfirmedPeriodOccurrence(new Date(occurrence.periodStart));}
  await setSelectedObjective('cycle');
  setSpiritualMarkersEnabled(true);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
});

/* ============================================================
 * Hook: one authoritative balance
 * ============================================================ */

describe('useQadaaStatus — automatic + manual + completions', () => {
  let latest: QadaaStatus;
  function Probe(): React.JSX.Element {
    latest = useQadaaStatus();
    return <Text>{String(latest.remainingQadaaDays)}</Text>;
  }
  const settle = async () => {
    await flush();
  };
  const snapshot = () => ({
    auto: latest.automaticQadaaDays,
    manual: latest.manualQadaaDays,
    total: latest.totalQadaaDays,
    done: latest.completedQadaaDays,
    left: latest.remainingQadaaDays,
  });

  it('A → G. the client scenario: automatic 4 + manual 2 = 6 → complete 1 = 5 → edit 3 = 7/6 → delete = 3', async () => {
    await confirmRamadanPeriod(4);
    await render(<Probe />);
    expect(snapshot()).toEqual({auto: 4, manual: 0, total: 4, done: 0, left: 4});

    let manual!: QadaaManualEntry;
    await act(async () => {
      manual = await addManualQadaaEntry({quantity: 2, year: 2018, yearSystem: 'gregorian'});
    });
    await settle();
    expect(snapshot()).toEqual({auto: 4, manual: 2, total: 6, done: 0, left: 6});

    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    expect(snapshot()).toEqual({auto: 4, manual: 2, total: 6, done: 1, left: 5});

    await act(async () => {
      await updateManualQadaaEntry(manual.id, {quantity: 3, year: 2018, yearSystem: 'gregorian'});
    });
    await settle();
    expect(snapshot()).toEqual({auto: 4, manual: 3, total: 7, done: 1, left: 6});

    await act(async () => {
      await removeManualQadaaEntry(manual.id);
    });
    await settle();
    expect(snapshot()).toEqual({auto: 4, manual: 0, total: 4, done: 1, left: 3});
  });

  it('E. undoing a completion puts the day back (6 again)', async () => {
    await confirmRamadanPeriod(4);
    await render(<Probe />);
    await act(async () => {
      await addManualQadaaEntry({quantity: 2});
    });
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    expect(latest.remainingQadaaDays).toBe(5);

    await act(async () => {
      await undoQadaaCompletion(latest.completions[0].id);
    });
    await settle();
    expect(snapshot()).toEqual({auto: 4, manual: 2, total: 6, done: 0, left: 6});
  });

  it('B/H/I. manual-only debt (no cycle data at all): an old year and an unknown-year balance', async () => {
    await render(<Probe />);
    expect(snapshot()).toEqual({auto: 0, manual: 0, total: 0, done: 0, left: 0});
    await act(async () => {
      await addManualQadaaEntry({quantity: 5, year: 2016, yearSystem: 'gregorian'});
      await addManualQadaaEntry({quantity: 7});
    });
    await settle();
    expect(snapshot()).toEqual({auto: 0, manual: 12, total: 12, done: 0, left: 12});
    expect(getConfirmedPeriodHistory()).toEqual([]); // no menstrual data was needed nor written
  });

  it('M. correcting the menstrual history recalculates ONLY the automatic part', async () => {
    await confirmRamadanPeriod(4);
    await render(<Probe />);
    await act(async () => {
      await addManualQadaaEntry({quantity: 2});
    });
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    expect(snapshot()).toEqual({auto: 4, manual: 2, total: 6, done: 1, left: 5});

    // The period is shortened to 2 days…
    await act(async () => {
      await confirmRamadanPeriod(2);
    });
    await settle();
    expect(snapshot()).toEqual({auto: 2, manual: 2, total: 4, done: 1, left: 3});

    // …then removed altogether: the manual balance and the completion history stay.
    await act(async () => {
      await removeConfirmedPeriodOccurrence(localDay(RAMADAN_1446_START, 2));
    });
    await settle();
    expect(snapshot()).toEqual({auto: 0, manual: 2, total: 2, done: 1, left: 1});
    expect(latest.manualEntries).toHaveLength(1);
    expect(latest.completions).toHaveLength(1);
  });

  it('M. completions above a shrunken total are kept, reported as surplus, and the balance never goes negative', async () => {
    await confirmRamadanPeriod(3);
    await render(<Probe />);
    for (let index = 0; index < 3; index += 1) {
      await act(async () => {
        await latest.markOneQadaaDayCompleted();
      });
      await settle();
    }
    expect(snapshot()).toMatchObject({total: 3, done: 3, left: 0});

    await act(async () => {
      await removeConfirmedPeriodOccurrence(localDay(RAMADAN_1446_START, 2));
    });
    await settle();
    expect(latest.remainingQadaaDays).toBe(0);
    expect(latest.completions).toHaveLength(3); // history is NOT silently deleted
    expect(latest.surplusCompletedDays).toBe(3);

    // Nothing is owed any more: marking another day is a no-op, never negative.
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    expect(latest.completions).toHaveLength(3);
    expect(latest.remainingQadaaDays).toBe(0);
  });

  it('N. a double tap on "marquer comme rattrapé" records ONE completion', async () => {
    await confirmRamadanPeriod(4);
    await render(<Probe />);
    await act(async () => {
      // Both calls start in the same tick, before anything has re-rendered.
      await Promise.all([latest.markOneQadaaDayCompleted(), latest.markOneQadaaDayCompleted()]);
    });
    await settle();
    expect(latest.completions).toHaveLength(1);
    expect(latest.remainingQadaaDays).toBe(3);

    // A later, separate tap is a new completion.
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    expect(latest.completions).toHaveLength(2);
    expect(latest.remainingQadaaDays).toBe(2);
  });

  it('completing can never push the remaining below zero', async () => {
    await render(<Probe />);
    await act(async () => {
      await addManualQadaaEntry({quantity: 1});
    });
    await settle();
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    expect(latest.completions).toHaveLength(1);
    expect(latest.remainingQadaaDays).toBe(0);
  });

  it('L. switching objectives never touches manual entries, completions or the automatic source', async () => {
    await confirmRamadanPeriod(4);
    await render(<Probe />);
    await act(async () => {
      await addManualQadaaEntry({quantity: 2});
    });
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    const ledgerBefore = JSON.stringify(getQadaaLedger());
    const historyBefore = JSON.stringify(getConfirmedPeriodHistory());

    for (const objective of ['conceive', 'contraception', 'pregnancy', 'postpartum', 'loss', 'irregular', 'menopause', 'cycle'] as const) {
      await act(async () => {
        await setSelectedObjective(objective);
      });
      await settle();
      expect(JSON.stringify(getQadaaLedger())).toBe(ledgerBefore);
      expect(JSON.stringify(getConfirmedPeriodHistory())).toBe(historyBefore);
      expect(snapshot()).toEqual({auto: 4, manual: 2, total: 6, done: 1, left: 5});
    }
  });

  it('K. spiritual toggle OFF → ON keeps every record and the balance', async () => {
    await confirmRamadanPeriod(4);
    await render(<Probe />);
    await act(async () => {
      await addManualQadaaEntry({quantity: 5, year: 2016, yearSystem: 'gregorian'});
    });
    await act(async () => {
      await latest.markOneQadaaDayCompleted();
    });
    await settle();
    const ledgerBefore = JSON.stringify(getQadaaLedger());
    expect(snapshot()).toEqual({auto: 4, manual: 5, total: 9, done: 1, left: 8});

    await act(async () => {
      setSpiritualMarkersEnabled(false);
    });
    await settle();
    expect(JSON.stringify(getQadaaLedger())).toBe(ledgerBefore);
    expect(getConfirmedPeriodHistory()).toHaveLength(1);

    await act(async () => {
      setSpiritualMarkersEnabled(true);
    });
    await settle();
    expect(JSON.stringify(getQadaaLedger())).toBe(ledgerBefore);
    expect(snapshot()).toEqual({auto: 4, manual: 5, total: 9, done: 1, left: 8});
  });
});

/* ============================================================
 * Screen: the user's actions
 * ============================================================ */

describe('FastingQadaaScreen — manual history, corrections and truthful status', () => {
  it('summary shows where the total comes from', async () => {
    await confirmRamadanPeriod(4);
    await addManualQadaaEntry({quantity: 2});
    const renderer = await render(<FastingQadaaScreen />);
    const texts = allTexts(renderer);
    expect(texts).toContain('Détectés automatiquement');
    expect(texts).toContain('Ajoutés manuellement');
    expect(texts).toContain('Rattrapés');
    expect(texts).toContain('Restants');
    expect(texts).toContain('Ton solde');
    // Hero counter = the authoritative remaining (4 + 2).
    expect(renderer.root.findAll(node => node.props?.children === 6).length).toBeGreaterThan(0);
  });

  it('P/BUG-02. automatic history rows never say "À jour" while days remain', async () => {
    await confirmRamadanPeriod(4);
    const renderer = await render(<FastingQadaaScreen />);
    const texts = allTexts(renderer);
    expect(texts).toContain('Automatique');
    expect(texts).toContain('4 jours restants');
    expect(texts).not.toContain('À jour');
    expect(texts.join('|')).not.toMatch(/AUTO_PERIOD/);
  });

  it('P. once everything is made up the history header says so — and "À jour" only when nothing is owed', async () => {
    await confirmRamadanPeriod(1);
    let renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Marquer un jour de jeûne comme rattrapé');
    expect(allTexts(renderer)).toContain('Tout est rattrapé');
    expect(allTexts(renderer)).not.toContain('1 jour restant');

    act(() => renderer.unmount());
    activeRenderers.length = 0;
    await removeConfirmedPeriodOccurrence(localDay(RAMADAN_1446_START, 2));
    await undoQadaaCompletion(getQadaaLedger().completions[0].id);
    renderer = await render(<FastingQadaaScreen />);
    // Nothing owed and no history: the hero itself says "À jour".
    expect(allTexts(renderer)).toContain('À jour');
    expect(allTexts(renderer)).not.toContain('Historique');
  });

  it('adds days from the form: 2 unknown-year days appear as a manual entry and the counter follows', async () => {
    await confirmRamadanPeriod(4);
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Ajouter des jours');
    await type(renderer, 'Nombre de jours', '2');
    await press(renderer, 'Ajouter 2 jours à rattraper');

    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({quantity: 2, year: null, source: 'MANUAL'});
    const texts = allTexts(renderer);
    expect(texts).toContain('Ancien solde');
    expect(texts).toContain('2 jours ajoutés manuellement');
    expect(texts).toContain('6 jours restants');
  });

  it('adds a 10-year-old balance with its year (no cycle data, no Premium)', async () => {
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Ajouter des jours');
    await type(renderer, 'Nombre de jours', '5');
    await press(renderer, 'Oui, je connais l’année');
    await press(renderer, 'Année du Ramadan : non choisie');
    const ramadan2016 = buildQadaaRamadanYearOptions(new Date()).find(option => option.gregorianYear === 2016)!;
    expect(ramadan2016).toBeDefined();
    await press(renderer, ramadan2016.label);
    await press(renderer, 'Ajouter 5 jours à rattraper');

    expect(getQadaaLedger().manualEntries[0]).toMatchObject({quantity: 5, year: ramadan2016.year, yearSystem: 'hijri'});
    expect(allTexts(renderer)).toContain(`Ramadan ${ramadan2016.year} AH`);
    expect(getConfirmedPeriodHistory()).toEqual([]);
  });

  it('refuses empty / zero / negative / non-numeric input and stores nothing', async () => {
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Ajouter des jours');
    for (const bad of ['', '0', '-2', 'abc', '2.5']) {
      await type(renderer, 'Nombre de jours', bad);
      await press(renderer, 'Ajouter des jours à rattraper');
      expect(getQadaaLedger().manualEntries).toEqual([]);
    }
    expect(renderer.root.findAll(node => node.props?.accessibilityRole === 'alert').length).toBeGreaterThan(0);
  });

  it('N. a double tap on "Ajouter" creates ONE entry', async () => {
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Ajouter des jours');
    await type(renderer, 'Nombre de jours', '3');
    const add = buttonByLabel(renderer, 'Ajouter 3 jours à rattraper')!;
    await act(async () => {
      // Two presses in the same tick, before React re-renders the disabled button.
      await Promise.all([add.props.onPress(), add.props.onPress()]);
    });
    await flush();
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(getQadaaLedger().manualEntries[0].quantity).toBe(3);
  });

  it('edits a manual entry (2 → 3) and the counters update; automatic rows have no edit/delete', async () => {
    await confirmRamadanPeriod(4);
    const entry = await addManualQadaaEntry({quantity: 2, year: 2020, yearSystem: 'gregorian'});
    const renderer = await render(<FastingQadaaScreen />);

    // Only the manual row is editable / deletable.
    const rowActions = renderer.root.findAllByType(Pressable).map(node => node.props.accessibilityLabel).filter(Boolean);
    expect(rowActions.filter(label => /^Modifier /.test(label))).toEqual(['Modifier Ramadan 2020']);
    expect(rowActions.filter(label => /^Supprimer /.test(label))).toEqual(['Supprimer Ramadan 2020']);

    await press(renderer, 'Modifier Ramadan 2020');
    expect(inputByLabel(renderer, 'Nombre de jours')!.props.value).toBe('2'); // pre-filled
    await type(renderer, 'Nombre de jours', '3');
    await press(renderer, 'Enregistrer les modifications');

    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({id: entry.id, quantity: 3, year: 2020});
    expect(allTexts(renderer)).toContain('3 jours ajoutés manuellement');
    expect(allTexts(renderer)).toContain('7 jours restants');
  });

  it('deletes a manual entry after confirmation — only that entry', async () => {
    await confirmRamadanPeriod(4);
    await addManualQadaaEntry({quantity: 2, year: 2020, yearSystem: 'gregorian'});
    await addManualQadaaEntry({quantity: 3, year: 2018, yearSystem: 'gregorian'});
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const renderer = await render(<FastingQadaaScreen />);

    await press(renderer, 'Supprimer Ramadan 2020');
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe('Supprimer ces 2 jours ajoutés manuellement ?');
    expect(getQadaaLedger().manualEntries).toHaveLength(2); // nothing removed before confirming

    const confirm = alert.mock.calls[0][2]!.find(button => button.style === 'destructive')!;
    await act(async () => {
      confirm.onPress?.();
    });
    await flush();

    expect(getQadaaLedger().manualEntries.map(entry => entry.year)).toEqual([2018]);
    expect(getConfirmedPeriodHistory()).toHaveLength(1);
    expect(allTexts(renderer)).toContain('7 jours restants'); // 4 automatic + 3
  });

  it('cancelling the confirmation deletes nothing', async () => {
    await addManualQadaaEntry({quantity: 2});
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Supprimer Ancien solde');
    const cancel = alert.mock.calls[0][2]!.find(button => button.style === 'cancel')!;
    await act(async () => {
      cancel.onPress?.();
    });
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
  });

  it('marks a day as made up, shows it in the history, and undoes it after confirmation', async () => {
    await confirmRamadanPeriod(4);
    await addManualQadaaEntry({quantity: 2});
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const renderer = await render(<FastingQadaaScreen />);

    await press(renderer, 'Marquer un jour de jeûne comme rattrapé');
    expect(getQadaaLedger().completions).toHaveLength(1);
    expect(allTexts(renderer)).toContain('1 jour rattrapé');
    expect(allTexts(renderer)).toContain('5 jours restants');

    const completion = getQadaaLedger().completions[0];
    const undoLabel = renderer.root
      .findAllByType(Pressable)
      .map(node => node.props.accessibilityLabel)
      .find(label => typeof label === 'string' && label.startsWith('Annuler le rattrapage du'));
    expect(undoLabel).toBeDefined();
    await press(renderer, undoLabel!);
    expect(alert).toHaveBeenCalledTimes(1);
    expect(getQadaaLedger().completions).toHaveLength(1); // not before confirming

    const confirm = alert.mock.calls[0][2]!.find(button => button.style === 'destructive')!;
    await act(async () => {
      confirm.onPress?.();
    });
    await flush();
    expect(getQadaaLedger().completions.find(item => item.id === completion.id)).toBeUndefined();
    expect(allTexts(renderer)).toContain('6 jours restants');
  });
});
