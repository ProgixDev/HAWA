import React, {memo, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii} from '../home/homeTheme';
import {LIBRARY_TINTS, type LibraryCategory} from '../../data/libraryContent';

type Props = {
  categories: LibraryCategory[];
  articleCountByCategory: Record<string, number>;
  newCategoryIds: Set<string>;
  onPressCategory: (category: LibraryCategory) => void;
  onPressSeeAll: () => void;
};

function TopicCard({
  category, count, isNew, onPress,
}: {
  category: LibraryCategory;
  count: number;
  isNew: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const tint = LIBRARY_TINTS[category.tint];

  return (
    <Animated.View style={[styles.cardWrap, {transform: [{scale}]}]}>
      <Pressable
        accessibilityLabel={`${category.label}, ${count} articles`}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, {toValue: 0.96, useNativeDriver: true, damping: 16, stiffness: 220}).start()}
        onPressOut={() => Animated.spring(scale, {toValue: 1, useNativeDriver: true, damping: 16, stiffness: 220}).start()}
        style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.iconTile, {backgroundColor: tint.bg}]}>
            <MaterialDesignIcons color={tint.fg} name={category.icon} size={22} />
          </View>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>Nouveau</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={styles.title}>{category.label}</Text>
        <Text style={styles.count}>{count} article{count > 1 ? 's' : ''}</Text>
      </Pressable>
    </Animated.View>
  );
}

function TopicGrid({categories, articleCountByCategory, newCategoryIds, onPressCategory, onPressSeeAll}: Props): React.JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parcourir par thématique</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onPressSeeAll}>
          <View style={styles.seeAllRow}>
            <Text style={styles.seeAll}>Voir tout</Text>
            <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={16} />
          </View>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {categories.map(category => (
          <TopicCard
            category={category}
            count={articleCountByCategory[category.id] ?? 0}
            isNew={newCategoryIds.has(category.id)}
            key={category.id}
            onPress={() => onPressCategory(category)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {marginTop: 20, paddingHorizontal: 16},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headerTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  seeAllRow: {flexDirection: 'row', alignItems: 'center', gap: 2},
  seeAll: {color: homeColors.primary, fontSize: 12.5, fontWeight: '700'},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12},
  cardWrap: {flexBasis: '46%', flexGrow: 1},
  card: {
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    padding: 14,
    minHeight: 112,
    shadowColor: homeColors.primaryDark,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTop: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  iconTile: {width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  newBadge: {borderRadius: 8, backgroundColor: '#FCE4EE', paddingHorizontal: 6, paddingVertical: 2},
  newBadgeText: {color: '#B23F63', fontSize: 8.5, fontWeight: '700'},
  title: {marginTop: 10, color: homeColors.textPrimary, fontSize: 13, fontWeight: '700', lineHeight: 17, minHeight: 34},
  count: {marginTop: 4, color: homeColors.textSecondary, fontSize: 11},
});

export default memo(TopicGrid);
