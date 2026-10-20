import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../../navigation/JournalSheetContext';
import ManagedProfileTypeScreen from '../ManagedProfileTypeScreen';
import ManagedProfileDaughterInfoScreen from '../ManagedProfileDaughterInfoScreen';
import ManagedProfileFirstPeriodScreen from '../ManagedProfileFirstPeriodScreen';
import ManagedProfileCycleSetupScreen from '../ManagedProfileCycleSetupScreen';
import ManagedProfileSuccessScreen from '../ManagedProfileSuccessScreen';
import CycleHomeScreen from '../../CycleHomeScreen';
import CalendarScreen from '../../CalendarScreen';
import ProfileScreen from '../../ProfileScreen';
import {getManagedProfiles, resetManagedProfilesForTests} from '../../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, getActiveProfileId, resetActiveProfileForTests, setActiveProfileId} from '../../../state/activeProfileStore';
import {
  getCyclePreferences,
  getHasConfirmedCycleData,
  getHasConfirmedCycleDuration,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  isDateWithinConfirmedPeriod,
  setCyclePreferences,
} from '../../../state/onboardingPreferences';
import {seedManagedProfileCycleIfNeeded} from '../../../state/managedProfileCycleSeed';
import {clearManagedProfileDraft, getManagedProfileDraft, startManagedProfileDraft} from '../../../state/managedProfileDraftStore';
import {profileScopedKey} from '../../../state/profileScopedStorage';
import {setAppLanguage, setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {resetPremiumStateForTests} from '../../../state/premiumStore';
import {readStoredJson} from '../../../testUtils/structuredStorage';
import i18n from '../../../i18n';

// DAUGHTER ONBOARDING -> DAUGHTER DASHBOARD. What the mother selects while creating a daughter's profile (last period,
// period length, cycle length, regularity) must end up, unchanged, in HER profile-scoped cycle data and on HER
// dashboard, calendar and profile — immediately after onboarding, after reopening, after a restart, next to a sibling
// and next to the mother's own cycle. The creation screens are driven exactly as a user would; the dashboard is the
// real CycleHomeScreen, mounted right where "Accéder au profil" lands.
//
// Time is pinned to Sat 20 Jun 2026 and every daughter's last period starts on 1 Jun, so each expected date below is
// worked out by hand from the onboarding selections (period 5 + taps, cycle 28 + taps), not read back from the code.

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => true)};
});

const NOW = new Date(2026, 5, 20, 10, 0, 0);
const LAST_PERIOD = new Date(2026, 5, 1);
const CYCLE_KEY_BASE = '@hawa/cycle-preferences';
const cycleKey = (profileId: string) => profileScopedKey(CYCLE_KEY_BASE, profileId);

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const settle = async () => {
  for (let index = 0; index < 12; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function',
  );
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
  await settle();
};
const selectRadio = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function',
  );
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
  await settle();
};
// The two duration steppers share the same "Augmenter" label; the live one's parent is a host View (see ManagedProfileFlow.test.tsx).
const pressStepper = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, index: 0 | 1) => {
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label && (node.parent?.type as unknown) === 'View',
  );
  expect(matches.length).toBe(2);
  await act(async () => {
    matches[index].props.onPress();
  });
  await settle();
};
const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, value: string) => {
  const input = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === label).pop()!;
  await act(async () => {
    input.props.onChangeText(value);
  });
};
const monthName = (date: Date) => new Intl.DateTimeFormat('fr-FR', {month: 'long'}).format(date);
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const tapLabel = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label && (node.parent?.type as unknown) === 'View',
  );
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
  await settle();
};

// The real dashboard, mounted where "Accéder au profil" resets to (MainTabs -> CycleHome).
function MainTabsHost({route}: {route: {params?: {screen?: string}}}): React.JSX.Element {
  return (
    <JournalSheetProvider>
      <Text>{`MainTabs:${route.params?.screen ?? 'default'}`}</Text>
      <CycleHomeScreen navigation={{navigate: jest.fn()} as never} route={{key: 'home', name: 'CycleHome'}} />
    </JournalSheetProvider>
  );
}

