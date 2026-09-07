import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  LIBRARY_ARTICLES,
  type LibraryArticle,
  type LibraryCategoryId,
} from '../data/libraryContent';
import {
  getSelectedObjective,
  getSpiritualMarkersEnabled,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {
  getLibraryConfigForObjective,
  OBJECTIVE_LABELS,
  type LibraryGroupId,
} from '../data/libraryObjectiveConfig';
import {
  getCachedLibraryState,
  loadLibraryState,
  subscribeLibraryState,
  toggleBookmark,
} from '../state/libraryStore';
import {
  getBottomPadding,
  getTopPadding,
} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  interpolateHex,
  onPrimaryTextColor,
  pickReadableTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';

const ART = {
  cycle: require('../assets/images/library/cycle.png'),
  fertility: require('../assets/images/library/fertilité.png'),
  pregnancy: require('../assets/images/library/pregnancy.png'),
  hormonal: require('../assets/images/library/contraception.png'),

  // Image dédiée à la catégorie SOPK
  sopk: require('../assets/images/library/sopk1.png'),

  lifestyle: require('../assets/images/library/ménopause.png'),
  spiritual: require('../assets/images/library/priere.png'),
  featured: require('../assets/images/library/featured-cycle.png'),
  phases: require('../assets/images/library/popular-phases.png'),

  // Image dédiée aux premières règles
  flower: require('../assets/images/library/premier_regle.png'),

  // Image dédiée à la catégorie après une fausse couche
  miscarriage: require('../assets/images/library/apres_fausse.png'),

  // Image dédiée à la catégorie post-partum
  postpartum: require('../assets/images/library/post_partum.png'),

  nutrition: require('../assets/images/library/popular-nutrition.png'),
  flow: require('../assets/images/library/rules-hero.png'),
  pain: require('../assets/images/library/pain-hero.png'),
  symptoms: require('../assets/images/library/spm-hero.png'),
  cervicalMucus: require('../assets/images/library/flow-texture-mucus.png'),
  exercise: require('../assets/images/library/sopk1.png'),
  sleep: require('../assets/images/library/tip-sleep.png'),
  emotional: require('../assets/images/library/apres_fausse.png'),
  balance: require('../assets/images/library/regular-cycle-balance.png'),
  calendar: require('../assets/images/library/pregnancy.png'),
} satisfies Record<string, ImageSourcePropType>;

// Thumbnail shown for an article outside "À la une"
const getArticleThumbnail = (
  categoryId: LibraryCategoryId,
): ImageSourcePropType => {
  switch (categoryId) {
    case 'cycle':
      return ART.phases;

    case 'nutrition':
      return ART.nutrition;

    case 'flow':
      return ART.flow;

    case 'pain':
      return ART.pain;

    case 'symptoms':
      return ART.symptoms;

    case 'cervicalMucus':
      return ART.cervicalMucus;

    case 'fertility':
    case 'ovulation':
    case 'basalTemperature':
    case 'lhTests':
    case 'conceptionTips':
      return ART.fertility;

    case 'birthControlPills':
    case 'patch':
    case 'ring':
    case 'hormonalTreatments':
    case 'missedPills':
    case 'sideEffects':
      return ART.hormonal;

    case 'pcos':
    case 'hormones':
    case 'acne':
      return ART.sopk;

    case 'weight':
      return ART.balance;

    case 'exercise':
      return ART.exercise;

    case 'sleep':
      return ART.sleep;

    case 'emotionalHealth':
      return ART.postpartum;

    case 'pregnancyWeekly':
    case 'babyDevelopment':
    case 'childbirthPrep':
      return ART.pregnancy;

    case 'medicalExams':
      return ART.calendar;

    case 'postpartumRecovery':
    case 'lochia':
    case 'nifas':
    case 'breastfeeding':
      return ART.postpartum;

    case 'menopause':
    case 'hotFlashes':
    case 'bones':
    case 'treatments':
      return ART.lifestyle;

    case 'mood':
    case 'hydration':
      return ART.cycle;

    case 'physicalRecoveryLoss':
    case 'emotionalRecoveryLoss':
    case 'fertilityAfterLoss':
      return ART.miscarriage;

    case 'firstPeriod':
      return ART.flower;

    case 'fiqhWomen':
    case 'menstruationPurity':
    case 'istihada':
    case 'nifasFiqh':
    case 'ramadan':
    case 'fastingQadaa':
    case 'prayerDuringMenstruation':
    case 'returningToPrayer':
    case 'religiousFaq':
      return ART.spiritual;

    default:
      return ART.flower;
  }
};

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Library'
>;

type TabId =
  | 'all'
  | 'medical'
  | 'religious'
  | 'featured';

const TABS: {
  id: TabId;
  label: string;
  icon: string;
}[] = [
  {
    id: 'all',
    label: 'Tout',
    icon: 'view-grid-outline',
  },
  {
    id: 'medical',
    label: 'Médical',
    icon: 'medical-bag',
  },
  {
    id: 'religious',
    label: 'Religieux',
    icon: 'moon-waning-crescent',
  },
  {
    id: 'featured',
    label: 'À la une',
    icon: 'star-outline',
  },
];

type CategoryCard = {
  id: LibraryGroupId | 'spiritual';
  label: string;
  count: number;
  image: ImageSourcePropType;
  articleCategoryIds: LibraryCategoryId[];
  contentType: 'medical' | 'religious';
};

// Number of articles actually belonging to a browse tile, computed from
// LIBRARY_ARTICLES so the Library UI never drifts from the real data.
const countArticlesForCategoryIds = (ids: LibraryCategoryId[]): number =>
  LIBRARY_ARTICLES.filter(article => ids.includes(article.categoryId)).length;

const CATEGORY_DEFINITIONS: Omit<CategoryCard, 'count'>[] = [
  {
    id: 'firstPeriod',
    label: 'Premières règles',

    // On conserve premier_regle.png pour cette catégorie
    image: ART.flower,

    articleCategoryIds: ['firstPeriod'],
    contentType: 'medical',
  },
  {
    id: 'cycle',
    label: 'Cycle menstruel',
    image: ART.cycle,
    articleCategoryIds: [
      'cycle',
      'flow',
      'symptoms',
      'pain',
      'hydration',
      'sleep',
      'mood',
    ],
    contentType: 'medical',
  },
  {
    id: 'fertility',
    label: 'Fertilité &\nconception',
    image: ART.fertility,
    articleCategoryIds: [
      'fertility',
      'ovulation',
      'conceptionTips',
      'basalTemperature',
      'cervicalMucus',
      'lhTests',
      'nutrition',
    ],
    contentType: 'medical',
  },
  {
    id: 'contraception',
    label: 'Contraception',
    image: ART.hormonal,
    articleCategoryIds: [
      'birthControlPills',
      'patch',
      'ring',
      'hormonalTreatments',
      'missedPills',
      'sideEffects',
    ],
    contentType: 'medical',
  },
  {
    id: 'pregnancy',
    label: 'Grossesse',
    image: ART.pregnancy,
    articleCategoryIds: [
      'pregnancyWeekly',
      'babyDevelopment',
      'medicalExams',
      'childbirthPrep',
    ],
    contentType: 'medical',
  },
  {
    id: 'postpartum',
    label: 'Post-partum',
    image: ART.postpartum,
    articleCategoryIds: [
      'postpartumRecovery',
      'lochia',
      'nifas',
      'breastfeeding',
      'emotionalHealth',
    ],
    contentType: 'medical',
  },
  {
    id: 'loss',
    label: 'Après une\nfausse couche',

    // Nouvelle image dédiée à "Après une fausse couche"
    image: ART.miscarriage,

    articleCategoryIds: [
      'physicalRecoveryLoss',
      'emotionalRecoveryLoss',
      'fertilityAfterLoss',
    ],
    contentType: 'medical',
  },
  {
    id: 'pcos',
    label: 'SOPK',
    image: ART.sopk,
    articleCategoryIds: [
      'pcos',
      'hormones',
      'acne',
      'weight',
      'exercise',
    ],
    contentType: 'medical',
  },
  {
    id: 'menopause',
    label: 'Périménopause &\nMénopause',
    image: ART.lifestyle,
    articleCategoryIds: [
      'menopause',
      'hotFlashes',
      'bones',
      'treatments',
    ],
    contentType: 'medical',
  },
  {
    id: 'spiritual',
    label: 'Cycle & pratique\nreligieuse',
    image: ART.spiritual,
    articleCategoryIds: [
      'fiqhWomen',
      'menstruationPurity',
      'istihada',
      'nifasFiqh',
      'ramadan',
      'fastingQadaa',
      'prayerDuringMenstruation',
      'returningToPrayer',
      'religiousFaq',
    ],
    contentType: 'religious',
  },
];

const CATEGORIES: CategoryCard[] = CATEGORY_DEFINITIONS.map(category => ({
  ...category,
  count: countArticlesForCategoryIds(category.articleCategoryIds),
}));

const POPULAR = [
  {
    id: 'cycle-phases-expliquees',
    title:
      'Les différentes phases du cycle',
    image: require('../assets/images/library/cycle-phases-hero.png'),
    duration: 6,
  },
  {
    id: 'flow-comprendre-flux',
    title:
      'Comprendre ton flux menstruel',
    image: ART.flow,
    duration: 5,
  },
  {
    id: 'nutrition-conception-fertilite',
    title:
      'Nutrition et fertilité',
    image: ART.nutrition,
    duration: 4,
  },
];

function SectionTitle({
  title,
  action,
  onPress,
  styles,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {action ? (
        <Pressable
          accessibilityLabel={`${action} : ${title}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={onPress}>
          <Text style={styles.sectionAction}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LibraryScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const insets = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView>(null);

  const tabProgress = useRef(
    new Animated.Value(0),
  ).current;

  const objectiveFade = useRef(
    new Animated.Value(1),
  ).current;

  const [tabsWidth, setTabsWidth] = useState(0);

  const [objective, setObjective] =
    useState<ObjectiveId>(
      () => getSelectedObjective(),
    );

  const [spiritualEnabled, setSpiritualEnabled] =
    useState(() =>
      getSpiritualMarkersEnabled(),
    );

  const [activeTab, setActiveTab] =
    useState<TabId>('all');

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryCard | null>(null);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [search, setSearch] = useState('');

  const [showAll, setShowAll] = useState(false);

  const [bookmarks, setBookmarks] =
    useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      setObjective(getSelectedObjective());

      setSpiritualEnabled(
        getSpiritualMarkersEnabled(),
      );
    }, []),
  );

  useEffect(() => {
    const index = TABS.findIndex(
      tab => tab.id === activeTab,
    );

    Animated.timing(tabProgress, {
      toValue: Math.max(index, 0),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabProgress]);

  useEffect(() => {
    objectiveFade.setValue(0);

    Animated.timing(objectiveFade, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [objective, objectiveFade]);

  useEffect(() => {
    let mounted = true;

    loadLibraryState().then(state => {
      if (mounted) {
        setBookmarks(
          new Set(state.bookmarks),
        );
      }
    });

    const unsubscribe =
      subscribeLibraryState(() => {
        setBookmarks(
          new Set(
            getCachedLibraryState().bookmarks,
          ),
        );
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const articleById = useMemo(
    () =>
      new Map(
        LIBRARY_ARTICLES.map(article => [
          article.id,
          article,
        ]),
      ),
    [],
  );

  const libraryConfig = useMemo(
    () =>
      getLibraryConfigForObjective(
        objective,
      ),
    [objective],
  );

  const recommendedArticles = useMemo(
    () =>
      libraryConfig.recommendedArticleIds
        .map(id => articleById.get(id))
        .filter(
          (
            article,
          ): article is LibraryArticle =>
            Boolean(article),
        ),
    [articleById, libraryConfig],
  );

  const featuredArticle =
    articleById.get(
      libraryConfig.featuredArticleId,
    ) ?? recommendedArticles[0];

  const objectiveArticles = useMemo(() => {
    const priority = new Map(
      libraryConfig.recommendedArticleIds.map(
        (id, index) => [id, index],
      ),
    );

    return [...LIBRARY_ARTICLES].sort(
      (a, b) =>
        (priority.get(a.id) ?? 999) -
        (priority.get(b.id) ?? 999),
    );
  }, [libraryConfig]);

  const filteredArticles = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase('fr');

    return objectiveArticles.filter(
      article => {
        const religious =
          CATEGORIES.find(
            category =>
              category.id === 'spiritual',
          )!.articleCategoryIds.includes(
            article.categoryId,
          );

        if (
          religious &&
          activeTab !== 'religious'
        ) {
          return false;
        }

        if (
          religious &&
          !spiritualEnabled
        ) {
          return false;
        }

        if (
          activeTab === 'medical' &&
          religious
        ) {
          return false;
        }

        if (
          activeTab === 'religious' &&
          !religious
        ) {
          return false;
        }

        if (
          activeTab === 'featured' &&
          article.id !==
            'cycle-phases-expliquees'
        ) {
          return false;
        }

        if (
          selectedCategory &&
          !selectedCategory.articleCategoryIds.includes(
            article.categoryId,
          )
        ) {
          return false;
        }

        return (
          !query ||
          `${article.title} ${article.summary} ${article.tags.join(
            ' ',
          )}`
            .toLocaleLowerCase('fr')
            .includes(query)
        );
      },
    );
  }, [
    activeTab,
    objectiveArticles,
    search,
    selectedCategory,
    spiritualEnabled,
  ]);

  const orderedCategories = useMemo(() => {
    const byId = new Map(
      CATEGORIES.map(category => [
        category.id,
        category,
      ]),
    );

    const medical =
      libraryConfig.categoryOrder
        .map(id => byId.get(id)!)
        .filter(Boolean);

    return spiritualEnabled
      ? [
          ...medical,
          byId.get('spiritual')!,
        ]
      : medical;
  }, [
    libraryConfig,
    spiritualEnabled,
  ]);

  const visibleCategories =
    orderedCategories.filter(
      category => {
        if (activeTab === 'medical') {
          return (
            category.contentType === 'medical'
          );
        }

        if (activeTab === 'religious') {
          return (
            category.contentType ===
            'religious'
          );
        }

        return true;
      },
    );

  const openArticle = (id: string) =>
    navigation.navigate('ArticleReader', {
      articleId: id,
    });

  const toggleSaved = (id: string) => {
    toggleBookmark(id);

    setBookmarks(
      new Set(
        getCachedLibraryState().bookmarks,
      ),
    );
  };

  const chooseCategory = (
    category: CategoryCard,
  ) => {
    setSelectedCategory(category);

    setActiveTab(
      category.contentType === 'religious'
        ? 'religious'
        : 'medical',
    );

    setShowAll(true);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({
        animated: true,
      });
    });
  };

  const chooseTab = (tab: TabId) => {
    if (tab === 'featured') {
      navigation.navigate(
        'FeaturedArticles',
      );
      return;
    }

    if (
      tab === 'religious' &&
      !spiritualEnabled
    ) {
      return;
    }

    setActiveTab(tab);
    setSelectedCategory(null);
    setShowAll(tab === 'religious');
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getTopPadding(
              insets.top,
              true,
            ),
            paddingBottom: getBottomPadding(
              insets.bottom,
            ),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() =>
              navigation.goBack()
            }
            style={styles.backButton}>
            <MaterialDesignIcons
              color={theme.colors.text}
              name="chevron-left"
              size={25}
            />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.title}>
              Bibliothèque
            </Text>

            <Text style={styles.subtitle}>
              Des contenus fiables pour{`\n`}
              mieux comprendre ton corps,{`\n`}
              ta santé et ta foi.
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Rechercher"
            onPress={() =>
              setSearchOpen(value => !value)
            }
            style={styles.searchButton}>
            <MaterialDesignIcons
              color={theme.colors.text}
              name={
                searchOpen
                  ? 'close'
                  : 'magnify'
              }
              size={23}
            />
          </Pressable>
        </View>

        {searchOpen ? (
          <View style={styles.searchField}>
            <MaterialDesignIcons
              color={theme.colors.textMuted}
              name="magnify"
              size={19}
            />

            <TextInput
              autoFocus
              onChangeText={setSearch}
              placeholder="Rechercher un article…"
              placeholderTextColor={theme.colors.textMuted}
              style={styles.searchInput}
              value={search}
            />
          </View>
        ) : null}

        <View
          onLayout={event =>
            setTabsWidth(
              event.nativeEvent.layout.width,
            )
          }
          style={styles.tabs}>
          {tabsWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.tabIndicator,
                {
                  width:
                    (tabsWidth - 6) /
                    TABS.length,

                  transform: [
                    {
                      translateX:
                        tabProgress.interpolate(
                          {
                            inputRange: [
                              0,
                              1,
                              2,
                              3,
                            ],
                            outputRange: [
                              0,
                              (tabsWidth - 6) /
                                4,
                              ((tabsWidth - 6) /
                                4) *
                                2,
                              ((tabsWidth - 6) /
                                4) *
                                3,
                            ],
                          },
                        ),
                    },
                  ],
                },
              ]}
            />
          ) : null}

          {TABS.map(tab => {
            const active =
              activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{
                  selected: active,
                }}
                onPress={() =>
                  chooseTab(tab.id)
                }
                style={({pressed}) => [
                  styles.tab,
                  pressed &&
                    styles.tabPressed,
                ]}>
                <MaterialDesignIcons
                  name={tab.icon as any}
                  size={14}
                  color={
                    active
                      ? onPrimaryTextColor(theme)
                      : theme.colors.textSecondary
                  }
                />

                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabText,
                    active &&
                      styles.activeTabText,
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle
          title="Catégories"
          action="Voir tout"
          onPress={() => {
            setActiveTab('all');
            setSelectedCategory(null);
            setShowAll(true);
          }}
          styles={styles}
        />

        <Animated.View
          style={[
            styles.categoryGrid,
            {
              opacity: objectiveFade,
            },
          ]}>
          {visibleCategories.map(
            category => {
              const selected =
                selectedCategory?.id ===
                category.id;

              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected,
                  }}
                  onPress={() =>
                    chooseCategory(
                      category,
                    )
                  }
                  style={({pressed}) => [
                    styles.categoryCard,
                    selected &&
                      styles.categoryCardActive,
                    pressed &&
                      styles.categoryCardPressed,
                  ]}>
                  <View
                    style={[
                      styles.categoryAccent,
                      selected &&
                        styles.categoryAccentActive,
                    ]}
                  />

                  <View
                    style={
                      styles.categoryTopRow
                    }>
                    <View
                      style={[
                        styles.categoryImageWrap,
                        selected &&
                          styles.categoryImageWrapActive,
                      ]}>
                      <Image
                        source={
                          category.image
                        }
                        resizeMode="cover"
                        style={
                          styles.categoryImage
                        }
                      />
                    </View>

                    <View
                      style={[
                        styles.categoryCountPill,
                        selected &&
                          styles.categoryCountPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.categoryCountPillText,
                          selected &&
                            styles.categoryCountPillTextActive,
                        ]}>
                        {category.count}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.categoryTextBlock
                    }>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.categoryLabel,
                        selected &&
                          styles.categoryLabelActive,
                      ]}>
                      {category.label.replace(
                        '\n',
                        ' ',
                      )}
                    </Text>

                    <View
                      style={
                        styles.categoryMetaRow
                      }>
                      <Text
                        style={[
                          styles.categoryCount,
                          selected &&
                            styles.categoryCountActive,
                        ]}>
                        articles
                      </Text>

                      <MaterialDesignIcons
                        name="chevron-right"
                        size={13}
                        color={
                          selected
                            ? theme.colors.primary
                            : theme.colors.textSecondary
                        }
                      />
                    </View>
                  </View>
                </Pressable>
              );
            },
          )}
        </Animated.View>

        {activeTab !== 'religious' ? (
          <>
            <SectionTitle
              title="Recommandé pour toi"
              styles={styles}
            />

            <Text
              style={
                styles.objectiveLabel
              }>
              Objectif actuel :{' '}
              {OBJECTIVE_LABELS[
                objective
              ]}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.recommendedRow
              }>
              {recommendedArticles.map(
                article => (
                  <Pressable
                    key={article.id}
                    onPress={() =>
                      openArticle(
                        article.id,
                      )
                    }
                    style={
                      styles.recommendedCard
                    }>
                    <Image
                      source={getArticleThumbnail(
                        article.categoryId,
                      )}
                      style={
                        styles.recommendedImage
                      }
                    />

                    <Text
                      numberOfLines={3}
                      style={
                        styles.recommendedTitle
                      }>
                      {article.title}
                    </Text>

                    <Text
                      style={
                        styles.recommendedMeta
                      }>
                      {
                        article.durationMinutes
                      }{' '}
                      min
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>

            <SectionTitle
              title="À la une"
              styles={styles}
            />

            <Pressable
              onPress={() =>
                featuredArticle &&
                openArticle(
                  featuredArticle.id,
                )
              }
              style={
                styles.featuredCard
              }>
              <ImageBackground
                source={ART.featured}
                imageStyle={
                  styles.featuredImage
                }
                style={
                  styles.featuredBackground
                }>
                <View
                  style={
                    styles.featuredCopy
                  }>
                  <View
                    style={styles.badge}>
                    <Text
                      style={
                        styles.badgeText
                      }>
                      MÉDICAL
                    </Text>
                  </View>

                  <Text
                    numberOfLines={3}
                    style={
                      styles.featuredTitle
                    }>
                    {featuredArticle?.title}
                  </Text>

                  <View
                    style={
                      styles.durationRow
                    }>
                    <MaterialDesignIcons
                      color={styles.durationText.color}
                      name="clock-outline"
                      size={13}
                    />

                    <Text
                      style={
                        styles.durationText
                      }>
                      {featuredArticle?.durationMinutes ??
                        6}{' '}
                      min de lecture
                    </Text>
                  </View>

                  <View
                    style={
                      styles.readRow
                    }>
                    <Text
                      style={
                        styles.readText
                      }>
                      Lire l'article
                    </Text>

                    <MaterialDesignIcons
                      color={styles.readText.color}
                      name="arrow-right"
                      size={16}
                    />
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          </>
        ) : null}

        <SectionTitle
          title={
            selectedCategory?.label.replace(
              '\n',
              ' ',
            ) ??
            (activeTab === 'religious'
              ? 'Repères spirituels'
              : 'Articles populaires')
          }
          action="Voir tout"
          onPress={() =>
            setShowAll(true)
          }
          styles={styles}
        />

        {activeTab === 'religious' ? (
          <View style={styles.infoBox}>
            <MaterialDesignIcons
              color={theme.colors.warning}
              name="information-outline"
              size={17}
            />

            <Text
              style={styles.infoText}>
              Contenu éducatif. Pour une
              décision religieuse personnelle,
              consulte une personne qualifiée.
            </Text>
          </View>
        ) : null}

        {(search.trim() ||
          selectedCategory ||
          showAll ||
          activeTab === 'religious'
          ? filteredArticles
              .slice(
                0,
                showAll ? 12 : 3,
              )
              .map(article => ({
                article,
                image:
                  getArticleThumbnail(
                    article.categoryId,
                  ),
              }))
          : POPULAR.map(item => ({
              article:
                articleById.get(
                  item.id,
                ),
              image: item.image,
              title: item.title,
              duration: item.duration,
            })).filter(
              item => item.article,
            )
        ).map((item, index) => {
          const article =
            item.article as LibraryArticle;

          const title =
            'title' in item &&
            item.title
              ? item.title
              : article.title;

          const duration =
            'duration' in item &&
            item.duration
              ? item.duration
              : article.durationMinutes;

          return (
            <Pressable
              key={`${article.id}-${index}`}
              onPress={() =>
                openArticle(
                  article.id,
                )
              }
              style={
                styles.articleRow
              }>
              <Image
                source={item.image}
                style={
                  styles.articleThumb
                }
              />

              <View
                style={styles.articleCopy}>
                <Text
                  numberOfLines={2}
                  style={
                    styles.articleTitle
                  }>
                  {title}
                </Text>

                <View
                  style={
                    styles.durationRow
                  }>
                  <MaterialDesignIcons
                    color={theme.colors.textSecondary}
                    name="clock-outline"
                    size={12}
                  />

                  <Text
                    style={
                      styles.articleMeta
                    }>
                    {duration} min de lecture
                  </Text>
                </View>
              </View>

              <Pressable
                accessibilityLabel={
                  bookmarks.has(article.id)
                    ? 'Retirer des favoris'
                    : 'Ajouter aux favoris'
                }
                accessibilityRole="button"
                hitSlop={12}
                onPress={() =>
                  toggleSaved(
                    article.id,
                  )
                }>
                <MaterialDesignIcons
                  color={
                    bookmarks.has(
                      article.id,
                    )
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                  name={
                    bookmarks.has(
                      article.id,
                    )
                      ? 'bookmark'
                      : 'bookmark-outline'
                  }
                  size={20}
                />
              </Pressable>
            </Pressable>
          );
        })}

        {filteredArticles.length === 0 &&
        (search ||
          selectedCategory) ? (
          <View
            style={styles.emptyState}>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="book-search-outline"
              size={26}
            />

            <Text
              style={styles.emptyTitle}>
              Aucun contenu trouvé
            </Text>

            <Pressable
              onPress={() => {
                setSearch('');
                setSelectedCategory(null);
              }}>
              <Text
                style={
                  styles.emptyAction
                }>
                Réinitialiser
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

// The "À la une" featured card's ImageBackground (featured-cycle.png) is a
// warm, always-pale photograph, independent of the active AWA theme — its
// title/metadata must never be theme.colors.text/textSecondary, which
// become LIGHT colors in Dark mode (correct for a dark surface) and vanish
// against this always-light photo. Derived via the existing
// pickReadableTextColor helper against a hex representative of the photo's
// own tone — the same technique already used for "Retour du cycle"'s hero
// illustration — never from theme.isDark. The category badge and its text
// are left untouched: badge already uses onPrimaryTextColor(theme) against
// its OWN near-opaque background, which is already theme-correct.
const FEATURED_CARD_IMAGE_BASE = '#EDE4D6';
const FEATURED_CARD_TEXT = pickReadableTextColor(FEATURED_CARD_IMAGE_BASE);
const FEATURED_CARD_TEXT_SECONDARY = interpolateHex(FEATURED_CARD_TEXT, '#FFFFFF', 0.25);

function createStyles(theme: ResolvedAwaTheme) {
  // The CTA keeps the app's own brand-accent hue rather than the same
  // near-black as the title — but theme.colors.primary is only readable
  // here as-is while it is ALREADY a dark tone on its own (checked via
  // pickReadableTextColor against theme.colors.primary itself, never
  // theme.isDark): a Dark-variant primary (light, meant for dark surfaces)
  // is darkened toward black at a fixed ratio instead, preserving its hue.
  const primaryIsDarkEnoughForFeaturedCard = pickReadableTextColor(theme.colors.primary) === '#FFFFFF';
  const featuredCtaColor = primaryIsDarkEnoughForFeaturedCard
    ? theme.colors.primary
    : interpolateHex(theme.colors.primary, '#000000', 0.55);

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    content: {
      paddingHorizontal: 18,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },

    headerCopy: {
      flex: 1,
      marginLeft: 10,
      paddingTop: 1,
    },

    backButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.045,
      shadowRadius: 6,
      elevation: 1,
    },

    title: {
      color: theme.colors.primary,
      fontFamily: 'serif',
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '700',
      letterSpacing: -0.35,
    },

    subtitle: {
      marginTop: 5,
      color: theme.colors.textSecondary,
      fontSize: 11.8,
      lineHeight: 16.5,
    },

    searchButton: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.045,
      shadowRadius: 6,
      elevation: 1,
    },

    searchField: {
      height: 43,
      marginTop: 14,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    searchInput: {
      flex: 1,
      marginLeft: 8,
      paddingVertical: 0,
      color: theme.colors.text,
      fontSize: 13,
    },

    tabs: {
      height: 40,
      marginTop: 17,
      padding: 3,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSecondary,
      overflow: 'hidden',
    },

    tabIndicator: {
      position: 'absolute',
      left: 3,
      top: 3,
      bottom: 3,
      borderRadius: 9,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 5,
      elevation: 2,
    },

    tab: {
      flex: 1,
      height: '100%',
      zIndex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 4,
    },

    tabPressed: {
      opacity: 0.72,
    },

    tabText: {
      color: theme.colors.textSecondary,
      fontSize: 9.8,
      fontWeight: '600',
    },

    activeTabText: {
      color: onPrimaryTextColor(theme),
      fontWeight: '700',
    },

    sectionHeading: {
      marginTop: 21,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    sectionTitle: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '700',
    },

    sectionAction: {
      color: theme.colors.primary,
      fontSize: 10.3,
      fontWeight: '700',
    },

    objectiveLabel: {
      marginTop: -5,
      marginBottom: 10,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
    },

    recommendedRow: {
      gap: 9,
      paddingBottom: 3,
    },

    recommendedCard: {
      width: 126,
      minHeight: 154,
      overflow: 'hidden',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },

    recommendedImage: {
      width: '100%',
      height: 72,
    },

    recommendedTitle: {
      paddingHorizontal: 9,
      marginTop: 8,
      color: theme.colors.text,
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: '700',
    },

    recommendedMeta: {
      paddingHorizontal: 9,
      marginTop: 5,
      marginBottom: 8,
      color: theme.colors.textSecondary,
      fontSize: 8.5,
    },

    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    categoryCard: {
      width: '31.6%',
      minHeight: 108,
      overflow: 'hidden',
      paddingHorizontal: 8,
      paddingTop: 10,
      paddingBottom: 8,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.03,
      shadowRadius: 5,
      elevation: 1,
    },

    categoryCardActive: {
      // No dedicated "active border" token exists yet — closest available
      // token is `primary` softened with alpha, matching the original
      // literal's mid-tone lavender-gray read.
      borderColor: withAlpha(theme.colors.primary, 0.35),
      backgroundColor: theme.colors.primarySoft,
      shadowOpacity: 0.055,
      elevation: 2,
    },

    categoryCardPressed: {
      opacity: 0.84,
      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    categoryAccent: {
      position: 'absolute',
      top: 0,
      left: 13,
      right: 13,
      height: 2,
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      backgroundColor: theme.colors.border,
    },

    categoryAccentActive: {
      backgroundColor: theme.colors.primary,
    },

    categoryTopRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },

    categoryImageWrap: {
      width: 43,
      height: 43,
      overflow: 'hidden',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    categoryImageWrapActive: {
      borderColor: withAlpha(theme.colors.primary, 0.35),
      backgroundColor: theme.colors.primarySoft,
    },

    categoryImage: {
      width: '100%',
      height: '100%',
    },

    categoryCountPill: {
      minWidth: 25,
      height: 21,
      paddingHorizontal: 6,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    categoryCountPillActive: {
      borderColor: withAlpha(theme.colors.primary, 0.35),
      backgroundColor: theme.colors.primarySoft,
    },

    categoryCountPillText: {
      color: theme.colors.textSecondary,
      fontSize: 8.3,
      fontWeight: '800',
    },

    categoryCountPillTextActive: {
      color: theme.colors.primary,
    },

    categoryTextBlock: {
      flex: 1,
      width: '100%',
      marginTop: 7,
    },

    categoryLabel: {
      minHeight: 27,
      color: theme.colors.text,
      fontSize: 9.6,
      lineHeight: 12.5,
      fontWeight: '700',
    },

    categoryLabelActive: {
      color: theme.colors.accent,
    },

    categoryMetaRow: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    categoryCount: {
      color: theme.colors.textSecondary,
      fontSize: 8,
      fontWeight: '500',
    },

    categoryCountActive: {
      color: theme.colors.textSecondary,
    },

    featuredCard: {
      height: 150,
      overflow: 'hidden',
      borderRadius: 13,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    featuredBackground: {
      flex: 1,
      justifyContent: 'center',
    },

    featuredImage: {
      borderRadius: 13,
    },

    featuredCopy: {
      width: '60%',
      paddingLeft: 16,
      paddingRight: 8,
    },

    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 5,
      backgroundColor: withAlpha(theme.colors.primary, 0.92),
    },

    badgeText: {
      color: onPrimaryTextColor(theme),
      fontSize: 7.4,
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    featuredTitle: {
      marginTop: 9,
      // Fixed, image-derived literal on purpose: this sits on top of a
      // fixed photographic ImageBackground (ART.featured), not a
      // theme-driven surface — see FEATURED_CARD_TEXT above. The white
      // text-shadow below is a legibility scrim for that specific photo,
      // same reasoning as any other overlay drawn on top of real image
      // content, and now correctly softens a genuinely DARK title.
      color: FEATURED_CARD_TEXT,
      fontFamily: 'serif',
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      textShadowColor: 'rgba(255,255,255,0.30)',
      textShadowOffset: {
        width: 0,
        height: 1,
      },
      textShadowRadius: 2,
    },

    durationRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    durationText: {
      color: FEATURED_CARD_TEXT_SECONDARY,
      fontSize: 9.5,
      fontWeight: '500',
    },

    readRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    readText: {
      color: featuredCtaColor,
      fontSize: 10.5,
      fontWeight: '700',
    },

    articleRow: {
      minHeight: 70,
      paddingVertical: 7,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },

    articleThumb: {
      width: 56,
      height: 56,
      borderRadius: 9,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    articleCopy: {
      flex: 1,
      paddingHorizontal: 12,
    },

    articleTitle: {
      color: theme.colors.text,
      fontSize: 11.7,
      lineHeight: 15.5,
      fontWeight: '700',
    },

    articleMeta: {
      color: theme.colors.textSecondary,
      fontSize: 8.8,
    },

    infoBox: {
      marginBottom: 7,
      padding: 10,
      flexDirection: 'row',
      gap: 8,
      borderRadius: 9,
      backgroundColor: withAlpha(theme.colors.warning, 0.15),
    },

    infoText: {
      flex: 1,
      color: theme.colors.warning,
      fontSize: 9.5,
      lineHeight: 13.5,
    },

    emptyState: {
      paddingVertical: 28,
      alignItems: 'center',
    },

    emptyTitle: {
      marginTop: 8,
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '700',
    },

    emptyAction: {
      marginTop: 8,
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },
  });
}

export default LibraryScreen;
