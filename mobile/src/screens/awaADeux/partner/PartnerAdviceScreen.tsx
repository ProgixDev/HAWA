import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import PartnerScreenBackground from './PartnerScreenBackground';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {getFloatingTabBarClearance, getTopPadding} from '../../../theme/spacing';
import {type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import {AwaCard} from '../../../components/ui/AwaCard';
import {AwaText} from '../../../components/ui/AwaText';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import {computePartnerCycleInfo} from '../../../utils/awaADeuxPartnerCycleInfo';
import type {ComputedCyclePhase} from '../../../utils/cycleMath';

// The partner's read-only advice (PartnerMainTabs "Conseils"). PRIVACY RULE: advice must
// NEVER reveal information the owner did not choose to share. It reuses the SAME
// `recommendations: 'phase' | 'general'` field computePartnerVisibility() already
// computes for the partner preview — 'phase' only when cycleDay is actually shared — so a
// hidden phase can never leak into personalized wording here either; when it is hidden the
// text below is generic, exactly as computePartnerVisibility already models it elsewhere.
// This pass only redesigns the visual presentation (cards/icons/hierarchy); the logic
// below (phaseTip, the privacy sentence, SMALL_GESTURES) is unchanged from before.

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export default function PartnerAdviceScreen(): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});
  const info = useMemo(() => computePartnerCycleInfo(), []);
  const phaseTips = phaseTipsOf(t);
  const smallGestures = smallGesturesOf(t);

  // Only ever built from a phase that IS shared (visibility.fields.cycleDay) — never from
  // a phase computed for internal use elsewhere.
  const phaseTip =
    visibility.recommendations === 'phase' && info.phase
      ? phaseTips[info.phase]
      : t('awaADeux.partnerSide.advice.generalSupportTip');

  return (
    <PartnerScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: getFloatingTabBarClearance(insets.bottom, 16)}]}
        showsVerticalScrollIndicator={false}>
        <AwaText accessibilityRole="header" variant="headlineMedium" style={styles.title}>{t('awaADeux.partnerSide.advice.title')}</AwaText>
        <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.subtitle}>{t('awaADeux.partnerSide.advice.subtitle')}</AwaText>

        <SectionHeader styles={styles} title={t('awaADeux.partnerSide.advice.supportSectionTitle')} />
        <AwaCard padding="compact" style={styles.card} variant="filled">
          <View style={styles.cardIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="heart-outline" size={24} />
          </View>
          <AwaText variant="bodyMedium" style={styles.cardText}>{phaseTip}</AwaText>
        </AwaCard>

        <SectionHeader styles={styles} title={t('awaADeux.partnerSide.advice.infoSectionTitle')} />
        <AwaCard padding="compact" style={styles.card} variant="filled">
          <View style={styles.cardIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={24} />
          </View>
          <AwaText variant="bodyMedium" style={styles.cardText}>
            {t('awaADeux.partnerSide.advice.infoText')}
          </AwaText>
        </AwaCard>

        <SectionHeader styles={styles} title={t('awaADeux.partnerSide.advice.gesturesSectionTitle')} />
        <AwaCard padding="none" style={styles.attentionCard} variant="filled">
          {smallGestures.map((gesture, index) => (
            <View key={gesture.text} style={[styles.attentionRow, index > 0 && styles.attentionRowDivider]}>
              <View style={styles.attentionIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name={gesture.icon} size={20} />
              </View>
              <AwaText variant="bodyMedium" style={styles.attentionText}>{gesture.text}</AwaText>
            </View>
          ))}
        </AwaCard>
      </ScrollView>
    </PartnerScreenBackground>
  );
}

/** A section title (the cards below carry their own icon, so the title itself has none). */
function SectionHeader({title, styles}: {title: string; styles: ReturnType<typeof createStyles>}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <AwaText accessibilityRole="header" variant="titleSmall" style={styles.sectionTitle}>{title}</AwaText>
    </View>
  );
}

const phaseTipsOf = (t: (key: string) => string): Record<ComputedCyclePhase, string> => ({
  menstruation: t('awaADeux.partnerSide.advice.phaseTipMenstruation'),
  follicular: t('awaADeux.partnerSide.advice.phaseTipFollicular'),
  fertile: t('awaADeux.partnerSide.advice.phaseTipFertile'),
  ovulation: t('awaADeux.partnerSide.advice.phaseTipOvulation'),
  luteal: t('awaADeux.partnerSide.advice.phaseTipLuteal'),
});

const smallGesturesOf = (t: (key: string) => string): Array<{text: string; icon: IconName}> => [
  {text: t('awaADeux.partnerSide.advice.gesture1'), icon: 'message-text-outline'},
  {text: t('awaADeux.partnerSide.advice.gesture2'), icon: 'coffee-outline'},
  {text: t('awaADeux.partnerSide.advice.gesture3'), icon: 'account-heart-outline'},
];

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: 20, paddingBottom: 20},
    title: {color: theme.colors.accent},
    subtitle: {marginTop: 4},
    sectionHeader: {marginTop: 18, marginBottom: 8, flexDirection: 'row', alignItems: 'center'},
    sectionTitle: {flex: 1, minWidth: 0},
    card: {flexDirection: 'row', alignItems: 'center', gap: 12},
    cardIcon: {
      width: 48,
      height: 48,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },
    cardText: {flex: 1, minWidth: 0},
    // One grouped card with compact rows. The rows are not interactive, so they carry no chevron
    // (DESIGN.md: a chevron promises navigation).
    attentionCard: {paddingHorizontal: 12},
    attentionRow: {minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9},
    attentionRowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    attentionIcon: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    attentionText: {flex: 1, minWidth: 0},
  });
}
