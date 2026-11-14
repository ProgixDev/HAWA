import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import {AwaThemeProvider, useAwaTheme} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import JournalMoodScreen from '../../../screens/journal/JournalMoodScreen';
import {deriveAwaRoles} from '../../../theme/semanticRoles';
import {resolveColorRole} from '../../ui/types';
import type {ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import type {AwaThemeId} from '../../../config/awaThemes';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {decodePng, type RgbImage} from '../../../testUtils/decodePng';
import {JOURNAL_HERO_INK} from '../journalHeroInk';

// The Journal banners put text on a fixed, LIGHT photograph. These tests pin two things:
//  1. the ink colours reach WCAG AA (4.5:1 for normal text) against the real pixels of each banner's text side,
//     measured at the darkest 1 % of pixels (not just the average), and
//  2. every banner's title / description takes its colour from that ink, never from a themed colour such as
//     `theme.colors.accent` / `textSecondary`, which turn pale lavender in Dark and True Black.

const IMAGES = path.join(__dirname, '..', '..', '..', 'assets', 'images');
const SRC = path.join(__dirname, '..', '..', '..');

const channel = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminanceOf = (r: number, g: number, b: number): number => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const hexLuminance = (hex: string): number => luminanceOf(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16));
const contrast = (a: number, b: number): number => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Luminance of the darkest 1 % of the pixels in the text side of the banner (x 4–45 %, y 12–88 %, which skips the
// rounded corners). Sampling every 3rd pixel keeps the test fast.
function darkestOnePercent(image: RgbImage): number {
  const values: number[] = [];
  const x0 = Math.floor(image.width * 0.04);
  const x1 = Math.floor(image.width * 0.45);
  const y0 = Math.floor(image.height * 0.12);
  const y1 = Math.floor(image.height * 0.88);
  for (let y = y0; y < y1; y += 3) {
    for (let x = x0; x < x1; x += 3) {
      const i = (y * image.width + x) * 3;
      values.push(luminanceOf(image.data[i], image.data[i + 1], image.data[i + 2]));
    }
  }
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length * 0.01)];
}

const BANNERS = ['mood', 'symptoms', 'intimacy', 'notes', 'sleep'] as const;

describe('Journal hero banners — ink contrast against the real artwork', () => {
  it.each(BANNERS)('%s: title, description and accent ink are AA-readable on the text side of the photo', name => {
    const worst = darkestOnePercent(decodePng(path.join(IMAGES, `${name}-header-woman.png`)));
    expect(contrast(worst, hexLuminance(JOURNAL_HERO_INK.title))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(worst, hexLuminance(JOURNAL_HERO_INK.body))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(worst, hexLuminance(JOURNAL_HERO_INK.accent))).toBeGreaterThanOrEqual(4.5);
  });

  it('the old behaviour (a Dark-mode pale lavender on these photos) fails, so the test can catch it', () => {
    const worst = darkestOnePercent(decodePng(path.join(IMAGES, 'mood-header-woman.png')));
    expect(contrast(worst, hexLuminance('#CFC6F5'))).toBeLessThan(3);
  });
});

