import React, {useMemo, useRef, useState} from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import Animated, {
  FadeIn,
  FadeInUp,
  useReducedMotion,
} from 'react-native-reanimated';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import type {RootStackParamList} from '../navigation/AppNavigator';

import {usePremium} from '../hooks/usePremium';

import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';

import {
  homeColors,
  homeRadii,
  homeShadow,
} from '../components/home/homeTheme';

import {getTopPadding} from '../theme/spacing';

import {
  getAwaThemeById,
  getEnabledAwaThemes,
  resolveAwaThemeTap,
  resolveEffectiveThemeId,
  type AwaTheme,
  type AwaThemeId,
} from '../config/awaThemes';

import {
  getAppearanceMode,
  getSelectedThemeId,
  getTrueBlackEnabled,
  hydrateAppearancePreferences,
  hydrateThemePreferences,
  setAppearanceMode,
  setSelectedThemeId,
  setTrueBlackEnabled,
  subscribeThemePreferences,
  type AwaAppearanceMode,
} from '../state/themePreferences';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Appearance'
>;

type IconName =
  React.ComponentProps<typeof MaterialDesignIcons>['name'];

type AppearanceChrome = {
  background: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  segmentTrack: string;
  chipSoft: string;
  infoCard: string;
  primary: string;
  onPrimary: string;
  statusBarStyle: 'dark-content' | 'light-content';
};

/* -------------------------------------------------------------------------- */
/*                               THEME IMAGES                                 */
/* -------------------------------------------------------------------------- */

/* AWA ORIGINAL */

const THEME_DEFAULT_IMAGE =
  require('../assets/images/themedefault.png');

/* PALETTES */

const THEME_1_IMAGE =
  require('../assets/images/theme1.png');

const THEME_2_IMAGE =
  require('../assets/images/theme2.png');

const THEME_3_IMAGE =
  require('../assets/images/theme3.png');

const THEME_4_IMAGE =
  require('../assets/images/theme4.png');

const THEME_5_IMAGE =
  require('../assets/images/theme5.png');

const THEME_IMAGES: Record<string, ImageSourcePropType> = {
  'AWA Original': THEME_DEFAULT_IMAGE,
  'Awa Original': THEME_DEFAULT_IMAGE,
  'Original': THEME_DEFAULT_IMAGE,
  'AWA': THEME_DEFAULT_IMAGE,

  'Lavender Night': THEME_1_IMAGE,
  'Rose Quartz': THEME_2_IMAGE,
  'Sage Serenity': THEME_3_IMAGE,
  'Ocean Calm': THEME_4_IMAGE,
  'Warm Sand': THEME_5_IMAGE,
};

/* -------------------------------------------------------------------------- */
/*                                   COLORS                                   */
/* -------------------------------------------------------------------------- */

const LIGHT_CHROME: AppearanceChrome = {
  background: homeColors.background,
  card: '#FFFFFF',
  border: homeColors.cardBorder,
  text: homeColors.textPrimary,
  muted: homeColors.textSecondary,
  segmentTrack: homeColors.lightLavender,
  chipSoft: homeColors.lightLavender,
  infoCard: '#F8EFFE',
  primary: homeColors.primary,
  onPrimary: '#FFFFFF',
  statusBarStyle: 'dark-content',
};

/*
 * Midnight sert seulement de palette technique
 * pour le mode sombre.
 *
 * Il ne sera pas affiché dans les cartes.
 */

const MIDNIGHT_TOKENS =
  getAwaThemeById('midnight')!.colors;

const DARK_CHROME: AppearanceChrome = {
  background:
    MIDNIGHT_TOKENS.background,

  card:
    MIDNIGHT_TOKENS.surface,

  border:
    MIDNIGHT_TOKENS.border,

  text:
    MIDNIGHT_TOKENS.text,

  muted:
    MIDNIGHT_TOKENS.textSecondary,

  segmentTrack:
    MIDNIGHT_TOKENS.surfaceSecondary,

  chipSoft:
    MIDNIGHT_TOKENS.surfaceSecondary,

  infoCard:
    MIDNIGHT_TOKENS.surfaceSecondary,

  primary:
    MIDNIGHT_TOKENS.primary,

  onPrimary:
    '#FFFFFF',

  statusBarStyle:
    'light-content',
};

const TRUE_BLACK_BACKGROUND = '#030304';
const TRUE_BLACK_CARD = '#0B0B10';

/* -------------------------------------------------------------------------- */
/*                              MODE SELECTOR                                 */
/* -------------------------------------------------------------------------- */

const MODE_OPTIONS: Array<{
  id: AwaAppearanceMode;
  label: string;
  icon: IconName;
}> = [
  {
    id: 'system',
    label: 'Système',
    icon: 'monitor',
  },
  {
    id: 'light',
    label: 'Clair',
    icon: 'white-balance-sunny',
  },
  {
    id: 'dark',
    label: 'Sombre',
    icon: 'weather-night',
  },
];

