import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {
  homeColors,
  homeShadow,
} from '../../components/home/homeTheme';
import {
  getBottomPadding,
  spacing,
} from '../../theme/spacing';
import {
  getPregnancyDating,
  hydratePregnancyDating,
  subscribePregnancyDating,
} from '../../state/pregnancyPreferences';
import {computePregnancyStatus} from '../../utils/pregnancyTrackingUtils';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import BabyDevelopmentImage from '../../components/pregnancy/BabyDevelopmentImage';

/* ============================================================
   TYPES
============================================================ */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PregnancyWeek'
>;

type Tab =
  | 'baby'
  | 'body'
  | 'toKnow';

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

const MIN_PREGNANCY_WEEK = 1;
const MAX_PREGNANCY_WEEK = 41;

const TABS: Array<{
  key: Tab;
  label: string;
  icon: IconName;
}> = [
  {
    key: 'baby',
    label: 'Bébé',
    icon: 'baby-face-outline',
  },
  {
    key: 'body',
    label: 'Ton corps',
    icon: 'human-female',
  },
  {
    key: 'toKnow',
    label: 'À savoir',
    icon: 'lightbulb-outline',
  },
];

/* ============================================================
   HELPERS
============================================================ */

function trimesterLabel(
  trimester: 1 | 2 | 3,
): string {
  return trimester === 1
    ? '1er trimestre'
    : `${trimester}e trimestre`;
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyContentNote({
  text,
}: {
  text: string;
}): React.JSX.Element {
  return (
    <View style={styles.emptyContent}>
      <View style={styles.emptyContentIcon}>
        <MaterialDesignIcons
          color={homeColors.primary}
          name="information-outline"
          size={21}
        />
      </View>

      <Text style={styles.emptyContentText}>
        {text}
      </Text>
    </View>
  );
}

/* ============================================================
   INFO ROW
============================================================ */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialDesignIcons
          color={homeColors.primary}
          name={icon}
          size={18}
        />
      </View>

      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          numberOfLines={1}
          style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   MAIN
============================================================ */

export default function PregnancyWeekScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const [
    activeTab,
    setActiveTab,
  ] = useState<Tab>('baby');

  const [
    dating,
    setDating,
  ] = useState(getPregnancyDating);

  const tabTransition = useRef(
    new Animated.Value(1),
  ).current;

  const heroAnim = useRef(
    new Animated.Value(0),
  ).current;

  const [viewedWeek, setViewedWeek] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    hydratePregnancyDating().then(
      value => {
        if (active) {
          setDating(value);
        }
      },
    );

    const unsubscribe =
      subscribePregnancyDating(() => {
        if (active) {
          setDating(
            getPregnancyDating(),
          );
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const status = useMemo(
    () =>
      computePregnancyStatus(
        dating.method,
        dating.date
          ? new Date(dating.date)
          : null,
        new Date(),
      ),
    [dating],
  );

  const actualPregnancyWeek = status.week;

  useEffect(() => {
    if (status.configured) {
      setViewedWeek(actualPregnancyWeek);
    }
  }, [actualPregnancyWeek, status.configured]);

  const displayedWeek = viewedWeek ?? actualPregnancyWeek;

  const weekData =
    status.configured
      ? getPregnancyWeekData(
          displayedWeek,
        )
      : undefined;

  const viewedWeekContext = displayedWeek === actualPregnancyWeek
    ? 'Semaine actuelle'
    : displayedWeek < actualPregnancyWeek
      ? 'Semaine passée'
      : 'Aperçu';

  const hasBabyMeasurements =
    Boolean(
      weekData?.weight ||
        weekData?.length ||
        weekData?.comparison,
    );

  useEffect(() => {
    tabTransition.setValue(0);

    Animated.timing(
      tabTransition,
      {
        toValue: 1,
        duration: 240,
        easing:
          Easing.out(
            Easing.cubic,
          ),
        useNativeDriver: true,
      },
    ).start();
  }, [
    activeTab,
    displayedWeek,
    tabTransition,
  ]);

  useEffect(() => {
    heroAnim.setValue(0);

    Animated.timing(
      heroAnim,
      {
        toValue: 1,
        duration: 500,
        easing:
          Easing.out(
            Easing.cubic,
          ),
        useNativeDriver: true,
      },
    ).start();
  }, [heroAnim]);

  /* ==========================================================
     NOT CONFIGURED
  ========================================================== */

  if (!status.configured) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <View style={styles.header}>
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
                styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={
                homeColors.primary
              }
              name="arrow-left"
              size={23}
            />
          </Pressable>
        </View>

        <View
          style={
            styles.unconfigured
          }>
          <View
            style={
              styles.unconfiguredIcon
            }>
            <MaterialDesignIcons
              color={
                homeColors.primary
              }
              name="human-pregnant"
              size={34}
            />
          </View>

          <Text
            style={
              styles.unconfiguredTitle
            }>
            Grossesse non configurée
          </Text>

          <Text
            style={
              styles.unconfiguredText
            }>
            Configure les informations de ta grossesse
            pour suivre son évolution semaine après semaine.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate(
                'PregnancyDatingSetup',
              )
            }
            style={({pressed}) => [
              styles.unconfiguredButton,
              pressed &&
                styles.pressed,
            ]}>
            <Text
              style={
                styles.unconfiguredButtonText
              }>
              Configurer ma grossesse
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ==========================================================
     MAIN RENDER
  ========================================================== */

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safeArea}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent
      />

      {/* ======================================================
          HEADER
      ======================================================= */}

      <View style={styles.header}>
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
              styles.pressed,
          ]}>
          <MaterialDesignIcons
            color={
              homeColors.primary
            }
            name="arrow-left"
            size={23}
          />
        </Pressable>

        <View
          style={
            styles.headerCopy
          }>
          <Text
            numberOfLines={1}
            style={
              styles.headerTitle
            }>
            Semaine {displayedWeek}
          </Text>

          <Text
            numberOfLines={1}
            style={
              styles.headerSubtitle
            }>
            {displayedWeek === actualPregnancyWeek
              ? `${status.gestationalWeeks} SA + ${status.gestationalDays} jours · ${trimesterLabel(status.trimester)}`
              : `${viewedWeekContext} éducatif · grossesse actuelle : semaine ${actualPregnancyWeek}`}
          </Text>
        </View>

        <View
          style={
            styles.headerSpacer
          }
        />
      </View>

      <View style={styles.weekBrowser}>
        <Pressable
          accessibilityLabel="Semaine précédente"
          accessibilityRole="button"
          disabled={displayedWeek <= MIN_PREGNANCY_WEEK}
          onPress={() => setViewedWeek(current => Math.max(MIN_PREGNANCY_WEEK, (current ?? actualPregnancyWeek) - 1))}
          style={[styles.weekArrow, displayedWeek <= MIN_PREGNANCY_WEEK && styles.weekArrowDisabled]}>
          <MaterialDesignIcons color={homeColors.primary} name="chevron-left" size={22} />
        </Pressable>
        <View style={styles.weekBrowserCopy}>
          <Text style={styles.weekBrowserTitle}>Semaine {displayedWeek}</Text>
          <Text style={styles.weekBrowserContext}>{viewedWeekContext}</Text>
        </View>
        <Pressable
          accessibilityLabel="Semaine suivante"
          accessibilityRole="button"
          disabled={displayedWeek >= MAX_PREGNANCY_WEEK}
          onPress={() => setViewedWeek(current => Math.min(MAX_PREGNANCY_WEEK, (current ?? actualPregnancyWeek) + 1))}
          style={[styles.weekArrow, displayedWeek >= MAX_PREGNANCY_WEEK && styles.weekArrowDisabled]}>
          <MaterialDesignIcons color={homeColors.primary} name="chevron-right" size={22} />
        </Pressable>
      </View>

      {/* ======================================================
          TABS
      ======================================================= */}

      <View style={styles.tabWrapper}>
        <View style={styles.tabBar}>
          {TABS.map(tab => {
            const selected =
              activeTab ===
              tab.key;

            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{
                  selected,
                }}
                key={tab.key}
                onPress={() =>
                  setActiveTab(
                    tab.key,
                  )
                }
                style={[
                  styles.tabButton,
                  selected &&
                    styles.tabButtonActive,
                ]}>
                <MaterialDesignIcons
                  color={
                    selected
                      ? homeColors.primary
                      : homeColors.textSecondary
                  }
                  name={tab.icon}
                  size={18}
                />

                <Text
                  style={[
                    styles.tabText,
                    selected &&
                      styles.tabTextActive,
                  ]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              getBottomPadding(
                insets.bottom,
                spacing.lg,
              ),
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }>
        <Animated.View
          style={{
            opacity:
              tabTransition,

            transform: [
              {
                translateX:
                  tabTransition.interpolate(
                    {
                      inputRange: [
                        0,
                        1,
                      ],

                      outputRange: [
                        8,
                        0,
                      ],
                    },
                  ),
              },
            ],
          }}>
          {/* ==================================================
              BABY TAB
          =================================================== */}

          {activeTab ===
          'baby' ? (
            <>
              {/* PREMIUM HERO */}

              <Animated.View
                style={[
                  styles.babyHero,
                  {
                    opacity:
                      heroAnim,

                    transform: [
                      {
                        translateY:
                          heroAnim.interpolate(
                            {
                              inputRange: [
                                0,
                                1,
                              ],
                              outputRange: [
                                12,
                                0,
                              ],
                            },
                          ),
                      },
                    ],
                  },
                ]}>
                {/* BADGE */}

                <View
                  style={
                    styles.weekBadge
                  }>
                  <MaterialDesignIcons
                    color={
                      homeColors.primary
                    }
                    name="heart-outline"
                    size={14}
                  />

                  <Text
                    style={
                      styles.weekBadgeText
                    }>
                    Semaine{' '}
                    {displayedWeek}
                  </Text>
                </View>

                {/* IMAGE */}

                <View
                  style={
                    styles.illustrationGlow
                  }>
                  {weekData?.babyImage != null ? (
                    <BabyDevelopmentImage
                      accessibilityLabel={`Illustration de grossesse — semaine ${displayedWeek}`}
                      idle
                      source={
                        weekData.babyImage
                      }
                      style={
                        styles.illustration
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.illustrationPlaceholder
                      }>
                      <MaterialDesignIcons
                        color={
                          homeColors.primary
                        }
                        name="baby-face-outline"
                        size={54}
                      />
                    </View>
                  )}
                </View>

                <Text
                  style={
                    styles.heroTitle
                  }>
                  Ton bébé cette semaine
                </Text>

                {weekData?.comparison ? (
                  <Text
                    style={
                      styles.heroSubtitle
                    }>
                    Environ{' '}
                    {
                      weekData.comparison
                    }
                  </Text>
                ) : null}
              </Animated.View>

              {/* DESCRIPTION */}

              {weekData?.babyDescription ? (
                <View
                  style={
                    styles.descriptionCard
                  }>
                  <View
                    style={
                      styles.descriptionIcon
                    }>
                    <MaterialDesignIcons
                      color={
                        homeColors.primary
                      }
                      name="baby-face-outline"
                      size={20}
                    />
                  </View>

                  <Text
                    style={
                      styles.sectionText
                    }>
                    {
                      weekData.babyDescription
                    }
                  </Text>
                </View>
              ) : (
                <EmptyContentNote
                  text="Les informations détaillées de cette semaine seront bientôt disponibles."
                />
              )}

              {/* MEASUREMENTS */}

              {hasBabyMeasurements ? (
                <View
                  style={
                    styles.infoCard
                  }>
                  <Text
                    style={
                      styles.cardHeading
                    }>
                    Développement
                  </Text>

                  <View
                    style={
                      styles.measurementsRow
                    }>
                    {weekData?.length ? (
                      <InfoRow
                        icon="ruler"
                        label="Taille"
                        value={
                          weekData.length
                        }
                      />
                    ) : null}

                    {weekData?.weight ? (
                      <InfoRow
                        icon="weight-kilogram"
                        label="Poids"
                        value={
                          weekData.weight
                        }
                      />
                    ) : null}

                    {weekData?.comparison ? (
                      <InfoRow
                        icon="shape-outline"
                        label="Comparaison"
                        value={
                          weekData.comparison
                        }
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View
                style={
                  styles.disclaimerCard
                }>
                <View
                  style={
                    styles.disclaimerIcon
                  }>
                  <MaterialDesignIcons
                    color={
                      homeColors.primary
                    }
                    name="shield-check-outline"
                    size={17}
                  />
                </View>

                <Text
                  style={
                    styles.disclaimerText
                  }>
                  Ces informations sont des estimations générales du développement fœtal. La croissance peut varier d’une grossesse à l’autre.
                </Text>
              </View>
            </>
          ) : null}

          {/* ==================================================
              BODY TAB
          =================================================== */}

          {activeTab ===
          'body' ? (
            <>
              <View
                style={
                  styles.sectionHeader
                }>
                <View
                  style={
                    styles.sectionHeaderIcon
                  }>
                  <MaterialDesignIcons
                    color={
                      homeColors.primary
                    }
                    name="human-female"
                    size={21}
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }>
                    Ton corps cette semaine
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }>
                    Les changements que tu peux ressentir
                  </Text>
                </View>
              </View>

              {weekData?.bodyChanges &&
              weekData.bodyChanges
                .length >
                0 ? (
                <View
                  style={
                    styles.listCard
                  }>
                  {weekData.bodyChanges.map(
                    (
                      item,
                      index,
                    ) => (
                      <View
                        key={`${item}-${index}`}
                        style={[
                          styles.listRow,

                          index ===
                            (weekData.bodyChanges
                              ?.length ??
                              0) -
                              1 &&
                            styles.listRowLast,
                        ]}>
                        <View
                          style={
                            styles.listBullet
                          }>
                          <MaterialDesignIcons
                            color={
                              homeColors.primary
                            }
                            name="check"
                            size={11}
                          />
                        </View>

                        <Text
                          style={
                            styles.listText
                          }>
                          {item}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              ) : (
                <EmptyContentNote
                  text="Les informations détaillées de cette semaine seront bientôt disponibles."
                />
              )}
            </>
          ) : null}

          {/* ==================================================
              TO KNOW
          =================================================== */}

          {activeTab ===
          'toKnow' ? (
            <>
              <View
                style={
                  styles.sectionHeader
                }>
                <View
                  style={
                    styles.sectionHeaderIcon
                  }>
                  <MaterialDesignIcons
                    color={
                      homeColors.primary
                    }
                    name="lightbulb-outline"
                    size={21}
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }>
                    À savoir cette semaine
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }>
                    Quelques repères utiles pour cette étape
                  </Text>
                </View>
              </View>

              {weekData?.toKnow &&
              weekData.toKnow
                .length >
                0 ? (
                <View
                  style={
                    styles.listCard
                  }>
                  {weekData.toKnow.map(
                    (
                      item,
                      index,
                    ) => (
                      <View
                        key={`${item}-${index}`}
                        style={[
                          styles.listRow,

                          index ===
                            (weekData.toKnow
                              ?.length ??
                              0) -
                              1 &&
                            styles.listRowLast,
                        ]}>
                        <View
                          style={
                            styles.listBullet
                          }>
                          <MaterialDesignIcons
                            color={
                              homeColors.primary
                            }
                            name="check"
                            size={11}
                          />
                        </View>

                        <Text
                          style={
                            styles.listText
                          }>
                          {item}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              ) : (
                <EmptyContentNote
                  text="Les informations de cette semaine seront bientôt disponibles."
                />
              )}
            </>
          ) : null}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#FAF7FD',
    },

    /* ========================================================
       HEADER
    ======================================================== */

    header: {
      minHeight: 58,

      flexDirection: 'row',
      alignItems: 'center',

      paddingHorizontal:
        spacing.md,

      paddingTop:
        spacing.sm,

      paddingBottom: 5,
    },

    backButton: {
      ...homeShadow,

      width: 44,
      height: 44,

      alignItems: 'center',
      justifyContent:
        'center',

      borderWidth: 1,
      borderColor:
        'rgba(105,73,190,0.08)',

      borderRadius: 16,

      backgroundColor:
        '#FFFFFF',
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,

      alignItems: 'center',

      marginHorizontal: 10,
    },

    headerTitle: {
      color:
        homeColors.textPrimary,

      fontFamily: 'serif',
      fontSize: 21,
      fontWeight: '800',
    },

    headerSubtitle: {
      marginTop: 3,

      color:
        homeColors.textSecondary,

      fontSize: 11.5,
    },

    headerSpacer: {
      width: 44,
    },

    weekBrowser: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: spacing.md,
      marginTop: 7,
      paddingHorizontal: 8,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: 'rgba(105,73,190,0.10)',
      borderRadius: 19,
      backgroundColor: '#FFFFFF',
      ...homeShadow,
    },
    weekArrow: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: '#F0E8FB',
    },
    weekArrowDisabled: {opacity: 0.3},
    weekBrowserCopy: {flex: 1, minWidth: 0, alignItems: 'center'},
    weekBrowserTitle: {color: homeColors.textPrimary, fontFamily: 'serif', fontSize: 16, fontWeight: '800'},
    weekBrowserContext: {marginTop: 2, color: homeColors.primary, fontSize: 10.5, fontWeight: '700'},

    /* ========================================================
       TABS
    ======================================================== */

    tabWrapper: {
      paddingHorizontal: 15,

      paddingTop: 5,
      paddingBottom: 7,
    },

    tabBar: {
      flexDirection: 'row',

      padding: 4,

      borderWidth: 1,
      borderColor:
        'rgba(105,73,190,0.08)',

      borderRadius: 18,

      backgroundColor:
        '#F1EBF8',
    },

    tabButton: {
      flex: 1,

      minHeight: 43,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',

      gap: 5,

      borderRadius: 14,
    },

    tabButtonActive: {
      ...homeShadow,

      backgroundColor:
        '#FFFFFF',
    },

    tabText: {
      color:
        homeColors.textSecondary,

      fontSize: 12.5,
      fontWeight: '700',
    },

    tabTextActive: {
      color:
        homeColors.primary,

      fontWeight: '800',
    },

    /* ========================================================
       CONTENT
    ======================================================== */

    content: {
      paddingHorizontal:
        spacing.md,

      paddingTop: 8,
    },

    /* ========================================================
       BABY HERO
    ======================================================== */

    babyHero: {
      alignItems: 'center',

      marginTop: 2,

      paddingTop: 8,
      paddingHorizontal: 14,
      paddingBottom: 16,

      borderWidth: 1,
      borderColor:
        'rgba(105,73,190,0.07)',

      borderRadius: 28,

      backgroundColor:
        'rgba(255,255,255,0.72)',
    },

    weekBadge: {
      flexDirection: 'row',
      alignItems: 'center',

      gap: 5,

      alignSelf: 'center',

      paddingHorizontal: 11,
      paddingVertical: 6,

      borderRadius: 14,

      backgroundColor:
        '#F0E8FB',
    },

    weekBadgeText: {
      color:
        homeColors.primary,

      fontSize: 10.5,
      fontWeight: '800',
    },

    illustrationGlow: {
      width: '100%',

      height: 285,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: -6,
      marginBottom: -10,

      overflow: 'hidden',
    },

    illustration: {
      width: 255,
      height: 255,

      maxWidth: '78%',
    },

    illustrationPlaceholder: {
      width: 210,
      height: 210,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 105,

      backgroundColor:
        homeColors.lightLavender,
    },

    heroTitle: {
      marginTop: 2,

      color:
        homeColors.textPrimary,

      fontFamily: 'serif',
      fontSize: 19,
      fontWeight: '800',

      textAlign: 'center',
    },

    heroSubtitle: {
      marginTop: 5,

      color:
        homeColors.textSecondary,

      fontSize: 11.5,
      fontWeight: '600',

      textAlign: 'center',
    },

    /* ========================================================
       DESCRIPTION
    ======================================================== */

    descriptionCard: {
      ...homeShadow,

      flexDirection: 'row',
      alignItems: 'flex-start',

      gap: 11,

      marginTop: 13,

      padding: 14,

      borderWidth: 1,
      borderColor:
        homeColors.cardBorder,

      borderRadius: 20,

      backgroundColor:
        '#FFFFFF',
    },

    descriptionIcon: {
      width: 38,
      height: 38,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        homeColors.lightLavender,
    },

    sectionText: {
      flex: 1,

      color:
        homeColors.textSecondary,

      fontSize: 13,
      lineHeight: 20,
    },

    /* ========================================================
       INFO CARD
    ======================================================== */

    infoCard: {
      ...homeShadow,

      marginTop: 13,

      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 4,

      borderWidth: 1,
      borderColor:
        homeColors.cardBorder,

      borderRadius: 22,

      backgroundColor:
        '#FFFFFF',
    },

    cardHeading: {
      marginBottom: 3,

      color:
        homeColors.textPrimary,

      fontFamily: 'serif',
      fontSize: 15,
      fontWeight: '800',
    },

    measurementsRow: {
      marginTop: 5,
    },

    infoRow: {
      minHeight: 57,

      flexDirection: 'row',
      alignItems: 'center',

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        homeColors.cardBorder,
    },

    infoIcon: {
      width: 36,
      height: 36,

      alignItems: 'center',
      justifyContent:
        'center',

      marginRight: 11,

      borderRadius: 12,

      backgroundColor:
        homeColors.lightLavender,
    },

    infoCopy: {
      flex: 1,
      minWidth: 0,
    },

    infoLabel: {
      color:
        homeColors.textSecondary,

      fontSize: 10.5,
      fontWeight: '600',
    },

    infoValue: {
      marginTop: 2,

      color:
        homeColors.textPrimary,

      fontSize: 13,
      fontWeight: '800',
    },

    /* ========================================================
       DISCLAIMER
    ======================================================== */

    disclaimerCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',

      gap: 9,

      marginTop: 13,

      padding: 13,

      borderRadius: 18,

      backgroundColor:
        '#F4EFFA',
    },

    disclaimerIcon: {
      width: 30,
      height: 30,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        '#E9E0F7',
    },

    disclaimerText: {
      flex: 1,

      color:
        homeColors.textSecondary,

      fontSize: 10.5,
      lineHeight: 16,
    },

    /* ========================================================
       SECTION HEADER
    ======================================================== */

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',

      marginTop: 8,
      marginBottom: 6,
    },

    sectionHeaderIcon: {
      width: 42,
      height: 42,

      alignItems: 'center',
      justifyContent:
        'center',

      marginRight: 10,

      borderRadius: 14,

      backgroundColor:
        homeColors.lightLavender,
    },

    sectionTitle: {
      color:
        homeColors.textPrimary,

      fontFamily: 'serif',
      fontSize: 17,
      fontWeight: '800',
    },

    sectionSubtitle: {
      marginTop: 2,

      color:
        homeColors.textSecondary,

      fontSize: 10.5,
    },

    /* ========================================================
       EMPTY
    ======================================================== */

    emptyContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',

      gap: 10,

      marginTop: 12,

      padding: 14,

      borderRadius: 18,

      backgroundColor:
        homeColors.lightLavender,
    },

    emptyContentIcon: {
      marginTop: 1,
    },

    emptyContentText: {
      flex: 1,

      color:
        homeColors.textSecondary,

      fontSize: 12.5,
      lineHeight: 18,
    },

    /* ========================================================
       LIST
    ======================================================== */

    listCard: {
      ...homeShadow,

      marginTop: 12,

      paddingHorizontal: 15,

      borderWidth: 1,
      borderColor:
        homeColors.cardBorder,

      borderRadius: 22,

      backgroundColor:
        '#FFFFFF',
    },

    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',

      gap: 11,

      paddingVertical: 14,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        homeColors.cardBorder,
    },

    listRowLast: {
      borderBottomWidth: 0,
    },

    listBullet: {
      width: 24,
      height: 24,

      flexShrink: 0,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 1,

      borderRadius: 8,

      backgroundColor:
        homeColors.lightLavender,
    },

    listText: {
      flex: 1,

      color:
        homeColors.textPrimary,

      fontSize: 13,
      lineHeight: 19,
    },

    /* ========================================================
       UNCONFIGURED
    ======================================================== */

    unconfigured: {
      flex: 1,

      alignItems: 'center',
      justifyContent:
        'center',

      paddingHorizontal: 28,
    },

    unconfiguredIcon: {
      width: 72,
      height: 72,

      alignItems: 'center',
      justifyContent:
        'center',

      borderRadius: 36,

      backgroundColor:
        homeColors.lightLavender,
    },

    unconfiguredTitle: {
      marginTop: 16,

      color:
        homeColors.textPrimary,

      fontFamily: 'serif',
      fontSize: 20,
      fontWeight: '800',

      textAlign: 'center',
    },

    unconfiguredText: {
      maxWidth: 310,

      marginTop: 8,

      color:
        homeColors.textSecondary,

      fontSize: 13,
      lineHeight: 19,

      textAlign: 'center',
    },

    unconfiguredButton: {
      minHeight: 51,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 20,

      paddingHorizontal: 24,

      borderRadius: 18,

      backgroundColor:
        homeColors.primary,
    },

    unconfiguredButtonText: {
      color: '#FFFFFF',

      fontSize: 14,
      fontWeight: '800',
    },

    pressed: {
      opacity: 0.82,
    },
  });
