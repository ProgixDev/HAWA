import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {getSelectedObjective, getSpiritualMarkersEnabled, type ObjectiveId} from '../state/onboardingPreferences';
import {getLibraryConfigForObjective, OBJECTIVE_LABELS, type LibraryGroupId} from '../data/libraryObjectiveConfig';
import {
  getCachedLibraryState,
  loadLibraryState,
  subscribeLibraryState,
  toggleBookmark,
} from '../state/libraryStore';
import {getBottomPadding, getTopPadding} from '../theme/spacing';

const CREAM = '#FBF9F6';
const INK = '#2E2933';
const MUTED = '#777177';
const LAVENDER = '#74607F';
const BORDER = '#E9E4DF';

const ART = {
  cycle: require('../assets/images/library/category-cycle.png'),
  fertility: require('../assets/images/library/category-fertility.png'),
  pregnancy: require('../assets/images/library/category-pregnancy.png'),
  hormonal: require('../assets/images/library/category-hormonal.png'),
  lifestyle: require('../assets/images/library/category-lifestyle.png'),
  spiritual: require('../assets/images/library/category-spiritual.png'),
  featured: require('../assets/images/library/featured-cycle.png'),
  phases: require('../assets/images/library/popular-phases.png'),
  flower: require('../assets/images/library/popular-flower.png'),
  nutrition: require('../assets/images/library/popular-nutrition.png'),
} satisfies Record<string, ImageSourcePropType>;

type Props = NativeStackScreenProps<RootStackParamList, 'Library'>;
type TabId = 'all' | 'medical' | 'religious' | 'featured';

const TABS: {id: TabId; label: string; icon: string}[] = [
  {id: 'all', label: 'Tout', icon: 'view-grid-outline'},
  {id: 'medical', label: 'Médical', icon: 'medical-bag'},
  {id: 'religious', label: 'Religieux', icon: 'moon-waning-crescent'},
  {id: 'featured', label: 'À la une', icon: 'star-outline'},
];

type CategoryCard = {
  id: LibraryGroupId | 'spiritual';
  label: string;
  count: number;
  image: ImageSourcePropType;
  articleCategoryIds: LibraryCategoryId[];
  contentType: 'medical' | 'religious';
};

const CATEGORIES: CategoryCard[] = [
  {id: 'firstPeriod', label: 'Premières règles', count: 12, image: ART.flower, articleCategoryIds: ['firstPeriod'], contentType: 'medical'},
  {id: 'cycle', label: 'Cycle menstruel', count: 24, image: ART.cycle, articleCategoryIds: ['cycle', 'flow','symptoms','pain'], contentType: 'medical'},
  {id: 'fertility', label: 'Fertilité &\nconception', count: 18, image: ART.fertility, articleCategoryIds: ['fertility', 'ovulation', 'conceptionTips'], contentType: 'medical'},
  {id: 'contraception', label: 'Contraception', count: 18, image: ART.hormonal, articleCategoryIds: ['birthControlPills','patch','ring','hormonalTreatments','missedPills','sideEffects'], contentType: 'medical'},
  {id: 'pregnancy', label: 'Grossesse', count: 20, image: ART.pregnancy, articleCategoryIds: ['pregnancyWeekly','babyDevelopment','medicalExams','childbirthPrep'], contentType: 'medical'},
  {id: 'postpartum', label: 'Post-partum', count: 16, image: ART.lifestyle, articleCategoryIds: ['postpartumRecovery','lochia','nifas','breastfeeding','emotionalHealth'], contentType: 'medical'},
  {id: 'loss', label: 'Après une\nfausse couche', count: 9, image: ART.flower, articleCategoryIds: ['physicalRecoveryLoss','emotionalRecoveryLoss','fertilityAfterLoss'], contentType: 'medical'},
  {id: 'pcos', label: 'SOPK', count: 14, image: ART.hormonal, articleCategoryIds: ['pcos','hormones','acne','weight','exercise'], contentType: 'medical'},
  {id: 'menopause', label: 'Périménopause &\nMénopause', count: 15, image: ART.lifestyle, articleCategoryIds: ['menopause','hotFlashes','bones','treatments'], contentType: 'medical'},
  {id: 'spiritual', label: 'Cycle & pratique\nreligieuse', count: 22, image: ART.spiritual, articleCategoryIds: ['fiqhWomen','menstruationPurity','istihada','nifasFiqh','ramadan','fastingQadaa','prayerDuringMenstruation','returningToPrayer','religiousFaq'], contentType: 'religious'},
];

