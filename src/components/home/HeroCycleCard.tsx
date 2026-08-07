import React, {memo, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {homeColors, homeRadii, homeShadow} from './homeTheme';
import type {CyclePhase} from './CycleStatusCard';

const FLOWER = require('../../assets/images/flower.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  currentDay: number;
  cycleLength: number;
  phase: CyclePhase;
};

type PhaseInsight = {
  label: string;
  ringColor: string;
  message: string;
  energy: string;
  mood: string;
  tip: string;
};

const PHASE_INSIGHTS: Record<CyclePhase, PhaseInsight> = {
  menstruation: {
    label: 'Phase menstruelle',
    ringColor: homeColors.pink,
    message: 'Ton énergie sera plus faible. Prends le temps de te reposer et prends soin de toi.',
    energy: 'Faible',
    mood: 'Sensible',
    tip: 'Repos & chaleur',
  },
  follicular: {
    label: 'Phase folliculaire',
    ringColor: homeColors.primary,
    message: 'Ton énergie remonte doucement, c’est un bon moment pour te reconnecter à toi-même.',
    energy: 'Croissante',
    mood: 'Sereine',
    tip: 'Bonne hydratation',
  },
  fertile: {
    label: 'Fenêtre fertile',
    ringColor: '#8B6FD1',
    message: 'Ta fenêtre fertile a commencé, reste à l’écoute des signaux de ton corps.',
    energy: 'Élevée',
    mood: 'Confiante',
    tip: 'Écoute-toi',
  },
  ovulation: {
    label: 'Ovulation',
    ringColor: homeColors.primary,
    message: 'L’ovulation est prévue aujourd’hui, ton énergie est à son maximum.',
    energy: 'Élevée',
    mood: 'Rayonnante',
    tip: 'Bouge en douceur',
  },
  luteal: {
    label: 'Phase lutéale',
    ringColor: '#D8B05A',
    message: 'Ton corps se prépare à un nouveau cycle, sois douce avec toi-même.',
    energy: 'Variable',
    mood: 'Introspective',
    tip: 'Douceur & calme',
  },
  pregnancy: {
    label: 'Grossesse',
    ringColor: '#B97B88',
    message: 'Ton corps accompagne chaque étape avec attention, prends soin de toi.',
    energy: 'Variable',
    mood: 'Attentive',
    tip: 'Repos régulier',
  },
  postpartum: {
    label: 'Post-partum',
    ringColor: '#9C8AC2',
    message: 'Ton corps poursuit sa récupération, accorde-toi de la patience.',
    energy: 'Douce',
    mood: 'Patiente',
    tip: 'Soutien & repos',
  },
};

const SEGMENT_COUNT = 60;
const RING_SIZE = 116;

function Chip({icon, label, value}: {icon: IconName; label: string; value: string}) {
  return (
    <View style={styles.chip}>
      <MaterialDesignIcons color={homeColors.primary} name={icon} size={16} />
      <Text numberOfLines={2} style={styles.chipLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function HeroCycleCard({currentDay, cycleLength, phase}: Props): React.JSX.Element {
  const entrance = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  const insight = PHASE_INSIGHTS[phase];
  const safeCycleLength = Math.max(cycleLength, 1);
  const progress = Math.min(Math.max(currentDay / safeCycleLength, 0), 1);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) {setReduceMotion(value);}
    });
    return () => {mounted = false;};
  }, []);

  useEffect(() => {
    entrance.setValue(reduceMotion ? 1 : 0);
    progressAnimation.setValue(reduceMotion ? progress : 0);

    if (reduceMotion) {return;}

    const animation = Animated.parallel([
      Animated.timing(entrance, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnimation, {
        delay: 150,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        toValue: progress,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [entrance, progress, progressAnimation, reduceMotion]);

  const segments = useMemo(() => Array.from({length: SEGMENT_COUNT}, (_, index) => index), []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: entrance,
          transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [14, 0]})}],
        },
      ]}>
      <Image accessibilityIgnoresInvertColors source={FLOWER} style={styles.flower} />

      <View style={styles.topRow}>
        <View style={styles.ring}>
          {segments.map(index => {
            const start = index / SEGMENT_COUNT;
            const end = Math.min((index + 0.85) / SEGMENT_COUNT, 1);
            const opacity = progressAnimation.interpolate({
              inputRange: index === 0 ? [0, end] : [start - 0.001, start, end],
              outputRange: index === 0 ? [0, 1] : [0, 0.12, 1],
              extrapolate: 'clamp',
            });

            return (
              <View
                key={index}
                style={[styles.segmentOrbit, {transform: [{rotate: `${index * (360 / SEGMENT_COUNT)}deg`}]}]}>
                <View style={styles.trackSegment} />
                <Animated.View style={[styles.activeSegment, {backgroundColor: insight.ringColor, opacity}]} />
              </View>
            );
          })}

          <View style={styles.ringCenter}>
            <Text style={styles.ringEyebrow}>Jour du cycle</Text>
            <Text style={styles.ringNumber}>{currentDay}</Text>
            <Text numberOfLines={2} style={[styles.ringPhase, {color: insight.ringColor}]}>{insight.label}</Text>
          </View>
        </View>

        <View style={styles.todayColumn}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>Aujourd’hui</Text>
            <MaterialDesignIcons color={homeColors.primary} name="calendar-blank-outline" size={16} />
          </View>
          <Text style={styles.todayMessage}>{insight.message}</Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        <Chip icon="lightning-bolt-outline" label="Énergie" value={insight.energy} />
        <View style={styles.chipDivider} />
        <Chip icon="emoticon-outline" label="Humeur" value={insight.mood} />
        <View style={styles.chipDivider} />
        <Chip icon="heart-outline" label="Conseil du jour" value={insight.tip} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: homeRadii.card,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    ...homeShadow,
  },
  flower: {
    position: 'absolute',
    top: '6%',
    right: -8,
    width: 66,
    height: 62,
    resizeMode: 'contain',
    transform: [{rotate: '8deg'}],
  },
  topRow: {flexDirection: 'row', alignItems: 'center'},
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOrbit: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
  },
  trackSegment: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: homeColors.lightLavender,
  },
  activeSegment: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 8,
    borderRadius: 2,
  },
  ringCenter: {
    width: 82,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 41,
    backgroundColor: homeColors.lightLavender,
  },
  ringEyebrow: {color: homeColors.textSecondary, fontSize: 9.5, fontWeight: '600'},
  ringNumber: {marginTop: 1, color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 30, fontWeight: '700', lineHeight: 34},
  ringPhase: {marginTop: 1, fontSize: 9.5, fontWeight: '700', textAlign: 'center', paddingHorizontal: 6},
  todayColumn: {flex: 1, marginLeft: 14},
  todayHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 44},
  todayTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  todayMessage: {marginTop: 6, color: homeColors.textSecondary, fontSize: 12.5, lineHeight: 18},
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 16,
    borderRadius: homeRadii.button,
    backgroundColor: homeColors.lightLavender,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  chip: {flex: 1, alignItems: 'center', paddingHorizontal: 1, minWidth: 0},
  chipDivider: {width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(109,74,232,0.18)'},
  chipLabel: {marginTop: 4, color: homeColors.textSecondary, fontSize: 9.5, textAlign: 'center'},
  chipValue: {marginTop: 2, color: homeColors.textPrimary, fontSize: 11, fontWeight: '700', textAlign: 'center'},
});

export default memo(HeroCycleCard);
