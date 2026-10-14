import React, {useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../theme/componentDimensions';
import {touchTargetHitSlop} from '../theme/iconSizes';
import {awaSpace} from '../theme/spaceScale';
import {AWA_PRIMARY_ACTION_LABEL} from '../theme/typescale';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaText} from '../components/ui/AwaText';

// Phase 3 pilot, Welcome redesign (reference mock supplied by the product owner): a calm first screen made of the AWA
// lockup, one sentence, and two stacked buttons, with the hero in the upper part of the space above them. Design-system rules
// applied: Material 3 type roles (AwaText), the shared AwaButton in its 56 dp large height, colour roles from the
// resolved theme, no hardcoded colours or font sizes.
//
// Three sections (upper hero, flexible space, lower buttons) live inside a ScrollView whose content grows to at least
// the viewport, so the layout is identical when it fits and scrolls instead of clipping on a short phone or with a
// large font scale. The lockup is ONE heading for screen readers (a composed label built from the same three
// translations), not three separate texts.
//
// Unchanged: navigation targets (Objective / Auth), labels and accessibility labels, the status bar handling and the
// page gradient root. The AWA lockup keeps its serif face (approved branding element). The privacy card with its three
// feature tiles that used to sit between the hero and the buttons is no longer shown on this screen; its translations
// are untouched.

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

/** A broad, premium CTA presence, while retaining 24 dp screen gutters on narrow phones and a cap on wide screens. */
const BUTTON_WIDTH_RATIO = 0.84;
const BUTTON_MAX_WIDTH = 360;
const BUTTON_GAP = 16;
const BUTTON_SIDE_PADDING = 24;
const SCREEN_MARGIN = 24;
/** The action group floats above the system bar by 9% of the screen height (clamped), so it is never glued to the bottom. */
const BOTTOM_LIFT_RATIO = 0.09;
const BOTTOM_LIFT_MIN = 48;
const BOTTOM_LIFT_MAX = 80;
/** Button label size (sp) of the shared primary-action label. One constant feeds both the label style and the width
 * estimate below, so a long translation still fits. The weight (700) comes from the same shared token. */
const LABEL_FONT_SIZE = AWA_PRIMARY_ACTION_LABEL.fontSize;
/** Places the lockup around the upper quarter of the usable screen while adapting to phone height. */
const HERO_TOP_SPACING_RATIO = 0.14;

/** Rough label width (dp) at `size` sp: hanzi are square, capitals wider, the rest averaged. Used only to widen the
 * buttons for long translations (e.g. German "Ich habe bereits ein Konto"), never to shrink them. */
function estimateLabelWidth(label: string, size: number): number {
  return (
    Array.from(label).reduce(
      (sum, char) => sum + (/[　-鿿]/.test(char) ? 1 : /[A-ZÀ-Þ]/.test(char) ? 0.7 : 0.58),
      0,
    ) * size
  );
}

