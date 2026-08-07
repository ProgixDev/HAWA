import React, {useMemo, useState} from 'react';
import {Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../theme/spacing';
import {isBiometricEnabled, isPinEnabled} from '../state/securityPreferences';
import {setFirstName as saveFirstName} from '../state/onboardingPreferences';

const BACKGROUND = require('../assets/images/auth-mosque-background.png');
const GOOGLE = require('../assets/images/auth-google-logo.png');
const APPLE = require('../assets/images/auth-apple-logo.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;
type FieldProps = {icon: IconName; label: string; placeholder: string; value: string; onChangeText: (value: string) => void; secure?: boolean; visible?: boolean; onToggle?: () => void; keyboardType?: 'default' | 'email-address'};

function Field({icon, label, placeholder, value, onChangeText, secure, visible, onToggle, keyboardType = 'default'}: FieldProps) {
  return <View style={styles.field}>
    <MaterialDesignIcons color={PURPLE} name={icon} size={22} />
    <View style={styles.fieldCopy}><Text style={styles.fieldLabel}>{label}</Text><TextInput autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#909390" secureTextEntry={secure && !visible} style={styles.input} value={value} /></View>
    {secure && <Pressable hitSlop={12} onPress={onToggle}><MaterialDesignIcons color={PURPLE} name={visible ? 'eye-outline' : 'eye-off-outline'} size={18} /></Pressable>}
  </View>;
}

function RegistrationScreen({navigation}: Props): React.JSX.Element {
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700;
  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [passwordVisible, setPasswordVisible] = useState(false); const [confirmationVisible, setConfirmationVisible] = useState(false);
  const rules = useMemo(() => [{label: '8 caractères minimum', valid: password.length >= 8}, {label: 'Un chiffre', valid: /\d/.test(password)}, {label: 'Une majuscule', valid: /[A-Z]/.test(password)}, {label: 'Un caractère spécial', valid: /[^A-Za-z0-9]/.test(password)}], [password]);
  const allRulesValid = rules.every(rule => rule.valid);
  return <ImageBackground source={BACKGROUND} resizeMode="cover" style={styles.background}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle="dark-content" /><ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 12, paddingTop: compact ? TOP_SPACING_EXTRA_COMPACT : TOP_SPACING_EXTRA}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.hero}>
      <View style={styles.brandArea}><Text style={styles.brand}>AWA</Text></View>
      <Text style={styles.title}>Créer votre compte</Text>
      <Text style={styles.subtitle}>{'Rejoignez AWA et commencez\nvotre parcours en toute sérénité.'}</Text>
    </View>

    <View style={styles.formArea}>
      <View style={styles.tabs}>
        <Pressable onPress={() => navigation.navigate('Auth')} style={styles.tab}>
          <Text style={styles.tabText}>Connexion</Text>
        </Pressable>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Créer un compte</Text>
        </View>
      </View>
      <View style={styles.form}>
        <Field icon="account-outline" label="Prénom" onChangeText={setFirstName} placeholder="Entrez votre prénom" value={firstName} />
        <Field icon="account-outline" label="Nom" onChangeText={setLastName} placeholder="Entrez votre nom" value={lastName} />
        <Field icon="email-outline" keyboardType="email-address" label="Adresse e-mail" onChangeText={setEmail} placeholder="Entrez votre adresse e-mail" value={email} />
        <Field icon="lock-outline" label="Mot de passe" onChangeText={setPassword} onToggle={() => setPasswordVisible(v => !v)} placeholder="Créez un mot de passe" secure value={password} visible={passwordVisible} />
        <Field icon="lock-outline" label="Confirmer le mot de passe" onChangeText={setConfirmation} onToggle={() => setConfirmationVisible(v => !v)} placeholder="Confirmez votre mot de passe" secure value={confirmation} visible={confirmationVisible} />
      </View>
      <View style={styles.hint}>
        <MaterialDesignIcons color={allRulesValid ? PURPLE : '#B3A6CC'} name={allRulesValid ? 'check-circle' : 'information-outline'} size={16} />
        <Text style={[styles.hintText, allRulesValid && styles.hintTextValid]}>8 caractères min., une majuscule, un chiffre et un caractère spécial</Text>
      </View>
      <Pressable onPress={() => {if (password !== confirmation) {Alert.alert('Compte', 'Les mots de passe ne correspondent pas.'); return;} saveFirstName(firstName); if (isPinEnabled()) {navigation.navigate('PinSetup'); return;} if (isBiometricEnabled()) {navigation.navigate('FaceIdSetup'); return;} navigation.replace('MainTabs', {screen: 'CycleHome'});}} style={styles.primary}><Text style={styles.primaryText}>Créer mon compte</Text></Pressable>
      <Text style={styles.or}>ou continuer avec</Text><View style={styles.socialRow}>
        <Pressable onPress={() => Alert.alert('Google')} style={styles.social}><Image accessibilityIgnoresInvertColors source={GOOGLE} style={styles.socialLogo} /></Pressable>
        <Pressable onPress={() => Alert.alert('Apple')} style={styles.social}><Image accessibilityIgnoresInvertColors source={APPLE} style={styles.socialLogo} /></Pressable>
        <Pressable onPress={() => Alert.alert('E-mail')} style={styles.social}><MaterialDesignIcons color={PURPLE} name="email-outline" size={24} /></Pressable>
      </View>
    </View>

    <View style={styles.legalArea}>
      <Text style={styles.legal}>En créant un compte, vous acceptez nos</Text><Text style={styles.legalStrong}>Conditions d’utilisation et notre Politique de confidentialité.</Text>
    </View>
  </ScrollView></SafeAreaView></KeyboardAvoidingView></ImageBackground>;
}

