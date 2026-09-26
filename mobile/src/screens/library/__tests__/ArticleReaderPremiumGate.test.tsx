import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import ArticleReaderScreen from '../ArticleReaderScreen';
import ArticleRow from '../../../components/library/ArticleRow';
import {ArticlePremiumBadge} from '../../../components/library/ArticlePremiumBadge';
import ObjectiveArticlesSection from '../../../components/home/ObjectiveArticlesSection';
import {
  getArticleById,
  hasPremiumArticles,
  isPremiumArticle,
  LIBRARY_ARTICLES,
  type LibraryArticle,
} from '../../../data/libraryContent';
import {getLibraryConfigForObjective} from '../../../data/libraryObjectiveConfig';
import {resetPremiumStateForTests, updatePremiumState} from '../../../state/premiumStore';

// M38 — every entry path to a Premium-flagged guide goes through
// ArticleReaderScreen (cards/lists/dashboards/notifications/deep links all
// call navigation.navigate('ArticleReader', {articleId})), so the gate lives
// there. The tests reach the reader the way ANY caller does — a bare route
// with an articleId — never through a card, proving no path can bypass it.

const Stack = createNativeStackNavigator();
const TEST_METRICS: Metrics = {
  frame: {x: 0, y: 0, width: 360, height: 800},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const PREMIUM_GENERIC: LibraryArticle = {
  id: 'test-premium-guide',
  title: 'Guide test réservé Premium',
  categoryId: 'cycle',
  level: 'beginner',
  type: 'guide',
  durationMinutes: 3,
  tags: [],
  summary: 'Résumé test',
  content: ['CONTENU-SECRET-PREMIUM'],
  premium: true,
};
const FREE_GENERIC: LibraryArticle = {
  ...PREMIUM_GENERIC,
  id: 'test-free-guide',
  title: 'Guide test gratuit',
  content: ['CONTENU-GRATUIT'],
  premium: undefined,
};

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));

