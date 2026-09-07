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

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  spacing,
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../theme/spacing';
import {updatePrivacySecuritySettings} from '../state/securityPreferences';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

const APPLE_LOGO = require('../assets/images/auth-apple-logo.png');
const GOOGLE_LOGO = require('../assets/images/auth-google-logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

function AuthScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
                {'Pour une vie alignée,\nà chaque étape.'}
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
                        ? 'Connexion'
                        : 'Créer un compte'}
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
                    placeholder="Adresse e-mail"
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
                    placeholder="Mot de passe"
                    placeholderTextColor={theme.colors.textMuted}
                    returnKeyType="done"
                    secureTextEntry={!passwordVisible}
                    selectionColor={theme.colors.primary}
                    style={styles.input}
                    textContentType="password"
                    value={password}
                  />

                  <Pressable
                    accessibilityLabel={
                      passwordVisible
                        ? 'Masquer le mot de passe'
                        : 'Afficher le mot de passe'
                    }
                    hitSlop={10}
                    onPress={() =>
                      setPasswordVisible(current => !current)
                    }>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name={
                        passwordVisible
                          ? 'eye-outline'
                          : 'eye-off-outline'
                      }
                      size={20}
                    />
                  </Pressable>
                </View>
                {passwordError ? (
                  <Text style={styles.fieldErrorText}>{passwordError}</Text>
                ) : null}

                {mode === 'login' ? (
                  <Pressable
                    onPress={() =>
                      navigation.navigate('ForgotPassword')
                    }>
                    <Text style={styles.forgot}>
                      Mot de passe oublié ?
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={submit}
                  style={({pressed}) => [
                    styles.primaryButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.primaryText}>
                    {mode === 'login'
                      ? 'Se connecter'
                      : 'Créer mon compte'}
                  </Text>
                </Pressable>

                {infoMessage ? (
                  <View style={styles.infoCard}>
                    <MaterialDesignIcons
                      color={theme.colors.primary}
                      name="information-outline"
                      size={16}
                    />
                    <Text style={styles.infoText}>{infoMessage}</Text>
                  </View>
                ) : null}

                <Text style={styles.or}>ou continuer avec</Text>

                <View style={styles.socialRow}>
                  <Pressable
                    accessibilityLabel="Continuer avec Google"
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
                    accessibilityLabel="Continuer avec Apple"
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
                    accessibilityLabel="Continuer avec une adresse e-mail"
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

                <Pressable
                  accessibilityLabel="Utiliser AWA en mode anonyme"
                  accessibilityRole="button"
                  onPress={() =>
                    navigation.navigate('AnonymousMode', {source: 'auth'})
                  }
                  style={({pressed}) => [
                    styles.anonymous,
                    pressed && styles.pressed,
                  ]}>
                  <MaterialDesignIcons
                    color={theme.colors.text}
                    name="incognito"
                    size={22}
                  />

                  <Text style={styles.anonymousText}>
                    Mode anonyme
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <View
            style={[
              styles.legalArea,
              compact && styles.legalAreaCompact,
            ]}>
            <Text style={styles.legal}>
              En continuant, vous acceptez nos
            </Text>

            <Text style={styles.legalStrong}>
              Conditions d’utilisation et notre Politique de confidentialité.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
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
    height: 190,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },

  brand: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 45,
    letterSpacing: 2,
    textShadowColor: withAlpha(theme.colors.background, 0.85),
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 8,
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
    textShadowColor: withAlpha(theme.colors.background, 0.85),
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 6,
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
    borderColor: theme.colors.border,
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.surface, 0.90),
  },

  tabCompact: {
    minHeight: 38,
  },

  tabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },

  tabTextActive: {
    color: onPrimaryTextColor(theme),
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
    borderRadius: 13,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    color: theme.colors.text,
    fontSize: 13,
  },

  forgot: {
    marginTop: -3,
    marginBottom: 10,
    color: theme.colors.primary,
    fontSize: 11,
    textAlign: 'right',
  },

  fieldError: {
    borderColor: theme.colors.danger,
  },

  fieldErrorText: {
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 4,
    color: theme.colors.danger,
    fontSize: 10.5,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  infoText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },

  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },

  primaryText: {
    color: onPrimaryTextColor(theme),
    fontSize: 15,
    fontWeight: '600',
  },

  or: {
    marginVertical: 12,
    color: theme.colors.textMuted,
    fontSize: 11,
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
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 15,
    borderRadius: 21,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.9),
    paddingHorizontal: 25,
  },

  anonymousText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 9,
    textAlign: 'center',
  },

  legalStrong: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.82,
  },
  });
}

export default AuthScreen;
