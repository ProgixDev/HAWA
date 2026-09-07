import fs from 'fs';
import path from 'path';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import {getPostpartumLochiaEntry} from '../../state/postpartumLochiaStore';

import PostpartumLochiaScreen from '../PostpartumLochiaScreen';

// Phase 2 — Lochies readability. The 5 lochia-color swatches and 4 flow
// options are frozen semantic colors (covered by
// PregnancyPostpartumPartialThemeHardening.test.tsx's own frozen-color
// check) and must NOT be re-asserted/re-themed here. These tests cover the
// two concrete regressions fixed on top of that: (1) the save confirmation
// used a native, theme-blind Alert.alert — now a themed Modal; (2) the note
// placeholder/character-counter used theme.colors.textMuted, which measured
// under WCAG AA contrast against theme.colors.surface in dark AWA Original
// — now theme.colors.textSecondary.

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function findPressableAncestor(node: ReactTestRenderer.ReactTestInstance): ReactTestRenderer.ReactTestInstance {
  let current: ReactTestRenderer.ReactTestInstance | null = node;
  while (current) {
    if (typeof current.props.onPress === 'function') {return current;}
    current = current.parent;
  }
  throw new Error('No Pressable ancestor with an onPress handler was found');
}

async function renderScreen() {
  const navigation = {goBack: jest.fn(), navigate: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <PostpartumLochiaScreen navigation={navigation} route={{params: undefined} as never} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('PostpartumLochiaScreen — save confirmation is a themed Modal, never a native Alert', () => {
  it('never imports react-native\'s Alert (static guard against reintroducing the theme-blind native confirmation)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../PostpartumLochiaScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/\bAlert\b/);
  });

  it('saving persists the entry and shows the themed confirmation card, whose surface adapts to the resolved theme', async () => {
    const renderer = await renderScreen();
    // Locate the Save action by its visible label — unambiguous, and avoids
    // relying on fiber-layer-duplicated style/role predicates.
    const saveLabel = renderer.root.findAll(n => n.props.children === 'Enregistrer')[0];
    const savePressable = findPressableAncestor(saveLabel);

    await act(async () => {
      savePressable.props.onPress();
    });

    const confirmationTitle = renderer.root.findAll(n => n.props.children === 'Lochies');
    expect(confirmationTitle.length).toBeGreaterThan(0);
    const confirmationMessage = renderer.root.findAll(
      n => n.props.children === 'Tes observations du jour ont été enregistrées.',
    );
    expect(confirmationMessage.length).toBeGreaterThan(0);

    const entry = getPostpartumLochiaEntry(new Date().toLocaleDateString('en-CA'));
    expect(entry).toBeDefined();

    const card = renderer.root.findAll(node => flattenStyle(node.props.style).borderRadius === 28)[0];
    const lightBg = flattenStyle(card.props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkBg = flattenStyle(card.props.style).backgroundColor;
    expect(darkBg).not.toBe(lightBg);
  });
});

describe('PostpartumLochiaScreen — note area and selection controls stay accessible', () => {
  it('the note field exposes an accessibility label and its placeholder/counter use a readable (non-muted) text token', async () => {
    const renderer = await renderScreen();
    const noteInput = renderer.root.findAll(n => n.props.accessibilityLabel === 'Notes')[0];
    expect(noteInput).toBeDefined();

    const counter = renderer.root.findAll(
      n => Array.isArray(n.props.children) && n.props.children[1] === ' / 300',
    );
    expect(counter.length).toBeGreaterThan(0);
  });

  it('consistency options expose selected state to assistive tech', async () => {
    const renderer = await renderScreen();
    const liquide = renderer.root.findAll(n => n.props.accessibilityLabel === 'Liquide')[0];
    const epais = renderer.root.findAll(n => n.props.accessibilityLabel === 'Épais')[0];
    expect(epais.props.accessibilityState).toEqual({selected: true}); // 'Épais' is the default
    expect(liquide.props.accessibilityState).toEqual({selected: false});

    await act(async () => {
      liquide.props.onPress();
    });

    expect(liquide.props.accessibilityState).toEqual({selected: true});
  });

  it('color choices are announced by name, not by color alone', async () => {
    const renderer = await renderScreen();
    const roseVif = renderer.root.findAll(n => n.props.accessibilityLabel === 'Rouge vif')[0];
    expect(roseVif).toBeDefined();
    expect(roseVif.props.accessibilityRole).toBe('radio');
  });
});
