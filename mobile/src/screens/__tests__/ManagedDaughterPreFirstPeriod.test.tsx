import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import CycleHomeScreen from '../CycleHomeScreen';
import CalendarScreen from '../CalendarScreen';
import ProfileScreen from '../ProfileScreen';
import {
  getCyclePreferences,
  hydrateCyclePreferences,
  getHasConfirmedCycleData,
  getHasConfirmedCycleDuration,
  setCyclePreferences,
} from '../../state/onboardingPreferences';
import {addManagedProfile, getManagedProfiles, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {recordManagedProfileFirstPeriod} from '../../state/managedProfileCycleSeed';
import {computeCyclePredictionStatus} from '../../utils/cycleMath';
import i18n from '../../i18n';
import {setAppLanguage} from '../../state/themePreferences';

// Dedicated PRE-FIRST-PERIOD dashboard/calendar state for managed daughter
// profiles who answered "Non, pas encore" to "A-t-elle déjà eu ses premières
// règles ?". See CycleHomeScreen.tsx's isPreFirstPeriodDaughter,
// CalendarScreen.tsx's own copy of the same gate, and
// managedProfileCycleSeed.ts's recordManagedProfileFirstPeriod.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderScreen(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">{() => element}</Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}
const renderDashboard = () => renderScreen(<CycleHomeScreen navigation={{navigate: jest.fn()} as never} route={{key: 'd', name: 'CycleHome'}} />);
const renderCalendar = () => renderScreen(<CalendarScreen navigation={{navigate: jest.fn()} as never} route={{key: 'c', name: 'Calendar'}} />);
const renderProfile = () => renderScreen(<ProfileScreen navigation={{navigate: jest.fn()} as never} route={{key: 'p', name: 'Profile'}} />);

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

const pressByLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    renderer.root.find(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function').props.onPress();
  });
};
const hasLabel = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(n => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function').length > 0;
const confirmSheetForToday = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
  await act(async () => {
    renderer.root
      .find(n => typeof n.props.onPress === 'function' && n.findAllByType(Text).some(t => String(t.props.children).includes('Oui, aujourd')))
      .props.onPress();
  });
};

beforeEach(async () => {
  jest.useFakeTimers();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  // The owner's own cycle stays fully confirmed and untouched throughout.
  setCyclePreferences({lastPeriodStart: new Date(2026, 8, 1), periodDuration: 5, cycleDuration: 28, regularity: 'yes'});
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
  jest.useRealTimers();
});

describe('Dashboard — pre-first-period daughter state', () => {
  const addNoor = () => addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2014-05-01', hasHadFirstPeriod: false});

  it('shows the dedicated state (real firstName, no cycle-derived content, journal kept, Vie intime excluded, educational card, CTA)', async () => {
    const noor = await addNoor();
    await setActiveProfileId(noor.id);
    const renderer = await renderDashboard();
    const texts = textsOf(renderer);

    expect(texts.some(text => text.includes('Noor'))).toBe(true);
    expect(texts).toContain('Profil de ma fille');

    // No cycle day / phase / next period / fertile window / ovulation / cycle
    // duration — nothing cycle-derived, not even an honest "Non renseignée"
    // placeholder tile (the whole section is hidden, not disabled).
    expect(texts).not.toContain('Durée habituelle');
    expect(texts).not.toContain('Prochaines règles');
    expect(texts).not.toContain('Fenêtre fertile');
    expect(texts).not.toContain('Ovulation prévue');
    expect(texts.some(text => /^Jour \d/.test(text))).toBe(false);

    // The pre-first-period card and CTA.
    expect(texts).toContain('Pas encore de règles enregistrées');
    expect(texts).toContain('Son suivi commencera lorsqu’elle aura ses premières règles.');
    expect(hasLabel(renderer, 'Ses premières règles ont commencé')).toBe(true);
    expect(hasLabel(renderer, 'Mes règles ont commencé')).toBe(false);

    // Journal stays available; Vie intime stays excluded (pre-existing rule, unaffected).
    expect(texts).toContain('Journal du jour');
    expect(texts).not.toContain('Vie intime');

    // Educational card.
    expect(texts).toContain('Se préparer aux premières règles');

    // No recommended articles ("Pour t'accompagner" — already removed for any
    // managed profile; must not resurrect here).
    expect(texts).not.toContain('Pour t’accompagner');
  });

  it('no fake 28-day cycle / fake period date is ever created just by viewing the dashboard', async () => {
    const noor = await addNoor();
    await setActiveProfileId(noor.id);
    await renderDashboard();
    expect(getHasConfirmedCycleData()).toBe(false);
    expect(getManagedProfiles()[0].hasHadFirstPeriod).toBe(false);
    expect(getManagedProfiles()[0].lastPeriodDate).toBeNull();
  });
});

