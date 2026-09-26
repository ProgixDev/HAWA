import React, {memo, useEffect, useMemo} from 'react';
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {useEntrance} from './useEntrance';
import {
  INTRO_HERO_MIN_HEIGHT,
  getIntroLayout,
  type IntroLayout,
} from './awaADeuxIntroLayout';

// "AWA à deux" — introduction screen (Profile → AWA à deux). UI only: the partner
// account, pairing, invitations, permissions and sharing are NOT implemented;
// "Découvrir" opens the partner-name step.
//
// One viewport, no scrolling: the illustration is the flexible element (it takes the
// height that is left, within a cap) and every other size comes from
// getIntroLayout(windowHeight, insets) — see awaADeuxIntroLayout.ts.
//
// Every color comes from the resolved AWA theme (useAwaTheme), so the screen follows
// Light / Dark and every palette. The couple illustration is a transparent local PNG
// drawn straight on the page background.
//
// Motion: react-native-reanimated (already used across AWA), opacity / transform only,
// driven on the UI thread. Entrance ≈ 1.1 s in total; reduced motion (the OS setting,
// via Reanimated's useReducedMotion) skips it — the final layout is the same.
const HERO_IMAGE = require('../../assets/images/partenaire.png');

type Props = NativeStackScreenProps<RootStackParamList, 'AwaADeuxIntro'>;
type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

const BENEFITS: Array<{icon: IconName; text: string}> = [
  {icon: 'share-variant-outline', text: 'Partagez les repères que vous souhaitez avec votre partenaire'},
  {icon: 'calendar-heart', text: 'Aidez-le à mieux comprendre votre cycle et vos différentes étapes'},
  {icon: 'hand-heart-outline', text: 'Recevez plus de soutien au quotidien'},
  {icon: 'shield-lock-outline', text: 'Vous gardez toujours le contrôle de vos informations'},
];

// Entrance sequence (ms): illustration → title + subtitle → four cards (staggered) → CTA.
export const INTRO_ENTRANCE = {
  hero: {delay: 0, duration: 520},
  title: {delay: 200, duration: 420},
  cardsStart: 380,
  cardStagger: 80,
  card: {duration: 380},
  cta: {delay: 780, duration: 400},
} as const;
const ENTRANCE = INTRO_ENTRANCE;

// Extremely subtle "breathing" of the illustration once it has settled: 1 → 1.01 → 1.
const BREATHE_SCALE = 1.01;
const BREATHE_HALF_CYCLE = 3600;

type BenefitItemProps = {
  icon: IconName;
  text: string;
  index: number;
  iconSize: number;
  reduceMotion: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
};

