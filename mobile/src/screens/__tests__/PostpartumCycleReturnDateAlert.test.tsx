import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';
import {confirmDelivery} from '../../state/postpartumPreferences';
import {markPostpartumLochiaEnded} from '../../state/postpartumLochiaStore';
import InlineCalendarPickerModal from '../../components/onboarding/InlineCalendarPickerModal';

import PostpartumCycleReturnScreen from '../PostpartumCycleReturnScreen';

// Phase 3 — "Date à vérifier" invalid-date alert. The business rule itself
// (a first-period date before the delivery date is invalid) must stay
// exactly the same; only the alert's presentation was fixed (see
// PostpartumConsistencyModal.test.tsx for the shared component's own
// theme-awareness coverage). These tests confirm the rule still fires/
// doesn't fire correctly and that the rendered alert reads its surface from
// the resolved theme rather than a fixed light literal.

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
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <PostpartumCycleReturnScreen navigation={{} as never} route={{params: undefined} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
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
  await confirmDelivery(new Date('2026-08-01T12:00:00'));
  await markPostpartumLochiaEnded('2026-08-10');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

function findConsistencyModal(renderer: ReactTestRenderer.ReactTestRenderer) {
  // PostpartumConsistencyModal's own card is the only borderRadius:28 node
  // in this screen's tree once visible.
  return renderer.root.findAll(node => flattenStyle(node.props.style).borderRadius === 28);
}

describe('PostpartumCycleReturnScreen — "Date à vérifier" invalid-date rule preserved', () => {
  it('a date BEFORE the delivery date still triggers the "Date à vérifier" alert', async () => {
    const renderer = await renderScreen();
    const picker = renderer.root.findByType(InlineCalendarPickerModal);

    await act(async () => {
      picker.props.onSelect(new Date('2026-07-01T12:00:00')); // before 2026-08-01
    });

    const title = renderer.root.findAll(node => node.props.children === 'Date à vérifier');
    expect(title.length).toBeGreaterThan(0);
  });

  it('a valid date (on/after delivery, after lochia end) does NOT trigger the alert', async () => {
    const renderer = await renderScreen();
    const picker = renderer.root.findByType(InlineCalendarPickerModal);

    await act(async () => {
      picker.props.onSelect(new Date('2026-09-15T12:00:00')); // after delivery and lochia end
    });

    const title = renderer.root.findAll(node => node.props.children === 'Date à vérifier');
    expect(title.length).toBe(0);
  });

  it('the alert never renders as a fixed light-literal card — its surface changes between Light and Dark', async () => {
    const renderer = await renderScreen();
    const picker = renderer.root.findByType(InlineCalendarPickerModal);

    await act(async () => {
      picker.props.onSelect(new Date('2026-07-01T12:00:00'));
    });

    const lightCard = findConsistencyModal(renderer)[0];
    const lightBg = flattenStyle(lightCard.props.style).backgroundColor;
    expect(lightBg).not.toBe('#FFFDFF'); // the old hardcoded fixed-light literal

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkCard = findConsistencyModal(renderer)[0];
    const darkBg = flattenStyle(darkCard.props.style).backgroundColor;
    expect(darkBg).not.toBe(lightBg);
    expect(darkBg).not.toBe('#FFFDFF');
    expect(darkBg).not.toBe('#FFFFFF');
  });
});
