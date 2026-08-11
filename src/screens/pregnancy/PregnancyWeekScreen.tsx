import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {JournalScreenLayout, SectionCard} from '../../components/journal/JournalScreenLayout';
import {MOCK_PREGNANCY} from '../../data/mockPregnancy';

export default function PregnancyWeekScreen(): React.JSX.Element {
  return <JournalScreenLayout icon="calendar-week-outline" onSave={() => {}} title={`Semaine ${MOCK_PREGNANCY.week}`}><SectionCard title="Cette semaine"><View style={styles.empty}><View style={styles.icon}><MaterialDesignIcons color="#6949BE" name="calendar-heart" size={36} /></View><Text style={styles.text}>Le contenu détaillé sera ajouté dans une prochaine étape.</Text></View></SectionCard></JournalScreenLayout>;
}
const styles = StyleSheet.create({empty: {alignItems: 'center', paddingVertical: 30}, icon: {width: 70, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#EEE6FA'}, text: {maxWidth: 270, marginTop: 14, color: '#675C94', fontSize: 13, lineHeight: 19, textAlign: 'center'}});
