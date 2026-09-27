import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Linking, Modal, Share, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../../theme/awaThemeTokens';
import AwaADeuxIntroScreen from '../AwaADeuxIntroScreen';
import AwaADeuxPartnerNameScreen from '../AwaADeuxPartnerNameScreen';
import AwaADeuxPartnerViewScreen from '../AwaADeuxPartnerViewScreen';
import AwaADeuxBenefitsScreen from '../AwaADeuxBenefitsScreen';
import AwaADeuxPairingScreen from '../AwaADeuxPairingScreen';
import AwaADeuxPendingScreen from '../AwaADeuxPendingScreen';
import AwaADeuxPartnerConnectedScreen from '../AwaADeuxPartnerConnectedScreen';
import AwaADeuxSharingScreen from '../AwaADeuxSharingScreen';
import {PartnerPreviewModal} from '../AwaADeuxDialogs';
import {DEMO_PAIRING_CODE} from '../awaADeuxDemo';
import {EMAIL_BODY, buildEmailBody, EMAIL_SUBJECT, INVITATION_MESSAGE, buildMailtoUrl} from '../awaADeuxInvitation';
import {getDemoPartnerState, simulatePartnerConnected, stopDemoSharing} from '../../../state/awaADeuxDemoStore';
import {DEFAULT_SHARING_TOGGLES, SHARING_KEYS, setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {clearAwaADeuxPartnerName, setAwaADeuxPartnerName} from '../../../state/awaADeuxPartnerStore';
import {setSelectedObjective} from '../../../state/onboardingPreferences';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

// The frontend-only association flow: code card, copy, share, QR, e-mail, demo pairing,
// partner screen, shared-information list, partner preview, stop sharing.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flat = (style: unknown): Record<string, any> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (root: ReactTestRenderer.ReactTestRenderer | ReactTestRenderer.ReactTestInstance) =>
  ('root' in root ? root.root : root).findAllByType(Text).map(textOf);
const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderFlow(initial: 'AwaADeuxPairing' | 'AwaADeuxPending' | 'AwaADeuxPartnerConnected' = 'AwaADeuxPairing') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName="Profile" screenOptions={{headerShown: false}}>
              <Stack.Screen name="Profile">{() => <Text>profile</Text>}</Stack.Screen>
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
  await settle();
  await act(async () => {
    (navRef as unknown as {navigate: (name: string) => void}).navigate(initial);
  });
  await settle();
  return renderer;
}

// "Voir l’aperçu partenaire" was removed from AwaADeuxPartnerConnectedScreen.tsx by
// design (a separate task) — PartnerPreviewModal.tsx itself is untouched, so its own
// reactivity to the SAME sharing choices is exercised here by rendering it directly,
// wrapped in a tiny stateful harness so "Fermer" can still be verified to actually close it.
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
const buttons = (renderer: Root, label: string) =>
  rootOf(renderer).findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
const press = async (renderer: Root, label: string) => {
  const matches = buttons(renderer, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    await matches[matches.length - 1].props.onPress();
  });
  await settle();
};
const openModal = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Modal).filter(modal => modal.props.visible === true).pop();
const cardOf = (modal: ReactTestRenderer.ReactTestInstance) =>
  modal.findAll(node => typeof node.type === 'string' && flat(node.props?.style).borderRadius === 28 && flat(node.props?.style).maxHeight === '100%')[0];

