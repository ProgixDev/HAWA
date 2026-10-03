import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {useReducedMotion} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {useAwaADeuxPartnerName} from '../../hooks/useAwaADeuxPartnerName';
import {PARTNER_NAME_MAX_LENGTH, normalizePartnerName} from '../../state/awaADeuxPartnerStore';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

// "AWA à deux" — "Comment s'appelle votre partenaire ?" (Intro → Découvrir → this screen).
//
// FRONTEND ONLY. "Continuer" saves the trimmed name in awaADeuxPartnerStore (on the device,
// updatable later) — the single source of truth read by every later AWA à deux screen. The
// field starts from the saved name, so coming back (or after "Arrêter le partage") shows it.
// No partner, account, invitation or backend exists yet. "Continuer" stays disabled until the name
// holds at least one non-blank character.
//
// Layout: ONE screen, no scrolling — back button, then a plain View column (heart, title,
// description, input card, and the couple illustration centred, slightly biased upwards, in
// the space that is left) and "Continuer" at the bottom, above the safe area. The
// illustration is sized from the window height (about 21% / 18% on a compact phone) and
// shrinks if the space is short. While the keyboard is open the illustration and the heart
// (and, on a compact phone, the description) step aside, so the field and the CTA always
// stay visible without any scrolling. The CTA and the page
// gradient reuse the exact AWA styling of the introduction screen; every color comes from
// the resolved AWA theme (Light / Dark / every palette).
//
// Motion: React Native's Animated (opacity + a few dp of translateY, native driver). Every
// block STARTS at 0.65 opacity (never invisible), so the screen is readable even if the
// animation never runs; reduced motion skips it.
const HERO_IMAGE = require('../../assets/images/partenaire.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxPartnerName'>;

const ENTRANCE_START_OPACITY = 0.65;

/** Fade (0.65 → 1) + a small upward move, after `delay` ms. Starts at the end state with reduced motion. */
function useSoftEntrance(delay: number, reduceMotion: boolean, distance = 8) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(progress, {toValue: 1, duration: 380, delay, useNativeDriver: true});
    animation.start();
    return () => animation.stop();
    // Defined once per mount / reduced-motion change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
  return {
    opacity: progress.interpolate({inputRange: [0, 1], outputRange: [ENTRANCE_START_OPACITY, 1]}),
    transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [distance, 0]})}],
  };
}

export default function AwaADeuxPartnerNameScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const compact = width < 360 || height < 700;
  const styles = useMemo(() => createStyles(theme, compact, height), [theme, compact, height]);

  const {partnerName: savedName, loaded, setPartnerName} = useAwaADeuxPartnerName();
  const [name, setName] = useState(savedName);
  const edited = useRef(false);
  const [focused, setFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const partnerName = normalizePartnerName(name);
  const canContinue = partnerName.length > 0;

  // The saved name (read from the device) fills the field, unless she has already started typing.
  useEffect(() => {
    if (loaded && !edited.current) {setName(savedName);}
  }, [loaded, savedName]);

  // The illustration makes room for the keyboard instead of pushing the field out of view.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const heartEntrance = useSoftEntrance(0, reduceMotion);
  const titleEntrance = useSoftEntrance(90, reduceMotion);
  const cardEntrance = useSoftEntrance(200, reduceMotion);
  const heroEntrance = useSoftEntrance(320, reduceMotion, 8);

  const onContinue = () => {
    if (!canContinue) {return;}
    Keyboard.dismiss();
    if (!setPartnerName(partnerName)) {return;}
    navigation.navigate('AwaADeuxPartnerView');
  };

  return (
    <LinearGradient colors={[...theme.gradients.pageBackground]} style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
        <Pressable
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={navigation.goBack}
          style={({pressed}) => [styles.back, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>
          {keyboardOpen ? null : (
            <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.heartBadge, heartEntrance]}>
              <MaterialDesignIcons color={theme.colors.primary} name="heart" size={compact ? 28 : 34} />
            </Animated.View>
          )}

          <Animated.View style={titleEntrance}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.15} style={styles.title}>
              {t('awaADeux.partnerName.title')}
            </Text>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.divider}>
              <View style={styles.dividerLine} />
              <MaterialDesignIcons color={theme.colors.primary} name="heart" size={12} />
              <View style={styles.dividerLine} />
            </View>
            {keyboardOpen && compact ? null : (
              <Text maxFontSizeMultiplier={1.15} style={styles.description}>
                {t('awaADeux.partnerName.description')}
              </Text>
            )}
          </Animated.View>

          <Animated.View style={[styles.card, cardEntrance]}>
            <Text maxFontSizeMultiplier={1.2} style={styles.label}>{t('awaADeux.partnerName.fieldLabel')}</Text>
            <TextInput
              accessibilityLabel={t('awaADeux.partnerName.fieldLabel')}
              autoCapitalize="words"
              autoComplete="off"
              autoCorrect={false}
              maxLength={PARTNER_NAME_MAX_LENGTH}
              onBlur={() => setFocused(false)}
              onChangeText={value => {
                edited.current = true;
                setName(value);
              }}
              onFocus={() => setFocused(true)}
              placeholder={t('awaADeux.partnerName.placeholder')}
              placeholderTextColor={theme.colors.textMuted}
              returnKeyType="done"
              selectionColor={theme.colors.primary}
              style={[styles.input, focused && styles.inputFocused]}
              textContentType="givenName"
              value={name}
            />
          </Animated.View>

          {/* Decorative, transparent PNG drawn straight on the page, centred in the space left between the card and the CTA. */}
          <View style={styles.heroZone}>
            {keyboardOpen ? null : (
              <Animated.View style={[styles.heroBox, heroEntrance]}>
                <Image
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  resizeMode="contain"
                  source={HERO_IMAGE}
                  style={styles.heroImage}
                />
              </Animated.View>
            )}
          </View>
        </View>

        <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16) + 8}]}>
          <Pressable
            accessibilityLabel={t('common.continue')}
            accessibilityRole="button"
            accessibilityState={{disabled: !canContinue}}
            disabled={!canContinue}
            onPress={onContinue}
            style={({pressed}) => [styles.cta, !canContinue && styles.ctaDisabled, pressed && styles.pressed]}>
            <Text maxFontSizeMultiplier={1.15} style={styles.ctaText}>{t('common.continue')}</Text>
            <View style={styles.ctaArrow}>
              <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="arrow-right" size={20} />
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme, compact: boolean, windowHeight: number) {
  const ctaHeight = compact ? 46 : 50;
  // About 21% of the window height (18% on a compact phone) — clearly smaller than the old
  // "whatever is left" box; it still shrinks (maxHeight: '100%') when the space is short.
  const heroHeight = Math.round(windowHeight * (compact ? 0.18 : 0.21));
  return StyleSheet.create({
    screen: {flex: 1, backgroundColor: theme.colors.background},
    flex: {flex: 1},
    header: {paddingHorizontal: 20, paddingBottom: 4},
    back: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      padding: 9,
      elevation: 2,
    },
    // A plain column that fits the screen: nothing scrolls, anything that does not fit is clipped, never scrolled.
    content: {flex: 1, minHeight: 0, overflow: 'hidden', paddingHorizontal: 20, paddingTop: compact ? 4 : 10},
    heartBadge: {
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      width: compact ? 56 : 68,
      height: compact ? 56 : 68,
      borderRadius: compact ? 28 : 34,
      backgroundColor: theme.colors.primarySoft,
    },
    title: {
      marginTop: compact ? 12 : 18,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: compact ? 24 : 27,
      lineHeight: compact ? 30 : 34,
      fontWeight: '700',
      textAlign: 'center',
    },
    divider: {marginTop: compact ? 8 : 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10},
    dividerLine: {width: 52, height: 1, backgroundColor: withAlpha(theme.colors.primary, 0.35)},
    description: {
      marginTop: compact ? 8 : 12,
      color: theme.colors.textSecondary,
      fontSize: compact ? 13.5 : 14.5,
      lineHeight: compact ? 20 : 21,
      textAlign: 'center',
    },
    card: {
      marginTop: compact ? 16 : 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      padding: 16,
      ...theme.shadow,
    },
    label: {marginBottom: 8, color: theme.colors.text, fontSize: 14.5, fontWeight: '700'},
    input: {
      minHeight: 50,
      borderRadius: 16,
      borderWidth: 1.2,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 14,
      color: theme.colors.text,
      fontSize: 15,
    },
    inputFocused: {borderColor: theme.colors.primary},
    // The space between the card and the CTA; the illustration sits in its middle, a little above centre.
    heroZone: {flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingTop: 4, paddingBottom: compact ? 8 : 16},
    // Fixed share of the window height, shrinking with the zone; `contain` keeps the PNG's ratio.
    heroBox: {width: '100%', height: heroHeight, maxHeight: '100%'},
    heroImage: {width: '100%', height: '100%'},
    footer: {paddingHorizontal: 20, paddingTop: 10},
    cta: {
      minHeight: ctaHeight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: ctaHeight / 2,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
    },
    ctaDisabled: {opacity: 0.45},
    ctaText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '700'},
    ctaArrow: {position: 'absolute', right: 22},
    pressed: {opacity: 0.85},
  });
}
