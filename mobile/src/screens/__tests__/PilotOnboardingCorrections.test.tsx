import React from 'react';
import {Pressable, Text, TextInput, View} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import {act, type ReactTestInstance} from 'react-test-renderer';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
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
import {AWA_MIN_TOUCH_TARGET} from '../../theme/iconSizes';
import {contrastRatio} from '../../theme/contrast';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import {
  THEME_VARIANTS,
  flattenStyle,
  renderWithAwaTheme,
  resetThemeStores,
} from '../../testUtils/renderWithAwaTheme';

// Welcome page rebuilt from the product owner's reference mock (360 x 640): hero in the upper section above two
// prominent stacked buttons, no icons, no feature card. Plus the Name screen's CTA treatment.

let mockWindow = {width: 360, height: 640, scale: 3, fontScale: 1};
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockWindow,
}));

const insetsFor = (bottom: number): Metrics => ({
  frame: {x: 0, y: 0, width: 360, height: 640},
  insets: {top: 24, left: 0, right: 0, bottom},
});
const wrap = (element: React.ReactElement, bottom = 48) => (
  <SafeAreaProvider initialMetrics={insetsFor(bottom)}>{element}</SafeAreaProvider>
);
const welcome = (navigate = jest.fn()) => (
  <WelcomeScreen navigation={{navigate} as never} route={{key: 'w', name: 'Welcome'} as never} />
);
const nameScreen = (navigate = jest.fn()) => (
  <NameOnboardingScreen navigation={{navigate} as never} route={{key: 'n', name: 'NameOnboarding'} as never} />
);

const LANGUAGES: Array<[AwaAppLanguage, Record<string, unknown>]> = [
  ['en', en], ['fr', fr], ['es', es], ['it', itDictionary], ['tr', tr], ['ru', ru], ['de', de], ['zh', zh],
];
const dig = (dictionary: Record<string, unknown>, key: string): string =>
  key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], dictionary) as string;

const flat = (node: ReactTestInstance, pressed = false) => {
  const style = node.props.style as unknown;
  return flattenStyle(typeof style === 'function' ? (style as (s: {pressed: boolean}) => unknown)({pressed}) : style);
};

