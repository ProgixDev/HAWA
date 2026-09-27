import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar, Switch, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {onPrimaryTextColor, resolveAwaTheme} from '../../../theme/awaThemeTokens';
import AwaADeuxIntroScreen from '../AwaADeuxIntroScreen';
import AwaADeuxPartnerNameScreen from '../AwaADeuxPartnerNameScreen';
import AwaADeuxPartnerViewScreen from '../AwaADeuxPartnerViewScreen';
import AwaADeuxBenefitsScreen from '../AwaADeuxBenefitsScreen';
import AwaADeuxSharingScreen from '../AwaADeuxSharingScreen';
import AwaADeuxPairingScreen from '../AwaADeuxPairingScreen';
import {DEFAULT_SHARING_TOGGLES, DEMO_PAIRING_CODE, SHARING_SECTIONS} from '../awaADeuxDemo';
import {SHARING_KEYS, setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {clearAwaADeuxPartnerName} from '../../../state/awaADeuxPartnerStore';
import {setSelectedObjective} from '../../../state/onboardingPreferences';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';

// AWA à deux: Intro → Découvrir → Prénom du partenaire → 1 Ce que votre partenaire voit → 2 Les avantages →
// 3 Choisissez ce que vous souhaitez partager → 4 Associer votre partenaire.
// UI / navigation only: demo content, nothing persisted, nothing shared.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flat = (style: unknown): Record<string, any> =>
  Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
// The sharing choices are saved (AsyncStorage): every test starts from the defaults, in non-pregnancy mode.
const resetSharing = async () => {
  await AsyncStorage.clear();
  for (const key of SHARING_KEYS) {await setSharingToggle(key, DEFAULT_SHARING_TOGGLES[key]);}
  await setSelectedObjective('cycle');
};
const currentRoute = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;

async function settle() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function renderFlow() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName="AwaADeuxIntro" screenOptions={{headerShown: false}}>
              <Stack.Screen component={AwaADeuxIntroScreen as never} name="AwaADeuxIntro" />
              <Stack.Screen component={AwaADeuxPartnerNameScreen as never} name="AwaADeuxPartnerName" />
              <Stack.Screen component={AwaADeuxPartnerViewScreen as never} name="AwaADeuxPartnerView" />
              <Stack.Screen component={AwaADeuxBenefitsScreen as never} name="AwaADeuxBenefits" />
              <Stack.Screen component={AwaADeuxSharingScreen as never} name="AwaADeuxSharing" />
              <Stack.Screen component={AwaADeuxPairingScreen as never} name="AwaADeuxPairing" />
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

// Earlier screens stay mounted under the current one: the LAST match is the visible screen's.
const buttons = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = buttons(renderer, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    await matches[matches.length - 1].props.onPress?.();
  });
  await settle();
};
const switches = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Switch);
const toggle = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = switches(renderer).filter(node => node.props.accessibilityLabel === label);
  return matches[matches.length - 1];
};

// The partner-name step (its own tests: AwaADeuxPartnerName.test.tsx): type a name, Continuer.
const enterName = async (renderer: ReactTestRenderer.ReactTestRenderer, name = 'Amine') => {
  const input = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom du partenaire').pop()!;
  await act(async () => {
    input.props.onChangeText(name);
  });
  await press(renderer, 'Continuer');
};

const goTo = async (renderer: ReactTestRenderer.ReactTestRenderer, step: 1 | 2 | 3 | 4) => {
  await press(renderer, 'Découvrir AWA à deux');
  await enterName(renderer);
  if (step >= 2) {await press(renderer, 'Continuer');}
  if (step >= 3) {await press(renderer, 'Continuer');}
  if (step >= 4) {await press(renderer, 'Continuer');}
};

