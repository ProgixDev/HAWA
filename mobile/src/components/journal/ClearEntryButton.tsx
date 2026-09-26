import React, {useMemo} from 'react';
import {Alert, Pressable, StyleSheet, Text} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// M25 - shared "Effacer cette saisie" action for journal entry screens whose
// saved value could not be removed once written. It only asks for a
// confirmation; the caller persists the canonical empty state (the section is
// removed from that day's entry via deleteJournalSection - every
// DailyJournalEntry section is optional, so "absent" already is the empty
// state) and refreshes its own screen. Rendered only when a saved value
// exists for the day.

type Props = {
  /** Called only after the user confirms. */
  onConfirm: () => void | Promise<void>;
  /** What is being cleared, for the confirmation copy (e.g. "cette température"). */
  subject: string;
};

export function ClearEntryButton({onConfirm, subject}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const ask = () => {
    Alert.alert(
      'Effacer cette saisie ?',
      `Tu vas supprimer ${subject} enregistrée pour ce jour. Cette action est définitive.`,
      [
        {text: 'Annuler', style: 'cancel'},
        {text: 'Effacer', style: 'destructive', onPress: () => {onConfirm();}},
      ],
    );
  };

  return (
    <Pressable
      accessibilityLabel="Effacer cette saisie"
      accessibilityRole="button"
      onPress={ask}
      style={({pressed}) => [styles.button, pressed && styles.pressed]}>
      <MaterialDesignIcons color={theme.colors.danger} name="trash-can-outline" size={18} />
      <Text style={styles.text}>Effacer cette saisie</Text>
    </Pressable>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    button: {
      minHeight: 44,
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.35),
      paddingHorizontal: 16,
    },
    pressed: {opacity: 0.75},
    text: {marginLeft: 8, color: theme.colors.danger, fontSize: 14, fontWeight: '700'},
  });
}
