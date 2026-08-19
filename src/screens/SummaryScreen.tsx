import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  spacing,
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../theme/spacing';
import {
  getCyclePreferences,
  getSelectedLocation,
  getSelectedObjective,
  getSpiritualMarkersEnabled,
  type ObjectiveId,
} from '../state/onboardingPreferences';
import {
  ALL_PREGNANCY_TRACKING_PREFERENCES,
  getPregnancyDating,
  getPregnancyReminderPreferences,
  getPregnancyTrackingPreferences,
  type PregnancyDatingMethod,
  type PregnancyReminderPreferences,
  type PregnancyTrackingPreference,
} from '../state/pregnancyPreferences';
import {
  getPostpartumPreferences,
  type PostpartumDeliveryType,
  type PostpartumFeedingType,
} from '../state/postpartumPreferences';
import {
  getMiscarriagePreferences,
  type MiscarriageBleedingStatus,
  type MiscarriageCycleReturnStatus,
  type MiscarriageTryingAgainStatus,
} from '../state/miscarriagePreferences';
import {getConceptionPreferences, type ConceptionReminderKey, type ConceptionTryingDuration, type FertilityIndicator, type OvulationAwareness} from '../state/conceptionPreferences';
import {getPrivacySecuritySettings, isBiometricEnabled, isPinEnabled} from '../state/securityPreferences';

const WOMAN = require('../assets/images/summary-woman.png');

const PURPLE = '#6B4BC4';
const PURPLE_DARK = '#28166F';
const PURPLE_SOFT = '#F2ECFB';
const PURPLE_PALE = '#FAF7FE';
const TEXT_MUTED = '#6B6188';
const BORDER = 'rgba(105,73,190,0.14)';

const objectiveLabels: Record<ObjectiveId, string> = {
  cycle: 'Suivre mon cycle',
  conceive: 'Essayer de concevoir',
  contraception: 'Contraception',
  irregular: 'Cycles irréguliers (SOPK)',
  menopause: 'Post-ménopause / Ménopause',
  pregnancy: 'Suivi de grossesse',
  postpartum: 'Post-partum',
  loss: 'Après une fausse couche',
};

const DATING_METHOD_LABELS: Record<PregnancyDatingMethod, string> = {
  lastPeriod: 'Premier jour de mes dernières règles',
  dueDate: 'Date prévue d’accouchement',
  conceptionDate: 'Date estimée de conception',
  later: 'À renseigner plus tard',
};

// Dynamic label for the "date de référence" card — only shown for the
// three methods that actually carry a real selected date.
const DATING_REFERENCE_LABELS: Record<Exclude<PregnancyDatingMethod, 'later'>, string> = {
  lastPeriod: 'Dernières règles',
  dueDate: 'Date prévue d’accouchement',
  conceptionDate: 'Date estimée de conception',
};

// Same category order/wording as PregnancyTrackingPreferencesScreen.tsx.
const TRACKING_PREFERENCE_LABELS: Record<PregnancyTrackingPreference, string> = {
  symptoms: 'Symptômes',
  mood: 'Humeur',
  weight: 'Poids',
  sleep: 'Sommeil',
  hydration: 'Hydratation',
  activity: 'Activité physique',
  notes: 'Notes personnelles',
  medicalInfo: 'Informations médicales personnelles',
  appointments: 'Rendez-vous et examens',
};

// Same order/wording as PregnancyRemindersScreen.tsx.
const REMINDER_PREFERENCE_ORDER: Array<keyof PregnancyReminderPreferences> = [
  'appointments', 'exams', 'dailyJournal', 'customReminders',
];
const REMINDER_PREFERENCE_LABELS: Record<keyof PregnancyReminderPreferences, string> = {
  appointments: 'Rendez-vous',
  exams: 'Examens',
  dailyJournal: 'Journal quotidien',
  customReminders: 'Rappels personnalisés',
};

// Same wording as PostpartumDeliveryTypeScreen/PostpartumFeedingScreen.
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
  variable: 'Je ne sais pas / cela varie',
};

const CYCLE_RETURN_STATUS_LABELS: Record<MiscarriageCycleReturnStatus, string> = {
  yes: 'Oui, mes règles sont revenues',
  no: 'Non, pas encore',
  unknown: 'Je ne sais pas encore',
};

