import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal, Switch, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ProfileScreen from '../../ProfileScreen';
import AwaADeuxIntroScreen from '../AwaADeuxIntroScreen';
import AwaADeuxPartnerNameScreen from '../AwaADeuxPartnerNameScreen';
import AwaADeuxPartnerViewScreen from '../AwaADeuxPartnerViewScreen';
import AwaADeuxBenefitsScreen from '../AwaADeuxBenefitsScreen';
import AwaADeuxSharingScreen from '../AwaADeuxSharingScreen';
import AwaADeuxPairingScreen from '../AwaADeuxPairingScreen';
import AwaADeuxPartnerConnectedScreen from '../AwaADeuxPartnerConnectedScreen';
import {awaADeuxEntryRoute} from '../awaADeuxNavigation';
import {getDemoPartnerState, simulatePartnerConnected, stopDemoSharing} from '../../../state/awaADeuxDemoStore';
import {DEFAULT_SHARING_TOGGLES, SHARING_KEYS, setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {clearAwaADeuxPartnerName} from '../../../state/awaADeuxPartnerStore';
import {setSelectedObjective} from '../../../state/onboardingPreferences';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {updatePrivacySecuritySettings} from '../../../state/securityPreferences';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

// Reduced motion: sheets/modals close immediately (the animated close is covered by AwaADeuxInvitationSheet.test.tsx).
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => true)};
});

// The COMPLETE frontend flow, as the real app wires it (Profile + the six AWA à deux
// routes of the root stack): one linear onboarding path, association branches that are
// modals, the connected screen that replaces the onboarding history, the single
// permissions screen reused in "manage" mode, and Stop sharing that rebuilds the
// onboarding stack. The exact navigation stack is asserted, so a duplicated screen or
// a navigation loop shows up immediately.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).map(child => (typeof child === 'string' ? child : '')).join('');
const textsOf = (root: ReactTestRenderer.ReactTestRenderer | ReactTestRenderer.ReactTestInstance) => ('root' in root ? root.root : root).findAllByType(Text).map(textOf);
const stack = () => (navRef.getRootState() as {routes: {name: string; params?: {mode?: string}}[]}).routes.map(route => route.name);
const lastParams = () => (navRef.getRootState() as {routes: {params?: {mode?: string}}[]}).routes.slice(-1)[0].params;
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const INTRO = ['Profile', 'AwaADeuxIntro'];
const ONBOARDING = ['Profile', 'AwaADeuxIntro', 'AwaADeuxPartnerName', 'AwaADeuxPartnerView', 'AwaADeuxBenefits', 'AwaADeuxSharing', 'AwaADeuxPairing'];

async function renderApp() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName="Profile" screenOptions={{headerShown: false}}>
              <Stack.Screen component={ProfileScreen as never} name="Profile" />
              <Stack.Screen component={AwaADeuxIntroScreen as never} name="AwaADeuxIntro" />
              <Stack.Screen component={AwaADeuxPartnerNameScreen as never} name="AwaADeuxPartnerName" />
              <Stack.Screen component={AwaADeuxPartnerViewScreen as never} name="AwaADeuxPartnerView" />
              <Stack.Screen component={AwaADeuxBenefitsScreen as never} name="AwaADeuxBenefits" />
              <Stack.Screen component={AwaADeuxSharingScreen as never} name="AwaADeuxSharing" />
              <Stack.Screen component={AwaADeuxPairingScreen as never} name="AwaADeuxPairing" />
              <Stack.Screen component={AwaADeuxPartnerConnectedScreen as never} name="AwaADeuxPartnerConnected" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  for (let index = 0; index < 40 && !(navRef.isReady() && navRef.getRootState()); index += 1) {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
    });
  }
  await settle();
  return renderer;
}

// Earlier screens stay mounted under the current one: the LAST match belongs to the visible screen.
type Root = ReactTestRenderer.ReactTestRenderer | ReactTestRenderer.ReactTestInstance;
const rootOf = (root: Root) => ('root' in root ? root.root : root);
const buttons = (root: Root, label: string) =>
  rootOf(root).findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
