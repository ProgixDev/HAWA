import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {JournalScreenLayout, SectionCard} from '../../components/journal/JournalScreenLayout';
import {LabeledInput} from '../../components/journal/JournalInputs';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {savePregnancyWeight} from '../../state/pregnancyJournalStore';

export default function PregnancyWeightScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const save = async () => {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 500) {setError('Saisis un poids valide en kg.'); return;}
    await savePregnancyWeight({date: new Date().toLocaleDateString('en-CA'), valueKg: parsed, updatedAt: new Date().toISOString()});
    Alert.alert('Journal grossesse', 'Le poids a été enregistré.'); navigation.goBack();
  };
  return <JournalScreenLayout error={error} icon="scale-bathroom" onSave={save} title="Poids"><SectionCard title="Mesure du jour"><LabeledInput keyboardType="decimal-pad" label="Poids actuel (kg)" onChangeText={text => {setValue(text); setError('');}} placeholder="Ex. 62,5" value={value} /></SectionCard></JournalScreenLayout>;
}
