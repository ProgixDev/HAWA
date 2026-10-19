import React, {useMemo, useRef, useState} from 'react';
import {Animated, Image, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../../navigation/AppNavigator';
import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import {simulatePartnerAccepted} from '../../../state/awaADeuxDemoStore';
import {getFirstName} from '../../../state/onboardingPreferences';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import {AwaButton} from '../../../components/ui/AwaButton';
import {AwaCard} from '../../../components/ui/AwaCard';
import {AwaText} from '../../../components/ui/AwaText';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import AwaADeuxStepLayout, {Reveal} from '../AwaADeuxStepLayout';
import {sharingSections} from '../awaADeuxDemo';
import {useHeroEntrance} from '../useEntrance';

// "AWA à deux" — PARTNER-SIDE demo acceptance. FRONTEND ONLY: "Accepter l'invitation"
// moves awaADeuxDemoStore's connectionStatus from 'pending' to 'connected' — no server
// verifies or stores anything — then opens PartnerMainTabs (mirrors how AuthScreen.tsx's
// own bypass opens MainTabs today: `navigation.replace(...)`, not a full stack reset).
// "Plus tard" only goes back: it must never itself set the connection to connected.
//
// The permission list shown is the SAME, single source of truth the owner's connected
// screen and partner-preview already use (useAwaADeuxSharing + computePartnerVisibility)
// — nothing is duplicated or re-derived here, so this list can never drift from what the
// owner actually chose to share.
//
// The invitation illustration and its entrance reuse the exact same asset/animation as
// AwaADeuxPendingScreen / AwaADeuxInvitationScreen (useHeroEntrance, useEntrance.ts) — the
// background/page frame stays entirely AwaADeuxStepLayout's `hero` slot.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxAcceptInvitation'>;

const INVITATION_IMAGE = require('../../../assets/images/invitation.png');

export default function AwaADeuxAcceptInvitationScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});
  const sharedItems = sharingSections().flatMap(section => section.items).filter(item => visibility.fields[item.key]);
  const heroEntrance = useHeroEntrance();

  const ownerName = getFirstName().trim();
  const accepting = useRef(false);
  const [busy, setBusy] = useState(false);

  const accept = () => {
    if (accepting.current) {return;}
    accepting.current = true;
    setBusy(true);
    simulatePartnerAccepted();
    navigation.replace('PartnerMainTabs');
  };

  return (
    <AwaADeuxStepLayout
      decor
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
      // Title/subtitle are custom-built below (two-tone title on one line, exact wording) —
      // the shared layout's plain-string title/description can't express that, so both are
      // left empty here and no sticky CTA is used either (see the actionsRow at the bottom).
      title="">
      <Reveal index={0}>
        <AwaText
          accessibilityRole="header"
          variant="headlineMedium"
          style={styles.title}>
          <Text style={styles.titlePrimary}>{t('awaADeux.partnerSide.accept.titlePrimary')}</Text>
          <Text style={styles.titleAccent}>{t('awaADeux.partnerSide.accept.titleAccent')}</Text>
        </AwaText>
        <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.subtitle}>
          {ownerName
            ? t('awaADeux.partnerSide.accept.subtitleWithName', {name: ownerName})
            : t('awaADeux.partnerSide.accept.subtitleNeutral')}
        </AwaText>
      </Reveal>

      <Reveal index={1}>
        <AwaCard padding="none" style={styles.card} variant="filled">
          {sharedItems.length === 0 ? (
            <AwaText colorRole="onSurfaceVariant" variant="bodyMedium" style={styles.emptyText}>{t('awaADeux.partnerSide.accept.emptyShared')}</AwaText>
          ) : (
            sharedItems.map((item, index) => (
              <View key={item.key} style={[styles.row, index > 0 && styles.rowDivider]}>
                <View style={styles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name={item.icon as never} size={18} />
                </View>
                <AwaText variant="bodyMedium" style={styles.rowLabel}>{item.label}</AwaText>
              </View>
            ))
          )}
        </AwaCard>
      </Reveal>

      <Reveal index={2}>
        <View style={styles.privacy}>
          <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={20} />
          <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.privacyText}>
            {t('awaADeux.partnerSide.accept.privacyText')}
          </AwaText>
        </View>
      </Reveal>

      {/* Pushes the actions row down to the bottom of the (flexGrow: 1) content area,
          without needing any change to AwaADeuxStepLayout itself. */}
      <View style={styles.spacer} />

      <Reveal index={3}>
        <View style={styles.actionsRow}>
          <AwaButton
            accessibilityLabel={t('awaADeux.partnerSide.accept.acceptCta')}
            disabled={busy}
            label={t('awaADeux.partnerSide.accept.acceptCta')}
            onPress={accept}
            size="large"
            style={styles.acceptButton}
          />
          <AwaButton
            accessibilityLabel={t('awaADeux.partnerSide.accept.later')}
            disabled={busy}
            label={t('awaADeux.partnerSide.accept.later')}
            onPress={navigation.goBack}
            size="large"
            style={styles.later}
            variant="outlined"
          />
        </View>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    // Transparent PNG, no background box behind it — same compact hero treatment as
    // AwaADeuxPendingScreen / AwaADeuxInvitationScreen.
    hero: {width: '100%', height: 120, alignItems: 'center', justifyContent: 'center'},
    heroImage: {width: '100%', height: '100%'},
    // Two-tone, one-line title ("Accepter" light/cream, "l'invitation ?" the AWA accent
    // color) — same serif family as every other AWA à deux step title.
    title: {textAlign: 'center', fontSize: 28, lineHeight: 33},
    titlePrimary: {color: theme.colors.text},
    titleAccent: {color: theme.colors.accent},
    subtitle: {marginTop: 8, textAlign: 'center'},
    card: {marginTop: 4, paddingHorizontal: 16, paddingVertical: 6},
    emptyText: {paddingVertical: 12},
    row: {minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12},
    rowDivider: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border},
    rowIcon: {
      width: 34,
      height: 34,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    rowLabel: {flex: 1, minWidth: 0},
    privacy: {marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingVertical: 8},
    privacyText: {flex: 1, minWidth: 0},
    // Pushes actionsRow to the bottom of the (flexGrow: 1) content area below.
    spacer: {flex: 1, minHeight: 16},
    actionsRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    // The primary button shares the row with the secondary "Plus tard" (outlined).
    acceptButton: {flex: 1.8},
    later: {flex: 0.9},
  });
}
