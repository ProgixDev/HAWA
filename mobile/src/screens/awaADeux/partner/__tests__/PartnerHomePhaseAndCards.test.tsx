import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Dimensions, ScrollView, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import PartnerHomeScreen, {TILE_SIZE_COMPACT, TILE_SIZE_REGULAR} from '../PartnerHomeScreen';
import {AwaThemeProvider} from '../../../../theme/AwaThemeProvider';
import {setSharingToggle} from '../../../../state/awaADeuxSharingStore';
import {setActiveObjective} from '../../../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../../../state/themePreferences';
import i18n from '../../../../i18n';
import type {PartnerCycleInfo} from '../../../../utils/awaADeuxPartnerCycleInfo';

// Real-device findings (post-Phase-7M audit): PartnerHomeScreen's cycle-ring
// phase label was a hardcoded-French legacy value (getCyclePhaseIdentity's
// PHASE_INSIGHTS), not the already-migrated `cyclePhase.*` i18n keys — and
// its "Shared information" tiles were fixed-width in a non-indicating
// horizontal ScrollView, overflowing the viewport on a real phone. This file
// is scoped to those two fixes; cycle math itself (computePartnerCycleInfo)
// is mocked so the tests stay focused and deterministic rather than
// re-deriving a whole regular-cycle fixture.
jest.mock('../../../../utils/awaADeuxPartnerCycleInfo', () => {
  const actual = jest.requireActual('../../../../utils/awaADeuxPartnerCycleInfo');
  return {...actual, computePartnerCycleInfo: jest.fn()};
});

import {computePartnerCycleInfo} from '../../../../utils/awaADeuxPartnerCycleInfo';
const mockComputePartnerCycleInfo = computePartnerCycleInfo as jest.Mock;

// nextPeriodDate is a real future date (not null) so the "Prochains événements"
// tile has a genuine countdown subtitle to assert on — everything else about this
// fixture stays a deliberately simple, controlled stand-in for real cycle math
// (which is mocked out entirely in this file; see the jest.mock below).
const FIVE_DAYS_FROM_NOW = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
const MENSTRUATION_INFO: PartnerCycleInfo = {
  cycleDay: 3,
  cycleLength: 28,
  cycleProgress: 3 / 28,
  phase: 'menstruation',
  nextPeriod: '05/10',
  nextPeriodDate: FIVE_DAYS_FROM_NOW,
  fertileWindow: null,
  fertileWindowRange: null,
  ovulation: null,
  ovulationDate: null,
};

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 375, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderPartnerHome() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={PartnerHomeScreen} name="PartnerHome" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 5; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  mockComputePartnerCycleInfo.mockReturnValue(MENSTRUATION_INFO);
  await setActiveObjective('cycle');
  await setSharingToggle('cycleDay', true);
  await setSharingToggle('periodStatus', true);
  await setSharingToggle('fertileWindow', true);
  await setSharingToggle('ovulation', false);
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('TEST 4/5 — the cycle-ring phase label follows the app language', () => {
  it('EN default renders the translated English phase label, never the hardcoded French one', async () => {
    const renderer = await renderPartnerHome();
    const texts = textsOf(renderer);
    expect(texts).toContain('Menstrual phase');
    expect(texts).not.toContain('Phase menstruelle');
  });

  it('explicit FR renders the French phase label', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');

    const renderer = await renderPartnerHome();
    const texts = textsOf(renderer);
    expect(texts).toContain('Phase menstruelle');
    expect(texts).not.toContain('Menstrual phase');
  });
});

describe('TEST 6 — the underlying cycle data itself never changes with the language', () => {
  it('the real cycle day number (3) renders identically in EN and FR, only the surrounding label differs', async () => {
    const en = await renderPartnerHome();
    expect(textsOf(en)).toContain('Day 3');

    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const fr = await renderPartnerHome();
    expect(textsOf(fr)).toContain('Jour 3');
  });
});

