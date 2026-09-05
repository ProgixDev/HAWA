import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/AppNavigator';
import { homeColors, homeShadow } from '../components/home/homeTheme';
import InlineCalendarPickerModal from '../components/onboarding/InlineCalendarPickerModal';
import { PostpartumConsistencyModal } from '../components/postpartum/PostpartumConsistencyModal';
import {
  getPostpartumLochiaTracking,
  hydratePostpartumLochia,
} from '../state/postpartumLochiaStore';

import {
  getPostpartumPreferences,
  hydratePostpartumPreferences,
  recordFirstPostpartumPeriod,
  subscribePostpartumPreferences,
  type PostpartumFeedingType,
} from '../state/postpartumPreferences';

import {
  getAllPostpartumJournalEntries,
  hydratePostpartumJournal,
  subscribePostpartumJournal,
} from '../state/postpartumJournalStore';

import { diffDays, formatFullDate, startOfDay } from '../utils/cycleMath';

/* ============================================================
   TYPES
============================================================ */

type Props = NativeStackScreenProps<
  RootStackParamList,
  'PostpartumCycleReturn'
>;

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

/* ============================================================
   CONSTANTS
============================================================ */

const PURPLE = homeColors.primary;
const PURPLE_DARK = '#28166F';
const CYCLE_RETURNED_BACKGROUND = require('../assets/images/postpartum/postpartum-cycle-returned-card.png');
const PURPLE_SOFT = '#F0E9FA';
const TEXT_SECONDARY = homeColors.textSecondary;

const FEEDING_LABELS: Record<PostpartumFeedingType, string> = {
  exclusive_breastfeeding: 'Allaitement maternel exclusif',
  mixed: 'Allaitement mixte',
  exclusive_bottle: 'Biberon exclusivement',
  unknown: 'Je ne sais pas encore',
};

const EVOLUTION_STAGES: Array<{
  icon: IconName;
  range: string;
  label: string;
}> = [
  {
    icon: 'heart-pulse',
    range: '0-6 semaines',
    label: 'Récupération post-accouchement',
  },
  {
    icon: 'flower-outline',
    range: '6-12 semaines',
    label: 'Adaptation progressive',
  },
  {
    icon: 'sync',
    range: '3-6 mois',
    label: 'Évolution du post-partum',
  },
  {
    icon: 'calendar-heart',
    range: '6-12 mois+',
    label: 'Le cycle peut reprendre progressivement',
  },
];

/* ============================================================
   FACTOR ROW
============================================================ */

