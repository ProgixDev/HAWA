import React, {useMemo} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';
import type {PartnerVisibility} from '../../utils/awaADeuxSharing';
import {demoPreview} from './awaADeuxDemo';

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
  greetingText,
  cycleDayCaption,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const shown = visibility.fields;
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // The greeting uses the partner name she entered ("Bonjour 💜" while none is configured).
  const {partnerName} = useAwaADeuxPartnerName();
  const preview = demoPreview();
  const resolvedGreetingText = greetingText ?? t('awaADeux.demo.greetingText');
  const resolvedCycleDayCaption = cycleDayCaption ?? preview.cycleDayCaption;

  const candidates: Array<MiniStat | null> = [
    shown.nextPeriod ? {key: 'nextPeriod', label: t('awaADeux.demo.nextPeriodLabel'), value: preview.nextPeriod} : null,
    shown.periodStatus ? {key: 'periodStatus', label: t('awaADeux.demo.periodStatusLabel'), value: preview.periodStatus} : null,
    shown.cycleDay ? {key: 'phase', label: t('awaADeux.demo.phaseLabel'), value: preview.phase} : null,
    shown.fertileWindow ? {key: 'fertileWindow', label: t('awaADeux.demo.fertileWindowLabel'), value: preview.fertileWindow} : null,
    shown.ovulation ? {key: 'ovulation', label: t('awaADeux.demo.ovulationLabel'), value: preview.ovulation} : null,
    shown.fertilityStatus ? {key: 'fertilityStatus', label: t('awaADeux.demo.fertilityStatusLabel'), value: preview.fertilityStatus} : null,
    shown.pregnancyWeek ? {key: 'pregnancyWeek', label: t('awaADeux.demo.pregnancyWeekLabel'), value: preview.pregnancyWeek} : null,
    shown.dueDate ? {key: 'dueDate', label: t('awaADeux.demo.dueDateLabel'), value: preview.dueDate} : null,
    shown.mood ? {key: 'mood', label: t('awaADeux.demo.moodLabel'), value: preview.mood} : null,
  ];
  const stats = candidates.filter((stat): stat is MiniStat => stat !== null);

  const recommendation =
    visibility.recommendations === 'phase' ? preview.phaseRecommendation : preview.generalRecommendation;
  const nothingShared =
    !shown.cycleDay && !shown.dailyAdvice && !shown.babyDevelopment && stats.length === 0 && !showSupportContent;

  return (
    <AwaCard padding="compact" style={styles.frame} variant="outlined">
      <View style={styles.greetingRow}>
        <View style={styles.greetingCopy}>
          <AwaText emphasized variant="titleMedium">
            {partnerName.trim() ? t('awaADeux.demo.greetingWithName', {name: partnerName.trim()}) : t('awaADeux.demo.greetingNeutral')}
          </AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.greetingText}>{resolvedGreetingText}</AwaText>
        </View>
      </View>

      {shown.cycleDay ? (
        <View style={styles.mainCard}>
          <View style={styles.mainCopy}>
            <AwaText colorRole="onSurfaceVariant" variant="labelMedium">{t('awaADeux.demo.cycleDayLabel')}</AwaText>
            <AwaText variant="headlineMedium" style={styles.mainValue}>{preview.cycleDay}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.mainCaption}>{resolvedCycleDayCaption}</AwaText>
          </View>
        </View>
      ) : null}

      {stats.length > 0 ? (
        <View style={styles.grid}>
          {stats.map(stat => (
            <View key={stat.key} style={styles.stat}>
              <AwaText colorRole="onSurfaceVariant" variant="bodySmall">{stat.label}</AwaText>
              <AwaText variant="titleSmall" style={styles.statValue}>{stat.value}</AwaText>
            </View>
          ))}
        </View>
      ) : null}

      {shown.babyDevelopment ? (
        <View style={styles.textCard}>
          <AwaText variant="titleSmall">{t('awaADeux.demo.babyDevelopmentTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.adviceText}>{preview.babyDevelopment}</AwaText>
        </View>
      ) : null}

      {shown.dailyAdvice ? (
        <View style={styles.adviceCard}>
          <View style={styles.adviceCopy}>
            <AwaText variant="titleSmall">{t('awaADeux.demo.dailyAdviceTitle')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.adviceText}>{preview.advice}</AwaText>
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
          <AwaText variant="titleSmall">{t('awaADeux.demo.supportTipsTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.adviceText}>{preview.supportTips}</AwaText>
        </View>
      ) : null}

      {showSupportContent ? (
        <View style={styles.textCard}>
          <AwaText variant="titleSmall">{t('awaADeux.demo.recommendationTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.adviceText}>{recommendation}</AwaText>
        </View>
      ) : null}

      {nothingShared ? (
        <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.empty}>{t('awaADeux.demo.emptyShared')}</AwaText>
      ) : null}
    </AwaCard>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    frame: {gap: 10},
    greetingRow: {flexDirection: 'row', alignItems: 'center'},
    greetingCopy: {flex: 1, minWidth: 0},
    greetingText: {marginTop: 3},
    mainCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    mainCopy: {flex: 1, minWidth: 0},
    mainValue: {marginTop: 2, color: theme.colors.accent},
    mainCaption: {marginTop: 1},
    grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
    stat: {
      flexGrow: 1,
      flexBasis: '45%',
      minWidth: 0,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    statValue: {marginTop: 3},
    // Blocks inside the preview frame sit on Surface Variant (no nested bordered cards).
    adviceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
      paddingLeft: 14,
      paddingRight: 8,
      paddingVertical: 10,
    },
    textCard: {
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSecondary,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    adviceCopy: {flex: 1, minWidth: 0},
    adviceText: {marginTop: 3},
    adviceImage: {width: 84, height: 68},
    empty: {textAlign: 'center', paddingVertical: 12},
  });
}
