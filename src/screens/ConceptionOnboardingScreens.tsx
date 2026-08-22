import React, {useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {getTopPadding} from '../theme/spacing';

import {
  getConceptionPreferences,
  hydrateConceptionPreferences,
  setConceptionPreferences,
  type ConceptionReminderKey,
  type ConceptionTryingDuration,
  type FertilityIndicator,
  type OvulationAwareness,
} from '../state/conceptionPreferences';

/* ============================================================
 * ASSETS
 * ============================================================ */



/* ============================================================
 * COLORS
 * ============================================================ */

const COLORS = {
  primary: '#6949BE',
  primaryDark: '#3F278D',
  primarySoft: '#F0E7FC',

  text: '#26184F',
  textSecondary: '#655A7D',

  pink: '#D94D91',
  pinkSoft: '#FBE8F2',

  lavender: '#F5EEFC',
  lavenderStrong: '#E9DDFC',

  white: '#FFFFFF',

  border: 'rgba(112,77,178,0.12)',

  success: '#62AE88',
};

/* ============================================================
 * TYPES
 * ============================================================ */

type RouteName =
  | 'ConceptionTryingDuration'
  | 'ConceptionOvulationAwareness'
  | 'ConceptionIndicators'
  | 'ConceptionReminders';

type Props = NativeStackScreenProps<RootStackParamList, RouteName>;

type IconName = React.ComponentProps<
  typeof MaterialDesignIcons
>['name'];

/* ============================================================
 * OPTIONS
 * ============================================================ */

const durationOptions: Array<{
  id: ConceptionTryingDuration;
  label: string;
}> = [
  {
    id: 'under_3_months',
    label: 'Moins de 3 mois',
  },
  {
    id: '3_to_6_months',
    label: '3 à 6 mois',
  },
  {
    id: '6_to_12_months',
    label: '6 à 12 mois',
  },
  {
    id: 'over_1_year',
    label: 'Plus d’un an',
  },
  {
    id: 'starting_now',
    label: 'Je commence maintenant',
  },
];

const awarenessOptions: Array<{
  id: OvulationAwareness;
  label: string;
  description: string;
  icon: IconName;
}> = [
  {
    id: 'often',
    label: 'Oui, souvent',
    description: 'Je repère assez bien mes signes d’ovulation.',
    icon: 'target',
  },
  {
    id: 'sometimes',
    label: 'Parfois',
    description:
      'Je ne suis pas toujours sûre, mais j’ai quelques indices.',
    icon: 'eye-outline',
  },
  {
    id: 'not_really',
    label: 'Non, pas vraiment',
    description: 'Je ne sais pas reconnaître mon ovulation.',
    icon: 'help',
  },
];

const indicatorOptions: Array<{
  id: FertilityIndicator;
  label: string;
  description: string;
  icon: IconName;
}> = [
  {
    id: 'temperature',
    label: 'Température basale',
    description:
      'Prends ta température chaque matin pour suivre son évolution.',
    icon: 'thermometer',
  },
  {
    id: 'cervical_mucus',
    label: 'Glaire cervicale',
    description: 'Observe son évolution au cours du cycle.',
    icon: 'water-outline',
  },
  {
    id: 'lh_tests',
    label: 'Tests d’ovulation (LH)',
    description:
      'Enregistre tes tests LH pour suivre ton pic d’ovulation.',
    icon: 'test-tube',
  },
  {
    id: 'intercourse',
    label: 'Rapports',
    description:
      'Enregistre cette information de façon privée et discrète.',
    icon: 'heart-outline',
  },
];

// All 5 ConceptionReminderKey values get their own toggle + notification
// here (see conceptionReminderScheduling.ts), each off by default — opt-in
// only, never auto-enabled. Deliberately no "Rapports" reminder: it
// overlapped with the fertile-window reminder and risked feeling intrusive
// (product decision) — "Rapports" itself is still tracked in the Journal
// quotidien exactly as before, this only removes its automatic reminder.
const reminderOptions: Array<{
  id: ConceptionReminderKey;
  label: string;
  description: string;
  detail: string;
  icon: IconName;
  accent: string;
  background: string;
}> = [
  {
    id: 'fertile_window',
    label: 'Fenêtre fertile',
    description:
      'Informe lorsque ta fenêtre fertile approche ou commence.',
    detail:
      'Tu recevras un rappel lorsque ta période fertile approche.',
    icon: 'sprout',
    accent: '#D94D91',
    background: '#FCE8F2',
  },
  {
    id: 'estimated_ovulation',
    label: 'Ovulation estimée',
    description:
      'Informe autour du jour où ton ovulation est estimée.',
    detail:
      'Un repère simple autour de ton jour d’ovulation estimé.',
    icon: 'target',
    accent: '#C94A93',
    background: '#FBE9F4',
  },
  {
    id: 'daily_journal',
    label: 'Journal quotidien',
    description:
      'Un seul rappel par jour pour compléter ton suivi.',
    detail:
      'Température basale, glaire cervicale, test LH, rapports et autres observations.',
    icon: 'notebook-outline',
    accent: '#6949BE',
    background: '#EFE7FB',
  },
  {
    id: 'temperature',
    label: 'Température basale',
    description:
      'Un rappel chaque matin pour prendre ta température.',
    detail:
      'Idéal pour ne pas oublier ta mesure au réveil, avant de te lever.',
    icon: 'thermometer',
    accent: '#8B6FD1',
    background: '#EEE7FA',
  },
  {
    id: 'lh_test',
    label: 'Test LH',
    description:
      'Un rappel pendant ta fenêtre fertile pour ton test d’ovulation.',
    detail:
      'Un repère pour penser à faire ton test LH au bon moment.',
    icon: 'test-tube',
    accent: '#8C5A9E',
    background: '#F3E9F7',
  },
];

/* ============================================================
 * SHARED ONBOARDING SHELL
 * ============================================================ */

function Shell({
  navigation,
  step,
  title,
  subtitle,
  children,
  nextDisabled,
  onNext,
}: Props & {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  nextDisabled?: boolean;
  onNext: () => void;
}) {
  const insets = useSafeAreaInsets();

  const body = (
    <>
      <StatusBar
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(getTopPadding(insets.top) - 10, insets.top + 6),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Pressable
            accessibilityLabel="Revenir à l’étape précédente"
            accessibilityRole="button"
            hitSlop={8}
            onPress={navigation.goBack}
            style={({pressed}) => [
              styles.back,
              pressed && styles.pressed,
            ]}>
            <MaterialDesignIcons
              color={COLORS.primary}
              name="arrow-left"
              size={24}
            />
          </Pressable>
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.subtitle}>{subtitle}</Text>

        {children}

        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            disabled={nextDisabled}
            onPress={onNext}
            style={({pressed}) => [
              styles.primary,
              nextDisabled && styles.disabled,
              pressed && !nextDisabled && styles.primaryPressed,
            ]}>
            <Text style={styles.primaryText}>
              {step === 4 ? 'Continuer' : 'Suivant'}
            </Text>

            <MaterialDesignIcons
              color="#FFFFFF"
              name="arrow-right"
              size={18}
            />
          </Pressable>
        </View>
      </ScrollView>
    </>
  );

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.profileGradientBackground}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>
      {body}
    </LinearGradient>
  );
}

