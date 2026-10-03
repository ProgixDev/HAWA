import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Dimensions, ScrollView, StatusBar, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {onPrimaryTextColor, resolveAwaTheme} from '../../../theme/awaThemeTokens';
import ProfileScreen from '../../ProfileScreen';
import AwaADeuxIntroScreen from '../AwaADeuxIntroScreen';
import {INTRO_HERO_MIN_HEIGHT, getIntroLayout} from '../awaADeuxIntroLayout';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage} from '../../../state/themePreferences';
import {updatePrivacySecuritySettings} from '../../../state/securityPreferences';
import i18n from '../../../i18n';

// Profile → "AWA à deux" → introduction screen. UI + navigation only.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flat = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const button = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button')[0];

async function settle() {
  for (let index = 0; index < 6; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderApp(initial: 'Profile' | 'AwaADeuxIntro' = 'Profile') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName={initial} screenOptions={{headerShown: false}}>
              <Stack.Screen component={ProfileScreen as never} name="Profile" />
              <Stack.Screen component={AwaADeuxIntroScreen as never} name="AwaADeuxIntro" />
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

const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  updatePrivacySecuritySettings({anonymousMode: false});
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

describe('Navigation: Profile → AWA à deux → back', () => {
  it('"AWA à deux" appears in Profile, tapping it opens the introduction, Retour returns to Profile', async () => {
    const renderer = await renderApp('Profile');
    expect(textsOf(renderer)).toContain('AWA à deux');
    expect(currentRoute()).toBe('Profile');

    await act(async () => {
      button(renderer, 'AWA à deux').props.onPress();
    });
    await settle();
    expect(currentRoute()).toBe('AwaADeuxIntro');
    expect(textsOf(renderer)).toContain('Découvrir');

    await act(async () => {
      button(renderer, 'Retour').props.onPress();
    });
    await settle();
    expect(currentRoute()).toBe('Profile');
    expect(textsOf(renderer)).toContain('AWA À DEUX');
  });

  it('the Android back action (goBack) also returns to Profile', async () => {
    const renderer = await renderApp('Profile');
    await act(async () => {
      button(renderer, 'AWA à deux').props.onPress();
    });
    await settle();
    expect(currentRoute()).toBe('AwaADeuxIntro');
    await act(async () => {
      navRef.goBack();
    });
    await settle();
    expect(currentRoute()).toBe('Profile');
  });

  it('the route is registered in the root stack and typed', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../navigation/AppNavigator.tsx'), 'utf8');
    expect(source).toContain('AwaADeuxIntro: undefined;');
    expect(source).toMatch(/<Stack\.Screen name="AwaADeuxIntro" component=\{AwaADeuxIntroScreen\} \/>/);
  });
});

describe('Introduction screen content', () => {
  it('shows the title, the subtitle, the four benefits and the CTA', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const texts = textsOf(renderer);
    expect(texts).toContain('AWA à deux');
    expect(texts).toContain('Avancez ensemble,\nà votre rythme.');
    expect(texts).toEqual(
      expect.arrayContaining([
        'Partagez les repères que vous souhaitez avec votre partenaire',
        'Aidez-le à mieux comprendre votre cycle et vos différentes étapes',
        'Recevez plus de soutien au quotidien',
        'Vous gardez toujours le contrôle de vos informations',
      ]),
    );
    expect(texts).toContain('Découvrir');
    const title = renderer.root.findAllByType(Text).find(node => textOf(node) === 'AWA à deux')!;
    expect(title.props.accessibilityRole).toBe('header');
  });

  it('has exactly four benefit rows, each with its own icon', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const icons = renderer.root
      .findAll(node => typeof node.props.name === 'string')
      .map(node => node.props.name as string);
    for (const name of ['share-variant-outline', 'calendar-heart', 'hand-heart-outline', 'shield-lock-outline']) {
      expect(icons).toContain(name);
    }
  });

  it('accessibility: labelled Retour and CTA; the illustration area is hidden from screen readers', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    expect(button(renderer, 'Retour').props.accessibilityRole).toBe('button');
    expect(button(renderer, 'Découvrir AWA à deux')).toBeDefined();
    const hidden = renderer.root.findAll(node => node.props.importantForAccessibility === 'no-hide-descendants');
    expect(hidden.length).toBeGreaterThan(0);
  });

  it('"Découvrir" leads to the partner-name step (the whole flow is covered in AwaADeuxFlow.test.tsx)', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const cta = button(renderer, 'Découvrir AWA à deux');
    expect(typeof cta.props.onPress).toBe('function');
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxIntroScreen.tsx'), 'utf8');
    expect(source).toContain("navigation.navigate('AwaADeuxPartnerName')");
  });
});