async function renderFlow() {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator initialRouteName="ManagedProfileType" screenOptions={{headerShown: false}}>
              <Stack.Screen component={ManagedProfileTypeScreen as never} name="ManagedProfileType" />
              <Stack.Screen component={ManagedProfileDaughterInfoScreen as never} name="ManagedProfileDaughterInfo" />
              <Stack.Screen component={ManagedProfileFirstPeriodScreen as never} name="ManagedProfileFirstPeriod" />
              <Stack.Screen component={ManagedProfileCycleSetupScreen as never} name="ManagedProfileCycleSetup" />
              <Stack.Screen component={ManagedProfileSuccessScreen as never} name="ManagedProfileSuccess" />
              <Stack.Screen component={MainTabsHost as never} name="MainTabs" />
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

async function renderScreen(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <JournalSheetProvider>
            <NavigationContainer>
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
  await settle();
  return renderer;
}
const renderDashboard = () => renderScreen(<CycleHomeScreen navigation={{navigate: jest.fn()} as never} route={{key: 'home', name: 'CycleHome'}} />);
const renderCalendar = () => renderScreen(<CalendarScreen navigation={{navigate: jest.fn()} as never} route={{key: 'cal', name: 'Calendar'}} />);
const renderProfile = () =>
  renderScreen(<ProfileScreen navigation={{navigate: jest.fn(), getParent: jest.fn()} as never} route={{key: 'prof', name: 'Profile'}} />);

type Selection = {
  name: string;
  /** Presses on "Augmenter" of the period-length stepper (5 -> 5 + n). */
  periodTaps?: number;
  /** Presses on "Augmenter" of the cycle-length stepper (28 -> 28 + n). */
  cycleTaps?: number;
  /** Presses "Augmenter" then "Diminuer" on the cycle-length stepper: touched, yet back at its start value. */
  cycleThereAndBack?: boolean;
  regularity?: 'Régulier' | 'Irrégulier' | 'Je ne sais pas';
  /** A second answer given after `regularity`, before submitting (she changes her mind). */
  thenRegularity?: 'Régulier' | 'Irrégulier' | 'Je ne sais pas';
  /** First day of her last period (default 1 Jun 2026); must be on or before the pinned "today", in its month. */
  lastPeriod?: Date;
};

/** Intro -> Daughter Information -> "Oui" -> Cycle Setup, up to (and including) "Créer le profil". */
async function createDaughter(renderer: ReactTestRenderer.ReactTestRenderer, selection: Selection) {
  await press(renderer, 'Continuer');
  await typeInto(renderer, 'Prénom de votre fille', selection.name);
  await press(renderer, 'Date de naissance');
  const birth = new Date(NOW.getFullYear() - 10, NOW.getMonth(), NOW.getDate());
  await tapLabel(renderer, String(birth.getFullYear()));
  await tapLabel(renderer, capitalize(monthName(birth)));
  await tapLabel(renderer, `${birth.getDate()} ${capitalize(monthName(birth))}`);
  await press(renderer, 'Continuer');
  await selectRadio(renderer, 'Oui');
  await press(renderer, 'Continuer');
  if (selection.regularity) {
    await selectRadio(renderer, selection.regularity);
  }
  if (selection.thenRegularity) {
    await selectRadio(renderer, selection.thenRegularity);
  }
  const lastPeriod = selection.lastPeriod ?? LAST_PERIOD;
  await press(renderer, 'Date des dernières règles');
  await tapLabel(renderer, `${lastPeriod.getDate()} ${monthName(lastPeriod)}`);
  for (let tap = 0; tap < (selection.periodTaps ?? 0); tap += 1) {
    await pressStepper(renderer, 'Augmenter', 0);
  }
  for (let tap = 0; tap < (selection.cycleTaps ?? 0); tap += 1) {
    await pressStepper(renderer, 'Augmenter', 1);
  }
  if (selection.cycleThereAndBack) {
    await pressStepper(renderer, 'Augmenter', 1);
    await pressStepper(renderer, 'Diminuer', 1);
  }
  await press(renderer, 'Créer le profil');
}

/** The whole onboarding, ending on the dashboard of the daughter just created. */
async function onboardAndOpenDashboard(selection: Selection) {
  const renderer = await renderFlow();
  await createDaughter(renderer, selection);
  await press(renderer, `Accéder au profil de ${selection.name}`);
  return renderer;
}

const profileNamed = (name: string) => getManagedProfiles().find(profile => profile.firstName === name)!;
const key = (date: Date) => date.toLocaleDateString('en-CA');

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  clearManagedProfileDraft();
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  // The mother's own, fully confirmed cycle: the "other profile" no daughter may inherit from or change.
  await hydrateCyclePreferences();
  await setCyclePreferences({lastPeriodStart: new Date(2026, 4, 10), periodDuration: 4, cycleDuration: 26, regularity: 'yes'});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('regular cycle, both durations chosen', () => {
  // period 5 + 2 = 7 days, cycle 28 + 3 = 31 days, 1 Jun -> 31-day cycle ends 1 Jul, next period 2 Jul.
  const selection: Selection = {name: 'Lina', periodTaps: 2, cycleTaps: 3, regularity: 'Régulier'};

  it('keeps every selection on the profile record and seeds HER cycle store with exactly those values', async () => {
    await onboardAndOpenDashboard(selection);
    const lina = profileNamed('Lina');

    expect(lina).toMatchObject({hasHadFirstPeriod: true, lastPeriodDate: '2026-06-01', periodLength: 7, cycleLength: 31, regularity: 'yes'});
    expect(getActiveProfileId()).toBe(lina.id);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 31, regularity: 'yes'});
    expect(key(getCyclePreferences().lastPeriodStart)).toBe('2026-06-01');
    expect(getHasConfirmedCycleData()).toBe(true);
    expect(getHasConfirmedCycleDuration()).toBe(true);
    expect(getRecordedPeriodHistory()).toEqual([{id: '2026-06-01', startDate: '2026-06-01', endDate: '2026-06-07'}]);
  });

  it('shows the dashboard right after onboarding, computed from those values (no refresh, no restart)', async () => {
    const renderer = await onboardAndOpenDashboard(selection);
    const texts = textsOf(renderer);

    expect(texts).toContain('MainTabs:CycleHome');
    expect(texts.some(text => text.includes('Lina'))).toBe(true);
    expect(texts).toContain('Profil de ma fille');
    expect(texts).toContain('Jour du cycle');
    expect(texts).toContain('20'); // 1 Jun -> 20 Jun
    expect(texts).toContain('2 juillet'); // 1 Jun + her 31-day cycle
    expect(texts).toContain('Dans 12 jours');
    expect(texts).toContain('19 juillet'); // ovulation of that cycle: 2 Jul + 17 days (31 - 14)
    expect(texts).toContain('Durée habituelle');
    expect(texts).toContain('31 jours');
    expect(texts).toContain('Renseignée par toi');
    // never the placeholders, never the mother's own 26-day cycle (next period 6 Jun / 2 Jul either way would collide only by chance)
    expect(texts).not.toContain('28 jours');
    expect(texts).not.toContain('26 jours');
  });

  it('her calendar and profile show the same values', async () => {
    await onboardAndOpenDashboard(selection);

    const profile = textsOf(await renderProfile());
    expect(profile[profile.indexOf('Durée du cycle') + 1]).toBe('31 jours');
    expect(profile[profile.indexOf('Durée des règles') + 1]).toBe('7 jours');
    expect(profile[profile.indexOf('Régularité du cycle') + 1]).not.toBe('Non renseignée');

    const calendar = textsOf(await renderCalendar());
    expect(calendar).toContain('Règles 1–7');
    expect(calendar[calendar.indexOf('Durée des règles') + 1]).toBe('7 jours');
  });

  it('is identical when the dashboard is left and reopened', async () => {
    const first = textsOf(await onboardAndOpenDashboard(selection));
    act(() => {
      activeRenderers.splice(0).forEach(renderer => renderer.unmount());
    });
    const reopened = textsOf(await renderDashboard());

    for (const expected of ['20', '2 juillet', '19 juillet', '31 jours', 'Renseignée par toi']) {
      expect(first).toContain(expected);
      expect(reopened).toContain(expected);
    }
  });

  it('survives an app restart: the same values are read back from HER storage key, for HER profile', async () => {
    await onboardAndOpenDashboard(selection);
    const lina = profileNamed('Lina');

    const stored = await readStoredJson<{preferences: {periodDuration: number; cycleDuration: number; regularity: string}; periodHistory: unknown[]}>(cycleKey(lina.id));
    expect(stored?.preferences).toMatchObject({periodDuration: 7, cycleDuration: 31, regularity: 'yes'});
    // the mother's key was never written by the daughter's onboarding
    const mother = await readStoredJson<{preferences: {periodDuration: number; cycleDuration: number}}>(cycleKey(OWNER_PROFILE_ID));
    expect(mother?.preferences).toMatchObject({periodDuration: 4, cycleDuration: 26});

    // A cold start: fresh module instances (nothing in memory), only what was persisted is left to read.
    await jest.isolateModulesAsync(async () => {
      const active = require('../../../state/activeProfileStore');
      const managed = require('../../../state/managedProfilesStore');
      const cycle = require('../../../state/onboardingPreferences');
      await managed.hydrateManagedProfiles();
      expect(await active.hydrateActiveProfileId()).toBe(lina.id);
      const prefs = await cycle.hydrateCyclePreferences();

      expect(prefs).toMatchObject({periodDuration: 7, cycleDuration: 31, regularity: 'yes'});
      expect(cycle.getHasConfirmedCycleDuration()).toBe(true);
      expect(cycle.getRecordedPeriodHistory()).toEqual([{id: '2026-06-01', startDate: '2026-06-01', endDate: '2026-06-07'}]);
      expect(managed.getManagedProfiles().find((profile: {id: string}) => profile.id === lina.id)).toMatchObject({periodLength: 7, cycleLength: 31});
    });
  });
});

