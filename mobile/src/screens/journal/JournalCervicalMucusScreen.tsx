import {useToday} from '../../hooks/useToday';
import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {useTranslation} from 'react-i18next';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  CervicalMucusType,
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
  pickReadableTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';
import '../../i18n';

/* ============================================================
   CONSTANTS
============================================================ */

// Display-only labels for the persisted CervicalMucusType enum (the semantic
// value itself, never the label, is what's saved — see `save()` below).
function mucusLabels(t: (key: string) => string): Record<CervicalMucusType, string> {
  return {
    dry: t('journalCervicalMucus.types.dry'),
    sticky: t('journalCervicalMucus.types.sticky'),
    creamy: t('journalCervicalMucus.types.creamy'),
    watery: t('journalCervicalMucus.types.watery'),
    eggWhite: t('journalCervicalMucus.types.eggWhite'),
  };
}

// PHASE E4 — MEDICAL/TRACKING SEMANTIC (Category B/D): each cervical-mucus
// TYPE has its own distinguishing color used only inside `currentConfig`
// below (the "Aspect observé" hero) — this is TTC-specific tracking-category
// identity and must NEVER become theme-derived, even for the two types
// ('sticky'/'creamy') whose current hex happens to sit in the same purple
// family as the app's brand primary. Frozen exactly as before migration.
const MUCUS_TYPE_COLORS: Record<
  CervicalMucusType,
  {icon: string; background: string}
> = {
  dry: {icon: '#9C7B5A', background: '#F6F0E9'},
  sticky: {icon: '#6942BD', background: '#EEE7F7'},
  creamy: {icon: '#6942BD', background: '#EEE7F7'},
  watery: {icon: '#5D7EA5', background: '#EAF1F8'},
  eggWhite: {icon: '#5D8B72', background: '#EAF4EE'},
};

/* ============================================================
   SCREEN
============================================================ */

