import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  getLauncherIdentity,
  isLauncherSwitchBlockedByDevice,
  setLauncherIdentity,
  type LauncherIdentity,
} from '../services/discreetLauncher';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {
  onPrimaryTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../theme/awaThemeTokens';

const AWA_LOGO = require('../assets/images/hawa-logo.png');

type Props = NativeStackScreenProps<RootStackParamList, 'DiscreetLauncher'>;

// This feature is Android-only by design (activity-alias + PackageManager
// component toggling have no iOS equivalent, and none was requested). The
// selector must always show while actually running on Android — it must
// never be hidden by a native-module-detection false negative, which is
// exactly what caused the real-device bug this screen was rewritten to fix
// (see discreetLauncher.ts / DiscreetLauncherModule.kt for the native-side
// root cause and fix). If the native call genuinely fails despite being on
// Android, that surfaces as an honest error at the point of use (read or
// switch), never as a blanket "unsupported" message.
const IS_ANDROID = Platform.OS === 'android';

type PendingSwitch = {target: LauncherIdentity};

// Capability/error-driven, never a hardcoded manufacturer check — 'unknown'
// until a real switch attempt tells us otherwise. 'unsupported_vendor' is
// set ONLY when the native call itself reports the specific SecurityException
// path (see isLauncherSwitchBlockedByDevice) — real evidence found this can
// happen on at least one Huawei/EMUI device's PackageManager fork; other
// OEMs/devices are never assumed affected.
type SupportState = 'unknown' | 'supported' | 'unsupported_vendor';

export default function DiscreetLauncherScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const compact = width < 360 || height < 700;

  const [identity, setIdentityState] = useState<LauncherIdentity | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null);
  const [switching, setSwitching] = useState(false);
  const [supportState, setSupportState] = useState<SupportState>('unknown');

  const refreshIdentity = useCallback(() => {
    if (!IS_ANDROID) {return;}
    getLauncherIdentity()
      .then(value => {
        setIdentityState(value);
        setLoadError(false);
      })
      .catch(() => {
        setLoadError(true);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshIdentity();
    }, [refreshIdentity]),
  );

  const requestSwitch = (target: LauncherIdentity) => {
    // Never switch immediately on tap — always confirm first (§ requirement).
    // A tap on the already-active identity is a no-op, not a confirmation.
    if (switching || identity === target) {return;}
    setPendingSwitch({target});
  };

  const confirmSwitch = async () => {
    if (!pendingSwitch || switching) {return;}
    const {target} = pendingSwitch;
    setSwitching(true);
    try {
      await setLauncherIdentity(target);
      // Never optimistically assume success — re-read the REAL
      // PackageManager state after the switch, and only then update the UI.
      const real = await getLauncherIdentity();
      setIdentityState(real);
      setSupportState('supported');
      setPendingSwitch(null);
    } catch (error) {
      // Keep whatever identity was already displayed (re-read it fresh
      // rather than trust either the old or the attempted-new value) and
      // surface an honest failure — never claim the switch succeeded.
      refreshIdentity();
      setPendingSwitch(null);
      setLoadError(false);
      if (isLauncherSwitchBlockedByDevice(error)) {
        setSupportState('unsupported_vendor');
        requestAnimationFrame(() => {
          setUnsupportedVendorVisible(true);
        });
      } else {
        requestAnimationFrame(() => {
          setSwitchErrorVisible(true);
        });
      }
    } finally {
      setSwitching(false);
    }
  };

  const [switchErrorVisible, setSwitchErrorVisible] = useState(false);
  const [unsupportedVendorVisible, setUnsupportedVendorVisible] = useState(false);

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
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={navigation.goBack}
            style={({pressed}) => [styles.back, pressed && styles.pressed]}>
            <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Apparence discrète</Text>
            <Text style={styles.subtitle}>Choisis comment AWA apparaît sur ton écran d’accueil</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={20} />
          <Text style={styles.infoText}>
            Ceci change uniquement le nom et l’icône de l’application sur ton écran d’accueil.
            Tes données et leur protection (code PIN, biométrie, chiffrement) restent exactement
            les mêmes, quelle que soit l’identité choisie.
          </Text>
        </View>

        {!IS_ANDROID ? (
          <View style={styles.infoCard}>
            <MaterialDesignIcons color={theme.colors.textSecondary} name="cellphone-off" size={20} />
            <Text style={styles.infoText}>
              Cette fonctionnalité n’est disponible que sur Android.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Choisir l’apparence</Text>

            {loadError ? (
              <View style={styles.infoCardWarning}>
                <MaterialDesignIcons color={theme.colors.warning} name="alert-circle-outline" size={20} />
                <Text style={styles.infoTextWarning}>
                  Impossible de lire l’apparence actuelle pour le moment.
                </Text>
                <Pressable
                  accessibilityLabel="Réessayer"
                  accessibilityRole="button"
                  onPress={refreshIdentity}
                  style={({pressed}) => [styles.retryButton, pressed && styles.pressed]}>
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </Pressable>
              </View>
            ) : identity === null ? (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.choices}>
                <IdentityCard
                  description="Nom et icône AWA d’origine"
                  disabled={switching}
                  onPress={() => requestSwitch('awa')}
                  preview={<Image resizeMode="contain" source={AWA_LOGO} style={styles.previewImage} />}
                  selected={identity === 'awa'}
                  title="AWA"
                />
                <IdentityCard
                  description="Apparaît comme une application d’agenda neutre, sans référence à AWA"
                  disabled={switching}
                  onPress={() => requestSwitch('discreet')}
                  preview={
                    <View style={styles.previewNeutralIcon}>
                      <MaterialDesignIcons color="#4A5568" name="calendar-blank-outline" size={30} />
                    </View>
                  }
                  selected={identity === 'discreet'}
                  title="Agenda"
                />
              </View>
            )}

            {switching ? (
              <View style={styles.switchingRow}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <Text style={styles.switchingText}>Changement en cours…</Text>
              </View>
            ) : null}

            {supportState === 'unsupported_vendor' ? (
              <View style={styles.infoCardWarning}>
                <MaterialDesignIcons color={theme.colors.warning} name="cellphone-remove" size={20} />
                <Text style={styles.infoTextWarning}>
                  Cette fonctionnalité est limitée par le lanceur de ton téléphone.
                </Text>
              </View>
            ) : (
              <View style={styles.noteCard}>
                <MaterialDesignIcons color={theme.colors.textSecondary} name="clock-outline" size={17} />
                <Text style={styles.noteText}>
                  Le nouvel icône peut mettre quelques secondes à s’afficher selon ton launcher
                  Android.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <LauncherSwitchConfirmModal
        onCancel={() => setPendingSwitch(null)}
        onConfirm={confirmSwitch}
        switching={switching}
        target={pendingSwitch?.target ?? null}
      />

      <ErrorModal onClose={() => setSwitchErrorVisible(false)} visible={switchErrorVisible} />

      <UnsupportedVendorModal
        onClose={() => setUnsupportedVendorVisible(false)}
        visible={unsupportedVendorVisible}
      />
    </SafeAreaView>
  );
}

function IdentityCard({
  title,
  description,
  preview,
  selected,
  disabled,
  onPress,
}: {
  title: string;
  description: string;
  preview: React.ReactNode;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={`${title} — ${description}`}
      accessibilityRole="radio"
      accessibilityState={{checked: selected, disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.identityCard,
        selected && styles.identityCardSelected,
        pressed && !disabled && styles.pressed,
        disabled && styles.identityCardDisabled,
      ]}>
      <View style={styles.identityPreviewWrap}>{preview}</View>
      <View style={styles.identityCopy}>
        <Text style={styles.identityTitle}>{title}</Text>
        <Text style={styles.identityDescription}>{description}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={13} /> : null}
      </View>
    </Pressable>
  );
}

const SWITCH_COPY: Record<LauncherIdentity, {title: string; body: string; confirmLabel: string}> = {
  discreet: {
    title: 'Activer l’apparence discrète ?',
    body: 'L’application apparaîtra sous le nom « Agenda » avec une icône neutre sur ton écran d’accueil. Tes données et tes paramètres resteront inchangés.',
    confirmLabel: 'Activer',
  },
  awa: {
    title: 'Restaurer l’apparence AWA ?',
    body: 'L’application apparaîtra de nouveau sous son nom et son icône AWA.',
    confirmLabel: 'Restaurer',
  },
};

function LauncherSwitchConfirmModal({
  target,
  switching,
  onCancel,
  onConfirm,
}: {
  target: LauncherIdentity | null;
  switching: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const modalStyles = useMemo(() => createModalStyles(theme), [theme]);

  const visible = target !== null;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      entrance.setValue(0);
      return;
    }
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) {return;}
      Animated.timing(entrance, {
        toValue: 1,
        duration: reduce ? 0 : 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {active = false;};
  }, [visible, entrance]);

  const copy = target ? SWITCH_COPY[target] : null;

  const cardStyle = {
    opacity: entrance,
    transform: [
      {translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [24, 0]})},
      {scale: entrance.interpolate({inputRange: [0, 1], outputRange: [0.98, 1]})},
    ],
  };

  return (
    <Modal animationType="none" onRequestClose={onCancel} statusBarTranslucent transparent visible={visible}>
      <View style={modalStyles.overlay}>
        <Animated.View style={[StyleSheet.absoluteFill, modalStyles.backdrop, {opacity: entrance}]}>
          <Pressable accessibilityLabel="Fermer" accessibilityRole="button" onPress={onCancel} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {copy ? (
          <Animated.View accessibilityRole="alert" style={[modalStyles.card, cardStyle]}>
            <View style={modalStyles.icon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name={target === 'discreet' ? 'calendar-blank-outline' : 'flower-outline'}
                size={30}
              />
            </View>
            <Text style={modalStyles.title}>{copy.title}</Text>
            <Text style={modalStyles.message}>{copy.body}</Text>

            <Pressable
              accessibilityLabel={copy.confirmLabel}
              accessibilityRole="button"
              accessibilityState={{disabled: switching}}
              disabled={switching}
              onPress={onConfirm}
              style={({pressed}) => [
                modalStyles.primary,
                pressed && modalStyles.primaryPressed,
                switching && modalStyles.primaryDisabled,
              ]}>
              <Text style={modalStyles.primaryText}>{switching ? 'Patiente…' : copy.confirmLabel}</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Annuler"
              accessibilityRole="button"
              onPress={onCancel}
              style={({pressed}) => [modalStyles.secondary, pressed && modalStyles.secondaryPressed]}>
              <Text style={modalStyles.secondaryText}>Annuler</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

function ErrorModal({visible, onClose}: {visible: boolean; onClose: () => void}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const modalStyles = useMemo(() => createModalStyles(theme), [theme]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={modalStyles.overlay}>
        <Pressable accessibilityLabel="Fermer" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityRole="alert" style={modalStyles.card}>
          <View style={[modalStyles.icon, modalStyles.iconWarning]}>
            <MaterialDesignIcons color={theme.colors.warning} name="alert-circle-outline" size={30} />
          </View>
          <Text style={modalStyles.title}>Changement impossible</Text>
          <Text style={modalStyles.message}>
            Impossible de changer l’apparence de l’application pour le moment. Ton identité
            actuelle n’a pas changé. Réessaie plus tard.
          </Text>
          <Pressable
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            onPress={onClose}
            style={({pressed}) => [modalStyles.primary, pressed && modalStyles.primaryPressed]}>
            <Text style={modalStyles.primaryText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Shown ONLY when the native call itself reported the specific
// SecurityException path (isLauncherSwitchBlockedByDevice) — i.e. the
// device/OEM's PackageManager refused the component toggle, not a bug in
// this app. Real evidence for this exists on at least one Huawei/EMUI
// device; the copy is deliberately device-neutral (never names a
// manufacturer) since the same honest message applies to any OEM that
// restricts this standard Android API the same way.
function UnsupportedVendorModal({visible, onClose}: {visible: boolean; onClose: () => void}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const modalStyles = useMemo(() => createModalStyles(theme), [theme]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={modalStyles.overlay}>
        <Pressable accessibilityLabel="Fermer" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityRole="alert" style={modalStyles.card}>
          <View style={[modalStyles.icon, modalStyles.iconWarning]}>
            <MaterialDesignIcons color={theme.colors.warning} name="cellphone-remove" size={30} />
          </View>
          <Text style={modalStyles.title}>Changement non pris en charge</Text>
          <Text style={modalStyles.message}>
            Le changement d’icône n’est pas pris en charge par ce téléphone. Cette fonctionnalité
            est limitée par le lanceur de ton appareil. Ton identité actuelle n’a pas changé.
          </Text>
          <Pressable
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            onPress={onClose}
            style={({pressed}) => [modalStyles.primary, pressed && modalStyles.primaryPressed]}>
            <Text style={modalStyles.primaryText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: {flex: 1, backgroundColor: theme.colors.background},
  content: {flexGrow: 1, gap: 14, paddingHorizontal: 16},
  contentCompact: {paddingHorizontal: 11},
  header: {flexDirection: 'row', alignItems: 'center'},
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    padding: 9,
    elevation: 2,
  },
  headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 9},
  title: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 21, fontWeight: '700'},
  subtitle: {marginTop: 4, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 16},
  sectionTitle: {color: theme.colors.accent, fontFamily: 'serif', fontSize: 16, fontWeight: '700'},
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    padding: 14,
  },
  infoText: {flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17},
  infoCardWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.warning, 0.35),
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
    padding: 14,
  },
  infoTextWarning: {flex: 1, minWidth: 120, color: theme.colors.warning, fontSize: 12, lineHeight: 17},
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: theme.colors.warning,
  },
  retryButtonText: {color: onPrimaryTextColor(theme), fontSize: 12, fontWeight: '700'},
  choices: {gap: 11},
  loading: {paddingVertical: 30, alignItems: 'center'},
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    borderWidth: 1.4,
    borderColor: theme.colors.border,
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    paddingHorizontal: 13,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.07,
    shadowRadius: 9,
  },
  identityCardSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySoft},
  identityCardDisabled: {opacity: 0.6},
  identityPreviewWrap: {
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.primarySoft,
    overflow: 'hidden',
  },
  previewImage: {width: 34, height: 34},
  // Deliberately NOT theme-derived: this preview mocks up the "Agenda"
  // disguise identity itself — a neutral, non-AWA-branded calendar-app
  // look is the entire point of this option, so it must stay a plain
  // neutral gray regardless of the selected AWA theme/branding.
  previewNeutralIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#EEF0F3',
  },
  identityCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  identityTitle: {color: theme.colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 19},
  identityDescription: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 11.5, lineHeight: 16},
  radio: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: withAlpha(theme.colors.primary, 0.45),
    borderRadius: 12,
  },
  radioSelected: {borderColor: theme.colors.primary, backgroundColor: theme.colors.primary},
  switchingRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  switchingText: {color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600'},
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
    padding: 12,
  },
  noteText: {flex: 1, minWidth: 0, color: theme.colors.textSecondary, fontSize: 11, lineHeight: 15},
  pressed: {opacity: 0.78, transform: [{scale: 0.985}]},
  });
}

function createModalStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  overlay: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 21},
  backdrop: {backgroundColor: withAlpha(theme.shadow.shadowColor, 0.40)},
  card: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 24,
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: {width: 0, height: 10},
    elevation: 10,
  },
  icon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 33,
    backgroundColor: theme.colors.primarySoft,
  },
  iconWarning: {backgroundColor: withAlpha(theme.colors.warning, 0.15)},
  title: {
    marginTop: 16,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
    textAlign: 'center',
  },
  message: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center'},
  primary: {
    width: '100%',
    minHeight: 52,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: {width: 0, height: 5},
    elevation: 4,
  },
  primaryPressed: {opacity: 0.9},
  primaryDisabled: {opacity: 0.7},
  primaryText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '800'},
  secondary: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },
  secondaryPressed: {opacity: 0.85},
  secondaryText: {color: theme.colors.primary, fontSize: 14, fontWeight: '800'},
  });
}
