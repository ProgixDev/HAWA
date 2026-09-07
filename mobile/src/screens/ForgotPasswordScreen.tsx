import React, {useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {isValidEmail} from '../utils/emailValidation';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, onPrimaryTextColor, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ForgotPassword'
>;

function ForgotPasswordScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {height, width} = useWindowDimensions();

  const compact = height < 720 || width < 370;
  const veryCompact = height < 650 || width < 340;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const sendResetLink = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Entre ton adresse e-mail.');
      setInfoMessage('');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Entre une adresse e-mail valide.');
      setInfoMessage('');
      return;
    }

    setEmailError('');
    // Frontend validation passing does NOT mean a reset e-mail was sent —
    // no e-mail service exists yet, so we never claim delivery here.
    setInfoMessage(
      'L’adresse est valide. L’envoi du lien de réinitialisation sera disponible avec le service d’authentification.',
    );
  };

  const contactSupport = () => {
    Alert.alert(
      'Besoin d’aide ?',
      'Notre équipe support te répondra rapidement.',
    );
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.page}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              compact && styles.contentCompact,
              veryCompact && styles.contentVeryCompact,
              {
                paddingTop: getTopPadding(insets.top),
                paddingBottom: Math.max(insets.bottom, 12) + 6,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.hero,
                compact && styles.heroCompact,
                veryCompact && styles.heroVeryCompact,
              ]}>
              <Pressable
                accessibilityLabel="Retour"
                accessibilityRole="button"
                hitSlop={12}
                onPress={navigation.goBack}
                style={({pressed}) => [
                  styles.backButton,
                  compact && styles.backButtonCompact,
                  pressed && styles.pressed,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.text}
                  name="arrow-left"
                  size={compact ? 22 : 24}
                />
              </Pressable>
            </View>

            <View style={styles.heading}>
              <Text
                style={[
                  styles.title,
                  compact && styles.titleCompact,
                ]}>
                Mot de passe oublié ?
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  compact && styles.subtitleCompact,
                ]}>
                {
                  'Pas de souci. Entre ton adresse e-mail\net nous t’enverrons un lien de réinitialisation.'
                }
              </Text>
            </View>

            <View
              style={[
                styles.card,
                compact && styles.cardCompact,
                veryCompact && styles.cardVeryCompact,
              ]}>
              <View
                style={[
                  styles.cardIcon,
                  compact && styles.cardIconCompact,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="email-lock"
                  size={compact ? 29 : 34}
                />
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  compact && styles.cardTitleCompact,
                ]}>
                Adresse e-mail
              </Text>

              <Text
                style={[
                  styles.cardText,
                  compact && styles.cardTextCompact,
                ]}>
                Nous t’enverrons les instructions nécessaires pour réinitialiser ton mot de passe.
              </Text>

              <View
                style={[
                  styles.field,
                  compact && styles.fieldCompact,
                  emailError && styles.fieldError,
                ]}>
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
                  placeholder="exemple@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  returnKeyType="send"
                  onSubmitEditing={sendResetLink}
                  selectionColor={theme.colors.primary}
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                />
              </View>
              {emailError ? (
                <Text style={styles.fieldErrorText}>{emailError}</Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={sendResetLink}
              style={({pressed}) => [
                styles.primaryButton,
                compact && styles.primaryButtonCompact,
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.primaryText,
                  compact && styles.primaryTextCompact,
                ]}>
                Envoyer le lien de réinitialisation
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

            <View style={styles.flexSpacer} />

            <Pressable
              accessibilityRole="button"
              onPress={contactSupport}
              style={({pressed}) => [
                styles.helpCard,
                compact && styles.helpCardCompact,
                pressed && styles.pressed,
              ]}>
              <View
                style={[
                  styles.helpIcon,
                  compact && styles.helpIconCompact,
                ]}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="headset"
                  size={compact ? 20 : 22}
                />
              </View>

              <View style={styles.helpCopy}>
                <Text
                  style={[
                    styles.helpTitle,
                    compact && styles.helpTitleCompact,
                  ]}>
                  Besoin d’aide ?
                </Text>

                <Text
                  numberOfLines={2}
                  style={[
                    styles.helpText,
                    compact && styles.helpTextCompact,
                  ]}>
                  Contacte notre support, nous sommes là pour t’aider.
                </Text>
              </View>

              <MaterialDesignIcons
                color={theme.colors.primary}
                name="chevron-right"
                size={compact ? 20 : 22}
              />
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
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

  page: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },

  contentCompact: {
    paddingHorizontal: spacing.md,
  },

  contentVeryCompact: {
    paddingHorizontal: 12,
  },

  hero: {
    height: 178,
    justifyContent: 'flex-start',
  },

  heroCompact: {
    height: 138,
  },

  heroVeryCompact: {
    height: 112,
  },

  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 22,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },

  backButtonCompact: {
    width: 40,
    height: 40,
    marginTop: 6,
    borderRadius: 20,
  },

  heading: {
    alignItems: 'center',
  },

  title: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: withAlpha(theme.colors.background, 0.85),
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 8,
  },

  titleCompact: {
    fontSize: 24,
  },

  subtitle: {
    marginTop: 8,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    textShadowColor: withAlpha(theme.colors.background, 0.85),
    textShadowOffset: {
      width: 0,
      height: 1,
    },
    textShadowRadius: 6,
  },

  subtitleCompact: {
    marginTop: 6,
    fontSize: 11.5,
    lineHeight: 16,
  },

  card: {
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  cardCompact: {
    marginTop: 14,
    borderRadius: 21,
    paddingHorizontal: 15,
    paddingVertical: 16,
  },

  cardVeryCompact: {
    marginTop: 10,
    paddingVertical: 13,
  },

  cardIcon: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    backgroundColor: theme.colors.primarySoft,
  },

  cardIconCompact: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },

  cardTitle: {
    marginTop: 12,
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },

  cardTitleCompact: {
    marginTop: 9,
    fontSize: 15.5,
  },

  cardText: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },

  cardTextCompact: {
    fontSize: 10.5,
    lineHeight: 15,
  },

  field: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: withAlpha(theme.colors.surface, 0.95),
    paddingHorizontal: 14,
  },

  fieldCompact: {
    minHeight: 48,
    marginTop: 12,
  },

  input: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    color: theme.colors.text,
    fontSize: 13.5,
  },

  fieldError: {
    borderColor: theme.colors.danger,
  },

  fieldErrorText: {
    marginTop: 6,
    marginLeft: 4,
    color: theme.colors.danger,
    fontSize: 11,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '88%',
    maxWidth: 360,
    alignSelf: 'center',
    marginTop: 12,
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
    fontSize: 11.5,
    lineHeight: 16,
  },

  primaryButton: {
    width: '88%',
    maxWidth: 360,
    minHeight: 52,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
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

  primaryButtonCompact: {
    width: '90%',
    minHeight: 48,
    marginTop: 13,
  },

  primaryText: {
    color: onPrimaryTextColor(theme),
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  primaryTextCompact: {
    fontSize: 13.5,
  },

  flexSpacer: {
    flex: 0.25,
    minHeight: 2,
  },

  helpCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: -6,
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.primarySoft, 0.9),
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  helpCardCompact: {
    minHeight: 64,
    marginTop: -4,
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },

  helpIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.surface,
  },

  helpIconCompact: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },

  helpCopy: {
    flex: 1,
  },

  helpTitle: {
    color: theme.colors.text,
    fontSize: 13.5,
    fontWeight: '700',
  },

  helpTitleCompact: {
    fontSize: 12,
  },

  helpText: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },

  helpTextCompact: {
    fontSize: 9.5,
    lineHeight: 13,
  },

  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.99}],
  },
  });
}

export default ForgotPasswordScreen;