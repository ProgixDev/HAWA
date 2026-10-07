import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Alert, FlatList, Image, Text, TextInput} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resolveAwaTheme} from '../../../theme/awaThemeTokens';
import ManagedProfileTypeScreen from '../ManagedProfileTypeScreen';
import ManagedProfileDaughterInfoScreen from '../ManagedProfileDaughterInfoScreen';
import ManagedProfileFirstPeriodScreen from '../ManagedProfileFirstPeriodScreen';
import ManagedProfileCycleSetupScreen from '../ManagedProfileCycleSetupScreen';
import ManagedProfileSuccessScreen from '../ManagedProfileSuccessScreen';
import {getManagedProfiles, resetManagedProfilesForTests} from '../../../state/managedProfilesStore';
import {OWNER_PROFILE_ID, getActiveProfileId, resetActiveProfileForTests} from '../../../state/activeProfileStore';
import {getCyclePreferences, getHasConfirmedCycleDuration} from '../../../state/onboardingPreferences';
import {clearManagedProfileDraft, startManagedProfileDraft} from '../../../state/managedProfileDraftStore';
import {setAppLanguage, setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import {resetPremiumStateForTests} from '../../../state/premiumStore';

// Reduced motion: content renders at its final state immediately (same convention as
// AwaADeuxNavigationFlow.test.tsx) — this flow's own animation is covered visually
// elsewhere; these tests only exercise navigation, validation, persistence and theming.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');
  return {...actual, __esModule: true, default: actual.default, useReducedMotion: jest.fn(() => true)};
});

// The complete daughter-profile CREATION flow, wired exactly as AppNavigator.tsx
// registers it: ManagedProfileType -> ManagedProfileDaughterInfo -> ManagedProfileFirstPeriod
// -> (only if "Oui") ManagedProfileCycleSetup -> ManagedProfileSuccess.
const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 800}, insets: {top: 24, left: 0, right: 0, bottom: 16}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer) => renderer.root.findAllByType(Text).map(textOf);
const flattenStyle = (style: unknown): Record<string, unknown> => {
  const resolved = typeof style === 'function' ? style({pressed: false}) : style;
  return Object.assign({}, ...(Array.isArray(resolved) ? resolved : [resolved]).filter(Boolean));
};
const stack = () => (navRef.getRootState() as {routes: {name: string}[]}).routes.map(route => route.name);
const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

const buttons = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
// Presses the CTA if (and only if) it currently has a working onPress, without
// throwing when it doesn't — used to prove a disabled CTA truly does nothing, rather
// than asserting on the presence/absence of a matching node. (reanimated's
// Animated.View, used by AwaADeuxStepLayout's CTA/Reveal wrappers, can leave a stale,
// already-superseded fiber alongside the live one in the test-renderer tree; that
// stale copy always carries whatever onPress its own last real render had, so it can
// never turn a genuinely-disabled CTA into one that actually advances the flow.)
const softPress = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = buttons(renderer, label);
  if (matches.length > 0) {
    await act(async () => {
      matches[matches.length - 1].props.onPress();
    });
    await settle();
  }
};
const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = buttons(renderer, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
  await settle();
};
const radios = (renderer: ReactTestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAll(node => node.props.accessibilityLabel === label && node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function');
// ManagedProfileCycleSetupScreen.tsx renders TWO DurationStepper instances
// (period length, then cycle length) sharing the same "Augmenter"/"Diminuer"
// labels — same stale-fiber duplication as pickCalendarDay/tapLabel above
// (the live Pressable's immediate parent is always a host 'View', a stale
// one's isn't), so filtering on that disambiguates the 2 live buttons from
// any stale duplicates. `index` 0 = period-length stepper, 1 = cycle-length
// stepper (their render order in the screen).
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
const selectRadio = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const matches = radios(renderer, label);
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
  await settle();
};
const typeInto = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string, value: string) => {
  const input = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === label).pop()!;
  await act(async () => {
    input.props.onChangeText(value);
  });
};
// Defaults to French since every test but the English-localization one below exercises
// the app in French — pass `locale` explicitly wherever the app language under test isn't
// French (see 'ManagedProfile flow — localization (English)' for the one such case).
const monthName = (date: Date, locale = 'fr-FR') => new Intl.DateTimeFormat(locale, {month: 'long'}).format(date);
const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
// InlineCalendarPickerModal's day cell is `<View style={dayCell}><Pressable .../></View>` —
// its own composite Pressable node and the underlying host node both carry the same
// accessibilityLabel, and react-test-renderer's tree walk also surfaces a stale/inert
// duplicate whose immediate parent is itself a Pressable (not the real dayCell View). Only
// the match whose immediate parent is a host 'View' is the live, current one.
const pickCalendarDay = async (renderer: ReactTestRenderer.ReactTestRenderer, date: Date, locale = 'fr-FR') => {
  const label = `${date.getDate()} ${monthName(date, locale)}`;
  const matches = renderer.root.findAll(
    node => typeof node.props.onPress === 'function' && node.props.accessibilityLabel === label && (node.parent?.type as unknown) === 'View',
  );
  expect(matches.length).toBeGreaterThan(0);
  await act(async () => {
    matches[matches.length - 1].props.onPress();
  });
  await settle();
};
// BirthDatePickerModal (Year -> Month -> Day). Same "prefer the match whose parent is
// a host View" disambiguation as pickCalendarDay above — the same reanimated-driven
// stale-fiber duplication (see AwaADeuxStepLayout.tsx) shows up here too.
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
const pickBirthDate = async (renderer: ReactTestRenderer.ReactTestRenderer, date: Date, locale = 'fr-FR') => {
  await tapLabel(renderer, String(date.getFullYear()));
  await tapLabel(renderer, capitalize(monthName(date, locale)));
  await tapLabel(renderer, `${date.getDate()} ${capitalize(monthName(date, locale))}`);
};

