import React, {useEffect, useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  calculateBmi,
  classifyBmi,
  getCachedGeneralHealth,
  loadGeneralHealth,
  updateGeneralHealth,
  type GeneralHealthProfile,
} from '../state/generalHealthStore';

const PURPLE = '#6D4AE8';
const DARK = '#2F2258';
const MUTED = '#746D92';
const SUCCESS = '#3E9B63';
type Props = NativeStackScreenProps<RootStackParamList, 'GeneralHealth'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type Sheet = 'height' | 'weight' | 'blood' | 'conditions' | 'treatments' | 'allergies' | 'notes' | 'goal' | null;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CONDITIONS = ['Asthme', 'Diabète', 'Hypertension', 'Thyroïde', 'Endométriose', 'SOPK'];
const ALLERGIES = ['Médicaments', 'Aliments', 'Pollen', 'Poussière', 'Latex'];
const GOALS = ['Rester en forme et en bonne santé', 'Améliorer mon sommeil', 'Bouger davantage', 'Suivre mon poids', 'Réduire mon stress'];

function formatUpdateDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);
}

function listValue(values: string[], empty: string): string {
  return values.length ? values.join(', ') : empty;
}

function HealthRow({icon, label, value, onPress, last, valueNode}: {icon: IconName; label: string; value: string; onPress?: () => void; last?: boolean; valueNode?: React.ReactNode}) {
  return <Pressable accessibilityLabel={`${label}, ${value}`} accessibilityRole="button" disabled={!onPress} onPress={onPress} style={({pressed}) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}>
    <View style={styles.rowIcon}><MaterialDesignIcons color={PURPLE} name={icon} size={19} /></View>
    <View style={styles.rowCopy}><Text style={styles.rowLabel}>{label}</Text>{valueNode ?? <Text style={styles.rowValue}>{value}</Text>}</View>
    {onPress ? <MaterialDesignIcons color="#B5ACC5" name="chevron-right" size={23} /> : null}
  </Pressable>;
}

