import React, {memo, useEffect} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import Animated, {useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';

import {homeColors, homeRadii, homeShadow} from '../home/homeTheme';
import type {PurityPrayerResult} from '../../utils/purityPrayerLogic';

type Props = {
  result: PurityPrayerResult;
  periodEndDateTime: Date | null;
  timezone?: string;
  loading: boolean;
  error: boolean;
  onEdit: () => void;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatTime = (date: Date, timezone?: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    ...(timezone ? {timeZone: timezone} : {}),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

const formatDeclaredEnd = (date: Date, timezone?: string): string => {
  const prefix = sameDay(date, new Date()) ? 'Aujourd’hui' : 'Le ' + new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long'}).format(date);
  return `${prefix} à ${formatTime(date, timezone)}`;
};

function PurityStatusCard({result, periodEndDateTime, timezone, loading, error, onEdit}: Props): React.JSX.Element {
  // Gentle fade + scale whenever the status itself changes (e.g.
  // Menstrues -> Pureté right after confirming the period end) — a calm
  // acknowledgement of the state change, not a re-mount of the subtree.
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = 0;
    scale.value = 0.98;
    opacity.value = withTiming(1, {duration: 320});
    scale.value = withTiming(1, {duration: 320});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.status]);

  const stateAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingLeft}>
          <View style={styles.dropCircle}>
            <MaterialDesignIcons color={homeColors.primary} name="water-outline" size={18} />
          </View>
          <Text style={styles.title}>Statut de pureté</Text>
        </View>
        {result.status === 'pure' ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onEdit} style={({pressed}) => [styles.editButton, pressed && styles.pressed]}>
            <MaterialDesignIcons color={homeColors.primary} name="pencil-outline" size={13} />
            <Text style={styles.editText}>Modifier</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.View style={stateAnimatedStyle}>
        {result.status === 'menstruating' ? (
          <View style={styles.neutralBlock}>
            <View style={styles.discreetRow}>
              <View style={[styles.discreetDot, styles.discreetDotPeriod]} />
              <Text style={styles.discreetText}>Menstrues en cours</Text>
            </View>
            <Text style={styles.neutralHint}>
              Les repères de pureté seront actualisés lorsque tu déclareras la fin de tes règles.
            </Text>
          </View>
        ) : null}

        {result.status === 'unknown' ? (
          <View style={styles.unknownBlock}>
            <View style={styles.discreetRow}>
              <View style={styles.discreetDot} />
              <Text style={styles.discreetText}>Fin des règles non renseignée</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onEdit} style={({pressed}) => [styles.renseignerButton, pressed && styles.pressed]}>
              <Text style={styles.renseignerText}>Renseigner</Text>
            </Pressable>
          </View>
        ) : null}

        {result.status === 'pure' ? (
          <>
            <View style={styles.pureHeadline}>
              <View style={styles.pureCheckCircle}>
                <MaterialDesignIcons color={homeColors.green} name="check" size={14} />
              </View>
              <View style={styles.pureCopy}>
                <Text style={styles.pureTitle}>Pureté retrouvée</Text>
                <Text style={styles.pureSubtitle}>
                  Fin des règles · {periodEndDateTime ? formatDeclaredEnd(periodEndDateTime, timezone) : '—'}
                </Text>
              </View>
            </View>

            {result.prayerDue && result.prayerName && result.prayerStart && result.prayerEnd ? (
              <View style={styles.dueSection}>
                <Text style={styles.dueLabel}>Prière concernée</Text>
                <Text style={styles.duePrayerName}>{result.prayerName}</Text>
                <Text style={styles.dueRange}>
                  {formatTime(result.prayerStart, timezone)} → {formatTime(result.prayerEnd, timezone)}
                </Text>

                <View style={styles.duePill}>
                  <MaterialDesignIcons color="#FFFFFF" name="hand-heart-outline" size={14} />
                  <Text style={styles.duePillText}>{result.prayerName} est due aujourd’hui</Text>
                </View>

                <Text style={styles.dueSubtitle}>
                  Ta pureté a été retrouvée pendant le créneau de {result.prayerName}. Cette prière est due.
                </Text>
              </View>
            ) : result.nextPrayerName && result.nextPrayerTime ? (
              <View style={styles.betweenSection}>
                <Text style={styles.betweenTitle}>Aucune prière en cours au moment du retour à la pureté.</Text>
                <View style={styles.nextAfterPurityBlock}>
                  <Text style={styles.nextAfterPurityLabel}>1re prière après la pureté</Text>
                  <Text style={styles.nextAfterPurityValue}>
                    {result.nextPrayerName} · {formatTime(result.nextPrayerTime, timezone)}
                  </Text>
                </View>
              </View>
            ) : (loading || error) ? (
              <Text style={styles.pendingNote}>
                {loading ? 'Chargement des horaires de prière…' : 'Horaires de prière momentanément indisponibles.'}
              </Text>
            ) : null}
          </>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {borderRadius: homeRadii.card, backgroundColor: '#FFFFFF', padding: 16, ...homeShadow},
  headingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  headingLeft: {flexDirection: 'row', alignItems: 'center', gap: 9},
  dropCircle: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: homeColors.lightLavender},
  title: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16.5, fontWeight: '700'},
  editButton: {flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 30, paddingHorizontal: 4},
  editText: {color: homeColors.primary, fontSize: 12, fontWeight: '700'},
  pressed: {opacity: 0.7},

  discreetRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  discreetDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: homeColors.textSecondary},
  discreetDotPeriod: {backgroundColor: '#DC7B82'},
  discreetText: {color: homeColors.textPrimary, fontSize: 13.5, fontWeight: '700'},

  neutralBlock: {marginTop: 14},
  neutralHint: {marginTop: 8, color: homeColors.textSecondary, fontSize: 12, lineHeight: 17},

  unknownBlock: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14},
  renseignerButton: {
    minHeight: 34, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
    borderRadius: homeRadii.button, backgroundColor: homeColors.primary,
  },
  renseignerText: {color: '#FFFFFF', fontSize: 12.5, fontWeight: '700'},

  pureHeadline: {flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14},
  pureCheckCircle: {width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: homeColors.greenLight},
  pureCopy: {flex: 1},
  pureTitle: {color: homeColors.green, fontSize: 15, fontWeight: '700'},
  pureSubtitle: {marginTop: 2, color: homeColors.textSecondary, fontSize: 12},

  dueSection: {marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: homeColors.cardBorder},
  dueLabel: {color: homeColors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6},
  duePrayerName: {marginTop: 4, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 26, fontWeight: '700'},
  dueRange: {marginTop: 2, color: homeColors.textSecondary, fontSize: 13},
  duePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: 12, borderRadius: 12, backgroundColor: homeColors.green, paddingHorizontal: 12, paddingVertical: 7,
  },
  duePillText: {color: '#FFFFFF', fontSize: 12.5, fontWeight: '700'},
  dueSubtitle: {marginTop: 10, color: homeColors.textSecondary, fontSize: 12, lineHeight: 17},

  betweenSection: {marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: homeColors.cardBorder},
  betweenTitle: {color: homeColors.textPrimary, fontSize: 13, lineHeight: 18},
  nextAfterPurityBlock: {marginTop: 12},
  nextAfterPurityLabel: {color: homeColors.textSecondary, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6},
  nextAfterPurityValue: {marginTop: 3, color: homeColors.primary, fontSize: 16, fontWeight: '700'},

  pendingNote: {marginTop: 14, color: homeColors.textSecondary, fontSize: 12},
});

export default memo(PurityStatusCard);
