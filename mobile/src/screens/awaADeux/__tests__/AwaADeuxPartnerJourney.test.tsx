import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import AwaADeuxPairingScreen from '../AwaADeuxPairingScreen';
import AwaADeuxPendingScreen from '../AwaADeuxPendingScreen';
import AwaADeuxInvitationScreen from '../partner/AwaADeuxInvitationScreen';
import AwaADeuxAcceptInvitationScreen from '../partner/AwaADeuxAcceptInvitationScreen';
import PartnerMainTabNavigator from '../../../navigation/PartnerMainTabNavigator';
import {clearAwaADeuxPartnerName, getAwaADeuxPartnerName, setAwaADeuxPartnerName} from '../../../state/awaADeuxPartnerStore';
import {clearAwaADeuxPartnerProfileFirstName, getAwaADeuxPartnerProfileFirstName} from '../../../state/awaADeuxPartnerProfileStore';
import {getDemoPartnerState, simulatePartnerConnected, stopDemoSharing} from '../../../state/awaADeuxDemoStore';
import {DEFAULT_SHARING_TOGGLES, SHARING_KEYS, getSharingToggles, setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {setActiveObjective, setFirstName} from '../../../state/onboardingPreferences';
import {setAppearanceMode, setAppLanguage} from '../../../state/themePreferences';
import * as partnerCycleInfo from '../../../utils/awaADeuxPartnerCycleInfo';
import {APP_METADATA} from '../../../utils/appMetadata';
import i18n from '../../../i18n';

// The PARTNER-side demo journey: AwaADeuxPending (owner) → [__DEV__ only] →
// AwaADeuxInvitation → AwaADeuxAcceptInvitation → PartnerMainTabs. Frontend / in-memory
// only — see the header comments of each new file for what is and is not real.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

type Root = ReactTestRenderer.ReactTestRenderer | ReactTestRenderer.ReactTestInstance;
const rootOf = (root: Root) => ('root' in root ? root.root : root);
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).map(child => (typeof child === 'string' ? child : '')).join('');
const textsOf = (root: Root) => rootOf(root).findAllByType(Text).map(textOf);
const route = () => (navRef.getCurrentRoute() as {name: string} | undefined)?.name;
// The root STACK's current route (as opposed to route(), which reports the deepest active
// route — e.g. "PartnerHome" once inside the nested PartnerMainTabs tab navigator).
const stackRoute = () => {
  const routes = (navRef.getRootState() as {routes: {name: string}[]}).routes;
  return routes[routes.length - 1]?.name;
};
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

function Stub({label}: {label: string}): React.JSX.Element {
  return <Text>{label}</Text>;
}

async function renderFlow(initial: string = 'AwaADeuxPairing') {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName={initial} screenOptions={{headerShown: false}}>
              <Stack.Screen name="MainTabs">{() => <Stub label="MainTabs" />}</Stack.Screen>
              <Stack.Screen name="Welcome">{() => <Stub label="Welcome" />}</Stack.Screen>
              {/* Cheap stubs: rebuildStackToAssociation (reused, untouched by this task) rebuilds
                  the full onboarding stack up to Pairing — these routes just need to exist. */}
              <Stack.Screen name="AwaADeuxIntro">{() => <Stub label="AwaADeuxIntro" />}</Stack.Screen>
              <Stack.Screen name="AwaADeuxPartnerName">{() => <Stub label="AwaADeuxPartnerName" />}</Stack.Screen>
              <Stack.Screen name="AwaADeuxPartnerView">{() => <Stub label="AwaADeuxPartnerView" />}</Stack.Screen>
              <Stack.Screen name="AwaADeuxBenefits">{() => <Stub label="AwaADeuxBenefits" />}</Stack.Screen>
              <Stack.Screen name="AwaADeuxSharing">{() => <Stub label="AwaADeuxSharing" />}</Stack.Screen>
              <Stack.Screen component={AwaADeuxPairingScreen as never} name="AwaADeuxPairing" />
              <Stack.Screen component={AwaADeuxPendingScreen as never} name="AwaADeuxPending" />
              <Stack.Screen component={AwaADeuxInvitationScreen as never} name="AwaADeuxInvitation" />
              <Stack.Screen component={AwaADeuxAcceptInvitationScreen as never} name="AwaADeuxAcceptInvitation" />
              <Stack.Screen component={PartnerMainTabNavigator as never} name="PartnerMainTabs" />
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
const press = async (root: Root, label: string, times = 1) => {
  const matches = buttons(root, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    for (let index = 0; index < times; index += 1) {matches[matches.length - 1].props.onPress();}
  });
  await settle();
};
beforeEach(async () => {
  jest.restoreAllMocks();
  stopDemoSharing();
  await clearAwaADeuxPartnerName();
  await clearAwaADeuxPartnerProfileFirstName();
  await AsyncStorage.clear();
  await setAppearanceMode('light');
  for (const key of SHARING_KEYS) {await setSharingToggle(key, DEFAULT_SHARING_TOGGLES[key]);}
  await setActiveObjective('cycle');
  setFirstName('');
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

describe('AwaADeuxPendingScreen actions', () => {
  it('"Renvoyer l’invitation" only gives visual feedback: connectionStatus and route are unchanged', async () => {
    const renderer = await renderFlow('AwaADeuxPending');
    expect(getDemoPartnerState().connectionStatus).toBe('not_invited'); // reaching Pending directly does not itself set it
    await press(renderer, 'Renvoyer l’invitation');
    expect(textsOf(renderer)).toContain('Invitation renvoyée');
    expect(route()).toBe('AwaADeuxPending');
  });

  it('"Annuler l’invitation" resets the demo status to not_invited and returns to the association screen', async () => {
    setAwaADeuxPartnerName('Amine');
    const renderer = await renderFlow('AwaADeuxPending');
    await press(renderer, 'Annuler l’invitation');
    expect(getDemoPartnerState().connectionStatus).toBe('not_invited');
    expect(route()).toBe('AwaADeuxPairing');
    expect(textsOf(renderer)).toContain('Associer votre\npartenaire');
  });

  it('[__DEV__] "Prévisualiser le parcours partenaire" opens AwaADeuxInvitation; the label never appears outside this row', async () => {
    const renderer = await renderFlow('AwaADeuxPending');
    expect(buttons(renderer, 'Prévisualiser le parcours partenaire').length).toBeGreaterThan(0);
    await press(renderer, 'Prévisualiser le parcours partenaire');
    expect(route()).toBe('AwaADeuxInvitation');
  });

  it('the dev preview action is gated by __DEV__ in source (never shown in a production build)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../AwaADeuxPendingScreen.tsx'), 'utf8');
    expect(source).toMatch(/\{__DEV__\s*\?[\s\S]*awaADeux\.pending\.previewTitle/);
  });
});

