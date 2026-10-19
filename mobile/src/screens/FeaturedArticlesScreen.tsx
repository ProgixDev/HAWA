import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getCachedLibraryState,
  loadLibraryState,
  subscribeLibraryState,
  toggleBookmark,
} from '../state/libraryStore';
import {getBottomPadding, getTopPadding} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import BookmarkButton from '../components/library/BookmarkButton';

const HERO = require('../assets/images/library/featured-cycle.png');
const COMFORT_HERO = require('../assets/images/library/featured-comfort-hero.png');
const TRACKING_HERO = require('../assets/images/library/featured-tracking-hero.png');
const PHASES = require('../assets/images/library/popular-phases.png');
const BRANCH = require('../assets/images/library/category-lifestyle.png');
const FOOD = require('../assets/images/library/popular-nutrition.png');
const PAIN = require('../assets/images/library/featured-pain.png');
const TRACKER = require('../assets/images/library/featured-tracker.png');
const SPM = require('../assets/images/library/featured-spm.png');
const FLOW = require('../assets/images/library/featured-flow.png');

// Fixed literals on purpose: this scrim sits on top of the rotating hero
// photographs (HERO_SLIDES), not a theme-driven surface. Title/summary text
// drawn directly over an arbitrary photo can't rely on theme.colors.text /
// textSecondary for contrast — those tokens are calibrated against
// theme.colors.background, not against a bright, unpredictable image. The
// scrim guarantees a dark backdrop regardless of theme or photo brightness,
// same reasoning as the sibling "À la une" hero card's photo-legibility
// treatment in LibraryScreen.tsx.
const HERO_SCRIM_COLORS: string[] = [
  'rgba(20,14,26,0.72)',
  'rgba(20,14,26,0.46)',
  'rgba(20,14,26,0)',
];
const HERO_TITLE_ON_SCRIM = '#FFFFFF';
const HERO_SUMMARY_ON_SCRIM = 'rgba(255,255,255,0.88)';

type Props = NativeStackScreenProps<RootStackParamList, 'FeaturedArticles'>;

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

// Title/summary/meta are translated via the library.featured.articles.* keys
// (see fr.ts/en.ts's matching namespace comment); id/image/minutes stay
// stable technical values, never translated.
const heroSlidesOf = (t: TranslateFn) => [
  {id: 'cycle-phases-expliquees', image: HERO, title: t('library.featured.articles.cyclePhasesExpliquees.title'), summary: t('library.featured.articles.cyclePhasesExpliquees.summary'), minutes: 6},
  {id: 'pain-gerer-douleurs', image: COMFORT_HERO, title: t('library.featured.articles.painGererDouleurs.title'), summary: t('library.featured.articles.painGererDouleurs.summary'), minutes: 7},
  {id: 'cycle-comprendre-ton-cycle', image: TRACKING_HERO, title: t('library.featured.articles.cycleComprendreTonCycle.title'), summary: t('library.featured.articles.cycleComprendreTonCycle.summary'), minutes: 6},
] as const;

const popularOf = (t: TranslateFn) => [
  {
    id: 'cycle-phases-expliquees',
    title: t('library.featured.articles.cyclePhasesExpliquees.title'),
    minutes: 6,
    image: PHASES,
  },
  {
    id: 'flow-comprendre-flux',
    title: t('library.featured.articles.flowComprendreFlux.title'),
    minutes: 6,
    image: BRANCH,
  },
  {
    id: 'nutrition-conception-fertilite',
    title: t('library.featured.articles.nutritionConceptionFertilite.title'),
    minutes: 4,
    image: FOOD,
  },
] as const;

const newArticlesOf = (t: TranslateFn) => [
  {
    id: 'pain-gerer-douleurs',
    title: t('library.featured.articles.painGererDouleurs.title'),
    meta: t('library.screen.durationMinRead', {count: 7}),
    image: PAIN,
  },
  {
    id: 'cycle-comprendre-ton-cycle',
    title: t('library.featured.articles.cycleComprendreTonCycle.title'),
    meta: t('library.screen.durationMinRead', {count: 5}),
    image: TRACKER,
  },
  {
    id: 'symptoms-reconnaitre',
    title: t('library.featured.articles.symptomsReconnaitre.title'),
    meta: t('library.screen.durationMinRead', {count: 4}),
    image: SPM,
  },
  {
    id: 'flow-colors-textures',
    title: t('library.featured.articles.flowColorsTextures.title'),
    meta: t('library.screen.durationMinRead', {count: 4}),
    image: FLOW,
  },
] as const;

function FeaturedArticlesScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const HERO_SLIDES = useMemo(() => heroSlidesOf(t), [t]);
  const POPULAR = useMemo(() => popularOf(t), [t]);
  const NEW_ARTICLES = useMemo(() => newArticlesOf(t), [t]);

  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [heroIndex, setHeroIndex] = useState(0);
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const activeHero = HERO_SLIDES[heroIndex];

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(state => {
      if (mounted) {
        setSaved(new Set(state.bookmarks));
      }
    });

    const unsubscribe = subscribeLibraryState(() => {
      setSaved(new Set(getCachedLibraryState().bookmarks));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(heroOpacity, {toValue: 0, duration: 320, useNativeDriver: true}).start(({finished}) => {
        if (!finished) {return;}
        setHeroIndex(current => (current + 1) % HERO_SLIDES.length);
        Animated.timing(heroOpacity, {toValue: 1, duration: 480, useNativeDriver: true}).start();
      });
    }, 3000);
    return () => {clearInterval(timer); heroOpacity.stopAnimation();};
  }, [heroOpacity, HERO_SLIDES.length]);

  const toggle = (id: string) => {
    toggleBookmark(id);
    setSaved(new Set(getCachedLibraryState().bookmarks));
  };

  const open = (id: string) => {
    navigation.navigate('ArticleReader', {articleId: id});
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getTopPadding(insets.top, true),
            paddingBottom: getBottomPadding(insets.bottom),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="chevron-left"
            onPress={() => navigation.goBack()}
            variant="tonal"
          />

          <View style={styles.headerCopy}>
            <AwaText style={styles.pageTitle} variant="headlineSmall">{t('library.screen.featuredTitle')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.pageSubtitle} variant="bodySmall">
              {t('library.featured.headerSubtitle')}
            </AwaText>
          </View>

          <AwaIconButton
            accessibilityLabel={t('library.featured.addMomentToFavorites')}
            icon={saved.has(activeHero.id) ? 'bookmark' : 'bookmark-outline'}
            iconSize={20}
            onPress={() => toggle(activeHero.id)}
            selected={saved.has(activeHero.id)}
            variant="tonal"
          />
        </View>

        <Pressable
          onPress={() => open(activeHero.id)}
          style={({pressed}) => [
            styles.hero,
            pressed && styles.heroPressed,
          ]}>
          <Animated.View style={[styles.heroImageBackground, {opacity: heroOpacity}]}>
          <ImageBackground
            source={activeHero.image}
            resizeMode="cover"
            imageStyle={styles.heroImage}
            style={styles.heroImageBackground}>
            <LinearGradient
              colors={HERO_SCRIM_COLORS}
              locations={[0, 0.62, 1]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              pointerEvents="none"
              style={styles.heroScrim}
            />

            <View style={styles.heroCopy}>
              <View style={styles.badge}>
                <AwaText emphasized style={styles.badgeText} variant="labelSmall">
                  {t('library.featured.momentBadge')}
                </AwaText>
              </View>

              <AwaText emphasized style={styles.heroTitle} variant="titleLarge">
                {activeHero.title}
              </AwaText>

              <AwaText style={styles.heroSummary} variant="bodySmall">
                {activeHero.summary}
              </AwaText>

              <View style={styles.heroFooter}>
                <View style={styles.timeChip}>
                  <MaterialDesignIcons
                    color={theme.colors.textSecondary}
                    name="clock-outline"
                    size={14}
                  />
                  <AwaText color={theme.colors.textSecondary} variant="labelSmall" emphasized>
                    {t('library.screen.durationMin', {count: activeHero.minutes})}
                  </AwaText>
                </View>

                <AwaButton
                  label={t('library.screen.readArticle')}
                  onPress={() => open(activeHero.id)}
                  size="compact"
                  variant="filled"
                />
              </View>
            </View>
          </ImageBackground>
          </Animated.View>
        </Pressable>

        <View style={styles.dots}>
          {HERO_SLIDES.map((slide, index) => (
            <Pressable
              accessibilityLabel={t('library.featured.slideAccessibility', {current: index + 1, total: HERO_SLIDES.length})}
              accessibilityRole="button"
              accessibilityState={{selected: index === heroIndex}}
              key={slide.id}
              hitSlop={16}
              onPress={() => setHeroIndex(index)}
              style={index === heroIndex ? styles.dotActive : styles.dot}
            />
          ))}
        </View>

        <View style={styles.heading}>
          <AwaText style={styles.headingText} variant="titleMedium">
            {t('library.screen.popularSectionTitle')}
          </AwaText>
          <AwaButton
            accessibilityLabel={t('library.featured.seeAllPopular')}
            hitSlop={10}
            label={t('library.screen.seeAll')}
            size="compact"
            variant="text"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cards}>
          {POPULAR.map(item => (
            <AwaCard
              key={item.id}
              onPress={() => open(item.id)}
              padding="compact"
              style={styles.card}
              variant="filled">
              <Image
                source={item.image}
                resizeMode="cover"
                style={styles.cardImage}
              />

              <AwaText emphasized style={styles.cardTitle} variant="labelMedium">
                {item.title}
              </AwaText>

              <View style={styles.cardMetaRow}>
                <MaterialDesignIcons
                  color={theme.colors.textSecondary}
                  name="clock-outline"
                  size={11}
                />
                <AwaText colorRole="onSurfaceVariant" variant="labelSmall">
                  {t('library.screen.durationMinRead', {count: item.minutes})}
                </AwaText>
              </View>
            </AwaCard>
          ))}
        </ScrollView>

        <View style={styles.heading}>
          <AwaText style={styles.headingText} variant="titleMedium">
            {t('library.featured.newHeading')}
          </AwaText>
          <AwaButton
            accessibilityLabel={t('library.featured.seeAllNew')}
            hitSlop={10}
            label={t('library.screen.seeAll')}
            size="compact"
            variant="text"
          />
        </View>

        {NEW_ARTICLES.map(item => (
          <Pressable
            key={item.id}
            onPress={() => open(item.id)}
            style={({pressed}) => [
              styles.articleRow,
              pressed && styles.articleRowPressed,
            ]}>
            <Image
              source={item.image}
              resizeMode="cover"
              style={styles.thumb}
            />

            <View style={styles.articleCopy}>
              <AwaText emphasized variant="titleSmall">
                {item.title}
              </AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.articleMeta} variant="bodySmall">
                {item.meta}
              </AwaText>
            </View>

            <BookmarkButton
              active={saved.has(item.id)}
              onPress={() => toggle(item.id)}
              size="small"
            />
          </Pressable>
        ))}

        <AwaCard style={styles.trust} variant="filled">
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="shield-check-outline"
            size={24}
          />

          <View style={styles.trustCopy}>
            <AwaText emphasized variant="titleSmall">
              {t('library.featured.trustTitle')}
            </AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.trustText} variant="bodySmall">
              {t('library.featured.trustText')}
            </AwaText>
          </View>
        </AwaCard>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    content: {
      paddingHorizontal: 16,
    },

    header: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    headerCopy: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 12,
    },

    pageTitle: {
      textAlign: 'center',
    },

    pageSubtitle: {
      marginTop: 2,
      textAlign: 'center',
    },

    hero: {
      minHeight: 244,
      overflow: 'hidden',
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    heroPressed: {
      opacity: 0.94,
    },

    heroImageBackground: {
      flex: 1,
      justifyContent: 'center',
    },

    heroImage: {
      borderRadius: 12,
    },

    heroScrim: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 12,
    },

    heroCopy: {
      width: '64%',
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      justifyContent: 'space-between',
    },

    badge: {
      alignSelf: 'flex-start',
      marginTop: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    badgeText: {
      color: theme.colors.primary,
    },

    heroTitle: {
      marginTop: 12,
      color: HERO_TITLE_ON_SCRIM,
    },

    heroSummary: {
      marginTop: 8,
      color: HERO_SUMMARY_ON_SCRIM,
    },

    heroFooter: {
      marginTop: 6,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      transform: [{translateY: -8}],
    },

    timeChip: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 12,
      borderWidth: 1,
      // Translucent frosted chip drawn on top of the hero photo — sourced
      // from theme tokens (not new literals) but kept as a soft neutral
      // overlay, same legibility-over-photo reasoning as the hero title's
      // text shadow below.
      borderColor: withAlpha(theme.colors.textSecondary, 0.18),
      backgroundColor: withAlpha(theme.colors.surface, 0.72),
      paddingHorizontal: 12,
    },

    dots: {
      height: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },

    dotActive: {
      width: 12,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.primary,
    },

    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },

    heading: {
      marginTop: 9,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    headingText: {
      flexShrink: 1,
    },

    cards: {
      gap: 9,
      paddingBottom: 4,
    },

    card: {
      width: 136,
      minHeight: 182,
    },

    cardImage: {
      width: '100%',
      height: 78,
      borderRadius: 8,
    },

    cardTitle: {
      marginTop: 8,
    },

    cardMetaRow: {
      marginTop: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    articleRow: {
      minHeight: 78,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },

    articleRowPressed: {
      opacity: 0.78,
    },

    thumb: {
      width: 58,
      height: 58,
      borderRadius: 8,
    },

    articleCopy: {
      flex: 1,
      paddingHorizontal: 11,
    },

    articleMeta: {
      marginTop: 4,
    },

    trust: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    trustCopy: {
      flex: 1,
      paddingLeft: 12,
    },

    trustText: {
      marginTop: 4,
    },
  });
}

export default FeaturedArticlesScreen;
