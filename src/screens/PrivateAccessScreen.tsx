import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type * as Keychain from 'react-native-keychain';

import type {RootStackParamList} from '../navigation/AppNavigator';
import type {PrivateAccessPurpose} from '../navigation/privateAccess';
import {
  isBiometricEnabled,
  loadSecurityPreferences,
} from '../state/securityPreferences';
import {
  authenticateWithBiometry,
  getBiometryIcon,
  getBiometryLabel,
  getBiometryType,
  hasPrivatePin,
  savePrivatePin,
  verifyPrivatePin,
} from '../services/privateSectionAuth';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const TEXT_MUTED = '#655A8D';
const ERROR_TEXT = '#8A5370';
const SUCCESS = '#5B9B72';

const PIN_LENGTH = 6;

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

const KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'biometric',
  '0',
  'delete',
] as const;

const LETTERS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

const PURPOSE_COPY: Record<PrivateAccessPurpose, string> = {
  miscarriagePersonalNotes:
    'Tes notes personnelles sont protégées.',
  pregnancyMedicalInformation:
    'Tes informations médicales personnelles sont protégées.',
};

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PrivateAccess'
>;

function openDestination(
  navigation: Props['navigation'],
  purpose: PrivateAccessPurpose,
): void {
  if (purpose === 'miscarriagePersonalNotes') {
    navigation.replace('MiscarriageJournalEntry', {
      category: 'personalNotes',
    });
    return;
  }

  navigation.replace('PregnancyMedicalInformation');
}

function PinDot({
  filled,
  tone,
}: {
  filled: boolean;
  tone: 'default' | 'success';
}): React.JSX.Element {
  const anim = useRef(
    new Animated.Value(filled ? 1 : 0),
  ).current;

  const wasFilled = useRef(filled);

  useEffect(() => {
    if (filled && !wasFilled.current) {
      anim.setValue(0);

      AccessibilityInfo.isReduceMotionEnabled().then(
        reduce => {
          if (reduce) {
            anim.setValue(1);
            return;
          }

          Animated.spring(anim, {
            toValue: 1,
            friction: 4,
            tension: 170,
            useNativeDriver: true,
          }).start();
        },
      );
    } else if (!filled) {
      anim.setValue(0);
    }

    wasFilled.current = filled;
  }, [filled, anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
    extrapolate: 'clamp',
  });

  const pulseOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
    extrapolate: 'clamp',
  });

  const dotOpacity = filled ? pulseOpacity : 1;

  const animatedStyle = {
    transform: [{scale}],
    opacity: dotOpacity,
  };

  return (
    <Animated.View
      style={[
        styles.dot,
        filled &&
          (tone === 'success'
            ? styles.dotSuccess
            : styles.dotFilled),
        animatedStyle,
      ]}
    />
  );
}

