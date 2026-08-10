import React, {useEffect, useRef, useState} from 'react';
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

const CREAM = '#FCF9F5';
const INK = '#30283A';
const PURPLE = '#765C89';
const BORDER = '#ECE5DF';

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

type Props = NativeStackScreenProps<RootStackParamList, 'FeaturedArticles'>;

const HERO_SLIDES = [
  {id: 'cycle-phases-expliquees', image: HERO, title: 'Comprendre les\nphases de ton cycle', summary: 'Découvre les phases de ton cycle et leur rôle dans ton équilibre hormonal.', minutes: 6},
  {id: 'pain-gerer-douleurs', image: COMFORT_HERO, title: 'Soulager les douleurs\nmenstruelles', summary: 'Des gestes doux et naturels pour apaiser les crampes et retrouver ton confort.', minutes: 7},
  {id: 'cycle-comprendre-ton-cycle', image: TRACKING_HERO, title: 'Mieux suivre\nton cycle', summary: 'Observe tes rythmes et apprends à reconnaître les signaux uniques de ton corps.', minutes: 6},
] as const;

const POPULAR = [
  {
    id: 'cycle-phases-expliquees',
    title: 'Les différentes\nphases du cycle\nexpliquées',
    minutes: 6,
    image: PHASES,
  },
  {
    id: 'flow-comprendre-flux',
    title: 'Comprendre les\nrègles : ce qui se\npasse vraiment',
    minutes: 6,
    image: BRANCH,
  },
  {
    id: 'nutrition-conception-fertilite',
    title: 'Alimentation\net cycle : ce que\nton corps aime',
    minutes: 4,
    image: FOOD,
  },
] as const;

const NEW_ARTICLES = [
  {
    id: 'pain-gerer-douleurs',
    title: 'Douleurs de règles : causes\net solutions naturelles',
    meta: '7 min de lecture  ·  Publié aujourd’hui',
    image: PAIN,
  },
  {
    id: 'cycle-comprendre-ton-cycle',
    title: 'Cycle régulier ou irrégulier :\nquelles différences ?',
    meta: '5 min de lecture  ·  Publié hier',
    image: TRACKER,
  },
  {
    id: 'symptoms-reconnaitre',
    title: 'Syndrome prémenstruel (SPM) :\nmieux le comprendre',
    meta: '4 min de lecture  ·  Publié il y a 2 jours',
    image: SPM,
  },
  {
    id: 'flow-colors-textures',
    title: 'Flux menstruel : comprendre\nles couleurs et textures',
    meta: '4 min de lecture  ·  Publié il y a 3 jours',
    image: FLOW,
  },
] as const;

function FeaturedArticlesScreen({navigation}: Props): React.JSX.Element {
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
        barStyle="dark-content"
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
              color={INK}
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
              color={PURPLE}
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
                    color="#5F585D"
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
                    color="#FFFFFF"
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
            <Pressable key={slide.id} hitSlop={8} onPress={() => setHeroIndex(index)} style={index === heroIndex ? styles.dotActive : styles.dot} />
          ))}
        </View>

        <View style={styles.heading}>
          <Text style={styles.headingText}>
            Articles populaires
          </Text>
          <Pressable hitSlop={10}>
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
                  color="#8B8487"
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
          <Pressable hitSlop={10}>
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
                color={PURPLE}
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
              color={PURPLE}
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
            color={INK}
            name="chevron-right"
            size={19}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
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
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    shadowColor: '#4D4148',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },

  headerButtonActive: {
    borderColor: '#D8CCE0',
    backgroundColor: '#F5EFF7',
  },

  pressed: {
    opacity: 0.72,
  },

  pageTitle: {
    color: INK,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
  },

  pageSubtitle: {
    marginTop: 2,
    color: '#817A7E',
    fontSize: 11.5,
    lineHeight: 15,
  },

  hero: {
    height: 244,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#EDE5DC',
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
    backgroundColor: '#E9E0ED',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  badgeText: {
    color: PURPLE,
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  heroTitle: {
    marginTop: 11,
    color: INK,
    fontFamily: 'serif',
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '700',
  },

  heroSummary: {
    marginTop: 9,
    color: '#514A50',
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
    borderColor: 'rgba(110,100,105,0.18)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 9,
  },

  timeText: {
    color: '#5F585D',
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
    backgroundColor: PURPLE,
    paddingHorizontal: 12,
  },

  readButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: PURPLE,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD5DF',
  },

  heading: {
    marginTop: 9,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headingText: {
    color: INK,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },

  seeAll: {
    color: PURPLE,
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
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#FBF7F2',
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
    color: INK,
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
    color: '#8B8487',
    fontSize: 8.6,
  },

  articleRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
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
    color: INK,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  articleMeta: {
    marginTop: 5,
    color: '#8B8487',
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
    backgroundColor: '#F5F0ED',
  },

  shield: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE5F2',
  },

  trustCopy: {
    flex: 1,
    paddingHorizontal: 11,
  },

  trustTitle: {
    color: INK,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },

  trustText: {
    marginTop: 4,
    color: '#716A6F',
    fontSize: 9.5,
    lineHeight: 14,
  },
});

export default FeaturedArticlesScreen;
