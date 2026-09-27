import React, {useMemo} from 'react';
import {Animated, Image, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../../navigation/AppNavigator';
import {getFirstName} from '../../../state/onboardingPreferences';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import type {ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const heroEntrance = useHeroEntrance();

  // Read-only, synchronous, cached mirror of personalInformationStore — the same source
  // PregnancyDashboard.tsx already reads a first name from. An empty result is real
  // ("no name entered yet"), never replaced by an invented one.
  const ownerName = getFirstName().trim();

  return (
    <AwaADeuxStepLayout
      ctaLabel="Continuer"
      decor
      description={
        ownerName
          ? `${ownerName} vous invite\nà rejoindre AWA à deux`
          : 'Vous avez reçu une invitation\nà rejoindre AWA à deux'
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
      title="AWA à deux">
      <Reveal index={0}>
        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="text-box-outline" size={20} />
          </View>
          <Text style={styles.body}>
            Elle souhaite partager avec vous certaines informations pour vous aider à
            mieux comprendre son parcours.
          </Text>
        </View>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.privacy}>
          <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={20} />
          <Text style={styles.privacyText}>
            Vous verrez uniquement les informations qu’elle choisit de partager.
          </Text>
        </View>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    // Transparent PNG, no background box behind it — sits straight on AwaADeuxStepLayout's
    // existing page gradient, same compact treatment as AwaADeuxPendingScreen's own hero.
    hero: {width: '100%', height: 120, alignItems: 'center', justifyContent: 'center'},
    heroImage: {width: '100%', height: '100%'},
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    cardIcon: {
      width: 38,
      height: 38,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    body: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14.5, lineHeight: 21},
    privacy: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    privacyText: {flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
  });
}
