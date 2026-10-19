import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {openNotificationSettings, openReminderChannelSettings, type ReminderDeliveryState} from '../../services/pregnancyNotifications';
import {AwaButton} from '../ui/AwaButton';
import {AwaText} from '../ui/AwaText';
import '../../i18n';

// The one place a person is told "your reminders cannot reach you" and given the way to fix it. Every objective's
// reminders screen and the appointment/exam form render this, so the wording, the "open settings" action and the
// "I've turned them on" re-check are identical everywhere (CLAUDE.md §1: reuse, never a second notice).
//
// It also carries one GENTLE hint, 'channel-silent': reminders reach her but make no sound because the Android
// channel is silent. That is not a failure (a mute can be deliberate), it never blocks saving and AWA never changes
// the channel itself — the card only explains the Android steps and opens the channel's page.
//
// Always render it (it draws nothing unless notifications are off or the reminders channel is blocked): after she
// comes back from Android's settings and the state flips to ready, it briefly confirms that reminders are on.

type Props = {
  /** From useReminderDeliveryState(). Only 'notifications-off', 'channel-blocked' and 'channel-silent' draw anything. */
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
  const silent = state === 'channel-silent';

  useEffect(() => {
    if (blocked) {
      wasBlocked.current = true;
      setJustEnabled(false);
    } else if (state === 'channel-silent') {
      // Notifications are allowed again; the quiet channel is only a hint, not something she "turned on".
      wasBlocked.current = false;
      setStillOff(false);
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
        <AwaText style={styles.okText} variant="bodyMedium">{t('notificationPermission.nowOn')}</AwaText>
      </View>
    );
  }

  if (silent) {
    return (
      <View style={[styles.card, styles.hintCard]} testID={testID ? `${testID}-silent` : undefined}>
        <View style={styles.headerRow}>
          <MaterialDesignIcons color={theme.colors.primary} name="volume-low" size={18} />
          <AwaText emphasized style={styles.hintTitle} variant="titleSmall">{t('notificationPermission.channelSilentTitle')}</AwaText>
        </View>
        <AwaText style={styles.body} variant="bodyMedium">{t('notificationPermission.channelSilentBody')}</AwaText>
        <AwaText style={styles.body} variant="bodyMedium">
          {t('notificationPermission.channelSilentSteps', {channel: t('notifications.channelName')})}
        </AwaText>
        <View style={styles.actions}>
          <AwaButton
            accessibilityLabel={t('notificationPermission.openSettings')}
            label={t('notificationPermission.openSettings')}
            onPress={() => {openReminderChannelSettings().catch(() => {});}}
          />
        </View>
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
    setStillOff(next !== 'ready' && next !== 'channel-silent');
  };

  return (
    <View accessibilityRole="alert" style={styles.card} testID={testID}>
      <View style={styles.headerRow}>
        <MaterialDesignIcons color={theme.colors.danger} name="bell-off-outline" size={18} />
        <AwaText colorRole="error" emphasized style={styles.title} variant="titleSmall">
          {channel ? t('notificationPermission.channelBlockedTitle') : t('notificationPermission.blockedTitle')}
        </AwaText>
      </View>
      <AwaText style={styles.body} variant="bodyMedium">
        {channel ? t('notificationPermission.channelBlockedBody') : t('notificationPermission.blockedBody')}
      </AwaText>

      <View style={styles.actions}>
        <AwaButton
          accessibilityLabel={t('notificationPermission.openSettings')}
          label={t('notificationPermission.openSettings')}
          onPress={() => {openNotificationSettings().catch(() => {});}}
        />
        {onRecheck ? (
          <AwaButton
            accessibilityLabel={t('notificationPermission.recheck')}
            label={t('notificationPermission.recheck')}
            onPress={() => {recheck().catch(() => {});}}
            variant="outlined"
          />
        ) : null}
      </View>

      {stillOff ? (
        <AwaText colorRole="error" style={styles.feedback} variant="bodySmall">{t('notificationPermission.stillOff')}</AwaText>
      ) : null}

      {onContinue ? (
        <AwaButton
          accessibilityLabel={t('notificationPermission.continueWithout')}
          label={t('notificationPermission.continueWithout')}
          onPress={onContinue}
          style={styles.continueButton}
          variant="text"
        />
      ) : null}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    card: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
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
    hintCard: {
      backgroundColor: withAlpha(theme.colors.primarySoft, 0.9),
      borderColor: withAlpha(theme.colors.primary, 0.2),
    },
    hintTitle: {flex: 1},
    okText: {flex: 1},
    headerRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    title: {flex: 1},
    body: {marginTop: 6},
    actions: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
    feedback: {marginTop: 8},
    continueButton: {marginTop: 4},
  });
}

export default NotificationPermissionNotice;
