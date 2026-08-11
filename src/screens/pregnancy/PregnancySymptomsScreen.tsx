import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {ChoiceChips, JournalScreenLayout, SectionCard} from '../../components/journal/JournalScreenLayout';
import {LabeledInput} from '../../components/journal/JournalInputs';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {savePregnancySymptoms} from '../../state/pregnancyJournalStore';

const SYMPTOMS = ['Nausées', 'Fatigue', 'Sensibilité des seins', 'Ballonnements', 'Maux de tête', 'Reflux / brûlures d’estomac', 'Douleurs lombaires', 'Constipation', 'Crampes légères', 'Essoufflement', 'Gonflement', 'Vertiges', 'Troubles du sommeil'];

export default function PregnancySymptomsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const toggle = (value: string) => setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  const save = async () => {
    const date = new Date().toLocaleDateString('en-CA');
    await savePregnancySymptoms({date, symptoms: selected, note: note.trim() || undefined, updatedAt: new Date().toISOString()});
    Alert.alert('Journal grossesse', 'Tes symptômes ont été enregistrés.');
    navigation.goBack();
  };
  return <JournalScreenLayout icon="heart-pulse" onSave={save} title="Symptômes"><SectionCard title="Ce que tu ressens"><ChoiceChips multiple onChange={toggle} options={SYMPTOMS} values={selected} /></SectionCard><SectionCard title="Observation optionnelle"><LabeledInput label="Note personnelle" multiline onChangeText={setNote} value={note} /></SectionCard></JournalScreenLayout>;
}