describe('irregular and unknown regularity', () => {
  it('"Irrégulier" with both durations: the 26–32 day window from her last period, never a single certain date', async () => {
    const renderer = await onboardAndOpenDashboard({name: 'Irene', periodTaps: 2, cycleTaps: 3, regularity: 'Irrégulier'});
    const texts = textsOf(renderer);

    expect(profileNamed('Irene').regularity).toBe('no');
    expect(getCyclePreferences()).toMatchObject({regularity: 'no', periodDuration: 7, cycleDuration: 31});
    expect(texts).toContain('27 juin – 3 juillet'); // 1 Jun + 26 .. + 32
    expect(texts).toContain('Dans 7 jours');
    expect(texts).toContain('Cycle variable');
    expect(texts).toContain('26–32 jours');
    expect(texts).not.toContain('2 juillet'); // her 31 declared days are not turned into one exact date
    // no single fertile / ovulation date for an irregular cycle
    expect(texts.filter(text => text === 'Non estimable')).toHaveLength(2);

    const profile = textsOf(await renderProfile());
    expect(profile[profile.indexOf('Régularité du cycle') + 1]).toBe('Irrégulier');
  });

  it('"Je ne sais pas" with both durations: observed for three months, her declared 31 days still drive the fertile window', async () => {
    const texts = textsOf(await onboardAndOpenDashboard({name: 'Uma', periodTaps: 2, cycleTaps: 3, regularity: 'Je ne sais pas'}));

    expect(getCyclePreferences().regularity).toBe('unknown');
    expect(texts).toContain('Mois 1 sur 3');
    expect(texts).toContain('Observation du cycle');
    expect(texts).toContain('19 juillet');
    expect(texts).toContain('31 jours');
    expect(texts).toContain('Estimation provisoire');
  });
});

