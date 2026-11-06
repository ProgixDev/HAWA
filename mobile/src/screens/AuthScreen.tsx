import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {setHasCompletedOnboarding} from '../state/onboardingPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import type {AwaRoles} from '../theme/semanticRoles';
import {useAwaTokens} from '../theme/useAwaTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

const APPLE_LOGO = require('../assets/images/auth-apple-logo.png');
const GOOGLE_LOGO = require('../assets/images/auth-google-logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

// One screen, no scrolling: a flexible column that fills the height — the content grouped at the top, the legal line pushed to the
// bottom. When the room is short (small phone, enlarged system font) the vertical spacing is compressed first (`dense`). The column sits
// in a ScrollView ONLY so the keyboard can never hide a field: it scrolls while the keyboard is open (and, as a last resort, if the
// content still cannot fit — a very large font size — so the "Continuer sans compte" button is never cut off).
function AuthScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const {roles} = useAwaTokens();
  const {height, width, fontScale} = useWindowDimensions();

  const dense = height < 700 || width < 360 || fontScale > 1.15;
  const styles = useMemo(() => createStyles(theme, roles, dense), [theme, roles, dense]);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [legalHeight, setLegalHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const overflows = contentHeight > viewportHeight + 1 && viewportHeight > 0;

  // TEMP FRONTEND-ONLY AUTH BYPASS:
  // Replace with real authentication once backend auth is connected. The single place "Se connecter" and "Continuer sans compte" enter
  // the main app. An account is optional: nothing here creates one. Entering the app is the end of onboarding, so it is recorded here
  // (state/onboardingPreferences.ts), otherwise the next launch would show Welcome again. emailError/passwordError state (and the
  // field/JSX that renders them) are left in place, unused for now, so real validation drops back in cleanly once a backend exists.
  const enterMainApp = () => {
    setHasCompletedOnboarding(true).catch(() => {});
    navigation.replace('MainTabs', {screen: 'CycleHome'});
  };

  const submit = () => {
    enterMainApp();
  };

  const withoutAccountLabel = t('auth.shared.continueWithoutAccount', {defaultValue: 'Continuer sans compte'});

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.background}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
        <StatusBar translucent backgroundColor="transparent" barStyle={theme.statusBarStyle} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0} style={styles.keyboardArea}>
          <ScrollView
            bounces={false}
            contentContainerStyle={styles.column}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={(_w, h) => setContentHeight(h)}
            onLayout={event => setViewportHeight(event.nativeEvent.layout.height)}
            overScrollMode="never"
            scrollEnabled={keyboardVisible || overflows}
            showsVerticalScrollIndicator={false}>
            <View style={[styles.main, !dense && {paddingTop: legalHeight}]}>
              <View style={styles.brandArea}>
                <Text maxFontSizeMultiplier={1.2} style={styles.brand}>AWA</Text>
                <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={styles.tagline}>
                  {t('auth.login.tagline').replace(/\s*\n\s*/g, ' ')}
                </Text>
              </View>

              <View accessibilityRole="tablist" style={styles.tabs}>
                {(['login', 'register'] as const).map(tab => {
                  const active = mode === tab;
                  const label = tab === 'login' ? t('auth.shared.tabLogin') : t('auth.shared.tabRegister');

                  return (
                    <Pressable
                      accessibilityLabel={label}
                      accessibilityRole="tab"
                      accessibilityState={{selected: active}}
                      hitSlop={{top: 4, bottom: 4}}
                      key={tab}
                      onPress={() => {
                        if (tab === 'register') {
                          navigation.navigate('Registration');
                          return;
                        }

                        setMode(tab);
                      }}
                      style={({pressed}) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}>
                      <Text maxFontSizeMultiplier={1.2} style={[styles.tabText, active && styles.tabTextActive]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.form}>
                <View style={[styles.field, emailError && styles.fieldError]}>
                  <MaterialDesignIcons color={theme.colors.primary} name="email-outline" size={18} />
                  <TextInput
                    accessibilityLabel={t('auth.registration.emailLabel')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    maxFontSizeMultiplier={1.2}
                    onChangeText={value => {
                      setEmail(value);
                      setEmailError('');
                      setInfoMessage('');
                    }}
                    placeholder={t('auth.login.emailPlaceholder')}
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="next"
                    selectionColor={theme.colors.primary}
                    style={styles.input}
                    textContentType="emailAddress"
                    value={email}
                  />
                </View>
                {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}

                <View style={[styles.field, passwordError && styles.fieldError]}>
                  <MaterialDesignIcons color={theme.colors.primary} name="lock-outline" size={18} />
                  <TextInput
                    accessibilityLabel={t('auth.registration.passwordLabel')}
                    autoCapitalize="none"
                    maxFontSizeMultiplier={1.2}
                    onChangeText={value => {
                      setPassword(value);
                      setPasswordError('');
                      setInfoMessage('');
                    }}
                    placeholder={t('auth.login.passwordPlaceholder')}
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="done"
                    secureTextEntry={!passwordVisible}
                    selectionColor={theme.colors.primary}
                    style={styles.input}
                    textContentType="password"
                    value={password}
                  />
                  <AwaIconButton
                    accessibilityLabel={passwordVisible ? t('auth.shared.hidePassword') : t('auth.shared.showPassword')}
                    accessibilityRole="button"
                    icon={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                    iconSize={18}
                    onPress={() => setPasswordVisible(current => !current)}
                    size="small"
                  />
                </View>
                {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}

                {mode === 'login' ? (
                  <AwaButton
                    accessibilityLabel={t('auth.login.forgotPassword')}
                    label={t('auth.login.forgotPassword')}
                    minHeight={30}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    size="compact"
                    style={styles.forgot}
                    variant="text"
                  />
                ) : null}

                <AwaButton
                  accessibilityLabel={mode === 'login' ? t('auth.login.submit') : t('auth.shared.createAccount')}
                  fullWidth
                  label={mode === 'login' ? t('auth.login.submit') : t('auth.shared.createAccount')}
                  minHeight={44}
                  onPress={submit}
                />

                {infoMessage ? (
                  <AwaCard padding="compact" style={styles.infoCard} variant="filled">
                    <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={16} />
                    <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">
                      {infoMessage}
                    </AwaText>
                  </AwaCard>
                ) : null}

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text maxFontSizeMultiplier={1.2} style={styles.dividerText}>{t('auth.shared.orContinueWith')}</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialRow}>
                  <Pressable
                    accessibilityLabel={t('auth.shared.continueWithGoogle')}
                    accessibilityRole="button"
                    onPress={() => Alert.alert('Google')}
                    style={({pressed}) => [styles.social, pressed && styles.pressed]}>
                    <Image accessibilityIgnoresInvertColors source={GOOGLE_LOGO} style={styles.socialLogo} />
                  </Pressable>

                  <Pressable
                    accessibilityLabel={t('auth.shared.continueWithApple')}
                    accessibilityRole="button"
                    onPress={() => Alert.alert('Apple')}
                    style={({pressed}) => [styles.social, pressed && styles.pressed]}>
                    <Image accessibilityIgnoresInvertColors source={APPLE_LOGO} style={styles.socialLogo} />
                  </Pressable>

                  <Pressable
                    accessibilityLabel={t('auth.shared.continueWithEmail')}
                    accessibilityRole="button"
                    onPress={() => Alert.alert('E-mail')}
                    style={({pressed}) => [styles.social, pressed && styles.pressed]}>
                    <MaterialDesignIcons color={theme.colors.primary} name="email-outline" size={22} />
                  </Pressable>
                </View>

                <AwaButton
                  accessibilityLabel={withoutAccountLabel}
                  fullWidth
                  label={withoutAccountLabel}
                  minHeight={44}
                  onPress={enterMainApp}
                  style={styles.skip}
                  variant="tonal"
                />
              </View>
            </View>

            <Text maxFontSizeMultiplier={1.2} onLayout={event => setLegalHeight(event.nativeEvent.layout.height + styles.legal.marginTop)} style={styles.legal}>
              {t('auth.login.legalPrefix')} {t('auth.shared.legalTerms')}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme, roles: AwaRoles, dense: boolean) {
  // Every vertical gap shrinks first when the room is short.
  const gap = dense ? 8 : 12;
  const fieldHeight = dense ? 42 : 46;

  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    safeArea: {
      flex: 1,
    },

    keyboardArea: {
      flex: 1,
    },

    // fills the height: the main block on top, the legal line pushed to the bottom
    column: {
      flexGrow: 1,
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: dense ? 8 : 20,
      paddingBottom: 8,
    },

    // takes the free height and centres the form in it (the legal line stays at the bottom; on a roomy screen an equal space above the
    // form makes it sit in the middle of the WHOLE screen, not just of what is left above the legal line)
    main: {
      flex: 1,
      justifyContent: 'center',
      width: '100%',
      maxWidth: 440,
      alignSelf: 'center',
    },

    brandArea: {
      alignItems: 'center',
      marginBottom: gap,
    },

    brand: {
      color: theme.colors.text,
      // Brand logotype (approved): serif display lockup, kept on purpose.
      fontFamily: 'serif',
      fontSize: dense ? 30 : 34,
      lineHeight: dense ? 36 : 40,
      letterSpacing: 2,
    },

    tagline: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '600',
      textAlign: 'center',
    },

    tabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: gap,
    },

    tab: {
      flex: 1,
      minHeight: dense ? 34 : 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: roles.outline,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      backgroundColor: withAlpha(theme.colors.surface, 0.9),
    },

    // DESIGN.md selected state: primaryContainer fill + onPrimaryContainer text + primary border (bold weight kept).
    tabActive: {
      borderColor: theme.colors.primary,
      backgroundColor: roles.primaryContainer,
    },

    tabText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
    },

    tabTextActive: {
      color: roles.onPrimaryContainer,
      fontWeight: '600',
    },

    form: {
      width: '100%',
    },

    // one line: icon + the input, whose placeholder is the only hint (no separate label above)
    field: {
      minHeight: fieldHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: dense ? 8 : 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.colors.surface, 0.92),
      paddingHorizontal: 14,
    },

    input: {
      flex: 1,
      minHeight: 24,
      paddingVertical: 0,
      color: theme.colors.text,
      fontSize: 13,
    },

    forgot: {
      alignSelf: 'flex-end',
      marginBottom: dense ? 4 : 6,
    },

    fieldError: {
      borderColor: theme.colors.danger,
    },

    fieldErrorText: {
      marginTop: -4,
      marginBottom: 6,
      marginLeft: 4,
      color: theme.colors.danger,
      fontSize: 11,
      lineHeight: 15,
    },

    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },

    infoText: {
      flex: 1,
    },

    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginVertical: gap,
    },

    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
    },

    dividerText: {
      color: theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 15,
    },

    socialRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
    },

    social: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 21,
      backgroundColor: theme.colors.surface,
    },

    socialLogo: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
    },

    skip: {
      marginTop: gap,
    },

    legal: {
      marginTop: gap,
      color: theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 15,
      textAlign: 'center',
    },

    pressed: {
      opacity: 0.82,
    },
  });
}

export default AuthScreen;
