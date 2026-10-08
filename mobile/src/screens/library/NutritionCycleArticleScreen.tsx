import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
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
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';

const ID = 'nutrition-conception-fertilite';

const HERO = require('../../assets/images/library/nutrition-hero.png');

// Images/icons stay language-neutral — only TEXT moves into the bilingual
// CONTENT object below, keyed by index to stay aligned with these assets.
const FOOD_IMAGES = [
  require('../../assets/images/library/food-iron.png'),
  require('../../assets/images/library/food-magnesium.png'),
  require('../../assets/images/library/food-omega.png'),
  require('../../assets/images/library/food-protein.png'),
  require('../../assets/images/library/food-fibre.png'),
] as const;

const MEAL_IMAGES = [
  require('../../assets/images/library/meal-breakfast.png'),
  require('../../assets/images/library/meal-lunch.png'),
  require('../../assets/images/library/meal-snack.png'),
  require('../../assets/images/library/meal-dinner.png'),
] as const;

const PHASE_ICONS = ['water', 'flower', 'circle', 'leaf'] as const;

const LIMIT_ICONS = [
  'shaker-outline',
  'cupcake',
  'hamburger',
  'coffee-outline',
  'glass-cocktail',
] as const;

// PHASE 7L — bilingual editorial content. Article identity (ID, images,
// bookmark/progress keys, JSX structure) is untouched; only this object
// changes per language. The French text below is byte-identical to the
// original — never retyped, only moved into the `fr` key — so the app
// remains fully bilingual rather than having French replaced by English.
const CONTENT = {
  fr: {
    badge: 'CYCLE MENSTRUEL',
    titleLine1: 'Alimentation et cycle :',
    titleLine2: 'ce que ton corps aime',
    metaDuration: '4 min de lecture',
    metaType: 'Guide',
    metaLevel: 'Débutant',
    metaValidated: 'Contenu validé',
    intro:
      'Ton alimentation influence ton énergie, ton humeur, tes hormones et ton bien-être général tout au long de ton cycle.',
    contentsTitle: 'Dans cet article',
    topics: [
      'Les besoins nutritionnels selon les phases',
      'Les aliments à privilégier',
      'Les aliments à limiter',
      'Exemples de repas équilibrés',
    ],
    section1Body:
      'Ton corps n’a pas les mêmes besoins tout au long du cycle. Adapter ton alimentation peut faire une vraie différence.',
    phases: [
      {
        title: 'Phase menstruelle',
        days: 'Jours 1 à 5',
        body: 'Privilégie le fer, le magnésium et les vitamines B.',
      },
      {
        title: 'Phase folliculaire',
        days: 'Jours 6 à 14',
        body: 'Mise sur les protéines maigres et les légumes frais.',
      },
      {
        title: 'Phase ovulatoire',
        days: 'Autour du jour 14',
        body: 'Choisis antioxydants et oméga-3.',
      },
      {
        title: 'Phase lutéale',
        days: 'Jours 15 à 28',
        body: 'Soutiens ton système nerveux et limite l’inflammation.',
      },
    ],
    foods: [
      {title: 'Fer', body: 'Lentilles, épinards, viandes maigres, pois chiches.'},
      {title: 'Magnésium', body: 'Amandes, graines de courge, chocolat noir, banane.'},
      {title: 'Oméga-3', body: 'Saumon, sardines, noix, graines de lin.'},
      {title: 'Protéines', body: 'Œufs, tofu, volaille, yaourt grec, quinoa.'},
      {title: 'Fibres & antioxydants', body: 'Fruits rouges, avocat, brocolis, carottes.'},
    ],
    limits: [
      {title: 'Excès de sel'},
      {title: 'Produits sucrés'},
      {title: 'Ultra-transformés'},
      {title: 'Excès de caféine'},
      {title: 'Alcool'},
    ],
    limitText: 'À consommer avec modération pour préserver ton équilibre.',
    meals: [
      {tag: 'Petit-déjeuner', body: 'Porridge, fruits rouges, amandes et chia'},
      {tag: 'Déjeuner', body: 'Saumon, quinoa, brocoli vapeur et huile d’olive'},
      {tag: 'Collation', body: 'Yaourt nature, myrtilles et graines de lin'},
      {tag: 'Dîner', body: 'Soupe de lentilles, légumes rôtis et pain complet'},
    ],
    shareMessage: 'Alimentation et cycle : ce que ton corps aime — AWA',
  },
  en: {
    badge: 'MENSTRUAL CYCLE',
    titleLine1: 'Nutrition and your cycle:',
    titleLine2: 'what your body loves',
    metaDuration: '4 min read',
    metaType: 'Guide',
    metaLevel: 'Beginner',
    metaValidated: 'Reviewed content',
    intro:
      'Your diet influences your energy, your mood, your hormones, and your overall well-being throughout your cycle.',
    contentsTitle: 'In this article',
    topics: [
      'Nutritional needs by phase',
      'Foods to favor',
      'Foods to limit',
      'Examples of balanced meals',
    ],
    section1Body:
      'Your body doesn’t have the same needs throughout your cycle. Adjusting what you eat can make a real difference.',
    phases: [
      {
        title: 'Menstrual phase',
        days: 'Days 1 to 5',
        body: 'Favor iron, magnesium, and B vitamins.',
      },
      {
        title: 'Follicular phase',
        days: 'Days 6 to 14',
        body: 'Focus on lean protein and fresh vegetables.',
      },
      {
        title: 'Ovulatory phase',
        days: 'Around day 14',
        body: 'Choose antioxidants and omega-3s.',
      },
      {
        title: 'Luteal phase',
        days: 'Days 15 to 28',
        body: 'Support your nervous system and limit inflammation.',
      },
    ],
    foods: [
      {title: 'Iron', body: 'Lentils, spinach, lean meats, chickpeas.'},
      {title: 'Magnesium', body: 'Almonds, pumpkin seeds, dark chocolate, banana.'},
      {title: 'Omega-3', body: 'Salmon, sardines, walnuts, flaxseed.'},
      {title: 'Protein', body: 'Eggs, tofu, poultry, Greek yogurt, quinoa.'},
      {title: 'Fiber & antioxidants', body: 'Berries, avocado, broccoli, carrots.'},
    ],
    limits: [
      {title: 'Excess salt'},
      {title: 'Sugary foods'},
      {title: 'Ultra-processed foods'},
      {title: 'Excess caffeine'},
      {title: 'Alcohol'},
    ],
    limitText: 'Enjoy in moderation to help maintain your balance.',
    meals: [
      {tag: 'Breakfast', body: 'Porridge, berries, almonds, and chia'},
      {tag: 'Lunch', body: 'Salmon, quinoa, steamed broccoli, and olive oil'},
      {tag: 'Snack', body: 'Plain yogurt, blueberries, and flaxseed'},
      {tag: 'Dinner', body: 'Lentil soup, roasted vegetables, and whole-grain bread'},
    ],
    shareMessage: 'Nutrition and your cycle: what your body loves — AWA',
  },
  es: {
    badge: 'CICLO MENSTRUAL',
    titleLine1: 'Alimentación y ciclo:',
    titleLine2: 'lo que le gusta a tu cuerpo',
    metaDuration: '4 min de lectura',
    metaType: 'Guía',
    metaLevel: 'Principiante',
    metaValidated: 'Contenido validado',
    intro:
      'Tu alimentación influye en tu energía, tu estado de ánimo, tus hormonas y tu bienestar general a lo largo de todo tu ciclo.',
    contentsTitle: 'En este artículo',
    topics: [
      'Las necesidades nutricionales según la fase',
      'Los alimentos que debes priorizar',
      'Los alimentos que debes limitar',
      'Ejemplos de comidas equilibradas',
    ],
    section1Body:
      'Tu cuerpo no tiene las mismas necesidades a lo largo del ciclo. Adaptar tu alimentación puede marcar una verdadera diferencia.',
    phases: [
      {
        title: 'Fase menstrual',
        days: 'Días 1 a 5',
        body: 'Prioriza el hierro, el magnesio y las vitaminas del grupo B.',
      },
      {
        title: 'Fase folicular',
        days: 'Días 6 a 14',
        body: 'Apuesta por las proteínas magras y las verduras frescas.',
      },
      {
        title: 'Fase ovulatoria',
        days: 'Alrededor del día 14',
        body: 'Elige antioxidantes y omega-3.',
      },
      {
        title: 'Fase lútea',
        days: 'Días 15 a 28',
        body: 'Apoya tu sistema nervioso y limita la inflamación.',
      },
    ],
    foods: [
      {title: 'Hierro', body: 'Lentejas, espinacas, carnes magras, garbanzos.'},
      {title: 'Magnesio', body: 'Almendras, semillas de calabaza, chocolate negro, plátano.'},
      {title: 'Omega-3', body: 'Salmón, sardinas, nueces, semillas de lino.'},
      {title: 'Proteínas', body: 'Huevos, tofu, aves, yogur griego, quinoa.'},
      {title: 'Fibra y antioxidantes', body: 'Frutos rojos, aguacate, brócoli, zanahorias.'},
    ],
    limits: [
      {title: 'Exceso de sal'},
      {title: 'Productos azucarados'},
      {title: 'Ultraprocesados'},
      {title: 'Exceso de cafeína'},
      {title: 'Alcohol'},
    ],
    limitText: 'Consume con moderación para preservar tu equilibrio.',
    meals: [
      {tag: 'Desayuno', body: 'Porridge, frutos rojos, almendras y chía'},
      {tag: 'Almuerzo', body: 'Salmón, quinoa, brócoli al vapor y aceite de oliva'},
      {tag: 'Merienda', body: 'Yogur natural, arándanos y semillas de lino'},
      {tag: 'Cena', body: 'Sopa de lentejas, verduras asadas y pan integral'},
    ],
    shareMessage: 'Alimentación y ciclo: lo que le gusta a tu cuerpo — AWA',
  },
  it: {
    badge: 'CICLO MESTRUALE',
    titleLine1: 'Alimentazione e ciclo:',
    titleLine2: 'ciò che il tuo corpo ama',
    metaDuration: '4 min di lettura',
    metaType: 'Guida',
    metaLevel: 'Principiante',
    metaValidated: 'Contenuto validato',
    intro: 'La tua alimentazione influenza la tua energia, il tuo umore, i tuoi ormoni e il tuo benessere generale durante tutto il ciclo.',
    contentsTitle: 'In questo articolo',
    topics: [
      'Esigenze nutrizionali per fase',
      'Alimenti da privilegiare',
      'Alimenti da limitare',
      'Esempi di pasti equilibrati',
    ],
    section1Body: 'Il tuo corpo non ha le stesse esigenze durante tutto il ciclo. Adattare ciò che mangi può fare una vera differenza.',
    phases: [
      {
        title: 'Fase mestruale',
        days: 'Giorni da 1 a 5',
        body: 'Privilegia ferro, magnesio e vitamine del gruppo B.',
      },
      {
        title: 'Fase follicolare',
        days: 'Giorni da 6 a 14',
        body: 'Punta su proteine magre e verdure fresche.',
      },
      {
        title: 'Fase ovulatoria',
        days: 'Intorno al giorno 14',
        body: 'Scegli antiossidanti e omega-3.',
      },
      {
        title: 'Fase luteale',
        days: 'Giorni da 15 a 28',
        body: 'Sostieni il sistema nervoso e limita l’infiammazione.',
      },
    ],
    foods: [
      {
        title: 'Ferro',
        body: 'Lenticchie, spinaci, carni magre, ceci.',
      },
      {
        title: 'Magnesio',
        body: 'Mandorle, semi di zucca, cioccolato fondente, banana.',
      },
      {
        title: 'Omega-3',
        body: 'Salmone, sardine, noci, semi di lino.',
      },
      {
        title: 'Proteine',
        body: 'Uova, tofu, pollame, yogurt greco, quinoa.',
      },
      {
        title: 'Fibre e antiossidanti',
        body: 'Frutti di bosco, avocado, broccoli, carote.',
      },
    ],
    limits: [
      {
        title: 'Eccesso di sale',
      },
      {
        title: 'Alimenti zuccherati',
      },
      {
        title: 'Alimenti ultraprocessati',
      },
      {
        title: 'Eccesso di caffeina',
      },
      {
        title: 'Alcol',
      },
    ],
    limitText: 'Consumali con moderazione per aiutarti a mantenere il tuo equilibrio.',
    meals: [
      {
        tag: 'Colazione',
        body: 'Porridge, frutti di bosco, mandorle e semi di chia',
      },
      {
        tag: 'Pranzo',
        body: 'Salmone, quinoa, broccoli al vapore e olio d’oliva',
      },
      {
        tag: 'Spuntino',
        body: 'Yogurt naturale, mirtilli e semi di lino',
      },
      {
        tag: 'Cena',
        body: 'Zuppa di lenticchie, verdure arrosto e pane integrale',
      },
    ],
    shareMessage: 'Alimentazione e ciclo: ciò che il tuo corpo ama — AWA',
  },
} as const;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ArticleReader'
>;