// A minimal stand-in for the real MainTabs tab navigator — this suite only needs to
// prove the root stack actually RESETS to this route (Android Back can never reopen
// the creation flow behind it), not re-exercise the real tab navigator/CycleHome
// rendering (covered by CycleHomeScreenBehavior.test.tsx etc.).
function MainTabsStub({route}: {route: {params?: {screen?: string}}}): React.JSX.Element {
  return <Text>MainTabsStub:{route.params?.screen ?? 'default'}</Text>;
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
              <Stack.Screen component={MainTabsStub as never} name="MainTabs" />
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

// Ten years ago (birth date default month) and today (last-period default month) —
// used to click the right calendar day without hardcoding a specific real-world month.
const tenYearsAgo = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 10);
  return date;
};

/** Continue past the intro, fill the daughter-info fields, Continue. Leaves FirstPeriod visible. */
const walkToFirstPeriod = async (renderer: ReactTestRenderer.ReactTestRenderer, firstName = 'Lina') => {
  await press(renderer, 'Continuer'); // intro -> Daughter Information
  await typeInto(renderer, 'Prénom de votre fille', firstName);
  await press(renderer, 'Date de naissance');
  await pickBirthDate(renderer, tenYearsAgo());
  await press(renderer, 'Continuer');
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetManagedProfilesForTests();
  await resetActiveProfileForTests();
  clearManagedProfileDraft();
  resetPremiumStateForTests();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
  await setAppLanguage('fr');
  (launchCamera as jest.Mock).mockClear().mockResolvedValue({didCancel: true});
  (launchImageLibrary as jest.Mock).mockClear().mockResolvedValue({didCancel: true});
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

// PRODUCT DECISION: ManagedProfileProgress (the "Étape N sur 2" step indicator) was
// removed from the managed-profile flow and must not be reintroduced — see
// ManagedProfileDaughterInfoScreen.tsx / ManagedProfileFirstPeriodScreen.tsx /
// ManagedProfileCycleSetupScreen.tsx, none of which pass a `headerAccessory` anymore.
// The describe block that used to live here ('top progress indicator') tested nothing
// but that indicator's presence/label/segment-count/theming; every test's own
// navigation path (intro → Daughter Information → First Period → "Oui" → Cycle Setup,
// and the back-navigation chain) is independently and more thoroughly covered by the
// dedicated describe blocks below ('"Oui" branch (cycle setup)', 'draft preserved
// across back navigation', 'exiting before creation never persists a partial profile'),
// so removing it drops no real coverage — it was not replaced with placeholder
// assertions.

describe('ManagedProfile flow — intro screen ("Ajouter le profil de ma fille")', () => {
  it('is the first screen of the flow, replacing the old "Pour qui créez-vous ce profil ?" picker', async () => {
    const renderer = await renderFlow();
    expect(textsOf(renderer)).toContain('Ajouter le profil\nde ma fille');
    expect(textsOf(renderer).join(' ')).not.toContain('Pour qui créez-vous');
  });

  it('never offers "Un autre profil" — only one managed-profile type exists', async () => {
    const renderer = await renderFlow();
    expect(radios(renderer, 'Un autre profil')).toHaveLength(0);
    expect(textsOf(renderer)).not.toContain('Un autre profil');
  });

  it('shows fille.png prominently at the top (never a placeholder View, remote URL or emoji)', async () => {
    const renderer = await renderFlow();
    // Under Jest, a `require('*.png')` resolves through __mocks__/fileMock.js to the
    // literal value 1 — the SAME value the screen's own require() resolves to.
    const images = renderer.root.findAllByType(Image).filter(node => node.props.source === 1);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0].props.resizeMode).toBe('contain');
  });

  it('shows the exact title and description', async () => {
    const renderer = await renderFlow();
    const texts = textsOf(renderer);
    expect(texts).toContain('Ajouter le profil\nde ma fille');
    expect(texts).toContain('Suivez le cycle de votre fille dans\nun espace sûr et adapté à son âge.');
  });

  it('shows exactly the 3 benefit sections, each with its title and subtitle', async () => {
    const renderer = await renderFlow();
    const texts = textsOf(renderer);
    expect(texts).toContain('Un espace privé et sécurisé');
    expect(texts).toContain('Ses données sont séparées\nde votre profil.');
    expect(texts).toContain('Suivi complet du cycle');
    expect(texts).toContain('Règles, symptômes, humeur\net plus encore.');
    expect(texts).toContain('Une expérience adaptée');
    expect(texts).toContain('Contenu et fonctionnalités\nspécialement conçus pour elle.');
  });

  it('"Continuer" navigates directly to "Informations sur votre fille" — no intermediate screen', async () => {
    const renderer = await renderFlow();
    expect(buttons(renderer, 'Continuer').length).toBeGreaterThan(0);
    await press(renderer, 'Continuer');
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo']);
    expect(textsOf(renderer)).toContain('Informations sur votre fille');
  });

  it('starts a fresh draft on Continue, so a previous abandoned attempt never leaks in', async () => {
    startManagedProfileDraft();
    const renderer = await renderFlow();
    await press(renderer, 'Continuer');
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo']);
  });

  it('renders without overflow on a small (compact Android) screen size', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={{frame: {x: 0, y: 0, width: 320, height: 568}, insets: {top: 20, left: 0, right: 0, bottom: 0}}}>
          <AwaThemeProvider>
            <NavigationContainer>
              <Stack.Navigator initialRouteName="ManagedProfileType" screenOptions={{headerShown: false}}>
                <Stack.Screen component={ManagedProfileTypeScreen as never} name="ManagedProfileType" />
              </Stack.Navigator>
            </NavigationContainer>
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    await settle();
    expect(textsOf(renderer)).toContain('Ajouter le profil\nde ma fille');
    expect(textsOf(renderer)).toContain('Un espace privé et sécurisé');
  });
});

