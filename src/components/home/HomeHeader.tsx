import React, {memo} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeColors} from './homeTheme';

type Props = {
  firstName: string;
  subtitle: string;
  notificationCount?: number;
  onPressNotifications?: () => void;
  onPressProfile: () => void;
};

function HomeHeader({
  firstName,
  subtitle,
  notificationCount = 0,
  onPressNotifications,
  onPressProfile,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const topSpacing = Math.max(insets.top + 9, 16);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topSpacing,
        },
      ]}>
      <View style={styles.greetingCopy}>
        <Text style={styles.greeting}>
          As-salamu ‘alaykum,
        </Text>

        <Text
          numberOfLines={2}
          style={styles.name}>
          {firstName} 🌸
        </Text>

        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={
            notificationCount > 0
              ? `Notifications, ${notificationCount} non lues`
              : 'Notifications'
          }
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPressNotifications}
          style={({pressed}) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={homeColors.primary}
            name="bell-outline"
            size={22}
          />

          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text
                numberOfLines={1}
                style={styles.badgeText}>
                {notificationCount > 9
                  ? '9+'
                  : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          accessibilityLabel="Ouvrir mon profil"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPressProfile}
          style={({pressed}) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={homeColors.primary}
            name="account-outline"
            size={22}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 22,
  },

  name: {
    marginTop: 2,
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 32,
  },

  subtitle: {
    marginTop: 3,
    color: homeColors.textSecondary,
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: homeColors.primaryDark,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

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
    transform: [{scale: 0.97}],
  },
});

export default memo(HomeHeader);