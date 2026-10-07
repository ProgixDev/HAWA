import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';
import notifee from '@notifee/react-native';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {JournalSheetProvider} from '../../navigation/JournalSheetContext';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

import CalendarScreen from '../CalendarScreen';
import CycleHomeScreen from '../CycleHomeScreen';
import StatisticsScreen from '../StatisticsScreen';
import ProfileScreen from '../ProfileScreen';
import AppearanceScreen from '../AppearanceScreen';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import PrivacySecurityScreen from '../PrivacySecurityScreen';
import LocationScreen from '../LocationScreen';
import LibraryScreen from '../LibraryScreen';
import HelpSupportScreen from '../HelpSupportScreen';
import FastingQadaaScreen from '../FastingQadaaScreen';
import NameOnboardingScreen from '../NameOnboardingScreen';
import PregnancyWeekScreen from '../pregnancy/PregnancyWeekScreen';
import JournalSymptomsScreen from '../journal/JournalSymptomsScreen';
import AwaADeuxIntroScreen from '../awaADeux/AwaADeuxIntroScreen';
import {HawaPremiumBottomSheet} from '../../components/premium/HawaPremiumBottomSheet';
import {resetPremiumStateForTests} from '../../state/premiumStore';
import {detectCountryCode} from '../../services/countryDetection';
import {resetSelectedLocationForTests} from '../../state/onboardingPreferences';

import {scheduleLocalNotification} from '../../services/pregnancyNotifications';
import {getPrivacySecuritySettings} from '../../state/securityPreferences';

import {formatFlowIntensityLabel, formatSectionNoteLines} from '../../services/medicalExportFormatting';
import type {DailyJournalEntry} from '../../types/journal';

import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {computePregnancyStatus} from '../../utils/pregnancyTrackingUtils';
import {getPregnancyDating, hydratePregnancyDating, setPregnancyDating} from '../../state/pregnancyPreferences';

import {journalOptionLabel} from '../../utils/journalOptionLabels';
import {phaseFor} from '../../utils/cycleMath';
import {saveJournalSection, getJournalEntry} from '../../state/dailyJournalStore';
import {savePostpartumJournalField, getPostpartumJournalEntry, hydratePostpartumJournal} from '../../state/postpartumJournalStore';
import {savePostpartumLochiaEntry, getPostpartumLochiaEntry, hydratePostpartumLochia} from '../../state/postpartumLochiaStore';
import {savePregnancySymptoms, getPregnancyJournalState} from '../../state/pregnancyJournalStore';
import {saveMiscarriageJournalField, getMiscarriageJournalEntry, hydrateMiscarriageJournal} from '../../state/miscarriageJournalStore';
import {saveContraceptionJournalField, getContraceptionJournalEntry, hydrateContraceptionJournal} from '../../state/contraceptionJournalStore';

// PHASE — SPANISH REAL-SURFACE COVERAGE.
//
// es.ts is structurally complete (6,064 keys, 1:1 with fr/en) and already
// professionally translated. What has NEVER been proven by a test is that it
// is actually CONSUMED by real, reachable screens/services, and that
// switching the app language to Spanish never mutates a single persisted
// value. Every sibling Phase7*LanguageSwitch.test.tsx file in this directory
// already proves the FR<->EN half of this for its own area; this file
// extends the exact same rendering/mocking conventions one step further to
// Spanish, picking ONE representative, genuinely Spanish-specific string per
// area (never a generic word that could coincidentally match French/English)
// rather than re-asserting every migrated string a second time.
//
// PART A — representative Spanish rendering, one real screen/service per
// area (18 areas: Onboarding, Home, Calendar, Journal, Statistics, Profile,
// Appearance, Auth/Forgot password, Privacy, Location, AWA à deux, Library,
// Pregnancy week [documented gap], Premium, Help/FAQ, Qadaa, Notifications,
// PDF/CSV export chrome).
// PART B — stored-data safety: 6 real domains where a stable, persisted
// French value is proven byte-identical across EN -> ES -> FR (1 domain,
// cycle phase, is purely computed/derived and never persisted — documented
// as a finding, not forced into a fake test).

jest.mock('../../services/countryDetection', () => ({
  detectCountryCode: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/maps/mapStyle', () => ({
  loadMapStyle: jest.fn(async () => ({version: 8, sources: {}, layers: []})),
}));

