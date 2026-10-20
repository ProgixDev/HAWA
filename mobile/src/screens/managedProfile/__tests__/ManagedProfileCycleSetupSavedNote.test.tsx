import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ScrollView, StyleSheet, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ManagedProfileCycleSetupScreen from '../ManagedProfileCycleSetupScreen';
import {clearManagedProfileDraft, startManagedProfileDraft, updateManagedProfileDraft} from '../../../state/managedProfileDraftStore';
import {getManagedProfiles, resetManagedProfilesForTests} from '../../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../../state/activeProfileStore';
import {setAppLanguage, setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {de} from '../../../i18n/locales/de';
import {en} from '../../../i18n/locales/en';
import {es} from '../../../i18n/locales/es';
import {fr} from '../../../i18n/locales/fr';
import {id as idDictionary} from '../../../i18n/locales/id';
import {it as itDictionary} from '../../../i18n/locales/it';
import {ru} from '../../../i18n/locales/ru';
import {tr} from '../../../i18n/locales/tr';
import {zh} from '../../../i18n/locales/zh';

// The cycle-setup form of a daughter's profile. With "Régulier" or "Irrégulier" the period and cycle lengths shown are saved
// by "Créer le profil" even if no stepper was touched — so the helper card says so, with the lengths currently shown,
// updating live, in every language. With "Je ne sais pas" the card keeps its original sentence. The note lives in the
// scrolled content (above the sticky button) with no line cap and no fixed height, so it is always fully readable.

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => true)};
});

const Stack = createNativeStackNavigator();
// a compact Android phone: 320 x 568 dp, with the 3-button navigation bar
const SMALL_PHONE: Metrics = {frame: {x: 0, y: 0, width: 320, height: 568}, insets: {top: 24, left: 0, right: 0, bottom: 48}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const LANGUAGES = {fr, en, es, it: itDictionary, tr, ru, de, zh, id: idDictionary} as const;
type Language = keyof typeof LANGUAGES;

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function renderSetup() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={SMALL_PHONE}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={ManagedProfileCycleSetupScreen as never} name="ManagedProfileCycleSetup" />
              <Stack.Screen component={(() => <Text>success</Text>) as never} name="ManagedProfileSuccess" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const t = (key: string, options?: Record<string, unknown>): string => i18n.t(`managedProfile.cycleSetup.${key}`, options) as string;
const days = (count: number): string => t('days', {count});
const note = (period: number, cycle: number): string => t('savedValuesNote', {period: days(period), cycle: days(cycle), button: t('createProfile')});

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, role: 'radio' | 'button') => {
  const matches = renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === role && typeof node.props.onPress === 'function');
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
};
// the two steppers share the "increase" / "decrease" labels: the live buttons' parent is a host View
const pressStepper = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, index: 0 | 1) => {
  const matches = renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label && (node.parent?.type as unknown) === 'View');
  expect(matches.length).toBe(2);
  await act(async () => {
    matches[index].props.onPress();
  });
};

