import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
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
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getLibraryArticles,
  LIBRARY_ARTICLES,
  type LibraryCategoryId,
  type TranslateFn,
} from '../data/libraryContent';
import {
  getSelectedObjective,
  getSpiritualMarkersEnabled,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {
  getLibraryConfigForObjective,
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
import {lowerCaseFor} from '../utils/textCase';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import BookmarkButton from '../components/library/BookmarkButton';
import {getArticleThumbnail} from '../data/libraryCovers';
import LibraryCategorySheet from '../components/library/LibraryCategorySheet';
import {
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

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Library'
>;

type TabId =
  | 'all'
  | 'medical'
  | 'religious'
  | 'favorites';

function getTabs(t: TranslateFn): {
  id: TabId;
  label: string;
  icon: string;
}[] {
  return [
    {
      id: 'all',
      label: t('library.screen.tabs.all'),
      icon: 'view-grid-outline',
    },
    {
      id: 'medical',
      label: t('library.screen.tabs.medical'),
      icon: 'medical-bag',
    },
    {
      id: 'religious',
      label: t('library.screen.tabs.religious'),
      icon: 'moon-waning-crescent',
    },
    {
      id: 'favorites',
      label: t('library.screen.tabs.favorites'),
      icon: 'bookmark-outline',
    },
  ];
}

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

function getCategoryDefinitions(t: TranslateFn): Omit<CategoryCard, 'count'>[] {
  return [
    {
      id: 'firstPeriod',
      label: t('library.screen.categoryTiles.firstPeriod.label'),

      // On conserve premier_regle.png pour cette catégorie
      image: ART.flower,

      articleCategoryIds: ['firstPeriod'],
      contentType: 'medical',
    },
    {
      id: 'cycle',
      label: t('library.screen.categoryTiles.cycle.label'),
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
      label: t('library.screen.categoryTiles.fertility.label'),
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
      label: t('library.screen.categoryTiles.contraception.label'),
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
      label: t('library.screen.categoryTiles.pregnancy.label'),
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
      label: t('library.screen.categoryTiles.postpartum.label'),
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
      label: t('library.screen.categoryTiles.loss.label'),

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
      label: t('library.screen.categoryTiles.pcos.label'),
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
      label: t('library.screen.categoryTiles.menopause.label'),
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
      label: t('library.screen.categoryTiles.spiritual.label'),
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
}

function getCategories(t: TranslateFn): CategoryCard[] {
  return getCategoryDefinitions(t).map(category => ({
    ...category,
    count: countArticlesForCategoryIds(category.articleCategoryIds),
  }));
}

// Articles listed before "Voir tout" asks for more.
const PAGE_SIZE = 20;

function LibraryScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const insets = useSafeAreaInsets();

  const tabs = useMemo(() => getTabs(t), [t]);

  const categories = useMemo(() => getCategories(t), [t]);

  const scrollRef = useRef<ScrollView>(null);

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

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    route.params?.categoryId ? [route.params.categoryId] : [],
  );

  const [sheetOpen, setSheetOpen] = useState(false);

  const [search, setSearch] = useState('');

  const [limit, setLimit] = useState(PAGE_SIZE);

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

  const translatedArticles = useMemo(
    () => getLibraryArticles(t),
    [t],
  );

  const libraryConfig = useMemo(
    () =>
      getLibraryConfigForObjective(
        objective,
      ),
    [objective],
  );

  const objectiveArticles = useMemo(() => {
    const priority = new Map(
      libraryConfig.recommendedArticleIds.map(
        (id, index) => [id, index],
      ),
    );

    return [...translatedArticles].sort(
      (a, b) =>
        (priority.get(a.id) ?? 999) -
        (priority.get(b.id) ?? 999),
    );
  }, [libraryConfig, translatedArticles]);

  const filteredArticles = useMemo(() => {
    const query = lowerCaseFor(search.trim());

    return objectiveArticles.filter(
      article => {
        const religious =
          categories.find(
            category =>
              category.id === 'spiritual',
          )!.articleCategoryIds.includes(
            article.categoryId,
          );

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
          activeTab === 'favorites' &&
          !bookmarks.has(article.id)
        ) {
          return false;
        }

        if (
          selectedCategoryIds.length > 0 &&
          !categories.some(
            category =>
              selectedCategoryIds.includes(category.id) &&
              category.articleCategoryIds.includes(article.categoryId),
          )
        ) {
          return false;
        }

        return (
          !query ||
          lowerCaseFor(
            `${article.title} ${article.summary} ${article.tags.join(' ')}`,
          ).includes(query)
        );
      },
    );
  }, [
    activeTab,
    bookmarks,
    categories,
    objectiveArticles,
    search,
    selectedCategoryIds,
    spiritualEnabled,
  ]);

  const orderedCategories = useMemo(() => {
    const byId = new Map(
      categories.map(category => [
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
    categories,
    libraryConfig,
    spiritualEnabled,
  ]);

  const categoryLabelFor = (articleCategoryId: LibraryCategoryId) =>
    categories
      .find(category => category.articleCategoryIds.includes(articleCategoryId))
      ?.label.replace('\n', ' ') ?? '';

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

  const chooseTab = (tab: TabId) => {
    if (
      tab === 'religious' &&
      !spiritualEnabled
    ) {
      return;
    }

    setActiveTab(tab);
    setLimit(PAGE_SIZE);
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
              32,
            ),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AwaIconButton
            accessibilityLabel={t('library.screen.backA11y')}
            icon="chevron-left"
            onPress={() => navigation.goBack()}
            variant="tonal"
          />

          <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
            {t('library.screen.title')}
          </Text>
        </View>

        <View style={styles.searchField}>
          <MaterialDesignIcons color={theme.colors.textMuted} name="magnify" size={20} />

          <TextInput
            accessibilityLabel={t('library.screen.searchA11y')}
            onChangeText={value => {
              setSearch(value);
              setLimit(PAGE_SIZE);
            }}
            placeholder={t('library.screen.searchPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />

          {search ? (
            <Pressable
              accessibilityLabel={t('library.screen.emptyReset')}
              hitSlop={10}
              onPress={() => setSearch('')}>
              <MaterialDesignIcons color={theme.colors.textMuted} name="close-circle" size={18} />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityLabel={t('library.screen.categoriesTitle')}
            hitSlop={8}
            onPress={() => setSheetOpen(true)}
            style={styles.filterButton}>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="tune-variant" size={22} />
            {selectedCategoryIds.length > 0 ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        <View accessibilityRole="tablist" style={styles.tabsRow}>
          {tabs.map(tab => {
            const selected = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{selected}}
                onPress={() => chooseTab(tab.id)}
                style={styles.tab}>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}
                  style={[styles.tabText, selected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabUnderline, selected && styles.tabUnderlineActive]} />
              </Pressable>
            );
          })}
        </View>

        {selectedCategoryIds.length > 0 ? (
          <ScrollView
            horizontal
            contentContainerStyle={styles.chipRow}
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}>
            {orderedCategories
              .filter(category => selectedCategoryIds.includes(category.id))
              .map(category => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  onPress={() => setSelectedCategoryIds(ids => ids.filter(id => id !== category.id))}
                  style={styles.chip}>
                  <Text numberOfLines={1} style={styles.chipText}>
                    {category.label.replace('\n', ' ')}
                  </Text>
                  <MaterialDesignIcons color={theme.colors.textSecondary} name="close" size={14} />
                </Pressable>
              ))}
          </ScrollView>
        ) : null}

        {activeTab === 'religious' ? (
          <View style={styles.infoBox}>
            <MaterialDesignIcons color={theme.colors.warning} name="information-outline" size={17} />

            <AwaText style={styles.infoText} variant="bodySmall">
              {t('library.screen.religiousInfo')}
            </AwaText>
          </View>
        ) : null}

        {filteredArticles.slice(0, limit).map(article => (
          <Pressable
            key={article.id}
            accessibilityRole="button"
            onPress={() => openArticle(article.id)}
            style={({pressed}) => [styles.articleRow, pressed && styles.categoryCardPressed]}>
            <Image resizeMode="cover" source={getArticleThumbnail(article.categoryId, article.id)} style={styles.articleThumb} />

            <View style={styles.articleCopy}>
              <AwaText colorRole="onSurfaceVariant" numberOfLines={1} variant="labelMedium">
                {categoryLabelFor(article.categoryId)}
              </AwaText>

              <AwaText emphasized numberOfLines={2} style={styles.articleTitle} variant="titleSmall">
                {article.title}
              </AwaText>

              <View style={styles.durationRow}>
                <MaterialDesignIcons color={theme.colors.textSecondary} name="clock-outline" size={12} />

                <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                  {t('library.screen.durationMinRead', {count: article.durationMinutes})}
                </AwaText>
              </View>
            </View>

            <BookmarkButton
              active={bookmarks.has(article.id)}
              onPress={() => toggleSaved(article.id)}
            />
          </Pressable>
        ))}

        {filteredArticles.length > limit ? (
          <AwaButton
            label={t('library.screen.seeAll')}
            onPress={() => setLimit(value => value + PAGE_SIZE)}
            size="compact"
            style={styles.moreAction}
            variant="text"
          />
        ) : null}

        {filteredArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialDesignIcons color={theme.colors.primary} name="book-search-outline" size={26} />

            <AwaText emphasized style={styles.emptyTitle} variant="titleSmall">
              {t('library.screen.emptyTitle')}
            </AwaText>

            <AwaButton
              label={t('library.screen.emptyReset')}
              onPress={() => {
                setSearch('');
                setSelectedCategoryIds([]);
                setActiveTab('all');
              }}
              size="compact"
              style={styles.emptyAction}
              variant="text"
            />
          </View>
        ) : null}
      </ScrollView>

      <LibraryCategorySheet
        onApply={ids => {
          setSelectedCategoryIds(ids);
          setLimit(PAGE_SIZE);
        }}
        onClose={() => setSheetOpen(false)}
        options={orderedCategories.map(category => ({id: category.id, label: category.label.replace('\n', ' ')}))}
        selectedIds={selectedCategoryIds}
        visible={sheetOpen}
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

    content: {
      paddingHorizontal: 18,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    // serif, one line, about 28 px
    title: {
      flex: 1,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
    },

    searchField: {
      minHeight: 52,
      marginTop: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 26,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    searchInput: {
      flex: 1,
      marginLeft: 8,
      paddingVertical: 0,
      color: theme.colors.text,
      fontSize: 14,
    },

    filterButton: {
      marginLeft: 8,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },

    filterDot: {
      position: 'absolute',
      top: 3,
      right: 3,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },

    // type tabs: four equal columns, text only, a 3 px bar under the active one (no fill, no container)
    tabsRow: {
      marginTop: 14,
      flexDirection: 'row',
    },

    tab: {
      flex: 1,
      alignItems: 'center',
    },

    tabText: {
      paddingVertical: 10,
      paddingHorizontal: 4,
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },

    tabTextActive: {
      color: theme.colors.primary,
    },

    tabUnderline: {
      alignSelf: 'stretch',
      height: 3,
      borderRadius: 2,
      backgroundColor: 'transparent',
    },

    tabUnderlineActive: {
      backgroundColor: theme.colors.primary,
    },

    chipScroll: {
      marginTop: 12,
      marginHorizontal: -18,
    },

    chipRow: {
      gap: 8,
      paddingHorizontal: 18,
    },

    chip: {
      height: 32,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    chipText: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '600',
    },

    categoryCardPressed: {
      opacity: 0.84,
      transform: [{scale: 0.985}],
    },

    articleRow: {
      minHeight: 96,
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },

    articleThumb: {
      width: 80,
      height: 80,
      borderRadius: 14,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    articleCopy: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 12,
      paddingRight: 8,
    },

    articleTitle: {
      marginTop: 2,
      flexShrink: 1,
    },

    durationRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    moreAction: {
      marginTop: 12,
      alignSelf: 'center',
    },

    infoBox: {
      marginBottom: 8,
      padding: 12,
      flexDirection: 'row',
      gap: 8,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.warning, 0.15),
    },

    infoText: {
      flex: 1,
    },

    emptyState: {
      paddingVertical: 28,
      alignItems: 'center',
    },

    emptyTitle: {
      marginTop: 8,
    },

    emptyAction: {
      marginTop: 8,
    },
  });
}

export default LibraryScreen;
