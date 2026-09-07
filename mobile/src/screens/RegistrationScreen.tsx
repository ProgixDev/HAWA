import React, {useMemo, useState} from 'react';
import {Alert, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../theme/spacing';
import {updatePersonalInformation} from '../state/personalInformationStore';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, onPrimaryTextColor, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

const GOOGLE = require('../assets/images/auth-google-logo.png');
const APPLE = require('../assets/images/auth-apple-logo.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;
type FieldProps = {icon: IconName; label: string; placeholder: string; value: string; onChangeText: (value: string) => void; secure?: boolean; visible?: boolean; onToggle?: () => void; keyboardType?: 'default' | 'email-address'; error?: string; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>};

function Field({icon, label, placeholder, value, onChangeText, secure, visible, onToggle, keyboardType = 'default', error, theme, styles}: FieldProps) {
  return <View>
    <View style={[styles.field, error ? styles.fieldError : null]}>
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} />
      <View style={styles.fieldCopy}><Text style={styles.fieldLabel}>{label}</Text><TextInput autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.textMuted} secureTextEntry={secure && !visible} selectionColor={theme.colors.primary} style={styles.input} textContentType={keyboardType === 'email-address' ? 'emailAddress' : secure ? 'password' : 'none'} value={value} /></View>
      {secure && <Pressable accessibilityLabel={`${visible ? 'Masquer' : 'Afficher'} : ${label}`} accessibilityRole="button" hitSlop={12} onPress={onToggle}><MaterialDesignIcons color={theme.colors.primary} name={visible ? 'eye-outline' : 'eye-off-outline'} size={18} /></Pressable>}
    </View>
    {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
  </View>;
}

function RegistrationScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 700;
  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [passwordVisible, setPasswordVisible] = useState(false); const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmationError, setConfirmationError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rules = useMemo(() => [{label: '8 caractères minimum', valid: password.length >= 8}, {label: 'Un chiffre', valid: /\d/.test(password)}, {label: 'Une majuscule', valid: /[A-Z]/.test(password)}, {label: 'Un caractère spécial', valid: /[^A-Za-z0-9]/.test(password)}], [password]);
  const allRulesValid = rules.every(rule => rule.valid);

  // TEMP FRONTEND-ONLY AUTH BYPASS:
  // Replace with real authentication once backend auth is connected. Shared
  // by the final "Créer mon compte" CTA and the dev-mode shortcut below so
  // there is one single place that enters the main app. emailError/
  // passwordError/confirmationError state (and the Field/JSX that render
  // them) are left in place, unused for now, so real validation drops back
  // in cleanly once a backend exists — only isValidEmail's import was
  // removed since it became genuinely unused here.
  const enterMainApp = () => {
    navigation.replace('MainTabs', {screen: 'CycleHome'});
  };

  const handleSubmit = async () => {
    if (submitting) {return;}

    try {
      setSubmitting(true);
      const trimmedFirstName = firstName.trim();
      // Only persists her chosen display name (same canonical store
      // NameOnboardingScreen/PersonalInformationScreen use) — does NOT flip
      // anonymousMode, since no real account is actually created here yet.
      if (trimmedFirstName) {await updatePersonalInformation({firstName: trimmedFirstName});}
      enterMainApp();
    } finally {
      setSubmitting(false);
    }
  };
  return <LinearGradient colors={[...theme.gradients.pageBackground]} end={{x: 1, y: 1}} locations={[0, 0.32, 0.7, 1]} start={{x: 0, y: 0}} style={styles.background}><View pointerEvents="none" style={styles.pageBackgroundDecor}><View style={styles.pageGlowTop} /><View style={styles.pageGlowMiddle} /><View style={styles.pageGlowBottom} /></View><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} /><ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 12, paddingTop: compact ? TOP_SPACING_EXTRA_COMPACT : TOP_SPACING_EXTRA}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.hero}>
      <View style={styles.brandArea}><Text style={styles.brand}>AWA</Text></View>
      <Text style={styles.title}>Créer votre compte</Text>
      <Text style={styles.subtitle}>{'Rejoignez AWA et commencez\nvotre parcours en toute sérénité.'}</Text>
    </View>

    <View style={styles.formArea}>
      <View style={styles.tabs}>
        <Pressable accessibilityRole="tab" accessibilityState={{selected: false}} onPress={() => navigation.navigate('Auth')} style={styles.tab}>
          <Text style={styles.tabText}>Connexion</Text>
        </Pressable>
        <View accessibilityRole="tab" accessibilityState={{selected: true}} style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Créer un compte</Text>
        </View>
      </View>
      <View style={styles.form}>
        <Field icon="account-outline" label="Prénom" onChangeText={setFirstName} placeholder="Entrez votre prénom" styles={styles} theme={theme} value={firstName} />
        <Field icon="account-outline" label="Nom" onChangeText={setLastName} placeholder="Entrez votre nom" styles={styles} theme={theme} value={lastName} />
        <Field error={emailError} icon="email-outline" keyboardType="email-address" label="Adresse e-mail" onChangeText={value => {setEmail(value); setEmailError(''); setInfoMessage('');}} placeholder="Entrez votre adresse e-mail" styles={styles} theme={theme} value={email} />
        <Field error={passwordError} icon="lock-outline" label="Mot de passe" onChangeText={value => {setPassword(value); setPasswordError(''); setInfoMessage('');}} onToggle={() => setPasswordVisible(v => !v)} placeholder="Créez un mot de passe" secure styles={styles} theme={theme} value={password} visible={passwordVisible} />
        <Field error={confirmationError} icon="lock-outline" label="Confirmer le mot de passe" onChangeText={value => {setConfirmation(value); setConfirmationError(''); setInfoMessage('');}} onToggle={() => setConfirmationVisible(v => !v)} placeholder="Confirmez votre mot de passe" secure styles={styles} theme={theme} value={confirmation} visible={confirmationVisible} />
      </View>
      <View style={styles.hint}>
        <MaterialDesignIcons color={allRulesValid ? theme.colors.primary : theme.colors.textMuted} name={allRulesValid ? 'check-circle' : 'information-outline'} size={16} />
        <Text style={[styles.hintText, allRulesValid && styles.hintTextValid]}>8 caractères min., une majuscule, un chiffre et un caractère spécial</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{disabled: submitting}} disabled={submitting} onPress={handleSubmit} style={({pressed}) => [styles.primary, submitting && styles.disabled, pressed && !submitting && styles.pressed]}><Text style={styles.primaryText}>Créer mon compte</Text></Pressable>
      {infoMessage ? (
        <View style={styles.infoCard}>
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={16} />
          <Text style={styles.infoText}>{infoMessage}</Text>
        </View>
      ) : null}
      {__DEV__ ? (
        <Pressable
          accessibilityLabel="Continuer en mode développement — ne pas utiliser en production"
          accessibilityRole="button"
          onPress={enterMainApp}
          style={({pressed}) => [styles.devBypass, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.textMuted} name="flask-outline" size={14} />
          <Text style={styles.devBypassText}>Continuer en mode développement</Text>
        </Pressable>
      ) : null}
      <Text style={styles.or}>ou continuer avec</Text><View style={styles.socialRow}>
        <Pressable accessibilityLabel="Continuer avec Google" accessibilityRole="button" onPress={() => Alert.alert('Google')} style={styles.social}><Image accessibilityIgnoresInvertColors source={GOOGLE} style={styles.socialLogo} /></Pressable>
        <Pressable accessibilityLabel="Continuer avec Apple" accessibilityRole="button" onPress={() => Alert.alert('Apple')} style={styles.social}><Image accessibilityIgnoresInvertColors source={APPLE} style={styles.socialLogo} /></Pressable>
        <Pressable accessibilityLabel="Continuer avec une adresse e-mail" accessibilityRole="button" onPress={() => Alert.alert('E-mail')} style={styles.social}><MaterialDesignIcons color={theme.colors.primary} name="email-outline" size={24} /></Pressable>
      </View>
    </View>

    <View style={styles.legalArea}>
      <Text style={styles.legal}>En créant un compte, vous acceptez nos</Text><Text style={styles.legalStrong}>Conditions d’utilisation et notre Politique de confidentialité.</Text>
    </View>
  </ScrollView></SafeAreaView></KeyboardAvoidingView></LinearGradient>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  // Same canonical AWA page-background mechanism as the objective dashboards
  // (e.g. CycleHomeScreen.tsx): a theme-driven gradient plus 3 soft
  // decorative "glow" views, replacing the old auth-mosque-background.png.
  background: {flex: 1, backgroundColor: theme.colors.background},
  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  pageGlowTop: {position: 'absolute', top: -150, right: -110, width: 330, height: 330, borderRadius: 165, backgroundColor: withAlpha(theme.colors.primary, 0.07)},
  pageGlowMiddle: {position: 'absolute', top: '38%', left: -130, width: 260, height: 260, borderRadius: 130, backgroundColor: withAlpha(theme.colors.primary, 0.045)},
  pageGlowBottom: {position: 'absolute', bottom: -150, right: -100, width: 310, height: 310, borderRadius: 155, backgroundColor: withAlpha(theme.colors.primary, 0.05)},
  page: {flex: 1}, safeArea: {flex: 1, backgroundColor: 'transparent'}, content: {flexGrow: 1, justifyContent: 'center'}, hero: {alignItems: 'center'},
  formArea: {marginTop: spacing.xl},
  brandArea: {alignItems: 'center', paddingBottom: 4},
  brand: {color: theme.colors.text, fontFamily: 'serif', fontSize: 40, letterSpacing: 2, textShadowColor: withAlpha(theme.colors.background, 0.85), textShadowOffset: {width: 0, height: 1}, textShadowRadius: 8},
  tabs: {flexDirection: 'row', gap: 9, marginHorizontal: spacing.lg},
  tab: {flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: withAlpha(theme.colors.surface, 0.90)},
  tabActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
  tabText: {color: theme.colors.textSecondary, fontSize: 12},
  tabTextActive: {color: onPrimaryTextColor(theme), fontWeight: '600'},
  title: {marginTop: 4, color: theme.colors.text, fontSize: 20, fontWeight: '600', textAlign: 'center', textShadowColor: withAlpha(theme.colors.background, 0.85), textShadowOffset: {width: 0, height: 1}, textShadowRadius: 8}, subtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center', textShadowColor: withAlpha(theme.colors.background, 0.85), textShadowOffset: {width: 0, height: 1}, textShadowRadius: 6},
  form: {gap: 5, marginTop: 10, paddingHorizontal: spacing.lg}, field: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: withAlpha(theme.colors.surface, 0.92), paddingHorizontal: 12}, fieldCopy: {flex: 1}, fieldLabel: {color: theme.colors.text, fontSize: 12.5, fontWeight: '500'}, input: {height: 24, paddingVertical: 0, color: theme.colors.text, fontSize: 12.5},
  fieldError: {borderColor: theme.colors.danger}, fieldErrorText: {marginTop: 4, marginBottom: 2, marginLeft: 4, color: theme.colors.danger, fontSize: 10.5},
  hint: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: spacing.lg}, hintText: {flex: 1, color: theme.colors.textMuted, fontSize: 9.5, lineHeight: 13}, hintTextValid: {color: theme.colors.primary},
  primary: {minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginHorizontal: spacing.lg, borderRadius: 16, backgroundColor: theme.colors.primary, shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.25, shadowRadius: 9, elevation: 5}, primaryText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '600'},
  disabled: {opacity: 0.55}, pressed: {opacity: 0.85},
  infoCard: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginHorizontal: spacing.lg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, backgroundColor: theme.colors.primarySoft, paddingHorizontal: 12, paddingVertical: 10}, infoText: {flex: 1, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15},
  devBypass: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, marginHorizontal: spacing.lg, minHeight: 34, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, borderRadius: 12, backgroundColor: 'transparent'}, devBypassText: {color: theme.colors.textMuted, fontSize: 10.5, fontWeight: '600'},
  or: {marginVertical: 8, color: theme.colors.textMuted, fontSize: 11, textAlign: 'center'}, socialRow: {flexDirection: 'row', justifyContent: 'center', gap: 20}, social: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 22, backgroundColor: theme.colors.surface}, socialLogo: {width: 26, height: 26, resizeMode: 'contain'},
  legalArea: {marginTop: 16}, legal: {color: theme.colors.textMuted, fontSize: 9, textAlign: 'center'}, legalStrong: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 9, fontWeight: '600', textAlign: 'center'},
  });
}

export default RegistrationScreen;
