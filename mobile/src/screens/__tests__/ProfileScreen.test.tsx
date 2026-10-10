import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Image, StatusBar, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../theme/awaThemeTokens';
import ProfileScreen from '../ProfileScreen';
import {resetPremiumStateForTests, updatePremiumState} from '../../state/premiumStore';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage} from '../../state/themePreferences';
import {updatePrivacySecuritySettings} from '../../state/securityPreferences';
import {getCyclePreferences, hydrateCyclePreferences, setCyclePreferences, setSelectedObjective} from '../../state/onboardingPreferences';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import {updatePersonalInformation} from '../../state/personalInformationStore';
import {
  recordConfirmedPeriodEnd,
  removeConfirmedPeriodOccurrence,
} from '../../state/confirmedPeriodHistoryStore';
import {addManagedProfile, getManagedProfiles, requestReopenManageProfilesSheet, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, getActiveProfileId, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {getDemoPartnerState} from '../../state/awaADeuxDemoStore';
import {getSharingToggles} from '../../state/awaADeuxSharingStore';
import i18n from '../../i18n';

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
  const navigation = {navigate: jest.fn()} as never;
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={navigation} route={{key: 'test', name: 'Profile'}} />}
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
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  // Every test starts from the normal (non-anonymous) identity — the
  // anonymousMode flag lives in a module-level singleton
  // (state/securityPreferences.ts) that otherwise leaks between tests.
  updatePrivacySecuritySettings({anonymousMode: false});
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's text assertions were written against the French default. Pinning
  // French explicitly here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('ProfileScreen — static architecture guard', () => {
  it('never calls useColorScheme or resolves appearance mode locally', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, '../ProfileScreen.tsx'), 'utf8');
    expect(source).not.toMatch(new RegExp('=\\s*useColorScheme\\(\\)'));
    expect(source).not.toMatch(/LIGHT_CHROME|DARK_CHROME/);
    expect(source).not.toMatch(/getAwaTheme\(|resolveEffectiveThemeId\(/);
    expect(source).not.toMatch(/midnight/i);
  });
});

describe('ProfileScreen — resolved global theme', () => {
  it('consumes useAwaTheme() — background gradient matches AWA Original canonical values', async () => {
    const renderer = await renderScreen();
    const gradient = renderer.root.findAllByType(LinearGradient)[0];
    expect(gradient.props.colors).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);
  });

  it('page background changes when the palette changes, without remounting', async () => {
    const renderer = await renderScreen();
    const gradientColors = () => renderer.root.findAllByType(LinearGradient)[0].props.colors;
    expect(gradientColors()[0]).toBe('#FAF8FD');

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });

  it('changes Light -> Dark without remounting', async () => {
    const renderer = await renderScreen();
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('System mode follows the Provider-resolved device scheme', async () => {
    await setAppearanceMode('system');
    const renderer = await renderScreen();
    // Default mocked device scheme is 'light' in this test environment —
    // confirms the screen reads it via the Provider, not a local formula.
    expect(renderer.root.findByType(StatusBar).props.barStyle).toBe('dark-content');
  });
});

describe('ProfileScreen — True Black', () => {
  it('true-black affects chrome only once Dark is resolved', async () => {
    const renderer = await renderScreen();
    const gradient = () => renderer.root.findAllByType(LinearGradient)[0];
    const lightBg = flattenStyle(gradient().props.style).backgroundColor;

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(flattenStyle(gradient().props.style).backgroundColor).toBe(lightBg);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flattenStyle(gradient().props.style).backgroundColor).toBe('#030304');
  });
});

describe('ProfileScreen — Premium fallback', () => {
  it('reverts to AWA Original when Premium is lost, and restores automatically', async () => {
    updatePremiumState({isPremium: true, initialized: true});
    await act(async () => {
      await setSelectedThemeId('warm-sand');
    });
    const renderer = await renderScreen();
    const gradientColors = () => renderer.root.findAllByType(LinearGradient)[0].props.colors;
    expect(gradientColors()[0]).not.toBe('#FAF8FD');

    await act(async () => {
      updatePremiumState({isPremium: false});
    });
    expect(gradientColors()).toEqual(['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']);

    await act(async () => {
      updatePremiumState({isPremium: true});
    });
    expect(gradientColors()[0]).not.toBe('#FAF8FD');
  });
});

describe('ProfileScreen — content preserved', () => {
  it('renders the Profil header title and core menu rows unchanged', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Profil').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Apparence').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Confidentialité & Sécurité').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Se déconnecter').length).toBeGreaterThan(0);
  });
});

/* ============================================================
   "Gérer les profils" — first UI step of the future multi-profile feature:
   a header icon button + a bottom sheet showing only the REAL current
   user's own profile (no daughter creation/switching yet).
============================================================ */

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

