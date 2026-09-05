import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Easing, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getPrivacySecuritySettings,
  isBiometricEnabled,
  isPinEnabled,
  loadSecurityPreferences,
  subscribePrivacySecuritySettings,
  subscribeSecurityPreferences,
} from '../state/securityPreferences';

const HERO = require('../assets/images/privacy/anonymous-mode-woman.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AnonymousMode'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const BACKGROUND = '#F7F5FA';
const SURFACE = '#F1EDF7';
const CARD = '#FFFFFF';
const TEXT_PRIMARY = '#28223A';
const TEXT_SECONDARY = '#716A7D';
const PURPLE = '#6547B8';
const PURPLE_DEEP = '#3D2A79';
const LAVENDER = '#EEE8F7';
const BORDER = '#DED7E8';
const SUCCESS = '#559579';

const PRIVACY_ROWS: ReadonlyArray<{key: string; icon: IconName; title: string}> = [
  {key: 'name', icon: 'account-off-outline', title: 'Aucun nom requis'},
  {key: 'email', icon: 'email-off-outline', title: 'Aucune adresse e-mail requise'},
  {key: 'account', icon: 'link-off', title: 'Aucun compte Google ou Apple associé'},
  {key: 'profile', icon: 'shield-account-outline', title: 'Profil dissocié de ton identité'},
];

// What is/isn't retained while Anonymous Mode is active — shown on the
// management view (spec: "E-mail / Nom / Identifiants techniques — Non
// conservés"). Kept separate from PRIVACY_ROWS above (that one explains the
// onboarding promise before activation; this one confirms it afterwards).
const RETENTION_ROWS: ReadonlyArray<{key: string; icon: IconName; label: string}> = [
  {key: 'email', icon: 'email-off-outline', label: 'E-mail'},
  {key: 'name', icon: 'account-off-outline', label: 'Nom'},
  {key: 'technical', icon: 'key-outline', label: 'Identifiants techniques'},
];

function FadeInUp({
  children,
  delay = 0,
  distance = 15,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
}): React.JSX.Element {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 450,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [distance, 0]})}],
      }}>
      {children}
    </Animated.View>
  );
}

