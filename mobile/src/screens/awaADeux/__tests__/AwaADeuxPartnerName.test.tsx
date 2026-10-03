import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Dimensions, Image, Keyboard, KeyboardAvoidingView, ScrollView, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {onPrimaryTextColor, resolveAwaTheme} from '../../../theme/awaThemeTokens';
import AwaADeuxIntroScreen from '../AwaADeuxIntroScreen';
import AwaADeuxPartnerNameScreen from '../AwaADeuxPartnerNameScreen';
import AwaADeuxPartnerViewScreen from '../AwaADeuxPartnerViewScreen';
import {clearAwaADeuxPartnerName, getAwaADeuxPartnerName, normalizePartnerName} from '../../../state/awaADeuxPartnerStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// "Comment s'appelle votre partenaire ?": Intro → Découvrir → this screen → Continuer.
// Frontend only: the name is local state, handed to the next step as a route param.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flat = (style: unknown): Record<string, any> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const currentRoute = () => (navRef.getCurrentRoute() as {name: string; params?: {partnerName?: string}} | undefined);
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderFlow(metrics: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}}) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={metrics}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName="AwaADeuxIntro" screenOptions={{headerShown: false}}>
              <Stack.Screen component={AwaADeuxIntroScreen as never} name="AwaADeuxIntro" />
              <Stack.Screen component={AwaADeuxPartnerNameScreen as never} name="AwaADeuxPartnerName" />
              <Stack.Screen component={AwaADeuxPartnerViewScreen as never} name="AwaADeuxPartnerView" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const button = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function').pop()!;
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    button(renderer, label).props.onPress();
  });
  await settle();
};
const input = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom du partenaire').pop()!;
const type = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
  await act(async () => {
    input(renderer).props.onChangeText(value);
  });
};
const openNameScreen = async (metrics?: Metrics) => {
  const renderer = await renderFlow(metrics);
  await press(renderer, 'Découvrir AWA à deux');
  return renderer;
};
const isDisabled = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const cta = button(renderer, 'Continuer');
  return cta.props.disabled === true && cta.props.accessibilityState?.disabled === true;
};

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  await clearAwaADeuxPartnerName();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
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
});

describe('Navigation', () => {
  it('"Découvrir" opens the partner-name screen (one instance, even on a double tap)', async () => {
    const renderer = await renderFlow();
    await act(async () => {
      const cta = button(renderer, 'Découvrir AWA à deux');
      cta.props.onPress();
      cta.props.onPress();
    });
    await settle();
    expect(currentRoute()?.name).toBe('AwaADeuxPartnerName');
    expect((navRef.getRootState().routes as {name: string}[]).map(route => route.name)).toEqual(['AwaADeuxIntro', 'AwaADeuxPartnerName']);
  });

  it('Retour and the Android hardware Back return to the introduction', async () => {
    const renderer = await openNameScreen();
    await press(renderer, 'Retour');
    expect(currentRoute()?.name).toBe('AwaADeuxIntro');
    await press(renderer, 'Découvrir AWA à deux');
    await act(async () => {
      navRef.goBack();
    });
    await settle();
    expect(currentRoute()?.name).toBe('AwaADeuxIntro');
  });

  it('Continuer saves the trimmed name and goes to the next existing step', async () => {
    const renderer = await openNameScreen();
    await type(renderer, '   Yacine  ');
    await press(renderer, 'Continuer');
    expect(currentRoute()?.name).toBe('AwaADeuxPartnerView');
    expect(getAwaADeuxPartnerName()).toBe('Yacine');
  });

  it('coming back keeps what was typed', async () => {
    const renderer = await openNameScreen();
    await type(renderer, 'Yacine');
    await press(renderer, 'Continuer');
    await press(renderer, 'Retour');
    expect(currentRoute()?.name).toBe('AwaADeuxPartnerName');
    expect(input(renderer).props.value).toBe('Yacine');
  });
});

