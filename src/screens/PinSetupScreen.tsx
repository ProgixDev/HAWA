import React, {useState} from 'react';
import {ImageBackground, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../theme/spacing';
import {isBiometricEnabled} from '../state/securityPreferences';

const BACKGROUND = require('../assets/images/school-selection-background.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_MUTED = '#655A8D';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'empty', '0', 'delete'] as const;
const letters: Record<string, string> = {2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ'};
type Props = NativeStackScreenProps<RootStackParamList, 'PinSetup'>;

function PinSetupScreen({navigation}: Props): React.JSX.Element {
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700;
  const [pin, setPin] = useState('');
  const enter = (key: typeof keys[number]) => {
    if (key === 'delete') {setPin(value => value.slice(0, -1)); return;}
    if (key === 'empty' || pin.length >= 4) {return;}
    const next = `${pin}${key}`; setPin(next);
    if (next.length === 4) {setTimeout(() => {if (isBiometricEnabled()) {navigation.replace('FaceIdSetup'); return;} navigation.replace('MainTabs', {screen: 'CycleHome'});}, 180);}
  };
  return <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content" /><View style={[styles.content, {paddingTop: (compact ? TOP_SPACING_EXTRA_COMPACT : TOP_SPACING_EXTRA) + spacing.lg, paddingBottom: Math.max(insets.bottom, 16) + spacing.lg}]}>
    <View style={styles.iconMedallion}><MaterialDesignIcons color={PURPLE} name="lock-outline" size={28} /></View>
    <Text style={styles.title}>Créez votre code PIN</Text><Text style={styles.subtitle}>{'Choisissez un code à 4 chiffres\npour protéger vos données.'}</Text>
    <View accessibilityLabel={`${pin.length} chiffres saisis`} style={styles.dots}>{[0,1,2,3].map(index => <View key={index} style={[styles.dot, index < pin.length && styles.dotFilled]} />)}</View>
    <View style={[styles.keypad, compact && styles.keypadCompact]}>{keys.map((key, index) => key === 'empty' ? <View key={key} style={[styles.key, compact && styles.keyCompact]} /> : <Pressable accessibilityLabel={key === 'delete' ? 'Effacer' : key} key={`${key}-${index}`} onPress={() => enter(key)} style={({pressed}) => [styles.key, compact && styles.keyCompact, styles.keyActive, pressed && styles.pressed]}>{key === 'delete' ? <MaterialDesignIcons color={PURPLE_DARK} name="backspace-outline" size={26} /> : <><Text style={styles.number}>{key}</Text>{letters[key] && <Text style={styles.letters}>{letters[key]}</Text>}</>}</Pressable>)}</View>
    <View style={styles.spacer} /><Pressable onPress={() => isBiometricEnabled() ? navigation.replace('FaceIdSetup') : navigation.replace('MainTabs', {screen: 'CycleHome'})}><Text style={styles.later}>Plus tard</Text></Pressable>
  </View></SafeAreaView></ImageBackground>;
}

const styles = StyleSheet.create({page:{flex:1,backgroundColor:'#F8EFFF'},safeArea:{flex:1},content:{flex:1,alignItems:'center',paddingHorizontal:spacing.lg},iconMedallion:{width:58,height:58,alignItems:'center',justifyContent:'center',borderRadius:29,backgroundColor:'#EEE3FA'},title:{marginTop:20,color:PURPLE_DARK,fontFamily:'serif',fontSize:22,fontWeight:'600'},subtitle:{marginTop:9,color:TEXT_MUTED,fontSize:13,lineHeight:19,textAlign:'center'},dots:{flexDirection:'row',gap:22,marginTop:32,marginBottom:31},dot:{width:15,height:15,borderWidth:1.5,borderColor:'rgba(111,83,190,0.30)',borderRadius:8,backgroundColor:'#FFFCFF'},dotFilled:{borderColor:PURPLE,backgroundColor:PURPLE},keypad:{width:236,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:14},keypadCompact:{width:206,rowGap:7},key:{width:62,height:62,alignItems:'center',justifyContent:'center',borderRadius:31},keyCompact:{width:54,height:54,borderRadius:27},keyActive:{backgroundColor:'rgba(255,252,255,0.92)',borderWidth:1,borderColor:'rgba(111,83,190,0.16)'},number:{color:PURPLE_DARK,fontSize:23,lineHeight:26},letters:{color:TEXT_MUTED,fontSize:7,fontWeight:'700',letterSpacing:1},spacer:{flex:1},later:{color:PURPLE,fontSize:13,fontWeight:'600'},pressed:{opacity:0.65}});
export default PinSetupScreen;
