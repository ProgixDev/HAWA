import {getContraceptionReminderIndicator} from '../utils/contraceptionReminderScheduling';
import {useToday} from '../hooks/useToday';
import {CYCLE_RETURN_DATE_TO_CHECK, classifyStoredCycleReturnDate} from '../utils/lossDateValidation';
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
import { usePremium } from '../hooks/usePremium';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';

import type { RootStackParamList } from '../navigation/AppNavigator';
import type { MainTabScreenProps } from '../navigation/MainTabNavigator';
import { getFloatingTabBarClearance, getTopPadding } from '../theme/spacing';
import {HawaPremiumBottomSheet} from '../components/premium/HawaPremiumBottomSheet';
import {hasPremiumArticles} from '../data/libraryContent';

import {
  getCycleObservationStartedAt,
  getCyclePreferences,
  getHasConfirmedCycleData,
  getHasConfirmedCycleDuration,
  getRecordedPeriodHistory,
  hydrateCyclePreferences,
  subscribeCyclePreferences,
  setCyclePreferences,
  getFirstName,
  getSelectedObjective,
  getSpiritualMarkersEnabled,
  hydrateActiveObjective,
  subscribeActiveObjective,
  setSpiritualMarkersEnabled,
  subscribeHijriAdjustmentDays,
  type CyclePreferences,
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
  contraceptionMethodLabels,
} from '../config/contraceptionLabels';
import {
  getMenopausePreferences,
  hydrateMenopausePreferences,
  subscribeMenopausePreferences,
  type MenopauseHormonalTreatmentStatus,
  type MenopauseLabTracking,
  type MenopauseStage,
} from '../state/menopausePreferences';
import {
  getIrregularPreferences,
  hydrateIrregularPreferences,
  subscribeIrregularPreferences,
  type IrregularCyclePattern,
} from '../state/irregularPreferences';
import {useIrregularPeriodSources} from '../hooks/useIrregularPeriodSources';
import {
  resolveLatestIrregularPeriodDuration,
  resolveLatestIrregularPeriodStart,
} from '../utils/irregularJournalSelectors';
import {
  computeCyclePredictionStatus,
  describeAverageCycle,
  formatDateRange as formatCanonicalDateRange,
  formatFullDate,
  formatHijriDate,
  startOfDay as canonicalStartOfDay,
  dateFormatLocale,
} from '../utils/cycleMath';

import { lockIntimacy } from '../state/privateSectionAuthStore';
import { switchToObjective } from '../services/objectiveSwitch';
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