function KeypadKey({
  compact,
  icon,
  label,
  letters,
  onPress,
}: {
  compact: boolean;
  icon?: IconName;
  label?: string;
  letters?: string;
  onPress: () => void;
}): React.JSX.Element {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(
      value => {
        reduceMotion.current = value;
      },
    );
  }, []);

  const pressIn = () => {
    if (reduceMotion.current) {
      return;
    }

    Animated.timing(scale, {
      toValue: 0.92,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    if (reduceMotion.current) {
      scale.setValue(1);
      return;
    }

    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityLabel={
        icon === 'backspace-outline'
          ? 'Effacer'
          : label ?? 'Biométrie'
      }
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[
        styles.key,
        compact && styles.keyCompact,
      ]}>
      <Animated.View
        style={[
          styles.keyInner,
          {
            transform: [{scale}],
          },
        ]}>
        {icon ? (
          <MaterialDesignIcons
            color={PURPLE_DARK}
            name={icon}
            size={25}
          />
        ) : (
          <>
            <Text style={styles.number}>
              {label}
            </Text>

            {letters ? (
              <Text style={styles.letters}>
                {letters}
              </Text>
            ) : null}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function PrivateAccessScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const {purpose} = route.params;

  const insets = useSafeAreaInsets();
  const {height, width} = useWindowDimensions();

  const compact = height < 700;

  const entrance = useRef(
    new Animated.Value(0),
  ).current;

  const shake = useRef(
    new Animated.Value(0),
  ).current;

  const [checkingPin, setCheckingPin] =
    useState(true);

  const [pinConfigured, setPinConfigured] =
    useState(true);

  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');

  const [error, setError] = useState('');

  const [tone, setTone] = useState<
    'default' | 'success'
  >('default');

  const [busy, setBusy] = useState(false);

  const [biometryType, setBiometryType] =
    useState<Keychain.BIOMETRY_TYPE | null>(
      null,
    );

  const [biometryReady, setBiometryReady] =
    useState(false);

  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then(
      reduce => {
        Animated.timing(entrance, {
          toValue: 1,
          duration: reduce ? 0 : 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    );

    Promise.all([
      loadSecurityPreferences(),
      hasPrivatePin(),
      getBiometryType(),
    ])
      .then(([, configured, type]) => {
        if (!active) {
          return;
        }

        setPinConfigured(configured);
        setCheckingPin(false);

        setBiometryType(type);

        setBiometryReady(
          Boolean(type) &&
            isBiometricEnabled(),
        );
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setPinConfigured(false);
        setCheckingPin(false);
      });

    return () => {
      active = false;
    };
  }, [entrance]);

  const fail = (message: string) => {
    setError(message);
    setPin('');

    Animated.sequence(
      [6, -6, 4, -4, 0].map(value =>
        Animated.timing(shake, {
          toValue: value,
          duration: 45,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ).start();
  };

  const succeed = () => {
    setError('');
    setTone('success');

    setTimeout(() => {
      openDestination(
        navigation,
        purpose,
      );
    }, 220);
  };

  const submitPin = async (
    value: string,
  ) => {
    setBusy(true);

    try {
      if (pinConfigured) {
        if (
          await verifyPrivatePin(value)
        ) {
          succeed();
          return;
        }

        fail(
          'Code incorrect. Réessaie.',
        );

        return;
      }

      if (!firstPin) {
        setFirstPin(value);
        setPin('');

        setError(
          'Confirme ton nouveau code.',
        );

        return;
      }

      if (firstPin !== value) {
        setFirstPin('');

        fail(
          'Les codes ne correspondent pas. Recommence.',
        );

        return;
      }

      await savePrivatePin(value);

      succeed();
    } catch {
      fail(
        'Une erreur est survenue. Réessaie.',
      );
    } finally {
      setBusy(false);
    }
  };

  const attemptBiometric =
    async () => {
      if (
        busy ||
        tone === 'success'
      ) {
        return;
      }

      setBusy(true);

      try {
        if (
          await authenticateWithBiometry()
        ) {
          succeed();
          return;
        }

        fail(
          'Authentification non reconnue. Réessaie.',
        );
      } catch {
        fail(
          'Authentification non reconnue. Réessaie.',
        );
      } finally {
        setBusy(false);
      }
    };

  const enter = (
    key: (typeof KEYS)[number],
  ) => {
    if (
      busy ||
      checkingPin ||
      tone === 'success'
    ) {
      return;
    }

    if (key === 'delete') {
      setPin(value =>
        value.slice(0, -1),
      );
      return;
    }

    if (key === 'biometric') {
      attemptBiometric();
      return;
    }

    if (pin.length >= PIN_LENGTH) {
      return;
    }

    setError('');

    const next = `${pin}${key}`;

    setPin(next);

    if (
      next.length === PIN_LENGTH
    ) {
      setTimeout(() => {
        submitPin(next);
      }, 120);
    }
  };

  const instruction = checkingPin
    ? ' '
    : pinConfigured
      ? 'Entre ton code PIN pour continuer'
      : firstPin
        ? 'Confirme ton code PIN'
        : 'Crée ton code PIN pour continuer';

  const horizontalPadding = 26 * 2;
  const columnGap = 18 * 2;

  const rawKeySize =
    (Math.min(width, 420) -
      horizontalPadding -
      columnGap) /
    3;

  const keySize = Math.max(
    56,
    Math.min(74, rawKeySize),
  );

  return (
    <View style={styles.safe}>
      <SafeAreaView
        edges={['top', 'bottom']}
        style={styles.flex}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ),
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={
              navigation.goBack
            }
            style={styles.back}>
            <MaterialDesignIcons
              color={PURPLE_DARK}
              name="arrow-left"
              size={26}
            />
          </Pressable>

          <Animated.View
            style={[
              styles.hero,
              compact &&
                styles.heroCompact,
              {
                opacity: entrance,
                transform: [
                  {
                    translateY:
                      entrance.interpolate(
                        {
                          inputRange: [
                            0, 1,
                          ],
                          outputRange: [
                            14, 0,
                          ],
                        },
                      ),
                  },
                ],
              },
            ]}>
            <View
              style={
                styles.lockBadgeRow
              }>
              <View style={styles.leaf}>
                <MaterialDesignIcons
                  color="#C7B3E8"
                  name="sprout-outline"
                  size={18}
                />
              </View>

              <View
                style={
                  styles.lockBadge
                }>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="lock"
                  size={32}
                />
              </View>

              <View
                style={[
                  styles.leaf,
                  styles.leafRight,
                ]}>
                <MaterialDesignIcons
                  color="#C7B3E8"
                  name="sprout-outline"
                  size={18}
                />
              </View>
            </View>

            <Text
              style={[
                styles.title,
                compact &&
                  styles.titleCompact,
              ]}>
              Espace privé
            </Text>

            <Text
              style={
                styles.subtitle
              }>
              Ton espace, rien qu’à toi
            </Text>

            <Text
              style={
                styles.purposeLine
              }>
              {
                PURPOSE_COPY[
                  purpose
                ]
              }
            </Text>

            <Text
              style={
                styles.instruction
              }>
              {instruction}
            </Text>
          </Animated.View>

          <Animated.View
            accessibilityLabel={`${pin.length} sur ${PIN_LENGTH} chiffres saisis`}
            style={[
              styles.dots,
              {
                transform: [
                  {
                    translateX:
                      shake,
                  },
                ],
              },
            ]}>
            {Array.from({
              length: PIN_LENGTH,
            }).map(
              (_, index) => (
                <PinDot
                  filled={
                    index <
                      pin.length ||
                    tone ===
                      'success'
                  }
                  key={index}
                  tone={tone}
                />
              ),
            )}
          </Animated.View>

          <Text
            accessibilityLiveRegion="polite"
            style={styles.error}>
            {error || ' '}
          </Text>

          <View
            style={[
              styles.keypad,
              {
                width:
                  keySize * 3 +
                  18 * 2,
              },
            ]}>
            {KEYS.map(key => {
              if (
                key ===
                'biometric'
              ) {
                if (
                  !biometryReady
                ) {
                  return (
                    <View
                      key={key}
                      style={{
                        width:
                          keySize,
                        height:
                          keySize,
                      }}
                    />
                  );
                }

                return (
                  <KeypadKey
                    compact={
                      compact
                    }
                    icon={
                      getBiometryIcon(
                        biometryType,
                      ) as IconName
                    }
                    key={key}
                    label={getBiometryLabel(
                      biometryType,
                    )}
                    onPress={() =>
                      enter(key)
                    }
                  />
                );
              }

              if (
                key === 'delete'
              ) {
                return (
                  <KeypadKey
                    compact={
                      compact
                    }
                    icon="backspace-outline"
                    key={key}
                    onPress={() =>
                      enter(key)
                    }
                  />
                );
              }

              return (
                <KeypadKey
                  compact={compact}
                  key={key}
                  label={key}
                  letters={
                    LETTERS[key]
                  }
                  onPress={() =>
                    enter(key)
                  }
                />
              );
            })}
          </View>

          <View
            style={[
              styles.privacyCard,
              compact &&
                styles.privacyCardCompact,
            ]}>
            <View
              style={
                styles.privacyIcon
              }>
              <MaterialDesignIcons
                color={PURPLE}
                name="shield-check-outline"
                size={22}
              />
            </View>

            <View
              style={
                styles.privacyCopy
              }>
              <Text
                style={
                  styles.privacyTitle
                }>
                100% privé et sécurisé
              </Text>

              <Text
                style={
                  styles.privacyText
                }>
                Toutes tes informations
                restent protégées sur ton
                appareil.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,

    // Fond violet clair sans PNG
    backgroundColor: '#F3EEFC',
  },

  flex: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
  },

  back: {
    alignSelf: 'flex-start',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2D8F0',
    borderRadius: 16,
    backgroundColor:
      'rgba(255,255,255,0.86)',
  },

  hero: {
    marginTop: 18,
    alignItems: 'center',
  },

  heroCompact: {
    marginTop: 8,
  },

  lockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  lockBadge: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 42,
    backgroundColor: PURPLE,
    elevation: 4,
  },

  leaf: {
    transform: [
      {
        rotate: '-18deg',
      },
    ],
  },

  leafRight: {
    transform: [
      {
        rotate: '18deg',
      },
      {
        scaleX: -1,
      },
    ],
  },

  title: {
    marginTop: 16,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '800',
  },

  titleCompact: {
    fontSize: 24,
  },

  subtitle: {
    marginTop: 6,
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: '600',
  },

  purposeLine: {
    marginTop: 10,
    color: TEXT_MUTED,
    fontSize: 12.5,
    textAlign: 'center',
  },

  instruction: {
    marginTop: 4,
    color: '#3D3552',
    fontSize: 13.5,
    textAlign: 'center',
  },

  dots: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 26,
  },

  dot: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#A98AC6',
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },

  dotFilled: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  dotSuccess: {
    borderColor: SUCCESS,
    backgroundColor: SUCCESS,
  },

  error: {
    height: 28,
    marginTop: 8,
    color: ERROR_TEXT,
    fontSize: 11.5,
    textAlign: 'center',
  },

  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 6,
  },

  key: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    borderWidth: 1,
    borderColor:
      'rgba(111,83,190,0.16)',
    backgroundColor:
      'rgba(255,255,255,0.78)',
  },

  keyCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  keyInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  number: {
    color: PURPLE_DARK,
    fontSize: 22,
    fontWeight: '600',
  },

  letters: {
    color: TEXT_MUTED,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
  },

  privacyCard: {
    width: '100%',
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor:
      'rgba(111,83,190,0.14)',
    paddingHorizontal: 14,
  },

  privacyCardCompact: {
    marginTop: 14,
    minHeight: 56,
  },

  privacyIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#EAE0FA',
  },

  privacyCopy: {
    flex: 1,
    marginLeft: 12,
  },

  privacyTitle: {
    color: PURPLE_DARK,
    fontSize: 13,
    fontWeight: '700',
  },

  privacyText: {
    marginTop: 2,
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 15,
  },
});