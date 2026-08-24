import React, {useMemo} from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {ObjectiveId} from '../../state/onboardingPreferences';
import {getLibraryConfigForObjective} from '../../data/libraryObjectiveConfig';
import {LIBRARY_ARTICLES, type LibraryArticle, type LibraryCategoryId} from '../../data/libraryContent';
import {homeColors, homeRadii, homeShadow} from './homeTheme';

// "Pour t'accompagner" — the exact same contextual-article section already
// built (inline) in ConceiveDashboard.tsx, extracted here so every other
// objective Dashboard can reuse the identical visual language instead of
// hand-copying it. Conceive's own Dashboard is intentionally left untouched
// (it is the reference implementation) — this component is only wired into
// the other 6 Dashboards.
//
// Article data always comes from the canonical Library source
// (libraryContent.ts's LIBRARY_ARTICLES) via the existing per-objective
// curation (libraryObjectiveConfig.ts's getLibraryConfigForObjective) —
// never a second/duplicated article list. A missing id is silently
// filtered out (never a fabricated placeholder); if that leaves zero real
// articles for an objective, the whole section renders nothing rather than
// showing an empty/fake card.
const PURPLE = homeColors.primary;

// One shared thumbnail per Library categoryId, reusing only existing
// illustration assets (no new image was created for this task) — the same
// "closest matching existing category image" convention already used by
// ConceiveDashboard.tsx's own ARTICLE_IMAGES map, extended to cover every
// categoryId referenced by any objective's recommendedArticleIds.
const CATEGORY_IMAGES: Partial<Record<LibraryCategoryId, ImageSourcePropType>> = {
  cycle: require('../../assets/images/library/category-cycle.png'),
  symptoms: require('../../assets/images/library/category-cycle.png'),
  flow: require('../../assets/images/library/flow-texture-fluid.png'),
  pain: require('../../assets/images/library/pain-hero.png'),

  fertility: require('../../assets/images/library/category-fertility.png'),
  ovulation: require('../../assets/images/library/category-fertility.png'),
  fertilityAfterLoss: require('../../assets/images/library/category-fertility.png'),
  basalTemperature: require('../../assets/images/library/category-hormonal.png'),
  cervicalMucus: require('../../assets/images/library/flow-texture-mucus.png'),
  lhTests: require('../../assets/images/library/category-hormonal.png'),

  hormonalTreatments: require('../../assets/images/library/category-hormonal.png'),
  birthControlPills: require('../../assets/images/library/category-hormonal.png'),
  missedPills: require('../../assets/images/library/category-hormonal.png'),
  patch: require('../../assets/images/library/category-hormonal.png'),
  ring: require('../../assets/images/library/category-hormonal.png'),
  hormones: require('../../assets/images/library/category-hormonal.png'),
  menopause: require('../../assets/images/library/category-hormonal.png'),
  hotFlashes: require('../../assets/images/library/category-hormonal.png'),

  pregnancyWeekly: require('../../assets/images/library/category-pregnancy.png'),
  babyDevelopment: require('../../assets/images/library/category-pregnancy.png'),
  medicalExams: require('../../assets/images/library/category-pregnancy.png'),
  nutrition: require('../../assets/images/library/nutrition-hero.png'),

  sleep: require('../../assets/images/library/category-lifestyle.png'),
  lochia: require('../../assets/images/library/category-lifestyle.png'),
  postpartumRecovery: require('../../assets/images/library/category-lifestyle.png'),
  breastfeeding: require('../../assets/images/library/category-lifestyle.png'),
  emotionalHealth: require('../../assets/images/library/category-lifestyle.png'),
  physicalRecoveryLoss: require('../../assets/images/library/category-lifestyle.png'),
  emotionalRecoveryLoss: require('../../assets/images/library/category-lifestyle.png'),
  bones: require('../../assets/images/library/category-lifestyle.png'),
};
const FALLBACK_IMAGE: ImageSourcePropType = require('../../assets/images/library/category-cycle.png');

type Props = {
  objective: ObjectiveId;
  /** Bound by the caller to its own already-correctly-typed `navigation`
   * object — this component never takes `navigation` directly, the same
   * way QuickActionsGrid takes per-item `onPress` callbacks rather than a
   * navigation prop (composite tab/stack navigation prop types otherwise
   * don't structurally satisfy a plain `NavigationProp<RootStackParamList>`
   * parameter — a real TypeScript constraint, not a style choice). */
  onOpenArticle: (articleId: string) => void;
  onSeeAll: () => void;
};

function ObjectiveArticlesSection({objective, onOpenArticle, onSeeAll}: Props): React.JSX.Element | null {
  const articles = useMemo(() => {
    const recommendedIds = getLibraryConfigForObjective(objective).recommendedArticleIds;
    const byId = new Map(LIBRARY_ARTICLES.map(article => [article.id, article]));
    return recommendedIds
      .map(id => byId.get(id))
      .filter((article): article is LibraryArticle => Boolean(article));
  }, [objective]);

  if (articles.length === 0) {
    return null;
  }

  return (
    <View style={styles.articlesCard}>
      <View style={styles.articlesHeader}>
        <Text style={styles.articlesTitle}>Pour t’accompagner</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onSeeAll}>
          <Text style={styles.articlesSeeAll}>Voir tout</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.articlesRow} horizontal showsHorizontalScrollIndicator={false}>
        {articles.map(article => (
          <Pressable
            accessibilityLabel={article.title}
            accessibilityRole="button"
            key={article.id}
            onPress={() => onOpenArticle(article.id)}
            style={({pressed}) => [styles.articleTile, pressed && styles.pressed]}>
            <Image resizeMode="cover" source={CATEGORY_IMAGES[article.categoryId] ?? FALLBACK_IMAGE} style={styles.articleImage} />
            <Text numberOfLines={2} style={styles.articleTileTitle}>{article.title}</Text>
            <View style={styles.articleTileMetaRow}>
              <MaterialDesignIcons color={homeColors.textSecondary} name="book-outline" size={12} />
              <Text style={styles.articleTileMeta}>{article.durationMinutes} min de lecture</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  articlesCard: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingLeft: 16,
    ...homeShadow,
  },
  articlesHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16},
  articlesTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  articlesSeeAll: {color: PURPLE, fontSize: 12.5, fontWeight: '700'},
  articlesRow: {marginTop: 12, gap: 10, paddingRight: 16},
  articleTile: {
    width: 140,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    borderRadius: homeRadii.quickAction,
    backgroundColor: '#FFFDFF',
    overflow: 'hidden',
    paddingBottom: 10,
  },
  articleImage: {width: '100%', height: 76},
  articleTileTitle: {marginTop: 8, marginHorizontal: 9, color: homeColors.textPrimary, fontSize: 11.5, fontWeight: '700', lineHeight: 15},
  articleTileMetaRow: {marginTop: 6, marginHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4},
  articleTileMeta: {color: homeColors.textSecondary, fontSize: 9.5},
  pressed: {opacity: 0.82, transform: [{scale: 0.98}]},
});

export default ObjectiveArticlesSection;
