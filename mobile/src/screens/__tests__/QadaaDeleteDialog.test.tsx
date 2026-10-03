import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal, Pressable, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import FastingQadaaScreen from '../FastingQadaaScreen';
import {isRamadan} from '../../utils/hijriCalendar';
import {buildQadaaRamadanYearOptions, describeQadaaManualEntryForDelete} from '../../utils/qadaaManualEntryForm';
import {
  getConfirmedPeriodHistory,
  recordConfirmedPeriodEnd,
  removeConfirmedPeriodOccurrence,
} from '../../state/confirmedPeriodHistoryStore';
import * as ledger from '../../state/qadaaLedgerStore';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';
import {
  addManualQadaaEntry,
  getQadaaLedger,
  hydrateQadaaLedger,
  recordQadaaCompletion,
  removeManualQadaaEntry,
  undoQadaaCompletion,
} from '../../state/qadaaLedgerStore';

// The delete confirmation for a MANUAL Qadaa entry. It is a custom dialog, but the
// deletion itself is still the existing removeManualQadaaEntry, and the arithmetic
// is covered in QadaaManualHistory.test.tsx.
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

async function render() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <FastingQadaaScreen />}</Stack.Screen>
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

async function press(renderer: ReactTestRenderer.ReactTestRenderer, label: string) {
  const button = buttonByLabel(renderer, label);
  expect(button).toBeDefined();
  await act(async () => {
    await button!.props.onPress();
  });
  await flush();
}

const dialogOpen = (renderer: ReactTestRenderer.ReactTestRenderer) => allTexts(renderer).includes('Supprimer ces jours ?');

beforeEach(async () => {
  await AsyncStorage.clear();
  await hydrateQadaaLedger();
  for (const entry of [...getQadaaLedger().manualEntries]) {await removeManualQadaaEntry(entry.id);}
  for (const entry of [...getQadaaLedger().completions]) {await undoQadaaCompletion(entry.id);}
  for (const occurrence of getConfirmedPeriodHistory()) {await removeConfirmedPeriodOccurrence(new Date(occurrence.periodStart));}
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.restoreAllMocks();
});