describe('ProfileScreen — "Gérer les profils" (manage-profiles entry point)', () => {
  it('shows the manage-profiles icon button in the header, closed by default', async () => {
    const renderer = await renderScreen();
    const button = renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
    expect(button.length).toBeGreaterThan(0);
    expect(textsOf(renderer)).not.toContain('Gérer les profils');
    // The existing header title/subtitle are neither pushed off nor truncated.
    expect(textsOf(renderer)).toContain('Profil');
    expect(textsOf(renderer)).toContain('Gère tes informations et préférences');
  });

  it('opens a bottom sheet with the exact title/subtitle, showing the REAL current first name as selected (never a fake daughter)', async () => {
    await updatePersonalInformation({firstName: 'Nourhene'});
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const texts = textsOf(renderer);
    expect(texts).toContain('Gérer les profils');
    expect(texts).toContain('Suivez votre cycle ou celui d’un profil que vous gérez.');
    expect(texts).toContain('Nourhene');
    expect(texts).toContain('Mon profil');
    expect(texts).toContain('Ajouter le profil de ma fille');
    // No hardcoded/fake second profile.
    expect(texts).not.toContain('Ma fille');
    const radio = renderer.root.findAll(node => node.props.accessibilityRole === 'radio')[0];
    expect(radio.props.accessibilityState).toEqual({checked: true});
    await updatePersonalInformation({firstName: ''});
  });

  it('shows "Mode Anonyme" instead of the real name when anonymous mode is on (never leaks identity)', async () => {
    await updatePersonalInformation({firstName: 'Nourhene'});
    updatePrivacySecuritySettings({anonymousMode: true});
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const texts = textsOf(renderer);
    expect(texts).toContain('Mode Anonyme');
    expect(texts).not.toContain('Nourhene');
    updatePrivacySecuritySettings({anonymousMode: false});
    await updatePersonalInformation({firstName: ''});
  });

  it('"Ajouter un profil" closes the sheet and starts the daughter-profile creation flow (ManagedProfileType, on the root stack)', async () => {
    const navigateSpy = jest.fn();
    const navigation = {navigate: jest.fn(), getParent: () => ({navigate: navigateSpy})} as never;
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Profile">
                  {() => <ProfileScreen navigation={navigation} route={{key: 'test', name: 'Profile'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);

    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    expect(textsOf(renderer)).toContain('Gérer les profils');

    const addButton = renderer.root.findAll(node => node.props.accessibilityLabel === 'Ajouter un profil' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
    expect(addButton.length).toBeGreaterThan(0);
    await act(async () => {
      addButton[0].props.onPress();
    });

    expect(navigateSpy).toHaveBeenCalledWith('ManagedProfileType');
    expect(textsOf(renderer)).not.toContain('Gérer les profils'); // sheet closed first
  });

  it('lists a persisted daughter profile alongside the mother’s own row, both selectable for switching', async () => {
    await updatePersonalInformation({firstName: 'Nourhene'});
    await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const texts = textsOf(renderer);
    expect(texts).toContain('Nourhene');
    expect(texts).toContain('Lina');
    expect(texts).toContain('Ma fille');
    const linaRow = renderer.root.findAll(node => node.props.accessibilityLabel === 'Profil de Lina')[0];
    expect(linaRow.props.accessibilityRole).toBe('radio'); // selectable — see the switching tests below
    expect(linaRow.props.accessibilityState).toEqual({checked: false}); // the mother is active by default
    await updatePersonalInformation({firstName: ''});
  });

  it('tapping the daughter row makes her active immediately, moving the checkmark without a restart', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });

    const motherRow = () => renderer.root.findAll(node => node.props.accessibilityLabel === 'Mon profil' && node.props.accessibilityRole === 'radio')[0];
    const linaRow = () => renderer.root.findAll(node => node.props.accessibilityLabel === 'Profil de Lina' && node.props.accessibilityRole === 'radio')[0];
    expect(motherRow().props.accessibilityState).toEqual({checked: true});
    expect(linaRow().props.accessibilityState).toEqual({checked: false});

    await act(async () => {
      linaRow().props.onPress();
    });

    expect(getActiveProfileId()).toBe(lina.id);
    expect(linaRow().props.accessibilityState).toEqual({checked: true});
    expect(motherRow().props.accessibilityState).toEqual({checked: false});
  });

  it('tapping "Mon profil" switches back to the owner immediately', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });

    const motherRow = () => renderer.root.findAll(node => node.props.accessibilityLabel === 'Mon profil' && node.props.accessibilityRole === 'radio')[0];
    expect(motherRow().props.accessibilityState).toEqual({checked: false});

    await act(async () => {
      motherRow().props.onPress();
    });

    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    expect(motherRow().props.accessibilityState).toEqual({checked: true});
  });

  it('the active profile survives a fresh mount (persisted), and falls back to the owner if it no longer exists', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);

    // A fresh render (module state stays, but this proves the persisted value is
    // what a real cold start would read back — see activeProfileDataIsolation.test.ts
    // for the genuinely-fresh-module version of this same guarantee).
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const linaRow = renderer.root.findAll(node => node.props.accessibilityLabel === 'Profil de Lina' && node.props.accessibilityRole === 'radio')[0];
    expect(linaRow.props.accessibilityState).toEqual({checked: true});
  });

  it('falls back to fille.png for a daughter row with no chosen photo', async () => {
    await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const linaRow = renderer.root.findAll(node => node.props.accessibilityLabel === 'Profil de Lina')[0];
    const avatar = linaRow.findAllByType(Image)[0];
    // Under Jest, require('*.png') resolves to the literal 1 via __mocks__/fileMock.js.
    expect(avatar.props.source).toBe(1);
    expect(avatar.props.resizeMode).toBe('contain');
  });

  it('uses her custom photo in the "Gérer les profils" row when one was chosen', async () => {
    await addManagedProfile({
      type: 'daughter',
      firstName: 'Lina',
      birthDate: '2016-05-10',
      hasHadFirstPeriod: false,
      profileImageUri: 'file:///daughter-photo.jpg',
    });
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const linaRow = renderer.root.findAll(node => node.props.accessibilityLabel === 'Profil de Lina')[0];
    const avatar = linaRow.findAllByType(Image)[0];
    expect(avatar.props.source).toEqual({uri: 'file:///daughter-photo.jpg'});
    expect(avatar.props.resizeMode).toBe('cover');
  });

  it('reopens "Gérer les profils" automatically when ManagedProfileSuccessScreen leaves that request pending', async () => {
    requestReopenManageProfilesSheet();
    const renderer = await renderScreen();
    expect(textsOf(renderer)).toContain('Gérer les profils');
  });

  it('closing the sheet (X or backdrop) returns to ProfileScreen without changing any profile data', async () => {
    await updatePersonalInformation({firstName: 'Nourhene'});
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    expect(textsOf(renderer)).toContain('Gérer les profils');

    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Fermer')[0].props.onPress();
    });
    expect(textsOf(renderer)).not.toContain('Gérer les profils');
    expect(textsOf(renderer)).toContain('Nourhene'); // still the same real name on the identity card
    await updatePersonalInformation({firstName: ''});
  });

  it('works in both light and dark mode (theme-driven, nothing hardcoded)', async () => {
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const light = resolveAwaTheme('awa-original', false, false);
    const sheetOf = () => renderer.root.findAll(node => typeof node.type === 'string' && flattenStyle(node.props?.style).borderTopLeftRadius === 30 && flattenStyle(node.props?.style).maxHeight === '70%')[0];
    expect(flattenStyle(sheetOf().props.style).backgroundColor).toBe(light.colors.surface);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(flattenStyle(sheetOf().props.style).backgroundColor).toBe(dark.colors.surface);
    expect(flattenStyle(sheetOf().props.style).backgroundColor).not.toBe(light.colors.surface);
  });

  it('does not modify unrelated ProfileScreen sections/actions (still there after opening and closing the sheet)', async () => {
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Fermer')[0].props.onPress();
    });
    expect(textsOf(renderer)).toContain('Apparence');
    expect(textsOf(renderer)).toContain('Confidentialité & Sécurité');
    expect(textsOf(renderer)).toContain('Se déconnecter');
  });
});

