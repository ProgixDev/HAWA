import React, {useState} from 'react';
import {Alert, Image, ImageBackground, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing} from '../theme/spacing';
import {isBiometricEnabled} from '../state/securityPreferences';

const LOCK_ICON = require('../assets/images/security-pin-icon.png');
const DELETE_ICON = require('../assets/images/pin-delete-icon.png');
const BACKGROUND = require('../assets/images/objective-background.png');
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'empty', '0', 'delete'] as const;
const letters: Record<string, string> = {2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ'};
type Props = NativeStackScreenProps<RootStackParamList, 'PinSetup'>;

function PinSetupScreen({navigation}: Props): React.JSX.Element {
  const [pin, setPin] = useState('');
  const enter = (key: typeof keys[number]) => {
    if (key === 'delete') {setPin(value => value.slice(0, -1)); return;}
    if (key === 'empty' || pin.length >= 4) {return;}
    const next = `${pin}${key}`; setPin(next);
    if (next.length === 4) {setTimeout(() => {if (isBiometricEnabled()) {navigation.replace('FaceIdSetup'); return;} Alert.alert('Code PIN créé', 'Ton espace est maintenant protégé.');}, 180);}
  };
  return <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content" /><View style={styles.content}>
    <View style={styles.iconMedallion}><Image accessibilityIgnoresInvertColors source={LOCK_ICON} style={styles.lockIcon} /></View>
    <Text style={styles.title}>Créez votre code PIN</Text><Text style={styles.subtitle}>{'Choisissez un code à 4 chiffres\npour protéger vos données.'}</Text>
    <View accessibilityLabel={`${pin.length} chiffres saisis`} style={styles.dots}>{[0,1,2,3].map(index => <View key={index} style={[styles.dot, index < pin.length && styles.dotFilled]} />)}</View>
    <View style={styles.keypad}>{keys.map((key, index) => key === 'empty' ? <View key={key} style={styles.key} /> : <Pressable accessibilityLabel={key === 'delete' ? 'Effacer' : key} key={`${key}-${index}`} onPress={() => enter(key)} style={({pressed}) => [styles.key, styles.keyActive, pressed && styles.pressed]}>{key === 'delete' ? <Image accessibilityIgnoresInvertColors source={DELETE_ICON} style={styles.deleteIcon} /> : <><Text style={styles.number}>{key}</Text>{letters[key] && <Text style={styles.letters}>{letters[key]}</Text>}</>}</Pressable>)}</View>
    <View style={styles.spacer} /><Pressable onPress={() => isBiometricEnabled() ? navigation.replace('FaceIdSetup') : navigation.goBack()}><Text style={styles.later}>Plus tard</Text></Pressable>
  </View></SafeAreaView></ImageBackground>;
}

const styles = StyleSheet.create({page:{flex:1,backgroundColor:'#FBF6EC'},safeArea:{flex:1},content:{flex:1,alignItems:'center',paddingTop:64,paddingBottom:32,paddingHorizontal:spacing.lg},iconMedallion:{width:58,height:58,alignItems:'center',justifyContent:'center',borderRadius:29,backgroundColor:'#F5EBD9'},lockIcon:{width:68,height:68,resizeMode:'contain'},title:{marginTop:20,color:'#14201D',fontFamily:'serif',fontSize:22,fontWeight:'600'},subtitle:{marginTop:9,color:'#55605C',fontSize:13,lineHeight:19,textAlign:'center'},dots:{flexDirection:'row',gap:22,marginTop:32,marginBottom:31},dot:{width:15,height:15,borderWidth:1.5,borderColor:'#B7A88F',borderRadius:8,backgroundColor:'#FFFDF8'},dotFilled:{borderColor:'#176548',backgroundColor:'#176548'},keypad:{width:236,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:14},key:{width:62,height:62,alignItems:'center',justifyContent:'center',borderRadius:31},keyActive:{backgroundColor:'#F6EDDE'},deleteIcon:{width:46,height:46,resizeMode:'contain'},number:{color:'#15201D',fontSize:23,lineHeight:26},letters:{color:'#40504A',fontSize:7,fontWeight:'700',letterSpacing:1},spacer:{flex:1},later:{color:'#176548',fontSize:13,fontWeight:'600'},pressed:{opacity:0.65}});
export default PinSetupScreen;