describe('ManagedProfile flow — daughter information', () => {
  it('"Continuer" stays disabled without a first name and a birth date', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer'); // intro -> Daughter Information
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo']);

    await softPress(renderer, 'Continuer');
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo']); // still on this screen

    await typeInto(renderer, 'Prénom de votre fille', 'Lina');
    await softPress(renderer, 'Continuer');
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo']); // still no birth date

    await press(renderer, 'Date de naissance');
    await pickBirthDate(renderer, tenYearsAgo());
    await press(renderer, 'Continuer');
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo', 'ManagedProfileFirstPeriod']);
  });

  it('shows an age computed from the chosen birth date (never a stored/fabricated value)', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer'); // intro -> Daughter Information
    await typeInto(renderer, 'Prénom de votre fille', 'Lina');
    await press(renderer, 'Date de naissance');
    await pickBirthDate(renderer, tenYearsAgo());
    expect(textsOf(renderer).some(text => text.includes('Âge : 10 an'))).toBe(true);
  });
});

describe('ManagedProfile flow — birth-date picker (Year → Month → Day)', () => {
  const openPicker = async (renderer: ReactTestRenderer.ReactTestRenderer) => {
    await press(renderer, 'Continuer'); // intro -> Daughter Information
    await press(renderer, 'Date de naissance');
  };

  it('opening "Date de naissance" shows the new picker — a year list, never the old monthly calendar', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    expect(textsOf(renderer)).toContain('Choisir l’année');
    // The old InlineCalendarPickerModal always shows a "L M M J V S D" week-day row —
    // the new picker never does, at any stage.
    expect(textsOf(renderer)).not.toContain('L');
    expect(renderer.root.findAllByType(FlatList).length).toBeGreaterThan(0);
  });

  it('the year list never offers a future year', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    const currentYear = new Date().getFullYear();
    expect(textsOf(renderer)).toContain(String(currentYear));
    expect(textsOf(renderer)).not.toContain(String(currentYear + 1));
  });

  it('a year can be selected directly, advancing straight to month selection', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, '2016');
    expect(textsOf(renderer)).toContain('Choisir le mois');
    expect(textsOf(renderer)).not.toContain('Choisir l’année');
  });

  it('the month grid shows all 12 French months', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, '2016');
    for (const month of ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']) {
      expect(textsOf(renderer)).toContain(month);
    }
  });

  it('a month can be selected directly, advancing straight to day selection', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, '2016');
    await tapLabel(renderer, 'Septembre');
    expect(textsOf(renderer)).toContain('Septembre 2016');
    expect(textsOf(renderer)).toContain('28'); // a day cell, not a wizard trap
  });

  it('a leap-year February offers day 29; a non-leap February does not — real date logic, not a hardcoded assumption', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, '2016'); // leap year
    await tapLabel(renderer, 'Février');
    expect(textsOf(renderer)).toContain('29');
    expect(textsOf(renderer)).not.toContain('30');

    await tapLabel(renderer, 'Revenir à l’année 2016'); // breadcrumb back to year stage
    await tapLabel(renderer, '2015'); // not a leap year
    await tapLabel(renderer, 'Février');
    expect(textsOf(renderer)).not.toContain('29');
  });

  it('a 30-day month shows no 31st; a 31-day month does', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, '2016');
    await tapLabel(renderer, 'Avril'); // 30 days
    expect(textsOf(renderer)).not.toContain('31');

    await tapLabel(renderer, 'Revenir au mois de Avril'); // breadcrumb back to month stage
    await tapLabel(renderer, 'Janvier'); // 31 days
    expect(textsOf(renderer)).toContain('31');
  });

  it('future months and future days cannot be selected — structurally, not just rejected afterwards', async () => {
    // Uses the real current date dynamically (no fake timers — this file drives real
    // reanimated/FlatList timing elsewhere, and faking `Date.now()` has been observed
    // to wedge that machinery across later tests) so this stays meaningful and
    // deterministic on whatever day the suite actually runs.
    const today = new Date();
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, String(today.getFullYear())); // the current year

    const findByLabel = (label: string) =>
      renderer.root.findAll(node => node.props.accessibilityLabel === label && typeof node.props.disabled !== 'undefined')[0];

    const currentMonthCell = findByLabel(monthNames[today.getMonth()]);
    expect(currentMonthCell.props.disabled).toBe(false);
    if (today.getMonth() < 11) {
      expect(findByLabel(monthNames[today.getMonth() + 1]).props.disabled).toBe(true);
    }

    await tapLabel(renderer, monthNames[today.getMonth()]); // the current month
    const todayLabel = `${today.getDate()} ${capitalize(monthName(today))}`;
    expect(findByLabel(todayLabel).props.disabled).toBe(false);
    const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    if (today.getDate() < daysInCurrentMonth) {
      const tomorrowLabel = `${today.getDate() + 1} ${capitalize(monthName(today))}`;
      expect(findByLabel(tomorrowLabel).props.disabled).toBe(true);
    }
  });

  it('the selected date is saved in the same existing format (local en-CA date key on the created profile)', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');
    expect(getManagedProfiles()[0].birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('reopens with the already-selected year marked, instead of starting from the current year every time', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, '2016');
    await tapLabel(renderer, 'Septembre');
    await tapLabel(renderer, '28 Septembre');
    // Reopen — the existing 2016 must already read as selected, not the default guess.
    await press(renderer, 'Date de naissance');
    const yearRow = renderer.root.findAll(node => node.props.accessibilityLabel === '2016')[0];
    expect(yearRow.props.accessibilityState).toEqual({selected: true});
  });

  it('the breadcrumb lets the mother correct the year without restarting the whole picker', async () => {
    const renderer = await renderFlow();
    await openPicker(renderer);
    await tapLabel(renderer, '2016');
    await tapLabel(renderer, 'Septembre'); // now on the day stage
    await tapLabel(renderer, 'Revenir à l’année 2016'); // breadcrumb chip back to the year stage
    expect(textsOf(renderer)).toContain('Choisir l’année');
    await tapLabel(renderer, '2017');
    expect(textsOf(renderer)).toContain('Choisir le mois');
  });
});

