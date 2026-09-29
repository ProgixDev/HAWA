import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing, Pressable, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import type {RootStackParamList} from '../../navigation/AppNavigator';
import {authenticateWithBiometry, getBiometryDeviceName, getBiometryIcon, getBiometryLabel, getBiometryType} from '../../services/privateSectionAuth';
import {replaceWithIntimacyDestination, unlockIntimacy} from '../../state/privateSectionAuthStore';
import type * as Keychain from 'react-native-keychain';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import '../../i18n';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
type Props = NativeStackScreenProps<RootStackParamList, 'PrivateIntimacyFaceId'>;

function useBiometrySubtitle() {
  const {t} = useTranslation();
  return (type: Keychain.BIOMETRY_TYPE | null): string => {
    if (type === 'FaceID' || type === 'Face') {return t('privateIntimacyFaceId.lookAtPhone');}
    if (type === 'Fingerprint' || type === 'TouchID') {return t('privateIntimacyFaceId.placeFinger');}
    if (type === 'Iris' || type === 'OpticID') {return t('privateIntimacyFaceId.lookAtPhone');}
    return t('privateIntimacyFaceId.useBiometrics');
  };
}

export default function PrivateIntimacyFaceIdScreen({navigation, route}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const getBiometrySubtitle = useBiometrySubtitle();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  // Unified, theme-aware lock presentation (see PrivateIntimacyUnlockScreen.tsx's
  // unifiedPurposeCopy) — now applies to every IntimacyTarget value. The
  // legacy padlock-artwork PNG background has been fully retired from this
  // file.
  const entrance = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const attempted = useRef(false);

  const [title, setTitle] = useState('Face ID');
  const [subtitle, setSubtitle] = useState(t('privateIntimacyFaceId.lookAtPhone'));
  const [icon, setIcon] = useState<IconName>('face-recognition');
  const [buttonLabel, setButtonLabel] = useState(() => t('privateSectionAuth.useBiometryLabel', {device: 'Face ID'}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => Animated.timing(entrance, {toValue: 1, duration: reduce ? 0 : 420, easing: Easing.out(Easing.cubic), useNativeDriver: true}).start());
    getBiometryType().then(type => {
      setButtonLabel(getBiometryLabel(type));
      setTitle(getBiometryDeviceName(type));
      setIcon(getBiometryIcon(type) as IconName);
      setSubtitle(getBiometrySubtitle(type));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrance]);

  const fail = (message: string) => {
    setError(message);
    Animated.sequence([6, -6, 4, -4, 0].map(value => Animated.timing(shake, {toValue: value, duration: 45, easing: Easing.linear, useNativeDriver: true}))).start();
  };

  const attempt = async () => {
    if (busy) {return;}
    try {
      setBusy(true);
      setError('');
      if (await authenticateWithBiometry()) {unlockIntimacy(); replaceWithIntimacyDestination(navigation, route.params?.target); return;}
      fail(t('privateIntimacyFaceId.authNotRecognized'));
    } catch {
      fail(t('privateIntimacyFaceId.authNotRecognized'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (attempted.current) {return;}
    attempted.current = true;
    attempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = (
      <SafeAreaView edges={['top', 'bottom']} style={styles.flex}>
        <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

        <View style={[styles.content, {paddingBottom: Math.max(insets.bottom, 14)}]}>
          <Pressable accessibilityLabel={t('common.back')} onPress={navigation.goBack} style={styles.back}>
            <MaterialDesignIcons color={theme.colors.accent} name="arrow-left" size={27} />
          </Pressable>

          <Animated.View
            style={[
              styles.main,
              {
                opacity: entrance,
                transform: [{translateY: entrance.interpolate({inputRange: [0, 1], outputRange: [12, 0]})}],
              },
            ]}>
            <View style={styles.badge}>
              <MaterialDesignIcons color={theme.colors.primary} name={icon} size={64} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>

          <Animated.Text accessibilityLiveRegion="polite" style={[styles.error, {transform: [{translateX: shake}]}]}>
            {error || ' '}
          </Animated.Text>

          <Pressable
            accessibilityLabel={buttonLabel}
            accessibilityRole="button"
            disabled={busy}
            onPress={attempt}
            style={({pressed}) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}>
            <MaterialDesignIcons color={onPrimaryTextColor(theme)} name={icon} size={22} />
            <Text style={styles.primaryText}>{busy ? t('privateIntimacyFaceId.verifying') : buttonLabel}</Text>
          </Pressable>

          <Pressable accessibilityLabel={t('privateIntimacyFaceId.usePinCode')} hitSlop={10} onPress={() => navigation.replace('PrivateIntimacyPin', {target: route.params?.target})}>
            <Text style={styles.link}>{t('privateIntimacyFaceId.usePinCodeInstead')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
  );

  return <View style={[styles.safe, styles.flatBackground]}>{content}</View>;
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    safe: {flex: 1, backgroundColor: theme.colors.background},
    // Reads the GLOBAL theme so it supports Light/Dark/System/True Black/
    // Premium palettes — the "no PNG, calm flat page" structural principle
    // originally inspired by Pregnancy's private-access design.
    flatBackground: {backgroundColor: theme.colors.background},
    flex: {flex: 1},
    content: {flex: 1, alignItems: 'center', paddingTop: 32, paddingHorizontal: 26},
    back: {position: 'absolute', top: 12, left: 16, zIndex: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: theme.colors.surface},
    main: {alignItems: 'center'},
    badge: {width: 118, height: 118, alignItems: 'center', justifyContent: 'center', borderRadius: 59, backgroundColor: theme.colors.primarySoft},
    title: {marginTop: 18, color: theme.colors.accent, fontFamily: 'serif', fontSize: 24, fontWeight: '800'},
    subtitle: {marginTop: 8, color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center'},
    error: {height: 31, marginTop: 16, color: theme.colors.danger, fontSize: 11, textAlign: 'center'},
    primary: {width: '100%', minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, backgroundColor: theme.colors.primary},
    primaryText: {color: onPrimaryTextColor(theme), fontSize: 15, fontWeight: '700'},
    link: {marginTop: 18, color: theme.colors.accent, fontSize: 13, fontWeight: '600', textAlign: 'center'},
    pressed: {opacity: 0.82, transform: [{scale: 0.99}]},
    disabled: {opacity: 0.55},
  });
}
