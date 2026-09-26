import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import MenopauseDashboard from '../MenopauseDashboard';
import MenopauseCalendarContent from '../MenopauseCalendarContent';
import MenopauseStatisticsScreen from '../../../screens/menopause/MenopauseStatisticsScreen';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {
  setMenopauseHormonalTreatmentStatus,
  setMenopauseLabTracking,
  setMenopauseStage,
} from '../../../state/menopausePreferences';
import {addMenopauseLabResult, saveMenopauseJournalField} from '../../../state/menopauseJournalStore';

// G — nothing in the Menopause screens may look tappable (chevron, "Voir tout")
// without actually doing something.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(element: React.JSX.Element) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  return renderer;
}

/** Every "go" chevron must sit inside something that has an onPress. */
function chevronsWithoutAction(renderer: ReactTestRenderer.ReactTestRenderer): number {
  return renderer.root
    .findAllByType(MaterialDesignIcons)
    .filter(icon => icon.props.name === 'chevron-right' || icon.props.name === 'chevron-down')
    .filter(icon => {
      let node: ReactTestRenderer.ReactTestInstance | null = icon.parent;
      while (node) {
        if (typeof node.props.onPress === 'function') {return false;}
        node = node.parent;
      }
      return true;
    }).length;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

beforeAll(async () => {
  await setMenopauseStage('menopause');
  await setMenopauseHormonalTreatmentStatus('track');
  await setMenopauseLabTracking('both');
  const today = new Date().toLocaleDateString('en-CA');
  await saveMenopauseJournalField(today, 'symptoms', ['hot_flashes']);
  await addMenopauseLabResult({type: 'fsh', value: 40, date: today});
  await addMenopauseLabResult({type: 'estradiol', value: 20, date: today});
});

beforeEach(() => {
  resetPremiumStateForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Menopause screens — no misleading affordances', () => {
  it('Dashboard: every chevron belongs to a pressable row', async () => {
    const renderer = await renderScreen(
      <MenopauseDashboard navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />,
    );
    expect(renderer.root.findAllByType(MaterialDesignIcons).some(icon => icon.props.name === 'chevron-right')).toBe(true);
    expect(chevronsWithoutAction(renderer)).toBe(0);
  });

  it('Calendar: every chevron belongs to a pressable control', async () => {
    const renderer = await renderScreen(<MenopauseCalendarContent />);
    expect(chevronsWithoutAction(renderer)).toBe(0);
  });

  it('Statistics: no chevron and no "Voir tout" without an action', async () => {
    const renderer = await renderScreen(<MenopauseStatisticsScreen />);
    expect(chevronsWithoutAction(renderer)).toBe(0);
    expect(textsOf(renderer)).not.toContain('Voir tout');
  });
});
