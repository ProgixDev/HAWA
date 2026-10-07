import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import ProfileScreen from '../ProfileScreen';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {setSelectedObjective} from '../../state/onboardingPreferences';
import {setMenopauseStage} from '../../state/menopausePreferences';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {resetActiveProfileForTests} from '../../state/activeProfileStore';

// Phase 2 localization — a representative bilingual sample across Profile's
// distinct areas (not exhaustive, same scope as StatisticsScreenLocalization/
// JournalLocalization): header/menu chrome, an objective-preference display
// map (menopause stage — semantic enum persisted elsewhere, safe to
// translate, see ProfileScreen.tsx's own header comments), spiritual
// markers, the "Se déconnecter ?" confirmation dialog, and "Gérer les
// profils" for a managed (daughter) profile.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 900},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen() {
  const navigation = {navigate: jest.fn()} as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={navigation} route={{key: 'test', name: 'Profile'} as never} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

const pressButton = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function',
  );
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
};

beforeEach(async () => {
  resetPremiumStateForTests();
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  updatePrivacySecuritySettings({anonymousMode: false});
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('ProfileScreen — localization (chrome)', () => {
  // PHASE 7M: the app's default language is now English (not French) — this
  // test originally asserted French without ever selecting a language,
  // which was correct under the old French default. Flipped to assert the
  // now-correct English default; French-when-selected is covered by the
  // Phase7E*LanguageSwitch.test.tsx suite.
  it('renders header and menu chrome in English by default', async () => {
    const texts = textsOf(await renderScreen());
    expect(texts).toContain('Profile');
    expect(texts).toContain('Manage your information and preferences');
    expect(texts).toContain('My information');
    expect(texts).toContain('Sign out');
  });

  it('renders header and menu chrome in English when the app language is English', async () => {
    await setAppLanguage('en');
    const texts = textsOf(await renderScreen());
    expect(texts).toContain('Profile');
    expect(texts).toContain('Manage your information and preferences');
    expect(texts).toContain('My information');
    expect(texts).toContain('Sign out');
    expect(texts).not.toContain('Profil');
    expect(texts).not.toContain('Se déconnecter');
  });

  it('translates the objective label shown under "Mon objectif" / "My objective"', async () => {
    await setAppLanguage('en');
    const texts = textsOf(await renderScreen());
    expect(texts).toContain('My objective');
    expect(texts).toContain('Track my cycle');
    expect(texts).not.toContain('Mon objectif');
    expect(texts).not.toContain('Suivre mon cycle');
  });
});

describe('ProfileScreen — localization (menopause display map)', () => {
  it('translates the saved menopause stage (a persisted enum, safe to translate) in English', async () => {
    await setSelectedObjective('menopause');
    await setMenopauseStage('perimenopause');
    await setAppLanguage('en');
    const texts = textsOf(await renderScreen());
    expect(texts).toContain('Perimenopause');
    expect(texts).not.toContain('Périménopause');
  });
});

describe('ProfileScreen — localization (spiritual markers)', () => {
  it('translates the spiritual markers section in English', async () => {
    await setAppLanguage('en');
    const texts = textsOf(await renderScreen());
    expect(texts).toContain('Spiritual markers');
    expect(texts).toContain('Hijri calendar, prayers, purity, fasting and reminders.');
    expect(texts).not.toContain('Repères spirituels');
  });
});

describe('ProfileScreen — localization (sign-out confirmation)', () => {
  it('opens the "Sign out?" dialog in English with the translated body and reassurance', async () => {
    await setAppLanguage('en');
    const renderer = await renderScreen();
    expect(textsOf(renderer)).not.toContain('Sign out?');

    await pressButton(renderer, 'Sign out');

    const texts = textsOf(renderer);
    expect(texts).toContain('Sign out?');
    expect(texts).toContain('Are you sure you want to sign out of your AWA account?');
    expect(texts).toContain('You can sign back in anytime.');
    expect(texts).not.toContain('Se déconnecter ?');
  });
});

describe('ProfileScreen — localization (managed profiles)', () => {
  it('translates "Gérer les profils" / "Manage profiles" and a daughter row in English', async () => {
    await addManagedProfile({
      type: 'daughter',
      firstName: 'Lina',
      birthDate: '2015-06-01',
      hasHadFirstPeriod: false,
    });
    await setAppLanguage('en');
    const renderer = await renderScreen();

    await pressButton(renderer, 'Manage profiles');

    const texts = textsOf(renderer);
    expect(texts).toContain('Manage profiles');
    expect(texts).toContain('My daughter');
    expect(texts).not.toContain('Gérer les profils');
    expect(texts).not.toContain('Ma fille');
  });
});

// LOCALIZATION FIX — the avatar-edit button's accessibilityLabel was a
// hardcoded French ternary (never routed through t()), so a screen reader
// always announced French regardless of the app language. Now localized via
// profile.editAvatarAccessibility / profile.editAnonymousAvatarAccessibility.
describe('ProfileScreen — localization (avatar-edit accessibility)', () => {
  it('announces the French label in French, for both the normal and anonymous-mode avatar button', async () => {
    await setAppLanguage('fr');
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Changer la photo de profil').length).toBeGreaterThan(0);

    updatePrivacySecuritySettings({anonymousMode: true});
    const anonymousRenderer = await renderScreen();
    expect(anonymousRenderer.root.findAll(node => node.props.accessibilityLabel === 'Personnaliser mon avatar anonyme').length).toBeGreaterThan(0);
  });

  it('announces the English label in English, never the French one, for both avatar-button variants', async () => {
    await setAppLanguage('en');
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Change profile photo').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Changer la photo de profil').length).toBe(0);

    updatePrivacySecuritySettings({anonymousMode: true});
    const anonymousRenderer = await renderScreen();
    expect(anonymousRenderer.root.findAll(node => node.props.accessibilityLabel === 'Customize my anonymous avatar').length).toBeGreaterThan(0);
    expect(anonymousRenderer.root.findAll(node => node.props.accessibilityLabel === 'Personnaliser mon avatar anonyme').length).toBe(0);
  });

  it('announces the Spanish label in Spanish, never the French one, for both avatar-button variants', async () => {
    await setAppLanguage('es');
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Cambiar la foto de perfil').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Changer la photo de profil').length).toBe(0);

    updatePrivacySecuritySettings({anonymousMode: true});
    const anonymousRenderer = await renderScreen();
    expect(anonymousRenderer.root.findAll(node => node.props.accessibilityLabel === 'Personalizar mi avatar anónimo').length).toBeGreaterThan(0);
    expect(anonymousRenderer.root.findAll(node => node.props.accessibilityLabel === 'Personnaliser mon avatar anonyme').length).toBe(0);
  });
});
