import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import AwaADeuxIntroScreen from '../AwaADeuxIntroScreen';
import AwaADeuxPartnerNameScreen from '../AwaADeuxPartnerNameScreen';
import AwaADeuxPartnerViewScreen from '../AwaADeuxPartnerViewScreen';
import AwaADeuxBenefitsScreen from '../AwaADeuxBenefitsScreen';
import AwaADeuxSharingScreen from '../AwaADeuxSharingScreen';
import AwaADeuxPairingScreen from '../AwaADeuxPairingScreen';
import AwaADeuxPendingScreen from '../AwaADeuxPendingScreen';
import AwaADeuxPartnerConnectedScreen from '../AwaADeuxPartnerConnectedScreen';
import {partnerLabel, partnerSubject, queBeforePartner} from '../../../utils/awaADeuxPartnerWording';
import {stopDemoSharing} from '../../../state/awaADeuxDemoStore';
import {
  AWA_A_DEUX_PARTNER_STORAGE_KEY,
  clearAwaADeuxPartnerName,
  getAwaADeuxPartnerName,
  setAwaADeuxPartnerName,
} from '../../../state/awaADeuxPartnerStore';
import {DEFAULT_SHARING_TOGGLES, SHARING_KEYS, setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {setSelectedObjective} from '../../../state/onboardingPreferences';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled, setAppLanguage} from '../../../state/themePreferences';
import {fr} from '../../../i18n/locales/fr';
import {en} from '../../../i18n/locales/en';
import i18n from '../../../i18n';

// The partner name is the user's own input, saved once (awaADeuxPartnerStore) and read by
// every AWA à deux screen. Nothing is hardcoded, and with no name the wording is neutral.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

type Root = ReactTestRenderer.ReactTestRenderer | ReactTestRenderer.ReactTestInstance;
const rootOf = (root: Root) => ('root' in root ? root.root : root);
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (root: Root) => rootOf(root).findAllByType(Text).map(textOf);
const route = () => (navRef.getCurrentRoute() as unknown as {name: string}).name;
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderFlow(initial: string = 'AwaADeuxIntro') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName={initial} screenOptions={{headerShown: false}}>
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
  return renderer;
}

const buttons = (root: Root, label: string) =>
  rootOf(root).findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
const press = async (root: Root, label: string) => {
  const matches = buttons(root, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
  await settle();
};
const openModal = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Modal).filter(modal => modal.props.visible === true).pop()!;
const typeName = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
  const field = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom du partenaire').pop()!;
  await act(async () => {
    field.props.onChangeText(value);
  });
};
// Intro → Découvrir → type the name → Continuer  (lands on step 1)
const enterName = async (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
  await press(renderer, 'Découvrir AWA à deux');
  await typeName(renderer, value);
  await press(renderer, 'Continuer');
};
const visibleTexts = (renderer: ReactTestRenderer.ReactTestRenderer) => textsOf(renderer).join(' | ');
// The Pairing (invite) screen's own email field.
const enterPartnerEmail = async (renderer: ReactTestRenderer.ReactTestRenderer, email: string) => {
  const field = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Adresse e-mail de votre partenaire').pop()!;
  await act(async () => {
    field.props.onChangeText(email);
  });
};

