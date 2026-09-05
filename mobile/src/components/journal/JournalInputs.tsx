import React, {useMemo} from 'react';
import {StyleSheet, Text, TextInput, type TextInputProps, View} from 'react-native';
import {ChoiceChips} from './JournalScreenLayout';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

export function LabeledInput({label, ...props}: TextInputProps & {label: string}) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.wrap}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={theme.colors.textSecondary} style={[styles.input, props.multiline && styles.multiline]} {...props} /></View>;
}

export function RatingSelector({label, value, onChange}: {label: string; value: number; onChange: (value: number) => void}) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.wrap}><Text style={styles.label}>{label} : {value}/5</Text><ChoiceChips options={['1', '2', '3', '4', '5']} value={String(value)} onChange={item => onChange(Number(item))} /></View>;
}

export function createJournalInputStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({note: {minHeight: 100, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 16, backgroundColor: theme.colors.surface, padding: 12, color: theme.colors.accent, textAlignVertical: 'top'}});
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({wrap: {marginTop: 10}, label: {marginBottom: 7, color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600'}, input: {minHeight: 48, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 15, backgroundColor: theme.colors.surface, paddingHorizontal: 13, color: theme.colors.accent, fontSize: 14}, multiline: {minHeight: 95, paddingTop: 12, textAlignVertical: 'top'}});
}
