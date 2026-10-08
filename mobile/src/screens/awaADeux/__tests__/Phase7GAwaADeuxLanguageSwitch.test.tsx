import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput, Switch} from 'react-native';
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
import AwaADeuxInvitationScreen from '../partner/AwaADeuxInvitationScreen';
import AwaADeuxAcceptInvitationScreen from '../partner/AwaADeuxAcceptInvitationScreen';
import PartnerMainTabNavigator from '../../../navigation/PartnerMainTabNavigator';

import {clearAwaADeuxPartnerName, getAwaADeuxPartnerName, setAwaADeuxPartnerName} from '../../../state/awaADeuxPartnerStore';
import {clearAwaADeuxPartnerProfileFirstName} from '../../../state/awaADeuxPartnerProfileStore';
import {getDemoPartnerState, simulateInvitationSent, stopDemoSharing} from '../../../state/awaADeuxDemoStore';
import {DEFAULT_SHARING_TOGGLES, SHARING_KEYS, setSharingToggle} from '../../../state/awaADeuxSharingStore';
import {setActiveObjective, setCyclePreferences, setFirstName, getRecordedPeriodHistory} from '../../../state/onboardingPreferences';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import {computePartnerCycleInfo} from '../../../utils/awaADeuxPartnerCycleInfo';
import {capitalize} from '../../../utils/cycleMath';
import i18n from '../../../i18n';

// PHASE 7G — the dedicated runtime FR→EN language-switch suite the Phase 7G final
// report flagged as missing. Mirrors the established project pattern (e.g.
// Phase7FPrayerHijriQadaaLanguageSwitch.test.tsx, Phase7F1WeekDaysAndNifasLanguageSwitch
// .test.tsx): representative integration assertions proving the AWA à deux owner and
// partner surfaces actually consume the translation layer and respond to a live
// i18n.changeLanguage() call, while every technical/business value (visibility,
// cycle-info, period history, pairing code, connection state, the dynamic partner name
// itself) stays byte-identical across the switch — only presentation changes.
//
// Representative, not exhaustive: this does not re-assert every one of the ~355 migrated
// strings (already covered, in French, by the existing targeted suites) — it proves each
// surface's translation wiring and the stated integrity invariants.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string =>
  [node.props.children].flat(Infinity).map(child => (typeof child === 'string' ? child : '')).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);