const press = async (root: Root, label: string, times = 1) => {
  const matches = buttons(root, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    for (let index = 0; index < times; index += 1) {matches[matches.length - 1].props.onPress();}
  });
  await settle();
};
const openModal = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Modal).filter(modal => modal.props.visible === true).pop();
const androidBack = async () => {
  await act(async () => {
    navRef.goBack();
  });
  await settle();
};
const toggle = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(Switch).filter(node => node.props.accessibilityLabel === label).pop()!;

// The partner-name step (its own tests: AwaADeuxPartnerName.test.tsx): type a name, Continuer.
const enterName = async (renderer: ReactTestRenderer.ReactTestRenderer, times = 1) => {
  const input = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom du partenaire').pop()!;
  await act(async () => {
    input.props.onChangeText('Amine');
  });
  await press(renderer, 'Continuer', times);
};

const walkToAssociation = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  await press(renderer, 'AWA à deux');
  await press(renderer, 'Découvrir AWA à deux');
  await enterName(renderer);
  await press(renderer, 'Continuer');
  await press(renderer, 'Continuer');
  await press(renderer, 'Continuer');
};

beforeEach(async () => {
  await clearAwaADeuxPartnerName();
  jest.restoreAllMocks();
  stopDemoSharing();
  await AsyncStorage.clear();
  for (const key of SHARING_KEYS) {await setSharingToggle(key, DEFAULT_SHARING_TOGGLES[key]);}
  await setSelectedObjective('cycle');
  resetPremiumStateForTests();
  updatePrivacySecuritySettings({anonymousMode: false});
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Entry from Profile', () => {
  it('Profile → AWA à deux opens the introduction (not connected); a double tap does not stack a second copy', async () => {
    const renderer = await renderApp();
    expect(stack()).toEqual(['Profile']);
    await press(renderer, 'AWA à deux', 2);
    expect(stack()).toEqual(INTRO);
    expect(textsOf(renderer)).toContain('Avancez ensemble,\nà votre rythme.');
  });

  it('when a partner is (demo-)connected, Profile → AWA à deux opens "Partenaire associé" directly, never the introduction', async () => {
    simulatePartnerConnected();
    const renderer = await renderApp();
    await press(renderer, 'AWA à deux');
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
    expect(awaADeuxEntryRoute(true)).toBe('AwaADeuxPartnerConnected');
    expect(awaADeuxEntryRoute(false)).toBe('AwaADeuxIntro');
  });
});

describe('ONE linear onboarding path', () => {
  it('Intro → Prénom → 1 → 2 → 3 → 4 builds exactly one stack, with no duplicate screens (also on double taps)', async () => {
    const renderer = await renderApp();
    await press(renderer, 'AWA à deux');
    await press(renderer, 'Découvrir AWA à deux', 2);
    expect(stack()).toEqual([...INTRO, 'AwaADeuxPartnerName']);
    await enterName(renderer, 2);
    expect(stack()).toEqual([...INTRO, 'AwaADeuxPartnerName', 'AwaADeuxPartnerView']);
    await press(renderer, 'Continuer', 2);
    expect(stack()).toEqual([...INTRO, 'AwaADeuxPartnerName', 'AwaADeuxPartnerView', 'AwaADeuxBenefits']);
    await press(renderer, 'Continuer', 2);
    expect(stack()).toEqual([...INTRO, 'AwaADeuxPartnerName', 'AwaADeuxPartnerView', 'AwaADeuxBenefits', 'AwaADeuxSharing']);
    expect(lastParams()?.mode ?? 'onboarding').toBe('onboarding');
    expect(textsOf(renderer)).toContain('Continuer');
    await press(renderer, 'Continuer', 2);
    expect(stack()).toEqual(ONBOARDING);
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');
  });

  it('every step goes back to the previous one, with Retour and with the Android hardware Back', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    for (const expected of ['AwaADeuxSharing', 'AwaADeuxBenefits', 'AwaADeuxPartnerView', 'AwaADeuxPartnerName', 'AwaADeuxIntro', 'Profile']) {
      await press(renderer, 'Retour');
      expect(stack().slice(-1)[0]).toBe(expected);
    }
    await walkToAssociation(renderer);
    for (const expected of ['AwaADeuxSharing', 'AwaADeuxBenefits', 'AwaADeuxPartnerView', 'AwaADeuxPartnerName', 'AwaADeuxIntro', 'Profile']) {
      await androidBack();
      expect(stack().slice(-1)[0]).toBe(expected);
    }
  });

  it('the educational step 1 and the permissions step exist once each (no alternative version of a step)', () => {
    const dir = path.resolve(__dirname, '..');
    const sources = fs.readdirSync(dir).filter(name => /\.tsx?$/.test(name)).map(name => [name, fs.readFileSync(path.join(dir, name), 'utf8')] as const);
    const defining = (needle: string) => sources.filter(([name, source]) => !name.endsWith('.ts') && source.includes(needle)).map(([name]) => name);
    expect(defining("'Ce que votre\\npartenaire voit'")).toEqual(['AwaADeuxPartnerViewScreen.tsx']);
    expect(defining("title={'Choisissez ce que\\nvous souhaitez partager'}")).toEqual(['AwaADeuxSharingScreen.tsx']);
    expect(defining('<Switch')).toEqual(['AwaADeuxSharingScreen.tsx']); // the only place permissions are edited
    expect(defining('export function PartnerPreviewModal')).toEqual(['AwaADeuxDialogs.tsx']); // one partner preview
    const nav = fs.readFileSync(path.resolve(__dirname, '../../../navigation/AppNavigator.tsx'), 'utf8');
    expect((nav.match(/name="AwaADeux\w+"/g) ?? []).length).toBe(7);
  });
});