/* ============================================================
 * 1 — TRYING DURATION
 * ============================================================ */

export function ConceptionTryingDurationScreen({
  navigation,
  route,
}: Props) {
  const [selected, setSelected] =
    useState<ConceptionTryingDuration | null>(
      () => getConceptionPreferences().tryingDuration,
    );

  useEffect(() => {
    hydrateConceptionPreferences().then(value => {
      setSelected(value.tryingDuration);
    });
  }, []);

  return (
    <Shell
      navigation={navigation}
      onNext={async () => {
        if (!selected) {
          return;
        }

        await setConceptionPreferences({
          tryingDuration: selected,
        });

        navigation.navigate(
          'ConceptionOvulationAwareness',
        );
      }}
      route={route}
      step={1}
      subtitle="Choisissez la durée qui vous correspond."
      title="Depuis combien de temps essayez-vous de concevoir ?"
      nextDisabled={!selected}>

      <View style={[styles.list, styles.listTop]}>
        {durationOptions.map(item => (
          <Choice
            key={item.id}
            label={item.label}
            onPress={() => setSelected(item.id)}
            selected={selected === item.id}
          />
        ))}
      </View>

      <Info
        text="Chaque parcours est unique. AWA est là pour t’accompagner à chaque étape."
      />
    </Shell>
  );
}

/* ============================================================
 * 2 — OVULATION AWARENESS
 * ============================================================ */