describe('missing and partial values are never invented, and never lost on the period', () => {
  it('nothing touched: no duration is confirmed, the dashboard says so and never shows 5 / 28 as hers', async () => {
    const renderer = await onboardAndOpenDashboard({name: 'Dana'});
    const texts = textsOf(renderer);
    const dana = profileNamed('Dana');

    expect(dana).toMatchObject({periodLength: null, cycleLength: null, regularity: 'unknown'});
    expect(getHasConfirmedCycleDuration()).toBe(false);
    expect(getHasConfirmedCycleData()).toBe(true); // the real date is known
    expect(texts).toContain('Mois 1 sur 3');
    expect(texts).toContain('Non renseignée');
    expect(texts).not.toContain('28 jours');
    expect(texts).not.toContain('5 jours');

    const profile = textsOf(await renderProfile());
    expect(profile[profile.indexOf('Durée du cycle') + 1]).toBe('Non renseignée');
    expect(profile[profile.indexOf('Durée des règles') + 1]).toBe('Non renseignée');
  });

  // "Je ne sais pas": the lengths she did not touch stay unknown (with "Régulier" / "Irrégulier" the lengths on screen are
  // saved with the answer — see "regularity decides whether the displayed lengths are saved" below).
  it('only the period length chosen (7 days): her recorded period lasts 7 days, the cycle length stays unconfirmed', async () => {
    const renderer = await onboardAndOpenDashboard({name: 'Pia', periodTaps: 2, regularity: 'Je ne sais pas'});
    const texts = textsOf(renderer);

    expect(profileNamed('Pia')).toMatchObject({periodLength: 7, cycleLength: null, regularity: 'unknown'});
    // the chosen length is the length of the period she just declared — not the 5-day placeholder
    expect(getRecordedPeriodHistory()).toEqual([{id: '2026-06-01', startDate: '2026-06-01', endDate: '2026-06-07'}]);
    expect(isDateWithinConfirmedPeriod(new Date(2026, 5, 7))).toBe(true);
    expect(isDateWithinConfirmedPeriod(new Date(2026, 5, 8))).toBe(false);
    // but nothing is presented as a confirmed habit: no cycle length, so no prediction from a made-up 28 days
    expect(getHasConfirmedCycleDuration()).toBe(false);
    expect(texts).toContain('Mois 1 sur 3');
    expect(texts).toContain('Non renseignée');
    expect(texts).not.toContain('28 jours');
  });

  it('only the period length chosen: while that period lasts the dashboard knows she is still on her period', async () => {
    jest.setSystemTime(new Date(2026, 5, 7, 10, 0, 0)); // day 7 of a 7-day period (it would be over on day 6 with the placeholder)
    const renderer = await onboardAndOpenDashboard({name: 'Pia', periodTaps: 2});

    expect(textsOf(renderer)).not.toContain('Mes règles ont commencé'); // today is already covered by a recorded period
  });

  it('only the cycle length chosen: it stays on the record, nothing is fabricated for the missing period length', async () => {
    const texts = textsOf(await onboardAndOpenDashboard({name: 'Cora', cycleTaps: 3, regularity: 'Je ne sais pas'}));

    expect(profileNamed('Cora')).toMatchObject({periodLength: null, cycleLength: 31, regularity: 'unknown'});
    expect(getHasConfirmedCycleDuration()).toBe(false);
    expect(getRecordedPeriodHistory()).toEqual([{id: '2026-06-01', startDate: '2026-06-01', endDate: '2026-06-05'}]);
    expect(texts).toContain('Non renseignée');
    expect(texts).not.toContain('28 jours');
  });
});

