import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../../theme/awaThemeTokens';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

import {HawaPremiumBottomSheet} from '../HawaPremiumBottomSheet';

// Dark Mode audit: HawaPremiumBottomSheet was the highest-leverage
// NOT-MIGRATED shared component (reachable from ~20 screens). Its Premium
// brand identity (deep-violet hero gradient, gold crown/badge, the CTA's
// own gradient, the "RECOMMANDÉ" ribbon, and each benefit's decorative
// tint) stays fixed by design — Premium showcase moments should look the
// same regardless of the active AWA theme/palette. Every OTHER structural
// surface (sheet background, cards, borders, body text, selection state,
// success/secure/danger indicators) is now theme-driven so opening the
// sheet from a Dark/True-Black screen no longer shows a bright Light-only
// sheet.

jest.mock('../../../services/purchaseService', () => ({
  purchasePremium: jest.fn().mockResolvedValue('cancelled'),
  restorePurchases: jest.fn().mockResolvedValue('cancelled'),
}));

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderSheet(onClose: () => void = jest.fn()) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <HawaPremiumBottomSheet onClose={onClose} visible />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

function sheetBackground(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  // The sheet root is the only node whose flattened style carries both a
  // borderTopLeftRadius (34) and a backgroundColor — a stable structural
  // marker independent of theme values.
  const match = renderer.root.findAll(node => {
    if (!node.props?.style) {return false;}
    const flat = flattenStyle(node.props.style);
    return flat.borderTopLeftRadius === 34 && typeof flat.backgroundColor !== 'undefined';
  })[0];
  return match ? flattenStyle(match.props.style).backgroundColor : undefined;
}

function heroGradientColors(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  return renderer.root.findAllByType(LinearGradient)[0].props.colors;
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

describe('HawaPremiumBottomSheet — static guard', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../HawaPremiumBottomSheet.tsx'), 'utf8');

  it('no longer hardcodes generic structural colors', () => {
    expect(source).not.toMatch(/COLORS\.background/);
    expect(source).not.toMatch(/COLORS\.surface/);
    expect(source).not.toMatch(/COLORS\.text\b/);
    expect(source).not.toMatch(/COLORS\.secondary/);
    expect(source).not.toMatch(/COLORS\.subtle/);
    expect(source).not.toMatch(/COLORS\.lavender/);
    expect(source).not.toMatch(/COLORS\.border/);
    expect(source).not.toMatch(/COLORS\.purple\b/);
    expect(source).not.toMatch(/COLORS\.purpleStrong/);
    expect(source).not.toMatch(/COLORS\.green\b/);
    expect(source).not.toMatch(/COLORS\.greenLight/);
  });

  it('reads structural chrome from the global theme', () => {
    expect(source).toMatch(/useAwaTheme/);
    expect(source).toMatch(/createStyles\(theme\)/);
    expect(source).toMatch(/theme\.colors\.surface/);
    expect(source).toMatch(/theme\.colors\.text/);
    expect(source).toMatch(/theme\.colors\.border/);
    expect(source).toMatch(/theme\.colors\.primary/);
    expect(source).toMatch(/theme\.colors\.success/);
    expect(source).toMatch(/theme\.colors\.danger/);
  });

  it('introduces no local appearance/theme resolution', () => {
    expect(source).not.toMatch(/useColorScheme/);
    expect(source).not.toMatch(/\bisDark\b/);
    expect(source).not.toMatch(/appearanceMode\s*===/);
    expect(source).not.toMatch(/theme\.id\s*===/);
    expect(source).not.toMatch(/getAwaTheme\(/);
    expect(source).not.toMatch(/resolveEffectiveThemeId/);
  });

  it('preserves the fixed Premium brand identity (hero + CTA gradients, gold crown)', () => {
    expect(source).toContain("'#2B155E'");
    expect(source).toContain("'#482589'");
    expect(source).toContain("'#663EB1'");
    expect(source).toContain("'#4B278E'");
    expect(source).toContain("'#6740B7'");
    expect(source).toContain("'#8D4EB5'");
    expect(source).toContain("gold: '#F2C76D'");
  });

  it('preserves the 5 benefit items and their decorative per-item accents', () => {
    expect(source).toMatch(/Statistiques avancées/);
    expect(source).toMatch(/Exports santé/);
    expect(source).toMatch(/Historique illimité/);
    expect(source).toMatch(/Guides approfondis/);
    expect(source).toMatch(/Plus de personnalisation/);
    expect(source).toContain("tint: '#EEE8FB'");
  });
});

describe('HawaPremiumBottomSheet — follows the resolved theme', () => {
  it('AWA Original Light: sheet background resolves from theme.colors.surface', async () => {
    const renderer = await renderSheet();
    const expected = resolveAwaTheme('awa-original', false, false).colors.surface;
    expect(sheetBackground(renderer)).toBe(expected);
  });

  it('Light -> Dark: sheet background updates without remounting', async () => {
    const renderer = await renderSheet();
    const before = sheetBackground(renderer);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const expectedDark = resolveAwaTheme('awa-original', true, false).colors.surface;
    expect(sheetBackground(renderer)).toBe(expectedDark);
    expect(sheetBackground(renderer)).not.toBe(before);
  });

  it('Dark + True Black resolves the True Black surface', async () => {
    const renderer = await renderSheet();

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
    });

    const expected = resolveAwaTheme('awa-original', true, true).colors.surface;
    expect(sheetBackground(renderer)).toBe(expected);
  });

  it('palette switch (Ocean Calm Dark) updates the sheet background', async () => {
    const renderer = await renderSheet();
    const before = sheetBackground(renderer);

    await act(async () => {
      await setAppearanceMode('dark');
      await setSelectedThemeId('ocean-calm');
    });

    // Light surfaces are commonly '#FFFFFF' across palettes (not itself a
    // bug), so this specifically switches to a Dark palette to prove the
    // sheet genuinely re-resolves rather than staying frozen.
    const expected = resolveAwaTheme('ocean-calm', true, false).colors.surface;
    expect(sheetBackground(renderer)).toBe(expected);
    expect(sheetBackground(renderer)).not.toBe(before);
  });

  it('the hero gradient (Premium brand identity) never changes across Dark + True Black + palette switch', async () => {
    const renderer = await renderSheet();
    const before = heroGradientColors(renderer);

    await act(async () => {
      await setAppearanceMode('dark');
      await setTrueBlackEnabled(true);
      await setSelectedThemeId('rose-quartz');
    });

    expect(heroGradientColors(renderer)).toEqual(before);
    expect(heroGradientColors(renderer)).toEqual(['#2B155E', '#482589', '#663EB1']);
  });
});

describe('HawaPremiumBottomSheet — behavior unchanged', () => {
  it('renders all 5 benefits and both plan options', async () => {
    const renderer = await renderSheet();
    expect(renderer.root.findAllByProps({children: 'Statistiques avancées'}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({children: 'Plus de personnalisation'}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({children: 'S’abonner maintenant'}).length).toBeGreaterThan(0);
  });

  it('the close button still calls onClose', async () => {
    const onClose = jest.fn();
    const renderer = await renderSheet(onClose);
    const closeButtons = renderer.root.findAllByProps({accessibilityLabel: 'Fermer AWA Premium'});
    const pressable = closeButtons.find(node => typeof node.props.onPress === 'function');
    expect(pressable).toBeTruthy();
    act(() => {
      pressable!.props.onPress();
    });
    expect(onClose).toHaveBeenCalled();
  });
});