export function ConceptionOvulationAwarenessScreen({
  navigation,
  route,
}: Props) {
  const [selected, setSelected] =
    useState<OvulationAwareness | null>(
      () =>
        getConceptionPreferences()
          .ovulationAwareness,
    );

  useEffect(() => {
    hydrateConceptionPreferences().then(value => {
      setSelected(value.ovulationAwareness);
    });
  }, []);

  return (
    <Shell
      navigation={navigation}
      onNext={async () => {
        if (!selected) {
          return;
        }

        await setConceptionPreferences({
          ovulationAwareness: selected,
        });

        navigation.navigate(
          'ConceptionIndicators',
        );
      }}
      route={route}
      step={2}
      subtitle="Cela nous aide à te proposer le meilleur suivi."
      title="Arrives-tu généralement à repérer ton ovulation ?"
      nextDisabled={!selected}>

      <View style={[styles.list, styles.listTop]}>
        {awarenessOptions.map(item => (
          <Choice
            key={item.id}
            {...item}
            onPress={() => setSelected(item.id)}
            selected={selected === item.id}
          />
        ))}
      </View>

      <Info
        icon="lightbulb-outline"
        text="Pas de souci si tu ne sais pas encore. AWA t’aidera à observer ton cycle progressivement."
      />
    </Shell>
  );
}

/* ============================================================
 * 3 — FERTILITY INDICATORS
 * ============================================================ */

