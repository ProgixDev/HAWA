import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import Animated, {
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import type {RootStackParamList} from '../navigation/AppNavigator';
import {
  calculateBmi,
  classifyBmi,
  getCachedGeneralHealth,
  loadGeneralHealth,
  updateGeneralHealth,
  type GeneralHealthProfile,
} from '../state/generalHealthStore';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'GeneralHealth'
>;

type IconName =
  React.ComponentProps<
    typeof MaterialDesignIcons
  >['name'];

type Sheet =
  | 'height'
  | 'weight'
  | 'blood'
  | 'conditions'
  | 'treatments'
  | 'allergies'
  | 'notes'
  | 'goal'
  | null;

const BLOOD_TYPES = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

const CONDITIONS = [
  'Asthme',
  'Diabète',
  'Hypertension',
  'Thyroïde',
  'Endométriose',
  'SOPK',
];

const ALLERGIES = [
  'Médicaments',
  'Aliments',
  'Pollen',
  'Poussière',
  'Latex',
];

const GOALS = [
  'Rester en forme et en bonne santé',
  'Améliorer mon sommeil',
  'Bouger davantage',
  'Suivre mon poids',
  'Réduire mon stress',
];

function formatUpdateDate(
  value: string,
): string {
  const date =
    new Date(
      `${value}T12:00:00`,
    );

  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(date);
}

function listValue(
  values: string[],
  empty: string,
): string {
  return values.length
    ? values.join(', ')
    : empty;
}

/* ============================================================
 * PHYSICAL ROW
 * ============================================================ */

function HealthRow({
  icon,
  label,
  value,
  onPress,
  last,
  valueNode,
  theme,
  styles,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
  valueNode?: React.ReactNode;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={`${label}, ${value}`}
      accessibilityRole={
        onPress
          ? 'button'
          : 'text'
      }
      disabled={!onPress}
      onPress={onPress}
      style={({pressed}) => [
        styles.row,
        !last &&
          styles.rowBorder,
        pressed &&
          Boolean(onPress) &&
          styles.pressed,
      ]}>
      <View
        style={
          styles.rowIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={20}
        />
      </View>

      <View
        style={
          styles.rowCopy
        }>
        <Text
          style={
            styles.rowLabel
          }>
          {label}
        </Text>

        {valueNode ?? (
          <Text
            style={
              styles.rowValue
            }>
            {value}
          </Text>
        )}
      </View>

      {onPress ? (
        <MaterialDesignIcons
          color={theme.colors.textMuted}
          name="chevron-right"
          size={24}
        />
      ) : null}
    </Pressable>
  );
}

/* ============================================================
 * MEDICAL ROW
 * ============================================================ */

function MedicalRow({
  icon,
  title,
  value,
  helper,
  onPress,
  last,
  theme,
  styles,
}: {
  icon: IconName;
  title: string;
  value: string;
  helper: string;
  onPress: () => void;
  last?: boolean;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={`${title}, ${value}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.medicalRow,
        !last &&
          styles.medicalRowBorder,
        pressed &&
          styles.pressed,
      ]}>
      <View
        style={
          styles.medicalIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={21}
        />
      </View>

      <View
        style={
          styles.medicalCopy
        }>
        <Text
          style={
            styles.medicalTitle
          }>
          {title}
        </Text>

        <Text
          style={
            styles.medicalValue
          }>
          {value}
        </Text>

        <Text
          style={
            styles.medicalHelper
          }>
          {helper}
        </Text>
      </View>

      <View
        style={
          styles.medicalChevron
        }>
        <MaterialDesignIcons
          color={theme.colors.textMuted}
          name="chevron-right"
          size={23}
        />
      </View>
    </Pressable>
  );
}

/* ============================================================
 * SECTION HEADER
 * ============================================================ */

function SectionHeader({
  icon,
  title,
  subtitle,
  theme,
  styles,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View
      style={
        styles.sectionHeader
      }>
      <View
        style={
          styles.sectionIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={18}
        />
      </View>

      <View
        style={
          styles.sectionCopy
        }>
        <Text
          style={
            styles.sectionTitle
          }>
          {title}
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
 * BLOOD TYPE BUTTON
 * ============================================================ */

function BloodChoice({
  label,
  selected,
  onPress,
  theme,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{
        checked: selected,
      }}
      onPress={onPress}
      style={({pressed}) => [
        styles.bloodChoice,
        selected &&
          styles.bloodChoiceSelected,
        pressed &&
          styles.pressed,
      ]}>
      <Text
        numberOfLines={1}
        style={[
          styles.bloodChoiceText,
          selected &&
            styles.choiceTextSelected,
        ]}>
        {label}
      </Text>

      {selected ? (
        <MaterialDesignIcons
          color={theme.colors.primary}
          name="check"
          size={17}
        />
      ) : null}
    </Pressable>
  );
}

/* ============================================================
 * MEDICAL CHOICE
 * ============================================================ */

function MedicalChoice({
  label,
  selected,
  onPress,
  theme,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: selected,
      }}
      onPress={onPress}
      style={({pressed}) => [
        styles.medicalChoice,
        selected &&
          styles.medicalChoiceSelected,
        pressed &&
          styles.pressed,
      ]}>
      <View
        style={
          styles.medicalChoiceTextBox
        }>
        <Text
          numberOfLines={2}
          style={[
            styles.medicalChoiceText,
            selected &&
              styles.choiceTextSelected,
          ]}>
          {label}
        </Text>
      </View>

      <View
        style={[
          styles.choiceIndicator,
          selected &&
            styles.choiceIndicatorSelected,
        ]}>
        {selected ? (
          <MaterialDesignIcons
            color={onPrimaryTextColor(theme)}
            name="check"
            size={13}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

/* ============================================================
 * GOAL OPTION
 * ============================================================ */

function GoalOption({
  label,
  selected,
  onPress,
  theme,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{
        checked: selected,
      }}
      onPress={onPress}
      style={({pressed}) => [
        styles.goalOption,
        selected &&
          styles.goalOptionSelected,
        pressed &&
          styles.pressed,
      ]}>
      <Text
        style={[
          styles.goalOptionText,
          selected &&
            styles.choiceTextSelected,
        ]}>
        {label}
      </Text>

      {selected ? (
        <MaterialDesignIcons
          color={theme.colors.primary}
          name="check-circle"
          size={21}
        />
      ) : (
        <View
          style={
            styles.radio
          }
        />
      )}
    </Pressable>
  );
}

/* ============================================================
 * SAVE BUTTON
 * ============================================================ */

function SaveButton({
  onPress,
  theme,
  styles,
}: {
  onPress: () => void;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.saveButton,
        pressed &&
          styles.pressed,
      ]}>
      <MaterialDesignIcons
        color={onPrimaryTextColor(theme)}
        name="check"
        size={20}
      />

      <Text
        style={
          styles.saveButtonText
        }>
        Enregistrer
      </Text>
    </Pressable>
  );
}

/* ============================================================
 * SCREEN
 * ============================================================ */

export default function GeneralHealthScreen({
  navigation,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const insets =
    useSafeAreaInsets();

  const {
    width,
    height,
  } =
    useWindowDimensions();

  const compact =
    width < 360 ||
    height < 700;

  const [
    profile,
    setProfile,
  ] =
    useState(
      getCachedGeneralHealth(),
    );

  const [
    sheet,
    setSheet,
  ] =
    useState<Sheet>(null);

  const [
    draft,
    setDraft,
  ] =
    useState('');

  const [
    custom,
    setCustom,
  ] =
    useState('');

  const [
    selected,
    setSelected,
  ] =
    useState<string[]>([]);

  const [
    draftProgress,
    setDraftProgress,
  ] =
    useState(
      profile.goalProgress,
    );

  const [
    error,
    setError,
  ] =
    useState('');

  const [
    toast,
    setToast,
  ] =
    useState(false);

  useEffect(() => {
    loadGeneralHealth().then(
      setProfile,
    );
  }, []);

  const bmi =
    useMemo(
      () =>
        calculateBmi(
          profile.heightCm,
          profile.weightKg,
        ),
      [
        profile.heightCm,
        profile.weightKg,
      ],
    );

  const bmiClass =
    classifyBmi(bmi);

  const open = (
    next: Sheet,
  ) => {
    setSheet(next);
    setError('');
    setCustom('');

    if (
      next === 'height'
    ) {
      setDraft(
        String(
          profile.heightCm,
        ),
      );
    }

    if (
      next === 'weight'
    ) {
      setDraft(
        String(
          profile.weightKg,
        ),
      );
    }

    if (
      next === 'notes'
    ) {
      setDraft(
        profile.medicalNotes,
      );
    }

    if (
      next ===
      'treatments'
    ) {
      setSelected([
        ...profile.treatments,
      ]);

      setDraft('');
    }

    if (
      next ===
      'conditions'
    ) {
      setSelected([
        ...profile.chronicConditions,
      ]);
    }

    if (
      next ===
      'allergies'
    ) {
      setSelected([
        ...profile.allergies,
      ]);
    }

    if (
      next === 'goal'
    ) {
      setDraft(
        profile.healthGoal,
      );

      setDraftProgress(
        profile.goalProgress,
      );
    }
  };

  const persist =
    async (
      patch: Partial<GeneralHealthProfile>,
    ) => {
      const next =
        await updateGeneralHealth(
          patch,
        );

      setProfile(next);
      setSheet(null);
      setToast(true);

      setTimeout(
        () =>
          setToast(false),
        2200,
      );
    };

  const saveMeasure =
    () => {
      const value =
        Number(
          draft.replace(
            ',',
            '.',
          ),
        );

      if (
        !Number.isFinite(
          value,
        ) ||
        value <= 0
      ) {
        setError(
          'Saisis une valeur positive valide.',
        );

        return;
      }

      if (
        sheet ===
          'height' &&
        (value < 80 ||
          value > 250)
      ) {
        setError(
          'Saisis une taille comprise entre 80 et 250 cm.',
        );

        return;
      }

      if (
        sheet ===
          'weight' &&
        (value < 20 ||
          value > 400)
      ) {
        setError(
          'Saisis un poids compris entre 20 et 400 kg.',
        );

        return;
      }

      persist(
        sheet === 'height'
          ? {
              heightCm:
                value,
            }
          : {
              weightKg:
                value,
            },
      );
    };

  const toggle = (
    item: string,
  ) => {
    setSelected(
      current =>
        current.includes(
          item,
        )
          ? current.filter(
              value =>
                value !==
                item,
            )
          : [
              ...current,
              item,
            ],
    );
  };

  const saveMulti = (
    key:
      | 'chronicConditions'
      | 'allergies',
  ) => {
    const addition =
      custom.trim();

    persist({
      [key]:
        addition &&
        !selected.includes(
          addition,
        )
          ? [
              ...selected,
              addition,
            ]
          : selected,
    });
  };

  const addTreatment =
    () => {
      const value =
        draft.trim();

      if (!value) {
        setError(
          'Indique le nom du traitement.',
        );

        return;
      }

      setSelected(
        current =>
          current.includes(
            value,
          )
            ? current
            : [
                ...current,
                value,
              ],
      );

      setDraft('');
      setError('');
    };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[
        0,
        0.34,
        0.72,
        1,
      ]}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 1,
        y: 1,
      }}
      style={
        styles.background
      }>
      <View
        pointerEvents="none"
        style={
          styles.backgroundDecoration
        }>
        <View
          style={
            styles.glowTop
          }
        />

        <View
          style={
            styles.glowBottom
          }
        />
      </View>

      <SafeAreaView
        edges={[
          'left',
          'right',
        ]}
        style={
          styles.safe
        }>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={theme.statusBarStyle}
        />

        <ScrollView
          contentContainerStyle={[
            styles.content,
            compact &&
              styles.contentCompact,
            {
              paddingTop:
                Math.max(
                  insets.top,
                  18,
                ) + 8,

              paddingBottom:
                Math.max(
                  insets.bottom,
                  18,
                ) + 28,
            },
          ]}
          showsVerticalScrollIndicator={
            false
          }>
          {/* HEADER */}

          <Animated.View
            entering={FadeIn.duration(
              300,
            )}
            style={
              styles.header
            }>
            <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              onPress={
                navigation.goBack
              }
              style={({
                pressed,
              }) => [
                styles.backButton,
                pressed &&
                  styles.pressed,
              ]}>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="chevron-left"
                size={27}
              />
            </Pressable>

            <View
              style={
                styles.headerCopy
              }>
              <Text
                style={
                  styles.pageTitle
                }>
                Santé générale
              </Text>

              <Text
                style={
                  styles.pageSubtitle
                }>
                Tes informations de santé au même endroit
              </Text>
            </View>

            <View
              style={
                styles.headerIcon
              }>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="heart-pulse"
                size={24}
              />
            </View>
          </Animated.View>

          {/* PRIVACY */}

          <Animated.View
            entering={FadeInUp.delay(
              70,
            ).duration(420)}
            style={
              styles.privacyCard
            }>
            <View
              style={
                styles.privacyIcon
              }>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="shield-lock-outline"
                size={28}
              />
            </View>

            <View
              style={
                styles.privacyCopy
              }>
              <Text
                style={
                  styles.privacyTitle
                }>
                Tes informations sont privées
              </Text>

              <Text
                style={
                  styles.privacyText
                }>
                Elles servent à personnaliser ton suivi AWA et restent modifiables à tout moment.
              </Text>
            </View>
          </Animated.View>

          {/* PHYSICAL */}

          <SectionHeader
            icon="human"
            styles={styles}
            subtitle="Tes mesures principales"
            theme={theme}
            title="Informations physiques"
          />

          <Animated.View
            entering={FadeInUp.delay(
              130,
            ).duration(420)}
            style={
              styles.card
            }>
            <HealthRow
              icon="human-male-height"
              label="Taille"
              onPress={() =>
                open(
                  'height',
                )
              }
              styles={styles}
              theme={theme}
              value={`${profile.heightCm} cm`}
            />

            <HealthRow
              icon="scale-bathroom"
              label="Poids actuel"
              onPress={() =>
                open(
                  'weight',
                )
              }
              styles={styles}
              theme={theme}
              value={`${profile.weightKg} kg`}
            />

            <HealthRow
              icon="weight"
              label="IMC"
              onPress={() =>
                open(
                  profile.heightCm
                    ? 'weight'
                    : 'height',
                )
              }
              styles={styles}
              theme={theme}
              value={
                bmi
                  ? bmi.toFixed(
                      1,
                    )
                  : bmiClass
              }
              valueNode={
                <Text
                  style={
                    styles.rowValue
                  }>
                  {bmi
                    ? `${bmi
                        .toFixed(
                          1,
                        )
                        .replace(
                          '.',
                          ',',
                        )} • `
                    : ''}

                  <Text
                    style={
                      bmiClass ===
                      'Normal'
                        ? styles.success
                        : styles.bmiClass
                    }>
                    {
                      bmiClass
                    }
                  </Text>
                </Text>
              }
            />

            <HealthRow
              icon="water-outline"
              label="Groupe sanguin"
              onPress={() =>
                open(
                  'blood',
                )
              }
              styles={styles}
              theme={theme}
              value={
                profile.bloodType
              }
            />

            <HealthRow
              icon="calendar-month-outline"
              label="Dernière mise à jour"
              last
              styles={styles}
              theme={theme}
              value={formatUpdateDate(
                profile.updatedAt,
              )}
            />
          </Animated.View>

          {/* MEDICAL */}

          <SectionHeader
            icon="medical-bag"
            styles={styles}
            subtitle="Les informations importantes à conserver"
            theme={theme}
            title="Informations médicales"
          />

          <Animated.View
            entering={FadeInUp.delay(
              190,
            ).duration(420)}
            style={
              styles.medicalCard
            }>
            <MedicalRow
              helper="Appuie pour ajouter ou modifier"
              icon="heart-plus-outline"
              onPress={() =>
                open(
                  'conditions',
                )
              }
              styles={styles}
              theme={theme}
              title="Maladies chroniques"
              value={listValue(
                profile.chronicConditions,
                'Aucune maladie chronique renseignée',
              )}
            />

            <MedicalRow
              helper="Nom, dosage ou fréquence"
              icon="pill"
              onPress={() =>
                open(
                  'treatments',
                )
              }
              styles={styles}
              theme={theme}
              title="Traitements en cours"
              value={listValue(
                profile.treatments,
                'Aucun traitement renseigné',
              )}
            />

            <MedicalRow
              helper="Médicaments, aliments ou autres"
              icon="allergy"
              onPress={() =>
                open(
                  'allergies',
                )
              }
              styles={styles}
              theme={theme}
              title="Allergies"
              value={listValue(
                profile.allergies,
                'Aucune allergie renseignée',
              )}
            />

            <MedicalRow
              helper="Tes informations personnelles complémentaires"
              icon="clipboard-text-outline"
              last
              onPress={() =>
                open(
                  'notes',
                )
              }
              styles={styles}
              theme={theme}
              title="Notes médicales"
              value={
                profile.medicalNotes ||
                'Aucune note médicale ajoutée'
              }
            />
          </Animated.View>

          {/* GOAL */}

          <SectionHeader
            icon="target"
            styles={styles}
            subtitle="Ton objectif personnel actuel"
            theme={theme}
            title="Objectifs de santé"
          />

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              open(
                'goal',
              )
            }
            style={({
              pressed,
            }) => [
              styles.goalCard,
              pressed &&
                styles.pressed,
            ]}>
            <View
              style={
                styles.goalIcon
              }>
              <MaterialDesignIcons
                color={theme.colors.primary}
                name="target"
                size={22}
              />
            </View>

            <View
              style={
                styles.goalCopy
              }>
              <Text
                style={
                  styles.rowLabel
                }>
                Mon objectif actuel
              </Text>

              <Text
                style={
                  styles.goalValue
                }>
                {
                  profile.healthGoal
                }
              </Text>

              <View
                style={
                  styles.progressRow
                }>
                <Text
                  style={
                    styles.progressPercent
                  }>
                  {
                    profile.goalProgress
                  }
                  %
                </Text>

                <View
                  style={
                    styles.progressTrack
                  }>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${profile.goalProgress}%`,
                      },
                    ]}
                  />
                </View>

                <Text
                  style={
                    styles.progressStatus
                  }>
                  En cours
                </Text>
              </View>
            </View>

            <MaterialDesignIcons
              color={theme.colors.textMuted}
              name="chevron-right"
              size={23}
            />
          </Pressable>

          <View
            style={
              styles.infoCard
            }>
            <MaterialDesignIcons
              color={theme.colors.primary}
              name="information-outline"
              size={20}
            />

            <Text
              style={
                styles.infoText
              }>
              Tu peux modifier toutes ces informations à tout moment.
            </Text>
          </View>
        </ScrollView>

        {/* ====================================================
            MODAL
        ==================================================== */}

        <Modal
          animationType="slide"
          onRequestClose={() =>
            setSheet(null)
          }
          statusBarTranslucent
          transparent
          visible={
            sheet !==
            null
          }>
          <KeyboardAvoidingView
            behavior={
              Platform.OS ===
              'ios'
                ? 'padding'
                : undefined
            }
            style={
              styles.modalRoot
            }>
            <Pressable
              accessibilityLabel="Fermer"
              onPress={() =>
                setSheet(
                  null,
                )
              }
              style={
                styles.backdrop
              }
            />

            <View
              style={[
                styles.sheet,
                {
                  paddingBottom:
                    Math.max(
                      insets.bottom,
                      16,
                    ),
                },
              ]}>
              <View
                style={
                  styles.handle
                }
              />

              <ScrollView
                bounces={false}
                contentContainerStyle={
                  styles.sheetContent
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                  false
                }>

                {/* HEIGHT / WEIGHT */}

                {(sheet ===
                  'height' ||
                  sheet ===
                    'weight') ? (
                  <>
                    <SheetHeader
                      icon={
                        sheet ===
                        'height'
                          ? 'human-male-height'
                          : 'scale-bathroom'
                      }
                      styles={styles}
                      subtitle="Mets à jour cette information."
                      theme={theme}
                      title={
                        sheet ===
                        'height'
                          ? 'Modifier ma taille'
                          : 'Modifier mon poids'
                      }
                    />

                    <Text
                      style={
                        styles.inputLabel
                      }>
                      {sheet ===
                      'height'
                        ? 'Taille en centimètres'
                        : 'Poids en kilogrammes'}
                    </Text>

                    <View
                      style={
                        styles.measureInput
                      }>
                      <TextInput
                        autoFocus
                        keyboardType="decimal-pad"
                        onChangeText={value => {
                          setDraft(
                            value,
                          );

                          setError(
                            '',
                          );
                        }}
                        style={
                          styles.largeInput
                        }
                        value={
                          draft
                        }
                      />

                      <Text
                        style={
                          styles.unit
                        }>
                        {sheet ===
                        'height'
                          ? 'cm'
                          : 'kg'}
                      </Text>
                    </View>

                    {error ? (
                      <Text
                        style={
                          styles.errorText
                        }>
                        {
                          error
                        }
                      </Text>
                    ) : null}

                    <SaveButton
                      onPress={
                        saveMeasure
                      }
                      styles={styles}
                      theme={theme}
                    />
                  </>
                ) : null}

                {/* BLOOD */}

                {sheet ===
                'blood' ? (
                  <>
                    <SheetHeader
                      icon="water-outline"
                      styles={styles}
                      subtitle="Sélectionne ton groupe sanguin si tu le connais."
                      theme={theme}
                      title="Groupe sanguin"
                    />

                    <View
                      style={
                        styles.bloodGrid
                      }>
                      {BLOOD_TYPES.map(
                        item => (
                          <BloodChoice
                            key={
                              item
                            }
                            label={
                              item
                            }
                            onPress={() =>
                              persist(
                                {
                                  bloodType:
                                    item,
                                },
                              )
                            }
                            selected={
                              profile.bloodType ===
                              item
                            }
                            styles={styles}
                            theme={theme}
                          />
                        ),
                      )}
                    </View>
                  </>
                ) : null}

                {/* CONDITIONS / ALLERGIES */}

                {(sheet ===
                  'conditions' ||
                  sheet ===
                    'allergies') ? (
                  <>
                    <SheetHeader
                      icon={
                        sheet ===
                        'conditions'
                          ? 'heart-plus-outline'
                          : 'allergy'
                      }
                      styles={styles}
                      subtitle={
                        sheet ===
                        'conditions'
                          ? 'Sélectionne les maladies déjà connues. Tu peux choisir plusieurs éléments.'
                          : 'Sélectionne les allergies déjà connues. Tu peux choisir plusieurs éléments.'
                      }
                      theme={theme}
                      title={
                        sheet ===
                        'conditions'
                          ? 'Maladies chroniques'
                          : 'Allergies'
                      }
                    />

                    <View
                      style={
                        styles.medicalChoicesGrid
                      }>
                      {(sheet ===
                      'conditions'
                        ? CONDITIONS
                        : ALLERGIES
                      ).map(
                        item => (
                          <MedicalChoice
                            key={
                              item
                            }
                            label={
                              item
                            }
                            onPress={() =>
                              toggle(
                                item,
                              )
                            }
                            selected={selected.includes(
                              item,
                            )}
                            styles={styles}
                            theme={theme}
                          />
                        ),
                      )}
                    </View>

                    <Text
                      style={
                        styles.inputLabel
                      }>
                      Autre information
                    </Text>

                    <TextInput
                      onChangeText={
                        setCustom
                      }
                      placeholder="Ajoute une autre information (optionnel)"
                      placeholderTextColor={theme.colors.textMuted}
                      style={
                        styles.textInput
                      }
                      value={
                        custom
                      }
                    />

                    <SaveButton
                      onPress={() =>
                        saveMulti(
                          sheet ===
                          'conditions'
                            ? 'chronicConditions'
                            : 'allergies',
                        )
                      }
                      styles={styles}
                      theme={theme}
                    />
                  </>
                ) : null}

                {/* TREATMENTS */}

                {sheet ===
                'treatments' ? (
                  <>
                    <SheetHeader
                      icon="pill"
                      styles={styles}
                      subtitle="Ajoute les traitements que tu prends actuellement."
                      theme={theme}
                      title="Traitements en cours"
                    />

                    <Text
                      style={
                        styles.inputLabel
                      }>
                      Nouveau traitement
                    </Text>

                    <View
                      style={
                        styles.treatmentInputRow
                      }>
                      <TextInput
                        onChangeText={value => {
                          setDraft(
                            value,
                          );
                          setError(
                            '',
                          );
                        }}
                        placeholder="Ex. Fer 20 mg, chaque matin"
                        placeholderTextColor={theme.colors.textMuted}
                        style={[
                          styles.textInput,
                          styles.flexInput,
                        ]}
                        value={
                          draft
                        }
                      />

                      <Pressable
                        accessibilityLabel="Ajouter le traitement"
                        accessibilityRole="button"
                        onPress={
                          addTreatment
                        }
                        style={
                          styles.addButton
                        }>
                        <MaterialDesignIcons
                          color={onPrimaryTextColor(theme)}
                          name="plus"
                          size={22}
                        />
                      </Pressable>
                    </View>

                    {error ? (
                      <Text
                        style={
                          styles.errorText
                        }>
                        {
                          error
                        }
                      </Text>
                    ) : null}

                    {selected.length >
                    0 ? (
                      <>
                        <Text
                          style={
                            styles.selectedTitle
                          }>
                          Traitements ajoutés
                        </Text>

                        <View
                          style={
                            styles.selectedList
                          }>
                          {selected.map(
                            item => (
                              <Pressable
                                key={
                                  item
                                }
                                onPress={() =>
                                  toggle(
                                    item,
                                  )
                                }
                                style={
                                  styles.selectedTag
                                }>
                                <Text
                                  style={
                                    styles.selectedTagText
                                  }>
                                  {
                                    item
                                  }
                                </Text>

                                <MaterialDesignIcons
                                  color={theme.colors.primary}
                                  name="close"
                                  size={16}
                                />
                              </Pressable>
                            ),
                          )}
                        </View>
                      </>
                    ) : (
                      <View
                        style={
                          styles.emptyState
                        }>
                        <MaterialDesignIcons
                          color={theme.colors.primary}
                          name="pill"
                          size={23}
                        />

                        <Text
                          style={
                            styles.emptyStateText
                          }>
                          Aucun traitement ajouté.
                        </Text>
                      </View>
                    )}

                    <SaveButton
                      onPress={() =>
                        persist(
                          {
                            treatments:
                              selected,
                          },
                        )
                      }
                      styles={styles}
                      theme={theme}
                    />
                  </>
                ) : null}

                {/* NOTES */}

                {sheet ===
                'notes' ? (
                  <>
                    <SheetHeader
                      icon="clipboard-text-outline"
                      styles={styles}
                      subtitle="Ajoute uniquement les informations que tu souhaites conserver."
                      theme={theme}
                      title="Notes médicales"
                    />

                    <TextInput
                      autoFocus
                      maxLength={
                        500
                      }
                      multiline
                      onChangeText={
                        setDraft
                      }
                      placeholder="Ajoute ici tes informations importantes..."
                      placeholderTextColor={theme.colors.textMuted}
                      style={[
                        styles.textInput,
                        styles.notesInput,
                      ]}
                      textAlignVertical="top"
                      value={
                        draft
                      }
                    />

                    <Text
                      style={
                        styles.characterCounter
                      }>
                      {
                        draft.length
                      }{' '}
                      / 500
                    </Text>

                    <SaveButton
                      onPress={() =>
                        persist(
                          {
                            medicalNotes:
                              draft.trim(),
                          },
                        )
                      }
                      styles={styles}
                      theme={theme}
                    />
                  </>
                ) : null}

                {/* GOAL */}

                {sheet ===
                'goal' ? (
                  <>
                    <SheetHeader
                      icon="target"
                      styles={styles}
                      subtitle="Choisis l’objectif qui correspond le mieux à ton suivi actuel."
                      theme={theme}
                      title="Mon objectif de santé"
                    />

                    {GOALS.map(
                      item => (
                        <GoalOption
                          key={
                            item
                          }
                          label={
                            item
                          }
                          onPress={() =>
                            setDraft(
                              item,
                            )
                          }
                          selected={
                            draft ===
                            item
                          }
                          styles={styles}
                          theme={theme}
                        />
                      ),
                    )}

                    <Text
                      style={
                        styles.inputLabel
                      }>
                      Progression personnelle :{' '}
                      {
                        draftProgress
                      }
                      %
                    </Text>

                    <View
                      style={
                        styles.progressChoices
                      }>
                      {[
                        20,
                        40,
                        60,
                        80,
                        100,
                      ].map(
                        value => (
                          <Pressable
                            key={
                              value
                            }
                            onPress={() =>
                              setDraftProgress(
                                value,
                              )
                            }
                            style={[
                              styles.progressChoice,
                              draftProgress ===
                                value &&
                                styles.progressChoiceSelected,
                            ]}>
                            <Text
                              style={[
                                styles.progressChoiceText,
                                draftProgress ===
                                  value &&
                                  styles.choiceTextSelected,
                              ]}>
                              {
                                value
                              }
                              %
                            </Text>
                          </Pressable>
                        ),
                      )}
                    </View>

                    <SaveButton
                      onPress={() =>
                        persist(
                          {
                            healthGoal:
                              draft ||
                              profile.healthGoal,

                            goalProgress:
                              draftProgress,
                          },
                        )
                      }
                      styles={styles}
                      theme={theme}
                    />
                  </>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    setSheet(
                      null,
                    )
                  }
                  style={
                    styles.cancelButton
                  }>
                  <Text
                    style={
                      styles.cancelText
                    }>
                    Annuler
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {toast ? (
          <Animated.View
            entering={FadeInUp.springify()}
            style={[
              styles.toast,
              {
                bottom:
                  Math.max(
                    insets.bottom,
                    18,
                  ) + 12,
              },
            ]}>
            <MaterialDesignIcons
              color={onPrimaryTextColor(theme)}
              name="check"
              size={16}
            />

            <Text
              style={
                styles.toastText
              }>
              Informations mises à jour
            </Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
 * SHEET HEADER
 * ============================================================ */

function SheetHeader({
  icon,
  title,
  subtitle,
  theme,
  styles,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  theme: ResolvedAwaTheme;
  styles: ReturnType<typeof createStyles>;
}): React.JSX.Element {
  return (
    <View
      style={
        styles.sheetHeader
      }>
      <View
        style={
          styles.sheetIcon
        }>
        <MaterialDesignIcons
          color={theme.colors.primary}
          name={icon}
          size={24}
        />
      </View>

      <Text
        style={
          styles.sheetTitle
        }>
        {title}
      </Text>

      <Text
        style={
          styles.sheetSubtitle
        }>
        {subtitle}
      </Text>
    </View>
  );
}

/* ============================================================
 * STYLES
 * ============================================================ */

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    background: {
      flex: 1,
    },

    safe: {
      flex: 1,
      backgroundColor:
        'transparent',
    },

    backgroundDecoration: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },

    glowTop: {
      position: 'absolute',
      top: -130,
      right: -100,
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.07),
    },

    glowBottom: {
      position: 'absolute',
      bottom: 80,
      left: -130,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.08),
    },

    content: {
      flexGrow: 1,
      gap: 13,
      paddingHorizontal: 16,
    },

    contentCompact: {
      paddingHorizontal: 12,
    },

    pressed: {
      opacity: 0.78,
    },

    /* HEADER */

    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 22,
      backgroundColor:
        theme.colors.surface,
      elevation: 2,
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 11,
    },

    pageTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 24,
      fontWeight: '800',
    },

    pageSubtitle: {
      marginTop: 3,
      color: theme.colors.textSecondary,
      fontSize: 11,
      lineHeight: 15,
    },

    headerIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor:
        theme.colors.primarySoft,
    },

    /* PRIVACY */

    privacyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      padding: 15,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 24,
      backgroundColor:
        theme.colors.surface,
      elevation: 2,
    },

    privacyIcon: {
      width: 55,
      height: 55,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 18,
      backgroundColor:
        theme.colors.primarySoft,
    },

    privacyCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 13,
    },

    privacyTitle: {
      color: theme.colors.accent,
      fontSize: 13.5,
      fontWeight: '800',
    },

    privacyText: {
      marginTop: 5,
      color: theme.colors.textSecondary,
      fontSize: 10.7,
      lineHeight: 16,
    },

    /* SECTION */

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 4,
      paddingHorizontal: 3,
    },

    sectionIcon: {
      width: 35,
      height: 35,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor:
        theme.colors.primarySoft,
    },

    sectionCopy: {
      flex: 1,
      minWidth: 0,
    },

    sectionTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '800',
    },

    sectionSubtitle: {
      marginTop: 2,
      color: theme.colors.textSecondary,
      fontSize: 9.8,
    },

    /* PHYSICAL */

    card: {
      overflow: 'hidden',
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 25,
      backgroundColor:
        theme.colors.surface,
      elevation: 2,
    },

    row: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },

    rowBorder: {
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        theme.colors.border,
    },

    rowIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 14,
      backgroundColor:
        theme.colors.primarySoft,
    },

    rowCopy: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 12,
    },

    rowLabel: {
      color: theme.colors.textSecondary,
      fontSize: 10.7,
      fontWeight: '600',
    },

    rowValue: {
      marginTop: 3,
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },

    success: {
      color: theme.colors.success,
    },

    bmiClass: {
      color: theme.colors.accent,
    },

    /* MEDICAL */

    medicalCard: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 25,
      backgroundColor:
        theme.colors.surface,
      elevation: 2,
    },

    medicalRow: {
      minHeight: 96,
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 15,
    },

    medicalRowBorder: {
      borderBottomWidth:
        StyleSheet.hairlineWidth,
      borderBottomColor:
        theme.colors.border,
    },

    medicalIcon: {
      width: 45,
      height: 45,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 15,
      backgroundColor:
        theme.colors.primarySoft,
    },

    medicalCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      paddingRight: 5,
    },

    medicalTitle: {
      color: theme.colors.accent,
      fontSize: 13,
      fontWeight: '800',
    },

    medicalValue: {
      marginTop: 5,
      color: theme.colors.text,
      fontSize: 11.5,
      lineHeight: 17,
      fontWeight: '600',
    },

    medicalHelper: {
      marginTop: 5,
      color: theme.colors.textMuted,
      fontSize: 9.5,
      lineHeight: 13,
    },

    medicalChevron: {
      height: 45,
      justifyContent: 'center',
      flexShrink: 0,
    },

    /* GOAL */

    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 24,
      backgroundColor:
        theme.colors.surface,
    },

    goalIcon: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 14,
      backgroundColor:
        theme.colors.primarySoft,
    },

    goalCopy: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 11,
    },

    goalValue: {
      marginTop: 4,
      color: theme.colors.accent,
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: '800',
    },

    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 10,
    },

    progressPercent: {
      color: theme.colors.primary,
      fontSize: 9.5,
      fontWeight: '800',
    },

    progressTrack: {
      flex: 1,
      height: 5,
      overflow: 'hidden',
      borderRadius: 999,
      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor:
        theme.colors.primary,
    },

    progressStatus: {
      color: theme.colors.textSecondary,
      fontSize: 9,
    },

    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 13,
      borderRadius: 18,
      backgroundColor:
        theme.colors.primarySoft,
    },

    infoText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
      lineHeight: 15,
    },

    /* MODAL */

    modalRoot: {
      flex: 1,
      justifyContent:
        'flex-end',
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        withAlpha(theme.colors.accent, 0.42),
    },

    sheet: {
      maxHeight: '84%',
      overflow: 'hidden',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      backgroundColor:
        theme.colors.surface,
      paddingHorizontal: 20,
      paddingTop: 10,
    },

    handle: {
      alignSelf: 'center',
      width: 50,
      height: 5,
      borderRadius: 999,
      backgroundColor:
        theme.colors.border,
    },

    sheetContent: {
      paddingTop: 4,
      paddingBottom: 4,
    },

    sheetHeader: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 5,
    },

    sheetIcon: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 9,
      borderRadius: 16,
      backgroundColor:
        theme.colors.primarySoft,
    },

    sheetTitle: {
      color: theme.colors.accent,
      fontFamily: 'serif',
      fontSize: 23,
      lineHeight: 29,
      fontWeight: '800',
      textAlign: 'center',
    },

    sheetSubtitle: {
      maxWidth: 340,
      marginTop: 7,
      color: theme.colors.textSecondary,
      fontSize: 11.3,
      lineHeight: 16,
      textAlign: 'center',
    },

    /* BLOOD GRID */

    bloodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
      rowGap: 10,
      marginTop: 17,
    },

    bloodChoice: {
      width: '23%',
      minHeight: 55,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 5,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 16,
      backgroundColor:
        theme.colors.surface,
    },

    bloodChoiceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor:
        theme.colors.primarySoft,
    },

    bloodChoiceText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },

    /* CONDITIONS / ALLERGIES */

    medicalChoicesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
      rowGap: 10,
      marginTop: 17,
    },

    medicalChoice: {
      width: '48%',
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 17,
      backgroundColor:
        theme.colors.surface,
    },

    medicalChoiceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor:
        theme.colors.primarySoft,
    },

    medicalChoiceTextBox: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },

    medicalChoiceText: {
      color: theme.colors.text,
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: '700',
    },

    choiceTextSelected: {
      color: theme.colors.primary,
      fontWeight: '800',
    },

    choiceIndicator: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginLeft: 7,
      borderWidth: 1.5,
      borderColor:
        theme.colors.border,
      borderRadius: 10,
      backgroundColor:
        theme.colors.surface,
    },

    choiceIndicatorSelected: {
      borderColor: theme.colors.primary,
      backgroundColor:
        theme.colors.primary,
    },

    /* INPUTS */

    inputLabel: {
      marginTop: 18,
      marginBottom: 8,
      color: theme.colors.accent,
      fontSize: 12.5,
      fontWeight: '800',
    },

    measureInput: {
      width: '72%',
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 20,
      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    largeInput: {
      flex: 1,
      paddingVertical: 13,
      color: theme.colors.accent,
      fontSize: 30,
      fontWeight: '800',
      textAlign: 'center',
    },

    unit: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: '800',
    },

    textInput: {
      minHeight: 50,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 17,
      backgroundColor:
        theme.colors.surfaceSecondary,
      color: theme.colors.accent,
      fontSize: 12.5,
    },

    notesInput: {
      minHeight: 140,
      lineHeight: 19,
    },

    characterCounter: {
      marginTop: 6,
      color: theme.colors.textSecondary,
      fontSize: 10,
      textAlign: 'right',
    },

    errorText: {
      marginTop: 7,
      color: theme.colors.danger,
      fontSize: 11,
    },

    /* TREATMENTS */

    treatmentInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    flexInput: {
      flex: 1,
    },

    addButton: {
      width: 50,
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor:
        theme.colors.primary,
    },

    selectedTitle: {
      marginTop: 17,
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '800',
    },

    selectedList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 9,
    },

    selectedTag: {
      maxWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor:
        theme.colors.primarySoft,
    },

    selectedTagText: {
      flexShrink: 1,
      color: theme.colors.primary,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
    },

    emptyState: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 15,
      padding: 13,
      borderRadius: 16,
      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    emptyStateText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: 10.5,
    },

    /* GOALS */

    goalOption: {
      minHeight: 53,
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 9,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 17,
      backgroundColor:
        theme.colors.surface,
    },

    goalOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor:
        theme.colors.primarySoft,
    },

    goalOptionText: {
      flex: 1,
      color: theme.colors.accent,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
    },

    radio: {
      width: 20,
      height: 20,
      borderWidth: 1.5,
      borderColor:
        theme.colors.border,
      borderRadius: 10,
    },

    progressChoices: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginTop: 2,
    },

    progressChoice: {
      width: '18%',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius: 14,
      backgroundColor:
        theme.colors.surface,
    },

    progressChoiceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor:
        theme.colors.primarySoft,
    },

    progressChoiceText: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
    },

    /* BUTTONS */

    saveButton: {
      minHeight: 55,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 19,
      paddingHorizontal: 18,
      borderRadius: 18,
      backgroundColor:
        theme.colors.primary,
      elevation: 3,
    },

    saveButtonText: {
      color: onPrimaryTextColor(theme),
      fontSize: 15.5,
      fontWeight: '800',
    },

    cancelButton: {
      alignItems: 'center',
      marginTop: 8,
      paddingVertical: 15,
    },

    cancelText: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },

    /* TOAST */

    toast: {
      position: 'absolute',
      left: '12%',
      right: '12%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 13,
      borderRadius: 18,
      backgroundColor:
        theme.colors.primary,
      elevation: 8,
    },

    toastText: {
      color: onPrimaryTextColor(theme),
      fontSize: 12.5,
      fontWeight: '800',
    },
  });
}
