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
import {useTranslation} from 'react-i18next';

import CycleProgressRing from './CycleProgressRing';
import {homeRadii} from './homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {CyclePhase} from './CycleStatusCard';
import type {DailyJournalEntry, MoodLevel} from '../../types/journal';
import '../../i18n';

const FLOWER = require('../../assets/images/flower.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = {
  currentDay: number;
  cycleLength: number;
  moodEntry?: DailyJournalEntry['mood'];
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

// SEMANTIC — each cycle phase gets its OWN fixed identity color, exactly
// like MonthCalendarCard's period/fertile/ovulation dots (Phase C). Two of
// these (`follicular`, `ovulation`) happen to equal the current AWA brand
// purple today, but that is NOT a decorative choice to keep tracking the
// palette — the other five phases each already have their own bespoke,
// unrelated color, so letting only these two silently follow `theme.colors.
// primary` would make phase identity arbitrarily inconsistent (2 of 7
// phases shifting hue with the palette, 5 staying fixed). All seven are
// therefore fixed literals, never theme-driven.
// These exported maps (PHASE_INSIGHTS, MOOD_LABELS, ENERGY_LABELS,
// getCyclePhaseIdentity) are deliberately kept as-is, in French — they are
// shared with several consumers still out of this localization phase's scope
// (PartnerHomeScreen/AWA à deux, medicalExportReaders.ts/
// medicalExportFormatting.ts's PDF/CSV export, other objectives' own
// dashboards). This component's own JSX below reads TRANSLATED copy for
// DISPLAY (cyclePhase.*/cycleHome.phase.*/mood.*/moodTip.*/energyLevel.* —
// see src/i18n/locales/) computed straight from the semantic phase/mood/
// energy values, never from these French strings — so localizing the
// dashboard never touches what the other, still-French consumers render.
export const PHASE_INSIGHTS: Record<CyclePhase, PhaseInsight> = {
  menstruation: {
    label: 'Phase menstruelle',
    ringColor: '#DC7B82',
    message: 'Ton énergie sera plus faible. Prends le temps de te reposer et prends soin de toi.',
    energy: 'Faible',
    mood: 'Sensible',
    tip: 'Repos & chaleur',
  },
  follicular: {
    label: 'Phase folliculaire',
    ringColor: '#6D4AE8',
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
    ringColor: '#6D4AE8',
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

/** Same phase identity (label + SEMANTIC ring color) the ring itself uses — exported so
 * other read-only consumers of the same cycle data (e.g. PartnerHomeScreen) can draw an
 * IDENTICAL ring without duplicating this map. */
export function getCyclePhaseIdentity(phase: CyclePhase): {label: string; ringColor: string} {
  const insight = PHASE_INSIGHTS[phase];
  return {label: insight.label, ringColor: insight.ringColor};
}

export const MOOD_LABELS: Record<MoodLevel, string> = {
  veryGood: 'Très bien',
  good: 'Bien',
  neutral: 'Neutre',
  stressed: 'Stressée',
  irritable: 'Irritable',
  anxious: 'Anxieuse',
  sad: 'Triste',
  tired: 'Fatiguée',
  motivated: 'Motivée',
};

export const ENERGY_LABELS: Record<number, string> = {
  1: 'Très faible',
  2: 'Faible',
  3: 'Moyenne',
  4: 'Élevée',
  5: 'Très élevée',
};

function Chip({
  icon,
  label,
  value,
  theme,
  styles,
}: {
  icon: IconName;
  label: string;
  value: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.chip}>
      <MaterialDesignIcons color={theme.colors.primary} name={icon} size={16} />
      <Text numberOfLines={2} style={styles.chipLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.chipValue}>{value}</Text>
    </View>
  );
}

function HeroCycleCard({currentDay, cycleLength, moodEntry, phase}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const entrance = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  // ringColor is the only thing still read from the (deliberately French,
  // shared-elsewhere) PHASE_INSIGHTS map — it's a color, not text.
  const ringColor = PHASE_INSIGHTS[phase].ringColor;
  const clampedEnergyLevel = moodEntry ? String(Math.min(5, Math.max(1, Math.round(moodEntry.energy)))) : null;
  const insight = {
    label: t(`cyclePhase.${phase}`),
    message: t(`cycleHome.phase.${phase}.message`),
    energy: clampedEnergyLevel ? t(`cycleHome.energyLevel.${clampedEnergyLevel}`) : t(`cycleHome.phase.${phase}.energy`),
    mood: moodEntry ? t(`cycleHome.mood.${moodEntry.level}`) : t(`cycleHome.phase.${phase}.mood`),
    tip: moodEntry ? t(`cycleHome.moodTip.${moodEntry.level}`) : t(`cycleHome.phase.${phase}.tip`),
  };

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) {setReduceMotion(value);}
    });
    return () => {mounted = false;};
  }, []);

  useEffect(() => {
    entrance.setValue(reduceMotion ? 1 : 0);
    if (reduceMotion) {return;}

    const animation = Animated.timing(entrance, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [entrance, reduceMotion]);

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
        <CycleProgressRing currentDay={currentDay} cycleLength={cycleLength} phaseLabel={insight.label} ringColor={ringColor} />

        <View style={styles.todayColumn}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>{t('cycleHome.todayLabel')}</Text>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-blank-outline" size={16} />
          </View>
          <Text style={styles.todayMessage}>{insight.message}</Text>
        </View>
      </View>

      <View style={styles.chipsRow}>
        <Chip icon="lightning-bolt-outline" label={t('cycleHome.energyChipLabel')} styles={styles} theme={theme} value={insight.energy} />
        <View style={styles.chipDivider} />
        <Chip icon="emoticon-outline" label={t('cycleHome.moodChipLabel')} styles={styles} theme={theme} value={insight.mood} />
        <View style={styles.chipDivider} />
        <Chip icon="heart-outline" label={t('cycleHome.tipChipLabel')} styles={styles} theme={theme} value={insight.tip} />
      </View>
    </Animated.View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      overflow: 'hidden',
      borderRadius: homeRadii.card,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 14,
      ...theme.shadow,
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
    todayColumn: {flex: 1, marginLeft: 14},
    todayHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 44},
    todayTitle: {color: theme.colors.text, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    todayMessage: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
    chipsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: 16,
      borderRadius: homeRadii.button,
      backgroundColor: theme.colors.primarySoft,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    chip: {flex: 1, alignItems: 'center', paddingHorizontal: 1, minWidth: 0},
    chipDivider: {width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    chipLabel: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 9.5, textAlign: 'center'},
    chipValue: {marginTop: 2, color: theme.colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center'},
  });
}

export default memo(HeroCycleCard);
