import React, {memo, useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet} from 'react-native';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';

export type CalendarFilterChip = {key: string; label: string};

type Props = {
  chips: CalendarFilterChip[];
  /** Keys currently chosen. Empty = no filter: the calendar shows every category. */
  selected: ReadonlySet<string>;
  onToggle: (key: string) => void;
};

/** The calendar's category filter: one horizontally scrolling row of chips, side by side. A tap selects (or clears) a category, several
 * can be selected at once; with none selected nothing is filtered. Shared by every objective's calendar. */
function CalendarFilterChips({chips, selected, onToggle}: Props): React.JSX.Element | null {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}>
      {chips.map(chip => {
        const active = selected.has(chip.key);

        return (
          <Pressable
            accessibilityLabel={chip.label}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            key={chip.key}
            onPress={() => onToggle(chip.key)}
            style={({pressed}) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
            <AwaText
              color={active ? onPrimaryTextColor(theme) : theme.colors.textSecondary}
              emphasized={active}
              numberOfLines={1}
              variant="labelLarge">
              {chip.label}
            </AwaText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    // the screens pad their content by 16: the row bleeds to the screen edges and scrolls under that padding
    scroll: {flexGrow: 0, marginHorizontal: -16, marginTop: 4, marginBottom: 12},
    row: {gap: 8, paddingHorizontal: 16},
    chip: {
      height: 36,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceSecondary,
    },
    chipActive: {backgroundColor: theme.colors.primary},
    pressed: {opacity: 0.85},
  });
}

export default memo(CalendarFilterChips);