const TRYING_AGAIN_STATUS_LABELS: Record<MiscarriageTryingAgainStatus, string> = {
  not_now: 'Pas maintenant',
  soon: 'Bientôt',
  ready: 'Oui, je me sens prête',
};
const CONCEPTION_DURATION_LABELS: Record<ConceptionTryingDuration, string> = {starting_now:'Je commence maintenant',under_3_months:'Moins de 3 mois','3_to_6_months':'3 à 6 mois','6_to_12_months':'6 à 12 mois',over_1_year:'Plus d’un an'};
const OVULATION_AWARENESS_LABELS: Record<OvulationAwareness, string> = {often:'Oui, souvent',sometimes:'Parfois',not_really:'Non, pas vraiment'};
const INDICATOR_LABELS: Record<FertilityIndicator, string> = {temperature:'Température basale',cervical_mucus:'Glaire cervicale',lh_tests:'Tests LH',intercourse:'Rapports'};
const CONCEPTION_REMINDER_LABELS: Record<ConceptionReminderKey, string> = {fertile_window:'Fenêtre fertile',estimated_ovulation:'Ovulation estimée',temperature:'Température basale',lh_test:'Test LH',daily_journal:'Journal quotidien',intercourse:'Rapports'};

const formatSummaryDate = (date: Date): string =>
  new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}).format(date);