const styles = StyleSheet.create({
  background: {flex: 1},
  page: {flex: 1}, safeArea: {flex: 1}, content: {flexGrow: 1, justifyContent: 'center'}, hero: {alignItems: 'center'},
  formArea: {marginTop: spacing.xl},
  brandArea: {alignItems: 'center', paddingBottom: 4},
  brand: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 40, letterSpacing: 2, textShadowColor: 'rgba(255,255,255,0.85)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 8},
  tabs: {flexDirection: 'row', gap: 9, marginHorizontal: spacing.lg},
  tab: {flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(111,83,190,0.20)', borderRadius: 14, backgroundColor: 'rgba(255,252,255,0.90)'},
  tabActive: {borderColor: PURPLE, backgroundColor: PURPLE},
  tabText: {color: '#5F547C', fontSize: 12},
  tabTextActive: {color: '#FFFFFF', fontWeight: '600'},
  title: {marginTop: 4, color: PURPLE_DARK, fontSize: 20, fontWeight: '600', textAlign: 'center', textShadowColor: 'rgba(255,255,255,0.85)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 8}, subtitle: {marginTop: 3, color: '#655A8D', fontSize: 12, lineHeight: 16, textAlign: 'center', textShadowColor: 'rgba(255,255,255,0.85)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 6},
  form: {gap: 5, marginTop: 10, paddingHorizontal: spacing.lg}, field: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(111,83,190,0.20)', borderRadius: 14, backgroundColor: 'rgba(255,252,255,0.92)', paddingHorizontal: 12}, fieldCopy: {flex: 1}, fieldLabel: {color: '#2A2050', fontSize: 12.5, fontWeight: '500'}, input: {height: 24, paddingVertical: 0, color: '#2A2050', fontSize: 12.5},
  hint: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: spacing.lg}, hintText: {flex: 1, color: '#8A7FA6', fontSize: 9.5, lineHeight: 13}, hintTextValid: {color: PURPLE},
  primary: {minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginHorizontal: spacing.lg, borderRadius: 16, backgroundColor: PURPLE, shadowColor: '#4E319A', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9, elevation: 5}, primaryText: {color: '#FFFFFF', fontSize: 16, fontWeight: '600'},
  or: {marginVertical: 8, color: '#8A7FA6', fontSize: 11, textAlign: 'center'}, socialRow: {flexDirection: 'row', justifyContent: 'center', gap: 20}, social: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(111,83,190,0.20)', borderRadius: 22, backgroundColor: '#FFFCFF'}, socialLogo: {width: 26, height: 26, resizeMode: 'contain'},
  legalArea: {marginTop: 16}, legal: {color: '#8A7FA6', fontSize: 9, textAlign: 'center'}, legalStrong: {marginTop: 2, color: '#5F547C', fontSize: 9, fontWeight: '600', textAlign: 'center'},
});
export default RegistrationScreen;
