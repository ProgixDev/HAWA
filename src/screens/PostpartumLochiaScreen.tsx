import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing} from '../theme/spacing';
import {
  getPostpartumLochiaEntry,
  hydratePostpartumLochia,
  savePostpartumLochiaEntry,
} from '../state/postpartumLochiaStore';

const BACKGROUND = require('../assets/images/school-selection-background.png');

const PURPLE = '#6B4BC4';
const PURPLE_DARK = '#2F1B73';
const PURPLE_SOFT = '#F3ECFD';
const PURPLE_BORDER = 'rgba(107,75,196,0.20)';
const TEXT_SECONDARY = '#6E628D';
const CARD = 'rgba(255,253,255,0.94)';

type Props = NativeStackScreenProps<RootStackParamList, 'PostpartumLochia'>;
type Flow = 'Très léger' | 'Léger' | 'Modéré' | 'Abondant';
type LochiaColor = 'Rouge vif' | 'Rouge' | 'Rose' | 'Brun' | 'Jaune / blanc';
type Consistency = 'Liquide' | 'Épais' | 'Avec petits caillots';

const flowOptions: Array<{label: Flow; icon: string}> = [
  {label: 'Très léger', icon: 'water-outline'},
  {label: 'Léger', icon: 'water'},
  {label: 'Modéré', icon: 'water'},
  {label: 'Abondant', icon: 'water'},
];

const colorOptions: Array<{label: LochiaColor; color: string}> = [
  {label: 'Rouge vif', color: '#D8334A'},
  {label: 'Rouge', color: '#E76578'},
  {label: 'Rose', color: '#F4A5C3'},
  {label: 'Brun', color: '#A87867'},
  {label: 'Jaune / blanc', color: '#F2D6B3'},
];

const consistencyOptions: Consistency[] = ['Liquide', 'Épais', 'Avec petits caillots'];
const symptomOptions = ['Aucun', 'Crampes', 'Fatigue', 'Maux de tête', 'Sensibilité', 'Autres'] as const;

function PostpartumLochiaScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [flow, setFlow] = useState<Flow>('Léger');
  const [color, setColor] = useState<LochiaColor>('Rose');
  const [consistency, setConsistency] = useState<Consistency>('Épais');
  const [symptoms, setSymptoms] = useState<string[]>(['Aucun']);
  const [note, setNote] = useState('');
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  useEffect(() => {
    let active = true;
    hydratePostpartumLochia().then(() => {
      if (!active) {return;}
      const entry = getPostpartumLochiaEntry(todayKey);
      if (!entry) {return;}
      setFlow(entry.flow);
      setColor(entry.color);
      setConsistency(entry.consistency);
      setSymptoms(entry.symptoms);
      setNote(entry.note ?? '');
    });
    return () => {active = false;};
  }, [todayKey]);

  const save = () => {
    savePostpartumLochiaEntry(todayKey, {flow, color, consistency, symptoms, note: note.trim() || undefined});
    Alert.alert('Lochies', 'Tes observations du jour ont été enregistrées.');
  };

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  );

  const toggleSymptom = (value: string) => {
    setSymptoms(current => {
      if (value === 'Aucun') {
        return ['Aucun'];
      }
      const withoutNone = current.filter(item => item !== 'Aucun');
      if (withoutNone.includes(value)) {
        const next = withoutNone.filter(item => item !== value);
        return next.length ? next : ['Aucun'];
      }
      return [...withoutNone, value];
    });
  };

  return (
    <ImageBackground resizeMode="cover" source={BACKGROUND} style={styles.background}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
        <View style={styles.page}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Retour" hitSlop={12} onPress={navigation.goBack} style={styles.backButton}>
              <MaterialDesignIcons color={PURPLE_DARK} name="arrow-left" size={24} />
            </Pressable>
            <Text style={styles.headerTitle}>Lochies</Text>
            <View style={styles.infoButton}>
              <MaterialDesignIcons color={PURPLE} name="information-outline" size={20} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, {paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.dateCard}>
              <View>
                <Text style={styles.dateEyebrow}>AUJOURD'HUI</Text>
                <Text style={styles.dateText}>{todayLabel}</Text>
              </View>
              <View style={styles.calendarIcon}>
                <MaterialDesignIcons color={PURPLE} name="calendar-month-outline" size={20} />
              </View>
            </View>

            <Section title="Flux">
              <View style={styles.flowRow}>
                {flowOptions.map(item => {
                  const selected = flow === item.label;
                  return (
                    <Pressable key={item.label} onPress={() => setFlow(item.label)} style={[styles.flowOption, selected && styles.selectedBox]}>
                      <View style={[styles.flowIconCircle, selected && styles.flowIconCircleSelected]}>
                        <MaterialDesignIcons color={selected ? PURPLE : '#85799F'} name={item.icon as never} size={21} />
                      </View>
                      <Text style={[styles.flowLabel, selected && styles.selectedText]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Couleur">
              <View style={styles.colorRow}>
                {colorOptions.map(item => {
                  const selected = color === item.label;
                  return (
                    <Pressable key={item.label} onPress={() => setColor(item.label)} style={styles.colorOption}>
                      <View style={[styles.colorOuter, selected && styles.colorOuterSelected]}>
                        <View style={[styles.colorDot, {backgroundColor: item.color}]} />
                      </View>
                      <Text numberOfLines={2} style={[styles.colorLabel, selected && styles.selectedText]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Consistance">
              <View style={styles.consistencyRow}>
                {consistencyOptions.map(item => {
                  const selected = consistency === item;
                  return (
                    <Pressable key={item} onPress={() => setConsistency(item)} style={[styles.consistencyChip, selected && styles.selectedBox]}>
                      <Text style={[styles.consistencyText, selected && styles.selectedText]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Symptômes associés">
              <View style={styles.symptomWrap}>
                {symptomOptions.map(item => {
                  const selected = symptoms.includes(item);
                  return (
                    <Pressable key={item} onPress={() => toggleSymptom(item)} style={[styles.symptomChip, selected && styles.selectedBox]}>
                      <Text style={[styles.symptomText, selected && styles.selectedText]}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Notes">
              <View style={styles.noteBox}>
                <TextInput
                  maxLength={300}
                  multiline
                  onChangeText={setNote}
                  placeholder="Ajoute une note si tu le souhaites..."
                  placeholderTextColor="#A49AB7"
                  style={styles.noteInput}
                  textAlignVertical="top"
                  value={note}
                />
                <Text style={styles.counter}>{note.length} / 300</Text>
              </View>
            </Section>

            <View style={styles.reassurance}>
              <MaterialDesignIcons color={PURPLE} name="heart-outline" size={18} />
              <Text style={styles.reassuranceText}>
                Observe simplement l’évolution jour après jour. Chaque corps récupère à son propre rythme.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={save}
              style={({pressed}) => [styles.saveButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color="#FFFFFF" name="content-save-outline" size={20} />
              <Text style={styles.saveText}>Enregistrer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1, backgroundColor: 'transparent'},
  page: {flex: 1},
  header: {minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8},
  backButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.86)', borderWidth: 1, borderColor: PURPLE_BORDER},
  headerTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 21, fontWeight: '800'},
  infoButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center'},
  scrollContent: {paddingHorizontal: 14},
  dateCard: {minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, borderWidth: 1, borderColor: PURPLE_BORDER, backgroundColor: CARD, paddingHorizontal: 16, marginBottom: 10},
  dateEyebrow: {color: PURPLE, fontSize: 9, fontWeight: '800', letterSpacing: 0.7},
  dateText: {marginTop: 3, color: PURPLE_DARK, fontSize: 12.5, fontWeight: '700', textTransform: 'capitalize'},
  calendarIcon: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: PURPLE_SOFT},
  sectionCard: {marginBottom: 10, borderRadius: 20, borderWidth: 1, borderColor: PURPLE_BORDER, backgroundColor: CARD, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 13},
  sectionTitle: {marginBottom: 10, color: PURPLE_DARK, fontSize: 13.5, fontWeight: '800'},
  flowRow: {flexDirection: 'row', justifyContent: 'space-between', gap: 6},
  flowOption: {flex: 1, minHeight: 74, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(107,75,196,0.12)', backgroundColor: '#FFFDFF', paddingHorizontal: 4},
  flowIconCircle: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#F2ECFA'},
  flowIconCircleSelected: {backgroundColor: '#EEE4FF'},
  flowLabel: {marginTop: 6, color: TEXT_SECONDARY, fontSize: 9.5, fontWeight: '600'},
  colorRow: {flexDirection: 'row', justifyContent: 'space-between'},
  colorOption: {width: '19%', alignItems: 'center'},
  colorOuter: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1.5, borderColor: 'transparent'},
  colorOuterSelected: {borderColor: PURPLE, backgroundColor: '#F6F0FF'},
  colorDot: {width: 25, height: 25, borderRadius: 13},
  colorLabel: {minHeight: 25, marginTop: 5, color: TEXT_SECONDARY, fontSize: 8.5, lineHeight: 11, textAlign: 'center'},
  consistencyRow: {flexDirection: 'row', gap: 7},
  consistencyChip: {flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(107,75,196,0.14)', backgroundColor: '#FFFDFF', paddingHorizontal: 7},
  consistencyText: {color: TEXT_SECONDARY, fontSize: 9.5, fontWeight: '600', textAlign: 'center'},
  symptomWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 7},
  symptomChip: {minHeight: 34, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(107,75,196,0.14)', backgroundColor: '#FFFDFF', paddingHorizontal: 13},
  symptomText: {color: TEXT_SECONDARY, fontSize: 9.8, fontWeight: '600'},
  selectedBox: {borderColor: PURPLE, backgroundColor: '#F5EEFF'},
  selectedText: {color: PURPLE_DARK, fontWeight: '800'},
  noteBox: {minHeight: 104, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(107,75,196,0.14)', backgroundColor: '#FFFDFF', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 25},
  noteInput: {minHeight: 64, padding: 0, color: PURPLE_DARK, fontSize: 11, lineHeight: 16},
  counter: {position: 'absolute', right: 10, bottom: 8, color: '#9B90AD', fontSize: 9},
  reassurance: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12, borderRadius: 14, backgroundColor: 'rgba(243,236,253,0.92)', paddingHorizontal: 12, paddingVertical: 10},
  reassuranceText: {flex: 1, color: TEXT_SECONDARY, fontSize: 9.5, lineHeight: 14},
  saveButton: {width: '88%', maxWidth: 360, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', gap: 8, borderRadius: 16, backgroundColor: PURPLE, shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.22, shadowRadius: 9, elevation: 5},
  saveText: {color: '#FFFFFF', fontSize: 15, fontWeight: '800'},
  pressed: {opacity: 0.82, transform: [{scale: 0.99}]},
});

export default PostpartumLochiaScreen;