/** The helper card's text: the one that says the lengths are saved, or the original sentence — or neither. */
const helperText = (renderer: ReactTestRenderer.ReactTestRenderer, expected: string) =>
  renderer.root.findAllByType(Text).find(node => textOf(node) === expected);

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  clearManagedProfileDraft();
  startManagedProfileDraft();
  updateManagedProfileDraft({type: 'daughter', firstName: 'Lina', birthDate: new Date(2016, 0, 1), hasHadFirstPeriod: true});
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe.each(Object.keys(LANGUAGES) as Language[])('cycle-setup helper card — %s', language => {
  beforeEach(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });

  it('shows the original sentence for "Je ne sais pas" (the form default), and no note', async () => {
    const renderer = await renderSetup();
    expect(helperText(renderer, t('helperText'))).toBeDefined();
    expect(helperText(renderer, note(5, 28))).toBeUndefined();
    await press(renderer, t('unknown'), 'radio');
    expect(helperText(renderer, t('helperText'))).toBeDefined();
  });

  it.each(['regular', 'irregular'] as const)('says what "Créer le profil" will save when "%s" is chosen — and follows both steppers live', async choice => {
    const renderer = await renderSetup();
    await press(renderer, t(choice), 'radio');

    expect(helperText(renderer, note(5, 28))).toBeDefined(); // the pre-filled values
    expect(helperText(renderer, t('helperText'))).toBeUndefined();

    await pressStepper(renderer, t('increase'), 0); // period 5 -> 6
    expect(helperText(renderer, note(6, 28))).toBeDefined();
    await pressStepper(renderer, t('increase'), 0); // 7
    await pressStepper(renderer, t('decrease'), 1); // cycle 28 -> 27
    expect(helperText(renderer, note(7, 27))).toBeDefined();
    expect(helperText(renderer, note(6, 28))).toBeUndefined(); // the old values are gone, not appended

    // back to "Je ne sais pas": the note goes, the original sentence returns
    await press(renderer, t('unknown'), 'radio');
    expect(helperText(renderer, note(7, 27))).toBeUndefined();
    expect(helperText(renderer, t('helperText'))).toBeDefined();
  });

  it('the note carries the two lengths and the real button label, with no placeholder left unresolved', async () => {
    const renderer = await renderSetup();
    await press(renderer, t('regular'), 'radio');
    const text = textOf(helperText(renderer, note(5, 28))!);

    expect(text).toContain(days(5));
    expect(text).toContain(days(28));
    expect(text).toContain(t('createProfile'));
    expect(text).not.toMatch(/\{\{|\}\}/);
    // and it is its own sentence, not the original helper with something appended
    expect(text).not.toBe(t('helperText'));
  });

  it('is fully readable on a 320 x 568 dp phone: wraps instead of being cut, scrolls above the sticky button', async () => {
    const renderer = await renderSetup();
    await press(renderer, t('regular'), 'radio');
    const helper = helperText(renderer, note(5, 28))!;

    // no line cap, no ellipsis, no fixed height on the text or on the card around it
    expect(helper.props.numberOfLines).toBeUndefined();
    expect(helper.props.ellipsizeMode).toBeUndefined();
    const helperStyle = StyleSheet.flatten(helper.props.style) as Record<string, unknown>;
    expect(helperStyle.height).toBeUndefined();
    expect(helperStyle.maxHeight).toBeUndefined();
    expect(helperStyle.flex).toBe(1); // takes the card's width next to the icon, so a long sentence wraps
    // announced when it changes (Android live region)
    expect(helper.props.accessibilityLiveRegion).toBe('polite');

    // it is part of the scrolled content ...
    const scroll = renderer.root.findAllByType(ScrollView)[0];
    expect(scroll.findAllByType(Text).some(node => textOf(node) === note(5, 28))).toBe(true);
    // ... and the "Créer le profil" button is NOT inside it: it is the sticky footer below, so it never covers the note
    const buttonsInScroll = scroll.findAll(node => node.props.accessibilityLabel === t('createProfile') && node.props.accessibilityRole === 'button');
    expect(buttonsInScroll).toHaveLength(0);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === t('createProfile') && node.props.accessibilityRole === 'button').length).toBeGreaterThan(0);
  });

  it('nothing is saved by looking at the note: no profile exists until "Créer le profil"', async () => {
    const renderer = await renderSetup();
    await press(renderer, t('regular'), 'radio');
    await pressStepper(renderer, t('increase'), 1);

    expect(getManagedProfiles()).toHaveLength(0);
    expect((await AsyncStorage.getAllKeys()).filter(storageKey => storageKey.includes(':profile:'))).toEqual([]);
  });
});

describe('the note is in every dictionary with the same placeholders', () => {
  it.each(Object.keys(LANGUAGES) as Language[])('%s', language => {
    const dictionary = LANGUAGES[language] as unknown as {managedProfile: {cycleSetup: {savedValuesNote: string; helperText: string}}};
    const text = dictionary.managedProfile.cycleSetup.savedValuesNote;
    expect(typeof text).toBe('string');
    expect(text.match(/\{\{\w+\}\}/g)?.sort()).toEqual(['{{button}}', '{{cycle}}', '{{period}}']);
    expect(text).not.toBe(dictionary.managedProfile.cycleSetup.helperText);
  });

  it('is written in its own language (not the English or French sentence)', () => {
    const notes = (Object.keys(LANGUAGES) as Language[]).map(language => (LANGUAGES[language] as unknown as {managedProfile: {cycleSetup: {savedValuesNote: string}}}).managedProfile.cycleSetup.savedValuesNote);
    expect(new Set(notes).size).toBe(notes.length);
  });
});
