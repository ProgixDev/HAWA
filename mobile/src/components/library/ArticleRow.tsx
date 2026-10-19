import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
import {useAwaTokens} from '../../theme/useAwaTokens';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import {ArticlePremiumBadge} from './ArticlePremiumBadge';
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
  const {roles} = useAwaTokens();
  const category = getCategoryById(article.categoryId);
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];

  return (
    <AwaCard onPress={onPress} padding="compact" style={styles.card} variant="filled">
      <View style={[styles.thumb, {backgroundColor: tint.bg}]}>
        <MaterialDesignIcons color={tint.fg} name={category?.icon ?? 'book-open-page-variant-outline'} size={24} />
      </View>

      <View style={styles.content}>
        {category ? (
          <AwaText color={tint.fg} emphasized variant="labelSmall">{category.label}</AwaText>
        ) : null}
        <AwaText emphasized numberOfLines={2} style={styles.title} variant="titleSmall">{article.title}</AwaText>
        <ArticlePremiumBadge article={article} />
        <View style={styles.metaRow}>
          <MaterialDesignIcons color={roles.accessible.onSurfaceVariant} name="clock-outline" size={12} />
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{article.durationMinutes} min</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall">•</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{TYPE_LABEL[article.type]}</AwaText>
        </View>
        {progress > 0 && (
          <View style={[styles.progressTrack, {backgroundColor: roles.surface}]}>
            <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: tint.fg}]} />
          </View>
        )}
      </View>

      <BookmarkButton active={bookmarked} onPress={onToggleBookmark} size="small" />
    </AwaCard>
  );
}

const styles = StyleSheet.create({
  card: {flexDirection: 'row', alignItems: 'center', gap: 12},
  thumb: {width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  content: {flex: 1, minWidth: 0},
  title: {marginTop: 2},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4},
  progressTrack: {marginTop: 8, height: 4, borderRadius: 2, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 2},
});

export default memo(ArticleRow);
