import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import JournalMoodScreen from '../journal/JournalMoodScreen';
import PregnancySymptomsScreen from '../pregnancy/PregnancySymptomsScreen';
import PostpartumJournalEntryScreen from '../PostpartumJournalEntryScreen';
import PeriodStartBottomSheet from '../../components/calendar/PeriodStartBottomSheet';
import {getRecordedPeriodHistory, setCyclePreferences} from '../../state/onboardingPreferences';
import {getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {getPregnancyJournalState, savePregnancySymptoms} from '../../state/pregnancyJournalStore';
import {
  getAllPostpartumJournalEntries,
  getPostpartumJournalEntry,
  hydratePostpartumJournal,
  savePostpartumJournalField,
} from '../../state/postpartumJournalStore';
import {setAppLanguage} from '../../state/themePreferences';
import {resetSaveFailureForTests} from '../../services/saveFailure';
import secureStorage, {
  forgetUnavailableStructuredKeys,
  resetStructuredStorageForTests,
  setStructuredEncryptionEnabled,
} from '../../services/secureAsyncStorage';
import {STRUCTURED_KEY_SERVICE, isStructuredEnvelope} from '../../services/structuredEncryption';
import {clearAesKeyCache} from '../../services/secureAesKeyStore';
import i18n from '../../i18n';

// WHAT THE PERSON SEES when a journal save is refused (the protected record cannot be read): no success toast, no
// navigation as if saved, a localized error that points to the recovery options, the draft still in the form, the
// stored ciphertext untouched — and re-tapping Save works once the record is readable again.
// Real screens, real stores, real encryption (Keychain mock). Fixtures only.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const todayKey = () => new Date().toLocaleDateString('en-CA');
const OTHER_DAY = '2026-01-15';

const DAILY_KEY = '@hawa/daily-journal/v1';
const PREGNANCY_KEY = '@hawa/pregnancy-journal/v1';
const POSTPARTUM_KEY = '@hawa/postpartum-journal/v3';
const CYCLE_KEY = '@hawa/cycle-preferences';

const settle = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await new Promise<void>(resolve => setImmediate(resolve));
    });
  }
};

async function renderRoute(Component: React.ComponentType, params?: Record<string, unknown>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen component={Component as never} initialParams={params} name="Journal" />
                <Stack.Screen name="MainTabs">{() => <Text>home-reached</Text>}</Stack.Screen>
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
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const findButtons = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label);
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = findButtons(renderer, label);
  if (matches.length === 0) {throw new Error(`No button "${label}"`);}
  await act(async () => {
    await matches[0].props.onPress();
  });
  await settle();
};
const unmountAll = () =>
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });

const corruptCiphertext = async (key: string): Promise<{original: string; corrupted: string}> => {
  const original = (await AsyncStorage.getItem(key)) as string;
  expect(isStructuredEnvelope(original)).toBe(true);
  const envelope = JSON.parse(original) as {c: string};
  envelope.c = `${envelope.c.slice(0, -1)}${envelope.c.endsWith('0') ? '1' : '0'}`;
  const corrupted = JSON.stringify(envelope);
  await AsyncStorage.setItem(key, corrupted);
  return {original, corrupted};
};

/** The cause goes away and something reads the record successfully again (a restart / "Try again" + reload). */
const recover = async (key: string, original: string) => {
  await AsyncStorage.setItem(key, original);
  forgetUnavailableStructuredKeys();
  await secureStorage.getItem(key);
};

let alertSpy: jest.SpyInstance;

const alertedOnce = async () => {
  // the fallback alert (for failures nobody handled) is deferred by one macrotask: wait for it, then count.
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 20));
  });
  expect(alertSpy).toHaveBeenCalledTimes(1);
  const [title, message, buttons] = alertSpy.mock.calls[0] as [string, string, {text: string; onPress?: () => void}[]];
  return {title, message, buttons};
};

const dismissAlert = () => {
  const call = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string, {text: string; onPress?: () => void}[]];
  call[2].find(button => button.onPress && button.text === i18n.t('saveFailure.ok'))?.onPress?.();
  alertSpy.mockClear();
};

beforeAll(() => {
  setStructuredEncryptionEnabled(true);
});

afterAll(() => {
  setStructuredEncryptionEnabled(false);
});

beforeEach(async () => {
  await AsyncStorage.clear();
  await Keychain.resetGenericPassword({service: STRUCTURED_KEY_SERVICE});
  clearAesKeyCache();
  resetStructuredStorageForTests();
  resetSaveFailureForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  unmountAll();
  jest.restoreAllMocks();
});

const pressByText = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.findAllByType(Text).some(text => textOf(text) === label),
  );
  if (matches.length === 0) {throw new Error(`No pressable with text "${label}"`);}
  await act(async () => {
    await matches[0].props.onPress();
  });
  await settle();
};

