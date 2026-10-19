import React, {useMemo} from 'react';
import {Animated, Image, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../../navigation/AppNavigator';
import {getFirstName} from '../../../state/onboardingPreferences';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {AwaCard} from '../../../components/ui/AwaCard';
import {AwaText} from '../../../components/ui/AwaText';
import AwaADeuxStepLayout, {Reveal} from '../AwaADeuxStepLayout';
import {useHeroEntrance} from '../useEntrance';

// "AWA à deux" — PARTNER-SIDE demo entry point. FRONTEND ONLY: reached today only through
// AwaADeuxPendingScreen's __DEV__ "Prévisualiser le parcours partenaire" — there is no real
// invitation delivery, deep link or QR validation behind it (see AwaADeuxAcceptInvitationScreen
// for what happens next). Real authentication does not exist yet, so "Continuer" goes
// straight to AwaADeuxAcceptInvitation; it deliberately does NOT go through Auth/Registration
// (those screens are untouched — see the header comment there for why).
//
// Do not confuse the OWNER's name (read here, read-only, from the existing personal-
// information mirror — never invented) with the PARTNER's name (awaADeuxPartnerStore,
// used on the owner side only). This screen only ever needs the owner's name.
//
// The invitation illustration and its entrance reuse the exact same asset/animation as
// AwaADeuxPendingScreen's own hero (useHeroEntrance, useEntrance.ts) — the background/page
// frame stays entirely AwaADeuxStepLayout's `hero` slot, unchanged for every other screen.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxInvitation'>;

const INVITATION_IMAGE = require('../../../assets/images/invitation.png');

export default function AwaADeuxInvitationScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(), []);
  const heroEntrance = useHeroEntrance();

  // Read-only, synchronous, cached mirror of personalInformationStore — the same source
  // PregnancyDashboard.tsx already reads a first name from. An empty result is real
  // ("no name entered yet"), never replaced by an invented one.
  const ownerName = getFirstName().trim();

  return (
    <AwaADeuxStepLayout
      ctaLabel={t('common.continue')}
      decor
      description={
        ownerName
          ? t('awaADeux.partnerSide.invitation.descriptionWithName', {name: ownerName})
          : t('awaADeux.partnerSide.invitation.descriptionNeutral')
      }
      hero={
        <Animated.View style={[styles.hero, heroEntrance]}>
          <Image
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            resizeMode="contain"
            source={INVITATION_IMAGE}
            style={styles.heroImage}
          />
        </Animated.View>
      }
      onBack={navigation.goBack}
      onContinue={() => navigation.navigate('AwaADeuxAcceptInvitation')}
      title={t('awaADeux.partnerSide.invitation.title')}>
      <Reveal index={0}>
        <AwaCard variant="filled">
          <AwaText variant="bodyMedium">
            {t('awaADeux.partnerSide.invitation.cardBody')}
          </AwaText>
        </AwaCard>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.privacy}>
          <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={20} />
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.privacyText}>
            {t('awaADeux.partnerSide.invitation.privacyText')}
          </AwaText>
        </View>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles() {
  return StyleSheet.create({
    // Transparent PNG, no background box behind it — sits straight on AwaADeuxStepLayout's
    // existing page gradient, same compact treatment as AwaADeuxPendingScreen's own hero.
    hero: {width: '100%', height: 120, alignItems: 'center', justifyContent: 'center'},
    heroImage: {width: '100%', height: '100%'},
    privacy: {marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingVertical: 8},
    privacyText: {flex: 1, minWidth: 0},
  });
}
