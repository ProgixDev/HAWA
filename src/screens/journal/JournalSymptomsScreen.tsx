import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {ChoiceChips, JournalScreenLayout, SectionCard} from '../../components/journal/JournalScreenLayout';
import {LabeledInput} from '../../components/journal/JournalInputs';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import type {SymptomSeverity} from '../../types/journal';

const symptoms = ['Douleurs menstruelles', 'Crampes', 'Maux de tête', 'Migraines', 'Fatigue', 'Ballonnements', 'Nausées', 'Seins sensibles', 'Acné', 'Douleurs lombaires', 'Douleurs musculaires', 'Constipation', 'Diarrhée', 'Pertes', 'Autre'];
const severityMap: Record<string, SymptomSeverity> = {'Légère': 'mild', 'Modérée': 'moderate', 'Forte': 'severe'};

export default function JournalSymptomsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>(); const [selected, setSelected] = useState<string[]>([]); const [severity, setSeverity] = useState('Légère'); const [location, setLocation] = useState('Bas ventre'); const [note, setNote] = useState(''); const [saving, setSaving] = useState(false);
  const toggle = (item: string) => setSelected(value => value.includes(item) ? value.filter(entry => entry !== item) : [...value, item]);
  const save = async () => {setSaving(true); await saveJournalSection(new Date().toLocaleDateString('en-CA'), 'symptoms', {names: selected, severity: severityMap[severity], painLocation: location, note}); setSaving(false); Alert.alert('Journal', 'Tes symptômes ont été enregistrés.'); navigation.goBack();};
  return <JournalScreenLayout icon="heart-pulse" onSave={save} saving={saving} title="Symptômes"><SectionCard title="Symptômes ressentis"><ChoiceChips multiple onChange={toggle} options={symptoms} values={selected} /></SectionCard>{selected.length ? <SectionCard title="Intensité et localisation"><ChoiceChips onChange={setSeverity} options={Object.keys(severityMap)} value={severity} /><ChoiceChips onChange={setLocation} options={['Bas ventre', 'Dos', 'Tête', 'Seins', 'Corps entier']} value={location} /></SectionCard> : null}<SectionCard title="Notes supplémentaires"><LabeledInput label="Commentaire optionnel" multiline onChangeText={setNote} value={note} /></SectionCard></JournalScreenLayout>;
}