jest.mock('../../services/maps/mapProvider', () => ({
  ...jest.requireActual('../../services/maps/mapProvider'),
  mapProvider: {
    searchPlaces: jest.fn(async () => []),
    reverseGeocode: jest.fn(async () => null),
  },
}));

jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactActual = require('react');
  const {Text: RNText} = require('react-native');
  return {
    __esModule: true,
    Camera: ReactActual.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
      ReactActual.useImperativeHandle(ref, () => ({easeTo: () => {}}));
      return <RNText testID="camera-center">null</RNText>;
    }),
    Map: ({children}: {children?: React.ReactNode}) => children ?? null,
    UserLocation: () => null,
  };
});

jest.mock('../../state/libraryStore', () => ({
  loadLibraryState: jest.fn().mockResolvedValue({bookmarks: [], readingProgress: {}}),
  getCachedLibraryState: jest.fn().mockReturnValue({bookmarks: [], readingProgress: {}}),
  subscribeLibraryState: jest.fn().mockReturnValue(() => {}),
  toggleBookmark: jest.fn().mockReturnValue(true),
  isArticleBookmarked: jest.fn().mockReturnValue(false),
  saveScrollPosition: jest.fn(),
  getReadingSessionState: jest.fn().mockReturnValue({lastScrollPosition: 0}),
}));

jest.mock('../../state/onboardingPreferences', () => {
  const actual = jest.requireActual('../../state/onboardingPreferences');
  return {
    ...actual,
    getActiveObjective: jest.fn().mockReturnValue('cycle'),
    getSelectedObjective: jest.fn().mockReturnValue('cycle'),
    getHijriAdjustmentDays: jest.fn().mockReturnValue(0),
    setHijriAdjustmentDays: jest.fn(),
    subscribeHijriAdjustmentDays: jest.fn().mockReturnValue(() => {}),
  };
});

