import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import LibraryScreen from '../LibraryScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled, resetAppLanguageForTests} from '../../state/themePreferences';
import i18n from '../../i18n';

// The Library's filters: ONE horizontally scrolling row of pill chips — the four tabs, then the categories.

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderLibrary() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => <LibraryScreen navigation={{navigate: jest.fn()} as never} route={{} as never} />}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const flat = (style: unknown): Record<string, unknown> => {
  const resolve = (value: unknown): Record<string, unknown> =>
    typeof value === 'function' ? resolve((value as (state: {pressed: boolean}) => unknown)({pressed: false})) : Array.isArray(value) ? Object.assign({}, ...value.map(resolve)) : ((value as Record<string, unknown>) ?? {});
  return resolve(style);
};

const tabs = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function')
    .filter((node, index, all) => all.findIndex(other => other.props.onPress === node.props.onPress) === index);
const tabLabel = (tab: ReactTestRenderer.ReactTestInstance) => tab.findAll(node => node.props.numberOfLines === 1 && typeof node.props.children === 'string')[0].props.children as string;
const press = (node: ReactTestRenderer.ReactTestInstance) => act(async () => { node.props.onPress(); });
const filterButton = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === 'Catégories' && typeof node.props.onPress === 'function')[0];
const checkboxes = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => node.props.accessibilityRole === 'checkbox' && typeof node.props.onPress === 'function')
    .filter((node, index, all) => all.findIndex(other => other.props.onPress === node.props.onPress) === index);
const buttonByLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.label === label && typeof node.props.onPress === 'function')[0];
const hasDot = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAll(node => flat(node.props.style).width === 9 && flat(node.props.style).height === 9).length > 0;
const hasText = (renderer: ReactTestRenderer.ReactTestRenderer, text: string) =>
  renderer.root.findAll(node => node.props.numberOfLines === 1 && node.props.children === text).length > 0;

beforeEach(async () => {
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('LibraryScreen type tabs and category filter', () => {
  it('has four equal tabs, text only: Tout, Médical, Religieux, Favoris', async () => {
    const renderer = await renderLibrary();
    const all = tabs(renderer);
    expect(all.map(tabLabel)).toEqual(['Tout', 'Médical', 'Religieux', 'Favoris']);
    all.forEach(tab => expect(flat(tab.props.style).flex).toBe(1));
  });

  it('selecting a tab marks exactly that tab', async () => {
    const renderer = await renderLibrary();
    const selected = () => tabs(renderer).filter(tab => tab.props.accessibilityState.selected).map(tabLabel);
    expect(selected()).toEqual(['Tout']);
    await press(tabs(renderer)[1]);
    expect(selected()).toEqual(['Médical']);
    await press(tabs(renderer)[3]);
    expect(selected()).toEqual(['Favoris']);
  });

  it('the filter button opens the category sheet; ticking then "Appliquer" shows a dot and a removable chip', async () => {
    const renderer = await renderLibrary();
    expect(hasDot(renderer)).toBe(false);
    expect(checkboxes(renderer)).toHaveLength(0);

    await press(filterButton(renderer));
    const boxes = checkboxes(renderer);
    expect(boxes.length).toBeGreaterThan(3);
    await press(boxes[0]);
    await press(buttonByLabel(renderer, 'Appliquer'));

    expect(hasDot(renderer)).toBe(true);
    const chip = renderer.root.findAll(node => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function' && node.findAll(n => n.props.name === 'close').length > 0)[0];
    expect(chip).toBeDefined();
    await press(chip);
    expect(hasDot(renderer)).toBe(false);
  });

  it('"Réinitialiser" clears the draft: applying afterwards leaves no category active', async () => {
    const renderer = await renderLibrary();
    await press(filterButton(renderer));
    await press(checkboxes(renderer)[0]);
    await press(buttonByLabel(renderer, 'Réinitialiser'));
    await press(buttonByLabel(renderer, 'Appliquer'));
    expect(hasDot(renderer)).toBe(false);
    expect(hasText(renderer, 'Tout')).toBe(true);
  });
});
