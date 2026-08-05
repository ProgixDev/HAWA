import React, {memo, useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

export type SpiritualStatus = 'menstruation' | 'purity';

type Props = {
  hijriDate?: string;
  nextPrayerName?: string;
  nextPrayerTime?: string;
  remainingTime?: string;
  status: SpiritualStatus;
  locationConfigured: boolean;
};

const PURPLE = '#6949BE';

function SpiritualGuidanceCard({
  hijriDate,
  nextPrayerName,
  nextPrayerTime,
  remainingTime,
  status,
  locationConfigured,
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
  const message = !locationConfigured
    ? 'Ajoute ta localisation pour calculer les horaires de prière.'
    : isMenstruation
      ? 'Les prières sont suspendues durant cette période.'
      : 'Toutes les prières sont à accomplir.';

  return (
    <Animated.View
      accessibilityLabel={`Repères spirituels. Statut ${isMenstruation ? 'Menstrues' : 'Pureté'}. ${message}`}
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
      <View style={styles.headingRow}>
        <View style={styles.mosqueCircle}>
          <MaterialDesignIcons color={PURPLE} name="mosque" size={27} />
        </View>
        <Text style={styles.title}>Repères spirituels</Text>
        <MaterialDesignIcons color={PURPLE} name="cog-outline" size={24} />
      </View>

      <View style={styles.body}>
        <View style={styles.dateColumn}>
          <MaterialDesignIcons color="#655A8D" name="calendar-month-outline" size={25} />
          <Text style={styles.date}>{hijriDate ?? 'Date hijri indisponible'}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.prayerColumn}>
          <Text style={styles.sectionLabel}>Prochaine prière</Text>
          <Text numberOfLines={2} style={styles.prayerName}>
            {prayerAvailable ? nextPrayerName : 'Horaires non disponibles'}
          </Text>
          {prayerAvailable && nextPrayerTime ? (
            <Text style={styles.prayerTime}>{nextPrayerTime}</Text>
          ) : null}
          {prayerAvailable && remainingTime ? (
            <View style={styles.timeRow}>
              <MaterialDesignIcons color={PURPLE} name="clock-outline" size={20} />
              <Text style={styles.remaining}>{remainingTime}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.separator} />

        <View style={styles.statusColumn}>
          <Text style={styles.sectionLabel}>Statut</Text>
          <View style={[styles.statusBadge, isMenstruation ? styles.periodBadge : styles.purityBadge]}>
            <MaterialDesignIcons
              color={isMenstruation ? '#A8505A' : PURPLE}
              name={isMenstruation ? 'flower-outline' : 'shield-check-outline'}
              size={19}
            />
            <Text style={[styles.statusText, isMenstruation ? styles.periodText : styles.purityText]}>
              {isMenstruation ? 'Menstrues' : 'Pureté'}
            </Text>
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {marginTop: 15, borderWidth: 1, borderColor: 'rgba(105,73,190,0.18)', borderRadius: 25, backgroundColor: '#FFFDF8', padding: 14, elevation: 2, shadowColor: '#28166F', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 10},
  headingRow: {flexDirection: 'row', alignItems: 'center'},
  mosqueCircle: {width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#EEE3FA'},
  title: {flex: 1, marginLeft: 11, color: '#28166F', fontFamily: 'serif', fontSize: 19, fontWeight: '700'},
  body: {flexDirection: 'row', alignItems: 'stretch', marginTop: 13},
  dateColumn: {width: '25%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2},
  date: {marginTop: 7, color: '#655A8D', fontSize: 11, lineHeight: 15, textAlign: 'center'},
  separator: {width: StyleSheet.hairlineWidth, marginHorizontal: 8, backgroundColor: 'rgba(105,73,190,0.16)'},
  prayerColumn: {flex: 0.85, justifyContent: 'center'},
  statusColumn: {flex: 1.2, justifyContent: 'center'},
  sectionLabel: {color: '#655A8D', fontSize: 11, fontWeight: '500'},
  prayerName: {marginTop: 4, color: PURPLE, fontSize: 17, fontWeight: '700'},
  prayerTime: {marginTop: 1, color: '#655A8D', fontSize: 11, fontWeight: '600'},
  timeRow: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  remaining: {flex: 1, marginLeft: 5, color: '#655A8D', fontSize: 11},
  statusBadge: {alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginTop: 5, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 5},
  periodBadge: {backgroundColor: '#F5DEDE'},
  purityBadge: {backgroundColor: '#EEE3FA'},
  statusText: {marginLeft: 5, fontSize: 12, fontWeight: '700'},
  periodText: {color: '#A8505A'},
  purityText: {color: PURPLE},
  message: {marginTop: 7, color: '#7A6F98', fontSize: 10, lineHeight: 14},
});

export default memo(SpiritualGuidanceCard);