export default function GeneralHealthScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [profile, setProfile] = useState(getCachedGeneralHealth());
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState('');
  const [custom, setCustom] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [draftProgress, setDraftProgress] = useState(profile.goalProgress);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {loadGeneralHealth().then(setProfile);}, []);
  const bmi = useMemo(() => calculateBmi(profile.heightCm, profile.weightKg), [profile.heightCm, profile.weightKg]);
  const bmiClass = classifyBmi(bmi);

  const open = (next: Sheet) => {
    setSheet(next); setError(''); setCustom('');
    if (next === 'height') {setDraft(String(profile.heightCm));}
    if (next === 'weight') {setDraft(String(profile.weightKg));}
    if (next === 'notes') {setDraft(profile.medicalNotes);}
    if (next === 'treatments') {setSelected([...profile.treatments]); setDraft('');}
    if (next === 'conditions') {setSelected([...profile.chronicConditions]);}
    if (next === 'allergies') {setSelected([...profile.allergies]);}
    if (next === 'goal') {setDraft(profile.healthGoal); setDraftProgress(profile.goalProgress);}
  };

  const persist = async (patch: Partial<GeneralHealthProfile>) => {
    setProfile(await updateGeneralHealth(patch)); setSheet(null); setToast(true);
    setTimeout(() => setToast(false), 2200);
  };

  const saveMeasure = () => {
    const value = Number(draft.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {setError('Saisis une valeur positive valide.'); return;}
    if (sheet === 'height' && (value < 80 || value > 250)) {setError('Saisis une taille comprise entre 80 et 250 cm.'); return;}
    if (sheet === 'weight' && (value < 20 || value > 400)) {setError('Saisis un poids compris entre 20 et 400 kg.'); return;}
    persist(sheet === 'height' ? {heightCm: value} : {weightKg: value});
  };

  const toggle = (item: string) => setSelected(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item]);
  const saveMulti = (key: 'chronicConditions' | 'allergies') => {
    const addition = custom.trim();
    persist({[key]: addition && !selected.includes(addition) ? [...selected, addition] : selected});
  };
  const addTreatment = () => {
    const value = draft.trim();
    if (!value) {setError('Indique le nom du traitement.'); return;}
    setSelected(current => current.includes(value) ? current : [...current, value]); setDraft(''); setError('');
  };

  return <SafeAreaView edges={['left', 'right']} style={styles.safe}>
    <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact, {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 26}]} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}><MaterialDesignIcons color={PURPLE} name="chevron-left" size={28} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.title}>Santé générale</Text><Text style={styles.subtitle}>Informations sur ta santé physique 🌸</Text></View>
        <View style={styles.decor}><MaterialDesignIcons color="#B998F0" name="leaf" size={43} /><MaterialDesignIcons color="#9D76E8" name="star-four-points" size={11} /></View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(70).duration(420)} style={styles.privacyCard}>
        <View style={styles.healthIcon}><MaterialDesignIcons color={PURPLE} name="heart-pulse" size={39} /></View>
        <View style={styles.privacyCopy}><Text style={styles.privacyTitle}>Ces informations sont privées 🔒</Text><Text style={styles.privacyText}>Elles nous aident à personnaliser ton expérience et améliorer la précision des prédictions.</Text></View>
      </Animated.View>

      <Text style={styles.sectionTitle}>Informations physiques</Text>
      <Animated.View entering={FadeInUp.delay(130).duration(420)} style={styles.card}>
        <HealthRow icon="human-male-height" label="Taille" onPress={() => open('height')} value={`${profile.heightCm} cm`} />
        <HealthRow icon="scale-bathroom" label="Poids actuel" onPress={() => open('weight')} value={`${profile.weightKg} kg`} />
        <HealthRow icon="weight" label="IMC (Indice de masse corporelle)" onPress={() => open(profile.heightCm ? 'weight' : 'height')} value={bmi ? bmi.toFixed(1) : bmiClass} valueNode={<Text style={styles.rowValue}>{bmi ? `${bmi.toFixed(1).replace('.', ',')} • ` : ''}<Text style={bmiClass === 'Normal' ? styles.success : styles.bmiClass}>{bmiClass}</Text></Text>} />
        <HealthRow icon="water-outline" label="Groupe sanguin" onPress={() => open('blood')} value={profile.bloodType} />
        <HealthRow icon="calendar-month-outline" label="Date de la dernière mise à jour" value={formatUpdateDate(profile.updatedAt)} last />
      </Animated.View>

      <Text style={styles.sectionTitle}>Informations médicales</Text>
      <Animated.View entering={FadeInUp.delay(190).duration(420)} style={styles.card}>
        <HealthRow icon="heart-plus-outline" label="Maladies chroniques" onPress={() => open('conditions')} value={listValue(profile.chronicConditions, 'Aucune')} />
        <HealthRow icon="pill" label="Traitements en cours" onPress={() => open('treatments')} value={listValue(profile.treatments, 'Aucun')} />
        <HealthRow icon="allergy" label="Allergies" onPress={() => open('allergies')} value={listValue(profile.allergies, 'Aucune connue')} />
        <HealthRow icon="clipboard-text-outline" label="Notes médicales" onPress={() => open('notes')} value={profile.medicalNotes || 'Ajoute des informations importantes...'} last />
      </Animated.View>

      <Text style={styles.sectionTitle}>Objectifs de santé</Text>
      <Animated.View entering={FadeInUp.delay(250).duration(420)}>
        <Pressable accessibilityRole="button" onPress={() => open('goal')} style={({pressed}) => [styles.goalCard, pressed && styles.pressed]}>
          <View style={styles.rowIcon}><MaterialDesignIcons color={PURPLE} name="target" size={21} /></View>
          <View style={styles.goalCopy}><Text style={styles.rowLabel}>Mon objectif actuel</Text><Text style={styles.goalValue}>{profile.healthGoal}</Text><View style={styles.progressRow}><Text style={styles.progressText}>{profile.goalProgress}%</Text><View style={styles.track}><View style={[styles.fill, {width: `${profile.goalProgress}%`}]} /></View><Text style={styles.progressStatus}>En cours</Text></View></View>
          <MaterialDesignIcons color="#B5ACC5" name="chevron-right" size={23} />
        </Pressable>
      </Animated.View>

      <View style={styles.infoCard}><MaterialDesignIcons color={PURPLE} name="information-outline" size={21} /><Text style={styles.infoText}>Ces informations restent 100% privées et sécurisées.{`\n`}Tu peux les modifier à tout moment.</Text></View>
    </ScrollView>

    <Modal animationType="slide" onRequestClose={() => setSheet(null)} statusBarTranslucent transparent visible={sheet !== null}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <Pressable onPress={() => setSheet(null)} style={styles.backdrop} />
        <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 18)}]}><View style={styles.handle} />
          {(sheet === 'height' || sheet === 'weight') ? <><Text style={styles.sheetTitle}>{sheet === 'height' ? 'Modifier ma taille' : 'Modifier mon poids'}</Text><Text style={styles.inputLabel}>{sheet === 'height' ? 'Taille en centimètres' : 'Poids en kilogrammes'}</Text><View style={styles.measureInput}><TextInput autoFocus keyboardType="decimal-pad" onChangeText={value => {setDraft(value); setError('');}} style={styles.largeInput} value={draft} /><Text style={styles.unit}>{sheet === 'height' ? 'cm' : 'kg'}</Text></View>{error ? <Text style={styles.error}>{error}</Text> : null}<SaveButton onPress={saveMeasure} /></> : null}
          {sheet === 'blood' ? <><Text style={styles.sheetTitle}>Groupe sanguin</Text><View style={styles.grid}>{BLOOD_TYPES.map(item => <Choice key={item} label={item} selected={profile.bloodType === item} onPress={() => persist({bloodType: item})} />)}</View></> : null}
          {(sheet === 'conditions' || sheet === 'allergies') ? <><Text style={styles.sheetTitle}>{sheet === 'conditions' ? 'Maladies chroniques' : 'Allergies'}</Text><Text style={styles.sheetSubtitle}>Sélection multiple. Ne choisis que des informations déjà connues.</Text><View style={styles.chips}>{(sheet === 'conditions' ? CONDITIONS : ALLERGIES).map(item => <Choice key={item} label={item} selected={selected.includes(item)} onPress={() => toggle(item)} />)}</View><TextInput onChangeText={setCustom} placeholder="Autre (optionnel)" placeholderTextColor="#A39AB5" style={styles.input} value={custom} /><SaveButton onPress={() => saveMulti(sheet === 'conditions' ? 'chronicConditions' : 'allergies')} /></> : null}
          {sheet === 'treatments' ? <><Text style={styles.sheetTitle}>Traitements en cours</Text><Text style={styles.sheetSubtitle}>Ajoute un nom et, si utile, le dosage ou la fréquence.</Text><View style={styles.addRow}><TextInput onChangeText={value => {setDraft(value); setError('');}} placeholder="Ex. Fer 20 mg, chaque matin" placeholderTextColor="#A39AB5" style={[styles.input, styles.flexInput]} value={draft} /><Pressable onPress={addTreatment} style={styles.addButton}><MaterialDesignIcons color="#FFF" name="plus" size={22} /></Pressable></View>{error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.selectedList}>{selected.map(item => <Pressable key={item} onPress={() => toggle(item)} style={styles.selectedTag}><Text style={styles.selectedTagText}>{item}</Text><MaterialDesignIcons color={PURPLE} name="close" size={15} /></Pressable>)}</View><SaveButton onPress={() => persist({treatments: selected})} /></> : null}
          {sheet === 'notes' ? <><Text style={styles.sheetTitle}>Notes médicales</Text><TextInput autoFocus maxLength={500} multiline onChangeText={setDraft} placeholder="Ajoute ici les informations importantes que tu souhaites conserver..." placeholderTextColor="#A39AB5" style={[styles.input, styles.notesInput]} textAlignVertical="top" value={draft} /><Text style={styles.counter}>{draft.length} / 500</Text><SaveButton onPress={() => persist({medicalNotes: draft.trim()})} /></> : null}
          {sheet === 'goal' ? <><Text style={styles.sheetTitle}>Mon objectif de santé</Text>{GOALS.map(item => <Option key={item} label={item} selected={draft === item} onPress={() => setDraft(item)} />)}<Text style={styles.inputLabel}>Progression personnelle : {draftProgress}%</Text><View style={styles.progressChoices}>{[20,40,60,80,100].map(value => <Choice key={value} label={`${value}%`} selected={draftProgress === value} onPress={() => setDraftProgress(value)} />)}</View><SaveButton onPress={() => persist({healthGoal: draft || profile.healthGoal, goalProgress: draftProgress})} /></> : null}
          <Pressable onPress={() => setSheet(null)} style={styles.cancel}><Text style={styles.cancelText}>Annuler</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    {toast ? <Animated.View entering={FadeInUp.springify()} style={[styles.toast, {bottom: Math.max(insets.bottom,18)+12}]}><MaterialDesignIcons color="#FFF" name="check" size={15}/><Text style={styles.toastText}>Informations mises à jour ✓</Text></Animated.View> : null}
  </SafeAreaView>;
}

