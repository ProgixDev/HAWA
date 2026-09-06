import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';

import {
  PREMIUM_PRICING,
  type PremiumPlan,
} from '../../config/premiumPricing';
import {usePremium} from '../../hooks/usePremium';
import {purchasePremium, restorePurchases} from '../../services/purchaseService';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type Props = {
  visible: boolean;
  onClose: () => void;
};

type IconName =
  React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Benefit = {
  icon: IconName;
  title: string;
  description: string;
  tint: string;
  iconColor: string;
};

// Category E — fixed Premium brand identity (the hero banner, its crown/
// star emblem, the CTA button's own gradient, and the "RECOMMANDÉ" ribbon)
// stays gold/deep-violet regardless of the active AWA theme/palette, the
// same way Premium's identity is fixed everywhere else in the app (e.g. the
// gold/violet brand colors documented in prior Dark Mode audits). Every
// other structural color (sheet surface, generic text, borders, cards,
// selection state, success/secure indicators, footer) is now resolved from
// `theme` inside createStyles(theme) instead of being a fixed literal here.
const COLORS = {
  deepSecondary: '#3D2278',
  pinkLight: '#F9E8F2',
  gold: '#F2C76D',
  goldLight: '#FFF4D7',
};

const BENEFITS: Benefit[] = [
  {
    icon: 'chart-timeline-variant',
    title: 'Statistiques avancées',
    description: 'Analyse ton évolution sur 3, 6 et 12 mois.',
    tint: '#EEE8FB',
    iconColor: '#7454C8',
  },
  {
    icon: 'file-document-outline',
    title: 'Exports santé',
    description: 'Génère facilement tes rapports PDF et CSV.',
    tint: '#E9EEFB',
    iconColor: '#607EBD',
  },
  {
    icon: 'infinity',
    title: 'Historique illimité',
    description: 'Retrouve toutes tes données sans limite.',
    tint: '#F1E9FB',
    iconColor: '#8A5BC2',
  },
  {
    icon: 'book-open-page-variant-outline',
    title: 'Guides approfondis',
    description: 'Accède à des contenus éducatifs exclusifs.',
    tint: '#FCECF3',
    iconColor: '#C26193',
  },
  {
    icon: 'palette-outline',
    title: 'Plus de personnalisation',
    description: 'Profite de thèmes et réglages supplémentaires.',
    tint: '#E8F5F2',
    iconColor: '#4F9185',
  },
];

