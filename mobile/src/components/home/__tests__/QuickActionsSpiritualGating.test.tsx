import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import QuickActionsGrid, {type QuickActionItem} from '../QuickActionsGrid';
import {setSpiritualMarkersEnabled} from '../../../state/onboardingPreferences';
import {
  SPIRITUAL_QUICK_ACTION_KEYS,
  applyVisibleOrderToFullOrder,
  filterQuickActionsForSpiritualMarkers,
  resolveQuickActionsOrder,
} from '../../../state/quickActionsPreferences';

// M46 — shared spiritual filter + persisted-order safety.

const ORDER_KEY = '@hawa/home/quick-actions-order';
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const item = (key: string, label: string): QuickActionItem => ({
  key,
  icon: 'heart-outline',
  iconColor: '#000000',
  iconBg: '#FFFFFF',
  label,
});

// Same six keys/labels every objective dashboard builds.
const ITEMS: QuickActionItem[] = [
  item('prayer-times', 'Horaires\nde prière'),
  item('library', 'Bibliothèque'),
  item('daily-journal', 'Journal quotidien'),
  item('hijri-calendar', 'Calendrier Hijri'),
  item('qadaa', 'Jeûnes à rattraper'),
  item('statistics', 'Statistiques'),
];
const ALL_KEYS = ITEMS.map(entry => entry.key);

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderGrid() {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <QuickActionsGrid items={ITEMS} />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

/** Labels of the rendered tiles, in on-screen order. */
const tileLabels = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => {
  const labels: string[] = [];
  renderer.root
    .findAll(
      node =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.accessibilityLabel === 'string' &&
        typeof node.props.onLongPress === 'function',
    )
    .forEach(node => {
      if (!labels.includes(node.props.accessibilityLabel)) {
        labels.push(node.props.accessibilityLabel);
      }
    });
  return labels;
};

async function swapTiles(renderer: ReactTestRenderer.ReactTestRenderer, first: string, second: string) {
  const tile = (label: string) =>
    renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.onLongPress === 'function')[0];
  await act(async () => {
    tile(first).props.onLongPress();
  });
  await act(async () => {
    tile(second).props.onPress();
  });
}

const storedOrder = async () => JSON.parse((await AsyncStorage.getItem(ORDER_KEY)) as string) as string[];

