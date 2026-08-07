import React, {memo} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors} from '../home/homeTheme';

type Props = {
  onPressFilters: () => void;
  onPressLegend: () => void;
};

function CalendarHeader({
  onPressFilters,
  onPressLegend,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const topSpacing = Math.max(insets.top + 6, 16);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topSpacing,
        },
      ]}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>
          Calendrier
        </Text>

        <Text
          numberOfLines={3}
          style={styles.subtitle}>
          Suis ton cycle en toute simplicité ✨
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Filtres"
          accessibilityRole="button"
          onPress={onPressFilters}
          style={({pressed}) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={homeColors.primary}
            name="tune-variant"
            size={18}
          />

          <Text
            numberOfLines={1}
            style={styles.actionLabel}>
            Filtres
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Légende"
          accessibilityRole="button"
          onPress={onPressLegend}
          style={({pressed}) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={homeColors.primary}
            name="format-list-bulleted"
            size={18}
          />

          <Text
            numberOfLines={1}
            style={styles.actionLabel}>
            Légende
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  titleBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    paddingTop: 2,
  },

  title: {
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 2,
    color: homeColors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  actions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },

  actionButton: {
    minWidth: 56,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 7,
    paddingHorizontal: 8,
    shadowColor: homeColors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  actionLabel: {
    marginTop: 3,
    color: homeColors.primary,
    fontSize: 9.5,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.97}],
  },
});

export default memo(CalendarHeader);