beforeEach(async () => {
  await clearAwaADeuxPartnerName();
  setAwaADeuxPartnerName('Amine'); // the name entered on the first step
  jest.restoreAllMocks();
  stopDemoSharing();
  await AsyncStorage.clear();
  for (const key of SHARING_KEYS) {await setSharingToggle(key, DEFAULT_SHARING_TOGGLES[key]);}
  await setSelectedObjective('cycle');
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Association screen', () => {
  it('shows the code card, the sharing section and the account notice', async () => {
    const renderer = await renderFlow();
    const texts = textsOf(renderer);
    for (const text of ['Associer votre\npartenaire', 'Partagez ce code avec Amine pour l’inviter à se connecter.', 'Code d’association', DEMO_PAIRING_CODE, 'Valable pendant 24 heures', 'Partager le code', 'Partager', 'Afficher le QR code', 'ou', 'Envoyer par email', 'Invitez Amine par email directement depuis l’app', 'Amine devra créer un compte AWA et utiliser ce code pour se connecter.']) {
      expect(texts).toContain(text);
    }
  });

  it('there is no clipboard package: the copy icon opens the system share sheet with the invitation (which offers "Copier") and no "Code copié" is claimed', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const renderer = await renderFlow();
    await press(renderer, 'Copier ou partager le code');
    expect(share).toHaveBeenCalledTimes(1);
    expect((share.mock.calls[0][0] as {message: string}).message).toBe(INVITATION_MESSAGE);
    expect(textsOf(renderer)).not.toContain('Code copié');
    const pkg = fs.readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf8');
    expect(pkg).not.toMatch(/clipboard/i);
  });

  it('the share message is exactly the specified invitation with the demo code', () => {
    expect(INVITATION_MESSAGE).toBe('Rejoins-moi sur AWA à deux 💜\n\nUtilise ce code : AWA-7K4P9\npour te connecter et m’accompagner.\n\nTélécharge l’application AWA !');
  });
});

describe('QR code', () => {
  it('opens with the code, the validity and the scan text; the QR is an identified visual placeholder; X and Android Back close it', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Afficher le QR code');
    const modal = openModal(renderer)!;
    const texts = textsOf(modal);
    for (const text of ['QR code d’association', DEMO_PAIRING_CODE, 'Valable pendant 24 heures', 'Amine peut scanner ce QR code depuis son application AWA pour se connecter.', 'Partager le QR code', 'Aperçu de démonstration']) {
      expect(texts).toContain(text);
    }
    const qr = modal.findAll(node => node.props.accessibilityRole === 'image')[0];
    expect(qr.props.accessibilityLabel).toContain('non scannable');

    await press(renderer, 'Fermer');
    expect(openModal(renderer)).toBeUndefined();

    await press(renderer, 'Afficher le QR code');
    await act(async () => {
      openModal(renderer)!.props.onRequestClose();
    });
    expect(openModal(renderer)).toBeUndefined();
  });

  it('"Partager le QR code" opens the native share sheet with the invitation', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    const renderer = await renderFlow();
    await press(renderer, 'Afficher le QR code');
    await press(renderer, 'Partager le QR code');
    expect(share).toHaveBeenCalledWith({message: INVITATION_MESSAGE});
  });

  it('no QR library is available or added: the placeholder is drawn with the already installed react-native-svg', () => {
    const pkg = fs.readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf8');
    expect(pkg).not.toMatch(/qrcode|qr-code/i);
    const source = fs.readFileSync(path.resolve(__dirname, '../QrPlaceholder.tsx'), 'utf8');
    expect(source).toContain("from 'react-native-svg'");
    expect(source).toMatch(/NOT a real, scannable QR code/);
  });
});