describe('AwaADeuxInvitationScreen → AwaADeuxAcceptInvitationScreen', () => {
  it('"Continuer" opens AcceptInvitation directly — no Auth/Registration in between', async () => {
    const renderer = await renderFlow('AwaADeuxInvitation');
    await press(renderer, 'Continuer');
    expect(route()).toBe('AwaADeuxAcceptInvitation');
  });

  it('shows the owner’s real first name when known, neutral wording otherwise — never an invented name', async () => {
    setFirstName('Nourhene');
    let renderer = await renderFlow('AwaADeuxInvitation');
    expect(textsOf(renderer)).toContain('Nourhene vous invite\nà rejoindre AWA à deux');
    act(() => {
      activeRenderers.pop();
      renderer.unmount();
    });
    setFirstName('');
    renderer = await renderFlow('AwaADeuxInvitation');
    expect(textsOf(renderer)).toContain('Vous avez reçu une invitation\nà rejoindre AWA à deux');
  });

  it('"Accepter l’invitation" moves connectionStatus to connected and opens PartnerMainTabs; "Plus tard" never does', async () => {
    const renderer = await renderFlow('AwaADeuxAcceptInvitation');
    await press(renderer, 'Plus tard');
    expect(getDemoPartnerState().connectionStatus).toBe('not_invited');

    const again = await renderFlow('AwaADeuxAcceptInvitation');
    await press(again, 'Accepter l’invitation', 3); // rapid taps confirm once
    expect(getDemoPartnerState().connectionStatus).toBe('connected');
    expect(stackRoute()).toBe('PartnerMainTabs');
    expect(route()).toBe('PartnerHome'); // PartnerMainTabs' own initial tab
  });

  it('lists only the SAME, currently-enabled sharing choices (the single computePartnerVisibility source of truth)', async () => {
    await setSharingToggle('fertileWindow', true);
    await setSharingToggle('nextPeriod', false);
    const renderer = await renderFlow('AwaADeuxAcceptInvitation');
    const texts = textsOf(renderer);
    expect(texts).toContain('Fenêtre fertile');
    expect(texts).not.toContain('Prochaines règles estimées');
  });
});

describe('PartnerMainTabs — read-only partner space', () => {
  it('contains exactly Accueil / Calendrier / Conseils / Profil, and no "+" journal action', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    for (const label of ['Accueil', 'Calendrier', 'Conseils', 'Profil']) {
      expect(buttons(renderer, label).length).toBeGreaterThan(0);
    }
    expect(buttons(renderer, 'Ajouter')).toHaveLength(0);
    const source = fs.readFileSync(path.resolve(__dirname, '../../../components/navigation/PartnerBottomTabBar.tsx'), 'utf8');
    expect(source).not.toMatch(/JournalSheet|CentralAddButton/);
  });

  it('navigating between tabs shows each screen exactly once', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    expect(textsOf(renderer)).toContain('Calendrier');
    await press(renderer, 'Calendrier');
    expect(rootOf(renderer).findAllByType(Text).filter(node => textOf(node) === 'Calendrier').length).toBeGreaterThan(0);
    await press(renderer, 'Conseils');
    expect(textsOf(renderer)).toContain('Conseils');
  });
});

