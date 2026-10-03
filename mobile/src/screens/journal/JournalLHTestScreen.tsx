import {useToday} from '../../hooks/useToday';
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
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';

import {useTranslation} from 'react-i18next';

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
  deleteJournalSection,
  getJournalEntry,
  saveJournalSection,
} from '../../state/dailyJournalStore';
import {useJournalEntryDate} from '../../hooks/useJournalEntryDate';
import {ClearEntryButton} from '../../components/journal/ClearEntryButton';

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

import {useAwaTheme} from '../../theme/AwaThemeProvider';

import {
  interpolateHex,
  onPrimaryTextColor,
  pickReadableTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';

import {getAppLanguage} from '../../state/themePreferences';
import '../../i18n';

/* ============================================================
   CONSTANTS
============================================================ */

// Display-only labels for the persisted LHTestResult enum (the semantic
// value itself, never the label, is what's saved — see `save()` below).
function resultLabels(t: (key: string) => string): Record<LHTestResult, string> {
  return {
    negative: t('journalLHTest.results.negative'),
    positive: t('journalLHTest.results.positive'),
    invalid: t('journalLHTest.results.invalid'),
  };
}

// LH ovulation-test RESULT category colors — Phase E4 visual-only migration
// rule: these are TTC-specific tracking-category identity, not decorative
// theme colors, so they stay EXACTLY these hexes regardless of the active
// AWA theme. `positive` in particular is the single most fertility-relevant
// color in the whole TTC flow and must never be unified into a generic
// "success" token. Do not theme-derive any of these.
type LhTone = 'negative' | 'positive' | 'invalid';

const LH_TONE_COLORS: Record<LhTone, {accent: string}> = {
  negative: {accent: '#4F8E68'},
  positive: {accent: '#8C5670'},
  invalid: {accent: '#9A7848'},
};

// The result card and its icon chip are always derived from the theme's own
// `surface` token blended toward the tone's semantic accent — never a fixed
// light-only literal and never an `isDark` branch. The blend is a small
// enough ratio that a light (near-white) surface still reads as the same
// soft near-white pastel as before; the SAME formula naturally produces a
// tinted dark surface once `surface` itself is dark, so the result card
// never simply reuses a light card. The eyebrow/glyph/selected-value accent
// color is then picked by checking the REAL resulting background's own
// contrast via `pickReadableTextColor` (never `theme.isDark`) — lightened
// only when that computed background actually needs a light foreground —
// so all three result states keep their green/rose/amber identity while
// integrating into the surrounding UI in every theme, including True Black.
const CARD_TINT_RATIO = 0.1;
const ICON_TINT_RATIO = 0.18;

function resolveLhToneVisual(
  tone: LhTone,
  theme: ResolvedAwaTheme,
): {accent: string; iconBackground: string; cardBackground: string; borderColor: string} {
  const {accent} = LH_TONE_COLORS[tone];

  const cardBackground = interpolateHex(theme.colors.surface, accent, CARD_TINT_RATIO);
  const iconBackground = interpolateHex(theme.colors.surface, accent, ICON_TINT_RATIO);

  const displayAccent =
    pickReadableTextColor(iconBackground) === '#FFFFFF'
      ? interpolateHex(accent, '#FFFFFF', 0.5)
      : accent;

  return {
    accent: displayAccent,
    iconBackground,
    cardBackground,
    borderColor: withAlpha(displayAccent, 0.2),
  };
}

// Fixed modal scrim — Category E, left untouched by the theme migration.
const MODAL_OVERLAY = 'rgba(35, 22, 52, 0.45)';

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

  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const saveToast = useJournalSaveToast();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const labels = resultLabels(t);

  const [
    result,
    setResult,
  ] =
    useState<LHTestResult>('negative');

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

  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // loads and saves the CURRENT day, never the day the screen opened.
  const {todayKey} = useToday();
  // M21: today by default, or the past day passed by the Calendar (`date`).
  const {entryDateKey, isFutureEntryDate, dateLabel} = useJournalEntryDate(todayKey);
  // M25: true only while a saved value exists for that day (shows "Effacer").
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getJournalEntry(
      entryDateKey,
    ).then(entry => {
      if (!entry?.lhTest) {
        return;
      }

      setHasSaved(true);

      setResult(
        entry.lhTest.result,
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
  }, [entryDateKey]);

  /* ==========================================================
     RESULT CONFIG
  ========================================================== */

  const currentConfig =
    useMemo(() => {
      if (
        result ===
        'positive'
      ) {
        const visual = resolveLhToneVisual('positive', theme);
        return {
          icon:
            'check-circle-outline' as const,

          iconColor:
            visual.accent,

          iconBackground:
            visual.iconBackground,

          cardBackground:
            visual.cardBackground,

          borderColor:
            visual.borderColor,

          eyebrow:
            t('journalLHTest.states.positive.eyebrow'),

          message:
            t('journalLHTest.states.positive.message'),

          helper:
            t('journalLHTest.states.positive.helper'),
        };
      }

      if (
        result ===
        'invalid'
      ) {
        const visual = resolveLhToneVisual('invalid', theme);
        return {
          icon:
            'alert-circle-outline' as const,

          iconColor:
            visual.accent,

          iconBackground:
            visual.iconBackground,

          cardBackground:
            visual.cardBackground,

          borderColor:
            visual.borderColor,

          eyebrow:
            t('journalLHTest.states.invalid.eyebrow'),

          message:
            t('journalLHTest.states.invalid.message'),

          helper:
            t('journalLHTest.states.invalid.helper'),
        };
      }

      const visual = resolveLhToneVisual('negative', theme);
      return {
        icon:
          'minus-circle-outline' as const,

        iconColor:
          visual.accent,

        iconBackground:
          visual.iconBackground,

        cardBackground:
          visual.cardBackground,

        borderColor:
          visual.borderColor,

        eyebrow:
          t('journalLHTest.states.negative.eyebrow'),

        message:
          t('journalLHTest.states.negative.message'),

        helper:
          t('journalLHTest.states.negative.helper'),
      };
    }, [result, t, theme]);

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

  // Android native clock: the picker always closes; a picked time is applied,
  // a dismissal changes nothing.
  const handleAndroidTimeValueChange =
    (
      _event: DateTimePickerChangeEvent,
      selectedDate: Date,
    ) => {
      setTimePickerVisible(
        false,
      );

      setPickerDate(
        selectedDate,
      );

      setTime(
        formatTime(
          selectedDate,
        ),
      );
    };

  const handleAndroidTimeDismiss =
    () => {
      setTimePickerVisible(
        false,
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
      if (isFutureEntryDate) {
        setError(t('journalEntryDate.futureEntryMessage'));
        return;
      }

      setError('');

      await saveJournalSection(
        entryDateKey,
        'lhTest',
        {
          result,

          time,

          note:
            note.trim(),
        },
      );

      setHasSaved(true);

      saveToast.show(
        t('journalLHTest.saveToastTitle'),
        t('journalLHTest.saveToastMessage'),
        navigation.goBack,
      );
    };

  // M25: removes the saved test for this day (section absent = the canonical
  // empty state) and resets the form; reopening shows it cleared.
  const clearEntry =
    async () => {
      await deleteJournalSection(entryDateKey, 'lhTest');
      setHasSaved(false);
      setResult('negative');
      setTime('');
      setNote('');
      setError('');
      saveToast.show(t('journalLHTest.clearToastTitle'), t('journalLHTest.clearToastMessage'), navigation.goBack);
    };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <>
      <JournalScreenLayout
        dateLabel={dateLabel}
        error={error}
        heroLabel={
          t('journalLHTest.heroLabel')
        }
        heroLabelBesideIcon
        heroSource={require('../../assets/images/conception-journal/lh-test.png')}
        hideJournalHeader
        icon="test-tube"
        onSave={save}
        title={t('journalLHTest.title')}
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
          title={t('journalLHTest.resultSectionTitle')}>

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
                {t('journalLHTest.resultSelectedPrefix')}{' '}

                <Text
                  style={
                    styles.resultMessageStrong
                  }>
                  {labels[result]}
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
              {t('journalLHTest.resultQuestionTitle')}
            </Text>

            <Text
              style={
                styles.choiceSubtitle
              }>
              {t('journalLHTest.resultQuestionSubtitle')}
            </Text>
          </View>

          <View
            style={
              styles.resultOptions
            }>

            <ResultChoice
              active={
                result ===
                'negative'
              }
              icon="minus-circle-outline"
              label={labels.negative}
              onPress={() =>
                setResult(
                  'negative',
                )
              }
              tone="negative"
            />

            <ResultChoice
              active={
                result ===
                'positive'
              }
              icon="check-circle-outline"
              label={labels.positive}
              onPress={() =>
                setResult(
                  'positive',
                )
              }
              tone="positive"
            />

            <ResultChoice
              active={
                result ===
                'invalid'
              }
              icon="alert-circle-outline"
              label={labels.invalid}
              onPress={() =>
                setResult(
                  'invalid',
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
          title={t('journalLHTest.detailsSectionTitle')}>

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
                  theme.colors.primary
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
                {t('journalLHTest.detailQuestionTitle')}
              </Text>

              <Text
                style={
                  styles.detailHeadingText
                }>
                {t('journalLHTest.detailQuestionSubtitle')}
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
            {t('journalLHTest.timeFieldLabel')}
          </Text>

          <Pressable
            accessibilityLabel={t('journalLHTest.timeSelectorAccessibility')}
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
                  theme.colors.primary
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
                  ? t('journalLHTest.timeSelectedCaption')
                  : t('journalLHTest.timeSelectCaption')}
              </Text>

              <Text
                style={[
                  styles.timeValue,

                  !time &&
                    styles.timePlaceholder,
                ]}>
                {time ||
                  t('journalLHTest.timeValuePlaceholder')}
              </Text>
            </View>

            <View
              style={
                styles.timeSelectorArrow
              }>

              <MaterialDesignIcons
                color={
                  theme.colors.primary
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
              label={t('journalLHTest.noteLabel')}
              maxLength={300}
              multiline
              onChangeText={
                setNote
              }
              placeholder={t('journalLHTest.notePlaceholder')}
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
                theme.colors.primary
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
              {t('common.goodToKnow')}
            </Text>

            <Text
              style={
                styles.tipTitle
              }>
              {t('journalLHTest.tipTitle')}
            </Text>

            <Text
              style={
                styles.tipText
              }>
              {t('journalLHTest.tipText')}
            </Text>
          </View>
        </View>

        {hasSaved ? <ClearEntryButton onConfirm={clearEntry} subject={t('journalLHTest.clearSubject')} /> : null}
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
          onDismiss={
            handleAndroidTimeDismiss
          }
          onValueChange={
            handleAndroidTimeValueChange
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
              accessibilityLabel={t('common.close')}
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
                      theme.colors.primary
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
                    {t('journalLHTest.timeSheetEyebrow')}
                  </Text>

                  <Text
                    style={
                      styles.sheetTitle
                    }>
                    {t('journalLHTest.timeSheetTitle')}
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel={t('common.close')}
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
                      theme.colors.textSecondary
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
                  locale={getAppLanguage() === 'en' ? 'en-US' : 'fr-FR'}
                  mode="time"
                  onValueChange={(
                    _event,
                    selectedDate,
                  ) => {
                    setPickerDate(
                      selectedDate,
                    );
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
                accessibilityLabel={t('journalLHTest.confirmTime')}
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
                  color={pickReadableTextColor(theme.colors.accent)}
                  name="check"
                  size={18}
                />

                <Text
                  style={
                    styles.confirmButtonText
                  }>
                  {t('journalLHTest.confirmTime')}
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
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const visual = useMemo(
    () => resolveLhToneVisual(tone, theme),
    [tone, theme],
  );

  const toneConfig = {
    background: visual.iconBackground,
    icon: visual.accent,
  };

  return (
    <Pressable
      accessibilityLabel={t('journalLHTest.resultAccessibility', {label})}
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
            color={onPrimaryTextColor(theme)}
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

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
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
        theme.colors.accent,

      fontSize: 18.5,

      lineHeight: 23,

      fontWeight: '900',
    },

    resultMessage: {
      marginTop: 4,

      color:
        theme.colors.textSecondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    resultMessageStrong: {
      color:
        theme.colors.accent,

      fontWeight: '800',
    },

    choiceHeader: {
      marginTop: 18,

      marginBottom: 10,
    },

    choiceTitle: {
      color:
        theme.colors.text,

      fontSize: 12.5,

      fontWeight: '800',
    },

    choiceSubtitle: {
      marginTop: 3,

      color:
        theme.colors.textSecondary,

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
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 18,

      backgroundColor:
        theme.colors.surface,

      paddingHorizontal: 5,

      paddingVertical: 10,
    },

    resultChoiceActive: {
      borderWidth: 1.5,

      borderColor:
        theme.colors.primary,

      backgroundColor:
        theme.colors.primarySoft,

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
        theme.colors.textSecondary,

      fontSize: 10.5,

      fontWeight: '700',

      textAlign: 'center',
    },

    resultChoiceTextActive: {
      color:
        theme.colors.accent,

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
        theme.colors.primary,
    },

    resultHelper: {
      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      marginTop: 12,

      borderRadius: 14,

      backgroundColor:
        theme.colors.surfaceSecondary,

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
        theme.colors.textSecondary,

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
        theme.colors.primarySoft,
    },

    detailHeadingCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    detailHeadingTitle: {
      color:
        theme.colors.text,

      fontSize: 12.5,

      fontWeight: '800',
    },

    detailHeadingText: {
      marginTop: 3,

      color:
        theme.colors.textSecondary,

      fontSize: 9.3,

      lineHeight: 13.5,
    },

    /* ========================================================
       TIME FIELD
    ======================================================== */

    timeFieldLabel: {
      marginBottom: 7,

      color:
        theme.colors.text,

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
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 18,

      backgroundColor:
        theme.colors.surfaceSecondary,

      paddingHorizontal: 11,

      paddingVertical: 9,
    },

    timeSelectorSelected: {
      borderColor:
        withAlpha(theme.colors.primary, 0.28),

      backgroundColor:
        theme.colors.primarySoft,
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
        theme.colors.primarySoft,
    },

    timeSelectorCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    timeSelectorCaption: {
      color:
        theme.colors.textSecondary,

      fontSize: 9,
    },

    timeValue: {
      marginTop: 3,

      color:
        theme.colors.accent,

      fontSize: 18,

      fontWeight: '900',
    },

    timePlaceholder: {
      color:
        theme.colors.textSecondary,

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
        theme.colors.surface,
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
        withAlpha(theme.colors.primary, 0.10),

      borderRadius: 20,

      backgroundColor:
        theme.colors.primarySoft,

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
        theme.colors.surface,
    },

    tipCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,
    },

    tipEyebrow: {
      color:
        theme.colors.primary,

      fontSize: 7.5,

      fontWeight: '900',

      letterSpacing: 1,
    },

    tipTitle: {
      marginTop: 2,

      color:
        theme.colors.accent,

      fontSize: 12.5,

      fontWeight: '800',
    },

    tipText: {
      marginTop: 4,

      color: theme.colors.textSecondary,

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
        MODAL_OVERLAY,
    },

    timeSheet: {
      borderTopLeftRadius: 28,

      borderTopRightRadius: 28,

      backgroundColor:
        theme.colors.surface,

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
        withAlpha(theme.colors.primary, 0.25),
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
        theme.colors.primarySoft,
    },

    sheetHeaderCopy: {
      flex: 1,

      marginLeft: 10,
    },

    sheetEyebrow: {
      color:
        theme.colors.primary,

      fontSize: 8,

      fontWeight: '900',

      letterSpacing: 1,
    },

    sheetTitle: {
      marginTop: 2,

      color:
        theme.colors.accent,

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
        theme.colors.surfaceSecondary,
    },

    iosPickerContainer: {
      alignItems:
        'center',

      marginTop: 8,
    },

    timePreview: {
      color:
        theme.colors.accent,

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
        theme.colors.accent,
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
      color: pickReadableTextColor(theme.colors.accent),

      fontSize: 14,

      fontWeight: '800',
    },
  });
}