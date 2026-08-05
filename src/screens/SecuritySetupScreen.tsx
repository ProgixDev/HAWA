import React, {useState} from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import {
  setBiometricEnabled,
  setPinEnabled,
} from '../state/securityPreferences';

const SECURITY_BACKGROUND = require('../assets/images/security-setup-background.png');
const PIN = require('../assets/images/security-pin-icon.png');
const BIOMETRIC = require('../assets/images/security-biometric-icon.png');
const NOTIFICATION = require('../assets/images/security-notification-icon.png');
const SHIELD = require('../assets/images/security-shield-icon.png');

type Props = NativeStackScreenProps<RootStackParamList, 'SecuritySetup'>;

type OptionProps = {
  compact: boolean;
  icon: ImageSourcePropType;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function SecurityOption({
  compact,
  icon,
  title,
  description,
  value,
  onValueChange,
}: OptionProps): React.JSX.Element {
  return (
    <View style={[styles.option, compact && styles.optionCompact]}>
      <View style={[styles.iconBox, compact && styles.iconBoxCompact]}>
        <Image
          accessibilityIgnoresInvertColors
          source={icon}
          style={[styles.icon, compact && styles.iconCompact]}
        />
      </View>

      <View style={styles.optionCopy}>
        <Text
          numberOfLines={1}
          style={[styles.optionTitle, compact && styles.optionTitleCompact]}>
          {title}
        </Text>

        <Text
          numberOfLines={2}
          style={[
            styles.optionDescription,
            compact && styles.optionDescriptionCompact,
          ]}>
          {description}
        </Text>
      </View>

      <Switch
        ios_backgroundColor="#D9CDEC"
        onValueChange={onValueChange}
        thumbColor="#FFFFFF"
        trackColor={{
          false: '#D9CDEC',
          true: '#6949BE',
        }}
        value={value}
      />
    </View>
  );
}

function SecuritySetupScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {height, width} = useWindowDimensions();

  const compact = height < 740 || width < 370;
  const veryCompact = height < 660 || width < 340;

  const [pin, setPin] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [notifications, setNotifications] = useState(false);

  return (
    <ImageBackground
      source={SECURITY_BACKGROUND}
      resizeMode="cover"
      style={styles.page}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <View
        style={[
          styles.content,
          compact && styles.contentCompact,
          {
            paddingTop: getTopPadding(insets.top),
            paddingBottom: Math.max(insets.bottom, 12) + 8,
          },
        ]}>
        <View
          style={[
            styles.header,
            compact && styles.headerCompact,
            veryCompact && styles.headerVeryCompact,
          ]}>
          <Pressable
            accessibilityLabel="Retour"
            hitSlop={12}
            onPress={navigation.goBack}
            style={({pressed}) => [
              styles.back,
              compact && styles.backCompact,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              color="#6949BE"
              name="arrow-left"
              size={compact ? 24 : 27}
            />
          </Pressable>
        </View>

        <View style={[styles.heading, compact && styles.headingCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            Protège ton espace
          </Text>

          <Text
            style={[
              styles.subtitle,
              compact && styles.subtitleCompact,
            ]}>
            {
              'Choisis ce que tu actives maintenant —\ntout est modifiable plus tard.'
            }
          </Text>
        </View>

        <View style={[styles.options, compact && styles.optionsCompact]}>
          <SecurityOption
            compact={compact}
            description={'Verrouiller l’application\nà l’ouverture'}
            icon={PIN}
            onValueChange={value => {
              setPin(value);
              setPinEnabled(value);
            }}
            title="Code PIN"
            value={pin}
          />

          <SecurityOption
            compact={compact}
            description={'Empreinte ou reconnaissance\nfaciale'}
            icon={BIOMETRIC}
            onValueChange={value => {
              setBiometric(value);
              setBiometricEnabled(value);
            }}
            title="Biométrie"
            value={biometric}
          />

          <SecurityOption
            compact={compact}
            description={'Masquer le contenu\ndes notifications'}
            icon={NOTIFICATION}
            onValueChange={setNotifications}
            title="Notifications discrètes"
            value={notifications}
          />
        </View>

        <View style={[styles.info, compact && styles.infoCompact]}>
          <View
            style={[
              styles.infoIconBox,
              compact && styles.infoIconBoxCompact,
            ]}>
            <Image
              accessibilityIgnoresInvertColors
              source={SHIELD}
              style={[
                styles.infoIcon,
                compact && styles.infoIconCompact,
              ]}
            />
          </View>

          <View style={styles.infoCopy}>
            <Text
              numberOfLines={1}
              style={[styles.infoTitle, compact && styles.infoTitleCompact]}>
              Tes choix sont privés et sécurisés.
            </Text>

            <Text
              numberOfLines={2}
              style={[styles.infoText, compact && styles.infoTextCompact]}>
              Tu peux les modifier à tout moment dans les paramètres.
            </Text>
          </View>

          <MaterialDesignIcons
            color="#9AA09D"
            name="chevron-right"
            size={compact ? 21 : 24}
          />
        </View>

        <View style={styles.buttonGap} />

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Privacy')}
          style={({pressed}) => [
            styles.continueButton,
            compact && styles.continueButtonCompact,
            pressed && styles.pressed,
          ]}>
          <Text
            style={[
              styles.continueText,
              compact && styles.continueTextCompact,
            ]}>
            Continuer
          </Text>

          <View
            style={[
              styles.continueIcon,
              compact && styles.continueIconCompact,
            ]}>
            <MaterialDesignIcons
              color="#6949BE"
              name="arrow-right"
              size={compact ? 17 : 19}
            />
          </View>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F0E3F9',
  },

  content: {
    flex: 1,
  },

  contentCompact: {
    paddingHorizontal: 0,
  },

  header: {
    height: 178,
  },

  headerCompact: {
    height: 142,
  },

  headerVeryCompact: {
    height: 118,
  },

  back: {
    position: 'absolute',
    top: 20,
    left: 18,
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(249,244,255,0.92)',
  },

  backCompact: {
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  heading: {
    alignItems: 'center',
    marginBottom: 13,
    paddingHorizontal: spacing.md,
  },

  headingCompact: {
    marginBottom: 9,
  },

  title: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 31,
    fontWeight: '700',
    textAlign: 'center',
  },

  titleCompact: {
    fontSize: 27,
  },

  subtitle: {
    marginTop: 6,
    color: '#655A8D',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  subtitleCompact: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 16,
  },

  options: {
    gap: 9,
    paddingHorizontal: spacing.md,
  },

  optionsCompact: {
    gap: 6,
  },

  option: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.16)',
    borderRadius: 20,
    backgroundColor: 'rgba(255,252,255,0.92)',
    paddingHorizontal: 10,
  },

  optionCompact: {
    minHeight: 70,
    borderRadius: 17,
    paddingHorizontal: 8,
  },

  iconBox: {
    width: 59,
    height: 59,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F0E8FC',
  },

  iconBoxCompact: {
    width: 50,
    height: 50,
    borderRadius: 15,
  },

  icon: {
    width: 66,
    height: 66,
    resizeMode: 'contain',
  },

  iconCompact: {
    width: 56,
    height: 56,
  },

  optionCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  optionTitle: {
    color: '#2A2050',
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '600',
  },

  optionTitleCompact: {
    fontSize: 15.5,
  },

  optionDescription: {
    marginTop: 3,
    color: '#756A90',
    fontSize: 12,
    lineHeight: 17,
  },

  optionDescriptionCompact: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 13,
  },

  info: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 19,
    backgroundColor: 'rgba(255,252,255,0.80)',
    paddingHorizontal: 10,
  },

  infoCompact: {
    minHeight: 62,
    marginTop: 8,
    borderRadius: 16,
    paddingHorizontal: 8,
  },

  infoIconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F0E8FC',
  },

  infoIconBoxCompact: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },

  infoIcon: {
    width: 57,
    height: 57,
    resizeMode: 'contain',
  },

  infoIconCompact: {
    width: 48,
    height: 48,
  },

  infoCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 9,
  },

  infoTitle: {
    color: '#4B328E',
    fontSize: 13,
    fontWeight: '600',
  },

  infoTitleCompact: {
    fontSize: 11.5,
  },

  infoText: {
    marginTop: 3,
    color: '#756A90',
    fontSize: 11,
    lineHeight: 16,
  },

  infoTextCompact: {
    marginTop: 1,
    fontSize: 9.5,
    lineHeight: 13,
  },

  buttonGap: {
    flex: 1,
    minHeight: 6,
  },

  continueButton: {
    position: 'relative',
    width: '76%',
    maxWidth: 310,
    minHeight: 50,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
    borderRadius: 18,
    backgroundColor: '#6949BE',
    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },

  continueButtonCompact: {
    width: '80%',
    maxWidth: 290,
    minHeight: 47,
  },

  continueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  continueTextCompact: {
    fontSize: 16,
  },

  continueIcon: {
    position: 'absolute',
    right: 10,
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  continueIconCompact: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },

  pressed: {
    opacity: 0.82,
    transform: [{scale: 0.99}],
  },
});

export default SecuritySetupScreen;