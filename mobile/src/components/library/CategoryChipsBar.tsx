import React, {memo} from 'react';
import {Pressable, ScrollView, StyleSheet} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTokens} from '../../theme/useAwaTokens';
import type {IconName, LibraryCategory, LibraryCategoryId} from '../../data/libraryContent';
import {AwaText} from '../ui/AwaText';

export type ChipId = LibraryCategoryId | 'all';

type Props = {
  categories: LibraryCategory[];
  selectedId: ChipId;
  onSelect: (id: ChipId) => void;
  onPressMore: () => void;
};

type ChipProps = {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
};

// Material 3 filter chip: the selected chip is filled with the primary container, the others are outlined with the
// `outline` role. The touch target is 48 dp (visual 40 dp + hitSlop).
function Chip({label, icon, active, onPress}: ChipProps) {
  const {roles} = useAwaTokens();
  const foreground = active ? roles.onPrimaryContainer : roles.accessible.onSurfaceVariant;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      hitSlop={4}
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? {backgroundColor: roles.primaryContainer, borderColor: roles.primaryContainer}
          : {borderColor: roles.outline},
      ]}>
      <MaterialDesignIcons color={foreground} name={icon} size={18} />
      <AwaText color={foreground} emphasized={active} variant="labelLarge">{label}</AwaText>
    </Pressable>
  );
}

function CategoryChipsBar({categories, selectedId, onSelect, onPressMore}: Props): React.JSX.Element {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}>
      <Chip active={selectedId === 'all'} icon="view-grid-outline" label="Tous" onPress={() => onSelect('all')} />
      {categories.map(category => (
        <Chip
          active={selectedId === category.id}
          icon={category.icon}
          key={category.id}
          label={category.label}
          onPress={() => onSelect(category.id)}
        />
      ))}
      <Chip active={false} icon="dots-horizontal" label="Plus" onPress={onPressMore} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {marginTop: 16},
  content: {paddingHorizontal: 16, gap: 8, paddingBottom: 4},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
});

export default memo(CategoryChipsBar);
