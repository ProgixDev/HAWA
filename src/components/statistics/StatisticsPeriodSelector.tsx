import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeShadow} from '../home/homeTheme';
import {STATISTICS_PERIODS, isPeriodFree} from '../../utils/cycleStatisticsMath';
import type {StatisticsPeriod} from '../../utils/cycleStatisticsMath';

// Shared across every objective's Statistics screen — the Freemium TIME
// architecture (1 mois Free / 3-6-12 mois Premium, tapping a locked period
// opens the paywall without switching the active period) is identical for
// all 8 objectives; only what each screen calculates and displays for the
// selected period differs. Keep this component free of any
// objective-specific semantics.

export const STATISTICS_PERIOD_LABELS: Record<StatisticsPeriod, string> = {
  '1': '1 mois',
  '3': '3 mois',
  '6': '6 mois',
  '12': '12 mois',
};

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
  return (
    <View style={styles.filters}>
      {STATISTICS_PERIODS.map(item => {
        const active = period === item;
        const locked = !isPeriodFree(item) && !isPremium;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            key={item}
            onPress={() => (locked ? onRequestPremium() : onSelectPeriod(item))}
            style={[styles.filterButton, active && styles.filterButtonActive]}>
            <View style={styles.filterButtonContent}>
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {STATISTICS_PERIOD_LABELS[item]}
              </Text>

              {locked ? (
                <MaterialDesignIcons color={homeColors.textSecondary} name="lock-outline" size={10} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.05)',
    borderRadius: 17,
    backgroundColor: '#EEE8F5',
  },

  filterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    borderRadius: 13,
  },

  filterButtonActive: {
    ...homeShadow,
    backgroundColor: '#FFFFFF',
  },

  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  filterText: {
    color: homeColors.textSecondary,
    fontSize: 10.5,
    fontWeight: '700',
  },

  filterTextActive: {
    color: homeColors.primary,
    fontWeight: '800',
  },
});

export default StatisticsPeriodSelector;