describe('E-mail invitation', () => {
  const emailInput = (modal: ReactTestRenderer.ReactTestInstance) => modal.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Adresse email du destinataire')!;

  it('opens with the prefilled subject and message; the button is disabled until the address is valid', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Envoyer par email');
    const modal = openModal(renderer)!;
    expect(textsOf(modal)).toEqual(expect.arrayContaining(['Envoyer par email', 'À', 'Objet', 'Message', 'Ouvrir l’application email']));
    expect(emailInput(modal).props.placeholder).toBe('adresse@email.com');
    expect(modal.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Objet du message')!.props.value).toBe('Rejoins-moi sur AWA à deux 💜');
    expect(modal.findAllByType(TextInput).find(node => node.props.accessibilityLabel === 'Message')!.props.value).toBe(buildEmailBody('Amine'));
    expect(EMAIL_BODY).toBe('Bonjour !\n\nJe t’invite à me rejoindre sur AWA à deux.\nUtilise ce code : AWA-7K4P9\npour te connecter et m’accompagner.\n\nTélécharge l’application AWA ! 💜');

    const cta = () => buttons(renderer, 'Ouvrir l’application email').pop() ?? renderer.root.findAll(node => node.props.accessibilityLabel === 'Ouvrir l’application email' && node.props.accessibilityRole === 'button').pop()!;
    expect(cta().props.disabled).toBe(true);
    await act(async () => {
      emailInput(modal).props.onChangeText('pas une adresse');
    });
    expect(textsOf(openModal(renderer)!)).toContain('Entre une adresse email valide.');
    expect(cta().props.disabled).toBe(true);
    await act(async () => {
      emailInput(modal).props.onChangeText('sami@exemple.fr');
    });
    expect(cta().props.disabled).toBeFalsy();
    expect(textsOf(openModal(renderer)!)).not.toContain('Entre une adresse email valide.');
  });

  it('"Ouvrir l’application email" opens the phone mail app with recipient, subject and body (no AWA e-mail backend)', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const renderer = await renderFlow();
    await press(renderer, 'Envoyer par email');
    await act(async () => {
      emailInput(openModal(renderer)!).props.onChangeText('  sami@exemple.fr ');
    });
    await press(renderer, 'Ouvrir l’application email');
    expect(open).toHaveBeenCalledTimes(1);
    const url = open.mock.calls[0][0] as string;
    expect(url).toBe(buildMailtoUrl('sami@exemple.fr', EMAIL_SUBJECT, buildEmailBody('Amine')));
    expect(url.startsWith('mailto:sami%40exemple.fr?subject=')).toBe(true);
    expect(decodeURIComponent(url)).toContain(DEMO_PAIRING_CODE);
  });

  it('an unavailable mail app shows a message; X closes the form', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const renderer = await renderFlow();
    await press(renderer, 'Envoyer par email');
    await act(async () => {
      emailInput(openModal(renderer)!).props.onChangeText('sami@exemple.fr');
    });
    await press(renderer, 'Ouvrir l’application email');
    expect(textsOf(openModal(renderer)!)).toContain('Impossible d’ouvrir l’application e-mail.');
    await press(renderer, 'Fermer');
    expect(openModal(renderer)).toBeUndefined();
  });
});

describe('"Continuer" (frontend demo progression) — no DEV button', () => {
  it('no development / debug / simulation wording or icon anywhere on the screen', async () => {
    const renderer = await renderFlow();
    const everything = textsOf(renderer).join(' | ');
    expect(everything).not.toMatch(/\bDEV\b|Simuler|simulation|debug/i);
    const labels = renderer.root.findAll(node => typeof node.props.accessibilityLabel === 'string').map(node => node.props.accessibilityLabel as string).join(' | ');
    expect(labels).not.toMatch(/\bDEV\b|Simuler|simulation|développement|debug/i);
    const icons = renderer.root.findAll(node => typeof node.props.name === 'string').map(node => node.props.name as string);
    expect(icons).not.toContain('flask-outline');
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPairingScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/__DEV__|flask|Simuler|DEV ·/);
  });

  it('shows the normal AWA primary CTA "Continuer" (the same sticky button as the previous steps)', async () => {
    const renderer = await renderFlow();
    expect(textsOf(renderer)).toContain('Continuer');
    expect(buttons(renderer, 'Continuer').length).toBeGreaterThan(0);
  });

  it('"Continuer" opens "Invitation envoyée à Amine" (Pending): in-memory state, nothing is written', async () => {
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockClear();
    const renderer = await renderFlow();
    expect(getDemoPartnerState().connectionStatus).toBe('not_invited');
    await press(renderer, 'Continuer');
    expect(getDemoPartnerState().connectionStatus).toBe('pending');
    expect(currentRoute()).toBe('AwaADeuxPending');
    expect(textsOf(renderer)).toContain('Invitation envoyée\nà Amine');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('sharing is NOT pairing: no share / copy / QR / e-mail action connects the partner', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({action: 'sharedAction'} as never);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const renderer = await renderFlow();
    await press(renderer, 'Copier ou partager le code');
    await press(renderer, 'Partager');
    const sheet = openModal(renderer)!;
    for (const label of ['WhatsApp', 'Messages', 'Instagram', 'Gmail', 'Copier le texte', 'Plus d’options']) {
      await press(sheet, label);
    }
    await press(sheet, 'Fermer');
    await press(renderer, 'Afficher le QR code');
    await press(renderer, 'Partager le QR code');
    await press(renderer, 'Fermer');
    expect(getDemoPartnerState().partnerConnected).toBe(false);
    expect(currentRoute()).toBe('AwaADeuxPairing');
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');
  });

  it('the CTA follows the theme (primary background, readable text) in Light and Dark', async () => {
    const renderer = await renderFlow();
    const ctaStyle = () => {
      const cta = buttons(renderer, 'Continuer')[0];
      return flat(typeof cta.props.style === 'function' ? cta.props.style({pressed: false}) : cta.props.style);
    };
    expect(ctaStyle().backgroundColor).toBe(resolveAwaTheme('awa-original', false, false).colors.primary);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(ctaStyle().backgroundColor).toBe(resolveAwaTheme('awa-original', true, false).colors.primary);
  });

  it('the demo state module has no storage or backend (frontend only, in memory)', () => {
    const store = fs.readFileSync(path.resolve(__dirname, '../../../state/awaADeuxDemoStore.ts'), 'utf8');
    const imports = store.split('\n').filter(line => /^import |^} from /.test(line)).join('\n');
    expect(imports).not.toMatch(/async-storage|supabase/i);
    expect(store).not.toMatch(/AsyncStorage\.|fetch\(/);
  });
});

