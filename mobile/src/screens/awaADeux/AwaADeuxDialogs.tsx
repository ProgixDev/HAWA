import React, {useEffect, useMemo, useState} from 'react';
import {Linking, Modal, Pressable, Share, StyleSheet, Text, TextInput, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {useAwaADeuxSharing} from '../../hooks/useAwaADeuxSharing';
import {partnerSubject} from '../../utils/awaADeuxPartnerWording';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {isValidEmail} from '../../utils/emailValidation';
import {computePartnerVisibility} from '../../utils/awaADeuxSharing';
import AwaADeuxModalFrame from './AwaADeuxModalFrame';
import PartnerPreviewCard from './PartnerPreviewCard';
import QrPlaceholder from './QrPlaceholder';
import {DEMO_PAIRING_CODE, demoPairingValidity} from './awaADeuxDemo';
import {buildEmailBody, buildMailtoUrl, emailSubject, invitationMessage} from './awaADeuxInvitation';

// The dialogs of the "AWA à deux" association flow. FRONTEND ONLY, DEMO content: nothing
// is sent by AWA — the platform share sheet and the phone's mail application do the
// sending — and the code is the placeholder AWA-7K4P9. Every color comes from the
// resolved AWA theme.

const useDialogStyles = () => {
  const {theme} = useAwaTheme();
  return {theme, styles: useMemo(() => createStyles(theme), [theme])};
};

/* ------------------------------------------------------------------ */
/* QR code                                                            */
/* ------------------------------------------------------------------ */

export function QrCodeModal({visible, onClose}: {visible: boolean; onClose: () => void}): React.JSX.Element {
  const {t} = useTranslation();
  const {styles} = useDialogStyles();
  const {partnerName} = useAwaADeuxPartnerName();

  // No image-sharing library: the invitation text (with the code) is what gets shared.
  const shareQr = async () => {
    try {
      await Share.share({message: invitationMessage()});
    } catch {
      // The share sheet could not open: nothing else to do in this demo phase.
    }
  };

  return (
    <AwaADeuxModalFrame ctaLabel={t('awaADeux.dialogs.qr.shareCta')} onClose={onClose} onCta={shareQr} title={t('awaADeux.dialogs.qr.title')} visible={visible}>
      <View style={styles.center}>
        <QrPlaceholder size={210} value={DEMO_PAIRING_CODE} />
        <Text style={styles.qrCode}>{DEMO_PAIRING_CODE}</Text>
        <Text style={styles.muted}>{demoPairingValidity()}</Text>
        <Text style={styles.demoNote}>{t('awaADeux.dialogs.qr.demoNote')}</Text>
        <Text style={styles.body}>{t('awaADeux.dialogs.qr.body', {Partner: partnerSubject(partnerName)})}</Text>
      </View>
    </AwaADeuxModalFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Email invitation                                                   */
/* ------------------------------------------------------------------ */

export function EmailInvitationModal({visible, onClose}: {visible: boolean; onClose: () => void}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme, styles} = useDialogStyles();
  const [to, setTo] = useState('');
  const {partnerName} = useAwaADeuxPartnerName();
  const emailBody = buildEmailBody(partnerName);
  const [subject, setSubject] = useState(emailSubject());
  const [message, setMessage] = useState(emailBody);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      setTo('');
      setSubject(emailSubject());
      setMessage(emailBody);
      setFailed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const trimmed = to.trim();
  const valid = isValidEmail(trimmed);
  const showInvalid = trimmed.length > 0 && !valid;

  // The phone's own mail application (mailto:) with recipient, subject and body pre-filled.
  const openMail = async () => {
    const url = buildMailtoUrl(trimmed, subject, message);
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
  };

  return (
    <AwaADeuxModalFrame
      avoidKeyboard
      ctaDisabled={!valid}
      ctaLabel={t('awaADeux.dialogs.email.cta')}
      onClose={onClose}
      onCta={openMail}
      title={t('awaADeux.dialogs.email.title')}
      visible={visible}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t('awaADeux.dialogs.email.toLabel')}</Text>
        <TextInput
          accessibilityLabel={t('awaADeux.dialogs.email.toAccessibility')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setTo}
          placeholder={t('awaADeux.dialogs.email.toPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, showInvalid && styles.inputInvalid]}
          value={to}
        />
        {showInvalid ? <Text accessibilityRole="alert" style={styles.error}>{t('awaADeux.dialogs.email.invalidEmail')}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t('awaADeux.dialogs.email.subjectLabel')}</Text>
        <TextInput
          accessibilityLabel={t('awaADeux.dialogs.email.subjectAccessibility')}
          onChangeText={setSubject}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={subject}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t('awaADeux.dialogs.email.messageLabel')}</Text>
        <TextInput
          accessibilityLabel={t('awaADeux.dialogs.email.messageAccessibility')}
          multiline
          onChangeText={setMessage}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, styles.messageInput]}
          textAlignVertical="top"
          value={message}
        />
      </View>

      {failed ? <Text accessibilityRole="alert" style={styles.error}>{t('awaADeux.dialogs.email.openFailed')}</Text> : null}
    </AwaADeuxModalFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Partner preview                                                    */
/* ------------------------------------------------------------------ */

/**
 * "Aperçu du côté partenaire": DEMO content, built from the CURRENT sharing choices
 * through computePartnerVisibility() — a block whose switch is off is not there.
 */
export function PartnerPreviewModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const {styles} = useDialogStyles();
  const {partnerName} = useAwaADeuxPartnerName();
  const {toggles, isPregnant} = useAwaADeuxSharing();
  const visibility = computePartnerVisibility(toggles, {isPregnant});

  return (
    <AwaADeuxModalFrame onClose={onClose} title="Aperçu du côté partenaire" visible={visible}>
      <PartnerPreviewCard
        cycleDayCaption="Après une fausse couche"
        greetingText="Voici quelques repères pour mieux t’accompagner aujourd’hui."
        showSupportContent
        visibility={visibility}
      />
      <Text style={[styles.body, styles.spaced]}>
        {`Ceci est un aperçu. ${partnerSubject(partnerName)} verra uniquement les informations que vous avez activées.`}
      </Text>
      <Text style={styles.demoNote}>Aperçu d’exemple : données fictives.</Text>
    </AwaADeuxModalFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Stop sharing                                                       */
/* ------------------------------------------------------------------ */

export function StopSharingModal({
  visible,
  partnerName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  partnerName: string;
  onCancel: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme, styles} = useDialogStyles();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) {setBusy(false);}
  }, [visible]);

  // A double tap confirms once.
  const confirm = () => {
    if (busy) {return;}
    setBusy(true);
    onConfirm();
  };

  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible={visible}>
      <View style={styles.sheetRoot}>
        <Pressable accessibilityLabel={t('common.cancel')} accessibilityRole="button" onPress={onCancel} style={styles.backdrop} />
        <View accessibilityViewIsModal style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16) + 8}]}>
          <View style={styles.sheetHandle} />
          <View importantForAccessibility="no-hide-descendants" style={styles.sheetIcon}>
            <MaterialDesignIcons color={theme.colors.danger} name="account-cancel-outline" size={28} />
          </View>
          <Text accessibilityRole="header" style={styles.sheetTitle}>{t('awaADeux.stopSharingModal.title')}</Text>
          <Text style={styles.sheetText}>
            {t('awaADeux.stopSharingModal.body', {Partner: partnerSubject(partnerName)})}
          </Text>
          <Pressable
            accessibilityLabel={t('awaADeux.stopSharingModal.confirm')}
            accessibilityRole="button"
            accessibilityState={{disabled: busy}}
            disabled={busy}
            onPress={confirm}
            style={({pressed}) => [styles.destructive, pressed && styles.pressed]}>
            <Text style={[styles.destructiveText, {color: pickReadableTextColor(theme.colors.danger)}]}>{t('awaADeux.stopSharingModal.confirm')}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t('common.cancel')}
            accessibilityRole="button"
            disabled={busy}
            onPress={onCancel}
            style={({pressed}) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    center: {alignItems: 'center'},
    qrCode: {marginTop: 14, color: theme.colors.accent, fontFamily: 'serif', fontSize: 24, fontWeight: '700', letterSpacing: 1.5},
    muted: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 13},
    demoNote: {marginTop: 6, color: theme.colors.textMuted, fontSize: 11.5},
    body: {marginTop: 12, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center'},
    spaced: {marginTop: 14},
    error: {marginTop: 8, color: theme.colors.danger, fontSize: 12.5, lineHeight: 18},
    invitationCard: {
      gap: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
      padding: 16,
    },
    invitationLine: {color: theme.colors.text, fontSize: 14.5, lineHeight: 21},
    field: {marginBottom: 12},
    fieldLabel: {marginBottom: 6, color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600'},
    input: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      color: theme.colors.text,
      fontSize: 14.5,
    },
    inputInvalid: {borderColor: theme.colors.danger},
    messageInput: {minHeight: 150, paddingTop: 12, paddingBottom: 12, lineHeight: 21},
    backdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.55)},
    sheetRoot: {flex: 1, justifyContent: 'flex-end'},
    sheet: {
      alignItems: 'center',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 22,
      paddingTop: 10,
      elevation: 16,
    },
    sheetHandle: {width: 42, height: 5, borderRadius: 3, backgroundColor: theme.colors.border},
    sheetIcon: {
      marginTop: 18,
      width: 60,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 30,
      backgroundColor: withAlpha(theme.colors.danger, 0.12),
    },
    sheetTitle: {marginTop: 14, color: theme.colors.text, fontFamily: 'serif', fontSize: 21, fontWeight: '700', textAlign: 'center'},
    sheetText: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center'},
    destructive: {
      marginTop: 20,
      alignSelf: 'stretch',
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 26,
      backgroundColor: theme.colors.danger,
    },
    destructiveText: {fontSize: 15.5, fontWeight: '700'},
    cancel: {
      marginTop: 8,
      alignSelf: 'stretch',
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 25,
      borderWidth: 1.2,
      borderColor: theme.colors.primary,
    },
    cancelText: {color: theme.colors.primary, fontSize: 15.5, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}
