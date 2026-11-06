import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import {ONLINE_BACKUP_ENABLED} from '../../config/features';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {getAccountState, subscribeAccountState} from '../../state/accountState';
import {isOwnerActive, subscribeActiveProfileId} from '../../state/activeProfileStore';
import {canShowBackupReminder, dismissBackupReminder, markBackupReminderShown} from '../../state/backupReminderStore';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {getFloatingTabBarClearance} from '../../theme/spacing';
import {AwaButton} from '../ui/AwaButton';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';
import {GlassIcon} from '../ui/GlassIcon';

// "Sauvegarde tes données": the home screen's invitation to create an account. Shown ONLY when ONLINE_BACKUP_ENABLED is on and nobody is
// signed in — with the flag off (today) it renders nothing, so no text about an online backup ever appears.
//
// Frequency (backupReminderStore): the cross and "Plus tard" hide it for 10 days, after 3 dismissals never again, and at most once per
// calendar day — once it has been put on screen today it stays until dismissed, but a later visit the same day does not show it again.
// The home screen exists only after onboarding, so it can never appear during it. Owner profile only (not a daughter's profile).

// True while the card was put on screen in this app session and not dismissed: a remount (a profile switch) keeps showing it.
let onScreenThisSession = false;

export default function BackupReminderCard(): React.JSX.Element | null {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [signedIn, setSignedIn] = useState(() => getAccountState().isSignedIn);
  const [ownerActive, setOwnerActive] = useState(isOwnerActive);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribeAccount = subscribeAccountState(() => setSignedIn(getAccountState().isSignedIn));
    const unsubscribeProfile = subscribeActiveProfileId(() => setOwnerActive(isOwnerActive()));
    return () => {
      unsubscribeAccount();
      unsubscribeProfile();
    };
  }, []);

  const eligible = ONLINE_BACKUP_ENABLED && !signedIn && ownerActive;

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return undefined;
    }
    if (onScreenThisSession) {
      setVisible(true);
      return undefined;
    }
    let active = true;
    canShowBackupReminder().then(ok => {
      if (!active || !ok) {return;}
      onScreenThisSession = true;
      markBackupReminderShown().catch(() => {});
      setVisible(true);
    });
    return () => {active = false;};
  }, [eligible]);

  if (!eligible || !visible) {
    return null;
  }

  const dismiss = () => {
    onScreenThisSession = false;
    setVisible(false);
    dismissBackupReminder().catch(() => {});
  };

  const createAccount = () => {
    navigation.navigate('Registration');
  };

  const title = t('backupReminder.title', {defaultValue: 'Sauvegarde tes données'});

  return (
    <View pointerEvents="box-none" style={[styles.wrap, {bottom: getFloatingTabBarClearance(insets.bottom, 8)}]}>
      <View accessibilityLabel={title} style={styles.card}>
        <View style={styles.top}>
          <GlassIcon icon="cloud-upload-outline" size={44} />
          <AwaText accessibilityRole="header" emphasized style={styles.title} variant="titleSmall">{title}</AwaText>
          <AwaIconButton
            accessibilityLabel={t('backupReminder.close', {defaultValue: 'Fermer'})}
            icon="close"
            onPress={dismiss}
            size="small"
          />
        </View>

        <View style={styles.benefits}>
          {[
            t('backupReminder.benefitPhone', {defaultValue: 'Retrouve tout si tu changes de téléphone'}),
            t('backupReminder.benefitEncrypted', {defaultValue: 'Sauvegarde en ligne, chiffrée'}),
          ].map(text => (
            <View key={text} style={styles.benefit}>
              <MaterialDesignIcons color={theme.colors.primary} name="check" size={18} />
              <AwaText colorRole="onSurfaceVariant" style={styles.benefitText} variant="bodySmall">{text}</AwaText>
            </View>
          ))}
        </View>

        <AwaButton
          accessibilityLabel={t('backupReminder.createAccount', {defaultValue: 'Créer un compte'})}
          fullWidth
          label={t('backupReminder.createAccount', {defaultValue: 'Créer un compte'})}
          onPress={createAccount}
          size="large"
        />
        <AwaButton
          accessibilityLabel={t('backupReminder.later', {defaultValue: 'Plus tard'})}
          fullWidth
          label={t('backupReminder.later', {defaultValue: 'Plus tard'})}
          onPress={dismiss}
          size="compact"
          style={styles.later}
          variant="text"
        />
      </View>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    wrap: {position: 'absolute', left: 16, right: 16},
    card: {
      padding: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.2),
      backgroundColor: theme.colors.surface,
      elevation: 8,
      shadowColor: theme.shadow.shadowColor,
      shadowOffset: {width: 0, height: 6},
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    top: {flexDirection: 'row', alignItems: 'center', gap: 12},
    title: {flex: 1},
    benefits: {marginVertical: 12, gap: 6},
    benefit: {flexDirection: 'row', alignItems: 'center', gap: 8},
    benefitText: {flex: 1},
    later: {marginTop: 2},
  });
}
