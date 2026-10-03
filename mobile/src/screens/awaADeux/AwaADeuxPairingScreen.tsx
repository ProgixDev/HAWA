import React, {useMemo, useState} from 'react';
import {Pressable, Share, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {simulateInvitationSent} from '../../state/awaADeuxDemoStore';
import {advanceToPending} from './awaADeuxNavigation';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import AwaADeuxStepLayout, {Reveal} from './AwaADeuxStepLayout';
import {EmailInvitationModal, QrCodeModal} from './AwaADeuxDialogs';
import InvitationShareSheet from './InvitationShareSheet';
import {DEMO_PAIRING_CODE, demoPairingValidity} from './awaADeuxDemo';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {partnerLabel, partnerSubject} from '../../utils/awaADeuxPartnerWording';
import {invitationMessage} from './awaADeuxInvitation';

// "AWA à deux" — associate the partner. FRONTEND ONLY, DEMO UI.
//
// The code is a fixed placeholder (awaADeuxDemo.ts): nothing is generated, stored, sent
// or validated by a server, and "24 heures" is display copy only. No account, invitation
// or pairing exists behind these actions:
//   - copy icon: AWA has no clipboard package (and none is added in this phase), so it
//     opens the system share sheet with the invitation text — which offers "Copier";
//   - "Partager": the "Partager l'invitation" bottom sheet (app shortcuts, copy, more options);
//   - "Afficher le QR code": a dialog with a visual PLACEHOLDER (no QR encoder available);
//   - "Envoyer par email": an e-mail form that opens the phone's mail app (mailto:);
//   - "Continuer": FRONTEND DEMO PROGRESSION only. It does NOT mean a server sent or
//     verified anything: it only moves the in-memory demo connection status to 'pending'
//     (AwaADeuxPendingScreen) and pushes that screen once, even on a rapid double tap.
//     Sharing the invitation (any of the actions above) never touches that status.
type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPairing'>;

export default function AwaADeuxPairingScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {partnerName} = useAwaADeuxPartnerName();

  const [dialog, setDialog] = useState<'qr' | 'invitation' | 'email' | null>(null);
  const closeDialog = () => setDialog(null);

  // Demo progression (see the header comment): no verification, nothing stored or sent.
  const continueDemo = () => {
    simulateInvitationSent();
    advanceToPending(navigation);
  };

  const copyOrShare = async () => {
    try {
      await Share.share({message: invitationMessage()});
    } catch {
      // The share sheet could not open: nothing else to do in this demo phase.
    }
  };

  return (
    <AwaADeuxStepLayout
      ctaLabel={t('common.continue')}
      description={t('awaADeux.pairing.description', {partner: partnerLabel(partnerName)})}
      onBack={navigation.goBack}
      onContinue={continueDemo}
      title={t('awaADeux.pairing.title')}>
      <Reveal index={0}>
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('awaADeux.pairing.codeLabel')}</Text>
          <View style={styles.codeRow}>
            <Text
              accessibilityLabel={t('awaADeux.pairing.codeAccessibility', {spacedCode: DEMO_PAIRING_CODE.split('').join(' ')})}
              maxFontSizeMultiplier={1.2}
              selectable
              style={styles.code}>
              {DEMO_PAIRING_CODE}
            </Text>
            <Pressable
              accessibilityLabel={t('awaADeux.pairing.copyOrShareAccessibility')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={copyOrShare}
              style={({pressed}) => [styles.copyButton, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="content-copy" size={22} />
            </Pressable>
          </View>
          <Text style={styles.validity}>{demoPairingValidity()}</Text>
        </View>
      </Reveal>

      <Reveal index={1}>
        <View style={styles.shareCard}>
          <Text accessibilityRole="header" style={styles.shareTitle}>{t('awaADeux.pairing.shareSectionTitle')}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={t('awaADeux.pairing.shareAction')}
              accessibilityRole="button"
              onPress={() => setDialog('invitation')}
              style={({pressed}) => [styles.action, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="share-variant-outline" size={24} />
              <Text style={styles.actionText}>{t('awaADeux.pairing.shareAction')}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('awaADeux.pairing.showQrAction')}
              accessibilityRole="button"
              onPress={() => setDialog('qr')}
              style={({pressed}) => [styles.action, pressed && styles.pressed]}>
              <MaterialDesignIcons color={theme.colors.primary} name="qrcode" size={24} />
              <Text style={styles.actionText}>{t('awaADeux.pairing.showQrAction')}</Text>
            </Pressable>
          </View>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{t('awaADeux.pairing.orSeparator')}</Text>
            <View style={styles.separatorLine} />
          </View>

          <Pressable
            accessibilityLabel={t('awaADeux.pairing.emailAction')}
            accessibilityRole="button"
            onPress={() => setDialog('email')}
            style={({pressed}) => [styles.emailRow, pressed && styles.pressed]}>
            <View style={styles.emailIcon}>
              <MaterialDesignIcons color={theme.colors.primary} name="email-outline" size={24} />
            </View>
            <View style={styles.emailCopy}>
              <Text style={styles.emailTitle}>{t('awaADeux.pairing.emailAction')}</Text>
              <Text style={styles.emailText}>{t('awaADeux.pairing.emailDescription', {partner: partnerLabel(partnerName)})}</Text>
            </View>
          </Pressable>
        </View>
      </Reveal>

      <Reveal index={2}>
        <View style={styles.info}>
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={20} />
          <Text maxFontSizeMultiplier={1.2} style={styles.infoText}>
            {t('awaADeux.pairing.infoNote', {Partner: partnerSubject(partnerName)})}
          </Text>
        </View>

        <QrCodeModal onClose={closeDialog} visible={dialog === 'qr'} />
        <InvitationShareSheet onClose={closeDialog} visible={dialog === 'invitation'} />
        <EmailInvitationModal onClose={closeDialog} visible={dialog === 'email'} />
      </Reveal>
    </AwaADeuxStepLayout>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    codeCard: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.3),
      borderRadius: 26,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      paddingVertical: 20,
      ...theme.shadow,
    },
    codeLabel: {color: theme.colors.textSecondary, fontSize: 13.5, fontWeight: '600'},
    codeRow: {marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12},
    code: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 30,
      lineHeight: 38,
      fontWeight: '700',
      letterSpacing: 1.5,
    },
    copyButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      backgroundColor: theme.colors.primarySoft,
    },
    validity: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12.5},
    shareCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 26,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    shareTitle: {color: theme.colors.text, fontSize: 15.5, fontWeight: '800'},
    actions: {marginTop: 12, flexDirection: 'row', gap: 10},
    action: {
      flex: 1,
      minHeight: 78,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    actionText: {color: theme.colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center'},
    separator: {marginVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10},
    separatorLine: {flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border},
    separatorText: {color: theme.colors.textMuted, fontSize: 12.5},
    emailRow: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    emailIcon: {
      width: 48,
      height: 48,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    emailCopy: {flex: 1, minWidth: 0},
    emailTitle: {color: theme.colors.text, fontSize: 14.5, fontWeight: '800'},
    emailText: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18},
    info: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    infoText: {flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19},
    pressed: {opacity: 0.85},
  });
}
