import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import CycleHomeScreen from '../CycleHomeScreen';
import {setCyclePreferences} from '../../state/onboardingPreferences';
import {getJournalEntry} from '../../state/dailyJournalStore';
import {addManagedProfile, resetManagedProfilesForTests} from '../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, resetActiveProfileForTests, setActiveProfileId} from '../../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../../state/managedProfileCycleSeed';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

jest.mock('../../state/dailyJournalStore', () => ({
  ...jest.requireActual('../../state/dailyJournalStore'),
  getJournalEntry: jest.fn(async () => undefined),
}));

const mockGetJournalEntry = getJournalEntry as jest.Mock;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

async function renderCycleHome() {
  const navigation = {navigate: jest.fn()};
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer ref={navRef}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen name="Test">
                  {() => <CycleHomeScreen navigation={navigation as never} route={{key: 'test', name: 'CycleHome'}} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </JournalSheetProvider>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return {renderer, navigation};
}

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root
    .findAll(node => (node.type as unknown) === 'Text')
    .map(node => (Array.isArray(node.props.children) ? node.props.children.join('') : String(node.props.children)));

const confirmedCycle = (regularity: 'yes' | 'no' | 'unknown') =>
  setCyclePreferences({
    lastPeriodStart: new Date(2026, 8, 1),
    periodDuration: 5,
    cycleDuration: 28,
    regularity,
  });

beforeEach(async () => {
  jest.useFakeTimers();
  mockGetJournalEntry.mockClear();
  confirmedCycle('yes');
  await resetAppLanguageForTests();
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('CycleHomeScreen — "today" refreshes without reopening the app', () => {
  it('23:59 → 00:00: the dashboard reads the NEW day\'s journal', async () => {
    jest.setSystemTime(new Date(2026, 8, 25, 23, 59, 0));
    await renderCycleHome();
    expect(mockGetJournalEntry).toHaveBeenCalledWith('2026-09-25');
    mockGetJournalEntry.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(90_000);
    });

    expect(mockGetJournalEntry).toHaveBeenCalledWith('2026-09-26');
  });
});

describe('CycleHomeScreen — "Voir plus"', () => {
  it('opens the existing Calendar tab (no dead link)', async () => {
    jest.setSystemTime(new Date(2026, 8, 12, 10, 0, 0));
    const {renderer, navigation} = await renderCycleHome();

    const more = renderer.root.findAll(node => node.props.children === 'Voir plus')[0];
    expect(more).toBeTruthy();
    let pressable = more;
    while (pressable && typeof pressable.props.onPress !== 'function') {
      pressable = pressable.parent as ReactTestRenderer.ReactTestInstance;
    }
    act(() => pressable.props.onPress());

    expect(navigation.navigate).toHaveBeenCalledWith('Calendar');
  });
});

describe('CycleHomeScreen — predictions never contradict the window', () => {
  it('REGULAR cycle: precise fertile window and ovulation dates are shown', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('yes');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Non estimable');
    expect(texts).toContain('15 septembre'); // ovulation (cycle day 15 of a 28-day cycle)
    expect(texts).toContain('Durée habituelle');
    expect(texts).toContain('28 jours');
  });

  it('IRREGULAR cycle: the next period is a window, so no single ovulation / fertile date is shown', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('no');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts.filter(text => text === 'Non estimable')).toHaveLength(2);
    expect(texts).not.toContain('15 septembre');
    expect(texts).toContain('26–32 jours');
  });

  it('UNKNOWN regularity, still observing: existing observation wording is preserved', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    confirmedCycle('unknown');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts.some(text => /^Mois \d sur 3$/.test(text))).toBe(true);
    expect(texts).toContain('Estimation provisoire');
  });
});