/* ============================================================
   "Se déconnecter" confirmation — a premium AWA dialog replacing the
   previous Alert.alert(), the EXISTING logout behavior unchanged. A
   dedicated render helper is used here (never touching the shared
   renderScreen() other tests rely on) so the navigation mock can expose a
   getParent().reset() spy without changing renderScreen()'s return shape.
============================================================ */

async function renderScreenForLogout() {
  const resetSpy = jest.fn();
  const navigation = {
    navigate: jest.fn(),
    getParent: () => ({reset: resetSpy}),
  } as never;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">
                {() => <ProfileScreen navigation={navigation} route={{key: 'test', name: 'Profile'}} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return {renderer, resetSpy};
}

const pressButton = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
};

/* ============================================================
   "Gérer les profils" — swipe-to-delete for MANAGED (daughter) profiles only.
   The mother's own row is never wrapped in ManagedProfileSwipeRow, so it can
   never reveal a delete action — see ManagedProfileSwipeRow.test.tsx for the
   swipe gesture's own decision-logic tests (reveal threshold, fling velocity,
   horizontal-vs-vertical gating); these tests cover the integration: the
   confirmation dialog, deletion-by-id, persistence and untouched data.
============================================================ */

describe('ProfileScreen — managed-profile swipe-to-delete', () => {
  const openManageProfiles = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Gérer les profils' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
  };
  const pressTrash = async (renderer: ReactTestRenderer.ReactTestRenderer, firstName: string) => {
    await pressButton(renderer, `Supprimer le profil de ${firstName}`);
  };

  it('the main user profile never has a delete action (structurally not swipeable)', async () => {
    await updatePersonalInformation({firstName: 'Nourhene'});
    await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await openManageProfiles(renderer);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Supprimer le profil de Nourhene')).toHaveLength(0);
    await updatePersonalInformation({firstName: ''});
  });

  it('a managed daughter profile has a delete action reachable from its row', async () => {
    await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await openManageProfiles(renderer);
    const trash = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Supprimer le profil de Lina' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function',
    );
    expect(trash.length).toBeGreaterThan(0);
  });

  it('tapping trash never deletes immediately — it opens a confirmation dialog with the dynamic first name', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await openManageProfiles(renderer);
    await pressTrash(renderer, 'Lina');

    expect(getManagedProfiles().some(profile => profile.id === lina.id)).toBe(true); // still there
    const texts = textsOf(renderer);
    expect(texts).toContain('Supprimer ce profil ?');
    expect(texts).toContain('Voulez-vous vraiment supprimer le profil de Lina ?');
    expect(texts).toContain('Les informations enregistrées pour ce profil seront supprimées.');
    expect(texts).toContain('Annuler');
    expect(texts).toContain('Supprimer le profil');
  });

  it('"Annuler" preserves the profile unchanged', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await openManageProfiles(renderer);
    await pressTrash(renderer, 'Lina');
    await pressButton(renderer, 'Annuler');

    expect(textsOf(renderer)).not.toContain('Supprimer ce profil ?');
    expect(getManagedProfiles()).toEqual([lina]);
  });

  it('"Supprimer le profil" deletes the correct profile by id — other profiles and the main user are untouched, the sheet updates immediately', async () => {
    await updatePersonalInformation({firstName: 'Nourhene'});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const sarah = await addManagedProfile({type: 'daughter', firstName: 'Sarah', birthDate: '2014-02-20', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await openManageProfiles(renderer);
    await pressTrash(renderer, 'Lina');
    await pressButton(renderer, 'Confirmer la suppression du profil de Lina');

    // Deleted by id, not by index/name collision risk.
    const remaining = getManagedProfiles();
    expect(remaining.map(profile => profile.id)).toEqual([sarah.id]);
    expect(remaining.some(profile => profile.id === lina.id)).toBe(false);

    // The sheet reflects it immediately — no restart, no re-render trigger needed.
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Lina');
    expect(texts).toContain('Sarah');
    expect(texts).not.toContain('Supprimer ce profil ?'); // dialog closed itself

    // The main user's own row is untouched.
    expect(texts).toContain('Nourhene');
    const motherRow = renderer.root.findAll(node => node.props.accessibilityRole === 'radio' && node.props.accessibilityState?.checked === true)[0];
    expect(motherRow).toBeTruthy();
    await updatePersonalInformation({firstName: ''});
  });

  it('works in both Light and Dark — the confirmation dialog uses theme tokens, nothing hardcoded', async () => {
    await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderScreen();
    await openManageProfiles(renderer);
    await pressTrash(renderer, 'Lina');

    const light = resolveAwaTheme('awa-original', false, false);
    const title = () => renderer.root.findAllByType(Text).find(node => [node.props.children].flat(Infinity).join('') === 'Supprimer ce profil ?')!;
    expect(flattenStyle(title().props.style).color).toBe(light.colors.text);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(flattenStyle(title().props.style).color).toBe(dark.colors.text);
    expect(dark.colors.text).not.toBe(light.colors.text);

    await act(async () => {
      await setAppearanceMode('light');
    });
  });

  it('never calls AsyncStorage.clear() to delete a managed profile', () => {
    const fs = require('fs');
    const path = require('path');
    for (const relativePath of [
      '../../components/profile/ManagedProfileSwipeRow.tsx',
      '../../components/profile/ManagedProfileDeleteConfirmModal.tsx',
      '../../state/managedProfilesStore.ts',
    ]) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/AsyncStorage\.clear\(/);
    }
  });
});

