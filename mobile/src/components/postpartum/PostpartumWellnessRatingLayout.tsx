import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import { useAwaTheme } from '../../theme/AwaThemeProvider';
import { onPrimaryTextColor, withAlpha, type ResolvedAwaTheme } from '../../theme/awaThemeTokens';
import {WCAG_AA_TEXT, ensureContrast} from '../../theme/contrast';
import {deriveAwaRoles} from '../../theme/semanticRoles';
import { getTopPadding } from '../../theme/spacing';
import '../../i18n';
import {AwaButton} from '../ui/AwaButton';
import {AwaIconButton} from '../ui/AwaIconButton';
import {AwaText} from '../ui/AwaText';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

export type WellnessRatingOption = {
  label: string;
  /** PHASE 7H — optional DISPLAY-ONLY translation of `label` (which stays the
   * DATA-BEARING, persisted/compared/selected value — see each caller's own
   * comment). Falls back to `label` itself when omitted, so any other future
   * caller that doesn't set it keeps today's exact behavior. */
  displayLabel?: string;
  description: string;
  icon: IconName;
  tint: string;
};

/** Fields shared by every banner hero (a wide photo: pale side on the left, subject on the right). */
type HeroBannerCommon = {
  /** Fallback width / height of the picture file (the real one is read from the bundled asset, see heroBannerRatio). */
  ratio: number;
  /** Width of the text column and of the title / description inside it (they must stay on the pale side). */
  copyWidth: `${number}%`;
  textMaxWidth: `${number}%`;
};
/** `box`: the picture fills a clip box on the right of the card and fades into the card surface on its left. */
type HeroBannerBox = HeroBannerCommon & {
  layout: 'box';
  /** Width of the clip box on the right of the card that shows the right part of the picture (fraction of the card). */
  boxShare: number;
  /** Width of the fade into the card surface, as a fraction of the box. */
  fadeShare: number;
  /** Picture height as a fraction of the card WIDTH (keeps the subject's size, and so its left edge, proportional on
   * every phone). Omitted: the picture is as tall as the card. */
  heightShare?: number;
  /** The picture is never drawn taller than this (dp). */
  maxHeight: number;
};
/** `fill`: the picture is the full-bleed background of the card (all four edges, no offsets) and a left-to-right scrim in
 * the card-surface colour, strong on the left and fading out toward the right, keeps the text readable. */
