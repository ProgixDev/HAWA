import React, {memo, useRef, useState} from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import {getCategoryById, LIBRARY_TINTS, type LibraryArticle} from '../../data/libraryContent';
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
  const scale = useRef(new Animated.Value(1)).current;
  const category = getCategoryById(article.categoryId);
  const tint = LIBRARY_TINTS[category?.tint ?? 'purple'];

  const pressIn = () => Animated.spring(scale, {toValue: 0.97, useNativeDriver: true, damping: 16, stiffness: 220}).start();
  const pressOut = () => Animated.spring(scale, {toValue: 1, useNativeDriver: true, damping: 16, stiffness: 220}).start();

  return (
    <Animated.View style={{width: cardWidth, transform: [{scale}]}}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.card}>
        <View style={[styles.thumb, {backgroundColor: tint.bg}]}>
          <MaterialDesignIcons color={tint.fg} name={category?.icon ?? 'book-open-page-variant-outline'} size={34} />
          <View style={styles.bookmarkOverlay}>
            <BookmarkButton active={bookmarked} onPress={onToggleBookmark} size="small" />
          </View>
        </View>

        {category ? (
          <View style={[styles.categoryPill, {backgroundColor: tint.bg}]}>
            <Text numberOfLines={1} style={[styles.categoryPillText, {color: tint.fg}]}>{category.label}</Text>
          </View>
        ) : null}

        <Text numberOfLines={2} style={styles.title}>{article.title}</Text>

        <View style={styles.metaRow}>
          <MaterialDesignIcons color={homeColors.textSecondary} name="clock-outline" size={13} />
          <Text style={styles.metaText}>{article.durationMinutes} min</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {width: `${progress}%`}]} />
        </View>
        {progress > 0 ? <Text style={styles.progressText}>{progress}%</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

function RecommendedCarousel({
  articles, objectiveLabel, bookmarkedIds, progressByArticle, onToggleBookmark, onPressArticle, onPressSeeAll,
}: Props): React.JSX.Element | null {
  const {width} = useWindowDimensions();
  const cardWidth = Math.min(190, Math.max(150, width * 0.42));
  const gap = 12;
  const [activeIndex, setActiveIndex] = useState(0);

  if (articles.length === 0) {return null;}

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + gap));
    setActiveIndex(Math.max(0, Math.min(articles.length - 1, index)));
  };

  return (
    <View style={styles.card_container}>
      <View style={styles.headerRow}>
        <MaterialDesignIcons color={homeColors.primary} name="creation" size={16} />
        <Text style={styles.headerTitle}>Recommandé pour toi</Text>
      </View>

      <Text style={styles.reasonLabel}>Basé sur ton objectif actuel</Text>
      <Text numberOfLines={1} style={styles.objectiveLabel}>{objectiveLabel}</Text>
      <Text numberOfLines={2} style={styles.description}>
        Ces articles peuvent t’aider à mieux comprendre ton corps.
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={onPressSeeAll}
        style={({pressed}) => [styles.seeAllButton, pressed && styles.pressed]}>
        <Text style={styles.seeAllText}>Voir mes recommandations</Text>
        <MaterialDesignIcons color={homeColors.primary} name="arrow-right" size={15} />
      </Pressable>

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
            <View key={article.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card_container: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...homeShadow,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  headerTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  reasonLabel: {marginTop: 10, color: homeColors.textSecondary, fontSize: 11.5},
  objectiveLabel: {marginTop: 2, color: homeColors.primary, fontFamily: 'serif', fontSize: 18, fontWeight: '700'},
  description: {marginTop: 4, color: homeColors.textSecondary, fontSize: 12.5, lineHeight: 17},
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: homeColors.primary,
    paddingHorizontal: 14,
  },
  seeAllText: {color: homeColors.primary, fontSize: 12.5, fontWeight: '700'},
  scroll: {marginTop: 16},
  scrollContent: {paddingRight: 4},
  card: {
    borderRadius: 20,
    backgroundColor: '#FCFAFF',
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    padding: 10,
  },
  thumb: {height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  bookmarkOverlay: {position: 'absolute', top: 6, right: 6},
  categoryPill: {alignSelf: 'flex-start', marginTop: 10, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3},
  categoryPillText: {fontSize: 9.5, fontWeight: '700'},
  title: {marginTop: 8, color: homeColors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 17, minHeight: 34},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8},
  metaText: {color: homeColors.textSecondary, fontSize: 11},
  progressTrack: {marginTop: 8, height: 5, borderRadius: 3, backgroundColor: homeColors.lightLavender, overflow: 'hidden'},
  progressFill: {height: '100%', borderRadius: 3, backgroundColor: homeColors.primary},
  progressText: {marginTop: 4, alignSelf: 'flex-end', color: homeColors.textSecondary, fontSize: 10, fontWeight: '600'},
  dotsRow: {flexDirection: 'row', alignSelf: 'center', gap: 5, marginTop: 12},
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: homeColors.cardBorder},
  dotActive: {width: 16, backgroundColor: homeColors.primary},
  pressed: {opacity: 0.85},
});

export default memo(RecommendedCarousel);
