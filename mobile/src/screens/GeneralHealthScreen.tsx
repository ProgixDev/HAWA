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

const PURPLE = '#6D4AE8';
const DARK = '#2F2258';
const MUTED = '#746D92';
const LIGHT_MUTED = '#A099B2';

const SUCCESS = '#3E9B63';

const CARD_BORDER = '#ECE5F4';
const LIGHT_PURPLE = '#F2EBFF';

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
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress?: () => void;
  last?: boolean;
  valueNode?: React.ReactNode;
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
          color={PURPLE}
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
          color="#ACA2BC"
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
}: {
  icon: IconName;
  title: string;
  value: string;
  helper: string;
  onPress: () => void;
  last?: boolean;
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
          color={PURPLE}
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
          color="#ACA2BC"
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
}: {
  icon: IconName;
  title: string;
  subtitle: string;
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
          color={PURPLE}
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
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
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
          color={PURPLE}
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
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
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
            color="#FFFFFF"
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
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
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
          color={PURPLE}
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
}: {
  onPress: () => void;
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
        color="#FFFFFF"
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
      colors={[
        '#FCFAFF',
        '#F8F3FD',
        '#F2EBFA',
        '#EEE7F7',
      ]}
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
          barStyle="dark-content"
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
                color={PURPLE}
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
                color={PURPLE}
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
                color={PURPLE}
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
            title="Informations physiques"
            subtitle="Tes mesures principales"
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
              value={
                profile.bloodType
              }
            />

            <HealthRow
              icon="calendar-month-outline"
              label="Dernière mise à jour"
              value={formatUpdateDate(
                profile.updatedAt,
              )}
              last
            />
          </Animated.View>

          {/* MEDICAL */}

          <SectionHeader
            icon="medical-bag"
            title="Informations médicales"
            subtitle="Les informations importantes à conserver"
          />

          <Animated.View
            entering={FadeInUp.delay(
              190,
            ).duration(420)}
            style={
              styles.medicalCard
            }>
            <MedicalRow
              icon="heart-plus-outline"
              title="Maladies chroniques"
              value={listValue(
                profile.chronicConditions,
                'Aucune maladie chronique renseignée',
              )}
              helper="Appuie pour ajouter ou modifier"
              onPress={() =>
                open(
                  'conditions',
                )
              }
            />

            <MedicalRow
              icon="pill"
              title="Traitements en cours"
              value={listValue(
                profile.treatments,
                'Aucun traitement renseigné',
              )}
              helper="Nom, dosage ou fréquence"
              onPress={() =>
                open(
                  'treatments',
                )
              }
            />

            <MedicalRow
              icon="allergy"
              title="Allergies"
              value={listValue(
                profile.allergies,
                'Aucune allergie renseignée',
              )}
              helper="Médicaments, aliments ou autres"
              onPress={() =>
                open(
                  'allergies',
                )
              }
            />

            <MedicalRow
              icon="clipboard-text-outline"
              title="Notes médicales"
              value={
                profile.medicalNotes ||
                'Aucune note médicale ajoutée'
              }
              helper="Tes informations personnelles complémentaires"
              onPress={() =>
                open(
                  'notes',
                )
              }
              last
            />
          </Animated.View>

          {/* GOAL */}

          <SectionHeader
            icon="target"
            title="Objectifs de santé"
            subtitle="Ton objectif personnel actuel"
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
                color={PURPLE}
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
              color="#ACA2BC"
              name="chevron-right"
              size={23}
            />
          </Pressable>

          <View
            style={
              styles.infoCard
            }>
            <MaterialDesignIcons
              color={PURPLE}
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
                      title={
                        sheet ===
                        'height'
                          ? 'Modifier ma taille'
                          : 'Modifier mon poids'
                      }
                      subtitle="Mets à jour cette information."
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
                    />
                  </>
                ) : null}

                {/* BLOOD */}

                {sheet ===
                'blood' ? (
                  <>
                    <SheetHeader
                      icon="water-outline"
                      title="Groupe sanguin"
                      subtitle="Sélectionne ton groupe sanguin si tu le connais."
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
                            selected={
                              profile.bloodType ===
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
                      title={
                        sheet ===
                        'conditions'
                          ? 'Maladies chroniques'
                          : 'Allergies'
                      }
                      subtitle={
                        sheet ===
                        'conditions'
                          ? 'Sélectionne les maladies déjà connues. Tu peux choisir plusieurs éléments.'
                          : 'Sélectionne les allergies déjà connues. Tu peux choisir plusieurs éléments.'
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
                            selected={selected.includes(
                              item,
                            )}
                            onPress={() =>
                              toggle(
                                item,
                              )
                            }
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
                      placeholderTextColor="#A39AB5"
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
                    />
                  </>
                ) : null}

                {/* TREATMENTS */}

                {sheet ===
                'treatments' ? (
                  <>
                    <SheetHeader
                      icon="pill"
                      title="Traitements en cours"
                      subtitle="Ajoute les traitements que tu prends actuellement."
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
                        placeholderTextColor="#A39AB5"
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
                          color="#FFFFFF"
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
                                  color={PURPLE}
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
                          color="#A88DDA"
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
                    />
                  </>
                ) : null}

                {/* NOTES */}

                {sheet ===
                'notes' ? (
                  <>
                    <SheetHeader
                      icon="clipboard-text-outline"
                      title="Notes médicales"
                      subtitle="Ajoute uniquement les informations que tu souhaites conserver."
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
                      placeholderTextColor="#A39AB5"
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
                    />
                  </>
                ) : null}

                {/* GOAL */}

                {sheet ===
                'goal' ? (
                  <>
                    <SheetHeader
                      icon="target"
                      title="Mon objectif de santé"
                      subtitle="Choisis l’objectif qui correspond le mieux à ton suivi actuel."
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
                          selected={
                            draft ===
                            item
                          }
                          onPress={() =>
                            setDraft(
                              item,
                            )
                          }
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
              color="#FFFFFF"
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
}: {
  icon: IconName;
  title: string;
  subtitle: string;
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
          color={PURPLE}
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

const styles =
  StyleSheet.create({
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
        'rgba(109,74,232,0.07)',
    },

    glowBottom: {
      position: 'absolute',
      bottom: 80,
      left: -130,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor:
        'rgba(192,161,237,0.08)',
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
        CARD_BORDER,
      borderRadius: 22,
      backgroundColor:
        '#FFFFFF',
      elevation: 2,
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 11,
    },

    pageTitle: {
      color: DARK,
      fontFamily: 'serif',
      fontSize: 24,
      fontWeight: '800',
    },

    pageSubtitle: {
      marginTop: 3,
      color: MUTED,
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
        LIGHT_PURPLE,
    },

    /* PRIVACY */

    privacyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      padding: 15,
      borderWidth: 1,
      borderColor:
        CARD_BORDER,
      borderRadius: 24,
      backgroundColor:
        '#FFFFFF',
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
        LIGHT_PURPLE,
    },

    privacyCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 13,
    },

    privacyTitle: {
      color: DARK,
      fontSize: 13.5,
      fontWeight: '800',
    },

    privacyText: {
      marginTop: 5,
      color: MUTED,
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
        LIGHT_PURPLE,
    },

    sectionCopy: {
      flex: 1,
      minWidth: 0,
    },

    sectionTitle: {
      color: DARK,
      fontFamily: 'serif',
      fontSize: 18,
      fontWeight: '800',
    },

    sectionSubtitle: {
      marginTop: 2,
      color: MUTED,
      fontSize: 9.8,
    },

    /* PHYSICAL */

    card: {
      overflow: 'hidden',
      paddingHorizontal: 13,
      borderWidth: 1,
      borderColor:
        CARD_BORDER,
      borderRadius: 25,
      backgroundColor:
        '#FFFFFF',
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
        '#EEE8F3',
    },

    rowIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 14,
      backgroundColor:
        LIGHT_PURPLE,
    },

    rowCopy: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 12,
    },

    rowLabel: {
      color: MUTED,
      fontSize: 10.7,
      fontWeight: '600',
    },

    rowValue: {
      marginTop: 3,
      color: DARK,
      fontSize: 13,
      fontWeight: '800',
    },

    success: {
      color: SUCCESS,
    },

    bmiClass: {
      color: DARK,
    },

    /* MEDICAL */

    medicalCard: {
      overflow: 'hidden',
      borderWidth: 1,
      borderColor:
        CARD_BORDER,
      borderRadius: 25,
      backgroundColor:
        '#FFFFFF',
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
        '#EEE8F3',
    },

    medicalIcon: {
      width: 45,
      height: 45,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 15,
      backgroundColor:
        LIGHT_PURPLE,
    },

    medicalCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      paddingRight: 5,
    },

    medicalTitle: {
      color: DARK,
      fontSize: 13,
      fontWeight: '800',
    },

    medicalValue: {
      marginTop: 5,
      color: '#50466B',
      fontSize: 11.5,
      lineHeight: 17,
      fontWeight: '600',
    },

    medicalHelper: {
      marginTop: 5,
      color: LIGHT_MUTED,
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
        CARD_BORDER,
      borderRadius: 24,
      backgroundColor:
        '#FFFFFF',
    },

    goalIcon: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      borderRadius: 14,
      backgroundColor:
        LIGHT_PURPLE,
    },

    goalCopy: {
      flex: 1,
      minWidth: 0,
      marginHorizontal: 11,
    },

    goalValue: {
      marginTop: 4,
      color: DARK,
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
      color: PURPLE,
      fontSize: 9.5,
      fontWeight: '800',
    },

    progressTrack: {
      flex: 1,
      height: 5,
      overflow: 'hidden',
      borderRadius: 999,
      backgroundColor:
        '#E7DFF1',
    },

    progressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor:
        PURPLE,
    },

    progressStatus: {
      color: MUTED,
      fontSize: 9,
    },

    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 13,
      borderRadius: 18,
      backgroundColor:
        '#F2EAFF',
    },

    infoText: {
      flex: 1,
      color: MUTED,
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
        'rgba(35,21,72,0.42)',
    },

    sheet: {
      maxHeight: '84%',
      overflow: 'hidden',
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      backgroundColor:
        '#FFFFFF',
      paddingHorizontal: 20,
      paddingTop: 10,
    },

    handle: {
      alignSelf: 'center',
      width: 50,
      height: 5,
      borderRadius: 999,
      backgroundColor:
        '#D9CEE8',
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
        LIGHT_PURPLE,
    },

    sheetTitle: {
      color: DARK,
      fontFamily: 'serif',
      fontSize: 23,
      lineHeight: 29,
      fontWeight: '800',
      textAlign: 'center',
    },

    sheetSubtitle: {
      maxWidth: 340,
      marginTop: 7,
      color: MUTED,
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
        '#DED5EA',
      borderRadius: 16,
      backgroundColor:
        '#FFFFFF',
    },

    bloodChoiceSelected: {
      borderColor: PURPLE,
      backgroundColor:
        '#F2EAFF',
    },

    bloodChoiceText: {
      color: MUTED,
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
        '#DED5EA',
      borderRadius: 17,
      backgroundColor:
        '#FFFFFF',
    },

    medicalChoiceSelected: {
      borderColor: PURPLE,
      backgroundColor:
        '#F2EAFF',
    },

    medicalChoiceTextBox: {
      flex: 1,
      minWidth: 0,
      justifyContent: 'center',
    },

    medicalChoiceText: {
      color: '#655C78',
      fontSize: 11.5,
      lineHeight: 15,
      fontWeight: '700',
    },

    choiceTextSelected: {
      color: PURPLE,
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
        '#CFC3DF',
      borderRadius: 10,
      backgroundColor:
        '#FFFFFF',
    },

    choiceIndicatorSelected: {
      borderColor: PURPLE,
      backgroundColor:
        PURPLE,
    },

    /* INPUTS */

    inputLabel: {
      marginTop: 18,
      marginBottom: 8,
      color: DARK,
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
        '#DDD2ED',
      borderRadius: 20,
      backgroundColor:
        '#FCFAFF',
    },

    largeInput: {
      flex: 1,
      paddingVertical: 13,
      color: DARK,
      fontSize: 30,
      fontWeight: '800',
      textAlign: 'center',
    },

    unit: {
      color: PURPLE,
      fontSize: 15,
      fontWeight: '800',
    },

    textInput: {
      minHeight: 50,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor:
        '#DDD2ED',
      borderRadius: 17,
      backgroundColor:
        '#FCFAFF',
      color: DARK,
      fontSize: 12.5,
    },

    notesInput: {
      minHeight: 140,
      lineHeight: 19,
    },

    characterCounter: {
      marginTop: 6,
      color: MUTED,
      fontSize: 10,
      textAlign: 'right',
    },

    errorText: {
      marginTop: 7,
      color: '#B4485A',
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
        PURPLE,
    },

    selectedTitle: {
      marginTop: 17,
      color: DARK,
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
        '#F1E9FF',
    },

    selectedTagText: {
      flexShrink: 1,
      color: PURPLE,
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
        '#F8F5FC',
    },

    emptyStateText: {
      flex: 1,
      color: MUTED,
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
        '#E2D8ED',
      borderRadius: 17,
      backgroundColor:
        '#FFFFFF',
    },

    goalOptionSelected: {
      borderColor: PURPLE,
      backgroundColor:
        '#F2EAFF',
    },

    goalOptionText: {
      flex: 1,
      color: DARK,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
    },

    radio: {
      width: 20,
      height: 20,
      borderWidth: 1.5,
      borderColor:
        '#C4B6D8',
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
        '#DED5EA',
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
    },

    progressChoiceSelected: {
      borderColor: PURPLE,
      backgroundColor:
        '#F2EAFF',
    },

    progressChoiceText: {
      color: MUTED,
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
        PURPLE,
      elevation: 3,
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15.5,
      fontWeight: '800',
    },

    cancelButton: {
      alignItems: 'center',
      marginTop: 8,
      paddingVertical: 15,
    },

    cancelText: {
      color: MUTED,
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
        PURPLE,
      elevation: 8,
    },

    toastText: {
      color: '#FFFFFF',
      fontSize: 12.5,
      fontWeight: '800',
    },
  });