function Choice({label, selected, onPress}:{label:string;selected:boolean;onPress:()=>void}) {return <Pressable onPress={onPress} style={({pressed})=>[styles.choice,selected&&styles.choiceSelected,pressed&&styles.pressed]}><Text style={[styles.choiceText,selected&&styles.choiceTextSelected]}>{label}</Text>{selected?<MaterialDesignIcons color={PURPLE} name="check" size={16}/>:null}</Pressable>;}
function Option({label,selected,onPress}:{label:string;selected:boolean;onPress:()=>void}) {return <Pressable onPress={onPress} style={({pressed})=>[styles.option,selected&&styles.optionSelected,pressed&&styles.pressed]}><Text style={[styles.optionText,selected&&styles.choiceTextSelected]}>{label}</Text>{selected?<MaterialDesignIcons color={PURPLE} name="check-circle" size={21}/>:<View style={styles.radio}/>}</Pressable>;}
function SaveButton({onPress}:{onPress:()=>void}) {return <Pressable onPress={onPress} style={({pressed})=>[styles.save,pressed&&styles.pressed]}><Text style={styles.saveText}>Enregistrer</Text></Pressable>;}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#FCFAFF'},content:{flexGrow:1,gap:12,paddingHorizontal:16},contentCompact:{paddingHorizontal:11},header:{flexDirection:'row',alignItems:'center'},back:{alignItems:'center',justifyContent:'center',borderRadius:999,backgroundColor:'#FFF',padding:9,elevation:2},headerCopy:{flex:1,minWidth:0,paddingHorizontal:10},title:{color:DARK,fontFamily:'serif',fontSize:23,fontWeight:'700'},subtitle:{marginTop:3,color:MUTED,fontSize:11.5},decor:{flexDirection:'row',alignItems:'center'},privacyCard:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#EEE8F5',borderRadius:26,backgroundColor:'#FFF',padding:15,elevation:2,shadowColor:PURPLE,shadowOpacity:.07,shadowRadius:11},healthIcon:{alignItems:'center',justifyContent:'center',flexBasis:'21%',aspectRatio:1,borderRadius:999,backgroundColor:'#F0E7FF'},privacyCopy:{flex:1,marginLeft:14},privacyTitle:{color:DARK,fontSize:13.5,fontWeight:'700'},privacyText:{marginTop:5,color:MUTED,fontSize:11,lineHeight:16},sectionTitle:{marginTop:2,color:DARK,fontFamily:'serif',fontSize:16,fontWeight:'700'},card:{overflow:'hidden',borderWidth:1,borderColor:'#EEE8F5',borderRadius:24,backgroundColor:'#FFF',paddingHorizontal:12},row:{minHeight:62,flexDirection:'row',alignItems:'center',paddingVertical:8},rowBorder:{borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#EEE8F3'},rowIcon:{alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:'#F2EBFF',padding:9},rowCopy:{flex:1,minWidth:0,marginHorizontal:11},rowLabel:{color:MUTED,fontSize:10.5},rowValue:{marginTop:2,color:DARK,fontSize:12.5,fontWeight:'700'},success:{color:SUCCESS},bmiClass:{color:DARK},goalCard:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#EEE8F5',borderRadius:24,backgroundColor:'#FFF',padding:13},goalCopy:{flex:1,minWidth:0,marginHorizontal:11},goalValue:{marginTop:3,color:DARK,fontSize:12.5,fontWeight:'700'},progressRow:{flexDirection:'row',alignItems:'center',gap:7,marginTop:9},progressText:{color:PURPLE,fontSize:9.5,fontWeight:'700'},track:{flex:1,height:5,overflow:'hidden',borderRadius:999,backgroundColor:'#E7DFF1'},fill:{height:'100%',borderRadius:999,backgroundColor:PURPLE},progressStatus:{color:MUTED,fontSize:9},infoCard:{flexDirection:'row',alignItems:'center',gap:10,borderRadius:18,backgroundColor:'#F1E8FF',padding:14},infoText:{flex:1,color:MUTED,fontSize:10.5,lineHeight:16},pressed:{opacity:.78,transform:[{scale:.985}]},modalRoot:{flex:1,justifyContent:'flex-end'},backdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(35,21,72,.38)'},sheet:{maxHeight:'88%',borderTopLeftRadius:30,borderTopRightRadius:30,backgroundColor:'#FFF',paddingHorizontal:18,paddingTop:10},handle:{alignSelf:'center',width:'14%',aspectRatio:8,borderRadius:999,backgroundColor:'#DDD3EA'},sheetTitle:{marginTop:16,color:DARK,fontFamily:'serif',fontSize:21,fontWeight:'700',textAlign:'center'},sheetSubtitle:{marginTop:5,marginBottom:13,color:MUTED,fontSize:11.5,lineHeight:16,textAlign:'center'},inputLabel:{marginTop:14,marginBottom:7,color:DARK,fontSize:12,fontWeight:'700'},measureInput:{flexDirection:'row',alignItems:'center',alignSelf:'center',width:'70%',borderWidth:1,borderColor:'#DDD2ED',borderRadius:20,backgroundColor:'#FCFAFF',paddingHorizontal:15},largeInput:{flex:1,color:DARK,fontSize:30,fontWeight:'700',textAlign:'center',paddingVertical:13},unit:{color:PURPLE,fontSize:15,fontWeight:'700'},input:{borderWidth:1,borderColor:'#DDD2ED',borderRadius:18,backgroundColor:'#FCFAFF',paddingHorizontal:14,paddingVertical:12,color:DARK,fontSize:13},notesInput:{minHeight:130},counter:{marginTop:5,color:MUTED,fontSize:10,textAlign:'right'},error:{marginTop:6,color:'#B4485A',fontSize:11},save:{alignItems:'center',marginTop:15,borderRadius:18,backgroundColor:PURPLE,padding:15},saveText:{color:'#FFF',fontSize:15,fontWeight:'700'},cancel:{alignItems:'center',marginTop:8,paddingVertical:12},cancelText:{color:MUTED,fontSize:13,fontWeight:'600'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:13},choice:{flexGrow:1,flexBasis:'21%',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,borderWidth:1,borderColor:'#E5DCF0',borderRadius:16,backgroundColor:'#FFF',paddingHorizontal:9,paddingVertical:11},choiceSelected:{borderColor:PURPLE,backgroundColor:'#F2EAFF'},choiceText:{color:MUTED,fontSize:12,fontWeight:'600'},choiceTextSelected:{color:PURPLE,fontWeight:'700'},option:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#E5DCF0',borderRadius:17,padding:13,marginTop:8},optionSelected:{borderColor:PURPLE,backgroundColor:'#F2EAFF'},optionText:{flex:1,color:DARK,fontSize:12.5,fontWeight:'600'},radio:{width:20,height:20,borderWidth:1.5,borderColor:'#C4B6D8',borderRadius:999},addRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:14},flexInput:{flex:1},addButton:{alignItems:'center',justifyContent:'center',borderRadius:16,backgroundColor:PURPLE,padding:12},selectedList:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:12},selectedTag:{flexDirection:'row',alignItems:'center',gap:5,borderRadius:14,backgroundColor:'#F0E8FF',paddingHorizontal:10,paddingVertical:7},selectedTagText:{color:PURPLE,fontSize:11,fontWeight:'600'},progressChoices:{flexDirection:'row',gap:6},toast:{position:'absolute',left:'12%',right:'12%',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderRadius:18,backgroundColor:PURPLE,padding:13,elevation:8},toastText:{color:'#FFF',fontSize:12.5,fontWeight:'700'},
});
