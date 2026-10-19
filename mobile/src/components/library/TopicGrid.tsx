import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTokens} from '../../theme/useAwaTokens';
import {LIBRARY_TINTS, type LibraryCategory} from '../../data/libraryContent';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';

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
  const {roles} = useAwaTokens();
  const tint = LIBRARY_TINTS[category.tint];

  return (
    <View style={styles.cardWrap}>
      <AwaCard
        accessibilityLabel={`${category.label}, ${count} articles`}
        onPress={onPress}
        padding="default"
        style={styles.card}
        variant="filled">
        <View style={styles.cardTop}>
          <View style={[styles.iconTile, {backgroundColor: tint.bg}]}>
            <MaterialDesignIcons color={tint.fg} name={category.icon} size={22} />
          </View>
          {isNew && (
            <View style={[styles.newBadge, {backgroundColor: roles.primaryContainer}]}>
              <AwaText colorRole="onPrimaryContainer" emphasized variant="labelSmall">Nouveau</AwaText>
            </View>
          )}
        </View>
        <AwaText emphasized style={styles.title} variant="titleSmall">{category.label}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.count} variant="bodySmall">
          {count} article{count > 1 ? 's' : ''}
        </AwaText>
      </AwaCard>
    </View>
  );
}

function TopicGrid({categories, articleCountByCategory, newCategoryIds, onPressCategory, onPressSeeAll}: Props): React.JSX.Element {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AwaText emphasized style={styles.headerTitle} variant="titleMedium">Parcourir par thématique</AwaText>
        <AwaButton label="Voir tout" onPress={onPressSeeAll} size="compact" variant="text" />
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
  headerTitle: {flex: 1, marginRight: 8},
  grid: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 12},
  cardWrap: {flexBasis: '46%', flexGrow: 1},
  card: {minHeight: 112},
  cardTop: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'},
  iconTile: {width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  newBadge: {borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4},
  title: {marginTop: 12, minHeight: 40},
  count: {marginTop: 4},
});

export default memo(TopicGrid);