type HeroBannerFill = HeroBannerCommon & {
  layout: 'fill';
  /** The picture is shifted right as far as it can go while its x position `focusRight` (fraction of the picture width)
   * still lies inside the card, so the subject sits at the right and nothing the subject needs is cropped. */
  focusRight: number;
  /** Scrim stops as [position across the card 0..1, opacity of the card-surface colour]. */
  scrim: ReadonlyArray<readonly [number, number]>;
};
export type HeroBannerSpec = HeroBannerBox | HeroBannerFill;
// `ratio` is only the fallback: the picture's real width / height is read from the bundled asset (heroBannerRatio), so
// replacing an illustration by one of another size cannot distort or crop it.
// postpartum-pain.png (1908 x 824): subject on the right 42 %.
export const HERO_BANNER_PAIN: HeroBannerSpec = {layout: 'box', ratio: 1908 / 824, boxShare: 0.58, fadeShare: 0.34, maxHeight: 220, copyWidth: '68%', textMaxWidth: '76%'};
// The text column of a `fill` hero ends at about 45 - 46 % of the card width on every phone (copy 62 % of the card, title and
// description at most 71 % of that, plus the 16 dp padding), so the scrim stays at FULL opacity up to 47 %: the text always
// sits on the plain card surface and its contrast is the contrast of its colour on that surface (heroBannerFillTextColors).
export const HERO_BANNER_FILL_TEXT_END = 0.47;
// postpartum-fatigue.png (1916 x 821): a full-bleed background (cover, shifted right so the woman, the mug and the raised
// arm, which end at 94 % of the picture, stay inside the card) under a scrim that is solid behind the text column and then
// fades out quickly, so the mug (from about 55 % of the card) and the face (from about 65 %) stay clear. No separate
// rectangles, so no seam.
export const HERO_BANNER_FATIGUE: HeroBannerSpec = {
  layout: 'fill',
  ratio: 1916 / 821,
  focusRight: 0.94,
  scrim: [[0, 1], [HERO_BANNER_FILL_TEXT_END, 1], [0.53, 0.5], [0.59, 0.12], [0.66, 0]],
  copyWidth: '62%',
  textMaxWidth: '71%',
};
// postpartum-recovery.png (1448 x 1086, 4:3): taller than the other two, so it is drawn as tall as the card (no top fade
// needed, which also keeps the picture's own rounded corners inside the card's clip) and only its right 52 % shows: the
// woman (face, hand on the chest, folded legs) and the lavender; the plain wall on the left is what the text replaces.
export const HERO_BANNER_RECOVERY: HeroBannerSpec = {layout: 'box', ratio: 1448 / 1086, boxShare: 0.52, fadeShare: 0.22, maxHeight: 240, copyWidth: '66%', textMaxWidth: '72%'};
const HERO_BANNER_FALLBACK = {width: 320, height: 176};
// WCAG AA for normal text (4.5:1) plus 0.1 of margin, so anti-aliasing and rounding never take the text under it.
export const HERO_BANNER_TEXT_CONTRAST = WCAG_AA_TEXT + 0.1;
// Heading and description colours of a `fill` hero: the theme's own tokens (the accent ink and the AA-safe on-surface-variant),
// checked against the card surface they sit on (the scrim is that surface at full opacity behind the text) and nudged toward the
// theme text colour only as far as needed to reach HERO_BANNER_TEXT_CONTRAST. Most palettes keep their token exactly.
export function heroBannerFillTextColors(theme: ResolvedAwaTheme): {heading: string; description: string} {
  const surface = theme.colors.primarySoft;
  const roles = deriveAwaRoles(theme);
  return {
    heading: ensureContrast(theme.colors.accent, surface, HERO_BANNER_TEXT_CONTRAST, theme.colors.text),
    description: ensureContrast(roles.accessible.onSurfaceVariant, surface, HERO_BANNER_TEXT_CONTRAST, theme.colors.text),
  };
}
const HERO_BANNER_TOP_FADE = 28;
const HERO_BANNER_BORDER = 1; // styles.hero borderWidth
// Heading -> description gap of a banner hero: the same 5 dp as the Humeur / Sommeil hero (PostpartumCycleStyleJournalLayout).
export const HERO_BANNER_DESCRIPTION_GAP = 5;
// The picture's size in dp, at the file's exact ratio, whatever the card size (explicit numbers: see styles.heroBannerImage).
const heroBannerRatio = (source: ImageSourcePropType, fallback: number): number => {
  const resolved = Image.resolveAssetSource(source);
  return resolved && resolved.width > 0 && resolved.height > 0 ? resolved.width / resolved.height : fallback;
};
const heroBannerPhotoSize = (spec: HeroBannerBox, ratio: number, card: {width: number; height: number}) => {
  const height = Math.min(card.height, spec.maxHeight, spec.heightShare ? spec.heightShare * card.width : Infinity);
  return {width: Math.round(height * ratio), height: Math.round(height)};
};
// Full-bleed layer, in the card's own coordinates (inside its 1 dp border): `cover` scale at the file's exact ratio, so the
// picture touches all four edges; shifted right so `focusRight` of it lands on the card's right edge (never past the
// picture's own right edge, so no gap opens); centred vertically when a wide card crops its top and bottom.
export const heroBannerFillLayout = (spec: HeroBannerFill, ratio: number, card: {width: number; height: number}) => {
  const innerWidth = Math.max(card.width - 2 * HERO_BANNER_BORDER, 0);
  const innerHeight = Math.max(card.height - 2 * HERO_BANNER_BORDER, 0);
  const height = Math.max(innerHeight, innerWidth / ratio);
  const width = height * ratio;
  const left = Math.min(0, Math.max(innerWidth - width, innerWidth - spec.focusRight * width));
  return {left, top: (innerHeight - height) / 2, width, height};
};

