import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {
  getPregnancyTrackingPreferences,
  setPregnancyTrackingPreferences,
  type PregnancyTrackingPreference,
} from '../../state/pregnancyPreferences';

const PURPLE = '#6949BE';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PregnancyTrackingPreferences'
>;

type OptionConfig = {
  id: PregnancyTrackingPreference;
  icon: React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];
  label: string;
};

/*
 * Suivi grossesse :
 *
 * 1. Symptômes ressentis
 * 2. Poids
 * 3. Humeur
 * 4. Sommeil
 * 5. Informations médicales personnelles
 *
 * Aucun autre élément n'est proposé sur cet écran.
 */
const OPTIONS: OptionConfig[] = [
  {
    id: 'symptoms',
    icon: 'heart-pulse',
    label: 'Symptômes ressentis',
  },
  {
    id: 'weight',
    icon: 'scale-bathroom',
    label: 'Poids',
  },
  {
    id: 'mood',
    icon: 'emoticon-happy-outline',
    label: 'Humeur',
  },
  {
    id: 'sleep',
    icon: 'weather-night',
    label: 'Sommeil',
  },
  {
    id: 'medicalInfo',
    icon: 'shield-lock-outline',
    label: 'Informations médicales personnelles',
  },
];

type TrackingRowProps = {
  option: OptionConfig;
  selected: boolean;
  delay: number;
  onToggle: () => void;
};

function TrackingRow({
  option,
  selected,
  delay,
  onToggle,
}: TrackingRowProps): React.JSX.Element {
  const entranceAnim = useRef(
    new Animated.Value(0),
  ).current;

  const checkScale = useRef(
    new Animated.Value(1),
  ).current;

  const isFirstRender = useRef(true);

  useEffect(() => {
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 340,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Animation d'entrée uniquement au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),

      Animated.timing(checkScale, {
        toValue: 1,
        duration: 130,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected, checkScale]);

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
      <Pressable
        accessibilityLabel={option.label}
        accessibilityRole="checkbox"
        accessibilityState={{
          checked: selected,
        }}
        onPress={onToggle}
        style={({pressed}) => [
          styles.row,
          selected && styles.rowSelected,
          pressed && styles.pressed,
        ]}>
        {/* CHECKBOX */}
        <Animated.View
          style={[
            styles.checkbox,
            selected && styles.checkboxSelected,
            {
              transform: [
                {
                  scale: checkScale,
                },
              ],
            },
          ]}>
          {selected ? (
            <MaterialDesignIcons
              color="#FFFFFF"
              name="check"
              size={14}
            />
          ) : null}
        </Animated.View>

        {/* ICON */}
        <View style={styles.iconBox}>
          <MaterialDesignIcons
            color={PURPLE}
            name={option.icon}
            size={19}
          />
        </View>

        {/* LABEL */}
        <Text style={styles.rowLabel}>
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function PregnancyTrackingPreferencesScreen({
  navigation,
  route,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<
    Set<PregnancyTrackingPreference>
  >(() => {
    /*
     * On ne conserve à l'écran que les choix appartenant
     * réellement aux 5 catégories Grossesse.
     *
     * Cela évite qu'une ancienne préférence comme
     * hydration/activity/notes/appointments reste
     * sélectionnée silencieusement.
     */
    const saved =
      getPregnancyTrackingPreferences();

    const allowedIds = new Set(
      OPTIONS.map(option => option.id),
    );

    return new Set(
      [...saved].filter(id =>
        allowedIds.has(id),
      ),
    );
  });

  const headerAnim = useRef(
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

      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 400,
        delay: 300,
        easing,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, buttonAnim]);

  const toggleOption = (
    id: PregnancyTrackingPreference,
  ) => {
    setSelected(current => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const canContinue =
    selected.size > 0;

  const handleNext = async () => {
    if (!canContinue) {
      return;
    }

    /*
     * On sauvegarde uniquement les catégories
     * actuellement affichées/sélectionnées.
     */
    await setPregnancyTrackingPreferences(
      selected,
    );

    if (route.params?.mode === 'edit') {
      navigation.goBack();
      return;
    }

    navigation.navigate(
      'PregnancyReminders',
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
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

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
              <Text style={styles.title}>
                {
                  'Que souhaitez-vous\nsuivre pendant votre\ngrossesse ?'
                }
              </Text>

              <Text
                style={styles.subtitle}>
                {
                  'Sélectionnez les éléments que vous\nsouhaitez suivre au quotidien.'
                }
              </Text>
            </View>
          </Animated.View>

          {/* LIST */}
          <View style={styles.list}>
            {OPTIONS.map(
              (
                option,
                index,
              ) => (
                <TrackingRow
                  delay={
                    55 * index
                  }
                  key={option.id}
                  onToggle={() =>
                    toggleOption(
                      option.id,
                    )
                  }
                  option={option}
                  selected={selected.has(
                    option.id,
                  )}
                />
              ),
            )}
          </View>

          {/* FLEX SPACER */}
          <View style={styles.spacer} />

          {/* NEXT BUTTON */}
          <Animated.View
            style={buttonStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled:
                  !canContinue,
              }}
              disabled={!canContinue}
              onPress={handleNext}
              style={({pressed}) => [
                styles.nextButton,

                !canContinue &&
                  styles.nextButtonDisabled,

                pressed &&
                  styles.pressed,
              ]}>
              <Text
                style={styles.nextText}>
                Suivant
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F2ECF8',
  },

  pageBackgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  pageGlowTop: {
    position: 'absolute',
    top: -150,
    right: -110,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(92, 67, 139, 0.05)',
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

    marginBottom: 8,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  title: {
    color: '#28166F',

    fontFamily: 'serif',

    fontSize: 25,
    fontWeight: '700',

    lineHeight: 31,

    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 310,

    marginTop: 8,

    color: '#655A8D',

    fontSize: 13.5,

    lineHeight: 19,

    textAlign: 'center',
  },

  list: {
    gap: 11,
  },

  row: {
    minHeight: 64,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,

    borderColor:
      'rgba(111,83,190,0.14)',

    borderRadius: 17,

    backgroundColor:
      'rgba(255,252,255,0.92)',

    paddingHorizontal: 13,
    paddingVertical: 6,

    elevation: 2,

    shadowColor: '#4E319A',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.055,
    shadowRadius: 7,
  },

  rowSelected: {
    borderColor: '#6848BC',

    backgroundColor:
      'rgba(249,244,255,0.98)',
  },

  pressed: {
    opacity: 0.82,
  },

  checkbox: {
    width: 23,
    height: 23,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,

    borderColor: '#C6B8E0',

    borderRadius: 7,

    backgroundColor:
      'transparent',
  },

  checkboxSelected: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  iconBox: {
    width: 38,
    height: 38,

    marginHorizontal: 11,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 19,

    backgroundColor: '#F0E8FC',
  },

  rowLabel: {
    flex: 1,

    minWidth: 0,

    color: '#2A2050',

    fontSize: 14.2,

    fontWeight: '600',

    lineHeight: 19,
  },

  spacer: {
    flex: 1,
    minHeight: spacing.lg,
  },

  nextButton: {
    minHeight: 54,

    alignItems: 'center',
    justifyContent: 'center',

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

  nextButtonDisabled: {
    backgroundColor: '#B7A9CF',

    elevation: 0,

    shadowOpacity: 0,
  },

  nextText: {
    color: '#FFFFFF',

    fontSize: 17,

    fontWeight: '600',
  },
});

export default PregnancyTrackingPreferencesScreen;