const POPULAR = [
  {id: 'cycle-phases-expliquees', title: 'Les différentes phases du cycle expliquées', image: ART.phases, duration: 6},
  {id: 'flow-comprendre-flux', title: 'Comprendre les règles : ce qui se passe vraiment', image: ART.flower, duration: 5},
  {id: 'nutrition-conception-fertilite', title: 'Alimentation et cycle : ce que ton corps aime', image: ART.nutrition, duration: 4},
];

function SectionTitle({title, action, onPress}: {title: string; action?: string; onPress?: () => void}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable hitSlop={10} onPress={onPress}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

function LibraryScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const tabProgress = useRef(new Animated.Value(0)).current;
  const objectiveFade = useRef(new Animated.Value(1)).current;
  const [tabsWidth, setTabsWidth] = useState(0);
  const [objective, setObjective] = useState<ObjectiveId>(() => getSelectedObjective());
  const [spiritualEnabled, setSpiritualEnabled] = useState(() => getSpiritualMarkersEnabled());
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryCard | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useFocusEffect(useCallback(() => {setObjective(getSelectedObjective());setSpiritualEnabled(getSpiritualMarkersEnabled());}, []));

  useEffect(() => {
    const index = TABS.findIndex(tab => tab.id === activeTab);

    Animated.timing(tabProgress, {
      toValue: Math.max(index, 0),
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabProgress]);

  useEffect(() => {
    objectiveFade.setValue(0);
    Animated.timing(objectiveFade,{toValue:1,duration:360,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
  }, [objective, objectiveFade]);

  useEffect(() => {
    let mounted = true;
    loadLibraryState().then(state => mounted && setBookmarks(new Set(state.bookmarks)));
    const unsubscribe = subscribeLibraryState(() => {
      setBookmarks(new Set(getCachedLibraryState().bookmarks));
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const articleById = useMemo(
    () => new Map(LIBRARY_ARTICLES.map(article => [article.id, article])),
    [],
  );

  const libraryConfig = useMemo(() => getLibraryConfigForObjective(objective), [objective]);
  const recommendedArticles = useMemo(() => libraryConfig.recommendedArticleIds.map(id => articleById.get(id)).filter((article): article is LibraryArticle => Boolean(article)), [articleById, libraryConfig]);
  const featuredArticle = articleById.get(libraryConfig.featuredArticleId) ?? recommendedArticles[0];
  const objectiveArticles = useMemo(() => {const priority=new Map(libraryConfig.recommendedArticleIds.map((id,index)=>[id,index]));return [...LIBRARY_ARTICLES].sort((a,b)=>(priority.get(a.id)??999)-(priority.get(b.id)??999));}, [libraryConfig]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');
    return objectiveArticles.filter(article => {
      const religious = CATEGORIES.find(category => category.id === 'spiritual')!.articleCategoryIds.includes(article.categoryId);
      if (religious && activeTab !== 'religious') {return false;}
      if (religious && !spiritualEnabled) {return false;}
      if (activeTab === 'medical' && religious) {return false;}
      if (activeTab === 'religious' && !religious) {return false;}
      if (activeTab === 'featured' && article.id !== 'cycle-phases-expliquees') {return false;}
      if (selectedCategory && !selectedCategory.articleCategoryIds.includes(article.categoryId)) {return false;}
      return !query || `${article.title} ${article.summary} ${article.tags.join(' ')}`.toLocaleLowerCase('fr').includes(query);
    });
  }, [activeTab, objectiveArticles, search, selectedCategory, spiritualEnabled]);

  const orderedCategories = useMemo(() => {const byId=new Map(CATEGORIES.map(category=>[category.id,category]));const medical=libraryConfig.categoryOrder.map(id=>byId.get(id)!).filter(Boolean);return spiritualEnabled?[...medical,byId.get('spiritual')!]:medical;},[libraryConfig,spiritualEnabled]);
  const visibleCategories = orderedCategories.filter(category => {
    if (activeTab === 'medical') {return category.contentType === 'medical';}
    if (activeTab === 'religious') {return category.contentType === 'religious';}
    return true;
  });

  const openArticle = (id: string) => navigation.navigate('ArticleReader', {articleId: id});
  const toggleSaved = (id: string) => {
    toggleBookmark(id);
    setBookmarks(new Set(getCachedLibraryState().bookmarks));
  };
  const chooseCategory = (category: CategoryCard) => {
    setSelectedCategory(category);
    setActiveTab(category.contentType === 'religious' ? 'religious' : 'medical');
    setShowAll(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({animated: true}));
  };
  const chooseTab = (tab: TabId) => {
    if (tab === 'featured') {
      navigation.navigate('FeaturedArticles');
      return;
    }
    if (tab === 'religious' && !spiritualEnabled) {return;}
    setActiveTab(tab);
    setSelectedCategory(null);
    setShowAll(tab === 'religious');
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getTopPadding(insets.top, true),
            paddingBottom: getBottomPadding(insets.bottom),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <MaterialDesignIcons color={INK} name="chevron-left" size={25} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Bibliothèque</Text>
            <Text style={styles.subtitle}>Des contenus fiables pour{`\n`}mieux comprendre ton corps,{`\n`}ta santé et ta foi.</Text>
          </View>
          <Pressable accessibilityLabel="Rechercher" onPress={() => setSearchOpen(value => !value)} style={styles.searchButton}>
            <MaterialDesignIcons color={INK} name={searchOpen ? 'close' : 'magnify'} size={23} />
          </Pressable>
        </View>

        {searchOpen ? (
          <View style={styles.searchField}>
            <MaterialDesignIcons color="#958D92" name="magnify" size={19} />
            <TextInput
              autoFocus
              onChangeText={setSearch}
              placeholder="Rechercher un article…"
              placeholderTextColor="#9C9599"
              style={styles.searchInput}
              value={search}
            />
          </View>
        ) : null}

        <View
          onLayout={event => setTabsWidth(event.nativeEvent.layout.width)}
          style={styles.tabs}>
          {tabsWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.tabIndicator,
                {
                  width: (tabsWidth - 6) / TABS.length,
                  transform: [
                    {
                      translateX: tabProgress.interpolate({
                        inputRange: [0, 1, 2, 3],
                        outputRange: [
                          0,
                          (tabsWidth - 6) / 4,
                          ((tabsWidth - 6) / 4) * 2,
                          ((tabsWidth - 6) / 4) * 3,
                        ],
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}

          {TABS.map(tab => {
            const active = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{selected: active}}
                onPress={() => chooseTab(tab.id)}
                style={({pressed}) => [
                  styles.tab,
                  pressed && styles.tabPressed,
                ]}>
                <MaterialDesignIcons
                  name={tab.icon as any}
                  size={14}
                  color={active ? '#FFFFFF' : '#746D73'}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabText,
                    active && styles.activeTabText,
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Catégories" action="Voir tout" onPress={() => {setActiveTab('all'); setSelectedCategory(null); setShowAll(true);}} />
        <Animated.View style={[styles.categoryGrid,{opacity:objectiveFade}]}>
          {visibleCategories.map(category => {
            const selected = selectedCategory?.id === category.id;

            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{selected}}
                onPress={() => chooseCategory(category)}
                style={({pressed}) => [
                  styles.categoryCard,
                  selected && styles.categoryCardActive,
                  pressed && styles.categoryCardPressed,
                ]}>
                <View
                  style={[
                    styles.categoryAccent,
                    selected && styles.categoryAccentActive,
                  ]}
                />

                <View style={styles.categoryTopRow}>
                  <View
                    style={[
                      styles.categoryImageWrap,
                      selected && styles.categoryImageWrapActive,
                    ]}>
                    <Image
                      source={category.image}
                      resizeMode="cover"
                      style={styles.categoryImage}
                    />
                  </View>

                  <View
                    style={[
                      styles.categoryCountPill,
                      selected && styles.categoryCountPillActive,
                    ]}>
                    <Text
                      style={[
                        styles.categoryCountPillText,
                        selected && styles.categoryCountPillTextActive,
                      ]}>
                      {category.count}
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryTextBlock}>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.categoryLabel,
                      selected && styles.categoryLabelActive,
                    ]}>
                    {category.label.replace('\n', ' ')}
                  </Text>

                  <View style={styles.categoryMetaRow}>
                    <Text
                      style={[
                        styles.categoryCount,
                        selected && styles.categoryCountActive,
                      ]}>
                      articles
                    </Text>

                    <MaterialDesignIcons
                      name="chevron-right"
                      size={13}
                      color={selected ? LAVENDER : '#A29BA0'}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        {activeTab !== 'religious' ? (
          <>
            <SectionTitle title="Recommandé pour toi" />
            <Text style={styles.objectiveLabel}>Objectif actuel : {OBJECTIVE_LABELS[objective]}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedRow}>
              {recommendedArticles.map(article => (
                <Pressable key={article.id} onPress={() => openArticle(article.id)} style={styles.recommendedCard}>
                  <Image source={article.categoryId === 'nutrition' ? ART.nutrition : article.categoryId === 'cycle' ? ART.phases : ART.flower} style={styles.recommendedImage}/>
                  <Text numberOfLines={3} style={styles.recommendedTitle}>{article.title}</Text>
                  <Text style={styles.recommendedMeta}>{article.durationMinutes} min</Text>
                </Pressable>
              ))}
            </ScrollView>
            <SectionTitle title="À la une" />
            <Pressable onPress={() => featuredArticle && openArticle(featuredArticle.id)} style={styles.featuredCard}>
              <ImageBackground source={ART.featured} imageStyle={styles.featuredImage} style={styles.featuredBackground}>
                <View style={styles.featuredCopy}>
                  <View style={styles.badge}><Text style={styles.badgeText}>MÉDICAL</Text></View>
                  <Text numberOfLines={3} style={styles.featuredTitle}>{featuredArticle?.title}</Text>
                  <View style={styles.durationRow}>
                    <MaterialDesignIcons color="#766E70" name="clock-outline" size={13} />
                    <Text style={styles.durationText}>{featuredArticle?.durationMinutes ?? 6} min de lecture</Text>
                  </View>
                  <View style={styles.readRow}>
                    <Text style={styles.readText}>Lire l'article</Text>
                    <MaterialDesignIcons color={LAVENDER} name="arrow-right" size={16} />
                  </View>
                </View>
              </ImageBackground>
            </Pressable>
          </>
        ) : null}

        <SectionTitle title={selectedCategory?.label.replace('\n', ' ') ?? (activeTab === 'religious' ? 'Repères spirituels' : 'Articles populaires')} action="Voir tout" onPress={() => setShowAll(true)} />

        {activeTab === 'religious' ? (
          <View style={styles.infoBox}>
            <MaterialDesignIcons color="#856D45" name="information-outline" size={17} />
            <Text style={styles.infoText}>Contenu éducatif. Pour une décision religieuse personnelle, consulte une personne qualifiée.</Text>
          </View>
        ) : null}

        {(search.trim() || selectedCategory || showAll || activeTab === 'religious'
          ? filteredArticles.slice(0, showAll ? 12 : 3).map(article => ({article, image: article.categoryId === 'nutrition' ? ART.nutrition : article.categoryId === 'cycle' ? ART.phases : ART.flower}))
          : POPULAR.map(item => ({article: articleById.get(item.id), image: item.image, title: item.title, duration: item.duration})).filter(item => item.article)
        ).map((item, index) => {
          const article = item.article as LibraryArticle;
          const title = 'title' in item && item.title ? item.title : article.title;
          const duration = 'duration' in item && item.duration ? item.duration : article.durationMinutes;
          return (
            <Pressable key={`${article.id}-${index}`} onPress={() => openArticle(article.id)} style={styles.articleRow}>
              <Image source={item.image} style={styles.articleThumb} />
              <View style={styles.articleCopy}>
                <Text numberOfLines={2} style={styles.articleTitle}>{title}</Text>
                <View style={styles.durationRow}>
                  <MaterialDesignIcons color="#9A9295" name="clock-outline" size={12} />
                  <Text style={styles.articleMeta}>{duration} min de lecture</Text>
                </View>
              </View>
              <Pressable accessibilityLabel="Ajouter aux favoris" hitSlop={12} onPress={() => toggleSaved(article.id)}>
                <MaterialDesignIcons color={bookmarks.has(article.id) ? LAVENDER : '#9C9699'} name={bookmarks.has(article.id) ? 'bookmark' : 'bookmark-outline'} size={20} />
              </Pressable>
            </Pressable>
          );
        })}

        {filteredArticles.length === 0 && (search || selectedCategory) ? (
          <View style={styles.emptyState}>
            <MaterialDesignIcons color={LAVENDER} name="book-search-outline" size={26} />
            <Text style={styles.emptyTitle}>Aucun contenu trouvé</Text>
            <Pressable onPress={() => {setSearch(''); setSelectedCategory(null);}}><Text style={styles.emptyAction}>Réinitialiser</Text></Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: CREAM},
  content: {paddingHorizontal: 18},
  headerRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  headerCopy: {flex: 1, marginLeft: 10, paddingTop: 1},
  backButton: {width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, shadowColor: '#352D38', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.045, shadowRadius: 6, elevation: 1},
  title: {
    color: LAVENDER,
    fontFamily: 'serif',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  subtitle: {marginTop: 5, color: MUTED, fontSize: 11.8, lineHeight: 16.5},
  searchButton: {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: BORDER, shadowColor: '#352D38', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.045, shadowRadius: 6, elevation: 1},
  searchField: {height: 43, marginTop: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E7E2DE', backgroundColor: '#FFFFFF'},
  searchInput: {flex: 1, marginLeft: 8, paddingVertical: 0, color: INK, fontSize: 13},
  tabs: {
    height: 40,
    marginTop: 17,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E0DB',
    backgroundColor: '#F6F3F0',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    left: 3,
    top: 3,
    bottom: 3,
    borderRadius: 9,
    backgroundColor: '#715E7C',
    shadowColor: '#4A3B52',
    shadowOffset: {width: 0, height: 2},
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
    color: '#746D73',
    fontSize: 9.8,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeading: {marginTop: 21, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  sectionTitle: {color: INK, fontFamily: 'serif', fontSize: 16, lineHeight: 20, fontWeight: '700'},
  sectionAction: {color: LAVENDER, fontSize: 10.3, fontWeight: '700'},
  objectiveLabel: {marginTop: -5, marginBottom: 10, color: MUTED, fontSize: 10.5},
  recommendedRow: {gap: 9, paddingBottom: 3},
  recommendedCard: {width: 126, minHeight: 154, overflow: 'hidden', borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: '#FFFDFC'},
  recommendedImage: {width: '100%', height: 72},
  recommendedTitle: {paddingHorizontal: 9, marginTop: 8, color: INK, fontSize: 10.5, lineHeight: 14, fontWeight: '700'},
  recommendedMeta: {paddingHorizontal: 9, marginTop: 5, marginBottom: 8, color: MUTED, fontSize: 8.5},
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
    borderColor: '#E7E1DC',
    backgroundColor: '#FFFFFF',
    shadowColor: '#352D38',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },

  categoryCardActive: {
    borderColor: '#BBAEC3',
    backgroundColor: '#FAF7FB',
    shadowOpacity: 0.055,
    elevation: 2,
  },

  categoryCardPressed: {
    opacity: 0.84,
    transform: [{scale: 0.985}],
  },

  categoryAccent: {
    position: 'absolute',
    top: 0,
    left: 13,
    right: 13,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: '#E9E2EC',
  },

  categoryAccentActive: {
    backgroundColor: LAVENDER,
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
    borderColor: '#ECE6E1',
    backgroundColor: '#F6F2EE',
  },

  categoryImageWrapActive: {
    borderColor: '#D7CCDE',
    backgroundColor: '#F0EAF2',
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
    borderColor: '#ECE6E2',
    backgroundColor: '#F9F7F5',
  },

  categoryCountPillActive: {
    borderColor: '#DDD2E3',
    backgroundColor: '#EEE7F2',
  },

  categoryCountPillText: {
    color: '#7F787D',
    fontSize: 8.3,
    fontWeight: '800',
  },

  categoryCountPillTextActive: {
    color: LAVENDER,
  },

  categoryTextBlock: {
    flex: 1,
    width: '100%',
    marginTop: 7,
  },

  categoryLabel: {
    minHeight: 27,
    color: INK,
    fontSize: 9.6,
    lineHeight: 12.5,
    fontWeight: '700',
  },

  categoryLabelActive: {
    color: '#4B3D53',
  },

  categoryMetaRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryCount: {
    color: '#918A8E',
    fontSize: 8,
    fontWeight: '500',
  },

  categoryCountActive: {
    color: '#75667D',
  },

  featuredCard: {height: 150, overflow: 'hidden', borderRadius: 13, borderWidth: 1, borderColor: '#E5DDD6', backgroundColor: '#E9E0D5'},
  featuredBackground: {flex: 1, justifyContent: 'center'},
  featuredImage: {borderRadius: 13},
  featuredCopy: {
    width: '60%',
    paddingLeft: 16,
    paddingRight: 8,
  },
  badge: {alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, backgroundColor: 'rgba(105,86,116,0.92)'},
  badgeText: {color: '#FFFFFF', fontSize: 7.4, fontWeight: '700', letterSpacing: 0.3},
  featuredTitle: {
    marginTop: 9,
    color: '#241F26',
    fontFamily: 'serif',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(255,255,255,0.30)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  durationRow: {marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4},
  durationText: {
    color: '#5F585C',
    fontSize: 9.5,
    fontWeight: '500',
  },
  readRow: {marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 5},
  readText: {color: LAVENDER, fontSize: 10.5, fontWeight: '700'},
  articleRow: {minHeight: 70, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6E0DC'},
  articleThumb: {width: 56, height: 56, borderRadius: 9, backgroundColor: '#EEE7E0'},
  articleCopy: {flex: 1, paddingHorizontal: 12},
  articleTitle: {color: INK, fontSize: 11.7, lineHeight: 15.5, fontWeight: '700'},
  articleMeta: {color: '#938C90', fontSize: 8.8},
  infoBox: {marginBottom: 7, padding: 10, flexDirection: 'row', gap: 8, borderRadius: 9, backgroundColor: '#F5EDDE'},
  infoText: {flex: 1, color: '#765F42', fontSize: 9.5, lineHeight: 13.5},
  emptyState: {paddingVertical: 28, alignItems: 'center'},
  emptyTitle: {marginTop: 8, color: INK, fontSize: 13, fontWeight: '700'},
  emptyAction: {marginTop: 8, color: LAVENDER, fontSize: 11, fontWeight: '700'},
});

export default LibraryScreen;