export function HawaPremiumBottomSheet({
  visible,
  onClose,
}: Props): React.JSX.Element | null {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  /*
   * Responsive breakpoints
   */
  const isCompact = width < 370;
  const isVeryCompact = width < 340;

  const [mounted, setMounted] = useState(visible);
  const [plan, setPlan] = useState<PremiumPlan>('annual');
  const [reduceMotion, setReduceMotion] = useState(false);

  // THE canonical Premium state (src/state/premiumStore.ts) — never a local
  // `isPremium` snapshot. `feedback` is purely transient UI copy about the
  // LAST subscribe/restore attempt's outcome; it never itself decides
  // whether Premium is unlocked.
  const {isPremium, purchaseInProgress, restoreInProgress} = usePremium();
  const [feedback, setFeedback] = useState<{tone: 'success' | 'neutral' | 'error'; message: string} | null>(null);

  const progress = useRef(new Animated.Value(0)).current;
  const crownFloat = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  /*
   * ============================================================
   * RESPONSIVE SHEET STYLE
   * ============================================================
   *
   * IMPORTANT:
   * On calcule maxHeight ici au lieu de le mettre directement
   * dans le JSX.
   *
   * Cela évite le warning :
   *
   * Inline style: {
   *   maxHeight: ...
   * }
   */
  const responsiveSheetStyle = useMemo(
    () => ({
      maxHeight: (height < 700 ? '96%' : '93%') as `${number}%`,
      paddingBottom: Math.max(insets.bottom, 8),
    }),
    [height, insets.bottom],
  );

  /*
   * Responsive padding pour le contenu.
   */
  const responsiveScrollStyle = useMemo(
    () => ({
      paddingHorizontal: isCompact ? 13 : 17,
    }),
    [isCompact],
  );

  /*
   * Respect du réglage Android/iOS :
   * réduire les animations.
   */
  useEffect(() => {
    let active = true;

    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) {
        setReduceMotion(value);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  /*
   * Animation ouverture / fermeture du BottomSheet.
   */
  useEffect(() => {
    if (visible) {
      setMounted(true);

      Animated.timing(progress, {
        toValue: 1,
        duration: reduceMotion ? 0 : 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: reduceMotion ? 0 : 230,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
      });
    }
  }, [progress, reduceMotion, visible]);

  /*
   * Animations Premium :
   *
   * - couronne
   * - halo / sparkle
   */
  useEffect(() => {
    if (!visible || reduceMotion) {
      crownFloat.setValue(0);
      sparkle.setValue(0);

      return;
    }

    const crownLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(crownFloat, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(crownFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),

        Animated.timing(sparkle, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    crownLoop.start();
    sparkleLoop.start();

    return () => {
      crownLoop.stop();
      sparkleLoop.stop();
    };
  }, [
    crownFloat,
    reduceMotion,
    sparkle,
    visible,
  ]);

  const selectedPricing = useMemo(
    () => PREMIUM_PRICING[plan],
    [plan],
  );

  /*
   * ============================================================
   * ANIMATIONS
   * ============================================================
   */

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const sheetScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  const heroOpacity = progress.interpolate({
    inputRange: [0.2, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const heroTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const crownTranslateY = crownFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  const crownRotate = crownFloat.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1.08],
  });

  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.95],
  });

  /*
   * Ici les Animated.Value sont séparés des valeurs
   * responsive classiques.
   */
  const animatedSheetStyle = useMemo(
    () => ({
      transform: [
        {
          translateY,
        },
        {
          scale: sheetScale,
        },
      ],
    }),
    [sheetScale, translateY],
  );

  const heroAnimatedStyle = useMemo(
    () => ({
      opacity: heroOpacity,
      transform: [
        {
          translateY: heroTranslateY,
        },
      ],
    }),
    [heroOpacity, heroTranslateY],
  );

  const emblemGlowAnimatedStyle = useMemo(
    () => ({
      opacity: sparkleOpacity,
      transform: [
        {
          scale: sparkleScale,
        },
      ],
    }),
    [sparkleOpacity, sparkleScale],
  );

  const crownAnimatedStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: crownTranslateY,
        },
        {
          rotate: crownRotate,
        },
      ],
    }),
    [crownRotate, crownTranslateY],
  );

  const buttonAnimatedStyle = useMemo(
    () => ({
      transform: [
        {
          scale: buttonScale,
        },
      ],
    }),
    [buttonScale],
  );

  if (!mounted) {
    return null;
  }

  /*
   * ============================================================
   * SUBSCRIBE
   * ============================================================
   */

  const handleSubscribe = async () => {
    if (purchaseInProgress || restoreInProgress) {return;}
    setFeedback(null);

    const outcome = await purchasePremium(plan);

    if (outcome === 'success') {
      setFeedback({tone: 'success', message: 'AWA Premium est maintenant actif. Merci !'});
      return;
    }
    if (outcome === 'cancelled') {
      // Not a fatal error — she simply closed the payment sheet.
      return;
    }
    if (outcome === 'unavailable') {
      setFeedback({
        tone: 'neutral',
        message: 'Aucun achat ne sera activé tant que le système de paiement n’est pas connecté.',
      });
      return;
    }
    setFeedback({tone: 'error', message: 'Une erreur est survenue. Réessaie dans un instant.'});
  };

  /*
   * ============================================================
   * RESTORE
   * ============================================================
   */

  const handleRestore = async () => {
    if (purchaseInProgress || restoreInProgress) {return;}
    setFeedback(null);

    const outcome = await restorePurchases();

    if (outcome === 'success') {
      setFeedback({tone: 'success', message: 'Tes achats ont été restaurés.'});
      return;
    }
    if (outcome === 'cancelled') {
      return;
    }
    if (outcome === 'unavailable') {
      setFeedback({
        tone: 'neutral',
        message: 'Aucun achat ne sera activé tant que le système de paiement n’est pas connecté.',
      });
      return;
    }
    setFeedback({tone: 'error', message: 'Impossible de restaurer tes achats pour le moment.'});
  };

  const animateButton = (pressed: boolean) => {
    Animated.spring(buttonScale, {
      toValue: pressed ? 0.975 : 1,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible>

      {/* ======================================================
          BACKDROP
      ====================================================== */}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          styles.absoluteFill,
          {
            opacity: progress,
          },
        ]}
      />

      <Pressable
        accessibilityLabel="Fermer AWA Premium"
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      {/* ======================================================
          PREMIUM BOTTOM SHEET
      ====================================================== */}

      <Animated.View
        style={[
          styles.sheet,
          responsiveSheetStyle,
          animatedSheetStyle,
        ]}>

        {/* ====================================================
            HERO
        ==================================================== */}

        <LinearGradient
          colors={[
            '#2B155E',
            '#482589',
            '#663EB1',
          ]}
          end={{
            x: 1,
            y: 1,
          }}
          start={{
            x: 0,
            y: 0,
          }}
          style={[
            styles.hero,
            isCompact && styles.heroCompact,
          ]}>

          {/* Decorative glow */}
          <View style={styles.heroOrbTop} />
          <View style={styles.heroOrbBottom} />
          <View style={styles.heroOrbSmall} />

          {/* Handle */}
          <View style={styles.handle} />

          <Animated.View
            style={[
              styles.heroContent,
              heroAnimatedStyle,
            ]}>

            {/* =================================================
                PREMIUM EMBLEM
            ================================================= */}

            <View style={styles.emblemWrapper}>

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.emblemGlow,
                  emblemGlowAnimatedStyle,
                ]}
              />

              <View style={styles.emblemOuter}>
                <Animated.View
                  style={[
                    styles.emblemInner,
                    crownAnimatedStyle,
                  ]}>
                  <MaterialDesignIcons
                    color={COLORS.gold}
                    name="crown"
                    size={isVeryCompact ? 27 : 31}
                  />
                </Animated.View>
              </View>

              <View style={styles.emblemStar}>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="star-four-points"
                  size={9}
                />
              </View>
            </View>

            {/* =================================================
                HERO TEXT
            ================================================= */}

            <View style={styles.heroCopy}>

              <View style={styles.titleLine}>
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  numberOfLines={1}
                  style={[
                    styles.heroTitle,
                    isCompact &&
                      styles.heroTitleCompact,
                  ]}>
                  AWA Premium
                </Text>

                {!isVeryCompact ? (
                  <View style={styles.premiumBadge}>
                    <MaterialDesignIcons
                      color={COLORS.gold}
                      name="star-four-points"
                      size={9}
                    />

                    <Text
                      style={
                        styles.premiumBadgeText
                      }>
                      PREMIUM
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.heroSubtitle,
                  isCompact &&
                    styles.heroSubtitleCompact,
                ]}>
                Une expérience plus complète,
                pensée pour toi.
              </Text>
            </View>

            {/* CLOSE */}

            <Pressable
              accessibilityLabel="Fermer AWA Premium"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={({pressed}) => [
                styles.closeButton,
                pressed &&
                  styles.closeButtonPressed,
              ]}>
              <MaterialDesignIcons
                color="#FFFFFF"
                name="close"
                size={21}
              />
            </Pressable>
          </Animated.View>
        </LinearGradient>

        {/* ====================================================
            SCROLLABLE CONTENT
        ==================================================== */}

        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            responsiveScrollStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ==================================================
              INTRO
          ================================================== */}

          <View style={styles.introRow}>

            <View style={styles.introCopy}>
              <Text style={styles.eyebrow}>
                TON EXPÉRIENCE PREMIUM
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  isCompact &&
                    styles.sectionTitleCompact,
                ]}>
                Plus de possibilités,
                simplement.
              </Text>

              <Text style={styles.sectionSubtitle}>
                Débloque les outils qui enrichissent
                ton suivi au quotidien.
              </Text>
            </View>

            <View style={styles.sparkleBubble}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="star-four-points-outline"
                size={20}
              />
            </View>
          </View>

          {/* ==================================================
              BENEFITS
          ================================================== */}

          <View style={styles.benefits}>
            {BENEFITS.map((item, index) => {
              const isLast =
                index === BENEFITS.length - 1;

              return (
                <View
                  key={item.title}
                  style={[
                    styles.benefitCard,
                    isCompact &&
                      styles.benefitCardCompact,
                    isLast &&
                      styles.benefitCardWide,
                  ]}>

                  <View
                    style={[
                      styles.benefitIcon,
                      {
                        backgroundColor:
                          item.tint,
                      },
                    ]}>
                    <MaterialDesignIcons
                      color={item.iconColor}
                      name={item.icon}
                      size={21}
                    />
                  </View>

                  <View style={styles.benefitCopy}>
                    <Text
                      style={
                        styles.benefitTitle
                      }>
                      {item.title}
                    </Text>

                    <Text
                      style={
                        styles.benefitDescription
                      }>
                      {item.description}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.benefitCheck
                    }>
                    <MaterialDesignIcons
                      color={pickReadableTextColor(theme.colors.success)}
                      name="check"
                      size={10}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* ==================================================
              PLAN HEADER
          ================================================== */}

          <View style={styles.planHeadingRow}>

            <View style={styles.planHeadingCopy}>
              <Text style={styles.eyebrow}>
                TON ABONNEMENT
              </Text>

              <Text
                style={[
                  styles.sectionTitle,
                  isCompact &&
                    styles.sectionTitleCompact,
                ]}>
                Choisis la formule qui te convient
              </Text>

              <Text style={styles.sectionSubtitle}>
                Modifie ton choix librement avant
                de continuer.
              </Text>
            </View>

            <View style={styles.secureBadge}>
              <MaterialDesignIcons
                color={theme.colors.success}
                name="shield-check-outline"
                size={15}
              />

              {!isVeryCompact ? (
                <Text
                  style={
                    styles.secureBadgeText
                  }>
                  Sécurisé
                </Text>
              ) : null}
            </View>
          </View>

          {/* ==================================================
              ANNUAL PLAN
          ================================================== */}

          <PlanCard
            checked={plan === 'annual'}
            detail={PREMIUM_PRICING.annual.detail}
            label={PREMIUM_PRICING.annual.label}
            onPress={() => setPlan('annual')}
            price={PREMIUM_PRICING.annual.price}
            recommended
          />

          {/* ==================================================
              MONTHLY PLAN
          ================================================== */}

          <PlanCard
            checked={plan === 'monthly'}
            detail={PREMIUM_PRICING.monthly.detail}
            label={PREMIUM_PRICING.monthly.label}
            onPress={() => setPlan('monthly')}
            price={PREMIUM_PRICING.monthly.price}
          />

          {/* ==================================================
              SECURITY
          ================================================== */}

          <View style={styles.securityCard}>

            <View style={styles.securityIcon}>
              <MaterialDesignIcons
                color={theme.colors.success}
                name="shield-check-outline"
                size={21}
              />
            </View>

            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>
                Paiement via la plateforme
              </Text>

              <Text style={styles.securityText}>
                Tes achats et abonnements seront
                gérés par Google Play ou l’App Store.
              </Text>
            </View>

            <MaterialDesignIcons
              color={theme.colors.textMuted}
              name="chevron-right"
              size={20}
            />
          </View>

          {/* ==================================================
              PREMIUM CTA — replaced by an active-status confirmation
              once Premium is genuinely unlocked, never a misleading
              "Subscribe" CTA shown to an already-Premium user.
          ================================================== */}

          {isPremium ? (
            <View accessibilityRole="alert" style={styles.activeStatusCard}>
              <View style={styles.activeStatusIconCircle}>
                <MaterialDesignIcons color={theme.colors.success} name="check-circle" size={22} />
              </View>
              <View style={styles.ctaCopy}>
                <Text style={styles.activeStatusTitle}>Abonnement actif</Text>
                <Text style={styles.activeStatusSubtitle}>Merci de soutenir AWA — profite de tous les avantages Premium.</Text>
              </View>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.ctaWrapper,
                buttonAnimatedStyle,
              ]}>

              <Pressable
                accessibilityHint={purchaseInProgress ? 'Achat en cours' : undefined}
                accessibilityLabel="S’abonner à AWA Premium"
                accessibilityRole="button"
                accessibilityState={{disabled: purchaseInProgress || restoreInProgress, busy: purchaseInProgress}}
                disabled={purchaseInProgress || restoreInProgress}
                onPress={handleSubscribe}
                onPressIn={() =>
                  animateButton(true)
                }
                onPressOut={() =>
                  animateButton(false)
                }
                style={(purchaseInProgress || restoreInProgress) && styles.ctaDisabled}>

                <LinearGradient
                  colors={[
                    '#4B278E',
                    '#6740B7',
                    '#8D4EB5',
                  ]}
                  end={{
                    x: 1,
                    y: 1,
                  }}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  style={styles.cta}>

                  <View style={styles.ctaShine} />

                  <View
                    style={
                      styles.ctaIconCircle
                    }>
                    {purchaseInProgress ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <MaterialDesignIcons
                        color={COLORS.gold}
                        name="crown"
                        size={20}
                      />
                    )}
                  </View>

                  <View style={styles.ctaCopy}>
                    <Text style={styles.ctaText}>
                      {purchaseInProgress ? 'Achat en cours…' : 'S’abonner maintenant'}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={styles.ctaSubText}>
                      {selectedPricing.label}
                      {' · '}
                      {selectedPricing.price}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.ctaArrowCircle
                    }>
                    <MaterialDesignIcons
                      color="#FFFFFF"
                      name="arrow-right"
                      size={18}
                    />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* ==================================================
              RESTORE
          ================================================== */}

          {!isPremium ? (
            <Pressable
              accessibilityLabel="Restaurer mes achats"
              accessibilityRole="button"
              accessibilityState={{disabled: purchaseInProgress || restoreInProgress, busy: restoreInProgress}}
              disabled={purchaseInProgress || restoreInProgress}
              onPress={handleRestore}
              style={({pressed}) => [
                styles.restoreButton,
                pressed && styles.pressed,
                (purchaseInProgress || restoreInProgress) && styles.ctaDisabled,
              ]}>
              {restoreInProgress ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="restore"
                  size={17}
                />
              )}

              <Text style={styles.restoreText}>
                {restoreInProgress ? 'Restauration en cours…' : 'Restaurer mes achats'}
              </Text>
            </Pressable>
          ) : null}

          {feedback ? (
            <View
              accessibilityRole="alert"
              style={[
                styles.feedbackCard,
                feedback.tone === 'success' && styles.feedbackCardSuccess,
                feedback.tone === 'error' && styles.feedbackCardError,
              ]}>
              <Text style={styles.feedbackText}>{feedback.message}</Text>
            </View>
          ) : null}

          {!isPremium ? (
            <Text style={styles.footerText}>
              Aucun achat ne sera activé tant que le
              système de paiement n’est pas connecté.
            </Text>
          ) : null}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

