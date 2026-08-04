import React, {useState} from 'react';
import {Image, ImageBackground, Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, View, type ImageSourcePropType} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing} from '../theme/spacing';
import {setBiometricEnabled, setPinEnabled} from '../state/securityPreferences';

const HEADER = require('../assets/images/security-header.png');
const BACKGROUND = require('../assets/images/school-selection-background.png');
const PIN = require('../assets/images/security-pin-icon.png');
const BIOMETRIC = require('../assets/images/security-biometric-icon.png');
const NOTIFICATION = require('../assets/images/security-notification-icon.png');
const SHIELD = require('../assets/images/security-shield-icon.png');

type Props = NativeStackScreenProps<RootStackParamList, 'SecuritySetup'>;
type OptionProps = {icon: ImageSourcePropType; title: string; description: string; value: boolean; onValueChange: (value: boolean) => void};

function SecurityOption({icon, title, description, value, onValueChange}: OptionProps) {
  return <View style={styles.option}><View style={styles.iconBox}><Image accessibilityIgnoresInvertColors source={icon} style={styles.icon} /></View><View style={styles.optionCopy}><Text style={styles.optionTitle}>{title}</Text><Text style={styles.optionDescription}>{description}</Text></View><Switch ios_backgroundColor="#DED2C5" onValueChange={onValueChange} thumbColor="#FFFFFF" trackColor={{false: '#DED2C5', true: '#176548'}} value={value} /></View>;
}

function SecuritySetupScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState(false); const [biometric, setBiometric] = useState(false); const [notifications, setNotifications] = useState(false);
  return <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.page}><View style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content" /><ScrollView contentContainerStyle={[styles.content, {paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm}]} showsVerticalScrollIndicator={false}>
    <ImageBackground source={HEADER} resizeMode="cover" style={styles.header}><Pressable accessibilityLabel="Retour" hitSlop={12} onPress={navigation.goBack} style={styles.back}><MaterialDesignIcons color="#174F3D" name="arrow-left" size={29} /></Pressable></ImageBackground>
    <View style={styles.heading}><Text style={styles.title}>Protège ton espace</Text><Text style={styles.subtitle}>{'Choisis ce que tu actives maintenant —\ntout est modifiable plus tard.'}</Text></View>
    <View style={styles.options}>
      <SecurityOption description={'Verrouiller l’application\nà l’ouverture'} icon={PIN} onValueChange={value => {setPin(value); setPinEnabled(value);}} title="Code PIN" value={pin} />
      <SecurityOption description={'Empreinte ou reconnaissance\nfaciale'} icon={BIOMETRIC} onValueChange={value => {setBiometric(value); setBiometricEnabled(value);}} title="Biométrie" value={biometric} />
      <SecurityOption description={'Masquer le contenu\ndes notifications'} icon={NOTIFICATION} onValueChange={setNotifications} title="Notifications discrètes" value={notifications} />
    </View>
    <View style={styles.info}><View style={styles.infoIconBox}><Image accessibilityIgnoresInvertColors source={SHIELD} style={styles.infoIcon} /></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>Tes choix sont privés et sécurisés.</Text><Text style={styles.infoText}>Tu peux les modifier à tout moment dans les paramètres.</Text></View><MaterialDesignIcons color="#9AA09D" name="chevron-right" size={26} /></View>
    <View style={styles.spacer} /><Pressable onPress={() => navigation.navigate('Privacy')} style={({pressed}) => [styles.continueButton, pressed && styles.pressed]}><Text style={styles.continueText}>Continuer</Text></Pressable>
  </ScrollView></View></ImageBackground>;
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#F8EFFF'}, safeArea: {flex: 1}, content: {flexGrow: 1}, header: {height: 214, marginBottom: -2}, back: {position: 'absolute', top: 12, left: 18, width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: 'rgba(249,244,255,0.92)'},
  heading: {alignItems: 'center', marginBottom: 13}, title: {color: '#28166F', fontFamily: 'serif', fontSize: 32, fontWeight: '700'}, subtitle: {marginTop: 5, color: '#655A8D', fontSize: 13, lineHeight: 19, textAlign: 'center'}, options: {gap: 8, paddingHorizontal: spacing.md}, option: {minHeight: 87, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(111,83,190,0.16)', borderRadius: 20, backgroundColor: 'rgba(255,252,255,0.92)', paddingHorizontal: 10}, iconBox: {width: 61, height: 61, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#F0E8FC'}, icon: {width: 68, height: 68, resizeMode: 'contain'}, optionCopy: {flex: 1, marginLeft: 11}, optionTitle: {color: '#2A2050', fontFamily: 'serif', fontSize: 18, fontWeight: '600'}, optionDescription: {marginTop: 3, color: '#756A90', fontSize: 12, lineHeight: 17},
  info: {minHeight: 74, flexDirection: 'row', alignItems: 'center', marginTop: 10, marginHorizontal: spacing.md, borderWidth: 1, borderColor: 'rgba(111,83,190,0.14)', borderRadius: 19, backgroundColor: 'rgba(255,252,255,0.80)', paddingHorizontal: 10}, infoIconBox: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#F0E8FC'}, infoIcon: {width: 57, height: 57, resizeMode: 'contain'}, infoCopy: {flex: 1, marginHorizontal: 9}, infoTitle: {color: '#4B328E', fontSize: 13, fontWeight: '600'}, infoText: {marginTop: 3, color: '#756A90', fontSize: 11, lineHeight: 16}, spacer: {flex: 1}, continueButton: {minHeight: 52, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.md, borderRadius: 18, backgroundColor: '#6949BE', shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9, elevation: 5}, continueText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'}, pressed: {opacity: 0.82},
});
export default SecuritySetupScreen;
