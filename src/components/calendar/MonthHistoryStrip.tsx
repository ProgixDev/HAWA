import React, {memo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import {capitalize, sameDay} from '../../utils/cycleMath';
import type {PeriodHistoryRecord} from '../../state/onboardingPreferences';

type Props = {
  visibleMonth: Date;
  monthsBack?: number;
  onSelectMonth: (month: Date) => void;
  periodHistory?: PeriodHistoryRecord[];
};

function MonthHistoryStrip({visibleMonth, monthsBack = 8, onSelectMonth, periodHistory = []}: Props): React.JSX.Element {
  const now = new Date();
  const months = Array.from({length: monthsBack}, (_, index) =>
    new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - index), 1),
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Historique des mois</Text>

      <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>
        {months.map(month => {
          const active = sameDay(month, new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1));
          const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
          const record = periodHistory.find(item => item.startDate.startsWith(monthPrefix));
          const range = record ? `${Number(record.startDate.slice(-2))}–${Number(record.endDate.slice(-2))}` : undefined;
          return (
            <Pressable
              accessibilityRole="button"
              key={month.toISOString()}
              onPress={() => onSelectMonth(month)}
              style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextActive]}>
                {capitalize(new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(month))}
              </Text>
              {range ? <Text style={[styles.rangeText, active && styles.rangeTextActive]}>Règles {range}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingLeft: 16,
    ...homeShadow,
  },
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  row: {flexDirection: 'row', gap: 8, marginTop: 12, paddingRight: 16},
  chip: {
    borderRadius: homeRadii.button,
    borderWidth: 1,
    borderColor: homeColors.cardBorder,
    backgroundColor: homeColors.lightLavender,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {backgroundColor: homeColors.primary, borderColor: homeColors.primary},
  chipText: {color: homeColors.textPrimary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize'},
  chipTextActive: {color: '#FFFFFF'},
  rangeText: {marginTop: 3, color: homeColors.textSecondary, fontSize: 9.5, fontWeight: '600'},
  rangeTextActive: {color: '#F2ECFF'},
  pressed: {opacity: 0.8},
});

export default memo(MonthHistoryStrip);
