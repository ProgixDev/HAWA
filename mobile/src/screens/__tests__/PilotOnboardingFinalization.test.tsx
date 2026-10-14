import React from 'react';
import {act} from 'react-test-renderer';
import {Platform, Pressable, ScrollView, Text, TextInput} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import WelcomeScreen from '../WelcomeScreen';
import NameOnboardingScreen from '../NameOnboardingScreen';
import i18n from '../../i18n';
import {en} from '../../i18n/locales/en';
import {fr} from '../../i18n/locales/fr';
import {es} from '../../i18n/locales/es';
import {it as itDictionary} from '../../i18n/locales/it';
import {tr} from '../../i18n/locales/tr';
import {ru} from '../../i18n/locales/ru';
import {de} from '../../i18n/locales/de';
import {zh} from '../../i18n/locales/zh';
import {AWA_PRIMARY_ACTION_LABEL} from '../../theme/typescale';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import {flattenStyle, renderWithAwaTheme, resetThemeStores} from '../../testUtils/renderWithAwaTheme';

// Phase 3 pilot finalization (approved W1 / W2 / N1 + Option A): what the last batch added on top of the pilot suites.
// Code-level checks only: nothing here proves how the screens LOOK on a device.

const mockUpdate = jest.fn();
jest.mock('../../state/personalInformationStore', () => {
  const actual = jest.requireActual('../../state/personalInformationStore');
  return {
    ...actual,
    updatePersonalInformation: (...args: unknown[]) => mockUpdate(...args),
  };
});
jest.mock('../../services/saveFailure', () => ({presentSaveFailure: jest.fn()}));

const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const wrap = (element: React.ReactElement) => <SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>;
const welcome = (navigate = jest.fn()) => (
  <WelcomeScreen navigation={{navigate} as never} route={{key: 'w', name: 'Welcome'} as never} />
);
const nameScreen = (navigate = jest.fn()) => (
  <NameOnboardingScreen navigation={{navigate} as never} route={{key: 'n', name: 'NameOnboarding'} as never} />
);

const LANGUAGES: Array<[AwaAppLanguage, Record<string, unknown>]> = [
  ['en', en],
  ['fr', fr],
  ['es', es],
  ['it', itDictionary],
  ['tr', tr],
  ['ru', ru],
  ['de', de],
  ['zh', zh],
];
const dig = (dictionary: Record<string, unknown>, key: string): string =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dictionary) as string;

const joinedText = (node: {props: {children?: unknown}}) =>
  [node.props.children].flat(Infinity).filter(child => typeof child === 'string' || typeof child === 'number').join('');

beforeEach(async () => {
  mockUpdate.mockReset();
  mockUpdate.mockImplementation(async () => undefined);
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  await resetThemeStores();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Welcome W1 — the lockup is one accessible heading', () => {
  it.each(LANGUAGES.map(([code, dictionary]) => [code, dictionary] as const))(
    '%s: one header group with the composed label; the subtitle and the buttons stay outside it',
    async (code, dictionary) => {
      await setAppLanguage(code);
      await i18n.changeLanguage(code);
      const {renderer} = await renderWithAwaTheme(wrap(welcome()));
      const headers = renderer.root.findAll(node => node.props.accessibilityRole === 'header' && String(node.type) === 'View');
      expect(headers).toHaveLength(1);
      const group = headers[0];
      expect(group.props.accessible).toBe(true);
      const title = dig(dictionary, 'onboarding.welcome.title');
      const prefix = dig(dictionary, 'onboarding.welcome.brandPrefix');
      expect(group.props.accessibilityLabel).toBe(`${title} ${prefix} AWA`);

      // The three styled pieces live inside the group...
      const inside = group.findAllByType(Text).map(joinedText).map(text => text.trim());
      expect(inside).toEqual([title, prefix, 'AWA']);
      // ...and nothing else does.
      expect(inside).not.toContain(dig(dictionary, 'onboarding.welcome.subtitle'));
      expect(group.findAllByType(Pressable)).toHaveLength(0);
      expect(renderer.root.findAll(node => node.props.accessibilityRole === 'header' && String(node.type) === 'Text')).toHaveLength(0);
    },
  );
});

describe('Welcome W2 — scrolls instead of clipping, same three sections', () => {
  it('is a ScrollView whose container grows to the viewport and does not centre the content', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const scroll = renderer.root.findByType(ScrollView);
    const container = flattenStyle(scroll.props.contentContainerStyle);
    expect(container.flexGrow).toBe(1);
    expect(container.paddingHorizontal).toBe(18);
    expect(container.justifyContent).toBeUndefined();
    expect(container.flex).toBeUndefined();
    expect(scroll.props.showsVerticalScrollIndicator).toBe(false);
  });

  it('keeps the order: upper hero, flexible space, lower buttons (and nothing absolutely positioned)', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const nodes = renderer.root.findAll(() => true);
    const indexOf = (predicate: (node: (typeof nodes)[number]) => boolean) => nodes.findIndex(predicate);
    const hero = indexOf(node => String(node.type) === 'Text' && joinedText(node) === en.onboarding.welcome.title);
    const spacer = indexOf(node => {
      if (String(node.type) !== 'View') {return false;}
      const style = flattenStyle(node.props.style);
      return style.flex === 1 && style.minHeight === 24;
    });
    const buttons = indexOf(node => node.type === Pressable);
    expect(hero).toBeGreaterThan(-1);
    expect(spacer).toBeGreaterThan(hero);
    expect(buttons).toBeGreaterThan(spacer);
    expect(renderer.root.findAll(node => String(node.type) === 'View' && flattenStyle(node.props.style).position === 'absolute')).toHaveLength(0);
  });

  it('the buttons keep their handlers inside the ScrollView', async () => {
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(welcome(navigate)));
    const [primary, secondary] = renderer.root.findAllByType(Pressable);
    act(() => primary.props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('Objective');
    act(() => secondary.props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('Auth');
  });
});

