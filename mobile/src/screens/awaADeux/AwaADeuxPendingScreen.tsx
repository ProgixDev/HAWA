import React, {useMemo, useRef, useState} from 'react';
import {Animated, Image, StyleSheet, View, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {cancelInvitation, getDemoPartnerState} from '../../state/awaADeuxDemoStore';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';
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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const {height} = useWindowDimensions();
  const layout = useMemo(() => getPendingLayout(height), [height]);
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const {partnerName} = useAwaADeuxPartnerName();
  const label = partnerLabel(partnerName);
  const heroEntrance = useHeroEntrance();
  const partnerEmail = getDemoPartnerState().partnerEmail;

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
      description={t('awaADeux.pending.description', {partner: label})}
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
      title={t('awaADeux.pending.title', {partner: label})}>
      <Reveal index={0}>
        <AwaCard padding="none" style={styles.statusCard} variant="filled">
          <View style={styles.statusIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="clock-outline" size={layout.statusClockSize} />
          </View>
          <View style={styles.statusContent}>
            <AwaText variant="titleSmall">{t('awaADeux.pending.statusTitle')}</AwaText>
            {/* FR needs the elided "dès qu'elle accepte" form (queBeforePartner); EN uses the
                plain name instead — same dual-interpolation-key pattern as AwaADeuxPartnerViewScreen. */}
            <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.statusDescription}>{t('awaADeux.pending.statusDescription', {quePartner: queBeforePartner(partnerName), name: label})}</AwaText>
            {partnerEmail ? <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.statusEmail}>{t('awaADeux.pending.sentToEmail', {email: partnerEmail})}</AwaText> : null}
          </View>
        </AwaCard>
      </Reveal>

      <Reveal index={1}>
        <AwaButton
          accessibilityLabel={t('awaADeux.pending.resend')}
          fullWidth
          icon={resent ? 'check' : 'send-outline'}
          label={resent ? t('awaADeux.pending.resent') : t('awaADeux.pending.resend')}
          minHeight={layout.primaryHeight}
          onPress={resendInvitation}
        />
      </Reveal>

      <Reveal index={2}>
        <AwaButton
          accessibilityLabel={t('awaADeux.pending.cancel')}
          fullWidth
          icon="close-circle-outline"
          label={t('awaADeux.pending.cancel')}
          minHeight={layout.cancelHeight}
          onPress={cancel}
          variant="destructive"
        />
      </Reveal>

      {__DEV__ ? (
        <Reveal index={3}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <AwaText colorRole="onSurfaceVariant" variant="labelSmall">{t('awaADeux.pending.previewDivider')}</AwaText>
            <View style={styles.dividerLine} />
          </View>

          <AwaCard
            accessibilityLabel={t('awaADeux.pending.previewTitle')}
            onPress={() => navigation.navigate('AwaADeuxInvitation')}
            padding="none"
            style={styles.previewCard}
            variant="outlined">
            <View style={styles.previewIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="cellphone" size={20} />
            </View>
            <View style={styles.previewContent}>
              <AwaText variant="titleSmall">{t('awaADeux.pending.previewTitle')}</AwaText>
              <AwaText colorRole="onSurfaceVariant" variant="bodySmall" style={styles.previewDescription}>{t('awaADeux.pending.previewDescription', {partner: label})}</AwaText>
            </View>
            <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} />
          </AwaCard>
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
      paddingHorizontal: 16,
      paddingVertical: layout.statusPaddingVertical,
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
    statusDescription: {marginTop: 2},
    statusEmail: {marginTop: 4},

    divider: {marginVertical: layout.dividerMarginVertical, flexDirection: 'row', alignItems: 'center', gap: 10},
    dividerLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},

    previewCard: {
      width: '100%',
      minHeight: layout.previewMinHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    previewIcon: {
      width: layout.previewIconSize,
      height: layout.previewIconSize,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    previewContent: {flex: 1, minWidth: 0},
    previewDescription: {marginTop: 2},
  });
}