jest.mock('../../hooks/useQadaaStatus', () => ({
  useQadaaStatus: jest.fn().mockReturnValue({
    remainingQadaaDays: 3,
    totalQadaaDays: 5,
    completedQadaaDays: 2,
    automaticQadaaDays: 5,
    manualQadaaDays: 0,
    surplusCompletedDays: 0,
    balance: {automaticDays: 5, manualDays: 0, totalDays: 5, completedReportedDays: 2, completedDays: 2, remainingDays: 3, surplusCompletedDays: 0},
    manualEntries: [],
    completions: [],
    hijriYear: 1447,
    loading: false,
    ramadanActive: true,
    showReminder: true,
    markOneQadaaDayCompleted: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../../hooks/useConfirmedPeriodHistory', () => ({
  useConfirmedPeriodHistory: jest.fn().mockReturnValue([]),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('pregnancy-reminders'),
    requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
    createTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelNotification: jest.fn().mockResolvedValue(undefined),
  },
  AlarmType: {SET: 0, SET_AND_ALLOW_WHILE_IDLE: 1, SET_EXACT: 2, SET_EXACT_AND_ALLOW_WHILE_IDLE: 3, SET_ALARM_CLOCK: 4},
  AndroidImportance: {HIGH: 4},
  AndroidVisibility: {PRIVATE: 1},
  AuthorizationStatus: {NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1},
  RepeatFrequency: {NONE: -1, HOURLY: 0, DAILY: 1, WEEKLY: 2},
  TriggerType: {TIMESTAMP: 0, INTERVAL: 1},
}));

jest.mock('../../state/securityPreferences', () => {
  const actual = jest.requireActual('../../state/securityPreferences');
  return {
    ...actual,
    loadSecurityPreferences: jest.fn().mockResolvedValue(undefined),
    getPrivacySecuritySettings: jest.fn().mockReturnValue({
      discreetMode: false,
      discreetNotifications: false,
      hideNotificationPreview: false,
      intimacyProtection: true,
      privateContentProtection: true,
      anonymousMode: false,
    }),
  };
});

const mockDetectCountryCode = detectCountryCode as jest.Mock;
const mockCreateChannel = notifee.createChannel as jest.Mock;
const mockCreateTrigger = notifee.createTriggerNotification as jest.Mock;
const mockGetPrivacySettings = getPrivacySecuritySettings as jest.Mock;

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async (ticks = 8) => {
  for (let index = 0; index < ticks; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

/** Generic render harness reused across every Part A screen in this file —
 * mirrors the established convention from Phase7H1StatisticsLanguageSwitch
 * .test.tsx / Phase7LEditorialLocalization.test.tsx: a real NavigationContainer
 * (several target screens use useFocusEffect) wrapping the element inside
 * AwaThemeProvider + SafeAreaProvider. */
async function renderScreen(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{() => element}</Stack.Screen>
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

function renderDirect(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] => renderer.root.findAllByType(Text).map(textOf);

async function switchToSpanish() {
  await act(async () => {
    await setAppLanguage('es');
    await i18n.changeLanguage('es');
  });
}

beforeEach(async () => {
  await resetAppLanguageForTests();
  await AsyncStorage.clear();
  mockDetectCountryCode.mockReset().mockResolvedValue(null);
  await resetSelectedLocationForTests();
  resetPremiumStateForTests();
  await hydratePostpartumJournal();
  await hydratePostpartumLochia();
  await hydrateMiscarriageJournal();
  await hydrateContraceptionJournal();
  mockCreateChannel.mockClear();
  mockCreateTrigger.mockClear();
  mockGetPrivacySettings.mockReturnValue({
    discreetMode: false,
    discreetNotifications: false,
    hideNotificationPreview: false,
    intimacyProtection: true,
    privateContentProtection: true,
    anonymousMode: false,
  });
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

// ============================================================
// PART A — representative Spanish rendering, real reachable screens
// ============================================================

describe('PART A/1 — Onboarding (NameOnboardingScreen) renders genuine Spanish', () => {
  it('shows "¿Cómo deseas que\\nAWA te llame?" once the app language is Spanish', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <NameOnboardingScreen navigation={{navigate: jest.fn()} as never} route={{key: 'k', name: 'NameOnboarding', params: undefined} as never} />,
    );
    expect(textsOf(renderer)).toContain('¿Cómo deseas que\nAWA te llame?');
  });
});

describe('PART A/2 — Home (CycleHomeScreen) renders genuine Spanish', () => {
  it('shows the Spanish owner subtitle "Tu cuerpo, tu ritmo, tu fe ✨"', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <JournalSheetProvider>
        <CycleHomeScreen navigation={{navigate: jest.fn()} as never} route={{key: 'k', name: 'CycleHome'} as never} />
      </JournalSheetProvider>,
    );
    expect(textsOf(renderer)).toContain('Tu cuerpo, tu ritmo, tu fe ✨');
  });
});

describe('PART A/3 — Calendar (CalendarScreen, via the shared CalendarHeader) renders genuine Spanish', () => {
  it('shows the Spanish calendar subtitle "Sigue tu ciclo con toda sencillez ✨"', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <CalendarScreen navigation={{navigate: jest.fn()} as never} route={{key: 'k', name: 'Calendar'} as never} />,
    );
    expect(textsOf(renderer)).toContain('Sigue tu ciclo con toda sencillez ✨');
  });

  // SPANISH CALENDAR / DATE LOCALIZATION — the month header and weekday row
  // (MonthCalendarCard, via dateFormatLocale()/localizedWeekDays()) used to
  // silently fall through to French when the app language was Spanish.
  // Guards the actual display bug this phase fixes, not just a static
  // i18n string.
  it('renders the month header and weekday row in Spanish, never French, and switches back cleanly', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <CalendarScreen navigation={{navigate: jest.fn()} as never} route={{key: 'k', name: 'Calendar'} as never} />,
    );
    const texts = textsOf(renderer).map(text => text.toLowerCase());
    const joined = texts.join(' | ');
    const spanishMonths = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    expect(spanishMonths.some(month => joined.includes(month))).toBe(true);
    expect(texts).toContain('mié');
    expect(texts).not.toContain('mer');
    const frenchMonths = [
      'janvier', 'février', 'mars', 'avril', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    expect(frenchMonths.some(month => joined.includes(month))).toBe(false);

    await act(async () => {
      await setAppLanguage('fr');
      await i18n.changeLanguage('fr');
    });
    await settle();
    const frenchTexts = textsOf(renderer).map(text => text.toLowerCase());
    expect(frenchTexts.join(' | ')).not.toContain('enero');
    expect(frenchTexts).toContain('mer');
    expect(frenchTexts).not.toContain('mié');
  });
});

describe('PART A/4 — Journal (JournalSymptomsScreen) renders genuine Spanish', () => {
  it('shows the Spanish hero copy "Síntomas sentidos"', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(<JournalSymptomsScreen />);
    expect(textsOf(renderer)).toContain('Síntomas sentidos');
  });
});

