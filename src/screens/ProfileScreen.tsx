import React, {useMemo, useState} from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../navigation/AppNavigator';
import type {MainTabScreenProps} from '../navigation/MainTabNavigator';
import {getTopPadding} from '../theme/spacing';

import {
  getCyclePreferences,
  getFirstName,
  getSelectedLocation,
  getSelectedObjective,
  getSelectedSchool,
  getSpiritualMarkersEnabled,
  setSelectedObjective,
  setSpiritualMarkersEnabled,
  type ObjectiveId,
  type SchoolId,
} from '../state/onboardingPreferences';

import {lockIntimacy} from '../state/privateSectionAuthStore';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';

const BACKGROUND = require('../assets/images/homebackground.png');

const PROFILE_CARD_BACKGROUND = require(
  '../assets/images/background-card.png',
);

const AVATAR = require('../assets/images/icone_avatar.png');

type IconName =
  React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = MainTabScreenProps<'Profile'>;

/* ============================================================
 * OBJECTIFS
 * ============================================================ */

const OBJECTIVE_LABELS: Record<ObjectiveId, string> = {
  cycle: 'Suivre mon cycle',
  conceive: 'Essayer de concevoir',
  contraception: 'Contraception',
  irregular: 'Cycles irréguliers (SOPK)',
  menopause: 'Post-ménopause / Ménopause',
  pregnancy: 'Suivi de grossesse',
  postpartum: 'Post-partum',
  loss: 'Après une fausse couche',
};

const OBJECTIVES: Array<{
  id: ObjectiveId;
  icon: string;
  label: string;
  subtitle: string;
  tint: string;
}> = [
  {
    id: 'cycle',
    icon: '🗓️',
    label: 'Suivre mon cycle',
    subtitle: 'Suivre mes règles et comprendre mon cycle',
    tint: '#E7F0E8',
  },
  {
    id: 'conceive',
    icon: '💗',
    label: 'Essayer de concevoir',
    subtitle: 'Suivre ma fertilité et mon ovulation',
    tint: '#FBE8E8',
  },
  {
    id: 'contraception',
    icon: '💊',
    label: 'Contraception',
    subtitle: 'Suivre mon cycle avec une contraception',
    tint: '#F1E8F5',
  },
  {
    id: 'irregular',
    icon: '🪷',
    label: 'Cycles irréguliers (SOPK)',
    subtitle: 'Mieux comprendre mes cycles irréguliers',
    tint: '#FBE9E7',
  },
  {
    id: 'menopause',
    icon: '👤',
    label: 'Post-ménopause / Ménopause',
    subtitle: 'Suivre mon bien-être pendant cette période',
    tint: '#EFE7F4',
  },
  {
    id: 'pregnancy',
    icon: '🤰',
    label: 'Suivi de grossesse',
    subtitle: 'Accompagner les différentes étapes de ma grossesse',
    tint: '#FBE9EB',
  },
  {
    id: 'postpartum',
    icon: '🍼',
    label: 'Post-partum',
    subtitle: 'Suivre ma récupération après la naissance',
    tint: '#E8F1E9',
  },
  {
    id: 'loss',
    icon: '☁️',
    label: 'Après une fausse couche',
    subtitle: 'Suivre mon corps et ma récupération',
    tint: '#EDF2E9',
  },
];

/* ============================================================
 * REPÈRES SPIRITUELS
 * ============================================================ */

const SPIRITUAL_FEATURES = [
  {
    icon: '🗓️',
    label: 'Calendrier hijri',
    description: 'Dates et événements du calendrier islamique',
  },
  {
    icon: '🤲',
    label: 'Prières & statut de pureté',
    description: 'Suivi des prières et du statut de pureté',
  },
  {
    icon: '🌙',
    label: 'Jeûne (Ramadan, rattrapages)',
    description: 'Ramadan et jours de jeûne à rattraper',
  },
  {
    icon: '🔔',
    label: 'Rappels de la prière',
    description: 'Recevoir des rappels liés aux prières',
  },
];

const SCHOOL_LABELS: Record<SchoolId, string> = {
  hanafi: 'École hanafite',
  maliki: 'École malikite',
  chafii: 'École chaféite',
  hanbali: 'École hanbalite',
  unknown: 'École non précisée',
};

/* ============================================================
 * HELPERS
 * ============================================================ */

const startOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(date);

const formatHijriDate = (
  date: Date,
): string | undefined => {
  try {
    return new Intl.DateTimeFormat(
      'fr-FR-u-ca-islamic',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ).format(date);
  } catch {
    return undefined;
  }
};