describe('Partner connected screen', () => {
  it('shows the success state, the partner name and the shared information (only what is ON)', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    const texts = textsOf(renderer);
    for (const text of ['Partenaire associé 💜', 'Amine', 'Connecté depuis aujourd’hui', 'Informations partagées', 'Jour du cycle et phase actuelle', 'Prochaines règles estimées', 'Conseil du jour', 'Gérer les informations partagées', 'Arrêter le partage']) {
      expect(texts).toContain(text);
    }
    expect(texts).not.toContain('Voir l’aperçu partenaire'); // removed by design
    for (const hidden of ['Fenêtre fertile', 'Ovulation estimée', 'Humeur']) {expect(texts).not.toContain(hidden);}
  });

  it('the list follows the sharing choices immediately', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    await act(async () => {
      await setSharingToggle('mood', true);
      await setSharingToggle('nextPeriod', false);
    });
    await settle();
    let texts = textsOf(renderer);
    expect(texts).toContain('Humeur');
    expect(texts).not.toContain('Prochaines règles estimées');
    await act(async () => {
      for (const key of SHARING_KEYS) {await setSharingToggle(key, false);}
    });
    await settle();
    texts = textsOf(renderer);
    expect(texts).toContain('Aucune information n’est partagée pour le moment.');
  });

  it('"Gérer les informations partagées" opens the permissions screen; changes show on return; Terminé goes back; Retour goes back', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    await press(renderer, 'Gérer les informations partagées');
    expect(currentRoute()).toBe('AwaADeuxSharing');
    expect(textsOf(renderer)).toContain('Choisissez ce que\nvous souhaitez partager');
    expect(textsOf(renderer)).toContain('Terminé'); // partner connected: the button saves and returns

    const mood = renderer.root.findAllByType(require('react-native').Switch).find(node => node.props.accessibilityLabel === 'Humeur')!;
    await act(async () => {
      mood.props.onValueChange(true);
    });
    await settle();
    await press(renderer, 'Terminé');
    expect(currentRoute()).toBe('AwaADeuxPartnerConnected');
    expect(textsOf(renderer)).toContain('Humeur');

    await press(renderer, 'Gérer les informations partagées');
    expect(currentRoute()).toBe('AwaADeuxSharing');
    await press(renderer, 'Retour');
    expect(currentRoute()).toBe('AwaADeuxPartnerConnected');
  });

  it('"Voir toutes les informations" is gone: only ONE action manages the shared information', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    expect(textsOf(renderer)).not.toContain('Voir toutes les informations');
    const labels = renderer.root.findAll(node => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityRole === 'button').map(node => node.props.accessibilityLabel as string);
    expect([...new Set(labels.filter(label => /informations/i.test(label)))]).toEqual(['Gérer les informations partagées']); // one button (a Set: composite and host nodes both carry the label)
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPartnerConnectedScreen.tsx'), 'utf8');
    expect(source).not.toContain('Voir toutes les informations');
  });

  it('final hierarchy: title, illustration + check, Amine, status, card, then Manage, Stop — in that order (no Preview action anymore)', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    const texts = textsOf(renderer).filter(text => text.length > 2);
    expect(texts).not.toContain('Voir l’aperçu partenaire');
    const order = ['Partenaire associé 💜', 'Amine', 'Connecté depuis aujourd’hui', 'Informations partagées', 'Gérer les informations partagées', 'Arrêter le partage'];
    const positions = order.map(text => texts.indexOf(text));
    positions.forEach(position => expect(position).toBeGreaterThan(-1));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Partenaire associé' && node.props.accessibilityRole === 'image').length).toBeGreaterThan(0); // the check badge
    const hero = renderer.root.findAll(node => node.props.source !== undefined && node.props.resizeMode === 'contain')[0];
    expect(hero.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('rows are exactly the enabled choices: Jour du cycle + Fenêtre fertile + Prochaines règles → three; Jour du cycle + Conseil du jour → two', async () => {
    simulatePartnerConnected();
    await act(async () => {
      for (const key of SHARING_KEYS) {await setSharingToggle(key, false);}
      await setSharingToggle('cycleDay', true);
      await setSharingToggle('nextPeriod', true);
      await setSharingToggle('fertileWindow', true);
    });
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    const rows = () => renderer.root.findAll(node => typeof node.type === 'string' && flat(node.props?.style).minHeight >= 40 && flat(node.props?.style).flexDirection === 'row' && flat(node.props?.style).gap === 12 && flat(node.props?.style).borderWidth === undefined);
    const shared = () => textsOf(renderer).filter(text => ['Jour du cycle et phase actuelle', 'Prochaines règles estimées', 'Fenêtre fertile', 'Conseil du jour'].includes(text));
    expect(shared()).toEqual(['Jour du cycle et phase actuelle', 'Prochaines règles estimées', 'Fenêtre fertile']);
    expect(rows().length).toBeGreaterThanOrEqual(3);
    await act(async () => {
      await setSharingToggle('nextPeriod', false);
      await setSharingToggle('fertileWindow', false);
      await setSharingToggle('dailyAdvice', true);
    });
    await settle();
    expect(shared()).toEqual(['Jour du cycle et phase actuelle', 'Conseil du jour']);
  });

  it('the two remaining actions share one structure; Stop uses the theme danger color; press feedback is a tiny scale', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    const styleOf = (label: string) => {
      const node = buttons(renderer, label)[0];
      return flat(typeof node.props.style === 'function' ? node.props.style({pressed: false}) : node.props.style);
    };
    const manage = styleOf('Gérer les informations partagées');
    const stop = styleOf('Arrêter le partage');
    for (const key of ['minHeight', 'borderRadius', 'paddingHorizontal', 'flexDirection', 'gap']) {
      expect(stop[key]).toBe(manage[key]);
    }
    const danger = resolveAwaTheme('awa-original', false, false).colors.danger;
    expect(stop.borderColor).not.toBe(manage.borderColor);
    const stopText = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Arrêter le partage')!;
    expect(flat(stopText.props.style).color).toBe(danger);
    const pressed = flat(buttons(renderer, 'Gérer les informations partagées')[0].props.style({pressed: true}));
    expect(pressed.transform[0].scale).toBeGreaterThan(0.95);
    expect(pressed.transform[0].scale).toBeLessThan(1);
  });

  it('is compact: the illustration is medium sized (about 17% of the height, 96–150 dp) and the title stays visible at 24', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    const {Dimensions} = require('react-native');
    const hero = renderer.root.findAll(node => typeof node.type === 'string' && flat(node.props?.style).alignSelf === 'center' && typeof flat(node.props?.style).height === 'number' && flat(node.props?.style).width !== undefined)[0];
    const heroHeight = flat(hero.props.style).height as number;
    expect(heroHeight).toBe(Math.round(Math.min(150, Math.max(96, Dimensions.get('window').height * 0.17))));
    const title = renderer.root.findAllByType(Text).find(node => textOf(node) === 'Partenaire associé 💜')!;
    expect(flat(title.props.style).fontSize).toBe(24);
    expect(title.props.accessibilityRole).toBe('header');
  });

  it('Retour from the partner screen goes back to where the feature was entered (Profile), not to the association screen', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    expect(currentRoute()).toBe('AwaADeuxPartnerConnected');
    await press(renderer, 'Retour');
    expect(currentRoute()).toBe('Profile');
  });
});

