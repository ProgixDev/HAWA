import React, {useMemo, useState} from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import type {MoodLevel} from '../../types/journal';
import {TOP_SPACING_EXTRA} from '../../theme/spacing';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const ACTIVE_PURPLE = '#5D3FA8';
const TEXT_MUTED = '#655A8D';

type MoodOption = {label: string; emoji: string; value: MoodLevel; tint: string};
type LevelRowProps = {
  label: string;
  value: number;
  color: string;
  paleColor: string;
  onChange: (value: number) => void;
};

const MOODS: MoodOption[] = [
  {label: 'Très bien', emoji: '😊', value: 'veryGood', tint: '#DCEFE4'},
  {label: 'Bien', emoji: '🙂', value: 'good', tint: '#E5EED6'},
  {label: 'Neutre', emoji: '😐', value: 'neutral', tint: '#F7E4C4'},
  {label: 'Stressée', emoji: '😟', value: 'stressed', tint: '#F8DDE0'},
  {label: 'Irritable', emoji: '😠', value: 'irritable', tint: '#F6D0C3'},
  {label: 'Anxieuse', emoji: '😰', value: 'anxious', tint: '#DEE0F5'},
  {label: 'Triste', emoji: '😢', value: 'sad', tint: '#DCEAF4'},
  {label: 'Fatiguée', emoji: '😴', value: 'tired', tint: '#E5E1F6'},
  {label: 'Motivée', emoji: '🤩', value: 'motivated', tint: '#FFF0CB'},
];

function LevelRow({label, value, color, paleColor, onChange}: LevelRowProps) {
  return (
    <View style={styles.levelRow}>
      <Text style={styles.levelLabel}>{label}</Text>
      <View accessibilityRole="adjustable" accessibilityValue={{min: 1, max: 5, now: value}} style={styles.scale}>
        <View style={[styles.scaleTrack, {backgroundColor: paleColor}]} />
        <View style={[styles.scaleFill, {backgroundColor: color, width: `${(value - 1) * 25}%`}]} />
        {[1, 2, 3, 4, 5].map(level => (
          <Pressable
            key={level}
            accessibilityLabel={`${label} ${level} sur 5`}
            accessibilityRole="button"
            onPress={() => onChange(level)}
            style={styles.scaleStep} />
        ))}
        <View pointerEvents="none" style={[styles.scaleThumb, {backgroundColor: color, left: `${(value - 1) * 25}%`}]} />
      </View>
      <Text style={styles.levelValue}>{value} / 5</Text>
    </View>
  );
}

export default function JournalMoodScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [mood, setMood] = useState<MoodLevel>('veryGood');
  const [energy, setEnergy] = useState(4);
  const [stress, setStress] = useState(3);
  const [irritability, setIrritability] = useState(2);
  const [motivation, setMotivation] = useState(4);
  const [note, setNote] = useState('');
  const remaining = useMemo(() => 300 - note.length, [note.length]);

  const save = async () => {
    await saveJournalSection(new Date().toLocaleDateString('en-CA'), 'mood', {
      level: mood,
      energy,
      stress,
      irritability,
      motivation,
      note: note.trim(),
    });
    Alert.alert('Journal', 'Ton humeur a été enregistrée.');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#F8EFFF" barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top} style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={styles.roundButton}>
            <MaterialDesignIcons color={PURPLE} name="arrow-left" size={25} />
          </Pressable>
          <Text style={styles.pageTitle}>Humeur</Text>
          <Pressable accessibilityLabel="Enregistrer l'humeur" onPress={save} style={styles.roundButton}>
            <MaterialDesignIcons color={PURPLE} name="check" size={24} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 24}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ImageBackground imageStyle={styles.heroImage} source={require('../../assets/images/mood-header-woman.png')} style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Comment te sens-tu{`\n`}aujourd’hui ?</Text>
              <Text style={styles.heroSubtitle}>Prends un moment pour reconnaître{`\n`}ce que tu ressens.</Text>
            </View>
          </ImageBackground>

          <View style={styles.card}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}><Text style={styles.headingEmoji}>☺</Text></View>
              <Text style={styles.sectionTitle}>Humeur principale</Text>
            </View>
            <View style={styles.moodGrid}>
              {MOODS.map(option => {
                const selected = mood === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{checked: selected}}
                    onPress={() => setMood(option.value)}
                    style={({pressed}) => [styles.moodCard, selected && styles.moodCardSelected, pressed && styles.pressed]}>
                    <View style={[styles.emojiCircle, {backgroundColor: option.tint}]}><Text style={styles.emoji}>{option.emoji}</Text></View>
                    <Text numberOfLines={1} style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}><MaterialDesignIcons color={ACTIVE_PURPLE} name="chart-bar" size={18} /></View>
              <Text style={styles.sectionTitle}>Niveaux du jour</Text>
            </View>
            <LevelRow color="#2B7656" label="Énergie" onChange={setEnergy} paleColor="#DAE9DD" value={energy} />
            <LevelRow color="#EA788A" label="Stress" onChange={setStress} paleColor="#F9E0E5" value={stress} />
            <LevelRow color="#EF984D" label="Irritabilité" onChange={setIrritability} paleColor="#FAE5D1" value={irritability} />
            <LevelRow color="#A480C0" label="Motivation" onChange={setMotivation} paleColor="#EDE4F3" value={motivation} />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}><MaterialDesignIcons color={ACTIVE_PURPLE} name="pencil-outline" size={17} /></View>
              <Text style={styles.sectionTitle}>Commentaire <Text style={styles.optional}>(optionnel)</Text></Text>
            </View>
            <View style={styles.noteBox}>
              <TextInput
                accessibilityLabel="Commentaire sur ton humeur"
                maxLength={300}
                multiline
                onChangeText={setNote}
                placeholder="Écris ici ce que tu ressens ou ce que tu souhaites noter..."
                placeholderTextColor="#9A8FB8"
                style={styles.noteInput}
                textAlignVertical="top"
                value={note}
              />
              <Text style={styles.counter}>{300 - remaining} / 300</Text>
            </View>
            <View style={styles.kindnessBox}>
              <View style={styles.kindnessIcon}><Text style={styles.kindnessEmoji}>💚</Text></View>
              <View style={styles.kindnessCopy}>
                <Text style={styles.kindnessTitle}>Chaque émotion compte.</Text>
                <Text style={styles.kindnessText}>Écoute-toi avec bienveillance.</Text>
              </View>
              <MaterialDesignIcons color="#C7B8E3" name="sprout" size={34} />
            </View>
          </View>

          <Pressable
  accessibilityRole="button"
  onPress={save}
  style={({pressed}) => [
    styles.saveButton,
    pressed && styles.pressed,
  ]}>

  <MaterialDesignIcons
    color="#FFFFFF"
    name="content-save-outline"
    size={20}
  />

  <Text style={styles.saveText}>
    Enregistrer
  </Text>

</Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F8EFFF'},
  flex: {flex: 1},
  topBar: {height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: TOP_SPACING_EXTRA},
  roundButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#EEE3FA', marginTop: 9},
  pageTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 22, fontWeight: '700',marginTop: 13},
  content: {paddingHorizontal: 11, paddingBottom: 34, gap: 8},
  hero: {height: 125, justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#E2D8F0', borderRadius: 20, backgroundColor: '#FCF8FF'},
  heroImage: {borderRadius: 20, resizeMode: 'cover'},
  heroCopy: {width: '58%', paddingLeft: 26},
  heroTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 19, lineHeight: 23, fontWeight: '700'},
  heroSubtitle: {marginTop: 7, color: TEXT_MUTED, fontSize: 11.5, lineHeight: 16},
  card: {borderWidth: 1, borderColor: '#E8DFF5', borderRadius: 20, backgroundColor: 'rgba(255,253,249,0.96)', padding: 12, shadowColor: '#5D4394', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: {width: 0, height: 2}, elevation: 1},
  sectionHeading: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  headingIcon: {width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#EEE3FA'},
  headingEmoji: {color: ACTIVE_PURPLE, fontSize: 20, lineHeight: 23},
  sectionTitle: {marginLeft: 8, color: PURPLE_DARK, fontFamily: 'serif', fontSize: 15.5, fontWeight: '700'},
  optional: {fontFamily: undefined, fontSize: 11, fontWeight: '400'},
  moodGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8},
  moodCard: {width: '18.2%', minWidth: 67, height: 78, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8DFF5', borderRadius: 13, backgroundColor: '#FCF9FF'},
  moodCardSelected: {borderColor: '#9E86D6', backgroundColor: '#EFE6FA'},
  emojiCircle: {width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 20},
  emoji: {fontSize: 25},
  moodLabel: {marginTop: 5, color: '#3D3560', fontSize: 10.5},
  moodLabelSelected: {color: ACTIVE_PURPLE, fontWeight: '700'},
  levelRow: {height: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EDE3F8'},
  levelLabel: {width: 92, color: PURPLE_DARK, fontSize: 13, fontWeight: '700'},
  scale: {flex: 1, height: 28, flexDirection: 'row', alignItems: 'center'},
  scaleStep: {flex: 1, height: 28, alignItems: 'center', justifyContent: 'center'},
  scaleTrack: {position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3},
  scaleFill: {position: 'absolute', left: 0, height: 6, borderRadius: 3},
  scaleThumb: {position: 'absolute', width: 17, height: 17, marginLeft: -8.5, borderWidth: 2, borderColor: '#FFFDF9', borderRadius: 9},
  levelValue: {width: 46, marginLeft: 12, color: TEXT_MUTED, fontSize: 13, textAlign: 'right'},
  noteBox: {height: 82, borderWidth: 1, borderColor: '#E8DFF5', borderRadius: 13, backgroundColor: '#FFFEFC'},
  noteInput: {flex: 1, paddingHorizontal: 11, paddingTop: 9, paddingBottom: 20, color: '#3D3560', fontSize: 11.5},
  counter: {position: 'absolute', right: 9, bottom: 6, color: '#8F84AC', fontSize: 9.5},
  kindnessBox: {minHeight: 54, flexDirection: 'row', alignItems: 'center', marginTop: 8, borderRadius: 12, backgroundColor: '#F3ECFB', paddingHorizontal: 10},
  kindnessIcon: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#EEE3FA'},
  kindnessEmoji: {fontSize: 16},
  kindnessCopy: {flex: 1, marginLeft: 9},
  kindnessTitle: {color: PURPLE_DARK, fontSize: 11, fontWeight: '700'},
  kindnessText: {marginTop: 2, color: TEXT_MUTED, fontSize: 10},
 saveButton: {
  width: '88%',
  maxWidth: 360,
  minHeight: 54,
  alignSelf: 'center',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 12,
  marginBottom: 8,
  borderRadius: 18,
  backgroundColor: PURPLE,
},
  saveText: {color: '#FFFFFF', fontSize: 15, fontWeight: '700'},
  pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
});
