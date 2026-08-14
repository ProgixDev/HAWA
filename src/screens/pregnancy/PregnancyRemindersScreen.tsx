import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {
  getPregnancyReminderPreferences,
  setPregnancyReminderPreferences,
  type PregnancyReminderPreferences,
} from '../../state/pregnancyPreferences';

const BACKGROUND = require('../../assets/images/school-selection-background.png');

const PURPLE = '#6949BE';
const TRACK_ON = '#6949BE';
const TRACK_OFF = '#D9CFE8';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PregnancyReminders'
>;

type ReminderKey = keyof PregnancyReminderPreferences;

type OptionConfig = {
  id: ReminderKey;
  icon: React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];
  label: string;
  description: string;
};

const OPTIONS: OptionConfig[] = [
  {
    id: 'appointments',
    icon: 'calendar-month-outline',
    label: 'Rendez-vous médicaux',
    description: 'Rappels pour vos rendez-vous médicaux.',
  },
  {
    id: 'exams',
    icon: 'clipboard-pulse-outline',
    label: 'Examens',
    description: 'Rappels pour vos examens à réaliser.',
  },
  {
    id: 'dailyJournal',
    icon: 'notebook-edit-outline',
    label: 'Journal quotidien',
    description: 'Rappel pour compléter votre suivi du jour.',
  },
  {
    id: 'customReminders',
    icon: 'bell-plus-outline',
    label: 'Rappels personnalisés',
    description: 'Créez vos propres rappels selon vos besoins.',
  },
];

type ReminderRowProps = {
  option: OptionConfig;
  enabled: boolean;
  delay: number;
  onToggle: (value: boolean) => void;
};

