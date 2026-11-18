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
import type {ObjectiveId} from '../../../state/onboardingPreferences';

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

  const {toggles, isPregnant, objective} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant, objective});
  const info = useMemo(() => computePartnerCycleInfo(), []);
  const smallGestures = smallGesturesOf(t);

  // Only ever built from a phase that IS shared (visibility.fields.cycleDay) — never from
  // a phase computed for internal use elsewhere. Hidden phase -> the generic chips.
  const chipSets = chipsOf(t);
  // The cycle objective keeps the advice of the phase she shares; every other objective has the support suited to it.
  const chips = objective !== 'cycle'
    ? chipSets[objective]
    : chipSets[visibility.recommendations === 'phase' && info.phase ? info.phase : 'general'];

  return (
    <PartnerScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, {paddingTop: getTopPadding(insets.top), paddingBottom: getFloatingTabBarClearance(insets.bottom, 16)}]}
        showsVerticalScrollIndicator={false}>
        <AwaText accessibilityRole="header" variant="headlineMedium" style={styles.title}>{t('awaADeux.partnerSide.advice.title')}</AwaText>
        <View style={styles.subtitleRow}>
          <MaterialDesignIcons color={theme.colors.textSecondary} name="lock-outline" size={14} />
          <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.subtitle}>{t('awaADeux.partnerSide.advice.subtitleShort')}</AwaText>
        </View>

        <SectionHeader styles={styles} title={t('awaADeux.partnerSide.advice.todaySectionTitle')} />
        <ScrollView contentContainerStyle={styles.chipRow} horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {chips.map(chip => (
            <View key={chip.label} style={styles.chip}>
              <View style={styles.chipIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name={chip.icon} size={22} />
              </View>
              <AwaText numberOfLines={2} variant="labelMedium" weight="700" style={styles.chipText}>{chip.label}</AwaText>
            </View>
          ))}
        </ScrollView>

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

type Chip = {label: string; icon: IconName};
type ChipSet = Record<ComputedCyclePhase | 'general' | Exclude<ObjectiveId, 'cycle'>, Chip[]>;

const chipsOf = (t: (key: string) => string): ChipSet => {
  const c = (key: string) => t(`awaADeux.partnerSide.advice.${key}`);
  const gentleness = {label: c('chipGentleness'), icon: 'heart-outline'} as Chip;
  const rest = {label: c('chipRest'), icon: 'moon-waning-crescent'} as Chip;
  const presence = {label: c('chipPresence'), icon: 'account-heart-outline'} as Chip;
  const listening = {label: c('chipListening'), icon: 'ear-hearing'} as Chip;
  const help = {label: c('chipHelp'), icon: 'hand-heart-outline'} as Chip;
  return {
    menstruation: [gentleness, {label: c('chipHotDrink'), icon: 'coffee-outline'}, rest],
    follicular: [{label: c('chipEnergy'), icon: 'flash-outline'}, {label: c('chipOuting'), icon: 'walk'}, {label: c('chipProject'), icon: 'lightbulb-outline'}],
    fertile: [presence, listening, help],
    ovulation: [{label: c('chipMessage'), icon: 'message-text-outline'}, gentleness, presence],
    luteal: [{label: c('chipPatience'), icon: 'timer-sand'}, gentleness, rest],
    general: [listening, help, presence],
    conceive: [presence, listening, {label: c('chipMessage'), icon: 'message-text-outline'}],
    contraception: [listening, help, presence],
    irregular: [{label: c('chipPatience'), icon: 'timer-sand'}, listening, help],
    pregnancy: [gentleness, rest, help],
    postpartum: [rest, help, presence],
    menopause: [{label: c('chipPatience'), icon: 'timer-sand'}, listening, gentleness],
    loss: [presence, listening, gentleness],
  };
};

const smallGesturesOf = (t: (key: string) => string): Array<{text: string; icon: IconName}> => [
  {text: t('awaADeux.partnerSide.advice.gestureShort1'), icon: 'message-text-outline'},
  {text: t('awaADeux.partnerSide.advice.gestureShort2'), icon: 'checkbox-outline'},
  {text: t('awaADeux.partnerSide.advice.gestureShort3'), icon: 'headphones'},
];

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    content: {paddingHorizontal: 20, paddingBottom: 20},
    title: {color: theme.colors.accent},
    subtitleRow: {marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6},
    subtitle: {flex: 1},
    chipScroll: {marginHorizontal: -20},
    chipRow: {paddingHorizontal: 20, gap: 10},
    chip: {
      width: 104,
      alignItems: 'center',
      gap: 10,
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    chipIcon: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.colors.primarySoft},
    chipText: {textAlign: 'center'},
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