beforeEach(async () => {
  await clearAwaADeuxPartnerName();
  jest.restoreAllMocks();
  await resetSharing();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Navigation: the four steps in order, with Back', () => {
  it('Intro → Découvrir → 1 → Continuer → 2 → Continuer → 3 → Continuer → 4, and back through every screen', async () => {
    const renderer = await renderFlow();
    expect(currentRoute()).toBe('AwaADeuxIntro');

    await press(renderer, 'Découvrir AWA à deux');
    expect(currentRoute()).toBe('AwaADeuxPartnerName');
    await enterName(renderer);
    expect(currentRoute()).toBe('AwaADeuxPartnerView');
    expect(textsOf(renderer)).toContain('Ce qu’Amine\nvoit');

    await press(renderer, 'Continuer');
    expect(currentRoute()).toBe('AwaADeuxBenefits');
    expect(textsOf(renderer)).toContain('Les avantages\npour vous deux');

    await press(renderer, 'Continuer');
    expect(currentRoute()).toBe('AwaADeuxSharing');
    expect(textsOf(renderer)).toContain('Choisissez ce que\nvous souhaitez partager');

    await press(renderer, 'Continuer');
    expect(currentRoute()).toBe('AwaADeuxPairing');
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');

    for (const expected of ['AwaADeuxSharing', 'AwaADeuxBenefits', 'AwaADeuxPartnerView', 'AwaADeuxPartnerName', 'AwaADeuxIntro']) {
      await press(renderer, 'Retour');
      expect(currentRoute()).toBe(expected);
    }
  });

  it('the Android hardware Back (goBack) walks back through every screen the same way', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 4);
    expect(currentRoute()).toBe('AwaADeuxPairing');
    for (const expected of ['AwaADeuxSharing', 'AwaADeuxBenefits', 'AwaADeuxPartnerView', 'AwaADeuxPartnerName', 'AwaADeuxIntro']) {
      await act(async () => {
        navRef.goBack();
      });
      await settle();
      expect(currentRoute()).toBe(expected);
    }
  });

  it('step 4 ends the onboarding: its "Continuer" is only the demo progression to the pending/waiting screen', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 4);
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPairingScreen.tsx'), 'utf8');
    expect(source).toContain('ctaLabel="Continuer"');
    // No direct `navigate` (it would push a duplicate): the helper guards against a double push.
    expect(source).not.toMatch(/navigation\.navigate\(/);
    expect(source).toContain('advanceToPending(navigation)');
  });

  it('routes are registered and typed in the root stack', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../navigation/AppNavigator.tsx'), 'utf8');
    for (const name of ['AwaADeuxIntro', 'AwaADeuxPartnerName', 'AwaADeuxPartnerView', 'AwaADeuxBenefits', 'AwaADeuxSharing', 'AwaADeuxPairing', 'AwaADeuxPartnerConnected']) {
      expect(source).toContain(`${name}: `);
      expect(source).toContain(`<Stack.Screen name="${name}"`);
    }
  });
});

describe('Step 1 — Ce que votre partenaire voit', () => {
  it('shows the description and the demo preview (Bonjour Amine, Jour du cycle 16, Prochaines règles, Phase actuelle, Conseil du jour)', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 1);
    const texts = textsOf(renderer);
    expect(texts).toContain('Amine aura accès uniquement aux informations que vous choisissez de partager.');
    for (const text of ['Bonjour Amine 💜', 'Voici quelques repères pour mieux vous accompagner aujourd’hui.', 'Jour du cycle', '16', 'Prochaines règles', 'Pas encore', 'Phase actuelle', 'Récupération', 'Conseil du jour', 'Soutenez-la avec de petites attentions au quotidien.']) {
      expect(texts).toContain(text);
    }
  });

  it('the small illustration is the local partenaire.png, decorative, and there is no remote image', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 1);
    const images = renderer.root.findAll(node => node.props.source !== undefined && node.props.resizeMode === 'contain' && node.props.importantForAccessibility === 'no-hide-descendants');
    expect(images.length).toBeGreaterThan(0);
    const source = fs.readFileSync(path.resolve(__dirname, '../PartnerPreviewCard.tsx'), 'utf8');
    expect(source).toContain("require('../../assets/images/partenaire.png')");
    expect(source).not.toMatch(/https?:\/\//);
  });
});

describe('Step 2 — Les avantages pour vous deux', () => {
  it('shows the five benefit cards', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 2);
    const texts = textsOf(renderer);
    for (const text of ['Un partenaire plus informé et plus attentif', 'Des conseils adaptés à chaque étape', 'Une meilleure communication', 'Un soutien au quotidien', 'Un parcours plus serein ensemble']) {
      expect(texts).toContain(text);
    }
  });
});

describe('Step 3 — Choisissez ce que vous souhaitez partager', () => {

  it('the switches respond, each one independently', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 3);
    await act(async () => {
      toggle(renderer, 'Humeur').props.onValueChange(true);
    });
    expect(toggle(renderer, 'Humeur').props.value).toBe(true);
    expect(toggle(renderer, 'Fenêtre fertile').props.value).toBe(false);
    await act(async () => {
      toggle(renderer, 'Jour du cycle et phase actuelle').props.onValueChange(false);
    });
    expect(toggle(renderer, 'Jour du cycle et phase actuelle').props.value).toBe(false);
    expect(toggle(renderer, 'Prochaines règles estimées').props.value).toBe(true);
  });

  it('does NOT offer notes, intimacy, detailed symptoms, medical results, medication, contraception, loss bleeding, lochia, Nifas or any religious information', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 3);
    const everything = textsOf(renderer).join(' | ').toLowerCase();
    for (const forbidden of ['note', 'rapport', 'intim', 'symptôme', 'analyse', 'médicament', 'contracepti', 'fausse couche', 'saignement', 'lochie', 'nifas', 'qadaa', 'prière', 'pureté', 'spirituel', 'jeûne']) {
      expect(everything).not.toContain(forbidden);
    }
    const labels = SHARING_SECTIONS.flatMap(section => section.items.map(item => item.label));
    expect(labels).toHaveLength(11); // the eleven choices — nothing else is ever offered
  });

  it('no longer offers its own "Voir un aperçu du côté partenaire" entry point (removed by design; the SAME preview reactivity to the switches is covered in AwaADeuxSharing.test.tsx and, for the still-real entry point, AwaADeuxAssociation.test.tsx)', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 3);
    expect(renderer.root.findAll(node => node.props.accessibilityLabel === 'Voir un aperçu du côté partenaire')).toHaveLength(0);
  });
});