describe('two daughters and the mother never mix', () => {
  it('each profile keeps and shows only her own values, whatever the switching order', async () => {
    // two complete onboardings in one test: far longer than Jest's 5 s default
    const renderer = await renderFlow();
    await createDaughter(renderer, {name: 'Ada', periodTaps: 2, cycleTaps: 3, regularity: 'Régulier'}); // 7 / 31 / yes
    await press(renderer, 'Rester sur mon profil');

    // a second flow started the way "+ Ajouter un profil" does
    startManagedProfileDraft();
    act(() => {
      navRef.resetRoot({index: 0, routes: [{name: 'ManagedProfileType'}]});
    });
    await settle();
    await createDaughter(renderer, {name: 'Bea', periodTaps: 1, cycleTaps: 1, regularity: 'Irrégulier'}); // 6 / 29 / no
    await press(renderer, 'Rester sur mon profil');

    const ada = profileNamed('Ada');
    const bea = profileNamed('Bea');
    expect(ada.id).not.toBe(bea.id);
    expect(ada).toMatchObject({periodLength: 7, cycleLength: 31, regularity: 'yes'});
    expect(bea).toMatchObject({periodLength: 6, cycleLength: 29, regularity: 'no'});

    // onboarding alone writes nothing into any cycle store: the mother keeps hers, the daughters have none yet
    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 4, cycleDuration: 26});
    expect(await AsyncStorage.getItem(cycleKey(ada.id))).toBeNull();
    expect(await AsyncStorage.getItem(cycleKey(bea.id))).toBeNull();

    // switching to a daughter the way the Profile screen does: activate, then seed her once
    const activate = async (id: string) => {
      await setActiveProfileId(id);
      await seedManagedProfileCycleIfNeeded(id);
    };

    await activate(ada.id);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 31, regularity: 'yes'});
    const adaTexts = textsOf(await renderDashboard());
    expect(adaTexts).toContain('2 juillet');
    expect(adaTexts).toContain('31 jours');

    await activate(bea.id);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 6, cycleDuration: 29, regularity: 'no'});
    const beaTexts = textsOf(await renderDashboard());
    expect(beaTexts).toContain('27 juin – 3 juillet');
    expect(beaTexts).toContain('Cycle variable');
    expect(beaTexts).not.toContain('2 juillet');
    expect(beaTexts).not.toContain('31 jours');

    await setActiveProfileId(ada.id);
    await hydrateCyclePreferences();
    expect(getCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 31, regularity: 'yes'}); // not Bea's
    expect(getRecordedPeriodHistory()).toEqual([{id: '2026-06-01', startDate: '2026-06-01', endDate: '2026-06-07'}]);

    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    expect(getCyclePreferences()).toMatchObject({periodDuration: 4, cycleDuration: 26, regularity: 'yes'}); // still hers
    expect(key(getCyclePreferences().lastPeriodStart)).toBe('2026-05-10');

    // three separate storage keys, each holding only its own profile's values
    for (const [id, expected] of [
      [ada.id, {periodDuration: 7, cycleDuration: 31}],
      [bea.id, {periodDuration: 6, cycleDuration: 29}],
      [OWNER_PROFILE_ID, {periodDuration: 4, cycleDuration: 26}],
    ] as const) {
      const stored = await readStoredJson<{preferences: Record<string, unknown>}>(cycleKey(id));
      expect(stored?.preferences).toMatchObject(expected);
    }
  }, 60_000);

  it('seeding happens once: later edits of a daughter are never overwritten by what she declared at creation', async () => {
    const renderer = await renderFlow();
    await createDaughter(renderer, {name: 'Ada', periodTaps: 2, cycleTaps: 3, regularity: 'Régulier'});
    await press(renderer, 'Rester sur mon profil');
    const ada = profileNamed('Ada');

    await setActiveProfileId(ada.id);
    await seedManagedProfileCycleIfNeeded(ada.id);
    await setCyclePreferences({lastPeriodStart: new Date(2026, 5, 10), periodDuration: 4, cycleDuration: 27, regularity: 'yes'}); // edited since

    await setActiveProfileId(OWNER_PROFILE_ID);
    await setActiveProfileId(ada.id);
    await seedManagedProfileCycleIfNeeded(ada.id);

    expect(getCyclePreferences()).toMatchObject({periodDuration: 4, cycleDuration: 27});
  });
});

