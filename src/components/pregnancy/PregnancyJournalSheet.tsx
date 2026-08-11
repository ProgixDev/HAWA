import React, {memo} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../../navigation/AppNavigator';

export type PregnancyJournalRoute = Extract<keyof RootStackParamList,
  'PregnancySymptoms' | 'MoodEntry' | 'PregnancyWeight' | 'SleepEntry' |
  'HydrationScreen' | 'ActivityEntry' | 'NoteEntry' |
  'PregnancyMedicalInformation' | 'PregnancyAppointments'>;

const ACTIONS: Array<{route: PregnancyJournalRoute; icon: string; title: string; subtitle: string}> = [
  {route: 'PregnancySymptoms', icon: 'heart-pulse', title: 'Symptômes', subtitle: 'Note tes ressentis physiques'},
  {route: 'MoodEntry', icon: 'emoticon-happy-outline', title: 'Humeur', subtitle: 'Comment te sens-tu aujourd’hui ?'},
  {route: 'PregnancyWeight', icon: 'scale-bathroom', title: 'Poids', subtitle: 'Enregistre une mesure en kg'},
  {route: 'SleepEntry', icon: 'weather-night', title: 'Sommeil', subtitle: 'Durée et qualité de ton sommeil'},
  {route: 'HydrationScreen', icon: 'cup-water', title: 'Hydratation', subtitle: 'Suis ta consommation d’eau'},
  {route: 'ActivityEntry', icon: 'walk', title: 'Activité physique', subtitle: 'Mouvement et activité du jour'},
  {route: 'NoteEntry', icon: 'notebook-edit-outline', title: 'Note personnelle', subtitle: 'Écris ce que tu souhaites retenir'},
  {route: 'PregnancyMedicalInformation', icon: 'shield-lock-outline', title: 'Informations médicales personnelles', subtitle: 'Un espace sobre et privé'},
  {route: 'PregnancyAppointments', icon: 'calendar-clock-outline', title: 'Rendez-vous / Examen', subtitle: 'Consulte tes événements médicaux'},
];

type Props = {visible: boolean; onClose: () => void; onNavigate: (route: PregnancyJournalRoute) => void};

function PregnancyJournalSheet({visible, onClose, onNavigate}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Fermer le journal" onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Pressable accessibilityLabel="Fermer" onPress={onClose} style={styles.close}><MaterialDesignIcons color="#FFFFFF" name="close" size={20} /></Pressable>
          <ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 20}]} showsVerticalScrollIndicator={false}>
            <View style={styles.heroIcon}><MaterialDesignIcons color="#6949BE" name="mother-heart" size={38} /></View>
            <Text style={styles.title}>Journal grossesse</Text>
            <Text style={styles.subtitle}>Prends quelques secondes pour noter ton bien-être aujourd’hui.</Text>
            <View style={styles.list}>
              {ACTIONS.map(action => (
                <Pressable key={action.route} onPress={() => onNavigate(action.route)} style={({pressed}) => [styles.card, pressed && styles.pressed]}>
                  <View style={styles.icon}><MaterialDesignIcons color="#6949BE" name={action.icon as never} size={24} /></View>
                  <View style={styles.copy}><Text style={styles.cardTitle}>{action.title}</Text><Text numberOfLines={1} style={styles.cardSubtitle}>{action.subtitle}</Text></View>
                  <MaterialDesignIcons color="#776A96" name="chevron-right" size={24} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'}, backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(23,16,47,.35)'},
  sheet: {height: '88%', overflow: 'hidden', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FCF8FF', elevation: 24},
  handle: {width: 46, height: 5, alignSelf: 'center', marginTop: 10, borderRadius: 3, backgroundColor: '#DED5EB'},
  close: {position: 'absolute', right: 18, top: 17, zIndex: 2, width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#6949BE'},
  content: {paddingHorizontal: 16, paddingTop: 22}, heroIcon: {width: 70, height: 70, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#EEE6FA'},
  title: {marginTop: 10, color: '#28166F', fontFamily: 'serif', fontSize: 28, fontWeight: '700', textAlign: 'center'},
  subtitle: {maxWidth: 320, alignSelf: 'center', marginTop: 4, color: '#675C94', fontSize: 13, lineHeight: 18, textAlign: 'center'},
  list: {gap: 9, marginTop: 17}, card: {minHeight: 68, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(96,71,182,.12)', borderRadius: 21, backgroundColor: '#FFFCFF', paddingHorizontal: 12},
  icon: {width: 46, height: 46, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#EEE6FA'},
  copy: {flex: 1, minWidth: 0, marginHorizontal: 11}, cardTitle: {color: '#28166F', fontFamily: 'serif', fontSize: 15.5, fontWeight: '700'},
  cardSubtitle: {marginTop: 2, color: '#675C94', fontSize: 11}, pressed: {opacity: .8, transform: [{scale: .99}]},
});
export default memo(PregnancyJournalSheet);