async function settle() {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

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
const switchLanguage = async (language: 'fr' | 'en' | 'es') => {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
  await settle();
};
/** Grabs the only visible TextInput and types into it — used for "Prénom du partenaire" /
 * "Partner's first name" regardless of which language is currently active. */
const enterPartnerName = async (renderer: ReactTestRenderer.ReactTestRenderer, name: string) => {
  const input = renderer.root.findAllByType(TextInput).pop()!;
  await act(async () => {
    input.props.onChangeText(name);
  });
};

beforeEach(async () => {
  await resetAppLanguageForTests();
  // PHASE 7M: the app's default language is now English (not French) — this
  // file's "French:" tests were written against the old French default and
  // never set a language explicitly (every "English:" test already does).
  // Pinning French here preserves every test's original intent.
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  jest.restoreAllMocks();
  stopDemoSharing();
  await clearAwaADeuxPartnerName();
  await clearAwaADeuxPartnerProfileFirstName();
  await AsyncStorage.clear();
  for (const key of SHARING_KEYS) {await setSharingToggle(key, DEFAULT_SHARING_TOGGLES[key]);}
  await setActiveObjective('cycle');
  setFirstName('');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST 1/2 — owner onboarding flow (Intro → Partner name → Partner view → Benefits → Sharing → Pairing) renders localized copy at each step', () => {
  it.each(['fr', 'en'] as const)('%s: representative title/CTA copy at every step, computed from the live translation layer', async language => {
    if (language === 'en') {await setAppLanguage('en'); await i18n.changeLanguage('en');}
    const renderer = await renderFlow('AwaADeuxIntro');
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.intro.subtitle'));

    await press(renderer, i18n.t('awaADeux.intro.discoverAccessibility'));
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerName.title'));

    await enterPartnerName(renderer, 'Yacine');
    await press(renderer, i18n.t('common.continue'));
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerView.caption'));

    await press(renderer, i18n.t('common.continue'));
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.benefits.title'));

    await press(renderer, i18n.t('common.continue'));
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.sharing.title'));

    await press(renderer, i18n.t('common.continue'));
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.pairing.title'));
  });
});

describe('TEST 3/4 — AwaADeuxPendingScreen renders localized status/resend/cancel copy', () => {
  it.each(['fr', 'en'] as const)('%s: status title, resend and cancel buttons translate', async language => {
    if (language === 'en') {await setAppLanguage('en'); await i18n.changeLanguage('en');}
    const renderer = await renderFlow('AwaADeuxPending');
    const texts = textsOf(renderer);
    expect(texts).toContain(i18n.t('awaADeux.pending.statusTitle'));
    expect(buttons(renderer, i18n.t('awaADeux.pending.resend')).length).toBeGreaterThan(0);
    expect(buttons(renderer, i18n.t('awaADeux.pending.cancel')).length).toBeGreaterThan(0);
  });
});

describe('TEST 5/6 — AwaADeuxPartnerConnectedScreen renders localized title/since/shared-info copy', () => {
  it.each(['fr', 'en'] as const)('%s: title, since-text and shared-info card translate', async language => {
    if (language === 'en') {await setAppLanguage('en'); await i18n.changeLanguage('en');}
    const renderer = await renderFlow('AwaADeuxPartnerConnected');
    const texts = textsOf(renderer);
    expect(texts).toContain(i18n.t('awaADeux.connected.title'));
    expect(texts).toContain(i18n.t('awaADeux.connected.since'));
    expect(texts).toContain(i18n.t('awaADeux.connected.sharedInfoTitle'));
  });
});

describe('TEST 7/8 — partner Invitation → AcceptInvitation renders localized copy', () => {
  it.each(['fr', 'en'] as const)('%s: invitation card body and accept/later buttons translate', async language => {
    if (language === 'en') {await setAppLanguage('en'); await i18n.changeLanguage('en');}
    const renderer = await renderFlow('AwaADeuxInvitation');
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerSide.invitation.cardBody'));

    await press(renderer, i18n.t('common.continue'));
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerSide.accept.titleAccent'));
    expect(buttons(renderer, i18n.t('awaADeux.partnerSide.accept.acceptCta')).length).toBeGreaterThan(0);
    expect(buttons(renderer, i18n.t('awaADeux.partnerSide.accept.later')).length).toBeGreaterThan(0);
  });
});

describe('TEST 9/10 — PartnerMainTabs tab labels and Home/Calendar/Advice/Profile render localized copy', () => {
  it.each(['fr', 'en'] as const)('%s: all four tab labels and one representative string per screen translate', async language => {
    if (language === 'en') {await setAppLanguage('en'); await i18n.changeLanguage('en');}
    const renderer = await renderFlow('PartnerMainTabs');

    const home = i18n.t('navigation.home');
    const calendar = i18n.t('navigation.calendar');
    const advice = i18n.t('awaADeux.partnerSide.tabs.advice');
    const profile = i18n.t('navigation.profile');
    for (const label of [home, calendar, advice, profile]) {
      expect(buttons(renderer, label).length).toBeGreaterThan(0);
    }
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerSide.home.greeting'));

    await press(renderer, calendar);
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerSide.calendar.title'));

    await press(renderer, advice);
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerSide.advice.title'));

    await press(renderer, profile);
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.partnerSide.profile.title'));
  });
});

describe('TEST 11 — a runtime FR → EN switch updates AwaADeuxIntroScreen without remounting', () => {
  it('the mounted instance re-renders in English after changeLanguage, same instance', async () => {
    const renderer = await renderFlow('AwaADeuxIntro');
    expect(textsOf(renderer)).toContain('Avancez ensemble,\nà votre rythme.');

    await switchLanguage('en');

    expect(textsOf(renderer)).toContain('Move forward together,\nat your own pace.');
    expect(textsOf(renderer)).not.toContain('Avancez ensemble,\nà votre rythme.');
  });
});

describe('TEST 12 — a runtime FR → EN switch updates PartnerHomeScreen (inside PartnerMainTabs) without remounting', () => {
  it('the mounted instance re-renders in English after changeLanguage, same instance', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    expect(textsOf(renderer)).toContain('Tu es là pour elle 💜');

    await switchLanguage('en');

    expect(textsOf(renderer)).toContain('You’re here for her 💜');
    expect(textsOf(renderer)).not.toContain('Tu es là pour elle 💜');
  });
});

