import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import ReadingControls from '../../components/articles/ReadingControls';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import {getBottomPadding, getTopPadding, READING_CONTROLS_SPACE} from '../../theme/spacing';

const ID = 'nutrition-conception-fertilite';

const CREAM = '#FCF9F5';
const INK = '#30283A';
const PURPLE = '#765C89';
const BORDER = '#E9E1DE';

const HERO = require('../../assets/images/library/nutrition-hero.png');

const FOODS = [
  [
    'Fer',
    'Lentilles, épinards, viandes maigres, pois chiches.',
    require('../../assets/images/library/food-iron.png'),
  ],
  [
    'Magnésium',
    'Amandes, graines de courge, chocolat noir, banane.',
    require('../../assets/images/library/food-magnesium.png'),
  ],
  [
    'Oméga-3',
    'Saumon, sardines, noix, graines de lin.',
    require('../../assets/images/library/food-omega.png'),
  ],
  [
    'Protéines',
    'Œufs, tofu, volaille, yaourt grec, quinoa.',
    require('../../assets/images/library/food-protein.png'),
  ],
  [
    'Fibres & antioxydants',
    'Fruits rouges, avocat, brocolis, carottes.',
    require('../../assets/images/library/food-fibre.png'),
  ],
] as const;

const MEALS = [
  [
    'Petit-déjeuner',
    'Porridge, fruits rouges, amandes et chia',
    require('../../assets/images/library/meal-breakfast.png'),
  ],
  [
    'Déjeuner',
    'Saumon, quinoa, brocoli vapeur et huile d’olive',
    require('../../assets/images/library/meal-lunch.png'),
  ],
  [
    'Collation',
    'Yaourt nature, myrtilles et graines de lin',
    require('../../assets/images/library/meal-snack.png'),
  ],
  [
    'Dîner',
    'Soupe de lentilles, légumes rôtis et pain complet',
    require('../../assets/images/library/meal-dinner.png'),
  ],
] as const;

const PHASES = [
  [
    'water',
    'Phase menstruelle',
    'Jours 1 à 5',
    'Privilégie le fer, le magnésium et les vitamines B.',
  ],
  [
    'flower',
    'Phase folliculaire',
    'Jours 6 à 14',
    'Mise sur les protéines maigres et les légumes frais.',
  ],
  [
    'circle',
    'Phase ovulatoire',
    'Autour du jour 14',
    'Choisis antioxydants et oméga-3.',
  ],
  [
    'leaf',
    'Phase lutéale',
    'Jours 15 à 28',
    'Soutiens ton système nerveux et limite l’inflammation.',
  ],
] as const;