describe('Content', () => {
  it('shows the heart, the title, the description, the labelled field with its placeholder and the CTA', async () => {
    const renderer = await openNameScreen();
    const texts = textsOf(renderer);
    expect(texts).toContain('Comment s’appelle\nvotre partenaire ?');
    expect(texts).toContain('Cela nous permettra de personnaliser\nvotre expérience AWA à deux.');
    expect(texts).toContain('Prénom du partenaire'); // the visible label: the placeholder is not the only identification
    expect(input(renderer).props.placeholder).toBe('Ex : Yacine');
    expect(input(renderer).props.value).toBe(''); // no default name
    expect(renderer.root.findAllByProps({name: 'heart'}).length).toBeGreaterThanOrEqual(2); // badge + divider
    expect(texts).toContain('Continuer');
  });

  it('exposes accessible roles and labels (back, field, continue) and a header title', async () => {
    const renderer = await openNameScreen();
    expect(button(renderer, 'Retour')).toBeDefined();
    expect(button(renderer, 'Continuer').props.accessibilityRole).toBe('button');
    expect(input(renderer).props.accessibilityLabel).toBe('Prénom du partenaire');
    expect(renderer.root.findAll(node => node.props.accessibilityRole === 'header' && textOf(node).startsWith('Comment')).length).toBeGreaterThan(0);
  });

  it('uses the existing partenaire.png, contained (ratio kept), decorative, with no box behind it', async () => {
    const renderer = await openNameScreen();
    const hero = renderer.root.findAllByType(Image).pop()!;
    expect(hero.props.resizeMode).toBe('contain');
    expect(hero.props.accessibilityElementsHidden).toBe(true);
    expect(flat(hero.props.style)).toMatchObject({width: '100%', height: '100%'});
    expect(flat(hero.props.style).backgroundColor).toBeUndefined();
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPartnerNameScreen.tsx'), 'utf8');
    expect(source).toContain("require('../../assets/images/partenaire.png')");
    expect(fs.existsSync(path.resolve(__dirname, '../../../assets/images/partenaire.png'))).toBe(true);
  });
});

describe('Validation', () => {
  it('normalizePartnerName trims and never invents a value', () => {
    expect(normalizePartnerName('  Yacine ')).toBe('Yacine');
    expect(normalizePartnerName('     ')).toBe('');
    expect(normalizePartnerName('')).toBe('');
  });

  it('Continuer is disabled while the name is empty or only whitespace, and does nothing when pressed', async () => {
    const renderer = await openNameScreen();
    expect(isDisabled(renderer)).toBe(true);
    await type(renderer, '     ');
    expect(isDisabled(renderer)).toBe(true);
    await press(renderer, 'Continuer'); // a disabled Pressable does not fire on device; the handler guards it as well
    expect(currentRoute()?.name).toBe('AwaADeuxPartnerName');
  });

  it('a valid name enables Continuer; clearing it disables it again', async () => {
    const renderer = await openNameScreen();
    await type(renderer, 'Y');
    expect(isDisabled(renderer)).toBe(false);
    await type(renderer, '');
    expect(isDisabled(renderer)).toBe(true);
  });

  it('the field is a single-line name field with a Done key and a length limit', async () => {
    const renderer = await openNameScreen();
    expect(input(renderer).props).toMatchObject({returnKeyType: 'done', autoCapitalize: 'words', autoCorrect: false, maxLength: 40});
    expect(input(renderer).props.multiline).toBeFalsy();
  });
});