describe('TEST 13 — Partner Calendar weekday row: FR → EN runtime switch via localizedWeekDays()', () => {
  it('Lun/Mar/Mer/Jeu/Ven/Sam/Dim become Mon/Tue/Wed/Thu/Fri/Sat/Sun on the same mounted instance; no raw WEEK_DAYS export is used', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Calendrier');
    expect(textsOf(renderer)).toEqual(expect.arrayContaining(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']));

    await switchLanguage('en');

    const texts = textsOf(renderer);
    expect(texts).toEqual(expect.arrayContaining(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']));
    expect(texts).not.toContain('Lun');
    expect(texts).toContain('Calendar');
    expect(texts).not.toContain('Calendrier');

    const source = fs.readFileSync(path.resolve(__dirname, '../partner/PartnerCalendarScreen.tsx'), 'utf8');
    expect(source).toContain('localizedWeekDays()');
    // The raw WEEK_DAYS export is never imported or rendered here — only mentioned once in a
    // comment explaining the Monday-first ordering, which localizedWeekDays() itself preserves.
    expect(source).not.toMatch(/\{[^}]*\bWEEK_DAYS\b[^}]*\}\s*from/); // not imported
    expect(source).not.toMatch(/[^a-zA-Z]WEEK_DAYS\.(map|forEach)/); // not rendered
  });
});

describe('TEST 14 — Partner Calendar month label localizes, and the navigated-to month position survives the switch', () => {
  it('pressing "Mois suivant" then switching to English still shows the SAME (next) month, now in English', async () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentFr = capitalize(new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(now));
    const nextFr = capitalize(new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(nextMonth));
    const nextEn = capitalize(new Intl.DateTimeFormat('en-US', {month: 'long', year: 'numeric'}).format(nextMonth));

    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Calendrier');
    expect(textsOf(renderer)).toContain(currentFr);

    await press(renderer, 'Mois suivant');
    expect(textsOf(renderer)).toContain(nextFr);

    await switchLanguage('en');

    // Same calendar position (one month ahead of "today"), only the wording translated —
    // the switch never resets monthCursor back to the current month.
    expect(textsOf(renderer)).toContain(nextEn);
    expect(textsOf(renderer)).not.toContain(nextFr);
  });
});