describe('Recording the first period', () => {
  const addHanane = () => addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

  it('tapping the CTA opens the date-entry sheet with the dedicated question, and confirming saves it into HER profile-scoped history', async () => {
    const hanane = await addHanane();
    await setActiveProfileId(hanane.id);
    const renderer = await renderDashboard();

    expect(textsOf(renderer)).not.toContain('Quand ses premières règles ont-elles commencé ?');
    await pressByLabel(renderer, 'Ses premières règles ont commencé');
    expect(textsOf(renderer)).toContain('Quand ses premières règles ont-elles commencé ?');

    await confirmSheetForToday(renderer);

    // Saved belongs to HER stable profileId — the ManagedProfile record and
    // her profile-scoped cyclePreferences both updated.
    const profile = getManagedProfiles().find(item => item.id === hanane.id)!;
    expect(profile.hasHadFirstPeriod).toBe(true);
    expect(profile.lastPeriodDate).toBe(new Date().toLocaleDateString('en-CA'));
    expect(getHasConfirmedCycleData()).toBe(true); // a real period date now exists
    expect(getCyclePreferences().regularity).toBe('unknown');
    // But her habitual period/cycle DURATION was never asked at this moment —
    // must stay unconfirmed (see the dedicated describe block below).
    expect(getHasConfirmedCycleDuration()).toBe(false);
    expect(profile.periodLength).toBeNull();
    expect(profile.cycleLength).toBeNull();
  });

  it('the dashboard exits the pre-first-period state immediately and uses the real cycle-day calculation (never hardcoded "Jour 1")', async () => {
    const hanane = await addHanane();
    await setActiveProfileId(hanane.id);
    const renderer = await renderDashboard();

    await pressByLabel(renderer, 'Ses premières règles ont commencé');
    await confirmSheetForToday(renderer);

    const texts = textsOf(renderer);
    expect(texts).not.toContain('Pas encore de règles enregistrées');
    expect(texts).not.toContain('Ses premières règles ont commencé');
    // Started today → cycle day 1, via the same cycleDayFor() as everyone else.
    expect(texts.some(text => text.includes('1'))).toBe(true);
  });

  it('mother and sibling histories are completely unaffected', async () => {
    const hanane = await addHanane();
    const lina = await addManagedProfile({type: 'daughter', firstName: 'Lina', birthDate: '2012-01-01', hasHadFirstPeriod: false});
    const motherCycleBefore = getCyclePreferences();

    await setActiveProfileId(hanane.id);
    const renderer = await renderDashboard();
    await pressByLabel(renderer, 'Ses premières règles ont commencé');
    await confirmSheetForToday(renderer);

    // Lina, still pre-first-period, is untouched.
    expect(getManagedProfiles().find(item => item.id === lina.id)!.hasHadFirstPeriod).toBe(false);

    // The mother's own cyclePreferences (a separate profile-scoped storage
    // key) is untouched by writing to the daughter's.
    await setActiveProfileId(OWNER_PROFILE_ID);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    expect(getCyclePreferences().lastPeriodStart.getTime()).toBe(motherCycleBefore.lastPeriodStart.getTime());
    expect(getHasConfirmedCycleData()).toBe(true); // the owner's own, pre-existing confirmed data
    expect(getHasConfirmedCycleDuration()).toBe(true); // the owner's own duration is untouched too
  });
});

