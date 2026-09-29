import React, { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAwaTheme } from '../../theme/AwaThemeProvider';
import '../../i18n';
import { withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import InAppNotificationCenter from './InAppNotificationCenter';
import {
  getUnreadInAppNotificationCountForActiveProfile,
  hydrateInAppNotifications,
  subscribeInAppNotifications,
} from '../../state/inAppNotificationStore';
import { subscribeActiveProfileId } from '../../state/activeProfileStore';
import { reconcileInAppNotifications } from '../../services/inAppNotificationReconciliation';

// PHASE C — the unread-count badge below is a fixed semantic "unread" red,
// deliberately NOT sourced from `theme.colors.*` (see Step 12 of the Phase C
// spec: "if a notification badge uses semantic red to communicate unread
// state, preserve it"). Everything else here (text, icons, icon-button
// chrome, shadow) is decorative and now theme-driven.

type Props = {
  firstName: string;
  subtitle: string;
  onPressProfile: () => void;
};

function HomeHeader({
  firstName,
  subtitle,
  onPressProfile,
}: Props): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [panelVisible, setPanelVisible] = useState(false);
  // Scoped to whichever profile is CURRENTLY active — the mother and each
  // managed daughter profile see only their own unread count, never mixed
  // together (CLAUDE.md §4 objective isolation).
  const [storedUnreadCount, setStoredUnreadCount] = useState(
    getUnreadInAppNotificationCountForActiveProfile,
  );

  useEffect(() => {
    let active = true;
    hydrateInAppNotifications().then(() => {
      if (active) {
        setStoredUnreadCount(getUnreadInAppNotificationCountForActiveProfile());
      }
    });
    const unsubscribe = subscribeInAppNotifications(() => {
      if (active) {
        setStoredUnreadCount(getUnreadInAppNotificationCountForActiveProfile());
      }
    });
    // A profile switch alone (no new notification) must also immediately
    // recompute the badge — e.g. mother 2 unread → Haifa active → badge
    // becomes Haifa's own 1 unread, with no restart/reopen required.
    const unsubscribeProfile = subscribeActiveProfileId(() => {
      if (active) {
        setStoredUnreadCount(getUnreadInAppNotificationCountForActiveProfile());
      }
    });
    return () => {
      active = false;
      unsubscribe();
      unsubscribeProfile();
    };
  }, []);

  const unreadCount = storedUnreadCount;

  const topSpacing = Math.max(insets.top + 9, 16);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topSpacing,
        },
      ]}
    >
      <View style={styles.greetingCopy}>
        <Text style={styles.greeting}>{t('cycleHome.greeting')}</Text>

        {firstName.trim().length > 0 && (
          <Text numberOfLines={2} style={styles.name}>
            {firstName} 🌸
          </Text>
        )}

        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={
            unreadCount > 0
              ? t('homeHeader.notificationsUnread', { count: unreadCount })
              : t('homeHeader.notifications')
          }
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            setPanelVisible(true);
            reconcileInAppNotifications().catch(() => {});
          }}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="bell-outline"
            size={22}
          />

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text numberOfLines={1} style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel={t('homeHeader.openProfile')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPressProfile}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialDesignIcons
            color={theme.colors.primary}
            name="account-outline"
            size={22}
          />
        </Pressable>
      </View>
      <InAppNotificationCenter
        onClose={() => setPanelVisible(false)}
        visible={panelVisible}
      />
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },

    greetingCopy: {
      flex: 1,
      marginRight: 12,
      minWidth: 0,
    },

    greeting: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 17,
      lineHeight: 22,
    },

    name: {
      marginTop: 2,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 25,
      fontWeight: '700',
      lineHeight: 32,
    },

    subtitle: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },

    actions: {
      flexDirection: 'row',
      gap: 10,
      flexShrink: 0,
    },

    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: withAlpha(theme.colors.surface, 0.85),
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },

    // SEMANTIC — fixed unread-notification red, never theme-driven.
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: '#E24C5C',
    },

    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
    },

    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.97 }],
    },
  });
}

export default memo(HomeHeader);
