import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

import {useAwaTheme} from '../../theme/AwaThemeProvider';

import {
  pickReadableTextColor,
  withAlpha,
  type ResolvedAwaTheme,
} from '../../theme/awaThemeTokens';

/* ============================================================
   CONSTANTS
============================================================ */

const TYPES: Record<
  string,
  CervicalMucusType
> = {
  Sèche: 'dry',
  Collante: 'sticky',
  Crémeuse: 'creamy',
  Aqueuse: 'watery',
  Élastique: 'eggWhite',
};

const LABELS =
  Object.fromEntries(
    Object.entries(
      TYPES,
    ).map(
      ([label, key]) => [
        key,
        label,
      ],
    ),
  ) as Record<
    CervicalMucusType,
    string
  >;

const DATE_KEY = () =>
  new Date().toLocaleDateString(
    'en-CA',
  );

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

  const insets = useSafeAreaInsets();
  const saveToast = useJournalSaveToast();

  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [
    type,
    setType,
  ] =
    useState('Crémeuse');

  const [
    note,
    setNote,
  ] =
    useState('');

  /* ==========================================================
     LOAD
  ========================================================== */

  useEffect(() => {
    getJournalEntry(
      DATE_KEY(),
    ).then(entry => {
      if (
        !entry?.cervicalMucus
      ) {
        return;
      }

      setType(
        LABELS[
          entry
            .cervicalMucus
            .type
        ],
      );

      setNote(
        entry
          .cervicalMucus
          .note ?? '',
      );
    });
  }, []);

  /* ==========================================================
     CURRENT CONFIG
  ========================================================== */

  const currentConfig =
    useMemo(() => {
      switch (type) {
        case 'Sèche':
          return {
            icon:
              'weather-sunny' as const,

            iconColor:
              MUCUS_TYPE_COLORS.dry.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.dry.background,

            title:
              'Sensation plutôt sèche',

            description:
              'Peu ou pas de glaire observable aujourd’hui.',
          };

        case 'Collante':
          return {
            icon:
              'water-opacity' as const,

            iconColor:
              MUCUS_TYPE_COLORS.sticky.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.sticky.background,

            title:
              'Texture collante',

            description:
              'Une texture plus épaisse et collante a été observée.',
          };

        case 'Aqueuse':
          return {
            icon:
              'water-outline' as const,

            iconColor:
              MUCUS_TYPE_COLORS.watery.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.watery.background,

            title:
              'Texture aqueuse',

            description:
              'Une texture plus fluide et humide a été observée.',
          };

        case 'Élastique':
          return {
            icon:
              'water-plus-outline' as const,

            iconColor:
              MUCUS_TYPE_COLORS.eggWhite.icon,

            iconBackground:
              MUCUS_TYPE_COLORS.eggWhite.background,

            title:
              'Texture élastique',

            description:
              'Une glaire plus extensible et transparente a été observée.',
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
              'Texture crémeuse',

            description:
              'Une texture douce, opaque et crémeuse a été observée.',
          };
      }
    }, [type]);

  /* ==========================================================
     SAVE
  ========================================================== */

  const save =
    async () => {
      await saveJournalSection(
        DATE_KEY(),
        'cervicalMucus',
        {
          type:
            TYPES[type],

          note:
            note.trim(),
        },
      );

      saveToast.show(
        'Observation enregistrée',
        'Ton observation de glaire cervicale a bien été ajoutée au journal.',
        navigation.goBack,
      );
    };

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <JournalScreenLayout
      heroLabel={
        'Observe les changements\nau fil de ton cycle'
      }
      heroSource={require('../../assets/images/conception-journal/cervical-mucus.png')}
      hideJournalHeader
      icon="water-outline"
      onSave={save}
      title="Glaire cervicale"
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
        title="Aspect observé">

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
              OBSERVATION DU JOUR
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
            Quel aspect observes-tu ?
          </Text>

          <Text
            style={
              styles.choiceSubtitle
            }>
            Choisis l’option qui ressemble le plus à ton observation.
          </Text>
        </View>

        <View
          style={
            styles.optionsGrid
          }>

          <MucusChoice
            active={
              type ===
              'Sèche'
            }
            icon="weather-sunny"
            label="Sèche"
            onPress={() =>
              setType(
                'Sèche',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'Collante'
            }
            icon="water-opacity"
            label="Collante"
            onPress={() =>
              setType(
                'Collante',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'Crémeuse'
            }
            icon="water-circle"
            label="Crémeuse"
            onPress={() =>
              setType(
                'Crémeuse',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'Aqueuse'
            }
            icon="water-outline"
            label="Aqueuse"
            onPress={() =>
              setType(
                'Aqueuse',
              )
            }
          />

          <MucusChoice
            active={
              type ===
              'Élastique'
            }
            icon="water-plus-outline"
            label="Élastique"
            onPress={() =>
              setType(
                'Élastique',
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
            Cette observation peut évoluer au cours du cycle.
          </Text>
        </View>
      </SectionCard>

      {/* =====================================================
          COMMENT
      ===================================================== */}

      <SectionCard
        title="Commentaire">

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
              Ajoute un détail si tu le souhaites
            </Text>

            <Text
              style={
                styles.commentSubtitle
              }>
              Tu peux noter une sensation, une couleur ou tout autre détail utile.
            </Text>
          </View>
        </View>

        <LabeledInput
          label="Note (optionnelle)"
          maxLength={300}
          multiline
          onChangeText={
            setNote
          }
          placeholder="Ajoute une note…"
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
            BON À SAVOIR
          </Text>

          <Text
            style={
              styles.tipTitle
            }>
            Observe surtout les changements
          </Text>

          <Text
            style={
              styles.tipText
            }>
            La glaire cervicale peut changer d’aspect au fil du cycle. Ces observations restent personnelles et ne constituent pas un diagnostic médical.
          </Text>
        </View>
      </View>
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
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={`Aspect ${label}`}
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