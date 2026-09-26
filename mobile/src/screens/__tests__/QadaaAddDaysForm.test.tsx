import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import FastingQadaaScreen from '../FastingQadaaScreen';
import {isRamadan} from '../../utils/hijriCalendar';
import {buildQadaaRamadanYearOptions} from '../../utils/qadaaManualEntryForm';
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
} from '../../state/qadaaLedgerStore';

// The "Ajouter des jours" form: three numbered steps (quantity stepper, known /
// unknown Ramadan year, optional note) and a dynamic CTA. It must keep feeding
// the SAME ledger (addManualQadaaEntry / updateManualQadaaEntry): the Qadaa
// arithmetic itself is covered in QadaaManualHistory.test.tsx.
jest.mock('../../services/pregnancyNotifications', () => ({
  scheduleLocalNotification: jest.fn().mockResolvedValue(true),
  cancelLocalNotification: jest.fn().mockResolvedValue(undefined),
}));

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const localDay = (base: Date, offset: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);
const RAMADAN_1446_START = (() => {
  for (let offset = 0; offset < 40; offset += 1) {
    const candidate = new Date(2025, 1, 15 + offset);
    if (isRamadan(candidate) && !isRamadan(new Date(2025, 1, 14 + offset))) {return candidate;}
  }
  throw new Error('Ramadan start not found');
})();
const confirmRamadanPeriod = (days: number) =>
  recordConfirmedPeriodEnd(localDay(RAMADAN_1446_START, 2), localDay(RAMADAN_1446_START, 2 + days - 1));

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

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string, times = 1) {
  for (let index = 0; index < times; index += 1) {
    const button = buttonByLabel(renderer, label);
    expect(button).toBeDefined();
    await act(async () => {
      await button!.props.onPress();
    });
  }
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
  await hydrateQadaaLedger();
  for (const entry of [...getQadaaLedger().manualEntries]) {await removeManualQadaaEntry(entry.id);}
  for (const entry of [...getQadaaLedger().completions]) {await undoQadaaCompletion(entry.id);}
  for (const occurrence of getConfirmedPeriodHistory()) {await removeConfirmedPeriodOccurrence(new Date(occurrence.periodStart));}
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

const yearOptions = () => buildQadaaRamadanYearOptions(new Date());
const quantityValue = (renderer: ReactTestRenderer.ReactTestRenderer) => inputByLabel(renderer, 'Nombre de jours')!.props.value;

const openForm = async () => {
  const renderer = await render(<FastingQadaaScreen />);
  await press(renderer, 'Ajouter des jours');
  return renderer;
};

describe('Add days form', () => {
  it('opens with the title, the description, the three numbered steps and the note placeholder', async () => {
    const renderer = await openForm();
    const texts = allTexts(renderer);
    expect(texts).toContain('Ajouter des jours\nà rattraper');
    expect(texts.join(' ')).toContain(
      'Ajoute ici des jours de jeûne que tu sais devoir rattraper, même s’ils datent de plusieurs années.',
    );
    expect(texts).toEqual(
      expect.arrayContaining([
        'Combien de jours veux-tu ajouter ?',
        'Sais-tu de quel Ramadan datent ces jours ?',
        'Ajouter une note (facultatif)',
        'Tu pourras modifier ce nombre plus tard.',
      ]),
    );
    expect(['1', '2', '3'].every(step => texts.includes(step))).toBe(true);
    expect(inputByLabel(renderer, 'Note facultative')!.props.placeholder).toBe('Ex. : jours qu’il me restait à rattraper');
  });

  it('the default quantity is 1 and the CTA says so (singular)', async () => {
    const renderer = await openForm();
    expect(quantityValue(renderer)).toBe('1');
    expect(buttonByLabel(renderer, 'Ajouter 1 jour à rattraper')).toBeDefined();
    expect(allTexts(renderer)).toContain('Ajouter 1 jour à rattraper');
  });

  it('+ increments and − decrements, and the CTA follows immediately (plural)', async () => {
    const renderer = await openForm();
    await press(renderer, 'Augmenter le nombre de jours');
    expect(quantityValue(renderer)).toBe('2');
    expect(allTexts(renderer)).toContain('Ajouter 2 jours à rattraper');
    await press(renderer, 'Augmenter le nombre de jours', 5);
    expect(allTexts(renderer)).toContain('Ajouter 7 jours à rattraper');
    await press(renderer, 'Diminuer le nombre de jours');
    expect(quantityValue(renderer)).toBe('6');
    expect(allTexts(renderer)).toContain('Ajouter 6 jours à rattraper');
  });

  it('can never go below 1: − is disabled at 1 and does nothing', async () => {
    const renderer = await openForm();
    const minus = buttonByLabel(renderer, 'Diminuer le nombre de jours')!;
    expect(minus.props.accessibilityState).toMatchObject({disabled: true});
    expect(minus.props.disabled).toBe(true);
    await act(async () => {
      minus.props.onPress?.();
    });
    expect(quantityValue(renderer)).toBe('1');
    expect(getQadaaLedger().manualEntries).toEqual([]);
  });

  it('typing a quantity works too; an invalid one shows the generic CTA and is refused', async () => {
    const renderer = await openForm();
    await type(renderer, 'Nombre de jours', '12');
    expect(allTexts(renderer)).toContain('Ajouter 12 jours à rattraper');
    for (const bad of ['', '0', '-3', 'abc', '2.5']) {
      await type(renderer, 'Nombre de jours', bad);
      expect(allTexts(renderer)).toContain('Ajouter des jours à rattraper');
      await press(renderer, 'Ajouter des jours à rattraper');
      expect(getQadaaLedger().manualEntries).toEqual([]);
    }
    // "+" from an invalid text restarts at the minimum instead of producing NaN.
    await type(renderer, 'Nombre de jours', 'abc');
    await press(renderer, 'Augmenter le nombre de jours');
    expect(quantityValue(renderer)).toBe('1');
  });

  it('the year picker is hidden until "Oui, je connais l’année" and hidden again by "Non…"', async () => {
    const renderer = await openForm();
    const yearField = () => buttonByLabel(renderer, 'Année du Ramadan : non choisie');
    expect(yearField()).toBeUndefined();
    expect(buttonByLabel(renderer, 'Non, je ne m’en souviens plus')!.props.accessibilityState).toMatchObject({selected: true});

    await press(renderer, 'Oui, je connais l’année');
    expect(yearField()).toBeDefined();
    expect(buttonByLabel(renderer, 'Oui, je connais l’année')!.props.accessibilityState).toMatchObject({selected: true});
    expect(buttonByLabel(renderer, 'Non, je ne m’en souviens plus')!.props.accessibilityState).toMatchObject({selected: false});

    await press(renderer, 'Non, je ne m’en souviens plus');
    expect(yearField()).toBeUndefined();
  });

  it('the picker offers "Gregorian (Hijri AH)" labels reaching 10+ years back; saving stores the Hijri Ramadan year', async () => {
    const renderer = await openForm();
    await press(renderer, 'Augmenter le nombre de jours');
    await press(renderer, 'Oui, je connais l’année');
    await press(renderer, 'Année du Ramadan : non choisie');

    const options = yearOptions();
    const decadeAgo = options.find(option => option.gregorianYear === new Date().getFullYear() - 10)!;
    expect(decadeAgo).toBeDefined();
    expect(decadeAgo.label).toMatch(/^\d{4} \(\d{4} AH\)$/);
    const listed = renderer.root.findAllByType(Pressable).map(node => node.props.accessibilityLabel);
    expect(listed).toEqual(expect.arrayContaining([options[0].label, decadeAgo.label]));

    await press(renderer, decadeAgo.label);
    expect(buttonByLabel(renderer, `Année du Ramadan : ${decadeAgo.label}`)).toBeDefined();
    await press(renderer, 'Ajouter 2 jours à rattraper');
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({quantity: 2, year: decadeAgo.year, yearSystem: 'hijri'});
  });

  it('"Oui" without choosing a year is refused (nothing stored, nothing invented)', async () => {
    const renderer = await openForm();
    await press(renderer, 'Oui, je connais l’année');
    await press(renderer, 'Ajouter 1 jour à rattraper');
    expect(getQadaaLedger().manualEntries).toEqual([]);
    expect(renderer.root.findAll(node => node.props?.accessibilityRole === 'alert').length).toBeGreaterThan(0);
  });

  it('unknown year: no picker, and the record stores NO year, NO calendar and no date', async () => {
    const renderer = await openForm();
    await press(renderer, 'Augmenter le nombre de jours');
    await press(renderer, 'Ajouter 2 jours à rattraper');
    const [entry] = getQadaaLedger().manualEntries;
    expect(entry).toMatchObject({quantity: 2, year: null, yearSystem: null, source: 'MANUAL'});
    expect(Object.keys(entry).sort()).toEqual(['createdAt', 'id', 'note', 'quantity', 'source', 'updatedAt', 'year', 'yearSystem']);
  });

  it('a year picked and then abandoned for "Non…" is not stored', async () => {
    const renderer = await openForm();
    await press(renderer, 'Oui, je connais l’année');
    await press(renderer, 'Année du Ramadan : non choisie');
    await press(renderer, yearOptions()[3].label);
    await press(renderer, 'Non, je ne m’en souviens plus');
    await press(renderer, 'Ajouter 1 jour à rattraper');
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({year: null, yearSystem: null});
  });

  it('the note is optional, counted 0/80 → n/80 while typing, capped, and stored trimmed', async () => {
    const renderer = await openForm();
    expect(allTexts(renderer)).toContain('0/80');
    await type(renderer, 'Note facultative', 'jours restants');
    expect(allTexts(renderer)).toContain('14/80');
    expect(inputByLabel(renderer, 'Note facultative')!.props.maxLength).toBe(80);
    await press(renderer, 'Ajouter 1 jour à rattraper');
    expect(getQadaaLedger().manualEntries[0].note).toBe('jours restants');
  });

  it('submit creates exactly ONE entry and closes the form; the counters follow (automatic 4 + manual 2)', async () => {
    await confirmRamadanPeriod(4);
    const renderer = await openForm();
    await press(renderer, 'Augmenter le nombre de jours');
    await press(renderer, 'Ajouter 2 jours à rattraper');
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(buttonByLabel(renderer, 'Ajouter 2 jours à rattraper')).toBeUndefined(); // form closed
    expect(allTexts(renderer)).toContain('6 jours restants'); // 4 automatic + 2 manual
  });

  it('a double tap on the CTA does not duplicate', async () => {
    const renderer = await openForm();
    await press(renderer, 'Augmenter le nombre de jours');
    const cta = buttonByLabel(renderer, 'Ajouter 2 jours à rattraper')!;
    await act(async () => {
      await Promise.all([cta.props.onPress(), cta.props.onPress(), cta.props.onPress()]);
    });
    await flush();
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
  });

  it('Annuler saves nothing and closes the form', async () => {
    const renderer = await openForm();
    await press(renderer, 'Augmenter le nombre de jours');
    await press(renderer, 'Annuler');
    expect(getQadaaLedger().manualEntries).toEqual([]);
    expect(inputByLabel(renderer, 'Nombre de jours')).toBeUndefined();
  });

  it('every control has an accessible name; the radio cards expose role, state and hint', async () => {
    const renderer = await openForm();
    for (const label of [
      'Diminuer le nombre de jours',
      'Augmenter le nombre de jours',
      'Oui, je connais l’année',
      'Non, je ne m’en souviens plus',
      'Annuler',
    ]) {
      expect(buttonByLabel(renderer, label)).toBeDefined();
    }
    const yes = buttonByLabel(renderer, 'Oui, je connais l’année')!;
    expect(yes.props.accessibilityRole).toBe('radio');
    expect(yes.props.accessibilityHint).toBe('Je sais de quel Ramadan datent ces jours.');
    expect(buttonByLabel(renderer, 'Non, je ne m’en souviens plus')!.props.accessibilityHint).toBe(
      'Ces jours font partie de mon ancien solde.',
    );
  });

  it('the form is scrollable, keeps its buttons outside the scroll area, and avoids the keyboard', async () => {
    const renderer = await openForm();
    const scrollViews = renderer.root.findAll(node => node.props?.keyboardShouldPersistTaps === 'handled');
    expect(scrollViews.length).toBeGreaterThan(0);
    // The primary CTA and Annuler are not inside the scrolling content.
    const scroll = renderer.root.findAll(node => node.props?.contentContainerStyle !== undefined && node.props?.keyboardShouldPersistTaps === 'handled')[0];
    const insideScroll = (label: string) => scroll.findAll(node => node.props?.accessibilityLabel === label).length > 0;
    expect(insideScroll('Annuler')).toBe(false);
    expect(insideScroll('Ajouter 1 jour à rattraper')).toBe(false);
    expect(insideScroll('Nombre de jours')).toBe(true);
  });
});

describe('Edit mode reuses the same form', () => {
  it('preloads quantity, known year and note; CTA is "Enregistrer les modifications"; saving persists (2 → 4, same id)', async () => {
    const target = yearOptions()[2];
    const entry = await addManualQadaaEntry({quantity: 2, year: target.year, yearSystem: 'hijri', note: 'ancien reliquat'});
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, `Modifier Ramadan ${target.year} AH`);

    expect(allTexts(renderer)).toContain('Modifier ces jours');
    expect(quantityValue(renderer)).toBe('2');
    expect(buttonByLabel(renderer, 'Oui, je connais l’année')!.props.accessibilityState).toMatchObject({selected: true});
    expect(buttonByLabel(renderer, `Année du Ramadan : ${target.label}`)).toBeDefined();
    expect(inputByLabel(renderer, 'Note facultative')!.props.value).toBe('ancien reliquat');
    expect(allTexts(renderer)).toContain('15/80');
    expect(buttonByLabel(renderer, 'Enregistrer les modifications')).toBeDefined();

    await press(renderer, 'Augmenter le nombre de jours', 2);
    await press(renderer, 'Enregistrer les modifications');
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({id: entry.id, quantity: 4, year: target.year, note: 'ancien reliquat'});
  });

  it('an unknown-year entry can become a known-year one, and back', async () => {
    const entry = await addManualQadaaEntry({quantity: 2});
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Modifier Ancien solde');
    expect(buttonByLabel(renderer, 'Non, je ne m’en souviens plus')!.props.accessibilityState).toMatchObject({selected: true});
    await press(renderer, 'Oui, je connais l’année');
    await press(renderer, 'Année du Ramadan : non choisie');
    const pick = yearOptions()[5];
    await press(renderer, pick.label);
    await press(renderer, 'Enregistrer les modifications');
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({id: entry.id, year: pick.year, yearSystem: 'hijri'});

    await press(renderer, `Modifier Ramadan ${pick.year} AH`);
    await press(renderer, 'Non, je ne m’en souviens plus');
    await press(renderer, 'Enregistrer les modifications');
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({id: entry.id, year: null, yearSystem: null});
  });

  it('an entry saved earlier with a Gregorian year keeps that year when only its quantity is edited', async () => {
    const entry = await addManualQadaaEntry({quantity: 2, year: 2016, yearSystem: 'gregorian'});
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Modifier Ramadan 2016');
    expect(buttonByLabel(renderer, 'Année du Ramadan : 2016')).toBeDefined();
    await press(renderer, 'Augmenter le nombre de jours');
    await press(renderer, 'Enregistrer les modifications');
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({id: entry.id, quantity: 3, year: 2016, yearSystem: 'gregorian'});
  });

  it('cancelling an edit changes nothing', async () => {
    const entry = await addManualQadaaEntry({quantity: 2});
    const renderer = await render(<FastingQadaaScreen />);
    await press(renderer, 'Modifier Ancien solde');
    await press(renderer, 'Augmenter le nombre de jours', 3);
    await press(renderer, 'Annuler');
    expect(getQadaaLedger().manualEntries[0]).toMatchObject({id: entry.id, quantity: 2});
  });
});
