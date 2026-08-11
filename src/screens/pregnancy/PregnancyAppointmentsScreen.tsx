import React from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {JournalScreenLayout, SectionCard} from '../../components/journal/JournalScreenLayout';

export default function PregnancyAppointmentsScreen(): React.JSX.Element {
  return <JournalScreenLayout icon="calendar-clock-outline" onSave={() => Alert.alert('Rendez-vous et examens', 'L’ajout détaillé et les rappels seront disponibles dans une prochaine étape.')} title="Rendez-vous et examens"><SectionCard title="Suivi médical"><View style={styles.empty}><View style={styles.icon}><MaterialDesignIcons color="#6949BE" name="calendar-blank-outline" size={35} /></View><Text style={styles.title}>Aucun rendez-vous enregistré</Text><Text style={styles.text}>Tu pourras bientôt ajouter ici tes rendez-vous, examens et rappels, sans information fictive.</Text></View></SectionCard></JournalScreenLayout>;
}
const styles = StyleSheet.create({empty: {alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12}, icon: {width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#EEE6FA'}, title: {marginTop: 13, color: '#28166F', fontSize: 15, fontWeight: '800', textAlign: 'center'}, text: {marginTop: 7, color: '#675C94', fontSize: 12, lineHeight: 18, textAlign: 'center'}});
