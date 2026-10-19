import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Pressable, Text, View} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import PostpartumDashboard from '../PostpartumDashboard';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {confirmDelivery} from '../../../state/postpartumPreferences';
import {hydratePostpartumJournal, savePostpartumJournalField} from '../../../state/postpartumJournalStore';

// Postpartum home → "Suivi du jour": the five labels (Fatigue, Sommeil, Humeur, Douleurs, Récupération) each sit on ONE line
// under their icon. The row measures the single-word labels and plans its layout from the real widths (utils/dailyLabelRow.ts):
// the base size when it fits, a slightly smaller one when not, a 3 + 2 grid of wider cells as the last resort - never a word
// cut in two. These tests drive the measurement the way React Native does (onLayout) with the real Inter widths.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const active: ReactTestRenderer.ReactTestRenderer[] = [];

// Inter Regular, 12 sp + 0.4 letter-spacing (the base label style), in dp
const BASE_WIDTHS: Record<string, number> = {Fatigue: 44.9, Sommeil: 51.5, Humeur: 47.5, Douleurs: 54.0, Récupération: 80.2};
const FRENCH = Object.keys(BASE_WIDTHS);
const ACCESSIBILITY_LABELS = ['Fatigue', 'Sommeil', 'Humeur', 'Douleurs', 'Récupération physique'];

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...(Array.isArray(style) ? style.flat(Infinity) : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function renderDashboard() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <PostpartumDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  for (let index = 0; index < 5; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  active.push(renderer);
  return renderer;
}

const dailyGrid = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(View).find(node => typeof node.props.onLayout === 'function' && flat(node.props.style).marginHorizontal === -8)!;
const measurers = (renderer: ReactTestRenderer.ReactTestRenderer) => {
  const container = renderer.root.findAllByType(View).find(node => flat(node.props.style).opacity === 0 && node.props.pointerEvents === 'none')!;
  return container.findAllByType(View).filter(node => typeof node.props.onLayout === 'function');
};
const items = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Pressable).filter(node => ACCESSIBILITY_LABELS.includes(String(node.props.accessibilityLabel)));
const labelOf = (item: ReactTestRenderer.ReactTestInstance) => item.findAllByType(Text).find(node => FRENCH.includes(textOf(node)))!;

// Lays the row out at `rowWidth` and reports each label's measured width, as the native layout pass does.
async function layout(renderer: ReactTestRenderer.ReactTestRenderer, rowWidth: number, widths: Record<string, number> = BASE_WIDTHS) {
  await act(async () => {
    dailyGrid(renderer).props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: rowWidth, height: 90}}});
  });
  await act(async () => {
    measurers(renderer).forEach(measurer => {
      const label = textOf(measurer.findAllByType(Text)[0]);
      measurer.props.onLayout({nativeEvent: {layout: {x: 0, y: 0, width: widths[label], height: 16}}});
    });
  });
}

beforeEach(async () => {
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await confirmDelivery(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000));
});

afterEach(() => {
  act(() => {
    active.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Postpartum "Suivi du jour" — labels on one line', () => {
  it('keeps the French labels unchanged, one measurer per single-word label, hidden from accessibility and touch', async () => {
    const renderer = await renderDashboard();
    expect(items(renderer).map(item => textOf(labelOf(item)))).toEqual(FRENCH);
    expect(items(renderer).map(item => item.props.accessibilityLabel)).toEqual(ACCESSIBILITY_LABELS);
    expect(measurers(renderer)).toHaveLength(5);
    const container = renderer.root.findAllByType(View).find(node => flat(node.props.style).opacity === 0 && node.props.pointerEvents === 'none')!;
    expect(container.props.accessibilityElementsHidden).toBe(true);
    expect(container.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('360 dp phone: every label is one line in the single row, "Récupération" included, one size step below the base', async () => {
    const renderer = await renderDashboard();
    await layout(renderer, 314); // 360 - 2 x 16 (screen) - 2 x 15 (card) + 16 (the row bleeds 8 dp into the card padding)
    expect(flat(dailyGrid(renderer).props.style).flexWrap).toBeUndefined();
    items(renderer).forEach(item => {
      const label = labelOf(item);
      expect(label.props.numberOfLines).toBe(1);
      expect(flat(label.props.style)).toMatchObject({fontSize: 10.5, letterSpacing: 0, textAlign: 'center'});
      expect(flat(item.props.style({pressed: false})).width).toBe('20%');
    });
    // the long word's box is wider than its 62.8 dp cell (centred, into the neighbours' room): it can never wrap
    const box = labelOf(items(renderer)[4]).parent!.parent!;
    expect(flat(box.props.style).width).toBeCloseTo(314 / 5 + 32, 5);
    expect(box.props.pointerEvents).toBe('none');
  });

  it('411 dp phone: the row keeps all five on one line at 11 sp', async () => {
    const renderer = await renderDashboard();
    await layout(renderer, 365);
    items(renderer).forEach(item => {
      expect(labelOf(item).props.numberOfLines).toBe(1);
      expect(flat(labelOf(item).props.style).fontSize).toBe(11);
    });
    expect(flat(dailyGrid(renderer).props.style).flexWrap).toBeUndefined();
  });

  it('320 dp phone (or a large system font): falls back to a 3 + 2 grid, the words still whole and on one line', async () => {
    const renderer = await renderDashboard();
    await layout(renderer, 282);
    expect(flat(dailyGrid(renderer).props.style)).toMatchObject({flexWrap: 'wrap', justifyContent: 'center'});
    items(renderer).forEach(item => {
      expect(flat(item.props.style({pressed: false})).width).toBe('33.333%');
      const label = labelOf(item);
      expect(label.props.numberOfLines).toBe(1);
      expect(label.props.adjustsFontSizeToFit).toBe(true);
    });
  });

  it('is the row at the base style before anything has been measured', async () => {
    const renderer = await renderDashboard();
    items(renderer).forEach(item => {
      expect(flat(labelOf(item).props.style)).toMatchObject({fontSize: 12, letterSpacing: 0.4});
      expect(flat(item.props.style({pressed: false})).width).toBe('20%');
    });
  });

  it('a multi-word label (Spanish "Estado de ánimo") may wrap onto two lines inside its cell and is never measured', async () => {
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
    const renderer = await renderDashboard();
    const mood = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Estado de ánimo')!;
    expect(mood.props.numberOfLines).toBe(2);
    expect(measurers(renderer).map(measurer => textOf(measurer.findAllByType(Text)[0]))).not.toContain('Estado de ánimo');
  });

  it('keeps the completed-today badge on its icon (inside the icon wrapper), with the same appearance', async () => {
    await hydratePostpartumJournal();
    await savePostpartumJournalField(new Date().toLocaleDateString('en-CA'), 'fatigue', 'Modérée');
    const renderer = await renderDashboard();
    const fatigue = items(renderer)[0];
    const wrap = fatigue.findAllByType(View).find(node => flat(node.props.style).width === 45 && flat(node.props.style).height === 45 && flat(node.props.style).borderRadius === undefined)!;
    const badge = wrap.findAllByType(View).find(node => flat(node.props.style).position === 'absolute')!;
    expect(flat(badge.props.style)).toMatchObject({top: 32, right: 0, width: 15, height: 15});
  });
});