describe('incomplete onboarding', () => {
  it('leaving before "Créer le profil" persists nothing, and the next profile starts from a clean draft', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer');
    await typeInto(renderer, 'Prénom de votre fille', 'Ghost');
    await press(renderer, 'Date de naissance');
    const birth = new Date(NOW.getFullYear() - 10, NOW.getMonth(), NOW.getDate());
    await tapLabel(renderer, String(birth.getFullYear()));
    await tapLabel(renderer, capitalize(monthName(birth)));
    await tapLabel(renderer, `${birth.getDate()} ${capitalize(monthName(birth))}`);
    await press(renderer, 'Continuer');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    await selectRadio(renderer, 'Irrégulier');
    await pressStepper(renderer, 'Augmenter', 0);
    await pressStepper(renderer, 'Augmenter', 1);

    // abandoned here: no profile, no cycle key, the mother's cycle untouched
    expect(getManagedProfiles()).toHaveLength(0);
    expect((await AsyncStorage.getAllKeys()).filter(storageKey => storageKey.includes(':profile:'))).toEqual([]);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 4, cycleDuration: 26});

    // a new attempt (as "+ Ajouter un profil" starts it) inherits nothing from the abandoned one
    startManagedProfileDraft();
    act(() => {
      navRef.resetRoot({index: 0, routes: [{name: 'ManagedProfileType'}]});
    });
    await settle();
    await createDaughter(renderer, {name: 'Real'});
    expect(getManagedProfiles()).toHaveLength(1);
    expect(profileNamed('Real')).toMatchObject({periodLength: null, cycleLength: null, regularity: 'unknown', lastPeriodDate: '2026-06-01'});
  });

  it('a daughter who has not had her first period gets no cycle data at all, not even after being activated', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer');
    await typeInto(renderer, 'Prénom de votre fille', 'Noor');
    await press(renderer, 'Date de naissance');
    const birth = new Date(NOW.getFullYear() - 10, NOW.getMonth(), NOW.getDate());
    await tapLabel(renderer, String(birth.getFullYear()));
    await tapLabel(renderer, capitalize(monthName(birth)));
    await tapLabel(renderer, `${birth.getDate()} ${capitalize(monthName(birth))}`);
    await press(renderer, 'Continuer');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');
    await press(renderer, 'Accéder au profil de Noor');

    expect(profileNamed('Noor')).toMatchObject({hasHadFirstPeriod: false, lastPeriodDate: null, periodLength: null, cycleLength: null, regularity: null});
    expect(getHasConfirmedCycleData()).toBe(false);
    expect(getRecordedPeriodHistory()).toEqual([]);
    expect(textsOf(renderer)).toContain('Pas encore de règles enregistrées');
  });

  it('describing the cycle ("Régulier") is not a submission: nothing is saved, not even into the draft, until "Créer le profil"', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer');
    await typeInto(renderer, 'Prénom de votre fille', 'Ghost');
    await press(renderer, 'Date de naissance');
    const birth = new Date(NOW.getFullYear() - 10, NOW.getMonth(), NOW.getDate());
    await tapLabel(renderer, String(birth.getFullYear()));
    await tapLabel(renderer, capitalize(monthName(birth)));
    await tapLabel(renderer, `${birth.getDate()} ${capitalize(monthName(birth))}`);
    await press(renderer, 'Continuer');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    await selectRadio(renderer, 'Régulier'); // the visible 5 / 28 days are now "to be saved" — but only by the submission

    expect(getManagedProfiles()).toHaveLength(0);
    expect((await AsyncStorage.getAllKeys()).filter(storageKey => storageKey.includes(':profile:'))).toEqual([]);
    expect(getManagedProfileDraft()).toMatchObject({periodLength: null, cycleLength: null, regularity: null});
    expect(getCyclePreferences()).toMatchObject({periodDuration: 4, cycleDuration: 26}); // the mother's cycle is untouched
  });
});

