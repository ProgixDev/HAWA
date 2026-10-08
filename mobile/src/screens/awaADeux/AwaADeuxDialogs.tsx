import React, {useEffect, useMemo, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTranslation} from 'react-i18next';

import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {useAwaADeuxSharing} from '../../hooks/useAwaADeuxSharing';
import {partnerSubject} from '../../utils/awaADeuxPartnerWording';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {computePartnerVisibility} from '../../utils/awaADeuxSharing';
import AwaADeuxModalFrame from './AwaADeuxModalFrame';
import PartnerPreviewCard from './PartnerPreviewCard';

// The remaining dialogs of the "AWA à deux" association flow. FRONTEND ONLY: nothing is
// sent anywhere. Every color comes from the resolved AWA theme.
//
// The old pairing-code QR/e-mail-compose dialogs (QrCodeModal, EmailInvitationModal) were
// removed when the invitation flow became EMAIL + SECURE LINK ONLY — see
// AwaADeuxPairingScreen.tsx, which now collects the partner's email directly on its own
// screen instead of through a dialog.

const useDialogStyles = () => {
  const {theme} = useAwaTheme();
  return {theme, styles: useMemo(() => createStyles(theme), [theme])};
};

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
    demoNote: {marginTop: 6, color: theme.colors.textMuted, fontSize: 11.5},
    body: {marginTop: 12, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center'},
    spaced: {marginTop: 14},
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