async function openReader(articleId: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen
                component={ArticleReaderScreen as never}
                initialParams={{articleId}}
                name="ArticleReader"
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

beforeAll(() => {
  LIBRARY_ARTICLES.push(PREMIUM_GENERIC, FREE_GENERIC);
});
afterAll(() => {
  LIBRARY_ARTICLES.splice(LIBRARY_ARTICLES.indexOf(PREMIUM_GENERIC), 1);
  LIBRARY_ARTICLES.splice(LIBRARY_ARTICLES.indexOf(FREE_GENERIC), 1);
});
beforeEach(() => {
  resetPremiumStateForTests();
});
afterEach(() => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('library Premium flag — current catalogue', () => {
  it('no shipped article is flagged Premium (PRODUCT DECISION REQUIRED); the flag defaults to free', () => {
    const shipped = LIBRARY_ARTICLES.filter(article => article.id !== PREMIUM_GENERIC.id && article.id !== FREE_GENERIC.id);
    expect(shipped.some(isPremiumArticle)).toBe(false);
    expect(isPremiumArticle(undefined)).toBe(false);
    expect(isPremiumArticle(FREE_GENERIC)).toBe(false);
    expect(isPremiumArticle(PREMIUM_GENERIC)).toBe(true);
  });

  it('hasPremiumArticles() reflects the catalogue', () => {
    expect(hasPremiumArticles()).toBe(true); // test article present
    LIBRARY_ARTICLES.splice(LIBRARY_ARTICLES.indexOf(PREMIUM_GENERIC), 1);
    try {
      expect(hasPremiumArticles()).toBe(false);
    } finally {
      LIBRARY_ARTICLES.push(PREMIUM_GENERIC);
    }
  });
});

describe('ArticleReader — Premium gate on direct navigation (generic reader)', () => {
  it('Free user: a Premium-labelled guide is gated and its content is NOT rendered', async () => {
    const renderer = await openReader(PREMIUM_GENERIC.id);
    const texts = textsOf(renderer);
    expect(texts).toContain('Découvrir Premium');
    expect(texts).toContain(PREMIUM_GENERIC.title);
    expect(texts.some(text => text.includes('CONTENU-SECRET-PREMIUM'))).toBe(false);
  });

  it('Free user: tapping the upgrade CTA opens the existing Premium sheet (no purchase implied)', async () => {
    const renderer = await openReader(PREMIUM_GENERIC.id);
    const cta = renderer.root.findAllByProps({accessibilityLabel: 'Découvrir Premium'}).find(node => typeof node.props.onPress === 'function');
    await act(async () => {
      cta!.props.onPress();
    });
    expect(renderer.root.findAllByProps({accessibilityLabel: 'Fermer AWA Premium'}).length).toBeGreaterThan(0);
  });

  it('Premium user: the same direct navigation shows the content, no gate', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    const renderer = await openReader(PREMIUM_GENERIC.id);
    const texts = textsOf(renderer);
    expect(texts.some(text => text.includes('CONTENU-SECRET-PREMIUM'))).toBe(true);
    expect(texts).not.toContain('Découvrir Premium');
  });

  it('Premium state change while on the reader unlocks it live (canonical usePremium)', async () => {
    const renderer = await openReader(PREMIUM_GENERIC.id);
    expect(textsOf(renderer)).toContain('Découvrir Premium');
    await act(async () => {
      updatePremiumState({isPremium: true});
    });
    expect(textsOf(renderer).some(text => text.includes('CONTENU-SECRET-PREMIUM'))).toBe(true);
  });

  it('non-Premium guide stays accessible to a Free user', async () => {
    const renderer = await openReader(FREE_GENERIC.id);
    const texts = textsOf(renderer);
    expect(texts.some(text => text.includes('CONTENU-GRATUIT'))).toBe(true);
    expect(texts).not.toContain('Découvrir Premium');
  });
});

describe('ArticleReader — Premium gate also covers bespoke article screens', () => {
  const LOCHIA_ID = 'lochia-comprendre-lochies';

  it('Free user: a bespoke-layout article flagged Premium is gated before its bespoke screen renders', async () => {
    const article = getArticleById(LOCHIA_ID)!;
    article.premium = true;
    try {
      const renderer = await openReader(LOCHIA_ID);
      expect(textsOf(renderer)).toContain('Découvrir Premium');
    } finally {
      delete article.premium;
    }
  });

  it('Free user: the same bespoke article is NOT gated while it is not flagged Premium', async () => {
    const renderer = await openReader(LOCHIA_ID);
    expect(textsOf(renderer)).not.toContain('Découvrir Premium');
  });
});

describe('Premium affordance on cards and lists', () => {
  it('ArticleRow shows the Premium badge for a Premium guide and none for a free one', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    const noop = jest.fn();
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={TEST_METRICS}>
          <AwaThemeProvider>
            <ArticleRow article={PREMIUM_GENERIC} bookmarked={false} onPress={noop} onToggleBookmark={noop} progress={0} />
            <ArticleRow article={FREE_GENERIC} bookmarked={false} onPress={noop} onToggleBookmark={noop} progress={0} />
          </AwaThemeProvider>
        </SafeAreaProvider>,
      );
    });
    activeRenderers.push(renderer);
    expect(textsOf(renderer).filter(text => text === 'Premium')).toHaveLength(1);
    expect(renderer.root.findAllByProps({accessibilityLabel: 'Contenu Premium verrouillé'}).length).toBeGreaterThan(0);
  });

  it('the badge shows the unlocked wording for a Premium user and never renders for a free guide', async () => {
    act(() => {
      updatePremiumState({isPremium: true});
    });
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <>
          <ArticlePremiumBadge article={PREMIUM_GENERIC} />
          <ArticlePremiumBadge article={FREE_GENERIC} />
        </>,
      );
    });
    activeRenderers.push(renderer);
    expect(renderer.root.findAllByProps({accessibilityLabel: 'Contenu Premium'}).length).toBeGreaterThan(0);
    expect(renderer.root.findAllByProps({accessibilityLabel: 'Contenu Premium verrouillé'})).toHaveLength(0);
    expect(textsOf(renderer).filter(text => text === 'Premium')).toHaveLength(1);
  });

  it('a dashboard "Pour t’accompagner" tile shows the badge for a Premium guide, and its tap still routes through ArticleReader (gate applies there)', async () => {
    const objective = 'cycle' as const;
    const recommended = getLibraryConfigForObjective(objective).recommendedArticleIds;
    const target = getArticleById(recommended[0])!;
    target.premium = true;
    try {
      const onOpenArticle = jest.fn();
      let renderer!: ReactTestRenderer.ReactTestRenderer;
      await act(async () => {
        renderer = ReactTestRenderer.create(
          <SafeAreaProvider initialMetrics={TEST_METRICS}>
            <AwaThemeProvider>
              <ObjectiveArticlesSection objective={objective} onOpenArticle={onOpenArticle} onSeeAll={jest.fn()} />
            </AwaThemeProvider>
          </SafeAreaProvider>,
        );
      });
      activeRenderers.push(renderer);
      expect(renderer.root.findAllByProps({accessibilityLabel: 'Contenu Premium verrouillé'}).length).toBeGreaterThan(0);
      const tile = renderer.root.findAllByProps({accessibilityLabel: target.title}).find(node => typeof node.props.onPress === 'function');
      act(() => {
        tile!.props.onPress();
      });
      // The tile does not gate itself: it hands the id to the reader, which is
      // the single enforcement point (covered above).
      expect(onOpenArticle).toHaveBeenCalledWith(target.id);
    } finally {
      delete target.premium;
    }
  });
});
