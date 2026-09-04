import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { navigationRef } from '../../navigation/navigationRef';
import {
  clearAllInAppNotifications,
  clearInAppNotification,
  getInAppNotifications,
  hydrateInAppNotifications,
  markAllInAppNotificationsAsRead,
  markInAppNotificationAsRead,
  subscribeInAppNotifications,
  type InAppNotification,
} from '../../state/inAppNotificationStore';
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import type { ResolvedAwaTheme } from '../../theme/awaThemeTokens';

// PHASE C — every color here is decorative chrome (no health/tracking
// meaning); the one exception is the "Tout effacer" destructive action,
// deliberately mapped to `theme.colors.danger` (the resolved theme's own
// per-palette "this is risky" token) rather than left as a hardcoded red —
// this is a generic destructive-action affordance, not the kind of fixed
// semantic color Phase C protects (that's HomeHeader's unread badge).

type Props = { visible: boolean; onClose: () => void };

const formatReceivedAt = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const time = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  if (day.getTime() === today.getTime()) {
    return `Aujourd’hui · ${time}`;
  }
  if (day.getTime() === yesterday.getTime()) {
    return `Hier · ${time}`;
  }
  return `${new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)} · ${time}`;
};

// French display label for the "objective/category" this notification came
// from, shown next to its date. Purely cosmetic — never used for routing or
// persistence, so a missing/unrecognized type only ever omits the label.
const CATEGORY_LABELS: Record<string, string> = {
  'postpartum-nifas': 'Nifas',
  'conception-reminder': 'Essayer de concevoir',
  'cycle-reminder': 'Cycle menstruel',
  'irregular-reminder': 'SOPK',
  'contraception-reminder': 'Contraception',
  'pregnancy-reminder': 'Grossesse',
  'postpartum-daily-tracking-reminder': 'Post-partum',
  'menopause-daily-tracking-reminder': 'Ménopause',
  'menopause-treatment-reminder': 'Ménopause',
  'qadaa-post-ramadan': 'Jeûne (Qadaa)',
  'miscarriage-daily-tracking-reminder': 'Après une fausse couche',
};

function iconForType(type: string): string {
  if (type === 'postpartum-nifas') {
    return 'bell-ring-outline';
  }
  if (type === 'conception-reminder') {
    return 'bell-outline';
  }
  if (type in CATEGORY_LABELS) {
    return 'calendar-clock-outline';
  }
  return 'bell-outline';
}