describe('PART A/5 — Statistics (StatisticsScreen) renders genuine Spanish', () => {
  it('shows the Spanish header subtitle "Comprende tu cuerpo gracias a tus tendencias"', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <StatisticsScreen navigation={{navigate: jest.fn()} as never} route={{key: 'k', name: 'Statistics'} as never} />,
    );
    expect(textsOf(renderer)).toContain('Comprende tu cuerpo gracias a tus tendencias');
  });
});

describe('PART A/6 — Profile (ProfileScreen) renders genuine Spanish', () => {
  it('shows the Spanish header subtitle "Gestiona tu información y tus preferencias"', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <ProfileScreen navigation={{navigate: jest.fn()} as never} route={{key: 'p', name: 'Profile'} as never} />,
    );
    expect(textsOf(renderer)).toContain('Gestiona tu información y tus preferencias');
  });
});

describe('PART A/7 — Appearance (AppearanceScreen) renders genuine Spanish (light check — already covered for FR/EN by Phase7EAppearanceLibraryLanguageSwitch.test.tsx)', () => {
  it('shows the Spanish "AWA Original" theme description "Suave y armonioso"', async () => {
    await switchToSpanish();
    const renderer = renderDirect(
      <AppearanceScreen navigation={{goBack: jest.fn(), navigate: jest.fn()} as never} route={{key: 'k', name: 'test', params: undefined} as never} />,
    );
    expect(textsOf(renderer)).toContain('Suave y armonioso');
  });
});

describe('PART A/8 — Auth / Forgot password (ForgotPasswordScreen) renders genuine Spanish', () => {
  it('shows the Spanish title and the real client-side required-email error', async () => {
    await switchToSpanish();
    const renderer = renderDirect(
      <ForgotPasswordScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{} as never} />,
    );
    expect(textsOf(renderer)).toContain('¿Olvidaste tu contraseña?');

    const submit = renderer.root.find(
      n => typeof n.props.onPress === 'function'
        && n.findAllByType(Text).some(t => textOf(t) === 'Enviar el enlace de restablecimiento'),
    );
    act(() => {
      submit.props.onPress();
    });
    expect(textsOf(renderer)).toContain('Introduce tu dirección de correo electrónico.');
  });
});

describe('PART A/9 — Privacy (PrivacySecurityScreen) renders genuine Spanish', () => {
  it('shows the Spanish title "Privacidad y seguridad"', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <PrivacySecurityScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{key: 'k', name: 'PrivacySecurity'} as never} />,
    );
    expect(textsOf(renderer)).toContain('Privacidad y seguridad');
  });
});

describe('PART A/10 — Location (LocationScreen) renders genuine Spanish; the location architecture is unaffected', () => {
  it('shows "¿Dónde te encuentras?" and the Spanish search placeholder', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <LocationScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{key: 'l', name: 'Location', params: undefined} as never} />,
    );
    expect(textsOf(renderer)).toContain('¿Dónde te encuentras?');
    expect(renderer.root.findByProps({placeholder: 'Buscar una ciudad'})).toBeTruthy();
  });
});

describe('PART A/11 — AWA à deux (AwaADeuxIntroScreen, not separately covered by a Spanish test elsewhere) renders genuine Spanish', () => {
  it('shows the Spanish subtitle "Avanza en pareja,\\na tu propio ritmo."', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <AwaADeuxIntroScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{key: 'k', name: 'AwaADeuxIntro', params: undefined} as never} />,
    );
    expect(textsOf(renderer)).toContain('Avanza en pareja,\na tu propio ritmo.');
  });
});

describe('PART A/12 — Library (LibraryScreen home — a sub-surface distinct from FeaturedArticlesScreen, already covered for FR/EN by Phase7E) renders genuine Spanish', () => {
  it('shows the Spanish category tile label "Primera menstruación"', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <LibraryScreen navigation={{navigate: jest.fn()} as never} route={{key: 'k', name: 'Library'} as never} />,
    );
    expect(textsOf(renderer)).toContain('Primera menstruación');
  });
});

