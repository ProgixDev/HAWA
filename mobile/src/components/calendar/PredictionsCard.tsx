import React, {memo, useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {CycleRegularity} from '../../state/onboardingPreferences';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type PredictionItem = {key: string; icon: IconName; label: string; value: string; subtitle: string};

type Props = {
  items: PredictionItem[];
  regularity: CycleRegularity;
};

function createConfidence(theme: ResolvedAwaTheme): Record<CycleRegularity, {label: string; color: string; bg: string}> {
  return {
    yes: {label: 'Fiabilité élevée', color: theme.colors.success, bg: withAlpha(theme.colors.success, 0.16)},
    no: {label: 'Fiabilité modérée', color: theme.colors.warning, bg: withAlpha(theme.colors.warning, 0.16)},
    unknown: {label: 'Fiabilité limitée', color: theme.colors.textSecondary, bg: theme.colors.primarySoft},
  };
}

function PredictionsCard({items, regularity}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const confidence = useMemo(() => createConfidence(theme), [theme])[regularity];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Prédictions personnalisées</Text>
        <View style={[styles.confidenceBadge, {backgroundColor: confidence.bg}]}>
          <Text numberOfLines={1} style={[styles.confidenceText, {color: confidence.color}]}>{confidence.label}</Text>
        </View>
      </View>

      <View style={styles.row}>
        {items.map(item => (
          <View key={item.key} style={styles.column}>
            <View style={styles.iconCircle}>
              <MaterialDesignIcons color={theme.colors.primary} name={item.icon} size={17} />
            </View>
            <Text numberOfLines={2} style={styles.label}>{item.label}</Text>
            <Text numberOfLines={2} style={styles.value}>{item.value}</Text>
            <Text numberOfLines={2} style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </View>

      <View style={styles.captionRow}>
        <MaterialDesignIcons color={theme.colors.textSecondary} name="information-outline" size={14} />
        <Text style={styles.caption}>Prédictions calculées à partir de tes cycles enregistrés.</Text>
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
    header: {flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8},
    title: {flexShrink: 1, color: theme.colors.text, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    confidenceBadge: {borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5},
    confidenceText: {fontSize: 10.5, fontWeight: '700'},
    row: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, gap: 12},
    column: {flexBasis: '42%', flexGrow: 1, alignItems: 'center'},
    iconCircle: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: theme.colors.primarySoft},
    label: {marginTop: 7, color: theme.colors.textSecondary, fontSize: 10, textAlign: 'center'},
    value: {marginTop: 3, color: theme.colors.text, fontSize: 12.5, fontWeight: '700', textAlign: 'center'},
    subtitle: {marginTop: 1, color: theme.colors.textSecondary, fontSize: 9.5, textAlign: 'center'},
    captionRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 14},
    caption: {flex: 1, color: theme.colors.textSecondary, fontSize: 10.5, lineHeight: 14},
  });
}

export default memo(PredictionsCard);