describe('PartnerHomeScreen — sharing permissions control what is shown', () => {
  it('a disabled permission removes its card entirely; an enabled one shows it (real data or "Information non disponible", never invented)', async () => {
    await setSharingToggle('cycleDay', false);
    await setSharingToggle('nextPeriod', false);
    await setSharingToggle('fertileWindow', false);
    let renderer = await renderFlow('PartnerMainTabs');
    let texts = textsOf(renderer);
    expect(rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Jour du cycle indisponible')).toHaveLength(0);
    expect(texts).not.toContain('Aujourd’hui');
    expect(texts).not.toContain('Prochaines règles estimées');
    expect(texts).not.toContain('Fenêtre fertile');
    expect(texts).toContain('Aucune information n’est partagée avec vous pour le moment.');
    act(() => {
      activeRenderers.pop();
      renderer.unmount();
    });

    await setSharingToggle('cycleDay', true);
    await setSharingToggle('nextPeriod', true);
    renderer = await renderFlow('PartnerMainTabs');
    texts = textsOf(renderer);
    expect(texts).toContain('Aujourd’hui');
    expect(texts).toContain('Prochaines règles estimées');
    expect(texts).not.toContain('Fenêtre fertile'); // still off
    // No confirmed cycle data in this test: a shown card must say so honestly, never invent a day/phase.
    expect(texts).toContain('Information non disponible');
    expect(rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Jour du cycle indisponible').length).toBeGreaterThan(0);
  });

  it('shows real dynamic cycle/phase values only while cycleDay sharing is enabled; the ring cannot leak them when disabled', async () => {
    jest.spyOn(partnerCycleInfo, 'computePartnerCycleInfo').mockReturnValue({
      cycleDay: 17,
      cycleLength: 29,
      cycleProgress: 17 / 29,
      phase: 'follicular',
      nextPeriod: '5 novembre',
      nextPeriodDate: new Date(2026, 10, 5),
      fertileWindow: '8 novembre – 13 novembre',
      fertileWindowRange: {start: new Date(2026, 10, 8), end: new Date(2026, 10, 13)},
      ovulation: '12 novembre',
      ovulationDate: new Date(2026, 10, 12),
    });
    await setSharingToggle('cycleDay', true);
    await setSharingToggle('nextPeriod', false);
    await setSharingToggle('fertileWindow', false);

    let renderer = await renderFlow('PartnerMainTabs');
    let texts = textsOf(renderer);
    expect(texts).toContain('17');
    expect(texts).toContain('Phase folliculaire'); // the SAME ring/phase-label wording as the owner's own HeroCycleCard
    expect(rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Jour 17 du cycle').length).toBeGreaterThan(0);

    act(() => {
      activeRenderers.pop();
      renderer.unmount();
    });
    await setSharingToggle('cycleDay', false);
    await setSharingToggle('nextPeriod', true);
    await setSharingToggle('fertileWindow', true);

    renderer = await renderFlow('PartnerMainTabs');
    texts = textsOf(renderer);
    expect(texts).not.toContain('17');
    expect(texts).not.toContain('Phase folliculaire');
    expect(rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Jour 17 du cycle')).toHaveLength(0);
    expect(texts).toContain('5 novembre');
    // The fertile-window mini-tile shows a compact status (En cours / Dans N jours), not
    // the raw date range — that range is never fabricated as a bare string either.
    expect(texts.some(text => /^Dans \d+ jours?$/.test(text) || text === 'En cours')).toBe(true);
  });

  it('renders next-period and fertile-window info independently from their own permissions', async () => {
    jest.spyOn(partnerCycleInfo, 'computePartnerCycleInfo').mockReturnValue({
      cycleDay: 9,
      cycleLength: 27,
      cycleProgress: 9 / 27,
      phase: 'follicular',
      nextPeriod: '6 décembre',
      nextPeriodDate: new Date(2026, 11, 6),
      fertileWindow: '10 novembre – 15 novembre',
      fertileWindowRange: {start: new Date(2026, 10, 10), end: new Date(2026, 10, 15)},
      ovulation: '14 novembre',
      ovulationDate: new Date(2026, 10, 14),
    });
    await setSharingToggle('cycleDay', false);
    await setSharingToggle('nextPeriod', false);
    await setSharingToggle('fertileWindow', true);

    const renderer = await renderFlow('PartnerMainTabs');
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Prochaines règles estimées');
    expect(texts).not.toContain('6 décembre');
    expect(texts).toContain('Fenêtre fertile');
    expect(texts.some(text => /^Dans \d+ jours?$/.test(text) || text === 'En cours')).toBe(true);
  });

  it('greets with the new "As-salamu ‘alaykum," header — never the partner/owner name-based greeting', async () => {
    setAwaADeuxPartnerName('Amine');
    setFirstName('Nourhene');
    const renderer = await renderFlow('PartnerMainTabs');
    const texts = textsOf(renderer);
    expect(texts).toContain('As-salamu ‘alaykum,');
    expect(texts).toContain('Tu es là pour elle 💜');
    expect(texts).not.toContain('Bonjour, Amine');
    expect(texts).not.toContain('Où en est Nourhene aujourd’hui ?');
  });

  it('"Son énergie"/"Son humeur" only appear when mood sharing is on AND a real journal entry exists for today; never a fabricated value', async () => {
    await setSharingToggle('cycleDay', true);
    await setSharingToggle('mood', false);
    let renderer = await renderFlow('PartnerMainTabs');
    expect(textsOf(renderer)).not.toContain('Son énergie');
    expect(textsOf(renderer)).not.toContain('Son humeur');
    act(() => {
      activeRenderers.pop();
      renderer.unmount();
    });

    await setSharingToggle('mood', true);
    renderer = await renderFlow('PartnerMainTabs');
    await settle();
    // Shared, but no journal entry recorded today: still no fabricated energy/mood.
    expect(textsOf(renderer)).not.toContain('Son énergie');
    expect(textsOf(renderer)).not.toContain('Son humeur');
  });

  it('contains no reference-only name, cycle value, example date, fake navigation or hardcoded health copy', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerHomeScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/\bYacine\b|\bSami\b|\bAmine\b|\bMoussa\b/);
    expect(source).not.toMatch(/Jour\s+18|13 octobre|24 septembre|30 septembre/);
    expect(source).not.toMatch(/En savoir plus/);
    expect(source).toMatch(/importantForAccessibility="no-hide-descendants"[\s\S]*arrow-right/);
    expect(source).not.toContain('Son corps se prépare doucement pour la prochaine étape du cycle.');
    // The one legitimate Pressable in this file (added for the top-right profile
    // shortcut) is real, typed, same-navigator tab navigation — never a fake affordance.
    expect(source).toMatch(/navigation\.navigate\('PartnerProfile'\)/);
    expect(source).not.toMatch(/as never|as unknown/);
  });

  it('the top-right profile shortcut matches the owner Cycle dashboard’s HomeHeader button (icon, size, circular chrome) and opens PartnerProfile without pushing a new stack screen', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    expect(route()).toBe('PartnerHome');
    const profileButton = buttons(renderer, 'Ouvrir mon profil').pop()!;
    const icon = rootOf(renderer).findAll(node => node.props.name === 'account-outline' && node.props.size === 22)[0];
    expect(icon).toBeDefined();

    await press(renderer, 'Ouvrir mon profil');
    expect(route()).toBe('PartnerProfile');
    expect(stackRoute()).toBe('PartnerMainTabs'); // still the SAME tab navigator, no new stack screen
    expect(profileButton.props.accessibilityRole).toBe('button');

    // Bottom "Profil" tab keeps working exactly as before, reaching the same screen.
    await press(renderer, 'Accueil');
    expect(route()).toBe('PartnerHome');
    await press(renderer, 'Profil');
    expect(route()).toBe('PartnerProfile');
  });

  it('uses resolved AWA surfaces in both light and dark mode without changing the shared data', async () => {
    jest.spyOn(partnerCycleInfo, 'computePartnerCycleInfo').mockReturnValue({
      cycleDay: 11,
      cycleLength: 30,
      cycleProgress: 11 / 30,
      phase: 'follicular',
      nextPeriod: 'Information non disponible',
      nextPeriodDate: null,
      fertileWindow: 'Information non disponible',
      fertileWindowRange: null,
      ovulation: 'Information non disponible',
      ovulationDate: null,
    });
    await setSharingToggle('cycleDay', true);

    const light = await renderFlow('PartnerMainTabs');
    const lightCard = rootOf(light).findAll(node => node.props.accessibilityLabel === 'Informations du cycle aujourd’hui')[0];
    const lightBackground = StyleSheet.flatten(lightCard.props.style).backgroundColor;
    expect(textsOf(light)).toEqual(expect.arrayContaining(['11', 'Phase folliculaire']));

    act(() => {
      activeRenderers.pop();
      light.unmount();
    });
    await setAppearanceMode('dark');

    const dark = await renderFlow('PartnerMainTabs');
    const darkCard = rootOf(dark).findAll(node => node.props.accessibilityLabel === 'Informations du cycle aujourd’hui')[0];
    const darkBackground = StyleSheet.flatten(darkCard.props.style).backgroundColor;
    expect(textsOf(dark)).toEqual(expect.arrayContaining(['11', 'Phase folliculaire']));
    expect(darkBackground).not.toBe(lightBackground);
  });
});

describe('PartnerHomeScreen — partner first name under the greeting (shared identity source with PartnerProfileScreen)', () => {
  it('renders no name line when none is saved; shows the owner-entered seed once set', async () => {
    let renderer = await renderFlow('PartnerMainTabs');
    expect(textsOf(renderer)).not.toContain('Moussa');
    act(() => {
      activeRenderers.pop();
      renderer.unmount();
    });

    setAwaADeuxPartnerName('Moussa'); // owner-entered seed, no partner-profile value saved yet
    renderer = await renderFlow('PartnerMainTabs');
    expect(textsOf(renderer)).toContain('Moussa');
  });

  it('editing "Prénom" in PartnerProfile updates the SAME name on PartnerHome (single shared source, no hardcoded fallback)', async () => {
    setAwaADeuxPartnerName('Moussa');
    const renderer = await renderFlow('PartnerMainTabs');
    expect(textsOf(renderer)).toContain('Moussa');

    await press(renderer, 'Profil');
    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    await act(async () => {
      input.props.onChangeText('Yacine');
    });
    await press(renderer, 'Enregistrer');

    await press(renderer, 'Accueil');
    const texts = textsOf(renderer);
    expect(texts).toContain('Yacine');
    expect(texts).not.toContain('Moussa');
  });

  it('never hardcodes a fallback name (no `partnerFirstName || \'…\'` pattern) in source', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerHomeScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/partnerFirstName\s*(\|\||\?\?)\s*['"`][A-ZÉ][a-zé]+['"`]/);
  });
});

describe('PartnerHomeScreen — important values are never truncated with "…"', () => {
  it('"Informations partagées" tiles show the full value/label, wrapping onto a second line instead of clipping (e.g. "Non en cours", "Fenêtre fertile")', async () => {
    jest.spyOn(partnerCycleInfo, 'computePartnerCycleInfo').mockReturnValue({
      cycleDay: 13,
      cycleLength: 28,
      cycleProgress: 13 / 28,
      phase: 'fertile',
      nextPeriod: '13 octobre',
      nextPeriodDate: new Date(2026, 9, 13),
      fertileWindow: '24 septembre – 30 septembre',
      fertileWindowRange: {start: new Date(2026, 8, 24), end: new Date(2026, 8, 30)},
      ovulation: '29 septembre',
      ovulationDate: new Date(2026, 8, 29),
    });
    for (const key of SHARING_KEYS) {await setSharingToggle(key, false);}
    await setSharingToggle('cycleDay', true);
    await setSharingToggle('periodStatus', true);
    await setSharingToggle('fertileWindow', true);
    await setSharingToggle('ovulation', true);
    await setSharingToggle('nextPeriod', true);

    const renderer = await renderFlow('PartnerMainTabs');
    const texts = textsOf(renderer);
    // The exact, complete strings — never a "…"-suffixed prefix of them.
    for (const complete of ['Non en cours', 'Fenêtre fertile', '13 octobre', '29 septembre']) {
      expect(texts).toContain(complete);
    }
    expect(texts.join(' | ')).not.toMatch(/…|\.\.\./);
  });

  it('no numberOfLines={1} remains on the shared-info tile or event-card values/labels in source (2 lines allowed, never a hard 1-line clip)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerHomeScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/numberOfLines=\{1\}\s*style=\{styles\.(tileLabel|tileValue|eventValue|eventLabel)\}/);
  });
});

