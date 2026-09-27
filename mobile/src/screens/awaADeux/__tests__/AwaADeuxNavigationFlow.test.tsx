import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal, Switch, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CommonActions, NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
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
import AwaADeuxPendingScreen from '../AwaADeuxPendingScreen';
import AwaADeuxPartnerConnectedScreen from '../AwaADeuxPartnerConnectedScreen';
import {PartnerPreviewModal} from '../AwaADeuxDialogs';
import {awaADeuxEntryRoute} from '../awaADeuxNavigation';
import {getDemoPartnerState, simulatePartnerConnected, stopDemoSharing} from '../../../state/awaADeuxDemoStore';
import {DEFAULT_SHARING_TOGGLES, SHARING_KEYS, setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {clearAwaADeuxPartnerName, setAwaADeuxPartnerName} from '../../../state/awaADeuxPartnerStore';
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
              <Stack.Screen component={AwaADeuxPendingScreen as never} name="AwaADeuxPending" />
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

// "Voir l’aperçu partenaire" was removed from AwaADeuxPartnerConnectedScreen.tsx by
// design — PartnerPreviewModal.tsx itself is untouched, so its reactivity to the SAME
// sharing choices is exercised here by rendering it directly, in a tiny stateful harness
// so "Fermer"/Android Back can still be verified to actually close it.
function PartnerPreviewHarness(): React.JSX.Element {
  const [visible, setVisible] = React.useState(true);
  return <PartnerPreviewModal onClose={() => setVisible(false)} visible={visible} />;
}
async function renderPreview() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <PartnerPreviewHarness />
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
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

// Jumps straight to "Partenaire associé" without going through the demo invitation /
// pending / partner-acceptance mechanics (which have their own dedicated tests) — used by
// tests whose actual focus is the CONNECTED screen's own behavior. Reproduces exactly the
// stack the real app builds when Profile's "AWA à deux" row opens it while connected
// (awaADeuxEntryRoute), so it stays a faithful shortcut, not a parallel mechanism.
const jumpToConnected = async () => {
  simulatePartnerConnected();
  await act(async () => {
    navRef.dispatch(CommonActions.reset({index: 1, routes: [{name: 'Profile'}, {name: 'AwaADeuxPartnerConnected'}]}));
  });
  await settle();
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
    expect((nav.match(/name="AwaADeux\w+"/g) ?? []).length).toBe(10);
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

describe('Reaching "Invitation envoyée" (Pending)', () => {
  it('"Continuer" on the association screen pushes Pending exactly once, even on rapid double taps, and uses the dynamic partner name', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer', 3); // rapid taps
    expect(stack()).toEqual([...ONBOARDING, 'AwaADeuxPending']);
    expect(getDemoPartnerState().connectionStatus).toBe('pending');
    expect(textsOf(renderer)).toContain('Invitation envoyée\nà Amine');
  });

  it('Retour and the Android hardware Back leave Pending the same way any other step is left (back to the association screen)', async () => {
    const renderer = await renderApp();
    await walkToAssociation(renderer);
    await press(renderer, 'Continuer');
    expect(stack().slice(-1)[0]).toBe('AwaADeuxPending');
    await press(renderer, 'Retour');
    expect(stack()).toEqual(ONBOARDING);

    await press(renderer, 'Continuer');
    await androidBack();
    expect(stack()).toEqual(ONBOARDING);
  });
});

describe('Partenaire associé', () => {
  it('is reached the same way every time AWA à deux opens while connected, and Back leaves the feature (Profile)', async () => {
    const renderer = await renderApp();
    await jumpToConnected();
    expect(stack()).toEqual(['Profile', 'AwaADeuxPartnerConnected']);
    expect(getDemoPartnerState().connectionStatus).toBe('connected');
    expect(textsOf(renderer)).toContain('Partenaire associé 💜');

    await press(renderer, 'Retour');
    expect(stack()).toEqual(['Profile']);
  });

  it('the Android hardware Back from "Partenaire associé" behaves the same', async () => {
    await renderApp();
    await jumpToConnected();
    await androidBack();
    expect(stack()).toEqual(['Profile']);
  });

  it('contains only the illustration, Amine, the status, the card and the two remaining actions — no "Voir toutes les informations", no preview button, no DEV', async () => {
    setAwaADeuxPartnerName('Amine');
    const renderer = await renderApp();
    await jumpToConnected();
    const texts = textsOf(renderer).filter(text => text.length > 2);
    expect(texts).not.toContain('Voir toutes les informations');
    expect(texts).not.toContain('Voir l’aperçu partenaire'); // removed by design from this screen
    expect(texts.join(' | ')).not.toMatch(/\bDEV\b|Simuler/);
    for (const text of ['Partenaire associé 💜', 'Amine', 'Connecté depuis aujourd’hui', 'Informations partagées', 'Gérer les informations partagées', 'Arrêter le partage']) {
      expect(texts).toContain(text);
    }
    const all = fs.readdirSync(path.resolve(__dirname, '..')).filter(name => /\.tsx?$/.test(name));
    all.forEach(name => expect(fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8')).not.toContain('Voir toutes les informations'));
  });
});

describe('Manage shared information (the SAME permissions screen, in "manage" mode)', () => {
  it('opens the permissions screen with its button "Terminé"; saving returns to "Partenaire associé" without re-entering the association screen', async () => {
    const renderer = await renderApp();
    await jumpToConnected();

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
    await jumpToConnected();
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
    await press(renderer, 'Continuer'); // Sharing → Pairing, with the new choices saved
    await jumpToConnected(); // reaches "Partenaire associé" directly (its own transition is tested above)
    const card = textsOf(renderer);
    expect(card).toContain('Fenêtre fertile');
    expect(card).not.toContain('Conseil du jour');

    // The preview is no longer opened FROM this screen (removed by design) — its own
    // reactivity to the SAME saved choices is verified by rendering it directly.
    const previewRenderer = await renderPreview();
    const preview = textsOf(previewRenderer);
    expect(preview).toContain('Fenêtre fertile');
    expect(preview).not.toContain('Conseil du jour');

    await act(async () => {
      await setSharingToggle('fertileWindow', false);
    });
    await settle();
    expect(textsOf(renderer)).not.toContain('Fenêtre fertile');
  });
});

describe('Partner preview (no button-based entry point anywhere anymore — removed by design from both AwaADeuxSharingScreen.tsx and AwaADeuxPartnerConnectedScreen.tsx; PartnerPreviewModal.tsx itself is untouched, rendered directly here)', () => {
  it('shows "Aperçu du côté partenaire" and is not the onboarding step 1; "Fermer" / Android Back both close it', async () => {
    const renderer = await renderPreview();
    const texts = textsOf(renderer);
    expect(texts).toContain('Aperçu du côté partenaire');
    expect(texts).not.toContain('Ce qu’Amine\nvoit');
    expect(texts).not.toContain('Ce que votre\npartenaire voit');
    await press(renderer, 'Fermer');
    expect(openModal(renderer)).toBeUndefined();

    const again = await renderPreview();
    await act(async () => {
      openModal(again)!.props.onRequestClose();
    });
    expect(openModal(again)).toBeUndefined();
  });

  it('neither the permissions screen ("Choisissez ce que vous souhaitez partager") nor "Partenaire associé" offer a preview button anymore', async () => {
    const renderer = await renderApp();
    await press(renderer, 'AWA à deux');
    await press(renderer, 'Découvrir AWA à deux');
    await enterName(renderer);
    await press(renderer, 'Continuer');
    await press(renderer, 'Continuer');
    expect(stack()).toEqual([...INTRO, 'AwaADeuxPartnerName', 'AwaADeuxPartnerView', 'AwaADeuxBenefits', 'AwaADeuxSharing']);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Voir un aperçu du côté partenaire')).toHaveLength(0);
    expect(openModal(renderer)).toBeUndefined();

    await jumpToConnected();
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Voir l’aperçu partenaire')).toHaveLength(0);
    expect(openModal(renderer)).toBeUndefined();
  });
});

describe('Stop sharing', () => {
  it('Annuler (and Android Back) keep "Partenaire associé"', async () => {
    const renderer = await renderApp();
    await jumpToConnected();
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
    await jumpToConnected();
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
    await jumpToConnected();
    await press(renderer, 'Arrêter le partage');
    const confirm = openModal(renderer)!.findAll(node => node.props.accessibilityLabel === 'Arrêter le partage' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0];
    await act(async () => {
      confirm.props.onPress();
    });
    await settle();
    for (let index = 0; index < 8 && stack().length > 1; index += 1) {await androidBack();}
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
