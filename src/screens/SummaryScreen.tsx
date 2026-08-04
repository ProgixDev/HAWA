import React from 'react';
import {Image, ImageBackground, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing} from '../theme/spacing';
import {
  getCyclePreferences,
  getSelectedLocation,
  getSelectedObjective,
  getSelectedSchool,
  getSpiritualMarkersEnabled,
  type ObjectiveId,
  type SchoolId,
} from '../state/onboardingPreferences';

const BACKGROUND = require('../assets/images/school-selection-background.png');
const WOMAN = require('../assets/images/summary-woman.png');
const OBJECTIVE_ICON = require('../assets/images/summary-icon-objective.png');
const SPIRITUAL_ICON = require('../assets/images/summary-icon-spiritual.png');
const SCHOOL_ICON = require('../assets/images/summary-icon-school.png');
const LOCATION_ICON = require('../assets/images/summary-icon-location.png');
const CALENDAR_ICON = require('../assets/images/summary-icon-calendar.png');
const PERIOD_ICON = require('../assets/images/summary-icon-period.png');
const CYCLE_ICON = require('../assets/images/summary-icon-cycle.png');
const REGULAR_ICON = require('../assets/images/summary-icon-regular.png');

const objectiveLabels: Record<ObjectiveId, string> = {
  cycle: 'Suivre mon cycle', conceive: 'Essayer de concevoir',
  contraception: 'Contraception', irregular: 'Cycles irréguliers (SOPK)',
  menopause: 'Post-ménopause / Ménopause', pregnancy: 'Suivi de grossesse',
  postpartum: 'Post-partum', loss: 'Après une fausse couche',
};

const schoolLabels: Record<SchoolId, string> = {
  hanafi: 'Hanafi', maliki: 'Maliki', chafii: 'Chafi’i', hanbali: 'Hanbali',
  unknown: 'Je ne sais pas encore',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

function SummaryScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const cycle = getCyclePreferences();
  const spiritualEnabled = getSpiritualMarkersEnabled();
  const school = getSelectedSchool();
  const location = getSelectedLocation();
  const regularityLabels = {yes: 'Oui', no: 'Non', unknown: 'Je ne sais pas'};
  const rows = [
    {icon: OBJECTIVE_ICON, label: 'Objectif principal', value: objectiveLabels[getSelectedObjective()]},
    {icon: SPIRITUAL_ICON, label: 'Repères spirituels', value: spiritualEnabled ? 'Activés' : 'Désactivés'},
    {icon: SCHOOL_ICON, label: 'École juridique', value: spiritualEnabled && school ? schoolLabels[school] : 'Non renseignée'},
    {icon: LOCATION_ICON, label: 'Localisation', value: location ? `${location.city}, ${location.country}` : 'Non renseignée'},
    {icon: CALENDAR_ICON, label: 'Dernières règles', value: new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(cycle.lastPeriodStart)},
    {icon: PERIOD_ICON, label: 'Durée moyenne des règles', value: `${cycle.periodDuration} jours`},
    {icon: CYCLE_ICON, label: 'Durée moyenne du cycle', value: `${cycle.cycleDuration} jours`},
    {icon: REGULAR_ICON, label: 'Cycle régulier', value: regularityLabels[cycle.regularity]},
  ];
  return (
    <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(insets.top, 20) + spacing.sm, paddingBottom: Math.max(insets.bottom, 16) + spacing.sm}]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Récapitulatif</Text>
            <Text style={styles.subtitle}>{'Vérifie tes informations avant\nde commencer ton voyage.'}</Text>
          </View>

          <View style={styles.card}>
            {rows.map((row, index) => (
              <View key={row.label} style={[styles.row, index < rows.length - 1 && styles.separator]}>
                <Image
                  accessibilityIgnoresInvertColors
                  source={row.icon}
                  style={styles.rowIcon}
                />
                <Text numberOfLines={1} style={styles.label}>{row.label}</Text>
                <Text numberOfLines={1} style={styles.value}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.illustrationArea}>
            <Image accessibilityIgnoresInvertColors source={WOMAN} style={styles.woman} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Auth')}
            style={({pressed}) => [styles.startButton, pressed && styles.pressed]}>
            <Text style={styles.startText}>Commencer</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F8EFFF'},
  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.md},
  header: {alignItems: 'center', marginBottom: 12},
  title: {color: '#28166F', fontFamily: 'serif', fontSize: 29, fontWeight: '700'},
  subtitle: {marginTop: 5, color: '#655A8D', fontSize: 12, lineHeight: 17, textAlign: 'center'},
  card: {overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(111,83,190,0.18)', borderRadius: 18, backgroundColor: 'rgba(255,252,255,0.90)', paddingHorizontal: 12},
  row: {height: 43, flexDirection: 'row', alignItems: 'center'},
  rowIcon: {width: 64, height: 64, marginHorizontal: -17, resizeMode: 'contain'},
  separator: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2D8F0'},
  label: {flex: 1, marginLeft: 10, color: '#433467', fontSize: 12},
  value: {maxWidth: '39%', marginLeft: 8, color: '#2A2050', fontSize: 11, fontWeight: '600', textAlign: 'right'},
  illustrationArea: {flex: 1, minHeight: 130, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden'},
  woman: {width: '116%', height: '116%', resizeMode: 'contain', marginBottom: -12},
  startButton: {minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#6949BE', shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9, elevation: 5},
  startText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
});

export default SummaryScreen;
