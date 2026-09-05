import React, {memo, useEffect, useRef} from 'react';
import {Animated, Pressable, ScrollView, StyleSheet, Text} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors} from '../home/homeTheme';
import type {IconName, LibraryCategory, LibraryCategoryId} from '../../data/libraryContent';

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

function Chip({label, icon, active, onPress}: ChipProps) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {toValue: active ? 1 : 0, damping: 16, stiffness: 220, useNativeDriver: false}).start();
  }, [active, progress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={({pressed}) => [pressed && styles.pressed]}>
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['#FFFFFF', homeColors.primary],
            }),
            borderColor: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [homeColors.cardBorder, homeColors.primary],
            }),
            transform: [{scale: progress.interpolate({inputRange: [0, 1], outputRange: [1, 1.04]})}],
          },
        ]}>
        <Animated.View
          style={[
            styles.chipIconWrap,
            {
              backgroundColor: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [homeColors.lightLavender, 'rgba(255,255,255,0.22)'],
              }),
            },
          ]}>
          <MaterialDesignIcons color={active ? '#FFFFFF' : homeColors.primary} name={icon} size={17} />
        </Animated.View>
        <Text numberOfLines={1} style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
      </Animated.View>
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
  content: {paddingHorizontal: 16, gap: 9, paddingBottom: 2},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.4,
    paddingHorizontal: 12,
    paddingRight: 16,
  },
  chipIconWrap: {width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center'},
  chipLabel: {color: homeColors.textPrimary, fontSize: 12.5, fontWeight: '700'},
  chipLabelActive: {color: '#FFFFFF'},
  pressed: {opacity: 0.9},
});

export default memo(CategoryChipsBar);
