import React, {memo, useMemo} from 'react';
import {
  Image,
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
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
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

const benefitsOf = (t: (key: string) => string): Array<{icon: IconName; text: string}> => [
  {icon: 'share-variant-outline', text: t('awaADeux.intro.benefit1')},
  {icon: 'calendar-heart', text: t('awaADeux.intro.benefit2')},
  {icon: 'hand-heart-outline', text: t('awaADeux.intro.benefit3')},
  {icon: 'shield-lock-outline', text: t('awaADeux.intro.benefit4')},
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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const layout = useMemo(() => getIntroLayout(height, insets.top, insets.bottom), [height, insets.top, insets.bottom]);
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const BENEFITS = useMemo(() => benefitsOf(t), [t]);

  // DESIGN.md: the illustration only has a one-shot entrance (the former looping
  // "breathing" was decorative motion and was removed).
  const heroEntrance = useEntrance(ENTRANCE.hero.delay, ENTRANCE.hero.duration, reduceMotion, 14, 0.96);

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
        <AwaIconButton
          accessibilityLabel={t('common.back')}
          icon="chevron-left"
          iconSize={28}
          onPress={navigation.goBack}
          style={styles.back}
        />
      </View>

      {/* Everything else shares the remaining height: no scrolling. */}
      <View style={styles.body}>
        {/* HERO — decorative (the title below says it all): not announced */}
        <Animated.View style={[styles.heroBox, heroEntrance]}>
          <View style={styles.heroFill}>
            <Image
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              resizeMode="contain"
              source={HERO_IMAGE}
              style={styles.heroImage}
            />
          </View>
        </Animated.View>

        <Animated.View style={titleEntrance}>
          <AwaText accessibilityRole="header" maxFontSizeMultiplier={1.15} variant="headlineSmall" style={styles.title}>{t('profile.awaADeuxTitle')}</AwaText>
          <AwaText colorRole="onSurfaceVariant" maxFontSizeMultiplier={1.15} variant="bodyMedium" style={styles.subtitle}>{t('awaADeux.intro.subtitle')}</AwaText>
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
            <AwaButton
              accessibilityLabel={t('awaADeux.intro.discoverAccessibility')}
              fullWidth
              label={t('awaADeux.intro.discoverCta')}
              minHeight={layout.ctaHeight}
              onPress={() => navigation.navigate('AwaADeuxPartnerName')}
              onPressIn={() => {
                pressScale.value = withTiming(0.97, {duration: 90});
              }}
              onPressOut={() => {
                pressScale.value = withTiming(1, {duration: 140});
              }}
            />
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
    back: {alignSelf: 'flex-start'},
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
      fontSize: layout.titleFontSize,
      lineHeight: layout.titleLineHeight,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: layout.subtitleMarginTop,
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
      borderRadius: 12,
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
  });
}