describe('Association subflows are branches, not steps', () => {
  it.each([
    ['Partager', 'Partager l’invitation'],
    ['Afficher le QR code', 'QR code d’association'],
    ['Envoyer par email', 'Envoyer par email'],
  ])('%s opens a modal; X, backdrop and Android Back close it and return to the association screen (stack unchanged)', async (label, modalTitle) => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);

    await press(renderer, label);
    expect(textsOf(openModal(renderer)!)).toContain(modalTitle);
    expect(stack()).toEqual(ONBOARDING); // nothing was pushed
    await press(openModal(renderer)!, 'Fermer');
    expect(openModal(renderer)).toBeUndefined();
    expect(stack()).toEqual(ONBOARDING);

    await press(renderer, label);
    await act(async () => {
      openModal(renderer)!.props.onRequestClose();
    });
    await settle();
    expect(openModal(renderer)).toBeUndefined();
    expect(stack()).toEqual(ONBOARDING);
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');
    expect(getDemoPartnerState().partnerConnected).toBe(false);
  });

  it('sharing an invitation (any app, copy, QR, e-mail, native share) never associates the partner or navigates', async () => {
    const {Linking, Share} = require('react-native');
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Copier ou partager le code');
    await press(renderer, 'Partager');
    for (const label of ['WhatsApp', 'Messages', 'Instagram', 'Gmail', 'Copier le texte', 'Plus d’options']) {
      await press(openModal(renderer)!, label);
    }
    await press(openModal(renderer)!, 'Fermer');
    await press(renderer, 'Afficher le QR code');
    await press(openModal(renderer)!, 'Partager le QR code');
    await press(openModal(renderer)!, 'Fermer');
    expect(getDemoPartnerState().partnerConnected).toBe(false);
    expect(stack()).toEqual(ONBOARDING);
  });
});

describe('Partenaire associé', () => {
  it('"Continuer" replaces the whole onboarding history: one connected screen, and Back leaves the feature (Profile)', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer', 3); // rapid taps
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
    expect(getDemoPartnerState()).toEqual({partnerConnected: true});
    expect(textsOf(renderer)).toContain('Partenaire associé 💜');

    await press(renderer, 'Retour');
    expect(stack()).toEqual(['Profile']);
  });

  it('the Android hardware Back from "Partenaire associé" behaves the same', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    await androidBack();
    expect(stack()).toEqual(['Profile']);
  });

  it('contains only the illustration, Amine, the status, the card and the three actions — no "Voir toutes les informations", no DEV', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    const texts = textsOf(renderer).filter(text => text.length > 2);
    expect(texts).not.toContain('Voir toutes les informations');
    expect(texts.join(' | ')).not.toMatch(/\bDEV\b|Simuler/);
    for (const text of ['Partenaire associé 💜', 'Amine', 'Connecté depuis aujourd’hui', 'Informations partagées', 'Gérer les informations partagées', 'Voir l’aperçu partenaire', 'Arrêter le partage']) {
      expect(texts).toContain(text);
    }
    const all = fs.readdirSync(path.resolve(__dirname, '..')).filter(name => /\.tsx?$/.test(name));
    all.forEach(name => expect(fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8')).not.toContain('Voir toutes les informations'));
  });
});