describe('ProfileScreen — "Se déconnecter" confirmation dialog', () => {
  it('is closed by default; tapping "Se déconnecter" opens the AWA-styled dialog (never a system Alert) with the exact title/description/reassurance', async () => {
    const {Alert} = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert');
    const {renderer} = await renderScreenForLogout();
    expect(renderer.root.findAll(node => node.props.children === 'Se déconnecter ?')).toHaveLength(0);

    await pressButton(renderer, 'Se déconnecter');
    expect(alertSpy).not.toHaveBeenCalled();
    const texts = renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
    expect(texts).toContain('Se déconnecter ?');
    expect(texts).toContain('Voulez-vous vraiment vous déconnecter de votre compte AWA ?');
    expect(texts).toContain('Vous pourrez vous reconnecter à tout moment.');
  });

  it('"Annuler" closes the dialog without executing logout', async () => {
    const {renderer, resetSpy} = await renderScreenForLogout();
    await pressButton(renderer, 'Se déconnecter');
    expect(renderer.root.findAll(node => node.props.children === 'Se déconnecter ?').length).toBeGreaterThan(0);

    await pressButton(renderer, 'Annuler');
    expect(renderer.root.findAll(node => node.props.children === 'Se déconnecter ?')).toHaveLength(0);
    expect(resetSpy).not.toHaveBeenCalled();
  });

  it('"Confirmer la déconnexion" executes the existing logout behavior exactly once, even on rapid double taps', async () => {
    const {renderer, resetSpy} = await renderScreenForLogout();
    await pressButton(renderer, 'Se déconnecter');
    await act(async () => {
      const confirm = renderer.root.findAll(node => node.props.accessibilityLabel === 'Confirmer la déconnexion' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
      confirm[confirm.length - 1].props.onPress();
      confirm[confirm.length - 1].props.onPress();
    });
    expect(resetSpy).toHaveBeenCalledTimes(1);
    expect(resetSpy).toHaveBeenCalledWith({index: 0, routes: [{name: 'Auth'}]});
    expect(renderer.root.findAll(node => node.props.children === 'Se déconnecter ?')).toHaveLength(0);
  });

  it('can be opened again after being cancelled', async () => {
    const {renderer} = await renderScreenForLogout();
    await pressButton(renderer, 'Se déconnecter');
    await pressButton(renderer, 'Annuler');
    await pressButton(renderer, 'Se déconnecter');
    expect(renderer.root.findAll(node => node.props.children === 'Se déconnecter ?').length).toBeGreaterThan(0);
  });

  it('works in both light and dark mode (theme-driven colors, nothing hardcoded)', async () => {
    const {renderer} = await renderScreenForLogout();
    await pressButton(renderer, 'Se déconnecter');
    const light = resolveAwaTheme('awa-original', false, false);
    const iconCircle = () => renderer.root.findAll(node => typeof node.type === 'string' && flattenStyle(node.props?.style).borderRadius === 28 && flattenStyle(node.props?.style).width === 56)[0];
    expect(flattenStyle(iconCircle().props.style).backgroundColor).not.toBe(flattenStyle(iconCircle().props.style).borderColor);

    const cardOf = () => renderer.root.findAll(node => typeof node.type === 'string' && flattenStyle(node.props?.style).borderRadius === 26 && flattenStyle(node.props?.style).maxWidth === 400)[0];
    expect(flattenStyle(cardOf().props.style).backgroundColor).toBe(light.colors.surface);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(flattenStyle(cardOf().props.style).backgroundColor).toBe(dark.colors.surface);
    expect(flattenStyle(cardOf().props.style).backgroundColor).not.toBe(light.colors.surface);
  });

  it('does not modify any unrelated ProfileScreen section (Apparence / Confidentialité & Sécurité rows still render)', async () => {
    const {renderer} = await renderScreenForLogout();
    expect(renderer.root.findAll(node => node.props.children === 'Apparence').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Confidentialité & Sécurité').length).toBeGreaterThan(0);
  });
});

/* ============================================================
   IDENTITY MODE — normal vs anonymous. ProfileScreen already branches its
   entire identity presentation on securityPreferences.ts's single
   `anonymousMode` flag (the same one AnonymousModeScreen/
   AnonymousModeCreatingScreen/PrivacySecurityScreen already read/write) —
   these tests verify that existing branch, plus that AuthScreen/
   RegistrationScreen's normal-entry bypass now clears it so a previous
   Anonymous Mode session doesn't leak into a later normal profile.
============================================================ */

describe('ProfileScreen — identity mode reacts to securityPreferences.anonymousMode', () => {
  it('normal mode: does not show "Mode Anonyme" or the anonymous eyebrow/avatar', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'MODE PRIVÉ').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'MON PROFIL').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Informations personnelles').length).toBeGreaterThan(0);
  });

  it('anonymous mode: shows "Mode Anonyme" clearly and hides the normal personal-information entry point', async () => {
    updatePrivacySecuritySettings({anonymousMode: true});
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'MODE PRIVÉ').length).toBeGreaterThan(0);
    expect(renderer.root.findAll(node => node.props.children === 'Ton identité réelle reste masquée').length).toBeGreaterThan(0);
    // The normal "Informations personnelles" entry point (real name/email
    // editor) must not be reachable from the anonymous identity block —
    // only its anonymous counterpart, "Informations du compte".
    expect(renderer.root.findAll(node => node.props.children === 'Informations personnelles').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'Informations du compte').length).toBeGreaterThan(0);
  });

  it('switching anonymousMode while ProfileScreen is mounted flips the presentation live (no remount needed)', async () => {
    const renderer = await renderScreen();
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBe(0);

    await act(async () => {
      updatePrivacySecuritySettings({anonymousMode: true});
    });
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBeGreaterThan(0);

    await act(async () => {
      updatePrivacySecuritySettings({anonymousMode: false});
    });
    expect(renderer.root.findAll(node => node.props.children === 'Mode Anonyme').length).toBe(0);
    expect(renderer.root.findAll(node => node.props.children === 'MON PROFIL').length).toBeGreaterThan(0);
  });
});