describe('Partner preview (rendered directly — see renderPreview()’s comment)', () => {
  it('opens with the demo content, the note and X; a block whose switch is OFF is not there', async () => {
    simulatePartnerConnected();
    const renderer = await renderPreview();
    const texts = textsOf(renderer);
    for (const text of ['Aperçu du côté partenaire', 'Bonjour Amine 💜', 'Voici quelques repères pour mieux t’accompagner aujourd’hui.', 'Jour du cycle', '16', 'Après une fausse couche', 'Prochaines règles', 'Pas encore', 'Phase actuelle', 'Récupération', 'Conseil du jour', 'Soutenez-la avec de petites attentions au quotidien.', 'Ceci est un aperçu. Amine verra uniquement les informations que vous avez activées.']) {
      expect(texts).toContain(text);
    }
    ['Fenêtre fertile', 'Ovulation estimée', 'Humeur'].forEach(label => expect(texts).not.toContain(label));
    await press(renderer, 'Fermer');
    expect(openModal(renderer)).toBeUndefined();
  });

  it('follows the choices: turning Jour du cycle off removes it, turning Fenêtre fertile on adds it', async () => {
    simulatePartnerConnected();
    await act(async () => {
      await setSharingToggle('cycleDay', false);
      await setSharingToggle('fertileWindow', true);
    });
    await settle();
    const renderer = await renderPreview();
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Jour du cycle');
    expect(texts).not.toContain('Phase actuelle');
    expect(texts).toContain('Fenêtre fertile');
    expect(texts).toContain('Prochaines règles');
  });
});

