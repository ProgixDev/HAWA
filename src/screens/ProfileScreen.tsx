import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Image,
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

import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { MainTabScreenProps } from '../navigation/MainTabNavigator';
import { getTopPadding } from '../theme/spacing';
import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';

import {
  getCycleObservationStartedAt,
  getCyclePreferences,
  getPeriodHistory,
  hydrateCyclePreferences,
  subscribeCyclePreferences,
  getFirstName,
  getSelectedObjective,
  getSpiritualMarkersEnabled,
  hydrateActiveObjective,
  setSelectedObjective,
  subscribeActiveObjective,
  setSpiritualMarkersEnabled,
  subscribeHijriAdjustmentDays,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  subscribePostpartumPreferences,
  type PostpartumDeliveryType,
  type PostpartumFeedingType,
} from '../state/postpartumPreferences';
import {
  getMiscarriagePreferences,
  hydrateMiscarriagePreferences,
  subscribeMiscarriagePreferences,
  type MiscarriageBleedingStatus,
  type MiscarriageCycleReturnStatus,
  type MiscarriageTryingAgainStatus,
} from '../state/miscarriagePreferences';
import {
  getContraceptionPreferences,
  hydrateContraceptionPreferences,
  subscribeContraceptionPreferences,
} from '../state/contraceptionPreferences';
import {
  CONTRACEPTION_METHOD_ICONS,
  CONTRACEPTION_METHOD_LABELS,
} from '../config/contraceptionLabels';
import {
  computeCyclePredictionStatus,
  formatDateRange as formatCanonicalDateRange,
  formatFullDate,
  formatHijriDate,
  IRREGULAR_WINDOW_MAX_DAYS,
  IRREGULAR_WINDOW_MIN_DAYS,
  startOfDay as canonicalStartOfDay,
} from '../utils/cycleMath';

import { lockIntimacy } from '../state/privateSectionAuthStore';
import {
  ensureAnonymousAccount,
  getAnonymousAccount,
  getPrivacySecuritySettings,
  isBiometricEnabled,
  isPinEnabled,
  loadSecurityPreferences,
  subscribePrivacySecuritySettings,
  subscribeSecurityPreferences,
  type AnonymousAccountInfo,
} from '../state/securityPreferences';
import {
  getCachedPersonalInformation,
  loadPersonalInformation,
  updatePersonalInformation,
} from '../state/personalInformationStore';
import {
  getProfileAvatarPreferences,
  hydrateProfileAvatarPreferences,
  subscribeProfileAvatarPreferences,
  type AnonymousAvatarStyleId,
} from '../state/profileAvatarPreferences';
import AnonymousAvatar from '../components/profile/AnonymousAvatar';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

const PURPLE = '#6949BE';
const PURPLE_DARK = '#28166F';


type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = MainTabScreenProps<'Profile'>;

/* ============================================================
 * OBJECTIFS
 * ============================================================ */

const OBJECTIVE_LABELS: Record<ObjectiveId, string> = {
  cycle: 'Suivre mon cycle',
  conceive: 'Essayer de concevoir',
  contraception: 'Contraception',
  irregular: 'Cycles irréguliers (SOPK)',
  menopause: 'Périménopause / Ménopause',
  pregnancy: 'Suivi de grossesse',
  postpartum: 'Suivi post-partum',
  loss: 'Après une fausse couche',
};

const DELIVERY_TYPE_LABELS: Record<PostpartumDeliveryType, string> = {
  vaginal: 'Accouchement vaginal',
  planned_csection: 'Césarienne programmée',
  emergency_csection: 'Césarienne en urgence',
  prefer_not_to_say: 'Je préfère ne pas préciser',
};

const FEEDING_TYPE_LABELS: Record<PostpartumFeedingType, string> = {
  exclusive_breastfeeding: 'Allaitement maternel exclusif',
  mixed: 'Allaitement mixte (sein + biberon)',
  exclusive_bottle: 'Biberon exclusivement',
  unknown: 'Je ne sais pas encore',
};

// Same wording as MiscarriageBleedingScreen/MiscarriageCycleReturnScreen/
// MiscarriageTryingAgainScreen.
const BLEEDING_STATUS_LABELS: Record<MiscarriageBleedingStatus, string> = {
  yes: 'Oui',
  no: 'Non',
  variable: 'Variable',
};

const MISCARRIAGE_CYCLE_RETURN_LABELS: Record<
  MiscarriageCycleReturnStatus,
  string
> = {
  no: 'Pas encore',
  yes: 'Oui',
  unknown: 'Je ne sais pas',
};

const MISCARRIAGE_TRYING_AGAIN_LABELS: Record<
  MiscarriageTryingAgainStatus,
  string
> = {
  not_now: 'Pas maintenant',
  soon: 'Bientôt',
  ready: 'Oui, je me sens prête',
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
    label: 'Périménopause / Ménopause',
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

/* ============================================================
 * HELPERS
 * ============================================================ */

const formatShortDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(date);

/* ============================================================
 * STAT CARD
 * ============================================================ */

type StatCardProps = {
  icon: IconName;
  label: string;
  value: string;
};

function StatCard({ icon, label, value }: StatCardProps): React.JSX.Element {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={18} />
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PremiumProfileCard({onPress}: {onPress: () => void}): React.JSX.Element {
  const entrance = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const shine = useRef(new Animated.Value(-1)).current;
  const float = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const arrow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      damping: 16,
      stiffness: 120,
      mass: 0.9,
      useNativeDriver: true,
    }).start();

    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(shine, {
          toValue: 1,
          duration: 1050,
          useNativeDriver: true,
        }),
        Animated.timing(shine, {
          toValue: -1,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(2400),
      ]),
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );

    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.delay(1300),
      ]),
    );

    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(arrow, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(arrow, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.delay(1700),
      ]),
    );

    shineLoop.start();
    floatLoop.start();
    sparkleLoop.start();
    arrowLoop.start();

    return () => {
      shineLoop.stop();
      floatLoop.stop();
      sparkleLoop.stop();
      arrowLoop.stop();
    };
  }, [arrow, entrance, float, shine, sparkle]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.988,
      damping: 18,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 16,
      stiffness: 240,
      useNativeDriver: true,
    }).start();
  };

  const entranceTranslateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const glowOpacity = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0.14, 0.3],
  });

  const crownTranslateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.1],
  });

  const arrowTranslateX = arrow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          {translateY: entranceTranslateY},
          {scale: Animated.multiply(pressScale, entrance)},
        ],
      }}>
      <Pressable
        accessibilityHint="Ouvre la présentation des avantages Premium"
        accessibilityLabel="Découvrir AWA Premium"
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.premiumCard}>
        <Animated.View
          pointerEvents="none"
          style={[styles.premiumGlow, {opacity: glowOpacity}]}
        />
        <View pointerEvents="none" style={styles.premiumAmbientOrbOne} />
        <View pointerEvents="none" style={styles.premiumAmbientOrbTwo} />

        <Animated.View
          pointerEvents="none"
          style={[
            styles.premiumShine,
            {
              transform: [
                {
                  translateX: shine.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-240, 330],
                  }),
                },
                {rotate: '18deg'},
              ],
            },
          ]}
        />

        <View style={styles.premiumHeaderRow}>
          <Animated.View
            style={[
              styles.premiumCrownWrap,
              {transform: [{translateY: crownTranslateY}]},
            ]}>
            <MaterialDesignIcons color="#FFD85F" name="crown" size={25} />
          </Animated.View>

          <View style={styles.premiumCopy}>
            <Text style={styles.premiumTitle}>AWA Premium</Text>
            <Text style={styles.premiumSubtitle}>
              Débloque des outils avancés pour aller plus loin dans ton suivi.
            </Text>
          </View>

          <Animated.View
            style={[
              styles.premiumStarWrap,
              {
                opacity: sparkle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.55, 1],
                }),
                transform: [{scale: sparkleScale}],
              },
            ]}>
            <MaterialDesignIcons
              color="#FFFFFF"
              name="star-four-points"
              size={18}
            />
          </Animated.View>
        </View>

        <View style={styles.premiumFeaturesGrid}>
          {[
            'Statistiques avancées',
            'Export PDF & CSV',
            'Historique illimité',
            'contenus éducatifs approfondis',
            'thèmes visuels supplémentaires'
          ].map(item => (
            <View key={item} style={styles.premiumFeature}>
              <View style={styles.premiumCheckCircle}>
                <MaterialDesignIcons color="#FFFFFF" name="check" size={12} />
              </View>
              <Text style={styles.premiumFeatureText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.premiumButton}>
  <View style={styles.premiumButtonContent}>
    <MaterialDesignIcons
      color="#D5A928"
      name="crown"
      size={20}
    />

    <Text style={styles.premiumButtonText}>
      Découvrir Premium
    </Text>
  </View>

  <Animated.View
    style={[
      styles.premiumButtonArrow,
      {transform: [{translateX: arrowTranslateX}]},
    ]}>
    <MaterialDesignIcons
      color="#4F2A96"
      name="chevron-right"
      size={22}
    />
  </Animated.View>
</View>

      </Pressable>
    </Animated.View>
  );
}


/* ============================================================
 * MENU ROW
 * ============================================================ */

type MenuTone =
  | 'default'
  | 'personal'
  | 'anonymous'
  | 'objective'
  | 'health'
  | 'security'
  | 'backup'
  | 'about'
  | 'support';

type MenuRowProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress?: () => void;
  tone?: MenuTone;
};

