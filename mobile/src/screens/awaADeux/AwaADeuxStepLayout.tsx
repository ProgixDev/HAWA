import React, {useMemo} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {useEntrance} from './useEntrance';

// Shared frame of the "AWA à deux" onboarding screens (after the introduction):
// page gradient, back button, an animated title + description, scrollable content
// and an optional sticky "Continuer" button. Everything is colored by the resolved
// AWA theme (useAwaTheme) — there is no AWA-à-deux palette.
//
// Motion (react-native-reanimated, opacity / transform only): title, then the
// description, then the content blocks one after another (<Reveal index>), then the
// CTA. Reduced motion skips it; the final UI is identical.

export const STEP_ENTRANCE = {
  title: {delay: 0, duration: 380},
  description: {delay: 90, duration: 380},
  revealStart: 200,
  revealStagger: 70,
  reveal: {duration: 360},
  cta: {delay: 640, duration: 380},
} as const;

/**
 * Optional "fit on one screen" mode: no ScrollView, the content shares the remaining
 * height, and these sizes replace the scrolling defaults. Off by default.
 */
export type StepFit = {
  titleFontSize: number;
  titleLineHeight: number;
  bodyMarginTop: number;
  bodyGap: number;
  ctaHeight: number;
};

/** Tighter title / spacing for a SCROLLING screen (which stays scrollable when it must). */
export type StepCompact = Pick<StepFit, 'titleFontSize' | 'titleLineHeight' | 'bodyMarginTop' | 'bodyGap'>;

type Props = {
  title: string;
  description?: string;
  /** Sticky bottom button; omitted on the last screen of the flow. */
  ctaLabel?: string;
  onContinue?: () => void;
  onBack: () => void;
  fit?: StepFit;
  compact?: StepCompact;
  children: React.ReactNode;
};

/** One content block that enters after the title, staggered by `index`. */
export function Reveal({index, children}: {index: number; children: React.ReactNode}): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const style = useEntrance(
    STEP_ENTRANCE.revealStart + index * STEP_ENTRANCE.revealStagger,
    STEP_ENTRANCE.reveal.duration,
    reduceMotion,
    10,
  );
  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function AwaADeuxStepLayout({
  title,
  description,
  ctaLabel,
  onContinue,
  onBack,
  fit,
  compact,
  children,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const titleEntrance = useEntrance(STEP_ENTRANCE.title.delay, STEP_ENTRANCE.title.duration, reduceMotion, 10);
  const descriptionEntrance = useEntrance(
    STEP_ENTRANCE.description.delay,
    STEP_ENTRANCE.description.duration,
    reduceMotion,
    8,
  );
  const ctaEntrance = useEntrance(STEP_ENTRANCE.cta.delay, STEP_ENTRANCE.cta.duration, reduceMotion, 10, 0.97);

  // CTA press feedback: quick scale down, release back to 1.
  const pressScale = useSharedValue(1);
  const ctaPress = useAnimatedStyle(() => ({transform: [{scale: pressScale.value}]}));

  // Title, description and content — the same in both modes; `fit` only swaps a few sizes.
  const heading = (
    <>
      <Animated.View style={titleEntrance}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.2}
          style={[styles.title, fit || compact ? {fontSize: (fit ?? compact)!.titleFontSize, lineHeight: (fit ?? compact)!.titleLineHeight} : null]}>
          {title}
        </Text>
      </Animated.View>
      {description ? (
        <Animated.View style={descriptionEntrance}>
          <Text maxFontSizeMultiplier={1.2} style={styles.description}>{description}</Text>
        </Animated.View>
      ) : null}

      <View
        style={[
          styles.body,
          fit ? [styles.bodyFit, {marginTop: fit.bodyMarginTop, gap: fit.bodyGap}] : null,
          !fit && compact ? {marginTop: compact.bodyMarginTop, gap: compact.bodyGap} : null,
        ]}>
        {children}
      </View>
    </>
  );

  return (
    <LinearGradient colors={[...theme.gradients.pageBackground]} style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />

      <View style={[styles.header, {paddingTop: Math.max(insets.top, 18) + 8}]}>
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({pressed}) => [styles.back, pressed && styles.pressed]}>
          <MaterialDesignIcons color={theme.colors.primary} name="chevron-left" size={28} />
        </Pressable>
      </View>

      {fit ? (
        <View style={[styles.content, styles.fitContent]}>{heading}</View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, !ctaLabel && {paddingBottom: Math.max(insets.bottom, 16) + 24}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {heading}
        </ScrollView>
      )}

      {/* Sticky CTA: below the scroll area, so nothing is hidden behind it, and above the Android navigation area */}
      {ctaLabel ? (
        <View style={[styles.footer, {paddingBottom: Math.max(insets.bottom, 16) + 8}]}>
          <Animated.View style={ctaEntrance}>
            <Animated.View style={ctaPress}>
              <Pressable
                accessibilityLabel={ctaLabel}
                accessibilityRole="button"
                onPress={onContinue}
                onPressIn={() => {
                  pressScale.value = withTiming(0.97, {duration: 90});
                }}
                onPressOut={() => {
                  pressScale.value = withTiming(1, {duration: 140});
                }}
                style={({pressed}) => [styles.cta, fit ? {minHeight: fit.ctaHeight, borderRadius: fit.ctaHeight / 2} : null, pressed && styles.pressed]}>
                <Text maxFontSizeMultiplier={1.2} style={styles.ctaText}>{ctaLabel}</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    screen: {flex: 1, backgroundColor: theme.colors.background},
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
    content: {flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20},
    title: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 27,
      lineHeight: 34,
      fontWeight: '700',
      textAlign: 'center',
    },
    description: {
      marginTop: 10,
      paddingHorizontal: 6,
      color: theme.colors.textSecondary,
      fontSize: 14.5,
      lineHeight: 21,
      textAlign: 'center',
    },
    fitContent: {flex: 1, flexGrow: 1, minHeight: 0},
    body: {marginTop: 22, gap: 12},
    bodyFit: {flex: 1, justifyContent: 'center'},
    footer: {paddingHorizontal: 20, paddingTop: 10},
    cta: {
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 27,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
    },
    ctaText: {color: onPrimaryTextColor(theme), fontSize: 16, fontWeight: '700'},
    pressed: {opacity: 0.85},
  });
}
