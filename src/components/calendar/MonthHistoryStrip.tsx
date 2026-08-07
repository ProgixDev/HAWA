import React, {memo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import {capitalize, sameDay} from '../../utils/cycleMath';

type Props = {
  visibleMonth: Date;
  monthsBack?: number;
  onSelectMonth: (month: Date) => void;
};

function MonthHistoryStrip({visibleMonth, monthsBack = 8, onSelectMonth}: Props): React.JSX.Element {
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
          return (
            <Pressable
              accessibilityRole="button"
              key={month.toISOString()}
              onPress={() => onSelectMonth(month)}
              style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
              <Text numberOfLines={1} style={[styles.chipText, active && styles.chipTextActive]}>
                {capitalize(new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric'}).format(month))}
              </Text>
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
  pressed: {opacity: 0.8},
});

export default memo(MonthHistoryStrip);
