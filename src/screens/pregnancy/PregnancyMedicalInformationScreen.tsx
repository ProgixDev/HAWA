import React, {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {JournalScreenLayout, SectionCard} from '../../components/journal/JournalScreenLayout';
import {LabeledInput} from '../../components/journal/JournalInputs';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getPregnancyJournalState, savePregnancyMedicalInformation} from '../../state/pregnancyJournalStore';

export default function PregnancyMedicalInformationScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [note, setNote] = useState(''); const [date, setDate] = useState(''); const [error, setError] = useState('');
  useEffect(() => {getPregnancyJournalState().then(state => {setNote(state.medicalInformation?.note ?? ''); setDate(state.medicalInformation?.date ?? '');});}, []);
  const save = async () => {if (!note.trim()) {setError('Ajoute une information avant d’enregistrer.'); return;} await savePregnancyMedicalInformation({note: note.trim(), date: date.trim() || undefined, updatedAt: new Date().toISOString()}); Alert.alert('Informations médicales', 'Les informations ont été enregistrées sur cet appareil.'); navigation.goBack();};
  return <JournalScreenLayout error={error} icon="shield-lock-outline" onSave={save} title="Informations médicales"><SectionCard title="Espace personnel et privé"><LabeledInput label="Date optionnelle" onChangeText={setDate} placeholder="JJ/MM/AAAA" value={date} /><LabeledInput label="Note médicale personnelle" multiline onChangeText={text => {setNote(text); setError('');}} placeholder="Écris uniquement les informations que tu souhaites conserver." value={note} /></SectionCard></JournalScreenLayout>;
}