describe('Name N1 — the new form keys', () => {
  it.each(LANGUAGES.map(([code, dictionary]) => [code, dictionary] as const))(
    '%s: formSubtitle / formPlaceholder / formFooter exist, are single-line, and are not left in English',
    (code, dictionary) => {
      ['formSubtitle', 'formPlaceholder', 'formFooter'].forEach(name => {
        const value = dig(dictionary, `onboarding.name.${name}`);
        expect([name, typeof value, value.trim().length > 0, value.includes('\n')]).toEqual([name, 'string', true, false]);
        if (code !== 'en') {
          expect([name, value === dig(en, `onboarding.name.${name}`)]).toEqual([name, false]);
        }
      });
    },
  );

  it('keeps the previous keys in every language (nothing was removed or renamed)', () => {
    LANGUAGES.forEach(([, dictionary]) => {
      ['eyebrow', 'title', 'subtitle', 'cardTitle', 'cardSubtitle', 'inputLabel', 'inputPlaceholder', 'privacyHint', 'previewLabel',
        'previewGreeting', 'previewGreetingNoName', 'saving', 'next', 'footer'].forEach(name => {
        expect([name, typeof dig(dictionary, `onboarding.name.${name}`)]).toEqual([name, 'string']);
      });
    });
  });

  it.each(LANGUAGES.map(([code, dictionary]) => [code, dictionary] as const))(
    '%s: the field label is shown once; the placeholder is a different string (no repeated label)',
    async (code, dictionary) => {
      await setAppLanguage(code);
      await i18n.changeLanguage(code);
      const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
      const label = dig(dictionary, 'onboarding.name.cardTitle');
      const placeholder = renderer.root.findByType(TextInput).props.placeholder as string;
      expect(placeholder).toBe(dig(dictionary, 'onboarding.name.formPlaceholder'));
      expect(placeholder.trim().toLowerCase()).not.toBe(label.trim().toLowerCase());
      expect(renderer.root.findAllByType(Text).map(joinedText).filter(text => text === label)).toHaveLength(1);
    },
  );

  it('shows the simplified form in French: the short subtitle, the field label, the helper line and the button', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    const texts = renderer.root.findAllByType(Text).map(joinedText);
    // The strings come from the dictionary on purpose: the copy is edited by the product owner, and the structure
    // (which key goes where) is what this test pins.
    [fr.onboarding.name.eyebrow, fr.onboarding.name.title, fr.onboarding.name.formSubtitle, fr.onboarding.name.cardTitle,
      fr.onboarding.name.formFooter, fr.onboarding.name.next].forEach(copy => expect(texts).toContain(copy));
  });
});

describe('Name — the empty-name behaviour is preserved for this batch', () => {
  it('an empty (or blank) name is still saved trimmed and navigation continues', async () => {
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen(navigate)));
    act(() => renderer.root.findByType(TextInput).props.onChangeText('   '));
    const next = renderer.root.findAllByType(Pressable)[0];
    expect(next.props.disabled).toBe(false);
    await act(async () => {
      await next.props.onPress();
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({preferredName: ''});
    expect(navigate).toHaveBeenCalledWith('SpiritualPreferences');
  });
});

describe('Typography (Option A) on the real screens, Android', () => {
  const weightOf = (renderer: {root: {findAllByType: (type: never) => Array<{props: {children?: unknown; style?: unknown}}>}}, text: string) => {
    const node = renderer.root.findAllByType(Text as never).find(candidate => joinedText(candidate).trim() === text);
    if (!node) {
      throw new Error(`no Text "${text}"`);
    }
    return flattenStyle(node.props.style).fontWeight;
  };

  it('Name: emphasized roles render at 700, the title and both labels at 700, the input and body at 400 / 500', async () => {
    const replaced = jest.replaceProperty(Platform, 'OS', 'android');
    try {
      const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
      expect(weightOf(renderer as never, en.onboarding.name.eyebrow)).toBe('700'); // labelSmall emphasized (600 -> 700)
      expect(weightOf(renderer as never, en.onboarding.name.cardTitle)).toBe('700'); // titleSmall emphasized
      expect(weightOf(renderer as never, en.onboarding.name.title)).toBe('700'); // explicit 700 on headlineMedium
      expect(weightOf(renderer as never, en.onboarding.name.formSubtitle)).toBe('400'); // bodyMedium regular
      expect(weightOf(renderer as never, en.onboarding.name.next)).toBe(AWA_PRIMARY_ACTION_LABEL.fontWeight);
      expect(flattenStyle(renderer.root.findByType(TextInput).props.style).fontWeight).toBe('500');
    } finally {
      replaced.restore();
    }
  });

  it('Welcome: both button labels are 700, and the lockup keeps its explicit legacy weights', async () => {
    const replaced = jest.replaceProperty(Platform, 'OS', 'android');
    try {
      const {renderer} = await renderWithAwaTheme(wrap(welcome()));
      expect(weightOf(renderer as never, en.onboarding.welcome.start)).toBe('700');
      expect(weightOf(renderer as never, en.onboarding.welcome.alreadyHaveAccount)).toBe('700');
      expect(weightOf(renderer as never, en.onboarding.welcome.title)).toBe('600'); // explicit override, untouched
      expect(weightOf(renderer as never, 'AWA')).toBe('800'); // explicit override, untouched
      expect(weightOf(renderer as never, en.onboarding.welcome.subtitle)).toBe('400');
    } finally {
      replaced.restore();
    }
  });
});
