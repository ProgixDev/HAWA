import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import BookmarkButton from './BookmarkButton';

type Props = {
  article: LibraryArticle;
  progress: number;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onPressResume: () => void;
  onPressSeeAll: () => void;
};

function ContinueReadingSection({
  article, progress, bookmarked, onToggleBookmark, onPressResume, onPressSeeAll,
}: Props): React.JSX.Element {
  const {roles} = useAwaTokens();
  const category = getCategoryById(article.categoryId);
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];
  const remainingMinutes = Math.max(1, Math.round(article.durationMinutes * (1 - progress / 100)));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AwaText emphasized variant="titleMedium">Continuer la lecture</AwaText>
        <AwaButton label="Voir tout" onPress={onPressSeeAll} size="compact" variant="text" />
      </View>

      <AwaCard onPress={onPressResume} padding="default" style={styles.card} variant="filled">
        <View style={[styles.thumb, {backgroundColor: tint.bg}]}>
          <MaterialDesignIcons color={tint.fg} name={category?.icon ?? 'book-open-page-variant-outline'} size={26} />
        </View>

        <View style={styles.content}>
          <AwaText emphasized numberOfLines={2} variant="titleSmall">{article.title}</AwaText>
          <AwaText colorRole="onSurfaceVariant" numberOfLines={2} style={styles.summary} variant="bodySmall">
            {article.summary}
          </AwaText>
          <View style={[styles.progressTrack, {backgroundColor: roles.surface}]}>
            <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: roles.primary}]} />
          </View>
          <AwaText colorRole="onSurfaceVariant" style={styles.progressLabel} variant="labelSmall">
            {progress}% terminé
          </AwaText>
        </View>

        <View style={styles.actions}>
          <AwaButton label="Reprendre" onPress={onPressResume} size="compact" variant="outlined" />
          <View style={styles.remainingRow}>
            <MaterialDesignIcons color={roles.accessible.onSurfaceVariant} name="book-open-page-variant-outline" size={12} />
            <AwaText colorRole="onSurfaceVariant" numberOfLines={1} variant="labelSmall">
              {remainingMinutes} min restantes
            </AwaText>
          </View>
          <BookmarkButton active={bookmarked} onPress={onToggleBookmark} size="small" />
        </View>
      </AwaCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginTop: 20},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16},
  card: {flexDirection: 'row', marginTop: 12, marginHorizontal: 16, gap: 12},
  thumb: {width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  content: {flex: 1, minWidth: 0, justifyContent: 'center'},
  summary: {marginTop: 4},
  progressTrack: {marginTop: 8, height: 4, borderRadius: 2, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 2},
  progressLabel: {marginTop: 4},
  actions: {alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: 8},
  remainingRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
});

export default memo(ContinueReadingSection);