const LIMITS = [
  ['shaker-outline', 'Excès de sel'],
  ['cupcake', 'Produits sucrés'],
  ['hamburger', 'Ultra-transformés'],
  ['coffee-outline', 'Excès de caféine'],
  ['glass-cocktail', 'Alcool'],
] as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function NutritionCycleArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(() => {
      if (mounted) {
        setSaved(isArticleBookmarked(ID));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBookmark = () => {
    setSaved(toggleBookmark(ID));
  };

  const handleShare = () => {
    Share.share({
      message:
        'Alimentation et cycle : ce que ton corps aime — HAWA',
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ScrollView
        ref={scrollRef}
        onScroll={event =>
          saveScrollPosition(
            ID,
            event.nativeEvent.contentOffset.y,
          )
        }
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: getBottomPadding(
              insets.bottom,
              READING_CONTROLS_SPACE,
            ),
          },
        ]}>
        <View style={styles.heroWrap}>
          <Image
            source={HERO}
            resizeMode="cover"
            style={styles.hero}
          />

          <View
            style={[
              styles.top,
              {
                paddingTop: getTopPadding(insets.top, true),
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={INK}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Favori"
                onPress={handleBookmark}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name={
                    saved
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                  color={PURPLE}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Partager"
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={PURPLE}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              CYCLE MENSTRUEL
            </Text>
          </View>

          <Text style={styles.title}>
            Alimentation et cycle :{`\n`}
            ce que ton corps aime
          </Text>

          {/* META COMME TA CAPTURE */}
          <View style={styles.metas}>
            <View style={styles.metaTopRow}>
              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="clock-outline"
                  size={19}
                  color="#817A86"
                />
                <Text style={styles.metaText}>
                  4 min de lecture
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="book-open-page-variant-outline"
                  size={19}
                  color="#817A86"
                />
                <Text style={styles.metaText}>
                  Guide
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="chart-bar"
                  size={19}
                  color="#817A86"
                />
                <Text style={styles.metaText}>
                  Débutant
                </Text>
              </View>
            </View>

            <View style={styles.metaValidatedRow}>
              <MaterialDesignIcons
                name="shield-check-outline"
                size={19}
                color="#817A86"
              />
              <Text style={styles.metaText}>
                Contenu validé
              </Text>
            </View>
          </View>

          <Text style={styles.intro}>
            Ton alimentation influence ton énergie,
            ton humeur, tes hormones et ton bien-être
            général tout au long de ton cycle.
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              Dans cet article
            </Text>

            {[
              'Les besoins nutritionnels selon les phases',
              'Les aliments à privilégier',
              'Les aliments à limiter',
              'Exemples de repas équilibrés',
            ].map((item, index) => (
              <View
                key={item}
                style={styles.contentRow}>
                <View style={styles.contentLeft}>
                  <Text style={styles.contentNumber}>
                    {index + 1}.
                  </Text>

                  <Text style={styles.contentText}>
                    {item}
                  </Text>
                </View>

                <MaterialDesignIcons
                  name="chevron-right"
                  size={17}
                  color={PURPLE}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}
          <Text style={styles.h2}>
            1. Les besoins nutritionnels selon les phases
          </Text>

          <Text style={styles.body}>
            Ton corps n’a pas les mêmes besoins tout
            au long du cycle. Adapter ton alimentation
            peut faire une vraie différence.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {PHASES.map(([icon, title, days, body]) => (
              <View
                key={title}
                style={styles.phase}>
                <View style={styles.phaseIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={25}
                    color={PURPLE}
                  />
                </View>

                <Text style={styles.cardTitle}>
                  {title}
                </Text>

                <Text style={styles.days}>
                  {days}
                </Text>

                <Text style={styles.cardBody}>
                  {body}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. Les aliments à privilégier
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {FOODS.map(([title, body, image]) => (
              <View key={title} style={styles.food}>
                <Image
                  source={image}
                  resizeMode="cover"
                  style={styles.foodImage}
                />

                <Text style={styles.cardTitle}>
                  {title}
                </Text>

                <Text style={styles.cardBody}>
                  {body}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. Les aliments à limiter
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {LIMITS.map(([icon, title]) => (
              <View
                key={title}
                style={styles.limit}>
                <View style={styles.limitIcon}>
                  <MaterialDesignIcons
                    name={icon as never}
                    size={26}
                    color="#B87C99"
                  />
                </View>

                <Text style={styles.cardTitle}>
                  {title}
                </Text>

                <Text style={styles.limitText}>
                  À consommer avec modération pour
                  préserver ton équilibre.
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. Exemples de repas équilibrés
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {MEALS.map(([tag, body, image]) => (
              <View
                key={tag}
                style={styles.meal}>
                <Image
                  source={image}
                  resizeMode="cover"
                  style={styles.mealImage}
                />

                <Text style={styles.mealTag}>
                  {tag}
                </Text>

                <Text style={styles.mealText}>
                  {body}
                </Text>
              </View>
            ))}
          </ScrollView>

        </View>
      </ScrollView>

      <ReadingControls
        articleId={ID}
        durationMinutes={4}
        scrollRef={scrollRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  scroll: {
    paddingBottom: 28,
  },

  heroWrap: {
    height: 255,
  },

  hero: {
    width: '100%',
    height: '100%',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
  },

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 1,
    borderColor: '#EAE3DE',
  },

  pressed: {
    opacity: 0.74,
  },

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: CREAM,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#E9DFF0',
  },

  badgeText: {
    fontSize: 10.5,
    color: PURPLE,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 24, // avant 28
    lineHeight: 29,
    color: INK,
    fontWeight: '700',
  },

  metas: {
    marginTop: 15,
  },

  metaTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 11,
    backgroundColor: '#DDD5DA',
  },

  metaValidatedRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    color: '#777078',
    fontSize: 11,
  },

  intro: {
    marginTop: 17,
    fontSize: 13.5, // avant 15
    lineHeight: 20,
    color: '#45404A',
    fontWeight: '600',
  },

  contents: {
    marginTop: 19,
    padding: 14,
    borderRadius: 13,
    backgroundColor: '#F7F2F4',
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 14,
    color: INK,
    fontWeight: '800',
  },

  contentRow: {
    minHeight: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  contentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentNumber: {
    width: 23,
    color: PURPLE,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: INK,
  },

  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 20, // avant 22
    lineHeight: 25,
    color: INK,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 13, // avant 14
    lineHeight: 20,
    color: '#4B454C',
  },

  row: {
    gap: 9,
    paddingTop: 13,
    paddingBottom: 3,
  },

  phase: {
    width: 145,
    minHeight: 198,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#FFFDFC',
  },

  phaseIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EAF3',
  },

  food: {
    width: 138,
    minHeight: 195,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#FFFDFC',
  },

  foodImage: {
    width: '100%',
    height: 88,
  },

  cardTitle: {
    marginTop: 8,
    paddingHorizontal: 7,
    fontSize: 12, // avant 13
    lineHeight: 16,
    color: INK,
    fontWeight: '800',
    textAlign: 'center',
  },

  days: {
    marginTop: 4,
    fontSize: 9.5,
    color: '#777078',
  },

  cardBody: {
    marginTop: 6,
    paddingHorizontal: 8,
    fontSize: 10.5, // avant 11.5
    lineHeight: 15,
    color: '#4E4750',
    textAlign: 'center',
  },

  limit: {
    width: 122,
    minHeight: 148,
    padding: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#FFFDFC',
  },

  limitIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7EEF3',
  },

  limitText: {
    marginTop: 7,
    color: '#5F575D',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  meal: {
    width: 168,
    minHeight: 195,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    backgroundColor: '#FFFDFC',
  },

  mealImage: {
    width: '100%',
    height: 105,
  },

  mealTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: PURPLE,
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },

  mealText: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: INK,
    fontSize: 10.5,
    lineHeight: 15,
  },

});
