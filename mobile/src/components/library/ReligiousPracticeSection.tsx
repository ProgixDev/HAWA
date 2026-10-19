import React, {memo, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeRadii} from '../home/homeTheme';
import {LIBRARY_TINTS, RELIGIOUS_DISCLAIMER, type LibraryCategory} from '../../data/libraryContent';
import {AwaText} from '../ui/AwaText';

const GOLD = '#B7791F';
const GOLD_LIGHT = '#FBEFD9';
const GOLD_DARK = '#5C4212';
// Religious-content palette (gold family): intentionally not Material roles, kept as-is (DESIGN.md: spiritual colours
// stay in their feature files).
const GOLD_MUTED = '#8A6A2E';
const RELIGIOUS_INK = '#2F2258';

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
        <AwaText color={RELIGIOUS_INK} emphasized style={styles.tileLabel} variant="titleSmall">
          {category.label}
        </AwaText>
        <AwaText color={GOLD_MUTED} style={styles.tileCount} variant="bodySmall">
          {count} article{count > 1 ? 's' : ''}
        </AwaText>
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
          <AwaText color={GOLD_DARK} emphasized variant="titleMedium">Cycle & pratique religieuse</AwaText>
          <AwaText color={GOLD_MUTED} style={styles.headerSubtitle} variant="bodySmall">
            Un espace séparé, dédié aux repères religieux
          </AwaText>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <MaterialDesignIcons color={GOLD_DARK} name="information-outline" size={15} />
        <AwaText color={GOLD_DARK} style={styles.disclaimerText} variant="bodySmall">{RELIGIOUS_DISCLAIMER}</AwaText>
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
        <AwaText color={GOLD} emphasized style={styles.seeAllLabel} variant="labelLarge">Voir tout le contenu religieux</AwaText>
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
    borderWidth: 1,
    borderColor: '#F0DDB2',
    padding: 16,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_LIGHT,
    flexShrink: 0,
  },
  headerCopy: {flex: 1, minWidth: 0},
  headerSubtitle: {marginTop: 2},
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: GOLD_LIGHT,
    padding: 12,
  },
  disclaimerText: {flex: 1},
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
  tileLabel: {marginTop: 8, minHeight: 40},
  tileCount: {marginTop: 4},
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  seeAllLabel: {flexShrink: 1, textAlign: 'center'},
  pressed: {opacity: 0.85},
});

export default memo(ReligiousPracticeSection);