describe('CycleHomeScreen — managed daughter profile: "Suivre mon cycle" only, fully isolated per profile', () => {
  beforeEach(async () => {
    await resetManagedProfilesForTests();
    await resetActiveProfileForTests();
  });

  it('fertile window & ovulation are KEPT, and computed from each daughter\'s OWN data — never the mother\'s, never each other\'s', async () => {
    jest.setSystemTime(new Date(2026, 9, 20, 10, 0, 0)); // "today" = 20 Oct 2026 — before every ovulation date below

    // The mother's own real, confirmed cycle — must never leak into either daughter below.
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 18), periodDuration: 5, cycleDuration: 28, regularity: 'yes'}); // ovulation = 18 oct + 14 = 1 nov

    const hanane = await addManagedProfile({
      type: 'daughter',
      firstName: 'Hanane',
      birthDate: '2013-01-01',
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-10-15',
      periodLength: 4,
      cycleLength: 30, // ovulation = 15 oct + 16 = 31 oct
    });
    const lina = await addManagedProfile({
      type: 'daughter',
      firstName: 'Lina',
      birthDate: '2014-01-01',
      hasHadFirstPeriod: true,
      lastPeriodDate: '2026-10-12',
      periodLength: 6,
      cycleLength: 24, // ovulation = 12 oct + 10 = 22 oct
    });

    await setActiveProfileId(hanane.id);
    await seedManagedProfileCycleIfNeeded(hanane.id);
    const {renderer: hananeRenderer} = await renderCycleHome();
    const hananeTexts = textsOf(hananeRenderer);
    expect(hananeTexts).not.toContain('Non estimable'); // fertile window / ovulation KEPT, not hidden
    expect(hananeTexts).toContain('31 octobre');
    expect(hananeTexts).not.toContain('1 novembre'); // mother's own ovulation never leaks in
    expect(hananeTexts).not.toContain('22 octobre'); // Lina's ovulation never leaks in

    await setActiveProfileId(lina.id);
    await seedManagedProfileCycleIfNeeded(lina.id);
    const {renderer: linaRenderer} = await renderCycleHome();
    const linaTexts = textsOf(linaRenderer);
    expect(linaTexts).not.toContain('Non estimable');
    expect(linaTexts).toContain('22 octobre');
    expect(linaTexts).not.toContain('1 novembre');
    expect(linaTexts).not.toContain('31 octobre'); // Hanane's ovulation never leaks in

    // Switching back to the mother recalculates her own, unaffected value.
    await setActiveProfileId(OWNER_PROFILE_ID);
    const {renderer: motherRenderer} = await renderCycleHome();
    expect(textsOf(motherRenderer)).toContain('1 novembre');
  });

  it('a daughter who has never had her first period never shows the mother\'s real cycle data — she gets the dedicated pre-first-period state instead', async () => {
    jest.setSystemTime(new Date(2026, 9, 20, 10, 0, 0));
    setCyclePreferences({lastPeriodStart: new Date(2026, 9, 18), periodDuration: 5, cycleDuration: 28, regularity: 'yes'}); // ovulation = 1 nov

    const noor = await addManagedProfile({type: 'daughter', firstName: 'Noor', birthDate: '2015-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(noor.id);
    await seedManagedProfileCycleIfNeeded(noor.id); // no-op: hasHadFirstPeriod is false

    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts).not.toContain('1 novembre'); // the mother's real ovulation date never fills the gap
    // No cycle-derived tile at all (not even a "Non renseignée" placeholder) —
    // the whole overview card is hidden, replaced by the pre-first-period state.
    expect(texts).not.toContain('Durée habituelle');
    expect(texts).not.toContain('Fenêtre fertile');
    expect(texts).not.toContain('Ovulation prévue');
    expect(texts).toContain('Pas encore de règles enregistrées');
    expect(texts).toContain('Son suivi commencera lorsqu’elle aura ses premières règles.');
    expect(texts).toContain('Ses premières règles ont commencé');
  });

  it('"Vie intime" is hidden from the daily journal shortcuts for a managed profile, and stays visible for the owner', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    const {renderer: daughterRenderer} = await renderCycleHome();
    expect(textsOf(daughterRenderer)).not.toContain('Vie intime');

    await setActiveProfileId(OWNER_PROFILE_ID);
    const {renderer: ownerRenderer} = await renderCycleHome();
    expect(textsOf(ownerRenderer)).toContain('Vie intime');
  });

  it('the ENTIRE "Actions rapides" section is not rendered for a managed profile — no title, no subtitle, no "Personnaliser", no cards, no empty gap — but is kept unchanged for the owner', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    const {renderer: daughterRenderer} = await renderCycleHome();
    const daughterTexts = textsOf(daughterRenderer);
    expect(daughterTexts).not.toContain('Actions rapides');
    expect(daughterTexts).not.toContain('Personnaliser');
    expect(daughterTexts).not.toContain('Bibliothèque');
    expect(daughterTexts).not.toContain('Calendrier Hijri');
    expect(daughterTexts).not.toContain('Jeûnes à rattraper');
    expect(daughterTexts.some(text => text.includes('Horaires') && text.includes('prière'))).toBe(false);
    // The rest of her dashboard is untouched — she has no real cycle data yet
    // (hasHadFirstPeriod: false), so this is the pre-first-period state, not
    // the normal cycle overview tiles.
    expect(daughterTexts).toContain('Journal du jour');
    expect(daughterTexts).toContain('Pas encore de règles enregistrées');

    await setActiveProfileId(OWNER_PROFILE_ID);
    const {renderer: ownerRenderer} = await renderCycleHome();
    const ownerTexts = textsOf(ownerRenderer);
    expect(ownerTexts).toContain('Actions rapides');
    expect(ownerTexts).toContain('Personnaliser');
    expect(ownerTexts).toContain('Bibliothèque');
    expect(ownerTexts).toContain('Calendrier Hijri');
    expect(ownerTexts).toContain('Jeûnes à rattraper');
  });

  it('the daughter greeting/header shows HER OWN first name and "Profil de ma fille" — never the mother\'s identity', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts).toContain('Profil de ma fille');
    expect(texts.some(text => text.includes('Hanane'))).toBe(true);
  });

  it('"Pour t\'accompagner" (recommended articles) is not rendered for a managed profile, with no empty gap — but is kept unchanged for the owner, and switching immediately toggles it either way', async () => {
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});

    await setActiveProfileId(hanane.id);
    const {renderer: daughterRenderer} = await renderCycleHome();
    const daughterTexts = textsOf(daughterRenderer);
    expect(daughterTexts).not.toContain('Pour t’accompagner');
    // The rest of her dashboard is untouched — no accidental over-removal. She
    // has no real cycle data yet (hasHadFirstPeriod: false), so this is the
    // pre-first-period state (its own dedicated CTA, not the recurring one).
    expect(daughterTexts).toContain('Journal du jour');
    expect(daughterTexts).toContain('Pas encore de règles enregistrées');
    expect(daughterTexts).toContain('Ses premières règles ont commencé');

    await setActiveProfileId(OWNER_PROFILE_ID);
    const {renderer: ownerRenderer} = await renderCycleHome();
    expect(textsOf(ownerRenderer)).toContain('Pour t’accompagner');

    await setActiveProfileId(hanane.id);
    const {renderer: daughterAgain} = await renderCycleHome();
    expect(textsOf(daughterAgain)).not.toContain('Pour t’accompagner');
  });
});

