import React, {memo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii} from '../home/homeTheme';
import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
import BookmarkButton from './BookmarkButton';

const TYPE_LABEL: Record<LibraryArticle['type'], string> = {
  article: 'Article',
  guide: 'Guide',
  faq: 'FAQ',
};

type Props = {
  article: LibraryArticle;
  progress: number;
  bookmarked: boolean;
  onPress: () => void;
  onToggleBookmark: () => void;
};

function ArticleRow({article, progress, bookmarked, onPress, onToggleBookmark}: Props): React.JSX.Element {
  const category = getCategoryById(article.categoryId);
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.thumb, {backgroundColor: tint.bg}]}>
        <MaterialDesignIcons color={tint.fg} name={category?.icon ?? 'book-open-page-variant-outline'} size={24} />
      </View>

      <View style={styles.content}>
        {category ? (
          <Text numberOfLines={1} style={[styles.category, {color: tint.fg}]}>{category.label}</Text>
        ) : null}
        <Text numberOfLines={2} style={styles.title}>{article.title}</Text>
        <View style={styles.metaRow}>
          <MaterialDesignIcons color={homeColors.textSecondary} name="clock-outline" size={12} />
          <Text style={styles.metaText}>{article.durationMinutes} min</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{TYPE_LABEL[article.type]}</Text>
        </View>
        {progress > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: tint.fg}]} />
          </View>
        )}
      </View>

      <BookmarkButton active={bookmarked} onPress={onToggleBookmark} size="small" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    padding: 12,
  },
  thumb: {width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  content: {flex: 1, minWidth: 0},
  category: {fontSize: 10.5, fontWeight: '700'},
  title: {marginTop: 2, color: homeColors.textPrimary, fontSize: 13.5, fontWeight: '700', lineHeight: 18},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5},
  metaText: {color: homeColors.textSecondary, fontSize: 11},
  metaDot: {color: homeColors.textSecondary, fontSize: 11},
  progressTrack: {marginTop: 7, height: 4, borderRadius: 2, backgroundColor: homeColors.lightLavender, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 2},
  pressed: {opacity: 0.85},
});

export default memo(ArticleRow);
