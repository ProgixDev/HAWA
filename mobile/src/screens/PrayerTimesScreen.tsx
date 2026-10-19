import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import NextPrayerCard from '../components/prayer/NextPrayerCard';
import PurityStatusCard from '../components/prayer/PurityStatusCard';
import PrayerScheduleList from '../components/prayer/PrayerScheduleList';
import PeriodEndBottomSheet from '../components/prayer/PeriodEndBottomSheet';
import {usePrayerPurityStatus} from '../hooks/usePrayerPurityStatus';
import {capitalize, dateFormatLocale, formatFullDate, formatHijriDate} from '../utils/cycleMath';
import {getBottomPadding, getTopPadding} from '../theme/spacing';
import {objectiveShowsMenstrualPurity} from '../utils/spiritualObjectiveScope';
import {displayUpperCase} from '../utils/textCase';
import {
  getActiveObjective,
  getHijriAdjustmentDays,
  setHijriAdjustmentDays,
  subscribeHijriAdjustmentDays,
  type HijriAdjustmentDays,
} from '../state/onboardingPreferences';

const MOSQUE_BANNER = require('../assets/images/auth-mosque-background.png');
const MOSQUE_BANNER_RATIO = 848 / 1854;

function PrayerTimesScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 370;

  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [hijriInfoVisible, setHijriInfoVisible] = useState(false);
  const [hijriAdjustment, setHijriAdjustmentState] = useState<HijriAdjustmentDays>(getHijriAdjustmentDays);

  useEffect(() => subscribeHijriAdjustmentDays(() => setHijriAdjustmentState(getHijriAdjustmentDays())), []);

  const handleSetHijriAdjustment = (value: HijriAdjustmentDays) => {
    setHijriAdjustmentDays(value);
  };

  // Shared screen for every objective. Pregnancy, Postpartum, Loss,
  // Contraception and Menopause keep the general prayer schedule/location/
  // Hijri info below, but must never surface normal menstrual purity status —
  // see PurityStatusCard/spiritual-advice/PeriodEndBottomSheet below. The
  // period-based objectives (Cycle, Conceive, SOPK) show it: their dashboards'
  // SpiritualGuidanceCard already displays the same usePrayerPurityStatus()
  // state and links here, so this screen must not hide it (see
  // utils/spiritualObjectiveScope.ts).
  const shouldShowMenstrualPurity = objectiveShowsMenstrualPurity(getActiveObjective());

  const {
    cyclePreferences,
    selectedLocation,
    periodEndDateTime,
    schedule,
    loading,
    error,
    now,
    purityResult,
    nextWindow,
    refresh,
  } = usePrayerPurityStatus();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const weekdayLabel = capitalize(new Intl.DateTimeFormat(dateFormatLocale(), {weekday: 'long'}).format(now));
  const hijriLabel = formatHijriDate(now) ?? '—';
  const metaDateLabel = `${weekdayLabel} ${formatFullDate(now)}`;

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      <View style={styles.banner} pointerEvents="none">
        <Image resizeMode="cover" source={MOSQUE_BANNER} style={[styles.bannerImage, {aspectRatio: MOSQUE_BANNER_RATIO}]} />
        {/* The header title/date/location text below renders directly over
            this banner (no opaque card behind it), so the scrim must already
            carry real theme-background opacity at the very top (location 0)
            — a transparent-at-top fade left the mosque photo fully bright
            behind that text in every theme, which read fine in Light but
            made Dark-mode text (theme.colors.text, necessarily light-on-dark)
            unreadable against the still-bright, undimmed photo. */}
        <LinearGradient
          colors={[withAlpha(theme.colors.background, 0.6), withAlpha(theme.colors.background, 0.85), theme.colors.background]}
          locations={[0, 0.6, 1]}
          style={styles.bannerFade}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingTop: getTopPadding(insets.top, true), paddingBottom: getBottomPadding(insets.bottom)},
        ]}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(380)} style={styles.header}>
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="chevron-left"
            iconSize={26}
            onPress={navigation.goBack}
          />
          <AwaText variant="headlineSmall" style={styles.headerTitle}>
            {t('prayerTimes.title')}
          </AwaText>
          <AwaIconButton
            accessibilityLabel={t('prayerTimes.settingsAccessibility')}
            icon="cog-outline"
            onPress={() => navigation.navigate('SpiritualPreferences', {mode: 'edit'})}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(400)} style={[styles.metaBlock, compact && styles.metaBlockCompact]}>
          <AwaCard
            onPress={() => navigation.navigate('Location', {mode: 'edit'})}
            padding="none"
            shape="full"
            style={styles.locationPill}
            variant="outlined">
            <MaterialDesignIcons color={theme.colors.primary} name="map-marker-outline" size={15} />
            <AwaText variant="labelLarge" style={styles.locationText}>
              {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : t('spiritualGuidance.locationRequired')}
            </AwaText>
            <AwaText colorRole="primary" emphasized variant="labelMedium">{t('prayerTimes.modify')}</AwaText>
          </AwaCard>

          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.dateText}>
            {hijriLabel} · {metaDateLabel}
          </AwaText>
          {schedule?.fajrAngle ? (
            <AwaText colorRole="onSurfaceVariant" variant="labelSmall" style={styles.angleText}>{t('prayerTimes.fajrAngle', {angle: schedule.fajrAngle})}</AwaText>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(420)}>
          <NextPrayerCard error={error} loading={loading} now={now} timezone={schedule?.timezone} window={nextWindow} />
        </Animated.View>

        {schedule ? (
          <Animated.View entering={FadeInUp.delay(180).duration(420)}>
            <PrayerScheduleList highlightName={nextWindow?.name} timezone={schedule.timezone} windows={schedule.windows} />
          </Animated.View>
        ) : null}

        {shouldShowMenstrualPurity ? (
          <Animated.View entering={FadeInUp.delay(240).duration(420)}>
            <PurityStatusCard
              error={error}
              loading={loading}
              onEdit={() => setSheetVisible(true)}
              periodEndDateTime={periodEndDateTime}
              result={purityResult}
              timezone={schedule?.timezone}
            />
          </Animated.View>
        ) : null}

        {shouldShowMenstrualPurity && purityResult.status !== 'unknown' ? (
          <Animated.View entering={FadeInUp.delay(280).duration(420)}>
            <AwaCard variant="filled">
              <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.noteEyebrow}>{displayUpperCase(t('prayerTimes.spiritualAdviceEyebrow'))}</AwaText>
              <View style={styles.noteRow}>
                <MaterialDesignIcons color={theme.colors.primary} name="heart-outline" size={15} />
                <AwaText variant="bodySmall" style={styles.noteText}>
                  {t('prayerTimes.missedPrayersNote')}
                </AwaText>
              </View>
            </AwaCard>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(320).duration(420)}>
          <AwaCard
            onPress={() => navigation.navigate('SpiritualPreferences', {mode: 'edit'})}
            style={styles.guidanceCard}
            variant="outlined">
            <MaterialDesignIcons color={theme.colors.primary} name="book-open-page-variant-outline" size={22} />
            <View style={styles.guidanceCopy}>
              <AwaText variant="titleSmall">{t('spiritualGuidance.title')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.guidanceSubtitle}>{t('prayerTimes.guidanceSubtitle')}</AwaText>
            </View>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={19} />
          </AwaCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(360).duration(420)}>
          <AwaCard variant="outlined">
          <AwaText colorRole="onSurfaceVariant" emphasized variant="labelSmall" style={styles.hijriEyebrow}>{displayUpperCase(t('prayerTimes.hijriSectionTitle'))}</AwaText>

          <View style={styles.hijriRow}>
            <AwaText emphasized variant="bodyMedium">{t('prayerTimes.countryLabel')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.hijriRowValue}>
              {selectedLocation?.country ?? t('prayerTimes.locationUndefined')}
            </AwaText>
          </View>

          <AwaText emphasized variant="bodyMedium" style={styles.hijriAdjustmentLabel}>{t('prayerTimes.adjustHijriLabel')}</AwaText>
          <View accessibilityRole="radiogroup" style={styles.hijriAdjustmentRow}>
            {([-1, 0, 1] as const).map(value => {
              const selected = hijriAdjustment === value;
              const label = value === 0 ? t('prayerTimes.adjustmentNone') : value > 0 ? t('prayerTimes.adjustmentPlusOneDay') : t('prayerTimes.adjustmentMinusOneDay');
              return (
                <AwaCard
                  key={value}
                  accessibilityLabel={t('prayerTimes.adjustmentAccessibility', {label})}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  onPress={() => handleSetHijriAdjustment(value)}
                  padding="none"
                  style={[styles.hijriAdjustmentOption, selected && styles.hijriAdjustmentOptionSelected]}
                  variant="outlined">
                  <AwaText colorRole={selected ? 'onPrimaryContainer' : 'onSurfaceVariant'} emphasized variant="labelLarge" style={styles.hijriAdjustmentOptionText}>
                    {label}
                  </AwaText>
                </AwaCard>
              );
            })}
          </View>

          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.hijriHelperText}>
            {t('prayerTimes.adjustmentHelper')}
          </AwaText>

          {hijriAdjustment !== 0 ? (
            <AwaText colorRole="primary" emphasized variant="bodySmall" style={styles.hijriActiveNote}>
              {t(hijriAdjustment > 0 ? 'prayerTimes.adjustmentActiveNotePlus' : 'prayerTimes.adjustmentActiveNoteMinus')}
            </AwaText>
          ) : null}

          <AwaButton
            accessibilityLabel={t('prayerTimes.aboutHijri')}
            icon="information-outline"
            label={t('prayerTimes.aboutHijri')}
            onPress={() => setHijriInfoVisible(true)}
            size="compact"
            style={styles.hijriInfoRow}
            variant="text"
          />
          </AwaCard>
        </Animated.View>
      </ScrollView>

      {shouldShowMenstrualPurity ? (
        <PeriodEndBottomSheet
          initialDateTime={periodEndDateTime ?? new Date()}
          minDateTime={cyclePreferences.lastPeriodStart}
          onClose={() => setSheetVisible(false)}
          onConfirmed={() => setSheetVisible(false)}
          visible={sheetVisible}
        />
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={() => setHijriInfoVisible(false)}
        statusBarTranslucent
        transparent
        visible={hijriInfoVisible}>
        <View style={styles.infoModalRoot}>
          <Pressable
            accessibilityLabel={t('common.close')}
            onPress={() => setHijriInfoVisible(false)}
            style={styles.infoOverlay}
          />
          <View style={[styles.infoSheet, {paddingBottom: getBottomPadding(insets.bottom) + 8}]}>
            <View style={styles.infoHandle} />
            <AwaText variant="titleLarge" style={styles.infoTitle}>{t('prayerTimes.aboutHijri')}</AwaText>

            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.infoParagraph}>
              {t('prayerTimes.aboutHijriParagraph1')}
            </AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.infoParagraph}>{t('prayerTimes.aboutHijriMethod')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.infoParagraph}>
              {t('prayerTimes.aboutHijriParagraph2')}
            </AwaText>

            <AwaButton
              fullWidth
              label={t('common.close')}
              onPress={() => setHijriInfoVisible(false)}
              style={styles.infoCloseButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    screen: {flex: 1, backgroundColor: theme.colors.background},
    banner: {position: 'absolute', left: 0, right: 0, top: 0, height: 260, overflow: 'hidden'},
    bannerImage: {width: '100%', position: 'absolute', top: 0},
    bannerFade: {...StyleSheet.absoluteFillObject},
    content: {paddingHorizontal: 16, gap: 14},
    header: {flexDirection: 'row', alignItems: 'center', gap: 8},
    headerTitle: {flex: 1, color: theme.colors.text, textAlign: 'center'},
    metaBlock: {alignItems: 'center', paddingHorizontal: 4},
    metaBlockCompact: {paddingHorizontal: 0},
    locationPill: {
      flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
      minHeight: 40, paddingHorizontal: 14, paddingVertical: 8,
    },
    locationText: {flexShrink: 1},
    dateText: {marginTop: 10, textAlign: 'center'},
    angleText: {marginTop: 2, textAlign: 'center'},
    noteEyebrow: {textTransform: 'uppercase', letterSpacing: 0.6},
    noteRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 6},
    noteText: {flex: 1},
    guidanceCard: {flexDirection: 'row', alignItems: 'center', gap: 12},
    guidanceCopy: {flex: 1},
    guidanceSubtitle: {marginTop: 3},
    hijriEyebrow: {textTransform: 'uppercase', letterSpacing: 0.6},
    hijriRow: {
      marginTop: 12, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 10,
    },
    hijriRowValue: {flexShrink: 1, textAlign: 'right'},
    hijriAdjustmentLabel: {marginTop: 16},
    hijriAdjustmentRow: {marginTop: 8, flexDirection: 'row', gap: 8},
    hijriAdjustmentOption: {flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center'},
    hijriAdjustmentOptionSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
    hijriAdjustmentOptionText: {textAlign: 'center'},
    hijriHelperText: {marginTop: 8},
    hijriActiveNote: {marginTop: 8},
    hijriInfoRow: {marginTop: 10, alignSelf: 'flex-start'},
    infoModalRoot: {flex: 1, justifyContent: 'flex-end'},
    infoOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.40)},
    infoSheet: {
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      backgroundColor: theme.colors.surface, paddingHorizontal: 18, paddingTop: 10, elevation: 20,
    },
    infoHandle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: theme.colors.border},
    infoTitle: {marginTop: 14},
    infoParagraph: {marginTop: 12},
    infoCloseButton: {marginTop: 20},
  });
}

export default PrayerTimesScreen;
