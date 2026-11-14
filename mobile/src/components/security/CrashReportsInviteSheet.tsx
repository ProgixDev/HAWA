import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Image, Modal, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {setCrashReportsEnabled} from '../../services/sentry';
import {getAppLockState, subscribeAppLock} from '../../state/appLockStore';
import {
  getCrashReportsChoice,
  loadCrashReportsChoice,
  subscribeCrashReportsChoice,
  type CrashReportsChoice,
} from '../../state/crashReportsPreferences';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../ui/AwaButton';
import {AwaSwitch} from '../ui/AwaSwitch';
import {AwaText} from '../ui/AwaText';

const AWA_LOGO = require('../../assets/images/hawa-logo.png');

// Wait a moment after the main screens appear so the invitation never competes with the first render.
const SHOW_DELAY_MS = 1500;

type SheetProps = {
  visible: boolean;
  onEnable: () => void;
  onDecline: () => void;
  onOpenPolicy: () => void;
};

/** The one-time invitation to turn anonymous crash reports on — the same bottom-sheet pattern as PinSheet. Nothing is switched on by it:
 * only "Activer" does; "Non merci", the scrim and the back button all count as a refusal (it can be changed later in Confidentialité & Sécurité). */
export function CrashReportsInviteSheet({visible, onEnable, onDecline, onOpenPolicy}: SheetProps): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Privacy by default: nothing is switched on unless the person picks "Activer" and then confirms.
  const [wantsReports, setWantsReports] = useState(false);

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onDecline}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel={t('common.close')} onPress={onDecline} style={styles.scrim} />

        <View style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 12) + 8}]}>
          <View style={styles.handle} />

          <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Image accessibilityIgnoresInvertColors resizeMode="contain" source={AWA_LOGO} style={styles.logo} />

            <AwaText accessibilityRole="header" style={styles.title} variant="titleLarge" weight="700">
              {t('privacySecurity.crashReports.sheetTitle')}
            </AwaText>

            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardCopy}>
                  <AwaText variant="titleSmall" weight="700">
                    {t('privacySecurity.crashReports.title')}
                  </AwaText>
                  <AwaText colorRole="onSurfaceVariant" style={styles.cardSubtitle} variant="bodySmall">
                    {t('privacySecurity.crashReports.subtitle')}
                  </AwaText>
                </View>
                <AwaSwitch
                  accessibilityLabel={t('privacySecurity.crashReports.title')}
                  onValueChange={setWantsReports}
                  value={wantsReports}
                />
              </View>

              <Pressable accessibilityRole="link" hitSlop={8} onPress={onOpenPolicy} style={styles.policyLink}>
                <AwaText style={styles.policyText} variant="labelMedium">
                  {t('about.privacyPolicy')}
                </AwaText>
              </Pressable>
            </View>

            <View style={styles.actions}>
              <AwaButton fullWidth label={t('common.continue')} onPress={wantsReports ? onEnable : onDecline} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Mounted once in the main tab shell. Shows the invitation only when the question was never answered, the app is unlocked (the sheet is a
 * separate native window and must never appear over the lock screen) and not already dismissed in this session. */
export default function CrashReportsInviteHost({onOpenPolicy}: {onOpenPolicy: () => void}): React.JSX.Element | null {
  const [choice, setChoice] = useState<CrashReportsChoice>(getCrashReportsChoice());
  const [loaded, setLoaded] = useState(false);
  const [lock, setLock] = useState(getAppLockState());
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    loadCrashReportsChoice().then(value => {
      if (active) {
        setChoice(value);
        setLoaded(true);
      }
    });
    const unsubscribe = subscribeCrashReportsChoice(() => setChoice(getCrashReportsChoice()));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => subscribeAppLock(() => setLock(getAppLockState())), []);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const answer = useCallback((granted: boolean) => {
    setDismissed(true);
    setCrashReportsEnabled(granted).catch(() => {});
  }, []);
  const enable = useCallback(() => answer(true), [answer]);
  const decline = useCallback(() => answer(false), [answer]);
  const openPolicy = useCallback(() => {
    // Reading the policy is not an answer: the question stays open for the next launch, but not again during this session.
    setDismissed(true);
    onOpenPolicy();
  }, [onOpenPolicy]);

  if (!loaded || !ready || dismissed || choice !== null || lock !== 'unlocked') {return null;}
  return <CrashReportsInviteSheet onDecline={decline} onEnable={enable} onOpenPolicy={openPolicy} visible />;
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
    content: {flexGrow: 1, paddingTop: 16, paddingBottom: 8},
    logo: {alignSelf: 'center', width: 140, height: 56},
    title: {marginTop: 12, textAlign: 'center'},
    card: {
      marginTop: 18,
      padding: 14,
      borderRadius: 18,
      backgroundColor: withAlpha(theme.colors.primary, 0.08),
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.16),
    },
    cardRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
    cardCopy: {flex: 1},
    cardSubtitle: {marginTop: 2},
    policyLink: {alignSelf: 'flex-start', marginTop: 10},
    policyText: {color: theme.colors.primary, textDecorationLine: 'underline'},
    actions: {marginTop: 18, gap: 8},
  });
}
