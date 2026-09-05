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
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {spacing, getTopPadding} from '../../theme/spacing';
import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  setContraceptionPreferences,
  type PillScheduleType,
} from '../../state/contraceptionPreferences';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';
const PURPLE_SOFT = '#F1EAFB';
const TEXT_SECONDARY = '#655A8D';
const WARNING = '#C77B2E';
const WARNING_SOFT = '#FFF0E3';

const ACTIVE_DAYS_MIN = 1;
const ACTIVE_DAYS_MAX = 90;
const BREAK_DAYS_MIN = 0;
const BREAK_DAYS_MAX = 30;
const DEFAULT_ACTIVE_DAYS = 21;
const DEFAULT_BREAK_DAYS = 7;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type Props = NativeStackScreenProps<RootStackParamList, 'PillSchedule'>;

function PillScheduleScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  const initial = getContraceptionPreferences();

  const [hasTreatmentBreak, setHasTreatmentBreak] = useState<boolean | null>(
    () => initial.hasTreatmentBreak,
  );
  const [activeDays, setActiveDays] = useState<number>(
    () => initial.activeDays ?? DEFAULT_ACTIVE_DAYS,
  );
  const [breakDays, setBreakDays] = useState<number>(
    () => initial.breakDays ?? DEFAULT_BREAK_DAYS,
  );
  const [unknown, setUnknown] = useState(
    () => initial.pillScheduleType === 'unknown',
  );
  const [saving, setSaving] = useState(false);

  // Counters are non-nullable numbers, so — unlike hasTreatmentBreak/unknown
  // above, which use `current ?? value.x` to detect "still unset" — there is
  // no sentinel value that safely means "untouched" (a user's real, already
  // in-progress edit could legitimately land back on the same number as the
  // default). Track it explicitly instead: only hydration's OWN correction
  // pass is allowed to overwrite the counters, and only while the user
  // hasn't interacted with either stepper yet.
  const countersTouched = useRef(false);

  useEffect(() => {
    // Same "only fill in a value that's still unset" guard as
    // ContraceptionInformationScreen.tsx — hydrateContraceptionPreferences()
    // is memoized app-wide, so its resolved value is a frozen snapshot from
    // whenever the very first call settled, never a fresh read. This screen
    // sits mid-onboarding (Information -> PillSchedule -> Reminders), so a
    // slow first hydration could otherwise land after this screen's own
    // synchronous initializers already ran with stale/default state.
    hydrateContraceptionPreferences().then(value => {
      setHasTreatmentBreak(current => current ?? value.hasTreatmentBreak);
      if (!countersTouched.current) {
        if (value.activeDays !== null) {setActiveDays(value.activeDays);}
        if (value.breakDays !== null) {setBreakDays(value.breakDays);}
      }
      setUnknown(current => current || value.pillScheduleType === 'unknown');
    });
  }, []);

  const isCyclic = hasTreatmentBreak === true;
  const totalDays = activeDays + breakDays;

  const adjustActiveDays = (delta: number) => {
    countersTouched.current = true;
    setActiveDays(current => clamp(current + delta, ACTIVE_DAYS_MIN, ACTIVE_DAYS_MAX));
  };
  const adjustBreakDays = (delta: number) => {
    countersTouched.current = true;
    setBreakDays(current => clamp(current + delta, BREAK_DAYS_MIN, BREAK_DAYS_MAX));
  };

  // --- entrance animation, staged, reduced-motion aware ---
  const reduceMotion = useRef(false);
  const iconEntrance = useRef(new Animated.Value(0)).current;
  const titleEntrance = useRef(new Animated.Value(0)).current;
  const card1Entrance = useRef(new Animated.Value(0)).current;
  const card2Entrance = useRef(new Animated.Value(0)).current;
  const summaryEntrance = useRef(new Animated.Value(0)).current;
  const ctaEntrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
      const duration = value ? 0 : 420;
      const stage = (animatedValue: Animated.Value, delay: number) =>
        Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          delay: value ? 0 : delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });

      Animated.parallel([
        stage(iconEntrance, 0),
        stage(titleEntrance, 90),
        stage(card1Entrance, 180),
        stage(card2Entrance, 260),
        stage(summaryEntrance, 340),
        stage(ctaEntrance, 420),
      ]).start();
    });
  }, [iconEntrance, titleEntrance, card1Entrance, card2Entrance, summaryEntrance, ctaEntrance]);

  const fadeUp = (animatedValue: Animated.Value) => ({
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({inputRange: [0, 1], outputRange: [14, 0]}),
      },
    ],
  });

  const handleContinue = async () => {
    if (saving) {return;}
    setSaving(true);
    try {
      const nextSchedule: {
        pillScheduleType: PillScheduleType;
        activeDays: number | null;
        breakDays: number | null;
      } = unknown
        ? {pillScheduleType: 'unknown', activeDays: null, breakDays: null}
        : isCyclic
          ? {pillScheduleType: 'cyclic', activeDays, breakDays}
          : {pillScheduleType: 'continuous', activeDays: null, breakDays: null};

      await setContraceptionPreferences(nextSchedule);

      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.navigate('ContraceptionReminders');
      }
    } finally {
      setSaving(false);
    }
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
        <StatusBar backgroundColor="transparent" barStyle="dark-content" hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.md},
          ]}
          showsVerticalScrollIndicator={false}>
          {isEdit ? (
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              style={({pressed}) => [styles.backButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={PURPLE} name="arrow-left" size={24} />
            </Pressable>
          ) : null}

          <Animated.View style={[styles.header, fadeUp(iconEntrance)]}>
            <View style={styles.heroIcon}>
              <View pointerEvents="none" style={styles.heroGlowOuter} />
              <View pointerEvents="none" style={styles.heroGlowInner} />
              <LinearGradient
                colors={['#FFFFFF', '#F6F1FB']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.heroInner}>
                <MaterialDesignIcons color={PURPLE} name="calendar-month-outline" size={30} />
              </LinearGradient>
            </View>
          </Animated.View>

          <Animated.View style={fadeUp(titleEntrance)}>
            <Text style={styles.title}>Ton schéma de pilule</Text>
            <Text style={styles.subtitle}>Personnalise ton suivi selon ton traitement.</Text>
          </Animated.View>

          {isCyclic ? (
            <>
              <Animated.View style={[styles.card, fadeUp(card1Entrance)]}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardIcon}>
                    <MaterialDesignIcons color={PURPLE} name="pill" size={18} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>Jours de prise</Text>
                    <Text style={styles.cardSubtitle}>Nombre de jours où tu prends la pilule</Text>
                  </View>
                </View>

                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityLabel="Diminuer d’un jour"
                    accessibilityRole="button"
                    disabled={unknown}
                    onPress={() => adjustActiveDays(-1)}
                    style={({pressed}) => [styles.stepperButton, (pressed || unknown) && styles.pressed]}>
                    <MaterialDesignIcons color={PURPLE} name="minus" size={20} />
                  </Pressable>

                  <View style={styles.stepperValueBlock}>
                    <Text style={styles.stepperValue}>{activeDays}</Text>
                    <Text style={styles.stepperUnit}>jours</Text>
                  </View>

                  <Pressable
                    accessibilityLabel="Augmenter d’un jour"
                    accessibilityRole="button"
                    disabled={unknown}
                    onPress={() => adjustActiveDays(1)}
                    style={({pressed}) => [styles.stepperButton, (pressed || unknown) && styles.pressed]}>
                    <MaterialDesignIcons color={PURPLE} name="plus" size={20} />
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View style={[styles.card, styles.cardAccentWarning, fadeUp(card2Entrance)]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.cardIcon, styles.cardIconWarning]}>
                    <MaterialDesignIcons color={WARNING} name="pause-circle-outline" size={18} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>Jours d’arrêt</Text>
                    <Text style={styles.cardSubtitle}>Nombre de jours de pause</Text>
                  </View>
                </View>

                <View style={styles.stepperRow}>
                  <Pressable
                    accessibilityLabel="Diminuer d’un jour"
                    accessibilityRole="button"
                    disabled={unknown}
                    onPress={() => adjustBreakDays(-1)}
                    style={({pressed}) => [styles.stepperButton, (pressed || unknown) && styles.pressed]}>
                    <MaterialDesignIcons color={WARNING} name="minus" size={20} />
                  </Pressable>

                  <View style={styles.stepperValueBlock}>
                    <Text style={styles.stepperValue}>{breakDays}</Text>
                    <Text style={styles.stepperUnit}>jours</Text>
                  </View>

                  <Pressable
                    accessibilityLabel="Augmenter d’un jour"
                    accessibilityRole="button"
                    disabled={unknown}
                    onPress={() => adjustBreakDays(1)}
                    style={({pressed}) => [styles.stepperButton, (pressed || unknown) && styles.pressed]}>
                    <MaterialDesignIcons color={WARNING} name="plus" size={20} />
                  </Pressable>
                </View>

                <Text style={styles.cardFootnote}>Période d’arrêt renseignée dans ton schéma.</Text>
              </Animated.View>

              {!unknown ? (
                <Animated.View style={[styles.summaryCard, fadeUp(summaryEntrance)]}>
                  <View style={styles.summaryHeaderRow}>
                    <MaterialDesignIcons color={PURPLE} name="calendar-check-outline" size={16} />
                    <Text style={styles.summaryTitle}>Ton schéma</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Prise</Text>
                    <Text style={styles.summaryValue}>{activeDays} jours</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Arrêt</Text>
                    <Text style={styles.summaryValue}>{breakDays} jours</Text>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>Cycle total</Text>
                    <Text style={styles.summaryTotalValue}>{totalDays} jours</Text>
                  </View>
                </Animated.View>
              ) : null}

              <Animated.View style={fadeUp(summaryEntrance)}>
                <Pressable
                  accessibilityLabel="Je ne connais pas encore mon schéma"
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: unknown}}
                  onPress={() => setUnknown(current => !current)}
                  style={({pressed}) => [styles.unknownRow, unknown && styles.unknownRowActive, pressed && styles.pressed]}>
                  <MaterialDesignIcons
                    color={unknown ? PURPLE : '#948BB0'}
                    name={unknown ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={18}
                  />
                  <View style={styles.unknownCopy}>
                    <Text style={[styles.unknownText, unknown && styles.unknownTextActive]}>
                      Je ne connais pas encore mon schéma
                    </Text>
                    <Text style={styles.unknownSubtext}>Tu pourras le renseigner plus tard.</Text>
                  </View>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <Animated.View style={[styles.card, fadeUp(card1Entrance)]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIcon}>
                  <MaterialDesignIcons color={PURPLE} name="infinity" size={18} />
                </View>
                <View style={styles.cardCopy}>
                  <Text style={styles.cardTitle}>Prise continue</Text>
                  <Text style={styles.cardSubtitle}>
                    Tu prends la pilule sans période d’arrêt, d’après ta réponse précédente.
                  </Text>
                </View>
              </View>

              <Text style={styles.cardFootnote}>
                AWA suit ta prise sans compte à rebours de plaquette, puisqu’il n’y a pas de longueur de
                cycle fixe pour ce schéma.
              </Text>
            </Animated.View>
          )}

          <View style={styles.spacer} />

          <Animated.View style={fadeUp(ctaEntrance)}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={handleContinue}
              style={({pressed}) => [styles.nextButton, (pressed || saving) && styles.pressed]}>
              <Text style={styles.nextText}>
                {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Continuer'}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: '#F2ECF8'},

  pageBackgroundDecor: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},

  pageGlowTop: {
    position: 'absolute', top: -150, right: -110, width: 330, height: 330,
    borderRadius: 165, backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },
  pageGlowMiddle: {
    position: 'absolute', top: '38%', left: -130, width: 260, height: 260,
    borderRadius: 130, backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },
  pageGlowBottom: {
    position: 'absolute', bottom: -150, right: -100, width: 310, height: 310,
    borderRadius: 155, backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
  pressed: {opacity: 0.82},

  backButton: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center',
    marginBottom: 5, borderWidth: 1, borderColor: 'rgba(105,73,190,0.08)',
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#493276', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },

  header: {alignItems: 'center', marginBottom: 14},
  heroIcon: {
    position: 'relative', width: 72, height: 72,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  heroGlowOuter: {position: 'absolute', width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(105,73,190,0.055)'},
  heroGlowInner: {position: 'absolute', width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(105,73,190,0.07)'},
  heroInner: {
    width: 56, height: 56, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(105,73,190,0.14)', borderRadius: 19,
    shadowColor: '#4E337C', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },

  title: {
    color: PURPLE_DARK, fontFamily: 'serif', fontSize: 23, lineHeight: 29,
    fontWeight: '800', textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320, alignSelf: 'center', marginTop: 6, marginBottom: 18,
    color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, textAlign: 'center',
  },

  card: {
    marginBottom: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(111,83,190,0.14)', borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#4E337C', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  cardAccentWarning: {borderColor: 'rgba(199,123,46,0.18)'},

  cardHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  cardIcon: {
    width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
    borderRadius: 13, backgroundColor: PURPLE_SOFT,
  },
  cardIconWarning: {backgroundColor: WARNING_SOFT},
  cardCopy: {flex: 1, minWidth: 0},
  cardTitle: {color: '#291D4E', fontFamily: 'serif', fontSize: 15, lineHeight: 20, fontWeight: '700'},
  cardSubtitle: {marginTop: 2, color: TEXT_SECONDARY, fontSize: 11.5, lineHeight: 16},
  cardFootnote: {marginTop: 12, color: TEXT_SECONDARY, fontSize: 10.5, lineHeight: 15},

  stepperRow: {marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18},
  stepperButton: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: 22, backgroundColor: PURPLE_SOFT,
  },
  stepperValueBlock: {alignItems: 'center', minWidth: 76},
  stepperValue: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 34, fontWeight: '800'},
  stepperUnit: {marginTop: 1, color: TEXT_SECONDARY, fontSize: 11.5, fontWeight: '700'},

  summaryCard: {
    marginBottom: 14, padding: 15, borderWidth: 1, borderColor: 'rgba(111,83,190,0.14)', borderRadius: 20,
    backgroundColor: '#F8F4FE',
  },
  summaryHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10},
  summaryTitle: {color: PURPLE_DARK, fontFamily: 'serif', fontSize: 13.5, fontWeight: '800'},
  summaryRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4},
  summaryLabel: {color: TEXT_SECONDARY, fontSize: 12.5, fontWeight: '600'},
  summaryValue: {color: '#291D4E', fontSize: 12.5, fontWeight: '800'},
  summaryDivider: {height: 1, marginVertical: 6, backgroundColor: 'rgba(111,83,190,0.14)'},
  summaryTotalLabel: {color: PURPLE_DARK, fontSize: 13, fontWeight: '800'},
  summaryTotalValue: {color: PURPLE, fontSize: 13, fontWeight: '900'},

  unknownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(148,139,176,0.22)', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.7)',
  },
  unknownRowActive: {borderColor: PURPLE, backgroundColor: PURPLE_SOFT},
  unknownCopy: {flex: 1, minWidth: 0},
  unknownText: {color: '#5A5075', fontSize: 12.5, fontWeight: '700'},
  unknownTextActive: {color: PURPLE_DARK},
  unknownSubtext: {marginTop: 2, color: TEXT_SECONDARY, fontSize: 10.5, lineHeight: 14},

  spacer: {flex: 1, minHeight: 12},

  nextButton: {
    minHeight: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: 12, borderRadius: 20, backgroundColor: PURPLE,
    shadowColor: '#4E319A', shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  nextText: {color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.2},
});

export default PillScheduleScreen;
