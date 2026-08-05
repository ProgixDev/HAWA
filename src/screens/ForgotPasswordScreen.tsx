import React, {useState} from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';

const BACKGROUND = require('../assets/images/auth-mosque-background.png');

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_MUTED = '#655A8D';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ForgotPassword'
>;

function ForgotPasswordScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {height, width} = useWindowDimensions();

  const compact = height < 720 || width < 370;
  const veryCompact = height < 650 || width < 340;

  const [email, setEmail] = useState('');

  const sendResetLink = () => {
    Alert.alert(
      'Lien envoyé',
      'Vérifie ta boîte e-mail pour réinitialiser ton mot de passe.',
    );
  };

  const contactSupport = () => {
    Alert.alert(
      'Besoin d’aide ?',
      'Notre équipe support te répondra rapidement.',
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.page}>
          <View
            style={[
              styles.content,
              compact && styles.contentCompact,
              veryCompact && styles.contentVeryCompact,
              {
                paddingTop: getTopPadding(insets.top),
                paddingBottom: Math.max(insets.bottom, 12) + 6,
              },
            ]}>
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
                  color={PURPLE_DARK}
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
                  color={PURPLE}
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
                ]}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="email-outline"
                  size={20}
                />

                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="exemple@email.com"
                  placeholderTextColor="#8A7FA6"
                  returnKeyType="send"
                  onSubmitEditing={sendResetLink}
                  style={styles.input}
                  value={email}
                />
              </View>
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
                  color={PURPLE}
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
                color={PURPLE}
                name="chevron-right"
                size={compact ? 20 : 22}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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

  page: {
    flex: 1,
  },

  content: {
    flex: 1,
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#6949BE',
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
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.85)',
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
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.85)',
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
    borderColor: 'rgba(111,83,190,0.16)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,255,0.92)',
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
    backgroundColor: '#EEE3FA',
  },

  cardIconCompact: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },

  cardTitle: {
    marginTop: 12,
    color: PURPLE_DARK,
    fontSize: 17,
    fontWeight: '700',
  },

  cardTitleCompact: {
    marginTop: 9,
    fontSize: 15.5,
  },

  cardText: {
    marginTop: 6,
    color: TEXT_MUTED,
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
    borderColor: 'rgba(111,83,190,0.20)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,252,255,0.95)',
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
    color: '#2A2050',
    fontSize: 13.5,
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

  primaryButtonCompact: {
    width: '90%',
    minHeight: 48,
    marginTop: 13,
  },

  primaryText: {
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(246,239,255,0.9)',
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
    backgroundColor: '#FFFFFF',
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
    color: PURPLE_DARK,
    fontSize: 13.5,
    fontWeight: '700',
  },

  helpTitleCompact: {
    fontSize: 12,
  },

  helpText: {
    marginTop: 2,
    color: TEXT_MUTED,
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

export default ForgotPasswordScreen;