import React, {memo, useMemo} from 'react';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaButton} from '../ui/AwaButton';
import {AwaCard} from '../ui/AwaCard';
import {AwaText} from '../ui/AwaText';
import '../../i18n';
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
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{item.value}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}

function CycleOverviewCard({items, onPressMore}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AwaCard style={styles.card}>
      <View style={styles.header}>
        <AwaText style={styles.title} variant="titleMedium">{t('cycleHome.overview.title')}</AwaText>
        {/* Only rendered when there is somewhere to go — never a link that
            looks tappable but does nothing. */}
        {onPressMore ? (
          <AwaButton
            hitSlop={8}
            label={t('cycleHome.overview.seeMore')}
            onPress={onPressMore}
            size="compact"
            variant="text"
          />
        ) : null}
      </View>

      <View style={styles.row}>
        {items.map(item => (
          <OverviewColumn compact={compact} item={item} key={item.key} styles={styles} />
        ))}
      </View>
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {marginTop: 16},
    header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    title: {flexShrink: 1},
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
    label: {marginTop: 7, color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center'},
    value: {marginTop: 3, color: theme.colors.text, fontSize: 12.5, fontWeight: '700', textAlign: 'center'},
    subtitle: {marginTop: 1, color: theme.colors.textSecondary, fontSize: 11, textAlign: 'center'},
  });
}

export default memo(CycleOverviewCard);