describe('Delete confirmation dialog', () => {
  it('tapping Supprimer on a manual entry opens the dialog and deletes nothing', async () => {
    await addManualQadaaEntry({quantity: 2});
    const renderer = await render();
    expect(dialogOpen(renderer)).toBe(false);
    await press(renderer, 'Supprimer Ancien solde');
    expect(dialogOpen(renderer)).toBe(true);
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
  });

  it('is a custom dialog, not the system Alert', async () => {
    await addManualQadaaEntry({quantity: 2});
    const alert = jest.spyOn(require('react-native').Alert, 'alert');
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    expect(alert).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(Modal).some(modal => modal.props.visible === true)).toBe(true);
  });

  it('unknown year: shows the quantity, "Ancien solde" and "Année non renseignée"', async () => {
    await addManualQadaaEntry({quantity: 2});
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    const texts = allTexts(renderer);
    expect(texts).toContain('Supprimer ces jours ?');
    expect(texts).toContain('Année non renseignée');
    expect(texts).toContain('2 jours'); // the dialog summary (the history row says "2 jours ajoutés manuellement")
    expect(texts.filter(text => text === 'Ancien solde').length).toBeGreaterThan(1);
    expect(texts.join(' ')).toContain('Tu es sur le point de supprimer 2 jours ajoutés manuellement.');
  });

  it('known Hijri year: shows "Ramadan 2023 (1444 AH)"', async () => {
    await addManualQadaaEntry({quantity: 4, year: 1444, yearSystem: 'hijri'});
    const renderer = await render();
    await press(renderer, 'Supprimer Ramadan 1444 AH');
    const texts = allTexts(renderer);
    expect(texts).toContain('Ramadan 2023 (1444 AH)');
    expect(texts).not.toContain('Année non renseignée');
    expect(texts.join(' ')).toContain('supprimer 4 jours ajoutés manuellement.');
  });

  it('known Gregorian year (entry saved earlier): shows "Ramadan 2020"', async () => {
    await addManualQadaaEntry({quantity: 4, year: 2020, yearSystem: 'gregorian'});
    const renderer = await render();
    await press(renderer, 'Supprimer Ramadan 2020');
    expect(allTexts(renderer).filter(text => text === 'Ramadan 2020').length).toBeGreaterThan(1);
    expect(allTexts(renderer)).not.toContain('Année non renseignée');
  });

  it('singular: 1 jour ajouté manuellement / plural: 2 jours ajoutés manuellement (never hard-coded)', async () => {
    const one = await addManualQadaaEntry({quantity: 1});
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    expect(allTexts(renderer).join(' ')).toContain('Tu es sur le point de supprimer 1 jour ajouté manuellement.');
    expect(allTexts(renderer).join(' ')).not.toContain('1 jours');
    await press(renderer, 'Annuler la suppression');

    await act(async () => {
      await ledger.updateManualQadaaEntry(one.id, {quantity: 2});
    });
    await flush();
    await press(renderer, 'Supprimer Ancien solde');
    expect(allTexts(renderer).join(' ')).toContain('Tu es sur le point de supprimer 2 jours ajoutés manuellement.');
  });

  it('says what is deleted and what is NOT, without alarming wording', async () => {
    await addManualQadaaEntry({quantity: 2, note: 'Jours anciens à rattraper'});
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    const text = allTexts(renderer).join(' ');
    expect(text).toContain('Cette action retirera ces jours de ton solde de jeûnes à rattraper.');
    expect(text).toContain('Cette action supprimera uniquement cette entrée ajoutée manuellement.');
    expect(text).toContain('Tes jours détectés automatiquement et tes jours déjà rattrapés ne sont pas modifiés.');
    expect(text).toContain('« Jours anciens à rattraper »');
    expect(text).not.toMatch(/définitiv|irréversible|attention|danger/i);
  });

  it('Annuler closes the dialog and the entry remains', async () => {
    await addManualQadaaEntry({quantity: 2});
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    await press(renderer, 'Annuler la suppression');
    expect(dialogOpen(renderer)).toBe(false);
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
  });

  it('backdrop tap and Android Back both cancel: the entry remains', async () => {
    await addManualQadaaEntry({quantity: 2});
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    await press(renderer, 'Fermer sans supprimer');
    expect(dialogOpen(renderer)).toBe(false);
    expect(getQadaaLedger().manualEntries).toHaveLength(1);

    await press(renderer, 'Supprimer Ancien solde');
    const openModal = renderer.root.findAllByType(Modal).find(modal => modal.props.visible === true)!;
    await act(async () => {
      openModal.props.onRequestClose();
    });
    await flush();
    expect(dialogOpen(renderer)).toBe(false);
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
  });

  it('a cancelled dialog can be reopened and then confirmed', async () => {
    await addManualQadaaEntry({quantity: 2});
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    await press(renderer, 'Annuler la suppression');
    await press(renderer, 'Supprimer Ancien solde');
    await press(renderer, 'Confirmer la suppression');
    expect(getQadaaLedger().manualEntries).toEqual([]);
  });

  it('Supprimer deletes exactly the selected entry; the others, the automatic days and the completions stay; counters update', async () => {
    await confirmRamadanPeriod(4);
    const doomed = await addManualQadaaEntry({quantity: 2});
    const kept = await addManualQadaaEntry({quantity: 3, year: 2018, yearSystem: 'gregorian'});
    await recordQadaaCompletion({maxQuantity: 9});
    const completionsBefore = JSON.stringify(getQadaaLedger().completions);
    const historyBefore = JSON.stringify(getConfirmedPeriodHistory());
    const renderer = await render();
    expect(allTexts(renderer)).toContain('8 jours restants'); // 4 + 2 + 3 − 1

    await press(renderer, 'Supprimer Ancien solde');
    await press(renderer, 'Confirmer la suppression');

    expect(dialogOpen(renderer)).toBe(false);
    expect(getQadaaLedger().manualEntries.map(entry => entry.id)).toEqual([kept.id]);
    expect(getQadaaLedger().manualEntries.some(entry => entry.id === doomed.id)).toBe(false);
    expect(JSON.stringify(getQadaaLedger().completions)).toBe(completionsBefore);
    expect(JSON.stringify(getConfirmedPeriodHistory())).toBe(historyBefore);
    expect(allTexts(renderer)).toContain('6 jours restants'); // 4 automatic + 3 manual − 1 completed
    expect(allTexts(renderer)).toContain('Entrée supprimée');
  });

  it('the documented example: automatic 4 + manual 2, 1 completed → deleting the 2 leaves 3 remaining', async () => {
    await confirmRamadanPeriod(4);
    await addManualQadaaEntry({quantity: 2});
    await recordQadaaCompletion({maxQuantity: 9});
    const renderer = await render();
    expect(allTexts(renderer)).toContain('5 jours restants');
    await press(renderer, 'Supprimer Ancien solde');
    await press(renderer, 'Confirmer la suppression');
    expect(allTexts(renderer)).toContain('3 jours restants');
    expect(getQadaaLedger().completions).toHaveLength(1);
  });

  it('a rapid double tap on Supprimer deletes once (one call, one confirmation)', async () => {
    await addManualQadaaEntry({quantity: 2});
    const remove = jest.spyOn(ledger, 'removeManualQadaaEntry');
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    const confirm = buttonByLabel(renderer, 'Confirmer la suppression')!;
    await act(async () => {
      await Promise.all([confirm.props.onPress(), confirm.props.onPress(), confirm.props.onPress()]);
    });
    await flush();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(getQadaaLedger().manualEntries).toEqual([]);
    expect(allTexts(renderer).filter(text => text === 'Entrée supprimée')).toHaveLength(1);
  });

  it('automatic and completion rows never get a delete action; only manual entries do', async () => {
    await confirmRamadanPeriod(4);
    await addManualQadaaEntry({quantity: 2});
    await addManualQadaaEntry({quantity: 3, year: 2018, yearSystem: 'gregorian'});
    await recordQadaaCompletion({maxQuantity: 9});
    const renderer = await render();
    const labels = renderer.root.findAllByType(Pressable).map(node => node.props.accessibilityLabel).filter(Boolean) as string[];
    expect(labels.filter(label => /^Supprimer /.test(label)).sort()).toEqual(['Supprimer Ancien solde', 'Supprimer Ramadan 2018']);
    expect(labels.some(label => /Supprimer.*(automatique|Ramadan 14)/i.test(label))).toBe(false);
    expect(getConfirmedPeriodHistory()).toHaveLength(1);
  });

  it('other Qadaa actions still work after a deletion (add, edit, mark, undo)', async () => {
    await confirmRamadanPeriod(4);
    const doomed = await addManualQadaaEntry({quantity: 2});
    const renderer = await render();
    await press(renderer, 'Supprimer Ancien solde');
    await press(renderer, 'Confirmer la suppression');
    expect(getQadaaLedger().manualEntries.some(entry => entry.id === doomed.id)).toBe(false);

    await press(renderer, 'Marquer un jour de jeûne comme rattrapé');
    expect(getQadaaLedger().completions).toHaveLength(1);
    await press(renderer, 'Ajouter des jours');
    await press(renderer, 'Augmenter le nombre de jours');
    await press(renderer, 'Ajouter 2 jours à rattraper');
    expect(getQadaaLedger().manualEntries).toHaveLength(1);
    expect(allTexts(renderer)).toContain('5 jours restants'); // 4 + 2 − 1
  });
});

