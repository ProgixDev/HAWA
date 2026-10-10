import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {openNotificationSettings, type ReminderDeliveryState} from '../../services/pregnancyNotifications';
import '../../i18n';

// The one place a person is told "your reminders cannot reach you" and given the way to fix it. Every objective's
// reminders screen and the appointment/exam form render this, so the wording, the "open settings" action and the
// "I've turned them on" re-check are identical everywhere (CLAUDE.md §1: reuse, never a second notice).
//
// Always render it (it draws nothing unless notifications are off or the reminders channel is blocked): after she
// comes back from Android's settings and the state flips to ready, it briefly confirms that reminders are on.

type Props = {
  /** From useReminderDeliveryState(). Only 'notifications-off' and 'channel-blocked' draw anything. */
  state: ReminderDeliveryState;
  /** Re-reads Android's state (the hook's `refresh`). Shows the "I've turned them on" button when provided. */
  onRecheck?: () => Promise<ReminderDeliveryState>;
  /** Onboarding steps: lets her carry on without notifications instead of being stuck on the screen. */
  onContinue?: () => void;
  testID?: string;
};

function NotificationPermissionNotice({state, onRecheck, onContinue, testID}: Props): React.JSX.Element | null {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [stillOff, setStillOff] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);
  const wasBlocked = useRef(false);

  const blocked = state === 'notifications-off' || state === 'channel-blocked';

  useEffect(() => {
    if (blocked) {
      wasBlocked.current = true;
      setJustEnabled(false);
    } else if (state === 'ready' && wasBlocked.current) {
      wasBlocked.current = false;
      setStillOff(false);
      setJustEnabled(true);
    }
  }, [blocked, state]);

  if (justEnabled && !blocked) {
    return (
      <View accessibilityLiveRegion="polite" style={[styles.card, styles.okCard]} testID={testID ? `${testID}-enabled` : undefined}>
        <MaterialDesignIcons color={theme.colors.primary} name="bell-check-outline" size={18} />
        <Text style={styles.okText}>{t('notificationPermission.nowOn')}</Text>
      </View>
    );
  }

  if (!blocked) {
    return null;
  }

  const channel = state === 'channel-blocked';

  const recheck = async () => {
    if (!onRecheck) {return;}
    const next = await onRecheck();
    setStillOff(next !== 'ready');
  };

  return (
    <View accessibilityRole="alert" style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        <MaterialDesignIcons color={theme.colors.danger} name="bell-off-outline" size={18} />
        <Text style={styles.title}>
          {channel ? t('notificationPermission.channelBlockedTitle') : t('notificationPermission.blockedTitle')}
        </Text>
      </View>
      <Text style={styles.body}>
        {channel ? t('notificationPermission.channelBlockedBody') : t('notificationPermission.blockedBody')}
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={t('notificationPermission.openSettings')}
          accessibilityRole="button"
          onPress={() => {openNotificationSettings().catch(() => {});}}
          style={({pressed}) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryButtonText}>{t('notificationPermission.openSettings')}</Text>
        </Pressable>
        {onRecheck ? (
          <Pressable
            accessibilityLabel={t('notificationPermission.recheck')}
            accessibilityRole="button"
            onPress={() => {recheck().catch(() => {});}}
            style={({pressed}) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>{t('notificationPermission.recheck')}</Text>
          </Pressable>
        ) : null}
      </View>

      {stillOff ? <Text style={styles.feedback}>{t('notificationPermission.stillOff')}</Text> : null}

      {onContinue ? (
        <Pressable
          accessibilityLabel={t('notificationPermission.continueWithout')}
          accessibilityRole="button"
          onPress={onContinue}
          style={({pressed}) => [styles.continueButton, pressed && styles.pressed]}>
          <Text style={styles.continueText}>{t('notificationPermission.continueWithout')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: 14,
      backgroundColor: withAlpha(theme.colors.danger, 0.1),
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.15),
    },
    okCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: withAlpha(theme.colors.primarySoft, 0.9),
      borderColor: withAlpha(theme.colors.primary, 0.2),
    },
    okText: {flex: 1, color: theme.colors.text, fontSize: 12, lineHeight: 17},
    headerRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    title: {flex: 1, color: theme.colors.danger, fontSize: 13, fontWeight: '800'},
    body: {marginTop: 6, color: theme.colors.text, fontSize: 12, lineHeight: 17},
    actions: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10},
    primaryButton: {
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 14,
    },
    primaryButtonText: {color: onPrimaryTextColor(theme), fontSize: 12, fontWeight: '800'},
    secondaryButton: {
      minHeight: 40,
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.danger, 0.3),
      paddingHorizontal: 14,
    },
    secondaryButtonText: {color: theme.colors.danger, fontSize: 12, fontWeight: '700'},
    feedback: {marginTop: 8, color: theme.colors.danger, fontSize: 11.5, lineHeight: 16},
    continueButton: {minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: 6},
    continueText: {color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline'},
    pressed: {opacity: 0.85},
  });
}

export default NotificationPermissionNotice;