describe('Journal hero banners — text takes the fixed ink, never a themed colour', () => {
  // [file, style names of the hero title / description / badge text that sit on the photograph]
  // (JournalMoodScreen is not listed: it has no photo banner any more, see the "Mood journal — current design" block below)
  const FILES: Array<[string, string[]]> = [
    ['screens/journal/JournalSymptomsScreen.tsx', ['heroTitle', 'heroSubtitle']],
    ['screens/journal/JournalIntimacyScreen.tsx', ['heroTitle', 'heroText', 'learnText']],
    ['screens/journal/JournalNoteScreen.tsx', ['heroTitle', 'heroText', 'privateBadgeText']],
    ['screens/journal/JournalActivityScreen.tsx', ['heroTitle', 'heroText']],
    ['screens/pregnancy/PregnancySymptomsScreen.tsx', ['heroTitle', 'heroSubtitle']],
    ['components/postpartum/PostpartumCycleStyleJournalLayout.tsx', ['heroTitle', 'heroText']],
  ];

  it.each(FILES)('%s', (file, styles) => {
    const source = fs.readFileSync(path.join(SRC, file), 'utf8');
    for (const style of styles) {
      const match = new RegExp(`\\n\\s*${style}: \\{([^}]*)\\}`).exec(source);
      expect([style, match !== null]).toEqual([style, true]);
      expect([style, /color: JOURNAL_HERO_INK\.(title|body|accent)/.test(match![1])]).toEqual([style, true]);
    }
  });

  it('the Intimacy "learn more" pill uses a fixed light scrim, not the themed surface (dark in Dark mode)', () => {
    const source = fs.readFileSync(path.join(SRC, 'screens/journal/JournalIntimacyScreen.tsx'), 'utf8');
    const learn = /\n\s*learn: \{([^}]*)\}/.exec(source)![1];
    expect(learn).toContain("backgroundColor: 'rgba(255,255,255,0.88)'");
    expect(learn).not.toContain('theme.colors.surface');
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The mood journal no longer has a banner on a photograph (commit 85afff6, kept on purpose): it opens with a sub-line in the THEME's colours and
// a day switcher. So the "ink on a photo" rules above do not apply to it; these pin what the screen really is now.
// ---------------------------------------------------------------------------------------------------------------------------------------------
describe('Mood journal — current design: no photo banner, theme-driven text, day switcher', () => {
  const source = fs.readFileSync(path.join(SRC, 'screens/journal/JournalMoodScreen.tsx'), 'utf8');

  it('has no photo banner and no fixed hero ink: no ImageBackground, no header photo, no JOURNAL_HERO_INK, no hero title style', () => {
    expect(source).not.toMatch(/ImageBackground/);
    expect(source).not.toMatch(/header-woman/);
    expect(source).not.toMatch(/JOURNAL_HERO_INK/);
    expect(source).not.toMatch(/\n\s*heroTitle:/);
  });

  it('its sub-line takes the theme (AwaText with the onSurfaceVariant role, no hard-coded colour), and the day switcher is part of the header', () => {
    const subtitleStyle = /\n\s*heroSubtitle: \{([^}]*)\}/.exec(source)![1];
    expect(subtitleStyle).not.toMatch(/color/i);
    expect(source).toMatch(/<AwaText colorRole="onSurfaceVariant" style=\{styles\.heroSubtitle\}[^>]*>\{t\('journalMood\.heroSubtitle'\)\}/);
    expect(source).toMatch(/<JournalDaySwitcher/);
    expect(source).toMatch(/useJournalDay\(\)/);
  });

  const Stack = createNativeStackNavigator();
  // (this file is plain .ts: no JSX, and the navigator's children typing is loosened for createElement)
  const Navigator = Stack.Navigator as unknown as React.ComponentType<{screenOptions: object; children?: React.ReactNode}>;
  const ScreenRoute = Stack.Screen as unknown as React.ComponentType<{name: string; component: React.ComponentType}>;
  const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
  const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

  async function renderMood() {
    let theme: ResolvedAwaTheme | undefined;
    const Probe = () => {
      theme = useAwaTheme().theme;
      return null;
    };
    const Page = () => React.createElement(React.Fragment, null, React.createElement(Probe), React.createElement(JournalMoodScreen));
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        React.createElement(SafeAreaProvider, {initialMetrics: METRICS},
          React.createElement(AwaThemeProvider, null,
            React.createElement(JournalSheetProvider, null,
              React.createElement(NavigationContainer, null,
                React.createElement(Navigator, {screenOptions: {headerShown: false}},
                  React.createElement(ScreenRoute, {name: 'Test', component: Page}))))),
        ),
      );
    });
    for (let index = 0; index < 20; index += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
    return {renderer, theme: theme!};
  }

  const SCENARIOS: Array<[string, string, 'light' | 'dark', boolean]> = [
    ['AWA Original, light', 'awa-original', 'light', false],
    ['AWA Original, dark', 'awa-original', 'dark', false],
    ['Lavender Night, dark', 'lavender-night', 'dark', false],
    ['Lavender Night, dark + true black', 'lavender-night', 'dark', true],
  ];

  it.each(SCENARIOS)('%s: the sub-line is drawn in the theme\'s accessible on-surface colour and stays readable on the screen background; the day switcher is there', async (_name, themeId, mode, trueBlack) => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    await setSelectedThemeId(themeId as AwaThemeId);
    await setAppearanceMode(mode);
    await setTrueBlackEnabled(trueBlack);
    const {renderer, theme} = await renderMood();

    const subtitle = renderer.root.findAllByType(Text).find(node => textOf(node) === i18n.t('journalMood.heroSubtitle'));
    expect(subtitle).toBeDefined();
    const color = (StyleSheet.flatten(subtitle!.props.style) as {color?: string}).color;
    expect(color).toBe(resolveColorRole(deriveAwaRoles(theme), 'onSurfaceVariant', true));
    if (/^#[0-9a-f]{6}$/i.test(String(color)) && /^#[0-9a-f]{6}$/i.test(theme.colors.background)) {
      expect(contrast(hexLuminance(String(color)), hexLuminance(theme.colors.background))).toBeGreaterThanOrEqual(4.5);
    }
    // the day switcher: an arrow to yesterday, and none past today
    const arrows = renderer.root.findAll(node => typeof node.props.onPress === 'function' && node.props.accessibilityRole === 'button' && typeof node.props.accessibilityLabel === 'string' && node.props.hitSlop === 8);
    expect(arrows.length).toBeGreaterThanOrEqual(2);
    expect(arrows.some(arrow => arrow.props.disabled === true)).toBe(true); // "next day" is disabled on today
    act(() => renderer.unmount());
  });

  it('the sub-line colour really follows the palette and the mode (it differs between a light and a dark theme)', async () => {
    await setSelectedThemeId('awa-original');
    await setAppearanceMode('light');
    await setTrueBlackEnabled(false);
    const light = await renderMood();
    const lightColor = (StyleSheet.flatten(light.renderer.root.findAllByType(Text).find(node => textOf(node) === i18n.t('journalMood.heroSubtitle'))!.props.style) as {color?: string}).color;
    act(() => light.renderer.unmount());
    await setAppearanceMode('dark');
    const dark = await renderMood();
    const darkColor = (StyleSheet.flatten(dark.renderer.root.findAllByType(Text).find(node => textOf(node) === i18n.t('journalMood.heroSubtitle'))!.props.style) as {color?: string}).color;
    act(() => dark.renderer.unmount());
    expect(lightColor).toBeDefined();
    expect(darkColor).toBeDefined();
    expect(lightColor).not.toBe(darkColor);
  });
});
