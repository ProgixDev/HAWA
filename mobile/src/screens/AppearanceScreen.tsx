import React, {useMemo, useRef, useState} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
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
  homeRadii,
  homeShadow,
} from '../components/home/homeTheme';

import {getTopPadding} from '../theme/spacing';

import {
  getEnabledAwaThemes,
  resolveAwaThemeTap,
  type AwaTheme,
} from '../config/awaThemes';

import {
  setAppearanceMode,
  setSelectedThemeId,
  setTrueBlackEnabled,
  type AwaAppearanceMode,
} from '../state/themePreferences';

import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor} from '../theme/awaThemeTokens';
import type {ResolvedAwaTheme} from '../theme/awaThemeTokens';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Appearance'
>;

type IconName =
  React.ComponentProps<typeof MaterialDesignIcons>['name'];

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
  theme,
}: {
  mode: AwaAppearanceMode;
  onChange: (mode: AwaAppearanceMode) => void;
  theme: ResolvedAwaTheme;
}): React.JSX.Element {
  const onPrimary = onPrimaryTextColor(theme);

  return (
    <View
      style={[
        styles.segmentTrack,
        {
          backgroundColor:
            theme.colors.surfaceSecondary,
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
                    theme.colors.primary,
                  shadowColor: theme.shadow.shadowColor,
                  shadowOffset: theme.shadow.shadowOffset,
                  shadowRadius: theme.shadow.shadowRadius,
                  elevation: theme.shadow.elevation,
                },
              ],

              pressed &&
                styles.pressedSubtle,
            ]}>
            <MaterialDesignIcons
              color={
                active
                  ? onPrimary
                  : theme.colors.textSecondary
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
                      ? onPrimary
                      : theme.colors.textSecondary,
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
  theme,
  right,
}: {
  icon: IconName;
  title: string;
  theme: ResolvedAwaTheme;
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
                theme.colors.primarySoft,
            },
          ]}>
          <MaterialDesignIcons
            color={theme.colors.primary}
            name={icon}
            size={17}
          />
        </View>

        <Text
          style={[
            styles.sectionTitle,

            {
              color:
                theme.colors.text,
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
  appTheme,
  cardWidth,
  onPress,
}: {
  theme: AwaTheme;
  isSelected: boolean;
  isLocked: boolean;
  appTheme: ResolvedAwaTheme;
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
            appTheme.colors.surface,

          borderColor:
            isSelected
              ? appTheme.colors.primary
              : appTheme.colors.border,

          shadowColor: appTheme.shadow.shadowColor,
          shadowOffset: appTheme.shadow.shadowOffset,
          shadowRadius: appTheme.shadow.shadowRadius,
          elevation: appTheme.shadow.elevation,
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
                  appTheme.colors.surface,

                shadowColor: appTheme.shadow.shadowColor,
              },
            ]}>
            <View
              style={[
                styles.checkBadge,

                {
                  backgroundColor:
                    appTheme.colors.primary,
                },
              ]}>
              <MaterialDesignIcons
                color={onPrimaryTextColor(appTheme)}
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
                  appTheme.colors.surface,

                borderColor:
                  appTheme.colors.border,
              },
            ]}>
            <MaterialDesignIcons
              color={
                appTheme.colors.primary
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
              appTheme.colors.text,
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
              appTheme.colors.textSecondary,
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
  theme,
}: {
  count: number;
  activeIndex: number;
  theme: ResolvedAwaTheme;
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
                    ? theme.colors.primary
                    : theme.colors.surfaceSecondary,
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
  theme,
  onPress,
  last,
  control,
  disabled,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  theme: ResolvedAwaTheme;
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
              theme.colors.border,
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
              theme.colors.primarySoft,
          },
        ]}>
        <MaterialDesignIcons
          color={theme.colors.primary}
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
                theme.colors.text,
            },
          ]}>
          {title}
        </Text>

        <Text
          style={[
            styles.settingSubtitle,

            {
              color:
                theme.colors.textSecondary,
            },
          ]}>
          {subtitle}
        </Text>
      </View>

      {control ??
        (onPress ? (
          <MaterialDesignIcons
            color={
              theme.colors.textSecondary
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
  theme,
}: {
  theme: ResolvedAwaTheme;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.infoCard,

        {
          backgroundColor:
            theme.colors.primarySoft,
        },
      ]}>
      <MaterialDesignIcons
        color={theme.colors.primary}
        name="information-outline"
        size={18}
      />

      <Text
        style={[
          styles.infoText,

          {
            color:
              theme.colors.textSecondary,
          },
        ]}>
        L’apparence peut être modifiée à tout moment dans les paramètres.
      </Text>

      <MaterialDesignIcons
        color={theme.colors.primary}
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

  // GLOBAL THEME (PHASE E1) — the ONLY source of System/Light/Dark/palette/
  // True-Black resolution. AppearanceScreen no longer reads the device color
  // scheme or resolves any of this locally — see PHASE E1 report.
  const {
    theme,
    effectiveThemeId,
    appearanceMode,
    isDark,
    trueBlackEnabled,
  } = useAwaTheme();

  const {isPremium} = usePremium();

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
        paletteTheme =>
          paletteTheme.id !==
            'midnight' &&
          paletteTheme.name
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
  /* MODE                                                                   */
  /* ---------------------------------------------------------------------- */

  // PHASE E1: this only PERSISTS the choice. AwaThemeProvider resolves it —
  // this screen never resolves System/Light/Dark itself (see report).
  const handleModeChange = (
    nextMode:
      AwaAppearanceMode,
  ): void => {

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
    setTrueBlackEnabled(
      value,
    ).catch(() => {});
  };

  /* ---------------------------------------------------------------------- */
  /* THEME TAP                                                              */
  /* ---------------------------------------------------------------------- */

  const handleThemeTap = (
    paletteTheme: AwaTheme,
  ): void => {
    const outcome =
      resolveAwaThemeTap(
        paletteTheme,
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
      paletteTheme.id,
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
            theme.colors.background,
        },
      ]}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={
          theme.statusBarStyle
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
                theme.colors.text
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
                  theme.colors.text,
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
                  theme.colors.textSecondary,
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
            icon="palette-outline"
            theme={theme}
            title="Thème"
          />

          <AppearanceModeSelector
            mode={appearanceMode}
            onChange={
              handleModeChange
            }
            theme={theme}
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
            icon="palette-swatch-outline"
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
                        theme.colors.primary,
                    },
                  ]}>
                  Voir tout
                </Text>

                <MaterialDesignIcons
                  color={
                    theme.colors.primary
                  }
                  name="chevron-right"
                  size={16}
                />
              </Pressable>
            }
            theme={theme}
            title="Palettes de couleurs"
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
              paletteTheme => {
                const isSelected =
                  paletteTheme.id ===
                  effectiveThemeId;

                const isLocked =
                  paletteTheme.isPremium &&
                  !isPremium;

                return (
                  <ThemePaletteCard
                    key={
                      paletteTheme.id
                    }

                    theme={
                      paletteTheme
                    }

                    appTheme={
                      theme
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
                        paletteTheme,
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
            count={
              pageCount
            }
            theme={theme}
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
                  theme.colors.surface,

                borderColor:
                  theme.colors.border,
              },
            ]}>
            <AppearanceSettingRow
              control={
                <Switch
                  disabled={
                    !isDark
                  }

                  ios_backgroundColor={
                    theme.colors.surfaceSecondary
                  }

                  onValueChange={
                    handleTrueBlackToggle
                  }

                  // Fixed native-switch thumb color — a physical control
                  // affordance, not an app surface; white reads correctly
                  // against every trackColor below regardless of palette.
                  thumbColor="#FFFFFF"

                  trackColor={{
                    false:
                      theme.colors.surfaceSecondary,

                    true:
                      theme.colors.primary,
                  }}

                  value={
                    trueBlackEnabled
                  }
                />
              }

              disabled={
                !isDark
              }

              icon="moon-waning-crescent"

              last

              subtitle="Véritable noir pour plus de confort"

              theme={theme}

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
            icon="cellphone-cog"
            theme={theme}
            title="Affichage"
          />

          <View
            style={[
              styles.card,

              {
                backgroundColor:
                  theme.colors.surface,

                borderColor:
                  theme.colors.border,
              },
            ]}>
            <AppearanceSettingRow
              icon="earth"

              last

              subtitle="Français"

              theme={theme}

              title="Langue de l’application"
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
            theme={theme}
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

    // shadowColor is theme-driven — see the inline override at the
    // checkBadgeOuter call site in ThemePaletteCard (PHASE E1).
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