describe('Manage shared information (the SAME permissions screen, in "manage" mode)', () => {
  it('opens the permissions screen with its button "Terminé"; saving returns to "Partenaire associé" without re-entering the association screen', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');

    await press(renderer, 'Gérer les informations partagées', 2);
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected', 'AwaADeuxSharing']);
    expect(lastParams()?.mode).toBe('manage');
    expect(textsOf(renderer)).toContain('Choisissez ce que\nvous souhaitez partager');
    expect(buttons(renderer, 'Terminé').length).toBeGreaterThan(0);

    await act(async () => {
      toggle(renderer, 'Humeur').props.onValueChange(true);
    });
    await settle();
    await press(renderer, 'Terminé');
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']); // no Associer votre partenaire in between
    expect(textsOf(renderer)).toContain('Humeur'); // the list updated immediately
  });

  it('Retour and Android Back also return to "Partenaire associé"', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Gérer les informations partagées');
    await press(renderer, 'Retour');
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
    await press(renderer, 'Gérer les informations partagées');
    await androidBack();
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
  });

  it('the onboarding permissions step still says "Continuer" and leads to the association screen', async () => {
    const renderer = await renderApp();
    await press(renderer, 'AWA à deux');
    await press(renderer, 'Découvrir AWA à deux');
    await enterName(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Continuer');
    expect(buttons(renderer, 'Continuer').length).toBeGreaterThan(0);
    expect(buttons(renderer, 'Terminé')).toHaveLength(0);
  });
});

