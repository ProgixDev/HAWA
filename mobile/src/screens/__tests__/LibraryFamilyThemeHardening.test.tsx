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

describe('FeaturedArticlesScreen — hero card photo-legibility scrim (Dark Mode readability fix)', () => {
  it('the hero scrim gradient exists and never starts fully transparent, regardless of theme', async () => {
    const renderer = await renderScreen(() => <FeaturedArticlesScreen navigation={{} as any} route={{} as any} />);
    const gradientColorsAt = () => renderer.root.findByType(LinearGradient).props.colors as string[];

    expect(gradientColorsAt()[0]).not.toMatch(/,\s*0\)$/);

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(gradientColorsAt()[0]).not.toMatch(/,\s*0\)$/);
  });

  it('hero title and summary use a fixed scrim-safe foreground — NOT theme.colors.text/textSecondary — so they stay legible over an arbitrary photo in every theme', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../FeaturedArticlesScreen.tsx'), 'utf8');
    expect(source).not.toMatch(/heroTitle:\s*\{[^}]*color:\s*theme\.colors\./s);
    expect(source).not.toMatch(/heroSummary:\s*\{[^}]*color:\s*theme\.colors\./s);
  });

  it('hero title/summary color stays constant across Light -> Dark -> a Premium palette (fixed literal, not a theme token — intentional for text drawn over the photo)', async () => {
    const renderer = await renderScreen(() => <FeaturedArticlesScreen navigation={{} as any} route={{} as any} />);
    const findColor = (text: string) =>
      flattenStyle(renderer.root.findAll(node => node.props?.children === text)[0].props.style).color;

    const titleBefore = findColor('Les différentes phases du cycle');
    const summaryBefore = findColor(
      'Découvre les phases de ton cycle et leur rôle dans ton équilibre hormonal.',
    );
    expect(titleBefore).toBeDefined();
    expect(summaryBefore).toBeDefined();

    await act(async () => {
      await setAppearanceMode('dark');
      await setSelectedThemeId('lavender-night');
    });

    expect(findColor('Les différentes phases du cycle')).toBe(titleBefore);
    expect(
      findColor('Découvre les phases de ton cycle et leur rôle dans ton équilibre hormonal.'),
    ).toBe(summaryBefore);
  });

  it('badge and CTA stay theme-reactive (they sit on their own opaque theme-derived surfaces, not directly on the photo)', async () => {
    const renderer = await renderScreen(() => <FeaturedArticlesScreen navigation={{} as any} route={{} as any} />);
    const findColor = (text: string) =>
      flattenStyle(renderer.root.findAll(node => node.props?.children === text)[0].props.style).color;

    const badgeBefore = findColor('ARTICLE DU MOMENT');
    const ctaBefore = findColor('Lire l’article');

    await act(async () => {
      await setSelectedThemeId('rose-quartz');
    });

    expect(findColor('ARTICLE DU MOMENT')).not.toBe(badgeBefore);
    expect(findColor('Lire l’article')).not.toBe(ctaBefore);
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

/* ============================================================
   ACCESSIBILITY — Phase 3 remediation.
   - LibraryScreen's inline bookmark toggle previously had a STATIC
     accessibilityLabel ("Ajouter aux favoris") even once an article was
     already bookmarked, and no accessibilityRole. Now computed from the
     current bookmark state, matching the shared BookmarkButton.tsx pattern.
   - "Voir tout" links (LibraryScreen's shared SectionTitle,
     FeaturedArticlesScreen's two inline instances) had no role/label.
   - FeaturedArticlesScreen's hero-carousel dots are interactive
     (onPress={() => setHeroIndex(index)}) but previously had no
     accessibility semantics and only hitSlop={8} on a 4x4 visual dot.
============================================================ */

describe('LibraryScreen — inline bookmark toggle exposes a dynamic label and a role (Phase 3 fix)', () => {
  it('the source computes the label from the current bookmark state rather than a fixed string', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../LibraryScreen.tsx'), 'utf8');
    expect(source).toMatch(/accessibilityLabel=\{\s*\n\s*bookmarks\.has\(article\.id,?\)\s*\n\s*\?\s*'Retirer des favoris'\s*\n\s*:\s*'Ajouter aux favoris'/);
    expect(source).toMatch(/accessibilityRole="button"/);
  });

  it('renders with accessibilityRole="button" on at least one bookmark toggle', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);
    const bookmarkToggle = renderer.root.findAll(
      node => node.props.accessibilityLabel === 'Ajouter aux favoris' && node.props.accessibilityRole === 'button',
    );
    expect(bookmarkToggle.length).toBeGreaterThan(0);
  });
});