export default function JournalCervicalMucusScreen(): React.JSX.Element {
  const navigation =
    useNavigation<
      NavigationProp<RootStackParamList>
    >();

  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const saveToast = useJournalSaveToast();

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const labels = mucusLabels(t);

  const [
    type,
    setType,
  ] =
    useState<CervicalMucusType>('creamy');

  const [
    note,
    setNote,
  ] =
    useState('');

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
      if (
        !entry?.cervicalMucus
      ) {
        return;
      }

      setHasSaved(true);

      setType(
        entry
          .cervicalMucus
          .type,
      );

      setNote(
        entry
          .cervicalMucus
          .note ?? '',
      );
    });
  }, [entryDateKey]);

  /* ==========================================================
     CURRENT CONFIG
  ========================================================== */

  const currentConfig =
    useMemo(() => {
      switch (type) {
        case 'dry':
          return {
            icon:
              'weather-sunny' as const,

            iconColor:
              MUCUS_TYPE_COLORS.dry.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.dry.background,

            title:
              t('journalCervicalMucus.observations.dry.title'),

            description:
              t('journalCervicalMucus.observations.dry.description'),
          };

        case 'sticky':
          return {
            icon:
              'water-opacity' as const,

            iconColor:
              MUCUS_TYPE_COLORS.sticky.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.sticky.background,

            title:
              t('journalCervicalMucus.observations.sticky.title'),

            description:
              t('journalCervicalMucus.observations.sticky.description'),
          };

        case 'watery':
          return {
            icon:
              'water-outline' as const,

            iconColor:
              MUCUS_TYPE_COLORS.watery.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.watery.background,

            title:
              t('journalCervicalMucus.observations.watery.title'),

            description:
              t('journalCervicalMucus.observations.watery.description'),
          };

        case 'eggWhite':
          return {
            icon:
              'water-plus-outline' as const,

            iconColor:
              MUCUS_TYPE_COLORS.eggWhite.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.eggWhite.background,

            title:
              t('journalCervicalMucus.observations.eggWhite.title'),

            description:
              t('journalCervicalMucus.observations.eggWhite.description'),
          };

        default:
          return {
            icon:
              'water-circle' as const,

            iconColor:
              MUCUS_TYPE_COLORS.creamy.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.creamy.background,

            title:
              t('journalCervicalMucus.observations.creamy.title'),

            description:
              t('journalCervicalMucus.observations.creamy.description'),
          };
      }
    }, [t, type]);

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
        'cervicalMucus',
        {
          type,

          note:
            note.trim(),
        },
      );

      setHasSaved(true);

      saveToast.show(
        t('journalCervicalMucus.saveToastTitle'),
        t('journalCervicalMucus.saveToastMessage'),
        navigation.goBack,
      );
    };

  // M25: removes the saved observation for this day (section absent = the
  // canonical empty state) and resets the form; reopening shows it cleared.
  const clearEntry =
    async () => {
      await deleteJournalSection(entryDateKey, 'cervicalMucus');
      setHasSaved(false);
      setType('creamy');
      setNote('');
      setError('');
      saveToast.show(t('journalCervicalMucus.clearToastTitle'), t('journalCervicalMucus.clearToastMessage'), navigation.goBack);
    };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <JournalScreenLayout
      dateLabel={dateLabel}
      error={error}
      heroLabel={
        t('journalCervicalMucus.heroLabel')
      }
      heroSource={require('../../assets/images/conception-journal/cervical-mucus.png')}
      hideJournalHeader
      icon="water-outline"
      onSave={save}
      title={t('journalCervicalMucus.title')}
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

      {/* =====================================================
          OBSERVATION
      ===================================================== */}

      <SectionCard
        title={t('journalCervicalMucus.sectionTitle')}>

        {/* CURRENT OBSERVATION */}

        <View
          style={
            styles.currentCard
          }>

          <View
            style={[
              styles.currentIcon,

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
              size={28}
            />
          </View>

          <View
            style={
              styles.currentCopy
            }>

            <Text
              style={
                styles.currentEyebrow
              }>
              {t('journalCervicalMucus.observationOfTheDay')}
            </Text>

            <Text
              style={
                styles.currentTitle
              }>
              {
                currentConfig.title
              }
            </Text>

            <Text
              style={
                styles.currentDescription
              }>
              {
                currentConfig.description
              }
            </Text>
          </View>
        </View>

        {/* OPTIONS */}

        <View
          style={
            styles.choiceHeader
          }>

          <Text
            style={
              styles.choiceTitle
            }>
            {t('journalCervicalMucus.chooseAspectTitle')}
          </Text>

          <Text
            style={
              styles.choiceSubtitle
            }>
            {t('journalCervicalMucus.chooseAspectSubtitle')}
          </Text>
        </View>

        <View
          style={
            styles.optionsGrid
          }>

          <MucusChoice
            active={
              type ===
              'dry'
            }
            icon="weather-sunny"
            label={labels.dry}
            onPress={() =>
              setType(
                'dry',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'sticky'
            }
            icon="water-opacity"
            label={labels.sticky}
            onPress={() =>
              setType(
                'sticky',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'creamy'
            }
            icon="water-circle"
            label={labels.creamy}
            onPress={() =>
              setType(
                'creamy',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'watery'
            }
            icon="water-outline"
            label={labels.watery}
            onPress={() =>
              setType(
                'watery',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'eggWhite'
            }
            icon="water-plus-outline"
            label={labels.eggWhite}
            onPress={() =>
              setType(
                'eggWhite',
              )
            }
          />
        </View>

        {/* INFO */}

        <View
          style={
            styles.selectionInfo
          }>

          <MaterialDesignIcons
            color={
              currentConfig.iconColor
            }
            name="information-outline"
            size={17}
          />

          <Text
            style={
              styles.selectionInfoText
            }>
            {t('journalCervicalMucus.evolvesInfo')}
          </Text>
        </View>
      </SectionCard>

      {/* =====================================================
          COMMENT
      ===================================================== */}

      <SectionCard
        title={t('journalCervicalMucus.commentSectionTitle')}>

        <View
          style={
            styles.commentHeading
          }>

          <View
            style={
              styles.commentIcon
            }>

            <MaterialDesignIcons
              color={
                theme.colors.primary
              }
              name="pencil-outline"
              size={19}
            />
          </View>

          <View
            style={
              styles.commentHeadingCopy
            }>

            <Text
              style={
                styles.commentTitle
              }>
              {t('journalCervicalMucus.addDetailTitle')}
            </Text>

            <Text
              style={
                styles.commentSubtitle
              }>
              {t('journalCervicalMucus.addDetailSubtitle')}
            </Text>
          </View>
        </View>

        <LabeledInput
          label={t('journalCervicalMucus.noteLabel')}
          maxLength={300}
          multiline
          onChangeText={
            setNote
          }
          placeholder={t('journalCervicalMucus.notePlaceholder')}
          value={note}
        />
      </SectionCard>

      {/* =====================================================
          TIP
      ===================================================== */}

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
            {t('journalCervicalMucus.tipTitle')}
          </Text>

          <Text
            style={
              styles.tipText
            }>
            {t('journalCervicalMucus.tipText')}
          </Text>
        </View>
      </View>

      {hasSaved ? <ClearEntryButton onConfirm={clearEntry} subject={t('journalCervicalMucus.clearSubject')} /> : null}
    </JournalScreenLayout>
  );
}

/* ============================================================
   CHOICE
============================================================ */

function MucusChoice({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  const {t} = useTranslation();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={t('journalCervicalMucus.aspectAccessibility', {label})}
      accessibilityRole="radio"
      accessibilityState={{
        checked:
          active,
      }}
      onPress={
        onPress
      }
      style={({pressed}) => [
        styles.choiceCard,

        active &&
          styles.choiceCardActive,

        pressed &&
          styles.choiceCardPressed,
      ]}>

      <View
        style={[
          styles.choiceIcon,

          active &&
            styles.choiceIconActive,
        ]}>

        <MaterialDesignIcons
          color={
            active
              ? theme.colors.primary
              : theme.colors.textSecondary
          }
          name={
            icon as never
          }
          size={22}
        />
      </View>

      <Text
        style={[
          styles.choiceLabel,

          active &&
            styles.choiceLabelActive,
        ]}>
        {label}
      </Text>

      {active ? (
        <View
          style={
            styles.selectedBadge
          }>

          <MaterialDesignIcons
            color={pickReadableTextColor(theme.colors.primary)}
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
    /* ========================================================
       CURRENT OBSERVATION
    ======================================================== */

    currentCard: {
      minHeight: 108,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.10),

      borderRadius: 21,

      backgroundColor:
        theme.colors.surfaceSecondary,

      paddingHorizontal: 14,

      paddingVertical: 14,
    },

    currentIcon: {
      width: 56,
      height: 56,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 18,
    },

    currentCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 12,
    },

    currentEyebrow: {
      color:
        theme.colors.primary,

      fontSize: 7.8,

      fontWeight:
        '900',

      letterSpacing: 1.05,
    },

    currentTitle: {
      marginTop: 4,

      color:
        theme.colors.accent,

      fontSize: 18,

      lineHeight: 22,

      fontWeight:
        '900',
    },

    currentDescription: {
      marginTop: 4,

      color:
        theme.colors.textSecondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    /* ========================================================
       CHOICE HEADER
    ======================================================== */

    choiceHeader: {
      marginTop: 18,

      marginBottom: 10,
    },

    choiceTitle: {
      color:
        theme.colors.text,

      fontSize: 12.5,

      fontWeight:
        '800',
    },

    choiceSubtitle: {
      marginTop: 3,

      color:
        theme.colors.textSecondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    /* ========================================================
       OPTIONS
    ======================================================== */

    optionsGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      gap: 8,
    },

    choiceCard: {
      position:
        'relative',

      width: '31.5%',

      minHeight: 88,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth: 1,

      borderColor:
        withAlpha(theme.colors.primary, 0.14),

      borderRadius: 17,

      backgroundColor:
        theme.colors.surface,

      paddingHorizontal: 5,

      paddingVertical: 10,
    },

    choiceCardActive: {
      borderWidth: 1.5,

      borderColor:
        theme.colors.primary,

      backgroundColor:
        theme.colors.primarySoft,

      shadowColor:
        theme.colors.primary,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity: 0.08,

      shadowRadius: 6,

      elevation: 2,
    },

    choiceCardPressed: {
      opacity: 0.8,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    choiceIcon: {
      width: 40,
      height: 40,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        theme.colors.surfaceSecondary,
    },

    choiceIconActive: {
      backgroundColor:
        theme.colors.primarySoft,
    },

    choiceLabel: {
      marginTop: 7,

      color:
        theme.colors.textSecondary,

      fontSize: 10.5,

      fontWeight:
        '700',

      textAlign:
        'center',
    },

    choiceLabelActive: {
      color:
        theme.colors.accent,

      fontWeight:
        '900',
    },

    selectedBadge: {
      position:
        'absolute',

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

    /* ========================================================
       SELECTION INFO
    ======================================================== */

    selectionInfo: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 7,

      marginTop: 12,

      borderRadius: 13,

      backgroundColor:
        theme.colors.surfaceSecondary,

      paddingHorizontal: 10,

      paddingVertical: 9,
    },

    selectionInfoText: {
      flex: 1,

      color:
        theme.colors.textSecondary,

      fontSize: 9.5,

      lineHeight: 14,
    },

    /* ========================================================
       COMMENT
    ======================================================== */

    commentHeading: {
      flexDirection:
        'row',

      alignItems:
        'center',

      marginBottom: 13,
    },

    commentIcon: {
      width: 39,
      height: 39,

      flexShrink: 0,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius: 13,

      backgroundColor:
        theme.colors.primarySoft,
    },

    commentHeadingCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 9,
    },

    commentTitle: {
      color:
        theme.colors.text,

      fontSize: 12,

      fontWeight:
        '800',
    },

    commentSubtitle: {
      marginTop: 2,

      color:
        theme.colors.textSecondary,

      fontSize: 9.3,

      lineHeight: 13.5,
    },

    /* ========================================================
       TIP
    ======================================================== */

    tip: {
      flexDirection:
        'row',

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

      flexShrink: 0,

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

      fontWeight:
        '900',

      letterSpacing: 1,
    },

    tipTitle: {
      marginTop: 2,

      color:
        theme.colors.accent,

      fontSize: 12.5,

      fontWeight:
        '800',
    },

    tipText: {
      marginTop: 4,

      color:
        theme.colors.textSecondary,

      fontSize: 10.5,

      lineHeight: 16,
    },
  });
}