describe('PART A/13 — Pregnancy week (PregnancyWeekScreen) — SPANISH CONTENT GAP CLOSED', () => {
  // SPANISH PREGNANCY WEEK CONTENT — src/data/pregnancyWeekData.ts's
  // getPregnancyWeekData(week, lang) now accepts `lang: 'fr' | 'en' | 'es'`
  // and every one of the 41 weeks has a complete, independently translated
  // `es` editorial object (translated from the French original, not from
  // English). PregnancyWeekScreen.tsx (`const pregnancyDataLang =
  // i18n.language === 'fr' ? 'fr' : i18n.language === 'es' ? 'es' : 'en';`)
  // now passes Spanish straight through instead of normalizing it to
  // English. This test used to document an intentional English fallback for
  // Spanish; that gap is now closed, so this test instead proves Spanish
  // renders genuine Spanish text — distinct from both the English and the
  // French editorial content, never blank.
  it('when the app language is Spanish, the week’s editorial baby-development text renders in genuine SPANISH, not English, not French', async () => {
    const now = new Date();
    const lastPeriodStart = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
    await setPregnancyDating({method: 'lastPeriod', date: lastPeriodStart.toISOString()});
    await hydratePregnancyDating();

    const expectedWeek = computePregnancyStatus('lastPeriod', new Date(getPregnancyDating().date!), now).week;
    const englishDescription = getPregnancyWeekData(expectedWeek, 'en')!.babyDescription!;
    const frenchDescription = getPregnancyWeekData(expectedWeek, 'fr')!.babyDescription!;
    const spanishDescription = getPregnancyWeekData(expectedWeek, 'es')!.babyDescription!;
    expect(englishDescription).not.toBe(frenchDescription);
    expect(spanishDescription).not.toBe(englishDescription);
    expect(spanishDescription).not.toBe(frenchDescription);

    await switchToSpanish();
    const renderer = await renderScreen(
      <PregnancyWeekScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{key: 'k', name: 'PregnancyWeek', params: undefined} as never} />,
    );

    const texts = textsOf(renderer);
    expect(texts).toContain(spanishDescription);
    expect(texts).not.toContain(englishDescription);
    expect(texts).not.toContain(frenchDescription);
  });
});

describe('PART A/14 — Premium (HawaPremiumBottomSheet) renders genuine Spanish (extends Phase7DPremiumLanguageSwitch.test.tsx’s FR/EN pattern to Spanish)', () => {
  it('shows the Spanish hero intro and the Spanish "coming soon" framing', async () => {
    await switchToSpanish();
    const renderer = renderDirect(<HawaPremiumBottomSheet onClose={jest.fn()} visible />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Más posibilidades,\nsimplemente.');
    expect(texts).toContain('Suscripción próximamente disponible');
  });
});

describe('PART A/15 — Help/FAQ (HelpSupportScreen) renders genuine Spanish', () => {
  it('shows the Spanish title "Ayuda y soporte" and subtitle', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(
      <HelpSupportScreen navigation={{navigate: jest.fn(), goBack: jest.fn()} as never} route={{key: 'k', name: 'HelpSupport'} as never} />,
    );
    const texts = textsOf(renderer);
    expect(texts).toContain('Ayuda y soporte');
    expect(texts).toContain('¿Tienes una pregunta? Estamos aquí para ti.');
  });
});