describe('Stop sharing', () => {
  it('asks first: the sheet says what happens, and Annuler keeps the association', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    await press(renderer, 'Arrêter le partage');
    expect(getDemoPartnerState().partnerConnected).toBe(true); // opening the sheet disconnects nothing
    const texts = textsOf(openModal(renderer)!);
    expect(texts).toContain('Arrêter le partage ?');
    expect(texts).toContain('Amine ne pourra plus accéder aux informations que vous avez choisi de partager.');
    await press(renderer, 'Annuler');
    expect(openModal(renderer)).toBeUndefined();
    expect(getDemoPartnerState().partnerConnected).toBe(true);
    expect(currentRoute()).toBe('AwaADeuxPartnerConnected');
  });

  it('Android Back closes the sheet without disconnecting', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    await press(renderer, 'Arrêter le partage');
    await act(async () => {
      openModal(renderer)!.props.onRequestClose();
    });
    expect(getDemoPartnerState().partnerConnected).toBe(true);
  });

  it('confirming disconnects (frontend only) and returns to "Associer votre partenaire"; a double tap confirms once', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    await press(renderer, 'Arrêter le partage');
    const sheet = openModal(renderer)!;
    const confirm = sheet.findAll(node => node.props.accessibilityLabel === 'Arrêter le partage' && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function')[0];
    await act(async () => {
      confirm.props.onPress();
      confirm.props.onPress();
      confirm.props.onPress();
    });
    await settle();
    expect(getDemoPartnerState()).toEqual({connectionStatus: 'not_invited', partnerConnected: false});
    expect(currentRoute()).toBe('AwaADeuxPairing');
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');
  });

  it('the destructive button uses the theme\'s danger color (Light and Dark)', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    await press(renderer, 'Arrêter le partage');
    const destructive = () =>
      openModal(renderer)!.findAll(node => typeof node.type === 'string' && flat(node.props?.style).minHeight === 52 && flat(node.props?.style).backgroundColor !== undefined)[0];
    expect(flat(destructive().props.style).backgroundColor).toBe(resolveAwaTheme('awa-original', false, false).colors.danger);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flat(destructive().props.style).backgroundColor).toBe(resolveAwaTheme('awa-original', true, false).colors.danger);
  });
});