describe('Theme: only existing AWA tokens', () => {
  it('no color literal (hex / rgb / rgba / named) appears in the screen: no independent palette', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxIntroScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(source).not.toMatch(/rgba?\(/);
    expect(source).not.toMatch(/(?:color|backgroundColor|borderColor):\s*'[a-z]+'/i);
    expect(source).toContain('useAwaTheme');
  });

  const expectThemed = (renderer: ReactTestRenderer.ReactTestRenderer, theme: ReturnType<typeof resolveAwaTheme>) => {
    expect(renderer.root.findByType(LinearGradient).props.colors).toEqual([...theme.gradients.pageBackground]);
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe(theme.statusBarStyle);

    const cta = button(renderer, 'Découvrir AWA à deux');
    const ctaStyle = flat(typeof cta.props.style === 'function' ? cta.props.style({pressed: false}) : cta.props.style);
    expect(ctaStyle.backgroundColor).toBe(theme.colors.primary);
    const ctaText = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Découvrir')!;
    expect(flat(ctaText.props.style).color).toBe(onPrimaryTextColor(theme));

    const title = renderer.root.findAllByType(Text).find(node => textOf(node) === 'AWA à deux')!;
    expect(flat(title.props.style).color).toBe(theme.colors.accent);
    const benefit = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Recevez plus de soutien au quotidien')!;
    expect(flat(benefit.props.style).color).toBe(theme.colors.text);
    const subtitle = renderer.root.findAllByType(Text).find(node => textOf(node).startsWith('Avancez ensemble'))!;
    expect(flat(subtitle.props.style).color).toBe(theme.colors.textSecondary);
  };

  it('Light: resolves the light theme', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    expectThemed(renderer, resolveAwaTheme('awa-original', false, false));
  });

  it('Dark: resolves the dark theme', async () => {
    await setAppearanceMode('dark');
    const renderer = await renderApp('AwaADeuxIntro');
    expectThemed(renderer, resolveAwaTheme('awa-original', true, false));
  });

  it('switching Light → Dark → another palette while open updates the screen live', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    expectThemed(renderer, resolveAwaTheme('awa-original', false, false));
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expectThemed(renderer, resolveAwaTheme('awa-original', true, false));
    await act(async () => {
      await setAppearanceMode('light');
      await setSelectedThemeId('ocean-calm');
    });
    expectThemed(renderer, resolveAwaTheme('ocean-calm', false, false));
  });
});

describe('Profile is not disturbed', () => {
  it('the section, its status and the existing rows are still shown; the theme still switches', async () => {
    const renderer = await renderApp('Profile');
    const texts = textsOf(renderer);
    for (const label of ['AWA À DEUX', 'Non configuré', 'Sauvegarde', 'Apparence', 'Confidentialité & Sécurité']) {
      expect(texts).toContain(label);
    }
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe('light-content');
  });
});

