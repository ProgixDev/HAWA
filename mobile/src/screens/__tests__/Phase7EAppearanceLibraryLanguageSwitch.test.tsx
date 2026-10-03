import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import AppearanceScreen from '../AppearanceScreen';
import FeaturedArticlesScreen from '../FeaturedArticlesScreen';
import ReadingControls from '../../components/articles/ReadingControls';
import BookmarkButton from '../../components/library/BookmarkButton';
import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage, getSelectedThemeId, setSelectedThemeId} from '../../state/themePreferences';
import i18n from '../../i18n';

// Phase 7E — AppearanceScreen's theme palette descriptions and the Library
// chrome (FeaturedArticlesScreen, ReadingControls, BookmarkButton) must
// follow the app language, while every stable technical identifier (the
// selected theme id, article ids) stays completely unaffected.

jest.mock('../../state/libraryStore', () => ({
  loadLibraryState: jest.fn().mockResolvedValue({bookmarks: [], readingProgress: {}}),
  getCachedLibraryState: jest.fn().mockReturnValue({bookmarks: [], readingProgress: {}}),
  subscribeLibraryState: jest.fn().mockReturnValue(() => {}),
  toggleBookmark: jest.fn().mockReturnValue(true),
  isArticleBookmarked: jest.fn().mockReturnValue(false),
  saveScrollPosition: jest.fn(),
  getReadingSessionState: jest.fn().mockReturnValue({lastScrollPosition: 0}),
}));

const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];
const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

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

const navigation = {goBack: jest.fn(), navigate: jest.fn()};
const route = {key: 'k', name: 'test', params: undefined} as never;

beforeEach(async () => {
  await resetAppLanguageForTests();
  await setSelectedThemeId('awa-original');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('fr');
});

describe('TEST — AppearanceScreen theme palette descriptions follow the app language', () => {
  it('French: the AWA Original card shows its French description', () => {
    const renderer = renderDirect(<AppearanceScreen navigation={navigation as never} route={route} />);
    expect(textsOf(renderer)).toContain('Doux et harmonieux');
  });

  it('English: the same card shows its English description, no French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<AppearanceScreen navigation={navigation as never} route={route} />);
    expect(textsOf(renderer)).toContain('Soft and harmonious');
    expect(textsOf(renderer)).not.toContain('Doux et harmonieux');
  });

  it('a language switch never changes the selected theme id (technical selection, not display)', async () => {
    await setSelectedThemeId('ocean-calm');
    expect(getSelectedThemeId()).toBe('ocean-calm');

    await act(async () => {
      await setAppLanguage('en');
      await i18n.changeLanguage('en');
    });

    expect(getSelectedThemeId()).toBe('ocean-calm');
  });
});

describe('TEST — FeaturedArticlesScreen follows the app language, article ids stay stable', () => {
  it('French: page title, badge and CTA render', () => {
    const renderer = renderDirect(<FeaturedArticlesScreen navigation={navigation as never} route={route} />);
    const texts = textsOf(renderer);
    expect(texts).toContain('À la une');
    expect(texts).toContain('ARTICLE DU MOMENT');
    expect(texts).toContain('Lire l\'article');
  });

  it('English: the same copy translates, no French leaking', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<FeaturedArticlesScreen navigation={navigation as never} route={route} />);
    const texts = textsOf(renderer);
    expect(texts).toContain('Featured');
    expect(texts).toContain('FEATURED ARTICLE');
    expect(texts).not.toContain('ARTICLE DU MOMENT');
  });

  it('tapping the hero card navigates with the same stable article id regardless of language', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<FeaturedArticlesScreen navigation={navigation as never} route={route} />);
    // Walk up from the (translated) badge text to the single Pressable that
    // wraps the entire hero card — the article id it opens is a hardcoded
    // constant, never derived from t(), so it must stay stable.
    let node = renderer.root.findByProps({children: 'FEATURED ARTICLE'});
    while (node.parent && typeof node.props.onPress !== 'function') {
      node = node.parent;
    }
    act(() => {
      node.props.onPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('ArticleReader', {articleId: 'cycle-phases-expliquees'});
  });
});

describe('TEST — ReadingControls follows the app language', () => {
  it('French: "Commencer la lecture" / reading-time subtitle', () => {
    const renderer = renderDirect(
      <ReadingControls articleId="test-article" durationMinutes={5} scrollRef={{current: null}} />,
    );
    expect(textsOf(renderer)).toContain('Commencer la lecture');
    expect(textsOf(renderer)).toContain('5 min de lecture');
  });

  it('English: the same copy translates', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(
      <ReadingControls articleId="test-article" durationMinutes={5} scrollRef={{current: null}} />,
    );
    expect(textsOf(renderer)).toContain('Start reading');
    expect(textsOf(renderer)).toContain('5 min read');
  });
});

describe('TEST — BookmarkButton accessibility label follows the app language', () => {
  it('French: "Ajouter aux favoris" when inactive', () => {
    const renderer = renderDirect(<BookmarkButton active={false} onPress={jest.fn()} />);
    expect(renderer.root.findByProps({accessibilityLabel: 'Ajouter aux favoris'})).toBeTruthy();
  });

  it('English: the label translates', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const renderer = renderDirect(<BookmarkButton active={false} onPress={jest.fn()} />);
    expect(renderer.root.findByProps({accessibilityLabel: 'Add to favorites'})).toBeTruthy();
  });
});
