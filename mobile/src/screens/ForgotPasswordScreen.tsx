import React, {useMemo, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import HelpSupportModal from '../components/auth/HelpSupportModal';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {isValidEmail} from '../utils/emailValidation';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {AwaTextField} from '../components/ui/AwaTextField';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ForgotPassword'
>;

function ForgotPasswordScreen({
  navigation,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {height, width} = useWindowDimensions();

  const compact = height < 720 || width < 370;
  const veryCompact = height < 650 || width < 340;

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);

  const sendResetLink = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError(t('auth.forgotPassword.emailRequiredError'));
      setInfoMessage('');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError(t('auth.forgotPassword.emailInvalidError'));
      setInfoMessage('');
      return;
    }

    setEmailError('');
    // Frontend validation passing does NOT mean a reset e-mail was sent —
    // no e-mail service exists yet, so we never claim delivery here.
    setInfoMessage(t('auth.forgotPassword.infoValidEmail'));
  };

  const contactSupport = () => {
    setHelpVisible(true);
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
              <AwaIconButton
                accessibilityLabel={t('common.back')}
                hitSlop={12}
                icon="arrow-left"
                onPress={navigation.goBack}
                style={styles.backButton}
              />
            </View>

            <View style={styles.heading}>
              <AwaText
                accessibilityRole="header"
                style={styles.title}
                variant={compact ? 'headlineSmall' : 'headlineMedium'}>
                {t('auth.forgotPassword.title')}
              </AwaText>

              <AwaText
                colorRole="onSurfaceVariant"
                style={styles.subtitle}
                variant="bodyMedium">
                {t('auth.forgotPassword.subtitle')}
              </AwaText>
            </View>

            <AwaCard
              padding="default"
              style={[styles.card, compact && styles.cardCompact]}
              variant="elevated">
              <AwaText
                colorRole="onSurfaceVariant"
                style={styles.cardText}
                variant="bodyMedium">
                {t('auth.forgotPassword.cardText')}
              </AwaText>

              <AwaTextField
                autoCapitalize="none"
                autoCorrect={false}
                errorText={emailError || undefined}
                keyboardType="email-address"
                label={t('auth.registration.emailLabel')}
                leadingIcon="email-outline"
                onChangeText={value => {
                  setEmail(value);
                  setEmailError('');
                  setInfoMessage('');
                }}
                onSubmitEditing={sendResetLink}
                placeholder={t('auth.forgotPassword.emailFieldPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="send"
                selectionColor={theme.colors.primary}
                textContentType="emailAddress"
                value={email}
                wrapperStyle={styles.fieldWrapper}
              />
            </AwaCard>

            <AwaButton
              label={t('auth.forgotPassword.submit')}
              onPress={sendResetLink}
              size="large"
              style={[styles.primaryButton, compact && styles.primaryButtonCompact]}
            />

            {infoMessage ? (
              <AwaCard padding="compact" style={styles.infoCard} variant="filled">
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="information-outline"
                  size={16}
                />
                <AwaText
                  colorRole="onSurfaceVariant"
                  style={styles.infoText}
                  variant="bodySmall">
                  {infoMessage}
                </AwaText>
              </AwaCard>
            ) : null}

            <View style={styles.flexSpacer} />

            <AwaCard
              onPress={contactSupport}
              padding="compact"
              style={styles.helpCard}
              variant="filled">
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="headset"
                size={compact ? 20 : 22}
              />

              <View style={styles.helpCopy}>
                <AwaText variant="titleSmall">
                  {t('auth.forgotPassword.helpTitle')}
                </AwaText>

                <AwaText
                  colorRole="onSurfaceVariant"
                  style={styles.helpText}
                  variant="bodySmall">
                  {t('auth.forgotPassword.helpText')}
                </AwaText>
              </View>

              <MaterialDesignIcons
                color={theme.colors.primary}
                name="chevron-right"
                size={compact ? 20 : 22}
              />
            </AwaCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <HelpSupportModal onClose={() => setHelpVisible(false)} visible={helpVisible} />
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
    alignSelf: 'flex-start',
    marginTop: 8,
  },

  heading: {
    alignItems: 'center',
  },

  title: {
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },

  card: {
    marginTop: 18,
  },

  cardCompact: {
    marginTop: 14,
  },

  cardText: {
    textAlign: 'center',
  },

  fieldWrapper: {
    marginTop: 16,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '88%',
    maxWidth: 360,
    alignSelf: 'center',
    marginTop: 12,
  },

  infoText: {
    flex: 1,
  },

  primaryButton: {
    width: '88%',
    maxWidth: 360,
    alignSelf: 'center',
    marginTop: 16,
  },

  primaryButtonCompact: {
    width: '90%',
    marginTop: 13,
  },

  flexSpacer: {
    flex: 0.25,
    minHeight: 2,
  },

  helpCard: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: -6,
  },

  helpCopy: {
    flex: 1,
  },

  helpText: {
    marginTop: 2,
  },
  });
}

export default ForgotPasswordScreen;