describe('ManagedProfile flow — "Non" branch (skips cycle setup entirely)', () => {
  it('creates the profile immediately, with no fabricated cycle fields, and jumps straight to Success', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    expect(stack().slice(-1)).toEqual(['ManagedProfileFirstPeriod']);

    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');

    // navigation.replace() swaps FirstPeriod for Success on the stack (never pushes on
    // top of it) — she can't "go back" into the question she just answered "Non" to.
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo', 'ManagedProfileSuccess']);
    expect(stack()).not.toContain('ManagedProfileFirstPeriod');
    expect(stack()).not.toContain('ManagedProfileCycleSetup');

    const profiles = getManagedProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].firstName).toBe('Lina');
    expect(profiles[0].hasHadFirstPeriod).toBe(false);
    expect(profiles[0].lastPeriodDate).toBeNull();
    expect(profiles[0].periodLength).toBeNull();
    expect(profiles[0].cycleLength).toBeNull();
    expect(profiles[0].id.startsWith('daughter_')).toBe(true);
    expect(profiles[0].birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // local en-CA date key, never a UTC ISO slice
    expect(profiles[0]).not.toHaveProperty('age'); // age is always derived, never stored

    // Dynamic success copy — never a hardcoded name.
    expect(textsOf(renderer)).toContain('Profil de Lina créé avec succès !');
    expect(textsOf(renderer)).toContain('Accéder au profil de Lina');
    expect(textsOf(renderer)).toContain('Rester sur mon profil');

    // Success circle: fille.png alongside the existing green check — the check is
    // never replaced by the illustration. Disambiguated from earlier screens' own
    // (smaller) fille.png images, still mounted underneath, by its own 136px size
    // (styles.successIllustration in ManagedProfileSuccessScreen.tsx).
    const successImages = renderer.root.findAllByType(Image).filter(node => {
      if (node.props.source !== 1 || node.props.resizeMode !== 'contain') {return false;}
      return flattenStyle(node.props.style).width === 136;
    });
    expect(successImages.length).toBeGreaterThan(0);
    const checkIcons = renderer.root.findAll(node => node.props.name === 'check-bold');
    expect(checkIcons.length).toBeGreaterThan(0);

    // Her actual custom photo (if any) is never overwritten by the decorative fille.png.
    expect(getManagedProfiles()[0].profileImageUri).toBeNull();
  });
});

describe('ManagedProfile flow — First Period illustration (fille.png)', () => {
  it('the empty placeholder is gone — fille.png is rendered prominently, and Oui/Non/branching are unchanged', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');

    // Earlier screens (Type's own card image, DaughterInfo's avatar) stay mounted
    // underneath and also use fille.png at a smaller size — disambiguated here by
    // size: this screen's own illustration is the large, ≥150px one.
    const illustration = renderer.root.findAllByType(Image).filter(node => {
      if (node.props.source !== 1 || node.props.resizeMode !== 'contain') {return false;}
      return Number(flattenStyle(node.props.style).width) >= 150;
    });
    expect(illustration.length).toBeGreaterThan(0); // prominent, not a tiny icon

    // Oui/Non selection and branching are untouched.
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    expect(stack().slice(-1)).toEqual(['ManagedProfileCycleSetup']);
  });
});

