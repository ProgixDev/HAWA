import React, {useMemo, useState} from 'react';
import {
  Alert,
  Image,
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
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  spacing,
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../theme/spacing';
import {updatePrivacySecuritySettings} from '../state/securityPreferences';
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

function AuthScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const {roles} = useAwaTokens();
  const styles = useMemo(() => createStyles(theme, roles), [theme, roles]);
  const {height, width} = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const compact = height < 720 || width < 370;
  const veryCompact = height < 650 || width < 340;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // TEMP FRONTEND-ONLY AUTH BYPASS:
  // Replace with real authentication once backend auth is connected. The
  // single place "Se connecter" enters the main app. Also clears
  // anonymousMode (state/securityPreferences.ts — the same flag
  // ProfileScreen/AnonymousMode already read/write) so a normal login after
  // a previous Anonymous Mode session doesn't leave ProfileScreen stuck
  // showing the anonymous identity. emailError/passwordError state (and the
  // field/JSX that renders them) are left in place, unused for now, so real
  // validation drops back in cleanly once a backend exists — only
  // isValidEmail's import was removed since it became genuinely unused here.
  const enterMainApp = () => {
    updatePrivacySecuritySettings({anonymousMode: false});
    navigation.replace('MainTabs', {screen: 'CycleHome'});
  };

  const submit = () => {
    enterMainApp();
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      end={{x: 1, y: 1}}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      style={styles.background}>
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.safeArea}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
        />

        <View
          style={[
            styles.pageContent,
            compact && styles.pageContentCompact,
            {
              paddingTop: compact
                ? TOP_SPACING_EXTRA_COMPACT
                : TOP_SPACING_EXTRA,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}>
          <View
            style={[
              styles.topSection,
              compact && styles.topSectionCompact,
              veryCompact && styles.topSectionVeryCompact,
            ]}>
            <View style={styles.brandArea}>
              <Text
                style={[
                  styles.brand,
                  compact && styles.brandCompact,
                ]}>
                AWA
              </Text>

              <Text
                style={[
                  styles.tagline,
                  compact && styles.taglineCompact,
                ]}>
                {t('auth.login.tagline')}
              </Text>
            </View>

            <View
              style={[
                styles.tabs,
                compact && styles.tabsCompact,
              ]}>
              {(['login', 'register'] as const).map(tab => {
                const active = mode === tab;

                return (
                  <Pressable
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
                    style={({pressed}) => [
                      styles.tab,
                      compact && styles.tabCompact,
                      active && styles.tabActive,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.tabText,
                        active && styles.tabTextActive,
                      ]}>
                      {tab === 'login'
                        ? t('auth.shared.tabLogin')
                        : t('auth.shared.tabRegister')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
            style={styles.keyboardArea}>
            <ScrollView
              contentContainerStyle={[
                styles.formContainer,
                compact && styles.formContainerCompact,
                veryCompact && styles.formContainerVeryCompact,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <View
                  style={[styles.field, emailError && styles.fieldError]}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="email-outline"
                    size={20}
                  />

                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
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
                {emailError ? (
                  <Text style={styles.fieldErrorText}>{emailError}</Text>
                ) : null}

                <View
                  style={[styles.field, passwordError && styles.fieldError]}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="lock-outline"
                    size={20}
                  />

                  <TextInput
                    autoCapitalize="none"
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
                    accessibilityLabel={
                      passwordVisible
                        ? t('auth.shared.hidePassword')
                        : t('auth.shared.showPassword')
                    }
                    accessibilityRole="button"
                    icon={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                    iconSize={20}
                    onPress={() =>
                      setPasswordVisible(current => !current)
                    }
                    size="small"
                  />
                </View>
                {passwordError ? (
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                ) : null}

                {mode === 'login' ? (
                  <AwaButton
                    label={t('auth.login.forgotPassword')}
                    onPress={() =>
                      navigation.navigate('ForgotPassword')
                    }
                    size="compact"
                    style={styles.forgot}
                    variant="text"
                  />
                ) : null}

                <AwaButton
                  fullWidth
                  label={
                    mode === 'login'
                      ? t('auth.login.submit')
                      : t('auth.shared.createAccount')
                  }
                  onPress={submit}
                  size="large"
                />

                {infoMessage ? (
                  <AwaCard padding="compact" style={styles.infoCard} variant="filled">
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="information-outline"
                      size={16}
                    />
                    <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">
                      {infoMessage}
                    </AwaText>
                  </AwaCard>
                ) : null}

                <Text style={styles.or}>{t('auth.shared.orContinueWith')}</Text>

                <View style={styles.socialRow}>
                  <Pressable
                    accessibilityLabel={t('auth.shared.continueWithGoogle')}
                    onPress={() => Alert.alert('Google')}
                    style={({pressed}) => [
                      styles.social,
                      pressed && styles.pressed,
                    ]}>
                    <Image
                      accessibilityIgnoresInvertColors
                      source={GOOGLE_LOGO}
                      style={styles.socialLogo}
                    />
                  </Pressable>

                  <Pressable
                    accessibilityLabel={t('auth.shared.continueWithApple')}
                    onPress={() => Alert.alert('Apple')}
                    style={({pressed}) => [
                      styles.social,
                      pressed && styles.pressed,
                    ]}>
                    <Image
                      accessibilityIgnoresInvertColors
                      source={APPLE_LOGO}
                      style={styles.socialLogo}
                    />
                  </Pressable>

                  <Pressable
                    accessibilityLabel={t('auth.shared.continueWithEmail')}
                    onPress={() => Alert.alert('E-mail')}
                    style={({pressed}) => [
                      styles.social,
                      pressed && styles.pressed,
                    ]}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="email-outline"
                      size={24}
                    />
                  </Pressable>
                </View>

                <AwaButton
                  accessibilityLabel={t('auth.shared.useAnonymousMode')}
                  icon="incognito"
                  label={t('auth.shared.anonymousMode')}
                  onPress={() =>
                    navigation.navigate('AnonymousMode', {source: 'auth'})
                  }
                  style={styles.anonymous}
                  variant="tonal"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View
            style={[
              styles.legalArea,
              compact && styles.legalAreaCompact,
            ]}>
            <Text style={styles.legal}>
              {t('auth.login.legalPrefix')}
            </Text>

            <Text style={styles.legalStrong}>
              {t('auth.shared.legalTerms')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme, roles: AwaRoles) {
  return StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  safeArea: {
    flex: 1,
  },

  pageContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  pageContentCompact: {
    paddingHorizontal: spacing.md,
  },

  topSection: {
    flexShrink: 0,
  },

  topSectionCompact: {
    marginTop: -4,
  },

  topSectionVeryCompact: {
    marginTop: -7,
  },

  brandArea: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },

  brand: {
    color: theme.colors.text,
    // Brand logotype (approved): serif display lockup, kept on purpose. The text shadow was removed (DESIGN.md).
    fontFamily: 'serif',
    fontSize: 45,
    letterSpacing: 2,
  },

  brandCompact: {
    fontSize: 39,
  },

  tagline: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  taglineCompact: {
    fontSize: 11,
    lineHeight: 15,
  },

  tabs: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 4,
    marginBottom: 10,
  },

  tabsCompact: {
    marginBottom: 8,
  },

  tab: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: roles.outline,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
  },

  tabCompact: {
    minHeight: 38,
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

  keyboardArea: {
    flex: 1,
  },

  formContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },

  formContainerCompact: {
    paddingVertical: 6,
  },

  formContainerVeryCompact: {
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 4,
  },

  form: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },

  field: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    paddingHorizontal: 16,
  },

  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 0,
    color: theme.colors.text,
    fontSize: 14,
  },

  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },

  fieldError: {
    borderColor: theme.colors.danger,
  },

  fieldErrorText: {
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 4,
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 16,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },

  infoText: {
    flex: 1,
  },

  or: {
    marginVertical: 12,
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },

  social: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
  },

  socialLogo: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },

  anonymous: {
    alignSelf: 'center',
    marginTop: 15,
  },

  legalArea: {
    flexShrink: 0,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },

  legalAreaCompact: {
    paddingTop: 5,
  },

  legal: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },

  legalStrong: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.82,
  },
  });
}

export default AuthScreen;