describe('Keyboard and layout', () => {
  it('is keyboard-aware without any scrolling: KeyboardAvoidingView, a plain View column, the CTA inside it', async () => {
    const renderer = await openNameScreen();
    const kav = renderer.root.findAllByType(KeyboardAvoidingView).pop()!;
    expect(renderer.root.findAllByType(ScrollView)).toHaveLength(0); // no ScrollView on this screen (nor beneath it)
    expect(kav.findAllByType(ScrollView)).toHaveLength(0);
    expect(kav.findAll(node => node.props.accessibilityLabel === 'Continuer' && node.props.accessibilityRole === 'button').length).toBeGreaterThan(0);
    const column = kav.findAll(node => flat(node.props.style).overflow === 'hidden' && flat(node.props.style).flex === 1).pop()!;
    expect(flat(column.props.style)).toMatchObject({flex: 1, minHeight: 0, overflow: 'hidden'}); // it fits the screen; it never scrolls
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPartnerNameScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/ScrollView|keyboardShouldPersistTaps/);
  });

  describe.each([
    ['standard phone 360 × 800', 360, 800, 0.21],
    ['large phone 430 × 932', 430, 932, 0.21],
    ['compact phone 360 × 640', 360, 640, 0.18],
    ['small phone 320 × 568', 320, 568, 0.18],
  ])('the illustration on a %s', (_label, width, height, ratio) => {
    const openSized = async () => {
      jest.spyOn(Dimensions, 'get').mockImplementation((() => ({width, height, scale: 1, fontScale: 1})) as never);
      return openNameScreen({frame: {x: 0, y: 0, width, height}, insets: {top: 24, left: 0, right: 0, bottom: 16}});
    };
    const heroBox = (renderer: ReactTestRenderer.ReactTestRenderer) =>
      renderer.root.findAll(node => flat(node.props.style).maxHeight === '100%' && typeof flat(node.props.style).height === 'number').pop()!;

    it(`is ${ratio * 100}% of the window height (was: everything left, up to ~40%), shrinks with its zone and keeps its ratio`, async () => {
      const renderer = await openSized();
      const box = flat(heroBox(renderer).props.style);
      expect(box.height).toBe(Math.round(height * ratio));
      expect(box.height).toBeLessThan(height * 0.25);
      expect(box.maxHeight).toBe('100%'); // never overflows a short zone
      expect(renderer.root.findAllByType(Image).pop()!.props.resizeMode).toBe('contain');
    });

    it('sits centred, a little above the middle, between the card and the CTA (no big gap on either side)', async () => {
      const renderer = await openSized();
      const zone = flat(renderer.root.findAll(node => flat(node.props.style).alignItems === 'center' && flat(node.props.style).justifyContent === 'center' && flat(node.props.style).flex === 1).pop()!.props.style);
      expect(zone).toMatchObject({flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center'});
      expect(zone.paddingBottom).toBeGreaterThan(zone.paddingTop); // biased upwards
    });

    it('keeps the CTA visible below the content column', async () => {
      const renderer = await openSized();
      expect(button(renderer, 'Continuer')).toBeDefined();
      expect(flat(button(renderer, 'Continuer').parent!.parent!.props.style).paddingBottom).toBe(Math.max(16, 16) + 8);
    });
  });

  it('while the keyboard is open the illustration and the heart step aside (field and CTA stay usable); they come back afterwards', async () => {
    const handlers: Record<string, () => void> = {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, callback: () => void) => {
      handlers[event] = callback;
      return {remove: jest.fn()};
    }) as never);
    const renderer = await openNameScreen();
    const heroCount = () => renderer.root.findAllByType(Image).filter(node => node.props.accessibilityElementsHidden === true && node.props.resizeMode === 'contain').length;
    const heartCount = () => renderer.root.findAllByProps({name: 'heart'}).length;
    expect(heroCount()).toBeGreaterThan(0);
    const [heroBefore, heartBefore] = [heroCount(), heartCount()];
    await act(async () => {
      handlers.keyboardDidShow();
    });
    expect(heroCount()).toBe(heroBefore - 1);
    expect(heartCount()).toBeLessThan(heartBefore); // the big heart badge is gone, the divider heart stays
    expect(textsOf(renderer)).toContain('Cela nous permettra de personnaliser\nvotre expérience AWA à deux.'); // standard phone: description kept
    expect(button(renderer, 'Continuer')).toBeDefined();
    expect(renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom du partenaire')).toHaveLength(1);
    await act(async () => {
      handlers.keyboardDidHide();
    });
    expect(heroCount()).toBe(heroBefore);
    expect(heartCount()).toBe(heartBefore);
  });

  it('on a compact phone the description also steps aside while the keyboard is open', async () => {
    const handlers: Record<string, () => void> = {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, callback: () => void) => {
      handlers[event] = callback;
      return {remove: jest.fn()};
    }) as never);
    jest.spyOn(Dimensions, 'get').mockImplementation((() => ({width: 320, height: 568, scale: 1, fontScale: 1})) as never);
    const renderer = await openNameScreen({frame: {x: 0, y: 0, width: 320, height: 568}, insets: {top: 24, left: 0, right: 0, bottom: 0}});
    const description = 'Cela nous permettra de personnaliser\nvotre expérience AWA à deux.';
    expect(textsOf(renderer)).toContain(description);
    await act(async () => {
      handlers.keyboardDidShow();
    });
    expect(textsOf(renderer)).not.toContain(description);
    expect(textsOf(renderer)).toContain('Comment s’appelle\nvotre partenaire ?');
    expect(textsOf(renderer)).toContain('Prénom du partenaire');
  });

  it('keeps the CTA above the bottom safe area on a small phone (320 × 568) and on a large one', async () => {
    for (const [width, height, bottom] of [[320, 568, 0], [430, 932, 34]] as const) {
      const renderer = await openNameScreen({frame: {x: 0, y: 0, width, height}, insets: {top: 24, left: 0, right: 0, bottom}});
      const footer = button(renderer, 'Continuer').parent!.parent!;
      const footerStyle = flat(footer.props.style);
      expect(footerStyle.paddingBottom).toBe(Math.max(bottom, 16) + 8);
      expect(button(renderer, 'Retour')).toBeDefined();
      act(() => renderer.unmount());
      activeRenderers.pop();
    }
  });
});

