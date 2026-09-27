import React, {useMemo, useRef, useState} from 'react';
import {Animated, Image, Pressable, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {cancelInvitation} from '../../state/awaADeuxDemoStore';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {partnerLabel, queBeforePartner} from '../../utils/awaADeuxPartnerWording';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import {getPendingLayout, type PendingLayout} from './awaADeuxPendingLayout';
import {rebuildStackToAssociation} from './awaADeuxNavigation';
import {useHeroEntrance} from './useEntrance';

// "AWA à deux" — waiting screen (Pairing "Continuer" → here). FRONTEND DEMO ONLY: the
// invitation was never actually sent or verified by anything real; this screen only
// reflects awaADeuxDemoStore's connectionStatus === 'pending'. Whoever accepts is a
// SEPARATE, partner-side demo journey (AwaADeuxInvitation → AwaADeuxAcceptInvitation →
// PartnerMainTabs) that this screen does not navigate to or wait on with a timer — there
// is no automatic pending → connected transition anywhere. Once (and only if) the demo
// partner-side "Accepter l'invitation" runs, the owner naturally reaches "Partenaire
// associé" the next time she opens AWA à deux from Profile (awaADeuxEntryRoute).
//
// __DEV__-only: "Prévisualiser le parcours partenaire" opens the partner-side demo
// screens inside this same app/stack, so the whole journey can be tried on one device —
// it must never appear in a production build. The background/page frame is entirely
// AwaADeuxStepLayout's — this file only lays out the content within it.
//
// ONE viewport, no scrolling: AwaADeuxStepLayout's `fit` mode (already used by the
// Benefits/PartnerView steps) shares the height left after the back button and the
// illustration between the title/description and the body below, instead of scrolling;
// getPendingLayout() shrinks every size smoothly as the window gets shorter.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPending'>;

const INVITATION_IMAGE = require('../../assets/images/invitation.png');

export default function AwaADeuxPendingScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const {height} = useWindowDimensions();
  const layout = useMemo(() => getPendingLayout(height), [height]);
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const {partnerName} = useAwaADeuxPartnerName();
  const label = partnerLabel(partnerName);
  const heroEntrance = useHeroEntrance();

  const [resent, setResent] = useState(false);
  const resendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visual feedback only: no invitation exists to actually resend in this demo phase.
  const resendInvitation = () => {
    if (resendTimer.current) {clearTimeout(resendTimer.current);}
    setResent(true);
    resendTimer.current = setTimeout(() => setResent(false), 2400);
  };

  const cancel = () => {
    cancelInvitation();
    rebuildStackToAssociation(navigation);
  };

  return (
    <AwaADeuxStepLayout
      description={`Vous pourrez commencer à partager les informations sélectionnées dès que ${label} aura rejoint AWA à deux.`}
      fit={{titleFontSize: layout.titleFontSize, titleLineHeight: layout.titleLineHeight, bodyMarginTop: layout.bodyMarginTop, bodyGap: layout.bodyGap, ctaHeight: layout.ctaHeight}}
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
      title={`Invitation envoyée\nà ${label}`}>
      <Reveal index={0}>
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={layout.statusClockSize} />
          </View>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>En attente d’acceptation</Text>
            <Text style={styles.statusDescription}>{`Nous vous préviendrons dès que ${queBeforePartner(partnerName)} accepte votre invitation.`}</Text>
          </View>
        </View>
      </Reveal>

      <Reveal index={1}>
        <Pressable
          accessibilityLabel="Renvoyer l’invitation"
          accessibilityRole="button"
          onPress={resendInvitation}
          style={({pressed}) => [styles.primaryAction, pressed && styles.pressed]}>
          <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={resent ? 'check' : 'send-outline'} size={20} />
          <Text style={styles.primaryActionText}>{resent ? 'Invitation renvoyée' : 'Renvoyer l’invitation'}</Text>
        </Pressable>
      </Reveal>

      <Reveal index={2}>
        <Pressable
          accessibilityLabel="Annuler l’invitation"
          accessibilityRole="button"
          onPress={cancel}
          style={({pressed}) => [styles.cancelAction, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.danger} name="close-circle-outline" size={20} />
          <Text style={styles.cancelActionText}>Annuler l’invitation</Text>
        </Pressable>
      </Reveal>

      {__DEV__ ? (
        <Reveal index={3}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            accessibilityLabel="Prévisualiser le parcours partenaire"
            accessibilityRole="button"
            onPress={() => navigation.navigate('AwaADeuxInvitation')}
            style={({pressed}) => [styles.previewCard, pressed && styles.pressed]}>
            <View style={styles.previewIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="cellphone" size={20} />
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>Prévisualiser le parcours partenaire</Text>
              <Text style={styles.previewDescription}>{`Découvrez ce que ${label} verra dans AWA à deux.`}</Text>
            </View>
            <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
          </Pressable>
        </Reveal>
      ) : null}
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme, layout: PendingLayout) {
  return StyleSheet.create({
    // Transparent PNG, no background box behind it: it sits straight on AwaADeuxStepLayout's
    // existing page gradient. Fixed, compact height (not the flexible "fills the space"
    // hero some other AWA à deux screens use) — `contain` keeps its real aspect ratio.
    hero: {width: '100%', height: layout.heroHeight, alignItems: 'center', justifyContent: 'center'},
    heroImage: {width: '100%', height: '100%'},

    statusCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: layout.statusPaddingVertical,
      ...theme.shadow,
    },
    statusIcon: {
      width: layout.statusIconSize,
      height: layout.statusIconSize,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.statusIconSize / 2,
      backgroundColor: theme.colors.primarySoft,
    },
    statusContent: {flex: 1, minWidth: 0},
    statusTitle: {color: theme.colors.text, fontSize: 14, fontWeight: '800'},
    statusDescription: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},

    // The full-width, primary AWA CTA (same visual language as every other primary button
    // in the app: theme.colors.primary fill, height/2 radius, onPrimaryTextColor text).
    primaryAction: {
      width: '100%',
      minHeight: layout.primaryHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderRadius: layout.primaryHeight / 2,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      ...theme.shadow,
    },
    primaryActionText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},

    // Clearly secondary to the CTA above: outline only, danger tones, same height family.
    cancelAction: {
      width: '100%',
      minHeight: layout.cancelHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.2,
      borderColor: withAlpha(theme.colors.danger, 0.4),
      borderRadius: layout.cancelHeight / 2,
      backgroundColor: withAlpha(theme.colors.danger, 0.05),
      paddingHorizontal: 20,
    },
    cancelActionText: {color: theme.colors.danger, fontSize: 14, fontWeight: '700'},

    divider: {marginVertical: layout.dividerMarginVertical, flexDirection: 'row', alignItems: 'center', gap: 10},
    dividerLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    dividerText: {color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.4},

    previewCard: {
      width: '100%',
      minHeight: layout.previewMinHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      ...theme.shadow,
    },
    previewIcon: {
      width: layout.previewIconSize,
      height: layout.previewIconSize,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.primarySoft,
    },
    previewContent: {flex: 1, minWidth: 0},
    previewTitle: {color: theme.colors.text, fontSize: 13, fontWeight: '800'},
    previewDescription: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},

    pressed: {opacity: 0.85},
  });
}
