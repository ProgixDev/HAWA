import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getAuthTopPadding} from '../theme/spacing';
import {updatePersonalInformation} from '../state/personalInformationStore';
import {setHasCompletedOnboarding} from '../state/onboardingPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import type {AwaRoles} from '../theme/semanticRoles';
import {useAwaTokens} from '../theme/useAwaTokens';
import {presentSaveFailure} from '../services/saveFailure';
import {syncLocalDataToAccount} from '../services/accountSync';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

const GOOGLE = require('../assets/images/auth-google-logo.png');
const APPLE = require('../assets/images/auth-apple-logo.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;
type FieldProps = {icon: IconName; label: string; placeholder: string; value: string; onChangeText: (value: string) => void; secure?: boolean; visible?: boolean; onToggle?: () => void; keyboardType?: 'default' | 'email-address'; error?: string; invalid?: boolean; theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>; t: (key: string, options?: Record<string, unknown>) => string};

function Field({icon, label, placeholder, value, onChangeText, secure, visible, onToggle, keyboardType = 'default', error, invalid, theme, styles, t}: FieldProps) {
  const toggleAction = visible ? t('auth.registration.togglePasswordHide') : t('auth.registration.togglePasswordShow');
  // Same single-line field as the login form (AuthScreen): icon + input, the placeholder is the only hint; the label stays as the
  // input's accessibility label.
  return <View>
    <View style={[styles.field, error || invalid ? styles.fieldError : null]}>
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
      <TextInput accessibilityLabel={label} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} keyboardType={keyboardType} maxFontSizeMultiplier={1.2} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.colors.textMuted} secureTextEntry={secure && !visible} selectionColor={theme.colors.primary} style={styles.input} textContentType={keyboardType === 'email-address' ? 'emailAddress' : secure ? 'password' : 'none'} value={value} />
      {secure && <AwaIconButton accessibilityLabel={t('auth.registration.toggleVisibilityLabel', {action: toggleAction, label})} accessibilityRole="button" icon={visible ? 'eye-outline' : 'eye-off-outline'} iconSize={18} onPress={onToggle} size="small" />}
    </View>
    {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
  </View>;
}

function RegistrationScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const {roles} = useAwaTokens();
  const {height, width, fontScale} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // same breakpoint as AuthScreen, so the two forms keep the same spacing and field height
  const dense = height < 700 || width < 360 || fontScale > 1.15;
  const styles = useMemo(() => createStyles(theme, roles, dense), [theme, roles, dense]);
  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState(''); const [confirmVisible, setConfirmVisible] = useState(false);
  // The whole form fits on one page: the page only scrolls while the keyboard is open, or if the content still does not fit (small phone,
  // large system font) so nothing is ever unreachable.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  // The confirmation must repeat the password: a different value turns its border red and the account is not created until it matches.
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rules = useMemo(() => [{label: t('auth.registration.ruleMinLength'), valid: password.length >= 8}, {label: t('auth.registration.ruleDigit'), valid: /\d/.test(password)}, {label: t('auth.registration.ruleUppercase'), valid: /[A-Z]/.test(password)}, {label: t('auth.registration.ruleSpecialChar'), valid: /[^A-Za-z0-9]/.test(password)}], [password, t]);
  const allRulesValid = rules.every(rule => rule.valid);

  // TEMP FRONTEND-ONLY AUTH BYPASS:
  // Replace with real authentication once backend auth is connected. The single place the final "Créer mon compte" CTA enters the main
  // app. Entering the app is the end of onboarding, so it is recorded here (otherwise the next launch would show Welcome again).
  // emailError/passwordError state (and the Field/JSX that render them) are left in place, unused for now, so real validation drops
  // back in cleanly once a backend exists.
  const enterMainApp = () => {
    setHasCompletedOnboarding(true).catch(() => {});
    navigation.replace('MainTabs', {screen: 'CycleHome'});
  };

  const handleSubmit = async () => {
    if (submitting || confirmMismatch) {return;}

    try {
      setSubmitting(true);
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      // Only persists her chosen name (same canonical store
      // NameOnboardingScreen/PersonalInformationScreen use).
      if (trimmedFirstName || trimmedLastName) {
        await updatePersonalInformation({
          ...(trimmedFirstName ? {firstName: trimmedFirstName} : {}),
          ...(trimmedLastName ? {lastName: trimmedLastName} : {}),
        });
      }
      // TODO(backend): attach the data already on the phone to the new account (does nothing today).
      await syncLocalDataToAccount();
      enterMainApp();
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSubmitting(false);
    }
  };
  return <LinearGradient colors={[...theme.gradients.pageBackground]} end={{x: 1, y: 1}} locations={[0, 0.32, 0.7, 1]} start={{x: 0, y: 0}} style={styles.background}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={insets.top} style={styles.page}><SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}><StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} /><ScrollView bounces={false} onContentSizeChange={(_w, h) => setContentHeight(h)} onLayout={event => setViewportHeight(event.nativeEvent.layout.height)} overScrollMode="never" scrollEnabled={keyboardVisible || (viewportHeight > 0 && contentHeight > viewportHeight + 1)} contentContainerStyle={[styles.content, {paddingTop: getAuthTopPadding(dense, height, insets.top)}]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.hero}>
      <View style={styles.brandArea}>
        <Text maxFontSizeMultiplier={1.2} style={styles.brand}>AWA</Text>
        <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={styles.tagline}>{t('auth.login.tagline').replace(/\s*\n\s*/g, ' ')}</Text>
      </View>
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
        <Field icon="account-outline" label={t('auth.registration.firstNameLabel')} onChangeText={setFirstName} placeholder={t('auth.registration.firstNameLabel')} styles={styles} t={t} theme={theme} value={firstName} />
        <Field icon="account-outline" label={t('auth.registration.lastNameLabel')} onChangeText={setLastName} placeholder={t('auth.registration.lastNameLabel')} styles={styles} t={t} theme={theme} value={lastName} />
        <Field error={emailError} icon="email-outline" keyboardType="email-address" label={t('auth.registration.emailLabel')} onChangeText={value => {setEmail(value); setEmailError(''); setInfoMessage('');}} placeholder={t('auth.login.emailPlaceholder')} styles={styles} t={t} theme={theme} value={email} />
        <Field error={passwordError} icon="lock-outline" label={t('auth.registration.passwordLabel')} onChangeText={value => {setPassword(value); setPasswordError(''); setInfoMessage('');}} onToggle={() => setPasswordVisible(v => !v)} placeholder={t('auth.login.passwordPlaceholder')} secure styles={styles} t={t} theme={theme} value={password} visible={passwordVisible} />
        <Field icon="lock-check-outline" invalid={confirmMismatch} label={t('auth.registration.confirmPasswordLabel')} onChangeText={setConfirmPassword} onToggle={() => setConfirmVisible(v => !v)} placeholder={t('auth.registration.confirmPasswordLabel')} secure styles={styles} t={t} theme={theme} value={confirmPassword} visible={confirmVisible} />
      </View>
      <View style={styles.hint}>
        <MaterialDesignIcons color={allRulesValid ? theme.colors.primary : theme.colors.textMuted} name={allRulesValid ? 'check-circle' : 'information-outline'} size={16} />
        <Text style={[styles.hintText, allRulesValid && styles.hintTextValid]}>{t('auth.registration.hint')}</Text>
      </View>
      <AwaButton disabled={submitting} fullWidth label={t('auth.shared.createAccount')} minHeight={44} onPress={handleSubmit} style={styles.primary} />
      {infoMessage ? (
        <AwaCard padding="compact" style={styles.infoCard} variant="filled">
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={16} />
          <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{infoMessage}</AwaText>
        </AwaCard>
      ) : null}
      <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.or}>{t('auth.shared.orContinueWith')}</Text><View style={styles.dividerLine} /></View><View style={styles.socialRow}>
        <Pressable accessibilityLabel={t('auth.shared.continueWithGoogle')} accessibilityRole="button" onPress={() => Alert.alert('Google')} style={styles.social}><Image accessibilityIgnoresInvertColors source={GOOGLE} style={styles.socialLogo} /></Pressable>
        <Pressable accessibilityLabel={t('auth.shared.continueWithApple')} accessibilityRole="button" onPress={() => Alert.alert('Apple')} style={styles.social}><Image accessibilityIgnoresInvertColors source={APPLE} style={styles.socialLogo} /></Pressable>
        <Pressable accessibilityLabel={t('auth.shared.continueWithEmail')} accessibilityRole="button" onPress={() => Alert.alert('E-mail')} style={styles.social}><MaterialDesignIcons color={theme.colors.primary} name="email-outline" size={22} /></Pressable>
      </View>
    </View>

    <View style={styles.legalArea}>
      <Text style={styles.legal}>{t('auth.registration.legalPrefix')}</Text><Text style={styles.legalStrong}>{t('auth.shared.legalTerms')}</Text>
    </View>
  </ScrollView></SafeAreaView></KeyboardAvoidingView></LinearGradient>;
}