export default function AnonymousModeScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const source = route.params?.source;
  const [enabled, setEnabled] = useState(() => getPrivacySecuritySettings().anonymousMode);
  const [locked, setLocked] = useState(() => isPinEnabled() || isBiometricEnabled());

  const refresh = useCallback(() => {
    setEnabled(getPrivacySecuritySettings().anonymousMode);
    setLocked(isPinEnabled() || isBiometricEnabled());
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSecurityPreferences().then(() => {if (active) {refresh();}});
      const unsubscribeSettings = subscribePrivacySecuritySettings(refresh);
      const unsubscribeSecurity = subscribeSecurityPreferences(refresh);
      return () => {
        active = false;
        unsubscribeSettings();
        unsubscribeSecurity();
      };
    }, [refresh]),
  );

  const proceed = () => {
    navigation.navigate('AnonymousModeLimitations', {source});
  };

  // Already active — management view instead of the onboarding pitch. Does
  // NOT restart activation and does NOT disable Anonymous Mode from here;
  // that only happens after a real account is created (RegistrationScreen).
  if (enabled) {
    return (
      <View style={styles.page}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

        <View pointerEvents="none" style={styles.backgroundDecoration}>
          <View style={styles.blobTopRight} />
          <View style={styles.blobLeft} />
          <View style={styles.blobBottom} />
        </View>

        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={10}
              onPress={navigation.goBack}
              style={({pressed}) => [styles.back, pressed && styles.pressed]}>
              <MaterialDesignIcons color={PURPLE} name="arrow-left" size={22} />
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerTitle}>Mode anonyme</Text>
              <Text style={styles.headerSubtitle}>Confidentialité</Text>
            </View>

            <View style={styles.headerSpace} />
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 24}]}
            showsVerticalScrollIndicator={false}>
            <FadeInUp distance={10}>
              <View style={styles.hero}>
                <View style={styles.heroHaloOuter}>
                  <View style={styles.heroHaloInner}>
                    <Image accessibilityLabel="Illustration du mode anonyme" resizeMode="contain" source={HERO} style={styles.heroImage} />
                  </View>

                  <View style={[styles.securityBadge, styles.securityBadgeSuccess]}>
                    <MaterialDesignIcons color="#FFFFFF" name="check-bold" size={15} />
                  </View>
                </View>

                <Text style={styles.title}>Mode Anonyme activé</Text>
                <Text style={styles.subtitle}>
                  Ton profil reste dissocié de ton identité tant que ce mode est actif.
                </Text>
              </View>
            </FadeInUp>

            <FadeInUp delay={90}>
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderIcon}>
                    <MaterialDesignIcons color={PURPLE} name="shield-check-outline" size={20} />
                  </View>
                  <View style={styles.cardHeaderCopy}>
                    <Text style={styles.cardHeaderTitle}>Rien n’est conservé</Text>
                    <Text style={styles.cardHeaderSubtitle}>
                      Ces informations ne sont pas associées à ton profil anonyme.
                    </Text>
                  </View>
                </View>

                <View style={styles.rowsGroup}>
                  {RETENTION_ROWS.map((row, index) => (
                    <View key={row.key} style={[styles.row, index < RETENTION_ROWS.length - 1 && styles.rowBorder]}>
                      <View style={styles.rowIcon}>
                        <MaterialDesignIcons color={PURPLE_DEEP} name={row.icon} size={19} />
                      </View>
                      <Text style={styles.rowTitle}>{row.label}</Text>
                      <View style={styles.rowStatus}>
                        <Text style={styles.rowStatusText}>Non conservé</Text>
                        <MaterialDesignIcons color={SUCCESS} name="check-circle" size={16} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </FadeInUp>

            <FadeInUp delay={150}>
              <Pressable
                accessibilityLabel="Verrouillage de l’application"
                accessibilityRole="button"
                onPress={() => navigation.navigate('PrivacySecurity')}
                style={({pressed}) => [styles.securityCard, pressed && styles.pressed]}>
                <View style={styles.securityIcon}>
                  <MaterialDesignIcons color={PURPLE} name="shield-key-outline" size={20} />
                </View>
                <View style={styles.securityCopy}>
                  <Text style={styles.securityTitle}>Verrouillage de l’appli</Text>
                  <Text style={styles.securityText}>Code PIN ou biométrie à l’ouverture d’AWA</Text>
                </View>
                <Text style={styles.securityStatus}>{locked ? 'Activé' : 'Désactivé'}</Text>
                <MaterialDesignIcons color={TEXT_SECONDARY} name="chevron-right" size={20} />
              </Pressable>
            </FadeInUp>

            <FadeInUp delay={210}>
              <View style={styles.conversionCard}>
                <Text style={styles.conversionTitle}>Désactiver le mode Anonyme</Text>
                <Text style={styles.conversionText}>
                  Pour quitter le mode anonyme, tu peux créer un compte et associer une adresse e-mail ou un identifiant.
                </Text>

                <Pressable
                  accessibilityLabel="Créer un compte"
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('Registration')}
                  style={({pressed}) => [styles.secondaryButton, pressed && styles.pressed]}>
                  <MaterialDesignIcons color={PURPLE} name="account-plus-outline" size={19} />
                  <Text style={styles.secondaryButtonText}>Créer un compte</Text>
                </Pressable>
              </View>
            </FadeInUp>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />

      <View pointerEvents="none" style={styles.backgroundDecoration}>
        <View style={styles.blobTopRight} />
        <View style={styles.blobLeft} />
        <View style={styles.blobBottom} />
      </View>

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={PURPLE} name="arrow-left" size={22} />
          </Pressable>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Mode anonyme</Text>
            <Text style={styles.headerSubtitle}>Confidentialité</Text>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 18) + 96}]}
          showsVerticalScrollIndicator={false}>
          <FadeInUp distance={10}>
            <View style={styles.hero}>
              <View style={styles.heroHaloOuter}>
                <View style={styles.heroHaloInner}>
                  <Image accessibilityLabel="Illustration du mode anonyme" resizeMode="contain" source={HERO} style={styles.heroImage} />
                </View>

                <View style={styles.securityBadge}>
                  <MaterialDesignIcons color="#FFFFFF" name="shield-lock-outline" size={16} />
                </View>
              </View>

              <Text style={styles.title}>Utiliser AWA en mode anonyme</Text>
              <Text style={styles.subtitle}>
                Profite de ton espace AWA sans associer ton identité à ton profil.
              </Text>
            </View>
          </FadeInUp>

          <FadeInUp delay={90}>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderIcon}>
                  <MaterialDesignIcons color={PURPLE} name="shield-lock-outline" size={20} />
                </View>
                <View style={styles.cardHeaderCopy}>
                  <Text style={styles.cardHeaderTitle}>Ton identité reste privée</Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    Les informations permettant de t’identifier ne sont pas nécessaires pour utiliser ce mode.
                  </Text>
                </View>
              </View>

              <View style={styles.rowsGroup}>
                {PRIVACY_ROWS.map((row, index) => (
                  <View key={row.key} style={[styles.row, index < PRIVACY_ROWS.length - 1 && styles.rowBorder]}>
                    <View style={styles.rowIcon}>
                      <MaterialDesignIcons color={PURPLE_DEEP} name={row.icon} size={19} />
                    </View>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <MaterialDesignIcons color={SUCCESS} name="check-circle" size={18} />
                  </View>
                ))}
              </View>
            </View>
          </FadeInUp>

          <FadeInUp delay={160}>
            <View style={styles.infoCard}>
              <MaterialDesignIcons color={PURPLE_DEEP} name="information-outline" size={19} />
              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>À savoir</Text>
                <Text style={styles.infoText}>
                  Certaines fonctionnalités liées au compte, à la synchronisation ou à la récupération peuvent être limitées en mode anonyme.
                </Text>
              </View>
            </View>
          </FadeInUp>

          <FadeInUp delay={220}>
            <View style={styles.securityCard}>
              <View style={styles.securityIcon}>
                <MaterialDesignIcons color={PURPLE} name="shield-key-outline" size={20} />
              </View>
              <View style={styles.securityCopy}>
                <Text style={styles.securityTitle}>Protection recommandée</Text>
                <Text style={styles.securityText}>
                  Tu pourras protéger l’accès à AWA avec ton code PIN ou la biométrie.
                </Text>
              </View>
              <MaterialDesignIcons color={TEXT_SECONDARY} name="chevron-right" size={20} />
            </View>
          </FadeInUp>
        </ScrollView>

        <FadeInUp delay={260} distance={12}>
          <View style={[styles.ctaArea, {paddingBottom: Math.max(insets.bottom, 14)}]}>
            <Pressable
              accessibilityLabel="Continuer en mode anonyme"
              accessibilityRole="button"
              onPress={proceed}
              style={({pressed}) => [styles.primary, pressed && styles.pressed]}>
              <MaterialDesignIcons color="#FFFFFF" name="incognito" size={20} />
              <Text style={styles.primaryText}>Continuer en mode anonyme</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Annuler"
              accessibilityRole="button"
              hitSlop={8}
              onPress={navigation.goBack}
              style={styles.cancel}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
          </View>
        </FadeInUp>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {flex: 1, backgroundColor: BACKGROUND},
  safe: {flex: 1},

  backgroundDecoration: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  blobTopRight: {
    position: 'absolute', top: -70, right: -60, width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(107,73,190,0.07)',
  },
  blobLeft: {
    position: 'absolute', top: 230, left: -70, width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(103,91,128,0.05)',
  },
  blobBottom: {
    position: 'absolute', bottom: -60, right: -30, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(105,73,190,0.04)',
  },

  header: {
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18,
  },
  back: {
    width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 16,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  headerTitleBlock: {alignItems: 'center'},
  headerTitle: {color: TEXT_PRIMARY, fontFamily: 'serif', fontSize: 17, fontWeight: '700'},
  headerSubtitle: {marginTop: 1, color: TEXT_SECONDARY, fontSize: 11},
  headerSpace: {width: 42},

  content: {flexGrow: 1, paddingHorizontal: 18, paddingTop: 6},

  hero: {alignItems: 'center', paddingTop: 10},
  heroHaloOuter: {
    width: 150, height: 150, alignItems: 'center', justifyContent: 'center', borderRadius: 75, backgroundColor: LAVENDER,
  },
  heroHaloInner: {
    width: 118, height: 118, alignItems: 'center', justifyContent: 'center', borderRadius: 59, backgroundColor: CARD, overflow: 'hidden',
    shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  heroImage: {width: 118, height: 118},
  securityBadge: {
    position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, backgroundColor: PURPLE, borderWidth: 2, borderColor: BACKGROUND,
  },
  securityBadgeSuccess: {backgroundColor: SUCCESS},

  title: {
    marginTop: 20, color: TEXT_PRIMARY, fontFamily: 'serif', fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center',
  },
  subtitle: {
    maxWidth: 330, alignSelf: 'center', marginTop: 10, color: TEXT_SECONDARY, fontSize: 14, lineHeight: 20, textAlign: 'center',
  },

  card: {
    marginTop: 26, borderRadius: 22, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    padding: 16, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardHeaderRow: {flexDirection: 'row', alignItems: 'flex-start'},
  cardHeaderIcon: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: LAVENDER,
  },
  cardHeaderCopy: {flex: 1, minWidth: 0, marginLeft: 12},
  cardHeaderTitle: {color: TEXT_PRIMARY, fontSize: 15.5, fontWeight: '700'},
  cardHeaderSubtitle: {marginTop: 4, color: TEXT_SECONDARY, fontSize: 12.5, lineHeight: 18},

  rowsGroup: {marginTop: 14},
  row: {minHeight: 54, flexDirection: 'row', alignItems: 'center'},
  rowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER},
  rowIcon: {
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: LAVENDER,
  },
  rowTitle: {flex: 1, minWidth: 0, marginHorizontal: 12, color: TEXT_PRIMARY, fontSize: 13.5, lineHeight: 18},
  rowStatus: {flexDirection: 'row', alignItems: 'center', gap: 6},
  rowStatusText: {color: SUCCESS, fontSize: 11.5, fontWeight: '700'},

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, borderRadius: 16, borderWidth: 1,
    borderColor: BORDER, backgroundColor: SURFACE, paddingHorizontal: 14, paddingVertical: 13,
  },
  infoCopy: {flex: 1, minWidth: 0},
  infoTitle: {color: TEXT_PRIMARY, fontSize: 13, fontWeight: '700'},
  infoText: {marginTop: 3, color: TEXT_SECONDARY, fontSize: 12.5, lineHeight: 18},

  securityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, borderRadius: 16, backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, paddingVertical: 13,
  },
  securityIcon: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: LAVENDER,
  },
  securityCopy: {flex: 1, minWidth: 0},
  securityTitle: {color: TEXT_PRIMARY, fontSize: 13.5, fontWeight: '700'},
  securityText: {marginTop: 3, color: TEXT_SECONDARY, fontSize: 12, lineHeight: 17},
  securityStatus: {color: PURPLE, fontSize: 12, fontWeight: '700'},

  conversionCard: {
    marginTop: 18, borderRadius: 22, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    padding: 16, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  conversionTitle: {color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700'},
  conversionText: {marginTop: 6, color: TEXT_SECONDARY, fontSize: 12.5, lineHeight: 18},
  secondaryButton: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14,
    borderRadius: 15, borderWidth: 1.5, borderColor: PURPLE, backgroundColor: LAVENDER,
  },
  secondaryButtonText: {color: PURPLE, fontSize: 14, fontWeight: '700'},

  ctaArea: {
    paddingHorizontal: 18, paddingTop: 10, backgroundColor: BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER,
  },
  primary: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 18,
    backgroundColor: PURPLE, shadowColor: PURPLE_DEEP, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.22, shadowRadius: 9, elevation: 5,
  },
  primaryText: {color: '#FFFFFF', fontSize: 15.5, fontWeight: '800'},
  cancel: {alignSelf: 'center', minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15},
  cancelText: {color: PURPLE, fontSize: 14, fontWeight: '700'},

  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
});
