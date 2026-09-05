import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Switch, Text, useWindowDimensions, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getPrivacySecuritySettings, isBiometricEnabled, isPinEnabled, loadSecurityPreferences, updatePrivacySecuritySettings, type PrivacySecuritySettings} from '../state/securityPreferences';
import {getAvailableBiometry} from '../services/appSecurityService';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacySecurity'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

function SettingRow({
  icon, title, subtitle, status, onPress, last, danger, toggle, onToggle, theme, styles,
}: {
  icon: IconName; title: string; subtitle: string; status?: string; onPress?: () => void;
  last?: boolean; danger?: boolean; toggle?: boolean; onToggle?: (value: boolean) => void;
  theme: ResolvedAwaTheme; styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityLabel={title}
      disabled={!onPress && !onToggle}
      onPress={onPress}
      style={({pressed}) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <MaterialDesignIcons color={danger ? theme.colors.danger : theme.colors.primary} name={icon} size={19} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {onToggle ? (
        <Switch
          ios_backgroundColor={theme.colors.surfaceSecondary}
          onValueChange={onToggle}
          // Fixed native-switch thumb — platform control affordance, not
          // an app surface (same justification as AppearanceScreen's E1
          // True Black switch).
          thumbColor="#FFF"
          trackColor={{false: theme.colors.surfaceSecondary, true: theme.colors.primary}}
          value={Boolean(toggle)}
        />
      ) : (
        <>
          {status ? <Text style={styles.status}>{status}</Text> : null}
          {onPress ? <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={22} /> : null}
        </>
      )}
    </Pressable>
  );
}

export default function PrivacySecurityScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [settings, setSettings] = useState(getPrivacySecuritySettings());
  const [pin, setPin] = useState(isPinEnabled());
  const [bio, setBio] = useState(isBiometricEnabled());
  const [biometryLabel, setBiometryLabel] = useState('Biométrie');

  useEffect(() => {
    loadSecurityPreferences().then(() => {
      setSettings(getPrivacySecuritySettings());
      setPin(isPinEnabled());
      setBio(isBiometricEnabled());
    });
    getAvailableBiometry().then(value => {
      if (value) {setBiometryLabel(value.label);}
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    setPin(isPinEnabled());
    setBio(isBiometricEnabled());
    setSettings(getPrivacySecuritySettings());
  }, []));

  const change = <K extends keyof PrivacySecuritySettings>(key: K, value: PrivacySecuritySettings[K]) =>
    setSettings(updatePrivacySecuritySettings({[key]: value}));

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safe}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
          {paddingTop: Math.max(insets.top, 18) + 8, paddingBottom: Math.max(insets.bottom, 18) + 25},
        ]}
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable accessibilityLabel="Retour" onPress={navigation.goBack} style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text adjustsFontSizeToFit minimumFontScale={0.78} style={styles.title}>Confidentialité & Sécurité</Text>
            <Text style={styles.subtitle}>Tes données, ta vie privée, ton choix 💜</Text>
          </View>
          <View style={styles.decor}>
            <MaterialDesignIcons color={theme.colors.primary} name="shield-lock-outline" size={39} />
            <MaterialDesignIcons color={theme.colors.secondary} name="leaf" size={34} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(70).duration(420)} style={styles.intro}>
          <View style={styles.introIcon}>
            <MaterialDesignIcons color={theme.colors.primary} name="shield-account-outline" size={28} />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Tu es aux commandes 🔒</Text>
            <Text style={styles.introText}>Gère la confidentialité de tes données et choisis les protections qui te conviennent.</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Accès et protection</Text>
        <Animated.View entering={FadeInUp.delay(130).duration(420)} style={styles.card}>
          <SettingRow
            icon="lock-outline" onPress={() => navigation.navigate('PinManagement')}
            status={pin ? 'Activé' : 'Inactif'} styles={styles} theme={theme} title="Code PIN"
            subtitle={pin ? 'Appuie pour modifier ou désactiver' : 'Protéger l’accès à ton application'}
          />
          <SettingRow
            icon="fingerprint" onPress={() => navigation.navigate('FaceIdSetup', {action: bio ? 'manage' : 'enable'})}
            status={bio ? 'Activée' : 'Inactive'} styles={styles} theme={theme} title={biometryLabel}
            subtitle={bio ? 'Appuie pour tester ou désactiver' : 'Déverrouillage natif sécurisé'}
          />
          <SettingRow
            icon="eye-off-outline" onToggle={value => change('discreetMode', value)} styles={styles} theme={theme}
            subtitle="Masquer le contenu sensible de l’application" title="Mode discret / pudeur" toggle={settings.discreetMode}
          />
          <SettingRow
            icon="bell-outline" onToggle={value => change('discreetNotifications', value)} styles={styles} theme={theme}
            subtitle="Utiliser des notifications discrètes" title="Notifications discrètes" toggle={settings.discreetNotifications}
          />
          <SettingRow
            icon="cellphone-lock" onToggle={value => change('hideNotificationPreview', value)} styles={styles} theme={theme}
            subtitle="Ne pas afficher le contenu sur l’écran verrouillé" title="Masquer l’aperçu des notifications" toggle={settings.hideNotificationPreview}
          />
          <SettingRow
            last icon="shape-outline" onPress={() => navigation.navigate('DiscreetLauncher')} styles={styles} theme={theme}
            subtitle="Nom et icône de l’application sur l’écran d’accueil" title="Apparence discrète"
          />
        </Animated.View>

        <Text style={styles.sectionTitle}>Contenu sensible</Text>
        <Animated.View entering={FadeInUp.delay(190).duration(420)} style={styles.card}>
          <SettingRow
            icon="heart-outline" onPress={() => change('intimacyProtection', !settings.intimacyProtection)}
            status={settings.intimacyProtection ? 'Activée' : 'Inactive'} styles={styles} theme={theme}
            subtitle="Verrouiller la section Vie intime" title="Protection de Vie intime"
          />
          <SettingRow
            last icon="image-lock-outline" onPress={() => change('privateContentProtection', !settings.privateContentProtection)}
            status={settings.privateContentProtection ? 'Activée' : 'Inactive'} styles={styles} theme={theme}
            subtitle="Verrouiller tes notes et photos personnelles" title="Protection des Notes / Photos privées"
          />
        </Animated.View>

        <Text style={styles.sectionTitle}>Compte et données</Text>
        <Animated.View entering={FadeInUp.delay(250).duration(420)} style={styles.card}>
          <SettingRow
            icon="account-outline" onPress={() => navigation.navigate('AnonymousMode')}
            status={settings.anonymousMode ? 'Activé' : 'Inactif'} styles={styles} theme={theme}
            subtitle="Utiliser l’application sans partager ton identité" title="Mode anonyme"
          />
          <SettingRow
            icon="cloud-outline" onPress={() => navigation.navigate('DataManagement')} styles={styles} theme={theme}
            subtitle="Voir, exporter ou supprimer tes données" title="Gestion des données"
          />
          <SettingRow
            danger last icon="delete-outline" onPress={() => navigation.navigate('DeleteAccount')} styles={styles} theme={theme}
            subtitle="Supprimer définitivement ton compte et tes données" title="Supprimer mon compte"
          />
        </Animated.View>

        <View style={styles.info}>
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={21} />
          <Text style={styles.infoText}>Tes paramètres de confidentialité restent sous ton contrôle.{'\n'}Tu peux les modifier à tout moment.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    content: {flexGrow: 1, gap: 12, paddingHorizontal: 16},
    contentCompact: {paddingHorizontal: 11},
    header: {flexDirection: 'row', alignItems: 'center'},
    back: {
      alignItems: 'center', justifyContent: 'center', borderRadius: 999,
      backgroundColor: theme.colors.surface, padding: 9, elevation: 2,
    },
    headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 9},
    title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 23, fontWeight: '700'},
    subtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 17},
    decor: {flexDirection: 'row', alignItems: 'center'},
    intro: {
      flexDirection: 'row', alignItems: 'center', borderWidth: 1,
      borderColor: withAlpha(theme.colors.primary, 0.10), borderRadius: 24,
      backgroundColor: theme.colors.surfaceSecondary, padding: 15,
    },
    introIcon: {
      alignItems: 'center', justifyContent: 'center', borderRadius: 999,
      backgroundColor: theme.colors.primarySoft, padding: 13,
    },
    introCopy: {flex: 1, marginLeft: 12},
    introTitle: {color: theme.colors.text, fontSize: 15, fontWeight: '700'},
    introText: {marginTop: 5, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
    sectionTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
    card: {
      overflow: 'hidden', borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.08),
      borderRadius: 24, backgroundColor: theme.colors.surface, paddingHorizontal: 11,
    },
    row: {minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingVertical: 10},
    rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: withAlpha(theme.colors.primary, 0.08)},
    rowIcon: {alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primarySoft, padding: 9},
    dangerIcon: {backgroundColor: withAlpha(theme.colors.danger, 0.15)},
    rowCopy: {flex: 1, minWidth: 0, marginHorizontal: 10},
    rowTitle: {color: theme.colors.text, fontSize: 13.5, fontWeight: '700'},
    dangerText: {color: theme.colors.danger},
    rowSubtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
    status: {color: theme.colors.primary, fontSize: 11, fontWeight: '600', marginRight: 3},
    info: {flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: theme.colors.primarySoft, padding: 14},
    infoText: {flex: 1, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 17},
    pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
  });
}
