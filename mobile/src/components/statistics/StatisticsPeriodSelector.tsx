import React, {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {STATISTICS_PERIODS, isPeriodFree} from '../../utils/cycleStatisticsMath';
import type {StatisticsPeriod} from '../../utils/cycleStatisticsMath';

// Shared across every objective's Statistics screen — the Freemium TIME
// architecture (1 mois Free / 3-6-12 mois Premium, tapping a locked period
// opens the paywall without switching the active period) is identical for
// all 8 objectives; only what each screen calculates and displays for the
// selected period differs. Keep this component free of any
// objective-specific semantics.
//
// PHASE C — purely decorative chrome, no entitlement/period logic touched.
// isPeriodFree()/isPremium/onSelectPeriod/onRequestPremium are unchanged.

/** Localized "1 month" / "3 months"… — same keys the cycle StatisticsScreen already uses (statistics.periods.months_*). */
export const statisticsPeriodLabel = (period: StatisticsPeriod, t: (key: string, options?: Record<string, unknown>) => string): string =>
  t('statistics.periods.months', {count: Number(period)});

export type StatisticsPeriodSelectorProps = {
  period: StatisticsPeriod;
  isPremium: boolean;
  onSelectPeriod: (period: StatisticsPeriod) => void;
  onRequestPremium: () => void;
};

function StatisticsPeriodSelector({
  period,
  isPremium,
  onSelectPeriod,
  onRequestPremium,
}: StatisticsPeriodSelectorProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.filters}>
      {STATISTICS_PERIODS.map(item => {
        const active = period === item;
        const locked = !isPeriodFree(item) && !isPremium;
        const label = statisticsPeriodLabel(item, t as never);

        return (
          <Pressable
            accessibilityLabel={
              locked ? t('statistics.periodRequiresPremium', {period: label}) : label
            }
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            key={item}
            onPress={() => (locked ? onRequestPremium() : onSelectPeriod(item))}
            style={[styles.filterButton, active && styles.filterButtonActive]}>
            <View style={styles.filterButtonContent}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {label}
              </Text>

              {locked ? (
                <MaterialDesignIcons color={theme.colors.textMuted} name="lock-outline" size={10} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    filters: {
      flexDirection: 'row',
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 17,
      backgroundColor: theme.colors.surfaceSecondary,
    },

    filterButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
      borderRadius: 13,
    },

    filterButtonActive: {
      ...theme.shadow,
      backgroundColor: theme.colors.surface,
    },

    filterButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    filterText: {
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      fontWeight: '700',
    },

    filterTextActive: {
      color: theme.colors.primary,
      fontWeight: '800',
    },
  });
}

export default StatisticsPeriodSelector;
