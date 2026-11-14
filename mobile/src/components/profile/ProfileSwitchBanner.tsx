import React, {memo, useMemo} from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

import {useProfileSwitch} from '../../hooks/useProfileSwitch';
import {OWNER_PROFILE_ID} from '../../state/activeProfileStore';
import type {ManagedProfile} from '../../state/managedProfilesStore';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaText} from '../ui/AwaText';

const DAUGHTER_ILLUSTRATION = require('../../assets/images/fille.png');

// Shown at the top of the Home (inside HomeHeader) as soon as a daughter profile exists:
//  - in the mother's space: one big button per daughter — "Basculer sur le profil de Lina";
//  - in a daughter's space: the same-sized button back — "Revenir à mon profil" — so the two spaces are one tap apart.
// The wording is passed with a French `defaultValue` (new copy, not yet in the translation files).
function Avatar({profile, styles}: {profile: ManagedProfile; styles: ReturnType<typeof createStyles>}) {
  return (
    <View style={styles.avatar}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode={profile.profileImageUri ? 'cover' : 'contain'}
        source={profile.profileImageUri ? {uri: profile.profileImageUri} : DAUGHTER_ILLUSTRATION}
        style={styles.avatarImage}
      />
    </View>
  );
}

function ProfileSwitchBanner(): React.JSX.Element | null {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {daughters, activeDaughter, switchTo} = useProfileSwitch();

  if (daughters.length === 0) {
    return null;
  }

  if (activeDaughter) {
    const title = t('profileSwitch.backToMine', {defaultValue: 'Revenir à mon profil'});
    return (
      <View style={styles.outer}>
        <Pressable
          accessibilityLabel={title}
          accessibilityRole="button"
          onPress={() => switchTo(OWNER_PROFILE_ID)}
          style={({pressed}) => [styles.banner, pressed && styles.pressed]}>
          <Avatar profile={activeDaughter} styles={styles} />
          <View style={styles.copy}>
            <AwaText colorRole="primary" emphasized variant="labelMedium">
              {t('profileSwitch.herSpace', {name: activeDaughter.firstName, defaultValue: 'Espace de {{name}}'})}
            </AwaText>
            <AwaText emphasized numberOfLines={2} variant="titleMedium">{title}</AwaText>
          </View>
          <MaterialDesignIcons color={theme.colors.primary} name="swap-horizontal" size={26} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.outer, styles.stack]}>
      {daughters.map(profile => {
        const title = t('profileSwitch.switchTo', {name: profile.firstName, defaultValue: 'Basculer sur le profil de {{name}}'});
        return (
          <Pressable
            accessibilityLabel={title}
            accessibilityRole="button"
            key={profile.id}
            onPress={() => switchTo(profile.id)}
            style={({pressed}) => [styles.banner, pressed && styles.pressed]}>
            <Avatar profile={profile} styles={styles} />
            <View style={styles.copy}>
              <AwaText emphasized numberOfLines={2} variant="titleMedium">{title}</AwaText>
              <AwaText colorRole="onSurfaceVariant" variant="bodySmall">
                {t('profileSwitch.separateSpace', {defaultValue: 'Son espace, séparé du tien'})}
              </AwaText>
            </View>
            <MaterialDesignIcons color={theme.colors.primary} name="swap-horizontal" size={26} />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    outer: {paddingHorizontal: 16, paddingBottom: 8},
    stack: {gap: 10},
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 72,
      borderWidth: 1.5,
      borderColor: withAlpha(theme.colors.primary, 0.4),
      borderRadius: 16,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    avatar: {
      width: 52,
      height: 52,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 26,
      borderWidth: 2,
      borderColor: theme.colors.surface,
      backgroundColor: theme.colors.surface,
    },
    avatarImage: {width: '100%', height: '100%'},
    copy: {flex: 1, minWidth: 0},
    pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
  });
}

export default memo(ProfileSwitchBanner);