describe('Hala — the reported case, through the real onboarding', () => {
  // Last period 16 Oct 2026, period length pressed from 5 to 7, cycle length left at its pre-filled 28, "Régulier";
  // today is 20 Oct 2026 (day 5 of her cycle).
  const HALA_TODAY = new Date(2026, 9, 20, 10, 0, 0);
  const hala = (overrides: Partial<Selection> = {}): Selection => ({
    name: 'Hala',
    periodTaps: 2,
    regularity: 'Régulier',
    lastPeriod: new Date(2026, 9, 16),
    ...overrides,
  });
  const REJECTED_TEXTS = [
    'Non renseignée',
    'Complète ton cycle',
    'Mois 1 sur 3',
    'Non estimable',
    'Les prévisions de cycle apparaîtront lorsque suffisamment de règles auront été enregistrées.',
  ];

  beforeEach(() => {
    jest.setSystemTime(HALA_TODAY);
  });

  it.each([
    ['left at its pre-filled value', {}],
    ['pressed away and back to 28', {cycleThereAndBack: true}],
  ] as Array<[string, Partial<Selection>]>)('28-day cycle %s: saved with the form, recognized by her dashboard at once', async (_label, extra) => {
    const renderer = await onboardAndOpenDashboard(hala(extra));
    const record = profileNamed('Hala');

    // what was saved, and for whom
    expect(record).toMatchObject({hasHadFirstPeriod: true, lastPeriodDate: '2026-10-16', periodLength: 7, cycleLength: 28, regularity: 'yes'});
    expect(getActiveProfileId()).toBe(record.id);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 28, regularity: 'yes'});
    expect(key(getCyclePreferences().lastPeriodStart)).toBe('2026-10-16');
    expect(getHasConfirmedCycleData()).toBe(true);
    expect(getHasConfirmedCycleDuration()).toBe(true);
    expect(getRecordedPeriodHistory()).toEqual([{id: '2026-10-16', startDate: '2026-10-16', endDate: '2026-10-22'}]);

    // what her dashboard shows right away — no visit to ProfileScreen, no second entry
    const texts = textsOf(renderer).map(text => text.replace(/\n/g, ' ')); // the ring wraps "Phase menstruelle" on two lines
    expect(texts).toEqual(expect.arrayContaining(['Jour du cycle', '5', 'Phase menstruelle']));
    expect(texts).toEqual(expect.arrayContaining(['Prochaines règles', '13 novembre', 'Dans 24 jours'])); // 16 Oct + 28 days
    expect(texts).toEqual(expect.arrayContaining(['Fenêtre fertile', '25 – 31 octobre', 'Ovulation prévue', '30 octobre']));
    expect(texts).toEqual(expect.arrayContaining(['Durée habituelle', '28 jours', 'Renseignée par toi']));
    REJECTED_TEXTS.forEach(rejected => expect(texts).not.toContain(rejected));
  });

  it('her profile and calendar agree with the dashboard', async () => {
    await onboardAndOpenDashboard(hala());

    const profile = textsOf(await renderProfile());
    expect(profile[profile.indexOf('Durée du cycle') + 1]).toBe('28 jours');
    expect(profile[profile.indexOf('Durée des règles') + 1]).toBe('7 jours');
    expect(profile[profile.indexOf('Régularité du cycle') + 1]).not.toBe('Non renseignée');

    const calendar = textsOf(await renderCalendar());
    expect(calendar).toContain('Règles 16–22');
    expect(calendar[calendar.indexOf('Durée des règles') + 1]).toBe('7 jours');
  });

  it('survives switching profiles and a cold restart, with the mother and Hala never mixed', async () => {
    await onboardAndOpenDashboard(hala());
    const record = profileNamed('Hala');

    // switch to the mother and back, the way the Profile screen does
    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    expect(getCyclePreferences()).toMatchObject({periodDuration: 4, cycleDuration: 26}); // hers, not Hala's
    await setActiveProfileId(record.id);
    await seedManagedProfileCycleIfNeeded(record.id);
    await hydrateCyclePreferences();
    expect(getCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 28, regularity: 'yes'});
    expect(getHasConfirmedCycleDuration()).toBe(true);
    const switched = textsOf(await renderDashboard());
    expect(switched).toEqual(expect.arrayContaining(['13 novembre', '28 jours', 'Renseignée par toi']));

    // what is on disk
    const stored = await readStoredJson<{preferences: Record<string, unknown>; hasConfirmedCycleDuration: boolean}>(cycleKey(record.id));
    expect(stored).toMatchObject({preferences: {periodDuration: 7, cycleDuration: 28, regularity: 'yes'}, hasConfirmedCycleDuration: true});
    const mother = await readStoredJson<{preferences: Record<string, unknown>}>(cycleKey(OWNER_PROFILE_ID));
    expect(mother?.preferences).toMatchObject({periodDuration: 4, cycleDuration: 26});

    // a cold start: only what was persisted is left
    await jest.isolateModulesAsync(async () => {
      const active = require('../../../state/activeProfileStore');
      const managed = require('../../../state/managedProfilesStore');
      const cycle = require('../../../state/onboardingPreferences');
      await managed.hydrateManagedProfiles();
      expect(await active.hydrateActiveProfileId()).toBe(record.id);
      expect(await cycle.hydrateCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 28, regularity: 'yes'});
      expect(cycle.getHasConfirmedCycleDuration()).toBe(true);
      expect(cycle.getRecordedPeriodHistory()).toEqual([{id: '2026-10-16', startDate: '2026-10-16', endDate: '2026-10-22'}]);
      expect(managed.getManagedProfiles().find((profile: {id: string}) => profile.id === record.id)).toMatchObject({periodLength: 7, cycleLength: 28});
    });
  });
});