function createStyles(theme: ResolvedAwaTheme, roles: AwaRoles, dense: boolean) {
  // Same measures as AuthScreen (tabs, fields, divider, social buttons, horizontal margin), so switching between "Connexion" and
  // "Créer un compte" does not change how the form looks.
  const gap = dense ? 8 : 12;
  const edge = 20;
  return StyleSheet.create({
  // Same canonical AWA page-background mechanism as the objective dashboards
  // (e.g. CycleHomeScreen.tsx): a theme-driven gradient plus 3 soft
  // decorative "glow" views, replacing the old auth-mosque-background.png.
  background: {flex: 1, backgroundColor: theme.colors.background},
  page: {flex: 1}, safeArea: {flex: 1, backgroundColor: 'transparent'}, content: {flexGrow: 1, paddingBottom: 20}, hero: {alignItems: 'center'},
  formArea: {},
  brandArea: {alignItems: 'center', marginBottom: gap + (dense ? 6 : 36)},
  tagline: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15, fontWeight: '600', textAlign: 'center'},
  brand: {color: theme.colors.text, fontFamily: 'serif', fontSize: dense ? 30 : 34, lineHeight: dense ? 36 : 40, letterSpacing: 2},
  tabs: {flexDirection: 'row', gap: 8, marginHorizontal: edge},
  tab: {flex: 1, minHeight: dense ? 34 : 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: roles.outline, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: withAlpha(theme.colors.surface, 0.90)},
  // DESIGN.md selected state: primaryContainer fill + onPrimaryContainer text + primary border (bold weight kept).
  tabActive: {borderColor: theme.colors.primary, backgroundColor: roles.primaryContainer},
  tabText: {color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center'},
  tabTextActive: {color: roles.onPrimaryContainer, fontWeight: '600'},
  form: {marginTop: gap, paddingHorizontal: edge}, field: {minHeight: dense ? 42 : 46, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: dense ? 6 : 8, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: withAlpha(theme.colors.surface, 0.92), paddingHorizontal: 14}, input: {flex: 1, minHeight: 24, paddingVertical: 0, color: theme.colors.text, fontSize: 13},
  fieldError: {borderColor: theme.colors.danger}, fieldErrorText: {marginTop: -4, marginBottom: 6, marginLeft: 4, color: theme.colors.danger, fontSize: 11, lineHeight: 15},
  hint: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: dense ? 4 : 6, paddingHorizontal: edge}, hintText: {flex: 1, color: theme.colors.textMuted, fontSize: 12, lineHeight: 16}, hintTextValid: {color: theme.colors.primary},
  primary: {marginTop: gap, marginHorizontal: edge},
  infoCard: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginHorizontal: edge}, infoText: {flex: 1},
  dividerRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: gap, marginHorizontal: edge}, dividerLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
  or: {color: theme.colors.textMuted, fontSize: 11, lineHeight: 15}, socialRow: {flexDirection: 'row', justifyContent: 'center', gap: 16}, social: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 21, backgroundColor: theme.colors.surface}, socialLogo: {width: 24, height: 24, resizeMode: 'contain'},
  legalArea: {marginTop: 16}, legal: {color: theme.colors.textMuted, fontSize: 12, textAlign: 'center'}, legalStrong: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16, fontWeight: '600', textAlign: 'center'},
  });
}

export default RegistrationScreen;
