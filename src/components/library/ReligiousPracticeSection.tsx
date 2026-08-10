import React, {memo, useRef} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeRadii} from '../home/homeTheme';
import {LIBRARY_TINTS, RELIGIOUS_DISCLAIMER, type LibraryCategory} from '../../data/libraryContent';

const GOLD = '#B7791F';
const GOLD_LIGHT = '#FBEFD9';
const GOLD_DARK = '#5C4212';

type Props = {
  categories: LibraryCategory[];
  articleCountByCategory: Record<string, number>;
  onPressCategory: (category: LibraryCategory) => void;
  onPressSeeAll: () => void;
};

function ReligiousCategoryTile({
  category, count, onPress,
}: {
  category: LibraryCategory;
  count: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const tint = LIBRARY_TINTS[category.tint];

  return (
    <Animated.View style={[styles.tileWrap, {transform: [{scale}]}]}>
      <Pressable
        accessibilityLabel={`${category.label}, contenu éducatif, ${count} articles`}
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, {toValue: 0.96, useNativeDriver: true, damping: 16, stiffness: 220}).start()}
        onPressOut={() => Animated.spring(scale, {toValue: 1, useNativeDriver: true, damping: 16, stiffness: 220}).start()}
        style={styles.tile}>
        <View style={[styles.tileIcon, {backgroundColor: tint.bg}]}>
          <MaterialDesignIcons color={tint.fg} name={category.icon} size={20} />
        </View>
        <Text numberOfLines={2} style={styles.tileLabel}>{category.label}</Text>
        <Text style={styles.tileCount}>{count} article{count > 1 ? 's' : ''}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ReligiousPracticeSection({categories, articleCountByCategory, onPressCategory, onPressSeeAll}: Props): React.JSX.Element | null {
  if (categories.length === 0) {return null;}

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <MaterialDesignIcons color={GOLD} name="mosque-outline" size={20} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Cycle & pratique religieuse</Text>
          <Text style={styles.headerSubtitle}>Un espace séparé, dédié aux repères religieux</Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <MaterialDesignIcons color={GOLD_DARK} name="information-outline" size={15} />
        <Text style={styles.disclaimerText}>{RELIGIOUS_DISCLAIMER}</Text>
      </View>

      <View style={styles.grid}>
        {categories.map(category => (
          <ReligiousCategoryTile
            category={category}
            count={articleCountByCategory[category.id] ?? 0}
            key={category.id}
            onPress={() => onPressCategory(category)}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onPressSeeAll}
        style={({pressed}) => [styles.seeAllButton, pressed && styles.pressed]}>
        <Text style={styles.seeAllText}>Voir tout le contenu religieux</Text>
        <MaterialDesignIcons color={GOLD} name="arrow-right" size={15} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginHorizontal: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.4,
    borderColor: '#F0DDB2',
    padding: 16,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_LIGHT,
    flexShrink: 0,
  },
  headerCopy: {flex: 1, minWidth: 0},
  headerTitle: {color: GOLD_DARK, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  headerSubtitle: {marginTop: 2, color: '#8A6A2E', fontSize: 11.5},
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: GOLD_LIGHT,
    padding: 10,
  },
  disclaimerText: {flex: 1, color: GOLD_DARK, fontSize: 11, lineHeight: 15.5},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 10},
  tileWrap: {flexBasis: '46%', flexGrow: 1},
  tile: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0DDB2',
    padding: 12,
    minHeight: 96,
  },
  tileIcon: {width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  tileLabel: {marginTop: 9, color: '#2F2258', fontSize: 12, fontWeight: '700', lineHeight: 16, minHeight: 32},
  tileCount: {marginTop: 3, color: '#8A6A2E', fontSize: 10.5},
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: GOLD,
  },
  seeAllText: {color: GOLD, fontSize: 12.5, fontWeight: '700'},
  pressed: {opacity: 0.85},
});

export default memo(ReligiousPracticeSection);
