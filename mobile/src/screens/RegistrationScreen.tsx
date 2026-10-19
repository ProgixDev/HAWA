import React, {useMemo, useState} from 'react';
import {Alert, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, TOP_SPACING_EXTRA, TOP_SPACING_EXTRA_COMPACT} from '../theme/spacing';
import {updatePersonalInformation} from '../state/personalInformationStore';
import {updatePrivacySecuritySettings} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import type {AwaRoles} from '../theme/semanticRoles';
import {useAwaTokens} from '../theme/useAwaTokens';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

const GOOGLE = require('../assets/images/auth-google-logo.png');
const APPLE = require('../assets/images/auth-apple-logo.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;
type FieldProps = {icon: IconName; label: string; placeholder: string; value: string; onChangeText: (value: string) => void; secure?: boolean; visible?: boolean; onToggle?: () => void; keyboardType?: 'default' | 'email-address'; error?: string; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>; t: (key: string, options?: Record<string, unknown>) => string};

function Field({icon, label, placeholder, value, onChangeText, secure, visible, onToggle, keyboardType = 'default', error, theme, styles, t}: FieldProps) {
  const toggleAction = visible ? t('auth.registration.togglePasswordHide') : t('auth.registration.togglePasswordShow');
  return <View>
    <View style={[styles.field, error ? styles.fieldError : null]}>
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={22} />
      <View style={styles.fieldCopy}><Text style={styles.fieldLabel}>{label}</Text><TextInput autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} keyboardType={keyboardType} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.textMuted} secureTextEntry={secure && !visible} selectionColor={theme.colors.primary} style={styles.input} textContentType={keyboardType === 'email-address' ? 'emailAddress' : secure ? 'password' : 'none'} value={value} /></View>
      {secure && <AwaIconButton accessibilityLabel={t('auth.registration.toggleVisibilityLabel', {action: toggleAction, label})} accessibilityRole="button" icon={visible ? 'eye-outline' : 'eye-off-outline'} iconSize={20} onPress={onToggle} size="small" />}
    </View>
    {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
  </View>;
}

function RegistrationScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const {roles} = useAwaTokens();
  const styles = useMemo(() => createStyles(theme, roles), [theme, roles]);
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
  const rules = useMemo(() => [{label: t('auth.registration.ruleMinLength'), valid: password.length >= 8}, {label: t('auth.registration.ruleDigit'), valid: /\d/.test(password)}, {label: t('auth.registration.ruleUppercase'), valid: /[A-Z]/.test(password)}, {label: t('auth.registration.ruleSpecialChar'), valid: /[^A-Za-z0-9]/.test(password)}], [password, t]);
  const allRulesValid = rules.every(rule => rule.valid);

  // TEMP FRONTEND-ONLY AUTH BYPASS:
  // Replace with real authentication once backend auth is connected. The
  // single place the final "Créer mon compte" CTA enters the main app. Also
  // clears anonymousMode (state/securityPreferences.ts — the same flag
  // ProfileScreen/AnonymousMode already read/write) so registering a normal
  // account after a previous Anonymous Mode session (e.g. via "Créer un
  // compte" on AnonymousModeScreen's own "Désactiver le mode Anonyme" card)
  // doesn't leave ProfileScreen stuck showing the anonymous identity.
  // emailError/passwordError/confirmationError state (and the Field/JSX
  // that render them) are left in place, unused for now, so real validation
  // drops back in cleanly once a backend exists — only isValidEmail's
  // import was removed since it became genuinely unused here.
  const enterMainApp = () => {
    updatePrivacySecuritySettings({anonymousMode: false});
    navigation.replace('MainTabs', {screen: 'CycleHome'});
  };

  const handleSubmit = async () => {
    if (submitting) {return;}

    try {
      setSubmitting(true);
      const trimmedFirstName = firstName.trim();
      // Only persists her chosen display name (same canonical store
      // NameOnboardingScreen/PersonalInformationScreen use) — anonymousMode
      // itself is cleared by enterMainApp() above, not here.
      if (trimmedFirstName) {await updatePersonalInformation({firstName: trimmedFirstName});}
      enterMainApp();
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSubmitting(false);
    }
  };
  return <LinearGradient colors={[...theme.gradients.pageBackground]} end={{x: 1, y: 1}} locations={[0, 0.32, 0.7, 1]} start={{x: 0, y: 0}} style={styles.background}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.page}><SafeAreaView style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} /><ScrollView contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 16) + 12, paddingTop: compact ? TOP_SPACING_EXTRA_COMPACT : TOP_SPACING_EXTRA}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.hero}>
      <View style={styles.brandArea}><Text style={styles.brand}>AWA</Text></View>
      <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{t('auth.registration.title')}</AwaText>
      <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">{t('auth.registration.subtitle')}</AwaText>
    </View>

    <View style={styles.formArea}>
      <View style={styles.tabs}>
        <Pressable accessibilityRole="tab" accessibilityState={{selected: false}} hitSlop={{top: 4, bottom: 4}} onPress={() => navigation.navigate('Auth')} style={styles.tab}>
          <Text style={styles.tabText}>{t('auth.shared.tabLogin')}</Text>
        </Pressable>
        <View accessibilityRole="tab" accessibilityState={{selected: true}} style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>{t('auth.shared.tabRegister')}</Text>
        </View>
      </View>
      <View style={styles.form}>
        <Field icon="account-outline" label={t('auth.registration.firstNameLabel')} onChangeText={setFirstName} placeholder={t('auth.registration.firstNamePlaceholder')} styles={styles} t={t} theme={theme} value={firstName} />
        <Field icon="account-outline" label={t('auth.registration.lastNameLabel')} onChangeText={setLastName} placeholder={t('auth.registration.lastNamePlaceholder')} styles={styles} t={t} theme={theme} value={lastName} />
        <Field error={emailError} icon="email-outline" keyboardType="email-address" label={t('auth.registration.emailLabel')} onChangeText={value => {setEmail(value); setEmailError(''); setInfoMessage('');}} placeholder={t('auth.registration.emailPlaceholder')} styles={styles} t={t} theme={theme} value={email} />
        <Field error={passwordError} icon="lock-outline" label={t('auth.registration.passwordLabel')} onChangeText={value => {setPassword(value); setPasswordError(''); setInfoMessage('');}} onToggle={() => setPasswordVisible(v => !v)} placeholder={t('auth.registration.passwordPlaceholder')} secure styles={styles} t={t} theme={theme} value={password} visible={passwordVisible} />
        <Field error={confirmationError} icon="lock-outline" label={t('auth.registration.confirmPasswordLabel')} onChangeText={value => {setConfirmation(value); setConfirmationError(''); setInfoMessage('');}} onToggle={() => setConfirmationVisible(v => !v)} placeholder={t('auth.registration.confirmPasswordPlaceholder')} secure styles={styles} t={t} theme={theme} value={confirmation} visible={confirmationVisible} />
      </View>
      <View style={styles.hint}>
        <MaterialDesignIcons color={allRulesValid ? theme.colors.primary : theme.colors.textMuted} name={allRulesValid ? 'check-circle' : 'information-outline'} size={16} />
        <Text style={[styles.hintText, allRulesValid && styles.hintTextValid]}>{t('auth.registration.hint')}</Text>
      </View>
      <AwaButton disabled={submitting} fullWidth label={t('auth.shared.createAccount')} onPress={handleSubmit} size="large" style={styles.primary} />
      {infoMessage ? (
        <AwaCard padding="compact" style={styles.infoCard} variant="filled">
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={16} />
          <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{infoMessage}</AwaText>
        </AwaCard>
      ) : null}
      <Text style={styles.or}>{t('auth.shared.orContinueWith')}</Text><View style={styles.socialRow}>
        <Pressable accessibilityLabel={t('auth.shared.continueWithGoogle')} accessibilityRole="button" onPress={() => Alert.alert('Google')} style={styles.social}><Image accessibilityIgnoresInvertColors source={GOOGLE} style={styles.socialLogo} /></Pressable>
        <Pressable accessibilityLabel={t('auth.shared.continueWithApple')} accessibilityRole="button" onPress={() => Alert.alert('Apple')} style={styles.social}><Image accessibilityIgnoresInvertColors source={APPLE} style={styles.socialLogo} /></Pressable>
        <Pressable accessibilityLabel={t('auth.shared.continueWithEmail')} accessibilityRole="button" onPress={() => Alert.alert('E-mail')} style={styles.social}><MaterialDesignIcons color={theme.colors.primary} name="email-outline" size={24} /></Pressable>
      </View>
    </View>

    <View style={styles.legalArea}>
      <Text style={styles.legal}>{t('auth.registration.legalPrefix')}</Text><Text style={styles.legalStrong}>{t('auth.shared.legalTerms')}</Text>
    </View>
  </ScrollView></SafeAreaView></KeyboardAvoidingView></LinearGradient>;
}