function AppearanceModeSelector({
  mode,
  onChange,
  chrome,
}: {
  mode: AwaAppearanceMode;
  onChange: (mode: AwaAppearanceMode) => void;
  chrome: AppearanceChrome;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.segmentTrack,
        {
          backgroundColor:
            chrome.segmentTrack,
        },
      ]}>
      {MODE_OPTIONS.map(option => {
        const active =
          option.id === mode;

        return (
          <Pressable
            key={option.id}
            accessibilityLabel={option.label}
            accessibilityRole="button"
            accessibilityState={{
              selected: active,
            }}
            onPress={() =>
              onChange(option.id)
            }
            style={({pressed}) => [
              styles.segmentItem,

              active && [
                styles.segmentItemActive,

                {
                  backgroundColor:
                    chrome.primary,
                },
              ],

              pressed &&
                styles.pressedSubtle,
            ]}>
            <MaterialDesignIcons
              color={
                active
                  ? chrome.onPrimary
                  : chrome.muted
              }
              name={option.icon}
              size={17}
            />

            <Text
              style={[
                styles.segmentLabel,

                {
                  color:
                    active
                      ? chrome.onPrimary
                      : chrome.muted,
                },

                active &&
                  styles.segmentLabelActive,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SECTION HEADER                                */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  icon,
  title,
  chrome,
  right,
}: {
  icon: IconName;
  title: string;
  chrome: AppearanceChrome;
  right?: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderLeft}>
        <View
          style={[
            styles.sectionIcon,

            {
              backgroundColor:
                chrome.chipSoft,
            },
          ]}>
          <MaterialDesignIcons
            color={chrome.primary}
            name={icon}
            size={17}
          />
        </View>

        <Text
          style={[
            styles.sectionTitle,

            {
              color:
                chrome.text,
            },
          ]}>
          {title}
        </Text>
      </View>

      {right}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                         DYNAMIC FALLBACK PREVIEW                           */
/* -------------------------------------------------------------------------- */

function DynamicThemePreview({
  theme,
}: {
  theme: AwaTheme;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.dynamicPreview,

        {
          backgroundColor:
            theme.colors.background,
        },
      ]}>
      <View
        style={[
          styles.dynamicPreviewInner,

          {
            backgroundColor:
              theme.colors.surface,
          },
        ]}>
        <View
          style={[
            styles.previewBar,

            {
              backgroundColor:
                theme.colors.secondary,
            },
          ]}
        />

        <View
          style={[
            styles.previewBlockSmall,

            {
              backgroundColor:
                theme.colors.primary,
            },
          ]}
        />

        <View
          style={[
            styles.previewBlockWide,

            {
              backgroundColor:
                theme.colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               THEME PREVIEW                                */
/* -------------------------------------------------------------------------- */

function ThemePreview({
  theme,
}: {
  theme: AwaTheme;
}): React.JSX.Element {
  const image =
    THEME_IMAGES[theme.name];

  if (image) {
    return (
      <View
        style={
          styles.imagePreviewContainer
        }>
        <Image
          source={image}
          style={
            styles.themePreviewImage
          }
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <DynamicThemePreview
      theme={theme}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                            CAROUSEL CONSTANTS                              */
/* -------------------------------------------------------------------------- */

/*
 * On affiche exactement 3 cartes à l'écran.
 */
const VISIBLE_CARD_COUNT = 3;

/*
 * Espace entre les cartes.
 */
const CARD_GAP = 9;

/* -------------------------------------------------------------------------- */
/*                              ACCESSIBILITY                                 */
/* -------------------------------------------------------------------------- */

function accessibilityLabelFor(
  theme: AwaTheme,
  isSelected: boolean,
  isLocked: boolean,
): string {
  const parts = [
    `Thème ${theme.name}`,
  ];

  if (theme.isPremium) {
    parts.push(
      isLocked
        ? 'Premium verrouillé'
        : 'Premium',
    );
  }

  if (isSelected) {
    parts.push('sélectionné');
  }

  return parts.join(', ');
}

/* -------------------------------------------------------------------------- */
/*                              PALETTE CARD                                  */
/* -------------------------------------------------------------------------- */

function ThemePaletteCard({
  theme,
  isSelected,
  isLocked,
  chrome,
  cardWidth,
  onPress,
}: {
  theme: AwaTheme;
  isSelected: boolean;
  isLocked: boolean;
  chrome: AppearanceChrome;
  cardWidth: number;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabelFor(
        theme,
        isSelected,
        isLocked,
      )}
      accessibilityRole="button"
      accessibilityState={{
        selected: isSelected,
      }}
      onPress={onPress}
      style={({pressed}) => [
        styles.paletteCard,

        {
          width:
            cardWidth,

          backgroundColor:
            chrome.card,

          borderColor:
            isSelected
              ? chrome.primary
              : chrome.border,
        },

        isSelected &&
          styles.paletteCardSelected,

        pressed &&
          styles.pressedScale,
      ]}>
      {/* IMAGE */}

      <View
        style={
          styles.previewWrap
        }>
        <ThemePreview
          theme={theme}
        />

        {/* CHECK */}

        {isSelected ? (
          <View
            style={[
              styles.checkBadgeOuter,

              {
                backgroundColor:
                  chrome.card,
              },
            ]}>
            <View
              style={[
                styles.checkBadge,

                {
                  backgroundColor:
                    chrome.primary,
                },
              ]}>
              <MaterialDesignIcons
                color="#FFFFFF"
                name="check"
                size={14}
              />
            </View>
          </View>
        ) : isLocked ? (
          <View
            style={[
              styles.lockBadge,

              {
                backgroundColor:
                  chrome.card,

                borderColor:
                  chrome.border,
              },
            ]}>
            <MaterialDesignIcons
              color={
                chrome.primary
              }
              name="crown"
              size={12}
            />
          </View>
        ) : null}
      </View>

      {/* NAME */}

      <Text
        style={[
          styles.paletteName,

          {
            color:
              chrome.text,
          },
        ]}>
        {theme.name}
      </Text>

      {/* DESCRIPTION */}

      <Text
        style={[
          styles.paletteDescription,

          {
            color:
              chrome.muted,
          },
        ]}>
        {theme.description}
      </Text>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                              PAGINATION                                    */
/* -------------------------------------------------------------------------- */

function PaginationDots({
  count,
  activeIndex,
  chrome,
}: {
  count: number;
  activeIndex: number;
  chrome: AppearanceChrome;
}): React.JSX.Element {
  return (
    <View style={styles.dotsRow}>
      {Array.from({
        length: count,
      }).map((_, index) => {
        const active =
          index === activeIndex;

        return (
          <View
            key={index}
            style={[
              styles.dot,

              {
                backgroundColor:
                  active
                    ? chrome.primary
                    : chrome.segmentTrack,
              },

              active &&
                styles.dotActive,
            ]}
          />
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SETTING ROW                                   */
/* -------------------------------------------------------------------------- */

function AppearanceSettingRow({
  icon,
  title,
  subtitle,
  chrome,
  onPress,
  last,
  control,
  disabled,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  chrome: AppearanceChrome;
  onPress?: () => void;
  last?: boolean;
  control?: React.ReactNode;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole={
        onPress
          ? 'button'
          : undefined
      }
      disabled={!onPress}
      onPress={onPress}
      style={({pressed}) => [
        styles.settingRow,

        !last && [
          styles.settingRowBorder,

          {
            borderBottomColor:
              chrome.border,
          },
        ],

        pressed &&
          onPress &&
          styles.pressedSubtle,

        disabled &&
          styles.settingRowDisabled,
      ]}>
      <View
        style={[
          styles.settingIcon,

          {
            backgroundColor:
              chrome.chipSoft,
          },
        ]}>
        <MaterialDesignIcons
          color={chrome.primary}
          name={icon}
          size={18}
        />
      </View>

      <View style={styles.settingCopy}>
        <Text
          style={[
            styles.settingTitle,

            {
              color:
                chrome.text,
            },
          ]}>
          {title}
        </Text>

        <Text
          style={[
            styles.settingSubtitle,

            {
              color:
                chrome.muted,
            },
          ]}>
          {subtitle}
        </Text>
      </View>

      {control ??
        (onPress ? (
          <MaterialDesignIcons
            color={
              chrome.muted
            }
            name="chevron-right"
            size={20}
          />
        ) : null)}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                INFO CARD                                   */
/* -------------------------------------------------------------------------- */

function AppearanceInfoCard({
  chrome,
}: {
  chrome: AppearanceChrome;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.infoCard,

        {
          backgroundColor:
            chrome.infoCard,
        },
      ]}>
      <MaterialDesignIcons
        color={chrome.primary}
        name="information-outline"
        size={18}
      />

      <Text
        style={[
          styles.infoText,

          {
            color:
              chrome.muted,
          },
        ]}>
        L’apparence peut être modifiée à tout moment dans les paramètres.
      </Text>

      <MaterialDesignIcons
        color={chrome.primary}
        name="flower-outline"
        size={34}
        style={
          styles.infoDecoration
        }
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  SCREEN                                    */
/* -------------------------------------------------------------------------- */

export default function AppearanceScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets =
    useSafeAreaInsets();

  const {width} =
    useWindowDimensions();

  const compact =
    width < 380;

  const reduceMotion =
    useReducedMotion();

  const deviceColorScheme =
    useColorScheme();

  const {
    isPremium,
    initialized,
  } = usePremium();

  const [
    savedThemeId,
    setSavedThemeId,
  ] =
    useState<AwaThemeId>(
      getSelectedThemeId,
    );

  const [
    mode,
    setMode,
  ] =
    useState<AwaAppearanceMode>(
      getAppearanceMode,
    );

  const [
    trueBlack,
    setTrueBlack,
  ] =
    useState<boolean>(
      getTrueBlackEnabled,
    );

  const [
    premiumVisible,
    setPremiumVisible,
  ] =
    useState(false);

  /*
   * IMPORTANT :
   *
   * Ceci ne représente plus le thème actif.
   *
   * Cela représente la POSITION horizontale
   * actuelle du carousel.
   */
  const [
    activePageIndex,
    setActivePageIndex,
  ] =
    useState(0);

  const carouselRef =
    useRef<ScrollView>(null);

  /* ---------------------------------------------------------------------- */
  /* THEMES                                                                 */
  /* ---------------------------------------------------------------------- */

  const themes =
    useMemo(() => {
      return getEnabledAwaThemes().filter(
        theme =>
          theme.id !==
            'midnight' &&
          theme.name
            .toLowerCase()
            .trim() !==
            'midnight',
      );
    }, []);

  /* ---------------------------------------------------------------------- */
  /* PAGINATION COUNT                                                       */
  /* ---------------------------------------------------------------------- */

  /*
   * Exemple :
   *
   * 6 thèmes
   * 3 visibles
   *
   * 6 - 3 + 1 = 4 positions
   *
   * donc :
   *
   * ● ○ ○ ○
   */

  const pageCount =
    Math.max(
      1,

      themes.length -
        VISIBLE_CARD_COUNT +
        1,
    );

  const maxPageIndex =
    Math.max(
      0,
      pageCount - 1,
    );

  /* ---------------------------------------------------------------------- */
  /* CARD WIDTH                                                             */
  /* ---------------------------------------------------------------------- */

  const cardWidth =
    useMemo(() => {
      /*
       * Padding de l'écran :
       *
       * left 16
       * right 16
       *
       * total = 32
       */

      const screenPadding =
        32;

      const available =
        width -
        screenPadding;

      /*
       * Il y a exactement deux gaps
       * entre trois cartes.
       */

      const totalGaps =
        CARD_GAP *
        (
          VISIBLE_CARD_COUNT -
          1
        );

      return (
        available -
        totalGaps
      ) /
        VISIBLE_CARD_COUNT;
    }, [width]);

  /* ---------------------------------------------------------------------- */
  /* ITEM WIDTH                                                             */
  /* ---------------------------------------------------------------------- */

  const carouselItemWidth =
    cardWidth +
    CARD_GAP;

  /* ---------------------------------------------------------------------- */
  /* HYDRATION                                                              */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    hydrateThemePreferences().then(
      setSavedThemeId,
    );

    hydrateAppearancePreferences().then(
      () => {
        setMode(
          getAppearanceMode(),
        );

        setTrueBlack(
          getTrueBlackEnabled(),
        );
      },
    );

    return subscribeThemePreferences(
      () => {
        setSavedThemeId(
          getSelectedThemeId(),
        );

        setMode(
          getAppearanceMode(),
        );

        setTrueBlack(
          getTrueBlackEnabled(),
        );
      },
    );
  }, []);

  /* ---------------------------------------------------------------------- */
  /* EFFECTIVE THEME                                                        */
  /* ---------------------------------------------------------------------- */

  const effectiveThemeId =
    initialized
      ? resolveEffectiveThemeId(
          savedThemeId,
          isPremium,
        )
      : savedThemeId;

  React.useEffect(() => {
    if (
      initialized &&
      effectiveThemeId !==
        savedThemeId
    ) {
      setSelectedThemeId(
        effectiveThemeId,
      ).catch(() => {});
    }
  }, [
    effectiveThemeId,
    initialized,
    savedThemeId,
  ]);

  /* ---------------------------------------------------------------------- */
  /* DARK MODE                                                              */
  /* ---------------------------------------------------------------------- */

  const isDarkChrome =
    mode === 'dark' ||
    (
      mode === 'system' &&
      deviceColorScheme ===
        'dark'
    );

  const chrome =
    useMemo<AppearanceChrome>(
      () => {
        const base =
          isDarkChrome
            ? DARK_CHROME
            : LIGHT_CHROME;

        if (
          isDarkChrome &&
          trueBlack
        ) {
          return {
            ...base,

            background:
              TRUE_BLACK_BACKGROUND,

            card:
              TRUE_BLACK_CARD,
          };
        }

        return base;
      },
      [
        isDarkChrome,
        trueBlack,
      ],
    );

  /* ---------------------------------------------------------------------- */
  /* MODE                                                                   */
  /* ---------------------------------------------------------------------- */

  const handleModeChange = (
    nextMode:
      AwaAppearanceMode,
  ): void => {
    setMode(
      nextMode,
    );

    setAppearanceMode(
      nextMode,
    ).catch(() => {});
  };

  /* ---------------------------------------------------------------------- */
  /* TRUE BLACK                                                             */
  /* ---------------------------------------------------------------------- */

  const handleTrueBlackToggle = (
    value: boolean,
  ): void => {
    setTrueBlack(
      value,
    );

    setTrueBlackEnabled(
      value,
    ).catch(() => {});
  };

  /* ---------------------------------------------------------------------- */
  /* THEME TAP                                                              */
  /* ---------------------------------------------------------------------- */

  const handleThemeTap = (
    theme: AwaTheme,
  ): void => {
    const outcome =
      resolveAwaThemeTap(
        theme,
        isPremium,
      );

    if (
      outcome.action ===
      'requiresPremium'
    ) {
      setPremiumVisible(
        true,
      );

      return;
    }

    setSelectedThemeId(
      theme.id,
    ).catch(() => {});
  };

  /* ---------------------------------------------------------------------- */
  /* PAGINATION SCROLL                                                      */
  /* ---------------------------------------------------------------------- */

  const updatePaginationFromOffset = (
    offsetX: number,
  ): void => {
    /*
     * Convertit le déplacement horizontal
     * en index de position.
     */

    const rawIndex =
      Math.round(
        offsetX /
          carouselItemWidth,
      );

    /*
     * On bloque entre :
     *
     * 0
     *
     * et
     *
     * themes.length - 3
     */

    const nextIndex =
      Math.max(
        0,

        Math.min(
          maxPageIndex,
          rawIndex,
        ),
      );

    if (
      nextIndex !==
      activePageIndex
    ) {
      setActivePageIndex(
        nextIndex,
      );
    }
  };

  const handleCarouselScroll = (
    event:
      NativeSyntheticEvent<
        NativeScrollEvent
      >,
  ): void => {
    updatePaginationFromOffset(
      event.nativeEvent
        .contentOffset.x,
    );
  };

  /*
   * Cette fonction assure aussi que le bon point
   * est sélectionné une fois le geste terminé.
   */

  const handleCarouselMomentumEnd = (
    event:
      NativeSyntheticEvent<
        NativeScrollEvent
      >,
  ): void => {
    updatePaginationFromOffset(
      event.nativeEvent
        .contentOffset.x,
    );
  };

  /* ---------------------------------------------------------------------- */
  /* SEE ALL                                                                */
  /* ---------------------------------------------------------------------- */

  const handleSeeAll =
    (): void => {
      carouselRef.current?.scrollToEnd(
        {
          animated: true,
        },
      );

      /*
       * scrollToEnd déclenche normalement onScroll.
       * On synchronise aussi directement le point.
       */

      setActivePageIndex(
        maxPageIndex,
      );
    };

  /* ---------------------------------------------------------------------- */
  /* INERT                                                                  */
  /* ---------------------------------------------------------------------- */

  const handleInertRow = (
    title: string,
  ): void => {
    Alert.alert(
      title,

      'Cette fonctionnalité arrive bientôt.',
    );
  };

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <SafeAreaView
      edges={[
        'left',
        'right',
      ]}
      style={[
        styles.safe,

        {
          backgroundColor:
            chrome.background,
        },
      ]}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={
          chrome.statusBarStyle
        }
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.content,

          {
            paddingTop:
              getTopPadding(
                insets.top,
                compact,
              ),

            paddingBottom:
              Math.max(
                insets.bottom,
                20,
              ) + 28,
          },
        ]}>
        {/* -------------------------------------------------------------- */}
        {/* HEADER                                                         */}
        {/* -------------------------------------------------------------- */}

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeIn.duration(
                  240,
                )
          }
          style={
            styles.header
          }>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={
              navigation.goBack
            }
            style={({pressed}) => [
              styles.backButton,

              pressed &&
                styles.pressedSubtle,
            ]}>
            <MaterialDesignIcons
              color={
                chrome.text
              }
              name="chevron-left"
              size={28}
            />
          </Pressable>

          <Text
            style={[
              styles.headerTitle,

              {
                color:
                  chrome.text,
              },
            ]}>
            Apparence
          </Text>

          <View
            style={
              styles.headerPlaceholder
            }
          />
        </Animated.View>

        {/* -------------------------------------------------------------- */}
        {/* SUBTITLE                                                       */}
        {/* -------------------------------------------------------------- */}

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInUp
                  .delay(40)
                  .duration(320)
          }>
          <Text
            style={[
              styles.subtitle,

              {
                color:
                  chrome.muted,
              },
            ]}>
            Personnalisez l’apparence de votre application AWA{'\n'}
            selon vos préférences.
          </Text>
        </Animated.View>

        {/* -------------------------------------------------------------- */}
        {/* MODE                                                           */}
        {/* -------------------------------------------------------------- */}

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInUp
                  .delay(80)
                  .duration(320)
          }
          style={
            styles.section
          }>
          <SectionHeader
            chrome={chrome}
            icon="palette-outline"
            title="Thème"
          />

          <AppearanceModeSelector
            chrome={chrome}
            mode={mode}
            onChange={
              handleModeChange
            }
          />
        </Animated.View>

        {/* -------------------------------------------------------------- */}
        {/* PALETTES                                                       */}
        {/* -------------------------------------------------------------- */}

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInUp
                  .delay(120)
                  .duration(320)
          }
          style={
            styles.section
          }>
          <SectionHeader
            chrome={chrome}
            icon="palette-swatch-outline"
            title="Palettes de couleurs"
            right={
              <Pressable
                accessibilityLabel="Voir tous les thèmes"
                accessibilityRole="button"
                hitSlop={6}
                onPress={
                  handleSeeAll
                }
                style={({pressed}) => [
                  styles.seeAll,

                  pressed &&
                    styles.pressedSubtle,
                ]}>
                <Text
                  style={[
                    styles.seeAllText,

                    {
                      color:
                        chrome.primary,
                    },
                  ]}>
                  Voir tout
                </Text>

                <MaterialDesignIcons
                  color={
                    chrome.primary
                  }
                  name="chevron-right"
                  size={16}
                />
              </Pressable>
            }
          />

          <ScrollView
            ref={carouselRef}
            horizontal

            showsHorizontalScrollIndicator={
              false
            }

            decelerationRate="fast"

            scrollEventThrottle={
              16
            }

            snapToInterval={
              carouselItemWidth
            }

            snapToAlignment="start"

            disableIntervalMomentum

            onScroll={
              handleCarouselScroll
            }

            onMomentumScrollEnd={
              handleCarouselMomentumEnd
            }

            contentContainerStyle={[
              styles.carouselContent,

              {
                gap:
                  CARD_GAP,
              },
            ]}>
            {themes.map(
              theme => {
                const isSelected =
                  theme.id ===
                  effectiveThemeId;

                const isLocked =
                  theme.isPremium &&
                  !isPremium;

                return (
                  <ThemePaletteCard
                    key={
                      theme.id
                    }

                    theme={
                      theme
                    }

                    chrome={
                      chrome
                    }

                    cardWidth={
                      cardWidth
                    }

                    isSelected={
                      isSelected
                    }

                    isLocked={
                      isLocked
                    }

                    onPress={() =>
                      handleThemeTap(
                        theme,
                      )
                    }
                  />
                );
              },
            )}
          </ScrollView>

          {/* ------------------------------------------------------------ */}
          {/* DOTS                                                         */}
          {/* ------------------------------------------------------------ */}

          <PaginationDots
            activeIndex={
              activePageIndex
            }
            chrome={chrome}
            count={
              pageCount
            }
          />
        </Animated.View>

        {/* -------------------------------------------------------------- */}
        {/* TRUE BLACK                                                     */}
        {/* -------------------------------------------------------------- */}

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInUp
                  .delay(150)
                  .duration(320)
          }
          style={
            styles.section
          }>
          <View
            style={[
              styles.card,

              {
                backgroundColor:
                  chrome.card,

                borderColor:
                  chrome.border,
              },
            ]}>
            <AppearanceSettingRow
              chrome={chrome}

              control={
                <Switch
                  disabled={
                    !isDarkChrome
                  }

                  ios_backgroundColor={
                    chrome.segmentTrack
                  }

                  onValueChange={
                    handleTrueBlackToggle
                  }

                  thumbColor="#FFFFFF"

                  trackColor={{
                    false:
                      chrome.segmentTrack,

                    true:
                      chrome.primary,
                  }}

                  value={
                    trueBlack
                  }
                />
              }

              disabled={
                !isDarkChrome
              }

              icon="moon-waning-crescent"

              last

              subtitle="Véritable noir pour plus de confort"

              title="Mode noir profond"
            />
          </View>
        </Animated.View>

        {/* -------------------------------------------------------------- */}
        {/* DISPLAY                                                        */}
        {/* -------------------------------------------------------------- */}

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInUp
                  .delay(180)
                  .duration(320)
          }
          style={
            styles.section
          }>
          <SectionHeader
            chrome={chrome}
            icon="cellphone-cog"
            title="Affichage"
          />

          <View
            style={[
              styles.card,

              {
                backgroundColor:
                  chrome.card,

                borderColor:
                  chrome.border,
              },
            ]}>
            <AppearanceSettingRow
              chrome={chrome}

              icon="earth"

              onPress={() =>
                handleInertRow(
                  'Langue de l’application',
                )
              }

              subtitle="Français"

              title="Langue de l’application"
            />

            <AppearanceSettingRow
              chrome={chrome}

              icon="tablet"

              last

              onPress={() =>
                handleInertRow(
                  'Interface tablette',
                )
              }

              subtitle="Automatique"

              title="Interface tablette"
            />
          </View>
        </Animated.View>

        {/* -------------------------------------------------------------- */}
        {/* INFO                                                           */}
        {/* -------------------------------------------------------------- */}

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeInUp
                  .delay(210)
                  .duration(320)
          }>
          <AppearanceInfoCard
            chrome={chrome}
          />
        </Animated.View>
      </ScrollView>

      <HawaPremiumBottomSheet
        onClose={() =>
          setPremiumVisible(
            false,
          )
        }
        visible={
          premiumVisible
        }
      />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  content: {
    flexGrow: 1,

    paddingHorizontal: 16,
  },

  /* ---------------------------------------------------------------------- */
  /* HEADER                                                                 */
  /* ---------------------------------------------------------------------- */

  header: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 16,
  },

  backButton: {
    width: 42,

    height: 42,

    alignItems:
      'flex-start',

    justifyContent:
      'center',
  },

  headerPlaceholder: {
    width: 42,

    height: 42,
  },

  headerTitle: {
    flex: 1,

    textAlign:
      'center',

    fontFamily:
      'serif',

    fontSize: 21,

    fontWeight:
      '800',
  },

  subtitle: {
    textAlign:
      'center',

    fontSize: 13.5,

    lineHeight: 20,

    marginBottom: 22,
  },

  /* ---------------------------------------------------------------------- */
  /* SECTIONS                                                               */
  /* ---------------------------------------------------------------------- */

  section: {
    marginBottom: 20,
  },

  sectionHeaderRow: {
    flexDirection: 'row',

    alignItems:
      'center',

    justifyContent:
      'space-between',

    marginBottom: 10,
  },

  sectionHeaderLeft: {
    flexDirection:
      'row',

    alignItems:
      'center',

    gap: 7,
  },

  sectionIcon: {
    width: 27,

    height: 27,

    borderRadius: 9,

    alignItems:
      'center',

    justifyContent:
      'center',
  },

  sectionTitle: {
    fontSize: 14.5,

    fontWeight:
      '800',
  },

  /* ---------------------------------------------------------------------- */
  /* SEE ALL                                                                */
  /* ---------------------------------------------------------------------- */

  seeAll: {
    flexDirection:
      'row',

    alignItems:
      'center',
  },

  seeAllText: {
    fontSize: 12.5,

    fontWeight:
      '700',

    marginRight: 2,
  },

  /* ---------------------------------------------------------------------- */
  /* MODE                                                                   */
  /* ---------------------------------------------------------------------- */

  segmentTrack: {
    flexDirection:
      'row',

    borderRadius: 18,

    padding: 4,

    gap: 3,
  },

  segmentItem: {
    flex: 1,

    minHeight: 44,

    flexDirection:
      'row',

    alignItems:
      'center',

    justifyContent:
      'center',

    gap: 6,

    borderRadius: 14,

    paddingHorizontal: 5,
  },

  segmentItemActive: {
    ...homeShadow,

    shadowOpacity:
      0.2,
  },

  segmentLabel: {
    fontSize: 12.3,

    fontWeight:
      '700',
  },

  segmentLabelActive: {
    fontWeight:
      '800',
  },

  /* ---------------------------------------------------------------------- */
  /* CAROUSEL                                                               */
  /* ---------------------------------------------------------------------- */

  carouselContent: {
    paddingTop: 2,

    paddingBottom: 5,

    paddingRight: 2,
  },

  paletteCard: {
    minHeight: 214,

    paddingTop: 7,

    paddingHorizontal: 7,

    paddingBottom: 10,

    borderRadius: 15,

    borderWidth: 1,

    ...homeShadow,

    shadowOpacity:
      0.035,
  },

  paletteCardSelected: {
    borderWidth: 2,

    shadowOpacity:
      0.12,

    elevation: 3,
  },

  /* ---------------------------------------------------------------------- */
  /* IMAGE                                                                  */
  /* ---------------------------------------------------------------------- */

  previewWrap: {
    position:
      'relative',

    marginBottom: 10,
  },

  imagePreviewContainer: {
    width:
      '100%',

    height: 132,

    borderRadius: 11,

    overflow:
      'hidden',
  },

  themePreviewImage: {
    width:
      '100%',

    height:
      '100%',

    borderRadius: 11,
  },

  /* ---------------------------------------------------------------------- */
  /* FALLBACK                                                               */
  /* ---------------------------------------------------------------------- */

  dynamicPreview: {
    width:
      '100%',

    height: 132,

    borderRadius: 11,

    padding: 7,

    overflow:
      'hidden',
  },

  dynamicPreviewInner: {
    flex: 1,

    paddingHorizontal:
      9,

    paddingVertical:
      11,

    borderRadius: 9,

    justifyContent:
      'space-between',
  },

  previewBar: {
    width:
      '78%',

    height: 21,

    borderRadius: 10,

    opacity: 0.75,
  },

  previewBlockSmall: {
    width: 27,

    height: 27,

    borderRadius: 8,

    opacity: 0.75,
  },

  previewBlockWide: {
    width:
      '80%',

    height: 36,

    borderRadius: 9,

    opacity: 0.55,
  },

  /* ---------------------------------------------------------------------- */
  /* CHECK                                                                  */
  /* ---------------------------------------------------------------------- */

  checkBadgeOuter: {
    position:
      'absolute',

    right: -3,

    bottom: -9,

    width: 34,

    height: 34,

    borderRadius: 17,

    alignItems:
      'center',

    justifyContent:
      'center',

    shadowColor:
      '#7650A5',

    shadowOffset: {
      width: 0,

      height: 2,
    },

    shadowOpacity:
      0.15,

    shadowRadius: 4,

    elevation: 4,
  },

  checkBadge: {
    width: 27,

    height: 27,

    borderRadius:
      13.5,

    alignItems:
      'center',

    justifyContent:
      'center',
  },

  lockBadge: {
    position:
      'absolute',

    right: 5,

    top: 5,

    width: 23,

    height: 23,

    borderRadius:
      11.5,

    borderWidth: 1,

    alignItems:
      'center',

    justifyContent:
      'center',
  },

  /* ---------------------------------------------------------------------- */
  /* TEXT                                                                   */
  /* ---------------------------------------------------------------------- */

  paletteName: {
    fontSize: 12.2,

    lineHeight: 16,

    fontWeight:
      '800',

    marginBottom: 2,

    letterSpacing:
      -0.15,
  },

  paletteDescription: {
    fontSize: 9.8,

    lineHeight:
      13.5,

    fontWeight:
      '400',
  },

  /* ---------------------------------------------------------------------- */
  /* DOTS                                                                   */
  /* ---------------------------------------------------------------------- */

  dotsRow: {
    flexDirection:
      'row',

    justifyContent:
      'center',

    alignItems:
      'center',

    gap: 8,

    marginTop: 13,
  },

  dot: {
    width: 7,

    height: 7,

    borderRadius:
      3.5,

    opacity:
      0.6,
  },

  /*
   * Point actif rond,
   * comme dans ta référence.
   */

  dotActive: {
    width: 9,

    height: 9,

    borderRadius:
      4.5,

    opacity: 1,
  },

  /* ---------------------------------------------------------------------- */
  /* SETTINGS                                                               */
  /* ---------------------------------------------------------------------- */

  card: {
    borderRadius:
      homeRadii.card -
      6,

    borderWidth: 1,

    overflow:
      'hidden',
  },

  settingRow: {
    minHeight: 66,

    flexDirection:
      'row',

    alignItems:
      'center',

    paddingHorizontal:
      13,

    paddingVertical:
      11,

    gap: 12,
  },

  settingRowBorder: {
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  settingRowDisabled: {
    opacity:
      0.55,
  },

  settingIcon: {
    width: 34,

    height: 34,

    borderRadius: 12,

    alignItems:
      'center',

    justifyContent:
      'center',
  },

  settingCopy: {
    flex: 1,

    minWidth: 0,
  },

  settingTitle: {
    fontSize: 13.5,

    fontWeight:
      '700',

    marginBottom: 2,
  },

  settingSubtitle: {
    fontSize: 11.5,
  },

  /* ---------------------------------------------------------------------- */
  /* INFO                                                                   */
  /* ---------------------------------------------------------------------- */

  infoCard: {
    flexDirection:
      'row',

    alignItems:
      'flex-start',

    gap: 10,

    borderRadius: 18,

    padding: 15,

    overflow:
      'hidden',

    position:
      'relative',
  },

  infoText: {
    flex: 1,

    fontSize: 12,

    lineHeight: 17,
  },

  infoDecoration: {
    position:
      'absolute',

    right: -4,

    bottom: -6,

    opacity:
      0.18,
  },

  /* ---------------------------------------------------------------------- */
  /* PRESS                                                                  */
  /* ---------------------------------------------------------------------- */

  pressedSubtle: {
    opacity:
      0.8,
  },

  pressedScale: {
    opacity:
      0.94,

    transform: [
      {
        scale:
          0.98,
      },
    ],
  },
});