// Compact "3 premiers · +N" preview, or the neutral "tout sélectionné"
// phrasing when every option is active — matches the Pregnancy Summary
// reference exactly ("9 éléments sélectionnés" / "5 rappels activés").
const summarizeSelection = (selectedLabels: string[], totalCount: number, allSelectedLabel: string): string => {
  if (selectedLabels.length === 0) {return 'Aucun sélectionné';}
  if (selectedLabels.length === totalCount) {return allSelectedLabel;}
  const PREVIEW_COUNT = 3;
  const preview = selectedLabels.slice(0, PREVIEW_COUNT).join(' · ');
  const remaining = selectedLabels.length - PREVIEW_COUNT;
  return remaining > 0 ? `${preview} · +${remaining}` : preview;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Summary'>;

type EditableRoute =
  | 'Objective'
  | 'SpiritualPreferences'
  | 'Location'
  | 'CycleInformation'
  | 'PregnancyDatingSetup'
  | 'PregnancyTrackingPreferences'
  | 'PregnancyReminders'
  | 'PostpartumDeliveryDate'
  | 'PostpartumDeliveryType'
  | 'PostpartumFeeding'
  | 'MiscarriageDate'
  | 'MiscarriageBleeding'
  | 'MiscarriageCycleReturn'
  | 'MiscarriageTryingAgain'
  | 'ConceptionTryingDuration'
  | 'ConceptionOvulationAwareness'
  | 'ConceptionIndicators'
  | 'ConceptionReminders'
  | 'SecuritySetup'
  | 'Privacy';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type SummaryRow = {
  icon: IconName;
  label: string;
  value: string;
  route: EditableRoute;
  tone: 'purple' | 'rose' | 'blue' | 'green';
};

const TONE_ICON_COLOR: Record<SummaryRow['tone'], string> = {
  purple: '#6B4BC4',
  rose: '#C2568B',
  blue: '#3E7BC4',
  green: '#3FA372',
};

function SummaryScreen({navigation}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const isSmallScreen = width < 375 || height < 720;
  const isVerySmallScreen = width < 345 || height < 650;

  const objective = getSelectedObjective();
  const spiritualEnabled = getSpiritualMarkersEnabled();
  const location = getSelectedLocation();

  const objectiveRow: SummaryRow = {
    icon: 'calendar-heart',
    label: 'Objectif principal',
    value: objectiveLabels[objective],
    route: 'Objective',
    tone: 'purple',
  };
  const spiritualRow: SummaryRow = {
    icon: 'star-crescent',
    label: 'Repères spirituels',
    value: spiritualEnabled ? 'Activés' : 'Désactivés',
    route: 'SpiritualPreferences',
    tone: 'rose',
  };
  const locationRow: SummaryRow = {
    icon: 'map-marker-outline',
    label: 'Localisation',
    value: location ? `${location.city}, ${location.country}` : 'Non renseignée',
    route: 'Location',
    tone: 'green',
  };

  const buildCycleRows = (): SummaryRow[] => {
    const cycle = getCyclePreferences();
    const regularityLabels = {
      yes: 'Oui',
      no: 'Non',
      unknown: 'À observer',
    } as const;

    return [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'calendar-month-outline',
        label: 'Dernières règles',
        value: formatSummaryDate(cycle.lastPeriodStart),
        route: 'CycleInformation',
        tone: 'rose',
      },
      {
        icon: 'water-outline',
        label: 'Durée moyenne des règles',
        value: `${cycle.periodDuration} jours`,
        route: 'CycleInformation',
        tone: 'purple',
      },
      {
        icon: 'sync',
        label: 'Durée moyenne du cycle',
        value: `${cycle.cycleDuration} jours`,
        route: 'CycleInformation',
        tone: 'blue',
      },
      {
        icon: 'shield-check-outline',
        label: 'Cycle régulier',
        value: regularityLabels[cycle.regularity],
        route: 'CycleInformation',
        tone: 'green',
      },
    ];
  };

  const buildPregnancyRows = (): SummaryRow[] => {
    const dating = getPregnancyDating();
    const datingDate = dating.date ? new Date(dating.date) : null;
    const trackingSelection = getPregnancyTrackingPreferences();
    const reminderPreferences = getPregnancyReminderPreferences();

    const trackingLabels = ALL_PREGNANCY_TRACKING_PREFERENCES
      .filter(id => trackingSelection.has(id))
      .map(id => TRACKING_PREFERENCE_LABELS[id]);
    const reminderLabels = REMINDER_PREFERENCE_ORDER
      .filter(id => reminderPreferences[id])
      .map(id => REMINDER_PREFERENCE_LABELS[id]);

    const rows: SummaryRow[] = [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'human-pregnant',
        label: 'Datation de la grossesse',
        value: DATING_METHOD_LABELS[dating.method],
        route: 'PregnancyDatingSetup',
        tone: 'purple',
      },
    ];

    // Only shown once a real date exists — never a fake reference date for
    // the "later" method (see PregnancyDatingSetupScreen/pregnancyPreferences.ts).
    if (dating.method !== 'later' && datingDate) {
      rows.push({
        icon: 'calendar-month-outline',
        label: DATING_REFERENCE_LABELS[dating.method],
        value: formatSummaryDate(datingDate),
        route: 'PregnancyDatingSetup',
        tone: 'rose',
      });
    }

    rows.push(
      {
        icon: 'clipboard-check-outline',
        label: 'Suivi quotidien',
        value: summarizeSelection(
          trackingLabels,
          ALL_PREGNANCY_TRACKING_PREFERENCES.length,
          `${ALL_PREGNANCY_TRACKING_PREFERENCES.length} éléments sélectionnés`,
        ),
        route: 'PregnancyTrackingPreferences',
        tone: 'blue',
      },
      {
        icon: 'bell-ring-outline',
        label: 'Rappels',
        value: summarizeSelection(
          reminderLabels,
          REMINDER_PREFERENCE_ORDER.length,
          `${REMINDER_PREFERENCE_ORDER.length} rappels activés`,
        ),
        route: 'PregnancyReminders',
        tone: 'green',
      },
    );

    return rows;
  };

  // Postpartum-only rows — the NEW onboarding configuration for this
  // objective (deliveryDate/deliveryType/feedingType from
  // postpartumPreferences.ts). Deliberately excludes Cycle rows (last
  // period/cycle duration/regularity) and Pregnancy rows (dating
  // method/week/DPA) — those belong to other objectives.
  const buildPostpartumRows = (): SummaryRow[] => {
    const postpartum = getPostpartumPreferences();
    const deliveryDate = postpartum.deliveryDate ? new Date(`${postpartum.deliveryDate}T12:00:00`) : null;

    return [
      objectiveRow,
      spiritualRow,
      locationRow,
      {
        icon: 'calendar-month-outline',
        label: 'Date d’accouchement',
        value: deliveryDate ? formatSummaryDate(deliveryDate) : 'Non renseignée',
        route: 'PostpartumDeliveryDate',
        tone: 'rose',
      },
      {
        icon: 'baby-face-outline',
        label: 'Type d’accouchement',
        value: postpartum.deliveryType ? DELIVERY_TYPE_LABELS[postpartum.deliveryType] : 'Non renseigné',
        route: 'PostpartumDeliveryType',
        tone: 'purple',
      },
      {
        icon: 'baby-bottle-outline',
        label: 'Allaitement',
        value: postpartum.feedingType ? FEEDING_TYPE_LABELS[postpartum.feedingType] : 'Non renseigné',
        route: 'PostpartumFeeding',
        tone: 'blue',
      },
    ];
  };

  const buildConceptionRows = (): SummaryRow[] => {
    const conception = getConceptionPreferences();
    const rows: SummaryRow[] = [objectiveRow, spiritualRow];
    if (spiritualEnabled && location) {rows.push(locationRow);}
    rows.push(
      {icon:'calendar-clock',label:'Essais de conception',value:conception.tryingDuration ? CONCEPTION_DURATION_LABELS[conception.tryingDuration] : 'Non renseigné',route:'ConceptionTryingDuration',tone:'rose'},
      {icon:'target',label:'Repérage de l’ovulation',value:conception.ovulationAwareness ? OVULATION_AWARENESS_LABELS[conception.ovulationAwareness] : 'Non renseigné',route:'ConceptionOvulationAwareness',tone:'purple'},
      {icon:'chart-timeline-variant',label:'Indicateurs suivis',value:summarizeSelection(conception.indicators.map(id => INDICATOR_LABELS[id]),4,'Tous les indicateurs'),route:'ConceptionIndicators',tone:'blue'},
      {icon:'bell-ring-outline',label:'Rappels',value:summarizeSelection((Object.keys(conception.reminders) as ConceptionReminderKey[]).filter(id => conception.reminders[id]).map(id => CONCEPTION_REMINDER_LABELS[id]),6,'Tous les rappels'),route:'ConceptionReminders',tone:'green'},
    );
    return rows;
  };

  // "Après une fausse couche"-only rows — sourced entirely from
  // miscarriagePreferences.ts (spec section 25: no duplicated Summary
  // state). Deliberately excludes Cycle rows (last period/cycle duration/
  // regularity) and Pregnancy rows (dating/week/DPA) — this objective is
  // separate from both (spec sections 23-24). The location row is only
  // included when spiritual landmarks were enabled AND a real location was
  // collected — when disabled, LocationScreen was skipped entirely and no
  // fake location must ever be shown (spec section 22.3).
  const buildMiscarriageRows = (): SummaryRow[] => {
    const miscarriage = getMiscarriagePreferences();
    const miscarriageDate = miscarriage.miscarriageDate ? new Date(`${miscarriage.miscarriageDate}T12:00:00`) : null;
    const firstReturnedPeriodDate = miscarriage.firstReturnedPeriodDate
      ? new Date(`${miscarriage.firstReturnedPeriodDate}T12:00:00`)
      : null;

    const rows: SummaryRow[] = [objectiveRow, spiritualRow];

    if (spiritualEnabled && location) {
      rows.push(locationRow);
    }

    rows.push(
      {
        icon: 'calendar-heart',
        label: 'Date de la fausse couche',
        value: miscarriageDate ? formatSummaryDate(miscarriageDate) : 'Non renseignée',
        route: 'MiscarriageDate',
        tone: 'rose',
      },
      {
        icon: 'water-outline',
        label: 'Saignements actuels',
        value: miscarriage.bleedingStatus ? BLEEDING_STATUS_LABELS[miscarriage.bleedingStatus] : 'Non renseigné',
        route: 'MiscarriageBleeding',
        tone: 'purple',
      },
      {
        icon: 'calendar-sync-outline',
        label: 'Retour du cycle',
        value: miscarriage.cycleReturnStatus ? CYCLE_RETURN_STATUS_LABELS[miscarriage.cycleReturnStatus] : 'Non renseigné',
        route: 'MiscarriageCycleReturn',
        tone: 'blue',
      },
    );

    // Only shown once a real date exists — never a fake reference date when
    // the "yes" answer was given without a date (spec section 22.7).
    if (miscarriage.cycleReturnStatus === 'yes' && firstReturnedPeriodDate) {
      rows.push({
        icon: 'calendar-check-outline',
        label: 'Premières règles revenues',
        value: formatSummaryDate(firstReturnedPeriodDate),
        route: 'MiscarriageCycleReturn',
        tone: 'green',
      });
    }

    rows.push({
      icon: 'heart-outline',
      label: 'Reprise des essais',
      value: miscarriage.tryingAgainStatus ? TRYING_AGAIN_STATUS_LABELS[miscarriage.tryingAgainStatus] : 'Non renseigné',
      route: 'MiscarriageTryingAgain',
      tone: 'green',
    });

    return rows;
  };

  const objectiveRows: SummaryRow[] =
    objective === 'pregnancy' ? buildPregnancyRows()
      : objective === 'postpartum' ? buildPostpartumRows()
        : objective === 'loss' ? buildMiscarriageRows()
          : objective === 'conceive' ? buildConceptionRows()
          : buildCycleRows();
  const privacy = getPrivacySecuritySettings();
  const securityLabels = [isPinEnabled() ? 'PIN activé' : null, isBiometricEnabled() ? 'Biométrie activée' : null].filter((value): value is string => Boolean(value));
  const privacyLabels = [privacy.discreetMode ? 'Mode discret activé' : null, privacy.hideNotificationPreview ? 'Aperçus masqués' : null, privacy.privateContentProtection ? 'Contenus privés protégés' : null].filter((value): value is string => Boolean(value));
  const rows: SummaryRow[] = [...objectiveRows,
    {icon:'shield-lock-outline',label:'Sécurité',value:securityLabels.length ? securityLabels.join(' · ') : 'Aucune protection supplémentaire',route:'SecuritySetup',tone:'purple'},
    {icon:'incognito',label:'Confidentialité',value:privacyLabels.length ? privacyLabels.join(' · ') : 'Réglages standards',route:'Privacy',tone:'green'},
  ];

  const navigateToEdit = (route: EditableRoute) => {
    navigation.navigate(route);
  };

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={styles.safeArea}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            isSmallScreen && styles.contentSmall,
            isVerySmallScreen && styles.contentVerySmall,
            {
              paddingTop: isSmallScreen
                ? TOP_SPACING_EXTRA_COMPACT
                : TOP_SPACING_EXTRA,
              paddingBottom: Math.max(insets.bottom, 16) + spacing.md,
            },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />

            <View style={styles.heroCopy}>
              <View style={styles.stepBadge}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="check-decagram"
                  size={16}
                />
                <Text style={styles.stepBadgeText}>Dernière étape</Text>
              </View>

              <Text
                style={[
                  styles.title,
                  isSmallScreen && styles.titleSmall,
                ]}>
                Tout est prêt
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall,
                ]}>
                Vérifie tes informations avant de commencer.
              </Text>

              <View style={styles.editTip}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="gesture-tap"
                  size={17}
                />
                <Text style={styles.editTipText}>
                  Appuie sur une carte pour la modifier
                </Text>
              </View>
            </View>

            <View style={styles.heroArt}>
              <Image
                accessibilityIgnoresInvertColors
                source={WOMAN}
                style={[
                  styles.woman,
                  isSmallScreen && styles.womanSmall,
                ]}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Tes informations</Text>
              <Text style={styles.sectionSubtitle}>
                Tout est modifiable avant de continuer.
              </Text>
            </View>

            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{rows.length}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {rows.map(row => {
              const missing = row.value === 'Non renseignée';

              return (
                <Pressable
                  accessibilityHint="Ouvre l’écran correspondant pour modifier cette information"
                  accessibilityLabel={`${row.label}, ${row.value}`}
                  accessibilityRole="button"
                  key={row.label}
                  onPress={() => navigateToEdit(row.route)}
                  style={({pressed}) => [
                    styles.infoCard,
                    isSmallScreen && styles.infoCardSmall,
                    pressed && styles.infoCardPressed,
                  ]}>
                  <View
                    style={[
                      styles.iconWrap,
                      styles[`iconWrap_${row.tone}`],
                    ]}>
                    <MaterialDesignIcons
                      color={TONE_ICON_COLOR[row.tone]}
                      name={row.icon}
                      size={26}
                    />
                  </View>

                  <View style={styles.infoCopy}>
                    <Text
                      numberOfLines={1}
                      style={styles.label}>
                      {row.label}
                    </Text>

                    <Text
                      numberOfLines={2}
                      style={[
                        styles.value,
                        missing && styles.valueMissing,
                      ]}>
                      {row.value}
                    </Text>
                  </View>

                  <View style={styles.editIcon}>
                    <MaterialDesignIcons
                      color={PURPLE}
                      name="pencil-outline"
                      size={16}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.reassuranceCard}>
            <View style={styles.reassuranceIcon}>
              <MaterialDesignIcons
                color={PURPLE}
                name="shield-check-outline"
                size={23}
              />
            </View>

            <View style={styles.reassuranceCopy}>
              <Text style={styles.reassuranceTitle}>
                Tu gardes le contrôle
              </Text>

              <Text style={styles.reassuranceText}>
                Tu pourras modifier ces informations plus tard depuis les paramètres.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('Auth')}
            style={({pressed}) => [
              styles.startButton,
              isSmallScreen && styles.startButtonSmall,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.startText}>Commencer</Text>

            <View style={styles.startIcon}>
              <MaterialDesignIcons
                color={PURPLE}
                name="arrow-right"
                size={20}
              />
            </View>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
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

  safeArea: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
  },

  contentSmall: {
    paddingHorizontal: 12,
  },

  contentVerySmall: {
    paddingHorizontal: 10,
  },

  heroCard: {
    minHeight: 190,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 28,
    backgroundColor: 'rgba(255,252,255,0.88)',
    shadowColor: '#5A3DA8',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },

  heroGlowOne: {
    position: 'absolute',
    top: -62,
    right: -38,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(126,92,205,0.12)',
  },

  heroGlowTwo: {
    position: 'absolute',
    right: 90,
    bottom: -72,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  heroCopy: {
    width: '58%',
    justifyContent: 'center',
    paddingLeft: 20,
    paddingVertical: 18,
    zIndex: 2,
  },

  stepBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    backgroundColor: PURPLE_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  stepBadgeText: {
    color: PURPLE,
    fontSize: 9.5,
    fontWeight: '800',
  },

  title: {
    marginTop: 12,
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800',
  },

  titleSmall: {
    fontSize: 25,
    lineHeight: 30,
  },

  subtitle: {
    marginTop: 7,
    color: TEXT_MUTED,
    fontSize: 12,
    lineHeight: 17,
  },

  subtitleSmall: {
    fontSize: 10.8,
    lineHeight: 15,
  },

  editTip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 13,
  },

  editTipText: {
    color: PURPLE,
    fontSize: 9,
    fontWeight: '700',
  },

  heroArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },

  woman: {
    width: '145%',
    height: 185,
    resizeMode: 'contain',
    marginRight: -18,
    marginBottom: -6,
  },

  womanSmall: {
    width: '138%',
    height: 165,
    marginRight: -14,
    marginBottom: -4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 3,
  },

  sectionTitle: {
    color: PURPLE_DARK,
    fontSize: 16,
    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: TEXT_MUTED,
    fontSize: 9.5,
  },

  sectionCount: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: PURPLE_SOFT,
  },

  sectionCountText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: '800',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  infoCard: {
    width: '48.7%',
    minHeight: 126,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 12,
    shadowColor: '#5D4394',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  infoCardSmall: {
    minHeight: 120,
    padding: 10,
  },

  infoCardPressed: {
    opacity: 0.84,
    transform: [{scale: 0.985}],
    backgroundColor: PURPLE_PALE,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrap_purple: {
    backgroundColor: '#EEE8FB',
  },

  iconWrap_rose: {
    backgroundColor: '#FBEAF1',
  },

  iconWrap_blue: {
    backgroundColor: '#E8F0FC',
  },

  iconWrap_green: {
    backgroundColor: '#E8F7EF',
  },

  infoCopy: {
    flex: 1,
    marginTop: 12,
  },

  label: {
    color: TEXT_MUTED,
    fontSize: 9.5,
    fontWeight: '600',
  },

  value: {
    marginTop: 4,
    color: PURPLE_DARK,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
  },

  valueMissing: {
    color: '#A07861',
    fontStyle: 'italic',
  },

  editIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: PURPLE_SOFT,
  },

  reassuranceCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(245,238,252,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  reassuranceIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },

  reassuranceCopy: {
    flex: 1,
  },

  reassuranceTitle: {
    color: PURPLE_DARK,
    fontSize: 11,
    fontWeight: '800',
  },

  reassuranceText: {
    marginTop: 3,
    color: TEXT_MUTED,
    fontSize: 9,
    lineHeight: 13,
  },

  startButton: {
    position: 'relative',
    width: '86%',
    maxWidth: 360,
    minHeight: 54,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 54,
    borderRadius: 19,
    backgroundColor: PURPLE,
    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },

  startButtonSmall: {
    width: '90%',
    minHeight: 50,
    paddingHorizontal: 50,
  },

  startText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  startIcon: {
    position: 'absolute',
    right: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  pressed: {
    opacity: 0.84,
    transform: [{scale: 0.99}],
  },
});

export default SummaryScreen;
