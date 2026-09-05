import React, {useState} from 'react';
import {
  Alert,
  Image,
  ImageBackground,
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
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  spacing,
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../theme/spacing';
import {isValidEmail} from '../utils/emailValidation';

const BACKGROUND = require('../assets/images/auth-mosque-background.png');
const APPLE_LOGO = require('../assets/images/auth-apple-logo.png');
const GOOGLE_LOGO = require('../assets/images/auth-google-logo.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_MUTED = '#655A8D';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

function AuthScreen({navigation}: Props): React.JSX.Element {
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

  const submit = () => {
    const trimmedEmail = email.trim();
    let hasError = false;

    if (!trimmedEmail) {
      setEmailError('Entre ton adresse e-mail.');
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError('Entre une adresse e-mail valide.');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Entre ton mot de passe.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) {
      setInfoMessage('');
      return;
    }

    // Frontend validation passing is NOT authentication — no backend exists
    // yet, so we neither navigate nor claim she's logged in.
    setInfoMessage(
      'La connexion sera disponible avec l’activation du service d’authentification.',
    );
  };

  return (
    <ImageBackground
      source={BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.safeArea}>
        <StatusBar
          translucent={false}
          backgroundColor="#F8EFFF"
          barStyle="dark-content"
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
                    color={PURPLE}
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
                    placeholderTextColor="#8A7FA6"
                    returnKeyType="next"
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
                    color={PURPLE}
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
                    placeholderTextColor="#8A7FA6"
                    returnKeyType="done"
                    secureTextEntry={!passwordVisible}
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
                      color={PURPLE}
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
                      color={PURPLE}
                      name="information-outline"
                      size={16}
                    />
                    <Text style={styles.infoText}>{infoMessage}</Text>
                  </View>
                ) : null}

                {__DEV__ ? (
                  <Pressable
                    accessibilityLabel="Continuer en mode développement — ne pas utiliser en production"
                    accessibilityRole="button"
                    onPress={() =>
                      navigation.replace('MainTabs', {screen: 'CycleHome'})
                    }
                    style={({pressed}) => [
                      styles.devBypass,
                      pressed && styles.pressed,
                    ]}>
                    <MaterialDesignIcons
                      color="#8A7FA6"
                      name="flask-outline"
                      size={14}
                    />
                    <Text style={styles.devBypassText}>
                      Continuer en mode développement
                    </Text>
                  </Pressable>
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
                      color={PURPLE}
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
                    color={PURPLE_DARK}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F8EFFF',
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
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 45,
    letterSpacing: 2,
    textShadowColor: 'rgba(255,255,255,0.85)',
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
    color: TEXT_MUTED,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.85)',
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
    borderColor: 'rgba(111,83,190,0.20)',
    borderRadius: 15,
    backgroundColor: 'rgba(255,252,255,0.90)',
  },

  tabCompact: {
    minHeight: 38,
  },

  tabActive: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  tabText: {
    color: '#5F547C',
    fontSize: 12,
  },

  tabTextActive: {
    color: '#FFFFFF',
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
    borderColor: 'rgba(111,83,190,0.20)',
    borderRadius: 13,
    backgroundColor: 'rgba(255,252,255,0.92)',
    paddingHorizontal: 13,
  },

  input: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    color: '#2A2050',
    fontSize: 13,
  },

  forgot: {
    marginTop: -3,
    marginBottom: 10,
    color: PURPLE,
    fontSize: 11,
    textAlign: 'right',
  },

  fieldError: {
    borderColor: '#C95565',
  },

  fieldErrorText: {
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 4,
    color: '#B4485A',
    fontSize: 10.5,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.16)',
    borderRadius: 14,
    backgroundColor: '#F1E8FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  infoText: {
    flex: 1,
    color: '#5F547C',
    fontSize: 11,
    lineHeight: 15,
  },

  devBypass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    minHeight: 34,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(138,127,166,0.45)',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },

  devBypassText: {
    color: '#8A7FA6',
    fontSize: 10.5,
    fontWeight: '600',
  },

  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },

  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  or: {
    marginVertical: 12,
    color: '#8A7FA6',
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
    borderColor: 'rgba(111,83,190,0.20)',
    borderRadius: 26,
    backgroundColor: '#FFFCFF',
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
    backgroundColor: 'rgba(246,239,255,0.9)',
    paddingHorizontal: 25,
  },

  anonymousText: {
    marginLeft: 8,
    color: PURPLE_DARK,
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
    color: '#8A7FA6',
    fontSize: 9,
    textAlign: 'center',
  },

  legalStrong: {
    marginTop: 2,
    color: '#5F547C',
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.82,
  },
});

export default AuthScreen;