function ReminderRow({
  option,
  enabled,
  delay,
  onToggle,
}: ReminderRowProps): React.JSX.Element {
  const entranceAnim = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 340,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animation d'entrée exécutée une seule fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entranceStyle = {
    opacity: entranceAnim,

    transform: [
      {
        translateY: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={entranceStyle}>
      <View style={styles.row}>
        {/* ICON */}
        <View style={styles.iconBox}>
          <MaterialDesignIcons
            color={PURPLE}
            name={option.icon}
            size={19}
          />
        </View>

        {/* TEXT */}
        <View style={styles.rowCopy}>
          <Text style={styles.rowLabel}>
            {option.label}
          </Text>

          <Text style={styles.rowDescription}>
            {option.description}
          </Text>
        </View>

        {/* SWITCH */}
        <Switch
          accessibilityLabel={option.label}
          accessibilityRole="switch"
          accessibilityState={{
            checked: enabled,
          }}
          ios_backgroundColor={TRACK_OFF}
          onValueChange={onToggle}
          thumbColor="#FFFFFF"
          trackColor={{
            false: TRACK_OFF,
            true: TRACK_ON,
          }}
          value={enabled}
        />
      </View>
    </Animated.View>
  );
}

function PregnancyRemindersScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [preferences, setPreferences] =
    useState<PregnancyReminderPreferences>(
      () => getPregnancyReminderPreferences(),
    );

  const headerAnim = useRef(
    new Animated.Value(0),
  ).current;

  const infoAnim = useRef(
    new Animated.Value(0),
  ).current;

  const buttonAnim = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    const easing =
      Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 420,
        easing,
        useNativeDriver: true,
      }),

      Animated.timing(infoAnim, {
        toValue: 1,
        duration: 380,
        delay: 380,
        easing,
        useNativeDriver: true,
      }),

      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        delay: 460,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    headerAnim,
    infoAnim,
    buttonAnim,
  ]);

  const toggleOption = (
    id: ReminderKey,
    value: boolean,
  ) => {
    setPreferences(current => ({
      ...current,
      [id]: value,
    }));
  };

  const handleFinish = async () => {
    await setPregnancyReminderPreferences(
      preferences,
    );

    navigation.navigate(
      'SecuritySetup',
    );
  };

  const headerStyle = {
    opacity: headerAnim,

    transform: [
      {
        translateY:
          headerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [10, 0],
          }),
      },
    ],
  };

  const infoStyle = {
    opacity: infoAnim,

    transform: [
      {
        translateY:
          infoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0],
          }),
      },
    ],
  };

  const buttonStyle = {
    opacity: buttonAnim,

    transform: [
      {
        translateY:
          buttonAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
      },
    ],
  };

  return (
    <ImageBackground
      source={BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <View style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop:
                getTopPadding(
                  insets.top,
                ),

              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + spacing.sm,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* BACK */}
          <Pressable
            accessibilityLabel="Retour"
            hitSlop={12}
            onPress={
              navigation.goBack
            }
            style={styles.backButton}>
            <MaterialDesignIcons
              color={PURPLE}
              name="arrow-left"
              size={25}
            />
          </Pressable>

          {/* HEADER */}
          <Animated.View
            style={headerStyle}>
            <View style={styles.header}>
              <View
                style={styles.headerIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="bell-ring-outline"
                  size={26}
                />
              </View>

              <Text style={styles.title}>
                Tes rappels
              </Text>

              <Text
                style={styles.subtitle}>
                Quels rappels souhaitez-vous recevoir ?
              </Text>

              <Text
                style={styles.description}>
                {
                  'Nous vous enverrons des rappels adaptés\nà vos préférences.'
                }
              </Text>
            </View>
          </Animated.View>

          {/* REMINDERS */}
          <View style={styles.list}>
            {OPTIONS.map(
              (
                option,
                index,
              ) => (
                <ReminderRow
                  delay={
                    60 * index
                  }
                  enabled={
                    preferences[
                      option.id
                    ]
                  }
                  key={option.id}
                  onToggle={value =>
                    toggleOption(
                      option.id,
                      value,
                    )
                  }
                  option={option}
                />
              ),
            )}
          </View>

          {/* INFO CARD */}
          <Animated.View
            style={[
              styles.infoCard,
              infoStyle,
            ]}>
            <MaterialDesignIcons
              color="#7A6C9C"
              name="information-outline"
              size={17}
            />

            <Text
              style={styles.infoText}>
              Vous pourrez modifier vos préférences
              {'\n'}
              de rappels à tout moment dans les paramètres.
            </Text>
          </Animated.View>

          {/* BUTTON */}
          <Animated.View
            style={buttonStyle}>
            <Pressable
              accessibilityLabel="Commencer mon suivi"
              accessibilityRole="button"
              onPress={handleFinish}
              style={({pressed}) => [
                styles.nextButton,
                pressed &&
                  styles.pressed,
              ]}>
              <Text
                style={styles.nextText}>
                Commencer mon suivi
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
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

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },

  backButton: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 21,

    backgroundColor:
      'rgba(255,255,255,0.88)',

    elevation: 3,

    shadowColor: '#4E319A',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.08,
    shadowRadius: 7,

    marginBottom: 6,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  headerIcon: {
    width: 52,
    height: 52,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 26,

    backgroundColor:
      'rgba(255,255,255,0.75)',

    marginBottom: 10,
  },

  title: {
    color: '#28166F',

    fontFamily: 'serif',

    fontSize: 26,
    fontWeight: '700',

    lineHeight: 32,

    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,

    color: '#433467',

    fontSize: 14.5,

    lineHeight: 20,

    textAlign: 'center',
  },

  description: {
    maxWidth: 300,

    marginTop: 6,

    color: '#655A8D',

    fontSize: 12.5,

    lineHeight: 18,

    textAlign: 'center',
  },

  list: {
    gap: 9,
  },

  row: {
    minHeight: 68,

    flexDirection: 'row',

    alignItems: 'center',

    borderWidth: 1,

    borderColor:
      'rgba(111,83,190,0.14)',

    borderRadius: 16,

    backgroundColor:
      'rgba(255,252,255,0.90)',

    paddingHorizontal: 12,
    paddingVertical: 10,

    elevation: 2,

    shadowColor: '#4E319A',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.05,
    shadowRadius: 7,
  },

  iconBox: {
    width: 36,
    height: 36,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor: '#F0E8FC',
  },

  rowCopy: {
    flex: 1,

    minWidth: 0,

    marginHorizontal: 11,
  },

  rowLabel: {
    color: '#2A2050',

    fontSize: 14,

    fontWeight: '700',

    lineHeight: 18,
  },

  rowDescription: {
    marginTop: 2,

    color: '#756A90',

    fontSize: 11.5,

    lineHeight: 15,
  },

  infoCard: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 9,

    marginTop: spacing.md,

    borderRadius: 14,

    backgroundColor:
      'rgba(240,232,252,0.75)',

    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  infoText: {
    flex: 1,

    minWidth: 0,

    color: '#655A8D',

    fontSize: 11.5,

    lineHeight: 16,
  },

  pressed: {
    opacity: 0.82,
  },

  nextButton: {
    minHeight: 52,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: spacing.md,

    borderRadius: 18,

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

  nextText: {
    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '600',
  },
});

export default PregnancyRemindersScreen;