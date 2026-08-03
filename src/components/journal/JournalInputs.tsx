import React from 'react';
import {StyleSheet, Text, TextInput, type TextInputProps, View} from 'react-native';
import {ChoiceChips} from './JournalScreenLayout';

export function LabeledInput({label, ...props}: TextInputProps & {label: string}) {return <View style={styles.wrap}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#9AA39E" style={[styles.input, props.multiline && styles.multiline]} {...props} /></View>;}

export function RatingSelector({label, value, onChange}: {label: string; value: number; onChange: (value: number) => void}) {return <View style={styles.wrap}><Text style={styles.label}>{label} : {value}/5</Text><ChoiceChips options={['1', '2', '3', '4', '5']} value={String(value)} onChange={item => onChange(Number(item))} /></View>;}

export const journalInputStyles = StyleSheet.create({note: {minHeight: 100, borderWidth: 1, borderColor: '#DDE5DC', borderRadius: 16, backgroundColor: '#FBFAF6', padding: 12, color: '#173D30', textAlignVertical: 'top'}});

const styles = StyleSheet.create({wrap: {marginTop: 10}, label: {marginBottom: 7, color: '#40564D', fontSize: 13, fontWeight: '600'}, input: {minHeight: 48, borderWidth: 1, borderColor: '#DDE5DC', borderRadius: 15, backgroundColor: '#FBFAF6', paddingHorizontal: 13, color: '#173D30', fontSize: 14}, multiline: {minHeight: 95, paddingTop: 12, textAlignVertical: 'top'}});