beforeEach(async () => {
  await AsyncStorage.clear();
  setSpiritualMarkersEnabled(true);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('shared spiritual quick-action helpers (pure)', () => {
  it('the spiritual set is exactly prayer times, Hijri calendar and Qadaa', () => {
    expect([...SPIRITUAL_QUICK_ACTION_KEYS].sort()).toEqual(['hijri-calendar', 'prayer-times', 'qadaa']);
  });

  it('filter: ON keeps everything, OFF drops only the spiritual entries, input untouched', () => {
    const snapshot = [...ITEMS];
    expect(filterQuickActionsForSpiritualMarkers(ITEMS, true).map(entry => entry.key)).toEqual(ALL_KEYS);
    expect(filterQuickActionsForSpiritualMarkers(ITEMS, false).map(entry => entry.key)).toEqual([
      'library',
      'daily-journal',
      'statistics',
    ]);
    expect(ITEMS).toEqual(snapshot);
  });

  it('resolveQuickActionsOrder: honours a valid permutation, otherwise the default', () => {
    const saved = ['statistics', 'library', 'qadaa', 'prayer-times', 'daily-journal', 'hijri-calendar'];
    expect(resolveQuickActionsOrder(saved, ALL_KEYS)).toEqual(saved);
    expect(resolveQuickActionsOrder(['library', 'statistics'], ALL_KEYS)).toEqual(ALL_KEYS);
    expect(resolveQuickActionsOrder(null, ALL_KEYS)).toEqual(ALL_KEYS);
  });

  it('applyVisibleOrderToFullOrder keeps hidden keys in their slots', () => {
    expect(
      applyVisibleOrderToFullOrder(ALL_KEYS, ['statistics', 'daily-journal', 'library']),
    ).toEqual(['prayer-times', 'statistics', 'daily-journal', 'hijri-calendar', 'qadaa', 'library']);
  });
});

describe('QuickActionsGrid — spiritual entries follow the canonical spiritual-markers preference', () => {
  it('ON shows all six tiles; OFF hides the three spiritual tiles (also from the customization flow); back ON restores them', async () => {
    const renderer = await renderGrid();
    expect(tileLabels(renderer)).toEqual(ITEMS.map(entry => entry.label));

    await act(async () => {
      setSpiritualMarkersEnabled(false);
    });
    expect(tileLabels(renderer)).toEqual(['Bibliothèque', 'Journal quotidien', 'Statistiques']);
    // No "Options pour …" entry point is left for a hidden action either.
    expect(
      renderer.root.findAll(node => typeof node.props.accessibilityLabel === 'string' && /Horaires|Hijri|Jeûnes/.test(node.props.accessibilityLabel)),
    ).toHaveLength(0);

    await act(async () => {
      setSpiritualMarkersEnabled(true);
    });
    expect(tileLabels(renderer)).toEqual(ITEMS.map(entry => entry.label));
  });

  it('reordering while OFF never clobbers the persisted arrangement of the hidden spiritual tiles', async () => {
    const renderer = await renderGrid();
    await act(async () => {
      setSpiritualMarkersEnabled(false);
    });

    await swapTiles(renderer, 'Bibliothèque', 'Statistiques');
    expect(tileLabels(renderer)).toEqual(['Statistiques', 'Journal quotidien', 'Bibliothèque']);

    // Full 6-key order persisted, hidden keys still in their original slots.
    expect(await storedOrder()).toEqual([
      'prayer-times',
      'statistics',
      'daily-journal',
      'hijri-calendar',
      'qadaa',
      'library',
    ]);

    await act(async () => {
      setSpiritualMarkersEnabled(true);
    });
    expect(tileLabels(renderer)).toEqual([
      'Horaires\nde prière',
      'Statistiques',
      'Journal quotidien',
      'Calendrier Hijri',
      'Jeûnes à rattraper',
      'Bibliothèque',
    ]);
  });

  it('a full order saved while spiritual markers were ON is still applied while OFF (and after a remount)', async () => {
    await AsyncStorage.setItem(
      ORDER_KEY,
      JSON.stringify(['statistics', 'qadaa', 'library', 'prayer-times', 'daily-journal', 'hijri-calendar']),
    );
    setSpiritualMarkersEnabled(false);

    const renderer = await renderGrid();
    expect(tileLabels(renderer)).toEqual(['Statistiques', 'Bibliothèque', 'Journal quotidien']);

    await act(async () => {
      setSpiritualMarkersEnabled(true);
    });
    expect(tileLabels(renderer)).toEqual([
      'Statistiques',
      'Jeûnes à rattraper',
      'Bibliothèque',
      'Horaires\nde prière',
      'Journal quotidien',
      'Calendrier Hijri',
    ]);
    // The persisted value was never rewritten by merely hiding tiles.
    expect(await storedOrder()).toEqual([
      'statistics',
      'qadaa',
      'library',
      'prayer-times',
      'daily-journal',
      'hijri-calendar',
    ]);
  });

  it('an armed spiritual tile is disarmed when the toggle turns OFF (no swap with a hidden tile)', async () => {
    const renderer = await renderGrid();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Calendrier Hijri' && typeof node.props.onLongPress === 'function')[0].props.onLongPress();
    });
    await act(async () => {
      setSpiritualMarkersEnabled(false);
    });
    await swapTiles(renderer, 'Bibliothèque', 'Statistiques');
    expect(tileLabels(renderer)).toEqual(['Statistiques', 'Journal quotidien', 'Bibliothèque']);
  });
});
