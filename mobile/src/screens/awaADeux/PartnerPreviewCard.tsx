import React, {useMemo} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import type {PartnerVisibility} from '../../utils/awaADeuxSharing';
import {DEMO_PREVIEW} from './awaADeuxDemo';

// "What your partner sees" — a phone / dashboard style preview built from native
// components. DEMO CONTENT ONLY: every value comes from awaADeuxDemo.ts, nothing is
// connected to real cycle, pregnancy or wellbeing data. WHICH blocks appear is decided
// only by `visibility`, computed by computePartnerVisibility() from her saved choices —
// the same rule the partner side must use, so a switch that is off is never displayed.
// Colors: the resolved AWA theme only.
const PARTNER_IMAGE = require('../../assets/images/partenaire.png');

type Props = {
  visibility: PartnerVisibility;
  /** Second line under the greeting (default: the step-1 wording). */
  greetingText?: string;
  /** Small line under the cycle day (default: the neutral demo caption). */
  cycleDayCaption?: string;
  /** Also show the support tips and the recommendations (the content written for the partner). */
  showSupportContent?: boolean;
};

type MiniStat = {key: string; label: string; value: string};

export default function PartnerPreviewCard({
  visibility,
  showSupportContent = false,
  greetingText = 'Voici quelques repères pour mieux vous accompagner aujourd’hui.',
  cycleDayCaption = DEMO_PREVIEW.cycleDayCaption,
}: Props): React.JSX.Element {
  const shown = visibility.fields;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // The greeting uses the partner name she entered ("Bonjour 💜" while none is configured).
  const {partnerName} = useAwaADeuxPartnerName();

  const candidates: Array<MiniStat | null> = [
    shown.nextPeriod ? {key: 'nextPeriod', label: 'Prochaines règles', value: DEMO_PREVIEW.nextPeriod} : null,
    shown.periodStatus ? {key: 'periodStatus', label: 'Règles', value: DEMO_PREVIEW.periodStatus} : null,
    shown.cycleDay ? {key: 'phase', label: 'Phase actuelle', value: DEMO_PREVIEW.phase} : null,
    shown.fertileWindow ? {key: 'fertileWindow', label: 'Fenêtre fertile', value: DEMO_PREVIEW.fertileWindow} : null,
    shown.ovulation ? {key: 'ovulation', label: 'Ovulation estimée', value: DEMO_PREVIEW.ovulation} : null,
    shown.fertilityStatus ? {key: 'fertilityStatus', label: 'Fertilité', value: DEMO_PREVIEW.fertilityStatus} : null,
    shown.pregnancyWeek ? {key: 'pregnancyWeek', label: 'Grossesse', value: DEMO_PREVIEW.pregnancyWeek} : null,
    shown.dueDate ? {key: 'dueDate', label: 'Accouchement prévu', value: DEMO_PREVIEW.dueDate} : null,
    shown.mood ? {key: 'mood', label: 'Humeur', value: DEMO_PREVIEW.mood} : null,
  ];
  const stats = candidates.filter((stat): stat is MiniStat => stat !== null);

  const recommendation =
    visibility.recommendations === 'phase' ? DEMO_PREVIEW.phaseRecommendation : DEMO_PREVIEW.generalRecommendation;
  const nothingShared =
    !shown.cycleDay && !shown.dailyAdvice && !shown.babyDevelopment && stats.length === 0 && !showSupportContent;

  return (
    <View style={styles.frame}>
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <Text style={styles.greeting}>{partnerName.trim() ? `Bonjour ${partnerName.trim()} 💜` : 'Bonjour 💜'}</Text>
          <Text style={styles.greetingText}>{greetingText}</Text>
        </View>
      </View>

      {shown.cycleDay ? (
        <View style={styles.mainCard}>
          <View style={styles.mainCopy}>
            <Text style={styles.mainLabel}>Jour du cycle</Text>
            <Text style={styles.mainValue}>{DEMO_PREVIEW.cycleDay}</Text>
            <Text style={styles.mainCaption}>{cycleDayCaption}</Text>
          </View>
          <View style={styles.mainIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="calendar-month-outline" size={26} />
          </View>
        </View>
      ) : null}

      {stats.length > 0 ? (
        <View style={styles.grid}>
          {stats.map(stat => (
            <View key={stat.key} style={styles.stat}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {shown.babyDevelopment ? (
        <View style={styles.textCard}>
          <Text style={styles.adviceTitle}>Développement de bébé</Text>
          <Text style={styles.adviceText}>{DEMO_PREVIEW.babyDevelopment}</Text>
        </View>
      ) : null}

      {shown.dailyAdvice ? (
        <View style={styles.adviceCard}>
          <View style={styles.adviceCopy}>
            <Text style={styles.adviceTitle}>Conseil du jour</Text>
            <Text style={styles.adviceText}>{DEMO_PREVIEW.advice}</Text>
          </View>
          {/* Small, decorative: not announced */}
          <Image
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            resizeMode="contain"
            source={PARTNER_IMAGE}
            style={styles.adviceImage}
          />
        </View>
      ) : null}

      {showSupportContent && visibility.supportTips ? (
        <View style={styles.textCard}>
          <Text style={styles.adviceTitle}>Pour la soutenir</Text>
          <Text style={styles.adviceText}>{DEMO_PREVIEW.supportTips}</Text>
        </View>
      ) : null}

      {showSupportContent ? (
        <View style={styles.textCard}>
          <Text style={styles.adviceTitle}>Recommandation</Text>
          <Text style={styles.adviceText}>{recommendation}</Text>
        </View>
      ) : null}

      {nothingShared ? (
        <Text style={styles.empty}>Aucune information n’est partagée pour le moment.</Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    frame: {
      gap: 10,
      borderWidth: 1.5,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 28,
      backgroundColor: theme.colors.surface,
      padding: 14,
      ...theme.shadow,
    },
    greetingRow: {flexDirection: 'row', alignItems: 'center'},
    greetingCopy: {flex: 1, minWidth: 0},
    greeting: {color: theme.colors.text, fontSize: 16, lineHeight: 21, fontWeight: '800'},
    greetingText: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
    mainCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    mainCopy: {flex: 1, minWidth: 0},
    mainLabel: {color: theme.colors.textSecondary, fontSize: 12.5, fontWeight: '600'},
    mainValue: {
      marginTop: 2,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 38,
      lineHeight: 44,
      fontWeight: '700',
    },
    mainCaption: {marginTop: 1, color: theme.colors.textSecondary, fontSize: 12},
    mainIcon: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
    stat: {
      flexGrow: 1,
      flexBasis: '45%',
      minWidth: 0,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    statLabel: {color: theme.colors.textSecondary, fontSize: 11.5},
    statValue: {marginTop: 3, color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    adviceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingLeft: 14,
      paddingRight: 8,
      paddingVertical: 10,
    },
    textCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    adviceCopy: {flex: 1, minWidth: 0},
    adviceTitle: {color: theme.colors.text, fontSize: 13.5, fontWeight: '800'},
    adviceText: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
    adviceImage: {width: 84, height: 68},
    empty: {color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', paddingVertical: 12},
  });
}