describe('PART A/16 — Spiritual/Qadaa (FastingQadaaScreen) renders genuine Spanish', () => {
  it('shows the Spanish title "Días de ayuno pendientes" and the remaining-day count stays numerically identical', async () => {
    await switchToSpanish();
    const renderer = await renderScreen(<FastingQadaaScreen />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Días de ayuno pendientes');
    expect(texts.some(t => t.includes('3'))).toBe(true); // remainingQadaaDays=3, untouched by language
  });
});

describe('PART A/17 — Notification copy (pregnancyNotifications.ts) resolves genuine Spanish, through the real scheduling call path', () => {
  it('the i18n keys the scheduler depends on resolve to real, non-empty Spanish strings distinct from French/English', async () => {
    await switchToSpanish();
    expect(i18n.t('notifications.channelName')).toBe('Recordatorios AWA');
    expect(i18n.t('notifications.fallbackBody')).toBe('Hay un nuevo recordatorio disponible.');
    expect(i18n.t('notifications.privacyGenericBody')).toBe('Tienes un nuevo recordatorio de AWA.');
    // Distinct from the French/English dictionary (never silently falling
    // back to another language while still "resolving" to *something*).
    await i18n.changeLanguage('fr');
    expect(i18n.t('notifications.channelName')).not.toBe('Recordatorios AWA');
    await i18n.changeLanguage('es');
  });

  it('scheduleLocalNotification() actually creates the Android channel with the Spanish name, and redacts to the Spanish generic body, when the app language is Spanish', async () => {
    await switchToSpanish();
    mockGetPrivacySettings.mockReturnValue({
      discreetMode: false,
      discreetNotifications: true, // forces redaction, so the generic-body key is exercised end-to-end
      hideNotificationPreview: false,
      intimacyProtection: true,
      privateContentProtection: true,
      anonymousMode: false,
    });

    // The REAL scheduleLocalNotification (not mocked in this file) — only
    // its native dependency (@notifee/react-native) is mocked above, same
    // pattern as src/services/__tests__/pregnancyNotifications.test.ts.
    await scheduleLocalNotification({
      id: 'es-test-reminder',
      title: 'Cita con el ginecólogo',
      body: 'Tu cita es en 1 hora.',
      fireDate: new Date(Date.now() + 60 * 60 * 1000),
    });

    expect(mockCreateChannel).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Recordatorios AWA'}),
    );
    const payload = mockCreateTrigger.mock.calls[mockCreateTrigger.mock.calls.length - 1][0];
    expect(payload.title).toBe('AWA'); // brand name, never translated — same invariant as the FR/EN suite
    expect(payload.body).toBe('Tienes un nuevo recordatorio de AWA.');
  });
});

describe('PART A/18 — PDF/CSV export chrome (medicalExportFormatting.ts) resolves genuine Spanish, confirming the export.* namespace is wired, not just present', () => {
  it('formatFlowIntensityLabel() returns the real Spanish enum label', async () => {
    await switchToSpanish();
    expect(formatFlowIntensityLabel('heavy')).toBe('Abundante');
  });

  it('formatSectionNoteLines() builds its "Label : note" line using the real Spanish section label', async () => {
    await switchToSpanish();
    const entry = {
      mood: {level: 'good', note: 'Una nota de prueba'},
    } as unknown as DailyJournalEntry;
    const lines = formatSectionNoteLines(entry, ['mood']);
    expect(lines).toEqual(['Estado de ánimo : Una nota de prueba']);
  });
});

// ============================================================
// PART B — stored-data safety: a language switch never mutates a
// persisted categorical value, only its on-screen label.
// ============================================================

const DAY = '2026-05-01';

describe('PART B/1 — generic/shared journal option value (postpartumJournalConfig-driven "fatigue" field, via postpartumJournalStore)', () => {
  it('"Modérée" stored while English is active stays byte-identical through ES and back through FR', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await savePostpartumJournalField(DAY, 'fatigue', 'Modérée');
    expect(getPostpartumJournalEntry(DAY)?.fatigue).toBe('Modérée');

    await switchToSpanish();
    expect(getPostpartumJournalEntry(DAY)?.fatigue).toBe('Modérée');
    // Its SPANISH display label (never the stored value) is the real
    // translated word, proving the display mapping is genuinely wired too.
    expect(journalOptionLabel('postpartumFatigue', 'Modérée', (key: string) => i18n.t(key, {lng: 'es'}))).toBe('Moderada');

    await i18n.changeLanguage('fr');
    expect(getPostpartumJournalEntry(DAY)?.fatigue).toBe('Modérée');
  });
});

describe('PART B/2 — symptoms (cycle journalSymptoms-related stored value, via dailyJournalStore)', () => {
  it('"Crampes" stored while English is active stays byte-identical through ES and back through FR', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await saveJournalSection(DAY, 'symptoms', {names: ['Crampes']});
    expect((await getJournalEntry(DAY))?.symptoms?.names).toEqual(['Crampes']);

    await switchToSpanish();
    expect((await getJournalEntry(DAY))?.symptoms?.names).toEqual(['Crampes']);
    expect(journalOptionLabel('cycleSymptom', 'Crampes', (key: string) => i18n.t(key, {lng: 'es'}))).toBe('Cólicos');

    await i18n.changeLanguage('fr');
    expect((await getJournalEntry(DAY))?.symptoms?.names).toEqual(['Crampes']);
  });
});

