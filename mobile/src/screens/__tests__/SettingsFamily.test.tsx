import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import PrivacySecurityScreen from '../PrivacySecurityScreen';
import BackupDataScreen from '../BackupDataScreen';
import HelpSupportScreen from '../HelpSupportScreen';
import {DataManagementScreen, DeleteAccountScreen} from '../DataPrivacyScreens';
import PersonalInformationScreen from '../PersonalInformationScreen';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

// PrivacySecurityScreen uses useFocusEffect and needs a real
// NavigationContainer ancestor, same minimal harness as every dashboard test.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

async function renderWithNavigation(Component: React.ComponentType<any>) {
  const navigation = {navigate: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <Component navigation={navigation} route={{key: 'test', name: 'Test'}} />}
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

async function renderStandalone(Component: React.ComponentType<any>, navigation: object) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <Component navigation={navigation as never} route={{key: 'test', name: 'Test'} as never} />
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

const FILES: Array<[string, string]> = [
  ['PrivacySecurityScreen', '../PrivacySecurityScreen.tsx'],
  ['BackupDataScreen', '../BackupDataScreen.tsx'],
  ['HelpSupportScreen', '../HelpSupportScreen.tsx'],
  ['DataPrivacyScreens', '../DataPrivacyScreens.tsx'],
  ['PersonalInformationScreen', '../PersonalInformationScreen.tsx'],
];

describe('E2 Settings family — static architecture guard', () => {
  it.each(FILES)('%s never calls useColorScheme, defines no LIGHT_CHROME/DARK_CHROME, and never exposes Midnight', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).not.toMatch(new RegExp('=\\s*useColorScheme\\(\\)'));
    expect(source).not.toMatch(/LIGHT_CHROME|DARK_CHROME/);
    expect(source).not.toMatch(/getAwaTheme\(|resolveEffectiveThemeId\(/);
    expect(source).not.toMatch(/midnight/i);
  });
});

describe('PrivacySecurityScreen — resolved global theme', () => {
  it('StatusBar follows the resolved theme and changes Light -> Dark without remounting', async () => {
    const renderer = await renderWithNavigation(PrivacySecurityScreen);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('preserves the destructive "Supprimer mon compte" row', async () => {
    const renderer = await renderWithNavigation(PrivacySecurityScreen);
    expect(renderer.root.findAll(node => node.props.children === 'Supprimer mon compte').length).toBeGreaterThan(0);
  });
});

describe('BackupDataScreen — resolved global theme', () => {
  it('background follows theme.colors.background and reacts to palette switch', async () => {
    const navigation = {goBack: jest.fn(), navigate: jest.fn()};
    const renderer = await renderStandalone(BackupDataScreen, navigation);
    const safe = () => renderer.root.findAll(node => node.props.style && node.props.style.flex === 1 && 'backgroundColor' in node.props.style)[0];
    const before = flattenStyle(safe().props.style).backgroundColor;

    await act(async () => {
      await setSelectedThemeId('sage-serenity');
    });
    expect(flattenStyle(safe().props.style).backgroundColor).not.toBe(before);
  });
});

describe('HelpSupportScreen — resolved global theme', () => {
  it('renders without crashing and reacts to Dark mode', async () => {
    const navigation = {goBack: jest.fn(), navigate: jest.fn()};
    const renderer = await renderStandalone(HelpSupportScreen, navigation);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(statusBar().props.barStyle).toBe('light-content');
  });
});

describe('DataManagementScreen / DeleteAccountScreen — resolved global theme, destructive action preserved', () => {
  it('DataManagementScreen renders with resolved theme', async () => {
    const navigation = {goBack: jest.fn()};
    const renderer = await renderStandalone(DataManagementScreen as never, navigation);
    expect(renderer.root.findAll(node => node.props.children === 'Gestion des données').length).toBeGreaterThan(0);
  });

  it('DeleteAccountScreen preserves the SUPPRIMER confirmation and stays destructive', async () => {
    const navigation = {goBack: jest.fn(), reset: jest.fn()};
    const renderer = await renderStandalone(DeleteAccountScreen as never, navigation);
    expect(renderer.root.findAll(node => node.props.children === 'Écris SUPPRIMER pour confirmer').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Supprimer définitivement').length).toBeGreaterThan(0);
  });
});

describe('PersonalInformationScreen — resolved global theme', () => {
  it('renders core fields and reacts to Dark mode', async () => {
    const navigation = {goBack: jest.fn()};
    const renderer = await renderStandalone(PersonalInformationScreen, navigation);
    expect(renderer.root.findAll(node => node.props.children === 'Informations personnelles').length).toBeGreaterThan(0);

    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(statusBar().props.barStyle).toBe('light-content');
  });
});
