import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  MaterialDesignIcons,
} from '@react-native-vector-icons/material-design-icons';

import type {
  RootStackParamList,
} from '../../navigation/AppNavigator';

import type {
  LHTestResult,
} from '../../types/journal';

import {
  getJournalEntry,
  saveJournalSection,
} from '../../state/dailyJournalStore';

import {
  JournalScreenLayout,
  SectionCard,
} from '../../components/journal/JournalScreenLayout';

import {
  JournalSaveToast,
  useJournalSaveToast,
} from '../../components/journal/JournalSaveToast';

import {
  LabeledInput,
} from '../../components/journal/JournalInputs';

/* ============================================================
   CONSTANTS
============================================================ */

const DATE_KEY = () =>
  new Date().toLocaleDateString('en-CA');

const RESULTS: Record<
  string,
  LHTestResult
> = {
  Négatif: 'negative',
  Positif: 'positive',
  Invalide: 'invalid',
};

const LABELS: Record<
  LHTestResult,
  string
> = {
  negative: 'Négatif',
  positive: 'Positif',
  invalid: 'Invalide',
};

const COLORS = {
  deepPurple: '#3B255F',
  purple: '#6941A5',

  lavender: '#EFE8F7',
  lavenderSoft: '#F8F5FB',

  white: '#FFFFFF',

  text: '#2E2737',
  secondary: '#746A7D',

  border: '#E7DFEC',

  green: '#4F8E68',
  greenSoft: '#EAF5EE',

  positive: '#8C5670',
  positiveSoft: '#F5EBF0',

  amber: '#9A7848',
  amberSoft: '#F7F0E3',

  overlay: 'rgba(35, 22, 52, 0.45)',
};

/* ============================================================
   HELPERS
============================================================ */

function formatTime(date: Date): string {
  const hours = String(
    date.getHours(),
  ).padStart(2, '0');

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, '0');

  return `${hours}:${minutes}`;
}

function timeToDate(
  value: string,
): Date {
  const now = new Date();

  const match =
    value.match(
      /^(\d{1,2}):(\d{2})$/,
    );

  if (!match) {
    return now;
  }

  const hours =
    Number(match[1]);

  const minutes =
    Number(match[2]);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return now;
  }

  now.setHours(
    hours,
    minutes,
    0,
    0,
  );

  return now;
}

/* ============================================================
   SCREEN
============================================================ */