describe('Permission state: one source of truth', () => {
  it('choices made in the onboarding step show in "Informations partagées" and in the partner preview; later changes show at once', async () => {
    const renderer = await renderApp();
    await press(renderer, 'AWA à deux');
    await press(renderer, 'Découvrir AWA à deux');
    await enterName(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Continuer');
    await act(async () => {
      toggle(renderer, 'Fenêtre fertile').props.onValueChange(true);
      toggle(renderer, 'Conseil du jour').props.onValueChange(false);
    });
    await settle();
    await press(renderer, 'Continuer');
    await press(renderer, 'Continuer');
    const card = textsOf(renderer);
    expect(card).toContain('Fenêtre fertile');
    expect(card).not.toContain('Conseil du jour');

    await press(renderer, 'Voir l’aperçu partenaire');
    const preview = textsOf(openModal(renderer)!);
    expect(preview).toContain('Fenêtre fertile');
    expect(preview).not.toContain('Conseil du jour');
    await press(openModal(renderer)!, 'Fermer');

    await act(async () => {
      await setSharingToggle('fertileWindow', false);
    });
    await settle();
    expect(textsOf(renderer)).not.toContain('Fenêtre fertile');
  });
});

describe('Partner preview', () => {
  it('opens "Aperçu du côté partenaire", closes with X / Android Back back to "Partenaire associé", and is not the onboarding step 1', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    const before = stack();

    await press(renderer, 'Voir l’aperçu partenaire');
    const texts = textsOf(openModal(renderer)!);
    expect(texts).toContain('Aperçu du côté partenaire');
    expect(texts).not.toContain('Ce qu’Amine\nvoit');
    expect(texts).not.toContain('Ce que votre\npartenaire voit');
    expect(stack()).toEqual(before);
    await press(openModal(renderer)!, 'Fermer');
    expect(openModal(renderer)).toBeUndefined();

    await press(renderer, 'Voir l’aperçu partenaire');
    await act(async () => {
      openModal(renderer)!.props.onRequestClose();
    });
    expect(openModal(renderer)).toBeUndefined();
    expect(stack()).toEqual(before);
    expect(textsOf(renderer)).toContain('Partenaire associé 💜');
  });

  it('the permissions screen offers the SAME preview component', async () => {
    const renderer = await renderApp();
    await press(renderer, 'AWA à deux');
    await press(renderer, 'Découvrir AWA à deux');
    await enterName(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Continuer');
    await press(renderer, 'Voir un aperçu du côté partenaire');
    expect(textsOf(openModal(renderer)!)).toContain('Aperçu du côté partenaire');
    await press(openModal(renderer)!, 'Fermer');
    expect(stack()).toEqual([...INTRO, 'AwaADeuxPartnerName', 'AwaADeuxPartnerView', 'AwaADeuxBenefits', 'AwaADeuxSharing']);
  });
});

describe('Stop sharing', () => {
  it('Annuler (and Android Back) keep "Partenaire associé"', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Arrêter le partage');
    expect(getDemoPartnerState().partnerConnected).toBe(true);
    await press(openModal(renderer)!, 'Annuler');
    expect(openModal(renderer)).toBeUndefined();
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
    await press(renderer, 'Arrêter le partage');
    await act(async () => {
      openModal(renderer)!.props.onRequestClose();
    });
    expect(getDemoPartnerState().partnerConnected).toBe(true);
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
  });

  it('Confirmer disconnects (frontend only) and returns to "Associer votre partenaire" with the onboarding stack rebuilt (no repeat of the steps, no duplicate)', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Arrêter le partage');
    const confirm = openModal(renderer)!.findAll(node => node.props.accessibilityLabel === 'Arrêter le partage' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0];
    await act(async () => {
      confirm.props.onPress();
      confirm.props.onPress();
    });
    await settle();
    expect(getDemoPartnerState().partnerConnected).toBe(false);
    expect(stack()).toEqual(ONBOARDING);
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');

    // Back walks the steps in order again.
    await press(renderer, 'Retour');
    expect(stack().slice(-1)[0]).toBe('AwaADeuxSharing');
    expect(buttons(renderer, 'Continuer').length).toBeGreaterThan(0); // "onboarding" mode
  });

  it('after stopping, Profile → AWA à deux opens the introduction again (not connected)', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Arrêter le partage');
    await press(openModal(renderer)!.findAll(node => node.props.accessibilityLabel === 'Arrêter le partage' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0] as never, 'Arrêter le partage').catch(() => undefined);
    stopDemoSharing();
    for (let index = 0; index < 8; index += 1) {await androidBack();}
    expect(stack()).toEqual(['Profile']);
    await press(renderer, 'AWA à deux');
    expect(stack()).toEqual(INTRO);
  });

  it('a partner screen entered directly from Profile: stopping the sharing rebuilds the association stack there too (no stale "Partenaire associé" behind)', async () => {
    simulatePartnerConnected();
    const renderer = await renderApp();
    await press(renderer, 'AWA à deux');
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
    await press(renderer, 'Arrêter le partage');
    const confirm = openModal(renderer)!.findAll(node => node.props.accessibilityLabel === 'Arrêter le partage' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0];
    await act(async () => {
      confirm.props.onPress();
    });
    await settle();
    expect(stack()).toEqual(ONBOARDING);
    expect(stack()).not.toContain('AwaADeuxPartnerConnected');
  });
});

describe('Theme is unchanged by the navigation cleanup', () => {
  it('the association and partner screens still resolve Light and Dark', async () => {
    const {resolveAwaTheme} = require('../../../theme/awaThemeTokens');
    const LinearGradient = require('react-native-linear-gradient').default;
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    const gradients = () => renderer.root.findAllByType(LinearGradient).map(node => node.props.colors);
    [gradients().pop()].forEach(colors => expect(colors).toEqual([...resolveAwaTheme('awa-original', false, false).gradients.pageBackground]));
    await act(async () => {
      await setAppearanceMode('dark');
    });
    [gradients().pop()].forEach(colors => expect(colors).toEqual([...resolveAwaTheme('awa-original', true, false).gradients.pageBackground]));
    await press(renderer, 'Continuer');
    [gradients().pop()].forEach(colors => expect(colors).toEqual([...resolveAwaTheme('awa-original', true, false).gradients.pageBackground]));
  });
});
