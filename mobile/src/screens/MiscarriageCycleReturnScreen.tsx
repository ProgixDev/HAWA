import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  Image,
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
import {useTranslation} from 'react-i18next';
import type {TFunction} from 'i18next';
import '../i18n';
import {getAppLanguage} from '../state/themePreferences';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {spacing, getTopPadding} from '../theme/spacing';
import PremiumChoiceCard from '../components/onboarding/PremiumChoiceCard';
import InlineCalendarPickerModal from '../components/onboarding/InlineCalendarPickerModal';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  setMiscarriageCycleReturnStatus,
  type MiscarriageCycleReturnStatus,
} from '../state/miscarriagePreferences';
import {startOfDay} from '../utils/cycleMath';
import {validateCycleReturnDate} from '../utils/lossDateValidation';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MiscarriageCycleReturn'>;

// `id` is the persisted enum (MiscarriageCycleReturnStatus) — title/subtitle
// are pure display text, safe to translate.
function optionsFor(t: TFunction): Array<{
  id: MiscarriageCycleReturnStatus;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  tint: string;
}> {
  return [
    {id: 'yes', title: t('miscarriageCycleReturn.options.yes.title'), subtitle: t('miscarriageCycleReturn.options.yes.subtitle'), icon: 'check-decagram-outline', tint: '#E7F0E8'},
    {id: 'no', title: t('miscarriageCycleReturn.options.no.title'), subtitle: t('miscarriageCycleReturn.options.no.subtitle'), icon: 'calendar-clock-outline', tint: '#FBE9EB'},
    {id: 'unknown', title: t('miscarriageCycleReturn.options.unknown.title'), subtitle: t('miscarriageCycleReturn.options.unknown.subtitle'), icon: 'help-circle-outline', tint: '#F1E8F5'},
  ];
}

