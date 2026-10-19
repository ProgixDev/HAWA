import React, {useMemo, useState} from 'react';
import {Animated, Image, StyleSheet, useWindowDimensions} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {simulateInvitationSent} from '../../state/awaADeuxDemoStore';
import {advanceToPending} from './awaADeuxNavigation';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaText} from '../../components/ui/AwaText';
import {AwaTextField} from '../../components/ui/AwaTextField';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {partnerLabel} from '../../utils/awaADeuxPartnerWording';
import {isValidEmail} from '../../utils/emailValidation';
import {useHeroEntrance} from './useEntrance';

// "AWA à deux" — invite the partner. FRONTEND ONLY, DEMO UI.
//
// EMAIL + SECURE LINK is the ONLY invitation method: no pairing PIN/code, no QR code, no
// native share sheet, no manually entered code. A real backend will later generate the
// secure token and actually send the email (see the header comment of
// src/state/awaADeuxDemoStore.ts for the exact simulated state transition) — this screen
// only collects and validates the address, then simulates success:
//   "Envoyer l'invitation": FRONTEND DEMO PROGRESSION only. It does NOT send a real email:
//   it records the address (simulateInvitationSent) and moves to the Pending step via the
//   same guarded advanceToPending() every other step uses, so a rapid double tap can never
//   push a duplicate screen. This screen is never unmounted by going back from Pending, so
//   — unlike AcceptInvitationScreen's one-shot accept — no local "already sent" ref is used:
//   she can come back here (e.g. after "Retour") and send again.
//
// This phase is a VISUAL-ONLY redesign (partner.png hero + a more premium card/CTA
// treatment) — none of the above business logic changed. The shared title/description
// typography and back button (AwaADeuxStepLayout.tsx) are deliberately left untouched:
// they are used by every other "AWA à deux" step, so restyling them here would ripple
// into screens this task never asked to change.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPairing'>;

const HERO_IMAGE = require('../../assets/images/partner.png');

export default function AwaADeuxPairingScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const {height, width} = useWindowDimensions();
  const compact = width < 380 || height < 720;
  const styles = useMemo(() => createStyles(), []);
  const {partnerName} = useAwaADeuxPartnerName();
  const heroEntrance = useHeroEntrance();

  // Height only — resizeMode="contain" derives the width from partner.png's own aspect
  // ratio within the available page width, which naturally lands around 240–290dp on
  // typical phone widths without hardcoding it separately.
  const heroHeight = Math.round(Math.min(190, Math.max(150, height * (compact ? 0.19 : 0.22))));

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = email.trim();
  const valid = isValidEmail(trimmed);
  const showInvalid = touched && trimmed.length > 0 && !valid;

  const sendInvitation = () => {
    if (!valid) {return;}
    simulateInvitationSent(trimmed);
    advanceToPending(navigation);
  };

  return (
    <AwaADeuxStepLayout
      ctaDisabled={!valid}
      ctaLabel={t('awaADeux.pairing.sendCta')}
      decor
      description={t('awaADeux.pairing.description', {partner: partnerLabel(partnerName)})}
      hero={
        <Animated.View style={[styles.hero, {height: heroHeight}, heroEntrance]}>
          <Image
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            resizeMode="contain"
            source={HERO_IMAGE}
            style={styles.heroImage}
          />
        </Animated.View>
      }
      onBack={navigation.goBack}
      onContinue={sendInvitation}
      title={t('awaADeux.pairing.title')}>
      <Reveal index={0}>
        <AwaTextField
          accessibilityLabel={t('awaADeux.pairing.emailAccessibility')}
          autoCapitalize="none"
          autoCorrect={false}
          errorText={showInvalid ? t('awaADeux.pairing.invalidEmail') : undefined}
          keyboardType="email-address"
          label={t('awaADeux.pairing.emailLabel')}
          leadingIcon="email-outline"
          onBlur={() => setTouched(true)}
          onChangeText={setEmail}
          placeholder={t('awaADeux.pairing.emailPlaceholder')}
          value={email}
        />
      </Reveal>

      <Reveal index={1}>
        <AwaCard padding="compact" style={styles.info} variant="filled">
          <MaterialDesignIcons color={theme.colors.primary} name="shield-check-outline" size={20} />
          <AwaText colorRole="onSurfaceVariant" maxFontSizeMultiplier={1.2} variant="bodySmall" style={styles.infoText}>
            {t('awaADeux.pairing.emailHelper', {partner: partnerLabel(partnerName)})}
          </AwaText>
        </AwaCard>
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles() {
  return StyleSheet.create({
    // Transparent PNG, no background box behind it — same compact hero treatment as
    // AwaADeuxPendingScreen / AwaADeuxInvitationScreen (only `height` varies per-screen).
    hero: {width: '100%', maxWidth: 300, alignSelf: 'center', alignItems: 'center', justifyContent: 'center'},
    heroImage: {width: '100%', height: '100%'},
    info: {flexDirection: 'row', alignItems: 'center', gap: 12},
    infoText: {flex: 1, minWidth: 0},
  });
}
