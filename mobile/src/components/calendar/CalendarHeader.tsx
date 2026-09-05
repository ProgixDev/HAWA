import React, {memo, useMemo} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type Props = {
  onPressFilters: () => void;
  onPressLegend: () => void;
};

function CalendarHeader({
  onPressFilters,
  onPressLegend,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
            color={theme.colors.primary}
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
            color={theme.colors.primary}
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

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
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
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 24,
      fontWeight: '700',
    },

    subtitle: {
      marginTop: 2,
      color: theme.colors.textSecondary,
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
      backgroundColor: withAlpha(theme.colors.surface, 0.85),
      paddingVertical: 7,
      paddingHorizontal: 8,
      shadowColor: theme.shadow.shadowColor,
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
      color: theme.colors.primary,
      fontSize: 9.5,
      fontWeight: '700',
    },

    pressed: {
      opacity: 0.8,
      transform: [{scale: 0.97}],
    },
  });
}

export default memo(CalendarHeader);
