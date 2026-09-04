import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {AwaTheme, AwaThemeId} from '../../config/awaThemes';

type PreviewPalette = {
  background: string;
  card: string;
  primary: string;
  primarySoft: string;
  text: string;
  muted: string;
  navigation: string;
  navText: string;
  border: string;
  organic1: string;
  organic2: string;
};

const PALETTES: Record<AwaThemeId, PreviewPalette> = {
  'awa-original': {background: '#F6F0FD', card: '#FFFFFF', primary: '#A464DE', primarySoft: '#E4CDF7', text: '#4A3167', muted: '#877797', navigation: '#FDFBFF', navText: '#8D64B3', border: '#EEE3F7', organic1: '#F0DCFA', organic2: '#E8D5F5'},
  'lavender-night': {background: '#191727', card: '#242033', primary: '#AF72F2', primarySoft: '#5D3B83', text: '#FFF9FF', muted: '#BFB2CB', navigation: '#211C2D', navText: '#C996FF', border: '#413750', organic1: '#272038', organic2: '#35284E'},
  'sage-serenity': {background: '#F5F7EF', card: '#FFFFFC', primary: '#7E9E76', primarySoft: '#D7E6D1', text: '#3F5741', muted: '#7C8C79', navigation: '#FBFCF8', navText: '#668261', border: '#E0E7DC', organic1: '#E5EEDC', organic2: '#EDF3E6'},
  'rose-quartz': {background: '#FFF7F7', card: '#FFFFFF', primary: '#D78C99', primarySoft: '#F4D2D7', text: '#744A55', muted: '#9C7B82', navigation: '#FFFBFB', navText: '#C37786', border: '#F3E1E4', organic1: '#F9DADB', organic2: '#FCE9E8'},
  'ocean-calm': {background: '#F2F8FD', card: '#FFFFFF', primary: '#659BD1', primarySoft: '#C9E0F5', text: '#365A7E', muted: '#718CA5', navigation: '#FAFDFF', navText: '#558CC2', border: '#DFEBF4', organic1: '#D9EAF8', organic2: '#EAF4FC'},
  'warm-sand': {background: '#FFF9EF', card: '#FFFDF9', primary: '#C99654', primarySoft: '#ECD3AD', text: '#6F5335', muted: '#9A8166', navigation: '#FFFCF7', navText: '#B98548', border: '#F1E5D2', organic1: '#F8E5C8', organic2: '#F9EEDB'},
  midnight: {background: '#121522', card: '#1B2030', primary: '#9568D7', primarySoft: '#493563', text: '#FFF7E9', muted: '#B3AFC0', navigation: '#181C29', navText: '#C89BEC', border: '#303648', organic1: '#23263A', organic2: '#2D2540'},
};

type Props = {theme: AwaTheme; horizontal?: boolean};

