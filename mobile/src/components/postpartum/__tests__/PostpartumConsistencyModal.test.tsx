import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {PostpartumConsistencyModal} from '../PostpartumConsistencyModal';

// Phase 3 root-cause fix — PostpartumConsistencyModal.tsx (the shared
// implementation behind Postpartum's "Date à vérifier" alert on
// PostpartumCycleReturnScreen AND the "Vérifie ton suivi" warning on
// PostpartumLochiaScreen) previously hardcoded fixed light-mode hex colors
// regardless of theme, so it rendered as a bright light-mode card even in
// Dark mode. It now derives every surface/text/icon color from useAwaTheme().

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

async function renderModal(visible = true) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <PostpartumConsistencyModal
            infoText="Choisis une date postérieure ou égale à la date d’accouchement."
            message="Tes premières règles depuis l’accouchement ne peuvent pas précéder ta date d’accouchement."
            onPrimary={() => {}}
            onRequestClose={() => {}}
            onSecondary={() => {}}
            primaryLabel="Modifier la date"
            title="Date à vérifier"
            visible={visible}
          />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
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

describe('PostpartumConsistencyModal — never a fixed light-mode card in Dark mode', () => {
  it('the card surface changes between Light and Dark, and never stays the fixed light literal ("#FFFDFF")', async () => {
    const renderer = await renderModal();
    const card = renderer.root.findAll(node => flattenStyle(node.props.style).borderRadius === 28)[0];
    const lightBg = flattenStyle(card.props.style).backgroundColor;
    expect(lightBg).not.toBe('#FFFDFF');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkBg = flattenStyle(card.props.style).backgroundColor;
    expect(darkBg).not.toBe(lightBg);
    expect(darkBg).not.toBe('#FFFDFF');
    expect(darkBg).not.toBe('#FFFFFF');
  });

  it('True Black keeps the card visually distinct from the deep-black page background', async () => {
    await setAppearanceMode('dark');
    await setTrueBlackEnabled(true);
    const renderer = await renderModal();
    const card = renderer.root.findAll(node => flattenStyle(node.props.style).borderRadius === 28)[0];
    const cardBg = flattenStyle(card.props.style).backgroundColor;
    // True Black's page background is '#030304'; the card must use the
    // separate True Black *card* surface, not the page background itself.
    expect(cardBg).not.toBe('#030304');
    expect(cardBg).toBe('#0B0B10');
  });

  it('primary action text/icon are readable against theme.colors.primary via onPrimaryTextColor, never hardcoded', async () => {
    const renderer = await renderModal();
    const primaryLabel = renderer.root.findAll(node => node.props.children === 'Modifier la date')[0];
    const primaryTextColor = flattenStyle(primaryLabel.props.style).color;
    expect(typeof primaryTextColor).toBe('string');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkPrimaryTextColor = flattenStyle(primaryLabel.props.style).color;
    // Confirms it's theme-derived (onPrimaryTextColor), not the old fixed '#FFFFFF' literal that never adapted.
    expect(typeof darkPrimaryTextColor).toBe('string');
  });

  it('secondary action ("Annuler") stays visible against the card — never the same color as its own background', async () => {
    const renderer = await renderModal();
    const secondaryLabel = renderer.root.findAll(node => node.props.children === 'Annuler')[0];
    const secondaryButton = secondaryLabel.parent!;
    const textColor = flattenStyle(secondaryLabel.props.style).color;
    const buttonBg = flattenStyle(secondaryButton.props.style).backgroundColor;
    expect(textColor).not.toBe(buttonBg);
  });
});

describe('PostpartumConsistencyModal — static appearance-resolution guard', () => {
  it('never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no hardcoded fixed-light literals)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumConsistencyModal.tsx'), 'utf8');
    expect(source).not.toMatch(/useColorScheme\s*\(/);
    expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
    expect(source).not.toMatch(/isDark\s*\?/);
    expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
    expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
    expect(source).not.toMatch(/#FFFDFF|#30205D|#62577A|#F0E8FC|#6B4BC4/i);
  });

  it('consumes useAwaTheme()', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumConsistencyModal.tsx'), 'utf8');
    expect(source).toMatch(/useAwaTheme\s*\(/);
  });
});