function WelcomeScreen({navigation}: Props): React.JSX.Element {
  const {t} = useTranslation();
  const {height, width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const startLabel = t('onboarding.welcome.start');
  const accountLabel = t('onboarding.welcome.alreadyHaveAccount');
  // The lockup is drawn as three styled texts ("Bienvenue" / "chez" / "AWA"); screen readers get one heading.
  const lockupLabel = [t('onboarding.welcome.title'), t('onboarding.welcome.brandPrefix'), 'AWA'].join(' ');

  // The reference mock (360 x 640) uses the display sizes; only very narrow phones step the lockup down.
  const narrow = width < 340;

  const buttonHeight = AWA_COMPONENT_DIMENSION_PROPOSALS.button.large; // 56 dp, the documented large CTA size
  const labelNeed =
    Math.max(estimateLabelWidth(startLabel, LABEL_FONT_SIZE), estimateLabelWidth(accountLabel, LABEL_FONT_SIZE)) + BUTTON_SIDE_PADDING * 2 + 16;
  const buttonWidth = Math.round(
    Math.min(
      width - SCREEN_MARGIN * 2,
      Math.max(Math.min(width * BUTTON_WIDTH_RATIO, BUTTON_MAX_WIDTH), labelNeed),
    ),
  );
  // Keep the shared touch-target calculation explicit for every supported screen width.
  const buttonHitSlop = touchTargetHitSlop(buttonWidth, buttonHeight);

  const safeTopSpacing = Math.max(insets.top, awaSpace.s8);
  const safeBottomSpacing = Math.max(insets.bottom, awaSpace.s16);
  const availableHeight = Math.max(height - safeTopSpacing - safeBottomSpacing, 0);
  const heroTopSpacing = Math.max(awaSpace.s24, Math.round(availableHeight * HERO_TOP_SPACING_RATIO));
  const bottomLift = Math.min(BOTTOM_LIFT_MAX, Math.max(BOTTOM_LIFT_MIN, Math.round(height * BOTTOM_LIFT_RATIO)));
  const bottomSpacing = safeBottomSpacing + bottomLift;

  /* ============================================================
     ANIMATIONS (title and actions entrance)
  ============================================================ */

  const titleAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [actionsAnim, titleAnim]);

  const titleStyle = {
    opacity: titleAnim,
    transform: [
      {
        translateY: titleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const actionsStyle = {
    opacity: actionsAnim,
    transform: [
      {
        translateY: actionsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.page, {paddingTop: safeTopSpacing}]}
          showsVerticalScrollIndicator={false}>
          {/* A height-relative offset keeps the hero in the upper quarter across Android phone sizes. */}
          <View style={[styles.heroRegion, {paddingTop: heroTopSpacing}]}>
            <Animated.View style={[styles.hero, titleStyle]}>
              <View
                accessibilityLabel={lockupLabel}
                accessibilityRole="header"
                accessible
                style={styles.lockup}>
                <AwaText
                  style={styles.lockupTitle}
                  variant={narrow ? 'headlineLarge' : 'displaySmall'}
                  weight="600">
                  {t('onboarding.welcome.title')}
                </AwaText>

                <View style={styles.brandLine}>
                  <AwaText
                    style={styles.lockupPrefix}
                    variant={narrow ? 'headlineSmall' : 'headlineMedium'}>
                    {t('onboarding.welcome.brandPrefix')}
                  </AwaText>

                  <AwaText
                    colorRole="primary"
                    style={styles.lockupBrand}
                    variant={narrow ? 'headlineLarge' : 'displaySmall'}
                    weight="800">
                    {' '}
                    AWA
                  </AwaText>
                </View>
              </View>

              <View style={styles.brandDivider}>
                <View style={styles.brandDividerLine} />
                <View style={styles.brandDividerDot} />
                <View style={styles.brandDividerLine} />
              </View>

              <AwaText
                colorRole="onSurfaceVariant"
                style={styles.subtitle}
                variant="bodyMedium">
                {t('onboarding.welcome.subtitle')}
              </AwaText>
            </Animated.View>
          </View>

          <View style={styles.middleSpacer} />

          <Animated.View style={[styles.actions, {paddingBottom: bottomSpacing}, actionsStyle]}>
            <AwaButton
              accessibilityLabel={startLabel}
              hitSlop={buttonHitSlop}
              label={startLabel}
              labelStyle={styles.buttonLabel}
              onPress={() => navigation.navigate('Objective')}
              size="large"
              style={{width: buttonWidth}}
              variant="filled"
              weight={AWA_PRIMARY_ACTION_LABEL.fontWeight}
            />

            <AwaButton
              accessibilityLabel={accountLabel}
              hitSlop={buttonHitSlop}
              label={accountLabel}
              labelStyle={styles.buttonLabel}
              onPress={() => navigation.navigate('Auth')}
              size="large"
              style={[styles.secondaryAction, {width: buttonWidth}]}
              variant="outlined"
              weight={AWA_PRIMARY_ACTION_LABEL.fontWeight}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    safeArea: {
      flex: 1,
    },

    // ScrollView content container: at least one viewport tall (`flexGrow`), so the flexible spacer still pushes the
    // buttons to the bottom when everything fits, and the content scrolls when it does not.
    page: {
      flexGrow: 1,
      paddingHorizontal: 18,
    },

    heroRegion: {
      justifyContent: 'flex-start',
    },

    middleSpacer: {
      flex: 1,
      minHeight: awaSpace.s24,
    },

    hero: {
      alignItems: 'center',
      paddingHorizontal: 10,
    },

    // Brand lockup: serif is kept on purpose (AWA logotype / welcome title).
    lockup: {
      alignItems: 'center',
    },

    lockupTitle: {
      fontFamily: 'serif',
      textAlign: 'center',
    },

    brandLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: -6,
    },

    lockupPrefix: {
      fontFamily: 'serif',
      fontStyle: 'italic',
    },

    lockupBrand: {
      fontFamily: 'serif',
      letterSpacing: 0.5,
    },

    brandDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },

    brandDividerLine: {
      width: 42,
      height: 1,
      backgroundColor: withAlpha(theme.colors.primary, 0.25),
    },

    brandDividerDot: {
      width: 5,
      height: 5,
      marginHorizontal: 9,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },

    subtitle: {
      maxWidth: 260,
      marginTop: 8,
      textAlign: 'center',
    },

    actions: {
      alignItems: 'center',
    },

    buttonLabel: {
      fontSize: LABEL_FONT_SIZE,
    },

    secondaryAction: {
      marginTop: BUTTON_GAP,
    },
  });
}

export default WelcomeScreen;