const MENU_TONES: Record<
  MenuTone,
  {iconBackground: string; iconColor: string; accent: string}
> = {
  default: {
    iconBackground: '#F1EBF9',
    iconColor: PURPLE,
    accent: '#8B6CC7',
  },
  personal: {
    iconBackground: '#EEE8FB',
    iconColor: '#6848C6',
    accent: '#8060C6',
  },
  anonymous: {
    iconBackground: '#F2ECFA',
    iconColor: '#7354AF',
    accent: '#8A70BD',
  },
  objective: {
    iconBackground: '#F8EDF4',
    iconColor: '#A85C80',
    accent: '#C2799A',
  },
  health: {
    iconBackground: '#ECF4F1',
    iconColor: '#4F8177',
    accent: '#69A094',
  },
  security: {
    iconBackground: '#EDF1F7',
    iconColor: '#566B8E',
    accent: '#7185A6',
  },
  backup: {
    iconBackground: '#EEF3FA',
    iconColor: '#5B79A9',
    accent: '#7793BD',
  },
  about: {
    iconBackground: '#F3EFF8',
    iconColor: '#755B9A',
    accent: '#927BB2',
  },
  support: {
    iconBackground: '#EDF5F4',
    iconColor: '#4D817A',
    accent: '#6C9E97',
  },
};

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'default',
}: MenuRowProps): React.JSX.Element {
  const palette = MENU_TONES[tone];

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.menuRow,
        pressed && styles.menuRowPressed,
      ]}>
      <View
        pointerEvents="none"
        style={[styles.menuAccent, {backgroundColor: palette.accent}]}
      />

      <View
        style={[
          styles.menuIcon,
          {backgroundColor: palette.iconBackground},
        ]}>
        <MaterialDesignIcons color={palette.iconColor} name={icon} size={20} />
      </View>

      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.menuChevron}>
        <MaterialDesignIcons color="#9C91AE" name="chevron-right" size={19} />
      </View>
    </Pressable>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderTopRow}>
        <View style={styles.sectionHeaderIcon}>
          <MaterialDesignIcons color={PURPLE} name={icon} size={18} />
        </View>

        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

/* ============================================================
 * PROFILE SCREEN
 * ============================================================ */

