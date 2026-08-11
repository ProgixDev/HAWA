import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {FadeInUp} from 'react-native-reanimated';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import type {PrayerName, PrayerWindow} from '../../services/prayerTimes';

type Props = {
  windows: PrayerWindow[];
  timezone?: string;
  highlightName?: PrayerName;
};

const formatTime = (date: Date, timezone?: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    ...(timezone ? {timeZone: timezone} : {}),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

function PrayerScheduleList({windows, timezone, highlightName}: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <Text style={styles.title}>Horaires du jour</Text>
        <View style={styles.headingRight}>
          <MaterialDesignIcons color={homeColors.textSecondary} name="clock-outline" size={13} />
          <Text style={styles.headingRightText}>Heures locales</Text>
        </View>
      </View>

      {windows.map((window, index) => {
        const active = window.name === highlightName;
        const isLast = index === windows.length - 1;
        return (
          <Animated.View
            entering={FadeInUp.delay(60 + index * 45).duration(320)}
            key={window.name}
            style={[styles.row, active && styles.rowActive]}>
            <View style={styles.timelineColumn}>
              <View style={[styles.dot, active && styles.dotActive]} />
              {!isLast ? <View style={styles.timelineLine} /> : null}
            </View>

            <View style={styles.rowBody}>
              <View style={styles.rowHeadLine}>
                <Text style={[styles.name, active && styles.nameActive]}>{window.name}</Text>
                <Text style={[styles.start, active && styles.nameActive]}>{formatTime(window.start, timezone)}</Text>
              </View>
              {active ? (
                <View style={styles.nextBadge}>
                  <Text style={styles.nextBadgeText}>Prochaine prière</Text>
                </View>
              ) : (
                <Text style={styles.endLabel}>Fin du créneau · {formatTime(window.end, timezone)}</Text>
              )}
            </View>
          </Animated.View>
        );
      })}

      <Text style={styles.footnote}>
        Les horaires sont calculés selon ta localisation. Pense à les vérifier régulièrement.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {borderRadius: homeRadii.card, backgroundColor: '#FFFFFF', padding: 16, ...homeShadow},
  headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  headingRight: {flexDirection: 'row', alignItems: 'center', gap: 4},
  headingRightText: {color: homeColors.textSecondary, fontSize: 11},
  row: {flexDirection: 'row', alignItems: 'stretch', borderRadius: 14, paddingHorizontal: 6},
  rowActive: {backgroundColor: homeColors.lightLavender},
  timelineColumn: {width: 22, alignItems: 'center'},
  dot: {
    marginTop: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D9CDF0',
    backgroundColor: '#FFFFFF',
  },
  dotActive: {borderColor: homeColors.primary, backgroundColor: homeColors.primary},
  timelineLine: {flex: 1, width: 2, marginTop: 2, marginBottom: 2, backgroundColor: homeColors.cardBorder},
  rowBody: {flex: 1, paddingVertical: 12, paddingLeft: 8},
  rowHeadLine: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  name: {color: homeColors.textPrimary, fontSize: 14.5, fontWeight: '700'},
  nameActive: {color: homeColors.primary},
  start: {color: homeColors.textPrimary, fontSize: 15.5, fontWeight: '700'},
  endLabel: {marginTop: 2, color: homeColors.textSecondary, fontSize: 11.5},
  nextBadge: {
    alignSelf: 'flex-start', marginTop: 5, borderRadius: 10,
    backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 2,
  },
  nextBadgeText: {color: homeColors.primary, fontSize: 10.5, fontWeight: '700'},
  footnote: {marginTop: 10, color: homeColors.textSecondary, fontSize: 11, lineHeight: 15, textAlign: 'center'},
});

export default memo(PrayerScheduleList);
