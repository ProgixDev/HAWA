import React, {useMemo} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import '../../i18n';
import AwaADeuxStepLayout, {Reveal} from '../awaADeux/AwaADeuxStepLayout';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {startManagedProfileDraft, updateManagedProfileDraft} from '../../state/managedProfileDraftStore';

// Intro screen of the daughter-profile creation flow (see ManagedProfileSuccessScreen.tsx
// for the full flow map: Intro -> DaughterInfo -> FirstPeriod -> (only if "Oui") CycleSetup
// -> Success). Reuses AwaADeuxStepLayout for the page shell (back button, title, hero slot,
// sticky CTA) — that component is purely presentational, so reusing it here (outside AWA à
// deux) does not pull in any partner/sharing logic.
//
// This screen used to be "Pour qui créez-vous ce profil ?" (a Ma fille / Un autre profil
// type picker — "Un autre profil" was never implemented beyond an inert radio). That
// picker has been removed: "Ma fille" is the ONLY managed-profile type AWA supports, so
// there is nothing left to choose. The route id ('ManagedProfileType') and this file's
// name are kept unchanged on purpose — every other file that references this step
// (AppNavigator.tsx's registration/types, ProfileScreen.tsx's handleAddProfile) stays
// untouched, which keeps this change's surface to exactly the screens whose content
// actually changed.
//
// No step-progress indicator here (no `headerAccessory`): the flow's real, countable
// steps start at "Informations sur votre fille" (see ManagedProfileProgress.tsx).

const DAUGHTER_ILLUSTRATION = require('../../assets/images/fille.png');

type Props = NativeStackScreenProps<RootStackParamList, 'ManagedProfileType'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export default function ManagedProfileTypeScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const BENEFITS: Array<{icon: IconName; title: string; subtitle: string}> = [
    {icon: 'shield-check-outline', title: t('managedProfile.intro.benefitPrivacyTitle'), subtitle: t('managedProfile.intro.benefitPrivacySubtitle')},
    {icon: 'chart-line', title: t('managedProfile.intro.benefitTrackingTitle'), subtitle: t('managedProfile.intro.benefitTrackingSubtitle')},
    {icon: 'heart-outline', title: t('managedProfile.intro.benefitAdaptedTitle'), subtitle: t('managedProfile.intro.benefitAdaptedSubtitle')},
  ];

  const onContinue = () => {
    // Fresh draft — a previous abandoned attempt (e.g. Back all the way out) can never
    // leak into this one. handleAddProfile (ProfileScreen.tsx) already starts one before
    // navigating here; starting again is cheap and keeps this screen self-contained if
    // it is ever reached another way.
    startManagedProfileDraft();
    updateManagedProfileDraft({type: 'daughter'});
    navigation.navigate('ManagedProfileDaughterInfo');
  };

  return (
    <AwaADeuxStepLayout
      ctaLabel={t('common.continue')}
      description={t('managedProfile.intro.description')}
      hero={
        <View style={styles.hero}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={DAUGHTER_ILLUSTRATION}
            style={styles.heroImage}
          />
        </View>
      }
      onBack={navigation.goBack}
      onContinue={onContinue}
      title={t('managedProfile.intro.title')}>
      <Reveal index={0}>
        <View style={styles.benefitsCard}>
          {BENEFITS.map((benefit, index) => (
            <View key={benefit.title} style={[styles.benefitRow, index < BENEFITS.length - 1 && styles.benefitRowDivider]}>
              <View style={styles.benefitIcon}>
                <MaterialDesignIcons color={theme.colors.primary} name={benefit.icon} size={20} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    // Transparent PNG, no background box behind it — sits straight on AwaADeuxStepLayout's
    // existing page gradient, same compact hero treatment as AwaADeuxInvitationScreen.tsx.
    hero: {width: '100%', height: 130, alignItems: 'center', justifyContent: 'center'},
    heroImage: {width: '100%', height: '100%'},
    benefitsCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    benefitRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14},
    benefitRowDivider: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08)},
    benefitIcon: {
      width: 40,
      height: 40,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    benefitCopy: {flex: 1, minWidth: 0},
    benefitTitle: {color: theme.colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 19},
    benefitSubtitle: {marginTop: 3, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  });
}