import {getDemoPartnerState} from '../state/awaADeuxDemoStore';
import {awaADeuxEntryRoute} from './awaADeux/awaADeuxNavigation';
import {
  consumeReopenManageProfilesSheetRequest,
  deleteManagedProfile,
  getManagedProfiles,
  hydrateManagedProfiles,
  subscribeManagedProfiles,
  type ManagedProfile,
} from '../state/managedProfilesStore';
import {startManagedProfileDraft} from '../state/managedProfileDraftStore';
import {
  OWNER_PROFILE_ID,
  getActiveProfileId,
  hydrateActiveProfileId,
  setActiveProfileId,
  subscribeActiveProfileId,
} from '../state/activeProfileStore';
import {seedManagedProfileCycleIfNeeded} from '../state/managedProfileCycleSeed';
import {formatAgeInYears} from '../utils/age';
import ManagedProfileSwipeRow from '../components/profile/ManagedProfileSwipeRow';
import ManagedProfileDeleteConfirmModal from '../components/profile/ManagedProfileDeleteConfirmModal';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {interpolateHex, onPrimaryTextColor, pickReadableTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import '../i18n';

// Default illustration for a managed (daughter) profile row in "Gérer les profils"
// when she has no custom photo yet — same asset as the managed-profile creation flow
// (see src/screens/managedProfile/).
const MANAGED_PROFILE_DAUGHTER_ILLUSTRATION = require('../assets/images/fille.png');

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type Props = MainTabScreenProps<'Profile'>;

/* ============================================================
 * OBJECTIFS
 * ============================================================ */

// Reuses the canonical objective labels already in src/i18n/locales/ (see
// objectives.* — copied verbatim from objectiveExportConfig.ts in Phase 1),
// never a second, duplicated translation of the same 8 labels.
function objectiveLabels(t: (key: string) => string): Record<ObjectiveId, string> {
  return {
    cycle: t('objectives.cycle'),
    conceive: t('objectives.conceive'),
    contraception: t('objectives.contraception'),
    irregular: t('objectives.irregular'),
    menopause: t('objectives.menopause'),
    pregnancy: t('objectives.pregnancy'),
    postpartum: t('objectives.postpartum'),
    loss: t('objectives.loss'),
  };
}

// These Record<Enum, string> maps are all pure DISPLAY text: the underlying
// semantic value (PostpartumDeliveryType, MenopauseStage, ...) is persisted
// elsewhere by each objective's own onboarding screens — Profile only ever
// reads and displays it, so translating these labels is safe (unlike the
// data-bearing symptom/activity picklists in the Journal entry screens; see
// those files' own header comments for that different, unsafe case).
function deliveryTypeLabels(t: (key: string) => string): Record<PostpartumDeliveryType, string> {
  return {
    vaginal: t('profile.postpartum.deliveryType.vaginal'),
    planned_csection: t('profile.postpartum.deliveryType.plannedCsection'),
    emergency_csection: t('profile.postpartum.deliveryType.emergencyCsection'),
    prefer_not_to_say: t('profile.postpartum.deliveryType.preferNotToSay'),
  };
}

// Same wording as SummaryScreen.tsx's own local MENOPAUSE_STAGE_LABELS/
// MENOPAUSE_HORMONAL_TREATMENT_LABELS — kept as Profile's own local display
// copy, same "duplicate small static label maps per screen" convention
// already used above for DELIVERY_TYPE_LABELS/FEEDING_TYPE_LABELS.
function menopauseStageLabels(t: (key: string) => string): Record<MenopauseStage, string> {
  return {
    perimenopause: t('profile.menopause.stage.perimenopause'),
    menopause: t('profile.menopause.stage.menopause'),
    unsure: t('profile.menopause.stage.unsure'),
  };
}

function menopauseLabTrackingLabels(t: (key: string) => string): Record<MenopauseLabTracking, string> {
  return {
    fsh: 'FSH',
    estradiol: t('profile.menopause.labTracking.estradiol'),
    both: t('profile.menopause.labTracking.both'),
    none: t('profile.menopause.labTracking.none'),
  };
}

function menopauseHormonalTreatmentLabels(t: (key: string) => string): Record<MenopauseHormonalTreatmentStatus, string> {
  return {
    track: t('profile.menopause.hormonalTreatment.track'),
    no: t('profile.menopause.hormonalTreatment.no'),
    not_now: t('profile.menopause.hormonalTreatment.notNow'),
  };
}

// Same exact wording as the SOPK onboarding's own (private, screen-local)
// cyclePatternOptions in IrregularOnboardingScreens.tsx — displays the
// user's real saved answer instead of a hardcoded "Cycles irréguliers".
function irregularCyclePatternLabels(t: (key: string) => string): Record<IrregularCyclePattern, string> {
  return {
    regular: t('profile.irregular.cyclePattern.regular'),
    irregular: t('profile.irregular.cyclePattern.irregular'),
    very_variable: t('profile.irregular.cyclePattern.veryVariable'),
    unknown: t('profile.irregular.cyclePattern.unknown'),
  };
}

function feedingTypeLabels(t: (key: string) => string): Record<PostpartumFeedingType, string> {
  return {
    exclusive_breastfeeding: t('profile.postpartum.feedingType.exclusiveBreastfeeding'),
    mixed: t('profile.postpartum.feedingType.mixed'),
    exclusive_bottle: t('profile.postpartum.feedingType.exclusiveBottle'),
    unknown: t('profile.postpartum.feedingType.unknown'),
  };
}

// Same wording as MiscarriageBleedingScreen/MiscarriageCycleReturnScreen/
// MiscarriageTryingAgainScreen.
function bleedingStatusLabels(t: (key: string) => string): Record<MiscarriageBleedingStatus, string> {
  return {
    yes: t('journalIntimacy.yes'),
    no: t('journalIntimacy.no'),
    variable: t('profile.miscarriage.bleedingStatus.variable'),
  };
}

function miscarriageCycleReturnLabels(t: (key: string) => string): Record<MiscarriageCycleReturnStatus, string> {
  return {
    no: t('profile.miscarriage.cycleReturn.notYet'),
    yes: t('journalIntimacy.yes'),
    unknown: t('profile.miscarriage.cycleReturn.unknown'),
  };
}

function miscarriageTryingAgainLabels(t: (key: string) => string): Record<MiscarriageTryingAgainStatus, string> {
  return {
    not_now: t('profile.miscarriage.tryingAgain.notNow'),
    soon: t('profile.miscarriage.tryingAgain.soon'),
    ready: t('profile.miscarriage.tryingAgain.ready'),
  };
}

// PHASE E2 — each objective's `tint` stays a fixed literal (Category E,
// same reasoning as MENU_TONES below): a decorative identity badge for one
// of 8 self-selected life-tracking objectives, not a themed role.
function objectivesList(t: (key: string) => string): Array<{
  id: ObjectiveId;
  icon: string;
  label: string;
  subtitle: string;
  tint: string;
}> {
  return [
  {
    id: 'cycle',
    icon: '🗓️',
    label: t('objectives.cycle'),
    subtitle: t('profile.objectivePicker.subtitles.cycle'),
    tint: '#E7F0E8',
  },
  {
    id: 'conceive',
    icon: '💗',
    label: t('objectives.conceive'),
    subtitle: t('profile.objectivePicker.subtitles.conceive'),
    tint: '#FBE8E8',
  },
  {
    id: 'contraception',
    icon: '💊',
    label: t('objectives.contraception'),
    subtitle: t('profile.objectivePicker.subtitles.contraception'),
    tint: '#F1E8F5',
  },
  {
    id: 'irregular',
    icon: '🪷',
    label: t('objectives.irregular'),
    subtitle: t('profile.objectivePicker.subtitles.irregular'),
    tint: '#FBE9E7',
  },
  {
    id: 'menopause',
    icon: '👤',
    label: t('objectives.menopause'),
    subtitle: t('profile.objectivePicker.subtitles.menopause'),
    tint: '#EFE7F4',
  },
  {
    id: 'pregnancy',
    icon: '🤰',
    label: t('objectives.pregnancy'),
    subtitle: t('profile.objectivePicker.subtitles.pregnancy'),
    tint: '#FBE9EB',
  },
  {
    id: 'postpartum',
    icon: '🍼',
    label: t('objectives.postpartum'),
    subtitle: t('profile.objectivePicker.subtitles.postpartum'),
    tint: '#E8F1E9',
  },
  {
    id: 'loss',
    icon: '☁️',
    label: t('objectives.loss'),
    subtitle: t('profile.objectivePicker.subtitles.loss'),
    tint: '#EDF2E9',
  },
  ];
}

/* ============================================================
 * REPÈRES SPIRITUELS
 * ============================================================ */

function spiritualFeatures(t: (key: string) => string) {
  return [
    {
      icon: '🗓️',
      label: t('profile.spiritualMarkers.hijriCalendar.label'),
      description: t('profile.spiritualMarkers.hijriCalendar.description'),
    },
    {
      icon: '🤲',
      label: t('profile.spiritualMarkers.prayersPurity.label'),
      description: t('profile.spiritualMarkers.prayersPurity.description'),
    },
    {
      icon: '🌙',
      label: t('profile.spiritualMarkers.fasting.label'),
      description: t('profile.spiritualMarkers.fasting.description'),
    },
    {
      icon: '🔔',
      label: t('profile.spiritualMarkers.prayerReminders.label'),
      description: t('profile.spiritualMarkers.prayerReminders.description'),
    },
  ];
}

/* ============================================================
 * HELPERS
 * ============================================================ */

// Defensive against an Invalid Date (e.g. built from a missing/malformed
// legacy AsyncStorage value) — Intl.DateTimeFormat.format() throws
// "RangeError: Invalid time value" on an invalid Date, which used to crash
// ProfileScreen. Returns null instead so each call site can show its own
// contextual fallback text.
const formatShortDate = (date: Date): string | null =>
  Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(dateFormatLocale(), {
        day: 'numeric',
        month: 'long',
      }).format(date);

// Defensive parser for date-only values (YYYY-MM-DD) persisted by AWA's
// preference stores (contraception/postpartum/miscarriage) — same
// local-noon anchor as PersonalInformationScreen.tsx's formatBirthDate, so
// a stored calendar date never shifts by a day from a UTC rollover. Returns
// null — never an Invalid Date — for a missing, empty or malformed value,
// so callers can show their existing "Non renseigné(e)" fallback instead of
// crashing.
const parseStoredDateOnly = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/* ============================================================
 * STAT CARD
 * ============================================================ */

type StatCardProps = {
  icon: IconName;
  label: string;
  value: string;
};

// Calls useAwaTheme() directly (rather than threading theme/styles props)
// since this component is instantiated many times per render (up to 5 stat
// tiles per objective branch) — see PHASE E2 report.
function StatCard({ icon, label, value }: StatCardProps): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
      </View>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Its own styles (premiumCard, premiumGlow, etc.) are fixed brand-identity
// literals regardless of theme (Step 17) — useAwaTheme() is only called
// here to obtain the shared `styles` object via createStyles(theme).
function PremiumProfileCard({onPress}: {onPress: () => void}): React.JSX.Element {
  // Canonical Premium state (src/state/premiumStore.ts) — never a local
  // isPremium snapshot; reactive via usePremium(), so an activation/restore
  // elsewhere in the app updates this card immediately without navigating
  // away and back.
  const {t} = useTranslation();
  const {isPremium} = usePremium();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
        accessibilityHint={t('profile.premiumCard.accessibilityHint')}
        accessibilityLabel={t('profile.premiumCard.accessibilityLabel')}
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
              {isPremium
                ? t('profile.premiumCard.activeSubtitle')
                : t('profile.premiumCard.inactiveSubtitle')}
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
            t('profile.premiumCard.features.advancedStatistics'),
            t('profile.premiumCard.features.pdfCsvExport'),
            t('profile.premiumCard.features.unlimitedHistory'),
            // Only advertised while at least one guide is really Premium-gated
            // (see hasPremiumArticles) — same rule as the Premium sheet.
            ...(hasPremiumArticles() ? [t('profile.premiumCard.features.inDepthEducationalContent')] : []),
            t('profile.premiumCard.features.additionalThemes')
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
      color={isPremium ? '#4F9185' : '#D5A928'}
      name={isPremium ? 'check-decagram' : 'crown'}
      size={20}
    />

    <Text style={styles.premiumButtonText}>
      {isPremium ? t('profile.premiumCard.activeSubscription') : t('profile.premiumCard.discoverPremium')}
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
  /** Optional third line (e.g. "Non configuré") under the subtitle. */
  status?: string;
  onPress?: () => void;
  tone?: MenuTone;
};

// PHASE E2 — kept as fixed literals, deliberately NOT theme-driven. Each
// Settings category (personal/anonymous/objective/health/security/backup/
// about/support) has its own fixed action-identity color, the same
// "Category E" convention as the Journal/Statistics quick-action accents
// on every migrated dashboard — intentionally distinct regardless of the
// active app palette. See PHASE E2 report.
const MENU_TONES: Record<
  MenuTone,
  {iconBackground: string; iconColor: string; accent: string}
> = {
  default: {
    iconBackground: '#F1EBF9',
    iconColor: '#6949BE',
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

// Calls useAwaTheme() directly — same reasoning as StatCard (many call
// sites per render). MENU_TONES (iconBackground/iconColor/accent) is
// intentionally left untouched: each Settings category's own fixed
// action-identity color, not a decorative role — see PHASE E2 report.
function MenuRow({
  icon,
  title,
  subtitle,
  status,
  onPress,
  tone = 'default',
}: MenuRowProps): React.JSX.Element {
  const palette = MENU_TONES[tone];
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
        {status ? <Text style={styles.menuStatus}>{status}</Text> : null}
      </View>

      <View style={styles.menuChevron}>
        <MaterialDesignIcons color={theme.colors.textMuted} name="chevron-right" size={19} />
      </View>
    </Pressable>
  );
}

/**
 * "Se déconnecter ?" confirmation — replaces the previous Alert.alert() with a dialog
 * that visually belongs to this screen (same radius/shadow/typography scale as its own
 * cards and sheets). Executes the EXISTING logout callback unchanged via `onConfirm` —
 * no authentication/session/navigation logic lives in this component.
 */
function LogoutConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  // A rapid double tap confirms once — same guard convention as the app's other
  // destructive confirmations (e.g. QadaaDeleteConfirmModal.tsx).
  const confirmingRef = useRef(false);
  useEffect(() => {
    if (visible) {confirmingRef.current = false;}
  }, [visible]);
  const confirm = () => {
    if (confirmingRef.current) {return;}
    confirmingRef.current = true;
    onConfirm();
  };
  return (
    <Modal animationType="fade" onRequestClose={onCancel} statusBarTranslucent transparent visible={visible}>
      <View style={styles.logoutDialogRoot}>
        <Pressable accessibilityLabel={t('common.close')} accessibilityRole="button" onPress={onCancel} style={styles.logoutDialogBackdrop} />
        <View accessibilityViewIsModal style={styles.logoutDialogCard}>
          <View importantForAccessibility="no-hide-descendants" style={styles.logoutDialogIconCircle}>
            <MaterialDesignIcons color={theme.colors.danger} name="logout" size={26} />
          </View>

          <Text accessibilityRole="header" style={styles.logoutDialogTitle}>{t('profile.logoutDialog.title')}</Text>
          <Text style={styles.logoutDialogBody}>{t('profile.logoutDialog.body')}</Text>
          <Text style={styles.logoutDialogReassurance}>{t('profile.logoutDialog.reassurance')}</Text>

          <View style={styles.logoutDialogActions}>
            <Pressable
              accessibilityLabel={t('common.cancel')}
              accessibilityRole="button"
              onPress={onCancel}
              style={({pressed}) => [styles.logoutDialogButton, styles.logoutDialogCancelButton, pressed && styles.logoutDialogPressed]}>
              <Text style={styles.logoutDialogCancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t('profile.logoutDialog.confirmAccessibilityLabel')}
              accessibilityRole="button"
              onPress={confirm}
              style={({pressed}) => [styles.logoutDialogButton, styles.logoutDialogDestructiveButton, pressed && styles.logoutDialogPressed]}>
              <Text style={[styles.logoutDialogDestructiveText, {color: pickReadableTextColor(theme.colors.danger)}]}>{t('profile.signOut')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
}): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderTopRow}>
        <View style={styles.sectionHeaderIcon}>
          <MaterialDesignIcons color={theme.colors.primary} name={icon} size={18} />
        </View>

        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/**
 * [-] N jours [+] stepper — same widget pattern already used by the
 * managed-profile creation flow's own cycle-setup screen
 * (ManagedProfileCycleSetupScreen.tsx's DurationStepper) and
 * QadaaManualEntryModal.tsx before it. Kept as its own small local
 * component here (rather than importing the creation-flow's version)
 * so this screen never depends on — and can never accidentally affect —
 * that already-tested onboarding-adjacent file.
 */
function DurationStepper({
  value,
  min,
  max,
  unit,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const canDecrease = value > min;
  const canIncrease = value < max;
  return (
    <View style={styles.stepperCard}>
      <Pressable
        accessibilityLabel={t('profile.durationStepper.decrease')}
        accessibilityRole="button"
        accessibilityState={{disabled: !canDecrease}}
        disabled={!canDecrease}
        hitSlop={4}
        onPress={() => onChange(Math.max(min, value - 1))}
        style={({pressed}) => [styles.stepperButton, !canDecrease && styles.stepperButtonDisabled, pressed && styles.pressed]}
      >
        <MaterialDesignIcons color={theme.colors.primary} name="minus" size={20} />
      </Pressable>
      <View style={styles.stepperValueBox}>
        <Text style={styles.stepperValue}>{value} {unit}</Text>
      </View>
      <Pressable
        accessibilityLabel={t('profile.durationStepper.increase')}
        accessibilityRole="button"
        accessibilityState={{disabled: !canIncrease}}
        disabled={!canIncrease}
        hitSlop={4}
        onPress={() => onChange(Math.min(max, value + 1))}
        style={({pressed}) => [styles.stepperButton, !canIncrease && styles.stepperButtonDisabled, pressed && styles.pressed]}
      >
        <MaterialDesignIcons color={theme.colors.primary} name="plus" size={20} />
      </Pressable>
    </View>
  );
}

/* ============================================================
 * PROFILE SCREEN
 * ============================================================ */

function ProfileScreen({ navigation }: Props): React.JSX.Element {
  const {t} = useTranslation();
  const objectiveLabelsMap = objectiveLabels(t);
  const deliveryTypeLabelsMap = deliveryTypeLabels(t);
  const menopauseStageLabelsMap = menopauseStageLabels(t);
  const menopauseLabTrackingLabelsMap = menopauseLabTrackingLabels(t);
  const menopauseHormonalTreatmentLabelsMap = menopauseHormonalTreatmentLabels(t);
  const irregularCyclePatternLabelsMap = irregularCyclePatternLabels(t);
  const feedingTypeLabelsMap = feedingTypeLabels(t);
  const bleedingStatusLabelsMap = bleedingStatusLabels(t);
  const miscarriageCycleReturnLabelsMap = miscarriageCycleReturnLabels(t);
  const miscarriageTryingAgainLabelsMap = miscarriageTryingAgainLabels(t);
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [premiumVisible, setPremiumVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [manageProfilesVisible, setManageProfilesVisible] = useState(false);
  const [managedProfiles, setManagedProfiles] = useState<ManagedProfile[]>(() => getManagedProfiles());

  // Hydrates + subscribes to managedProfilesStore (the mother's daughter profiles,
  // completely separate from AWA à deux — see the store's own header comment), and
  // reopens "Gérer les profils" if ManagedProfileSuccessScreen's "Accéder au profil
  // de {firstName}" left that one-shot request (no daughter dashboard exists yet).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydrateManagedProfiles().then(value => {
        if (active) {setManagedProfiles(value);}
      });
      if (consumeReopenManageProfilesSheetRequest()) {
        setManageProfilesVisible(true);
      }
      const unsubscribe = subscribeManagedProfiles(() => setManagedProfiles(getManagedProfiles()));
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  // Which profile — the mother, or one of the rows above — is currently active
  // across CycleHome/Calendar/Statistics/Journal (see activeProfileStore.ts). Kept
  // in sync here so "Gérer les profils"' checkmark and this screen's own identity
  // area (see the IDENTITY CARD below) always reflect it immediately after a switch.
  const [activeProfileIdValue, setActiveProfileIdValue] = useState<string>(() => getActiveProfileId());
  useFocusEffect(
    useCallback(() => {
      let active = true;
      hydrateActiveProfileId().then(value => {
        if (active) {setActiveProfileIdValue(value);}
      });
      const unsubscribe = subscribeActiveProfileId(() => setActiveProfileIdValue(getActiveProfileId()));
      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );
  const activeManagedProfile = activeProfileIdValue === OWNER_PROFILE_ID
    ? null
    : managedProfiles.find(profile => profile.id === activeProfileIdValue) ?? null;
  const isManagedProfileActive = activeManagedProfile !== null;

  const switchToProfile = (id: string) => {
    setActiveProfileId(id)
      // First-time-only seed of a daughter's own cycle context from what was
      // declared during her creation (see managedProfileCycleSeed.ts) — a no-op
      // once she already has real data, and a no-op for the owner (id === owner).
      .then(() => (id === OWNER_PROFILE_ID ? undefined : seedManagedProfileCycleIfNeeded(id)))
      .catch(() => undefined);
  };

  // Starts the daughter-profile creation flow (5-screen flow on the root stack —
  // this screen lives inside MainTabs, hence the same getParent() escalation
  // executeSignOut below uses to reach a root-stack screen).
  const handleAddProfile = () => {
    setManageProfilesVisible(false);
    startManagedProfileDraft();
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('ManagedProfileType');
  };

  // Swipe-to-delete for managed (daughter) profiles only — the mother's own row is
  // never wrapped in ManagedProfileSwipeRow, so it structurally can never reach here.
  const [openSwipeProfileId, setOpenSwipeProfileId] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<ManagedProfile | null>(null);

  const confirmDeleteManagedProfile = async (profile: ManagedProfile) => {
    // Never leave activeProfileId pointing at a profile that's about to stop
    // existing — switch back to the mother FIRST, then delete.
    if (getActiveProfileId() === profile.id) {
      await setActiveProfileId(OWNER_PROFILE_ID);
    }
    await deleteManagedProfile(profile.id);
    setManagedProfiles(getManagedProfiles());
    setOpenSwipeProfileId(null);
    setProfileToDelete(null);
  };
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

  // A managed (daughter) profile only ever has ONE objective — "Suivre mon
  // cycle" — regardless of the mother's own real, globally-stored objective
  // (see CLAUDE.md §4/objective isolation and the same effectiveObjective
  // pattern already used by HomeScreen/ObjectiveAwareCalendarScreen/
  // ObjectiveAwareStatisticsScreen/JournalSheetHost). Every objective-driven
  // section of THIS screen below (stats grid, "Mes informations" rows,
  // notifications row) must read this, never the raw `objective` state.
  const effectiveObjective: ObjectiveId = isManagedProfileActive ? 'cycle' : objective;

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

  /* ========================================================
   * MANAGED DAUGHTER PROFILE — "Durée du cycle" / "Durée des règles" /
   * "Régularité du cycle" editors.
   *
   * The mother's own equivalent rows keep navigating to CycleInformation's
   * {mode:'edit'} (her onboarding screen reused in edit mode) EXACTLY as
   * before — untouched. For a managed daughter, tapping these rows must
   * NEVER reach that screen (it belongs to the mother's own onboarding/
   * profile state); instead they open one of these three small AWA-styled
   * bottom-sheet editors. Both paths ultimately call the SAME
   * setCyclePreferences() — already profile-scoped (see
   * onboardingPreferences.ts) — so saving here only ever touches whichever
   * profile is currently active, never the mother's data. No new
   * prediction/calculation logic is introduced: existing cycleMath.ts
   * functions already read from this same profile-scoped store.
   * ======================================================== */

  const CYCLE_DURATION_MIN = 20;
  const CYCLE_DURATION_MAX = 40;
  const PERIOD_DURATION_MIN = 2;
  const PERIOD_DURATION_MAX = 10;

  const [cycleDurationEditorVisible, setCycleDurationEditorVisible] = useState(false);
  const [draftCycleDuration, setDraftCycleDuration] = useState(cycle.cycleDuration);
  const openCycleDurationEditor = () => {
    setDraftCycleDuration(cycle.cycleDuration);
    setCycleDurationEditorVisible(true);
  };
  const saveCycleDuration = () => {
    setCyclePreferences({...cycle, cycleDuration: draftCycleDuration});
    setCycleDurationEditorVisible(false);
  };

  const [periodDurationEditorVisible, setPeriodDurationEditorVisible] = useState(false);
  const [draftPeriodDuration, setDraftPeriodDuration] = useState(cycle.periodDuration);
  const openPeriodDurationEditor = () => {
    setDraftPeriodDuration(cycle.periodDuration);
    setPeriodDurationEditorVisible(true);
  };
  const savePeriodDuration = () => {
    setCyclePreferences({...cycle, periodDuration: draftPeriodDuration});
    setPeriodDurationEditorVisible(false);
  };

  const [regularityEditorVisible, setRegularityEditorVisible] = useState(false);
  const [draftRegularity, setDraftRegularity] = useState(cycle.regularity);
  const openRegularityEditor = () => {
    setDraftRegularity(cycle.regularity);
    setRegularityEditorVisible(true);
  };
  const saveRegularity = () => {
    setCyclePreferences({...cycle, regularity: draftRegularity});
    setRegularityEditorVisible(false);
  };

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

  const [menopause, setMenopause] = useState(getMenopausePreferences);

  useEffect(() => {
    let active = true;
    hydrateMenopausePreferences().then(value => {
      if (active) {
        setMenopause(value);
      }
    });
    const unsubscribe = subscribeMenopausePreferences(() => {
      if (active) {
        setMenopause(getMenopausePreferences());
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const [irregularPrefs, setIrregularPrefs] = useState(getIrregularPreferences);

  useEffect(() => {
    let active = true;
    hydrateIrregularPreferences().then(value => {
      if (active) {
        setIrregularPrefs(value);
      }
    });
    const unsubscribe = subscribeIrregularPreferences(() => {
      if (active) {
        setIrregularPrefs(getIrregularPreferences());
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
  // Read-only "Informations personnelles" for a managed (daughter) profile —
  // resolves ONLY activeManagedProfile's own firstName/birthDate/photo, never
  // the mother's PersonalInformationScreen (which is her own name/email/DOB).
  const [managedProfileInfoModalVisible, setManagedProfileInfoModalVisible] =
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
        Alert.alert(t('profile.photoModal.title'), t('profile.photoModal.cameraGalleryError'));
        return;
      }
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        const updated = await updatePersonalInformation({avatarUri: uri});
        setPhotoUri(updated.avatarUri ?? null);
      }
    } catch {
      Alert.alert(t('profile.photoModal.title'), t('profile.photoModal.genericError'));
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
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts.
  const { today, todayKey } = useToday();
  // Never "Activés" for ring / patch — see getContraceptionReminderIndicator.
  const contraceptionReminderIndicator = getContraceptionReminderIndicator(
    contraception.method,
    contraception.remindersEnabled,
  );
  const nextPeriodStatus = useMemo(
    () =>
      computeCyclePredictionStatus(
        cycle,
        cycle.regularity,
        getRecordedPeriodHistory()
          .map(record => new Date(`${record.startDate}T12:00:00`))
          .filter(date => !Number.isNaN(date.getTime())),
        getCycleObservationStartedAt(),
        canonicalStartOfDay(new Date()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- day-change trigger
    [cycle, todayKey],
  );

  const nextPeriodValue = (() => {
    if (nextPeriodStatus.mode === 'exact') {
      return formatShortDate(nextPeriodStatus.date) ?? t('profile.notProvidedFeminine');
    }
    if (nextPeriodStatus.mode === 'window') {
      return nextPeriodStatus.isLate
        ? t('calendar.periodLate')
        : formatCanonicalDateRange(
            nextPeriodStatus.windowStart,
            nextPeriodStatus.windowEnd,
          );
    }
    return t('cycleHome.monthOfTotal', {month: nextPeriodStatus.monthsElapsed, total: nextPeriodStatus.totalMonths});
  })();

  // Same rule as Dashboard/Calendar (describeAverageCycle in cycleMath.ts): a
  // number is only called an average when it was observed from the user's own
  // recorded cycles; a declared length is worded as such, and an irregular /
  // variable cycle never gets one precise figure.
  const averageCycleTile = describeAverageCycle(nextPeriodStatus, cycle, getHasConfirmedCycleDuration());

  // SOPK's own Profile summary — deliberately independent of
  // computeCyclePredictionStatus()/nextPeriodStatus above (no "Prochaines
  // règles", no "Cycle moyen", no automatic "retard" for a long cycle — see
  // IrregularDashboard.tsx's own header comment for the same product rule).
  // Sourced from the real onboarding answer and the real confirmed period
  // history only — never a fabricated default.
  const irregularCycleTypeValue = irregularPrefs.cyclePattern
    ? irregularCyclePatternLabelsMap[irregularPrefs.cyclePattern]
    : t('profile.notProvided');

  // Real period data for the SOPK tiles: the periods the user actually
  // recorded (journal period days), cycle-confirmed occurrences and the
  // onboarding answer — see utils/irregularJournalSelectors.ts. Reading the
  // confirmed history alone left these tiles at "Non renseignée(s)" for a
  // user who records periods through the SOPK journal.
  const irregularPeriodSources = useIrregularPeriodSources(effectiveObjective === 'irregular');

  const irregularPeriodDurationValue = (() => {
    const days = resolveLatestIrregularPeriodDuration(irregularPeriodSources, todayKey);
    return days ? t('averageCycle.days', {count: days}) : t('profile.notProvidedFeminine');
  })();

  const irregularLastPeriodValue = (() => {
    const start = resolveLatestIrregularPeriodStart(irregularPeriodSources, todayKey);
    if (!start) {
      return t('profile.notProvidedPlural');
    }
    const parsed = new Date(`${start}T12:00:00`);
    return Number.isNaN(parsed.getTime())
      ? t('profile.notProvidedPlural')
      : formatShortDate(parsed) ?? t('profile.notProvidedPlural');
  })();

  // Follows the shared current day (see useToday above) AND the Hijri
  // adjustment: re-evaluated when the day changes, on focus, and whenever the
  // adjustment changes.
  const [hijriToday, setHijriToday] = useState(() => formatHijriDate(today));
  useFocusEffect(
    useCallback(() => {
      setHijriToday(formatHijriDate(today));
      const unsubscribe = subscribeHijriAdjustmentDays(() => setHijriToday(formatHijriDate(today)));
      return unsubscribe;
    }, [today]),
  );

  /* ========================================================
   * CHANGER OBJECTIF
   * ======================================================== */

  // Already-configured objective → activated, its data untouched, dashboard
  // opened. Never-configured objective → its own onboarding chain starts and
  // the dashboard opens when that chain is finished (backing out restores the
  // previous objective, see AppNavigator's state listener). Nothing is ever
  // deleted — see services/objectiveSwitch.ts.
  const changeObjective = async (nextObjective: ObjectiveId) => {
    setObjectiveModalVisible(false);

    const result = await switchToObjective({
      from: objective,
      to: nextObjective,
      openHome: () => navigation.navigate('CycleHome'),
      openSetup: route => navigation.navigate(route),
    });

    if (result !== 'unchanged') {
      setObjective(nextObjective);
    }
  };

  /* ========================================================
   * CHANGER REPÈRES
   * ======================================================== */

  const changeSpiritualMarkers = (enabled: boolean) => {
    setSpiritualMarkersEnabled(enabled);

    setSpiritualEnabled(enabled);
  };

  const confirmSignOut = () => setLogoutDialogVisible(true);

  // Existing logout behavior, unchanged — only how it is confirmed changed (a premium
  // AWA-styled dialog instead of a generic system Alert).
  const executeSignOut = () => {
    setLogoutDialogVisible(false);
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
  };

  return (
    <LinearGradient
  colors={[...theme.gradients.pageBackground]}
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
          barStyle={theme.statusBarStyle}
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: getTopPadding(insets.top, compact),

              paddingBottom: getFloatingTabBarClearance(insets.bottom, 24),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>{t('navigation.profile')}</Text>

              <Text style={styles.headerSubtitle}>
                {t('profile.headerSubtitle')}
              </Text>
            </View>

            <Pressable
              accessibilityLabel={t('profile.managedProfiles.sheetTitle')}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setManageProfilesVisible(true)}
              style={({ pressed }) => [
                styles.manageProfilesButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="account-multiple-plus-outline"
                size={20}
              />
            </Pressable>
          </View>

          {/* =================================================
              IDENTITY CARD — sober, minimal: avatar + name only.
              Objective/spiritual/location status live in their own
              dedicated sections further down, not duplicated here.
          ================================================= */}

          <LinearGradient
            colors={[
              theme.colors.surface,
              interpolateHex(theme.colors.surface, theme.colors.primarySoft, 0.5),
              theme.colors.primarySoft,
            ]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.identityCard}>
            <View pointerEvents="none" style={styles.identityGlow} />
            <View pointerEvents="none" style={styles.identityDecorTopRight} />

            <View style={styles.identityTopRow}>
              <View style={styles.avatarOuterRing}>
                <View style={styles.avatarWrap}>
                  {isManagedProfileActive ? (
                    <Image
                      accessibilityIgnoresInvertColors
                      resizeMode={activeManagedProfile?.profileImageUri ? 'cover' : 'contain'}
                      source={
                        activeManagedProfile?.profileImageUri
                          ? {uri: activeManagedProfile.profileImageUri}
                          : MANAGED_PROFILE_DAUGHTER_ILLUSTRATION
                      }
                      style={styles.avatar}
                    />
                  ) : anonymousMode ? (
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

                  {/* No photo-edit badge for a managed profile — her photo is only ever
                      set from the daughter-creation flow / a future edit screen, never
                      from here (this pressable edits the MOTHER's own avatarUri). */}
                  {isManagedProfileActive ? null : (
                    <Pressable
                      accessibilityLabel={
                        anonymousMode
                          ? t('profile.editAnonymousAvatarAccessibility')
                          : t('profile.editAvatarAccessibility')
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
                        color={onPrimaryTextColor(theme)}
                        name={anonymousMode ? 'pencil-outline' : 'camera-outline'}
                        size={12}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.identity}>
                <View style={styles.identityEyebrowRow}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name={isManagedProfileActive ? 'account-child-outline' : anonymousMode ? 'incognito' : 'account-outline'}
                    size={13}
                  />
                  <Text style={styles.identityEyebrow}>
                    {isManagedProfileActive ? t('profile.managedProfileEyebrow') : anonymousMode ? t('profile.privateModeEyebrow') : t('profile.myProfileEyebrow')}
                  </Text>
                </View>

                {isManagedProfileActive ? (
                  <>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{activeManagedProfile?.firstName}</Text>
                    </View>
                    <Text style={styles.identitySubtitle}>{t('profile.managedProfiles.myDaughter')}</Text>
                  </>
                ) : anonymousMode ? (
                  <>
                    <View style={styles.identityMainLine}>
                      <Text style={styles.identityTitle}>{t('profile.anonymousMode.title')}</Text>
                      <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeBadgeText}>{t('profile.spiritualMarkers.active')}</Text>
                      </View>
                    </View>
                    <Text style={styles.identitySubtitle}>
                      {t('profile.anonymousMode.identityHiddenSubtitle')}
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{firstName || t('profile.notProvided')}</Text>

                      <Pressable
                        accessibilityLabel={t('profile.editProfile')}
                        hitSlop={10}
                        onPress={() => navigation.navigate('PersonalInformation')}
                        style={({pressed}) => [
                          styles.identityEditButton,
                          pressed && styles.pressed,
                        ]}>
                        <MaterialDesignIcons
                          color={theme.colors.primary}
                          name="pencil-outline"
                          size={14}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.identitySubtitle}>
                      {t('profile.identitySubtitle')}
                    </Text>
                  </>
                )}

                <View style={styles.identityPrivacyPill}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="shield-check-outline"
                    size={13}
                  />
                  <Text style={styles.identityPrivacyText}>{t('profile.dataProtected')}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* STATS */}

          {effectiveObjective !== 'pregnancy' &&
          effectiveObjective !== 'postpartum' &&
          effectiveObjective !== 'loss' &&
          effectiveObjective !== 'contraception' &&
          effectiveObjective !== 'menopause' &&
          effectiveObjective !== 'irregular' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="calendar-range"
                label={averageCycleTile.label}
                value={averageCycleTile.value}
              />

              <StatCard
                icon="water-outline"
                label={t('profile.periodLengthShortLabel')}
                value={getHasConfirmedCycleDuration() ? t('averageCycle.days', {count: cycle.periodDuration}) : t('profile.notProvidedFeminine')}
              />

              <StatCard
                icon="calendar-month-outline"
                label={t('cycleHome.nextPeriodLabel')}
                value={nextPeriodValue}
              />

              <StatCard
                icon="weather-night"
                label={t('profile.hijriDateLabel')}
                value={spiritualEnabled ? hijriToday ?? '—' : t('profile.disabledSingular')}
              />
            </View>
          ) : null}

          {/* Menopause/Périménopause's OWN summary — never Cycle-specific
              stats (cycle moyen/durée des règles/prochaines règles belong to
              the standard Cycle objective only, and must not leak here since
              this objective no longer routes through cycle configuration at
              all — see LocationScreen.tsx's own 'menopause' branch). Sourced
              directly from the same canonical menopausePreferences store the
              Menopause Dashboard/Calendar/Statistics/Summary already
              read/write — never a hardcoded value or a Profile-specific
              copy. "Date hijri" is intentionally omitted here since it isn't
              a Menopause-specific datum (it belongs to the shared spiritual
              markers feature, already surfaced elsewhere in Profile). */}
          {effectiveObjective === 'menopause' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="flower-outline"
                label={t('profile.menopause.currentStageLabel')}
                value={menopause.stage ? menopauseStageLabelsMap[menopause.stage] : t('profile.notProvidedFeminine')}
              />

              <StatCard
                icon="clipboard-pulse-outline"
                label={t('profile.menopause.trackedSymptomsLabel')}
                value={menopause.trackedSymptoms.length > 0 ? `${menopause.trackedSymptoms.length}` : t('profile.none')}
              />

              <StatCard
                icon="pill"
                label={t('profile.menopause.hormonalTreatmentLabel')}
                value={
                  menopause.hormonalTreatmentStatus
                    ? menopauseHormonalTreatmentLabelsMap[menopause.hormonalTreatmentStatus]
                    : t('profile.notProvided')
                }
              />
            </View>
          ) : null}

          {/* SOPK / "Cycles irréguliers"'s OWN summary — never the standard
              Cycle objective's stats (cycle moyen/prochaines règles rely on
              computeCyclePredictionStatus(), whose 'window' mode can surface
              "Règles en retard" — forbidden for SOPK, see
              IrregularDashboard.tsx's own header comment on this rule).
              "Durée des règles"/"Dernières règles" describe only the most
              recent REAL period (recorded period days, a cycle-confirmed
              occurrence, or the onboarding answer — irregularJournalSelectors.ts),
              never a predicted or averaged value; the duration stays "Non
              renseignée" while that period is still ongoing. "Type de cycle" reflects the SOPK
              onboarding's real saved answer (irregularPreferences.ts), never
              a hardcoded "Cycles irréguliers". */}
          {effectiveObjective === 'irregular' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="sync"
                label={t('profile.irregular.cycleTypeLabel')}
                value={irregularCycleTypeValue}
              />

              <StatCard
                icon="water-outline"
                label={t('profile.periodLengthLabel')}
                value={irregularPeriodDurationValue}
              />

              <StatCard
                icon="calendar-month-outline"
                label={t('profile.lastPeriodLabel')}
                value={irregularLastPeriodValue}
              />

              <StatCard
                icon="weather-night"
                label={t('profile.hijriDateLabel')}
                value={spiritualEnabled ? hijriToday ?? '—' : t('profile.disabledSingular')}
              />
            </View>
          ) : null}

          {/* Contraception's OWN summary — never Cycle-specific stats
              (cycle moyen/durée des règles/prochaines règles belong to the
              Cycle objective only, and must not leak here). Sourced
              directly from the same canonical contraceptionPreferences
              store the Contraception Dashboard/Calendar/Statistics already
              read/write, and the same contraceptionMethodLabels(t)/
              CONTRACEPTION_METHOD_ICONS — never a hardcoded method or a
              Profile-specific copy. */}
          {effectiveObjective === 'contraception' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon={contraception.method ? CONTRACEPTION_METHOD_ICONS[contraception.method] : 'pill'}
                label={t('profile.contraception.currentMethodLabel')}
                value={
                  contraception.method
                    ? contraceptionMethodLabels(t)[contraception.method]
                    : t('profile.notProvidedFeminine')
                }
              />

              <StatCard
                icon="calendar-check-outline"
                label={t('profile.contraception.trackingStartLabel')}
                value={(() => {
                  const parsed = parseStoredDateOnly(contraception.methodStartDate);
                  return parsed ? formatFullDate(parsed) : t('profile.notProvided');
                })()}
              />

              <StatCard
                icon={contraceptionReminderIndicator === 'enabled' ? 'bell-check-outline' : 'bell-off-outline'}
                label={t('profile.contraception.remindersLabel')}
                value={
                  contraceptionReminderIndicator === 'enabled'
                    ? t('profile.contraception.remindersEnabled')
                    : contraceptionReminderIndicator === 'unavailable'
                      ? t('profile.contraception.remindersUnavailable')
                      : t('profile.contraception.remindersDisabled')
                }
              />

              <StatCard
                icon="weather-night"
                label={t('profile.hijriDateLabel')}
                value={spiritualEnabled ? hijriToday ?? '—' : t('profile.disabledSingular')}
              />
            </View>
          ) : null}

          {/* Postpartum's OWN summary — never Cycle-specific stats (last
              period/cycle duration/regularity belong to the Cycle
              objective only). Sourced directly from the same canonical
              postpartumPreferences store the onboarding flow wrote to. */}
          {effectiveObjective === 'postpartum' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="calendar-month-outline"
                label={t('profile.postpartum.deliveryLabel')}
                value={(() => {
                  const parsed = parseStoredDateOnly(postpartum.deliveryDate);
                  return parsed ? formatFullDate(parsed) : t('profile.notProvided');
                })()}
              />

              <StatCard
                icon="baby-face-outline"
                label={t('profile.postpartum.deliveryTypeLabel')}
                value={
                  postpartum.deliveryType
                    ? deliveryTypeLabelsMap[postpartum.deliveryType]
                    : t('profile.notProvided')
                }
              />

              <StatCard
                icon="baby-bottle-outline"
                label={t('profile.postpartum.feedingLabel')}
                value={
                  postpartum.feedingType
                    ? feedingTypeLabelsMap[postpartum.feedingType]
                    : t('profile.notProvided')
                }
              />
            </View>
          ) : null}

          {/* Miscarriage's OWN summary — never Cycle-specific stats (cycle
              moyen/durée des règles/prochaines règles/ovulation/fenêtre
              fertile belong to the Cycle objective only). Sourced directly
              from the same canonical miscarriagePreferences store the
              onboarding flow/Dashboard/Calendar/Statistics already read. */}
          {effectiveObjective === 'loss' ? (
            <View style={styles.statsGrid}>
              <StatCard
                icon="calendar-heart"
                label={t('profile.miscarriage.eventDateLabel')}
                value={(() => {
                  const parsed = parseStoredDateOnly(miscarriage.miscarriageDate);
                  return parsed ? formatFullDate(parsed) : t('profile.notProvidedFeminine');
                })()}
              />

              <StatCard
                icon="water-outline"
                label={t('profile.miscarriage.currentBleedingLabel')}
                value={
                  miscarriage.bleedingStatus
                    ? bleedingStatusLabelsMap[miscarriage.bleedingStatus]
                    : t('profile.notProvided')
                }
              />

              <StatCard
                icon="sync-circle"
                label={t('profile.miscarriage.cycleReturnLabel')}
                value={
                  miscarriage.cycleReturnStatus
                    ? miscarriageCycleReturnLabelsMap[
                        miscarriage.cycleReturnStatus
                      ]
                    : t('profile.notProvided')
                }
              />

              {(() => {
                if (miscarriage.cycleReturnStatus !== 'yes') {
                  return null;
                }
                const parsed = parseStoredDateOnly(
                  miscarriage.firstReturnedPeriodDate,
                );
                // A legacy stored date that is in the future / before the loss
                // (or unparsable) is never shown as an event: same canonical
                // check and wording as the Dashboard. The stored value is kept.
                const dateState = classifyStoredCycleReturnDate({
                  cycleReturnStatus: miscarriage.cycleReturnStatus,
                  cycleReturnDate: miscarriage.firstReturnedPeriodDate,
                  now: new Date(),
                  lossDate: miscarriage.miscarriageDate,
                });
                if (dateState === 'none') {
                  return null;
                }
                return (
                  <StatCard
                    icon="calendar-check-outline"
                    label={t('profile.miscarriage.periodReturnDateLabel')}
                    value={dateState === 'ok' && parsed ? formatFullDate(parsed) : CYCLE_RETURN_DATE_TO_CHECK}
                  />
                );
              })()}

              <StatCard
                icon="heart-outline"
                label={t('profile.miscarriage.tryingAgainLabel')}
                value={
                  miscarriage.tryingAgainStatus
                    ? miscarriageTryingAgainLabelsMap[
                        miscarriage.tryingAgainStatus
                      ]
                    : t('profile.notProvided')
                }
              />
            </View>
          ) : null}

          {/* Premium is an account-level, owner-only concept (never per-daughter —
              see CLAUDE.md §4/§18) — the promotional card is hidden entirely for a
              managed profile so "Mes informations" moves up with no empty gap;
              Premium entitlement/state/screens themselves are completely untouched. */}
          {!isManagedProfileActive ? <PremiumProfileCard onPress={() => setPremiumVisible(true)} /> : null}

          {/* MES INFORMATIONS */}

          <SectionHeader
            icon="account-cog-outline"
            title={t('profile.myInformationTitle')}
            subtitle={t('profile.myInformationSubtitle')}
          />

          <View style={styles.menuCard}>
            <MenuRow
              icon="account-outline"
              onPress={() =>
                isManagedProfileActive
                  ? setManagedProfileInfoModalVisible(true)
                  : anonymousMode
                    ? setAccountInfoModalVisible(true)
                    : navigation.navigate('PersonalInformation')
              }
              subtitle={
                isManagedProfileActive
                  ? t('profile.personalInfo.daughterSubtitle')
                  : anonymousMode
                    ? t('profile.personalInfo.anonymousSubtitle')
                    : t('profile.personalInfo.ownerSubtitle')
              }
              title={anonymousMode && !isManagedProfileActive ? t('profile.personalInfo.accountInfoTitle') : t('profile.personalInfo.title')}
              tone="personal"
            />

            {anonymousMode && !isManagedProfileActive ? (
              <MenuRow
                icon="incognito"
                onPress={() => navigation.navigate('AnonymousMode')}
                subtitle={t('profile.anonymousMode.manageSubtitle')}
                title={t('profile.anonymousMode.title')}
                tone="anonymous"
              />
            ) : null}

            <MenuRow
              icon="target"
              onPress={isManagedProfileActive ? undefined : () => setObjectiveModalVisible(true)}
              subtitle={objectiveLabelsMap[effectiveObjective]}
              title={t('profile.myObjective')}
              tone="objective"
            />

            <MenuRow
              icon="heart-pulse"
              onPress={() => navigation.navigate('GeneralHealth')}
              subtitle={t('profile.generalHealthSubtitle')}
              title={t('profile.generalHealthTitle')}
              tone="health"
            />

            {/* Post-onboarding configuration rows (M11). Each one opens the SAME
                screen the onboarding chain uses, in {mode:'edit'}: prefilled from
                the current store, saves only its own group, then goBack() —
                never continues the chain. Shown only for the matching objective. */}
            {effectiveObjective === 'cycle' ? (
              <>
                <MenuRow
                  icon="sync"
                  onPress={() =>
                    isManagedProfileActive
                      ? openCycleDurationEditor()
                      : navigation.navigate('CycleInformation', {mode: 'edit', section: 'habits'})
                  }
                  subtitle={getHasConfirmedCycleDuration() ? t('averageCycle.days', {count: cycle.cycleDuration}) : t('profile.notProvidedFeminine')}
                  title={t('profile.cycleLengthLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="water-outline"
                  onPress={() =>
                    isManagedProfileActive
                      ? openPeriodDurationEditor()
                      : navigation.navigate('CycleInformation', {mode: 'edit', section: 'habits'})
                  }
                  subtitle={getHasConfirmedCycleDuration() ? t('averageCycle.days', {count: cycle.periodDuration}) : t('profile.notProvidedFeminine')}
                  title={t('profile.periodLengthLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="chart-timeline-variant"
                  onPress={() =>
                    isManagedProfileActive
                      ? openRegularityEditor()
                      : navigation.navigate('CycleInformation', {mode: 'edit', section: 'habits'})
                  }
                  subtitle={
                    !getHasConfirmedCycleData()
                      ? t('profile.notProvidedFeminine')
                      : cycle.regularity === 'yes'
                        ? t('profile.regularity.ratherRegular')
                        : cycle.regularity === 'no'
                          ? t('profile.regularity.irregular')
                          // Regularity is never asked during daughter creation — for a
                          // managed profile, 'unknown' means "not yet provided", worded
                          // as such, rather than the mother's own "Je ne sais pas encore"
                          // (a real answer she gave during her onboarding).
                          : isManagedProfileActive
                            ? t('profile.notProvidedFeminine')
                            : t('profile.regularity.dontKnowYet')
                  }
                  title={t('profile.cycleRegularityLabel')}
                  tone="default"
                />
              </>
            ) : null}

            {effectiveObjective === 'conceive' ? (
              <>
                <MenuRow
                  icon="calendar-clock"
                  onPress={() => navigation.navigate('ConceptionTryingDuration', {mode: 'edit'})}
                  subtitle={t('profile.conceive.tryingDurationSubtitle')}
                  title={t('profile.conceive.tryingDurationTitle')}
                  tone="default"
                />
                <MenuRow
                  icon="target"
                  onPress={() => navigation.navigate('ConceptionOvulationAwareness', {mode: 'edit'})}
                  subtitle={t('profile.conceive.ovulationAwarenessSubtitle')}
                  title={t('profile.conceive.ovulationAwarenessTitle')}
                  tone="default"
                />
                <MenuRow
                  icon="chart-timeline-variant"
                  onPress={() => navigation.navigate('ConceptionIndicators', {mode: 'edit'})}
                  subtitle={t('profile.conceive.indicatorsSubtitle')}
                  title={t('profile.conceive.indicatorsTitle')}
                  tone="default"
                />
              </>
            ) : null}

            {effectiveObjective === 'irregular' ? (
              <>
                <MenuRow
                  icon="calendar-edit"
                  onPress={() => navigation.navigate('IrregularLastPeriod', {mode: 'edit'})}
                  subtitle={t('profile.miscarriage.provideOrCorrectDate')}
                  title={t('profile.lastPeriodLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="clipboard-pulse-outline"
                  onPress={() => navigation.navigate('IrregularTrackedItems', {mode: 'edit'})}
                  subtitle={
                    irregularPrefs.trackedItems.length > 0
                      ? t('profile.irregular.trackedItemsCount', {count: irregularPrefs.trackedItems.length})
                      : t('profile.irregular.noTrackedItems')
                  }
                  title={t('profile.irregular.trackedItemsLabel')}
                  tone="default"
                />
              </>
            ) : null}

            {effectiveObjective === 'contraception' ? (
              <>
                <MenuRow
                  icon="calendar-check-outline"
                  onPress={() => navigation.navigate('ContraceptionInformation', {mode: 'edit'})}
                  subtitle={(() => {
                    const parsed = parseStoredDateOnly(contraception.methodStartDate);
                    return parsed ? formatFullDate(parsed) : t('profile.notProvided');
                  })()}
                  title={t('profile.contraception.treatmentStartLabel')}
                  tone="default"
                />
                {contraception.method === 'pill' ? (
                  <MenuRow
                    icon="clock-outline"
                    onPress={() => navigation.navigate('ContraceptionInformation', {mode: 'edit'})}
                    subtitle={
                      contraception.hasTreatmentBreak === null
                        ? t('profile.notProvidedFeminine')
                        : contraception.hasTreatmentBreak
                          ? t('profile.contraception.withBreak')
                          : t('profile.contraception.withoutBreak')
                    }
                    title={t('profile.contraception.treatmentBreakLabel')}
                    tone="default"
                  />
                ) : null}
              </>
            ) : null}

            {effectiveObjective === 'pregnancy' ? (
              <>
                <MenuRow
                  icon="calendar-heart"
                  onPress={() => navigation.navigate('PregnancyDatingSetup', {mode: 'edit'})}
                  subtitle={t('profile.pregnancy.datingSubtitle')}
                  title={t('profile.pregnancy.datingTitle')}
                  tone="default"
                />
                <MenuRow
                  icon="clipboard-pulse-outline"
                  onPress={() => navigation.navigate('PregnancyTrackingPreferences', {mode: 'edit'})}
                  subtitle={t('profile.pregnancy.trackingPreferencesSubtitle')}
                  title={t('profile.pregnancy.trackingPreferencesTitle')}
                  tone="default"
                />
              </>
            ) : null}

            {effectiveObjective === 'pregnancy' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('PregnancyNotifications')}
                subtitle={t('profile.pregnancy.remindersSubtitle')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'contraception' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('ContraceptionReminders', {mode: 'edit'})}
                subtitle={t('profile.contraception.remindersSubtitle')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'cycle' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('CycleReminders', {mode: 'edit'})}
                subtitle={t('profile.cycle.remindersSubtitle')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'conceive' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('ConceptionReminders', {mode: 'edit'})}
                subtitle={t('profile.conceive.manageReminders')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'menopause' ? (
              <>
                <MenuRow
                  icon="flower-outline"
                  onPress={() => navigation.navigate('MenopauseStage', {mode: 'edit'})}
                  subtitle={menopause.stage ? menopauseStageLabelsMap[menopause.stage] : t('profile.notProvidedFeminine')}
                  title={t('profile.menopause.currentStageLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="clipboard-pulse-outline"
                  onPress={() => navigation.navigate('MenopauseSymptoms', {mode: 'edit'})}
                  subtitle={
                    menopause.trackedSymptoms.length > 0
                      ? t('profile.menopause.symptomsTrackedCount', {count: menopause.trackedSymptoms.length})
                      : t('profile.menopause.noSymptomsTracked')
                  }
                  title={t('profile.menopause.trackedSymptomsLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="pill"
                  onPress={() => navigation.navigate('MenopauseHormonalTreatment', {mode: 'edit'})}
                  subtitle={
                    menopause.hormonalTreatmentStatus
                      ? menopauseHormonalTreatmentLabelsMap[menopause.hormonalTreatmentStatus]
                      : t('profile.notProvided')
                  }
                  title={t('profile.menopause.hormonalTreatmentLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="flask-outline"
                  onPress={() => navigation.navigate('MenopauseLabTracking', {mode: 'edit'})}
                  subtitle={
                    menopause.labTracking ? menopauseLabTrackingLabelsMap[menopause.labTracking] : t('profile.notProvided')
                  }
                  title={t('profile.menopause.labTrackingLabel')}
                  tone="default"
                />
              </>
            ) : null}

            {effectiveObjective === 'menopause' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('MenopauseReminders', {mode: 'edit'})}
                subtitle={t('profile.menopause.remindersSubtitle')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'postpartum' ? (
              <>
                <MenuRow
                  icon="calendar-heart"
                  onPress={() => navigation.navigate('PostpartumDeliveryDate', {mode: 'edit'})}
                  subtitle={t('profile.postpartum.correctDeliveryDate')}
                  title={t('profile.postpartum.deliveryDateLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="medical-bag"
                  onPress={() => navigation.navigate('PostpartumDeliveryType', {mode: 'edit'})}
                  subtitle={t('profile.postpartum.deliveryTypeLabel')}
                  title={t('profile.postpartum.myDeliveryLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="baby-bottle-outline"
                  onPress={() => navigation.navigate('PostpartumFeeding', {mode: 'edit'})}
                  subtitle={t('profile.postpartum.feedingSubtitle')}
                  title={t('profile.postpartum.babyFeedingLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="sync"
                  onPress={() => navigation.navigate('PostpartumCycleReturn')}
                  subtitle={t('profile.postpartum.cycleReturnSubtitle')}
                  title={t('profile.miscarriage.cycleReturnLabel')}
                  tone="default"
                />
              </>
            ) : null}

            {effectiveObjective === 'postpartum' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('PostpartumReminders', {mode: 'edit'})}
                subtitle={t('profile.postpartum.remindersSubtitle')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'irregular' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('IrregularReminders', {mode: 'edit'})}
                subtitle={t('profile.irregular.remindersSubtitle')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'loss' ? (
              <MenuRow
                icon="calendar-edit"
                onPress={() => navigation.navigate('MiscarriageDate', {mode: 'edit'})}
                subtitle={t('profile.miscarriage.provideOrCorrectDate')}
                title={t('profile.miscarriage.dateLabel')}
                tone="default"
              />
            ) : null}

            {effectiveObjective === 'loss' ? (
              <>
                <MenuRow
                  icon="water-outline"
                  onPress={() => navigation.navigate('MiscarriageBleeding', {mode: 'edit'})}
                  subtitle={
                    miscarriage.bleedingStatus
                      ? t('profile.currentlyValue', {value: bleedingStatusLabelsMap[miscarriage.bleedingStatus]})
                      : t('profile.notProvided')
                  }
                  title={t('profile.miscarriage.currentBleedingLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="sync-circle"
                  onPress={() => navigation.navigate('MiscarriageCycleReturn', {mode: 'edit'})}
                  subtitle={
                    miscarriage.cycleReturnStatus
                      ? t('profile.currentlyValue', {value: miscarriageCycleReturnLabelsMap[miscarriage.cycleReturnStatus]})
                      : t('profile.notProvided')
                  }
                  title={t('profile.miscarriage.cycleReturnLabel')}
                  tone="default"
                />
                <MenuRow
                  icon="heart-outline"
                  onPress={() => navigation.navigate('MiscarriageTryingAgain', {mode: 'edit'})}
                  subtitle={
                    miscarriage.tryingAgainStatus
                      ? t('profile.currentlyValue', {value: miscarriageTryingAgainLabelsMap[miscarriage.tryingAgainStatus]})
                      : t('profile.notProvided')
                  }
                  title={t('profile.miscarriage.tryingAgainLabel')}
                  tone="default"
                />
              </>
            ) : null}

            {effectiveObjective === 'loss' ? (
              <MenuRow
                icon="bell-outline"
                onPress={() => navigation.navigate('MiscarriageReminders', {mode: 'edit'})}
                subtitle={t('profile.miscarriage.remindersSubtitle')}
                title={t('profile.notificationsAndReminders')}
                tone="default"
              />
            ) : null}

            <MenuRow
              icon="palette"
              onPress={() => navigation.navigate('Appearance')}
              subtitle={t('profile.appearanceSubtitle')}
              title={t('appearance.headerTitle')}
              tone="default"
            />

            {/* Account-level, owner-only (PIN/biométrie/mode discret/mode anonyme/
                suppression de compte all belong to the mother's authenticated AWA
                account/device — a managed daughter is not an independent account,
                see CLAUDE.md §4). Hidden entirely (not disabled) for a managed
                profile so "Sauvegarde" moves up with no empty gap; the screen and
                the mother's own settings are completely untouched. */}
            {!isManagedProfileActive ? (
              <MenuRow
                icon="shield-lock-outline"
                onPress={() => navigation.navigate('PrivacySecurity')}
                subtitle={t('profile.privacySecuritySubtitle')}
                title={t('profile.privacySecurityTitle')}
                tone="security"
              />
            ) : null}

            <MenuRow
              icon="cloud-outline"
              onPress={() => navigation.navigate('BackupData')}
              subtitle={t('profile.backupSubtitle')}
              title={t('profile.backupTitle')}
              tone="backup"
            />
          </View>

          {/* AWA À DEUX — opens the introduction screen only; the partner feature
              itself (pairing, sharing, permissions) is not implemented.
              Account-level, owner-only (CLAUDE.md §18's classification: AWA à deux
              belongs to the mother's own account, never a managed profile's identity)
              — hidden while a daughter is active so her cycle data can never be read
              by AWA à deux's partner-cycle-info computation, which resolves from
              onboardingPreferences.ts's shared (profile-scoped) cycle preferences. */}

          {!isManagedProfileActive ? (
            <>
              <SectionHeader icon="heart-multiple-outline" title={t('profile.awaADeuxSectionTitle')} />

              <View style={styles.menuCard}>
                <MenuRow
                  icon="heart-multiple-outline"
                  onPress={() => navigation.navigate(awaADeuxEntryRoute(getDemoPartnerState().partnerConnected))}
                  status={t('profile.notConfigured')}
                  subtitle={t('profile.awaADeuxSubtitle')}
                  title={t('profile.awaADeuxTitle')}
                  tone="default"
                />
              </View>
            </>
          ) : null}

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
                  color={theme.colors.warning}
                  name="shield-alert-outline"
                  size={20}
                />
              </View>

              <View style={styles.securityRecommendationCopy}>
                <Text style={styles.securityRecommendationTitle}>
                  {t('profile.security.lockRecommendedTitle')}
                </Text>
                <Text style={styles.securityRecommendationText}>
                  {t('profile.security.lockRecommendedText')}
                </Text>
              </View>

              <View style={styles.securityRecommendationCta}>
                <Text style={styles.securityRecommendationCtaText}>{t('profile.security.configure')}</Text>
              </View>
            </Pressable>
          ) : null}

          {/* =================================================
              REPÈRES SPIRITUELS — not part of a managed daughter profile's
              simplified cycle-tracking experience (CLAUDE.md §4 objective
              isolation); hidden entirely (not just disabled) so "Plus"
              moves up with no empty card. Stores/business logic untouched;
              the mother's own experience is byte-identical when she is
              active again.
          ================================================= */}

          {!isManagedProfileActive ? (
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
                    {t('profile.spiritualMarkers.sectionTitle')}
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
                      {spiritualEnabled ? t('profile.spiritualMarkers.active') : t('profile.spiritualMarkers.inactive')}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.spiritualText,

                    !spiritualEnabled && styles.spiritualTextDisabled,
                  ]}
                >
                  {t('profile.spiritualMarkers.summaryText')}
                </Text>
              </View>
            </View>

            <View style={styles.spiritualMiniFeatures}>
              {spiritualFeatures(t).map(feature => (
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
              <Text style={styles.manageButtonText}>{t('profile.spiritualMarkers.manageMarkers')}</Text>

              <MaterialDesignIcons
                color={onPrimaryTextColor(theme)}
                name="tune-variant"
                size={17}
              />
            </Pressable>
          </View>
          ) : null}

          {/* PLUS */}

          <SectionHeader
            icon="dots-horizontal-circle-outline"
            title={t('profile.moreSectionTitle')}
            subtitle={t('profile.moreSectionSubtitle')}
          />

          <View style={[styles.menuCard, styles.moreMenuCard]}>
            <MenuRow
              icon="information-outline"
              onPress={() => navigation.navigate('About')}
              subtitle={t('profile.aboutAwaSubtitle')}
              title={t('profile.aboutAwaTitle')}
              tone="about"
            />

            <MenuRow
              icon="lifebuoy"
              onPress={() => navigation.navigate('HelpSupport')}
              subtitle={t('profile.helpSupportSubtitle')}
              title={t('profile.helpSupportTitle')}
              tone="support"
            />
          </View>

          {anonymousMode ? (
            <Pressable
              accessibilityLabel={t('profile.anonymousMode.exit')}
              accessibilityRole="button"
              onPress={() => navigation.navigate('AnonymousMode')}
              style={({pressed}) => [
                styles.simpleAccountButton,
                styles.anonymousExit,
                pressed && styles.simpleAccountButtonPressed,
              ]}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="incognito"
                size={18}
              />

              <Text style={styles.anonymousExitText}>
                {t('profile.anonymousMode.exit')}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel={t('profile.signOut')}
              accessibilityRole="button"
              onPress={confirmSignOut}
              style={({pressed}) => [
                styles.simpleAccountButton,
                styles.signOut,
                pressed && styles.simpleAccountButtonPressed,
              ]}>
              <MaterialDesignIcons
                color={theme.colors.danger}
                name="logout"
                size={18}
              />

              <Text style={styles.signOutText}>
                {t('profile.signOut')}
              </Text>
            </Pressable>
          )}
        </ScrollView>
        <HawaPremiumBottomSheet visible={premiumVisible} onClose={() => setPremiumVisible(false)} />

        <LogoutConfirmModal
          onCancel={() => setLogoutDialogVisible(false)}
          onConfirm={executeSignOut}
          visible={logoutDialogVisible}
        />

        {/* =====================================================
            GÉRER LES PROFILS — first UI step of the future multi-profile
            feature. Only the current user's own real profile exists today
            (no daughter-profile creation/switching yet — see the header
            comment on handleAddProfile). Same Modal/backdrop/bottom-sheet
            shell as the OBJECTIVE MODAL just below, reused verbatim.
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() => setManageProfilesVisible(false)}
          statusBarTranslucent
          transparent
          visible={manageProfilesVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setManageProfilesVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.manageProfilesSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>{t('profile.managedProfiles.sheetTitle')}</Text>

                  <Text style={styles.sheetSubtitle}>
                    {t('profile.managedProfiles.sheetSubtitle')}
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel={t('common.close')}
                  onPress={() => setManageProfilesVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={theme.colors.accent}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={[
                  styles.manageProfilesList,
                  { paddingBottom: Math.max(insets.bottom, 14) + 14 },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {/* Tapping either row makes it the active profile across CycleHome/
                    Calendar/Statistics/Journal (activeProfileStore.ts) — the checkmark
                    reflects whichever one that currently is, never just the mother. */}
                <Pressable
                  accessibilityLabel={t('profile.managedProfiles.myProfile')}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: !isManagedProfileActive }}
                  onPress={() => switchToProfile(OWNER_PROFILE_ID)}
                  style={[styles.objectiveOption, !isManagedProfileActive && styles.objectiveOptionActive]}
                >
                  <View style={styles.profileRowAvatarWrap}>
                    {anonymousMode ? (
                      <AnonymousAvatar
                        color={anonymousAvatarColor}
                        size={44}
                        style={anonymousAvatarStyle}
                      />
                    ) : photoUri ? (
                      <Image
                        accessibilityIgnoresInvertColors
                        resizeMode="cover"
                        source={{ uri: photoUri }}
                        style={styles.profileRowAvatar}
                      />
                    ) : (
                      <View style={styles.profileRowAvatarFallback}>
                        <Text style={styles.profileRowAvatarFallbackText}>
                          {firstNameInitial}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.objectiveOptionCopy}>
                    <Text
                      style={[
                        styles.objectiveOptionTitle,
                        !isManagedProfileActive && styles.objectiveOptionTitleActive,
                      ]}
                    >
                      {anonymousMode ? t('profile.anonymousMode.title') : firstName || t('profile.notProvided')}
                    </Text>

                    <Text style={styles.objectiveOptionSubtitle}>{t('profile.managedProfiles.myProfile')}</Text>
                  </View>

                  {!isManagedProfileActive ? (
                    <View style={[styles.objectiveRadio, styles.objectiveRadioActive]}>
                      <MaterialDesignIcons
                        color={onPrimaryTextColor(theme)}
                        name="check"
                        size={15}
                      />
                    </View>
                  ) : (
                    <View style={styles.objectiveRadio} />
                  )}
                </Pressable>

                {/* Managed (daughter) profiles — tappable to switch (same as the mother's
                    row above), and swipeable right-to-left to reveal "Supprimer". Custom
                    photo when she chose one; otherwise the default fille.png illustration
                    (never the mother's own initials fallback). */}
                {managedProfiles.map(profile => {
                  const checked = activeManagedProfile?.id === profile.id;
                  return (
                    <ManagedProfileSwipeRow
                      deleteAccessibilityLabel={t('profile.managedProfiles.deleteProfileOf', {name: profile.firstName})}
                      forceClosed={openSwipeProfileId !== null && openSwipeProfileId !== profile.id}
                      key={profile.id}
                      onDeletePress={() => setProfileToDelete(profile)}
                      onSwipeOpen={() => setOpenSwipeProfileId(profile.id)}
                    >
                      <Pressable
                        accessibilityLabel={t('profile.managedProfiles.profileOf', {name: profile.firstName})}
                        accessibilityRole="radio"
                        accessibilityState={{ checked }}
                        onPress={() => switchToProfile(profile.id)}
                        style={[styles.objectiveOption, checked && styles.objectiveOptionActive]}
                      >
                        <Image
                          accessibilityIgnoresInvertColors
                          resizeMode={profile.profileImageUri ? 'cover' : 'contain'}
                          source={
                            profile.profileImageUri
                              ? {uri: profile.profileImageUri}
                              : MANAGED_PROFILE_DAUGHTER_ILLUSTRATION
                          }
                          style={styles.profileRowAvatar}
                        />

                        <View style={styles.objectiveOptionCopy}>
                          <Text style={[styles.objectiveOptionTitle, checked && styles.objectiveOptionTitleActive]}>
                            {profile.firstName}
                          </Text>
                          <Text style={styles.objectiveOptionSubtitle}>{t('profile.managedProfiles.myDaughter')}</Text>
                        </View>

                        {checked ? (
                          <View style={[styles.objectiveRadio, styles.objectiveRadioActive]}>
                            <MaterialDesignIcons
                              color={onPrimaryTextColor(theme)}
                              name="check"
                              size={15}
                            />
                          </View>
                        ) : (
                          <View style={styles.objectiveRadio} />
                        )}
                      </Pressable>
                    </ManagedProfileSwipeRow>
                  );
                })}

                <Pressable
                  accessibilityLabel={t('profile.managedProfiles.addProfile')}
                  accessibilityRole="button"
                  onPress={handleAddProfile}
                  style={({ pressed }) => [
                    styles.simpleAccountButton,
                    styles.addProfileButton,
                    pressed && styles.simpleAccountButtonPressed,
                  ]}
                >
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="plus"
                    size={18}
                  />

                  <Text style={styles.addProfileButtonText}>{t('profile.managedProfiles.addDaughterProfile')}</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <ManagedProfileDeleteConfirmModal
          onCancel={() => setProfileToDelete(null)}
          onConfirm={confirmDeleteManagedProfile}
          profile={profileToDelete}
        />

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
                  <Text style={styles.sheetTitle}>{t('profile.objectivePicker.title')}</Text>

                  <Text style={styles.sheetSubtitle}>
                    {t('profile.objectivePicker.subtitle')}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setObjectiveModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={theme.colors.accent}
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
                {objectivesList(t).map(item => {
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
                            color={onPrimaryTextColor(theme)}
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
                  <Text style={styles.sheetTitle}>{t('profile.spiritualMarkers.sectionTitle')}</Text>

                  <Text style={styles.sheetSubtitle}>
                    {t('profile.spiritualMarkers.modalSubtitle')}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSpiritualModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={theme.colors.accent}
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
                <Text style={styles.activationLabel}>{t('profile.spiritualMarkers.markersStateLabel')}</Text>

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
                        {t('profile.spiritualMarkers.yesActivate')}
                      </Text>

                      <Text
                        style={[
                          styles.activationDescription,

                          spiritualEnabled &&
                            styles.activationDescriptionActive,
                        ]}
                      >
                        {t('profile.spiritualMarkers.showFeatures')}
                      </Text>
                    </View>

                    {spiritualEnabled ? (
                      <View style={styles.activationCheck}>
                        <MaterialDesignIcons
                          color={theme.colors.primary}
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
                        {t('profile.spiritualMarkers.noDeactivate')}
                      </Text>

                      <Text
                        style={[
                          styles.activationDescription,

                          !spiritualEnabled &&
                            styles.activationDescriptionActive,
                        ]}
                      >
                        {t('profile.spiritualMarkers.hideFeatures')}
                      </Text>
                    </View>

                    {!spiritualEnabled ? (
                      <View style={styles.activationCheck}>
                        <MaterialDesignIcons
                          color={theme.colors.primary}
                          name="check"
                          size={17}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                </View>

                <View style={styles.featuresHeader}>
                  <Text style={styles.featuresTitle}>
                    {t('profile.spiritualMarkers.relatedFeaturesTitle')}
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
                      {spiritualEnabled ? t('profile.spiritualMarkers.enabledPlural') : t('profile.spiritualMarkers.disabledPlural')}
                    </Text>
                  </View>
                </View>

                <View style={styles.spiritualFeatures}>
                  {spiritualFeatures(t).map(feature => (
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
                          color={spiritualEnabled ? onPrimaryTextColor(theme) : theme.colors.textMuted}
                          name={spiritualEnabled ? 'check' : 'minus'}
                          size={14}
                        />
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.spiritualInfoBox}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="information-outline"
                    size={19}
                  />

                  <Text style={styles.spiritualInfoText}>
                    {t('profile.spiritualMarkers.canChangeAnytime')}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setSpiritualModalVisible(false)}
                  style={({ pressed }) => [
                    styles.doneButton,

                    pressed && styles.optionPressed,
                  ]}
                >
                  <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={19} />

                  <Text style={styles.doneButtonText}>{t('cycleHome.quickActions.done')}</Text>
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
                  <Text style={styles.sheetTitle}>{t('profile.accountInfoModal.title')}</Text>

                  <Text style={styles.sheetSubtitle}>
                    {t('profile.accountInfoModal.subtitle')}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setAccountInfoModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={theme.colors.accent}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <View style={[styles.accountInfoList, {paddingBottom: Math.max(insets.bottom, 14) + 14}]}>
                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>{t('profile.accountInfoModal.anonymousMode')}</Text>
                  <Text style={styles.accountInfoValue}>{t('profile.accountInfoModal.enabledValue')}</Text>
                </View>

                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>{t('profile.accountInfoModal.anonymousId')}</Text>
                  <Text style={styles.accountInfoValue}>{anonymousAccount?.id ?? '—'}</Text>
                </View>

                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>{t('profile.accountInfoModal.createdOn')}</Text>
                  <Text style={styles.accountInfoValue}>
                    {(() => {
                      if (!anonymousAccount) {
                        return '—';
                      }
                      // createdAt is a full ISO timestamp (see
                      // securityPreferences.ts) — a plain validity check is
                      // enough, no date-only noon anchor needed here.
                      const created = new Date(anonymousAccount.createdAt);
                      return Number.isNaN(created.getTime())
                        ? '—'
                        : formatFullDate(created);
                    })()}
                  </Text>
                </View>

                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>{t('profile.accountInfoModal.security')}</Text>
                  <Text style={styles.accountInfoValue}>
                    {securityLocked ? t('profile.accountInfoModal.pinBiometry') : t('profile.accountInfoModal.notConfigured')}
                  </Text>
                </View>

                <View style={[styles.accountInfoRow, styles.accountInfoRowLast]}>
                  <Text style={styles.accountInfoLabel}>{t('profile.accountInfoModal.sync')}</Text>
                  <Text style={styles.accountInfoValue}>{t('profile.accountInfoModal.localOnly')}</Text>
                </View>

                <View style={styles.spiritualInfoBox}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="information-outline"
                    size={19}
                  />

                  <Text style={styles.spiritualInfoText}>
                    {t('profile.accountInfoModal.dataPrivateInfo')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* =====================================================
            DAUGHTER CYCLE-SETTINGS EDITORS — "Durée du cycle" /
            "Durée des règles" / "Régularité du cycle" for a managed
            profile. Reuses the SAME sheet chrome as every other modal
            in this screen (objectiveSheet/sheetHandle/sheetHeader).
            Saving calls setCyclePreferences() — already profile-scoped
            — so it only ever touches whichever profile is active.
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() => setCycleDurationEditorVisible(false)}
          statusBarTranslucent
          transparent
          visible={cycleDurationEditorVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setCycleDurationEditorVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.objectiveSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>{t('profile.cycleDurationEditor.title')}</Text>
                  <Text style={styles.sheetSubtitle}>{t('profile.cycleDurationEditor.subtitle')}</Text>
                </View>
                <Pressable onPress={() => setCycleDurationEditorVisible(false)} style={styles.sheetClose}>
                  <MaterialDesignIcons color={theme.colors.accent} name="close" size={21} />
                </Pressable>
              </View>

              <View style={{paddingBottom: Math.max(insets.bottom, 14) + 14}}>
                <DurationStepper
                  max={CYCLE_DURATION_MAX}
                  min={CYCLE_DURATION_MIN}
                  onChange={setDraftCycleDuration}
                  unit={t('profile.durationStepper.unit')}
                  value={draftCycleDuration}
                />

                <View style={styles.editorActions}>
                  <Pressable
                    accessibilityLabel={t('common.cancel')}
                    accessibilityRole="button"
                    onPress={() => setCycleDurationEditorVisible(false)}
                    style={({pressed}) => [styles.editorCancelButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.editorCancelText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t('common.save')}
                    accessibilityRole="button"
                    onPress={saveCycleDuration}
                    style={({pressed}) => [styles.editorSaveButton, pressed && styles.pressed]}
                  >
                    <Text style={[styles.editorSaveText, {color: onPrimaryTextColor(theme)}]}>{t('common.save')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => setPeriodDurationEditorVisible(false)}
          statusBarTranslucent
          transparent
          visible={periodDurationEditorVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setPeriodDurationEditorVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.objectiveSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>{t('profile.periodDurationEditor.title')}</Text>
                  <Text style={styles.sheetSubtitle}>{t('profile.periodDurationEditor.subtitle')}</Text>
                </View>
                <Pressable onPress={() => setPeriodDurationEditorVisible(false)} style={styles.sheetClose}>
                  <MaterialDesignIcons color={theme.colors.accent} name="close" size={21} />
                </Pressable>
              </View>

              <View style={{paddingBottom: Math.max(insets.bottom, 14) + 14}}>
                <DurationStepper
                  max={PERIOD_DURATION_MAX}
                  min={PERIOD_DURATION_MIN}
                  onChange={setDraftPeriodDuration}
                  unit={t('profile.durationStepper.unit')}
                  value={draftPeriodDuration}
                />

                <View style={styles.editorActions}>
                  <Pressable
                    accessibilityLabel={t('common.cancel')}
                    accessibilityRole="button"
                    onPress={() => setPeriodDurationEditorVisible(false)}
                    style={({pressed}) => [styles.editorCancelButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.editorCancelText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t('common.save')}
                    accessibilityRole="button"
                    onPress={savePeriodDuration}
                    style={({pressed}) => [styles.editorSaveButton, pressed && styles.pressed]}
                  >
                    <Text style={[styles.editorSaveText, {color: onPrimaryTextColor(theme)}]}>{t('common.save')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          onRequestClose={() => setRegularityEditorVisible(false)}
          statusBarTranslucent
          transparent
          visible={regularityEditorVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setRegularityEditorVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.objectiveSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>{t('profile.regularityEditor.title')}</Text>
                  <Text style={styles.sheetSubtitle}>{t('profile.regularityEditor.subtitle')}</Text>
                </View>
                <Pressable onPress={() => setRegularityEditorVisible(false)} style={styles.sheetClose}>
                  <MaterialDesignIcons color={theme.colors.accent} name="close" size={21} />
                </Pressable>
              </View>

              <View style={{paddingBottom: Math.max(insets.bottom, 14) + 14}}>
                {/* Same 3 values AWA's own cycle onboarding already defines
                    (CycleInformationScreen.tsx) — never a new terminology. */}
                {(
                  [
                    {id: 'yes', label: t('journalIntimacy.yes')},
                    {id: 'no', label: t('journalIntimacy.no')},
                    {id: 'unknown', label: t('managedProfile.cycleSetup.unknown')},
                  ] as Array<{id: CyclePreferences['regularity']; label: string}>
                ).map(option => (
                  <Pressable
                    accessibilityLabel={option.label}
                    accessibilityRole="radio"
                    accessibilityState={{checked: draftRegularity === option.id}}
                    key={option.id}
                    onPress={() => setDraftRegularity(option.id)}
                    style={({pressed}) => [
                      styles.regularityChoice,
                      draftRegularity === option.id && styles.regularityChoiceSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.regularityChoiceText,
                        draftRegularity === option.id && styles.regularityChoiceTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <View style={[styles.objectiveRadio, draftRegularity === option.id && styles.objectiveRadioActive]}>
                      {draftRegularity === option.id ? (
                        <MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={15} />
                      ) : null}
                    </View>
                  </Pressable>
                ))}

                <View style={styles.editorActions}>
                  <Pressable
                    accessibilityLabel={t('common.cancel')}
                    accessibilityRole="button"
                    onPress={() => setRegularityEditorVisible(false)}
                    style={({pressed}) => [styles.editorCancelButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.editorCancelText}>{t('common.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t('common.save')}
                    accessibilityRole="button"
                    onPress={saveRegularity}
                    style={({pressed}) => [styles.editorSaveButton, pressed && styles.pressed]}
                  >
                    <Text style={[styles.editorSaveText, {color: onPrimaryTextColor(theme)}]}>{t('common.save')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* =====================================================
            MANAGED PROFILE INFO MODAL — read-only "Informations
            personnelles" for a daughter, resolved from HER OWN
            ManagedProfile record only (firstName/birthDate/photo),
            never the mother's account name/email/date of naissance.
        ===================================================== */}

        <Modal
          animationType="fade"
          onRequestClose={() => setManagedProfileInfoModalVisible(false)}
          statusBarTranslucent
          transparent
          visible={managedProfileInfoModalVisible}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              onPress={() => setManagedProfileInfoModalVisible(false)}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.objectiveSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetTitle}>{t('profile.personalInfo.title')}</Text>

                  <Text style={styles.sheetSubtitle}>
                    {t('profile.managedProfileInfoModal.subtitle', {
                      name: activeManagedProfile?.firstName ?? t('profile.managedProfileInfoModal.thisProfile'),
                    })}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setManagedProfileInfoModalVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={theme.colors.accent}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <View style={[styles.accountInfoList, {paddingBottom: Math.max(insets.bottom, 14) + 14}]}>
                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>{t('profile.managedProfileInfoModal.firstNameLabel')}</Text>
                  <Text style={styles.accountInfoValue}>{activeManagedProfile?.firstName ?? '—'}</Text>
                </View>

                <View style={styles.accountInfoRow}>
                  <Text style={styles.accountInfoLabel}>{t('profile.managedProfileInfoModal.birthDateLabel')}</Text>
                  <Text style={styles.accountInfoValue}>
                    {(() => {
                      const parsed = parseStoredDateOnly(activeManagedProfile?.birthDate);
                      return parsed ? formatFullDate(parsed) : t('profile.notProvidedFeminine');
                    })()}
                  </Text>
                </View>

                <View style={[styles.accountInfoRow, styles.accountInfoRowLast]}>
                  <Text style={styles.accountInfoLabel}>{t('profile.managedProfileInfoModal.ageLabel')}</Text>
                  <Text style={styles.accountInfoValue}>
                    {(() => {
                      const parsed = parseStoredDateOnly(activeManagedProfile?.birthDate);
                      return parsed ? formatAgeInYears(parsed) : t('profile.notProvided');
                    })()}
                  </Text>
                </View>

                <View style={styles.spiritualInfoBox}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="information-outline"
                    size={19}
                  />

                  <Text style={styles.spiritualInfoText}>
                    {t('profile.managedProfileInfoModal.linkedAccountInfo')}
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
                  <Text style={styles.sheetTitle}>{t('profile.photoModal.editTitle')}</Text>
                </View>

                <Pressable
                  onPress={() => setPhotoSheetVisible(false)}
                  style={styles.sheetClose}
                >
                  <MaterialDesignIcons
                    color={theme.colors.accent}
                    name="close"
                    size={21}
                  />
                </Pressable>
              </View>

              <View style={{paddingBottom: Math.max(insets.bottom, 14) + 14}}>
                <MenuRow
                  icon="camera-outline"
                  onPress={() => choosePhoto(true)}
                  subtitle={t('profile.photoModal.useCameraSubtitle')}
                  title={t('profile.photoModal.takePhoto')}
                />

                <View style={styles.menuDivider} />

                <MenuRow
                  icon="image-outline"
                  onPress={() => choosePhoto(false)}
                  subtitle={t('profile.photoModal.selectExistingSubtitle')}
                  title={t('profile.photoModal.chooseFromGallery')}
                />

                {photoUri ? (
                  <>
                    <View style={styles.menuDivider} />

                    <MenuRow
                      icon="delete-outline"
                      onPress={removePhoto}
                      subtitle={t('profile.photoModal.revertToDefaultSubtitle')}
                      title={t('profile.photoModal.removePhoto')}
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

// PHASE E2 — converted to a createStyles(theme) factory, same pattern as
// every migrated dashboard/screen since D1/E1. Structural/geometry values
// are untouched; decorative colors are theme-derived. PremiumProfileCard's
// own styles (below) are DELIBERATELY left as fixed literals — its violet/
// gold brand identity is intentionally distinct from the resolved app
// theme (Step 17) — as are MENU_TONES's 9 action-identity palettes and the
// per-objective `tint` values (Category E, unchanged elsewhere in this
// file). See PHASE E2 report for the full classification.
function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  page: {
  flex: 1,
  backgroundColor: theme.colors.background,
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
  backgroundColor: withAlpha(theme.colors.primary, 0.07),
},

pageGlowMiddle: {
  position: 'absolute',
  top: '38%',
  left: -130,
  width: 260,
  height: 260,
  borderRadius: 130,
  backgroundColor: withAlpha(theme.colors.primary, 0.045),
},

pageGlowBottom: {
  position: 'absolute',
  bottom: -150,
  right: -100,
  width: 310,
  height: 310,
  borderRadius: 155,
  backgroundColor: withAlpha(theme.colors.primary, 0.05),
},
  // Fixed brand identity — see the header comment above (Step 17).
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
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '700',
  },

  headerSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  // Compact header icon button — same chrome already used for this exact purpose
  // elsewhere in the header row (44px, subtle border + soft surface).
  manageProfilesButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.16),
    borderRadius: 16,
    backgroundColor: withAlpha(theme.colors.surface, 0.92),
  },

  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.danger,
  },

  /* ========================================================
   * IDENTITY CARD — compact premium version
   * ======================================================== */

  identityCard: {
    overflow: 'hidden',
    marginTop: 14,
    minHeight: 108,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.11),
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: theme.shadow.shadowColor,
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
    backgroundColor: withAlpha(theme.colors.surface, 0.82),
  },

  identityDecorTopRight: {
    position: 'absolute',
    top: -42,
    right: -30,
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: withAlpha(theme.colors.primary, 0.055),
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
    backgroundColor: withAlpha(theme.colors.surface, 0.86),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
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
    borderColor: theme.colors.surface,
  },

  avatarFallback: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.primarySoft,
  },

  avatarFallbackText: {
    color: theme.colors.primary,
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
    borderColor: theme.colors.surface,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
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
    color: theme.colors.primary,
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
    color: theme.colors.text,
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
    backgroundColor: withAlpha(theme.colors.surface, 0.88),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.12),
  },

  identityTitle: {
    flexShrink: 1,
    color: theme.colors.text,
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
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 14,
  },

  // Generic "toggle currently on" status — theme.colors.success, same
  // convention as every migrated dashboard's completion indicators.
  activeBadge: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: withAlpha(theme.colors.success, 0.16),
  },

  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },

  activeBadgeText: {
    color: theme.colors.success,
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
    backgroundColor: withAlpha(theme.colors.surface, 0.72),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.09),
  },

  identityPrivacyText: {
    color: theme.colors.textSecondary,
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
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.surface, 0.9),
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  statIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
  },

  statValue: {
    marginTop: 9,
    color: theme.colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },

  statLabel: {
    marginTop: 1,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.09),
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  sectionTitle: {
    marginLeft: 9,
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },

  sectionSubtitle: {
    marginTop: 5,
    marginLeft: 43,
    color: theme.colors.textSecondary,
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
    borderColor: withAlpha(theme.colors.primary, 0.10),
    borderRadius: 18,
    backgroundColor: withAlpha(theme.colors.surface, 0.96),
    shadowColor: theme.shadow.shadowColor,
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
    backgroundColor: withAlpha(theme.colors.primary, 0.10),
  },

  menuIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },

  // Dead/unused (MenuRow sources its icon background from MENU_TONES
  // inline instead) — left as literals, untouched (out of E2 scope).
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
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },

  menuSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15.5,
  },

  menuStatus: {
    marginTop: 3,
    color: theme.colors.primary,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
  },

  menuChevron: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: theme.colors.primarySoft,
  },

  securityRecommendationCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.warning, 0.28),
    borderRadius: 20,
    backgroundColor: withAlpha(theme.colors.warning, 0.10),
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
    backgroundColor: withAlpha(theme.colors.warning, 0.20),
  },

  securityRecommendationCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  securityRecommendationTitle: {
    color: theme.colors.text,
    fontSize: 13.5,
    fontWeight: '700',
  },

  securityRecommendationText: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },

  securityRecommendationCta: {
    flexShrink: 0,
    borderRadius: 12,
    backgroundColor: theme.colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  securityRecommendationCtaText: {
    color: pickReadableTextColor(theme.colors.warning),
    fontSize: 11.5,
    fontWeight: '700',
  },

  spiritualCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.18),
    borderRadius: 24,
    backgroundColor: withAlpha(theme.colors.surface, 0.94),
    padding: 14,
  },

  spiritualCardDisabled: {
    borderColor: withAlpha(theme.colors.textMuted, 0.22),
    backgroundColor: theme.colors.surfaceSecondary,
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
    backgroundColor: theme.colors.primarySoft,
  },

  spiritualIconCircleDisabled: {
    backgroundColor: theme.colors.surfaceSecondary,
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
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
  },

  spiritualTitleDisabled: {
    color: theme.colors.textMuted,
  },

  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  statusBadgeActive: {
    backgroundColor: withAlpha(theme.colors.success, 0.16),
  },

  statusBadgeInactive: {
    backgroundColor: theme.colors.surfaceSecondary,
  },

  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  statusBadgeTextActive: {
    color: theme.colors.success,
  },

  statusBadgeTextInactive: {
    color: theme.colors.textMuted,
  },

  spiritualText: {
    marginTop: 5,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
  },

  spiritualTextDisabled: {
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.surfaceSecondary,
    paddingHorizontal: 10,
  },

  spiritualMiniFeatureDisabled: {
    backgroundColor: withAlpha(theme.colors.textMuted, 0.12),
  },

  spiritualMiniEmoji: {
    width: 28,
    fontSize: 17,
  },

  spiritualMiniText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
  },

  spiritualMiniTextDisabled: {
    color: theme.colors.textMuted,
  },

  manageButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 13,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
  },

  manageButtonText: {
    color: onPrimaryTextColor(theme),
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

  // Destructive action — theme.colors.danger, preserving semantic identity
  // (Step 15). Never becomes theme.primary regardless of active palette.
  signOut: {
    borderColor: withAlpha(theme.colors.danger, 0.30),
    backgroundColor: withAlpha(theme.colors.surface, 0.72),
  },

  signOutText: {
    color: theme.colors.danger,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  // "Se déconnecter ?" confirmation — same destructive-confirmation visual pattern
  // already established elsewhere in AWA (QadaaDeleteConfirmModal.tsx / the AWA à deux
  // partner profile's own logout dialog): fade-in transparent Modal, dismiss-on-backdrop-
  // tap, danger-tinted icon circle, serif title, centered body, bordered "cancel" + solid
  // destructive button. Nothing here is hardcoded — every color comes from `theme`.
  logoutDialogRoot: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20},
  logoutDialogBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: withAlpha(theme.shadow.shadowColor, 0.5)},
  logoutDialogCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    elevation: 12,
  },
  logoutDialogIconCircle: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.danger, 0.3),
    backgroundColor: withAlpha(theme.colors.danger, 0.12),
  },
  logoutDialogTitle: {
    marginTop: 14,
    color: theme.colors.text,
    fontFamily: 'serif',
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 27,
    textAlign: 'center',
  },
  logoutDialogBody: {marginTop: 10, color: theme.colors.textSecondary, fontSize: 13.5, lineHeight: 20, textAlign: 'center'},
  logoutDialogReassurance: {marginTop: 6, color: theme.colors.textSecondary, fontSize: 12.5, lineHeight: 18, textAlign: 'center'},
  logoutDialogActions: {marginTop: 20, flexDirection: 'row', gap: 10, alignSelf: 'stretch'},
  logoutDialogButton: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: 10,
  },
  logoutDialogCancelButton: {borderWidth: 1.4, borderColor: theme.colors.primary, backgroundColor: theme.colors.surface},
  logoutDialogCancelText: {color: theme.colors.primary, fontSize: 15, fontWeight: '700'},
  logoutDialogDestructiveButton: {backgroundColor: theme.colors.danger},
  logoutDialogDestructiveText: {fontSize: 15, fontWeight: '700'},
  logoutDialogPressed: {opacity: 0.85},

  anonymousExit: {
    borderColor: withAlpha(theme.colors.primary, 0.28),
    backgroundColor: withAlpha(theme.colors.surface, 0.72),
  },

  anonymousExitText: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  /* MODAL */

  // Fixed modal scrim — never themed, same precedent as every migrated
  // dashboard's modal backdrop.
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
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  spiritualSheet: {
    maxHeight: '90%',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // "Gérer les profils" — same bottom-sheet shell as objectiveSheet/spiritualSheet
  // above (SAME radius/surface/padding), kept intentionally shorter/more compact since
  // it only ever holds the current profile row + "Ajouter un profil" today.
  manageProfilesSheet: {
    maxHeight: '70%',
    overflow: 'hidden',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  manageProfilesList: {
    gap: 12,
    paddingTop: 2,
  },

  sheetHandle: {
    width: 46,
    height: 5,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 3,
    backgroundColor: withAlpha(theme.colors.primary, 0.28),
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
    color: theme.colors.accent,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
  },

  sheetSubtitle: {
    marginTop: 4,
    color: theme.colors.textSecondary,
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
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
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
    borderBottomColor: withAlpha(theme.colors.primary, 0.12),
  },

  accountInfoRowLast: {
    borderBottomWidth: 0,
  },

  accountInfoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },

  accountInfoValue: {
    color: theme.colors.accent,
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* DAUGHTER CYCLE-SETTINGS EDITORS — stepper + Annuler/Enregistrer actions,
     same visual language as ManagedProfileCycleSetupScreen.tsx's own
     stepper/helper cards, and the regularity radio choice reuses
     objectiveOption/objectiveRadio(Active) above. */
  stepperCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  stepperButton: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  stepperButtonDisabled: {opacity: 0.35},
  stepperValueBox: {flex: 1, alignItems: 'center'},
  stepperValue: {color: theme.colors.text, fontSize: 16, fontWeight: '700'},

  regularityChoice: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  regularityChoiceSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  regularityChoiceText: {color: theme.colors.text, fontSize: 13.5, fontWeight: '600'},
  regularityChoiceTextSelected: {color: theme.colors.accent, fontWeight: '700'},

  editorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  editorCancelButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.2),
  },
  editorCancelText: {color: theme.colors.textSecondary, fontSize: 13.5, fontWeight: '700'},
  editorSaveButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
  },
  editorSaveText: {fontSize: 13.5, fontWeight: '700'},

  objectiveOption: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },

  objectiveOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },

  // Per-objective `tint` (from the OBJECTIVES array) stays a fixed literal
  // — a decorative identity badge for each of the 8 objectives, not a
  // themed role (Category E, same reasoning as MENU_TONES above).
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
    color: theme.colors.text,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
  },

  objectiveOptionTitleActive: {
    color: theme.colors.accent,
    fontWeight: '800',
  },

  objectiveOptionSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
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
    borderColor: withAlpha(theme.colors.primary, 0.30),
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
  },

  objectiveRadioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  /* "GÉRER LES PROFILS" — the current-profile row reuses objectiveOption/
     objectiveOptionActive/objectiveOptionCopy/objectiveRadio(Active) above (same
     selectable-row shell already used for "Modifier mon objectif"); only the avatar and
     the "Ajouter un profil" action are specific to this sheet. Proportioned like the
     identity card's own avatar (64/24 → scaled to 44/17 here). */
  profileRowAvatarWrap: {width: 44, height: 44, flexShrink: 0},
  profileRowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  profileRowAvatarFallback: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.primarySoft,
  },
  profileRowAvatarFallbackText: {
    color: theme.colors.primary,
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
  },

  // Same pill-button skeleton as signOut/anonymousExit (simpleAccountButton +
  // simpleAccountButtonPressed), only the color variant is new — a soft primary/lilac
  // action, never a hardcoded color.
  addProfileButton: {
    borderColor: withAlpha(theme.colors.primary, 0.35),
    backgroundColor: theme.colors.primarySoft,
  },
  addProfileButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },

  /* SPIRITUAL SHEET */

  spiritualSheetTitleIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },

  spiritualHeaderEmoji: {
    fontSize: 23,
  },

  spiritualSheetContent: {
    paddingTop: 2,
  },

  activationLabel: {
    marginBottom: 9,
    color: theme.colors.accent,
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
    borderColor: withAlpha(theme.colors.primary, 0.16),
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  activationChoiceActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.shadow.shadowColor,
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
    borderColor: withAlpha(theme.colors.primary, 0.45),
    borderRadius: 11,
  },

  activationRadioActive: {
    borderColor: withAlpha(onPrimaryTextColor(theme), 0.7),
  },

  activationRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: onPrimaryTextColor(theme),
  },

  activationCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  activationTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  activationTitleActive: {
    color: onPrimaryTextColor(theme),
  },

  activationDescription: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  activationDescriptionActive: {
    color: withAlpha(onPrimaryTextColor(theme), 0.85),
  },

  activationCheck: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },

  featuresStatus: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  featuresStatusActive: {
    backgroundColor: withAlpha(theme.colors.success, 0.16),
  },

  featuresStatusDisabled: {
    backgroundColor: theme.colors.surfaceSecondary,
  },

  featuresStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  featuresStatusTextActive: {
    color: theme.colors.success,
  },

  featuresStatusTextDisabled: {
    color: theme.colors.textMuted,
  },

  spiritualFeatures: {
    gap: 8,
  },

  spiritualFeatureCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 17,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },

  spiritualFeatureCardDisabled: {
    borderColor: withAlpha(theme.colors.textMuted, 0.18),
    backgroundColor: theme.colors.surfaceSecondary,
  },

  spiritualFeatureIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
  },

  spiritualFeatureIconDisabled: {
    backgroundColor: withAlpha(theme.colors.textMuted, 0.14),
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
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  spiritualFeatureTitleDisabled: {
    color: theme.colors.textMuted,
  },

  spiritualFeatureDescription: {
    marginTop: 2,
    color: theme.colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 15,
  },

  spiritualFeatureDescriptionDisabled: {
    color: theme.colors.textMuted,
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
    backgroundColor: theme.colors.primary,
  },

  featureStateIconDisabled: {
    backgroundColor: withAlpha(theme.colors.textMuted, 0.25),
  },

  spiritualInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  spiritualInfoText: {
    flex: 1,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.primary,
  },

  doneButtonText: {
    color: onPrimaryTextColor(theme),
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
}

export default ProfileScreen;