export default function NutritionCycleArticleScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t, i18n} = useTranslation();
  const lang = resolveEditorialLanguage(i18n.language);
  const content = CONTENT[lang];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      message: content.shareMessage,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
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
              accessibilityLabel={t('library.reader.back')}
              onPress={() => navigation.goBack()}
              style={({pressed}) => [
                styles.circle,
                pressed && styles.pressed,
              ]}>
              <MaterialDesignIcons
                name="chevron-left"
                size={23}
                color={theme.colors.text}
              />
            </Pressable>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.bookmarkA11y')}
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
                  color={theme.colors.primary}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('libraryArticle.shareA11y')}
                onPress={handleShare}
                style={({pressed}) => [
                  styles.circle,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  name="share-variant-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.article}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {content.badge}
            </Text>
          </View>

          <Text style={styles.title}>
            {content.titleLine1}{`\n`}
            {content.titleLine2}
          </Text>

          {/* META COMME TA CAPTURE */}
          <View style={styles.metas}>
            <View style={styles.metaTopRow}>
              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="clock-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {content.metaDuration}
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="book-open-page-variant-outline"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {content.metaType}
                </Text>
              </View>

              <View style={styles.metaDivider} />

              <View style={styles.metaItem}>
                <MaterialDesignIcons
                  name="chart-bar"
                  size={19}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {content.metaLevel}
                </Text>
              </View>
            </View>

            <View style={styles.metaValidatedRow}>
              <MaterialDesignIcons
                name="shield-check-outline"
                size={19}
                color={theme.colors.textMuted}
              />
              <Text style={styles.metaText}>
                {content.metaValidated}
              </Text>
            </View>
          </View>

          <Text style={styles.intro}>
            {content.intro}
          </Text>

          <View style={styles.contents}>
            <Text style={styles.contentsTitle}>
              {content.contentsTitle}
            </Text>

            {content.topics.map((item, index) => (
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
                  color={theme.colors.primary}
                />
              </View>
            ))}
          </View>

          {/* SECTION 1 */}
          <Text style={styles.h2}>
            1. {content.topics[0]}
          </Text>

          <Text style={styles.body}>
            {content.section1Body}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.phases.map((phase, index) => (
              <View
                key={phase.title}
                style={styles.phase}>
                <View style={styles.phaseIcon}>
                  <MaterialDesignIcons
                    name={PHASE_ICONS[index] as never}
                    size={25}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.cardTitle}>
                  {phase.title}
                </Text>

                <Text style={styles.days}>
                  {phase.days}
                </Text>

                <Text style={styles.cardBody}>
                  {phase.body}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 2 */}
          <Text style={styles.h2}>
            2. {content.topics[1]}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.foods.map((food, index) => (
              <View key={food.title} style={styles.food}>
                <Image
                  source={FOOD_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.foodImage}
                />

                <Text style={styles.cardTitle}>
                  {food.title}
                </Text>

                <Text style={styles.cardBody}>
                  {food.body}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 3 */}
          <Text style={styles.h2}>
            3. {content.topics[2]}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.limits.map((limit, index) => (
              <View
                key={limit.title}
                style={styles.limit}>
                <View style={styles.limitIcon}>
                  <MaterialDesignIcons
                    name={LIMIT_ICONS[index] as never}
                    size={26}
                    color={theme.colors.primary}
                  />
                </View>

                <Text style={styles.cardTitle}>
                  {limit.title}
                </Text>

                <Text style={styles.limitText}>
                  {content.limitText}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* SECTION 4 */}
          <Text style={styles.h2}>
            4. {content.topics[3]}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {content.meals.map((meal, index) => (
              <View
                key={meal.tag}
                style={styles.meal}>
                <Image
                  source={MEAL_IMAGES[index]}
                  resizeMode="cover"
                  style={styles.mealImage}
                />

                <Text style={styles.mealTag}>
                  {meal.tag}
                </Text>

                <Text style={styles.mealText}>
                  {meal.body}
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

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  pressed: {
    opacity: 0.74,
  },

  article: {
    marginTop: -15,
    padding: 20,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: theme.colors.background,
  },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.primarySoft,
  },

  badgeText: {
    fontSize: 10.5,
    color: theme.colors.primary,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    fontFamily: 'serif',
    fontSize: 24, // avant 28
    lineHeight: 29,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.border,
  },

  metaValidatedRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  metaText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },

  intro: {
    marginTop: 17,
    fontSize: 13.5, // avant 15
    lineHeight: 20,
    color: theme.colors.text,
    fontWeight: '600',
  },

  contents: {
    marginTop: 19,
    padding: 14,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  contentsTitle: {
    marginBottom: 7,
    fontSize: 14,
    color: theme.colors.text,
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
    color: theme.colors.primary,
    fontSize: 11.5,
    fontWeight: '800',
  },

  contentText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.text,
  },

  h2: {
    marginTop: 24,
    fontFamily: 'serif',
    fontSize: 20, // avant 22
    lineHeight: 25,
    color: theme.colors.text,
    fontWeight: '700',
  },

  body: {
    marginTop: 8,
    fontSize: 13, // avant 14
    lineHeight: 20,
    color: theme.colors.text,
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
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },

  phaseIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  food: {
    width: 138,
    minHeight: 195,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },

  days: {
    marginTop: 4,
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },

  cardBody: {
    marginTop: 6,
    paddingHorizontal: 8,
    fontSize: 10.5, // avant 11.5
    lineHeight: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  limit: {
    width: 122,
    minHeight: 148,
    padding: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
  },

  limitIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },

  limitText: {
    marginTop: 7,
    color: theme.colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },

  meal: {
    width: 168,
    minHeight: 195,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.primary,
    color: onPrimaryTextColor(theme),
    fontSize: 9.5,
    fontWeight: '700',
  },

  mealText: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: 10.5,
    lineHeight: 15,
  },

  });
}