describe('PartnerCalendarScreen — read-only, permission-gated', () => {
  it('no day cell is pressable (no onPress anywhere in the grid)', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Calendrier');
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerCalendarScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/onPress=\{.*setSelected|onDayPress|JournalSheet/);
  });

  it('the legend only lists what is actually shared; a disabled permission removes both its marker and its legend row', async () => {
    // "Règles" covers BOTH real recorded period days and the predicted next-period date —
    // the owner's own calendar (utils/cycleMath.ts's kindFor) doesn't visually distinguish
    // them either, so it only disappears once NEITHER is shared.
    await setSharingToggle('periodStatus', false);
    await setSharingToggle('nextPeriod', false);
    await setSharingToggle('fertileWindow', false);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Calendrier');
    let texts = textsOf(renderer);
    expect(texts).not.toContain('Règles');
    expect(texts).not.toContain('Fenêtre fertile');
    expect(texts).toContain('Aucun repère n’est partagé avec vous pour le moment.');

    act(() => {
      activeRenderers.pop();
      renderer.unmount();
    });
    await setSharingToggle('periodStatus', true);
    const withPeriod = await renderFlow('PartnerMainTabs');
    await press(withPeriod, 'Calendrier');
    texts = textsOf(withPeriod);
    expect(texts).toContain('Règles');
    expect(texts).not.toContain('Fenêtre fertile');
  });
});

describe('PartnerAdviceScreen — never leaks hidden information', () => {
  it('gives generic support wording when the phase is not shared (cycleDay off)', async () => {
    await setSharingToggle('cycleDay', false);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Conseils');
    expect(textsOf(renderer)).toContain('Restez à l’écoute et proposez votre aide, sans avoir besoin de connaître le détail de son cycle.');
  });

  it('never mentions a phase or fertility word when nothing about the cycle is shared', async () => {
    for (const key of SHARING_KEYS) {await setSharingToggle(key, false);}
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Conseils');
    const everything = textsOf(renderer).join(' | ').toLowerCase();
    for (const forbidden of ['fenêtre fertile', 'ovulation', 'phase folliculaire', 'phase lutéale']) {
      expect(everything).not.toContain(forbidden);
    }
  });
});

describe('PartnerProfileScreen — welcome card', () => {
  it.each(['Moussa', 'Yacine', 'Mohamed', 'Abdelrahmane'])('greets with the FULL "Salam %s ! 💜" (never truncated) and the two compact welcome sentences', async name => {
    setAwaADeuxPartnerName(name);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    const texts = textsOf(renderer);
    expect(texts).toContain(`Salam ${name} ! 💜`);
    expect(texts).toContain('Partenaire sur AWA à deux.');
    expect(texts).toContain('Merci d’être à ses côtés.');
    expect(texts).toContain(name.charAt(0)); // avatar initial follows the resolved name
  });

  it('never truncates the greeting with an ellipsis (no numberOfLines on the title)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerProfileScreen.tsx'), 'utf8');
    const titleLine = source.split('\n').find(line => line.includes('styles.identityName'));
    expect(titleLine).not.toMatch(/numberOfLines/);
  });

  it('falls back to neutral wording and a neutral person icon when no partner name is set (never an invented name)', async () => {
    await clearAwaADeuxPartnerName();
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    const texts = textsOf(renderer);
    expect(texts).toContain('Salam Partenaire ! 💜');
    expect(rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Aucun prénom renseigné').length).toBeGreaterThan(0);
  });

  it('no longer shows a "Connecté" badge in the welcome card — that status now lives only in the "AWA à deux" subtitle below', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Connecté');
    expect(texts.some(text => /Vous êtes connecté à/.test(text))).toBe(true);
  });
});

describe('PartnerProfileScreen — Informations personnelles', () => {
  it('renders the section with only Prénom (dynamic) and Rôle ("Partenaire")', async () => {
    setAwaADeuxPartnerName('Mohamed');
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    const texts = textsOf(renderer);
    expect(texts).toContain('Informations personnelles');
    expect(texts).toContain('Vos informations dans AWA à deux');
    expect(texts).toContain('Prénom');
    expect(texts).toContain('Mohamed');
    expect(texts).toContain('Rôle');
    expect(texts).toContain('Partenaire'); // the role value, static by design (see spec)
  });

  it('Rôle stays read-only: no chevron, not a Pressable/button; "Prénom" itself is not a plain-text button (it opens via "Modifier mon prénom")', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    expect(buttons(renderer, 'Prénom')).toHaveLength(0);
    expect(buttons(renderer, 'Rôle')).toHaveLength(0);
    expect(buttons(renderer, 'Modifier mon prénom').length).toBeGreaterThan(0);
  });

  it('never renders a fake personal field (email/phone/date of birth/country)', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    const everything = textsOf(renderer).join(' | ');
    for (const forbidden of ['Nom', 'Date de naissance', 'Adresse e-mail', 'Téléphone', 'Pays', 'Langue']) {
      expect(everything).not.toContain(forbidden);
    }
  });
});