describe('describeQadaaManualEntryForDelete', () => {
  const today = new Date(2026, 8, 26, 12);
  it('derives the Gregorian year of a Hijri Ramadan from AWA’s own Hijri utilities', () => {
    const option = buildQadaaRamadanYearOptions(today).find(item => item.year === 1444)!;
    expect(describeQadaaManualEntryForDelete({quantity: 2, year: 1444, yearSystem: 'hijri', note: null}, today)).toEqual({
      quantityLabel: '2 jours',
      yearLabel: `Ramadan ${option.gregorianYear} (1444 AH)`,
      yearHint: null,
      note: null,
    });
  });

  it('falls back on "Ramadan N AH" when no Gregorian year can be derived, and handles unknown / Gregorian / note', () => {
    expect(describeQadaaManualEntryForDelete({quantity: 1, year: 1330, yearSystem: 'hijri', note: null}, today)).toMatchObject({
      quantityLabel: '1 jour',
      yearLabel: 'Ramadan 1330 AH',
    });
    expect(describeQadaaManualEntryForDelete({quantity: 3, year: null, yearSystem: null, note: '  ok  '}, today)).toEqual({
      quantityLabel: '3 jours',
      yearLabel: 'Ancien solde',
      yearHint: 'Année non renseignée',
      note: 'ok',
    });
    expect(describeQadaaManualEntryForDelete({quantity: 2, year: 2020, yearSystem: 'gregorian', note: ''}, today)).toMatchObject({
      yearLabel: 'Ramadan 2020',
      note: null,
    });
  });
});