/** One benefit card — the same structure and size for all four; only its delay differs. */
const BenefitItem = memo(function BenefitItem({icon, text, index, iconSize, reduceMotion, theme, styles}: BenefitItemProps) {
  const entrance = useEntrance(
    ENTRANCE.cardsStart + index * ENTRANCE.cardStagger,
    ENTRANCE.card.duration,
    reduceMotion,
    10,
  );
  return (
    <Animated.View style={[styles.benefitRow, entrance]}>
      <View style={styles.benefitIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={iconSize} />
      </View>
      <Text maxFontSizeMultiplier={1.15} style={styles.benefitText}>{text}</Text>
    </Animated.View>
  );
});

export default function AwaADeuxIntroScreen({navigation}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const layout = useMemo(() => getIntroLayout(height, insets.top, insets.bottom), [height, insets.top, insets.bottom]);
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);

  // Illustration: entrance, then a barely visible breathing loop.
  const breathe = useSharedValue(1);
  const startBreathing = () => {
    'worklet';
    breathe.value = withRepeat(
      withSequence(
        withTiming(BREATHE_SCALE, {duration: BREATHE_HALF_CYCLE, easing: Easing.inOut(Easing.sin)}),
        withTiming(1, {duration: BREATHE_HALF_CYCLE, easing: Easing.inOut(Easing.sin)}),
      ),
      -1,
      false,
    );
  };
  const heroEntrance = useEntrance(ENTRANCE.hero.delay, ENTRANCE.hero.duration, reduceMotion, 14, 0.96, startBreathing);
  const heroBreathing = useAnimatedStyle(() => ({transform: [{scale: breathe.value}]}));
  useEffect(() => () => cancelAnimation(breathe), [breathe]);

  const titleEntrance = useEntrance(ENTRANCE.title.delay, ENTRANCE.title.duration, reduceMotion, 10);
  const ctaEntrance = useEntrance(ENTRANCE.cta.delay, ENTRANCE.cta.duration, reduceMotion, 10, 0.97);

  // CTA press feedback: quick scale down, release back to 1.
  const pressScale = useSharedValue(1);
  const ctaPress = useAnimatedStyle(() => ({transform: [{scale: pressScale.value}]}));

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      {/* Back button — below the status bar */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={8}
          onPress={navigation.goBack}
          style={({pressed}) => [styles.back, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
        </Pressable>
      </View>

      {/* Everything else shares the remaining height: no scrolling. */}
      <View style={styles.body}>
        {/* HERO — decorative (the title below says it all): not announced */}
        <Animated.View style={[styles.heroBox, heroEntrance]}>
          <Animated.View style={[styles.heroFill, heroBreathing]}>
            <Image
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              resizeMode="contain"
              source={HERO_IMAGE}
              style={styles.heroImage}
            />
          </Animated.View>
        </Animated.View>

        <Animated.View style={titleEntrance}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.15} style={styles.title}>AWA à deux</Text>
          <Text maxFontSizeMultiplier={1.15} style={styles.subtitle}>{'Avancez ensemble,\nà votre rythme.'}</Text>
        </Animated.View>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit, index) => (
            <BenefitItem
              key={benefit.text}
              icon={benefit.icon}
              iconSize={layout.benefitIconSize}
              index={index}
              reduceMotion={reduceMotion}
              styles={styles}
              text={benefit.text}
              theme={theme}
            />
          ))}
        </View>
      </View>

      {/* CTA — always at the bottom of the same screen, above the Android navigation area */}
      <View style={styles.footer}>
        {/* Two nested wrappers: two animated `transform` styles on one view would override each other. */}
        <Animated.View style={ctaEntrance}>
          <Animated.View style={ctaPress}>
            <Pressable
              accessibilityLabel="Découvrir AWA à deux"
              accessibilityRole="button"
              onPress={() => navigation.navigate('AwaADeuxPartnerName')}
              onPressIn={() => {
                pressScale.value = withTiming(0.97, {duration: 90});
              }}
              onPressOut={() => {
                pressScale.value = withTiming(1, {duration: 140});
              }}
              style={({pressed}) => [styles.cta, pressed && styles.pressed]}>
              <Text maxFontSizeMultiplier={1.15} style={styles.ctaText}>Découvrir</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme, layout: IntroLayout) {
  return StyleSheet.create({
    screen: {flex: 1, backgroundColor: theme.colors.background},
    header: {paddingHorizontal: 20, paddingTop: layout.headerTop, paddingBottom: 4},
    back: {
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      padding: 9,
      elevation: 2,
    },
    // The remaining height, its content centered as a group.
    body: {flex: 1, minHeight: 0, justifyContent: 'center', paddingHorizontal: 20},
    // The illustration is the flexible element: its basis is the cap, and it shrinks
    // (down to a floor) when the screen is short. Transparent PNG: no box behind it.
    heroBox: {
      flexGrow: 0,
      flexShrink: 1,
      flexBasis: layout.heroMaxHeight,
      minHeight: INTRO_HERO_MIN_HEIGHT,
      alignSelf: 'stretch',
    },
    heroFill: {flex: 1},
    heroImage: {width: '100%', height: '100%'},
    title: {
      marginTop: layout.titleMarginTop,
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: layout.titleFontSize,
      lineHeight: layout.titleLineHeight,
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitle: {
      marginTop: layout.subtitleMarginTop,
      color: theme.colors.textSecondary,
      fontSize: layout.subtitleFontSize,
      lineHeight: layout.subtitleLineHeight,
      textAlign: 'center',
    },
    benefits: {marginTop: layout.benefitsMarginTop, gap: layout.benefitGap},
    benefitRow: {
      minHeight: layout.benefitCardMinHeight,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: layout.benefitPaddingHorizontal,
      paddingVertical: layout.benefitPaddingVertical,
      ...theme.shadow,
    },
    benefitIcon: {
      width: layout.benefitIconBox,
      height: layout.benefitIconBox,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.benefitIconBox / 2,
      backgroundColor: theme.colors.primarySoft,
    },
    benefitText: {
      flex: 1,
      minWidth: 0,
      color: theme.colors.text,
      fontSize: layout.benefitFontSize,
      lineHeight: layout.benefitLineHeight,
      fontWeight: '600',
    },
    footer: {paddingHorizontal: 20, paddingTop: 10, paddingBottom: layout.footerBottom},
    cta: {
      minHeight: layout.ctaHeight,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: layout.ctaHeight / 2,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
    },
    ctaText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}
