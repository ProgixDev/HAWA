import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import {JournalScreenLayout} from '../JournalScreenLayout';
import JournalTemperatureScreen from '../../../screens/journal/JournalTemperatureScreen';
import JournalCervicalMucusScreen from '../../../screens/journal/JournalCervicalMucusScreen';
import JournalLHTestScreen from '../../../screens/journal/JournalLHTestScreen';
import {setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';

// The hero card of a journal layout shows a small icon before its label by default; the conception and cycle journals
// (Basal temperature, Cervical mucus, LH test and Cycle evolution) opt out with `hideHeroIcon`, keeping the label and the illustration.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function render(element: React.JSX.Element) {
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
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
  activeRenderers.push(renderer);
  return renderer;
}

const layout = (props: {hideHeroIcon?: boolean}) => (
  <JournalScreenLayout
    heroLabel="Hero label"
    heroSource={require('../../../assets/images/conception-journal/basal-temperature.png')}
    icon="thermometer"
    title="Title"
    {...props}>
    <Text>content</Text>
  </JournalScreenLayout>
);

const heroIcons = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.name === 'thermometer');

beforeEach(async () => {
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('JournalScreenLayout hero icon', () => {
  it('shows the small icon before the hero label by default (other screens unchanged)', async () => {
    const renderer = await render(layout({}));
    expect(heroIcons(renderer).length).toBeGreaterThan(0);
  });

  it('hideHeroIcon removes only the icon: the label stays', async () => {
    const renderer = await render(layout({hideHeroIcon: true}));
    expect(heroIcons(renderer)).toHaveLength(0);
    expect(renderer.root.findAllByType(Text).some(node => [node.props.children].flat(Infinity).join('') === 'Hero label')).toBe(true);
  });
});

describe('screens without the hero icon', () => {
  it.each([
    ['Basal temperature', <JournalTemperatureScreen key="t" />],
    ['Cervical mucus', <JournalCervicalMucusScreen key="c" />],
    ['LH test', <JournalLHTestScreen key="l" />],
  ])('%s opts out of the hero icon', async (_name, element) => {
    const renderer = await render(element);
    expect(renderer.root.findByType(JournalScreenLayout).props.hideHeroIcon).toBe(true);
  });
});