/* ============================================================
   PLAN CARD
============================================================ */

function PlanCard({
  checked,
  detail,
  label,
  onPress,
  price,
  recommended = false,
}: {
  checked: boolean;
  detail: string;
  label: string;
  onPress: () => void;
  price: string;
  recommended?: boolean;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={`Choisir ${label}`}
      accessibilityRole="radio"
      accessibilityState={{
        checked,
      }}
      onPress={onPress}
      style={({pressed}) => [
        styles.planCard,
        checked && styles.planCardSelected,
        pressed && styles.planPressed,
      ]}>

      {recommended ? (
        <View style={styles.recommendedBadge}>
          <MaterialDesignIcons
            color={COLORS.goldLight}
            name="star"
            size={10}
          />

          <Text style={styles.recommendedText}>
            RECOMMANDÉ
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.planRadio,
          checked && styles.planRadioSelected,
        ]}>
        {checked ? (
          <View style={styles.planRadioInner} />
        ) : null}
      </View>

      <View style={styles.planMain}>

        <View style={styles.planTitleRow}>
          <Text style={styles.planTitle}>
            {label}
          </Text>

          {recommended ? (
            <View style={styles.savingBadge}>
              <Text style={styles.savingText}>
                Meilleur choix
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.planDescription}>
          {detail}
        </Text>

        {recommended ? (
          <View style={styles.planFeatureRow}>
            <MaterialDesignIcons
              color={theme.colors.success}
              name="check-circle"
              size={13}
            />

            <Text
              style={
                styles.planFeatureText
              }>
              Accès Premium pendant 12 mois
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.planPriceArea}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={1}
          style={styles.planPrice}>
          {price}
        </Text>
      </View>
    </Pressable>
  );
}

/* ============================================================
   STYLES
============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },

  backdrop: {
    backgroundColor: 'rgba(18,9,38,0.72)',
  },

  sheet: {
    position: 'absolute',

    right: 0,
    bottom: 0,
    left: 0,

    overflow: 'hidden',

    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,

    backgroundColor: theme.colors.surface,

    shadowColor: '#17082E',
    shadowOffset: {
      width: 0,
      height: -12,
    },
    shadowOpacity: 0.28,
    shadowRadius: 26,

    elevation: 28,
  },

  /* ============================================================
     HERO
  ============================================================ */

  hero: {
    position: 'relative',

    overflow: 'hidden',

    paddingHorizontal: 18,
    paddingBottom: 22,
  },

  heroCompact: {
    paddingHorizontal: 14,
    paddingBottom: 18,
  },

  heroOrbTop: {
    position: 'absolute',

    top: -95,
    right: -55,

    width: 205,
    height: 205,

    borderRadius: 103,

    backgroundColor:
      'rgba(188,126,255,0.19)',
  },

  heroOrbBottom: {
    position: 'absolute',

    bottom: -95,
    left: -52,

    width: 180,
    height: 180,

    borderRadius: 90,

    backgroundColor:
      'rgba(228,114,175,0.15)',
  },

  heroOrbSmall: {
    position: 'absolute',

    top: 22,
    right: 86,

    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor:
      'rgba(255,255,255,0.035)',
  },

  handle: {
    alignSelf: 'center',

    width: 45,
    height: 4,

    marginTop: 10,
    marginBottom: 16,

    borderRadius: 2,

    backgroundColor:
      'rgba(255,255,255,0.48)',
  },

  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* ============================================================
     PREMIUM EMBLEM
  ============================================================ */

  emblemWrapper: {
    position: 'relative',

    width: 64,
    height: 64,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',
  },

  emblemGlow: {
    position: 'absolute',

    width: 64,
    height: 64,

    borderRadius: 32,

    backgroundColor:
      'rgba(229,180,255,0.28)',
  },

  emblemOuter: {
    width: 56,
    height: 56,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.19)',

    borderRadius: 28,

    backgroundColor:
      'rgba(255,255,255,0.09)',
  },

  emblemInner: {
    width: 45,
    height: 45,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 23,

    backgroundColor:
      'rgba(78,39,143,0.85)',
  },

  emblemStar: {
    position: 'absolute',

    top: 2,
    right: 1,

    width: 19,
    height: 19,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: '#563096',

    borderRadius: 10,

    backgroundColor: '#A26BDA',
  },

  heroCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 12,
    marginRight: 8,
  },

  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',

    gap: 7,
  },

  heroTitle: {
    color: '#FFFFFF',

    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '900',

    letterSpacing: -0.3,
  },

  heroTitleCompact: {
    fontSize: 21,
  },

  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 3,

    borderWidth: 1,
    borderColor:
      'rgba(244,199,109,0.35)',

    borderRadius: 8,

    backgroundColor:
      'rgba(244,199,109,0.11)',

    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  premiumBadgeText: {
    color: '#FFE5A2',

    fontSize: 7.5,
    fontWeight: '900',

    letterSpacing: 0.7,
  },

  heroSubtitle: {
    maxWidth: 240,

    marginTop: 5,

    color: '#E9DFF6',

    fontSize: 11.5,
    lineHeight: 16,

    fontWeight: '500',
  },

  heroSubtitleCompact: {
    fontSize: 10.5,
    lineHeight: 14,
  },

  closeButton: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.14)',

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.10)',
  },

  closeButtonPressed: {
    opacity: 0.75,

    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  /* ============================================================
     CONTENT
  ============================================================ */

  scrollContent: {
    paddingTop: 20,
    paddingBottom: 12,
  },

  eyebrow: {
    color: theme.colors.primary,

    fontSize: 8.5,
    fontWeight: '900',

    letterSpacing: 1.15,
  },

  introRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  introCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    marginTop: 4,

    color: theme.colors.text,

    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '900',

    lineHeight: 25,
  },

  sectionTitleCompact: {
    fontSize: 18,
    lineHeight: 23,
  },

  sectionSubtitle: {
    maxWidth: 300,

    marginTop: 4,

    color: theme.colors.textSecondary,

    fontSize: 11,
    lineHeight: 16,

    fontWeight: '500',
  },

  sparkleBubble: {
    width: 38,
    height: 38,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 10,

    borderRadius: 14,

    backgroundColor: theme.colors.primarySoft,
  },

  /* ============================================================
     BENEFITS
  ============================================================ */

  benefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 9,

    marginTop: 15,
  },

  benefitCard: {
    position: 'relative',

    flexBasis: '47%',
    flexGrow: 1,

    minWidth: 140,
    minHeight: 110,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 19,

    backgroundColor: theme.colors.surface,

    padding: 12,

    shadowColor: '#563892',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.045,
    shadowRadius: 8,

    elevation: 1,
  },

  benefitCardCompact: {
    flexBasis: '100%',

    minHeight: 76,

    flexDirection: 'row',
    alignItems: 'center',
  },

  benefitCardWide: {
    flexBasis: '100%',

    minHeight: 80,

    flexDirection: 'row',
    alignItems: 'center',
  },

  benefitIcon: {
    width: 42,
    height: 42,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,
  },

  benefitCopy: {
    flex: 1,
    minWidth: 0,
  },

  benefitTitle: {
    marginTop: 8,

    color: theme.colors.text,

    fontSize: 12,
    lineHeight: 16,

    fontWeight: '900',
  },

  benefitDescription: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 9.8,
    lineHeight: 14,

    fontWeight: '500',
  },

  benefitCheck: {
    position: 'absolute',

    top: 9,
    right: 9,

    width: 18,
    height: 18,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 9,

    backgroundColor: theme.colors.success,
  },

  divider: {
    height: StyleSheet.hairlineWidth,

    marginVertical: 22,

    backgroundColor:
      withAlpha(theme.colors.primary, 0.13),
  },

  /* ============================================================
     PLAN HEADING
  ============================================================ */

  planHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  planHeadingCopy: {
    flex: 1,
    minWidth: 0,
  },

  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,

    marginLeft: 8,

    borderRadius: 11,

    backgroundColor: withAlpha(theme.colors.success, 0.14),

    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  secureBadgeText: {
    color: theme.colors.success,

    fontSize: 9,
    fontWeight: '800',
  },

  /* ============================================================
     PLAN CARD
  ============================================================ */

  planCard: {
    position: 'relative',

    minHeight: 94,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 13,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 21,

    backgroundColor: theme.colors.surface,

    paddingHorizontal: 13,
    paddingVertical: 14,
  },

  planCardSelected: {
    borderWidth: 1.6,
    borderColor: theme.colors.primary,

    backgroundColor: theme.colors.primarySoft,

    shadowColor: theme.colors.primary,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.1,
    shadowRadius: 11,

    elevation: 3,
  },

  planPressed: {
    opacity: 0.9,

    transform: [
      {
        scale: 0.993,
      },
    ],
  },

  recommendedBadge: {
    position: 'absolute',

    top: -10,
    right: 14,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,

    borderRadius: 10,

    backgroundColor: COLORS.deepSecondary,

    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  recommendedText: {
    color: '#FFFFFF',

    fontSize: 7.5,
    fontWeight: '900',

    letterSpacing: 0.5,
  },

  planRadio: {
    width: 23,
    height: 23,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1.6,
    borderColor: theme.colors.border,

    borderRadius: 12,

    backgroundColor: theme.colors.surface,
  },

  planRadioSelected: {
    borderColor: theme.colors.primary,

    backgroundColor: theme.colors.primarySoft,
  },

  planRadioInner: {
    width: 11,
    height: 11,

    borderRadius: 6,

    backgroundColor: theme.colors.primary,
  },

  planMain: {
    flex: 1,
    minWidth: 0,

    marginLeft: 11,
    marginRight: 8,
  },

  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',

    gap: 6,
  },

  planTitle: {
    color: theme.colors.text,

    fontSize: 15,
    fontWeight: '900',
  },

  savingBadge: {
    borderRadius: 8,

    backgroundColor: COLORS.pinkLight,

    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  savingText: {
    color: '#B95786',

    fontSize: 8,
    fontWeight: '800',
  },

  planDescription: {
    marginTop: 3,

    color: theme.colors.textSecondary,

    fontSize: 10.2,
    lineHeight: 14,
  },

  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,

    marginTop: 6,
  },

  planFeatureText: {
    flexShrink: 1,

    color: theme.colors.success,

    fontSize: 9,
    fontWeight: '700',
  },

  planPriceArea: {
    maxWidth: 95,

    flexShrink: 1,

    alignItems: 'flex-end',
  },

  planPrice: {
    color: theme.colors.accent,

    fontSize: 12,
    fontWeight: '900',

    textAlign: 'right',
  },

  /* ============================================================
     SECURITY
  ============================================================ */

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 14,

    borderWidth: 1,
    borderColor: theme.colors.border,

    borderRadius: 18,

    backgroundColor: theme.colors.surface,

    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  securityIcon: {
    width: 38,
    height: 38,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: withAlpha(theme.colors.success, 0.14),
  },

  securityCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 9,
    marginRight: 6,
  },

  securityTitle: {
    color: theme.colors.text,

    fontSize: 11.5,
    fontWeight: '800',
  },

  securityText: {
    marginTop: 2,

    color: theme.colors.textSecondary,

    fontSize: 9.3,
    lineHeight: 13,
  },

  /* ============================================================
     CTA
  ============================================================ */

  ctaWrapper: {
    marginTop: 18,

    borderRadius: 29,

    // Shadow beneath the CTA's own fixed Premium gradient — stays fixed
    // alongside it, not theme-derived.
    shadowColor: '#7252C7',

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.23,
    shadowRadius: 13,

    elevation: 7,
  },

  cta: {
    position: 'relative',

    minHeight: 60,

    flexDirection: 'row',
    alignItems: 'center',

    overflow: 'hidden',

    borderRadius: 29,

    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  ctaShine: {
    position: 'absolute',

    top: -42,
    right: -15,

    width: 130,
    height: 130,

    borderRadius: 65,

    backgroundColor:
      'rgba(255,255,255,0.08)',
  },

  ctaIconCircle: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.14)',

    borderRadius: 20,

    backgroundColor:
      'rgba(255,255,255,0.10)',
  },

  ctaCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },

  ctaText: {
    color: '#FFFFFF',

    fontSize: 14.5,
    fontWeight: '900',
  },

  ctaSubText: {
    marginTop: 1,

    color: '#E9DDF8',

    fontSize: 9.2,
    fontWeight: '600',
  },

  ctaArrowCircle: {
    width: 35,
    height: 35,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor:
      'rgba(255,255,255,0.12)',
  },

  /* ============================================================
     RESTORE / FOOTER
  ============================================================ */

  restoreButton: {
    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    marginTop: 8,

    paddingHorizontal: 15,
    paddingVertical: 11,
  },

  restoreText: {
    color: theme.colors.primary,

    fontSize: 11.5,
    fontWeight: '800',
  },

  footerText: {
    marginHorizontal: 15,
    marginBottom: 5,

    color: theme.colors.textMuted,

    fontSize: 8.3,
    lineHeight: 12,

    textAlign: 'center',
  },

  pressed: {
    opacity: 0.75,
  },

  ctaDisabled: {
    opacity: 0.6,
  },

  activeStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.success, 0.14),
    backgroundColor: withAlpha(theme.colors.success, 0.14),
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activeStatusIconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  activeStatusTitle: {
    color: theme.colors.text,
    fontSize: 14.5,
    fontWeight: '800',
  },
  activeStatusSubtitle: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },

  feedbackCard: {
    marginTop: 10,
    marginHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedbackCardSuccess: {
    borderColor: withAlpha(theme.colors.success, 0.14),
    backgroundColor: withAlpha(theme.colors.success, 0.14),
  },
  feedbackCardError: {
    borderColor: withAlpha(theme.colors.danger, 0.25),
    backgroundColor: withAlpha(theme.colors.danger, 0.1),
  },
  feedbackText: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  });
}