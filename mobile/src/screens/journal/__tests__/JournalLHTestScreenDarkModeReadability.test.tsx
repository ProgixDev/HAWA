import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {interpolateHex, pickReadableTextColor} from '../../../theme/awaThemeTokens';

import JournalLHTestScreen from '../JournalLHTestScreen';

// Targeted regression coverage for the "Résultat du test" card readability
// fix — the card and its icon chip previously used near-white/pastel
// backgrounds ('#F8FCFA' etc.) unconditionally, which became a
// light-card-pasted-onto-a-dark-screen once the surrounding journal went
// dark, with the "Ton test est négatif" title (theme.colors.accent, a light
// color meant for dark surfaces) becoming unreadable against it. These
// tests fail if a future edit reintroduces a fixed light-only card/chip
// background for the LH result preview or its three selectable choices.
//
// Architecture-hardening pass: the card/chip backgrounds are now always
// `interpolateHex(theme.colors.surface, accent, ratio)` — a single
// unconditional formula, never a `theme.isDark` branch — so AWA Original
// Light's card/chip are a very close (not byte-identical) approximation of
// the old hand-picked pastel literals. The ratios below (CARD_TINT_RATIO/
// ICON_TINT_RATIO) mirror JournalLHTestScreen.tsx's own private constants
// so the expected values are derived the exact same way the source derives
// them, rather than re-guessing a literal.
const AWA_ORIGINAL_LIGHT_SURFACE = '#FFFFFF';
const CARD_TINT_RATIO = 0.1;
const ICON_TINT_RATIO = 0.18;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderScreen() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => <JournalLHTestScreen />}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

// The big result-preview icon and the small per-choice icons share the same
// MaterialDesignIcons `name` per tone (e.g. both use "minus-circle-outline"
// for Négatif) but at different sizes (27 vs 22) — filtering on size is
// what uniquely picks out one or the other.
function findIconByNameAndSize(renderer: ReactTestRenderer.ReactTestRenderer, name: string, size: number) {
  return renderer.root.findAll(node => node.props.name === name && node.props.size === size)[0];
}

function findResultPreviewCard(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findAll(node => flattenStyle(node.props.style).minHeight === 110)[0];
}