const computeNextPeriod = (
  lastPeriodStart: Date,
  cycleDuration: number,
): Date => {
  const today = startOfDay(new Date());

  let next = startOfDay(lastPeriodStart);

  while (next.getTime() < today.getTime()) {
    next = new Date(
      next.getFullYear(),
      next.getMonth(),
      next.getDate() + cycleDuration,
    );
  }

  return next;
};

/* ============================================================
 * STAT CARD
 * ============================================================ */

type StatCardProps = {
  icon: IconName;
  label: string;
  value: string;
};

function StatCard({
  icon,
  label,
  value,
}: StatCardProps): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon}
          size={18}
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
 * MENU ROW
 * ============================================================ */

type MenuRowProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: MenuRowProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.menuRow,
        pressed && styles.pressed,
      ]}>
      <View style={styles.menuIcon}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon}
          size={21}
        />
      </View>

      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>
          {title}
        </Text>

        <Text style={styles.menuSubtitle}>
          {subtitle}
        </Text>
      </View>

      <MaterialDesignIcons
        color="#B7ACC9"
        name="chevron-right"
        size={22}
      />
    </Pressable>
  );
}

/* ============================================================
 * PROFILE SCREEN
 * ============================================================ */

function ProfileScreen({
  navigation,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();

  const compact = width < 360;

  const firstName = getFirstName();

  /* ========================================================
   * RATIO RÉEL DE background-card.png
   * ======================================================== */

  const profileBackgroundInfo = useMemo(
    () =>
      Image.resolveAssetSource(
        PROFILE_CARD_BACKGROUND,
      ),
    [],
  );

  const profileCardAspectRatio = useMemo(() => {
    if (
      !profileBackgroundInfo?.width ||
      !profileBackgroundInfo?.height
    ) {
      /*
       * Fallback uniquement si React Native
       * n'arrive pas à lire les dimensions.
       */
      return 2.15;
    }

    return (
      profileBackgroundInfo.width /
      profileBackgroundInfo.height
    );
  }, [profileBackgroundInfo]);

  /* ========================================================
   * OBJECTIF
   * ======================================================== */

  const [objective, setObjective] =
    useState<ObjectiveId>(
      getSelectedObjective(),
    );

  const [
    objectiveModalVisible,
    setObjectiveModalVisible,
  ] = useState(false);

  /* ========================================================
   * REPÈRES
   * ======================================================== */

  const [
    spiritualEnabled,
    setSpiritualEnabled,
  ] = useState(
    getSpiritualMarkersEnabled(),
  );

  const [
    spiritualModalVisible,
    setSpiritualModalVisible,
  ] = useState(false);

  const school = useMemo(
    () => getSelectedSchool(),
    [],
  );

  const location = useMemo(
    () => getSelectedLocation(),
    [],
  );

  const cycle = useMemo(
    () => getCyclePreferences(),
    [],
  );

  const nextPeriod = useMemo(
    () =>
      computeNextPeriod(
        cycle.lastPeriodStart,
        cycle.cycleDuration,
      ),
    [cycle],
  );

  const hijriToday = useMemo(
    () => formatHijriDate(new Date()),
    [],
  );

  const metaParts = [
    OBJECTIVE_LABELS[objective],
  ];

  if (
    school &&
    school !== 'unknown'
  ) {
    metaParts.push(
      SCHOOL_LABELS[school],
    );
  }

  if (location?.city) {
    metaParts.push(location.city);
  }

  /* ========================================================
   * CHANGER OBJECTIF
   * ======================================================== */

  const changeObjective = (
    nextObjective: ObjectiveId,
  ) => {
    setSelectedObjective(
      nextObjective,
    );

    setObjective(
      nextObjective,
    );

    setObjectiveModalVisible(
      false,
    );
  };

  /* ========================================================
   * CHANGER REPÈRES
   * ======================================================== */

  const changeSpiritualMarkers = (
    enabled: boolean,
  ) => {
    setSpiritualMarkersEnabled(
      enabled,
    );

    setSpiritualEnabled(
      enabled,
    );
  };

  const showAbout = () =>
    Alert.alert(
      'À propos de HAWA',
      'HAWA t’accompagne au quotidien dans le suivi de ton cycle, avec douceur, pudeur et en accord avec tes repères spirituels.',
    );

  const showSupport = () =>
    Alert.alert(
      'Aide & support',
      'Une question ou un souci ? Notre équipe support te répondra rapidement.',
    );

  const confirmSignOut = () =>
    Alert.alert(
      'Se déconnecter ?',
      'Tu devras te reconnecter pour retrouver ton profil.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',

          onPress: () => {
            lockIntimacy();

            navigation
              .getParent<
                NativeStackNavigationProp<
                  RootStackParamList
                >
              >()
              ?.reset({
                index: 0,
                routes: [
                  {
                    name: 'Auth',
                  },
                ],
              });
          },
        },
      ],
    );

  return (
    <ImageBackground
      resizeMode="cover"
      source={BACKGROUND}
      style={styles.page}>
      <SafeAreaView style={styles.safe}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
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
                  16,
                ) + 24,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>
                Profil
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }>
                Gère tes informations et préférences
              </Text>
            </View>

            <Pressable
              accessibilityLabel="Notifications"
              style={
                styles.notification
              }>
              <MaterialDesignIcons
                color={PURPLE}
                name="bell-outline"
                size={23}
              />

              <View
                style={
                  styles.notificationDot
                }
              />
            </Pressable>
          </View>

          {/* =================================================
              PROFILE CARD

              IMPORTANT :
              aspectRatio = ratio réel de background-card.png
          ================================================= */}

          <ImageBackground
            imageStyle={
              styles.profileCardImage
            }
            resizeMode="cover"
            source={
              PROFILE_CARD_BACKGROUND
            }
            style={[
              styles.profileCard,
              {
                aspectRatio:
                  profileCardAspectRatio,
              },
            ]}>
            <View
              style={
                styles.profileCardContent
              }>
              <View
                style={
                  styles.avatarRow
                }>
                <View
                  style={
                    styles.avatarWrap
                  }>
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="cover"
                    source={AVATAR}
                    style={
                      styles.avatar
                    }
                  />

                  <Pressable
                    accessibilityLabel="Changer la photo de profil"
                    style={({pressed}) => [
                      styles.avatarBadge,

                      pressed &&
                        styles.pressed,
                    ]}>
                    <MaterialDesignIcons
                      color="#FFFFFF"
                      name="camera-outline"
                      size={14}
                    />
                  </Pressable>
                </View>

                <View
                  style={
                    styles.identity
                  }>
                  <View
                    style={
                      styles.nameRow
                    }>
                    <Text
                      numberOfLines={1}
                      style={
                        styles.name
                      }>
                      {firstName}
                    </Text>

                    <Pressable
                      accessibilityLabel="Modifier le profil"
                      hitSlop={8}>
                      <MaterialDesignIcons
                        color={PURPLE}
                        name="pencil-outline"
                        size={16}
                      />
                    </Pressable>
                  </View>

                  <Text
                    style={
                      styles.meta
                    }>
                    {metaParts.join(
                      ' • ',
                    )}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setSpiritualModalVisible(
                        true,
                      )
                    }
                    style={[
                      styles.spiritualPill,

                      spiritualEnabled
                        ? styles.spiritualPillActive
                        : styles.spiritualPillInactive,
                    ]}>
                    <MaterialDesignIcons
                      color={
                        spiritualEnabled
                          ? '#FFFFFF'
                          : PURPLE
                      }
                      name="moon-waning-crescent"
                      size={12}
                    />

                    <Text
                      style={[
                        styles.spiritualPillText,

                        spiritualEnabled
                          ? styles.spiritualPillTextActive
                          : styles.spiritualPillTextInactive,
                      ]}>
                      {spiritualEnabled
                        ? 'Repères spirituels activés'
                        : 'Repères spirituels désactivés'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ImageBackground>

          {/* STATS */}

          <View
            style={
              styles.statsGrid
            }>
            <StatCard
              icon="calendar-range"
              label="Cycle moyen"
              value={`${cycle.cycleDuration} jours`}
            />

            <StatCard
              icon="water-outline"
              label="Durée règles"
              value={`${cycle.periodDuration} jours`}
            />

            <StatCard
              icon="calendar-month-outline"
              label="Prochaines règles"
              value={formatShortDate(
                nextPeriod,
              )}
            />

            <StatCard
              icon="weather-night"
              label="Date hijri"
              value={
                spiritualEnabled
                  ? hijriToday ?? '—'
                  : 'Désactivé'
              }
            />
          </View>

          {/* MES INFORMATIONS */}

          <Text
            style={
              styles.sectionTitle
            }>
            Mes informations
          </Text>

          <View
            style={
              styles.menuCard
            }>
            <MenuRow
              icon="account-outline"
              subtitle="Nom, email, date de naissance…"
              title="Informations personnelles"
            />

            <View
              style={
                styles.menuDivider
              }
            />

            <MenuRow
              icon="target"
              onPress={() =>
                setObjectiveModalVisible(
                  true,
                )
              }
              subtitle={
                OBJECTIVE_LABELS[
                  objective
                ]
              }
              title="Mon objectif"
            />

            <View
              style={
                styles.menuDivider
              }
            />

            <MenuRow
              icon="heart-pulse"
              subtitle="Poids, taille, groupe sanguin, maladies…"
              title="Santé générale"
            />

            <View
              style={
                styles.menuDivider
              }
            />

            <MenuRow
              icon="shield-lock-outline"
              onPress={() =>
                navigation.navigate(
                  'SecuritySetup',
                )
              }
              subtitle="Code, Face ID, mode discret, suppression des données"
              title="Confidentialité & Sécurité"
            />

            <View
              style={
                styles.menuDivider
              }
            />

            <MenuRow
              icon="cloud-outline"
              subtitle="Sauvegarde cloud, restauration…"
              title="Sauvegarde"
            />
          </View>

          {/* =================================================
              REPÈRES SPIRITUELS
          ================================================= */}

          <View
            style={[
              styles.spiritualCard,

              !spiritualEnabled &&
                styles.spiritualCardDisabled,
            ]}>
            <View
              style={
                styles.spiritualHeader
              }>
              <View
                style={[
                  styles.spiritualIconCircle,

                  !spiritualEnabled &&
                    styles.spiritualIconCircleDisabled,
                ]}>
                <Text
                  style={[
                    styles.moonEmoji,

                    !spiritualEnabled &&
                      styles.emojiDisabled,
                  ]}>
                  🌙
                </Text>
              </View>

              <View
                style={
                  styles.spiritualCopy
                }>
                <View
                  style={
                    styles.spiritualTitleRow
                  }>
                  <Text
                    style={[
                      styles.spiritualTitle,

                      !spiritualEnabled &&
                        styles.spiritualTitleDisabled,
                    ]}>
                    Repères spirituels
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,

                      spiritualEnabled
                        ? styles.statusBadgeActive
                        : styles.statusBadgeInactive,
                    ]}>
                    <Text
                      style={[
                        styles.statusBadgeText,

                        spiritualEnabled
                          ? styles.statusBadgeTextActive
                          : styles.statusBadgeTextInactive,
                      ]}>
                      {spiritualEnabled
                        ? 'Actif'
                        : 'Inactif'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.spiritualText,

                    !spiritualEnabled &&
                      styles.spiritualTextDisabled,
                  ]}>
                  Calendrier hijri, prières, pureté, jeûne et rappels.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.spiritualMiniFeatures
              }>
              {SPIRITUAL_FEATURES.map(
                feature => (
                  <View
                    key={
                      feature.label
                    }
                    style={[
                      styles.spiritualMiniFeature,

                      !spiritualEnabled &&
                        styles.spiritualMiniFeatureDisabled,
                    ]}>
                    <Text
                      style={[
                        styles.spiritualMiniEmoji,

                        !spiritualEnabled &&
                          styles.emojiDisabled,
                      ]}>
                      {feature.icon}
                    </Text>

                    <Text
                      style={[
                        styles.spiritualMiniText,

                        !spiritualEnabled &&
                          styles.spiritualMiniTextDisabled,
                      ]}>
                      {feature.label}
                    </Text>
                  </View>
                ),
              )}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setSpiritualModalVisible(
                  true,
                )
              }
              style={({pressed}) => [
                styles.manageButton,

                pressed &&
                  styles.pressed,
              ]}>
              <Text
                style={
                  styles.manageButtonText
                }>
                Gérer les repères
              </Text>

              <MaterialDesignIcons
                color="#FFFFFF"
                name="tune-variant"
                size={17}
              />
            </Pressable>
          </View>

          {/* PLUS */}

          <Text
            style={
              styles.sectionTitle
            }>
            Plus
          </Text>

          <View
            style={
              styles.menuCard
            }>
            <MenuRow
              icon="information-outline"
              onPress={showAbout}
              subtitle="Version, mentions et valeurs de l’application"
              title="À propos de HAWA"
            />

            <View
              style={
                styles.menuDivider
              }
            />

            <MenuRow
              icon="lifebuoy"
              onPress={showSupport}
              subtitle="Questions, signalement, contact"
              title="Aide & support"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={confirmSignOut}
            style={({pressed}) => [
              styles.signOut,

              pressed &&
                styles.pressed,
            ]}>
            <MaterialDesignIcons
              color="#B4485A"
              name="logout"
              size={19}
            />

            <Text
              style={
                styles.signOutText
              }>
              Se déconnecter
            </Text>
          </Pressable>
        </ScrollView>

        {/* =====================================================
            OBJECTIVE MODAL
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() =>
            setObjectiveModalVisible(
              false,
            )
          }
          statusBarTranslucent
          transparent
          visible={
            objectiveModalVisible
          }>
          <View
            style={
              styles.modalOverlay
            }>
            <Pressable
              onPress={() =>
                setObjectiveModalVisible(
                  false,
                )
              }
              style={
                StyleSheet.absoluteFill
              }
            />

            <View
              style={
                styles.objectiveSheet
              }>
              <View
                style={
                  styles.sheetHandle
                }
              />

              <View
                style={
                  styles.sheetHeader
                }>
                <View
                  style={
                    styles.sheetHeaderCopy
                  }>
                  <Text
                    style={
                      styles.sheetTitle
                    }>
                    Modifier mon objectif
                  </Text>

                  <Text
                    style={
                      styles.sheetSubtitle
                    }>
                    Choisis l’objectif qui correspond le mieux à ta situation.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setObjectiveModalVisible(
                      false,
                    )
                  }
                  style={
                    styles.sheetClose
                  }>
                  <MaterialDesignIcons
                    color={
                      PURPLE_DARK
                    }
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.objectiveList,

                  {
                    paddingBottom:
                      Math.max(
                        insets.bottom,
                        14,
                      ) + 14,
                  },
                ]}
                showsVerticalScrollIndicator={
                  false
                }>
                {OBJECTIVES.map(
                  item => {
                    const active =
                      objective ===
                      item.id;

                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked:
                            active,
                        }}
                        onPress={() =>
                          changeObjective(
                            item.id,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.objectiveOption,

                          active &&
                            styles.objectiveOptionActive,

                          pressed &&
                            styles.optionPressed,
                        ]}>
                        <View
                          style={[
                            styles.objectiveIcon,

                            {
                              backgroundColor:
                                item.tint,
                            },
                          ]}>
                          <Text
                            style={
                              styles.objectiveEmoji
                            }>
                            {item.icon}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.objectiveOptionCopy
                          }>
                          <Text
                            style={[
                              styles.objectiveOptionTitle,

                              active &&
                                styles.objectiveOptionTitleActive,
                            ]}>
                            {item.label}
                          </Text>

                          <Text
                            style={
                              styles.objectiveOptionSubtitle
                            }>
                            {item.subtitle}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.objectiveRadio,

                            active &&
                              styles.objectiveRadioActive,
                          ]}>
                          {active ? (
                            <MaterialDesignIcons
                              color="#FFFFFF"
                              name="check"
                              size={15}
                            />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  },
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* =====================================================
            SPIRITUAL MODAL
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() =>
            setSpiritualModalVisible(
              false,
            )
          }
          statusBarTranslucent
          transparent
          visible={
            spiritualModalVisible
          }>
          <View
            style={
              styles.modalOverlay
            }>
            <Pressable
              onPress={() =>
                setSpiritualModalVisible(
                  false,
                )
              }
              style={
                StyleSheet.absoluteFill
              }
            />

            <View
              style={
                styles.spiritualSheet
              }>
              <View
                style={
                  styles.sheetHandle
                }
              />

              <View
                style={
                  styles.sheetHeader
                }>
                <View
                  style={
                    styles.spiritualSheetTitleIcon
                  }>
                  <Text
                    style={
                      styles.spiritualHeaderEmoji
                    }>
                    🌙
                  </Text>
                </View>

                <View
                  style={
                    styles.sheetHeaderCopy
                  }>
                  <Text
                    style={
                      styles.sheetTitle
                    }>
                    Repères spirituels
                  </Text>

                  <Text
                    style={
                      styles.sheetSubtitle
                    }>
                    Active ou désactive les fonctionnalités spirituelles de HAWA.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setSpiritualModalVisible(
                      false,
                    )
                  }
                  style={
                    styles.sheetClose
                  }>
                  <MaterialDesignIcons
                    color={
                      PURPLE_DARK
                    }
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.spiritualSheetContent,

                  {
                    paddingBottom:
                      Math.max(
                        insets.bottom,
                        16,
                      ) + 16,
                  },
                ]}
                showsVerticalScrollIndicator={
                  false
                }>
                <Text
                  style={
                    styles.activationLabel
                  }>
                  État des repères
                </Text>

                <View
                  style={
                    styles.activationChoices
                  }>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked:
                        spiritualEnabled,
                    }}
                    onPress={() =>
                      changeSpiritualMarkers(
                        true,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.activationChoice,

                      spiritualEnabled &&
                        styles.activationChoiceActive,

                      pressed &&
                        styles.optionPressed,
                    ]}>
                    <View
                      style={[
                        styles.activationRadio,

                        spiritualEnabled &&
                          styles.activationRadioActive,
                      ]}>
                      {spiritualEnabled ? (
                        <View
                          style={
                            styles.activationRadioDot
                          }
                        />
                      ) : null}
                    </View>

                    <View
                      style={
                        styles.activationCopy
                      }>
                      <Text
                        style={[
                          styles.activationTitle,

                          spiritualEnabled &&
                            styles.activationTitleActive,
                        ]}>
                        Oui, activer
                      </Text>

                      <Text
                        style={[
                          styles.activationDescription,

                          spiritualEnabled &&
                            styles.activationDescriptionActive,
                        ]}>
                        Afficher les fonctionnalités spirituelles
                      </Text>
                    </View>

                    {spiritualEnabled ? (
                      <View
                        style={
                          styles.activationCheck
                        }>
                        <MaterialDesignIcons
                          color={PURPLE}
                          name="check"
                          size={17}
                        />
                      </View>
                    ) : null}
                  </Pressable>

                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked:
                        !spiritualEnabled,
                    }}
                    onPress={() =>
                      changeSpiritualMarkers(
                        false,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.activationChoice,

                      !spiritualEnabled &&
                        styles.activationChoiceActive,

                      pressed &&
                        styles.optionPressed,
                    ]}>
                    <View
                      style={[
                        styles.activationRadio,

                        !spiritualEnabled &&
                          styles.activationRadioActive,
                      ]}>
                      {!spiritualEnabled ? (
                        <View
                          style={
                            styles.activationRadioDot
                          }
                        />
                      ) : null}
                    </View>

                    <View
                      style={
                        styles.activationCopy
                      }>
                      <Text
                        style={[
                          styles.activationTitle,

                          !spiritualEnabled &&
                            styles.activationTitleActive,
                        ]}>
                        Non, désactiver
                      </Text>

                      <Text
                        style={[
                          styles.activationDescription,

                          !spiritualEnabled &&
                            styles.activationDescriptionActive,
                        ]}>
                        Masquer les fonctionnalités spirituelles
                      </Text>
                    </View>

                    {!spiritualEnabled ? (
                      <View
                        style={
                          styles.activationCheck
                        }>
                        <MaterialDesignIcons
                          color={PURPLE}
                          name="check"
                          size={17}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                </View>

                <View
                  style={
                    styles.featuresHeader
                  }>
                  <Text
                    style={
                      styles.featuresTitle
                    }>
                    Fonctionnalités concernées
                  </Text>

                  <View
                    style={[
                      styles.featuresStatus,

                      spiritualEnabled
                        ? styles.featuresStatusActive
                        : styles.featuresStatusDisabled,
                    ]}>
                    <Text
                      style={[
                        styles.featuresStatusText,

                        spiritualEnabled
                          ? styles.featuresStatusTextActive
                          : styles.featuresStatusTextDisabled,
                      ]}>
                      {spiritualEnabled
                        ? 'Activées'
                        : 'Désactivées'}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.spiritualFeatures
                  }>
                  {SPIRITUAL_FEATURES.map(
                    feature => (
                      <View
                        key={
                          feature.label
                        }
                        style={[
                          styles.spiritualFeatureCard,

                          !spiritualEnabled &&
                            styles.spiritualFeatureCardDisabled,
                        ]}>
                        <View
                          style={[
                            styles.spiritualFeatureIcon,

                            !spiritualEnabled &&
                              styles.spiritualFeatureIconDisabled,
                          ]}>
                          <Text
                            style={[
                              styles.spiritualFeatureEmoji,

                              !spiritualEnabled &&
                                styles.emojiDisabled,
                            ]}>
                            {feature.icon}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.spiritualFeatureCopy
                          }>
                          <Text
                            style={[
                              styles.spiritualFeatureTitle,

                              !spiritualEnabled &&
                                styles.spiritualFeatureTitleDisabled,
                            ]}>
                            {feature.label}
                          </Text>

                          <Text
                            style={[
                              styles.spiritualFeatureDescription,

                              !spiritualEnabled &&
                                styles.spiritualFeatureDescriptionDisabled,
                            ]}>
                            {
                              feature.description
                            }
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.featureStateIcon,

                            spiritualEnabled
                              ? styles.featureStateIconActive
                              : styles.featureStateIconDisabled,
                          ]}>
                          <MaterialDesignIcons
                            color={
                              spiritualEnabled
                                ? '#FFFFFF'
                                : '#AAA3B5'
                            }
                            name={
                              spiritualEnabled
                                ? 'check'
                                : 'minus'
                            }
                            size={14}
                          />
                        </View>
                      </View>
                    ),
                  )}
                </View>

                <View
                  style={
                    styles.spiritualInfoBox
                  }>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="information-outline"
                    size={19}
                  />

                  <Text
                    style={
                      styles.spiritualInfoText
                    }>
                    Tu peux modifier ce choix à tout moment depuis ton profil.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setSpiritualModalVisible(
                      false,
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.doneButton,

                    pressed &&
                      styles.optionPressed,
                  ]}>
                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name="check"
                    size={19}
                  />

                  <Text
                    style={
                      styles.doneButtonText
                    }>
                    Terminé
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F0E3F9',
  },

  safe: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },

  headerTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
  },

  headerSubtitle: {
    marginTop: 3,
    color: '#655A8D',
    fontSize: 13,
  },

  notification: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.16)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,252,255,0.92)',
  },

  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#DC7B82',
  },

  /* ========================================================
   * PROFILE CARD
   *
   * PAS DE HEIGHT FIXE.
   * PAS DE minHeight.
   *
   * aspectRatio est injecté depuis Image.resolveAssetSource().
   * ======================================================== */

  profileCard: {
    width: '100%',
    marginTop: 18,
    overflow: 'hidden',
    borderRadius: 26,
    backgroundColor: '#F1E8FA',

    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  /*
   * Même bordure exacte que le cadre.
   */
  profileCardImage: {
    borderRadius: 26,
  },

  /*
   * Ce contenu remplit le cadre sans modifier
   * les dimensions imposées par aspectRatio.
   */
  profileCardContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrap: {
    width: 68,
    height: 68,
    flexShrink: 0,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 13,
    backgroundColor: PURPLE,
  },

  identity: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  name: {
    flexShrink: 1,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },

  meta: {
    marginTop: 3,
    color: '#5B5177',
    fontSize: 11.5,
    lineHeight: 16,
  },

  spiritualPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  spiritualPillActive: {
    backgroundColor: PURPLE,
  },

  spiritualPillInactive: {
    backgroundColor: 'rgba(105,73,190,0.14)',
  },

  spiritualPillText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  spiritualPillTextActive: {
    color: '#FFFFFF',
  },

  spiritualPillTextInactive: {
    color: PURPLE,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },

  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,255,0.9)',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  statIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#F0E8FC',
  },

  statValue: {
    marginTop: 9,
    color: PURPLE_DARK,
    fontSize: 15,
    fontWeight: '700',
  },

  statLabel: {
    marginTop: 1,
    color: '#8479A0',
    fontSize: 11,
    lineHeight: 15,
  },

  sectionTitle: {
    marginTop: 22,
    marginBottom: 9,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
  },

  menuCard: {
    borderWidth: 1,
    borderColor: 'rgba(111,83,190,0.14)',
    borderRadius: 22,
    backgroundColor: 'rgba(255,252,255,0.92)',
    paddingHorizontal: 6,
  },

  menuRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 8,
    backgroundColor: 'rgba(111,83,190,0.14)',
  },

  menuIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F0E8FC',
  },

  menuCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  menuTitle: {
    color: '#2A2050',
    fontSize: 14.5,
    fontWeight: '700',
  },

  menuSubtitle: {
    marginTop: 2,
    color: '#8479A0',
    fontSize: 11.5,
    lineHeight: 16,
  },

  spiritualCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.18)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,255,0.94)',
    padding: 14,
  },

  spiritualCardDisabled: {
    borderColor: 'rgba(160,150,174,0.22)',
    backgroundColor: 'rgba(239,235,244,0.88)',
  },

  spiritualHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  spiritualIconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#EEE3FA',
  },

  spiritualIconCircleDisabled: {
    backgroundColor: '#DDD8E3',
  },

  moonEmoji: {
    fontSize: 22,
  },

  emojiDisabled: {
    opacity: 0.32,
  },

  spiritualCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  spiritualTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  spiritualTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
  },

  spiritualTitleDisabled: {
    color: '#9890A5',
  },

  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  statusBadgeActive: {
    backgroundColor: '#E4F3E7',
  },

  statusBadgeInactive: {
    backgroundColor: '#DDD8E3',
  },

  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  statusBadgeTextActive: {
    color: '#3E8E56',
  },

  statusBadgeTextInactive: {
    color: '#81798C',
  },

  spiritualText: {
    marginTop: 5,
    color: '#756A90',
    fontSize: 11.5,
    lineHeight: 16,
  },

  spiritualTextDisabled: {
    color: '#9D96A7',
  },

  spiritualMiniFeatures: {
    gap: 7,
    marginTop: 14,
  },

  spiritualMiniFeature: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: '#F7F2FC',
    paddingHorizontal: 10,
  },

  spiritualMiniFeatureDisabled: {
    backgroundColor: '#E5E1E9',
  },

  spiritualMiniEmoji: {
    width: 28,
    fontSize: 17,
  },

  spiritualMiniText: {
    flex: 1,
    color: '#41365F',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
  },

  spiritualMiniTextDisabled: {
    color: '#9992A3',
  },

  manageButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 13,
    borderRadius: 15,
    backgroundColor: PURPLE,
  },

  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  signOut: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    borderWidth: 1,
    borderColor: 'rgba(180,72,90,0.28)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,252,255,0.9)',
  },

  signOutText: {
    color: '#B4485A',
    fontSize: 15,
    fontWeight: '700',
  },

  /* MODAL */

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26,16,53,0.46)',
  },

  objectiveSheet: {
    maxHeight: '88%',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FCF9FF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  spiritualSheet: {
    maxHeight: '90%',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FCF9FF',
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  sheetHandle: {
    width: 46,
    height: 5,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 3,
    backgroundColor: '#DDD2E9',
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 14,
  },

  sheetHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },

  sheetTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
  },

  sheetSubtitle: {
    marginTop: 4,
    color: '#756A90',
    fontSize: 12,
    lineHeight: 17,
  },

  sheetClose: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.14)',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  objectiveList: {
    gap: 9,
    paddingTop: 2,
  },

  objectiveOption: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.14)',
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  objectiveOptionActive: {
    borderColor: PURPLE,
    backgroundColor: '#F7F2FD',
  },

  objectiveIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 15,
  },

  objectiveEmoji: {
    fontSize: 23,
  },

  objectiveOptionCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  objectiveOptionTitle: {
    color: '#34295B',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
  },

  objectiveOptionTitleActive: {
    color: PURPLE_DARK,
    fontWeight: '800',
  },

  objectiveOptionSubtitle: {
    marginTop: 3,
    color: '#85799E',
    fontSize: 10.5,
    lineHeight: 15,
  },

  objectiveRadio: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: '#D6CAE4',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },

  objectiveRadioActive: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  /* SPIRITUAL SHEET */

  spiritualSheetTitleIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderRadius: 14,
    backgroundColor: '#F0E8FC',
  },

  spiritualHeaderEmoji: {
    fontSize: 23,
  },

  spiritualSheetContent: {
    paddingTop: 2,
  },

  activationLabel: {
    marginBottom: 9,
    color: PURPLE_DARK,
    fontSize: 13,
    fontWeight: '800',
  },

  activationChoices: {
    gap: 9,
  },

  activationChoice: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.16)',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  activationChoiceActive: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.17,
    shadowRadius: 7,
    elevation: 2,
  },

  activationRadio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: '#AE9BCF',
    borderRadius: 11,
  },

  activationRadioActive: {
    borderColor: '#E7DAFF',
  },

  activationRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },

  activationCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  activationTitle: {
    color: '#2A2050',
    fontSize: 14,
    fontWeight: '700',
  },

  activationTitleActive: {
    color: '#FFFFFF',
  },

  activationDescription: {
    marginTop: 2,
    color: '#817697',
    fontSize: 10.5,
    lineHeight: 15,
  },

  activationDescriptionActive: {
    color: '#EFE9FF',
  },

  activationCheck: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },

  featuresTitle: {
    flex: 1,
    color: PURPLE_DARK,
    fontSize: 13,
    fontWeight: '800',
  },

  featuresStatus: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  featuresStatusActive: {
    backgroundColor: '#E3F3E7',
  },

  featuresStatusDisabled: {
    backgroundColor: '#E5E1E9',
  },

  featuresStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  featuresStatusTextActive: {
    color: '#3F8C57',
  },

  featuresStatusTextDisabled: {
    color: '#85808C',
  },

  spiritualFeatures: {
    gap: 8,
  },

  spiritualFeatureCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.14)',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 9,
  },

  spiritualFeatureCardDisabled: {
    borderColor: 'rgba(155,142,179,0.18)',
    backgroundColor: '#ECE9EF',
  },

  spiritualFeatureIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: '#F0E8FC',
  },

  spiritualFeatureIconDisabled: {
    backgroundColor: '#DCD7E1',
  },

  spiritualFeatureEmoji: {
    fontSize: 22,
  },

  spiritualFeatureCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  spiritualFeatureTitle: {
    color: '#302653',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  spiritualFeatureTitleDisabled: {
    color: '#97909F',
  },

  spiritualFeatureDescription: {
    marginTop: 2,
    color: '#817697',
    fontSize: 10.5,
    lineHeight: 15,
  },

  spiritualFeatureDescriptionDisabled: {
    color: '#AAA4AF',
  },

  featureStateIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 12,
  },

  featureStateIconActive: {
    backgroundColor: PURPLE,
  },

  featureStateIconDisabled: {
    backgroundColor: '#D8D3DC',
  },

  spiritualInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 13,
    borderRadius: 14,
    backgroundColor: '#F2ECFB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  spiritualInfoText: {
    flex: 1,
    color: '#665B82',
    fontSize: 10.5,
    lineHeight: 15,
  },

  doneButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: PURPLE,
  },

  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  optionPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },
});

export default ProfileScreen;