import React, {memo, useMemo} from 'react';
import {Pressable, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeRadii} from './homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// PHASE D1 — `item.iconColor`/`item.iconBg` are supplied by CycleHomeScreen
// (the caller): SEMANTIC for period/fertile/ovulation, decorative brand
// purple for the generic "average length" tile — this component never owns
// or recolors them, exactly like QuickActionsGrid's own props in Phase C.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type OverviewItem = {
  key: string;
  icon: IconName;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  subtitle: string;
};

type Props = {
  items: OverviewItem[];
  onPressMore?: () => void;
};

function OverviewColumn({
  item,
  compact,
  styles,
}: {
  item: OverviewItem;
  compact: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.column, compact ? styles.columnCompact : styles.columnWide]}>
      <View style={[styles.iconCircle, {backgroundColor: item.iconBg}]}>
        <MaterialDesignIcons color={item.iconColor} name={item.icon} size={17} />
      </View>
      <Text numberOfLines={2} style={styles.label}>{item.label}</Text>
      <Text numberOfLines={2} style={styles.value}>{item.value}</Text>
      <Text numberOfLines={2} style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}

function CycleOverviewCard({items, onPressMore}: Props): React.JSX.Element {
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Aperçu de ton cycle</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPressMore}
          style={({pressed}) => pressed && styles.pressed}>
          <Text style={styles.more}>Voir plus</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {items.map(item => (
          <OverviewColumn compact={compact} item={item} key={item.key} styles={styles} />
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 16,
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    title: {color: theme.colors.text, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
    more: {color: theme.colors.primary, fontSize: 12.5, fontWeight: '700'},
    row: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
    column: {alignItems: 'center', paddingHorizontal: 3},
    columnWide: {flexBasis: '20%', flexGrow: 1},
    columnCompact: {flexBasis: '42%', flexGrow: 1},
    iconCircle: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
    },
    label: {marginTop: 7, color: theme.colors.textSecondary, fontSize: 10, textAlign: 'center'},
    value: {marginTop: 3, color: theme.colors.text, fontSize: 12.5, fontWeight: '700', textAlign: 'center'},
    subtitle: {marginTop: 1, color: theme.colors.textSecondary, fontSize: 9.5, textAlign: 'center'},
    pressed: {opacity: 0.7},
  });
}

export default memo(CycleOverviewCard);