describe('Theme', () => {
  it('no color literal in any new file of this phase', () => {
    const dir = path.resolve(__dirname, '..');
    for (const name of ['AwaADeuxPairingScreen.tsx', 'AwaADeuxPartnerConnectedScreen.tsx', 'AwaADeuxDialogs.tsx', 'AwaADeuxModalFrame.tsx', 'QrPlaceholder.tsx', 'awaADeuxInvitation.ts']) {
      const source = fs.readFileSync(path.join(dir, name), 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
      expect(source).not.toMatch(/rgba?\(/);
    }
  });

  it('the partner connected screen follows Light, Dark and another palette live', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    const light = resolveAwaTheme('awa-original', false, false);
    const dark = resolveAwaTheme('awa-original', true, false);
    renderer.root.findAllByType(LinearGradient).forEach(gradient => expect(gradient.props.colors).toEqual([...light.gradients.pageBackground]));

    await act(async () => {
      await setAppearanceMode('dark');
    });
    renderer.root.findAllByType(LinearGradient).forEach(gradient => expect(gradient.props.colors).toEqual([...dark.gradients.pageBackground]));
  });

  it('the partner preview dialog (rendered directly — no longer opened from this screen) follows Light, Dark and another palette live', async () => {
    simulatePartnerConnected();
    const light = resolveAwaTheme('awa-original', false, false);
    const dark = resolveAwaTheme('awa-original', true, false);
    const renderer = await renderPreview();
    expect(flat(cardOf(openModal(renderer)!).props.style).backgroundColor).toBe(light.colors.background);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(flat(cardOf(openModal(renderer)!).props.style).backgroundColor).toBe(dark.colors.background);
    expect(flat(cardOf(openModal(renderer)!).props.style).borderColor).toBe(dark.colors.border);

    await act(async () => {
      await setAppearanceMode('light');
      await setSelectedThemeId('ocean-calm');
    });
    expect(flat(cardOf(openModal(renderer)!).props.style).backgroundColor).toBe(resolveAwaTheme('ocean-calm', false, false).colors.background);
  });

  it('the association screen, the QR dialog and the e-mail dialog resolve the theme too', async () => {
    const renderer = await renderFlow();
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    await press(renderer, 'Afficher le QR code');
    expect(flat(cardOf(openModal(renderer)!).props.style).backgroundColor).toBe(dark.colors.background);
    await press(renderer, 'Fermer');
    await press(renderer, 'Envoyer par email');
    expect(flat(cardOf(openModal(renderer)!).props.style).backgroundColor).toBe(dark.colors.background);
    const code = renderer.root.findAllByType(Text).find(node => textOf(node) === DEMO_PAIRING_CODE)!;
    expect(flat(code.props.style).color).toBe(dark.colors.accent);
  });
});

describe('Frontend only', () => {
  it('the new files import no backend, storage or health-data module', () => {
    const dir = path.resolve(__dirname, '..');
    for (const name of ['AwaADeuxPairingScreen.tsx', 'AwaADeuxPartnerConnectedScreen.tsx', 'AwaADeuxDialogs.tsx', 'AwaADeuxModalFrame.tsx', 'QrPlaceholder.tsx', 'awaADeuxInvitation.ts', '../../state/awaADeuxDemoStore.ts']) {
      const source = fs.readFileSync(path.join(dir, name), 'utf8');
      const imports = source.split('\n').filter(line => /^import |^} from /.test(line)).join('\n');
      expect(imports).not.toMatch(/async-storage|supabase|\/services\/|keychain|notifee|dailyJournal|cyclePreferences|pregnancyJournal/i);
      expect(source).not.toMatch(/fetch\(|AsyncStorage\./);
    }
  });
});
