import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ImageBackground} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';

import PrivateIntimacyUnlockScreen from '../PrivateIntimacyUnlockScreen';
import PrivateIntimacyPinScreen from '../PrivateIntimacyPinScreen';
import PrivateIntimacyFaceIdScreen from '../PrivateIntimacyFaceIdScreen';

// Every objective's own personal-notes field (Cycle "Note personnelle",
// Contraception/Menopause "Notes du jour", Miscarriage "Notes personnelles")
// reuses this shared "Espace privé" gate — same as Vie intime/Rapports/Photos
// privées — but must now show the flat AWA background already used by
// Pregnancy "Informations médicales personnelles" (`#F3EEFC`, no PNG)
// instead of the padlock-artwork `private-lock-background.png`. Every other
// target (Vie intime/Rapports/Photos privées) must keep that PNG unchanged.

jest.mock('../../../services/privateSectionAuth', () => ({
  hasPrivatePin: jest.fn().mockResolvedValue(false),
  verifyPrivatePin: jest.fn().mockResolvedValue(false),
  savePrivatePin: jest.fn().mockResolvedValue(undefined),
  getBiometryType: jest.fn().mockResolvedValue(null),
  getBiometryLabel: jest.fn().mockReturnValue('Utiliser la biométrie'),
  getBiometryIcon: jest.fn().mockReturnValue('face-recognition'),
  authenticateWithBiometry: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../../state/securityPreferences', () => ({
  loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
  isBiometricEnabled: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../state/privateSectionAuthStore', () => ({
  isIntimacyUnlocked: jest.fn().mockReturnValue(false),
  unlockIntimacy: jest.fn(),
  lockIntimacy: jest.fn(),
  replaceWithIntimacyDestination: jest.fn(),
}));

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

function findFlatBackgroundNode(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findAll(node => {
    if (!node.props?.style) {return false;}
    return flattenStyle(node.props.style).backgroundColor === '#F3EEFC';
  })[0];
}

async function renderScreen(Screen: React.ComponentType<any>, target: string | undefined) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen initialParams={{target}} name="Test">
                {props => <Screen {...props} />}
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

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

const PERSONAL_NOTE_TARGETS = ['cycleNotes', 'contraceptionNotes', 'menopauseNotes', 'miscarriageNotes'];
const OTHER_TARGETS = ['cycle', 'conception', 'photos', undefined];

const SCREENS: Array<[string, React.ComponentType<any>]> = [
  ['PrivateIntimacyUnlockScreen', PrivateIntimacyUnlockScreen as React.ComponentType<any>],
  ['PrivateIntimacyPinScreen', PrivateIntimacyPinScreen as React.ComponentType<any>],
  ['PrivateIntimacyFaceIdScreen', PrivateIntimacyFaceIdScreen as React.ComponentType<any>],
];

describe.each(SCREENS)('%s — locked personal-note background', (_name, Screen) => {
  it.each(PERSONAL_NOTE_TARGETS)('target=%s shows the flat AWA background, no PNG', async target => {
    const renderer = await renderScreen(Screen, target);
    expect(findFlatBackgroundNode(renderer)).toBeDefined();
    expect(renderer.root.findAllByType(ImageBackground).length).toBe(0);
  });

  it.each(OTHER_TARGETS)('target=%s keeps the private-lock-background.png (Vie intime/Rapports/Photos privées unaffected)', async target => {
    const renderer = await renderScreen(Screen, target);
    expect(findFlatBackgroundNode(renderer)).toBeUndefined();
    const images = renderer.root.findAllByType(ImageBackground);
    expect(images.length).toBe(1);
    expect(images[0].props.source).toEqual(require('../../../assets/images/private-lock-background.png'));
  });

  it('the back/return control still renders regardless of background', async () => {
    const flatRenderer = await renderScreen(Screen, 'cycleNotes');
    const pngRenderer = await renderScreen(Screen, 'photos');
    const backButtons = (renderer: ReactTestRenderer.ReactTestRenderer) =>
      renderer.root.findAll(node => typeof node.props?.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Retour'));
    expect(backButtons(flatRenderer).length).toBeGreaterThan(0);
    expect(backButtons(pngRenderer).length).toBeGreaterThan(0);
  });
});