export function ConceptionIndicatorsScreen({
  navigation,
  route,
}: Props) {
  const [selected, setSelected] = useState<
    Set<FertilityIndicator>
  >(
    () =>
      new Set(
        getConceptionPreferences().indicators,
      ),
  );

  const all = indicatorOptions.every(item =>
    selected.has(item.id),
  );

  useEffect(() => {
    hydrateConceptionPreferences().then(value => {
      setSelected(new Set(value.indicators));
    });
  }, []);

  const toggle = (id: FertilityIndicator) => {
    setSelected(current => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <Shell
      navigation={navigation}
      onNext={async () => {
        await setConceptionPreferences({
          indicators: [...selected],
        });

        navigation.navigate(
          'ConceptionReminders',
        );
      }}
      route={route}
      step={3}
      subtitle="Sélectionne ce qui t’aide le plus à comprendre ta fertilité."
      title="Quels indicateurs souhaites-tu suivre ?"
      nextDisabled={selected.size === 0}>
      <View style={[styles.list, styles.listTop]}>
        {indicatorOptions.map(item => (
          <Choice
            key={item.id}
            {...item}
            checkbox
            onPress={() => toggle(item.id)}
            selected={selected.has(item.id)}
          />
        ))}

        <Choice
          checkbox
          description="Je souhaite un suivi complet et détaillé."
          icon="creation"
          label="Suivre tous les indicateurs"
          onPress={() =>
            setSelected(
              all
                ? new Set()
                : new Set(
                    indicatorOptions.map(
                      item => item.id,
                    ),
                  ),
            )
          }
          selected={all}
        />
      </View>

      <Info
        icon="shield-lock-outline"
        text="Les informations liées à ta vie intime restent privées et peuvent être protégées par tes réglages de confidentialité."
      />
    </Shell>
  );
}

/* ============================================================
 * 4 — REMINDERS
 * ============================================================ */

export function ConceptionRemindersScreen({
  navigation,
  route,
}: Props) {
  const [values, setValues] = useState(
    () => getConceptionPreferences().reminders,
  );

  useEffect(() => {
    hydrateConceptionPreferences().then(value => {
      setValues(value.reminders);
    });
  }, []);

  const toggleReminder = (
    id: ConceptionReminderKey,
    value: boolean,
  ) => {
    setValues(current => ({
      ...current,
      [id]: value,
    }));
  };

  return (
    <Shell
      navigation={navigation}
      onNext={async () => {
        await setConceptionPreferences({
          reminders: values,
        });

        navigation.navigate('SecuritySetup');
      }}
      route={route}
      step={4}
      subtitle="Choisis seulement les rappels qui te sont vraiment utiles."
      title="Rappels personnalisés">
      {/* REMINDER CARDS */}

      <View style={styles.reminderList}>
        {reminderOptions.map(item => {
          const enabled = values[item.id];

          return (
            <View
              key={item.id}
              style={[
                styles.reminderCard,
                enabled && styles.reminderCardActive,
              ]}>
              <View
                style={[
                  styles.reminderAccent,
                  {backgroundColor: item.accent},
                  !enabled && styles.reminderAccentInactive,
                ]}
              />
              <View style={styles.reminderTopRow}>
                <View
                  style={[
                    styles.reminderIcon,
                    {
                      backgroundColor:
                        item.background,
                    },
                  ]}>
                  <MaterialDesignIcons
                    color={item.accent}
                    name={item.icon}
                    size={25}
                  />
                </View>

                <View style={styles.reminderCopy}>
                  <Text
                    style={styles.reminderTitle}>
                    {item.label}
                  </Text>

                  <Text
                    style={
                      styles.reminderDescription
                    }>
                    {item.description}
                  </Text>
                </View>

                <Switch
                  ios_backgroundColor="#DED9E7"
                  onValueChange={value =>
                    toggleReminder(
                      item.id,
                      value,
                    )
                  }
                  thumbColor="#FFFFFF"
                  trackColor={{
                    false: '#DED9E7',
                    true: '#7946D0',
                  }}
                  value={enabled}
                />
              </View>

              {enabled ? (
                <View
                  style={
                    styles.reminderDetailBox
                  }>
                  <View
                    style={
                      styles.reminderDetailIcon
                    }>
                    <MaterialDesignIcons
                      color={COLORS.primary}
                      name="information-outline"
                      size={17}
                    />
                  </View>

                  <Text
                    style={
                      styles.reminderDetailText
                    }>
                    {item.detail}
                  </Text>
                </View>
              ) : null}

              {item.id === 'daily_journal' &&
              enabled ? (
                <View
                  style={
                    styles.journalIncludedBox
                  }>
                  <View
                    style={
                      styles.journalIncludedIcon
                    }>
                    <MaterialDesignIcons
                      color={COLORS.primary}
                      name="creation"
                      size={15}
                    />
                  </View>

                  <Text
                    style={
                      styles.journalIncludedText
                    }>
                    Ton journal peut regrouper la
                    température basale, la glaire
                    cervicale, les tests LH, les
                    rapports et tes autres
                    observations.
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* PRIVACY */}

      <View style={styles.privacyReminderCard}>
        <View
          style={styles.privacyReminderIcon}>
          <MaterialDesignIcons
            color={COLORS.primary}
            name="shield-check-outline"
            size={25}
          />
        </View>

        <View style={styles.privacyReminderCopy}>
          <Text
            style={styles.privacyReminderTitle}>
            Des rappels discrets
          </Text>

          <Text
            style={styles.privacyReminderText}>
            Le contenu sensible peut rester masqué
            selon tes réglages de confidentialité.
          </Text>
        </View>

        <MaterialDesignIcons
          color="#A88CD9"
          name="lock-outline"
          size={22}
        />
      </View>

      {/* SETTINGS INFO */}

      <View style={styles.settingsNotice}>
        <MaterialDesignIcons
          color={COLORS.primary}
          name="heart-outline"
          size={23}
        />

        <Text style={styles.settingsNoticeText}>
          Tu pourras modifier ces préférences à tout
          moment dans les paramètres.
        </Text>
      </View>
    </Shell>
  );
}

/* ============================================================
 * SHARED CHOICE
 * ============================================================ */

function Choice({
  label,
  description,
  icon,
  selected,
  checkbox,
  onPress,
}: {
  label: string;
  description?: string;
  icon?: IconName;
  selected: boolean;
  checkbox?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={checkbox ? 'checkbox' : 'radio'}
      accessibilityState={{checked: selected}}
      onPress={onPress}
      style={({pressed}) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.choicePressed,
      ]}>
      {icon ? (
        <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
          <View style={[styles.iconInner, selected && styles.iconInnerSelected]}>
            <MaterialDesignIcons
              color={selected ? '#FFFFFF' : COLORS.primary}
              name={icon}
              size={23}
            />
          </View>
        </View>
      ) : (
        <View style={[styles.optionAccent, selected && styles.optionAccentSelected]}>
          <MaterialDesignIcons
            color={selected ? COLORS.primary : '#A695C3'}
            name="star-four-points-outline"
            size={17}
          />
        </View>
      )}

      <View style={styles.copy}>
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {label}
        </Text>

        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>

      <View
        style={[
          checkbox ? styles.checkbox : styles.radio,
          selected && styles.selectedMark,
        ]}>
        {selected ? (
          <MaterialDesignIcons
            color="#FFFFFF"
            name={checkbox ? 'check' : 'circle'}
            size={checkbox ? 15 : 9}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

/* ============================================================
 * SHARED INFO
 * ============================================================ */

function Info({
  text,
  icon = 'heart-outline',
}: {
  text: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcon}>
        <MaterialDesignIcons
          color={COLORS.primary}
          name={icon}
          size={22}
        />
      </View>

      <Text style={styles.infoText}>
        {text}
      </Text>
    </View>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

const styles = StyleSheet.create({
  // Exact copy of ProfileScreen.tsx's background — used by all Conception onboarding screens.
  profileGradientBackground: {
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

  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
  },

  /* HEADER */

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 2,
  },

  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.10)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#5C3A8D',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  title: {
    alignSelf: 'center',
    maxWidth: 330,
    marginTop: 8,
    color: COLORS.text,
    fontFamily: 'serif',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
  },

  subtitle: {
    alignSelf: 'center',
    maxWidth: 315,
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },

  /* GENERIC LIST */

  list: {
    gap: 9,
  },

  listTop: {
    marginTop: 15,
  },

  choice: {
    position: 'relative',
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(112,77,178,0.12)',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#6B4C9B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.045,
    shadowRadius: 9,
    elevation: 2,
  },

  choiceSelected: {
    borderColor: 'rgba(105,73,190,0.52)',
    backgroundColor: '#FEFCFF',
    shadowColor: '#6949BE',
    shadowOpacity: 0.12,
    shadowRadius: 13,
    elevation: 4,
  },

  choicePressed: {
    opacity: 0.88,
    transform: [{scale: 0.992}],
  },

  optionAccent: {
    width: 38,
    height: 38,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#F7F1FC',
  },

  optionAccentSelected: {
    backgroundColor: '#EEE5FB',
  },

  copy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  label: {
    color: '#261C47',
    fontSize: 13.2,
    lineHeight: 17,
    fontWeight: '700',
  },

  labelSelected: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },

  description: {
    marginTop: 4,
    color: '#655B78',
    fontSize: 10.6,
    lineHeight: 15,
  },

  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CDC4DA',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CDC4DA',
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },

  selectedMark: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  iconBox: {
    width: 48,
    height: 48,
    marginRight: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F6ECF7',
  },

  iconBoxSelected: {
    backgroundColor: '#EEE4FB',
  },

  iconInner: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  iconInnerSelected: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 3,
  },

  /* INFO */

  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.07)',
    borderRadius: 16,
    backgroundColor: 'rgba(247,241,252,0.92)',
  },

  infoIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#68479C',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },

  infoText: {
    flex: 1,
    color: '#5F5576',
    fontSize: 10.5,
    lineHeight: 15,
  },

  /* REMINDER SCREEN */

  reminderList: {
    gap: 12,
    marginTop: 21,
  },

  reminderCard: {
    position: 'relative',
    overflow: 'hidden',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(112,77,178,0.11)',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#664692',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.055,
    shadowRadius: 12,
    elevation: 2,
  },

  reminderCardActive: {
    borderColor: 'rgba(105,73,190,0.30)',
    backgroundColor: '#FFFDFF',
    shadowColor: '#6949BE',
    shadowOpacity: 0.11,
    shadowRadius: 14,
    elevation: 4,
  },

  reminderAccent: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    left: 0,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  reminderAccentInactive: {
    opacity: 0.22,
  },

  reminderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reminderIcon: {
    width: 54,
    height: 54,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 18,
  },

  reminderCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 7,
  },

  reminderTitle: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: '800',
  },

  reminderDescription: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 10.8,
    lineHeight: 15,
  },

  reminderDetailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(105,73,190,0.06)',
    borderRadius: 14,
    backgroundColor: '#F7F2FC',
  },

  reminderDetailIcon: {
    width: 30,
    height: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#EDE2FB',
  },

  reminderDetailText: {
    flex: 1,
    color: '#523D83',
    fontSize: 9.8,
    lineHeight: 14,
  },

  journalIncludedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(244,237,252,0.72)',
  },

  journalIncludedIcon: {
    width: 30,
    height: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  journalIncludedText: {
    flex: 1,
    color: '#65557E',
    fontSize: 9.6,
    lineHeight: 14,
  },

  privacyReminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(98,174,136,0.15)',
    borderRadius: 20,
    backgroundColor: 'rgba(249,255,252,0.94)',
    shadowColor: '#5D7F6F',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },

  privacyReminderIcon: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#E8F5EE',
  },

  privacyReminderCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
  },

  privacyReminderTitle: {
    color: COLORS.text,
    fontSize: 12.5,
    fontWeight: '800',
  },

  privacyReminderText: {
    marginTop: 3,
    color: COLORS.textSecondary,
    fontSize: 9.7,
    lineHeight: 14,
  },

  settingsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 17,
    backgroundColor: 'rgba(246,239,252,0.84)',
  },

  settingsNoticeText: {
    flex: 1,
    color: '#62557A',
    fontSize: 10.2,
    lineHeight: 15,
  },

  /* NAVIGATION */

  navRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 14,
  },

  primary: {
    width: '72%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryDark,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.20,
    shadowRadius: 9,
    elevation: 4,
  },

  primaryPressed: {
    opacity: 0.89,
    transform: [{scale: 0.985}],
  },

  disabled: {
    opacity: 0.42,
    elevation: 0,
  },

  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
  },
});