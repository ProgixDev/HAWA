import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {
  PIN_LENGTH,
  beginPinSetup,
  cancelPinSetup,
  confirmAndSavePin,
  disableStoredPin,
  verifyPin,
} from '../../services/appSecurityService';
import {PinLockedError} from '../../services/pinAttemptLimiter';
import {setPinEnabled} from '../../state/securityPreferences';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';
import {PinKeypad} from './PinKeypad';

export type PinSheetMode = 'create' | 'change' | 'disable';

type Stage = 'current' | 'new' | 'confirm';

type Props = {
  visible: boolean;
  mode: PinSheetMode;
  /** Called once the PIN was created, changed or removed (the sheet closes itself right after). */
  onDone: () => void;
  onClose: () => void;
};

// The PIN create / change / remove flow as a bottom sheet — the same steps, services and copy as PinSetupScreen + PinConfirmScreen
// (current code → new code → confirmation), but without leaving the page the setting lives on.
export function PinSheet({visible, mode, onDone, onClose}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const firstStage: Stage = mode === 'create' ? 'new' : 'current';
  const [stage, setStage] = useState<Stage>(firstStage);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Every opening starts from the first step with an empty keypad.
  useEffect(() => {
    if (visible) {
      cancelPinSetup();
      setStage(mode === 'create' ? 'new' : 'current');
      setPin('');
      setError('');
      setBusy(false);
    }
  }, [visible, mode]);

  const close = useCallback(() => {
    cancelPinSetup();
    onClose();
  }, [onClose]);

  const fail = (message: string, backTo?: Stage) => {
    setError(message);
    setPin('');
    if (backTo) {
      setStage(backTo);
    }
  };

  const submit = async (value: string) => {
    setBusy(true);
    try {
      if (mode === 'disable') {
        if (await disableStoredPin(value)) {
          await setPinEnabled(false);
          onDone();
          onClose();
          return;
        }
        fail(t('security.incorrectCode'));
      } else if (stage === 'current') {
        if (await verifyPin(value)) {
          setStage('new');
          setPin('');
          setError('');
        } else {
          fail(t('security.incorrectCode'));
        }
      } else if (stage === 'new') {
        if (beginPinSetup(value)) {
          setStage('confirm');
          setPin('');
          setError('');
        } else {
          fail(t('security.genericError'));
        }
      } else {
        const result = await confirmAndSavePin(value);
        if (result === 'success') {
          await setPinEnabled(true);
          onDone();
          onClose();
          return;
        }
        // The pending code is gone after a mismatch, so the user starts again from the new-code step.
        fail(result === 'mismatch' ? t('security.codesDontMatch') : t('pinConfirm.setupExpired'), 'new');
      }
    } catch (submitError) {
      if (mounted.current) {
        // a wait is running after repeated wrong codes: say how long, instead of a generic error
        fail(submitError instanceof PinLockedError ? t('security.tooManyAttempts', {minutes: Math.max(1, Math.ceil(submitError.remainingMs / 60000))}) : t('security.genericError'));
      }
    } finally {
      if (mounted.current) {
        setBusy(false);
      }
    }
  };

  const onChange = (value: string) => {
    if (busy) {
      return;
    }
    setError('');
    setPin(value);
    if (value.length === PIN_LENGTH) {
      submit(value);
    }
  };

  let title: string;
  let subtitle: string;
  if (mode === 'disable') {
    title = t('pinSetup.confirmIdentityTitle');
    subtitle = t('pinSetup.confirmIdentitySubtitle');
  } else if (stage === 'current') {
    title = t('pinSetup.enterCurrentTitle');
    subtitle = t('pinSetup.verifyIdentitySubtitle');
  } else if (stage === 'confirm') {
    title = t('pinConfirm.title');
    subtitle = t('pinConfirm.subtitle');
  } else {
    title = t('pinSetup.createTitle');
    subtitle = t('pinSetup.createSubtitle', {length: PIN_LENGTH});
  }

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={t('common.close')} onPress={close} style={styles.scrim} />

        <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 12) + 8}]}>
          <View style={styles.handle} />

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AwaText accessibilityRole="header" style={styles.title} variant="titleLarge" weight="700">
              {title}
            </AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">
              {subtitle}
            </AwaText>

            <PinKeypad disabled={busy} error={error} onChange={onChange} value={pin} />

            {mode !== 'disable' && stage !== 'current' ? (
              <AwaText colorRole="onSurfaceVariant" style={styles.note} variant="bodySmall">
                {t('pinSetup.footerNote')}
              </AwaText>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    root: {flex: 1, justifyContent: 'flex-end'},
    scrim: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha('#000000', 0.5)},
    sheet: {
      maxHeight: '92%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: theme.colors.surface,
    },
    handle: {width: 36, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: theme.colors.border},
    content: {flexGrow: 1, alignItems: 'center', paddingTop: 16, paddingBottom: 8},
    title: {textAlign: 'center'},
    subtitle: {maxWidth: 330, marginTop: 6, textAlign: 'center'},
    note: {maxWidth: 300, marginTop: 14, textAlign: 'center'},
  });
}