function NotificationItem({
  notification,
  onOpen,
  onDelete,
  theme,
  styles,
}: {
  notification: InAppNotification;
  onOpen: () => void;
  onDelete: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  const categoryLabel = CATEGORY_LABELS[notification.type];

  return (
    <Pressable
      accessibilityLabel={`${notification.title}. ${notification.message}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.item,
        !notification.read && styles.itemUnread,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.itemIcon}>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={iconForType(notification.type) as never}
          size={18}
        />
      </View>
      <View style={styles.itemCopy}>
        <View style={styles.itemTitleRow}>
          {!notification.read ? <View style={styles.unreadDot} /> : null}
          <Text
            numberOfLines={1}
            style={[
              styles.itemTitle,
              notification.read && styles.itemTitleRead,
            ]}
          >
            {notification.title}
          </Text>
        </View>
        <Text numberOfLines={2} style={styles.itemMessage}>
          {notification.message}
        </Text>
        <Text style={styles.itemDate}>
          {formatReceivedAt(notification.receivedAt)}
          {categoryLabel ? ` · ${categoryLabel}` : ''}
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Supprimer cette notification"
        accessibilityRole="button"
        hitSlop={8}
        onPress={event => {
          event.stopPropagation();
          onDelete();
        }}
        style={styles.deleteButton}
      >
        <MaterialDesignIcons color={theme.colors.textMuted} name="close" size={16} />
      </Pressable>
    </Pressable>
  );
}

function InAppNotificationCenter({
  visible,
  onClose,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { theme } = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const entrance = useRef(new Animated.Value(0)).current;
  const [overflowVisible, setOverflowVisible] = useState(false);
  const [notifications, setNotifications] = useState(getInAppNotifications);

  useEffect(() => {
    let active = true;
    hydrateInAppNotifications().then(value => {
      if (active) {
        setNotifications(value);
      }
    });
    const unsubscribe = subscribeInAppNotifications(() => {
      if (active) {
        setNotifications(getInAppNotifications());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      setOverflowVisible(false);
      return;
    }
    Animated.timing(entrance, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance, visible]);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications],
  );

  const openNotification = async (
    notification: InAppNotification,
  ): Promise<void> => {
    await markInAppNotificationAsRead(notification.id);
    onClose();
    if (
      notification.route === 'ArticleReader' &&
      notification.data?.articleId &&
      navigationRef.isReady()
    ) {
      navigationRef.navigate('ArticleReader', {
        articleId: notification.data.articleId,
      });
      return;
    }
    if (notification.route === 'conception-reminder' && navigationRef.isReady()) {
      const reminderType = notification.data?.conceptionReminderType;
      if (reminderType === 'temperature') {
        navigationRef.navigate('TemperatureEntry');
      } else if (reminderType === 'lh_test') {
        navigationRef.navigate('LHTestEntry');
      } else {
        // fertile_window / estimated_ovulation / daily_journal — the TTC
        // Dashboard; "Journal quotidien" is a context-based bottom sheet,
        // not a stack route, so it can't be deep-linked into from here.
        navigationRef.navigate('MainTabs', { screen: 'CycleHome' });
      }
      return;
    }
    if (notification.route === 'menopause-treatment-reminder' && navigationRef.isReady()) {
      // Same destination as menopauseReminderNotificationNavigation.ts's own
      // OS-notification-tap handling for this exact reminder kind.
      navigationRef.navigate('MenopauseJournalEntry', { category: 'treatment' });
      return;
    }
    if (notification.route === 'qadaa-reminder' && navigationRef.isReady()) {
      navigationRef.navigate('FastingQadaa');
      return;
    }
    if (notification.route === 'miscarriage-journal' && navigationRef.isReady()) {
      // The existing Miscarriage journal entry screen — the real place this
      // gentle "comment tu te sens" check-in can actually be recorded
      // (bleeding/physical symptoms live under their own dedicated
      // categories; 'personalNotes' is the closest match to an open-ended
      // daily check-in, never a specific symptom prompt).
      navigationRef.navigate('MiscarriageJournalEntry', { category: 'personalNotes' });
      return;
    }
    if (notification.route === 'objective-home' && navigationRef.isReady()) {
      // Cycle / SOPK / Contraception / Pregnancy / Postpartum daily-tracking /
      // Menopause daily-tracking reminders — the objective-aware Home screen
      // already renders the correct dashboard for whichever objective is
      // active, exactly like TTC's own fallback above.
      navigationRef.navigate('MainTabs', { screen: 'CycleHome' });
    }
  };

  const confirmClearAll = (): void => {
    setOverflowVisible(false);
    Alert.alert(
      'Effacer les notifications ?',
      'Cette action efface uniquement l’historique dans AWA.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout effacer',
          style: 'destructive',
          onPress: () => clearAllInAppNotifications().catch(() => {}),
        },
      ],
    );
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityLabel="Fermer les notifications"
          onPress={onClose}
          style={styles.backdrop}
        />
        <Animated.View
          style={[
            styles.popup,
            { top: Math.max(insets.top + 60, 72) },
            {
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    markAllInAppNotificationsAsRead().catch(() => {})
                  }
                  style={styles.readAllButton}
                >
                  <Text style={styles.readAllText}>Tout lire</Text>
                </Pressable>
              ) : null}
              {notifications.length > 0 ? (
                <Pressable
                  accessibilityLabel="Plus d’actions"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setOverflowVisible(value => !value)}
                  style={styles.moreButton}
                >
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="dots-horizontal"
                    size={21}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="bell-outline"
                  size={27}
                />
              </View>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptyText}>
                Tes rappels importants apparaîtront ici.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDelete={() =>
                    clearInAppNotification(notification.id).catch(() => {})
                  }
                  onOpen={() => openNotification(notification).catch(() => {})}
                  styles={styles}
                  theme={theme}
                />
              ))}
            </ScrollView>
          )}

          {overflowVisible ? (
            <Pressable
              accessibilityRole="button"
              onPress={confirmClearAll}
              style={styles.overflowMenu}
            >
              <MaterialDesignIcons
                color={theme.colors.danger}
                name="trash-can-outline"
                size={15}
              />
              <Text style={styles.overflowText}>Tout effacer</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    modalRoot: { flex: 1 },
    // Modal backdrop — deliberately theme-independent (a dark dim always
    // reads correctly behind a modal, in both light and dark mode; flipping
    // it light in dark mode would stop dimming the screen behind it).
    backdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(31, 20, 58, 0.18)',
    },
    popup: {
      position: 'absolute',
      right: 16,
      left: 16,
      maxHeight: '54%',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      padding: 14,
      ...theme.shadow,
    },
    header: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: {
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 19,
      fontWeight: '800',
    },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    readAllButton: {
      borderRadius: 11,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    readAllText: { color: theme.colors.primary, fontSize: 10.5, fontWeight: '800' },
    moreButton: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
    },
    overflowMenu: {
      position: 'absolute',
      zIndex: 20,
      top: 54,
      right: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 9,
      ...theme.shadow,
      elevation: 20,
    },
    overflowText: { color: theme.colors.danger, fontSize: 10.5, fontWeight: '700' },
    list: { gap: 7, paddingTop: 10 },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      borderRadius: 15,
      backgroundColor: theme.colors.surface,
      paddingVertical: 9,
      paddingHorizontal: 8,
    },
    itemUnread: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.primarySoft,
    },
    itemIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.primarySoft,
    },
    itemCopy: { flex: 1, minWidth: 0, marginLeft: 8 },
    itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    unreadDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    itemTitle: {
      flexShrink: 1,
      color: theme.colors.text,
      fontSize: 11.5,
      fontWeight: '800',
    },
    itemTitleRead: { color: theme.colors.textMuted, fontWeight: '700' },
    itemMessage: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 9.5,
      lineHeight: 13,
    },
    itemDate: {
      marginTop: 4,
      color: theme.colors.textMuted,
      fontSize: 8.5,
      fontWeight: '600',
    },
    deleteButton: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 3,
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 24,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 28,
      backgroundColor: theme.colors.primarySoft,
    },
    emptyTitle: {
      marginTop: 11,
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    emptyText: {
      marginTop: 4,
      color: theme.colors.textSecondary,
      fontSize: 10,
      textAlign: 'center',
    },
    pressed: { opacity: 0.74, transform: [{ scale: 0.98 }] },
  });
}

export default InAppNotificationCenter;