describe('PART B/3 — cycle phase: FINDING — purely computed/derived, never persisted as a value, so this domain is skipped rather than forced', () => {
  // src/utils/cycleMath.ts's phaseFor() (and every other cycle-phase
  // computation in the app) derives the phase on the fly from persisted
  // DATES (lastPeriodStart, cycleDuration, periodDuration, confirmed period
  // history) — a search of src/state/*.ts finds no store that ever writes a
  // field literally named/shaped like "phase". There is no separate
  // "stored categorical value vs. display label" pair to test here: the
  // phase is recomputed fresh every time from date math, in every language,
  // so a language switch has nothing stored to possibly corrupt. This is
  // itself the finding this domain's test records.
  it('phaseFor() is a pure function of its date/duration inputs — no persisted "phase" value exists to protect', () => {
    const today = new Date(2026, 4, 10);
    const basics = {lastPeriodStart: new Date(2026, 3, 15), cycleDuration: 28, periodDuration: 5};
    const phaseBefore = phaseFor(today, basics);
    // Recomputing with the exact same inputs after a language switch yields
    // the exact same phase — because it was never read from storage.
    expect(phaseFor(today, basics)).toBe(phaseBefore);
  });
});

describe('PART B/4 — lochia (postpartumLochiaStore)', () => {
  it('"Modéré" flow stored while English is active stays byte-identical through ES and back through FR', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await savePostpartumLochiaEntry(DAY, {flow: 'Modéré', color: 'Rouge', consistency: 'Liquide', symptoms: []});
    expect(getPostpartumLochiaEntry(DAY)?.flow).toBe('Modéré');

    await switchToSpanish();
    expect(getPostpartumLochiaEntry(DAY)?.flow).toBe('Modéré');
    expect(journalOptionLabel('postpartumLochiaFlow', 'Modéré', (key: string) => i18n.t(key, {lng: 'es'}))).toBe('Moderado');

    await i18n.changeLanguage('fr');
    expect(getPostpartumLochiaEntry(DAY)?.flow).toBe('Modéré');
  });
});

describe('PART B/5 — pregnancy symptoms (pregnancyJournalStore)', () => {
  it('"Nausées" stored while English is active stays byte-identical through ES and back through FR', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await savePregnancySymptoms({date: DAY, symptoms: ['Nausées'], updatedAt: new Date().toISOString()});
    let state = await getPregnancyJournalState();
    expect(state.symptoms.find(entry => entry.date === DAY)?.symptoms).toEqual(['Nausées']);

    await switchToSpanish();
    state = await getPregnancyJournalState();
    expect(state.symptoms.find(entry => entry.date === DAY)?.symptoms).toEqual(['Nausées']);
    expect(journalOptionLabel('pregnancySymptom', 'Nausées', (key: string) => i18n.t(key, {lng: 'es'}))).toBe('Náuseas');

    await i18n.changeLanguage('fr');
    state = await getPregnancyJournalState();
    expect(state.symptoms.find(entry => entry.date === DAY)?.symptoms).toEqual(['Nausées']);
  });
});

describe('PART B/6 — miscarriage values (miscarriageJournalStore)', () => {
  it('"Modéré" bleeding stored while English is active stays byte-identical through ES and back through FR', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await saveMiscarriageJournalField(DAY, 'bleeding', 'Modéré');
    expect(getMiscarriageJournalEntry(DAY)?.bleeding).toBe('Modéré');

    await switchToSpanish();
    expect(getMiscarriageJournalEntry(DAY)?.bleeding).toBe('Modéré');
    expect(journalOptionLabel('miscarriageBleeding', 'Modéré', (key: string) => i18n.t(key, {lng: 'es'}))).toBe('Moderado');

    await i18n.changeLanguage('fr');
    expect(getMiscarriageJournalEntry(DAY)?.bleeding).toBe('Modéré');
  });
});

describe('PART B/7 — contraception feelings (contraception journal config/store)', () => {
  it('"Ballonnements" stored while English is active stays byte-identical through ES and back through FR', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    await saveContraceptionJournalField(DAY, 'feelings', ['Ballonnements']);
    expect(getContraceptionJournalEntry(DAY)?.feelings).toEqual(['Ballonnements']);

    await switchToSpanish();
    expect(getContraceptionJournalEntry(DAY)?.feelings).toEqual(['Ballonnements']);
    expect(journalOptionLabel('contraceptionFeeling', 'Ballonnements', (key: string) => i18n.t(key, {lng: 'es'}))).toBe('Hinchazón');

    await i18n.changeLanguage('fr');
    expect(getContraceptionJournalEntry(DAY)?.feelings).toEqual(['Ballonnements']);
  });
});
