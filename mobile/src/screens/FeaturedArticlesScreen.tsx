import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getCachedLibraryState,
  loadLibraryState,
  subscribeLibraryState,
  toggleBookmark,
} from '../state/libraryStore';
import {getBottomPadding, getTopPadding} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';

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

const HERO_SLIDES = [
  {id: 'cycle-phases-expliquees', image: HERO, title: 'Les différentes phases du cycle', summary: 'Découvre les phases de ton cycle et leur rôle dans ton équilibre hormonal.', minutes: 6},
  {id: 'pain-gerer-douleurs', image: COMFORT_HERO, title: 'Gérer les douleurs menstruelles', summary: 'Des gestes doux et naturels pour apaiser les crampes et retrouver ton confort.', minutes: 7},
  {id: 'cycle-comprendre-ton-cycle', image: TRACKING_HERO, title: 'Comprendre ton cycle menstruel', summary: 'Observe tes rythmes et apprends à reconnaître les signaux uniques de ton corps.', minutes: 6},
] as const;

const POPULAR = [
  {
    id: 'cycle-phases-expliquees',
    title: 'Les différentes phases du cycle',
    minutes: 6,
    image: PHASES,
  },
  {
    id: 'flow-comprendre-flux',
    title: 'Comprendre ton flux menstruel',
    minutes: 6,
    image: BRANCH,
  },
  {
    id: 'nutrition-conception-fertilite',
    title: 'Nutrition et fertilité',
    minutes: 4,
    image: FOOD,
  },
] as const;

const NEW_ARTICLES = [
  {
    id: 'pain-gerer-douleurs',
    title: 'Gérer les douleurs menstruelles',
    meta: '7 min de lecture',
    image: PAIN,
  },
  {
    id: 'cycle-comprendre-ton-cycle',
    title: 'Comprendre ton cycle menstruel',
    meta: '5 min de lecture',
    image: TRACKER,
  },
  {
    id: 'symptoms-reconnaitre',
    title: 'Comprendre les symptômes avant les règles',
    meta: '4 min de lecture',
    image: SPM,
  },
  {
    id: 'flow-colors-textures',
    title: 'Flux menstruel : comprendre les couleurs et textures',
    meta: '4 min de lecture',
    image: FLOW,
  },
] as const;

function FeaturedArticlesScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  }, [heroOpacity]);

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
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({pressed}) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.text}
              name="chevron-left"
              size={21}
            />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.pageTitle}>À la une</Text>
            <Text style={styles.pageSubtitle}>
              Des articles sélectionnés pour toi
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Ajouter l’article du moment aux favoris"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => toggle(activeHero.id)}
            style={({pressed}) => [
              styles.headerButton,
              saved.has(activeHero.id) &&
                styles.headerButtonActive,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name={
                saved.has(activeHero.id)
                  ? 'bookmark'
                  : 'bookmark-outline'
              }
              size={20}
            />
          </Pressable>
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
                <Text style={styles.badgeText}>
                  ARTICLE DU MOMENT
                </Text>
              </View>

              <Text style={styles.heroTitle}>
                {activeHero.title}
              </Text>

              <Text style={styles.heroSummary}>
                {activeHero.summary}
              </Text>

              <View style={styles.heroFooter}>
                <View style={styles.timeChip}>
                  <MaterialDesignIcons
                    color={theme.colors.textSecondary}
                    name="clock-outline"
                    size={14}
                  />
                  <Text style={styles.timeText}>
                    {activeHero.minutes} min
                  </Text>
                </View>

                <View style={styles.readButton}>
                  <Text
                    numberOfLines={1}
                    style={styles.readButtonText}>
                    Lire l’article
                  </Text>
                  <MaterialDesignIcons
                    color={onPrimaryTextColor(theme)}
                    name="arrow-right"
                    size={15}
                  />
                </View>
              </View>
            </View>
          </ImageBackground>
          </Animated.View>
        </Pressable>

        <View style={styles.dots}>
          {HERO_SLIDES.map((slide, index) => (
            <Pressable
              accessibilityLabel={`Article ${index + 1} sur ${HERO_SLIDES.length}`}
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
          <Text style={styles.headingText}>
            Articles populaires
          </Text>
          <Pressable accessibilityLabel="Voir tout : Articles populaires" accessibilityRole="button" hitSlop={10}>
            <Text style={styles.seeAll}>
              Voir tout
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cards}>
          {POPULAR.map(item => (
            <Pressable
              key={item.id}
              onPress={() => open(item.id)}
              style={({pressed}) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}>
              <Image
                source={item.image}
                resizeMode="cover"
                style={styles.cardImage}
              />

              <Text style={styles.cardTitle}>
                {item.title}
              </Text>

              <View style={styles.cardMetaRow}>
                <MaterialDesignIcons
                  color={theme.colors.textSecondary}
                  name="clock-outline"
                  size={11}
                />
                <Text style={styles.cardMeta}>
                  {item.minutes} min de lecture
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.heading}>
          <Text style={styles.headingText}>
            Nouveautés
          </Text>
          <Pressable accessibilityLabel="Voir tout : Nouveautés" accessibilityRole="button" hitSlop={10}>
            <Text style={styles.seeAll}>
              Voir tout
            </Text>
          </Pressable>
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
              <Text style={styles.articleTitle}>
                {item.title}
              </Text>
              <Text style={styles.articleMeta}>
                {item.meta}
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Ajouter aux favoris"
              hitSlop={10}
              onPress={event => {
                event.stopPropagation();
                toggle(item.id);
              }}
              style={({pressed}) => [
                styles.rowBookmark,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name={
                  saved.has(item.id)
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
                size={19}
              />
            </Pressable>
          </Pressable>
        ))}

        <View style={styles.trust}>
          <View style={styles.shield}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="shield-check-outline"
              size={24}
            />
          </View>

          <View style={styles.trustCopy}>
            <Text style={styles.trustTitle}>
              Contenus fiables et validés
            </Text>
            <Text style={styles.trustText}>
              Tous nos articles sont rédigés par des
              professionnels de santé et des experts.
            </Text>
          </View>

          <MaterialDesignIcons
            color={theme.colors.text}
            name="chevron-right"
            size={19}
          />
        </View>
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
      paddingHorizontal: 17,
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

    headerButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 1,
    },

    headerButtonActive: {
      // No dedicated "active border" token exists yet — closest available
      // token is `primary` softened with alpha, matching the original
      // literal's mid-tone lavender-gray read.
      borderColor: withAlpha(theme.colors.primary, 0.35),
      backgroundColor: theme.colors.primarySoft,
    },

    pressed: {
      opacity: 0.72,
    },

    pageTitle: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 24,
      lineHeight: 29,
      fontWeight: '700',
    },

    pageSubtitle: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 11.5,
      lineHeight: 15,
    },

    hero: {
      height: 244,
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
      borderRadius: 5,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },

    badgeText: {
      color: theme.colors.primary,
      fontSize: 8.5,
      lineHeight: 10,
      fontWeight: '800',
      letterSpacing: 0.2,
    },

    heroTitle: {
      marginTop: 11,
      color: HERO_TITLE_ON_SCRIM,
      fontFamily: 'serif',
      fontSize: 21,
      lineHeight: 25,
      fontWeight: '700',
    },

    heroSummary: {
      marginTop: 9,
      color: HERO_SUMMARY_ON_SCRIM,
      fontSize: 11,
      lineHeight: 16,
    },

    heroFooter: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      transform: [{translateY: -8}],
    },

    timeChip: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 9,
      borderWidth: 1,
      // Translucent frosted chip drawn on top of the hero photo — sourced
      // from theme tokens (not new literals) but kept as a soft neutral
      // overlay, same legibility-over-photo reasoning as the hero title's
      // text shadow below.
      borderColor: withAlpha(theme.colors.textSecondary, 0.18),
      backgroundColor: withAlpha(theme.colors.surface, 0.72),
      paddingHorizontal: 9,
    },

    timeText: {
      color: theme.colors.textSecondary,
      fontSize: 9.5,
      fontWeight: '600',
    },

    readButton: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      borderRadius: 9,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
    },

    readButtonText: {
      color: onPrimaryTextColor(theme),
      fontSize: 9.8,
      fontWeight: '700',
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
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: '700',
    },

    seeAll: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '600',
    },

    cards: {
      gap: 9,
      paddingBottom: 4,
    },

    card: {
      width: 112,
      minHeight: 182,
      padding: 7,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
    },

    cardPressed: {
      opacity: 0.84,
      transform: [{scale: 0.985}],
    },

    cardImage: {
      width: '100%',
      height: 78,
      borderRadius: 8,
    },

    cardTitle: {
      marginTop: 8,
      color: theme.colors.text,
      fontSize: 10.7,
      lineHeight: 14,
      fontWeight: '700',
    },

    cardMetaRow: {
      marginTop: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    cardMeta: {
      color: theme.colors.textSecondary,
      fontSize: 8.6,
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

    articleTitle: {
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
    },

    articleMeta: {
      marginTop: 5,
      color: theme.colors.textSecondary,
      fontSize: 8.8,
      lineHeight: 12,
    },

    rowBookmark: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },

    trust: {
      marginTop: 18,
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 11,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    shield: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },

    trustCopy: {
      flex: 1,
      paddingHorizontal: 11,
    },

    trustTitle: {
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: '700',
    },

    trustText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 9.5,
      lineHeight: 14,
    },
  });
}

export default FeaturedArticlesScreen;