function createStyles(theme: ResolvedAwaTheme, roles: AwaRoles) {
  return StyleSheet.create({
  // Same canonical AWA page-background mechanism as the objective dashboards
  // (e.g. CycleHomeScreen.tsx): a theme-driven gradient plus 3 soft
  // decorative "glow" views, replacing the old auth-mosque-background.png.
  background: {flex: 1, backgroundColor: theme.colors.background},
  page: {flex: 1}, safeArea: {flex: 1, backgroundColor: 'transparent'}, content: {flexGrow: 1, justifyContent: 'center'}, hero: {alignItems: 'center'},
  formArea: {marginTop: spacing.xl},
  brandArea: {alignItems: 'center', paddingBottom: 4},
  brand: {color: theme.colors.text, fontFamily: 'serif', fontSize: 40, letterSpacing: 2},
  tabs: {flexDirection: 'row', gap: 9, marginHorizontal: spacing.lg},
  tab: {flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: roles.outline, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: withAlpha(theme.colors.surface, 0.90)},
  // DESIGN.md selected state: primaryContainer fill + onPrimaryContainer text + primary border (bold weight kept).
  tabActive: {borderColor: theme.colors.primary, backgroundColor: roles.primaryContainer},
  tabText: {color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center'},
  tabTextActive: {color: roles.onPrimaryContainer, fontWeight: '600'},
  title: {marginTop: 4, textAlign: 'center'}, subtitle: {marginTop: 4, textAlign: 'center'},
  form: {gap: 5, marginTop: 10, paddingHorizontal: spacing.lg}, field: {minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: withAlpha(theme.colors.surface, 0.92), paddingHorizontal: 16, paddingVertical: 8}, fieldCopy: {flex: 1}, fieldLabel: {color: theme.colors.text, fontSize: 12.5, fontWeight: '500'}, input: {minHeight: 24, paddingVertical: 0, color: theme.colors.text, fontSize: 12.5},
  fieldError: {borderColor: theme.colors.danger}, fieldErrorText: {marginTop: 4, marginBottom: 2, marginLeft: 4, color: theme.colors.danger, fontSize: 12, lineHeight: 16},
  hint: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: spacing.lg}, hintText: {flex: 1, color: theme.colors.textMuted, fontSize: 12, lineHeight: 16}, hintTextValid: {color: theme.colors.primary},
  primary: {marginTop: 12, marginHorizontal: spacing.lg},
  infoCard: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginHorizontal: spacing.lg}, infoText: {flex: 1},
  or: {marginVertical: 8, color: theme.colors.textMuted, fontSize: 12, textAlign: 'center'}, socialRow: {flexDirection: 'row', justifyContent: 'center', gap: 20}, social: {width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24, backgroundColor: theme.colors.surface}, socialLogo: {width: 26, height: 26, resizeMode: 'contain'},
  legalArea: {marginTop: 16}, legal: {color: theme.colors.textMuted, fontSize: 12, textAlign: 'center'}, legalStrong: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center'},
  });
}

export default RegistrationScreen;
