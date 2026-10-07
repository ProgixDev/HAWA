import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AppLockScreen from '../AppLockScreen';
import PinSetupScreen from '../PinSetupScreen';
import PinConfirmScreen from '../PinConfirmScreen';
import PinManagementScreen from '../PinManagementScreen';
import FaceIdSetupScreen from '../FaceIdSetupScreen';
import SecuritySetupScreen from '../SecuritySetupScreen';
import PrivateAccessScreen from '../PrivateAccessScreen';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {setPinEnabled} from '../../state/securityPreferences';
import i18n from '../../i18n';

// Phase 7C — App Lock, PIN setup/confirm/management, biometrics/Face ID
// setup, SecuritySetup and PrivateAccess must follow the app language exactly
// like every other migrated screen, while PIN digits, Keychain service
// identifiers, and all security/auth behavior stay completely unaffected by
// a language switch (covered separately in appSecurityServiceBiometricPrompt
// .test.ts and the pre-existing, untouched privateSectionAuthStore.test.ts).

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

function renderDirect(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const Stack = createNativeStackNavigator();
async function renderWithNavigation(Screen: React.ComponentType<any>, name: string, params?: object) {
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), pop: jest.fn(), replace: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => <Screen navigation={navigation as never} route={{key: 'k', name, params} as never} />}
              </Stack.Screen>
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
  return {renderer, navigation};
}

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await setPinEnabled(false);
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — AppLockScreen follows the app language', () => {
  it('French: shows the App Lock title and PIN subtitle', async () => {
    await setPinEnabled(true);
    const renderer = renderDirect(<AppLockScreen />);
    expect(textsOf(renderer)).toContain('Ton espace est protégé');
    expect(textsOf(renderer)).toContain('Entre ton code PIN');
  });

  it('English: shows translated title/subtitle with no known French leaking', async () => {
    await setPinEnabled(true);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<AppLockScreen />);
    expect(textsOf(renderer)).toContain('Your space is protected');
    expect(textsOf(renderer)).toContain('Enter your PIN');
    expect(textsOf(renderer)).not.toContain('Ton espace est protégé');
  });
});

describe('TEST 3/4 — PinSetupScreen follows the app language', () => {
  it('French: create mode shows the French title/subtitle/footer', async () => {
    const renderer = renderDirect(
      <PinSetupScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{params: {mode: 'create'}} as never} />,
    );
    expect(textsOf(renderer)).toContain('Crée ton code PIN');
    expect(textsOf(renderer)).toContain('Ton code reste protégé dans le stockage sécurisé de cet appareil.');
  });

  it('English: disable mode shows the English confirm-identity copy', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(
      <PinSetupScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{params: {mode: 'disable'}} as never} />,
    );
    expect(textsOf(renderer)).toContain('Confirm your identity');
    expect(textsOf(renderer)).not.toContain('Confirme ton identité');
  });
});

describe('TEST 5/6 — PinConfirmScreen follows the app language', () => {
  it('French: shows the French confirm title/subtitle', async () => {
    const renderer = renderDirect(<PinConfirmScreen navigation={{pop: jest.fn(), goBack: jest.fn()} as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Confirme ton code PIN');
    expect(textsOf(renderer)).toContain('Saisis-le une seconde fois pour confirmer.');
  });

  it('English: shows the English confirm title/subtitle', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<PinConfirmScreen navigation={{pop: jest.fn(), goBack: jest.fn()} as never} route={{} as never} />);
    expect(textsOf(renderer)).toContain('Confirm your PIN');
    expect(textsOf(renderer)).not.toContain('Confirme ton code PIN');
  });
});

describe('TEST 7/8 — PinManagementScreen follows the app language', () => {
  it('French: PIN disabled shows "Activer le code PIN"', async () => {
    const {renderer} = await renderWithNavigation(PinManagementScreen, 'PinManagement');
    expect(textsOf(renderer)).toContain('Code PIN');
    expect(textsOf(renderer)).toContain('Activer le code PIN');
  });

  it('English: PIN enabled shows "Change my PIN" and "Turn off PIN"', async () => {
    await setPinEnabled(true);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const {renderer} = await renderWithNavigation(PinManagementScreen, 'PinManagement');
    expect(textsOf(renderer)).toContain('Change my PIN');
    expect(textsOf(renderer)).toContain('Turn off PIN');
    expect(textsOf(renderer)).not.toContain('Modifier mon code PIN');
  });
});

describe('TEST 9/10 — FaceIdSetupScreen follows the app language', () => {
  it('French: enable mode shows the French subtitle', async () => {
    const renderer = renderDirect(
      <FaceIdSetupScreen navigation={{goBack: jest.fn()} as never} route={{params: {action: 'enable'}} as never} />,
    );
    for (let index = 0; index < 5; index += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
    expect(
      textsOf(renderer).some(text => text.includes('biométrie sécurisée') || text.includes('n’a été détectée')),
    ).toBe(true);
  });

  it('English: enable mode shows English copy with no known French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(
      <FaceIdSetupScreen navigation={{goBack: jest.fn()} as never} route={{params: {action: 'enable'}} as never} />,
    );
    for (let index = 0; index < 5; index += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
    expect(
      textsOf(renderer).some(text => text.includes('secure biometrics') || text.includes('No usable biometric')),
    ).toBe(true);
    expect(textsOf(renderer)).not.toContain('Vérification sécurisée');
  });
});

describe('TEST 14/15 — PrivateAccessScreen (separate from App Lock) follows the app language', () => {
  it('French: shows the French title and purpose-specific line', async () => {
    const renderer = renderDirect(
      <PrivateAccessScreen
        navigation={{replace: jest.fn(), goBack: jest.fn()} as never}
        route={{params: {purpose: 'miscarriagePersonalNotes'}} as never}
      />,
    );
    expect(textsOf(renderer)).toContain('Espace privé');
    expect(textsOf(renderer)).toContain('Tes notes personnelles sont protégées.');
  });

  it('English: shows the English title and purpose-specific line', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(
      <PrivateAccessScreen
        navigation={{replace: jest.fn(), goBack: jest.fn()} as never}
        route={{params: {purpose: 'pregnancyMedicalInformation'}} as never}
      />,
    );
    expect(textsOf(renderer)).toContain('Private space');
    expect(textsOf(renderer)).toContain('Your personal medical information is protected.');
    expect(textsOf(renderer)).not.toContain('Espace privé');
  });
});

describe('TEST 16/17 — SecuritySetupScreen follows the app language', () => {
  it('French: shows the hero title and "Aucune protection optionnelle activée"', async () => {
    const {renderer} = await renderWithNavigation(SecuritySetupScreen, 'SecuritySetup', {mode: 'onboarding'});
    expect(textsOf(renderer)).toContain('Protège ton espace');
    expect(textsOf(renderer)).toContain('Aucune protection optionnelle activée');
  });

  it('English: with PIN enabled, shows the pluralized English count and the PIN option title', async () => {
    await setPinEnabled(true);
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const {renderer} = await renderWithNavigation(SecuritySetupScreen, 'SecuritySetup', {mode: 'onboarding'});
    expect(textsOf(renderer)).toContain('1 protection enabled');
    expect(textsOf(renderer)).toContain('PIN code');
    expect(textsOf(renderer)).not.toContain('Protège ton espace');
  });
});