describe('ManagedProfile flow — "Oui" branch (cycle setup)', () => {
  it('"Continuer" stays disabled without a "Date des dernières règles"', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    expect(stack().slice(-1)).toEqual(['ManagedProfileCycleSetup']);
    await softPress(renderer, 'Créer le profil');
    expect(stack().slice(-1)).toEqual(['ManagedProfileCycleSetup']); // still here — nothing was created
    expect(getManagedProfiles()).toHaveLength(0);
  });

  it('the duration steppers default to 5/28 and clamp to the mother’s own onboarding ranges (2–10 / 20–40)', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');

    expect(textsOf(renderer)).toContain('5 jours');
    expect(textsOf(renderer)).toContain('28 jours');

    const decreasePeriod = renderer.root.findAll(node => node.props.accessibilityLabel === 'Diminuer' && typeof node.props.onPress === 'function');
    for (let index = 0; index < 6; index += 1) {
      await act(async () => {
        decreasePeriod[0].props.onPress();
      });
    }
    expect(textsOf(renderer)).toContain('2 jours'); // clamped at the minimum, never below
  });

  // SAFETY FIX — never fabricate a confirmed 28-day cycle / 5-day period: the
  // stepper still SHOWS a sensible starting value (5/28), but unless the
  // mother actually presses + or - on a given stepper, that value is never
  // persisted as if she had confirmed it (see ManagedProfileCycleSetupScreen
  // .tsx's periodLengthTouched/cycleLengthTouched and managedProfileCycleSeed
  // .ts's getHasConfirmedCycleDuration()-gated seeding).
  it('[A] submitting without touching either stepper creates the profile with period/cycle length null, not the displayed 5/28 default', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');

    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());
    await press(renderer, 'Créer le profil');

    // navigation.replace() swaps CycleSetup for Success (never pushes on top of it).
    expect(stack()).toEqual([
      'ManagedProfileType',
      'ManagedProfileDaughterInfo',
      'ManagedProfileFirstPeriod',
      'ManagedProfileSuccess',
    ]);
    expect(stack()).not.toContain('ManagedProfileCycleSetup');

    const profiles = getManagedProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].hasHadFirstPeriod).toBe(true);
    expect(profiles[0].periodLength).toBeNull(); // untouched stepper — never silently confirmed
    expect(profiles[0].cycleLength).toBeNull();
    expect(profiles[0].regularity).toBe('unknown'); // never selected — default, never inferred from 28 days
    expect(profiles[0].lastPeriodDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(textsOf(renderer)).toContain('Profil de Lina créé avec succès !');
  });

  it('[B] explicitly confirming only the period-length stepper persists it, while cycle length stays null', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');

    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());
    await pressStepper(renderer, 'Augmenter', 0); // period-length stepper only (5 -> 6)
    await press(renderer, 'Créer le profil');

    const profiles = getManagedProfiles();
    expect(profiles[0].periodLength).toBe(6);
    expect(profiles[0].cycleLength).toBeNull();
  });

  it('[C] explicitly confirming only the cycle-length stepper persists it, while period length stays null', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');

    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());
    await pressStepper(renderer, 'Augmenter', 1); // cycle-length stepper only (28 -> 29)
    await press(renderer, 'Créer le profil');

    const profiles = getManagedProfiles();
    expect(profiles[0].periodLength).toBeNull();
    expect(profiles[0].cycleLength).toBe(29);
  });

  it('[D] explicitly confirming both steppers persists both real values, and marks cycle duration genuinely confirmed', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');

    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());
    await pressStepper(renderer, 'Augmenter', 0); // 5 -> 6
    await pressStepper(renderer, 'Diminuer', 1); // 28 -> 27
    await press(renderer, 'Créer le profil');

    const profiles = getManagedProfiles();
    expect(profiles[0].periodLength).toBe(6);
    expect(profiles[0].cycleLength).toBe(27);

    await press(renderer, 'Accéder au profil de Lina');
    expect(getCyclePreferences().periodDuration).toBe(6);
    expect(getCyclePreferences().cycleDuration).toBe(27);
    expect(getHasConfirmedCycleDuration()).toBe(true); // genuinely confirmed this time
  });

  it('[E] leaving Cycle Setup without creating and coming back never pre-marks the (fresh) steppers as touched', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    await pressStepper(renderer, 'Augmenter', 0); // touch period length (never submitted)

    await press(renderer, 'Retour'); // back to First Period — Cycle Setup unmounts
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer'); // forward again — Cycle Setup remounts fresh

    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());
    await press(renderer, 'Créer le profil'); // never touched the (fresh) steppers this time

    const profiles = getManagedProfiles();
    expect(profiles[0].periodLength).toBeNull();
    expect(profiles[0].cycleLength).toBeNull();
  });

  describe('regularity ("Régularité du cycle")', () => {
    it('shows all 3 choices, defaulting to "Je ne sais pas" — never auto-selecting "Régulier" just because the cycle is 28 days', async () => {
      const renderer = await renderFlow();
      await walkToFirstPeriod(renderer, 'Lina');
      await selectRadio(renderer, 'Oui');
      await press(renderer, 'Continuer');

      expect(textsOf(renderer)).toContain('Régularité du cycle');
      expect(radios(renderer, 'Régulier').length).toBeGreaterThan(0);
      expect(radios(renderer, 'Irrégulier').length).toBeGreaterThan(0);
      expect(radios(renderer, 'Je ne sais pas').length).toBeGreaterThan(0);

      expect(radios(renderer, 'Je ne sais pas')[0].props.accessibilityState).toEqual({checked: true});
      expect(radios(renderer, 'Régulier')[0].props.accessibilityState).toEqual({checked: false});
      expect(radios(renderer, 'Irrégulier')[0].props.accessibilityState).toEqual({checked: false});
    });

    it.each([
      ['Régulier', 'yes'],
      ['Irrégulier', 'no'],
      ['Je ne sais pas', 'unknown'],
    ] as const)('selecting "%s" persists as %s — in the draft, the created profile, and her profile-scoped cycle state', async (label, expected) => {
      const renderer = await renderFlow();
      await walkToFirstPeriod(renderer, 'Lina');
      await selectRadio(renderer, 'Oui');
      await press(renderer, 'Continuer');

      await selectRadio(renderer, label);
      expect(radios(renderer, label)[0].props.accessibilityState).toEqual({checked: true});

      await press(renderer, 'Date des dernières règles');
      await pickCalendarDay(renderer, new Date());
      await press(renderer, 'Créer le profil');

      const profiles = getManagedProfiles();
      expect(profiles[0].regularity).toBe(expected);
      // Steppers were never touched in this flow — selecting a regularity
      // radio must never be conflated with confirming a duration (see the
      // safety fix above): period/cycle length stay null, never the 5/28
      // displayed default.
      expect(profiles[0].periodLength).toBeNull();
      expect(profiles[0].cycleLength).toBeNull();

      await press(renderer, `Accéder au profil de Lina`);
      expect(getCyclePreferences().regularity).toBe(expected);
      // The "Oui" path only explicitly asked/confirmed REGULARITY here, not
      // duration (the steppers were never touched) — so duration must NOT be
      // treated as genuinely confirmed. [D] above covers the case where she
      // does touch both steppers.
      expect(getHasConfirmedCycleDuration()).toBe(false);
    });

    it('the "Non" branch (never reaches this screen) never fabricates a regularity value', async () => {
      const renderer = await renderFlow();
      await walkToFirstPeriod(renderer, 'Yasmine');
      await selectRadio(renderer, 'Non');
      await press(renderer, 'Continuer');

      expect(getManagedProfiles()[0].regularity).toBeNull();
    });
  });

  it('supports creating a second, independent daughter profile', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');
    expect(getManagedProfiles()).toHaveLength(1);

    await act(async () => {
      navRef.resetRoot({index: 0, routes: [{name: 'ManagedProfileType'}]});
    });
    await settle();
    clearManagedProfileDraft();

    await walkToFirstPeriod(renderer, 'Yasmine');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');

    const profiles = getManagedProfiles();
    expect(profiles).toHaveLength(2);
    expect(profiles.map(profile => profile.firstName).sort()).toEqual(['Lina', 'Yasmine']);
    expect(new Set(profiles.map(profile => profile.id)).size).toBe(2);
  });
});

describe('ManagedProfile flow — draft preserved across back navigation', () => {
  it('going forward then Back still shows the typed first name and chosen birth date', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer'); // intro -> Daughter Information
    await typeInto(renderer, 'Prénom de votre fille', 'Lina');
    await press(renderer, 'Date de naissance');
    await pickBirthDate(renderer, tenYearsAgo());
    await press(renderer, 'Continuer');
    expect(stack().slice(-1)).toEqual(['ManagedProfileFirstPeriod']);

    await press(renderer, 'Retour');
    expect(stack().slice(-1)).toEqual(['ManagedProfileDaughterInfo']);

    const input = renderer.root.findAllByType(TextInput).filter(node => node.props.accessibilityLabel === 'Prénom de votre fille').pop()!;
    expect(input.props.value).toBe('Lina');
    expect(textsOf(renderer).some(text => text.includes('Âge : 10 an'))).toBe(true);
  });
});

