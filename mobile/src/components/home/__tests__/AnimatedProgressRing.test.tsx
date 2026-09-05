import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import Svg, {Stop} from 'react-native-svg';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {AnimatedProgressRing} from '../AnimatedProgressRing';
import IrregularDashboard from '../../irregular/IrregularDashboard';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderWithTheme(children: React.ReactNode) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AwaThemeProvider>{children}</AwaThemeProvider>);
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

describe('AnimatedProgressRing — theme reactivity, caller API unchanged', () => {
  it('the track/arc gradient follows the resolved theme', async () => {
    const renderer = await renderWithTheme(
      <AnimatedProgressRing
        accessibilityLabel="Jour 5 sur 21, plaquette en cours"
        centerCaption="Jour"
        centerValue={5}
        footnote="Plaquette en cours"
        isConfigured
        progress={5 / 21}
        statusColor="#42A66A"
        statusIcon="check-bold"
        statusText="Effectuée"
      />,
    );
    const lastStop = () => renderer.root.findAllByType(Stop)[3].props.stopColor;
    expect(lastStop()).toBe('#6D4AE8');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(lastStop()).not.toBe('#6D4AE8');
  });

  it('keeps the caller-supplied statusColor/statusIcon/statusText untouched (unconfigured state)', async () => {
    const renderer = await renderWithTheme(
      <AnimatedProgressRing
        accessibilityLabel="Cycle à renseigner, suivi en cours"
        footnote="Suivi en cours"
        isConfigured={false}
        progress={0}
        statusColor="#8B6FD1"
        statusIcon="calendar-clock-outline"
        statusText="Cycle à renseigner"
      />,
    );
    const status = renderer.root.findAll(node => node.props.children === 'Cycle à renseigner')[0];
    expect(status.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({color: '#8B6FD1'})]),
    );
  });

  it('renders exactly one gradient definition regardless of theme (single Svg, no duplicated defs)', async () => {
    const renderer = await renderWithTheme(
      <AnimatedProgressRing
        accessibilityLabel="test"
        footnote="test"
        isConfigured={false}
        progress={0}
        statusColor="#8B6FD1"
        statusIcon="calendar-clock-outline"
        statusText="test"
      />,
    );
    expect(renderer.root.findAllByType(Svg)).toHaveLength(1);
  });
});

describe('AnimatedProgressRing — IrregularDashboard continued compatibility', () => {
  const Stack = createNativeStackNavigator();
  const navRef = createNavigationContainerRef();
  const TEST_METRICS: Metrics = {
    frame: {x: 0, y: 0, width: 320, height: 640},
    insets: {top: 0, left: 0, right: 0, bottom: 0},
  };

  it('SOPK Dashboard still renders its ring (decorative statusColor) after the shared ring was migrated', async () => {
    const navigation = {navigate: jest.fn()} as never;
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <JournalSheetProvider>
              <NavigationContainer ref={navRef}>
                <Stack.Navigator screenOptions={{headerShown: false}}>
                  <Stack.Screen name="Test">
                    {() => <IrregularDashboard navigation={navigation} route={{key: 'test', name: 'CycleHome'}} />}
                  </Stack.Screen>
                </Stack.Navigator>
              </NavigationContainer>
            </JournalSheetProvider>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer!);

    expect(renderer!.root.findAllByType(Svg)).toHaveLength(1);
  });
});