type Props = {
  title: string;
  dateLabel: string;
  heroTitle: string;
  heroText: string;
  heroImage: ImageSourcePropType;
  /** The hero image is a wide banner photo (pale left side, subject on the right) instead of a small cut-out figure: its
   * right part fills the right of the card at the file's own aspect ratio, fading into the card surface, and the text
   * stays on the themed card surface (no text over the photo). */
  heroBanner?: boolean | HeroBannerSpec;
  options: WellnessRatingOption[];
  selected?: string;
  onSelect: (value: string) => void;
  adviceTitle: string;
  adviceText: string;
  adviceIcon: IconName;
  error?: string;
  saving?: boolean;
  onSave: () => void;
  /** Optional: shown only when there is a saved answer to clear (M25). */
  onClear?: () => void;
};

export function PostpartumWellnessRatingLayout({
  title,
  dateLabel,
  heroTitle,
  heroText,
  heroImage,
  heroBanner = false,
  options,
  selected,
  onSelect,
  adviceTitle,
  adviceText,
  adviceIcon,
  error,
  saving,
  onSave,
  onClear,
}: Props): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  // Banner mode: the photo layer is sized in explicit dp from the card's measured height (see heroBannerPhotoSize).
  const [heroCard, setHeroCard] = useState(HERO_BANNER_FALLBACK);
  const banner = heroBanner === true ? HERO_BANNER_PAIN : heroBanner || null;
  const bannerRatio = banner ? heroBannerRatio(heroImage, banner.ratio) : 0;
  const fillText = useMemo(() => (banner?.layout === 'fill' ? heroBannerFillTextColors(theme) : null), [banner, theme]);
  const photo = banner?.layout === 'box' ? heroBannerPhotoSize(banner, bannerRatio, heroCard) : null;
  const entrance = useRef(new Animated.Value(0)).current;
  const rowAnimations = useMemo(
    () => options.map(() => new Animated.Value(0)),
    [options],
  );

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (!active) {
        return;
      }

      const duration = reduceMotion ? 0 : 360;
      Animated.parallel([
        Animated.timing(entrance, {
          toValue: 1,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          reduceMotion ? 0 : 55,
          rowAnimations.map(animation =>
            Animated.timing(animation, {
              toValue: 1,
              duration: reduceMotion ? 0 : 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
        ),
      ]).start();
    });

    return () => {
      active = false;
    };
  }, [entrance, rowAnimations]);

  return (
    <View style={styles.safe}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={theme.statusBarStyle}
        translucent
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View
          style={[
            styles.header,
            { paddingTop: getTopPadding(insets.top, true) },
          ]}
        >
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={navigation.goBack}
            icon="chevron-left"
            iconSize={28}
          />
          <View style={styles.headerCopy}>
            <AwaText variant="headlineSmall" style={styles.headerTitle}>
              {title}
            </AwaText>
            <AwaText variant="bodySmall" colorRole="onSurfaceVariant" numberOfLines={1} style={styles.headerDate}>
              {dateLabel}
            </AwaText>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 104 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            onLayout={banner ? event => {
              const {width, height} = event.nativeEvent.layout;
              setHeroCard(previous => (previous.width === width && previous.height === height ? previous : {width, height}));
            } : undefined}
            style={[
              styles.hero,
              banner && styles.heroBannerCard,
              {
                opacity: entrance,
                transform: [
                  {
                    translateY: entrance.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {banner?.layout === 'fill' ? (
              <>
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="cover"
                  source={heroImage}
                  style={[styles.heroBannerFillImage, heroBannerFillLayout(banner, bannerRatio, heroCard)]}
                />
                <LinearGradient
                  colors={banner.scrim.map(([, alpha]) => withAlpha(theme.colors.primarySoft, alpha))}
                  end={{x: 1, y: 0}}
                  locations={banner.scrim.map(([position]) => position)}
                  pointerEvents="none"
                  start={{x: 0, y: 0}}
                  style={styles.heroBannerFillScrim}
                />
              </>
            ) : null}
            {banner?.layout === 'box' ? (
              <View pointerEvents="none" style={[styles.heroBannerPhoto, {width: `${banner.boxShare * 100}%`}]}>
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="cover"
                  source={heroImage}
                  style={[styles.heroBannerImage, photo]}
                />
                {photo && heroCard.height - photo.height > 1 ? (
                  <LinearGradient
                    colors={[theme.colors.primarySoft, withAlpha(theme.colors.primarySoft, 0)]}
                    end={{x: 0, y: 1}}
                    start={{x: 0, y: 0}}
                    style={[styles.heroBannerTopFade, {top: heroCard.height - photo.height - 1}]}
                  />
                ) : null}
                <LinearGradient
                  colors={[theme.colors.primarySoft, withAlpha(theme.colors.primarySoft, 0)]}
                  end={{x: 1, y: 0}}
                  start={{x: 0, y: 0}}
                  style={[styles.heroBannerFade, {width: `${banner.fadeShare * 100}%`}]}
                />
              </View>
            ) : null}
            <View style={[styles.heroCopy, banner && styles.heroBannerCopy, banner && {width: banner.copyWidth}]}>
              <View style={styles.heroKicker}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="heart-pulse"
                  size={15}
                />
                <AwaText variant="labelSmall" colorRole="primary" numberOfLines={1}>{t('postpartumWellnessRatingLayout.kicker')}</AwaText>
              </View>
              <AwaText variant={banner ? 'titleMedium' : 'headlineSmall'} style={[styles.heroTitle, banner && {maxWidth: banner.textMaxWidth}, fillText && {color: fillText.heading}]}>{heroTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={[styles.heroText, banner && {maxWidth: banner.textMaxWidth, marginTop: HERO_BANNER_DESCRIPTION_GAP}, fillText && {color: fillText.description}]}>{heroText}</AwaText>
            </View>
            {banner ? null : (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={heroImage}
                style={styles.heroImage}
              />
            )}
          </Animated.View>

          <AwaText variant="headlineSmall" style={styles.sectionTitle}>
            {t('postpartumWellnessRatingLayout.sectionTitle')}
          </AwaText>
          <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.sectionText}>
            {t('postpartumWellnessRatingLayout.sectionText')}
          </AwaText>

          <View style={styles.options}>
            {options.map((option, index) => {
              const active = selected === option.label;
              const animation = rowAnimations[index];
              return (
                <Animated.View
                  key={option.label}
                  style={{
                    opacity: animation,
                    transform: [
                      {
                        translateY: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <Pressable
                    accessibilityLabel={option.displayLabel ?? option.label}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => onSelect(option.label)}
                    style={({ pressed }) => [
                      styles.option,
                      active && styles.optionActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: option.tint },
                      ]}
                    >
                      <MaterialDesignIcons
                        color={active ? theme.colors.primary : theme.colors.textMuted}
                        name={option.icon}
                        size={25}
                      />
                    </View>
                    <View style={styles.optionCopy}>
                      <Text
                        style={[
                          styles.optionLabel,
                          active && styles.optionLabelActive,
                        ]}
                      >
                        {option.displayLabel ?? option.label}
                      </Text>
                      <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.optionDescription}>
                        {option.description}
                      </AwaText>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? (
                        <MaterialDesignIcons
                          color={onPrimaryTextColor(theme)}
                          name="check"
                          size={16}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.advice}>
            <View style={styles.adviceIcon}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name={adviceIcon}
                size={24}
              />
            </View>
            <View style={styles.adviceCopy}>
              <AwaText variant="titleSmall" style={styles.adviceTitle}>{adviceTitle}</AwaText>
              <AwaText variant="bodySmall" colorRole="onSurfaceVariant" style={styles.adviceText}>{adviceText}</AwaText>
            </View>
          </View>
          {error ? (
            <AwaText variant="labelMedium" colorRole="error" accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </AwaText>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.saveWrap,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <AwaButton
            accessibilityLabel={t('common.save')}
            accessibilityRole="button"
            disabled={saving}
            onPress={onSave}
            label={saving ? t('postpartumWellnessRatingLayout.saving') : t('postpartumWellnessRatingLayout.saveButtonLabel')}
            icon="content-save-outline"
            size="large"
          />

          {onClear ? (
            <AwaButton
              accessibilityLabel={t('postpartumWellnessRatingLayout.clearAnswer')}
              accessibilityRole="button"
              disabled={saving}
              onPress={onClear}
              label={t('postpartumWellnessRatingLayout.clearAnswer')}
              variant="text"
              style={styles.clearButton}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: {color: theme.colors.accent},
  headerDate: {marginTop: 2},
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  hero: {
    minHeight: 176,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    flexDirection: 'row',
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  heroCopy: { zIndex: 1, flex: 1, padding: 20, paddingRight: 0 },
  heroKicker: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.surface, 0.7),
  },
  heroTitle: {marginTop: 14, color: theme.colors.accent},
  heroText: {marginTop: 7, maxWidth: 190},
  // Banner mode (see `heroBanner`). The photo box is clipped to the right part of the card; the picture inside it is
  // given EXPLICIT dp dimensions at the file's own ratio (heroBannerPhotoSize), anchored bottom-right, so the subject
  // is never stretched, zoomed or re-centred by a layout engine's `cover` / aspect-ratio resolution (an auto-width image
  // between top/bottom insets was resolved to the box width and cropped to the middle of the picture). The pale left
  // side of the picture is the part left out; the text column sits on the themed card surface and may only be crossed
  // by the photo's fade. The badge may run into the faded strip (it has its own scrim), the title and description may not.
  heroBannerCard: {minHeight: 164},
  heroBannerPhoto: {position: 'absolute', top: 0, bottom: 0, right: 0, overflow: 'hidden'},
  heroBannerImage: {position: 'absolute', right: 0, bottom: 0},
  heroBannerFade: {position: 'absolute', top: 0, bottom: 0, left: 0},
  heroBannerTopFade: {position: 'absolute', left: 0, right: 0, height: HERO_BANNER_TOP_FADE},
  // `fill` layout: both layers are absolute children of the card itself (the outer, rounded, overflow-hidden container), so
  // they share its coordinate system and cover it edge to edge; the text column is the only content in the flow, above them.
  heroBannerFillImage: {position: 'absolute'},
  heroBannerFillScrim: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0},
  heroBannerCopy: {flex: 0, paddingVertical: 14, paddingLeft: 16},
  heroImage: {
    position: 'absolute',
    right: -31,
    bottom: -14,
    width: 172,
    height: 190,
  },
  sectionTitle: {marginTop: 27, color: theme.colors.accent},
  sectionText: {marginTop: 6},
  options: { marginTop: 16, gap: 10 },
  option: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  optionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    shadowOpacity: 0.11,
  },
  optionIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  optionCopy: { flex: 1, marginLeft: 12, paddingRight: 8 },
  optionLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  optionLabelActive: { color: theme.colors.primary },
  optionDescription: {marginTop: 3},
  radio: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: withAlpha(theme.colors.primary, 0.2),
    borderRadius: 13,
  },
  radioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  advice: {
    marginTop: 22,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },
  adviceIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },
  adviceCopy: { flex: 1, marginLeft: 12 },
  adviceTitle: {color: theme.colors.accent},
  adviceText: {marginTop: 4},
  error: {marginTop: 14, textAlign: 'center'},
  saveWrap: {
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(theme.colors.primary, 0.12),
    backgroundColor: withAlpha(theme.colors.background, 0.97),
  },
  clearButton: {alignSelf: 'center', marginTop: 4},
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  });
}