describe('ManagedProfile flow — exiting before creation never persists a partial profile', () => {
  it('backing all the way out of the flow leaves managedProfilesStore empty', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    // Filled in the cycle-setup step, then abandoned before "Créer le profil".
    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());

    expect(getManagedProfiles()).toHaveLength(0);
    await press(renderer, 'Retour');
    await press(renderer, 'Retour');
    await press(renderer, 'Retour');
    expect(getManagedProfiles()).toHaveLength(0);
  });
});

describe('ManagedProfile flow — theming', () => {
  it('resolves colors from useAwaTheme() in both Light and Dark — nothing hardcoded', async () => {
    const renderer = await renderFlow();
    const light = resolveAwaTheme('awa-original', false, false);
    const backCircle = () => renderer.root.findAll(node => node.props.accessibilityLabel === 'Retour')[0];
    expect(flattenStyle(backCircle().props.style).backgroundColor).toBe(light.colors.surface);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(flattenStyle(backCircle().props.style).backgroundColor).toBe(dark.colors.surface);
    expect(dark.colors.surface).not.toBe(light.colors.surface);

    await act(async () => {
      await setAppearanceMode('light');
    });
  });
});

describe('ManagedProfile flow — daughter avatar photo (camera / gallery)', () => {
  const openDaughterInfo = async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer'); // intro -> Daughter Information
    return renderer;
  };
  // The intro screen's own fille.png hero stays mounted underneath (earlier screens
  // are never unmounted), so the avatar's default image is disambiguated by its own
  // fixed 96×96 numeric size (the hero's own width is the string '100%') rather than
  // by source alone.
  const defaultAvatar = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root
      .findAllByType(Image)
      .filter(node => node.props.source === 1 && node.props.resizeMode === 'contain' && flattenStyle(node.props.style).width === 96);
  const customAvatar = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.findAllByType(Image).filter(node => node.props.resizeMode === 'cover' && node.props.source?.uri);

  it('shows fille.png as the default avatar before any photo is chosen', async () => {
    const renderer = await openDaughterInfo();
    expect(defaultAvatar(renderer).length).toBeGreaterThan(0);
    expect(customAvatar(renderer)).toHaveLength(0);
  });

  it('tapping the camera button opens the photo-source sheet', async () => {
    const renderer = await openDaughterInfo();
    expect(textsOf(renderer)).not.toContain('Photo de profil');
    await press(renderer, 'Modifier la photo du profil');
    expect(textsOf(renderer)).toContain('Photo de profil');
    expect(textsOf(renderer)).toContain('Choisissez une photo pour son profil.');
    expect(textsOf(renderer)).toContain('Prendre une photo');
    expect(textsOf(renderer)).toContain('Choisir dans la galerie');
    expect(textsOf(renderer)).toContain('Annuler');
  });

  it('"Annuler" closes the sheet without changing the avatar', async () => {
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Annuler');
    expect(textsOf(renderer)).not.toContain('Photo de profil');
    expect(defaultAvatar(renderer).length).toBeGreaterThan(0);
    expect(launchCamera).not.toHaveBeenCalled();
    expect(launchImageLibrary).not.toHaveBeenCalled();
  });

  it('"Prendre une photo" calls the existing launchCamera image-picker method', async () => {
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Prendre une photo');
    expect(launchCamera).toHaveBeenCalledTimes(1);
    expect(launchImageLibrary).not.toHaveBeenCalled();
  });

  it('"Choisir dans la galerie" calls the existing launchImageLibrary method, images only', async () => {
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Choisir dans la galerie');
    expect(launchImageLibrary).toHaveBeenCalledTimes(1);
    expect((launchImageLibrary as jest.Mock).mock.calls[0][0]).toMatchObject({mediaType: 'photo', selectionLimit: 1});
    expect(launchCamera).not.toHaveBeenCalled();
  });

  it('a cancelled picker does not crash and keeps the default avatar', async () => {
    (launchCamera as jest.Mock).mockResolvedValueOnce({didCancel: true});
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Prendre une photo'); // would throw/reject on a real crash
    expect(defaultAvatar(renderer).length).toBeGreaterThan(0);
    expect(textsOf(renderer)).not.toContain('Photo de profil'); // sheet closed
  });

  it('a picker error does not crash and shows an AWA-compatible message, never a raw crash', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce({errorCode: 'camera_unavailable'});
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Choisir dans la galerie');
    expect(alertSpy).toHaveBeenCalledWith('Photo de profil', expect.any(String));
    alertSpy.mockRestore();
  });

  it('a selected image replaces the default avatar', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce({assets: [{uri: 'file:///daughter-photo.jpg'}]});
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Choisir dans la galerie');
    expect(defaultAvatar(renderer)).toHaveLength(0);
    const custom = customAvatar(renderer);
    expect(custom.length).toBeGreaterThan(0);
    expect(custom[0].props.source.uri).toBe('file:///daughter-photo.jpg');
  });

  it('going forward then Back preserves the selected photo', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce({assets: [{uri: 'file:///daughter-photo.jpg'}]});
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Choisir dans la galerie');
    await typeInto(renderer, 'Prénom de votre fille', 'Lina');
    await press(renderer, 'Date de naissance');
    await pickBirthDate(renderer, tenYearsAgo());
    await press(renderer, 'Continuer');
    expect(stack().slice(-1)).toEqual(['ManagedProfileFirstPeriod']);

    await press(renderer, 'Retour');
    expect(stack().slice(-1)).toEqual(['ManagedProfileDaughterInfo']);
    const custom = customAvatar(renderer);
    expect(custom.length).toBeGreaterThan(0);
    expect(custom[0].props.source.uri).toBe('file:///daughter-photo.jpg');
  });

  it('a custom photo is optional — "Continuer" is never disabled by a missing photo', async () => {
    const renderer = await openDaughterInfo();
    await typeInto(renderer, 'Prénom de votre fille', 'Lina');
    await press(renderer, 'Date de naissance');
    await pickBirthDate(renderer, tenYearsAgo());
    // No photo was ever chosen, yet Continuer works.
    await press(renderer, 'Continuer');
    expect(stack().slice(-1)).toEqual(['ManagedProfileFirstPeriod']);
  });

  it('the created managed profile retains its photo URI ("Non" branch)', async () => {
    (launchCamera as jest.Mock).mockResolvedValueOnce({assets: [{uri: 'file:///daughter-photo.jpg'}]});
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    await press(renderer, 'Prendre une photo');
    await typeInto(renderer, 'Prénom de votre fille', 'Lina');
    await press(renderer, 'Date de naissance');
    await pickBirthDate(renderer, tenYearsAgo());
    await press(renderer, 'Continuer');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');

    const profiles = getManagedProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].profileImageUri).toBe('file:///daughter-photo.jpg');
  });

  it('without a chosen photo, the created profile has no photo URI (fille.png stays the default)', async () => {
    const renderer = await openDaughterInfo();
    await typeInto(renderer, 'Prénom de votre fille', 'Lina');
    await press(renderer, 'Date de naissance');
    await pickBirthDate(renderer, tenYearsAgo());
    await press(renderer, 'Continuer');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');

    const profiles = getManagedProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].profileImageUri).toBeNull();
  });

  it('never uploads the photo remotely — no fetch/network call happens while choosing it', async () => {
    (launchImageLibrary as jest.Mock).mockResolvedValueOnce({assets: [{uri: 'file:///daughter-photo.jpg'}]});
    const fetchSpy = jest.fn();
    const originalFetch = (global as {fetch?: unknown}).fetch;
    (global as {fetch?: unknown}).fetch = fetchSpy;
    try {
      const renderer = await openDaughterInfo();
      await press(renderer, 'Modifier la photo du profil');
      await press(renderer, 'Choisir dans la galerie');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      (global as {fetch?: unknown}).fetch = originalFetch;
    }
  });

  it('resolves the photo sheet from useAwaTheme() in both Light and Dark — nothing hardcoded', async () => {
    const renderer = await openDaughterInfo();
    await press(renderer, 'Modifier la photo du profil');
    const light = resolveAwaTheme('awa-original', false, false);
    const sheetTitle = () => renderer.root.findAllByType(Text).find(node => textOf(node) === 'Photo de profil')!;
    expect(flattenStyle(sheetTitle().props.style).color).toBe(light.colors.accent);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    const dark = resolveAwaTheme('awa-original', true, false);
    expect(flattenStyle(sheetTitle().props.style).color).toBe(dark.colors.accent);
    expect(dark.colors.accent).not.toBe(light.colors.accent);

    await act(async () => {
      await setAppearanceMode('light');
    });
  });
});