beforeEach(async () => {
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('JournalLHTestScreen — "Résultat du test" card readable in dark mode', () => {
  it('light mode keeps a near-white per-tone card/chip (derived from theme.colors.surface, not a fixed literal) and the exact unblended accent color (no regression)', async () => {
    const renderer = await renderScreen();

    const expectedCardBg = interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#4F8E68', CARD_TINT_RATIO);
    const expectedIconBg = interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#4F8E68', ICON_TINT_RATIO);

    const card = findResultPreviewCard(renderer);
    expect(flattenStyle(card.props.style).backgroundColor).toBe(expectedCardBg);

    const bigIcon = findIconByNameAndSize(renderer, 'minus-circle-outline', 27);
    // The glyph/eyebrow accent stays byte-identical to the original light
    // literal — only the pale backgrounds behind it are formula-derived.
    expect(bigIcon.props.color).toBe('#4F8E68');

    const iconBox = bigIcon.parent!;
    expect(flattenStyle(iconBox.props.style).backgroundColor).toBe(expectedIconBg);

    const titleNode = renderer.root.findAll(node => node.props.children === 'Ton test est négatif')[0];
    expect(titleNode).toBeDefined();
  });

  it('dark mode never reuses the light near-white card or pastel chip, and derives a legible lightened accent instead', async () => {
    const renderer = await renderScreen();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const card = findResultPreviewCard(renderer);
    const cardBg = flattenStyle(card.props.style).backgroundColor as string;
    expect(cardBg).not.toBe('#F8FCFA');
    expect(cardBg).not.toBe('#FFFFFF');

    const bigIcon = findIconByNameAndSize(renderer, 'minus-circle-outline', 27);
    // Never the flat light-mode hex, and never plain white/black — a real
    // lightened variant of the semantic green accent.
    expect(bigIcon.props.color).not.toBe('#4F8E68');
    expect(bigIcon.props.color).not.toBe('#FFFFFF');
    expect(bigIcon.props.color).not.toBe('#000000');

    const iconBox = bigIcon.parent!;
    const iconBoxBg = flattenStyle(iconBox.props.style).backgroundColor as string;
    expect(iconBoxBg).not.toBe('#EAF5EE');
    expect(iconBoxBg).not.toBe(cardBg); // chip stays visually distinguishable from the card itself
  });

  it('switching the visible result (Négatif -> Positif -> Invalide) keeps each tone\'s card/chip visually distinct in dark mode', async () => {
    const renderer = await renderScreen();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const negativeCardBg = flattenStyle(findResultPreviewCard(renderer).props.style).backgroundColor;

    const positifChoice = renderer.root.findAll(node => node.props.accessibilityLabel === 'Résultat Positif')[0];
    await act(async () => {
      positifChoice.props.onPress();
    });
    const positiveCardBg = flattenStyle(findResultPreviewCard(renderer).props.style).backgroundColor;
    expect(positiveCardBg).not.toBe(negativeCardBg);

    const invalideChoice = renderer.root.findAll(node => node.props.accessibilityLabel === 'Résultat Invalide')[0];
    await act(async () => {
      invalideChoice.props.onPress();
    });
    const invalidCardBg = flattenStyle(findResultPreviewCard(renderer).props.style).backgroundColor;
    expect(invalidCardBg).not.toBe(negativeCardBg);
    expect(invalidCardBg).not.toBe(positiveCardBg);
  });
});

describe('JournalLHTestScreen — Négatif/Positif/Invalide selectable cards readable in dark mode', () => {
  it('each choice keeps a distinct icon-chip background in light mode, derived from theme.colors.surface (no regression)', async () => {
    const renderer = await renderScreen();

    const negIcon = findIconByNameAndSize(renderer, 'minus-circle-outline', 22);
    const posIcon = findIconByNameAndSize(renderer, 'check-circle-outline', 22);
    const invIcon = findIconByNameAndSize(renderer, 'alert-circle-outline', 22);

    const negBg = flattenStyle(negIcon.parent!.props.style).backgroundColor;
    const posBg = flattenStyle(posIcon.parent!.props.style).backgroundColor;
    const invBg = flattenStyle(invIcon.parent!.props.style).backgroundColor;

    expect(negBg).toBe(interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#4F8E68', ICON_TINT_RATIO));
    expect(posBg).toBe(interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#8C5670', ICON_TINT_RATIO));
    expect(invBg).toBe(interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#9A7848', ICON_TINT_RATIO));
    expect(new Set([negBg, posBg, invBg]).size).toBe(3);

    // The icon glyphs themselves stay byte-identical to the original
    // unblended tone accents in light mode.
    expect(negIcon.props.color).toBe('#4F8E68');
    expect(posIcon.props.color).toBe('#8C5670');
    expect(invIcon.props.color).toBe('#9A7848');
  });

  it('dark mode gives each choice a dark-integrated, still-distinct chip and a readable icon color derived from it', async () => {
    const renderer = await renderScreen();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const names = ['minus-circle-outline', 'check-circle-outline', 'alert-circle-outline'];
    const lightBgs = [
      interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#4F8E68', ICON_TINT_RATIO),
      interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#8C5670', ICON_TINT_RATIO),
      interpolateHex(AWA_ORIGINAL_LIGHT_SURFACE, '#9A7848', ICON_TINT_RATIO),
    ];

    const results = names.map(name => {
      const icon = findIconByNameAndSize(renderer, name, 22);
      const box = flattenStyle(icon.parent!.props.style);
      return {icon, box};
    });

    results.forEach(({box}, i) => {
      expect(box.backgroundColor).not.toBe(lightBgs[i]);
      expect(box.backgroundColor).not.toBe('#FFFFFF');
    });
    expect(new Set(results.map(({box}) => box.backgroundColor)).size).toBe(3);

    // The icon glyph itself must be a real lightened accent, not a raw
    // white/black fallback and not the flat light-mode hex.
    results.forEach(({icon}) => {
      expect(icon.props.color).not.toBe('#FFFFFF');
      expect(icon.props.color).not.toBe('#000000');
    });
  });

  it('the selected checkmark badge stays readable against theme.colors.primary in dark mode', async () => {
    const renderer = await renderScreen();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const checkIcon = renderer.root.findAll(node => node.props.name === 'check' && node.props.size === 11)[0];
    expect(checkIcon).toBeDefined();
    const badge = checkIcon.parent!;
    const badgeBg = flattenStyle(badge.props.style).backgroundColor as string;
    expect(checkIcon.props.color).toBe(pickReadableTextColor(badgeBg));
  });
});

describe('JournalLHTestScreen — architecture guard', () => {
  it('never introduces theme.isDark / local isDark branching for the result-card fix (surface-driven color logic only)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../JournalLHTestScreen.tsx'), 'utf8');
    // Strip line comments first — the file's own comments document, in
    // prose, that theme.isDark is no longer used, which would otherwise
    // false-positive a naive substring/regex check.
    const code = source
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.replace(/\/\/.*$/, ''))
      .join('\n');
    expect(code).not.toMatch(/theme\.isDark/);
    expect(code).not.toMatch(/\bisDark\s*\?/);
    expect(code).not.toMatch(/if\s*\(\s*!?\s*isDark\s*\)/);
  });
});