beforeEach(async () => {
  jest.restoreAllMocks();
  stopDemoSharing();
  await AsyncStorage.clear();
  await clearAwaADeuxPartnerName();
  for (const key of SHARING_KEYS) {await setSharingToggle(key, DEFAULT_SHARING_TOGGLES[key]);}
  await setSelectedObjective('cycle');
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
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

describe('French wording helpers', () => {
  it('uses the name when there is one, neutral wording when there is not', () => {
    expect(partnerLabel('Amine')).toBe('Amine');
    expect(partnerLabel('')).toBe('votre partenaire');
    expect(partnerLabel('   ')).toBe('votre partenaire');
    expect(partnerLabel(undefined)).toBe('votre partenaire');
    expect(partnerSubject('Amine')).toBe('Amine');
    expect(partnerSubject('')).toBe('Votre partenaire');
  });

  it('elides "que" before a vowel only: qu’Amine, que Mohamed, que votre partenaire', () => {
    expect(queBeforePartner('Amine')).toBe('qu’Amine');
    expect(queBeforePartner('Élias')).toBe('qu’Élias');
    expect(queBeforePartner('Mohamed')).toBe('que Mohamed');
    expect(queBeforePartner('Hamza')).toBe('que Hamza');
    expect(queBeforePartner('')).toBe('que votre partenaire');
  });
});

describe('The name entered drives every following screen', () => {
  it('Amine: step 1 → 2 → 3 → 4 (email invite) → pending → partner screen → stop sharing, all say Amine', async () => {
    const renderer = await renderFlow();
    await enterName(renderer, 'Amine');
    expect(route()).toBe('AwaADeuxPartnerView');

    // 1 — "Ce qu’Amine voit"
    let texts = textsOf(renderer);
    expect(texts).toContain('Ce qu’Amine\nvoit');
    expect(texts).toContain('Amine aura accès uniquement aux informations que vous choisissez de partager.');
    expect(texts).toContain('Bonjour Amine 💜'); // the preview card greets the partner by name

    // 3 — sharing choices
    await press(renderer, 'Continuer');
    await press(renderer, 'Continuer');
    expect(route()).toBe('AwaADeuxSharing');
    expect(textsOf(renderer)).toContain('Amine verra uniquement les informations que vous activez.');
    // The sharing screen no longer offers its own preview entry point (removed by
    // design — see AwaADeuxSharingScreen.tsx); the SAME preview's name-interpolation is
    // still covered via AwaADeuxAssociation.test.tsx's AwaADeuxPartnerConnectedScreen tests.

    // 4 — invitation (email only)
    await press(renderer, 'Continuer');
    expect(route()).toBe('AwaADeuxPairing');
    texts = textsOf(renderer);
    expect(texts).toContain('Invitez Amine à vous rejoindre sur AWA à deux.');
    expect(texts).toContain('Nous enverrons à Amine un lien d’invitation sécurisé par email.');
    await enterPartnerEmail(renderer, 'amine@exemple.fr');
    await press(renderer, 'Envoyer l’invitation');

    // Pending — the last demo step actually reachable from the UI — also uses the dynamic name
    expect(route()).toBe('AwaADeuxPending');
    expect(textsOf(renderer)).toContain('Invitation envoyée\nà Amine');
    expect(textsOf(renderer)).toContain('Invitation envoyée à :\namine@exemple.fr');

    // The connected screen and its stop dialog (reached directly, like elsewhere in this file)
    await act(async () => {
      navRef.navigate('AwaADeuxPartnerConnected' as never);
    });
    await settle();
    expect(textsOf(renderer)).toContain('Amine');
    await press(renderer, 'Arrêter le partage');
    expect(textsOf(openModal(renderer))).toContain('Amine ne pourra plus accéder aux informations que vous avez choisi de partager.');
  });

  it('Mohamed: the very same screens now say Mohamed — never Amine, Sami or Yacine', async () => {
    const renderer = await renderFlow();
    await enterName(renderer, 'Mohamed');
    expect(textsOf(renderer)).toContain('Ce que Mohamed\nvoit');
    await press(renderer, 'Continuer');
    await press(renderer, 'Continuer');
    expect(textsOf(renderer)).toContain('Mohamed verra uniquement les informations que vous activez.');
    await press(renderer, 'Continuer');
    expect(textsOf(renderer)).toContain('Invitez Mohamed à vous rejoindre sur AWA à deux.');
    await enterPartnerEmail(renderer, 'mohamed@exemple.fr');
    await press(renderer, 'Envoyer l’invitation');
    expect(route()).toBe('AwaADeuxPending');
    expect(textsOf(renderer)).toContain('Invitation envoyée\nà Mohamed');
    for (const forbidden of ['Amine', 'Sami', 'Yacine']) {
      expect(visibleTexts(renderer)).not.toContain(forbidden);
    }
  });

  it('changing the name later changes every screen (the name stays editable)', async () => {
    const renderer = await renderFlow();
    await enterName(renderer, 'Amine');
    await act(async () => {
      setAwaADeuxPartnerName('Karim');
    });
    await settle();
    expect(textsOf(renderer)).toContain('Ce que Karim\nvoit');
    expect(textsOf(renderer)).toContain('Karim aura accès uniquement aux informations que vous choisissez de partager.');
    expect(visibleTexts(renderer)).not.toContain('Amine');
  });
});

describe('Saving the name', () => {
  it('"   Amine   " is stored and displayed as "Amine"', async () => {
    const renderer = await renderFlow();
    await enterName(renderer, '   Amine   ');
    expect(getAwaADeuxPartnerName()).toBe('Amine');
    expect(JSON.parse((await AsyncStorage.getItem(AWA_A_DEUX_PARTNER_STORAGE_KEY))!)).toEqual({version: 1, partnerName: 'Amine'});
    expect(textsOf(renderer)).toContain('Ce qu’Amine\nvoit');
  });

  it('an empty or whitespace-only name keeps Continuer disabled and saves nothing', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Découvrir AWA à deux');
    for (const value of ['', '     ', '\t \n']) {
      await typeName(renderer, value);
      const cta = buttons(renderer, 'Continuer').pop()!;
      expect(cta.props.disabled).toBe(true);
    }
    await press(renderer, 'Continuer');
    expect(route()).toBe('AwaADeuxPartnerName');
    expect(getAwaADeuxPartnerName()).toBe('');
    expect(await AsyncStorage.getItem(AWA_A_DEUX_PARTNER_STORAGE_KEY)).toBeNull();
  });

  it('the store itself refuses a blank name and keeps the previous one', () => {
    expect(setAwaADeuxPartnerName('Amine').accepted).toBe(true);
    expect(setAwaADeuxPartnerName('   ').accepted).toBe(false);
    expect(getAwaADeuxPartnerName()).toBe('Amine');
  });
});

describe('No configured partner: neutral wording, never a made-up name', () => {
  it('every screen says "votre partenaire" (or nothing) when no name is saved', async () => {
    const renderer = await renderFlow('AwaADeuxPartnerView');
    let texts = textsOf(renderer);
    expect(texts).toContain('Ce que votre\npartenaire voit');
    expect(texts).toContain('Votre partenaire aura accès uniquement aux informations que vous choisissez de partager.');
    expect(texts).toContain('Bonjour 💜');

    await act(async () => {
      navRef.navigate('AwaADeuxSharing' as never);
    });
    await settle();
    expect(textsOf(renderer)).toContain('Votre partenaire verra uniquement les informations que vous activez.');
    // The sharing screen no longer offers its own preview entry point (removed by
    // design — see AwaADeuxSharingScreen.tsx); the SAME preview's neutral wording is
    // still covered via AwaADeuxAssociation.test.tsx's AwaADeuxPartnerConnectedScreen tests.

    await act(async () => {
      navRef.navigate('AwaADeuxPairing' as never);
    });
    await settle();
    texts = textsOf(renderer);
    expect(texts).toContain('Invitez votre partenaire à vous rejoindre sur AWA à deux.');
    expect(texts).toContain('Nous enverrons à votre partenaire un lien d’invitation sécurisé par email.');

    await act(async () => {
      navRef.navigate('AwaADeuxPartnerConnected' as never);
    });
    await settle();
    expect(textsOf(renderer)).toContain('Votre partenaire');
    await press(renderer, 'Arrêter le partage');
    expect(textsOf(openModal(renderer))).toContain('Votre partenaire ne pourra plus accéder aux informations que vous avez choisi de partager.');
    for (const forbidden of ['Sami', 'Yacine', 'Amine']) {
      expect(visibleTexts(renderer)).not.toContain(forbidden);
    }
  });
});

describe('Persistence', () => {
  it('the saved name is restored after an app restart (fresh module, same AsyncStorage)', async () => {
    setAwaADeuxPartnerName('Amine').saved.catch(() => undefined);
    await settle();
    let restored: string | undefined;
    await new Promise<void>(resolve => {
      jest.isolateModules(() => {
        const fresh = require('../../../state/awaADeuxPartnerStore');
        expect(fresh.getAwaADeuxPartnerName()).toBe(''); // nothing in memory yet
        fresh.hydrateAwaADeuxPartnerName().then((value: string) => {
          restored = value;
          resolve();
        });
      });
    });
    expect(restored).toBe('Amine');
  });

  it('a corrupted or oversized saved value never breaks the screens', async () => {
    await AsyncStorage.setItem(AWA_A_DEUX_PARTNER_STORAGE_KEY, '{not json');
    let value: string | undefined;
    await new Promise<void>(resolve => {
      jest.isolateModules(() => {
        const fresh = require('../../../state/awaADeuxPartnerStore');
        fresh.hydrateAwaADeuxPartnerName().then((result: string) => {
          value = result;
          resolve();
        });
      });
    });
    expect(value).toBe('');
    await AsyncStorage.setItem(AWA_A_DEUX_PARTNER_STORAGE_KEY, JSON.stringify({version: 1, partnerName: `  ${'A'.repeat(80)} `}));
    await new Promise<void>(resolve => {
      jest.isolateModules(() => {
        const fresh = require('../../../state/awaADeuxPartnerStore');
        fresh.hydrateAwaADeuxPartnerName().then((result: string) => {
          value = result;
          resolve();
        });
      });
    });
    expect(value).toBe('A'.repeat(40));
  });

  it('coming back to the name screen (also after "Arrêter le partage") shows the saved name, not an empty field', async () => {
    const renderer = await renderFlow();
    await enterName(renderer, 'Amine');
    await press(renderer, 'Retour');
    expect(route()).toBe('AwaADeuxPartnerName');
    const field = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom du partenaire').pop()!;
    expect(field.props.value).toBe('Amine');
  });

  it('a name saved in an earlier session pre-fills the field when the flow is opened again', async () => {
    setAwaADeuxPartnerName('Amine');
    const renderer = await renderFlow();
    await press(renderer, 'Découvrir AWA à deux');
    const field = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom du partenaire').pop()!;
    expect(field.props.value).toBe('Amine');
    expect(buttons(renderer, 'Continuer').pop()!.props.disabled).toBe(false);
  });
});

describe('No hardcoded partner name left in the AWA à deux implementation', () => {
  const roots = [path.resolve(__dirname, '..'), path.resolve(__dirname, '../../../state'), path.resolve(__dirname, '../../../hooks'), path.resolve(__dirname, '../../../utils')];
  const files = roots.flatMap(dir =>
    fs
      .readdirSync(dir)
      .filter(name => /awaADeux|AwaADeux|PartnerPreviewCard|InvitationShareSheet|QrPlaceholder|useEntrance/.test(name) && /\.tsx?$/.test(name))
      .map(name => path.join(dir, name)),
  );

  it('finds the implementation files', () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it('has no "Sami", no demoPartnerName / DEMO_PARTNER_NAME, and "Yacine" only in the translated placeholder key', () => {
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      expect({file: path.basename(file), sami: /\bSami\b/.test(source)}).toEqual({file: path.basename(file), sami: false});
      expect({file: path.basename(file), legacy: /demoPartnerName|DEMO_PARTNER_NAME/.test(source)}).toEqual({file: path.basename(file), legacy: false});
      // "Yacine" (a static example name) now lives only in the translated placeholder key
      // (awaADeux.partnerName.placeholder, fr.ts/en.ts) — never as a literal in this source.
      const yacine = source.split('\n').filter(line => line.includes('Yacine'));
      expect({file: path.basename(file), yacine}).toEqual({file: path.basename(file), yacine: []});
    }
    expect(fr.awaADeux.partnerName.placeholder).toContain('Yacine');
    expect(en.awaADeux.partnerName.placeholder).toContain('Yacine');
  });

  it('never falls back to a person: no `partnerName || \'…\'` / `?? \'…\'` with a name', () => {
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source).not.toMatch(/partnerName\s*(\|\||\?\?)\s*['"`][A-ZÉ][a-zé]+['"`]/);
    }
  });

  it('screens read the name only through the hook (no second copy of the name)', () => {
    for (const name of ['AwaADeuxPartnerViewScreen', 'AwaADeuxSharingScreen', 'AwaADeuxPairingScreen', 'AwaADeuxPartnerConnectedScreen', 'AwaADeuxDialogs', 'PartnerPreviewCard', 'AwaADeuxPartnerNameScreen']) {
      const source = fs.readFileSync(path.resolve(__dirname, `../${name}.tsx`), 'utf8');
      expect(source).toContain('useAwaADeuxPartnerName');
      expect(source).not.toMatch(/route\.params\?*\.partnerName/);
    }
  });
});