describe('a refused period start (cycle): not announced as recorded, memory rolled back, retry works', () => {
  it('PeriodStartBottomSheet keeps the sheet open, alerts once, and a second tap records the period', async () => {
    await setCyclePreferences({lastPeriodStart: new Date(2026, 8, 10, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    await settle();
    const historyBefore = getRecordedPeriodHistory();
    const onConfirmed = jest.fn();
    const onClose = jest.fn();
    const {original, corrupted} = await corruptCiphertext(CYCLE_KEY);

    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <PeriodStartBottomSheet initialDate={new Date()} onClose={onClose} onConfirmed={onConfirmed} visible />
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    const confirmLabel = i18n.t('periodStartSheet.confirmToday');

    await pressByText(renderer, confirmLabel);

    const alert = await alertedOnce();
    expect(alert.title).toBe(i18n.t('saveFailure.title'));
    expect(alert.message).toBe(i18n.t('saveFailure.unavailableBody'));
    expect(onConfirmed).not.toHaveBeenCalled();
    expect(getRecordedPeriodHistory()).toEqual(historyBefore); // the refused period is not shown as recorded
    expect(await AsyncStorage.getItem(CYCLE_KEY)).toBe(corrupted);
    // the button is usable again (not stuck on "Enregistrement…")
    expect(textsOf(renderer)).toContain(confirmLabel);

    dismissAlert();
    await recover(CYCLE_KEY, original);
    await pressByText(renderer, confirmLabel);
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(getRecordedPeriodHistory().length).toBe(historyBefore.length + 1);
    expect(alertSpy).not.toHaveBeenCalled();
  });
});

describe('a refused journal save: no success, a localized pointer to recovery, draft kept, retry works', () => {
  it('Cycle mood (shared daily journal)', async () => {
    await saveJournalSection(OTHER_DAY, 'sleep', {bedtime: '23:00', wakeTime: '07:00', quality: 'Bonne', awakenings: 0, note: ''});
    const renderer = await renderRoute(JournalMoodScreen);
    const {original, corrupted} = await corruptCiphertext(DAILY_KEY);
    const saveLabel = i18n.t('journalMood.saveMood');
    const successToast = i18n.t('journalMood.savedToast');

    await press(renderer, saveLabel);

    // localized error that points to the recovery options; no success toast
    const alert = await alertedOnce();
    expect(alert.title).toBe(i18n.t('saveFailure.title'));
    expect(alert.message).toBe(i18n.t('saveFailure.unavailableBody'));
    expect(alert.buttons.map(button => button.text)).toContain(i18n.t('saveFailure.recoveryAction'));
    expect(textsOf(renderer)).not.toContain(successToast);
    // the stored record is untouched
    expect(await AsyncStorage.getItem(DAILY_KEY)).toBe(corrupted);

    // recovery, then simply tapping Save again
    dismissAlert();
    await recover(DAILY_KEY, original);
    await press(renderer, saveLabel);
    expect(textsOf(renderer)).toContain(successToast);
    expect((await getJournalEntry(todayKey()))?.mood).toBeDefined();
    expect((await getJournalEntry(OTHER_DAY))?.sleep).toBeDefined(); // nothing else was lost
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('Pregnancy symptoms', async () => {
    await savePregnancySymptoms({date: OTHER_DAY, symptoms: ['Fatigue'], updatedAt: '2026-01-15T08:00:00.000Z'});
    const renderer = await renderRoute(PregnancySymptomsScreen);
    await press(renderer, 'Nausées');
    const {original, corrupted} = await corruptCiphertext(PREGNANCY_KEY);
    const successTitle = i18n.t('pregnancySymptoms.saveToast.savedTitle');

    await press(renderer, 'Enregistrer mes symptômes');

    const alert = await alertedOnce();
    expect(alert.title).toBe(i18n.t('saveFailure.title'));
    expect(alert.message).toBe(i18n.t('saveFailure.unavailableBody'));
    expect(textsOf(renderer)).not.toContain(successTitle);
    // not announced as saved: the "clear today's entry" action only exists for a saved entry
    expect(findButtons(renderer, 'Effacer les symptômes du jour')).toHaveLength(0);
    // the selection is still in the form
    expect(textsOf(renderer)).toContain('1 sélectionné');
    expect(await AsyncStorage.getItem(PREGNANCY_KEY)).toBe(corrupted);

    dismissAlert();
    await recover(PREGNANCY_KEY, original);
    await press(renderer, 'Enregistrer mes symptômes');
    expect(textsOf(renderer)).toContain(successTitle);
    const state = await getPregnancyJournalState();
    expect(state.symptoms.find(entry => entry.date === todayKey())?.symptoms).toEqual(['Nausées']);
    expect(state.symptoms.find(entry => entry.date === OTHER_DAY)?.symptoms).toEqual(['Fatigue']);
  });

  it('Postpartum daily answer (memoised owner store)', async () => {
    await hydratePostpartumJournal();
    await savePostpartumJournalField(OTHER_DAY, 'fatigue', 'Forte');
    const before = getAllPostpartumJournalEntries();
    const renderer = await renderRoute(PostpartumJournalEntryScreen as never, {category: 'fatigue'});
    await press(renderer, 'Modérée');
    const {original, corrupted} = await corruptCiphertext(POSTPARTUM_KEY);

    await press(renderer, 'Enregistrer');

    const alert = await alertedOnce();
    expect(alert.title).toBe(i18n.t('saveFailure.title'));
    expect(alert.message).toBe(i18n.t('saveFailure.unavailableBody'));
    // no navigation "home" as if saved, no success toast; memory did not keep the refused answer
    expect(textsOf(renderer)).not.toContain('home-reached');
    expect(getPostpartumJournalEntry(todayKey())).toBeUndefined();
    expect(getAllPostpartumJournalEntries()).toEqual(before);
    expect(await AsyncStorage.getItem(POSTPARTUM_KEY)).toBe(corrupted);

    dismissAlert();
    await recover(POSTPARTUM_KEY, original);
    await press(renderer, 'Enregistrer');
    expect(getPostpartumJournalEntry(todayKey())?.fatigue).toBe('Modérée');
    expect(getPostpartumJournalEntry(OTHER_DAY)?.fatigue).toBe('Forte');
  });
});
