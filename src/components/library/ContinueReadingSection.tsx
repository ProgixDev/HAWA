import React, {memo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
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
  const category = getCategoryById(article.categoryId);
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];
  const remainingMinutes = Math.max(1, Math.round(article.durationMinutes * (1 - progress / 100)));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Continuer la lecture</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onPressSeeAll}>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAll}>Voir tout</Text>
            <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={16} />
          </View>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onPressResume}
        style={({pressed}) => [styles.card, pressed && styles.pressed]}>
        <View style={[styles.thumb, {backgroundColor: tint.bg}]}>
          <MaterialDesignIcons color={tint.fg} name={category?.icon ?? 'book-open-page-variant-outline'} size={26} />
        </View>

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>{article.title}</Text>
          <Text numberOfLines={2} style={styles.summary}>{article.summary}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: `${progress}%`}]} />
          </View>
          <Text style={styles.progressLabel}>{progress}% terminé</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onPressResume}
            style={({pressed}) => [styles.resumeButton, pressed && styles.pressed]}>
            <Text style={styles.resumeText}>Reprendre</Text>
          </Pressable>
          <View style={styles.remainingRow}>
            <MaterialDesignIcons color={homeColors.textSecondary} name="book-open-page-variant-outline" size={12} />
            <Text numberOfLines={1} style={styles.remainingText}>{remainingMinutes} min restantes</Text>
          </View>
          <BookmarkButton active={bookmarked} onPress={onToggleBookmark} size="small" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginTop: 20},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16},
  headerTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  seeAllRow: {flexDirection: 'row', alignItems: 'center', gap: 2},
  seeAll: {color: homeColors.primary, fontSize: 12.5, fontWeight: '700'},
  card: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 12,
    ...homeShadow,
  },
  thumb: {width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  content: {flex: 1, minWidth: 0, justifyContent: 'center'},
  title: {color: homeColors.textPrimary, fontSize: 14, fontWeight: '700', lineHeight: 18},
  summary: {marginTop: 3, color: homeColors.textSecondary, fontSize: 11.5, lineHeight: 15},
  progressTrack: {marginTop: 8, height: 5, borderRadius: 3, backgroundColor: homeColors.lightLavender, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 3, backgroundColor: homeColors.primary},
  progressLabel: {marginTop: 4, color: homeColors.textSecondary, fontSize: 10.5, fontWeight: '600'},
  actions: {alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: 6},
  resumeButton: {
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: homeColors.primary,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeText: {color: homeColors.primary, fontSize: 11.5, fontWeight: '700'},
  remainingRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  remainingText: {color: homeColors.textSecondary, fontSize: 9.5},
  pressed: {opacity: 0.85},
});

export default memo(ContinueReadingSection);