// SPANISH CALENDAR / DATE LOCALIZATION — extends TEST 13/14's FR -> EN
// pattern one step further to Spanish, since both the weekday row and the
// month label used to silently fall through to French for 'es' (the shared
// locale ternary only ever distinguished 'en' from everything else).
describe('TEST 13b — Partner Calendar weekday row: FR -> ES runtime switch via localizedWeekDays()', () => {
  it('Lun/Mar/Mer/Jeu/Ven/Sam/Dim become Lun/Mar/Mié/Jue/Vie/Sáb/Dom on the same mounted instance, never staying French', async () => {
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Calendrier');
    expect(textsOf(renderer)).toEqual(expect.arrayContaining(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']));

    await switchLanguage('es');

    const texts = textsOf(renderer);
    expect(texts).toEqual(expect.arrayContaining(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']));
    expect(texts).not.toContain('Mer');
  });
});

describe('TEST 14b — Partner Calendar month label localizes to Spanish, and the navigated-to month position survives the switch', () => {
  it('pressing "Mois suivant" then switching to Spanish still shows the SAME (next) month, now in Spanish, never French', async () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextFr = capitalize(new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(nextMonth));
    const nextEs = capitalize(new Intl.DateTimeFormat('es-ES', {month: 'long', year: 'numeric'}).format(nextMonth));

    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Calendrier');
    await press(renderer, 'Mois suivant');
    expect(textsOf(renderer)).toContain(nextFr);

    await switchLanguage('es');

    expect(textsOf(renderer)).toContain(nextEs);
    expect(textsOf(renderer)).not.toContain(nextFr);
  });
});

describe('TEST 15 — dynamic partner name integrity: "Yacine" is never translated or mutated, only the surrounding sentence changes', () => {
  it('Pairing screen: the exact name "Yacine" renders unchanged in both languages while the description sentence translates', async () => {
    setAwaADeuxPartnerName('Yacine');
    const renderer = await renderFlow('AwaADeuxPairing');
    expect(textsOf(renderer)).toContain(i18n.t('awaADeux.pairing.description', {partner: 'Yacine'}));
    expect(textsOf(renderer).some(text => text.includes('Yacine'))).toBe(true);

    await switchLanguage('en');

    const texts = textsOf(renderer);
    expect(texts.some(text => text.includes('Yacine'))).toBe(true);
    expect(texts).toContain(i18n.t('awaADeux.pairing.description', {partner: 'Yacine'}));
    expect(texts).not.toContain(i18n.t('awaADeux.pairing.description', {partner: 'Yacine', lng: 'fr'}));
    expect(getAwaADeuxPartnerName()).toBe('Yacine'); // store value itself never mutated
  });
});

describe('TEST 16 — representative technical/data state is unchanged across a FR → EN switch', () => {
  it('partner name, connection status, invitation email, period history, visibility result and cycle-info technical fields all survive the switch', async () => {
    setAwaADeuxPartnerName('Yacine');
    simulateInvitationSent('yacine@exemple.fr');
    const today = new Date(2026, 9, 1, 12);
    const lastPeriodStart = new Date(2026, 8, 27, 12); // cycle day 5, same recipe as the owner's own confirmed-data tests
    setCyclePreferences({lastPeriodStart, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});

    const before = {
      partnerName: getAwaADeuxPartnerName(),
      connectionStatus: getDemoPartnerState().connectionStatus,
      partnerEmail: getDemoPartnerState().partnerEmail,
      periodHistory: getRecordedPeriodHistory(),
      visibility: computePartnerVisibility(DEFAULT_SHARING_TOGGLES, {isPregnant: false}),
      cycleInfo: computePartnerCycleInfo(today),
    };

    await i18n.changeLanguage('en');
    await setAppLanguage('en');

    const after = {
      partnerName: getAwaADeuxPartnerName(),
      connectionStatus: getDemoPartnerState().connectionStatus,
      partnerEmail: getDemoPartnerState().partnerEmail,
      periodHistory: getRecordedPeriodHistory(),
      visibility: computePartnerVisibility(DEFAULT_SHARING_TOGGLES, {isPregnant: false}),
      cycleInfo: computePartnerCycleInfo(today),
    };

    expect(after.partnerName).toBe(before.partnerName);
    expect(after.connectionStatus).toBe(before.connectionStatus);
    expect(after.partnerEmail).toBe(before.partnerEmail);
    expect(after.periodHistory).toEqual(before.periodHistory);
    expect(after.visibility).toEqual(before.visibility);
    // Stable technical cycle fields — never the pre-formatted, intentionally locale-aware
    // display strings (nextPeriod/fertileWindow/ovulation), see TEST 18.
    expect(after.cycleInfo.cycleDay).toBe(before.cycleInfo.cycleDay);
    expect(after.cycleInfo.cycleLength).toBe(before.cycleInfo.cycleLength);
    expect(after.cycleInfo.phase).toBe(before.cycleInfo.phase);
    expect(after.cycleInfo.nextPeriodDate).toEqual(before.cycleInfo.nextPeriodDate);
    expect(after.cycleInfo.fertileWindowRange).toEqual(before.cycleInfo.fertileWindowRange);
    expect(after.cycleInfo.ovulationDate).toEqual(before.cycleInfo.ovulationDate);
  });
});

describe('TEST 17 — computePartnerVisibility privacy integrity across the language switch', () => {
  it('identical technical visibility result for representative toggle sets, before and after changeLanguage (deep equality, not translated labels)', async () => {
    const allOn: typeof DEFAULT_SHARING_TOGGLES = Object.fromEntries(SHARING_KEYS.map(key => [key, true])) as never;
    const allOff: typeof DEFAULT_SHARING_TOGGLES = Object.fromEntries(SHARING_KEYS.map(key => [key, false])) as never;

    const beforeDefault = computePartnerVisibility(DEFAULT_SHARING_TOGGLES, {isPregnant: false});
    const beforeAllOn = computePartnerVisibility(allOn, {isPregnant: true});
    const beforeAllOff = computePartnerVisibility(allOff, {isPregnant: false});

    await i18n.changeLanguage('en');
    await setAppLanguage('en');

    expect(computePartnerVisibility(DEFAULT_SHARING_TOGGLES, {isPregnant: false})).toEqual(beforeDefault);
    expect(computePartnerVisibility(allOn, {isPregnant: true})).toEqual(beforeAllOn);
    expect(computePartnerVisibility(allOff, {isPregnant: false})).toEqual(beforeAllOff);
  });
});

describe('TEST 18 — computePartnerCycleInfo cycle integrity across the language switch', () => {
  it('stable technical fields are byte-identical; the pre-formatted display strings are intentionally locale-aware, not a bug', async () => {
    const today = new Date(2026, 9, 1, 12);
    const lastPeriodStart = new Date(2026, 8, 27, 12);
    setCyclePreferences({lastPeriodStart, periodDuration: 5, cycleDuration: 28, regularity: 'yes'});

    const before = computePartnerCycleInfo(today);
    expect(before.cycleDay).not.toBeNull(); // sanity: this recipe does produce real 'exact' data

    await i18n.changeLanguage('en');
    await setAppLanguage('en');
    const after = computePartnerCycleInfo(today);

    expect(after.cycleDay).toBe(before.cycleDay);
    expect(after.cycleLength).toBe(before.cycleLength);
    expect(after.cycleProgress).toBe(before.cycleProgress);
    expect(after.phase).toBe(before.phase);
    expect(after.nextPeriodDate).toEqual(before.nextPeriodDate);
    expect(after.fertileWindowRange).toEqual(before.fertileWindowRange);
    expect(after.ovulationDate).toEqual(before.ovulationDate);

    // The pre-formatted strings DO change (formatShortDate reads getAppLanguage()) — this is
    // the established, already-verified Phase 7E/7F locale-aware date formatting, not a gap.
    expect(after.nextPeriod).not.toBe(before.nextPeriod);
    expect(after.fertileWindow).not.toBe(before.fertileWindow);
    expect(after.ovulation).not.toBe(before.ovulation);
  });
});

describe('TEST 19 — period-history integrity across fr → en → fr', () => {
  it('getRecordedPeriodHistory() returns the same records regardless of the current app language', async () => {
    setCyclePreferences({lastPeriodStart: new Date(2026, 8, 27, 12), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
    const historyFr = getRecordedPeriodHistory();

    await i18n.changeLanguage('en');
    await setAppLanguage('en');
    const historyEn = getRecordedPeriodHistory();

    await i18n.changeLanguage('fr');
    await setAppLanguage('fr');
    const historyFrAgain = getRecordedPeriodHistory();

    expect(historyEn).toEqual(historyFr);
    expect(historyFrAgain).toEqual(historyFr);
  });
});

describe('TEST 20 — read-only guarantee holds in English too', () => {
  it('no Switch and no unexpected editable control anywhere across PartnerMainTabs\' four tabs, in English', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = await renderFlow('PartnerMainTabs');
    await press(renderer, 'Calendar');
    await press(renderer, 'Advice');
    await press(renderer, 'Profile');

    expect(renderer.root.findAllByType(Switch)).toHaveLength(0);
    // The only TextInput anywhere in the partner space is the partner's own editable first
    // name (PartnerProfileScreen's pre-existing "Prénom" field) — never anything else.
    const inputs = renderer.root.findAllByType(TextInput);
    expect(inputs.every(node => node.props.accessibilityLabel === i18n.t('awaADeux.partnerSide.profile.editNameModal.label'))).toBe(true);
  });
});

describe('TEST 21 — accessibility copy for Partner Calendar navigation and Pairing\'s email field follows the app language', () => {
  it('French then English accessibility labels, representative of the dynamic accessibility copy added in Phase 7G', async () => {
    const calendarRenderer = await renderFlow('PartnerMainTabs');
    await press(calendarRenderer, 'Calendrier');
    expect(calendarRenderer.root.findAll(node => node.props.accessibilityLabel === 'Mois précédent').length).toBeGreaterThan(0);
    expect(calendarRenderer.root.findAll(node => node.props.accessibilityLabel === 'Mois suivant').length).toBeGreaterThan(0);

    await switchLanguage('en');
    expect(calendarRenderer.root.findAll(node => node.props.accessibilityLabel === 'Previous month').length).toBeGreaterThan(0);
    expect(calendarRenderer.root.findAll(node => node.props.accessibilityLabel === 'Next month').length).toBeGreaterThan(0);
    expect(calendarRenderer.root.findAll(node => node.props.accessibilityLabel === 'Mois précédent')).toHaveLength(0);

    await i18n.changeLanguage('fr');
    await setAppLanguage('fr');
    const pairingRenderer = await renderFlow('AwaADeuxPairing');
    expect(pairingRenderer.root.findAll(node => node.props.accessibilityLabel === 'Adresse e-mail de votre partenaire').length).toBeGreaterThan(0);

    await switchLanguage('en');
    expect(pairingRenderer.root.findAll(node => node.props.accessibilityLabel === 'Partner’s email address').length).toBeGreaterThan(0);
  });
});
