import React, {useMemo} from 'react';
import {ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
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
  /**
   * Opt-in, additive: disables the sticky CTA (dimmed, `disabled`, `accessibilityState`)
   * instead of calling `onContinue` — e.g. until a required field is valid. Omitted by
   * every existing caller, so their CTA stays enabled exactly as before.
   */
  ctaDisabled?: boolean;
  onContinue?: () => void;
  onBack: () => void;
  fit?: StepFit;
  compact?: StepCompact;
  /**
   * Optional visual (e.g. a small illustration) shown ABOVE the title, between the back
   * button and the title/description/content. Additive and opt-in: omitted by every
   * existing screen, so their layout and appearance are unaffected.
   */
  hero?: React.ReactNode;
  /**
   * Opt-in, additive: renders the SAME diagonal-gradient + 3-glow decoration every AWA
   * dashboard uses (PregnancyDashboard.tsx, CycleHomeScreen.tsx, …) instead of the plain
   * gradient every existing AWA à deux step already had. Off by default, so every current
   * screen's background is byte-identical; only screens that opt in (e.g. the partner
   * invitation screens) get it.
   */
  decor?: boolean;
  /**
   * Optional content rendered in the SAME header row as the back button, aligned to
   * its right (e.g. a segmented step-progress indicator — see
   * src/screens/managedProfile/ManagedProfileProgress.tsx). Additive and opt-in:
   * omitted by every existing AWA à deux screen, so their header layout is
   * byte-identical; only a caller that passes it gets the row-with-trailing-content
   * header instead of the plain back-button-only one.
   */
  headerAccessory?: React.ReactNode;
  /**
   * Opt-in, additive: makes `children` a flex container that vertically centers its
   * content in the remaining space between the description and the sticky CTA,
   * instead of the default top-stacked layout. Off by default, so every existing
   * screen's layout is unaffected. Currently unused (the managed-profile flow's old
   * type-selection screen used it to center its two cards as a group; that screen was
   * replaced by an intro screen that no longer needs it) — kept available for the next
   * screen that needs to center a small, self-contained group of content.
   */
  centerBody?: boolean;
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
  ctaDisabled,
  onContinue,
  onBack,
  fit,
  compact,
  hero,
  decor,
  headerAccessory,
  centerBody,
  children,
}: Props): React.JSX.Element {
  const {t} = useTranslation();
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
        <AwaText
          accessibilityRole="header"
          maxFontSizeMultiplier={1.2}
          variant="headlineSmall"
          style={StyleSheet.flatten([
            styles.title,
            fit || compact ? {fontSize: (fit ?? compact)!.titleFontSize, lineHeight: (fit ?? compact)!.titleLineHeight} : null,
          ])}>
          {title}
        </AwaText>
      </Animated.View>
      {description ? (
        <Animated.View style={descriptionEntrance}>
          <AwaText colorRole="onSurfaceVariant" maxFontSizeMultiplier={1.2} variant="bodyMedium" style={styles.description}>{description}</AwaText>
        </Animated.View>
      ) : null}

      <View
        style={[
          styles.body,
          fit ? [styles.bodyFit, {marginTop: fit.bodyMarginTop, gap: fit.bodyGap}] : null,
          !fit && compact ? {marginTop: compact.bodyMarginTop, gap: compact.bodyGap} : null,
          centerBody && styles.bodyCenter,
        ]}>
        {children}
      </View>
    </>
  );

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      {...(decor ? {locations: [0, 0.32, 0.7, 1], start: {x: 0, y: 0}, end: {x: 1, y: 1}} : null)}
      style={styles.screen}>
      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />


      <View style={[styles.header, headerAccessory ? styles.headerWithAccessory : null, {paddingTop: Math.max(insets.top, 18) + 8}]}>
        <AwaIconButton
          accessibilityLabel={t('common.back')}
          icon="chevron-left"
          iconSize={28}
          onPress={onBack}
          style={styles.back}
        />

        {headerAccessory}
      </View>

      {hero ? <View style={styles.hero}>{hero}</View> : null}

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
              <AwaButton
                accessibilityLabel={ctaLabel}
                disabled={ctaDisabled}
                fullWidth
                label={ctaLabel}
                minHeight={fit ? fit.ctaHeight : undefined}
                onPress={onContinue}
                onPressIn={() => {
                  pressScale.value = withTiming(0.97, {duration: 90});
                }}
                onPressOut={() => {
                  pressScale.value = withTiming(1, {duration: 140});
                }}
                size="large"
              />
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
    // Only applied when `headerAccessory` is actually passed — every existing
    // caller keeps the original back-button-only header layout untouched.
    headerWithAccessory: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
    back: {alignSelf: 'flex-start'},
    hero: {alignItems: 'center', paddingHorizontal: 20},
    content: {flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20},
    title: {
      color: theme.colors.accent,
      fontSize: 27,
      lineHeight: 34,
      textAlign: 'center',
    },
    description: {
      marginTop: 10,
      paddingHorizontal: 6,
      fontSize: 14.5,
      lineHeight: 21,
      textAlign: 'center',
    },
    fitContent: {flex: 1, flexGrow: 1, minHeight: 0},
    body: {marginTop: 22, gap: 12},
    bodyFit: {flex: 1, justifyContent: 'center'},
    // Opt-in only (centerBody) — same "grow to fill, then center" shape as bodyFit
    // above, kept as its own style rather than reusing bodyFit directly since the two
    // are conceptually independent opt-ins (fit-on-one-screen vs. center-this-group).
    bodyCenter: {flex: 1, justifyContent: 'center'},
    footer: {paddingHorizontal: 20, paddingTop: 10},
  });
}
