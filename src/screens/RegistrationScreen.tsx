import React, {useMemo, useState} from 'react';
import {Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View, type ImageSourcePropType} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing} from '../theme/spacing';
import {isBiometricEnabled, isPinEnabled} from '../state/securityPreferences';
import {setFirstName as saveFirstName} from '../state/onboardingPreferences';

const HEADER = require('../assets/images/auth-mosque-header.png');
const USER = require('../assets/images/register-user-icon.png');
const EMAIL = require('../assets/images/register-email-icon.png');
const LOCK = require('../assets/images/register-lock-icon.png');
const GOOGLE = require('../assets/images/auth-google-logo.png');
const APPLE = require('../assets/images/auth-apple-logo.png');
const EMAIL_SOCIAL = require('../assets/images/auth-email-logo.png');
const CHECK_ICON = require('../assets/images/cycle-check-icon.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;
type FieldProps = {icon: ImageSourcePropType; label: string; placeholder: string; value: string; onChangeText: (value: string) => void; secure?: boolean; visible?: boolean; onToggle?: () => void; keyboardType?: 'default' | 'email-address'};

function Field({icon, label, placeholder, value, onChangeText, secure, visible, onToggle, keyboardType = 'default'}: FieldProps) {
  return <View style={styles.field}>
    <Image accessibilityIgnoresInvertColors source={icon} style={styles.fieldIcon} />
    <View style={styles.fieldCopy}><Text style={styles.fieldLabel}>{label}</Text><TextInput autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#909390" secureTextEntry={secure && !visible} style={styles.input} value={value} /></View>
    {secure && <Pressable hitSlop={12} onPress={onToggle}><MaterialDesignIcons color="#155B47" name={visible ? 'eye-outline' : 'eye-off-outline'} size={18} /></Pressable>}
  </View>;
}

function RegistrationScreen({navigation}: Props): React.JSX.Element {
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700;
  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [passwordVisible, setPasswordVisible] = useState(false); const [confirmationVisible, setConfirmationVisible] = useState(false);
  const rules = useMemo(() => [{label: '8 caractères minimum', valid: password.length >= 8}, {label: 'Un chiffre', valid: /\d/.test(password)}, {label: 'Une majuscule', valid: /[A-Z]/.test(password)}, {label: 'Un caractère spécial', valid: /[^A-Za-z0-9]/.test(password)}], [password]);
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content" /><ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 12}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <ImageBackground source={HEADER} resizeMode="cover" style={[styles.hero, compact && styles.heroCompact]}><Pressable accessibilityLabel="Retour" hitSlop={12} onPress={navigation.goBack} style={[styles.back, {top: Math.max(insets.top, 12)}]}><MaterialDesignIcons color="#155B47" name="arrow-left" size={31} /></Pressable><View style={styles.brandArea}><Text style={styles.brand}>HAWA</Text></View></ImageBackground>
    <View style={styles.tabs}>
      <Pressable onPress={() => navigation.navigate('Auth')} style={styles.tab}>
        <Text style={styles.tabText}>Connexion</Text>
      </Pressable>
      <View style={[styles.tab, styles.tabActive]}>
        <Text style={[styles.tabText, styles.tabTextActive]}>Créer un compte</Text>
      </View>
    </View>
    <Text style={styles.title}>Créer votre compte</Text><Text style={styles.subtitle}>{'Rejoignez HAWA et commencez\nvotre parcours en toute sérénité.'}</Text>
    <View style={styles.form}>
      <Field icon={USER} label="Prénom" onChangeText={setFirstName} placeholder="Entrez votre prénom" value={firstName} />
      <Field icon={USER} label="Nom" onChangeText={setLastName} placeholder="Entrez votre nom" value={lastName} />
      <Field icon={EMAIL} keyboardType="email-address" label="Adresse e-mail" onChangeText={setEmail} placeholder="Entrez votre adresse e-mail" value={email} />
      <Field icon={LOCK} label="Mot de passe" onChangeText={setPassword} onToggle={() => setPasswordVisible(v => !v)} placeholder="Créez un mot de passe" secure value={password} visible={passwordVisible} />
      <Field icon={LOCK} label="Confirmer le mot de passe" onChangeText={setConfirmation} onToggle={() => setConfirmationVisible(v => !v)} placeholder="Confirmez votre mot de passe" secure value={confirmation} visible={confirmationVisible} />
    </View>
    <View style={styles.rules}>{rules.map(rule => <View key={rule.label} style={styles.rule}><Image accessibilityIgnoresInvertColors source={CHECK_ICON} style={[styles.ruleCheck, !rule.valid && styles.ruleCheckInactive]} /><Text style={[styles.ruleText, rule.valid && styles.ruleValid]}>{rule.label}</Text></View>)}</View>
    <Pressable onPress={() => {if (password !== confirmation) {Alert.alert('Compte', 'Les mots de passe ne correspondent pas.'); return;} saveFirstName(firstName); if (isPinEnabled()) {navigation.navigate('PinSetup'); return;} if (isBiometricEnabled()) {navigation.navigate('FaceIdSetup'); return;} navigation.replace('CycleHome');}} style={styles.primary}><Text style={styles.primaryText}>Créer mon compte</Text></Pressable>
    <Text style={styles.or}>ou continuer avec</Text><View style={styles.socialRow}>{[[GOOGLE, 'Google'], [APPLE, 'Apple'], [EMAIL_SOCIAL, 'E-mail']].map(([source, label]) => <Pressable key={label as string} onPress={() => Alert.alert(label as string)} style={styles.social}><Image accessibilityIgnoresInvertColors source={source as ImageSourcePropType} style={styles.socialLogo} /></Pressable>)}</View>
    <Text style={styles.legal}>En créant un compte, vous acceptez nos</Text><Text style={styles.legalStrong}>Conditions d’utilisation et notre Politique de confidentialité.</Text>
  </ScrollView></SafeAreaView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#FBF6EC'}, safeArea: {flex: 1}, content: {paddingBottom: 20}, hero: {height: 230, justifyContent: 'flex-end'},
  heroCompact: {height: 175},
  back: {position: 'absolute', top: 44, left: 17, width: 46, height: 46, alignItems: 'center', justifyContent: 'center'}, brandArea: {alignItems: 'center', paddingBottom: 4}, brand: {color: '#0B5847', fontFamily: 'serif', fontSize: 48, letterSpacing: 2},
  tabs: {flexDirection: 'row', gap: 9, marginTop: 8, marginHorizontal: spacing.lg},
  tab: {flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8DED0', borderRadius: 15, backgroundColor: 'rgba(255,253,248,0.9)'},
  tabActive: {borderColor: '#176548', backgroundColor: '#176548'},
  tabText: {color: '#33413D', fontSize: 12},
  tabTextActive: {color: '#FFFFFF', fontWeight: '600'},
  title: {marginTop: 7, color: '#155B47', fontSize: 23, fontWeight: '600', textAlign: 'center'}, subtitle: {marginTop: 6, color: '#858989', fontSize: 14, lineHeight: 20, textAlign: 'center'},
  form: {gap: 7, marginTop: 17, paddingHorizontal: spacing.lg}, field: {minHeight: 61, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5DACC', borderRadius: 16, backgroundColor: 'rgba(255,253,248,0.92)', paddingHorizontal: 10}, fieldIcon: {width: 36, height: 36, marginHorizontal: -4, resizeMode: 'contain'}, fieldCopy: {flex: 1, marginLeft: 8}, fieldLabel: {color: '#18211F', fontSize: 14, fontWeight: '500'}, input: {height: 31, paddingVertical: 0, color: '#26302D', fontSize: 13},
  rules: {flexDirection: 'row', flexWrap: 'wrap', marginTop: 13, paddingHorizontal: spacing.xl}, rule: {width: '50%', flexDirection: 'row', alignItems: 'center', marginBottom: 8}, ruleCheck: {width: 45, height: 45, marginHorizontal: -12, resizeMode: 'contain'}, ruleCheckInactive: {opacity: 0.28}, ruleText: {marginLeft: 7, color: '#606966', fontSize: 11}, ruleValid: {color: '#176548'},
  primary: {minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 4, marginHorizontal: spacing.lg, borderRadius: 17, backgroundColor: '#176548', elevation: 2}, primaryText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  or: {marginVertical: 14, color: '#858B89', fontSize: 13, textAlign: 'center'}, socialRow: {flexDirection: 'row', justifyContent: 'center', gap: 28}, social: {width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DED6C9', borderRadius: 25, backgroundColor: '#FFFCF6'}, socialLogo: {width: 30, height: 30, resizeMode: 'contain'},
  legal: {marginTop: 17, color: '#7D8381', fontSize: 10, textAlign: 'center'}, legalStrong: {marginTop: 3, color: '#175D49', fontSize: 10, fontWeight: '600', textAlign: 'center'},
});
export default RegistrationScreen;
