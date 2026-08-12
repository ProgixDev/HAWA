import React, {useCallback, useState} from 'react';
import {
  Image,
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
import {homeColors, homeRadii, homeShadow} from '../components/home/homeTheme';
import NextPrayerCard from '../components/prayer/NextPrayerCard';
import PurityStatusCard from '../components/prayer/PurityStatusCard';
import PrayerScheduleList from '../components/prayer/PrayerScheduleList';
import PeriodEndBottomSheet from '../components/prayer/PeriodEndBottomSheet';
import {usePrayerPurityStatus} from '../hooks/usePrayerPurityStatus';
import {capitalize, formatFullDate, formatHijriDate} from '../utils/cycleMath';
import {getBottomPadding, getTopPadding} from '../theme/spacing';
import {getActiveObjective} from '../state/onboardingPreferences';

const MOSQUE_BANNER = require('../assets/images/auth-mosque-background.png');
const MOSQUE_BANNER_RATIO = 848 / 1854;

function PrayerTimesScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const compact = width < 370;

  const [refreshing, setRefreshing] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Shared screen for both objectives. Pregnancy keeps the general prayer
  // schedule/location/Hijri info below, but must never surface menstrual
  // purity status — see PurityStatusCard/spiritual-advice/PeriodEndBottomSheet
  // below. Cycle's own behavior is entirely unchanged.
  const isPregnancy = getActiveObjective() === 'pregnancy';

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
  const hijriLabel = schedule?.hijriDate ?? formatHijriDate(now) ?? '—';
  const metaDateLabel = `${weekdayLabel} ${formatFullDate(now)}`;

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      <View style={styles.banner} pointerEvents="none">
        <Image resizeMode="cover" source={MOSQUE_BANNER} style={[styles.bannerImage, {aspectRatio: MOSQUE_BANNER_RATIO}]} />
        <LinearGradient
          colors={['rgba(248,243,255,0)', 'rgba(248,243,255,0.55)', '#F8F3FF']}
          locations={[0, 0.6, 1]}
          style={styles.bannerFade}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingTop: getTopPadding(insets.top, true), paddingBottom: getBottomPadding(insets.bottom)},
        ]}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} tintColor={homeColors.primary} />}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(380)} style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={homeColors.primary} name="chevron-left" size={26} />
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
            <MaterialDesignIcons color={homeColors.primary} name="cog-outline" size={22} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(60).duration(400)} style={[styles.metaBlock, compact && styles.metaBlockCompact]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Location')}
            style={({pressed}) => [styles.locationPill, pressed && styles.pressed]}>
            <MaterialDesignIcons color={homeColors.primary} name="map-marker-outline" size={15} />
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

        {!isPregnancy ? (
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

        {!isPregnancy && purityResult.status !== 'unknown' ? (
          <Animated.View entering={FadeInUp.delay(280).duration(420)} style={styles.noteCard}>
            <Text style={styles.noteEyebrow}>Conseil spirituel</Text>
            <View style={styles.noteRow}>
              <MaterialDesignIcons color={homeColors.primary} name="heart-outline" size={15} />
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
              <MaterialDesignIcons color={homeColors.primary} name="book-open-page-variant-outline" size={18} />
            </View>
            <View style={styles.guidanceCopy}>
              <Text style={styles.guidanceTitle}>Repères spirituels</Text>
              <Text style={styles.guidanceSubtitle}>Découvre des rappels et des contenus utiles pour ton quotidien.</Text>
            </View>
            <MaterialDesignIcons color={homeColors.textSecondary} name="chevron-right" size={19} />
          </Pressable>
        </Animated.View>
      </ScrollView>

      {!isPregnancy ? (
        <PeriodEndBottomSheet
          initialDateTime={periodEndDateTime ?? new Date()}
          minDateTime={cyclePreferences.lastPeriodStart}
          onClose={() => setSheetVisible(false)}
          onConfirmed={() => setSheetVisible(false)}
          visible={sheetVisible}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F8F3FF'},
  banner: {position: 'absolute', left: 0, right: 0, top: 0, height: 260, overflow: 'hidden'},
  bannerImage: {width: '100%', position: 'absolute', top: 0},
  bannerFade: {...StyleSheet.absoluteFillObject},
  content: {paddingHorizontal: 16, gap: 14},
  header: {flexDirection: 'row', alignItems: 'center', gap: 8},
  headerButton: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21,
    backgroundColor: '#FFFFFF', elevation: 2,
    shadowColor: '#4E319A', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.09, shadowRadius: 8,
  },
  headerTitle: {flex: 1, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center'},
  pressed: {opacity: 0.8},
  metaBlock: {alignItems: 'center', paddingHorizontal: 4},
  metaBlockCompact: {paddingHorizontal: 0},
  locationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%',
    borderRadius: homeRadii.button, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8,
    ...homeShadow,
  },
  locationText: {flexShrink: 1, color: homeColors.textPrimary, fontSize: 13, fontWeight: '700'},
  locationModify: {color: homeColors.primary, fontSize: 11.5, fontWeight: '700'},
  dateText: {marginTop: 10, color: homeColors.textSecondary, fontSize: 12.5, textAlign: 'center'},
  angleText: {marginTop: 2, color: homeColors.textSecondary, fontSize: 10.5, textAlign: 'center'},
  noteCard: {
    borderRadius: 18, backgroundColor: homeColors.lightLavender,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  noteEyebrow: {color: homeColors.textSecondary, fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6},
  noteRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 6},
  noteText: {flex: 1, color: homeColors.textPrimary, fontSize: 12.5, lineHeight: 18},
  guidanceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF', padding: 15, ...homeShadow,
  },
  guidanceIcon: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: homeColors.lightLavender},
  guidanceCopy: {flex: 1},
  guidanceTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 15, fontWeight: '700'},
  guidanceSubtitle: {marginTop: 3, color: homeColors.textSecondary, fontSize: 11.5, lineHeight: 16},
});

export default PrayerTimesScreen;
