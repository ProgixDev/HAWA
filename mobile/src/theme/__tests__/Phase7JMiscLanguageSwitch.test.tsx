import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, Pressable} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../AwaThemeProvider';
import {PrivacyCover} from '../PrivacyCover';
import ManagedProfileDeleteConfirmModal from '../../components/profile/ManagedProfileDeleteConfirmModal';
import AboutScreen from '../../screens/AboutScreen';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import type {ManagedProfile} from '../../state/managedProfilesStore';

// PHASE 7J — TEST 18 (PrivacyCover), TEST 19 (ManagedProfileDeleteConfirmModal),
// TEST 20 (AboutScreen's 2 flagged accessibility labels). All three confirmed
// by Phase 7I as reachable hardcoded-French surfaces.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderTree(node: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{node}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

async function renderScreen(Component: React.ComponentType<any>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} name="Test" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const findByA11y = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.type === Pressable && node.props.accessibilityLabel === label)[0];

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 18 — PrivacyCover accessibility FR -> EN', () => {
  it('the accessibility label and visible subtitle both translate', async () => {
    const frRenderer = await renderTree(<PrivacyCover />);
    expect(frRenderer.root.findByProps({accessibilityLabel: 'AWA protégée'})).toBeTruthy();
    expect(textsOf(frRenderer)).toContain('Ton espace reste privé');

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderTree(<PrivacyCover />);
    expect(enRenderer.root.findByProps({accessibilityLabel: 'AWA protected'})).toBeTruthy();
    expect(textsOf(enRenderer)).toContain('Your space stays private');
  });
});

describe('TEST 19 — ManagedProfileDeleteConfirmModal FR -> EN', () => {
  const profile = {id: 'p1', firstName: 'Amina'} as ManagedProfile;

  it('title, body (with the profile name interpolated) and actions all translate', async () => {
    const frRenderer = await renderTree(
      <ManagedProfileDeleteConfirmModal onCancel={() => {}} onConfirm={async () => {}} profile={profile} />,
    );
    expect(textsOf(frRenderer)).toContain('Supprimer ce profil ?');
    expect(textsOf(frRenderer).some(text => text.includes('Amina'))).toBe(true);
    expect(findByA11y(frRenderer, 'Annuler')).toBeTruthy();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderTree(
      <ManagedProfileDeleteConfirmModal onCancel={() => {}} onConfirm={async () => {}} profile={profile} />,
    );
    const enTexts = textsOf(enRenderer);
    expect(enTexts).toContain('Delete this profile?');
    expect(enTexts.some(text => text.includes('Amina'))).toBe(true);
    expect(findByA11y(enRenderer, 'Cancel')).toBeTruthy();
    expect(enTexts).not.toContain('Supprimer ce profil ?');
  });
});

describe('TEST 20 — AboutScreen accessibility FR -> EN', () => {
  it('the back button and logo accessibility labels translate; About content stays intact either way', async () => {
    const frRenderer = await renderScreen(AboutScreen);
    expect(findByA11y(frRenderer, 'Retour')).toBeTruthy();
    expect(frRenderer.root.findByProps({accessibilityLabel: 'Logo AWA'})).toBeTruthy();

    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const enRenderer = await renderScreen(AboutScreen);
    expect(findByA11y(enRenderer, 'Back')).toBeTruthy();
    expect(enRenderer.root.findByProps({accessibilityLabel: 'AWA logo'})).toBeTruthy();
    expect(findByA11y(enRenderer, 'Retour')).toBeUndefined();
  });
});