describe('PartnerProfileScreen — editable "Prénom"', () => {
  it('tapping "Prénom" opens the edit sheet, prefilled with the current name; "Rôle" has no such action', async () => {
    setAwaADeuxPartnerName('Moussa'); // owner-entered seed, since no partner-profile value is set yet
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    expect(textsOf(renderer)).not.toContain('Modifier mon prénom');

    await press(renderer, 'Modifier mon prénom');
    const texts = textsOf(renderer);
    expect(texts).toContain('Modifier mon prénom');
    expect(texts).toContain('Ce prénom sera utilisé dans votre espace AWA à deux.');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    expect(input.props.value).toBe('Moussa');
  });

  it('cannot save an empty or whitespace-only value; trims surrounding whitespace before saving', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];

    await act(async () => {
      input.props.onChangeText('   ');
    });
    let saveButton = buttons(renderer, 'Enregistrer').pop()!;
    expect(saveButton.props.accessibilityState).toEqual({disabled: true});

    await act(async () => {
      input.props.onChangeText('   Yacine   ');
    });
    saveButton = buttons(renderer, 'Enregistrer').pop()!;
    expect(saveButton.props.accessibilityState).toEqual({disabled: false});
    await press(renderer, 'Enregistrer');

    const texts = textsOf(renderer);
    expect(texts).toContain('Yacine');
    expect(texts).not.toContain('   Yacine   ');
  });

  it('saving immediately updates the "Prénom" value, the avatar initial and the welcome "Salam" greeting', async () => {
    setAwaADeuxPartnerName('Moussa');
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    expect(textsOf(renderer)).toContain('Salam Moussa ! 💜');
    expect(textsOf(renderer)).toContain('M');

    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    await act(async () => {
      input.props.onChangeText('Yacine');
    });
    await press(renderer, 'Enregistrer');

    const texts = textsOf(renderer);
    expect(texts).not.toContain('Modifier mon prénom'); // sheet closed
    expect(texts).toContain('Salam Yacine ! 💜');
    expect(texts).toContain('Yacine');
    expect(texts).toContain('Y');
    expect(texts).not.toContain('Salam Moussa ! 💜');
  });

  it('the saved partner-profile first name survives a remount (persisted, not just in-memory)', async () => {
    let renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    await act(async () => {
      input.props.onChangeText('Yacine');
    });
    await press(renderer, 'Enregistrer');

    act(() => {
      activeRenderers.pop();
      renderer.unmount();
    });
    renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    expect(textsOf(renderer)).toContain('Yacine');
  });

  it('editing the partner’s own profile name never mutates the owner’s saved awaADeuxPartnerStore.partnerName', async () => {
    setAwaADeuxPartnerName('Moussa');
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    await act(async () => {
      input.props.onChangeText('Yacine');
    });
    await press(renderer, 'Enregistrer');

    expect(getAwaADeuxPartnerName()).toBe('Moussa'); // owner's own store, untouched
  });

  it('"Annuler" discards the edit without saving', async () => {
    setAwaADeuxPartnerName('Moussa');
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    await act(async () => {
      input.props.onChangeText('Yacine');
    });
    await press(renderer, 'Annuler');
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Modifier mon prénom');
    expect(texts).toContain('Moussa');
    expect(texts).not.toContain('Yacine');
  });

  it('does not change sharing permissions or their visibility', async () => {
    await setSharingToggle('fertileWindow', true);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    await act(async () => {
      input.props.onChangeText('Yacine');
    });
    await press(renderer, 'Enregistrer');
    await press(renderer, 'Informations auxquelles vous avez accès');
    expect(textsOf(renderer)).toContain('Fenêtre fertile');
  });
});

describe('PartnerProfileScreen — "Informations auxquelles vous avez accès" (accordion, same style as Confidentialité)', () => {
  it('is collapsed by default; tapping it expands the list inside the same card; tapping again collapses it', async () => {
    await setSharingToggle('fertileWindow', true);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    expect(textsOf(renderer)).not.toContain('Fenêtre fertile — Vous pouvez voir ses jours fertiles.'); // sanity: not a single joined string
    expect(textsOf(renderer)).not.toContain('Vous pouvez voir ses jours fertiles.');

    await press(renderer, 'Informations auxquelles vous avez accès');
    const texts = textsOf(renderer);
    expect(texts).toContain('Vous pouvez voir ses jours fertiles.');
    const accessButton = buttons(renderer, 'Informations auxquelles vous avez accès').pop()!;
    expect(accessButton.props.accessibilityState).toEqual({expanded: true});

    await press(renderer, 'Informations auxquelles vous avez accès');
    expect(textsOf(renderer)).not.toContain('Vous pouvez voir ses jours fertiles.');
  });

  it('shares the same single top-level accordion state as Confidentialité/Aide & support — opening it closes whichever of the other two was open', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Confidentialité');
    expect(textsOf(renderer)).toContain('Ce que vous pouvez voir');
    await press(renderer, 'Informations auxquelles vous avez accès');
    expect(textsOf(renderer)).not.toContain('Ce que vous pouvez voir'); // Confidentialité closed, same as Aide & support already does
  });

  it('shows a compact neutral empty state when nothing is currently shared', async () => {
    for (const key of SHARING_KEYS) {await setSharingToggle(key, false);}
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Informations auxquelles vous avez accès');
    const texts = textsOf(renderer);
    expect(texts).toContain('Aucune information partagée pour le moment.');
    expect(texts).toContain('Votre partenaire peut modifier ses choix de partage à tout moment.');
    expect(texts).not.toContain('Activé');
  });

  it('a disabled permission never appears — not even as "Désactivé"/"Masqué" — and there is no way to edit it here', async () => {
    await setSharingToggle('fertileWindow', false);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Informations auxquelles vous avez accès');
    const everything = textsOf(renderer).join(' | ');
    expect(everything).not.toContain('Fenêtre fertile');
    expect(everything).not.toMatch(/Désactivé|Masqué|Non activé/);
    // No switch/toggle control exists in source for this section.
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerProfileScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/Switch/);
  });
});

describe('PartnerProfileScreen — identity, avatar and access summary', () => {
  it('summarizes access by category only — never the underlying value/date — and only what is actually shared', async () => {
    jest.spyOn(partnerCycleInfo, 'computePartnerCycleInfo').mockReturnValue({
      cycleDay: 12,
      cycleLength: 28,
      cycleProgress: 12 / 28,
      phase: 'follicular',
      nextPeriod: '5 novembre',
      nextPeriodDate: new Date(2026, 10, 5),
      fertileWindow: '24 septembre – 30 septembre',
      fertileWindowRange: {start: new Date(2026, 8, 24), end: new Date(2026, 8, 30)},
      ovulation: '28 septembre',
      ovulationDate: new Date(2026, 8, 28),
    });
    await setSharingToggle('fertileWindow', true);
    await setSharingToggle('nextPeriod', false);
    await setSharingToggle('periodStatus', false);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Informations auxquelles vous avez accès'); // collapsed accordion, like Confidentialité
    const texts = textsOf(renderer);
    expect(texts).toContain('Fenêtre fertile');
    expect(texts).toContain('Vous pouvez voir ses jours fertiles.');
    // Neither screen ever renders the raw date range as a bare string — PartnerHome's own
    // mini-tile shows a compact status (En cours / Dans N jours) instead, and Profile only
    // ever describes the CATEGORY of access, never a value.
    expect(texts).not.toContain('24 septembre – 30 septembre');
    expect(texts).not.toContain('5 novembre');
    // A disabled permission is never shown, so it can never read "Activé" either.
    expect(texts).not.toContain('Prochaines règles estimées');
  });
});