/* ============================================================
   REGRESSION — "Invalid time value" crash on the SOPK ("Cycles
   irréguliers") objective's "Dernières règles" stat. Root cause:
   confirmedPeriodHistoryStore.ts persists periodStart as a FULL ISO
   datetime (periodStart.toISOString()), but ProfileScreen used to append
   another "T12:00:00" to it before parsing, building an unparsable
   double-suffix string -> Invalid Date -> Intl.DateTimeFormat().format()
   throwing RangeError: Invalid time value for every user with at least one
   confirmed period. This reproduces the exact real-world data shape (not
   the bare YYYY-MM-DD fixtures irregularDailyTrackingMath.test.ts uses) to
   prove the fix.
============================================================ */

describe('ProfileScreen — SOPK confirmed-period date rendering (regression)', () => {
  it('renders "Dernières règles" from a real confirmed period without throwing "Invalid time value"', async () => {
    const periodStart = new Date(2026, 7, 19); // 19 August 2026
    const periodEnd = new Date(2026, 7, 24);

    await act(async () => {
      await setSelectedObjective('irregular');
      await recordConfirmedPeriodEnd(periodStart, periodEnd);
    });

    // If formatShortDate/parsePeriodStart regressed, this throws
    // "RangeError: Invalid time value" instead of resolving.
    const renderer = await renderScreen();

    expect(
      renderer.root.findAll(node => node.props.children === 'Dernières règles').length,
    ).toBeGreaterThan(0);
    expect(
      renderer.root.findAll(
        node => typeof node.props.children === 'string' && node.props.children.includes('19 août'),
      ).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      await removeConfirmedPeriodOccurrence(periodStart);
      await setSelectedObjective('cycle');
    });
  });

  it('falls back to "Non renseignées" — never a crash — when the stored record is missing entirely', async () => {
    await act(async () => {
      await setSelectedObjective('irregular');
    });

    const renderer = await renderScreen();

    expect(
      renderer.root.findAll(node => node.props.children === 'Non renseignées').length,
    ).toBeGreaterThan(0);

    await act(async () => {
      await setSelectedObjective('cycle');
    });
  });
});

describe('ProfileScreen — "AWA à deux" entry (UI only)', () => {
  const navigate = jest.fn();

  async function renderWithNavigation() {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Profile">
                  {() => <ProfileScreen navigation={{navigate} as never} route={{key: 'test', name: 'Profile'}} />}
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

  const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
  const row = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.findAll(node => node.props.accessibilityLabel === 'AWA à deux' && node.props.accessibilityRole === 'button')[0];

  beforeEach(() => {
    navigate.mockClear();
  });

  it('shows the section title, the row, its subtitle and its status', async () => {
    const renderer = await renderWithNavigation();
    const texts = textsOf(renderer);
    expect(texts).toContain('AWA À DEUX');
    expect(texts).toContain('AWA à deux');
    expect(texts).toContain('Partagez certains repères avec votre partenaire');
    expect(texts).toContain('Non configuré');
  });

  it('sits directly below the backup row and before the Spiritual markers card', async () => {
    const renderer = await renderWithNavigation();
    const texts = textsOf(renderer);
    const backup = texts.indexOf('Sauvegarde');
    const section = texts.indexOf('AWA À DEUX');
    const spiritual = texts.findIndex(text => text.includes('Repères spirituels'));
    expect(backup).toBeGreaterThan(-1);
    expect(section).toBeGreaterThan(backup);
    expect(spiritual).toBeGreaterThan(section);
    // Nothing else sits between the backup row and the new section.
    // (icon glyphs are rendered as one-character texts: ignored)
    const between = texts.slice(backup + 1, section).filter(text => text.length > 2);
    expect(between).toEqual(['Sauvegarde cloud et restauration de tes données']);
  });

  it('uses the heart icon of the icon library AWA already uses, on a button row with the shared chevron', async () => {
    const renderer = await renderWithNavigation();
    const iconNames = renderer.root.findAll(node => typeof node.props.name === 'string').map(node => node.props.name);
    expect(iconNames.filter(name => name === 'heart-multiple-outline').length).toBeGreaterThanOrEqual(2); // header + row
    const rowNode = row(renderer);
    expect(rowNode.props.accessibilityRole).toBe('button');
    const chevrons = rowNode.findAll(node => node.props.name === 'chevron-right');
    expect(chevrons.length).toBeGreaterThan(0);
  });

  it('tapping it opens the AWA à deux introduction screen — and only that', async () => {
    const renderer = await renderWithNavigation();
    const rowNode = row(renderer);
    await act(async () => {
      rowNode.props.onPress?.();
    });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('AwaADeuxIntro');
  });

  it('the status uses the theme (Light and Dark) — no fixed colour', async () => {
    const renderer = await renderWithNavigation();
    const statusColor = () => {
      const node = renderer.root.findAllByType(Text).find(item => textOf(item) === 'Non configuré')!;
      return flattenStyle(node.props.style).color;
    };
    expect(statusColor()).toBe(resolveAwaTheme('awa-original', false, false).colors.primary);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(statusColor()).toBe(resolveAwaTheme('awa-original', true, false).colors.primary);
  });

  it('the existing Profile rows are still there', async () => {
    const renderer = await renderWithNavigation();
    const texts = textsOf(renderer);
    for (const label of ['Apparence', 'Confidentialité & Sécurité', 'Sauvegarde']) {
      expect(texts).toContain(label);
    }
  });

  it('is hidden while a managed (daughter) profile is active, and reappears once the mother switches back', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const renderer = await renderWithNavigation();
    expect(textsOf(renderer)).toContain('AWA à deux');

    await act(async () => {
      await setActiveProfileId(lina.id);
    });
    expect(textsOf(renderer)).not.toContain('AWA à deux');
    expect(textsOf(renderer)).not.toContain('AWA À DEUX');

    await act(async () => {
      await setActiveProfileId(OWNER_PROFILE_ID);
    });
    expect(textsOf(renderer)).toContain('AWA à deux');
  });
});