function FactorRow({
  icon,
  title,
  value,
  description,
  onPress,
  last,
}: {
  icon: IconName;
  title: string;
  value: string;
  description: string;
  onPress?: () => void;
  last?: boolean;
}): React.JSX.Element {
  const content = (
    <>
      <View style={styles.factorIcon}>
        <MaterialDesignIcons color={PURPLE} name={icon} size={19} />
      </View>

      <View style={styles.flexCopy}>
        <Text style={styles.factorTitle}>{title}</Text>

        <Text numberOfLines={2} style={styles.factorValue}>
          {value}
        </Text>

        <Text numberOfLines={2} style={styles.factorDescription}>
          {description}
        </Text>
      </View>

      {onPress ? (
        <View style={styles.factorChevron}>
          <MaterialDesignIcons color="#9C91B3" name="chevron-right" size={18} />
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.factorRow, last && styles.factorRowLast]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.factorRow,
        last && styles.factorRowLast,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

/* ============================================================
   MAIN SCREEN
============================================================ */

function PostpartumCycleReturnScreen({ navigation }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  /*
   * Plus d'espace en haut.
   * On prend la Safe Area Android + 10px supplémentaires.
   */
  const topSpacing = Math.max(insets.top + 10, 22);

  const entrance = useRef(new Animated.Value(0)).current;

  const statusEntrance = useRef(new Animated.Value(1)).current;

  const reduceMotion = useRef(false);

  /* ==========================================================
     POSTPARTUM PREFERENCES
  ========================================================== */

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

  /* ==========================================================
     POSTPARTUM JOURNAL
  ========================================================== */

  const [entries, setEntries] = useState(getAllPostpartumJournalEntries);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      hydratePostpartumJournal().then(() => {
        if (active) {
          setEntries(getAllPostpartumJournalEntries());
        }
      });

      const unsubscribe = subscribePostpartumJournal(() => {
        if (active) {
          setEntries(getAllPostpartumJournalEntries());
        }
      });

      return () => {
        active = false;
        unsubscribe();
      };
    }, []),
  );

  /* ==========================================================
     DATES
  ========================================================== */

  const deliveryDate = useMemo(
    () =>
      postpartum.deliveryDate
        ? startOfDay(new Date(`${postpartum.deliveryDate}T12:00:00`))
        : null,
    [postpartum.deliveryDate],
  );

  const firstPeriodDate = useMemo(
    () =>
      postpartum.firstPostpartumPeriodDate
        ? startOfDay(
            new Date(`${postpartum.firstPostpartumPeriodDate}T12:00:00`),
          )
        : null,
    [postpartum.firstPostpartumPeriodDate],
  );

  const hasReturned = Boolean(firstPeriodDate);

  const [pickerVisible, setPickerVisible] = useState(false);

  const [saving, setSaving] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [consistencyWarning, setConsistencyWarning] = useState<
    'lochia-active' | 'date-order' | 'before-delivery' | null
  >(null);

  /* ==========================================================
     MOTION
  ========================================================== */

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      reduceMotion.current = value;
    });
  }, []);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,

      duration: reduceMotion.current ? 0 : 450,

      easing: Easing.out(Easing.cubic),

      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    statusEntrance.setValue(0);

    Animated.timing(statusEntrance, {
      toValue: 1,

      duration: reduceMotion.current ? 0 : 380,

      easing: Easing.out(Easing.cubic),

      useNativeDriver: true,
    }).start();
  }, [hasReturned, statusEntrance]);

  /* ==========================================================
     SAVE PERIOD
  ========================================================== */

  const confirmPeriodDate = async (date: Date) => {
    if (deliveryDate && diffDays(startOfDay(date), deliveryDate) < 0) {
      setPickerVisible(false);
      setConsistencyWarning('before-delivery');
      return;
    }

    await hydratePostpartumLochia();
    const lochiaTracking = getPostpartumLochiaTracking();
    if (!lochiaTracking.endedDate) {
      setPickerVisible(false);
      setConsistencyWarning('lochia-active');
      return;
    }
    const endedDate = startOfDay(
      new Date(`${lochiaTracking.endedDate}T12:00:00`),
    );
    if (diffDays(startOfDay(date), endedDate) < 0) {
      setPickerVisible(false);
      setConsistencyWarning('date-order');
      return;
    }

    setSaving(true);

    try {
      await recordFirstPostpartumPeriod(date);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     LATEST JOURNAL
  ========================================================== */

  const latestJournalValue = useCallback(
    (field: 'mood' | 'sleep' | 'fatigue'): string | null => {
      const dates = Object.keys(entries).sort().reverse();

      for (const date of dates) {
        const value = entries[date]?.[field];

        if (value) {
          return value;
        }
      }

      return null;
    },
    [entries],
  );

  const latestSleep = useMemo(
    () => latestJournalValue('sleep'),
    [latestJournalValue],
  );

  const latestMood = useMemo(
    () => latestJournalValue('mood'),
    [latestJournalValue],
  );

  const latestFatigue = useMemo(
    () => latestJournalValue('fatigue'),
    [latestJournalValue],
  );

  const feedingLabel = postpartum.feedingType
    ? FEEDING_LABELS[postpartum.feedingType]
    : 'Non renseigné';

  /* ==========================================================
     INFO
  ========================================================== */

  const showAmenorrheaInfo = () => {
    setHelpModalVisible(true);
  };

  const entranceStyle = {
    opacity: entrance,

    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],

          outputRange: [12, 0],
        }),
      },
    ],
  };

  const statusStyle = {
    opacity: statusEntrance,

    transform: [
      {
        translateY: statusEntrance.interpolate({
          inputRange: [0, 1],

          outputRange: [6, 0],
        }),
      },
    ],
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <View style={styles.safe}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent
      />

      {/* ======================================================
          HEADER
      ======================================================= */}

      <View
        style={[
          styles.header,
          {
            paddingTop: topSpacing,
          },
        ]}
      >
        <Pressable
          accessibilityLabel="Retour"
          accessibilityRole="button"
          hitSlop={10}
          onPress={navigation.goBack}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialDesignIcons color={PURPLE} name="arrow-left" size={22} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>POST-PARTUM</Text>

          <Text style={styles.headerTitle}>Retour du cycle</Text>
        </View>

        <Pressable
          accessibilityLabel="Aide sur le retour du cycle"
          accessibilityRole="button"
          hitSlop={10}
          onPress={showAmenorrheaInfo}
          style={({ pressed }) => [
            styles.headerButton,
            styles.headerHelpButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialDesignIcons
            color={PURPLE}
            name="help-circle-outline"
            size={23}
          />
        </Pressable>
      </View>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={entranceStyle}>
          {/* ==================================================
              HERO STATUS
          =================================================== */}

          <View style={styles.statusHero}>
            {hasReturned ? (
              <Image
                accessibilityIgnoresInvertColors
                accessibilityLabel="Illustration du retour du cycle"
                resizeMode="cover"
                source={CYCLE_RETURNED_BACKGROUND}
                style={styles.returnedBackground}
              />
            ) : (
              <>
                <View style={styles.heroDecorationLarge} />
                <View style={styles.heroDecorationSmall} />
              </>
            )}

            <View style={styles.statusHeroTop}>
              <View
                style={[
                  styles.statusHeroIcon,

                  hasReturned && styles.statusHeroIconReturned,
                ]}
              >
                <MaterialDesignIcons
                  color={PURPLE}
                  name={
                    hasReturned
                      ? 'calendar-check-outline'
                      : 'calendar-clock-outline'
                  }
                  size={27}
                />
              </View>
            </View>

            <Animated.View style={statusStyle}>
              <Text style={styles.statusEyebrow}>STATUT ACTUEL</Text>

              <Text style={styles.statusValue}>
                {hasReturned ? 'Cycle repris' : 'Cycle non repris'}
              </Text>

              <Text style={styles.statusDescription}>
                {hasReturned && firstPeriodDate
                  ? `Tes premières règles depuis l’accouchement ont commencé le ${formatFullDate(
                      firstPeriodDate,
                    )}.`
                  : 'Tu n’as pas encore eu de règles depuis l’accouchement.'}
              </Text>
            </Animated.View>

            {!hasReturned ? (
              <View style={styles.statusBadge}>
                <View style={styles.statusBadgeDot} />

                <Text style={styles.statusBadgeText}>
                  Aménorrhée post-partum
                </Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="check-circle-outline"
                  size={13}
                />

                <Text style={styles.statusBadgeText}>Retour enregistré</Text>
              </View>
            )}

            {!hasReturned ? (
              <View style={styles.normalPanel}>
                <View style={styles.normalPanelIcon}>
                  <MaterialDesignIcons color={PURPLE} name="leaf" size={17} />
                </View>

                <View style={styles.flexCopy}>
                  <Text style={styles.normalPanelTitle}>
                    Chaque corps évolue à son rythme
                  </Text>

                  <Text style={styles.normalPanelText}>
                    La reprise des règles peut prendre du temps, notamment
                    pendant l’allaitement.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* ==================================================
              PERIOD RETURN
          =================================================== */}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="water-outline"
                  size={20}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>Reprise des règles</Text>

                <Text style={styles.sectionSubtitle}>
                  Indique le premier jour de tes règles après l’accouchement
                </Text>
              </View>
            </View>

            <View style={styles.periodPanel}>
              <View style={styles.periodDateIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name={hasReturned ? 'calendar-check' : 'calendar-plus'}
                  size={23}
                />
              </View>

              <View style={styles.periodCopy}>
                <Text style={styles.periodSmallLabel}>Première période</Text>

                <Text numberOfLines={2} style={styles.periodValue}>
                  {hasReturned && firstPeriodDate
                    ? formatFullDate(firstPeriodDate)
                    : 'Pas encore enregistrée'}
                </Text>
              </View>

              <Pressable
                accessibilityLabel={
                  hasReturned
                    ? 'Modifier la date des premières règles'
                    : 'Enregistrer la date des premières règles'
                }
                accessibilityRole="button"
                disabled={saving}
                onPress={() => setPickerVisible(true)}
                style={({ pressed }) => [
                  styles.periodAction,

                  (pressed || saving) && styles.pressed,
                ]}
              >
                <Text style={styles.periodActionText}>
                  {hasReturned ? 'Modifier' : 'Ajouter'}
                </Text>

                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="arrow-right"
                  size={15}
                />
              </Pressable>
            </View>

            <Pressable
              accessibilityLabel="Date des dernières règles"
              accessibilityRole="button"
              onPress={() => setPickerVisible(true)}
              style={({ pressed }) => [
                styles.lastPeriodRow,

                pressed && styles.pressed,
              ]}
            >
              <View style={styles.lastPeriodIcon}>
                <MaterialDesignIcons color={PURPLE} name="history" size={17} />
              </View>

              <View style={styles.flexCopy}>
                <Text style={styles.lastPeriodLabel}>Date enregistrée</Text>

                <Text numberOfLines={1} style={styles.lastPeriodValue}>
                  {hasReturned && firstPeriodDate
                    ? formatFullDate(firstPeriodDate)
                    : 'Aucune date'}
                </Text>
              </View>

              <MaterialDesignIcons
                color="#968BAA"
                name="chevron-right"
                size={18}
              />
            </Pressable>
          </View>

          {/* ==================================================
              FACTORS
          =================================================== */}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="chart-timeline-variant"
                  size={20}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>Évolution hormonale</Text>

                <Text style={styles.sectionSubtitle}>
                  Contexte fondé sur les informations que tu as enregistrées
                </Text>
              </View>
            </View>

            <View style={styles.hormonalEducation}>
              <MaterialDesignIcons
                color={PURPLE}
                name="information-outline"
                size={17}
              />
              <Text style={styles.hormonalEducationText}>
                Ton corps s’adapte progressivement après l’accouchement. Les
                changements hormonaux peuvent accompagner l’allaitement, le
                retour du cycle, l’humeur, le sommeil ou la sécheresse vaginale.
                Ces repères ne mesurent pas tes hormones et ne constituent pas
                un diagnostic.
              </Text>
            </View>

            <Text style={styles.trackedContextLabel}>TON CONTEXTE SUIVI</Text>

            <View style={styles.factorContainer}>
              <FactorRow
                description="Peut influencer le moment du retour des règles."
                icon="baby-face-outline"
                onPress={() =>
                  navigation.navigate('PostpartumFeeding', {mode: 'edit'})
                }
                title="Allaitement"
                value={feedingLabel}
              />

              <FactorRow
                description="Date réelle enregistrée par tes soins."
                icon="calendar-heart"
                title="Retour du cycle"
                value={
                  hasReturned && firstPeriodDate
                    ? formatFullDate(firstPeriodDate)
                    : 'Pas encore repris'
                }
              />

              <FactorRow
                description="Absence de règles depuis l’accouchement."
                icon="calendar-remove-outline"
                onPress={showAmenorrheaInfo}
                title="Aménorrhée post-partum"
                value={hasReturned ? 'Terminée' : 'En cours'}
              />

              <FactorRow
                description="Ton repos et ta récupération au quotidien."
                icon="weather-night"
                onPress={() =>
                  navigation.navigate('PostpartumJournalEntry', {
                    category: 'sleep',
                  })
                }
                title="Sommeil et repos"
                value={latestSleep ?? 'Non renseigné'}
              />

              <FactorRow
                description="Ton ressenti émotionnel depuis l’accouchement."
                icon="flower-outline"
                onPress={() =>
                  navigation.navigate('PostpartumJournalEntry', {
                    category: 'mood',
                  })
                }
                title="Bien-être émotionnel"
                value={latestMood ?? 'Non renseigné'}
              />

              <FactorRow
                description="Dernière observation enregistrée dans ton journal."
                icon="lightning-bolt-outline"
                last
                onPress={() =>
                  navigation.navigate('PostpartumJournalEntry', {
                    category: 'fatigue',
                  })
                }
                title="Fatigue"
                value={latestFatigue ?? 'Non renseigné'}
              />
            </View>
          </View>

          {/* ==================================================
              TIMELINE
          =================================================== */}

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="timeline-clock-outline"
                  size={20}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>Évolution post-partum</Text>

                <Text style={styles.sectionSubtitle}>
                  Des repères généraux pour mieux visualiser cette période
                </Text>
              </View>
            </View>

            <View style={styles.timelineList}>
              {EVOLUTION_STAGES.map((stage, index) => (
                <View key={stage.range} style={styles.timelineItem}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot}>
                      <MaterialDesignIcons
                        color={PURPLE}
                        name={stage.icon}
                        size={16}
                      />
                    </View>

                    {index < EVOLUTION_STAGES.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>

                  <View style={styles.timelineContent}>
                    <View style={styles.timelineRangeBadge}>
                      <Text style={styles.timelineRange}>{stage.range}</Text>
                    </View>

                    <Text style={styles.timelineText}>{stage.label}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.timelineDisclaimer}>
              <MaterialDesignIcons
                color="#8D80A3"
                name="information-outline"
                size={15}
              />

              <Text style={styles.timelineDisclaimerText}>
                Ces repères sont indicatifs : la reprise du cycle varie d’une
                personne à l’autre.
              </Text>
            </View>
          </View>

          {/* ==================================================
              REMINDER
          =================================================== */}

          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <MaterialDesignIcons
                color={PURPLE}
                name="heart-outline"
                size={20}
              />
            </View>

            <View style={styles.flexCopy}>
              <Text style={styles.reminderEyebrow}>À RETENIR</Text>

              <Text style={styles.reminderTitle}>Ton rythme est unique</Text>

              <Text style={styles.reminderText}>
                Chaque corps évolue différemment après l’accouchement.
                L’allaitement peut notamment influencer la reprise du cycle.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ======================================================
          CALENDAR
      ======================================================= */}

      <Modal
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={helpModalVisible}
      >
        <View style={styles.helpModalOverlay}>
          <Pressable
            accessibilityLabel="Fermer l’aide"
            onPress={() => setHelpModalVisible(false)}
            style={StyleSheet.absoluteFill}
          />

          <View accessibilityRole="alert" style={styles.helpModalCard}>
            <View style={styles.helpModalIconWrap}>
              <View style={styles.helpModalIconHalo}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="help-circle-outline"
                  size={36}
                />
              </View>
            </View>

            <Text style={styles.helpModalTitle}>Aménorrhée post-partum</Text>

            <Text style={styles.helpModalText}>
              Après l’accouchement, l’absence de règles est fréquente et peut
              durer plusieurs semaines à plusieurs mois, notamment en cas
              d’allaitement.
            </Text>

            <View style={styles.helpModalInfoBox}>
              <MaterialDesignIcons
                color={PURPLE}
                name="information-outline"
                size={18}
              />
              <Text style={styles.helpModalInfoText}>
                Ce repère est informatif. Il ne constitue ni un diagnostic ni
                une indication médicale personnalisée.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setHelpModalVisible(false)}
              style={({ pressed }) => [
                styles.helpModalButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.helpModalButtonText}>J’ai compris</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <InlineCalendarPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={date => {
          setPickerVisible(false);

          confirmPeriodDate(date);
        }}
        subtitle="Indique le premier jour de tes premières règles depuis ton accouchement."
        title="Date de reprise des règles"
        value={firstPeriodDate ?? deliveryDate ?? new Date()}
        visible={pickerVisible}
      />
      <PostpartumConsistencyModal
        visible={consistencyWarning !== null}
        title={
          consistencyWarning === 'lochia-active'
            ? 'Vérifie ton suivi'
            : 'Date à vérifier'
        }
        message={
          consistencyWarning === 'before-delivery'
            ? 'Tes premières règles depuis l’accouchement ne peuvent pas précéder ta date d’accouchement.'
            : consistencyWarning === 'date-order'
            ? 'La date de reprise du cycle est antérieure à la date de fin enregistrée des lochies.'
            : 'Tes lochies sont encore indiquées comme en cours, mais tu souhaites enregistrer une reprise du cycle.'
        }
        infoText={
          consistencyWarning === 'before-delivery'
            ? 'Choisis une date postérieure ou égale à la date d’accouchement.'
            : consistencyWarning === 'date-order'
            ? 'Vérifie les deux dates pour garder un suivi cohérent.'
            : 'Pour garder un suivi cohérent, vérifie d’abord la fin de tes lochies ou corrige la date de reprise du cycle.'
        }
        primaryLabel={
          consistencyWarning === 'before-delivery'
            ? 'Modifier la date'
            : 'Voir les lochies'
        }
        onPrimary={() => {
          setConsistencyWarning(null);
          if (consistencyWarning === 'before-delivery') {
            setPickerVisible(true);
            return;
          }
          navigation.navigate('PostpartumLochia');
        }}
        onSecondary={() => setConsistencyWarning(null)}
        onRequestClose={() => setConsistencyWarning(null)}
      />
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  /* ==========================================================
     GLOBAL
  ========================================================== */

  safe: {
    flex: 1,
    backgroundColor: '#F9F6FC',
  },

  flexCopy: {
    flex: 1,
    minWidth: 0,
  },

  pressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  content: {
    paddingHorizontal: 16,

    /*
     * Petit espace supplémentaire entre
     * le header et la première carte.
     */
    paddingTop: 9,
  },

  /* ==========================================================
     HEADER
  ========================================================== */

  header: {
    minHeight: 78,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,

    /*
     * paddingTop dynamique ajouté dans le composant.
     */
    paddingBottom: 11,

    backgroundColor: '#F9F6FC',
  },

  headerButton: {
    ...homeShadow,

    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',

    borderRadius: 15,

    backgroundColor: '#FFFFFF',
  },

  headerHelpButton: {
    borderRadius: 21,
    backgroundColor: '#F1EAFB',
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,

    alignItems: 'center',

    marginHorizontal: 10,
  },

  headerEyebrow: {
    color: '#927CC6',

    fontSize: 8,
    fontWeight: '800',

    letterSpacing: 1.4,
  },

  headerTitle: {
    marginTop: 2,

    color: homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 19,
    fontWeight: '800',

    textAlign: 'center',
  },

  headerSpacer: {
    width: 42,
  },

  /* ==========================================================
     HERO STATUS
  ========================================================== */

  statusHero: {
    ...homeShadow,

    position: 'relative',
    overflow: 'hidden',

    padding: 18,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',

    borderRadius: 27,

    backgroundColor: '#FFFFFF',
  },

  returnedBackground: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },

  heroDecorationLarge: {
    position: 'absolute',

    top: -68,
    right: -50,

    width: 170,
    height: 170,

    borderRadius: 85,

    backgroundColor: 'rgba(105,73,190,0.055)',
  },

  heroDecorationSmall: {
    position: 'absolute',

    top: 35,
    right: 28,

    width: 56,
    height: 56,

    borderRadius: 28,

    backgroundColor: 'rgba(186,161,225,0.15)',
  },

  statusHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 14,
  },

  statusHeroIcon: {
    width: 55,
    height: 55,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 19,

    backgroundColor: '#F1EAFB',
  },

  statusHeroIconReturned: {
    backgroundColor: '#EEE8FA',
  },

  infoButton: {
    width: 32,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor: 'rgba(247,243,251,0.9)',
  },

  statusEyebrow: {
    color: '#927CC6',

    fontSize: 8.5,
    fontWeight: '800',

    letterSpacing: 1.3,
  },

  statusValue: {
    marginTop: 4,

    color: PURPLE_DARK,

    fontFamily: 'serif',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
  },

  statusDescription: {
    maxWidth: 300,

    marginTop: 6,

    color: TEXT_SECONDARY,

    fontSize: 11.5,
    lineHeight: 17,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    alignSelf: 'flex-start',

    marginTop: 13,

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 12,

    backgroundColor: '#F1EAFB',
  },

  statusBadgeDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: PURPLE,
  },

  statusBadgeText: {
    color: PURPLE,

    fontSize: 9.5,
    fontWeight: '800',
  },

  normalPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 9,

    marginTop: 15,

    padding: 11,

    borderRadius: 16,

    backgroundColor: '#F8F4FC',
  },

  normalPanelIcon: {
    width: 31,
    height: 31,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 10,

    backgroundColor: '#EEE6FA',
  },

  normalPanelTitle: {
    color: homeColors.textPrimary,

    fontSize: 10.5,
    fontWeight: '800',
  },

  normalPanelText: {
    marginTop: 2,

    color: TEXT_SECONDARY,

    fontSize: 9.5,
    lineHeight: 14,
  },

  /* ==========================================================
     GENERIC SECTION
  ========================================================== */

  sectionCard: {
    ...homeShadow,

    marginTop: 13,

    padding: 15,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',

    borderRadius: 23,

    backgroundColor: '#FFFFFF',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 13,
  },

  sectionHeaderIcon: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    borderRadius: 13,

    backgroundColor: PURPLE_SOFT,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: homeColors.textPrimary,

    fontFamily: 'serif',
    fontSize: 15.5,
    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 2,

    color: TEXT_SECONDARY,

    fontSize: 9,
    lineHeight: 13,
  },

  /* ==========================================================
     PERIOD
  ========================================================== */

  periodPanel: {
    minHeight: 75,

    flexDirection: 'row',
    alignItems: 'center',

    padding: 11,

    borderRadius: 18,

    backgroundColor: '#F8F4FC',
  },

  periodDateIcon: {
    width: 43,
    height: 43,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: '#EDE5FA',
  },

  periodCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },

  periodSmallLabel: {
    color: TEXT_SECONDARY,

    fontSize: 8.5,
  },

  periodValue: {
    marginTop: 3,

    color: homeColors.textPrimary,

    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '800',
  },

  periodAction: {
    minHeight: 38,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,

    marginLeft: 8,

    paddingHorizontal: 11,

    borderRadius: 13,

    backgroundColor: PURPLE,

    shadowColor: '#4D2B9F',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.18,
    shadowRadius: 6,

    elevation: 3,
  },

  periodActionText: {
    color: '#FFFFFF',

    fontSize: 9.5,
    fontWeight: '800',
  },

  lastPeriodRow: {
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 10,

    paddingHorizontal: 4,
  },

  lastPeriodIcon: {
    width: 34,
    height: 34,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,

    borderRadius: 11,

    backgroundColor: '#F2ECFA',
  },

  lastPeriodLabel: {
    color: homeColors.textPrimary,

    fontSize: 10.5,
    fontWeight: '700',
  },

  lastPeriodValue: {
    marginTop: 2,

    color: TEXT_SECONDARY,

    fontSize: 9.5,
  },

  /* ==========================================================
     FACTORS
  ========================================================== */

  hormonalEducation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    padding: 11,
    borderRadius: 15,
    backgroundColor: '#F3EDFA',
  },

  hormonalEducationText: {
    flex: 1,
    color: TEXT_SECONDARY,
    fontSize: 9.5,
    lineHeight: 14,
  },

  trackedContextLabel: {
    marginBottom: 7,
    color: PURPLE,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  factorContainer: {
    overflow: 'hidden',

    borderRadius: 17,

    backgroundColor: '#FBF9FD',
  },

  factorRow: {
    minHeight: 78,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
    paddingVertical: 10,

    borderBottomWidth: StyleSheet.hairlineWidth,

    borderBottomColor: '#EDE7F2',
  },

  factorRowLast: {
    borderBottomWidth: 0,
  },

  factorIcon: {
    width: 40,
    height: 40,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    borderRadius: 13,

    backgroundColor: '#EEE7FB',
  },

  factorTitle: {
    color: homeColors.textPrimary,

    fontSize: 11.5,
    fontWeight: '800',
  },

  factorValue: {
    marginTop: 2,

    color: PURPLE,

    fontSize: 10.5,
    fontWeight: '700',
  },

  factorDescription: {
    marginTop: 2,

    color: TEXT_SECONDARY,

    fontSize: 8.5,
    lineHeight: 12,
  },

  factorChevron: {
    width: 28,
    height: 28,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 6,

    borderRadius: 10,

    backgroundColor: '#F3EEF8',
  },

  /* ==========================================================
     TIMELINE
  ========================================================== */

  timelineList: {
    marginTop: 2,
  },

  timelineItem: {
    minHeight: 70,

    flexDirection: 'row',
  },

  timelineRail: {
    width: 42,

    alignItems: 'center',
  },

  timelineDot: {
    width: 34,
    height: 34,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.08)',

    borderRadius: 13,

    backgroundColor: '#F0E9FA',
  },

  timelineLine: {
    flex: 1,

    width: 1,

    marginVertical: 3,

    borderLeftWidth: 1.3,
    borderStyle: 'dashed',
    borderLeftColor: 'rgba(105,73,190,0.28)',
  },

  timelineContent: {
    flex: 1,
    minWidth: 0,

    paddingLeft: 7,
    paddingBottom: 15,
  },

  timelineRangeBadge: {
    alignSelf: 'flex-start',

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 9,

    backgroundColor: '#F5F1FA',
  },

  timelineRange: {
    color: PURPLE,

    fontSize: 8.5,
    fontWeight: '800',
  },

  timelineText: {
    marginTop: 5,

    color: homeColors.textPrimary,

    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '700',
  },

  timelineDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 7,

    marginTop: 3,

    padding: 10,

    borderRadius: 14,

    backgroundColor: '#F7F3FA',
  },

  timelineDisclaimerText: {
    flex: 1,

    color: TEXT_SECONDARY,

    fontSize: 8.5,
    lineHeight: 13,
  },

  helpModalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,20,69,0.40)',
    paddingHorizontal: 22,
  },

  helpModalCard: {
    width: '100%',
    maxWidth: 390,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    borderRadius: 28,
    backgroundColor: '#FFFDFF',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    shadowColor: '#28166F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 12,
  },

  helpModalIconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },

  helpModalIconHalo: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 37,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.12)',
    backgroundColor: '#F1EAFB',
  },

  helpModalTitle: {
    color: PURPLE_DARK,
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },

  helpModalText: {
    marginTop: 10,
    color: TEXT_SECONDARY,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
  },

  helpModalInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F6F0FC',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },

  helpModalInfoText: {
    flex: 1,
    color: TEXT_SECONDARY,
    fontSize: 10.5,
    lineHeight: 15,
  },

  helpModalButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: PURPLE,
    shadowColor: '#4D2B9F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  helpModalButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* ==========================================================
     REMINDER
  ========================================================== */

  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    gap: 11,

    marginTop: 13,

    padding: 14,

    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',

    borderRadius: 20,

    backgroundColor: '#F2ECFA',
  },

  reminderIcon: {
    width: 39,
    height: 39,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: '#FFFFFF',
  },

  reminderEyebrow: {
    color: '#927CC6',

    fontSize: 7.5,
    fontWeight: '800',

    letterSpacing: 1.1,
  },

  reminderTitle: {
    marginTop: 2,

    color: homeColors.textPrimary,

    fontSize: 11.5,
    fontWeight: '800',
  },

  reminderText: {
    marginTop: 3,

    color: TEXT_SECONDARY,

    fontSize: 9.5,
    lineHeight: 14,
  },
});

export default PostpartumCycleReturnScreen;
