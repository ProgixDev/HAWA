import fs from 'fs';
import path from 'path';
import React from 'react';
import {act} from 'react-test-renderer';
import {Pressable, Text, TextInput} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

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
import {contrastRatio, WCAG_AA_TEXT} from '../../theme/contrast';
import {AWA_MIN_TEXT_SIZE} from '../../theme/typescale';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import {getCachedPersonalInformation, updatePersonalInformation} from '../../state/personalInformationStore';
import {
  THEME_VARIANTS,
  flattenStyle,
  renderWithAwaTheme,
  resetThemeStores,
} from '../../testUtils/renderWithAwaTheme';

// Phase 3, pilot batch 1: WelcomeScreen + NameOnboardingScreen on the Material 3 design system. These tests pin what
// must NOT change (navigation, save / failure path, input props, labels, animations) and what the migration is allowed
// to change (type roles, colours, shapes, shared components).

const mockUpdate = jest.fn();
const mockPresentSaveFailure = jest.fn();
jest.mock('../../state/personalInformationStore', () => {
  const actual = jest.requireActual('../../state/personalInformationStore');
  return {
    ...actual,
    updatePersonalInformation: (...args: unknown[]) => mockUpdate(...args),
  };
});
jest.mock('../../services/saveFailure', () => ({
  presentSaveFailure: (...args: unknown[]) => mockPresentSaveFailure(...args),
}));

const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const SRC = path.join(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(SRC, file), 'utf8');
const strip = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

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

const textsOf = (renderer: {root: {findAllByType: (type: never) => Array<{props: {children?: unknown}}>}}) =>
  renderer.root
    .findAllByType(Text as never)
    .map(node => [node.props.children].flat(Infinity).filter(child => typeof child === 'string' || typeof child === 'number').join(''));