describe('ManagedProfile flow — Success screen navigation ("Accéder au profil" / "Rester sur mon profil")', () => {
  it('"Rester sur mon profil" sets the OWNER active, resets to MainTabs → Profile, and Back cannot reopen the creation flow', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');
    expect(stack()).toEqual(['ManagedProfileType', 'ManagedProfileDaughterInfo', 'ManagedProfileSuccess']);

    await press(renderer, 'Rester sur mon profil');

    expect(getActiveProfileId()).toBe(OWNER_PROFILE_ID);
    expect(stack()).toEqual(['MainTabs']); // the whole creation flow left history
    expect(textsOf(renderer)).toContain('MainTabsStub:Profile');
  });

  it('"Accéder au profil de {name}" sets the DAUGHTER active, resets to MainTabs → CycleHome, and Back cannot reopen the creation flow', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');
    const created = getManagedProfiles()[0];

    await press(renderer, 'Accéder au profil de Lina');

    expect(getActiveProfileId()).toBe(created.id);
    expect(stack()).toEqual(['MainTabs']);
    expect(textsOf(renderer)).toContain('MainTabsStub:CycleHome');
  });

  it('works the same for a daughter created through the "Oui" (cycle setup) branch, with the correct dynamic name', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Maissoun');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());
    await press(renderer, 'Créer le profil');
    const created = getManagedProfiles()[0];
    expect(created.firstName).toBe('Maissoun'); // never a hardcoded name

    await press(renderer, 'Accéder au profil de Maissoun');

    expect(getActiveProfileId()).toBe(created.id);
    expect(stack()).toEqual(['MainTabs']);
  });

  it('"Accéder au profil" seeds her cycle context from what she just declared (end-to-end, not just the unit-level seed function)', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Hanane');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    await press(renderer, 'Date des dernières règles');
    await pickCalendarDay(renderer, new Date());
    await press(renderer, 'Créer le profil');

    await press(renderer, 'Accéder au profil de Hanane');

    expect(getCyclePreferences().periodDuration).toBe(5); // the default stepper value from CycleSetup
    expect(getCyclePreferences().cycleDuration).toBe(28);
  });
});

describe('ManagedProfile flow — no three-dot overflow menu anywhere in daughter onboarding', () => {
  const hasOverflowMenu = (renderer: ReactTestRenderer.ReactTestRenderer) =>
    renderer.root.findAll(
      node => typeof node.props.name === 'string' && /dots-horizontal|dots-vertical/.test(node.props.name),
    ).length > 0;

  it('the intro screen has none', async () => {
    const renderer = await renderFlow();
    expect(hasOverflowMenu(renderer)).toBe(false);
  });

  it('Daughter Information has none', async () => {
    const renderer = await renderFlow();
    await press(renderer, 'Continuer');
    expect(hasOverflowMenu(renderer)).toBe(false);
  });

  it('First Period has none', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    expect(hasOverflowMenu(renderer)).toBe(false);
  });

  it('Cycle Setup has none', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Oui');
    await press(renderer, 'Continuer');
    expect(hasOverflowMenu(renderer)).toBe(false);
  });

  it('the Success screen has none', async () => {
    const renderer = await renderFlow();
    await walkToFirstPeriod(renderer, 'Lina');
    await selectRadio(renderer, 'Non');
    await press(renderer, 'Continuer');
    expect(hasOverflowMenu(renderer)).toBe(false);
  });
});