describe('CycleHomeScreen — localization (English)', () => {
  beforeEach(async () => {
    // The previous describe block ("managed daughter profile") can leave a
    // managed daughter active — reset to the owner so this block's
    // assertions (e.g. QuickActionsGrid, hidden for a managed profile) are
    // not accidentally run against the wrong active profile.
    await resetActiveProfileForTests();
  });

  it('renders the migrated static dashboard chrome in English when the app language is English', async () => {
    await setAppLanguage('en');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts).toContain('Today’s journal');
    expect(texts).toContain('Symptoms');
    expect(texts).toContain('Sleep');
    expect(texts).toContain('Menstrual flow');
    expect(texts).toContain('Next period');
    expect(texts).toContain('Fertile window');
    expect(texts).toContain('Estimated ovulation');
    expect(texts).toContain('My period started');
    // HeroCycleCard — now migrated (Phase 2, Section 1).
    expect(texts).toContain('Today');
    expect(texts).toContain('Energy');
    expect(texts).toContain('Mood'); // shared by both DailyJournalCard's shortcut chip and HeroCycleCard's chip
    expect(texts).toContain('Tip of the day');
    // CycleOverviewCard.
    expect(texts).toContain('Your cycle overview');
    expect(texts).toContain('See more');
    // QuickActionsGrid.
    expect(texts).toContain('Quick actions');
    expect(texts).toContain('Press and hold to customize');
    expect(texts).toContain('Library');
    expect(texts).toContain('Hijri calendar');
    expect(texts).toContain('Fasts to make up');
    expect(texts).toContain('Statistics');
    expect(texts.some(text => text.includes('Prayer') && text.includes('times'))).toBe(true);
    expect(texts).not.toContain('Journal du jour');
    expect(texts).not.toContain('Symptômes');
    expect(texts).not.toContain('Mes règles ont commencé');
    expect(texts).not.toContain('Aperçu de ton cycle');
    expect(texts).not.toContain('Actions rapides');
    expect(texts).not.toContain('Énergie');
    expect(texts).not.toContain('Humeur');
  });

  it('renders the migrated dynamic prediction tiles in English, pluralized correctly', async () => {
    jest.setSystemTime(new Date(2026, 8, 3, 10, 0, 0));
    await setAppLanguage('en');
    confirmedCycle('yes');
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts).not.toContain('Non estimable');
    expect(texts.some(text => /^In \d+ days?$/.test(text))).toBe(true);
    expect(texts).toContain('Usual length');
    expect(texts).toContain('28 days');

    confirmedCycle('no');
    const {renderer: irregularRenderer} = await renderCycleHome();
    const irregularTexts = textsOf(irregularRenderer);
    expect(irregularTexts.filter(text => text === 'Not estimable')).toHaveLength(2);
    expect(irregularTexts).toContain('26–32 days');
  });

  it('renders the pre-first-period daughter state in English too', async () => {
    await setAppLanguage('en');
    const hanane = await addManagedProfile({type: 'daughter', firstName: 'Hanane', birthDate: '2013-01-01', hasHadFirstPeriod: false});
    await setActiveProfileId(hanane.id);
    const {renderer} = await renderCycleHome();
    const texts = textsOf(renderer);
    expect(texts).toContain('No periods recorded yet');
    expect(texts).toContain('Her first period has started');
    expect(texts).toContain('Preparing for her first period');
    expect(texts).not.toContain('Pas encore de règles enregistrées');
  });
});
