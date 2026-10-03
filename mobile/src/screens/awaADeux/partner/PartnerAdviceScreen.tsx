import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import PartnerScreenBackground from './PartnerScreenBackground';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {getFloatingTabBarClearance, getTopPadding} from '../../../theme/spacing';
import {withAlpha, type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
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
        <Text accessibilityRole="header" style={styles.title}>{t('awaADeux.partnerSide.advice.title')}</Text>
        <Text style={styles.subtitle}>{t('awaADeux.partnerSide.advice.subtitle')}</Text>

        <SectionHeader icon="heart-outline" styles={styles} theme={theme} title={t('awaADeux.partnerSide.advice.supportSectionTitle')} />
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="heart-outline" size={24} />
          </View>
          <Text style={styles.cardText}>{phaseTip}</Text>
        </View>

        <SectionHeader icon="information-outline" styles={styles} theme={theme} title={t('awaADeux.partnerSide.advice.infoSectionTitle')} />
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={24} />
          </View>
          <Text style={styles.cardText}>
            {t('awaADeux.partnerSide.advice.infoText')}
          </Text>
        </View>

        <SectionHeader icon="format-list-bulleted" styles={styles} theme={theme} title={t('awaADeux.partnerSide.advice.gesturesSectionTitle')} />
        <View style={styles.attentionCard}>
          {smallGestures.map((gesture, index) => (
            <View key={gesture.text} style={[styles.attentionRow, index > 0 && styles.attentionRowDivider]}>
              <View style={styles.attentionIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name={gesture.icon} size={20} />
              </View>
              <Text style={styles.attentionText}>{gesture.text}</Text>
              <View importantForAccessibility="no-hide-descendants" style={styles.attentionChevron}>
                <MaterialDesignIcons color={theme.colors.primary} name="chevron-right" size={20} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </PartnerScreenBackground>
  );
}

/** A section title with its small soft-circle icon, matching the reference's hierarchy. */
function SectionHeader({
  icon,
  title,
  theme,
  styles,
}: {
  icon: IconName;
  title: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={16} />
      </View>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
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
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 26, lineHeight: 32, fontWeight: '700'},
    subtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 14.5, lineHeight: 20},
    sectionHeader: {marginTop: 18, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 9},
    sectionIcon: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.colors.primarySoft,
    },
    sectionTitle: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14.5, lineHeight: 19, fontWeight: '800'},
    // Compact phone-first version of the reference cards. Every tint comes from the
    // resolved AWA theme; translucency only softens the existing surface token.
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.9 : 0.94),
      paddingHorizontal: 14,
      paddingVertical: 12,
      ...theme.shadow,
    },
    cardIcon: {
      width: 48,
      height: 48,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
    },
    cardText: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 13, lineHeight: 18.5},
    // One grouped card with compact rows. Chevrons reproduce the visual direction of the
    // reference but remain decorative: the rows deliberately stay non-Pressable.
    attentionCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.9 : 0.94),
      paddingHorizontal: 12,
      ...theme.shadow,
    },
    attentionRow: {minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9},
    attentionRowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    attentionIcon: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13,
      backgroundColor: theme.colors.primarySoft,
    },
    attentionText: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 13, lineHeight: 18.5},
    attentionChevron: {width: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center'},
  });
}
