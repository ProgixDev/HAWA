import React, {useMemo, useRef, useState} from 'react';
import {Animated, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../../navigation/AppNavigator';
import {useAwaADeuxSharing} from '../../../hooks/useAwaADeuxSharing';
import {simulatePartnerAccepted} from '../../../state/awaADeuxDemoStore';
import {getFirstName} from '../../../state/onboardingPreferences';
import {useAwaTheme} from '../../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../../theme/awaThemeTokens';
import {computePartnerVisibility} from '../../../utils/awaADeuxSharing';
import AwaADeuxStepLayout, {Reveal} from '../AwaADeuxStepLayout';
import {SHARING_SECTIONS} from '../awaADeuxDemo';
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});
  const sharedItems = SHARING_SECTIONS.flatMap(section => section.items).filter(item => visibility.fields[item.key]);
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
        <Text
          accessibilityRole="header"
          adjustsFontSizeToFit
          minimumFontScale={0.82}
          numberOfLines={1}
          style={styles.title}>
          <Text style={styles.titlePrimary}>Accepter </Text>
          <Text style={styles.titleAccent}>l’invitation ?</Text>
        </Text>
        <Text style={styles.subtitle}>
          {ownerName ? `${ownerName} souhaite partager\navec vous :` : 'Votre partenaire souhaite partager\navec vous :'}
        </Text>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.card}>
          {sharedItems.length === 0 ? (
            <Text style={styles.emptyText}>Aucune information n’est partagée pour le moment.</Text>
          ) : (
            sharedItems.map((item, index) => (
              <View key={item.key} style={[styles.row, index > 0 && styles.rowDivider]}>
                <View style={styles.rowIcon}>
                  <MaterialDesignIcons color={theme.colors.primary} name={item.icon as never} size={18} />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
            ))
          )}
        </View>
      </Reveal>

      <Reveal index={2}>
        <View style={styles.privacy}>
          <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={20} />
          <Text style={styles.privacyText}>
            Vous aurez uniquement accès aux informations qu’elle choisit de partager.
          </Text>
        </View>
      </Reveal>

      {/* Pushes the actions row down to the bottom of the (flexGrow: 1) content area,
          without needing any change to AwaADeuxStepLayout itself. */}
      <View style={styles.spacer} />

      <Reveal index={3}>
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityLabel="Accepter l’invitation"
            accessibilityRole="button"
            accessibilityState={{disabled: busy}}
            disabled={busy}
            onPress={accept}
            style={({pressed}) => [styles.acceptButton, pressed && styles.pressed]}>
            <Text style={styles.acceptButtonText}>Accepter l’invitation</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Plus tard"
            accessibilityRole="button"
            disabled={busy}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.later, pressed && styles.pressed]}>
            <Text style={styles.laterText}>Plus tard</Text>
          </Pressable>
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
    title: {textAlign: 'center', fontFamily: 'serif', fontWeight: '700', fontSize: 28, lineHeight: 33},
    titlePrimary: {color: theme.colors.text},
    titleAccent: {color: theme.colors.accent},
    subtitle: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 14.5, lineHeight: 20, fontWeight: '600', textAlign: 'center'},
    card: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 6,
      ...theme.shadow,
    },
    emptyText: {color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, paddingVertical: 12},
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
    rowLabel: {flex: 1, minWidth: 0, color: theme.colors.text, fontSize: 14, lineHeight: 19},
    privacy: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    privacyText: {flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
    // Pushes actionsRow to the bottom of the (flexGrow: 1) content area below.
    spacer: {flex: 1, minHeight: 16},
    actionsRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
    // The primary AWA CTA, same visual language as every other primary button in the app
    // (theme.colors.primary fill, pill radius, onPrimaryTextColor text, subtle shadow),
    // now sized to share the row with "Plus tard" instead of being full-width.
    acceptButton: {
      flex: 1.8,
      minHeight: 54,
      justifyContent: 'center',
      borderRadius: 27,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 16,
      ...theme.shadow,
    },
    acceptButtonText: {color: onPrimaryTextColor(theme), fontSize: 14.5, fontWeight: '700', textAlign: 'center'},
    // Clearly secondary to the accept button: outline only, primary tones, same height.
    later: {
      flex: 0.9,
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.35),
      borderRadius: 27,
      paddingHorizontal: 12,
    },
    laterText: {color: theme.colors.primary, fontSize: 13.5, fontWeight: '700'},
    pressed: {opacity: 0.75},
  });
}