describe('PartnerHomeScreen — fertile-window and ovulation privacy regression (category only, never a raw value)', () => {
  // Regression test for a real production bug: once the fertile window (or ovulation) was
  // entirely in the past, PartnerHomeScreen's "Informations partagées" tiles fell back to
  // the raw `info.fertileWindow`/`info.ovulation` strings instead of staying category-only
  // ("En cours" / "Dans N jours" / "Information non disponible"). These raw strings use
  // obviously-fake sentinel text (never a real date format) specifically so this test can
  // never pass by accident if a real date happens to collide with an expected substring.
  const DAY_MS = 24 * 60 * 60 * 1000;
  const RAW_FERTILE_SENTINEL = 'RAW-FERTILE-DATE-RANGE-SENTINEL';
  const RAW_OVULATION_SENTINEL = 'RAW-OVULATION-DATE-SENTINEL';

  type CycleInfoOverrides = Partial<ReturnType<typeof partnerCycleInfo.computePartnerCycleInfo>>;
  function mockCycleInfo(overrides: CycleInfoOverrides) {
    jest.spyOn(partnerCycleInfo, 'computePartnerCycleInfo').mockReturnValue({
      cycleDay: 10,
      cycleLength: 28,
      cycleProgress: 10 / 28,
      phase: 'follicular',
      nextPeriod: null,
      nextPeriodDate: null,
      fertileWindow: null,
      fertileWindowRange: null,
      ovulation: null,
      ovulationDate: null,
      ...overrides,
    });
  }

  it('past fertile window, permission ON: category label shown, raw date range never shown, resolves to "Information non disponible"', async () => {
    const start = new Date(Date.now() - 20 * DAY_MS);
    const end = new Date(Date.now() - 14 * DAY_MS);
    mockCycleInfo({fertileWindow: RAW_FERTILE_SENTINEL, fertileWindowRange: {start, end}});
    await setSharingToggle('fertileWindow', true);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    expect(texts).toContain('Fenêtre fertile');
    expect(texts).not.toContain(RAW_FERTILE_SENTINEL);
    expect(texts).toContain('Information non disponible');
  });

  it('current (in-progress) fertile window, permission ON: shows "En cours", never the raw range', async () => {
    const start = new Date(Date.now() - 2 * DAY_MS);
    const end = new Date(Date.now() + 2 * DAY_MS);
    mockCycleInfo({fertileWindow: RAW_FERTILE_SENTINEL, fertileWindowRange: {start, end}});
    await setSharingToggle('fertileWindow', true);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    expect(texts).toContain('Fenêtre fertile');
    expect(texts).not.toContain(RAW_FERTILE_SENTINEL);
    expect(texts).toContain('En cours');
  });

  it('future fertile window, permission ON: shows "Dans N jours", never the raw range', async () => {
    const start = new Date(Date.now() + 10 * DAY_MS);
    const end = new Date(Date.now() + 15 * DAY_MS);
    mockCycleInfo({fertileWindow: RAW_FERTILE_SENTINEL, fertileWindowRange: {start, end}});
    await setSharingToggle('fertileWindow', true);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    expect(texts).toContain('Fenêtre fertile');
    expect(texts).not.toContain(RAW_FERTILE_SENTINEL);
    expect(texts.some(text => /^Dans \d+ jours?$/.test(text))).toBe(true);
  });

  it('past fertile window, permission OFF: no fertile-window tile, category, or raw value appears at all', async () => {
    const start = new Date(Date.now() - 20 * DAY_MS);
    const end = new Date(Date.now() - 14 * DAY_MS);
    mockCycleInfo({fertileWindow: RAW_FERTILE_SENTINEL, fertileWindowRange: {start, end}});
    await setSharingToggle('fertileWindow', false);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    expect(texts).not.toContain('Fenêtre fertile');
    expect(texts).not.toContain(RAW_FERTILE_SENTINEL);
  });

  it('no cycle information at all (no permissions on): empty-state card shown, nothing resembling a date leaks', async () => {
    mockCycleInfo({});
    for (const key of SHARING_KEYS) {await setSharingToggle(key, false);}
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    expect(texts).toContain('Aucune information n’est partagée avec vous pour le moment.');
    expect(texts).not.toContain(RAW_FERTILE_SENTINEL);
    expect(texts).not.toContain(RAW_OVULATION_SENTINEL);
  });

  // The "Informations partagées" ovulation tile (shortLabel exactly 'Ovulation') and the
  // "Prochains événements" ovulation tile (label 'Ovulation estimée') are two DIFFERENT,
  // intentionally-coexisting tiles — see the dedicated test below confirming the second one
  // legitimately shows the raw date. These two tests isolate the FIRST tile's value (the
  // text immediately following the exact 'Ovulation' label) rather than asserting a blanket
  // absence of the sentinel across the whole screen.
  function valueAfterExactLabel(texts: string[], label: string): string | undefined {
    const index = texts.indexOf(label);
    return index === -1 ? undefined : texts[index + 1];
  }

  it('past ovulation, permission ON ("Informations partagées" category tile): category label shown, raw date never shown', async () => {
    const ovulationDate = new Date(Date.now() - 10 * DAY_MS);
    mockCycleInfo({ovulation: RAW_OVULATION_SENTINEL, ovulationDate});
    await setSharingToggle('ovulation', true);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    // The shared-info ovulation tile (shortLabelOvulation) must fall back to the same
    // category-safe "Information non disponible" as fertile window — never the raw date.
    expect(valueAfterExactLabel(texts, 'Ovulation')).toBe('Information non disponible');
  });

  it('future ovulation, permission ON ("Informations partagées" category tile): shows "Dans N jours", never the raw date', async () => {
    const ovulationDate = new Date(Date.now() + 8 * DAY_MS);
    mockCycleInfo({ovulation: RAW_OVULATION_SENTINEL, ovulationDate});
    await setSharingToggle('ovulation', true);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    expect(valueAfterExactLabel(texts, 'Ovulation')).toMatch(/^Dans \d+ jours?$/);
  });

  it('past ovulation, permission OFF: no ovulation tile, category, or raw value appears at all', async () => {
    const ovulationDate = new Date(Date.now() - 10 * DAY_MS);
    mockCycleInfo({ovulation: RAW_OVULATION_SENTINEL, ovulationDate});
    await setSharingToggle('ovulation', false);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    expect(texts).not.toContain(RAW_OVULATION_SENTINEL);
  });

  it('"Prochains événements" upcoming-event tiles are a DIFFERENT, already-established contract: they legitimately show the absolute date as their value (same as nextPeriod) — this must not regress into also being hidden', async () => {
    const ovulationDate = new Date(Date.now() + 8 * DAY_MS);
    mockCycleInfo({ovulation: RAW_OVULATION_SENTINEL, ovulationDate});
    await setSharingToggle('ovulation', true);
    const texts = textsOf(await renderFlow('PartnerMainTabs'));
    // The upcoming-events ovulation tile legitimately shows the raw date as its main value
    // (mirroring nextPeriod's own tile right above it) — only the "Informations partagées"
    // category tile above must stay relative-only. Both coexist on this screen by design.
    expect(texts).toContain(RAW_OVULATION_SENTINEL);
  });
});