function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const [premiumVisible, setPremiumVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const compact = width < 360;

  const firstName = getFirstName();

  /* ========================================================
   * OBJECTIF
   * ======================================================== */

  const [objective, setObjective] = useState<ObjectiveId>(
    getSelectedObjective(),
  );

  useEffect(() => {
    let active = true;
    hydrateActiveObjective().then(value => {
      if (active) {
        setObjective(value);
      }
    });
    const unsubscribe = subscribeActiveObjective(() => {
      if (active) {
        setObjective(getSelectedObjective());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const [objectiveModalVisible, setObjectiveModalVisible] = useState(false);

  /* ========================================================
   * REPÈRES
   * ======================================================== */

  const [spiritualEnabled, setSpiritualEnabled] = useState(
    getSpiritualMarkersEnabled(),
  );

  const [spiritualModalVisible, setSpiritualModalVisible] = useState(false);

  const [cycle, setCycle] = useState(getCyclePreferences);

  useEffect(() => {
    let active = true;
    hydrateCyclePreferences().then(value => {
      if (active) {
        setCycle(value);
      }
    });
    const unsubscribe = subscribeCyclePreferences(() => {
      if (active) {
        setCycle(getCyclePreferences());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const [postpartum, setPostpartum] = useState(getPostpartumPreferences);

  useEffect(() => {
    let active = true;
    hydratePostpartumPreferences().then(value => {
      if (active) {
        setPostpartum(value);
      }
    });
    const unsubscribe = subscribePostpartumPreferences(() => {
      if (active) {
        setPostpartum(getPostpartumPreferences());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const [miscarriage, setMiscarriage] = useState(getMiscarriagePreferences);

  useEffect(() => {
    let active = true;
    hydrateMiscarriagePreferences().then(value => {
      if (active) {
        setMiscarriage(value);
      }
    });
    const unsubscribe = subscribeMiscarriagePreferences(() => {
      if (active) {
        setMiscarriage(getMiscarriagePreferences());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Same canonical store the Contraception Dashboard/Calendar/Statistics
  // already read/write — no Profile-specific method/reminder/start-date
  // state. Hydrate + subscribe so a method/reminder change made from the
  // Contraception screens (or a method switch) reflects here immediately.
  const [contraception, setContraception] = useState(getContraceptionPreferences);

  useEffect(() => {
    let active = true;
    hydrateContraceptionPreferences().then(value => {
      if (active) {
        setContraception(value);
      }
    });
    const unsubscribe = subscribeContraceptionPreferences(() => {
      if (active) {
        setContraception(getContraceptionPreferences());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  /* ========================================================
   * ANONYMOUS MODE
   *
   * Single source of truth: state/securityPreferences.ts (same store
   * AnonymousModeScreen/PrivacySecurityScreen already read/write). No
   * separate anonymous-profile state is kept — ProfileScreen only mirrors
   * it locally so the JSX below can branch on it.
   * ======================================================== */

  const [anonymousMode, setAnonymousMode] = useState(
    () => getPrivacySecuritySettings().anonymousMode,
  );
  const [securityLocked, setSecurityLocked] = useState(
    () => isPinEnabled() || isBiometricEnabled(),
  );
  const [anonymousAccount, setAnonymousAccount] =
    useState<AnonymousAccountInfo | null>(getAnonymousAccount);
  const [accountInfoModalVisible, setAccountInfoModalVisible] =
    useState(false);

  const refreshSecurity = useCallback(() => {
    setAnonymousMode(getPrivacySecuritySettings().anonymousMode);
    setSecurityLocked(isPinEnabled() || isBiometricEnabled());
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadSecurityPreferences().then(() => {
        if (active) {
          refreshSecurity();
        }
      });
      const unsubscribeSettings =
        subscribePrivacySecuritySettings(refreshSecurity);
      const unsubscribeSecurity =
        subscribeSecurityPreferences(refreshSecurity);
      return () => {
        active = false;
        unsubscribeSettings();
        unsubscribeSecurity();
      };
    }, [refreshSecurity]),
  );

  // The identifier is generated once by AnonymousModeCreatingScreen when
  // the mode is first activated; this only hydrates the already-persisted
  // value (e.g. after an app restart, when the in-memory cache is empty).
  useEffect(() => {
    let active = true;
    if (anonymousMode && !anonymousAccount) {
      ensureAnonymousAccount().then(value => {
        if (active) {
          setAnonymousAccount(value);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [anonymousMode, anonymousAccount]);

  /* ========================================================
   * PROFILE PHOTO (normal mode) / ANONYMOUS AVATAR (anonymous mode)
   *
   * Normal mode reuses the SAME store PersonalInformationScreen already
   * writes to (state/personalInformationStore.ts's avatarUri) — no second
   * copy of the photo. Anonymous mode reads its own tiny, independent
   * style/color preference (state/profileAvatarPreferences.ts) — the two
   * never mix, satisfying the "never show the real photo while anonymous"
   * rule structurally rather than by an extra runtime check.
   * ======================================================== */

  const [photoUri, setPhotoUri] = useState<string | null>(
    () => getCachedPersonalInformation().avatarUri ?? null,
  );
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadPersonalInformation().then(value => {
        if (active) {
          setPhotoUri(value.avatarUri ?? null);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const [anonymousAvatarStyle, setAnonymousAvatarStyle] =
    useState<AnonymousAvatarStyleId>(
      () => getProfileAvatarPreferences().anonymousAvatarStyle,
    );
  const [anonymousAvatarColor, setAnonymousAvatarColor] = useState<string>(
    () => getProfileAvatarPreferences().anonymousAvatarColor,
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const refreshAvatar = () => {
        const value = getProfileAvatarPreferences();
        if (active) {
          setAnonymousAvatarStyle(value.anonymousAvatarStyle);
          setAnonymousAvatarColor(value.anonymousAvatarColor);
        }
      };
      hydrateProfileAvatarPreferences().then(refreshAvatar);
      const unsubscribe = subscribeProfileAvatarPreferences(refreshAvatar);
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  const choosePhoto = async (useCamera: boolean) => {
    try {
      const result = useCamera
        ? await launchCamera({mediaType: 'photo', quality: 0.8})
        : await launchImageLibrary({mediaType: 'photo', quality: 0.8, selectionLimit: 1});
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        Alert.alert('Photo de profil', 'Impossible d’accéder à la caméra ou à la galerie pour le moment.');
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        const updated = await updatePersonalInformation({avatarUri: uri});
        setPhotoUri(updated.avatarUri ?? null);
      }
    } catch {
      Alert.alert('Photo de profil', 'Une erreur est survenue. Réessaie.');
    } finally {
      setPhotoSheetVisible(false);
    }
  };

  const removePhoto = async () => {
    const updated = await updatePersonalInformation({avatarUri: undefined});
    setPhotoUri(updated.avatarUri ?? null);
    setPhotoSheetVisible(false);
  };

  const firstNameInitial = firstName.trim().charAt(0).toUpperCase() || '?';

  // Regularity-aware — same computeCyclePredictionStatus() Dashboard/Calendar
  // use, so an irregular/observing user never sees a falsely-exact date here
  // while seeing a window everywhere else.
  const nextPeriodStatus = useMemo(
    () =>
      computeCyclePredictionStatus(
        cycle,
        cycle.regularity,
        getPeriodHistory().map(
          record => new Date(`${record.startDate}T12:00:00`),
        ),
        getCycleObservationStartedAt(),
        canonicalStartOfDay(new Date()),
      ),
    [cycle],
  );

  const nextPeriodValue = (() => {
    if (nextPeriodStatus.mode === 'exact') {
      return formatShortDate(nextPeriodStatus.date);
    }
    if (nextPeriodStatus.mode === 'window') {
      return nextPeriodStatus.isLate
        ? 'Règles en retard'
        : formatCanonicalDateRange(
            nextPeriodStatus.windowStart,
            nextPeriodStatus.windowEnd,
          );
    }
    return `Mois ${nextPeriodStatus.monthsElapsed} sur ${nextPeriodStatus.totalMonths}`;
  })();

  // Same rule as Dashboard/Calendar: don't present a single precise average
  // once the pattern is irregular/variable — see computeCyclePredictionStatus.
  const averageCycleTile = (() => {
    if (nextPeriodStatus.mode === 'exact') {
      return {
        label: 'Cycle moyen',
        value: `${nextPeriodStatus.averageCycleLength} jours`,
      };
    }
    if (nextPeriodStatus.mode === 'window') {
      return {
        label: 'Cycle variable',
        value: `${IRREGULAR_WINDOW_MIN_DAYS}–${IRREGULAR_WINDOW_MAX_DAYS} jours`,
      };
    }
    return { label: 'Cycle moyen', value: `${cycle.cycleDuration} jours` };
  })();

  const [hijriToday, setHijriToday] = useState(() => formatHijriDate(new Date()));
  useFocusEffect(
    useCallback(() => {
      setHijriToday(formatHijriDate(new Date()));
      const unsubscribe = subscribeHijriAdjustmentDays(() => setHijriToday(formatHijriDate(new Date())));
      return unsubscribe;
    }, []),
  );

  /* ========================================================
   * CHANGER OBJECTIF
   * ======================================================== */

  const changeObjective = async (nextObjective: ObjectiveId) => {
    await setSelectedObjective(nextObjective);

    setObjective(nextObjective);

    setObjectiveModalVisible(false);
  };

  /* ========================================================
   * CHANGER REPÈRES
   * ======================================================== */

  const changeSpiritualMarkers = (enabled: boolean) => {
    setSpiritualMarkersEnabled(enabled);

    setSpiritualEnabled(enabled);
  };

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
              .getParent<NativeStackNavigationProp<RootStackParamList>>()
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
    <LinearGradient
  colors={[
    '#FAF8FD',
    '#F4EFFA',
    '#EEE7F7',
    '#E9E1F3',
  ]}
  locations={[0, 0.32, 0.7, 1]}
  start={{x: 0, y: 0}}
  end={{x: 1, y: 1}}
  style={styles.page}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

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
              paddingTop: getTopPadding(insets.top, compact),

              paddingBottom: Math.max(insets.bottom, 16) + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Profil</Text>

              <Text style={styles.headerSubtitle}>
                Gère tes informations et préférences
              </Text>
            </View>
          </View>

          {/* =================================================
              IDENTITY CARD — sober, minimal: avatar + name only.
              Objective/spiritual/location status live in their own
              dedicated sections further down, not duplicated here.
          ================================================= */}

          <LinearGradient
            colors={['#FFFFFF', '#F8F4FC', '#F1EAF9']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.identityCard}>
            <View pointerEvents="none" style={styles.identityGlow} />
            <View pointerEvents="none" style={styles.identityDecorTopRight} />

            <View style={styles.identityTopRow}>
              <View style={styles.avatarOuterRing}>
                <View style={styles.avatarWrap}>
                  {anonymousMode ? (
                    <AnonymousAvatar
                      color={anonymousAvatarColor}
                      size={64}
                      style={anonymousAvatarStyle}
                    />
                  ) : photoUri ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      resizeMode="cover"
                      source={{uri: photoUri}}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>
                        {firstNameInitial}
                      </Text>
                    </View>
                  )}

                  <Pressable
                    accessibilityLabel={
                      anonymousMode
                        ? 'Personnaliser mon avatar anonyme'
                        : 'Changer la photo de profil'
                    }
                    hitSlop={8}
                    onPress={() =>
                      anonymousMode
                        ? navigation.navigate('AnonymousAvatarCustomizer')
                        : setPhotoSheetVisible(true)
                    }
                    style={({pressed}) => [
                      styles.avatarBadge,
                      pressed && styles.pressed,
                    ]}>
                    <MaterialDesignIcons
                      color="#FFFFFF"
                      name={anonymousMode ? 'pencil-outline' : 'camera-outline'}
                      size={12}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.identity}>
                <View style={styles.identityEyebrowRow}>
                  <MaterialDesignIcons
                    color="#826CB0"
                    name={anonymousMode ? 'incognito' : 'account-outline'}
                    size={13}
                  />
                  <Text style={styles.identityEyebrow}>
                    {anonymousMode ? 'MODE PRIVÉ' : 'MON PROFIL'}
                  </Text>
                </View>

                {anonymousMode ? (
                  <>
                    <View style={styles.identityMainLine}>
                      <Text style={styles.identityTitle}>Mode Anonyme</Text>
                      <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeBadgeText}>Actif</Text>
                      </View>
                    </View>
                    <Text style={styles.identitySubtitle}>
                      Ton identité réelle reste masquée
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{firstName || 'Non renseigné'}</Text>

                      <Pressable
                        accessibilityLabel="Modifier le profil"
                        hitSlop={10}
                        onPress={() => navigation.navigate('PersonalInformation')}
                        style={({pressed}) => [
                          styles.identityEditButton,
                          pressed && styles.pressed,
                        ]}>
                        <MaterialDesignIcons
                          color="#6848C6"
                          name="pencil-outline"
                          size={14}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.identitySubtitle}>
                      Informations et préférences du profil
                    </Text>
                  </>
                )}

                <View style={styles.identityPrivacyPill}>
                  <MaterialDesignIcons
                    color="#6E57A6"
                    name="shield-check-outline"
                    size={13}
                  />
                  <Text style={styles.identityPrivacyText}>Données protégées</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* STATS */}

          {objective !== 'pregnancy' &&
          objective !== 'postpartum' &&
          objective !== 'loss' &&
          objective !== 'contraception' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="calendar-range"
                label={averageCycleTile.label}
                value={averageCycleTile.value}
              />

              <StatCard
                icon="water-outline"
                label="Durée règles"
                value={`${cycle.periodDuration} jours`}
              />

              <StatCard
                icon="calendar-month-outline"
                label="Prochaines règles"
                value={nextPeriodValue}
              />

              <StatCard
                icon="weather-night"
                label="Date hijri"
                value={spiritualEnabled ? hijriToday ?? '—' : 'Désactivé'}
              />
            </View>
          ) : null}

          {/* Contraception's OWN summary — never Cycle-specific stats
              (cycle moyen/durée des règles/prochaines règles belong to the
              Cycle objective only, and must not leak here). Sourced
              directly from the same canonical contraceptionPreferences
              store the Contraception Dashboard/Calendar/Statistics already
              read/write, and the same CONTRACEPTION_METHOD_LABELS/ICONS —
              never a hardcoded method or a Profile-specific copy. */}
          {objective === 'contraception' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon={contraception.method ? CONTRACEPTION_METHOD_ICONS[contraception.method] : 'pill'}
                label="Méthode actuelle"
                value={
                  contraception.method
                    ? CONTRACEPTION_METHOD_LABELS[contraception.method]
                    : 'Non renseignée'
                }
              />

              <StatCard
                icon="calendar-check-outline"
                label="Début du suivi"
                value={
                  contraception.methodStartDate
                    ? formatFullDate(
                        new Date(`${contraception.methodStartDate}T12:00:00`),
                      )
                    : 'Non renseigné'
                }
              />

              <StatCard
                icon={contraception.remindersEnabled ? 'bell-check-outline' : 'bell-off-outline'}
                label="Rappels"
                value={contraception.remindersEnabled ? 'Activés' : 'Désactivés'}
              />

              <StatCard
                icon="weather-night"
                label="Date hijri"
                value={spiritualEnabled ? hijriToday ?? '—' : 'Désactivé'}
              />
            </View>
          ) : null}

          {/* Postpartum's OWN summary — never Cycle-specific stats (last
              period/cycle duration/regularity belong to the Cycle
              objective only). Sourced directly from the same canonical
              postpartumPreferences store the onboarding flow wrote to. */}
          {objective === 'postpartum' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="calendar-month-outline"
                label="Accouchement"
                value={
                  postpartum.deliveryDate
                    ? formatFullDate(
                        new Date(`${postpartum.deliveryDate}T12:00:00`),
                      )
                    : 'Non renseigné'
                }
              />

              <StatCard
                icon="baby-face-outline"
                label="Type d’accouchement"
                value={
                  postpartum.deliveryType
                    ? DELIVERY_TYPE_LABELS[postpartum.deliveryType]
                    : 'Non renseigné'
                }
              />

              <StatCard
                icon="baby-bottle-outline"
                label="Allaitement"
                value={
                  postpartum.feedingType
                    ? FEEDING_TYPE_LABELS[postpartum.feedingType]
                    : 'Non renseigné'
                }
              />
            </View>
          ) : null}

          {/* Miscarriage's OWN summary — never Cycle-specific stats (cycle
              moyen/durée des règles/prochaines règles/ovulation/fenêtre
              fertile belong to the Cycle objective only). Sourced directly
              from the same canonical miscarriagePreferences store the
              onboarding flow/Dashboard/Calendar/Statistics already read. */}
          {objective === 'loss' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="calendar-heart"
                label="Date de l’événement"
                value={
                  miscarriage.miscarriageDate
                    ? formatFullDate(
                        new Date(`${miscarriage.miscarriageDate}T12:00:00`),
                      )
                    : 'Non renseignée'
                }
              />

              <StatCard
                icon="water-outline"
                label="Saignements actuels"
                value={
                  miscarriage.bleedingStatus
                    ? BLEEDING_STATUS_LABELS[miscarriage.bleedingStatus]
                    : 'Non renseigné'
                }
              />

              <StatCard
                icon="sync-circle"
                label="Retour du cycle"
                value={
                  miscarriage.cycleReturnStatus
                    ? MISCARRIAGE_CYCLE_RETURN_LABELS[
                        miscarriage.cycleReturnStatus
                      ]
                    : 'Non renseigné'
                }
              />

              {miscarriage.cycleReturnStatus === 'yes' &&
              miscarriage.firstReturnedPeriodDate ? (
                <StatCard
                  icon="calendar-check-outline"
                  label="Date du retour des règles"
                  value={formatFullDate(
                    new Date(`${miscarriage.firstReturnedPeriodDate}T12:00:00`),
                  )}
                />
              ) : null}

              <StatCard
                icon="heart-outline"
                label="Reprise des essais"
                value={
                  miscarriage.tryingAgainStatus
                    ? MISCARRIAGE_TRYING_AGAIN_LABELS[
                        miscarriage.tryingAgainStatus
                      ]
                    : 'Non renseigné'
                }
              />
            </View>
          ) : null}

          <PremiumProfileCard onPress={() => setPremiumVisible(true)} />

          {/* MES INFORMATIONS */}

          <SectionHeader
            icon="account-cog-outline"
            title="Mes informations"
            subtitle="Toutes tes informations importantes, organisées simplement."
          />

          <View style={styles.menuCard}>
            <MenuRow
              icon="account-outline"
              onPress={() =>
                anonymousMode
                  ? setAccountInfoModalVisible(true)
                  : navigation.navigate('PersonalInformation')
              }
              subtitle={anonymousMode ? 'Compte protégé et anonyme' : 'Nom, email, date de naissance…'}
              title={anonymousMode ? 'Informations du compte' : 'Informations personnelles'}
              tone="personal"
            />

            {anonymousMode ? (
              <MenuRow
                icon="incognito"
                onPress={() => navigation.navigate('AnonymousMode')}
                subtitle="Gérer ton identité privée et tes options anonymes"
                title="Mode Anonyme"
                tone="anonymous"
              />
            ) : null}

            <MenuRow
              icon="target"
              onPress={() => setObjectiveModalVisible(true)}
              subtitle={OBJECTIVE_LABELS[objective]}
              title="Mon objectif"
              tone="objective"
            />

            <MenuRow
              icon="heart-pulse"
              onPress={() => navigation.navigate('GeneralHealth')}
              subtitle="Poids, taille, groupe sanguin, maladies…"
              title="Santé générale"
              tone="health"
            />

            {objective === 'pregnancy' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('PregnancyNotifications')}
                subtitle="Grossesse, rendez-vous, examens et rappels personnalisés"
                title="Notifications & rappels"
                tone="default"
              />
            ) : null}

            {objective === 'contraception' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('ContraceptionReminders', {mode: 'edit'})}
                subtitle="Rappels liés à ta méthode de contraception"
                title="Notifications & rappels"
                tone="default"
              />
            ) : null}

            {objective === 'cycle' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('CycleReminders', {mode: 'edit'})}
                subtitle="Règles, journal quotidien, ovulation et fenêtre fertile"
                title="Notifications & rappels"
                tone="default"
              />
            ) : null}

            {objective === 'conceive' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('ConceptionReminders', {mode: 'edit'})}
                subtitle="Gérer mes rappels de conception"
                title="Notifications & rappels"
                tone="default"
              />
            ) : null}

            {objective === 'menopause' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('MenopauseReminders', {mode: 'edit'})}
                subtitle="Suivi quotidien et rappel de traitement"
                title="Notifications & rappels"
                tone="default"
              />
            ) : null}

            {objective === 'postpartum' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('PostpartumReminders', {mode: 'edit'})}
                subtitle="Gérer mon rappel de suivi quotidien"
                title="Notifications & rappels"
                tone="default"
              />
            ) : null}

            <MenuRow
              icon="shield-lock-outline"
              onPress={() => navigation.navigate('PrivacySecurity')}
              subtitle="Code, biométrie, mode discret et protection des données"
              title="Confidentialité & Sécurité"
              tone="security"
            />

            <MenuRow
              icon="cloud-outline"
              onPress={() => navigation.navigate('BackupData')}
              subtitle="Sauvegarde cloud et restauration de tes données"
              title="Sauvegarde"
              tone="backup"
            />
          </View>

          {/* Only shown while anonymous AND genuinely unprotected — once
              PIN/biométrie is on, this card disappears rather than nag. */}
          {anonymousMode && !securityLocked ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('PrivacySecurity')}
              style={({ pressed }) => [
                styles.securityRecommendationCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.securityRecommendationIcon}>
                <MaterialDesignIcons
                  color="#A16C55"
                  name="shield-alert-outline"
                  size={20}
                />
              </View>

              <View style={styles.securityRecommendationCopy}>
                <Text style={styles.securityRecommendationTitle}>
                  Verrouillage recommandé
                </Text>
                <Text style={styles.securityRecommendationText}>
                  Protège ton accès avec un PIN ou la biométrie.
                </Text>
              </View>

              <View style={styles.securityRecommendationCta}>
                <Text style={styles.securityRecommendationCtaText}>Configurer</Text>
              </View>
            </Pressable>
          ) : null}

          {/* =================================================
              REPÈRES SPIRITUELS
          ================================================= */}

          <View
            style={[
              styles.spiritualCard,

              !spiritualEnabled && styles.spiritualCardDisabled,
            ]}
          >
            <View style={styles.spiritualHeader}>
              <View
                style={[
                  styles.spiritualIconCircle,

                  !spiritualEnabled && styles.spiritualIconCircleDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.moonEmoji,

                    !spiritualEnabled && styles.emojiDisabled,
                  ]}
                >
                  🌙
                </Text>
              </View>

              <View style={styles.spiritualCopy}>
                <View style={styles.spiritualTitleRow}>
                  <Text
                    style={[
                      styles.spiritualTitle,

                      !spiritualEnabled && styles.spiritualTitleDisabled,
                    ]}
                  >
                    Repères spirituels
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,

                      spiritualEnabled
                        ? styles.statusBadgeActive
                        : styles.statusBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,

                        spiritualEnabled
                          ? styles.statusBadgeTextActive
                          : styles.statusBadgeTextInactive,
                      ]}
                    >
                      {spiritualEnabled ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.spiritualText,

                    !spiritualEnabled && styles.spiritualTextDisabled,
                  ]}
                >
                  Calendrier hijri, prières, pureté, jeûne et rappels.
                </Text>
              </View>
            </View>

            <View style={styles.spiritualMiniFeatures}>
              {SPIRITUAL_FEATURES.map(feature => (
                <View
                  key={feature.label}
                  style={[
                    styles.spiritualMiniFeature,

                    !spiritualEnabled && styles.spiritualMiniFeatureDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.spiritualMiniEmoji,

                      !spiritualEnabled && styles.emojiDisabled,
                    ]}
                  >
                    {feature.icon}
                  </Text>

                  <Text
                    style={[
                      styles.spiritualMiniText,

                      !spiritualEnabled && styles.spiritualMiniTextDisabled,
                    ]}
                  >
                    {feature.label}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setSpiritualModalVisible(true)}
              style={({ pressed }) => [
                styles.manageButton,

                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.manageButtonText}>Gérer les repères</Text>

              <MaterialDesignIcons
                color="#FFFFFF"
                name="tune-variant"
                size={17}
              />
            </Pressable>
          </View>

          {/* PLUS */}

          <SectionHeader
            icon="dots-horizontal-circle-outline"
            title="Plus"
            subtitle="Aide, informations sur AWA et gestion de ta session."
          />

          <View style={[styles.menuCard, styles.moreMenuCard]}>
            <MenuRow
              icon="information-outline"
              onPress={() => navigation.navigate('About')}
              subtitle="Version, mentions, confidentialité et valeurs de l’application"
              title="À propos de AWA"
              tone="about"
            />

            <MenuRow
              icon="lifebuoy"
              onPress={() => navigation.navigate('HelpSupport')}
              subtitle="Questions fréquentes, signalement et contact"
              title="Aide & support"
              tone="support"
            />
          </View>

          {anonymousMode ? (
            <Pressable
              accessibilityLabel="Quitter le mode anonyme"
              accessibilityRole="button"
              onPress={() => navigation.navigate('AnonymousMode')}
              style={({pressed}) => [
                styles.simpleAccountButton,
                styles.anonymousExit,
                pressed && styles.simpleAccountButtonPressed,
              ]}>
              <MaterialDesignIcons
                color="#6849BE"
                name="incognito"
                size={18}
              />

              <Text style={styles.anonymousExitText}>
                Quitter le mode anonyme
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel="Se déconnecter"
              accessibilityRole="button"
              onPress={confirmSignOut}
              style={({pressed}) => [
                styles.simpleAccountButton,
                styles.signOut,
                pressed && styles.simpleAccountButtonPressed,
              ]}>
              <MaterialDesignIcons
                color="#B4485A"
                name="logout"
                size={18}
              />

              <Text style={styles.signOutText}>
                Se déconnecter
              </Text>
            </Pressable>
          )}
        </ScrollView>
        <HawaPremiumBottomSheet visible={premiumVisible} onClose={() => setPremiumVisible(false)} />

        {/* =====================================================
            OBJECTIVE MODAL
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() => setObjectiveModalVisible(false)}
          statusBarTranslucent
          transparent
          visible={objectiveModalVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setObjectiveModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.objectiveSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>Modifier mon objectif</Text>

                  <Text style={styles.sheetSubtitle}>
                    Choisis l’objectif qui correspond le mieux à ta situation.
                  </Text>
                </View>

                <Pressable
                  onPress={() => setObjectiveModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={PURPLE_DARK}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.objectiveList,

                  {
                    paddingBottom: Math.max(insets.bottom, 14) + 14,
                  },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {OBJECTIVES.map(item => {
                  const active = objective === item.id;

                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: active,
                      }}
                      onPress={() => changeObjective(item.id)}
                      style={({ pressed }) => [
                        styles.objectiveOption,

                        active && styles.objectiveOptionActive,

                        pressed && styles.optionPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.objectiveIcon,

                          {
                            backgroundColor: item.tint,
                          },
                        ]}
                      >
                        <Text style={styles.objectiveEmoji}>{item.icon}</Text>
                      </View>

                      <View style={styles.objectiveOptionCopy}>
                        <Text
                          style={[
                            styles.objectiveOptionTitle,

                            active && styles.objectiveOptionTitleActive,
                          ]}
                        >
                          {item.label}
                        </Text>

                        <Text style={styles.objectiveOptionSubtitle}>
                          {item.subtitle}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.objectiveRadio,

                          active && styles.objectiveRadioActive,
                        ]}
                      >
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
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* =====================================================
            SPIRITUAL MODAL
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() => setSpiritualModalVisible(false)}
          statusBarTranslucent
          transparent
          visible={spiritualModalVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setSpiritualModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.spiritualSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.spiritualSheetTitleIcon}>
                  <Text style={styles.spiritualHeaderEmoji}>🌙</Text>
                </View>

                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>Repères spirituels</Text>

                  <Text style={styles.sheetSubtitle}>
                    Active ou désactive les fonctionnalités spirituelles de AWA.
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSpiritualModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={PURPLE_DARK}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.spiritualSheetContent,

                  {
                    paddingBottom: Math.max(insets.bottom, 16) + 16,
                  },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.activationLabel}>État des repères</Text>

                <View style={styles.activationChoices}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: spiritualEnabled,
                    }}
                    onPress={() => changeSpiritualMarkers(true)}
                    style={({ pressed }) => [
                      styles.activationChoice,

                      spiritualEnabled && styles.activationChoiceActive,

                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.activationRadio,

                        spiritualEnabled && styles.activationRadioActive,
                      ]}
                    >
                      {spiritualEnabled ? (
                        <View style={styles.activationRadioDot} />
                      ) : null}
                    </View>

                    <View style={styles.activationCopy}>
                      <Text
                        style={[
                          styles.activationTitle,

                          spiritualEnabled && styles.activationTitleActive,
                        ]}
                      >
                        Oui, activer
                      </Text>

                      <Text
                        style={[
                          styles.activationDescription,

                          spiritualEnabled &&
                            styles.activationDescriptionActive,
                        ]}
                      >
                        Afficher les fonctionnalités spirituelles
                      </Text>
                    </View>

                    {spiritualEnabled ? (
                      <View style={styles.activationCheck}>
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
                      checked: !spiritualEnabled,
                    }}
                    onPress={() => changeSpiritualMarkers(false)}
                    style={({ pressed }) => [
                      styles.activationChoice,

                      !spiritualEnabled && styles.activationChoiceActive,

                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.activationRadio,

                        !spiritualEnabled && styles.activationRadioActive,
                      ]}
                    >
                      {!spiritualEnabled ? (
                        <View style={styles.activationRadioDot} />
                      ) : null}
                    </View>

                    <View style={styles.activationCopy}>
                      <Text
                        style={[
                          styles.activationTitle,

                          !spiritualEnabled && styles.activationTitleActive,
                        ]}
                      >
                        Non, désactiver
                      </Text>

                      <Text
                        style={[
                          styles.activationDescription,

                          !spiritualEnabled &&
                            styles.activationDescriptionActive,
                        ]}
                      >
                        Masquer les fonctionnalités spirituelles
                      </Text>
                    </View>

                    {!spiritualEnabled ? (
                      <View style={styles.activationCheck}>
                        <MaterialDesignIcons
                          color={PURPLE}
                          name="check"
                          size={17}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                </View>

                <View style={styles.featuresHeader}>
                  <Text style={styles.featuresTitle}>
                    Fonctionnalités concernées
                  </Text>

                  <View
                    style={[
                      styles.featuresStatus,

                      spiritualEnabled
                        ? styles.featuresStatusActive
                        : styles.featuresStatusDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.featuresStatusText,

                        spiritualEnabled
                          ? styles.featuresStatusTextActive
                          : styles.featuresStatusTextDisabled,
                      ]}
                    >
                      {spiritualEnabled ? 'Activées' : 'Désactivées'}
                    </Text>
                  </View>
                </View>

                <View style={styles.spiritualFeatures}>
                  {SPIRITUAL_FEATURES.map(feature => (
                    <View
                      key={feature.label}
                      style={[
                        styles.spiritualFeatureCard,

                        !spiritualEnabled &&
                          styles.spiritualFeatureCardDisabled,
                      ]}
                    >
                      <View
                        style={[
                          styles.spiritualFeatureIcon,

                          !spiritualEnabled &&
                            styles.spiritualFeatureIconDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.spiritualFeatureEmoji,

                            !spiritualEnabled && styles.emojiDisabled,
                          ]}
                        >
                          {feature.icon}
                        </Text>
                      </View>

                      <View style={styles.spiritualFeatureCopy}>
                        <Text
                          style={[
                            styles.spiritualFeatureTitle,

                            !spiritualEnabled &&
                              styles.spiritualFeatureTitleDisabled,
                          ]}
                        >
                          {feature.label}
                        </Text>

                        <Text
                          style={[
                            styles.spiritualFeatureDescription,

                            !spiritualEnabled &&
                              styles.spiritualFeatureDescriptionDisabled,
                          ]}
                        >
                          {feature.description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.featureStateIcon,

                          spiritualEnabled
                            ? styles.featureStateIconActive
                            : styles.featureStateIconDisabled,
                        ]}
                      >
                        <MaterialDesignIcons
                          color={spiritualEnabled ? '#FFFFFF' : '#AAA3B5'}
                          name={spiritualEnabled ? 'check' : 'minus'}
                          size={14}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.spiritualInfoBox}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="information-outline"
                    size={19}
                  />

                  <Text style={styles.spiritualInfoText}>
                    Tu peux modifier ce choix à tout moment depuis ton profil.
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSpiritualModalVisible(false)}
                  style={({ pressed }) => [
                    styles.doneButton,

                    pressed && styles.optionPressed,
                  ]}
                >
                  <MaterialDesignIcons color="#FFFFFF" name="check" size={19} />

                  <Text style={styles.doneButtonText}>Terminé</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* =====================================================
            ACCOUNT INFO MODAL (Anonymous Mode)
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() => setAccountInfoModalVisible(false)}
          statusBarTranslucent
          transparent
          visible={accountInfoModalVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setAccountInfoModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.objectiveSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>Informations du compte</Text>

                  <Text style={styles.sheetSubtitle}>
                    Ton profil anonyme ne contient aucune information permettant de t’identifier.
                  </Text>
                </View>

                <Pressable
                  onPress={() => setAccountInfoModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={PURPLE_DARK}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <View style={[styles.accountInfoList, {paddingBottom: Math.max(insets.bottom, 14) + 14}]}>
                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>Mode anonyme</Text>
                  <Text style={styles.accountInfoValue}>Activé</Text>
                </View>

                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>Identifiant anonyme</Text>
                  <Text style={styles.accountInfoValue}>{anonymousAccount?.id ?? '—'}</Text>
                </View>

                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>Créé le</Text>
                  <Text style={styles.accountInfoValue}>
                    {anonymousAccount
                      ? formatFullDate(new Date(anonymousAccount.createdAt))
                      : '—'}
                  </Text>
                </View>

                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>Sécurité</Text>
                  <Text style={styles.accountInfoValue}>
                    {securityLocked ? 'PIN / Biométrie' : 'Non configurée'}
                  </Text>
                </View>

                <View style={[styles.accountInfoRow, styles.accountInfoRowLast]}>
                  <Text style={styles.accountInfoLabel}>Synchronisation</Text>
                  <Text style={styles.accountInfoValue}>Locale uniquement</Text>
                </View>

                <View style={styles.spiritualInfoBox}>
                  <MaterialDesignIcons
                    color={PURPLE}
                    name="information-outline"
                    size={19}
                  />

                  <Text style={styles.spiritualInfoText}>
                    Tes données restent privées sur cet appareil et ne sont pas synchronisées sur d’autres appareils.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* =====================================================
            PHOTO MODAL (Normal Mode)
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() => setPhotoSheetVisible(false)}
          statusBarTranslucent
          transparent
          visible={photoSheetVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setPhotoSheetVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.objectiveSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>Modifier la photo</Text>
                </View>

                <Pressable
                  onPress={() => setPhotoSheetVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={PURPLE_DARK}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <View style={{paddingBottom: Math.max(insets.bottom, 14) + 14}}>
                <MenuRow
                  icon="camera-outline"
                  onPress={() => choosePhoto(true)}
                  subtitle="Utiliser l’appareil photo"
                  title="Prendre une photo"
                />

                <View style={styles.menuDivider} />

                <MenuRow
                  icon="image-outline"
                  onPress={() => choosePhoto(false)}
                  subtitle="Sélectionner une image existante"
                  title="Choisir depuis la galerie"
                />

                {photoUri ? (
                  <>
                    <View style={styles.menuDivider} />

                    <MenuRow
                      icon="delete-outline"
                      onPress={removePhoto}
                      subtitle="Revenir à l’avatar par défaut"
                      title="Supprimer la photo"
                    />
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  page: {
  flex: 1,
  backgroundColor: '#F2ECF8',
},

pageBackgroundDecor: {
  ...StyleSheet.absoluteFillObject,
  overflow: 'hidden',
},

pageGlowTop: {
  position: 'absolute',
  top: -150,
  right: -110,
  width: 330,
  height: 330,
  borderRadius: 165,
  backgroundColor: 'rgba(111, 82, 170, 0.07)',
},

pageGlowMiddle: {
  position: 'absolute',
  top: '38%',
  left: -130,
  width: 260,
  height: 260,
  borderRadius: 130,
  backgroundColor: 'rgba(139, 112, 188, 0.045)',
},

pageGlowBottom: {
  position: 'absolute',
  bottom: -150,
  right: -100,
  width: 310,
  height: 310,
  borderRadius: 155,
  backgroundColor: 'rgba(92, 67, 139, 0.05)',
},
  premiumCard: {
    position: 'relative',
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 18,
    borderWidth: 1.6,
    borderColor: '#E97BFF',
    borderRadius: 24,
    backgroundColor: '#4A2398',
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 13,
    shadowColor: '#D85BFF',
    shadowOpacity: 0.38,
    shadowRadius: 13,
    shadowOffset: {width: 0, height: 6},
    elevation: 7,
  },

  premiumGlow: {
    position: 'absolute',
    top: -54,
    right: -38,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#A874FF',
  },

  premiumAmbientOrbOne: {
    position: 'absolute',
    left: -52,
    bottom: -72,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(112,69,215,0.34)',
  },

  premiumAmbientOrbTwo: {
    position: 'absolute',
    right: 22,
    bottom: -62,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,185,225,0.10)',
  },

  premiumShine: {
    position: 'absolute',
    top: -62,
    bottom: -62,
    width: 42,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  premiumHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  premiumCrownWrap: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,221,115,0.26)',
    borderRadius: 13,
    backgroundColor: 'rgba(255,216,95,0.10)',
  },

  premiumCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    marginRight: 8,
  },

  premiumTitle: {
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  premiumSubtitle: {
    marginTop: 3,
    color: '#F1E9FF',
    fontSize: 10.8,
    lineHeight: 15.5,
  },

  premiumStarWrap: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },

  premiumFeaturesGrid: {
    marginTop: 11,
    gap: 5,
  },

  premiumFeature: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },

  premiumCheckCircle: {
    width: 17,
    height: 17,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8.5,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  premiumFeatureText: {
    flex: 1,
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 10.8,
    fontWeight: '600',
    lineHeight: 14.5,
  },

  premiumButton: {
    minHeight: 44,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.74)',
    borderRadius: 16,
    backgroundColor: '#FFFDFE',
    paddingHorizontal: 14,
    shadowColor: '#251059',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },

  premiumButtonText: {
    color: '#4F2A96',
    fontSize: 13.5,
    fontWeight: '900',
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
   * IDENTITY CARD — compact premium version
   * ======================================================== */

  identityCard: {
    overflow: 'hidden',
    marginTop: 14,
    minHeight: 108,
    borderWidth: 1,
    borderColor: 'rgba(104,70,199,0.11)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#34245F',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.06,
    shadowRadius: 13,
    elevation: 3,
  },

  identityGlow: {
    position: 'absolute',
    top: -92,
    left: -62,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },

  identityDecorTopRight: {
    position: 'absolute',
    top: -42,
    right: -30,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(104,70,199,0.055)',
  },

  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarOuterRing: {
    width: 76,
    height: 76,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
  },

  avatarWrap: {
    width: 64,
    height: 64,
    flexShrink: 0,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  avatarFallback: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#EEE8F8',
  },

  avatarFallbackText: {
    color: '#6846C7',
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: '700',
  },

  avatarBadge: {
    position: 'absolute',
    right: -3,
    bottom: -2,
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    backgroundColor: '#6846C7',
    shadowColor: '#34245F',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },

  identity: {
    flex: 1,
    minWidth: 0,
    marginLeft: 13,
  },

  identityEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },

  identityEyebrow: {
    color: '#826CB0',
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.9,
  },

  identityMainLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },

  name: {
    flexShrink: 1,
    color: '#241B45',
    fontFamily: 'serif',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
  },

  identityEditButton: {
    width: 26,
    height: 26,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
  },

  identityTitle: {
    flexShrink: 1,
    color: '#241B45',
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },

  identitySubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },

  identitySubtitle: {
    flexShrink: 1,
    marginTop: 2,
    color: '#7C7488',
    fontSize: 10.5,
    lineHeight: 14,
  },

  activeBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EAF5EE',
  },

  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4F8F6D',
  },

  activeBadgeText: {
    color: '#4F8F6D',
    fontSize: 9.5,
    fontWeight: '800',
  },

  identityPrivacyPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.09)',
  },

  identityPrivacyText: {
    color: '#6E6380',
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '700',
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

  sectionHeader: {
    marginTop: 25,
    marginBottom: 11,
    paddingHorizontal: 2,
  },

  sectionHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionHeaderIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#EEE8F7',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.09)',
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  sectionTitle: {
    marginLeft: 9,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },

  sectionSubtitle: {
    marginTop: 5,
    marginLeft: 43,
    color: '#8A8196',
    fontSize: 11.5,
    lineHeight: 16,
  },

  menuCard: {
    gap: 8,
    backgroundColor: 'transparent',
  },

  moreMenuCard: {
    backgroundColor: 'transparent',
  },

  menuRow: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,76,151,0.10)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,253,255,0.96)',
    shadowColor: '#34245F',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 1,
  },

  menuRowPressed: {
    opacity: 0.9,
    transform: [{scale: 0.992}],
  },

  menuAccent: {
    position: 'absolute',
    left: 0,
    top: 15,
    bottom: 15,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    opacity: 0.78,
  },

  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
    marginRight: 8,
    backgroundColor: 'rgba(111,83,190,0.10)',
  },

  menuIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },

  menuIconDefault: {
    backgroundColor: '#F0E8FC',
    borderColor: 'transparent',
  },

  menuIconSoft: {
    backgroundColor: '#F4EFF9',
    borderColor: 'transparent',
  },

  menuIconSecurity: {
    backgroundColor: '#ECF3F1',
    borderColor: 'transparent',
  },

  menuCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 7,
  },

  menuTitle: {
    color: '#2A2050',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },

  menuSubtitle: {
    marginTop: 3,
    color: '#8A8196',
    fontSize: 11,
    lineHeight: 15.5,
  },

  menuChevron: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: '#F6F2F9',
  },

  securityRecommendationCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(161,108,85,0.28)',
    borderRadius: 20,
    backgroundColor: '#FBF1EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  securityRecommendationIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F3E1D6',
  },

  securityRecommendationCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  securityRecommendationTitle: {
    color: '#7A4B36',
    fontSize: 13.5,
    fontWeight: '700',
  },

  securityRecommendationText: {
    marginTop: 2,
    color: '#8F6E5C',
    fontSize: 11.5,
    lineHeight: 16,
  },

  securityRecommendationCta: {
    flexShrink: 0,
    borderRadius: 12,
    backgroundColor: '#A16C55',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  securityRecommendationCtaText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
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

  /* ========================================================
   * SIMPLE ACCOUNT ACTION
   * ======================================================== */

  simpleAccountButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 15,
  },

  simpleAccountButtonPressed: {
    opacity: 0.72,
  },

  signOut: {
    borderColor: 'rgba(180,72,90,0.30)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  signOutText: {
    color: '#B4485A',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  anonymousExit: {
    borderColor: 'rgba(105,73,190,0.28)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  anonymousExitText: {
    color: '#6849BE',
    fontSize: 14,
    lineHeight: 19,
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

  accountInfoList: {
    paddingTop: 2,
  },

  accountInfoRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(105,73,190,0.12)',
  },

  accountInfoRowLast: {
    borderBottomWidth: 0,
  },

  accountInfoLabel: {
    color: '#756A90',
    fontSize: 13,
  },

  accountInfoValue: {
    color: PURPLE_DARK,
    fontSize: 13.5,
    fontWeight: '700',
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

  premiumButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},

premiumButtonArrow: {
  position: 'absolute',
  right: 16,
  alignItems: 'center',
  justifyContent: 'center',
},

});

export default ProfileScreen;