describe('Hero illustration: partenaire.png, no heart, no box', () => {
  const screenSource = () => fs.readFileSync(path.resolve(__dirname, '../AwaADeuxIntroScreen.tsx'), 'utf8');
  const assetPath = path.resolve(__dirname, '../../../assets/images/partenaire.png');
  const hero = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.findAll(node => node.props.source !== undefined && node.props.resizeMode === 'contain')[0];

  it('uses the local asset src/assets/images/partenaire.png (no remote URL); the file exists', () => {
    expect(fs.existsSync(assetPath)).toBe(true);
    expect(screenSource()).toContain("require('../../assets/images/partenaire.png')");
    expect(screenSource()).not.toMatch(/https?:\/\//);
  });

  it('the PNG keeps its transparency (RGBA) and is not modified by the screen', () => {
    const bytes = fs.readFileSync(assetPath);
    expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect(bytes[25]).toBe(6); // IHDR color type 6 = RGBA
  });

  it('the old heart hero and its lavender container / placeholder are gone', async () => {
    const source = screenSource();
    expect(source).not.toContain('heart-multiple');
    expect(source).not.toMatch(/placeholder|heroGlow|sparkle/i);
    expect(fs.existsSync(path.resolve(__dirname, '../../../assets/images/awa-a-deux'))).toBe(false);
    const renderer = await renderApp('AwaADeuxIntro');
    const icons = renderer.root.findAll(node => typeof node.props.name === 'string').map(node => node.props.name);
    expect(icons).not.toContain('heart-multiple');
    expect(icons).not.toContain('star-four-points');
  });

  it('the image is contained (never stretched or cropped), fills its box, and no colored box paints behind it', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const image = hero(renderer);
    expect(image.props.resizeMode).toBe('contain');
    const style = flat(image.props.style);
    expect(style.width).toBe('100%');
    expect(style.height).toBe('100%');
    expect(style.backgroundColor).toBeUndefined();
    expect(style.borderRadius).toBeUndefined();
    // No ancestor up to the page gradient paints a background or a border.
    for (let node = image.parent; node && node.type !== LinearGradient; node = node.parent) {
      const ancestor = flat(node.props?.style);
      if (ancestor.backgroundColor === resolveAwaTheme('awa-original', false, false).colors.background) {break;} // the page itself
      expect(ancestor.backgroundColor).toBeUndefined();
      expect(ancestor.borderWidth).toBeUndefined();
    }
  });

  it('is decorative: hidden from screen readers', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    expect(hero(renderer).props.importantForAccessibility).toBe('no-hide-descendants');
  });
});

describe('One screen, no scrolling', () => {
  it('there is no ScrollView / FlatList at all, and the screen does not import one', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    expect(renderer.root.findAll(node => node.type === ScrollView)).toHaveLength(0);
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxIntroScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/ScrollView|FlatList|SectionList/);
  });

  it('back button, illustration, title, subtitle, all four benefits and the CTA are all rendered together', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const texts = textsOf(renderer);
    for (const text of [
      'AWA à deux',
      'Avancez ensemble,\nà votre rythme.',
      'Partagez les repères que vous souhaitez avec votre partenaire',
      'Aidez-le à mieux comprendre votre cycle et vos différentes étapes',
      'Recevez plus de soutien au quotidien',
      'Vous gardez toujours le contrôle de vos informations',
      'Découvrir',
    ]) {
      expect(texts).toContain(text);
    }
    expect(button(renderer, 'Retour')).toBeDefined();
    expect(renderer.root.findAll(node => node.props.source !== undefined && node.props.resizeMode === 'contain')).not.toHaveLength(0);
  });

  it('the illustration is the flexible element: it shrinks (flexShrink) from its cap, with a floor', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const box = renderer.root
      .findAll(node => {
        const style = flat(node.props?.style);
        return typeof node.type === 'string' && style.flexShrink === 1 && typeof style.flexBasis === 'number';
      })
      .map(node => flat(node.props.style))[0];
    expect(box).toBeDefined();
    expect(box.flexGrow).toBe(0);
    expect(box.minHeight).toBe(INTRO_HERO_MIN_HEIGHT);
    const windowHeight = Dimensions.get('window').height;
    expect(box.flexBasis).toBe(getIntroLayout(windowHeight, 24, 16).heroMaxHeight);
  });

  it('every card is the same size; content is compact (smaller than before)', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const cards = renderer.root
      .findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderRadius === 18 && flat(node.props?.style).minHeight !== undefined)
      .map(node => flat(node.props.style));
    expect(cards).toHaveLength(4);
    cards.forEach(card => {
      // Same structure for the four (animated entrance styles aside).
      expect({...card, opacity: undefined, transform: undefined}).toEqual({...cards[0], opacity: undefined, transform: undefined});
      expect(card.paddingVertical as number).toBeLessThanOrEqual(12); // was 14
      expect(card.minHeight as number).toBeLessThan(72); // was 72
      expect(card.borderWidth).toBe(1);
    });
    const iconBoxes = renderer.root
      .findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderRadius === (flat(node.props?.style).width as number) / 2 && flat(node.props?.style).width !== undefined)
      .map(node => flat(node.props.style));
    expect(iconBoxes).toHaveLength(4);
    iconBoxes.forEach(box => expect(box.width as number).toBeLessThan(44)); // was 44
  });

  it('title and subtitle are smaller than before (30 / 16) but the title stays the strongest text', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const title = flat(renderer.root.findAllByType(Text).find(node => textOf(node) === 'AWA à deux')!.props.style);
    const subtitle = flat(renderer.root.findAllByType(Text).find(node => textOf(node).startsWith('Avancez ensemble'))!.props.style);
    expect(title.fontSize as number).toBeLessThan(30);
    expect(subtitle.fontSize as number).toBeLessThan(16);
    expect(title.fontSize as number).toBeGreaterThan(subtitle.fontSize as number);
    expect(title.fontFamily).toBe('serif'); // existing AWA title typography
  });

  it('the CTA sits in the footer with the bottom inset (never under the Android navigation area)', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const footer = renderer.root
      .findAll(node => typeof node.type === 'string' && flat(node.props?.style).paddingTop === 10 && typeof flat(node.props?.style).paddingBottom === 'number')
      .map(node => flat(node.props.style))[0];
    expect(footer.paddingBottom).toBe(Math.max(16, 16) + 8); // inset.bottom = 16 in these metrics
  });
});