/* ============================================================
   AWA à deux PRIVACY — switching the active profile must never change what
   AWA à deux itself targets, and a managed profile's data must never reach
   PartnerHome. awaADeuxPartnerCycleInfo.ts computes from onboardingPreferences.ts's
   cycle data, which IS profile-scoped by this feature — the entry point above is
   hidden while a daughter is active specifically to prevent that combination from
   ever being reached through the UI.
============================================================ */

describe('ProfileScreen — AWA à deux privacy under multi-profile switching', () => {
  it('switching the active profile never touches AWA à deux sharing/partner/connection state', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    const beforeDemoState = getDemoPartnerState();
    const beforeSharing = {...getSharingToggles()};

    await setActiveProfileId(lina.id);
    expect(getDemoPartnerState()).toEqual(beforeDemoState);
    expect(getSharingToggles()).toEqual(beforeSharing);

    await setActiveProfileId(OWNER_PROFILE_ID);
    expect(getDemoPartnerState()).toEqual(beforeDemoState);
    expect(getSharingToggles()).toEqual(beforeSharing);
  });

  it('no AWA à deux store references the active-profile system (static source scan)', () => {
    const fs = require('fs');
    const path = require('path');
    const awaADeuxStoreFiles = [
      '../../state/awaADeuxDemoStore.ts',
      '../../state/awaADeuxSharingStore.ts',
      '../../state/awaADeuxPartnerStore.ts',
      '../../state/awaADeuxPartnerProfileStore.ts',
    ];
    for (const relativePath of awaADeuxStoreFiles) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/activeProfileStore|activeProfileId|OWNER_PROFILE_ID/);
    }
  });
});

describe('ProfileScreen — managed daughter profile: forced "Suivre mon cycle" objective (read-only)', () => {
  afterEach(async () => {
    await setSelectedObjective('cycle');
  });

  it('"Mon objectif" shows "Suivre mon cycle" and is READ-ONLY for a daughter, even when the mother\'s own real objective is something else', async () => {
    await setSelectedObjective('pregnancy');
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    expect(texts).toContain('Suivre mon cycle');
    expect(texts).not.toContain('Suivi de grossesse');
    const row = renderer.root.findAll(node => node.props.accessibilityLabel === 'Mon objectif' && node.props.accessibilityRole === 'button')[0];
    expect(row.props.onPress).toBeUndefined();
  });

  it('"Mes informations" shows Cycle-shaped rows (Durée du cycle/des règles/Régularité) for a daughter, never the mother\'s pregnancy rows', async () => {
    await setSelectedObjective('pregnancy');
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    expect(texts).toContain('Durée du cycle');
    expect(texts).toContain('Durée des règles');
    expect(texts).toContain('Régularité du cycle');
    expect(texts).not.toContain('Datation de ma grossesse');
    expect(texts).not.toContain('Préférences de suivi');
  });

  it('switching back to the mother restores her REAL objective everywhere, unaffected, and "Mon objectif" is interactive again', async () => {
    await setSelectedObjective('pregnancy');
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    await setActiveProfileId(OWNER_PROFILE_ID);
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    expect(texts).toContain('Suivi de grossesse');
    expect(texts).toContain('Datation de ma grossesse');
    const row = renderer.root.findAll(node => node.props.accessibilityLabel === 'Mon objectif' && node.props.accessibilityRole === 'button')[0];
    expect(typeof row.props.onPress).toBe('function');
  });
});

describe('ProfileScreen — managed daughter profile: read-only "Informations personnelles"', () => {
  it('shows HER OWN prénom/date de naissance/âge — never the mother\'s name/email/date de naissance', async () => {
    await updatePersonalInformation({firstName: 'Nourhene'});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Informations personnelles' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    const texts = textsOf(renderer);
    expect(texts).toContain('Prénom');
    expect(texts).toContain('Lina');
    expect(texts).not.toContain('Nourhene');
    expect(texts).toContain('Date de naissance');
    expect(texts).toContain('Âge');
    await updatePersonalInformation({firstName: ''});
  });

  it('the owner\'s own "Informations personnelles" still navigates to the real PersonalInformation screen, unaffected', async () => {
    const renderer = await renderScreen();
    await act(async () => {
      renderer.root.findAll(node => node.props.accessibilityLabel === 'Informations personnelles' && node.props.accessibilityRole === 'button')[0].props.onPress();
    });
    expect(textsOf(renderer)).not.toContain('Prénom'); // the managed-profile modal never opens for the owner
  });
});