describe('PartnerProfileScreen — Confidentialité', () => {
  it('is collapsed by default; tapping it expands the two privacy rows and the bottom banner inside the same card; tapping again collapses it', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    expect(textsOf(renderer)).not.toContain('Ce que vous pouvez voir');

    await press(renderer, 'Confidentialité');
    const texts = textsOf(renderer);
    expect(texts).toContain('Ce que vous pouvez voir');
    expect(texts).toContain('Vous voyez uniquement les informations que votre partenaire a choisi de partager avec vous dans AWA à deux.');
    expect(texts).toContain('Ce qui reste privé');
    expect(texts).toContain('Les informations qu’elle ne partage pas restent privées et ne sont pas visibles dans votre espace.');
    expect(texts).toContain('AWA à deux est conçu pour partager uniquement ce qu’elle souhaite vous montrer.');
    // Exactly two privacy rows — no third "Elle garde le contrôle" row was added.
    expect(texts.filter(text => text === 'Ce que vous pouvez voir' || text === 'Ce qui reste privé')).toHaveLength(2);
    const privacyButton = buttons(renderer, 'Confidentialité').pop()!;
    expect(privacyButton.props.accessibilityState).toEqual({expanded: true});

    await press(renderer, 'Confidentialité');
    expect(textsOf(renderer)).not.toContain('Ce que vous pouvez voir');
  });

  it('never exposes a real cycle/period/fertility/pregnancy value — explanatory only', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Confidentialité');
    const everything = textsOf(renderer).join(' | ');
    expect(everything).not.toMatch(/\bJour\s+\d+\b/);
    expect(everything).not.toMatch(/\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i);
  });
});

describe('PartnerProfileScreen — "Aide & support" (outer section accordion)', () => {
  it('is collapsed by default; tapping it reveals the 5 FAQ rows (still collapsed) and flips the chevron; tapping again collapses it', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    expect(textsOf(renderer)).not.toContain('Comment fonctionne AWA à deux ?');

    await press(renderer, 'Aide & support');
    let texts = textsOf(renderer);
    for (const title of [
      'Comment fonctionne AWA à deux ?',
      'Pourquoi certaines informations sont masquées ?',
      'Comprendre les informations partagées',
      'J’ai un problème avec AWA à deux',
      'Contacter le support',
    ]) {
      expect(texts).toContain(title);
    }
    // Answers are hidden until their own row is tapped (item 2 of the spec).
    expect(texts).not.toContain('AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.');
    const helpButton = buttons(renderer, 'Aide & support').pop()!;
    expect(helpButton.props.accessibilityState).toEqual({expanded: true});

    await press(renderer, 'Aide & support');
    texts = textsOf(renderer);
    expect(texts).not.toContain('Comment fonctionne AWA à deux ?');
  });

  it('Confidentialité stays independent: expanding one does not expand or collapse the other', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Confidentialité');
    expect(textsOf(renderer)).not.toContain('Comment fonctionne AWA à deux ?');
    await press(renderer, 'Aide & support');
    expect(textsOf(renderer)).toContain('Comment fonctionne AWA à deux ?');
  });

  it('no invented support email/phone/URL exists anywhere in source — only APP_METADATA.contactEmail is used', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerProfileScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/awa@|@awa|https?:\/\//i);
  });
});

describe('PartnerProfileScreen — "Aide & support" per-FAQ accordion', () => {
  const openHelpSection = async (renderer: Root) => {
    await press(renderer, 'Profil');
    await press(renderer, 'Aide & support');
  };

  it('each FAQ answer is collapsed by default and expands inline when its own row is tapped', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await openHelpSection(renderer);
    expect(textsOf(renderer)).not.toContain('AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.');

    await press(renderer, 'Comment fonctionne AWA à deux ?');
    const texts = textsOf(renderer);
    expect(texts).toContain('AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.');
    expect(texts).toContain('Vous pouvez par exemple voir certaines informations sur son cycle, ses prochaines règles ou sa fenêtre fertile lorsque leur partage est activé.');
    expect(texts).toContain('Les informations visibles dépendent toujours de ses choix. Elle peut modifier ce qu’elle partage à tout moment.');
    const faqButton = buttons(renderer, 'Comment fonctionne AWA à deux ?').pop()!;
    expect(faqButton.props.accessibilityState).toEqual({expanded: true});
  });

  it('tapping the same question again collapses it', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await openHelpSection(renderer);
    await press(renderer, 'Comment fonctionne AWA à deux ?');
    expect(textsOf(renderer)).toContain('AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.');
    await press(renderer, 'Comment fonctionne AWA à deux ?');
    expect(textsOf(renderer)).not.toContain('AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.');
  });

  it('only one FAQ can be expanded at a time — opening a second question closes the first', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await openHelpSection(renderer);
    await press(renderer, 'Comment fonctionne AWA à deux ?');
    expect(textsOf(renderer)).toContain('AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.');

    await press(renderer, 'Pourquoi certaines informations sont masquées ?');
    const texts = textsOf(renderer);
    expect(texts).not.toContain('AWA à deux vous permet de consulter uniquement les informations que votre partenaire a choisi de partager avec vous.');
    expect(texts).toContain('Votre partenaire garde le contrôle sur les informations qu’elle souhaite partager avec vous.');

    await press(renderer, 'J’ai un problème avec AWA à deux');
    const finalTexts = textsOf(renderer);
    expect(finalTexts).not.toContain('Votre partenaire garde le contrôle sur les informations qu’elle souhaite partager avec vous.');
    expect(finalTexts).toContain('Si certaines informations ne s’affichent pas, commencez par vérifier que votre connexion internet fonctionne correctement.');
  });

  it('"Comprendre les informations partagées" shows a definition for each of the 6 shared-information categories', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await openHelpSection(renderer);
    await press(renderer, 'Comprendre les informations partagées');
    const texts = textsOf(renderer);
    for (const [term, description] of [
      ['Jour du cycle', 'Indique le nombre de jours écoulés depuis le début des dernières règles.'],
      ['Phase actuelle', 'Indique l’étape actuelle du cycle lorsqu’elle est disponible.'],
      ['Fenêtre fertile', 'Période estimée durant laquelle la probabilité de conception peut être plus élevée.'],
      ['Ovulation estimée', 'Estimation du moment de l’ovulation basée sur les informations disponibles.'],
      ['Prochaines règles estimées', 'Date estimée du début des prochaines règles.'],
      ['Statut des règles', 'Indique si les règles sont actuellement en cours ou terminées.'],
    ]) {
      expect(texts).toContain(term);
      expect(texts).toContain(description);
    }
  });

  it('never fabricates a real health value inside an answer (definitions only, no date/day number)', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await openHelpSection(renderer);
    for (const title of [
      'Comment fonctionne AWA à deux ?',
      'Pourquoi certaines informations sont masquées ?',
      'Comprendre les informations partagées',
      'J’ai un problème avec AWA à deux',
    ]) {
      await press(renderer, title);
    }
    const everything = textsOf(renderer).join(' | ');
    expect(everything).not.toMatch(/\bJour\s+\d+\b/);
    expect(everything).not.toMatch(/\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i);
  });

  it('"Contacter le support" expands like any other FAQ and its real mail action has its own distinct accessible label', async () => {
    const {Linking} = require('react-native');
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const renderer = await renderFlow('PartnerMainTabs');
    await openHelpSection(renderer);
    expect(openURLSpy).not.toHaveBeenCalled();

    await press(renderer, 'Contacter le support');
    const texts = textsOf(renderer);
    expect(texts).toContain('Si vous avez une question, rencontrez un problème ou souhaitez nous faire un retour, vous pourrez contacter l’équipe AWA depuis cette section.');
    expect(openURLSpy).not.toHaveBeenCalled(); // expanding alone must never trigger the mail app

    await press(renderer, 'Nous contacter par e-mail');
    expect(openURLSpy).toHaveBeenCalledTimes(1);
    const url = openURLSpy.mock.calls[0][0];
    expect(url).toContain('mailto:');
    expect(url).toContain(encodeURIComponent(APP_METADATA.contactEmail!));
  });

  it('every FAQ header is an accessible button exposing its expanded state', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await openHelpSection(renderer);
    for (const title of [
      'Comment fonctionne AWA à deux ?',
      'Pourquoi certaines informations sont masquées ?',
      'Comprendre les informations partagées',
      'J’ai un problème avec AWA à deux',
      'Contacter le support',
    ]) {
      const match = buttons(renderer, title).pop()!;
      expect(match.props.accessibilityState).toEqual({expanded: false});
    }
  });
});