describe('getIntroLayout — the estimated layout fits every window height', () => {
  const insetCases: Array<[number, number]> = [[0, 0], [24, 16], [40, 34], [48, 0]];

  it.each([600, 640, 680, 720, 760, 800, 860, 900, 960, 1100])(
    'height %p dp: everything except the illustration + the illustration floor fits (no scroll needed)',
    height => {
      insetCases.forEach(([top, bottom]) => {
        const layout = getIntroLayout(height, top, bottom);
        expect(layout.fixedHeight + INTRO_HERO_MIN_HEIGHT).toBeLessThanOrEqual(height);
      });
    },
  );

  it('the illustration gets real room on ordinary phones (≥ its floor + 60 dp from 700 dp)', () => {
    [700, 740, 800, 900].forEach(height => {
      const layout = getIntroLayout(height, 24, 16);
      const room = height - layout.fixedHeight;
      expect(room).toBeGreaterThanOrEqual(INTRO_HERO_MIN_HEIGHT + 60);
    });
  });

  it('sizes are monotonic: a taller screen never gets smaller text, cards or hero cap', () => {
    let previous = getIntroLayout(560, 24, 16);
    for (let height = 580; height <= 1000; height += 20) {
      const next = getIntroLayout(height, 24, 16);
      expect(next.titleFontSize).toBeGreaterThanOrEqual(previous.titleFontSize);
      expect(next.benefitFontSize).toBeGreaterThanOrEqual(previous.benefitFontSize);
      expect(next.benefitPaddingVertical).toBeGreaterThanOrEqual(previous.benefitPaddingVertical);
      expect(next.heroMaxHeight).toBeGreaterThanOrEqual(previous.heroMaxHeight);
      previous = next;
    }
  });

  it('text never becomes tiny and the hero stays a moderate share of the screen', () => {
    for (const height of [600, 700, 800, 900, 1000]) {
      const layout = getIntroLayout(height, 24, 16);
      expect(layout.benefitFontSize).toBeGreaterThanOrEqual(12.5);
      expect(layout.subtitleFontSize).toBeGreaterThanOrEqual(13);
      expect(layout.titleFontSize).toBeGreaterThanOrEqual(24);
      expect(layout.heroMaxHeight / height).toBeLessThanOrEqual(0.28); // was up to 0.36
    }
  });
});

describe('Cards follow the theme', () => {
  it('surface, border and icon container come from the resolved theme in Light and Dark', async () => {
    const renderer = await renderApp('AwaADeuxIntro');
    const card = () =>
      flat(renderer.root.findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderRadius === 18 && flat(node.props?.style).minHeight !== undefined)[0].props.style);
    const iconBox = () =>
      flat(renderer.root.findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderRadius === (flat(node.props?.style).width as number) / 2 && flat(node.props?.style).width !== undefined)[0].props.style);
    const light = resolveAwaTheme('awa-original', false, false);
    expect(card().backgroundColor).toBe(light.colors.surface);
    expect(card().borderColor).toBe(light.colors.border);
    expect(iconBox().backgroundColor).toBe(light.colors.primarySoft);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(card().backgroundColor).toBe(dark.colors.surface);
    expect(card().borderColor).toBe(dark.colors.border);
    expect(iconBox().backgroundColor).toBe(dark.colors.primarySoft);
  });
});
