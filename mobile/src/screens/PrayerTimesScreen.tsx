import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {homeRadii} from '../components/home/homeTheme';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import NextPrayerCard from '../components/prayer/NextPrayerCard';
import PurityStatusCard from '../components/prayer/PurityStatusCard';
import PrayerScheduleList from '../components/prayer/PrayerScheduleList';
import PeriodEndBottomSheet from '../components/prayer/PeriodEndBottomSheet';
import {usePrayerPurityStatus} from '../hooks/usePrayerPurityStatus';
import {capitalize, formatFullDate, formatHijriDate} from '../utils/cycleMath';
import {getBottomPadding, getTopPadding} from '../theme/spacing';
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

  // Shared screen for all three objectives. Pregnancy and Postpartum keep
  // the general prayer schedule/location/Hijri info below, but must never
  // surface normal menstrual purity status — see PurityStatusCard/
  // spiritual-advice/PeriodEndBottomSheet below. Cycle's own behavior is
  // entirely unchanged; menstrual purity only ever applies there.
  const shouldShowMenstrualPurity = getActiveObjective() === 'cycle';

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

  const weekdayLabel = capitalize(new Intl.DateTimeFormat('fr-FR', {weekday: 'long'}).format(now));
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
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={26} />
          </Pressable>
          <Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={styles.headerTitle}>
            Horaires de prière
          </Text>
          <Pressable
            accessibilityLabel="Réglages des horaires de prière"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.navigate('SpiritualPreferences')}
            style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="cog-outline" size={22} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(400)} style={[styles.metaBlock, compact && styles.metaBlockCompact]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Location', {mode: 'edit'})}
            style={({pressed}) => [styles.locationPill, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="map-marker-outline" size={15} />
            <Text numberOfLines={1} style={styles.locationText}>
              {selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Localisation requise'}
            </Text>
            <Text style={styles.locationModify}>Modifier</Text>
          </Pressable>

          <Text numberOfLines={2} style={styles.dateText}>
            {hijriLabel} · {metaDateLabel}
          </Text>
          {schedule?.fajrAngle ? (
            <Text style={styles.angleText}>Fajr - Angle de {schedule.fajrAngle}°</Text>
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
          <Animated.View entering={FadeInUp.delay(280).duration(420)} style={styles.noteCard}>
            <Text style={styles.noteEyebrow}>Conseil spirituel</Text>
            <View style={styles.noteRow}>
              <MaterialDesignIcons color={theme.colors.primary} name="heart-outline" size={15} />
              <Text style={styles.noteText}>
                Les prières manquées pendant les règles ne sont pas à rattraper.
              </Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(320).duration(420)}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('SpiritualPreferences')}
            style={({pressed}) => [styles.guidanceCard, pressed && styles.pressed]}>
            <View style={styles.guidanceIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="book-open-page-variant-outline" size={18} />
            </View>
            <View style={styles.guidanceCopy}>
              <Text style={styles.guidanceTitle}>Repères spirituels</Text>
              <Text style={styles.guidanceSubtitle}>Découvre des rappels et des contenus utiles pour ton quotidien.</Text>
            </View>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="chevron-right" size={19} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(360).duration(420)} style={styles.hijriCard}>
          <Text style={styles.hijriEyebrow}>Calendrier Hijri</Text>

          <View style={styles.hijriRow}>
            <Text style={styles.hijriRowLabel}>Pays</Text>
            <Text numberOfLines={1} style={styles.hijriRowValue}>
              {selectedLocation?.country ?? 'Non défini'}
            </Text>
          </View>

          <Text style={[styles.hijriRowLabel, styles.hijriAdjustmentLabel]}>Ajuster la date Hijri</Text>
          <View accessibilityRole="radiogroup" style={styles.hijriAdjustmentRow}>
            {([-1, 0, 1] as const).map(value => {
              const selected = hijriAdjustment === value;
              const label = value === 0 ? 'Aucun' : value > 0 ? '+1 jour' : '-1 jour';
              return (
                <Pressable
                  key={value}
                  accessibilityLabel={`Ajustement Hijri : ${label}`}
                  accessibilityRole="radio"
                  accessibilityState={{checked: selected}}
                  onPress={() => handleSetHijriAdjustment(value)}
                  style={({pressed}) => [
                    styles.hijriAdjustmentOption,
                    selected && styles.hijriAdjustmentOptionSelected,
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.hijriAdjustmentOptionText,
                      selected && styles.hijriAdjustmentOptionTextSelected,
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.hijriHelperText}>
            Laisse « Aucun » si la date affichée correspond à celle suivie dans ta région.
          </Text>

          {hijriAdjustment !== 0 ? (
            <Text style={styles.hijriActiveNote}>
              Calendrier ajusté de {hijriAdjustment > 0 ? '+1 jour' : '−1 jour'}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="À propos du calendrier Hijri"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setHijriInfoVisible(true)}
            style={({pressed}) => [styles.hijriInfoRow, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="information-outline" size={14} />
            <Text style={styles.hijriInfoText}>À propos du calendrier Hijri</Text>
          </Pressable>
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
            accessibilityLabel="Fermer"
            onPress={() => setHijriInfoVisible(false)}
            style={styles.infoOverlay}
          />
          <View style={[styles.infoSheet, {paddingBottom: getBottomPadding(insets.bottom) + 8}]}>
            <View style={styles.infoHandle} />
            <Text style={styles.infoTitle}>À propos du calendrier Hijri</Text>

            <Text style={styles.infoParagraph}>
              Les dates Hijri sont calculées et peuvent varier d’un jour selon l’observation lunaire et les annonces
              officielles locales.
            </Text>
            <Text style={styles.infoParagraph}>Méthode : calendrier Hijri calculé</Text>
            <Text style={styles.infoParagraph}>
              Le pays affiché correspond à la localisation utilisée pour tes horaires de prière. Il ne signifie pas
              qu’AWA récupère automatiquement les annonces officielles de ce pays.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setHijriInfoVisible(false)}
              style={({pressed}) => [styles.infoCloseButton, pressed && styles.pressed]}>
              <Text style={styles.infoCloseText}>Fermer</Text>
            </Pressable>
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
    headerButton: {
      width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21,
      backgroundColor: theme.colors.surface, elevation: 2,
      shadowColor: theme.shadow.shadowColor, shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.09, shadowRadius: 8,
    },
    headerTitle: {flex: 1, color: theme.colors.text, fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center'},
    pressed: {opacity: 0.8},
    metaBlock: {alignItems: 'center', paddingHorizontal: 4},
    metaBlockCompact: {paddingHorizontal: 0},
    locationPill: {
      flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
      borderRadius: homeRadii.button, backgroundColor: theme.colors.surface, paddingHorizontal: 14, paddingVertical: 8,
      ...theme.shadow,
    },
    locationText: {flexShrink: 1, color: theme.colors.text, fontSize: 13, fontWeight: '700'},
    locationModify: {color: theme.colors.primary, fontSize: 11.5, fontWeight: '700'},
    dateText: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 12.5, textAlign: 'center'},
    angleText: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 10.5, textAlign: 'center'},
    noteCard: {
      borderRadius: 18, backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14, paddingVertical: 13,
    },
    noteEyebrow: {color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6},
    noteRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 6},
    noteText: {flex: 1, color: theme.colors.text, fontSize: 12.5, lineHeight: 18},
    guidanceCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface, padding: 15, ...theme.shadow,
    },
    guidanceIcon: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: theme.colors.primarySoft},
    guidanceCopy: {flex: 1},
    guidanceTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
    guidanceSubtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    hijriCard: {
      borderRadius: homeRadii.card, backgroundColor: theme.colors.surface,
      padding: 15, ...theme.shadow,
    },
    hijriEyebrow: {
      color: theme.colors.textSecondary, fontSize: 10.5, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.6,
    },
    hijriRow: {
      marginTop: 12, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 10,
    },
    hijriRowLabel: {color: theme.colors.text, fontSize: 13, fontWeight: '700'},
    hijriRowValue: {flexShrink: 1, color: theme.colors.textSecondary, fontSize: 13, textAlign: 'right'},
    hijriAdjustmentLabel: {marginTop: 16},
    hijriAdjustmentRow: {marginTop: 8, flexDirection: 'row', gap: 8},
    hijriAdjustmentOption: {
      flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center',
      borderRadius: homeRadii.button, borderWidth: 1.25, borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    hijriAdjustmentOptionSelected: {borderColor: theme.colors.primary, backgroundColor: withAlpha(theme.colors.primary, 0.12)},
    hijriAdjustmentOptionText: {color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '700'},
    hijriAdjustmentOptionTextSelected: {color: theme.colors.primary},
    hijriHelperText: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15},
    hijriActiveNote: {marginTop: 8, color: theme.colors.primary, fontSize: 11.5, fontWeight: '700'},
    hijriInfoRow: {
      marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-start',
    },
    hijriInfoText: {color: theme.colors.textSecondary, fontSize: 11.5, fontWeight: '600'},
    infoModalRoot: {flex: 1, justifyContent: 'flex-end'},
    infoOverlay: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.40)},
    infoSheet: {
      borderTopLeftRadius: homeRadii.card, borderTopRightRadius: homeRadii.card,
      backgroundColor: theme.colors.surface, paddingHorizontal: 18, paddingTop: 10, elevation: 20,
    },
    infoHandle: {width: 42, height: 5, alignSelf: 'center', borderRadius: 3, backgroundColor: theme.colors.border},
    infoTitle: {
      marginTop: 14, color: theme.colors.text, fontFamily: 'serif',
      fontSize: 18, fontWeight: '700', lineHeight: 23,
    },
    infoParagraph: {marginTop: 12, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
    infoCloseButton: {
      marginTop: 20, minHeight: 50, alignItems: 'center', justifyContent: 'center',
      borderRadius: homeRadii.button, backgroundColor: theme.colors.primary,
    },
    infoCloseText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
  });
}

export default PrayerTimesScreen;
