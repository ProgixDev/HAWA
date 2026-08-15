import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { homeColors } from '../../components/home/homeTheme';
import BookmarkButton from '../../components/library/BookmarkButton';
import ReadingControls from '../../components/articles/ReadingControls';
import {
  getArticleById,
  getCategoryById,
  LIBRARY_TINTS,
  RELIGIOUS_DISCLAIMER,
} from '../../data/libraryContent';
import {
  isArticleBookmarked,
  loadLibraryState,
  saveScrollPosition,
  toggleBookmark,
} from '../../state/libraryStore';
import {
  getBottomPadding,
  getTopPadding,
  READING_CONTROLS_SPACE,
} from '../../theme/spacing';
import FlowMenstrualArticleScreen from './FlowMenstrualArticleScreen';
import FirstPeriodArticleScreen from './FirstPeriodArticleScreen';
import UnderstandMenstrualFlowArticleScreen from './UnderstandMenstrualFlowArticleScreen';
import RegularIrregularCycleArticleScreen from './RegularIrregularCycleArticleScreen';
import CyclePhasesArticleScreen from './CyclePhasesArticleScreen';
import NutritionCycleArticleScreen from './NutritionCycleArticleScreen';
import PeriodPainArticleScreen from './PeriodPainArticleScreen';
import PmsArticleScreen from './PmsArticleScreen';
import FlowColorsTexturesArticleScreen from './FlowColorsTexturesArticleScreen';
import NifasFiqhArticleScreen from './NifasFiqhArticleScreen';

const LEVEL_LABEL = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
} as const;
const TYPE_LABEL = { article: 'Article', guide: 'Guide', faq: 'FAQ' } as const;

// These articles have a bespoke, hand-designed editorial layout (hero
// illustration, table of contents, highlight/tip cards, etc.) that doesn't
// fit the generic paragraph-based reader below.
const BESPOKE_ARTICLE_SCREENS: Partial<
  Record<string, React.ComponentType<Props>>
> = {
  'flow-hygiene-intime': FlowMenstrualArticleScreen,
  'firstperiod-premieres-regles': FirstPeriodArticleScreen,
  'flow-comprendre-flux': UnderstandMenstrualFlowArticleScreen,
  'cycle-comprendre-ton-cycle': RegularIrregularCycleArticleScreen,
  'cycle-phases-expliquees': CyclePhasesArticleScreen,
  'nutrition-conception-fertilite': NutritionCycleArticleScreen,
  'pain-gerer-douleurs': PeriodPainArticleScreen,
  'symptoms-reconnaitre': PmsArticleScreen,
  'flow-colors-textures': FlowColorsTexturesArticleScreen,
  'nifasfiqh-repere-fiqh': NifasFiqhArticleScreen,
};

type Props = NativeStackScreenProps<RootStackParamList, 'ArticleReader'>;

function ArticleReaderScreen(props: Props): React.JSX.Element {
  const { route } = props;
  const { articleId } = route.params;
  const BespokeScreen = BESPOKE_ARTICLE_SCREENS[articleId];
  if (BespokeScreen) {
    return <BespokeScreen {...props} />;
  }
  return <GenericArticleReaderScreen {...props} />;
}

