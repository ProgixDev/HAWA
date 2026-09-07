import React from 'react';
import fs from 'fs';
import path from 'path';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StatusBar} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {setAppearanceMode, setSelectedThemeId, setTrueBlackEnabled} from '../../state/themePreferences';

import LibraryScreen from '../LibraryScreen';
import FeaturedArticlesScreen from '../FeaturedArticlesScreen';
import HijriCalendarScreen from '../HijriCalendarScreen';
import BookmarkButton from '../../components/library/BookmarkButton';

// E6.1 — Library main-screens (app chrome) theme migration. Mirrors the
// established pattern from JournalFamilyThemeHardening/
// CalendarFamilyThemeHardening/SettingsSecurityFamilyThemeHardening: (1) a
// static appearance-resolution guard across every file migrated in this
// batch (6 main screens + BookmarkButton + the 5 directly-required prayer/
// hijri child components), and (2) runtime theme propagation for a
// representative, reliably-renderable subset (the two library browse
// screens, the Hijri calendar screen, and the standalone BookmarkButton —
// PrayerTimesScreen/FastingQadaaScreen/ArticleReaderScreen need heavier
// hook/route-param mocking and are covered by the static guard only).

jest.mock('../../state/libraryStore', () => ({
  loadLibraryState: jest.fn().mockResolvedValue({bookmarks: [], readingProgress: {}}),
  getCachedLibraryState: jest.fn().mockReturnValue({bookmarks: [], readingProgress: {}}),
  subscribeLibraryState: jest.fn().mockReturnValue(() => {}),
  toggleBookmark: jest.fn().mockReturnValue(true),
  isArticleBookmarked: jest.fn().mockReturnValue(false),
  saveScrollPosition: jest.fn(),
}));

jest.mock('../../state/onboardingPreferences', () => {
  const actual = jest.requireActual('../../state/onboardingPreferences');
  return {
    ...actual,
    getSelectedObjective: jest.fn().mockReturnValue('cycle'),
    getSpiritualMarkersEnabled: jest.fn().mockReturnValue(true),
    getActiveObjective: jest.fn().mockReturnValue('cycle'),
    getHijriAdjustmentDays: jest.fn().mockReturnValue(0),
    setHijriAdjustmentDays: jest.fn(),
    subscribeHijriAdjustmentDays: jest.fn().mockReturnValue(() => {}),
  };
});

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 740},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

function flattenStyle(style: unknown): Record<string, unknown> {
  return Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
}

function firstBackgroundColor(renderer: ReactTestRenderer.ReactTestRenderer): unknown {
  const match = renderer.root.findAll(node => {
    if (!node.props || !node.props.style) {return false;}
    return typeof flattenStyle(node.props.style).backgroundColor !== 'undefined';
  })[0];
  return match ? flattenStyle(match.props.style).backgroundColor : undefined;
}

async function renderScreen(renderElement: () => React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">{renderElement}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer!);
  return renderer!;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await setSelectedThemeId('awa-original');
  await setAppearanceMode('light');
  await setTrueBlackEnabled(false);
});

afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

/* ============================================================
   STATIC ARCHITECTURE GUARD — every file migrated in E6.1: the 6 main
   Library screens, BookmarkButton, and the 5 directly-required prayer/
   hijri child components. ArticleReaderScreen's ~72 bespoke article
   imports are E6.2 and explicitly excluded — this guard only inspects
   ArticleReaderScreen.tsx's own source, never opens those files.
============================================================ */

const LIBRARY_SOURCE_FILES: Array<[string, string]> = [
  ['LibraryScreen', '../LibraryScreen.tsx'],
  ['FeaturedArticlesScreen', '../FeaturedArticlesScreen.tsx'],
  ['ArticleReaderScreen (generic reader chrome only)', '../library/ArticleReaderScreen.tsx'],
  ['BookmarkButton (shared)', '../../components/library/BookmarkButton.tsx'],
  ['PrayerTimesScreen', '../PrayerTimesScreen.tsx'],
  ['NextPrayerCard (shared)', '../../components/prayer/NextPrayerCard.tsx'],
  ['PurityStatusCard (shared)', '../../components/prayer/PurityStatusCard.tsx'],
  ['PrayerScheduleList (shared)', '../../components/prayer/PrayerScheduleList.tsx'],
  ['PeriodEndBottomSheet (shared)', '../../components/prayer/PeriodEndBottomSheet.tsx'],
  ['HijriCalendarScreen', '../HijriCalendarScreen.tsx'],
  ['HijriMonthGrid (shared)', '../../components/hijri/HijriMonthGrid.tsx'],
  ['FastingQadaaScreen', '../FastingQadaaScreen.tsx'],
];

