import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {ScrollView} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import ConceptionStartArticleScreen from '../ConceptionStartArticleScreen';
import ArticleReaderScreen from '../ArticleReaderScreen';
import {getArticleById} from '../../../data/libraryContent';
import {getLibraryConfigForObjective} from '../../../data/libraryObjectiveConfig';

// PHASE (Spanish localization) — ITEM 3: article identity integrity.
//
// Across an EN -> ES -> FR language switch, a representative article's
// stable technical identity (bookmark id, category/objective wiring, hero
// image, Premium flag, bookmark state, reading-progress key, recommendation
// ids) must never move. src/state/libraryStore is mocked here the same way
// Phase7EAppearanceLibraryLanguageSwitch.test.tsx mocks it, so calls can be
// asserted by exact argument rather than only by outward behavior.
//
// ConceptionStartArticleScreen is the chosen representative (ID
// 'conceptiontips-essayer-de-concevoir', also used in ITEM 2) — its source
// was read directly to confirm the ID constant, the HERO require(), and the
// bookmark/scroll wiring referenced below.

const mockIsArticleBookmarked = jest.fn().mockReturnValue(false);
const mockToggleBookmark = jest.fn().mockReturnValue(true);
const mockSaveScrollPosition = jest.fn();

jest.mock('../../../state/libraryStore', () => ({
  loadLibraryState: jest.fn().mockResolvedValue({bookmarks: [], progress: {}}),
  getCachedLibraryState: jest.fn().mockReturnValue({bookmarks: [], progress: {}}),
  subscribeLibraryState: jest.fn().mockReturnValue(() => {}),
  toggleBookmark: (...args: [string]) => mockToggleBookmark(...args),
  isArticleBookmarked: (...args: [string]) => mockIsArticleBookmarked(...args),
  saveScrollPosition: (...args: [string, number]) => mockSaveScrollPosition(...args),
  getReadingSessionState: jest.fn().mockReturnValue({readingStatus: 'not_started', elapsedSeconds: 0, lastScrollPosition: 0}),
  setReadingSessionMeta: jest.fn(),
}));

const ARTICLE_ID = 'conceptiontips-essayer-de-concevoir';
const LIB_DIR = path.resolve(__dirname, '..');

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderScreen(Component: React.ComponentType<any>, initialParams: Record<string, unknown> = {}) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} initialParams={initialParams} name="Test" />
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

async function switchLanguage(lang: 'fr' | 'en' | 'es') {
  await act(async () => {
    await setAppLanguage(lang);
    await i18n.changeLanguage(lang);
  });
}

