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

const COLORS = {
  deepPurple: '#38215E',
  purple: '#6942BD',
  purpleSoft: '#8C6CBD',

  lavender: '#EEE7F7',
  lavenderSoft: '#F8F5FB',

  white: '#FFFFFF',

  text: '#30263F',
  secondary: '#746A7D',

  border: '#E7DFEC',

  blue: '#5D7EA5',
  blueSoft: '#EAF1F8',

  green: '#5D8B72',
  greenSoft: '#EAF4EE',

  beige: '#9C7B5A',
  beigeSoft: '#F6F0E9',
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
              COLORS.beige,

            iconBackground:
              COLORS.beigeSoft,

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
              COLORS.purple,

            iconBackground:
              COLORS.lavender,

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
              COLORS.blue,

            iconBackground:
              COLORS.blueSoft,

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
              COLORS.green,

            iconBackground:
              COLORS.greenSoft,

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
              COLORS.purple,

            iconBackground:
              COLORS.lavender,

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
                COLORS.purple
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
              ? COLORS.purple
              : COLORS.secondary
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
        'rgba(105,66,189,0.10)',

      borderRadius: 21,

      backgroundColor:
        '#FAF8FC',

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
        COLORS.purple,

      fontSize: 7.8,

      fontWeight:
        '900',

      letterSpacing: 1.05,
    },

    currentTitle: {
      marginTop: 4,

      color:
        COLORS.deepPurple,

      fontSize: 18,

      lineHeight: 22,

      fontWeight:
        '900',
    },

    currentDescription: {
      marginTop: 4,

      color:
        COLORS.secondary,

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
        COLORS.text,

      fontSize: 12.5,

      fontWeight:
        '800',
    },

    choiceSubtitle: {
      marginTop: 3,

      color:
        COLORS.secondary,

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
        COLORS.border,

      borderRadius: 17,

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 5,

      paddingVertical: 10,
    },

    choiceCardActive: {
      borderWidth: 1.5,

      borderColor:
        COLORS.purple,

      backgroundColor:
        '#F5EFFA',

      shadowColor:
        COLORS.purple,

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
        '#F5F1F8',
    },

    choiceIconActive: {
      backgroundColor:
        COLORS.lavender,
    },

    choiceLabel: {
      marginTop: 7,

      color:
        COLORS.secondary,

      fontSize: 10.5,

      fontWeight:
        '700',

      textAlign:
        'center',
    },

    choiceLabelActive: {
      color:
        COLORS.deepPurple,

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
        COLORS.purple,
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
        COLORS.lavenderSoft,

      paddingHorizontal: 10,

      paddingVertical: 9,
    },

    selectionInfoText: {
      flex: 1,

      color:
        COLORS.secondary,

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
        COLORS.lavender,
    },

    commentHeadingCopy: {
      flex: 1,

      minWidth: 0,

      marginLeft: 9,
    },

    commentTitle: {
      color:
        COLORS.text,

      fontSize: 12,

      fontWeight:
        '800',
    },

    commentSubtitle: {
      marginTop: 2,

      color:
        COLORS.secondary,

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
        'rgba(105,66,189,0.10)',

      borderRadius: 20,

      backgroundColor:
        COLORS.lavender,

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

      fontWeight:
        '900',

      letterSpacing: 1,
    },

    tipTitle: {
      marginTop: 2,

      color:
        COLORS.deepPurple,

      fontSize: 12.5,

      fontWeight:
        '800',
    },

    tipText: {
      marginTop: 4,

      color:
        '#5D5368',

      fontSize: 10.5,

      lineHeight: 16,
    },
  });