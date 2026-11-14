import React, {memo, useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
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
};

function OverviewColumn({
  item,
  styles,
}: {
  item: OverviewItem;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.column}>
      <View style={[styles.iconCircle, {backgroundColor: item.iconBg}]}>
        <MaterialDesignIcons color={item.iconColor} name={item.icon} size={17} />
      </View>
      <Text style={styles.label}>{item.label}</Text>
      <Text style={styles.value}>{item.value}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );
}

// The four items sit in ONE row that scrolls sideways: every column is wide enough for its label, date range and caption to stay
// on one or two lines (side by side in a 4-column grid they were squeezed into many short lines).
function CycleOverviewCard({items}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <AwaCard style={styles.card}>
      <AwaText style={styles.title} variant="titleMedium">{t('cycleHome.overview.title')}</AwaText>

      <ScrollView
        contentContainerStyle={styles.row}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}>
        {items.map(item => (
          <OverviewColumn item={item} key={item.key} styles={styles} />
        ))}
      </ScrollView>
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {marginTop: 16},
    title: {flexShrink: 1},
    scroll: {marginTop: 14},
    row: {flexDirection: 'row', gap: 12},
    column: {width: 128, alignItems: 'center', paddingHorizontal: 4},
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