describe('TEST 7/8 — "Shared information" tiles stay a fixed compact square and never stretch to fill the row', () => {
  // toJSON() walks the actual rendered host tree once each — unlike
  // findAllByProps(), which can report the same host node more than once —
  // so this is the reliable way to count real tiles. testID distinguishes the
  // "Shared information" tiles from the "Prochains événements" ones, even
  // though both are now the exact same SharedInfoTile component.
  function tileStyles(renderer: ReactTestRenderer.ReactTestRenderer, testID = 'partner-shared-info-tile'): Array<Record<string, unknown>> {
    const merged: Array<Record<string, unknown>> = [];
    const visit = (node: unknown): void => {
      if (!node || typeof node !== 'object') {return;}
      const element = node as {props?: Record<string, unknown>; children?: unknown[]};
      if (element.props?.testID === testID) {
        const style = element.props.style as Array<Record<string, unknown> | false>;
        merged.push(Object.assign({}, ...style.filter(Boolean)));
      }
      (element.children ?? []).forEach(visit);
    };
    visit(renderer.toJSON());
    return merged;
  }

  function tileWidths(renderer: ReactTestRenderer.ReactTestRenderer, testID = 'partner-shared-info-tile'): number[] {
    return tileStyles(renderer, testID).map(style => style.width as number);
  }

  // Dimensions.get('window') in this test environment is well above the
  // screen's own `compact` (width < 360) threshold, so every tile in this file
  // is expected at TILE_SIZE_REGULAR — the point being that this number is the
  // SAME constant regardless of how many tiles are showing (1 vs. 4), never a
  // value computed by dividing the row width by the item count.
  function expectFixedSquareTiles(expectedCount: number, renderer: ReactTestRenderer.ReactTestRenderer, testID = 'partner-shared-info-tile') {
    const styles = tileStyles(renderer, testID);
    expect(styles).toHaveLength(expectedCount);
    styles.forEach(style => {
      expect(style.aspectRatio).toBe(1);
      // A square's height is never set directly — only width + aspectRatio — so a
      // later layout change to the width math can never silently desync the two.
      expect(style.height).toBeUndefined();
      expect(style.width).toBe(TILE_SIZE_REGULAR);
    });
  }

  it('1 shared tile stays compact/square — never stretched to fill the available row width', async () => {
    await setSharingToggle('periodStatus', false);
    await setSharingToggle('fertileWindow', false);
    expectFixedSquareTiles(1, await renderPartnerHome());
  });

  it('2 shared tiles are the exact same fixed size as 1 (not a wider, divided-by-2 size)', async () => {
    await setSharingToggle('fertileWindow', false);
    expectFixedSquareTiles(2, await renderPartnerHome());
  });

  it('3 shared tiles are the exact same fixed size', async () => {
    expectFixedSquareTiles(3, await renderPartnerHome());
  });

  it('4 shared tiles are the exact same fixed size (not a narrower, divided-by-4 size)', async () => {
    await setSharingToggle('ovulation', true);
    expectFixedSquareTiles(4, await renderPartnerHome());
  });

  it('the row is a horizontal ScrollView, so a count that overflows the screen scrolls instead of shrinking any card', async () => {
    await setSharingToggle('ovulation', true); // 4 fixed-size tiles are wide enough to need scrolling on most phones
    const renderer = await renderPartnerHome();
    const horizontalScrollViews = renderer.root.findAllByType(ScrollView).filter(node => node.props.horizontal);
    expect(horizontalScrollViews.length).toBeGreaterThanOrEqual(1);
  });

  it('the icon/type scale is identical at 1 tile and at 4 — tied only to the device width class, never to the item count', async () => {
    await setSharingToggle('periodStatus', false);
    await setSharingToggle('fertileWindow', false);
    const oneTileRenderer = await renderPartnerHome();
    const oneIconSize = oneTileRenderer.root.findAll(node => node.props.testID === 'partner-shared-info-tile')[0].findByType(MaterialDesignIcons).props.size;

    await setSharingToggle('fertileWindow', true);
    await setSharingToggle('ovulation', true);
    const fourTilesRenderer = await renderPartnerHome();
    const fourIconSizes = fourTilesRenderer.root
      .findAll(node => node.props.testID === 'partner-shared-info-tile')
      .map(tile => tile.findByType(MaterialDesignIcons).props.size);

    expect(fourIconSizes.every(size => size === oneIconSize)).toBe(true);
  });

  it('on a narrow (320px) device, tiles use the smaller TILE_SIZE_COMPACT — still the same fixed size at 1 and at 4 items', async () => {
    const dimensionsSpy = jest.spyOn(Dimensions, 'get').mockImplementation((() => (
      {width: 320, height: 568, scale: 1, fontScale: 1}
    )) as never);
    try {
      await setSharingToggle('periodStatus', false);
      await setSharingToggle('fertileWindow', false);
      const oneTileWidths = tileWidths(await renderPartnerHome());
      expect(oneTileWidths).toEqual([TILE_SIZE_COMPACT]);

      await setSharingToggle('periodStatus', true);
      await setSharingToggle('fertileWindow', true);
      await setSharingToggle('ovulation', true);
      const fourTileWidths = tileWidths(await renderPartnerHome());
      expect(fourTileWidths).toEqual([TILE_SIZE_COMPACT, TILE_SIZE_COMPACT, TILE_SIZE_COMPACT, TILE_SIZE_COMPACT]);
    } finally {
      dimensionsSpy.mockRestore();
    }
  });

  describe('"Prochains événements" uses the exact same fixed compact square tile, never a second card implementation', () => {
    const EVENT_TEST_ID = 'partner-upcoming-event-tile';

    it('1 upcoming event (next period only, the default toggles) stays compact/square — never stretched to fill the row', async () => {
      const renderer = await renderPartnerHome();
      expectFixedSquareTiles(1, renderer, EVENT_TEST_ID);
    });

    it('2 upcoming events (next period + ovulation) are the exact same fixed size as 1, side by side', async () => {
      await setSharingToggle('ovulation', true);
      const renderer = await renderPartnerHome();
      expectFixedSquareTiles(2, renderer, EVENT_TEST_ID);
    });

    it('shares the exact same fixed size as the "Shared information" tiles (same TILE_SIZE_REGULAR constant)', async () => {
      await setSharingToggle('ovulation', true);
      const renderer = await renderPartnerHome();
      const sharedWidths = tileWidths(renderer, 'partner-shared-info-tile');
      const eventWidths = tileWidths(renderer, EVENT_TEST_ID);
      expect(eventWidths[0]).toBe(sharedWidths[0]);
    });

    it('the row is a horizontal ScrollView, and the countdown subtitle still renders alongside the label/value', async () => {
      const renderer = await renderPartnerHome();
      const horizontalScrollViews = renderer.root.findAllByType(ScrollView).filter(node => node.props.horizontal);
      expect(horizontalScrollViews.length).toBeGreaterThanOrEqual(1);
      expect(textsOf(renderer).some(text => /day|jour/i.test(text))).toBe(true);
    });
  });
});