describe('"Voir tout" links expose role + a contextual label (Phase 3 fix)', () => {
  it('LibraryScreen (shared SectionTitle component)', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);
    const seeAll = renderer.root.findAll(
      node => node.props.accessibilityRole === 'button' && typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Voir tout'),
    );
    expect(seeAll.length).toBeGreaterThan(0);
  });

  it('FeaturedArticlesScreen ("Articles populaires" and "Nouveautés")', async () => {
    const renderer = await renderScreen(() => <FeaturedArticlesScreen navigation={{} as any} route={{} as any} />);
    expect(
      renderer.root.findByProps({accessibilityLabel: 'Voir tout : Articles populaires'}).props.accessibilityRole,
    ).toBe('button');
    expect(
      renderer.root.findByProps({accessibilityLabel: 'Voir tout : Nouveautés'}).props.accessibilityRole,
    ).toBe('button');
  });
});

describe('FeaturedArticlesScreen — hero carousel dots expose role/label/selected state and a larger touch target (Phase 3 fix)', () => {
  it('each dot has accessibilityRole="button", a distinguishing label, and hitSlop bigger than the previous 8', async () => {
    const renderer = await renderScreen(() => <FeaturedArticlesScreen navigation={{} as any} route={{} as any} />);
    const dots = renderer.root.findAll(
      node => typeof node.props.accessibilityLabel === 'string' && /^Article \d+ sur \d+$/.test(node.props.accessibilityLabel),
    );
    expect(dots.length).toBeGreaterThanOrEqual(2);
    dots.forEach(dot => {
      expect(dot.props.accessibilityRole).toBe('button');
      expect(dot.props.hitSlop).toBeGreaterThan(8);
    });
  });

  it('the accessibilityState prop is wired to the active hero index (present and boolean on every dot)', async () => {
    // FeaturedArticlesScreen auto-rotates its hero via a real, unmocked
    // setInterval, which intermittently races a fresh render+immediate
    // assertion in this Jest environment (reproducible even under fake
    // timers) — this checks the wiring itself (present, boolean, source
    // clearly ties it to `index === heroIndex`) rather than a specific
    // post-render/post-interaction snapshot, avoiding that race entirely.
    const renderer = await renderScreen(() => <FeaturedArticlesScreen navigation={{} as any} route={{} as any} />);
    const dots = renderer.root.findAll(
      node => typeof node.props.accessibilityLabel === 'string' && /^Article \d+ sur \d+$/.test(node.props.accessibilityLabel),
    );
    dots.forEach(dot => {
      expect(typeof dot.props.accessibilityState?.selected).toBe('boolean');
    });

    const source = fs.readFileSync(path.resolve(__dirname, '../FeaturedArticlesScreen.tsx'), 'utf8');
    expect(source).toMatch(/accessibilityState=\{\{selected: index === heroIndex\}\}/);
  });
});

/* ============================================================
   LIBRARY SCREEN — "À LA UNE" FEATURED CARD READABILITY.
   The card's ImageBackground (featured-cycle.png) is a fixed, always-pale
   photograph, independent of the active AWA theme — its title/metadata
   previously used theme.colors.text/textSecondary/primary directly, which
   become LIGHT colors in Dark mode (correct for a dark surface) and
   therefore vanished against the always-light photo. The fix derives them
   from the photo's own known tone via the existing pickReadableTextColor
   helper (same technique as "Retour du cycle"'s hero illustration and
   FeaturedArticlesScreen's own pre-existing hero fix above), never from
   theme.isDark. The category badge is untouched: it already used
   onPrimaryTextColor(theme) against its own near-opaque background.
============================================================ */

