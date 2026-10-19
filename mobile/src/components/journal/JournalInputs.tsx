import React, {useMemo} from 'react';
import {StyleSheet, Text, type TextInputProps, View} from 'react-native';
import {ChoiceChips} from './JournalScreenLayout';
import {AwaTextField} from '../ui/AwaTextField';
import {awaSpace} from '../../theme/spaceScale';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// Material 3 text field (DESIGN.md): label above, outlined box, every TextInput prop forwarded unchanged.
export function LabeledInput({label, ...props}: TextInputProps & {label: string}) {
  return <AwaTextField label={label} wrapperStyle={labeledInputWrap} {...props} />;
}

const labeledInputWrap = {marginTop: awaSpace.s12};

export function RatingSelector({label, value, onChange}: {label: string; value: number; onChange: (value: number) => void}) {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.wrap}><Text style={styles.label}>{label} : {value}/5</Text><ChoiceChips options={['1', '2', '3', '4', '5']} value={String(value)} onChange={item => onChange(Number(item))} /></View>;
}

export function createJournalInputStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({note: {minHeight: 100, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 16, backgroundColor: theme.colors.surface, padding: 12, color: theme.colors.accent, textAlignVertical: 'top'}});
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({wrap: {marginTop: 10}, label: {marginBottom: 7, color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600'}, input: {minHeight: 48, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.14), borderRadius: 16, backgroundColor: theme.colors.surface, paddingHorizontal: 13, color: theme.colors.accent, fontSize: 14}, multiline: {minHeight: 95, paddingTop: 12, textAlignVertical: 'top'}});
}