describe('Recording the first period does NOT invent a known cycleDuration/periodDuration', () => {
  const addHanane = () => addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

  it('the created period only carries the real date — periodDuration/cycleDuration/regularity stay internal placeholders, never a confirmed value', async () => {
    const hanane = await addHanane();
    await setActiveProfileId(hanane.id);
    await recordManagedProfileFirstPeriod(hanane.id, new Date());

    expect(getHasConfirmedCycleData()).toBe(true);
    expect(getHasConfirmedCycleDuration()).toBe(false);
    const profile = getManagedProfiles().find(item => item.id === hanane.id)!;
    expect(profile.periodLength).toBeNull();
    expect(profile.cycleLength).toBeNull();
    expect(profile.regularity).toBe('unknown');
  });

  it('Profile shows "Non renseignée" for Durée du cycle, Durée des règles AND Régularité du cycle', async () => {
    const hanane = await addHanane();
    await setActiveProfileId(hanane.id);
    await recordManagedProfileFirstPeriod(hanane.id, new Date());

    const texts = textsOf(await renderProfile());
    expect(texts).toContain('Durée du cycle');
    expect(texts).toContain('Durée des règles');
    expect(texts).toContain('Régularité du cycle');
    expect(texts.filter(text => text === 'Non renseignée').length).toBeGreaterThanOrEqual(3);
    expect(texts).not.toContain('28 jours');
    expect(texts).not.toContain('5 jours');
    expect(texts).not.toContain('Plutôt régulier');
  });

  it('the Dashboard shows no fake next-period/fertile-window/ovulation prediction — only the honest "observing" state', async () => {
    const hanane = await addHanane();
    await setActiveProfileId(hanane.id);
    await recordManagedProfileFirstPeriod(hanane.id, new Date());

    const texts = textsOf(await renderDashboard());
    // The honest "not enough data yet" state (computeCyclePredictionStatus's
    // 'observing' mode) — never a formatted date computed from the 28-day
    // internal placeholder.
    expect(texts).toContain('Mois 1 sur 3');
    expect(texts).toContain('Non estimable'); // fertile window AND ovulation
    expect(texts).toContain('Non renseignée'); // "Durée habituelle" tile
    expect(texts).not.toContain('28 jours');
    expect(texts).not.toContain('Estimation provisoire');
  });

  it('the Calendar shows the honest "observing"/"Non estimable" state right after recording, never a fake 28-day projection (one period is insufficient history)', async () => {
    const hanane = await addHanane();
    await setActiveProfileId(hanane.id);
    await recordManagedProfileFirstPeriod(hanane.id, new Date());

    const texts = textsOf(await renderCalendar());
    // The predictions section is no longer hidden (a real period now exists),
    // but every value in it stays honest — no fake date/number derived from
    // the internal 5/28-day placeholder.
    expect(texts).toContain('Fenêtre fertile (est.)');
    expect(texts).toContain('Non estimable');
    expect(texts).toContain('Mois 1 sur 3');
    expect(texts).not.toContain('28 jours');
  });
});

describe('Progressive experience — one period is not enough for an average', () => {
  it('after recording the first period, prediction status stays in "observing" mode — never an immediate fake 28-day average', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    // the new profile's data is read asynchronously (neutral until the read lands): wait for that read, as a screen would
    await hydrateCyclePreferences();
    await recordManagedProfileFirstPeriod(hanane.id, new Date());

    const basics = getCyclePreferences();
    const status = computeCyclePredictionStatus(basics, basics.regularity, [basics.lastPeriodStart], null, new Date());
    expect(status.mode).toBe('observing');
  });
});

describe('Calendar — no fake predictions before first period, isolation preserved', () => {
  it('shows a plain Gregorian calendar with no fake period/fertile/ovulation predictions for a pre-first-period daughter', async () => {
    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2014-05-01', hasHadFirstPeriod: false});
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();
    const texts = textsOf(renderer);

    expect(texts).not.toContain('Fenêtre fertile (est.)');
    expect(texts).not.toContain('Ovulation (est.)');
    expect(texts.some(text => text.includes('Prochaines règles'))).toBe(false);
    expect(texts).toContain('Aucune règle enregistrée pour ce cycle'); // honest empty state, SelectedDayCard
  });

  it('records the first period from the Calendar too, via the same profile-scoped mechanism', async () => {
    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2014-05-01', hasHadFirstPeriod: false});
    await setActiveProfileId(noor.id);
    const renderer = await renderCalendar();

    // The Calendar's own "declare period start" CTA (SelectedDayCard) keeps
    // its existing, unchanged label — only the sheet it opens is daughter-aware.
    await pressByLabel(renderer, 'Mes règles ont commencé ce jour');
    await confirmSheetForToday(renderer);

    expect(getManagedProfiles().find(item => item.id === noor.id)!.hasHadFirstPeriod).toBe(true);
  });
});

describe('Owner dashboard/calendar — completely unaffected', () => {
  it('the owner never enters the pre-first-period state, regardless of her own history', async () => {
    const renderer = await renderDashboard();
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Pas encore de règles enregistrées');
    expect(texts).not.toContain('Se préparer aux premières règles');
    // The owner keeps her own existing, unchanged "Mes règles ont commencé" —
    // never replaced by the daughter-only pre-first-period CTA.
    expect(hasLabel(renderer, 'Mes règles ont commencé')).toBe(true);
    expect(hasLabel(renderer, 'Ses premières règles ont commencé')).toBe(false);
  });
});