beforeEach(async () => {
  mockUpdate.mockReset();
  mockUpdate.mockImplementation(async () => undefined);
  mockPresentSaveFailure.mockReset();
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  await resetThemeStores();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('source discipline (design tokens only)', () => {
  const files = ['WelcomeScreen.tsx', 'NameOnboardingScreen.tsx'];

  it.each(files)('%s has no raw hex colour and no raw fontSize literal', file => {
    const text = strip(read(file));
    expect(text.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []).toEqual([]);
    expect(text.match(/fontSize:\s*[0-9.]+/g) ?? []).toEqual([]);
  });

  it.each(files)('%s keeps the theme provider contract the onboarding guard test relies on', file => {
    const text = read(file);
    expect(text).toMatch(/useAwaTheme\s*\(/);
    expect(text).not.toMatch(/useColorScheme\s*\(|isDark\s*\?|theme\.id\s*===/);
    expect(text).not.toMatch(/from ['"].*\/theme\/colors['"]|from ['"].*\/home\/homeTheme['"]/);
  });

  it('serif remains only in the WelcomeScreen brand lockup; the name screen is sans', () => {
    expect((strip(read('WelcomeScreen.tsx')).match(/fontFamily:\s*'serif'/g) ?? []).length).toBe(3);
    expect(strip(read('NameOnboardingScreen.tsx'))).not.toMatch(/fontFamily:\s*'serif'/);
  });

  it('uses the shared components and no raw Text / Pressable / MaterialDesignIcons', () => {
    ['WelcomeScreen.tsx', 'NameOnboardingScreen.tsx'].forEach(file => {
      const text = strip(read(file));
      expect(text).toMatch(/components\/ui\/AwaText/);
      expect(text).not.toMatch(/<Text\b|<Pressable\b|<MaterialDesignIcons\b|<TouchableOpacity\b/);
    });
  });
});

describe('WelcomeScreen', () => {
  it('Get started -> Objective, "I already have an account" -> Auth (labels and callbacks unchanged)', async () => {
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(welcome(navigate)));
    const buttons = renderer.root.findAllByType(Pressable);
    expect(buttons).toHaveLength(2);
    expect(buttons.map(button => button.props.accessibilityRole)).toEqual(['button', 'button']);
    expect(buttons.map(button => button.props.accessibilityLabel)).toEqual(['Get started', 'I already have an account']);
    act(() => buttons[0].props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('Objective');
    act(() => buttons[1].props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('Auth');
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('keeps the page gradient (one gradient only: the inner card gradient and the button gradients are gone)', async () => {
    const {renderer, theme} = await renderWithAwaTheme(wrap(welcome()));
    const gradients = renderer.root.findAllByType(LinearGradient);
    expect(gradients).toHaveLength(1);
    expect(gradients[0].props.colors).toEqual([...theme.gradients.pageBackground]);
  });

  it('every text is at least 11 sp (the Material 3 floor) and none is clipped by numberOfLines', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    renderer.root.findAllByType(Text).forEach(node => {
      const style = flattenStyle(node.props.style);
      if (/Material/i.test(String(style.fontFamily ?? ''))) {return;} // an icon glyph, not text
      const size = style.fontSize as number | undefined;
      if (size !== undefined) {
        expect(size).toBeGreaterThanOrEqual(AWA_MIN_TEXT_SIZE);
      }
      if (node.props.adjustsFontSizeToFit) {
        // the three single-word feature tiles shrink to fit one line (never below 80%); everything else wraps freely
        expect(node.props.numberOfLines).toBe(1);
        expect(node.props.minimumFontScale).toBe(0.8);
      } else {
        expect(node.props.numberOfLines).toBeUndefined();
      }
      expect(node.props.allowFontScaling).toBeUndefined();
    });
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: renders, with readable primary action and card text', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(wrap(welcome()), variant);
    const primary = renderer.root.findAllByType(Pressable)[0];
    const background = flattenStyle(primary.props.style({pressed: false})).backgroundColor as string;
    expect(background).toBe(roles.primary);
    const label = renderer.root.findAllByType(Text).find(node => node.props.children === 'Get started')!;
    expect(contrastRatio(flattenStyle(label.props.style).color as string, background)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    const subtitle = renderer.root
      .findAllByType(Text)
      .find(node => node.props.children === en.onboarding.welcome.subtitle)!;
    expect(contrastRatio(flattenStyle(subtitle.props.style).color as string, variant.mode === 'dark' ? roles.background : roles.background)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it.each(LANGUAGES.map(([code, dictionary]) => [code, dictionary] as const))('%s: shows its own copy and no raw translation key', async (code, dictionary) => {
    await setAppLanguage(code);
    await i18n.changeLanguage(code);
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const texts = textsOf(renderer as never);
    [
      'onboarding.welcome.title',
      'onboarding.welcome.subtitle',
      'onboarding.welcome.start',
      'onboarding.welcome.alreadyHaveAccount',
    ].forEach(key => {
      expect([key, texts.includes(dig(dictionary, key))]).toEqual([key, true]);
    });
    expect(texts.filter(text => /^onboarding\./.test(text))).toEqual([]);
  });
});

describe('NameOnboardingScreen', () => {
  it('keeps every TextInput prop, the label, the placeholder colour contrast and the submit handler', async () => {
    const {renderer, roles} = await renderWithAwaTheme(wrap(nameScreen()));
    const input = renderer.root.findByType(TextInput);
    expect(input.props).toMatchObject({
      accessibilityLabel: 'First name or nickname',
      autoCapitalize: 'words',
      autoCorrect: false,
      maxLength: 40,
      returnKeyType: 'done',
      // The visible field label above the input is `cardTitle`; the placeholder is the dedicated `formPlaceholder` key
      // ("Enter your first name"), so the label words are not shown twice (the former `inputPlaceholder` text equals
      // `cardTitle` in every language). Placeholder copy changed on purpose (approved N1).
      placeholder: en.onboarding.name.formPlaceholder,
    });
    expect(typeof input.props.onSubmitEditing).toBe('function');
    expect(typeof input.props.onFocus).toBe('function');
    expect(typeof input.props.onBlur).toBe('function');
    expect(input.props.value).toBe(getCachedPersonalInformation().preferredName);
    expect(contrastRatio(input.props.placeholderTextColor, roles.surface)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it('Next saves the trimmed name once, then navigates to SpiritualPreferences', async () => {
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen(navigate)));
    const input = renderer.root.findByType(TextInput);
    act(() => input.props.onChangeText('  Amina  '));
    const next = renderer.root.findAllByType(Pressable)[0];
    await act(async () => {
      await next.props.onPress();
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({preferredName: 'Amina'});
    expect(navigate).toHaveBeenCalledWith('SpiritualPreferences');
    expect(mockPresentSaveFailure).not.toHaveBeenCalled();
  });

  it('while saving the button is disabled, the label switches and a second press is ignored', async () => {
    let release: () => void = () => undefined;
    mockUpdate.mockImplementation(() => new Promise<void>(resolve => {release = resolve;}));
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen(navigate)));
    const next = () => renderer.root.findAllByType(Pressable)[0];
    let first!: Promise<void>;
    act(() => {
      first = next().props.onPress();
    });
    expect(next().props.disabled).toBe(true);
    expect(textsOf(renderer as never)).toContain(en.onboarding.name.saving);
    await act(async () => {
      await next().props.onPress(); // ignored by the saving guard
    });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    await act(async () => {
      release();
      await first;
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(next().props.disabled).toBe(false);
  });

  it('a save failure stays on the screen with the typed name and reports through presentSaveFailure', async () => {
    const failure = new Error('unavailable');
    mockUpdate.mockRejectedValueOnce(failure);
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen(navigate)));
    act(() => renderer.root.findByType(TextInput).props.onChangeText('Sara'));
    await act(async () => {
      await renderer.root.findAllByType(Pressable)[0].props.onPress();
    });
    expect(navigate).not.toHaveBeenCalled();
    expect(mockPresentSaveFailure).toHaveBeenCalledWith(failure);
    expect(renderer.root.findByType(TextInput).props.value).toBe('Sara');
    expect(renderer.root.findAllByType(Pressable)[0].props.disabled).toBe(false);
  });

  it('submitting from the keyboard runs the same save path', async () => {
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen(navigate)));
    act(() => renderer.root.findByType(TextInput).props.onChangeText('Lina'));
    await act(async () => {
      await renderer.root.findByType(TextInput).props.onSubmitEditing();
    });
    expect(mockUpdate).toHaveBeenCalledWith({preferredName: 'Lina'});
    expect(navigate).toHaveBeenCalledWith('SpiritualPreferences');
  });

  it('the 40-character counter follows the typed name; the preview greeting is no longer shown (simplified form)', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    act(() => renderer.root.findByType(TextInput).props.onChangeText('Fatima'));
    const texts = textsOf(renderer as never);
    expect(texts).toContain('6/40');
    // The typed name lives in the input only: no preview card repeats it.
    expect(texts.some(text => text.includes('Fatima'))).toBe(false);
    expect(texts).not.toContain(en.onboarding.name.previewLabel);
  });

  it('every text is at least 11 sp and none is clipped', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    renderer.root.findAllByType(Text).forEach(node => {
      const style = flattenStyle(node.props.style);
      if (/Material/i.test(String(style.fontFamily ?? ''))) {return;} // an icon glyph, not text
      const size = style.fontSize as number | undefined;
      if (size !== undefined) {
        expect(size).toBeGreaterThanOrEqual(AWA_MIN_TEXT_SIZE);
      }
      expect(node.props.numberOfLines).toBeUndefined();
    });
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: renders; the input border is a visible outline role', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(wrap(nameScreen()), variant);
    const next = renderer.root.findAllByType(Pressable)[0];
    expect(flattenStyle(next.props.style({pressed: false})).backgroundColor).toBe(roles.primary);
    expect(contrastRatio(roles.outline, roles.surface)).toBeGreaterThanOrEqual(3);
  });

  it.each(LANGUAGES.map(([code, dictionary]) => [code, dictionary] as const))('%s: shows its own copy and no raw translation key', async (code, dictionary) => {
    await updatePersonalInformation({preferredName: ''}).catch(() => undefined);
    await setAppLanguage(code);
    await i18n.changeLanguage(code);
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    const texts = textsOf(renderer as never);
    // The simplified form: title, the short subtitle, the button and the short helper line. The field label
    // (cardTitle) is no longer shown above the input.
    ['onboarding.name.title', 'onboarding.name.formSubtitle', 'onboarding.name.next', 'onboarding.name.formFooter'].forEach(key => {
      expect([key, texts.includes(dig(dictionary, key))]).toEqual([key, true]);
    });
    expect(texts.includes(dig(dictionary, 'onboarding.name.cardTitle'))).toBe(false);
    expect(renderer.root.findByType(TextInput).props.placeholder).toBe(dig(dictionary, 'onboarding.name.formPlaceholder'));
    // The two-line subtitle and the previous helper line are no longer shown (keys untouched), nor are the
    // information-card caption, the privacy hint and the preview card.
    ['onboarding.name.subtitle', 'onboarding.name.footer', 'onboarding.name.cardSubtitle', 'onboarding.name.privacyHint', 'onboarding.name.previewLabel'].forEach(key => {
      expect([key, texts.includes(dig(dictionary, key))]).toEqual([key, false]);
    });
    expect(texts.filter(text => /^onboarding\./.test(text))).toEqual([]);
    expect(renderer.root.findByType(TextInput).props.accessibilityLabel).toBe(dig(dictionary, 'onboarding.name.inputLabel'));
  });
});
