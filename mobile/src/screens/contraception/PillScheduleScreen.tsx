import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
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
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  setContraceptionPreferences,
  type PillScheduleType,
} from '../../state/contraceptionPreferences';
import '../../i18n';
import {presentSaveFailure} from '../../services/saveFailure';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';

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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
        stage(titleEntrance, 90),
        stage(card1Entrance, 180),
        stage(card2Entrance, 260),
        stage(summaryEntrance, 340),
        stage(ctaEntrance, 420),
      ]).start();
    });
  }, [titleEntrance, card1Entrance, card2Entrance, summaryEntrance, ctaEntrance]);

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
    } catch (saveError) {
      presentSaveFailure(saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <View style={styles.safeArea}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.md},
          ]}
          showsVerticalScrollIndicator={false}>
          {isEdit ? (
            <AwaIconButton
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              icon="arrow-left"
              style={styles.backButton}
            />
          ) : null}

          <Animated.View style={fadeUp(titleEntrance)}>
            <AwaText variant="headlineSmall" style={styles.title}>{t('pillSchedule.title')}</AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.subtitle}>{t('pillSchedule.subtitle')}</AwaText>
          </Animated.View>

          {isCyclic ? (
            <>
              <Animated.View style={fadeUp(card1Entrance)}>
                <AwaCard style={styles.card} variant="outlined">
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardIcon}>
                      <MaterialDesignIcons color={theme.colors.primary} name="pill" size={18} />
                    </View>
                    <View style={styles.cardCopy}>
                      <AwaText variant="titleSmall">{t('pillSchedule.activeDays.title')}</AwaText>
                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardSubtitle}>{t('pillSchedule.activeDays.subtitle')}</AwaText>
                    </View>
                  </View>

                  <View style={styles.stepperRow}>
                    <AwaIconButton
                      accessibilityLabel={t('pillSchedule.decreaseAccessibility')}
                      accessibilityRole="button"
                      disabled={unknown}
                      onPress={() => adjustActiveDays(-1)}
                      icon="minus"
                      iconSize={20}
                      variant="tonal"
                    />

                    <View style={styles.stepperValueBlock}>
                      <Text style={styles.stepperValue}>{activeDays}</Text>
                      <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.stepperUnit}>{t('profile.durationStepper.unit')}</AwaText>
                    </View>

                    <AwaIconButton
                      accessibilityLabel={t('pillSchedule.increaseAccessibility')}
                      accessibilityRole="button"
                      disabled={unknown}
                      onPress={() => adjustActiveDays(1)}
                      icon="plus"
                      iconSize={20}
                      variant="tonal"
                    />
                  </View>
                </AwaCard>
              </Animated.View>

              <Animated.View style={fadeUp(card2Entrance)}>
                <AwaCard style={[styles.card, styles.cardAccentWarning]} variant="outlined">
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.cardIcon, styles.cardIconWarning]}>
                      <MaterialDesignIcons color={theme.colors.warning} name="pause-circle-outline" size={18} />
                    </View>
                    <View style={styles.cardCopy}>
                      <AwaText variant="titleSmall">{t('pillSchedule.breakDays.title')}</AwaText>
                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardSubtitle}>{t('pillSchedule.breakDays.subtitle')}</AwaText>
                    </View>
                  </View>

                  <View style={styles.stepperRow}>
                    <AwaIconButton
                      accessibilityLabel={t('pillSchedule.decreaseAccessibility')}
                      accessibilityRole="button"
                      disabled={unknown}
                      onPress={() => adjustBreakDays(-1)}
                      icon="minus"
                      iconSize={20}
                      variant="tonal"
                    />

                    <View style={styles.stepperValueBlock}>
                      <Text style={styles.stepperValue}>{breakDays}</Text>
                      <AwaText variant="labelSmall" colorRole="onSurfaceVariant" style={styles.stepperUnit}>{t('profile.durationStepper.unit')}</AwaText>
                    </View>

                    <AwaIconButton
                      accessibilityLabel={t('pillSchedule.increaseAccessibility')}
                      accessibilityRole="button"
                      disabled={unknown}
                      onPress={() => adjustBreakDays(1)}
                      icon="plus"
                      iconSize={20}
                      variant="tonal"
                    />
                  </View>

                  <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardFootnote}>{t('pillSchedule.breakDays.footnote')}</AwaText>
                </AwaCard>
              </Animated.View>

              {!unknown ? (
                <Animated.View style={[styles.summaryCard, fadeUp(summaryEntrance)]}>
                  <View style={styles.summaryHeaderRow}>
                    <MaterialDesignIcons color={theme.colors.primary} name="calendar-check-outline" size={16} />
                    <AwaText variant="labelMedium">{t('pillSchedule.summary.title')}</AwaText>
                  </View>

                  <View style={styles.summaryRow}>
                    <AwaText variant="labelMedium" colorRole="onSurfaceVariant">{t('pillSchedule.summary.intakeLabel')}</AwaText>
                    <AwaText variant="labelMedium">{t('pillSchedule.summary.daysValue', {count: activeDays})}</AwaText>
                  </View>
                  <View style={styles.summaryRow}>
                    <AwaText variant="labelMedium" colorRole="onSurfaceVariant">{t('pillSchedule.summary.breakLabel')}</AwaText>
                    <AwaText variant="labelMedium">{t('pillSchedule.summary.daysValue', {count: breakDays})}</AwaText>
                  </View>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <AwaText variant="labelMedium">{t('pillSchedule.summary.totalLabel')}</AwaText>
                    <AwaText variant="labelMedium" colorRole="primary">{t('pillSchedule.summary.daysValue', {count: totalDays})}</AwaText>
                  </View>
                </Animated.View>
              ) : null}

              <Animated.View style={fadeUp(summaryEntrance)}>
                <Pressable
                  accessibilityLabel={t('pillSchedule.unknown.accessibility')}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: unknown}}
                  onPress={() => setUnknown(current => !current)}
                  style={({pressed}) => [styles.unknownRow, unknown && styles.unknownRowActive, pressed && styles.pressed]}>
                  <MaterialDesignIcons
                    color={unknown ? theme.colors.primary : theme.colors.textMuted}
                    name={unknown ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={18}
                  />
                  <View style={styles.unknownCopy}>
                    <Text style={[styles.unknownText, unknown && styles.unknownTextActive]}>
                      {t('pillSchedule.unknown.text')}
                    </Text>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.unknownSubtext}>{t('pillSchedule.unknown.subtext')}</AwaText>
                  </View>
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <Animated.View style={fadeUp(card1Entrance)}>
              <AwaCard style={styles.card} variant="outlined">
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardIcon}>
                    <MaterialDesignIcons color={theme.colors.primary} name="infinity" size={18} />
                  </View>
                  <View style={styles.cardCopy}>
                    <AwaText variant="titleSmall">{t('pillSchedule.continuous.title')}</AwaText>
                    <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardSubtitle}>
                      {t('pillSchedule.continuous.subtitle')}
                    </AwaText>
                  </View>
                </View>

                <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.cardFootnote}>
                  {t('pillSchedule.continuous.footnote')}
                </AwaText>
              </AwaCard>
            </Animated.View>
          )}

          <View style={styles.spacer} />

          <Animated.View style={fadeUp(ctaEntrance)}>
            <AwaButton
              accessibilityRole="button"
              disabled={saving}
              onPress={handleContinue}
              label={saving ? t('periodStartSheet.saving') : isEdit ? t('common.save') : t('common.continue')}
              size="large"
              style={styles.nextButton}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {flex: 1, backgroundColor: theme.colors.background},



    safeArea: {flex: 1},
    content: {flexGrow: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
    pressed: {opacity: 0.82},

    backButton: {marginBottom: 5},

    header: {alignItems: 'center', marginBottom: 14},

    title: {textAlign: 'center'},
    subtitle: {maxWidth: 320, alignSelf: 'center', marginTop: 6, marginBottom: 18, textAlign: 'center'},

    // AwaCard (outlined) supplies the surface, border, radius and 16 dp padding.
    card: {marginBottom: 14},
    // "Jours d'arrêt" (pause) card accent — a structural pause/caution
    // indicator, not a dose-tracking status (there is no taken/late/missed
    // grid in this file; that lives in ContraceptionJournalEntryScreen's own
    // fixed GREEN/ORANGE/DANGER), so it legitimately maps to the design
    // system's own `warning` token rather than staying a fixed literal.
    cardAccentWarning: {borderColor: withAlpha(theme.colors.warning, 0.18)},

    cardHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    cardIcon: {
      width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, backgroundColor: theme.colors.primarySoft,
    },
    cardIconWarning: {backgroundColor: withAlpha(theme.colors.warning, 0.15)},
    cardCopy: {flex: 1, minWidth: 0},
    cardSubtitle: {marginTop: 2},
    cardFootnote: {marginTop: 12},

    stepperRow: {marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18},
    stepperValueBlock: {alignItems: 'center', minWidth: 76},
    stepperValue: {color: theme.colors.text, fontSize: 34, fontWeight: '800'},
    stepperUnit: {marginTop: 1},

    summaryCard: {
      marginBottom: 14, padding: 16, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    summaryHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10},
    summaryRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4},
    summaryDivider: {height: 1, marginVertical: 6, backgroundColor: theme.colors.border},

    unknownRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, marginBottom: 10,
      borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.22), borderRadius: 16, backgroundColor: withAlpha(theme.colors.surface, 0.7),
    },
    unknownRowActive: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    unknownCopy: {flex: 1, minWidth: 0},
    unknownText: {color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '700'},
    unknownTextActive: {color: theme.colors.text},
    unknownSubtext: {marginTop: 2},

    spacer: {flex: 1, minHeight: 12},

    nextButton: {marginTop: 12},
  });
}

export default PillScheduleScreen;