describe('Animation', () => {
  it('never starts the blocks invisible: the entrance runs from 0.65 opacity', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPartnerNameScreen.tsx'), 'utf8');
    expect(source).toContain('ENTRANCE_START_OPACITY = 0.65');
    expect(source).toContain('outputRange: [ENTRANCE_START_OPACITY, 1]');
    expect(source).not.toMatch(/opacity: 0[,}]/);
  });

  it('renders the whole content right away (title, card, CTA present before any animation frame)', async () => {
    const renderer = await openNameScreen();
    expect(textsOf(renderer)).toEqual(expect.arrayContaining(['Comment s’appelle\nvotre partenaire ?', 'Prénom du partenaire', 'Continuer']));
  });
});

describe('Theme: only AWA tokens', () => {
  it.each([false, true])('follows the resolved theme (dark = %s): gradient, CTA and text colors', async dark => {
    await setAppearanceMode(dark ? 'dark' : 'light');
    const renderer = await openNameScreen();
    const theme = resolveAwaTheme('awa-original', dark, false);
    const gradient = renderer.root.findAllByType(LinearGradient).pop()!;
    expect(gradient.props.colors).toEqual([...theme.gradients.pageBackground]);
    const cta = button(renderer, 'Continuer');
    const ctaStyle = flat(cta.props.style({pressed: false}));
    expect(ctaStyle.backgroundColor).toBe(theme.colors.primary);
    const label = cta.findAllByType(Text).find(node => textOf(node) === 'Continuer')!;
    expect(flat(label.props.style).color).toBe(onPrimaryTextColor(theme));
    const title = renderer.root.findAllByType(Text).find(node => textOf(node).startsWith('Comment s’appelle'))!;
    expect(flat(title.props.style).color).toBe(theme.colors.accent);
  });

  it('adds no hex color of its own', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPartnerNameScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });

  it('touches no backend (the name is saved on the device only)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPartnerNameScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/AsyncStorage|supabase|firebase|fetch\(/i);
  });
});