/* ============================================================
   Static guards — this flow must stay a MANAGED profile (under the main
   user's own account), never an AWA à deux partner account, and must not
   yet touch the mother's own cycle/journal stores (CLAUDE.md §4/§9 scope).
============================================================ */

describe('ManagedProfile flow — isolation guards (static source scan)', () => {
  const screenFiles = [
    'ManagedProfileTypeScreen.tsx',
    'ManagedProfileDaughterInfoScreen.tsx',
    'ManagedProfileFirstPeriodScreen.tsx',
    'ManagedProfileCycleSetupScreen.tsx',
    'ManagedProfileSuccessScreen.tsx',
  ];
  const AWA_A_DEUX_IDENTIFIERS = [
    'partnerName',
    'PartnerProfile',
    'PartnerMainTabs',
    'connectionStatus',
    'awaADeuxPartnerStore',
    'awaADeuxSharingStore',
    'awaADeuxDemoStore',
  ];
  const MOTHER_OWN_STORES = [
    'confirmedPeriodHistoryStore',
    'dailyJournalStore',
    'personalInformationStore',
    'generalHealthStore',
  ];

  it.each(screenFiles)('%s never references AWA à deux partner concepts', fileName => {
    const source = fs.readFileSync(path.resolve(__dirname, '..', fileName), 'utf8');
    for (const identifier of AWA_A_DEUX_IDENTIFIERS) {
      expect(source).not.toContain(identifier);
    }
  });

  it.each(screenFiles)('%s never touches the mother’s own cycle/journal/personal-info stores', fileName => {
    const source = fs.readFileSync(path.resolve(__dirname, '..', fileName), 'utf8');
    for (const identifier of MOTHER_OWN_STORES) {
      expect(source).not.toContain(identifier);
    }
  });

  it('managedProfilesStore.ts never references AWA à deux partner concepts either', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../state/managedProfilesStore.ts'), 'utf8');
    for (const identifier of AWA_A_DEUX_IDENTIFIERS) {
      expect(source).not.toContain(identifier);
    }
  });
});

describe('ManagedProfile flow — localization (English)', () => {
  it('the whole flow (intro, daughter info, first period, cycle setup, success) renders in English when the app language is English', async () => {
    await setAppLanguage('en');
    const renderer = await renderFlow();

    expect(textsOf(renderer)).toContain('Add your daughter’s\nprofile');
    expect(textsOf(renderer)).toContain('Complete cycle tracking');
    expect(textsOf(renderer)).not.toContain('Ajouter le profil\nde ma fille');

    await press(renderer, 'Continue');
    expect(textsOf(renderer)).toContain('About your daughter');
    expect(textsOf(renderer)).toContain('First name');
    await typeInto(renderer, 'Your daughter’s first name', 'Lina');
    await press(renderer, 'Date of birth');
    await pickBirthDate(renderer, tenYearsAgo(), 'en-US');
    expect(textsOf(renderer).some(text => text.includes('Age: 10 year'))).toBe(true);
    await press(renderer, 'Continue');

    expect(textsOf(renderer)).toContain('Has she already had her first period?');
    await selectRadio(renderer, 'Yes');
    await press(renderer, 'Continue');

    expect(textsOf(renderer)).toContain('About her cycle');
    expect(textsOf(renderer)).toContain('Cycle regularity');
    await press(renderer, 'Last period start date');
    await pickCalendarDay(renderer, new Date(), 'en-US');
    await selectRadio(renderer, 'Regular');
    await press(renderer, 'Create profile');

    expect(textsOf(renderer)).toContain('Lina’s profile has been created!');
    expect(textsOf(renderer)).toContain('Go to Lina’s profile');
    expect(textsOf(renderer)).toContain('Stay on my profile');

    await setAppLanguage('fr');
  });
});

// SPANISH CALENDAR / DATE LOCALIZATION — extends the English-localization
// test above to Spanish, since the birth-date picker and the cycle-setup
// calendar both render real month/day labels (BirthDatePickerModal /
// InlineCalendarPickerModal) that used to silently fall back to French
// whenever the app language was Spanish.
describe('ManagedProfile flow — localization (Spanish)', () => {
  it('the whole flow (intro, daughter info, first period, cycle setup, success) renders in Spanish, including the date pickers, when the app language is Spanish', async () => {
    await setAppLanguage('es');
    const renderer = await renderFlow();

    expect(textsOf(renderer)).toContain('Añadir el perfil\nde mi hija');
    expect(textsOf(renderer)).toContain('Seguimiento completo del ciclo');
    expect(textsOf(renderer)).not.toContain('Ajouter le profil\nde ma fille');

    await press(renderer, 'Continuar'); // intro -> Daughter Information
    expect(textsOf(renderer)).toContain('Información sobre tu hija');
    expect(textsOf(renderer)).toContain('Nombre');
    await typeInto(renderer, 'Nombre de tu hija', 'Lina');
    await press(renderer, 'Fecha de nacimiento');
    await pickBirthDate(renderer, tenYearsAgo(), 'es-ES');
    expect(textsOf(renderer).some(text => text.includes('Edad: 10 año'))).toBe(true);
    await press(renderer, 'Continuar');

    expect(textsOf(renderer)).toContain('¿Ya tuvo su primera menstruación?');
    await selectRadio(renderer, 'Sí');
    await press(renderer, 'Continuar');

    expect(textsOf(renderer)).toContain('Información sobre su ciclo');
    expect(textsOf(renderer)).toContain('Regularidad del ciclo');
    await press(renderer, 'Fecha de la última menstruación');
    await pickCalendarDay(renderer, new Date(), 'es-ES');
    await selectRadio(renderer, 'Regular');
    await press(renderer, 'Crear el perfil');

    expect(textsOf(renderer)).toContain('¡Perfil de Lina creado con éxito!');
    expect(textsOf(renderer)).toContain('Acceder al perfil de Lina');
    expect(textsOf(renderer)).toContain('Permanecer en mi perfil');

    await setAppLanguage('fr');
  });
});