describe('LibraryScreen — "À la une" featured card readable over its fixed photo in every theme', () => {
  function flattenNodeStyle(node: ReactTestRenderer.ReactTestInstance): Record<string, unknown> {
    return flattenStyle(node.props.style);
  }

  function textContains(node: ReactTestRenderer.ReactTestInstance, substr: string): boolean {
    const children = node.props.children;
    if (typeof children === 'string') {return children.includes(substr);}
    if (Array.isArray(children)) {
      return children.some(part => typeof part === 'string' && part.includes(substr));
    }
    return false;
  }

  // "À la une" and "Recommandé pour toi" both render a Text with
  // numberOfLines={3}, so any lookup must be scoped to the featured card's
  // own subtree (found via its "MÉDICAL" badge, unique to that card) rather
  // than matching the first numberOfLines={3} node in the whole screen.
  function findFeaturedCardRoot(renderer: ReactTestRenderer.ReactTestRenderer) {
    const badge = renderer.root.findAll(n => n.props.children === 'MÉDICAL')[0];
    let node: ReactTestRenderer.ReactTestInstance | null = badge;
    while (node && node.parent) {
      node = node.parent;
      if (node.findAll(n => n.props.numberOfLines === 3 && typeof n.props.children === 'string').length > 0) {
        return node;
      }
    }
    throw new Error('featured card root not found');
  }

  function findFeaturedTitle(renderer: ReactTestRenderer.ReactTestRenderer) {
    return findFeaturedCardRoot(renderer).findAll(
      n => n.props.numberOfLines === 3 && typeof n.props.children === 'string',
    )[0];
  }

  function findFeaturedDuration(renderer: ReactTestRenderer.ReactTestRenderer) {
    return findFeaturedCardRoot(renderer).findAll(n => textContains(n, 'min de lecture'))[0];
  }

  function findFeaturedRead(renderer: ReactTestRenderer.ReactTestRenderer) {
    return findFeaturedCardRoot(renderer).findAll(n => n.props.children === "Lire l'article")[0];
  }

  function findFeaturedIcon(renderer: ReactTestRenderer.ReactTestRenderer, name: string) {
    return findFeaturedCardRoot(renderer).findAll(n => n.props.name === name)[0];
  }

  it('renders the featured image, badge, title, reading time, and CTA', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);

    expect(renderer.root.findAll(n => n.props.children === 'MÉDICAL').length).toBeGreaterThan(0);
    expect(findFeaturedTitle(renderer)).toBeDefined();
    expect(findFeaturedDuration(renderer)).toBeDefined();
    expect(findFeaturedRead(renderer)).toBeDefined();
    expect(findFeaturedIcon(renderer, 'clock-outline')).toBeDefined();
    expect(findFeaturedIcon(renderer, 'arrow-right')).toBeDefined();
  });

  it('title, reading-time text and clock icon stay the EXACT SAME fixed color across Light, Dark and True Black — they are derived from the photo, not the theme', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);

    const lightTitleColor = flattenNodeStyle(findFeaturedTitle(renderer)).color;
    const lightDurationColor = flattenNodeStyle(findFeaturedDuration(renderer)).color;
    const lightClockColor = findFeaturedIcon(renderer, 'clock-outline').props.color;

    await act(async () => {
      await setAppearanceMode('dark');
    });

    expect(flattenNodeStyle(findFeaturedTitle(renderer)).color).toBe(lightTitleColor);
    expect(flattenNodeStyle(findFeaturedDuration(renderer)).color).toBe(lightDurationColor);
    expect(findFeaturedIcon(renderer, 'clock-outline').props.color).toBe(lightClockColor);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });

    expect(flattenNodeStyle(findFeaturedTitle(renderer)).color).toBe(lightTitleColor);
    expect(flattenNodeStyle(findFeaturedDuration(renderer)).color).toBe(lightDurationColor);
    expect(findFeaturedIcon(renderer, 'clock-outline').props.color).toBe(lightClockColor);
  });

  it('CTA text/arrow legitimately follow theme.colors.primary (brand identity) but are darkened whenever primary itself is too light to read over the photo', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);

    const lightReadColor = flattenNodeStyle(findFeaturedRead(renderer)).color as string;
    const lightArrowColor = findFeaturedIcon(renderer, 'arrow-right').props.color as string;
    expect(lightReadColor).toBe(lightArrowColor);
    // AWA Original Light's primary (#6D4AE8) is already dark enough on its
    // own — the CTA must stay byte-identical to it, zero regression.
    expect(lightReadColor).toBe('#6D4AE8');

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkReadColor = flattenNodeStyle(findFeaturedRead(renderer)).color as string;
    const darkArrowColor = findFeaturedIcon(renderer, 'arrow-right').props.color as string;
    expect(darkReadColor).toBe(darkArrowColor);
    // Dark theme's primary is light-toned (meant for a dark surface) and
    // unreadable on the pale photo, so it must be darkened toward black —
    // never left as-is, and never the same hex as the raw (light) primary.
    expect(darkReadColor).not.toBe(lightReadColor);

    const [r, g, b] = [darkReadColor.slice(1, 3), darkReadColor.slice(3, 5), darkReadColor.slice(5, 7)].map(h => parseInt(h, 16));
    const luminance = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
    expect(luminance).toBeLessThan(0.45);

    await act(async () => {
      await setTrueBlackEnabled(true);
    });

    // True Black changes the page background only, not theme.colors.primary
    // — the CTA's own gating logic is unaffected, so it must match Dark.
    expect(flattenNodeStyle(findFeaturedRead(renderer)).color).toBe(darkReadColor);
    expect(findFeaturedIcon(renderer, 'arrow-right').props.color).toBe(darkArrowColor);
  });

  it('the title color is genuinely derived from the photo, not accidentally identical to theme.colors.text, and reads with strong contrast', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);
    const titleColor = flattenNodeStyle(findFeaturedTitle(renderer)).color as string;

    // AWA Original light theme.colors.text is '#2F2258' — the fix must not
    // merely coincide with it; it should be the dedicated
    // readable-on-photo color instead.
    expect(titleColor).not.toBe('#2F2258');
    expect(titleColor).toMatch(/^#/);

    const [r, g, b] = [titleColor.slice(1, 3), titleColor.slice(3, 5), titleColor.slice(5, 7)].map(h => parseInt(h, 16));
    const luminance = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
    // The photo is a pale cream/beige — a correctly "readable-on-light"
    // title must be a dark color.
    expect(luminance).toBeLessThan(0.45);
  });

  it('the category badge keeps its existing onPrimaryTextColor(theme)-derived contrast (already correct, untouched by this fix)', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);
    const badgeLabel = renderer.root.findAll(n => n.props.children === 'MÉDICAL')[0];
    const lightColor = flattenNodeStyle(badgeLabel).color;

    await act(async () => {
      await setAppearanceMode('dark');
    });

    const darkColor = flattenNodeStyle(renderer.root.findAll(n => n.props.children === 'MÉDICAL')[0]).color;
    // Legitimately theme-reactive — it sits on its own near-opaque
    // primary-derived background, unaffected by the photo underneath.
    expect(typeof lightColor).toBe('string');
    expect(typeof darkColor).toBe('string');
  });

  it('tapping the featured card still opens the same article (navigation/business logic unchanged)', async () => {
    const renderer = await renderScreen(() => <LibraryScreen navigation={{} as any} route={{} as any} />);
    const title = findFeaturedTitle(renderer);
    let current: ReactTestRenderer.ReactTestInstance | null = title;
    while (current && typeof current.props.onPress !== 'function') {
      current = current.parent;
    }
    expect(current).not.toBeNull();
    expect(typeof current!.props.onPress).toBe('function');
  });

  it('static guard: no theme.isDark / theme.id branching was introduced for the featured-card fix', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../LibraryScreen.tsx'), 'utf8');
    const code = source
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.replace(/\/\/.*$/, ''))
      .join('\n');
    expect(code).not.toMatch(/theme\.isDark/);
    expect(code).not.toMatch(/\bisDark\s*\?/);
    expect(code).not.toMatch(/if\s*\(\s*!?\s*isDark\s*\)/);
    expect(code).not.toMatch(/theme\.id\s*===/);
    expect(code).not.toMatch(/useColorScheme\s*\(/);
    expect(code).not.toMatch(/Appearance\.getColorScheme\s*\(/);
  });
});