beforeEach(async () => {
  mockWindow = {width: 360, height: 640, scale: 3, fontScale: 1};
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  await resetThemeStores();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Welcome matches the reference mock', () => {
  it('has exactly the lockup, one sentence and two buttons: no card, no tiles, no icons, one gradient', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const texts = renderer.root.findAllByType(Text).map(node => node.props.children).filter(c => typeof c === 'string');
    expect(texts).toContain('Bienvenue');
    expect(texts).toContain(fr.onboarding.welcome.subtitle);
    expect(texts).toContain('Commencer');
    expect(texts).toContain('J’ai déjà un compte');
    [fr.onboarding.welcome.cardTitle, fr.onboarding.welcome.feature1Title, fr.onboarding.welcome.privateBadge].forEach(copy => {
      expect(texts).not.toContain(copy);
    });
    expect(renderer.root.findAllByType(MaterialDesignIcons)).toHaveLength(0);
    expect(renderer.root.findAllByType(LinearGradient)).toHaveLength(1);
    expect(renderer.root.findAllByType(Pressable)).toHaveLength(2);
  });

  it('buttons: 56 dp tall, 302 dp wide (84% of 360), identical widths, 16 dp apart, pill shaped', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const [primary, secondary] = renderer.root.findAllByType(Pressable);
    const a = flat(primary);
    const b = flat(secondary);
    expect(a.minHeight).toBe(56);
    expect(b.minHeight).toBe(56);
    expect(a.width).toBe(302);
    expect(b.width).toBe(302);
    expect(b.marginTop).toBe(16);
    expect(a.borderRadius).toBe(1000);
    expect(b.borderRadius).toBe(1000);
  });

  it('labels keep the Material 3 label line height (20) at 17 sp, no icons', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const labels = renderer.root
      .findAllByType(Text)
      .filter(node => node.props.children === 'Commencer' || node.props.children === 'J’ai déjà un compte');
    expect(labels).toHaveLength(2);
    labels.forEach(label => expect(flattenStyle(label.props.style)).toMatchObject({fontSize: 17, lineHeight: 20}));
  });

  it('both labels are 17 sp weight 700 (the first weight Android Roboto renders heavier than Medium), centred, original wording', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const labels = renderer.root
      .findAllByType(Text)
      .filter(node => node.props.children === 'Commencer' || node.props.children === 'J’ai déjà un compte');
    expect(labels).toHaveLength(2);
    labels.forEach(label => expect(flattenStyle(label.props.style)).toMatchObject({fontSize: 17, fontWeight: '700', textAlign: 'center'}));
  });

  it('has no decorative background circles: only the page gradient sits behind the content', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const circles = renderer.root.findAll(node => {
      if (String(node.type) !== 'View') {return false;}
      const style = flattenStyle(node.props.style);
      const size = style.width;
      // anything large with equal width and height and a full radius (the old 350 dp orbs and halo layers); the pill
      // buttons are wider than tall and the 5 dp lockup dot is below the size floor
      return typeof size === 'number' && size >= 100 && style.height === size && (style.borderRadius as number) >= size / 2;
    });
    expect(circles).toHaveLength(0);
    expect(renderer.root.findAllByType(LinearGradient)).toHaveLength(1);
    // nothing absolutely positioned is rendered behind the content
    const absolute = renderer.root.findAll(
      node => String(node.type) === 'View' && flattenStyle(node.props.style).position === 'absolute',
    );
    expect(absolute).toHaveLength(0);
  });

  it('hero starts in the upper part of the free space; the bottom gap follows the safe area', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome(), 48));
    const region = renderer.root.findAll(
      node => String(node.type) === 'View' && flattenStyle(node.props.style).justifyContent === 'flex-start' && flattenStyle(node.props.style).paddingTop !== undefined,
    );
    expect(region.length).toBeGreaterThanOrEqual(1);
    // (640 - 24 top inset - 48 bottom inset) * 14% = 79.52, rounded to 80 dp.
    expect(flattenStyle(region[0].props.style).paddingTop).toBe(80);
    const actions = renderer.root.findAll(
      node => String(node.type) === 'View' && flattenStyle(node.props.style).paddingBottom !== undefined && flattenStyle(node.props.style).alignItems === 'center',
    );
    // max(inset, 16) + round(640 * 9%) = 48 + 58 = 106 dp: the action group floats well above the system bar.
    expect(flattenStyle(actions[0].props.style).paddingBottom).toBe(106);
    const spacer = renderer.root.findAll(
      node => String(node.type) === 'View' && flattenStyle(node.props.style).flex === 1 && flattenStyle(node.props.style).minHeight === 24,
    );
    expect(spacer.length).toBeGreaterThanOrEqual(1);
  });

  it.each([
    ['360 x 771', {width: 360, height: 771}, 117],
    ['360 x 640', {width: 360, height: 640}, 106],
    ['320 x 568', {width: 320, height: 568}, 99],
  ])('%s: the action group is lifted 9%% of the height (48..80) above the system bar, same width and height', async (_label, window, expected) => {
    mockWindow = {...mockWindow, ...window};
    const {renderer} = await renderWithAwaTheme(wrap(welcome(), 48));
    const actions = renderer.root.findAll(
      node => String(node.type) === 'View' && flattenStyle(node.props.style).paddingBottom !== undefined && flattenStyle(node.props.style).alignItems === 'center',
    );
    expect(flattenStyle(actions[0].props.style).paddingBottom).toBe(expected);
    const [primary, secondary] = renderer.root.findAllByType(Pressable);
    expect(flat(primary).width).toBe(flat(secondary).width);
    expect(flat(primary).minHeight).toBe(flat(secondary).minHeight);
  });

  it('keeps the divider and subtitle close to the lockup without changing text sizing', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const divider = renderer.root.findAll(
      node => String(node.type) === 'View' && flattenStyle(node.props.style).marginTop === 8,
    );
    expect(divider.length).toBeGreaterThanOrEqual(1);
    const subtitle = renderer.root.findAllByType(Text).find(node => node.props.children === fr.onboarding.welcome.subtitle)!;
    expect(flattenStyle(subtitle.props.style)).toMatchObject({marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center'});
  });

  it('the lockup keeps the display sizes of the mock at 360 dp and steps down only on very narrow phones', async () => {
    const regular = await renderWithAwaTheme(wrap(welcome()));
    const title = regular.renderer.root.findAllByType(Text).find(node => node.props.children === 'Bienvenue')!;
    expect(flattenStyle(title.props.style)).toMatchObject({fontSize: 36, fontFamily: 'serif'});
    await resetThemeStores();
    mockWindow = {...mockWindow, width: 320};
    const narrow = await renderWithAwaTheme(wrap(welcome()));
    const small = narrow.renderer.root.findAllByType(Text).find(node => node.props.children === 'Bienvenue')!;
    expect(flattenStyle(small.props.style).fontSize).toBe(32);
  });

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))('%s: filled and outlined buttons use the theme roles and stay readable', async (_label, variant) => {
    const {renderer, roles} = await renderWithAwaTheme(wrap(welcome()), variant);
    const [primary, secondary] = renderer.root.findAllByType(Pressable);
    expect(flat(primary).backgroundColor).toBe(roles.primary);
    expect(flat(secondary).borderColor).toBe(roles.outline);
    const [startLabel, accountLabel] = renderer.root
      .findAllByType(Text)
      .filter(node => node.props.children === 'Commencer' || node.props.children === 'J’ai déjà un compte');
    expect(contrastRatio(flattenStyle(startLabel.props.style).color as string, roles.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(flattenStyle(accountLabel.props.style).color as string, roles.background)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('R1 — the visible button and effective touch target are at least 48 dp', () => {
  it.each([
    ['360 x 771', {width: 360, height: 771}],
    ['360 x 640', {width: 360, height: 640}],
    ['320 x 568', {width: 320, height: 568}],
  ])('%s: both buttons reach >= 48 dp without their slops overlapping', async (_label, window) => {
    mockWindow = {...mockWindow, ...window};
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(welcome(navigate)));
    const [primary, secondary] = renderer.root.findAllByType(Pressable);
    [primary, secondary].forEach(button => {
      const slop = button.props.hitSlop as {top: number; bottom: number};
      expect((flat(button).minHeight as number) + slop.top + slop.bottom).toBeGreaterThanOrEqual(AWA_MIN_TOUCH_TARGET);
    });
    const slop = primary.props.hitSlop as {bottom: number};
    expect(slop.bottom * 2).toBeLessThanOrEqual(flat(secondary).marginTop as number); // gap 16 >= slops (0 at 56 dp)
    // identity preserved
    expect(primary.props.accessibilityLabel).toBe('Commencer');
    expect(secondary.props.accessibilityLabel).toBe('J’ai déjà un compte');
    expect(secondary.props.disabled).toBe(false);
    act(() => primary.props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('Objective');
    act(() => secondary.props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('Auth');
  });
});

describe('long translations (R5) — buttons widen, labels never truncate', () => {
  it.each(LANGUAGES.map(([code, dictionary]) => [code, dictionary] as const))('%s: both labels render verbatim in a button wide enough for them (estimate)', async (code, dictionary) => {
    await setAppLanguage(code);
    await i18n.changeLanguage(code);
    const {renderer} = await renderWithAwaTheme(wrap(welcome()));
    const [primary, secondary] = renderer.root.findAllByType(Pressable);
    const width = flat(primary).width as number;
    expect(flat(secondary).width).toBe(width);
    expect(width).toBeGreaterThanOrEqual(302);
    expect(width).toBeLessThanOrEqual(360 - 48);
    const need = (label: string) =>
      Array.from(label).reduce((sum, char) => sum + (/[　-鿿]/.test(char) ? 1 : /[A-ZÀ-Þ]/.test(char) ? 0.7 : 0.58), 0) * 17 + 32;
    [dig(dictionary, 'onboarding.welcome.start'), dig(dictionary, 'onboarding.welcome.alreadyHaveAccount')].forEach(label => {
      expect([label, width >= Math.min(need(label), 360 - 48)]).toEqual([label, true]);
    });
    const texts = renderer.root.findAllByType(Text).map(node => node.props.children);
    expect(texts).toContain(dig(dictionary, 'onboarding.welcome.start'));
    expect(texts).toContain(dig(dictionary, 'onboarding.welcome.alreadyHaveAccount'));
    renderer.root.findAllByType(Text).forEach(node => expect(node.props.numberOfLines).toBeUndefined());
  });
});

describe('Name screen — simplified form with the same primary button as Welcome', () => {
  it('label 17 sp / 700 like Welcome, 56 dp pill, no arrow icon, handler and 40 characters kept', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const navigate = jest.fn();
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen(navigate)));
    const button = renderer.root.findAllByType(Pressable)[0];
    const label = renderer.root.findAllByType(Text).find(node => node.props.children === 'Next')!;
    // Same treatment as the Welcome primary button; the label keeps the labelLarge line height (20).
    expect(flattenStyle(label.props.style)).toMatchObject({fontSize: 17, lineHeight: 20, fontWeight: '700', textAlign: 'center'});
    expect(flat(button).minHeight).toBe(56);
    expect(flat(button).borderRadius).toBe(1000);
    expect(button.findAll(node => node.props.name === 'arrow-right')).toHaveLength(0);
    expect(button.props.accessibilityRole).toBe('button');
    expect(renderer.root.findByType(TextInput).props.maxLength).toBe(40);
  });

  it('has one profile icon and the simple form only: no card, no shield / edit / check icons, no glow circles', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    const icons = renderer.root.findAll(node => typeof node.props.name === 'string' && /^(account|shield|star|check|message|arrow)/.test(node.props.name));
    const names = Array.from(new Set(icons.map(node => node.props.name as string)));
    expect(names).toEqual(['account-outline']);
    const texts = renderer.root.findAllByType(Text).map(node => node.props.children).filter(c => typeof c === 'string');
    ['Aperçu', fr.onboarding.name.cardSubtitle, fr.onboarding.name.privacyHint].forEach(copy => expect(texts).not.toContain(copy));
    expect(texts).toContain('TON ESPACE PERSONNEL');
    expect(texts).toContain('Ton prénom ou pseudo'); // the one visible field label
    expect(renderer.root.findAllByType(LinearGradient)).toHaveLength(1);
    const absolute = renderer.root.findAll(node => String(node.type) === 'View' && flattenStyle(node.props.style).position === 'absolute');
    expect(absolute).toHaveLength(0);
    // Counter sits under the input, aligned to the right.
    const counter = renderer.root.findAllByType(Text).find(node => Array.isArray(node.props.children) && node.props.children[1] === '/');
    expect(counter).toBeDefined();
    expect(flattenStyle(counter!.props.style).alignSelf).toBe('flex-end');
  });

  it('labelStyle is opt-in: every other AwaButton keeps the standard label', async () => {
    const {AwaButton} = require('../../components/ui/AwaButton');
    const {renderer} = await renderWithAwaTheme(wrap(<AwaButton label="Plain" />));
    const text = renderer.root.findAllByType(Text).find(node => node.props.children === 'Plain')!;
    expect(flattenStyle(text.props.style)).toMatchObject({fontSize: 14, lineHeight: 20});
    expect(renderer.root.findAllByType(View).length).toBeGreaterThan(0);
  });
});