export default function JournalLHTestScreen(): React.JSX.Element {
  const navigation =
    useNavigation<
      NavigationProp<RootStackParamList>
    >();

  const insets = useSafeAreaInsets();
  const saveToast = useJournalSaveToast();

  const [
    result,
    setResult,
  ] =
    useState('Négatif');

  const [
    time,
    setTime,
  ] =
    useState('');

  const [
    note,
    setNote,
  ] =
    useState('');

  const [
    timePickerVisible,
    setTimePickerVisible,
  ] =
    useState(false);

  const [
    pickerDate,
    setPickerDate,
  ] =
    useState(
      new Date(),
    );

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    getJournalEntry(
      DATE_KEY(),
    ).then(entry => {
      if (!entry?.lhTest) {
        return;
      }

      setResult(
        LABELS[
          entry.lhTest.result
        ],
      );

      const savedTime =
        entry.lhTest.time ??
        '';

      setTime(
        savedTime,
      );

      if (savedTime) {
        setPickerDate(
          timeToDate(
            savedTime,
          ),
        );
      }

      setNote(
        entry.lhTest.note ??
        '',
      );
    });
  }, []);

  /* ==========================================================
     RESULT CONFIG
  ========================================================== */

  const currentConfig =
    useMemo(() => {
      if (
        result ===
        'Positif'
      ) {
        return {
          icon:
            'check-circle-outline' as const,

          iconColor:
            COLORS.positive,

          iconBackground:
            COLORS.positiveSoft,

          cardBackground:
            '#FCF8FA',

          borderColor:
            'rgba(140,86,112,0.20)',

          eyebrow:
            'PIC DE LH POSSIBLE',

          message:
            'Ton test est positif',

          helper:
            'Ce résultat peut correspondre à une hausse du taux de LH.',
        };
      }

      if (
        result ===
        'Invalide'
      ) {
        return {
          icon:
            'alert-circle-outline' as const,

          iconColor:
            COLORS.amber,

          iconBackground:
            COLORS.amberSoft,

          cardBackground:
            '#FCFAF6',

          borderColor:
            'rgba(154,120,72,0.20)',

          eyebrow:
            'TEST À VÉRIFIER',

          message:
            'Le résultat est invalide',

          helper:
            'Tu peux refaire le test en suivant les instructions du fabricant.',
        };
      }

      return {
        icon:
          'minus-circle-outline' as const,

        iconColor:
          COLORS.green,

        iconBackground:
          COLORS.greenSoft,

        cardBackground:
          '#F8FCFA',

        borderColor:
          'rgba(79,142,104,0.18)',

        eyebrow:
          'AUCUN PIC DÉTECTÉ',

        message:
          'Ton test est négatif',

        helper:
          'Aucun pic de LH n’est détecté avec ce test pour le moment.',
      };
    }, [result]);

  /* ==========================================================
     TIME
  ========================================================== */

  const openTimePicker =
    () => {
      setPickerDate(
        time
          ? timeToDate(time)
          : new Date(),
      );

      setTimePickerVisible(
        true,
      );
    };

  const handleAndroidTimeChange =
    (
      event: DateTimePickerEvent,
      selectedDate?: Date,
    ) => {
      setTimePickerVisible(
        false,
      );

      if (
        event.type ===
          'dismissed' ||
        !selectedDate
      ) {
        return;
      }

      setPickerDate(
        selectedDate,
      );

      setTime(
        formatTime(
          selectedDate,
        ),
      );
    };

  const confirmIosTime =
    () => {
      setTime(
        formatTime(
          pickerDate,
        ),
      );

      setTimePickerVisible(
        false,
      );
    };

  /* ==========================================================
     SAVE
  ========================================================== */

  const save =
    async () => {
      await saveJournalSection(
        DATE_KEY(),
        'lhTest',
        {
          result:
            RESULTS[result],

          time,

          note:
            note.trim(),
        },
      );

      saveToast.show(
        'Test LH enregistré',
        'Ton résultat a bien été ajouté au journal.',
        navigation.goBack,
      );
    };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <>
      <JournalScreenLayout
        heroLabel={
          'Repère ton pic de LH\nau bon moment'
        }
        heroLabelBesideIcon
        heroSource={require('../../assets/images/conception-journal/lh-test.png')}
        hideJournalHeader
        icon="test-tube"
        onSave={save}
        title="Test LH"
        toast={
          <JournalSaveToast
            animation={saveToast.animation}
            bottom={Math.max(insets.bottom, 18) + 12}
            message={saveToast.message}
            onDismiss={saveToast.hide}
            title={saveToast.title}
            visible={saveToast.visible}
          />
        }>

        {/* ===================================================
            RESULT
        =================================================== */}

        <SectionCard
          title="Résultat du test">

          <View
            style={[
              styles.resultPreview,
              {
                backgroundColor:
                  currentConfig.cardBackground,

                borderColor:
                  currentConfig.borderColor,
              },
            ]}>

            <View
              style={[
                styles.resultPreviewIcon,
                {
                  backgroundColor:
                    currentConfig.iconBackground,
                },
              ]}>

              <MaterialDesignIcons
                color={
                  currentConfig.iconColor
                }
                name={
                  currentConfig.icon
                }
                size={27}
              />
            </View>

            <View
              style={
                styles.resultPreviewCopy
              }>

              <Text
                style={[
                  styles.resultEyebrow,
                  {
                    color:
                      currentConfig.iconColor,
                  },
                ]}>
                {
                  currentConfig.eyebrow
                }
              </Text>

              <Text
                style={
                  styles.resultValue
                }>
                {
                  currentConfig.message
                }
              </Text>

              <Text
                style={
                  styles.resultMessage
                }>
                Résultat sélectionné :{' '}

                <Text
                  style={
                    styles.resultMessageStrong
                  }>
                  {result}
                </Text>
              </Text>
            </View>
          </View>

          {/* RESULT CHOICE */}

          <View
            style={
              styles.choiceHeader
            }>

            <Text
              style={
                styles.choiceTitle
              }>
              Quel résultat vois-tu ?
            </Text>

            <Text
              style={
                styles.choiceSubtitle
              }>
              Sélectionne le résultat affiché sur ton test LH.
            </Text>
          </View>

          <View
            style={
              styles.resultOptions
            }>

            <ResultChoice
              active={
                result ===
                'Négatif'
              }
              icon="minus-circle-outline"
              label="Négatif"
              onPress={() =>
                setResult(
                  'Négatif',
                )
              }
              tone="negative"
            />

            <ResultChoice
              active={
                result ===
                'Positif'
              }
              icon="check-circle-outline"
              label="Positif"
              onPress={() =>
                setResult(
                  'Positif',
                )
              }
              tone="positive"
            />

            <ResultChoice
              active={
                result ===
                'Invalide'
              }
              icon="alert-circle-outline"
              label="Invalide"
              onPress={() =>
                setResult(
                  'Invalide',
                )
              }
              tone="invalid"
            />
          </View>

          {/* RESULT INFO */}

          <View
            style={
              styles.resultHelper
            }>

            <View
              style={[
                styles.helperIcon,
                {
                  backgroundColor:
                    currentConfig.iconBackground,
                },
              ]}>

              <MaterialDesignIcons
                color={
                  currentConfig.iconColor
                }
                name="information-outline"
                size={16}
              />
            </View>

            <Text
              style={
                styles.resultHelperText
              }>
              {
                currentConfig.helper
              }
            </Text>
          </View>
        </SectionCard>

        {/* ===================================================
            DETAILS
        =================================================== */}

        <SectionCard
          title="Détails du test">

          <View
            style={
              styles.detailHeading
            }>

            <View
              style={
                styles.detailHeadingIcon
              }>

              <MaterialDesignIcons
                color={
                  COLORS.purple
                }
                name="clock-outline"
                size={20}
              />
            </View>

            <View
              style={
                styles.detailHeadingCopy
              }>

              <Text
                style={
                  styles.detailHeadingTitle
                }>
                Quand as-tu fait le test ?
              </Text>

              <Text
                style={
                  styles.detailHeadingText
                }>
                Choisis l’heure à laquelle tu as effectué ton test.
              </Text>
            </View>
          </View>

          {/* ===============================================
              MODERN TIME SELECTOR
          =============================================== */}

          <Text
            style={
              styles.timeFieldLabel
            }>
            Heure du test
          </Text>

          <Pressable
            accessibilityLabel="Choisir l’heure du test"
            accessibilityRole="button"
            onPress={
              openTimePicker
            }
            style={({pressed}) => [
              styles.timeSelector,

              time &&
                styles.timeSelectorSelected,

              pressed &&
                styles.timeSelectorPressed,
            ]}>

            <View
              style={
                styles.timeIcon
              }>

              <MaterialDesignIcons
                color={
                  COLORS.purple
                }
                name="clock-time-four-outline"
                size={22}
              />
            </View>

            <View
              style={
                styles.timeSelectorCopy
              }>

              <Text
                style={
                  styles.timeSelectorCaption
                }>
                {time
                  ? 'Heure sélectionnée'
                  : 'Sélectionner une heure'}
              </Text>

              <Text
                style={[
                  styles.timeValue,

                  !time &&
                    styles.timePlaceholder,
                ]}>
                {time ||
                  'Appuie pour choisir'}
              </Text>
            </View>

            <View
              style={
                styles.timeSelectorArrow
              }>

              <MaterialDesignIcons
                color={
                  COLORS.purple
                }
                name="chevron-down"
                size={21}
              />
            </View>
          </Pressable>

          {/* COMMENT */}

          <View
            style={
              styles.noteSpacing
            }>

            <LabeledInput
              label="Commentaire (optionnel)"
              maxLength={300}
              multiline
              onChangeText={
                setNote
              }
              placeholder="Ajoute une note…"
              value={note}
            />
          </View>
        </SectionCard>

        {/* ===================================================
            INFO
        =================================================== */}

        <View
          style={
            styles.tip
          }>

          <View
            style={
              styles.tipIcon
            }>

            <MaterialDesignIcons
              color={
                COLORS.purple
              }
              name="lightbulb-outline"
              size={21}
            />
          </View>

          <View
            style={
              styles.tipCopy
            }>

            <Text
              style={
                styles.tipEyebrow
              }>
              BON À SAVOIR
            </Text>

            <Text
              style={
                styles.tipTitle
              }>
              Comprendre ton résultat
            </Text>

            <Text
              style={
                styles.tipText
              }>
              Un résultat positif peut indiquer un pic de LH.
              Il ne constitue pas un diagnostic médical.
            </Text>
          </View>
        </View>
      </JournalScreenLayout>

      {/* =====================================================
          ANDROID CLOCK
      ===================================================== */}

      {Platform.OS ===
        'android' &&
      timePickerVisible ? (
        <DateTimePicker
          display="clock"
          is24Hour
          mode="time"
          onChange={
            handleAndroidTimeChange
          }
          value={
            pickerDate
          }
        />
      ) : null}

      {/* =====================================================
          IOS TIME PICKER
      ===================================================== */}

      {Platform.OS ===
      'ios' ? (
        <Modal
          animationType="fade"
          onRequestClose={() =>
            setTimePickerVisible(
              false,
            )
          }
          transparent
          visible={
            timePickerVisible
          }>

          <View
            style={
              styles.modalOverlay
            }>

            <Pressable
              accessibilityLabel="Fermer"
              onPress={() =>
                setTimePickerVisible(
                  false,
                )
              }
              style={
                StyleSheet.absoluteFill
              }
            />

            <View
              style={
                styles.timeSheet
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
                    styles.sheetIcon
                  }>

                  <MaterialDesignIcons
                    color={
                      COLORS.purple
                    }
                    name="clock-outline"
                    size={21}
                  />
                </View>

                <View
                  style={
                    styles.sheetHeaderCopy
                  }>

                  <Text
                    style={
                      styles.sheetEyebrow
                    }>
                    HEURE DU TEST
                  </Text>

                  <Text
                    style={
                      styles.sheetTitle
                    }>
                    Choisis une heure
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel="Fermer"
                  accessibilityRole="button"
                  onPress={() =>
                    setTimePickerVisible(
                      false,
                    )
                  }
                  style={
                    styles.closeButton
                  }>

                  <MaterialDesignIcons
                    color={
                      COLORS.secondary
                    }
                    name="close"
                    size={20}
                  />
                </Pressable>
              </View>

              <View
                style={
                  styles.iosPickerContainer
                }>

                <DateTimePicker
                  display="spinner"
                  is24Hour
                  locale="fr-FR"
                  mode="time"
                  onChange={(
                    _event,
                    selectedDate,
                  ) => {
                    if (
                      selectedDate
                    ) {
                      setPickerDate(
                        selectedDate,
                      );
                    }
                  }}
                  value={
                    pickerDate
                  }
                />
              </View>

              <Text
                style={
                  styles.timePreview
                }>
                {
                  formatTime(
                    pickerDate,
                  )
                }
              </Text>

              <Pressable
                accessibilityLabel="Confirmer l’heure"
                accessibilityRole="button"
                onPress={
                  confirmIosTime
                }
                style={({pressed}) => [
                  styles.confirmButton,

                  pressed &&
                    styles.confirmButtonPressed,
                ]}>

                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="check"
                  size={18}
                />

                <Text
                  style={
                    styles.confirmButtonText
                  }>
                  Confirmer l’heure
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

/* ============================================================
   RESULT CHOICE
============================================================ */

function ResultChoice({
  active,
  icon,
  label,
  onPress,
  tone,
}: {
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
  tone:
    | 'negative'
    | 'positive'
    | 'invalid';
}): React.JSX.Element {
  const toneConfig =
    tone === 'positive'
      ? {
          background:
            COLORS.positiveSoft,

          icon:
            COLORS.positive,
        }
      : tone ===
          'invalid'
        ? {
            background:
              COLORS.amberSoft,

            icon:
              COLORS.amber,
          }
        : {
            background:
              COLORS.greenSoft,

            icon:
              COLORS.green,
          };

  return (
    <Pressable
      accessibilityLabel={`Résultat ${label}`}
      accessibilityRole="radio"
      accessibilityState={{
        checked: active,
      }}
      onPress={onPress}
      style={({pressed}) => [
        styles.resultChoice,

        active &&
          styles.resultChoiceActive,

        pressed &&
          styles.resultChoicePressed,
      ]}>

      <View
        style={[
          styles.resultChoiceIcon,

          {
            backgroundColor:
              toneConfig.background,
          },
        ]}>

        <MaterialDesignIcons
          color={
            toneConfig.icon
          }
          name={
            icon as never
          }
          size={22}
        />
      </View>

      <Text
        style={[
          styles.resultChoiceText,

          active &&
            styles.resultChoiceTextActive,
        ]}>
        {label}
      </Text>

      {active ? (
        <View
          style={
            styles.selectedBadge
          }>

          <MaterialDesignIcons
            color="#FFFFFF"
            name="check"
            size={11}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles =
  StyleSheet.create({
    resultPreview: {
      minHeight: 110,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderRadius: 21,

      paddingHorizontal: 14,
      paddingVertical: 14,
    },

    resultPreviewIcon: {
      width: 55,
      height: 55,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 18,
    },

    resultPreviewCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 12,
    },

    resultEyebrow: {
      fontSize: 7.8,

      fontWeight: '900',

      letterSpacing: 1.1,
    },

    resultValue: {
      marginTop: 4,

      color:
        COLORS.deepPurple,

      fontSize: 18.5,

      lineHeight: 23,

      fontWeight: '900',
    },

    resultMessage: {
      marginTop: 4,

      color:
        COLORS.secondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    resultMessageStrong: {
      color:
        COLORS.deepPurple,

      fontWeight: '800',
    },

    choiceHeader: {
      marginTop: 18,

      marginBottom: 10,
    },

    choiceTitle: {
      color:
        COLORS.text,

      fontSize: 12.5,

      fontWeight: '800',
    },

    choiceSubtitle: {
      marginTop: 3,

      color:
        COLORS.secondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    resultOptions: {
      flexDirection: 'row',

      gap: 8,
    },

    resultChoice: {
      position: 'relative',

      flex: 1,

      minWidth: 0,

      minHeight: 88,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 18,

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 5,

      paddingVertical: 10,
    },

    resultChoiceActive: {
      borderWidth: 1.5,

      borderColor:
        COLORS.purple,

      backgroundColor:
        '#F8F4FB',

      elevation: 2,
    },

    resultChoicePressed: {
      opacity: 0.8,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    resultChoiceIcon: {
      width: 40,
      height: 40,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 13,
    },

    resultChoiceText: {
      marginTop: 7,

      color:
        COLORS.secondary,

      fontSize: 10.5,

      fontWeight: '700',

      textAlign: 'center',
    },

    resultChoiceTextActive: {
      color:
        COLORS.deepPurple,

      fontWeight: '900',
    },

    selectedBadge: {
      position: 'absolute',

      top: 6,
      right: 6,

      width: 19,
      height: 19,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        COLORS.purple,
    },

    resultHelper: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      marginTop: 12,

      borderRadius: 14,

      backgroundColor:
        COLORS.lavenderSoft,

      padding: 9,
    },

    helperIcon: {
      width: 29,
      height: 29,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 10,
    },

    resultHelperText: {
      flex: 1,

      color:
        COLORS.secondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    detailHeading: {
      flexDirection: 'row',

      alignItems: 'center',

      marginBottom: 14,
    },

    detailHeadingIcon: {
      width: 40,
      height: 40,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        COLORS.lavender,
    },

    detailHeadingCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    detailHeadingTitle: {
      color:
        COLORS.text,

      fontSize: 12.5,

      fontWeight: '800',
    },

    detailHeadingText: {
      marginTop: 3,

      color:
        COLORS.secondary,

      fontSize: 9.3,

      lineHeight: 13.5,
    },

    /* ========================================================
       TIME FIELD
    ======================================================== */

    timeFieldLabel: {
      marginBottom: 7,

      color:
        COLORS.text,

      fontSize: 11,

      fontWeight: '700',
    },

    timeSelector: {
      minHeight: 68,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 18,

      backgroundColor:
        '#FCFAFD',

      paddingHorizontal: 11,

      paddingVertical: 9,
    },

    timeSelectorSelected: {
      borderColor:
        'rgba(105,65,165,0.28)',

      backgroundColor:
        '#F8F4FC',
    },

    timeSelectorPressed: {
      opacity: 0.8,

      transform: [
        {
          scale: 0.992,
        },
      ],
    },

    timeIcon: {
      width: 43,
      height: 43,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 14,

      backgroundColor:
        COLORS.lavender,
    },

    timeSelectorCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    timeSelectorCaption: {
      color:
        COLORS.secondary,

      fontSize: 9,
    },

    timeValue: {
      marginTop: 3,

      color:
        COLORS.deepPurple,

      fontSize: 18,

      fontWeight: '900',
    },

    timePlaceholder: {
      color:
        COLORS.secondary,

      fontSize: 11,

      fontWeight: '600',
    },

    timeSelectorArrow: {
      width: 31,
      height: 31,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 10,

      backgroundColor:
        COLORS.white,
    },

    noteSpacing: {
      marginTop: 15,
    },

    /* ========================================================
       INFO
    ======================================================== */

    tip: {
      flexDirection: 'row',

      alignItems:
        'flex-start',

      borderWidth: 1,

      borderColor:
        'rgba(105,65,165,0.10)',

      borderRadius: 20,

      backgroundColor:
        COLORS.lavender,

      padding: 13,
    },

    tipIcon: {
      width: 40,
      height: 40,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        COLORS.white,
    },

    tipCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    tipEyebrow: {
      color:
        COLORS.purple,

      fontSize: 7.5,

      fontWeight: '900',

      letterSpacing: 1,
    },

    tipTitle: {
      marginTop: 2,

      color:
        COLORS.deepPurple,

      fontSize: 12.5,

      fontWeight: '800',
    },

    tipText: {
      marginTop: 4,

      color: '#5D5368',

      fontSize: 10.5,

      lineHeight: 16,
    },

    /* ========================================================
       IOS TIME SHEET
    ======================================================== */

    modalOverlay: {
      flex: 1,

      justifyContent:
        'flex-end',

      backgroundColor:
        COLORS.overlay,
    },

    timeSheet: {
      borderTopLeftRadius: 28,

      borderTopRightRadius: 28,

      backgroundColor:
        '#FCFAFD',

      paddingHorizontal: 18,

      paddingTop: 10,

      paddingBottom: 26,
    },

    sheetHandle: {
      alignSelf: 'center',

      width: 44,

      height: 4,

      marginBottom: 15,

      borderRadius: 2,

      backgroundColor:
        '#D8CFDF',
    },

    sheetHeader: {
      flexDirection: 'row',

      alignItems: 'center',
    },

    sheetIcon: {
      width: 42,
      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 14,

      backgroundColor:
        COLORS.lavender,
    },

    sheetHeaderCopy: {
      flex: 1,

      marginLeft: 10,
    },

    sheetEyebrow: {
      color:
        COLORS.purple,

      fontSize: 8,

      fontWeight: '900',

      letterSpacing: 1,
    },

    sheetTitle: {
      marginTop: 2,

      color:
        COLORS.deepPurple,

      fontSize: 19,

      fontWeight: '900',
    },

    closeButton: {
      width: 36,
      height: 36,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 18,

      backgroundColor:
        COLORS.lavenderSoft,
    },

    iosPickerContainer: {
      alignItems:
        'center',

      marginTop: 8,
    },

    timePreview: {
      color:
        COLORS.deepPurple,

      fontSize: 28,

      fontWeight: '900',

      textAlign: 'center',
    },

    confirmButton: {
      minHeight: 52,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,

      marginTop: 16,

      borderRadius: 26,

      backgroundColor:
        COLORS.deepPurple,
    },

    confirmButtonPressed: {
      opacity: 0.87,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    confirmButtonText: {
      color: '#FFFFFF',

      fontSize: 14,

      fontWeight: '800',
    },
  });