describe('ProfileScreen — managed daughter profile: AWA Premium offer hidden', () => {
  it('the Premium promotional card is not rendered for a daughter, with no empty gap, but stays unchanged for the owner', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});

    await setActiveProfileId(lina.id);
    const daughterRenderer = await renderScreen();
    const daughterTexts = textsOf(daughterRenderer);
    expect(daughterTexts).not.toContain('AWA Premium');
    expect(daughterTexts).not.toContain('Découvrir Premium');
    // The rest of the screen is unaffected — "Mes informations" moved up cleanly.
    expect(daughterTexts).toContain('Mes informations');

    await setActiveProfileId(OWNER_PROFILE_ID);
    const ownerRenderer = await renderScreen();
    expect(textsOf(ownerRenderer)).toContain('AWA Premium');
  });
});

describe('ProfileScreen — managed daughter profile: "Repères spirituels" hidden', () => {
  it('the entire spiritual-landmarks card is not rendered for a daughter, with no empty gap, but stays unchanged for the owner', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});

    await setActiveProfileId(lina.id);
    const daughterRenderer = await renderScreen();
    const daughterTexts = textsOf(daughterRenderer);
    expect(daughterTexts).not.toContain('Repères spirituels');
    expect(daughterTexts).not.toContain('Gérer les repères');
    expect(daughterTexts).not.toContain('Calendrier hijri, prières, pureté, jeûne et rappels.');
    // The following "Plus" section still renders right after — no orphan card.
    expect(daughterTexts).toContain('Plus');

    await setActiveProfileId(OWNER_PROFILE_ID);
    const ownerRenderer = await renderScreen();
    const ownerTexts = textsOf(ownerRenderer);
    expect(ownerTexts).toContain('Repères spirituels');
    expect(ownerTexts).toContain('Gérer les repères');
  });
});