/** A single miniature AWA dashboard shared by every Appearance theme card. */
export function ThemePreview({theme, horizontal = false}: Props): React.JSX.Element {
  const palette = PALETTES[theme.id];
  const week = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const dates = ['11', '12', '13', '14', '15', '16', '17'];
  const ringSize = horizontal ? 39 : 47;

  return <View style={[styles.frame, horizontal && styles.frameHorizontal, {backgroundColor: palette.background, borderColor: palette.border}]}> 
    <View style={[styles.blobLarge, {backgroundColor: palette.organic1}]} />
    <View style={[styles.blobSmall, {backgroundColor: palette.organic2}]} />
    <View style={styles.calendar}>
      <Text style={[styles.month, {color: palette.muted}]}>Mai 2026⌄</Text>
      <View style={styles.weekRow}>{week.map((day, index) => <Text key={`${day}-${index}`} style={[styles.weekText, {color: palette.muted}]}>{day}</Text>)}</View>
      <View style={styles.weekRow}>{dates.map(date => <View key={date} style={[styles.day, date === '14' && {backgroundColor: palette.primary}]}><Text style={[styles.dayText, {color: palette.text}, date === '14' && styles.dayTextSelected]}>{date}</Text></View>)}</View>
    </View>
    <View style={[styles.status, {backgroundColor: palette.card, borderColor: palette.border}]}> 
      <View style={[styles.ring, {width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: palette.primarySoft}]}><View style={[styles.ringArc, {borderColor: palette.primary}]} /><View style={[styles.ringCenter, {backgroundColor: palette.card}]}><Text style={[styles.ringLabel, {color: palette.muted}]}>JOUR 14</Text></View></View>
      <View style={styles.statusCopy}><Text style={[styles.statusEyebrow, {color: palette.primary}]}>JOUR 14</Text><Text style={[styles.statusTitle, {color: palette.text}]}>Fertile</Text><Text style={[styles.statusText, {color: palette.muted}]}>Ovulation dans{horizontal ? ' 2 jours' : '\n2 jours'}</Text></View>
    </View>
    <View style={[styles.nav, {backgroundColor: palette.navigation, borderColor: palette.border}]}>{[
      ['home-variant-outline', 'Accueil'], ['pencil-outline', 'Suivi'], ['calendar-blank-outline', 'Calendrier'], ['book-open-outline', 'Bibliothèque'], ['account-outline', 'Profil'],
    ].map(([name, label], index) => <View key={label} style={styles.navItem}><MaterialDesignIcons color={index === 0 ? palette.primary : palette.navText} name={name as React.ComponentProps<typeof MaterialDesignIcons>['name']} size={8} /><Text style={[styles.navLabel, {color: index === 0 ? palette.primary : palette.navText}]}>{label}</Text></View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  frame: {height: 143, overflow: 'hidden', borderWidth: 1, borderRadius: 15, position: 'relative'},
  frameHorizontal: {height: 95},
  blobLarge: {position: 'absolute', width: 100, height: 72, right: -30, top: 28, borderRadius: 50, opacity: 0.65, transform: [{rotate: '-15deg'}]},
  blobSmall: {position: 'absolute', width: 72, height: 56, left: -24, bottom: 13, borderRadius: 35, opacity: 0.65, transform: [{rotate: '22deg'}]},
  calendar: {paddingHorizontal: 8, paddingTop: 6}, month: {marginBottom: 4, fontSize: 5.5, fontWeight: '700', textAlign: 'center'}, weekRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2}, weekText: {width: 13, fontSize: 4.8, fontWeight: '600', textAlign: 'center'}, day: {width: 13, height: 13, alignItems: 'center', justifyContent: 'center', borderRadius: 7}, dayText: {fontSize: 5, fontWeight: '700'},
  dayTextSelected: {color: '#FFFFFF'},
  status: {minHeight: 65, flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginTop: 2, paddingHorizontal: 7, paddingVertical: 5, borderWidth: 0.7, borderRadius: 13, shadowColor: '#000000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.04, shadowRadius: 4},
  ring: {alignItems: 'center', justifyContent: 'center', borderWidth: 7, position: 'relative'}, ringArc: {position: 'absolute', width: '100%', height: '100%', borderTopWidth: 6, borderRightWidth: 6, borderBottomWidth: 0, borderLeftWidth: 0, borderRadius: 50, transform: [{rotate: '20deg'}]}, ringCenter: {width: '72%', height: '72%', alignItems: 'center', justifyContent: 'center', borderRadius: 50}, ringLabel: {fontSize: 3.9, fontWeight: '800'},
  statusCopy: {flex: 1, marginLeft: 8}, statusEyebrow: {marginBottom: 1, fontSize: 4.2, fontWeight: '900'}, statusTitle: {marginBottom: 1, fontSize: 8.5, fontWeight: '900'}, statusText: {fontSize: 4.7, lineHeight: 6.5, fontWeight: '500'},
  nav: {position: 'absolute', right: 0, bottom: 0, left: 0, minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 4, paddingVertical: 3, borderTopWidth: 0.7}, navItem: {flex: 1, alignItems: 'center', justifyContent: 'center'}, navLabel: {marginTop: 1, fontSize: 3.3, fontWeight: '600'},
});
