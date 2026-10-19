import React, {memo, useState} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {ArticlePremiumBadge} from './ArticlePremiumBadge';
import BookmarkButton from './BookmarkButton';

type Props = {
  articles: LibraryArticle[];
  objectiveLabel: string;
  bookmarkedIds: Set<string>;
  progressByArticle: Record<string, number>;
  onToggleBookmark: (articleId: string) => void;
  onPressArticle: (article: LibraryArticle) => void;
  onPressSeeAll: () => void;
};

function RecommendedCard({
  article, cardWidth, bookmarked, progress, onToggleBookmark, onPress,
}: {
  article: LibraryArticle;
  cardWidth: number;
  bookmarked: boolean;
  progress: number;
  onToggleBookmark: () => void;
  onPress: () => void;
}) {
  const {roles} = useAwaTokens();
  const category = getCategoryById(article.categoryId);
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];

  return (
    <View style={{width: cardWidth}}>
      <AwaCard onPress={onPress} padding="compact" variant="filled">
        <View style={[styles.thumb, {backgroundColor: tint.bg}]}>
          <MaterialDesignIcons color={tint.fg} name={category?.icon ?? 'book-open-page-variant-outline'} size={32} />
          <View style={styles.bookmarkOverlay}>
            <BookmarkButton active={bookmarked} onPress={onToggleBookmark} size="small" />
          </View>
        </View>

        {category ? (
          <View style={[styles.categoryPill, {backgroundColor: tint.bg}]}>
            <AwaText color={tint.fg} emphasized variant="labelSmall">{category.label}</AwaText>
          </View>
        ) : null}

        <AwaText emphasized numberOfLines={2} style={styles.title} variant="titleSmall">{article.title}</AwaText>
        <ArticlePremiumBadge article={article} />

        <View style={styles.metaRow}>
          <MaterialDesignIcons color={roles.accessible.onSurfaceVariant} name="clock-outline" size={14} />
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{article.durationMinutes} min</AwaText>
        </View>

        <View style={[styles.progressTrack, {backgroundColor: roles.surface}]}>
          <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: roles.primary}]} />
        </View>
        {progress > 0 ? (
          <AwaText colorRole="onSurfaceVariant" style={styles.progressText} variant="labelSmall">{progress}%</AwaText>
        ) : null}
      </AwaCard>
    </View>
  );
}

function RecommendedCarousel({
  articles, objectiveLabel, bookmarkedIds, progressByArticle, onToggleBookmark, onPressArticle, onPressSeeAll,
}: Props): React.JSX.Element | null {
  const {roles} = useAwaTokens();
  const {width} = useWindowDimensions();
  const cardWidth = Math.min(192, Math.max(152, width * 0.42));
  const gap = 12;
  const [activeIndex, setActiveIndex] = useState(0);

  if (articles.length === 0) {return null;}

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + gap));
    setActiveIndex(Math.max(0, Math.min(articles.length - 1, index)));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <MaterialDesignIcons color={roles.accessible.primaryAsText} name="creation" size={18} />
        <AwaText emphasized variant="titleMedium">Recommandé pour toi</AwaText>
      </View>

      <AwaText colorRole="onSurfaceVariant" style={styles.reasonLabel} variant="bodySmall">
        Basé sur ton objectif actuel
      </AwaText>
      <AwaText colorRole="primary" emphasized style={styles.objectiveLabel} variant="titleMedium">
        {objectiveLabel}
      </AwaText>
      <AwaText colorRole="onSurfaceVariant" style={styles.description} variant="bodyMedium">
        Ces articles peuvent t’aider à mieux comprendre ton corps.
      </AwaText>

      <AwaButton
        label="Voir mes recommandations"
        onPress={onPressSeeAll}
        size="compact"
        style={styles.seeAllButton}
        variant="outlined"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, {gap}]}
        decelerationRate="fast"
        horizontal
        onScroll={handleScroll}
        scrollEventThrottle={32}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + gap}
        style={styles.scroll}>
        {articles.map(article => (
          <RecommendedCard
            article={article}
            bookmarked={bookmarkedIds.has(article.id)}
            cardWidth={cardWidth}
            key={article.id}
            onPress={() => onPressArticle(article)}
            onToggleBookmark={() => onToggleBookmark(article.id)}
            progress={progressByArticle[article.id] ?? 0}
          />
        ))}
      </ScrollView>

      {articles.length > 1 && (
        <View style={styles.dotsRow}>
          {articles.map((article, index) => (
            <View
              key={article.id}
              style={[
                styles.dot,
                index === activeIndex
                  ? [styles.dotActive, {backgroundColor: roles.primary}]
                  : {backgroundColor: roles.outline},
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // The section itself carries no surface: the article cards inside are the only cards (never nested).
  container: {marginTop: 16, paddingHorizontal: 16},
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  reasonLabel: {marginTop: 12},
  objectiveLabel: {marginTop: 4},
  description: {marginTop: 4},
  seeAllButton: {alignSelf: 'flex-start', marginTop: 12},
  scroll: {marginTop: 16},
  scrollContent: {paddingRight: 4},
  thumb: {height: 88, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  bookmarkOverlay: {position: 'absolute', top: 8, right: 8},
  categoryPill: {alignSelf: 'flex-start', marginTop: 12, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4},
  title: {marginTop: 8, minHeight: 40},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8},
  progressTrack: {marginTop: 8, height: 4, borderRadius: 2, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 2},
  progressText: {marginTop: 4, alignSelf: 'flex-end'},
  dotsRow: {flexDirection: 'row', alignSelf: 'center', gap: 4, marginTop: 12},
  dot: {width: 6, height: 6, borderRadius: 3},
  dotActive: {width: 16},
});

export default memo(RecommendedCarousel);