describe('ProfileScreen — managed daughter profile: "Durée du cycle" / "Durée des règles" / "Régularité du cycle" editors', () => {
  const pressByLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, role = 'button') => {
    await act(async () => {
      renderer.root
        .findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === role && typeof node.props.onPress === 'function')
        .slice(-1)[0]
        .props.onPress();
    });
  };

  it('a daughter created with real period info shows HER OWN cycle length/period length, and regularity stays "Non renseignée" (never fabricated)', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // the mother's own, real, confirmed cycle
    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-23', periodLength: 7, cycleLength: 28,
    });
    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    expect(texts).toContain('28 jours');
    expect(texts).toContain('7 jours');
    expect(texts).not.toContain('30 jours'); // the mother's cycle duration never leaks in
    expect(texts).not.toContain('5 jours'); // the mother's period duration never leaks in
    expect(texts).toContain('Non renseignée'); // regularity was never asked during creation
  });

  it('a daughter who has NOT had her first period shows "Non renseignée" for all three rows — never default 28/7 and never the mother\'s values', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'});
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(lina.id);
    await seedManagedProfileCycleIfNeeded(lina.id); // no-op — she has no declared period
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    // The three "Mes informations" rows (Durée du cycle / Durée des règles /
    // Régularité du cycle) all read "Non renseignée" — the top stats-grid tile
    // separately shows the raw unconfirmed default (pre-existing, unrelated
    // behavior), so this count is scoped to the "Non renseignée" occurrences,
    // never a fabricated 28/7 next to a "Durée du cycle"/"Durée des règles" title.
    expect(texts.filter(text => text === 'Non renseignée').length).toBeGreaterThanOrEqual(3);
    const cycleRowIndex = texts.indexOf('Durée du cycle');
    const periodRowIndex = texts.indexOf('Durée des règles');
    expect(texts[cycleRowIndex + 1]).toBe('Non renseignée');
    expect(texts[periodRowIndex + 1]).toBe('Non renseignée');
  });

  it('tapping "Durée du cycle" / "Durée des règles" / "Régularité du cycle" for a daughter opens the small AWA editor sheet — never the mother\'s CycleInformation onboarding screen', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-23', periodLength: 7, cycleLength: 28,
    });
    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);
    const renderer = await renderScreen();

    await pressByLabel(renderer, 'Durée du cycle');
    expect(textsOf(renderer)).toContain('Combien de jours dure généralement son cycle ?');
    await pressByLabel(renderer, 'Annuler');

    await pressByLabel(renderer, 'Durée des règles');
    expect(textsOf(renderer)).toContain('Combien de jours durent généralement ses règles ?');
    await pressByLabel(renderer, 'Annuler');

    await pressByLabel(renderer, 'Régularité du cycle');
    expect(textsOf(renderer)).toContain('Son cycle est-il généralement régulier ?');
    await pressByLabel(renderer, 'Annuler');
  });

  it('the OWNER\'s own three rows keep navigating exactly as before — no editor sheet opens for her', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'});
    const renderer = await renderScreen();
    await pressByLabel(renderer, 'Durée du cycle');
    expect(textsOf(renderer)).not.toContain('Combien de jours dure généralement son cycle ?');
  });

  it('saving a daughter\'s "Durée du cycle" and "Durée des règles" updates ONLY her own profile — the mother and another daughter are untouched, changes persist across profile switches, and the calculation store (read by fertile-window/ovulation elsewhere) reflects it', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 30, regularity: 'yes'}); // mother: 30/5
    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-23', periodLength: 7, cycleLength: 28,
    });
    const lina = await addManagedProfile({
      type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-10', periodLength: 6, cycleLength: 25,
    });

    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);
    const daughterRenderer = await renderScreen();

    await pressByLabel(daughterRenderer, 'Durée du cycle');
    await pressByLabel(daughterRenderer, 'Diminuer'); // 28 → 27
    await pressByLabel(daughterRenderer, 'Diminuer'); // 27 → 26
    await pressByLabel(daughterRenderer, 'Enregistrer');
    expect(textsOf(daughterRenderer)).toContain('26 jours');
    expect(getCyclePreferences().cycleDuration).toBe(26); // the underlying store — same one cycleMath.ts reads

    // The mother is untouched, immediately, without switching.
    await setActiveProfileId(OWNER_PROFILE_ID);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    expect(getCyclePreferences().cycleDuration).toBe(30);
    expect(getCyclePreferences().periodDuration).toBe(5);

    // Lina (another daughter) is untouched.
    await setActiveProfileId(lina.id);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    await seedManagedProfileCycleIfNeeded(lina.id);
    expect(getCyclePreferences().cycleDuration).toBe(25);
    expect(getCyclePreferences().periodDuration).toBe(6);

    // Switching back to Hanane shows her persisted, edited value (not the creation-time 28).
    await setActiveProfileId(hanane.id);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    const hananeAgain = await renderScreen();
    expect(textsOf(hananeAgain)).toContain('26 jours');
    expect(getCyclePreferences().cycleDuration).toBe(26);
  });

  it('saving a daughter\'s "Durée des règles" via the stepper updates only her own profile', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-23', periodLength: 7, cycleLength: 28,
    });
    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);
    const renderer = await renderScreen();

    await pressByLabel(renderer, 'Durée des règles');
    await pressByLabel(renderer, 'Diminuer'); // 7 → 6
    await pressByLabel(renderer, 'Diminuer'); // 6 → 5
    await pressByLabel(renderer, 'Enregistrer');
    expect(textsOf(renderer)).toContain('5 jours');
    expect(getCyclePreferences().periodDuration).toBe(5);
    expect(getCyclePreferences().cycleDuration).toBe(28); // untouched by the period-length edit
  });

  it('saving a daughter\'s "Régularité du cycle" updates only her own profile, using AWA\'s existing 3-value convention', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-23', periodLength: 7, cycleLength: 28,
    });
    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);
    const renderer = await renderScreen();

    await pressByLabel(renderer, 'Régularité du cycle');
    await pressByLabel(renderer, 'Non', 'radio');
    await pressByLabel(renderer, 'Enregistrer');
    expect(textsOf(renderer)).toContain('Irrégulier');
    expect(getCyclePreferences().regularity).toBe('no');
    expect(getCyclePreferences().cycleDuration).toBe(28); // untouched by the regularity edit
  });

  it('two daughters sharing the SAME first name still keep fully isolated cycle data — never keyed by name', async () => {
    const saraOne = await addManagedProfile({
      type: 'daughter', firstName: 'Sara', birthDate: '2012-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-01', periodLength: 4, cycleLength: 24,
    });
    const saraTwo = await addManagedProfile({
      type: 'daughter', firstName: 'Sara', birthDate: '2015-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-01', periodLength: 8, cycleLength: 34,
    });
    expect(saraOne.id).not.toBe(saraTwo.id);

    await setActiveProfileId(saraOne.id);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    await seedManagedProfileCycleIfNeeded(saraOne.id);
    expect(getCyclePreferences().cycleDuration).toBe(24);

    await setActiveProfileId(saraTwo.id);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    await seedManagedProfileCycleIfNeeded(saraTwo.id);
    expect(getCyclePreferences().cycleDuration).toBe(34); // resolved by profile ID, not by the shared first name
  });

  it('deleting one daughter never affects another daughter\'s cycle data (never keyed by array position)', async () => {
    const hanane = await addManagedProfile({
      type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-23', periodLength: 7, cycleLength: 28,
    });
    const lina = await addManagedProfile({
      type: 'daughter', firstName: 'Lina', birthDate: '2014-01-01',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-10', periodLength: 6, cycleLength: 25,
    });
    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);
    await setActiveProfileId(lina.id);
    await seedManagedProfileCycleIfNeeded(lina.id);

    const {deleteManagedProfile} = require('../../state/managedProfilesStore');
    await setActiveProfileId(OWNER_PROFILE_ID);
    await deleteManagedProfile(hanane.id);

    await setActiveProfileId(lina.id);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    expect(getCyclePreferences().cycleDuration).toBe(25);
    expect(getCyclePreferences().periodDuration).toBe(6);
  });

  it('no AsyncStorage.clear() was introduced by this feature (static source scan)', () => {
    const fs = require('fs');
    const path = require('path');
    for (const relativePath of ['../ProfileScreen.tsx', '../../state/managedProfileCycleSeed.ts']) {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/AsyncStorage\.clear\(\)/);
    }
  });
});

describe('ProfileScreen — managed daughter profile: Confidentialité & Sécurité / Sauvegarde / Notifications / Aide & support', () => {
  it('"Confidentialité & Sécurité" is hidden for a daughter, with no empty gap, but stays unchanged for the owner', async () => {
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10', hasHadFirstPeriod: false});

    await setActiveProfileId(lina.id);
    const daughterRenderer = await renderScreen();
    const daughterTexts = textsOf(daughterRenderer);
    expect(daughterTexts).not.toContain('Confidentialité & Sécurité');
    expect(daughterTexts).not.toContain('Supprimer mon compte');
    // The following "Sauvegarde" row still renders right after — no orphan gap.
    expect(daughterTexts).toContain('Sauvegarde');

    await setActiveProfileId(OWNER_PROFILE_ID);
    const ownerRenderer = await renderScreen();
    expect(textsOf(ownerRenderer)).toContain('Confidentialité & Sécurité');
  });

  it('"Sauvegarde" and "Notifications & rappels" both remain visible for a daughter', async () => {
    const lina = await addManagedProfile({
      type: 'daughter', firstName: 'Lina', birthDate: '2016-05-10',
      hasHadFirstPeriod: true, lastPeriodDate: '2026-09-23', periodLength: 5, cycleLength: 28,
    });
    await setActiveProfileId(lina.id);
    const renderer = await renderScreen();
    const texts = textsOf(renderer);
    expect(texts).toContain('Sauvegarde');
    expect(texts).toContain('Notifications & rappels');
  });

});