function GenericArticleReaderScreen({
  route,
  navigation,
}: Props): React.JSX.Element {
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
  const article = useMemo(() => getArticleById(articleId), [articleId]);
  const category = article ? getCategoryById(article.categoryId) : undefined;
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];
  const isReligious = category?.contentType === 'religious';
  const scrollRef = useRef<ScrollView>(null);

  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadLibraryState().then(() => {
      if (!mounted) {
        return;
      }
      setBookmarked(isArticleBookmarked(articleId));
    });
    return () => {
      mounted = false;
    };
  }, [articleId]);

  if (!article) {
    return (
      <View
        style={[
          styles.missingContainer,
          {
            paddingTop: getTopPadding(insets.top, true),
            paddingBottom: getBottomPadding(insets.bottom),
          },
        ]}
      >
        <Text style={styles.missingText}>
          Cet article n’est plus disponible.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={navigation.goBack}
          style={styles.missingButton}
        >
          <Text style={styles.missingButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const handleToggleBookmark = () => {
    const next = toggleBookmark(articleId);
    setBookmarked(next);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent
      />

      <ScrollView
        onScroll={event =>
          saveScrollPosition(articleId, event.nativeEvent.contentOffset.y)
        }
        ref={scrollRef}
        scrollEventThrottle={200}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View
          style={[
            styles.hero,
            {
              backgroundColor: tint.bg,
              paddingTop: getTopPadding(insets.top, true),
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={8}
            onPress={navigation.goBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialDesignIcons
              color={tint.fg}
              name="chevron-left"
              size={24}
            />
          </Pressable>

          <BookmarkButton
            active={bookmarked}
            onPress={handleToggleBookmark}
            tone="light"
          />

          <View style={styles.heroIconWrap}>
            <MaterialDesignIcons
              color={tint.fg}
              name={category?.icon ?? 'book-open-page-variant-outline'}
              size={44}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.pillRow}>
            {category ? (
              <View style={[styles.categoryPill, { backgroundColor: tint.bg }]}>
                <Text style={[styles.categoryPillText, { color: tint.fg }]}>
                  {category.label}
                </Text>
              </View>
            ) : null}
            {isReligious && (
              <View style={styles.educationalPill}>
                <MaterialDesignIcons
                  color="#B7791F"
                  name="school-outline"
                  size={11}
                />
                <Text style={styles.educationalPillText}>Contenu éducatif</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.metaRow}>
            <MaterialDesignIcons
              color={homeColors.textSecondary}
              name="clock-outline"
              size={13}
            />
            <Text style={styles.metaText}>{article.durationMinutes} min</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{TYPE_LABEL[article.type]}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{LEVEL_LABEL[article.level]}</Text>
          </View>

          <Text style={styles.summary}>{article.summary}</Text>

          <View style={styles.divider} />

          {isReligious && (
            <View style={styles.disclaimer}>
              <MaterialDesignIcons
                color="#5C4212"
                name="information-outline"
                size={16}
              />
              <Text style={styles.disclaimerText}>{RELIGIOUS_DISCLAIMER}</Text>
            </View>
          )}

          {article.content.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          <View
            style={{
              height: getBottomPadding(insets.bottom, READING_CONTROLS_SPACE),
            }}
          />
        </View>
      </ScrollView>

      <ReadingControls
        articleId={articleId}
        durationMinutes={article.durationMinutes}
        scrollRef={scrollRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FCFAFF' },
  scroll: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  heroIconWrap: {
    position: 'absolute',
    right: 24,
    bottom: -10,
    opacity: 0.5,
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryPillText: { fontSize: 11, fontWeight: '700' },
  educationalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: '#FBEFD9',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  educationalPillText: { color: '#B7791F', fontSize: 11, fontWeight: '700' },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#FBEFD9',
    padding: 12,
  },
  disclaimerText: { flex: 1, color: '#5C4212', fontSize: 12, lineHeight: 17 },
  title: {
    marginTop: 12,
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 29,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  metaText: { color: homeColors.textSecondary, fontSize: 12 },
  metaDot: { color: homeColors.textSecondary, fontSize: 12 },
  summary: {
    marginTop: 14,
    color: homeColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: homeColors.cardBorder,
    marginTop: 18,
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 16,
    color: homeColors.textPrimary,
    fontSize: 14.5,
    lineHeight: 23,
  },
  pressed: { opacity: 0.85 },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FCFAFF',
  },
  missingText: { color: homeColors.textSecondary, fontSize: 14 },
  missingButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeColors.primary,
  },
  missingButtonText: { color: '#FFFFFF', fontWeight: '700' },
});

export default ArticleReaderScreen;
