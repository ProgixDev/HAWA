import React, {useMemo} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {AwaText} from '../ui/AwaText';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {dateFormatLocale} from '../../utils/cycleMath';

type Props = {
  /** The line shown between the arrows (the date, with "Jour N du cycle" when there is one). */
  label: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** The days the arrows lead to: their date is the accessibility label (no extra translation needed). */
  previousDay: Date;
  nextDay: Date;
};

const spoken = (date: Date) =>
  new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long', day: 'numeric', month: 'long'}).format(date);

/** "‹ mercredi 4 nov ›": steps the journal entry to the previous / next day (never beyond today). Shared by the daily journal screens. */
export function JournalDaySwitcher({label, canGoPrevious, canGoNext, onPrevious, onNext, previousDay, nextDay}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
        arrow: {width: 28, height: 28, alignItems: 'center', justifyContent: 'center'},
        label: {flexShrink: 1, textAlign: 'center'},
      }),
    [],
  );
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel={spoken(previousDay)}
        accessibilityRole="button"
        disabled={!canGoPrevious}
        hitSlop={8}
        onPress={onPrevious}
        style={[styles.arrow, !canGoPrevious && {opacity: 0.3}]}>
        <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={20} />
      </Pressable>
      <AwaText colorRole="onSurfaceVariant" numberOfLines={1} style={styles.label} variant="bodySmall">
        {label}
      </AwaText>
      <Pressable
        accessibilityLabel={spoken(nextDay)}
        accessibilityRole="button"
        disabled={!canGoNext}
        hitSlop={8}
        onPress={onNext}
        style={[styles.arrow, !canGoNext && {opacity: 0.3}]}>
        <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={20} />
      </Pressable>
    </View>
  );
}
