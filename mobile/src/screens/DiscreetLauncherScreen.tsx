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
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

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
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

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
  const {t} = useTranslation();
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
          <AwaIconButton
            accessibilityLabel={t('discreetLauncher.backA11y')}
            icon="chevron-left"
            onPress={navigation.goBack}
            variant="tonal"
          />
          <View style={styles.headerCopy}>
            <AwaText accessibilityRole="header" style={styles.title} variant="headlineSmall">{t('discreetLauncher.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodySmall">{t('discreetLauncher.subtitle')}</AwaText>
          </View>
        </View>

        <AwaCard padding="compact" style={styles.infoCard} variant="filled">
          <MaterialDesignIcons color={theme.colors.primary} name="information-outline" size={20} />
          <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{t('discreetLauncher.infoCard')}</AwaText>
        </AwaCard>

        {!IS_ANDROID ? (
          <AwaCard padding="compact" style={styles.infoCard} variant="filled">
            <MaterialDesignIcons color={theme.colors.textSecondary} name="cellphone-off" size={20} />
            <AwaText colorRole="onSurfaceVariant" style={styles.infoText} variant="bodySmall">{t('discreetLauncher.androidOnly')}</AwaText>
          </AwaCard>
        ) : (
          <>
            <AwaText style={styles.sectionTitle} variant="titleMedium">{t('discreetLauncher.sectionChoose')}</AwaText>

            {loadError ? (
              <AwaCard padding="compact" style={styles.infoCardWarning} variant="filled">
                <MaterialDesignIcons color={theme.colors.warning} name="alert-circle-outline" size={20} />
                <AwaText colorRole="warning" style={styles.infoTextWarning} variant="bodySmall">{t('discreetLauncher.loadError')}</AwaText>
                <AwaButton
                  accessibilityLabel={t('discreetLauncher.retry')}
                  label={t('discreetLauncher.retry')}
                  onPress={refreshIdentity}
                  size="compact"
                  variant="tonal"
                />
              </AwaCard>
            ) : identity === null ? (
              <View style={styles.loading}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : (
              <View style={styles.choices}>
                <IdentityCard
                  description={t('discreetLauncher.awaDescription')}
                  disabled={switching}
                  onPress={() => requestSwitch('awa')}
                  preview={<Image resizeMode="contain" source={AWA_LOGO} style={styles.previewImage} />}
                  selected={identity === 'awa'}
                  title={t('discreetLauncher.awaTitle')}
                />
                <IdentityCard
                  description={t('discreetLauncher.discreetDescription')}
                  disabled={switching}
                  onPress={() => requestSwitch('discreet')}
                  preview={
                    <View style={styles.previewNeutralIcon}>
                      <MaterialDesignIcons color="#4A5568" name="calendar-blank-outline" size={30} />
                    </View>
                  }
                  selected={identity === 'discreet'}
                  title={t('discreetLauncher.discreetTitle')}
                />
              </View>
            )}

            {switching ? (
              <View style={styles.switchingRow}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <AwaText colorRole="onSurfaceVariant" style={styles.switchingText} variant="labelLarge">{t('discreetLauncher.switching')}</AwaText>
              </View>
            ) : null}

            {supportState === 'unsupported_vendor' ? (
              <AwaCard padding="compact" style={styles.infoCardWarning} variant="filled">
                <MaterialDesignIcons color={theme.colors.warning} name="cellphone-remove" size={20} />
                <AwaText colorRole="warning" style={styles.infoTextWarning} variant="bodySmall">{t('discreetLauncher.unsupportedVendor')}</AwaText>
              </AwaCard>
            ) : (
              <AwaCard padding="compact" style={styles.noteCard} variant="filled">
                <MaterialDesignIcons color={theme.colors.textSecondary} name="clock-outline" size={17} />
                <AwaText colorRole="onSurfaceVariant" style={styles.noteText} variant="bodySmall">{t('discreetLauncher.noteDelay')}</AwaText>
              </AwaCard>
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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={t('discreetLauncher.identityCardA11y', {title, description})}
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
        <AwaText style={styles.identityTitle} variant="titleSmall">{title}</AwaText>
        <AwaText colorRole="onSurfaceVariant" style={styles.identityDescription} variant="bodySmall">{description}</AwaText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={13} /> : null}
      </View>
    </Pressable>
  );
}

function switchCopy(t: (key: string) => string): Record<LauncherIdentity, {title: string; body: string; confirmLabel: string}> {
  return {
    discreet: {
      title: t('discreetLauncher.switchDiscreetTitle'),
      body: t('discreetLauncher.switchDiscreetBody'),
      confirmLabel: t('discreetLauncher.switchDiscreetConfirm'),
    },
    awa: {
      title: t('discreetLauncher.switchAwaTitle'),
      body: t('discreetLauncher.switchAwaBody'),
      confirmLabel: t('discreetLauncher.switchAwaConfirm'),
    },
  };
}

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
  const {t} = useTranslation();
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

  const copy = target ? switchCopy(t)[target] : null;

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
          <Pressable accessibilityLabel={t('discreetLauncher.close')} accessibilityRole="button" onPress={onCancel} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {copy ? (
          <Animated.View accessibilityRole="alert" style={[modalStyles.card, cardStyle]}>
            <View>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name={target === 'discreet' ? 'calendar-blank-outline' : 'flower-outline'}
                size={30}
              />
            </View>
            <AwaText style={modalStyles.title} variant="titleLarge">{copy.title}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={modalStyles.message} variant="bodyMedium">{copy.body}</AwaText>

            <AwaButton
              accessibilityLabel={copy.confirmLabel}
              disabled={switching}
              fullWidth
              label={switching ? t('discreetLauncher.confirming') : copy.confirmLabel}
              onPress={onConfirm}
              size="large"
              style={modalStyles.primary}
            />
            <AwaButton
              accessibilityLabel={t('discreetLauncher.cancel')}
              fullWidth
              label={t('discreetLauncher.cancel')}
              onPress={onCancel}
              style={modalStyles.secondary}
              variant="tonal"
            />
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

function ErrorModal({visible, onClose}: {visible: boolean; onClose: () => void}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const modalStyles = useMemo(() => createModalStyles(theme), [theme]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={modalStyles.overlay}>
        <Pressable accessibilityLabel={t('discreetLauncher.close')} accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityRole="alert" style={modalStyles.card}>
          <View>
            <MaterialDesignIcons color={theme.colors.warning} name="alert-circle-outline" size={30} />
          </View>
          <AwaText style={modalStyles.title} variant="titleLarge">{t('discreetLauncher.errorModalTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={modalStyles.message} variant="bodyMedium">{t('discreetLauncher.errorModalBody')}</AwaText>
          <AwaButton
            accessibilityLabel={t('discreetLauncher.close')}
            fullWidth
            label={t('discreetLauncher.close')}
            onPress={onClose}
            size="large"
            style={modalStyles.primary}
          />
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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const modalStyles = useMemo(() => createModalStyles(theme), [theme]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={modalStyles.overlay}>
        <Pressable accessibilityLabel={t('discreetLauncher.close')} accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityRole="alert" style={modalStyles.card}>
          <View>
            <MaterialDesignIcons color={theme.colors.warning} name="cellphone-remove" size={30} />
          </View>
          <AwaText style={modalStyles.title} variant="titleLarge">{t('discreetLauncher.unsupportedVendorModalTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" style={modalStyles.message} variant="bodyMedium">{t('discreetLauncher.unsupportedVendorModalBody')}</AwaText>
          <AwaButton
            accessibilityLabel={t('discreetLauncher.close')}
            fullWidth
            label={t('discreetLauncher.close')}
            onPress={onClose}
            size="large"
            style={modalStyles.primary}
          />
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
  headerCopy: {flex: 1, minWidth: 0, paddingHorizontal: 9},
  title: {},
  subtitle: {marginTop: 4},
  sectionTitle: {},
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {flex: 1, minWidth: 0},
  infoCardWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.warning, 0.35),
    backgroundColor: withAlpha(theme.colors.warning, 0.12),
  },
  infoTextWarning: {flex: 1, minWidth: 120},
  choices: {gap: 11},
  loading: {paddingVertical: 30, alignItems: 'center'},
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    borderWidth: 1.4,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    paddingHorizontal: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
    backgroundColor: '#EEF0F3',
  },
  identityCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  identityTitle: {},
  identityDescription: {marginTop: 2},
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
  switchingText: {},
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {flex: 1, minWidth: 0},
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
    borderRadius: 12,
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
  iconWarning: {},
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  message: {marginTop: 10, textAlign: 'center'},
  primary: {
    marginTop: 20,
  },
  secondary: {
    marginTop: 8,
  },
  });
}