describe('Step 4 — Associer votre partenaire (demo)', () => {
  it('shows the demo code, its validity, the sharing actions, the e-mail row and the account notice', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 4);
    const texts = textsOf(renderer);
    for (const text of ['Partagez ce code avec Amine pour l’inviter à se connecter.', 'Code d’association', DEMO_PAIRING_CODE, 'Valable pendant 24 heures', 'Partager le code', 'Partager', 'Afficher le QR code', 'ou', 'Envoyer par email', 'Invitez Amine par email directement depuis l’app', 'Amine devra créer un compte AWA et utiliser ce code pour se connecter.']) {
      expect(texts).toContain(text);
    }
    expect(DEMO_PAIRING_CODE).toBe('AWA-7K4P9');
  });
});

describe('Theme', () => {
  const visibleGradients = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(LinearGradient);
  const lastCta = (renderer: ReactTestRenderer.ReactTestRenderer, label = 'Continuer') => {
    const matches = buttons(renderer, label);
    return matches[matches.length - 1];
  };

  it('no color literal (hex / rgb / rgba) in any new AWA à deux file: no independent palette', () => {
    const dir = path.resolve(__dirname, '..');
    for (const name of ['AwaADeuxPartnerViewScreen.tsx', 'AwaADeuxBenefitsScreen.tsx', 'AwaADeuxSharingScreen.tsx', 'AwaADeuxPairingScreen.tsx', 'AwaADeuxStepLayout.tsx', 'PartnerPreviewCard.tsx']) {
      const source = fs.readFileSync(path.join(dir, name), 'utf8');
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
      expect(source).not.toMatch(/rgba?\(/);
      expect(source).toContain('useAwaTheme');
    }
  });

  const expectThemed = (renderer: ReactTestRenderer.ReactTestRenderer, theme: ReturnType<typeof resolveAwaTheme>) => {
    const gradients = visibleGradients(renderer);
    expect(gradients.length).toBeGreaterThan(0);
    gradients.forEach(gradient => expect(gradient.props.colors).toEqual([...theme.gradients.pageBackground]));
    expect(renderer.root.findAllByType(StatusBar).every(bar => bar.props.barStyle === theme.statusBarStyle)).toBe(true);
    const cta = lastCta(renderer);
    const ctaStyle = flat(typeof cta.props.style === 'function' ? cta.props.style({pressed: false}) : cta.props.style);
    expect(ctaStyle.backgroundColor).toBe(theme.colors.primary);
    const label = renderer.root.findAllByType(Text).filter(node => textOf(node) === 'Continuer').pop()!;
    expect(flat(label.props.style).color).toBe(onPrimaryTextColor(theme));
  };

  it.each([1, 2, 3] as const)('step %p renders with the light theme and with the dark theme', async step => {
    const renderer = await renderFlow();
    await goTo(renderer, step);
    expectThemed(renderer, resolveAwaTheme('awa-original', false, false));
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expectThemed(renderer, resolveAwaTheme('awa-original', true, false));
  });

  it('switching the theme while a step is open updates it live (Light → Dark → another palette)', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 3);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expectThemed(renderer, resolveAwaTheme('awa-original', true, false));
    await act(async () => {
      await setAppearanceMode('light');
      await setSelectedThemeId('ocean-calm');
    });
    expectThemed(renderer, resolveAwaTheme('ocean-calm', false, false));
  });

  it('the sharing switches use theme tokens (track = primary, thumb = surface) in Light and Dark', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 3);
    const light = resolveAwaTheme('awa-original', false, false);
    expect(toggle(renderer, 'Humeur').props.trackColor.true).toBe(light.colors.primary);
    expect(toggle(renderer, 'Humeur').props.thumbColor).toBe(light.colors.surface);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(toggle(renderer, 'Humeur').props.trackColor.true).toBe(dark.colors.primary);
    expect(toggle(renderer, 'Humeur').props.thumbColor).toBe(dark.colors.surface);
  });

  it('step 4 (no CTA) is also themed: gradient and code card follow Light / Dark', async () => {
    const renderer = await renderFlow();
    await goTo(renderer, 4);
    const codeColor = () => flat(renderer.root.findAllByType(Text).find(node => textOf(node) === DEMO_PAIRING_CODE)!.props.style).color;
    expect(codeColor()).toBe(resolveAwaTheme('awa-original', false, false).colors.accent);
    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(codeColor()).toBe(resolveAwaTheme('awa-original', true, false).colors.accent);
  });
});