describe('E6.1 Library family — static appearance-resolution guard', () => {
  it.each(LIBRARY_SOURCE_FILES)(
    '%s never resolves appearance locally (no useColorScheme, no isDark branch, no theme.id branch, no stale homeColors)',
    (_name, relativePath) => {
      const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
      expect(source).not.toMatch(/useColorScheme\s*\(/);
      expect(source).not.toMatch(/Appearance\.getColorScheme\s*\(/);
      expect(source).not.toMatch(/isDark\s*\?/);
      expect(source).not.toMatch(/\bCOLORS_LIGHT\b/);
      expect(source).not.toMatch(/\bCOLORS_DARK\b/);
      expect(source).not.toMatch(/if\s*\(\s*theme\.id\s*===/);
      expect(source).not.toMatch(/switch\s*\(\s*theme\.id\s*\)/);
      expect(source).not.toMatch(/homeColors\./);
    },
  );

  it.each(LIBRARY_SOURCE_FILES)('%s consumes useAwaTheme()', (_name, relativePath) => {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    expect(source).toMatch(/useAwaTheme\s*\(/);
  });

  it('ArticleReaderScreen.tsx still imports every bespoke article screen unchanged (E6.2 boundary respected)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../library/ArticleReaderScreen.tsx'), 'utf8');
    expect(source).toContain('BESPOKE_ARTICLE_SCREENS');
    expect(source).toMatch(/from '\.\/FlowMenstrualArticleScreen'/);
    expect(source).toMatch(/from '\.\/LhTestsArticleScreen'/);
  });

  it('LIBRARY_TINTS (frozen per-category editorial identity) is untouched by this migration', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../data/libraryContent.ts'), 'utf8');
    expect(source).toContain('#6D4AE8');
    expect(source).toContain('LIBRARY_TINTS');
  });
});

/* ============================================================
   RUNTIME THEME PROPAGATION — the two library browse screens, the
   self-contained Hijri calendar screen, and the standalone BookmarkButton.
============================================================ */

type LibraryCase = {name: string; render: () => React.ReactElement};

const SCREENS: LibraryCase[] = [
  {name: 'LibraryScreen', render: () => <LibraryScreen navigation={{} as any} route={{} as any} />},
  {name: 'FeaturedArticlesScreen', render: () => <FeaturedArticlesScreen navigation={{} as any} route={{} as any} />},
  {name: 'HijriCalendarScreen', render: () => <HijriCalendarScreen />},
];

describe.each(SCREENS)('$name — resolved global theme', ({render}) => {
  it('page background resolves from the global theme (changes with True Black once Dark is resolved)', async () => {
    const renderer = await renderScreen(render);
    const before = firstBackgroundColor(renderer);
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('light');
      await setTrueBlackEnabled(true);
    });
    expect(firstBackgroundColor(renderer)).toBe(before);

    await act(async () => {
      await setAppearanceMode('dark');
    });
    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });

  it('changes Light -> Dark without remounting (StatusBar follows the resolved theme)', async () => {
    const renderer = await renderScreen(render);
    const statusBar = () => renderer.root.findByType(StatusBar);
    expect(statusBar().props.barStyle).toBe('dark-content');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(statusBar().props.barStyle).toBe('light-content');
  });

  it('palette switch updates the page background without remounting', async () => {
    const renderer = await renderScreen(render);
    const before = firstBackgroundColor(renderer);

    await act(async () => {
      await setSelectedThemeId('ocean-calm');
    });

    expect(firstBackgroundColor(renderer)).not.toBe(before);
  });
});

describe('HijriCalendarScreen — banner header readability (Dark Mode regression)', () => {
  it('the banner scrim never starts fully transparent (the exact reported defect)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../HijriCalendarScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/withAlpha\(theme\.colors\.background,\s*0\)/);
  });

  it('the banner LinearGradient never uses a fully-transparent first stop, in Light or Dark, and actually changes between them', async () => {
    const renderer = await renderScreen(() => <HijriCalendarScreen />);
    const gradientColorsAt = () => renderer.root.findByType(LinearGradient).props.colors as string[];

    const lightColors = gradientColorsAt();
    expect(lightColors[0]).not.toMatch(/,\s*0\)$/);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkColors = gradientColorsAt();
    expect(darkColors[0]).not.toMatch(/,\s*0\)$/);
    // The scrim must actually change between Light and Dark — proving it's
    // sourced from the resolved theme, not a fixed literal.
    expect(darkColors[0]).not.toBe(lightColors[0]);
  });

  it('the header title text resolves from the theme and changes Light -> Dark', async () => {
    const renderer = await renderScreen(() => <HijriCalendarScreen />);
    const findHeaderTitleColor = () =>
      flattenStyle(renderer.root.findAll(node => node.props?.children === 'Calendrier Hijri')[0].props.style).color;
    const before = findHeaderTitleColor();
    expect(before).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(findHeaderTitleColor()).not.toBe(before);
  });
});

describe('BookmarkButton (shared, standalone) — resolved global theme', () => {
  it('active icon color follows the global theme primary across a palette switch', async () => {
    const renderer = await renderScreen(() => <BookmarkButton active onPress={jest.fn()} />);
    const findIconColor = () =>
      renderer.root.findAll(node => typeof node.props?.color === 'string' && typeof node.props?.name === 'string')[0]
        .props.color;
    const before = findIconColor();

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(findIconColor()).not.toBe(before);
  });
});
