import React from 'react';
import {Image, ImageBackground, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';

const BACKGROUND = require('../assets/images/objective-background.png');
const WOMAN = require('../assets/images/summary-woman.png');
const OBJECTIVE_ICON = require('../assets/images/summary-icon-objective.png');
const SPIRITUAL_ICON = require('../assets/images/summary-icon-spiritual.png');
const SCHOOL_ICON = require('../assets/images/summary-icon-school.png');
const LOCATION_ICON = require('../assets/images/summary-icon-location.png');
const CALENDAR_ICON = require('../assets/images/summary-icon-calendar.png');
const PERIOD_ICON = require('../assets/images/summary-icon-period.png');
const CYCLE_ICON = require('../assets/images/summary-icon-cycle.png');
const REGULAR_ICON = require('../assets/images/summary-icon-regular.png');

const rows = [
  {icon: OBJECTIVE_ICON, label: 'Objectif principal', value: 'Suivre mon cycle'},
  {icon: SPIRITUAL_ICON, label: 'Repères spirituels', value: 'Activés'},
  {icon: SCHOOL_ICON, label: 'École juridique', value: 'Hanafi'},
  {icon: LOCATION_ICON, label: 'Localisation', value: 'Alger, Algérie'},
  {icon: CALENDAR_ICON, label: 'Dernières règles', value: '15 mai 2024'},
  {icon: PERIOD_ICON, label: 'Durée moyenne des règles', value: '5 jours'},
  {icon: CYCLE_ICON, label: 'Durée moyenne du cycle', value: '28 jours'},
  {icon: REGULAR_ICON, label: 'Cycle régulier', value: 'Oui'},
];

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

function SummaryScreen({navigation}: Props): React.JSX.Element {
  return (
    <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <View style={styles.content}>
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
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: colors.cream},
  safeArea: {flex: 1},
  content: {flex: 1, paddingTop: 42, paddingHorizontal: spacing.md, paddingBottom: spacing.md},
  header: {alignItems: 'center', marginBottom: 12},
  title: {color: '#083F31', fontFamily: 'serif', fontSize: 29, fontWeight: '600'},
  subtitle: {marginTop: 5, color: '#37413F', fontSize: 12, lineHeight: 17, textAlign: 'center'},
  card: {overflow: 'hidden', borderWidth: 1, borderColor: '#E4D7C4', borderRadius: 18, backgroundColor: 'rgba(255,253,248,0.88)', paddingHorizontal: 12},
  row: {height: 43, flexDirection: 'row', alignItems: 'center'},
  rowIcon: {width: 64, height: 64, marginHorizontal: -17, resizeMode: 'contain'},
  separator: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DED8CD'},
  label: {flex: 1, marginLeft: 10, color: '#27312F', fontSize: 12},
  value: {maxWidth: '39%', marginLeft: 8, color: '#25302E', fontSize: 11, fontWeight: '600', textAlign: 'right'},
  illustrationArea: {flex: 1, minHeight: 130, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden'},
  woman: {width: '116%', height: '116%', resizeMode: 'contain', marginBottom: -12},
  startButton: {minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#176548', elevation: 3},
  startText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
});

export default SummaryScreen;