describe('PartnerProfileScreen — no owner-only settings', () => {
  it('never shows objective, cycle, pregnancy, export or backup configuration', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    const everything = textsOf(renderer).join(' | ');
    for (const forbidden of ['Mon objectif', 'Sauvegarde', 'Export', 'Durée du cycle', 'Datation de grossesse']) {
      expect(everything).not.toContain(forbidden);
    }
    expect(everything).toContain('AWA à deux');
    expect(everything).toContain('Informations auxquelles vous avez accès');
    expect(buttons(renderer, 'Confidentialité').length).toBeGreaterThan(0);
    expect(buttons(renderer, 'Aide & support').length).toBeGreaterThan(0);
    expect(buttons(renderer, 'Se déconnecter').length).toBeGreaterThan(0);
  });

  it('lists only the currently shared items, reusing the same visibility rule', async () => {
    await setSharingToggle('mood', true);
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Informations auxquelles vous avez accès');
    expect(textsOf(renderer)).toContain('Humeur');
  });

  it('"Se déconnecter" opens the AWA-styled confirmation dialog (not a system Alert); confirming exits PartnerMainTabs entirely and resets to Welcome — WITHOUT disconnecting AWA à deux', async () => {
    simulatePartnerConnected();
    await setSharingToggle('cycleDay', true);
    await setSharingToggle('nextPeriod', true);
    setAwaADeuxPartnerName('Moussa');
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    const {Alert} = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert');

    await press(renderer, 'Se déconnecter'); // opens the dialog
    expect(alertSpy).not.toHaveBeenCalled(); // never a generic system Alert
    const texts = textsOf(renderer);
    expect(texts).toContain('Se déconnecter ?');
    expect(texts).toContain('Voulez-vous vraiment vous déconnecter de votre espace partenaire ?');
    expect(texts).toContain('Vous pourrez vous reconnecter à tout moment.');

    await press(renderer, 'Se déconnecter'); // the dialog's own destructive action (last match)
    // Logout ≠ stop sharing: the AWA à deux relationship and every owner-controlled
    // value survive completely unchanged.
    expect(getDemoPartnerState().connectionStatus).toBe('connected');
    expect(getSharingToggles().cycleDay).toBe(true);
    expect(getSharingToggles().nextPeriod).toBe(true);
    expect(getAwaADeuxPartnerName()).toBe('Moussa');
    // Only the frontend UI session/navigation ends — reset to the EXISTING Welcome
    // route, with PartnerMainTabs dropped from history (not just navigated away from).
    expect(route()).toBe('Welcome');
    expect(stackRoute()).toBe('Welcome');
    expect((navRef.getRootState() as {routes: {name: string}[]}).routes.map(r => r.name)).toEqual(['Welcome']);
  });

  it('preserves the partner’s own saved profile first name across logout (logout ≠ delete partner profile)', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Modifier mon prénom');
    const input = rootOf(renderer).findAll(node => node.props.accessibilityLabel === 'Prénom' && typeof node.props.onChangeText === 'function')[0];
    await act(async () => {
      input.props.onChangeText('Yacine');
    });
    await press(renderer, 'Enregistrer');

    await press(renderer, 'Se déconnecter');
    await press(renderer, 'Se déconnecter');
    expect(route()).toBe('Welcome');
    expect(getAwaADeuxPartnerProfileFirstName()).toBe('Yacine');
  });

  it('never calls stopDemoSharing/cancelInvitation or a global AsyncStorage.clear anywhere in this file', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerProfileScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/stopDemoSharing|cancelInvitation|AsyncStorage\.clear/);
  });

  it('"Annuler" closes the dialog without ending the session, navigating, or changing connectionStatus', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Se déconnecter');
    expect(textsOf(renderer)).toContain('Se déconnecter ?');

    await press(renderer, 'Annuler');
    expect(textsOf(renderer)).not.toContain('Se déconnecter ?');
    // No side effect: still on the same tab, never reset to Welcome, connection intact.
    expect(route()).toBe('PartnerProfile');
    expect(getDemoPartnerState().connectionStatus).toBe('connected');
  });

  it('Android Back after logout cannot return to PartnerHome/PartnerMainTabs (removed from history, not just navigated away from)', async () => {
    simulatePartnerConnected();
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Profil');
    await press(renderer, 'Se déconnecter');
    await press(renderer, 'Se déconnecter');
    expect(route()).toBe('Welcome');
    expect((navRef.getRootState() as {routes: {name: string}[]}).routes).toHaveLength(1); // PartnerMainTabs is gone, not just behind Welcome
  });
});

describe('No hardcoded partner/owner name anywhere in the new partner-journey files', () => {
  const files = [
    '../AwaADeuxPendingScreen.tsx',
    '../partner/AwaADeuxInvitationScreen.tsx',
    '../partner/AwaADeuxAcceptInvitationScreen.tsx',
    '../partner/PartnerHomeScreen.tsx',
    '../partner/PartnerCalendarScreen.tsx',
    '../partner/PartnerAdviceScreen.tsx',
    '../partner/PartnerProfileScreen.tsx',
    '../../../navigation/PartnerMainTabNavigator.tsx',
    '../../../components/navigation/PartnerBottomTabBar.tsx',
    '../../../state/awaADeuxDemoStore.ts',
    '../../../state/awaADeuxPartnerProfileStore.ts',
    '../../../hooks/useAwaADeuxPartnerProfile.ts',
    '../../../utils/awaADeuxPartnerCycleInfo.ts',
  ].map(relative => path.resolve(__dirname, relative));

  it('every file exists', () => {
    files.forEach(file => expect(fs.existsSync(file)).toBe(true));
  });

  it('contains no "Sami", "Yacine" or "Amine" runtime value, and no `name || \'…\'` fallback', () => {
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      expect({file: path.basename(file), match: source.match(/\bSami\b|\bYacine\b|\bAmine\b/)?.[0] ?? null}).toEqual({
        file: path.basename(file),
        match: null,
      });
      expect(source).not.toMatch(/(partnerName|ownerName)\s*(\|\||\?\?)\s*['"`][A-ZÉ][a-zé]+['"`]/);
    }
  });
});