const formatFullDate = (date: Date): string =>
  new Intl.DateTimeFormat(getAppLanguage() === 'en' ? 'en-US' : 'fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);

function MiscarriageCycleReturnScreen({navigation, route}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t} = useTranslation();
  const OPTIONS = useMemo(() => optionsFor(t), [t]);
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  const initial = useRef(getMiscarriagePreferences()).current;

  const [selected, setSelected] = useState<MiscarriageCycleReturnStatus | null>(initial.cycleReturnStatus);
  const [returnedDate, setReturnedDate] = useState<Date | null>(
    initial.firstReturnedPeriodDate ? startOfDay(new Date(`${initial.firstReturnedPeriodDate}T12:00:00`)) : null,
  );
  const [miscarriageDate, setMiscarriageDateValue] = useState<Date | null>(
    initial.miscarriageDate ? startOfDay(new Date(`${initial.miscarriageDate}T12:00:00`)) : null,
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(value => {
      if (!active) {return;}
      setSelected(current => current ?? value.cycleReturnStatus);
      setReturnedDate(current =>
        current ?? (value.firstReturnedPeriodDate ? startOfDay(new Date(`${value.firstReturnedPeriodDate}T12:00:00`)) : null),
      );
      setMiscarriageDateValue(current =>
        current ?? (value.miscarriageDate ? startOfDay(new Date(`${value.miscarriageDate}T12:00:00`)) : null),
      );
    });
    return () => {active = false;};
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {reduceMotion.current = value;});
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: reduceMotion.current ? 0 : 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  // The ONE canonical rule for a cycle-return date (utils/lossDateValidation):
  // a valid date, never in the future, never before the loss date — the same
  // check the store setter applies, so no path can bypass it.
  const validateReturned = (date: Date) =>
    validateCycleReturnDate({
      date,
      now: new Date(),
      lossDate: miscarriageDate ? miscarriageDate.toLocaleDateString('en-CA') : null,
    });

  const chooseReturnedDate = (date: Date) => {
    const candidate = startOfDay(date);
    const validation = validateReturned(candidate);
    if (!validation.valid) {
      Alert.alert(t('miscarriageCycleReturn.invalidDateTitle'), validation.message);
      return;
    }
    setReturnedDate(candidate);
  };

  // A date ALREADY stored (legacy: future, or before the loss) is never
  // silently corrected or dropped — it is shown as "à vérifier" and the user
  // must pick a valid date (or remove it) before saving.
  const returnedDateProblem =
    selected === 'yes' && returnedDate ? validateReturned(returnedDate) : null;

  const handleNext = async () => {
    if (saving || !selected) {return;}
    // Same guards as the picker, re-checked at save time so a stale/legacy
    // stored date can never be re-saved silently. The date only matters
    // when the answer is 'yes' (any other answer clears it in the store).
    if (selected === 'yes' && returnedDate) {
      const validation = validateReturned(returnedDate);
      if (!validation.valid) {
        Alert.alert(t('miscarriageCycleReturn.invalidDateTitle'), validation.message);
        return;
      }
    }
    setSaving(true);
    try {
      const result = await setMiscarriageCycleReturnStatus(selected, selected === 'yes' ? returnedDate : null);
      if (!result.valid) {
        // Rejected by the store's own guard: nothing was written.
        Alert.alert(t('miscarriageCycleReturn.invalidDateTitle'), result.message);
        return;
      }
      if (route.params?.mode === 'edit') {
        navigation.goBack();
        return;
      }
      navigation.navigate('MiscarriageTryingAgain');
    } finally {
      setSaving(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})}],
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
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
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} hidden={false} translucent />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingTop: getTopPadding(insets.top), paddingBottom: Math.max(insets.bottom, 16) + spacing.sm},
          ]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.mainContent, entranceStyle]}>
            <View style={styles.header}>
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel={t('miscarriageCycleReturn.illustrationAccessibility')}
                resizeMode="contain"
                source={require('../assets/images/miscarriage/miscarriage-calendar.png')}
                style={styles.headerImage}
              />
              <Text style={styles.title}>{t('miscarriageCycleReturn.title')}</Text>
              <Text style={styles.subtitle}>{t('miscarriageCycleReturn.subtitle')}</Text>
            </View>

            <View style={styles.optionsCenterContainer}>
              <View style={styles.optionsList}>
                {OPTIONS.map(option => (
                  <PremiumChoiceCard
                    icon={option.icon}
                    iconTint={option.tint}
                    key={option.id}
                    onPress={() => setSelected(option.id)}
                    selected={selected === option.id}
                    subtitle={option.subtitle}
                    title={option.title}>
                    {option.id === 'yes' ? (
                      <Pressable
                        accessibilityLabel={t('miscarriageCycleReturn.dateField.accessibilityLabel')}
                        accessibilityRole="button"
                        onPress={() => setPickerVisible(true)}
                        style={({pressed}) => [styles.dateField, pressed && styles.pressed]}>
                        <View style={styles.dateFieldIcon}>
                          <MaterialDesignIcons color={theme.colors.primary} name="calendar-month-outline" size={18} />
                        </View>
                        <View style={styles.dateFieldCopy}>
                          <Text style={styles.dateFieldLabel}>
                            {t('miscarriageCycleReturn.dateField.label')}{' '}
                            <Text style={styles.dateFieldOptional}>{t('miscarriageCycleReturn.dateField.optional')}</Text>
                          </Text>
                          <Text style={[styles.dateFieldValue, !returnedDate && styles.dateFieldPlaceholder]}>
                            {returnedDate ? formatFullDate(returnedDate) : t('miscarriageCycleReturn.dateField.placeholder')}
                          </Text>
                        </View>
                        <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={18} />
                      </Pressable>
                    ) : null}
                    {option.id === 'yes' && returnedDate ? (
                      <>
                        {returnedDateProblem && !returnedDateProblem.valid ? (
                          <Text accessibilityRole="alert" style={styles.dateWarning}>
                            {t('miscarriageCycleReturn.dateWarning', {message: returnedDateProblem.message})}
                          </Text>
                        ) : null}
                        <Pressable
                          accessibilityLabel={t('miscarriageCycleReturn.removeDate')}
                          accessibilityRole="button"
                          onPress={() => setReturnedDate(null)}
                          style={({pressed}) => [styles.clearDate, pressed && styles.pressed]}>
                          <Text style={styles.clearDateText}>{t('miscarriageCycleReturn.removeDate')}</Text>
                        </Pressable>
                      </>
                    ) : null}
                  </PremiumChoiceCard>
                ))}
              </View>
            </View>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            disabled={saving || !selected}
            onPress={handleNext}
            style={({pressed}) => [
              styles.nextButton,
              !selected && styles.nextButtonDisabled,
              (pressed || saving) && selected && styles.pressed,
            ]}>
            <Text style={styles.nextText}>
              {saving ? t('miscarriageCycleReturn.saving') : route.params?.mode === 'edit' ? t('common.save') : t('miscarriageCycleReturn.next')}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <InlineCalendarPickerModal
        maximumDate={startOfDay(new Date())}
        minimumDate={miscarriageDate ?? undefined}
        onClose={() => setPickerVisible(false)}
        onSelect={chooseReturnedDate}
        subtitle={t('miscarriageCycleReturn.pickerSubtitle')}
        title={t('miscarriageCycleReturn.pickerTitle')}
        value={returnedDate && !(returnedDateProblem && !returnedDateProblem.valid) ? returnedDate : miscarriageDate ?? new Date()}
        visible={pickerVisible}
      />
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  background: {flex: 1, backgroundColor: theme.colors.background},

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
    backgroundColor: withAlpha(theme.colors.primary, 0.07),
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: withAlpha(theme.colors.primary, 0.045),
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: withAlpha(theme.colors.primary, 0.05),
  },

  safeArea: {flex: 1},
  content: {flexGrow: 1, paddingHorizontal: spacing.lg},
  mainContent: {flex: 1},
  header: {alignItems: 'center', paddingTop: 5, marginBottom: spacing.md},
  headerImage: {width: 210, height: 135, marginBottom: 2},
  title: {
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 310,
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  optionsCenterContainer: {flex: 1, justifyContent: 'center', paddingVertical: spacing.md},
  optionsList: {gap: 12},
  dateField: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
  },
  dateFieldIcon: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
  },
  dateFieldCopy: {flex: 1, minWidth: 0, marginHorizontal: 9},
  dateFieldLabel: {color: theme.colors.textSecondary, fontSize: 9.5, lineHeight: 13},
  dateFieldOptional: {fontStyle: 'italic'},
  dateFieldValue: {marginTop: 2, color: theme.colors.text, fontSize: 12.5, fontWeight: '700'},
  dateFieldPlaceholder: {color: theme.colors.textMuted, fontWeight: '500'},
  dateWarning: {marginTop: 8, color: theme.colors.danger, fontSize: 11, lineHeight: 15},
  clearDate: {alignSelf: 'flex-start', marginTop: 6, paddingVertical: 6, paddingHorizontal: 4},
  clearDateText: {color: theme.colors.primary, fontSize: 11.5, fontWeight: '700'},
  nextButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 5,
  },
  nextButtonDisabled: {backgroundColor: withAlpha(theme.colors.primary, 0.45), shadowOpacity: 0, elevation: 0},
  nextText: {color: onPrimaryTextColor(theme), fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
  });
}

export default MiscarriageCycleReturnScreen;
