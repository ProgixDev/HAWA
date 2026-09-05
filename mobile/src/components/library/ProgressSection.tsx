import React, {memo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii} from '../home/homeTheme';
import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
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
  const {width} = useWindowDimensions();
  const cardWidth = Math.min(210, Math.max(170, width * 0.5));

  if (articles.length === 0) {return null;}

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reprendre selon ta progression</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onPressSeeAll}>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAll}>Voir tout</Text>
            <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={16} />
          </View>
        </Pressable>
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
            <Pressable
              accessibilityRole="button"
              key={article.id}
              onPress={() => onPressArticle(article)}
              style={({pressed}) => [styles.card, {width: cardWidth}, pressed && styles.pressed]}>
              <View style={styles.cardTop}>
                {category ? (
                  <View style={[styles.categoryPill, {backgroundColor: tint.bg}]}>
                    <Text numberOfLines={1} style={[styles.categoryPillText, {color: tint.fg}]}>{category.label}</Text>
                  </View>
                ) : <View />}
                <BookmarkButton active={bookmarkedIds.has(article.id)} onPress={() => onToggleBookmark(article.id)} size="small" />
              </View>

              <Text numberOfLines={2} style={styles.title}>{article.title}</Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: tint.fg}]} />
              </View>
              <Text style={styles.progressLabel}>{progress}% lu</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginTop: 20},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16},
  headerTitle: {flex: 1, marginRight: 8, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  seeAllRow: {flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0},
  seeAll: {color: homeColors.primary, fontSize: 12.5, fontWeight: '700'},
  scroll: {marginTop: 12},
  scrollContent: {paddingHorizontal: 16, gap: 12},
  card: {
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    padding: 14,
  },
  cardTop: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  categoryPill: {flexShrink: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3},
  categoryPillText: {fontSize: 9.5, fontWeight: '700'},
  title: {marginTop: 10, color: homeColors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 17, minHeight: 34},
  progressTrack: {marginTop: 10, height: 5, borderRadius: 3, backgroundColor: homeColors.lightLavender, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 3},
  progressLabel: {marginTop: 5, color: homeColors.textSecondary, fontSize: 10.5, fontWeight: '600'},
  pressed: {opacity: 0.88},
});

export default memo(ProgressSection);
