import React, {memo, useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from './homeTheme';

export type SpiritualStatus = 'menstruation' | 'purity';

type Props = {
  hijriDate?: string;
  nextPrayerName?: string;
  nextPrayerTime?: string;
  locationName?: string;
  prayerLoading?: boolean;
  prayerError?: boolean;
  qadaaDays?: number;
  status: SpiritualStatus;
  locationConfigured: boolean;
  onManage?: () => void;
};

function InfoBlock({icon, label, value}: {icon: React.ComponentProps<typeof MaterialDesignIcons>['name']; label: string; value: string}) {
  return (
    <View style={styles.infoBlock}>
      <MaterialDesignIcons color={homeColors.primary} name={icon} size={19} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SpiritualGuidanceCard({
  hijriDate,
  nextPrayerName,
  nextPrayerTime,
  locationName,
  prayerLoading = false,
  prayerError = false,
  qadaaDays = 0,
  status,
  locationConfigured,
  onManage,
}: Props): React.JSX.Element {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      Animated.timing(entrance, {
        toValue: 1,
        duration: reduceMotion ? 0 : 430,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [entrance]);

  const isMenstruation = status === 'menstruation';
  const prayerAvailable = Boolean(nextPrayerName);
  const prayerValue = !locationConfigured
    ? 'Localisation requise'
    : prayerLoading
      ? 'Calcul en cours…'
      : prayerError
        ? 'Horaires momentanément indisponibles'
    : prayerAvailable
      ? `${nextPrayerName}${nextPrayerTime ? ` · ${nextPrayerTime}` : ''}`
      : 'Indisponible';

  return (
    <Animated.View
      accessibilityLabel={`Repères spirituels. Statut ${isMenstruation ? 'Menstrues' : 'Pureté'}.`}
      style={[
        styles.card,
        {
          opacity: entrance,
          transform: [
            {translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [10, 0]})},
            {scale: entrance.interpolate({inputRange: [0, 1], outputRange: [0.98, 1]})},
          ],
        },
      ]}>
      <MaterialDesignIcons color={homeColors.lightLavender} name="mosque" size={110} style={styles.watermark} />

      <View style={styles.headingRow}>
        <View style={styles.mosqueCircle}>
          <MaterialDesignIcons color={homeColors.primary} name="mosque" size={22} />
        </View>
        <Text style={styles.title}>Repères spirituels</Text>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onManage} style={({pressed}) => pressed && styles.pressed}>
          <Text style={styles.manageLink}>Voir mes repères</Text>
        </Pressable>
      </View>

      <View style={styles.badgeRow}>
        <View style={[styles.badge, styles.activeBadge]}>
          <Text style={styles.activeBadgeText}>Actif</Text>
        </View>
        <View style={[styles.badge, isMenstruation ? styles.periodBadge : styles.purityBadge]}>
          <MaterialDesignIcons
            color={isMenstruation ? '#A8505A' : homeColors.primary}
            name={isMenstruation ? 'flower-outline' : 'shield-check-outline'}
            size={13}
          />
          <Text style={[styles.badgeText, isMenstruation ? styles.periodText : styles.purityText]}>
            {isMenstruation ? 'Menstrues' : 'Pureté'}
          </Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <MaterialDesignIcons color={homeColors.primary} name="map-marker-outline" size={15} />
        <Text style={styles.locationText}>
          {locationName ?? 'Configure ta localisation pour des horaires précis'}
        </Text>
      </View>

      <View style={styles.body}>
        <InfoBlock icon="alarm" label="Prochaine prière" value={prayerValue} />
        <View style={styles.separator} />
        <InfoBlock icon="calendar-month-outline" label="Date Hijri" value={hijriDate ?? 'Indisponible'} />
        <View style={styles.separator} />
        <InfoBlock icon="silverware-fork-knife" label="Jeûnes à rattraper" value={qadaaDays > 0 ? `${qadaaDays} jours` : 'À jour'} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginTop: 16,
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    padding: 16,
    ...homeShadow,
  },
  watermark: {position: 'absolute', right: -22, bottom: -22, opacity: 0.5},
  headingRow: {flexDirection: 'row', alignItems: 'center'},
  mosqueCircle: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: homeColors.lightLavender},
  title: {flex: 1, marginLeft: 10, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  manageLink: {color: homeColors.primary, fontSize: 11.5, fontWeight: '700'},
  badgeRow: {flexDirection: 'row', gap: 8, marginTop: 10, marginLeft: 50},
  badge: {flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4},
  activeBadge: {backgroundColor: homeColors.greenLight},
  activeBadgeText: {color: homeColors.green, fontSize: 10.5, fontWeight: '700'},
  periodBadge: {backgroundColor: '#F5DEDE'},
  purityBadge: {backgroundColor: homeColors.lightLavender},
  badgeText: {fontSize: 10.5, fontWeight: '700'},
  periodText: {color: '#A8505A'},
  purityText: {color: homeColors.primary},
  locationRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 12, paddingHorizontal: 4},
  locationText: {flex: 1, color: homeColors.textSecondary, fontSize: 11.5, lineHeight: 16},
  body: {flexDirection: 'row', alignItems: 'stretch', marginTop: 14},
  infoBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 3},
  infoLabel: {marginTop: 6, color: homeColors.textSecondary, fontSize: 10, textAlign: 'center'},
  infoValue: {marginTop: 3, color: homeColors.textPrimary, fontSize: 12, fontWeight: '700', textAlign: 'center'},
  separator: {width: StyleSheet.hairlineWidth, marginHorizontal: 6, backgroundColor: homeColors.cardBorder},
  pressed: {opacity: 0.7},
});

export default memo(SpiritualGuidanceCard);