describe('regularity decides whether the displayed lengths are saved', () => {
  // The cycle form pre-fills 5 and 28 days. "Régulier" / "Irrégulier" is an answer about her cycle, so the lengths shown are
  // saved with it (and the form says so); with "Je ne sais pas" a length nobody changed stays unknown.
  it.each([
    ['"Régulier"', 'Régulier', 'yes', 5, 28, true, ['28 jours', 'Renseignée par toi']],
    ['"Irrégulier"', 'Irrégulier', 'no', 5, 28, true, ['Cycle variable', '26–32 jours']],
    ['"Je ne sais pas" chosen', 'Je ne sais pas', 'unknown', null, null, false, ['Non renseignée', 'Mois 1 sur 3']],
    ['no answer at all (the form starts on "Je ne sais pas")', undefined, 'unknown', null, null, false, ['Non renseignée', 'Mois 1 sur 3']],
  ] as Array<[string, Selection['regularity'], string, number | null, number | null, boolean, string[]]>)(
    '%s with untouched steppers',
    async (_title, regularity, expectedRegularity, period, cycle, confirmed, dashboardTexts) => {
      const renderer = await onboardAndOpenDashboard({name: 'Mia', regularity});

      expect(profileNamed('Mia')).toMatchObject({periodLength: period, cycleLength: cycle, regularity: expectedRegularity});
      expect(getCyclePreferences().regularity).toBe(expectedRegularity);
      expect(getHasConfirmedCycleDuration()).toBe(confirmed);
      expect(textsOf(renderer)).toEqual(expect.arrayContaining(dashboardTexts));
    },
  );

  it.each([
    ['only the period length', {periodTaps: 2}, 7, null],
    ['only the cycle length', {cycleTaps: 3}, null, 31],
  ] as Array<[string, Partial<Selection>, number | null, number | null]>)('"Je ne sais pas" with %s changed saves only that value', async (_title, extra, period, cycle) => {
    await onboardAndOpenDashboard({name: 'Mia', regularity: 'Je ne sais pas', ...extra});

    expect(profileNamed('Mia')).toMatchObject({periodLength: period, cycleLength: cycle, regularity: 'unknown'});
    expect(getHasConfirmedCycleDuration()).toBe(false); // one length alone is not a confirmed habit
  });

  it('"Je ne sais pas" with both steppers changed saves both', async () => {
    await onboardAndOpenDashboard({name: 'Mia', regularity: 'Je ne sais pas', periodTaps: 1, cycleTaps: 1});

    expect(profileNamed('Mia')).toMatchObject({periodLength: 6, cycleLength: 29, regularity: 'unknown'});
    expect(getHasConfirmedCycleDuration()).toBe(true);
  });

  it('changing her mind before submitting: "Régulier" then back to "Je ne sais pas" saves nothing for untouched lengths', async () => {
    const renderer = await renderFlow();
    await createDaughter(renderer, {name: 'Mia', regularity: 'Régulier', thenRegularity: 'Je ne sais pas'});

    expect(profileNamed('Mia')).toMatchObject({periodLength: null, cycleLength: null, regularity: 'unknown'});
  });

  it('a daughter created with "Régulier" next to one created with "Je ne sais pas" and the mother: each keeps her own', async () => {
    const renderer = await renderFlow();
    await createDaughter(renderer, {name: 'Hana', periodTaps: 2, regularity: 'Régulier'}); // 7 days, 28 saved by the form
    await press(renderer, 'Rester sur mon profil');
    startManagedProfileDraft();
    act(() => {
      navRef.resetRoot({index: 0, routes: [{name: 'ManagedProfileType'}]});
    });
    await settle();
    await createDaughter(renderer, {name: 'Dina', regularity: 'Je ne sais pas'}); // nothing saved
    await press(renderer, 'Rester sur mon profil');

    const hana = profileNamed('Hana');
    const dina = profileNamed('Dina');
    expect(hana).toMatchObject({periodLength: 7, cycleLength: 28, regularity: 'yes'});
    expect(dina).toMatchObject({periodLength: null, cycleLength: null, regularity: 'unknown'});

    const activate = async (id: string) => {
      await setActiveProfileId(id);
      await seedManagedProfileCycleIfNeeded(id);
      await hydrateCyclePreferences();
    };
    await activate(hana.id);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 28});
    expect(getHasConfirmedCycleDuration()).toBe(true);
    await activate(dina.id);
    expect(getHasConfirmedCycleDuration()).toBe(false);
    expect(textsOf(await renderDashboard())).toEqual(expect.arrayContaining(['Mois 1 sur 3', 'Non renseignée']));
    await activate(hana.id);
    expect(getCyclePreferences()).toMatchObject({periodDuration: 7, cycleDuration: 28}); // Dina's choice did not reach her
    await setActiveProfileId(OWNER_PROFILE_ID);
    await hydrateCyclePreferences();
    expect(getCyclePreferences()).toMatchObject({periodDuration: 4, cycleDuration: 26, regularity: 'yes'});
    expect(getHasConfirmedCycleDuration()).toBe(true);

    for (const [id, expected] of [
      [hana.id, {periodDuration: 7, cycleDuration: 28}],
      [OWNER_PROFILE_ID, {periodDuration: 4, cycleDuration: 26}],
    ] as const) {
      const stored = await readStoredJson<{preferences: Record<string, unknown>}>(cycleKey(id));
      expect(stored?.preferences).toMatchObject(expected);
    }
    const dinaStored = await readStoredJson<{hasConfirmedCycleDuration: boolean}>(cycleKey(dina.id));
    expect(dinaStored?.hasConfirmedCycleDuration).toBe(false);
  }, 60_000);
});