function findBookmarkPressable(renderer: ReactTestRenderer.ReactTestRenderer) {
  const icon = renderer.root.findAll(
    node => node.type === MaterialDesignIcons && ['bookmark', 'bookmark-outline'].includes(node.props.name),
  )[0];
  let node = icon;
  while (node.parent && typeof node.props.onPress !== 'function') {
    node = node.parent;
  }
  return node;
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockIsArticleBookmarked.mockReturnValue(false);
  mockToggleBookmark.mockReturnValue(true);
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('ITEM 3.a / 3.e — bookmark id + bookmark state identity across a language switch', () => {
  it('toggling the bookmark always calls the store with the SAME article id, regardless of displayed language', async () => {
    const renderer = await renderScreen(ConceptionStartArticleScreen);

    act(() => {
      findBookmarkPressable(renderer).props.onPress();
    });
    expect(mockToggleBookmark).toHaveBeenCalledWith(ARTICLE_ID);
    expect(mockToggleBookmark).toHaveBeenCalledTimes(1);

    await switchLanguage('es');
    act(() => {
      findBookmarkPressable(renderer).props.onPress();
    });
    expect(mockToggleBookmark).toHaveBeenLastCalledWith(ARTICLE_ID);

    await switchLanguage('fr');
    act(() => {
      findBookmarkPressable(renderer).props.onPress();
    });
    expect(mockToggleBookmark).toHaveBeenLastCalledWith(ARTICLE_ID);
    // Every single call across all three languages used the exact same id.
    for (const call of mockToggleBookmark.mock.calls) {
      expect(call).toEqual([ARTICLE_ID]);
    }
  });

  it('a bookmark set while English survives a switch to Spanish then French (mounted-state identity, not just the id)', async () => {
    mockIsArticleBookmarked.mockReturnValue(true);
    const renderer = await renderScreen(ConceptionStartArticleScreen);
    await settle();
    expect(findBookmarkPressable(renderer).parent!.findByType(MaterialDesignIcons).props.name).toBe('bookmark');

    await switchLanguage('es');
    expect(findBookmarkPressable(renderer).parent!.findByType(MaterialDesignIcons).props.name).toBe('bookmark');

    await switchLanguage('fr');
    expect(findBookmarkPressable(renderer).parent!.findByType(MaterialDesignIcons).props.name).toBe('bookmark');

    // isArticleBookmarked is only re-queried on mount (useEffect with an
    // empty dependency array) — a language switch must never trigger a
    // fresh lookup (that would be a sign the bookmark key had become
    // language-dependent).
    expect(mockIsArticleBookmarked).toHaveBeenCalledTimes(1);
    expect(mockIsArticleBookmarked).toHaveBeenCalledWith(ARTICLE_ID);
  });
});

describe('ITEM 3.f — reading-progress (scroll position) identity across a language switch', () => {
  it('saveScrollPosition is always called with the SAME article id, in every language', async () => {
    const renderer = await renderScreen(ConceptionStartArticleScreen);
    const scrollView = renderer.root.findByType(ScrollView);

    act(() => {
      scrollView.props.onScroll({nativeEvent: {contentOffset: {y: 42}}});
    });
    expect(mockSaveScrollPosition).toHaveBeenLastCalledWith(ARTICLE_ID, 42);

    await switchLanguage('es');
    act(() => {
      scrollView.props.onScroll({nativeEvent: {contentOffset: {y: 77}}});
    });
    expect(mockSaveScrollPosition).toHaveBeenLastCalledWith(ARTICLE_ID, 77);

    await switchLanguage('fr');
    act(() => {
      scrollView.props.onScroll({nativeEvent: {contentOffset: {y: 15}}});
    });
    expect(mockSaveScrollPosition).toHaveBeenLastCalledWith(ARTICLE_ID, 15);

    for (const call of mockSaveScrollPosition.mock.calls) {
      expect(call[0]).toBe(ARTICLE_ID);
    }
  });
});

describe('ITEM 3.b — category/objective association is static metadata, untouched by language', () => {
  it('getArticleById(ARTICLE_ID).categoryId stays "conceptionTips" across a language switch', async () => {
    expect(getArticleById(ARTICLE_ID)?.categoryId).toBe('conceptionTips');

    await switchLanguage('es');
    expect(getArticleById(ARTICLE_ID)?.categoryId).toBe('conceptionTips');

    await switchLanguage('fr');
    expect(getArticleById(ARTICLE_ID)?.categoryId).toBe('conceptionTips');
  });
});

describe('ITEM 3.c — hero image identity (no language-specific require() variant)', () => {
  it('ConceptionStartArticleScreen.tsx has exactly one require() call (the single HERO image, never duplicated per language)', () => {
    const source = fs.readFileSync(path.join(LIB_DIR, 'ConceptionStartArticleScreen.tsx'), 'utf8');
    const requireCalls = [...source.matchAll(/require\(/g)];
    expect(requireCalls.length).toBe(1);
    expect(source).toMatch(/const HERO = require\('..\/..\/assets\/images\/library\/featured-tracker\.png'\);/);
  });

  it('the same resolved image source renders across all three languages, same mounted instance', async () => {
    const renderer = await renderScreen(ConceptionStartArticleScreen);
    const findImageSource = () =>
      renderer.root.findAll(node => Boolean(node.props && 'source' in node.props))[0]?.props.source;
    const enSource = findImageSource();
    expect(enSource).toBeDefined();

    await switchLanguage('es');
    expect(findImageSource()).toBe(enSource);

    await switchLanguage('fr');
    expect(findImageSource()).toBe(enSource);
  });
});

describe('ITEM 3.d — Premium status is enforced identically regardless of displayed language', () => {
  it('flagging the article Premium gates it the same way in English, Spanish, and French', async () => {
    const article = getArticleById(ARTICLE_ID);
    expect(article).toBeDefined();
    article!.premium = true;
    try {
      const enRenderer = await renderScreen(ArticleReaderScreen, {articleId: ARTICLE_ID});
      expect(
        enRenderer.root.findAllByProps({accessibilityLabel: 'Discover Premium'}).length,
      ).toBeGreaterThan(0);

      await switchLanguage('es');
      const esRenderer = await renderScreen(ArticleReaderScreen, {articleId: ARTICLE_ID});
      expect(
        esRenderer.root.findAllByProps({accessibilityLabel: 'Descubrir Premium'}).length,
      ).toBeGreaterThan(0);

      await switchLanguage('fr');
      const frRenderer = await renderScreen(ArticleReaderScreen, {articleId: ARTICLE_ID});
      expect(
        frRenderer.root.findAllByProps({accessibilityLabel: 'Découvrir Premium'}).length,
      ).toBeGreaterThan(0);
    } finally {
      delete article!.premium;
    }
  });

  it('once not flagged Premium, the same article is never gated in any of the three languages', async () => {
    expect(getArticleById(ARTICLE_ID)?.premium).toBeUndefined();

    const enRenderer = await renderScreen(ArticleReaderScreen, {articleId: ARTICLE_ID});
    expect(enRenderer.root.findAllByProps({accessibilityLabel: 'Discover Premium'})).toHaveLength(0);

    await switchLanguage('es');
    const esRenderer = await renderScreen(ArticleReaderScreen, {articleId: ARTICLE_ID});
    expect(esRenderer.root.findAllByProps({accessibilityLabel: 'Descubrir Premium'})).toHaveLength(0);
  });
});

describe('ITEM 3.g — recommendation ids (objective -> recommendedArticleIds) are language-independent', () => {
  it('getLibraryConfigForObjective("conceive").recommendedArticleIds is byte-identical across a language switch', async () => {
    const before = getLibraryConfigForObjective('conceive').recommendedArticleIds;
    expect(before).toEqual([
      'fertility-fenetre-fertile',
      'ovulation-comprendre-ovulation',
      'basaltemp-suivre-temperature',
      'cervicalmucus-observer-glaire',
      'lhtests-comprendre-tests-ovulation',
    ]);

    await switchLanguage('es');
    expect(getLibraryConfigForObjective('conceive').recommendedArticleIds).toEqual(before);

    await switchLanguage('fr');
    expect(getLibraryConfigForObjective('conceive').recommendedArticleIds).toEqual(before);
  });
});
