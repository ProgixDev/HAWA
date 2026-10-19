import React, {memo} from 'react';
import {ScrollView, StyleSheet, useWindowDimensions, View} from 'react-native';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import BookmarkButton from './BookmarkButton';

type Props = {
  articles: LibraryArticle[];
  progressByArticle: Record<string, number>;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (articleId: string) => void;
  onPressArticle: (article: LibraryArticle) => void;
  onPressSeeAll: () => void;
};

function ProgressSection({
  articles, progressByArticle, bookmarkedIds, onToggleBookmark, onPressArticle, onPressSeeAll,
}: Props): React.JSX.Element | null {
  const {roles} = useAwaTokens();
  const {width} = useWindowDimensions();
  const cardWidth = Math.min(210, Math.max(172, width * 0.5));

  if (articles.length === 0) {return null;}

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AwaText emphasized style={styles.headerTitle} variant="titleMedium">Reprendre selon ta progression</AwaText>
        <AwaButton label="Voir tout" onPress={onPressSeeAll} size="compact" variant="text" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}>
        {articles.map(article => {
          const category = getCategoryById(article.categoryId);
          const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];
          const progress = progressByArticle[article.id] ?? 0;

          return (
            <AwaCard
              key={article.id}
              onPress={() => onPressArticle(article)}
              padding="default"
              style={{width: cardWidth}}
              variant="filled">
              <View style={styles.cardTop}>
                {category ? (
                  <View style={[styles.categoryPill, {backgroundColor: tint.bg}]}>
                    <AwaText color={tint.fg} emphasized variant="labelSmall">{category.label}</AwaText>
                  </View>
                ) : <View />}
                <BookmarkButton active={bookmarkedIds.has(article.id)} onPress={() => onToggleBookmark(article.id)} size="small" />
              </View>

              <AwaText emphasized numberOfLines={2} style={styles.title} variant="titleSmall">{article.title}</AwaText>

              <View style={[styles.progressTrack, {backgroundColor: roles.surface}]}>
                <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: tint.fg}]} />
              </View>
              <AwaText colorRole="onSurfaceVariant" style={styles.progressLabel} variant="labelSmall">{progress}% lu</AwaText>
            </AwaCard>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginTop: 20},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16},
  headerTitle: {flex: 1, marginRight: 8},
  scroll: {marginTop: 12},
  scrollContent: {paddingHorizontal: 16, gap: 12},
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  categoryPill: {flexShrink: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4},
  title: {marginTop: 12, minHeight: 40},
  progressTrack: {marginTop: 12, height: 4, borderRadius: 2, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 2},
  progressLabel: {marginTop: 4},
});

export default memo(ProgressSection);
