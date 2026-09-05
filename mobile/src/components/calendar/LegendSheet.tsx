import React, {memo, useEffect, useMemo, useRef} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {homeRadii} from '../home/homeTheme';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type LegendEntry = {
  color: string;
  label: string;
  description: string;
  outline?: boolean;
  icon?: IconName;
};

// PHASE E3 — these colors are calendar tracking/religious SEMANTICS, the
// exact same fixed literals MonthCalendarCard.tsx uses (RAMADAN_MARKER_COLOR
// there is hardcoded to this same resolved value on purpose — see that
// file's own header note) — never theme-driven, so switching palettes can
// never change what "period"/"fertile"/"ovulation"/"Ramadan" mean. Only
// "Aujourd'hui" (purely decorative, not medical) follows the resolved theme,
// matching MonthCalendarCard's own Today treatment (theme.colors.text).
const RAMADAN_MARKER_COLOR = '#6D4AE8';
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';
const PERIOD_COLOR = '#DC7B82';
const FERTILE_COLOR = '#3E8E56';
const OVULATION_COLOR = '#8B5CF6';
const MOOD_COLOR = '#E0A93E';
const NOTES_COLOR = '#2C8E93';

const SPIRITUAL_ENTRIES: LegendEntry[] = [
  {
    color: RAMADAN_MARKER_COLOR,
    label: 'Ramadan',
    description: 'Ce jour se situe dans le mois du Ramadan (jeûne).',
    icon: 'moon-waning-crescent',
  },
  {
    color: DHOUL_HIJJA_MARKER_COLOR,
    label: 'Dhou al-Hijja',
    description: 'Ce jour se situe dans le mois de Dhou al-Hijja.',
    icon: 'moon-waning-crescent',
  },
];

function createEntries(theme: ResolvedAwaTheme): LegendEntry[] {
  return [
    {
      color: PERIOD_COLOR,
      label: 'Règles',
      description: 'Jours enregistrés comme période de menstruation.',
    },
    {
      color: FERTILE_COLOR,
      label: 'Fenêtre fertile',
      description:
        'Période où la probabilité de conception est la plus élevée.',
    },
    {
      color: OVULATION_COLOR,
      label: 'Ovulation',
      description: 'Jour estimé de l’ovulation dans ton cycle.',
    },
    {
      color: MOOD_COLOR,
      label: 'Humeur',
      description: 'Une humeur a été enregistrée pour ce jour.',
    },
    {
      color: NOTES_COLOR,
      label: 'Notes / Symptômes',
      description:
        'Une note, un symptôme, ou un autre suivi quotidien (activité, sommeil, hydratation, vie intime) a été enregistré pour ce jour.',
    },
    {
      // Decorative-only (not medical) — follows the resolved theme, matching
      // MonthCalendarCard's own Today treatment exactly.
      color: theme.colors.text,
      label: 'Aujourd’hui',
      description:
        'Repère l’entourage du jour actuel dans le calendrier.',
      outline: true,
    },
  ];
}

type Props = {
  visible: boolean;
  onClose: () => void;
  // Only true when the app-wide spiritual-markers preference is on — the
  // calendar itself hides the Ramadan/Dhou al-Hijja markers in that case, so
  // the legend must never describe an indicator that can't actually appear.
  showSpiritualMarkers?: boolean;
};

function LegendSheet({
  visible,
  onClose,
  showSpiritualMarkers = false,
}: Props): React.JSX.Element {
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const entries = useMemo(() => {
    const base = createEntries(theme);
    return showSpiritualMarkers ? [...base, ...SPIRITUAL_ENTRIES] : base;
  }, [showSpiritualMarkers, theme]);

  const progress = useRef(
    new Animated.Value(0),
  ).current;

  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo
      .isReduceMotionEnabled()
      .then(value => {
        reduceMotion.current = value;
      });
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    progress.setValue(0);

    Animated.spring(progress, {
      toValue: 1,
      damping: 22,
      stiffness: 170,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [progress, visible]);

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current
        ? 0
        : 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        onClose();
      }
    });
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity:
                progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.35],
                }),
            },
          ]}>
          <Pressable
            accessibilityLabel="Fermer la légende"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + 12,

              opacity: progress,

              transform: [
                {
                  translateY:
                    progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [280, 0],
                    }),
                },
              ],
            },
          ]}>
          <View style={styles.handle} />

          <Text style={styles.title}>
            Légende du calendrier
          </Text>

          <Text style={styles.subtitle}>
            Ce que signifient les couleurs et repères affichés.
          </Text>

          <ScrollView
            contentContainerStyle={
              styles.list
            }
            showsVerticalScrollIndicator={
              false
            }>
            {entries.map(entry => (
              <View
                key={entry.label}
                style={styles.row}>
                {entry.icon ? (
                  <MaterialDesignIcons
                    color={entry.color}
                    name={entry.icon}
                    size={16}
                    style={styles.iconMarker}
                  />
                ) : entry.outline ? (
                  <View
                    style={[
                      styles.todayOutline,
                      {
                        borderColor:
                          entry.color,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          entry.color,
                        borderColor:
                          entry.color,
                      },
                    ]}
                  />
                )}

                <View style={styles.copy}>
                  <Text
                    numberOfLines={1}
                    style={styles.label}>
                    {entry.label}
                  </Text>

                  <Text
                    style={
                      styles.description
                    }>
                    {entry.description}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={close}
            style={({pressed}) => [
              styles.doneButton,
              pressed &&
                styles.pressed,
            ]}>
            <Text
              style={styles.doneText}>
              Fermer
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },

    // Fixed modal scrim — never themed, same precedent as every migrated screen.
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#17102F',
    },

    sheet: {
      maxHeight: '80%',
      borderTopLeftRadius:
        homeRadii.card,
      borderTopRightRadius:
        homeRadii.card,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 18,
      paddingTop: 10,
      elevation: 20,
    },

    handle: {
      width: 42,
      height: 5,
      alignSelf: 'center',
      borderRadius: 3,
      backgroundColor:
        withAlpha(theme.colors.primary, 0.14),
    },

    title: {
      marginTop: 14,
      color: theme.colors.text,
      fontFamily: 'serif',
      fontSize: 20,
      fontWeight: '700',
    },

    subtitle: {
      marginTop: 4,
      color:
        theme.colors.textSecondary,
      fontSize: 12.5,
    },

    list: {
      marginTop: 12,
      paddingBottom: 4,
    },

    row: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 6,
    },

    dot: {
      width: 16,
      height: 16,
      marginTop: 2,
      borderWidth: 0,
      borderRadius: 8,
    },

    iconMarker: {
      width: 18,
      height: 18,
      marginTop: 1,
      textAlign: 'center',
      textAlignVertical: 'center',
    },

    todayOutline: {
      width: 18,
      height: 18,
      marginTop: 1,

      borderWidth: 1.8,
      borderStyle: 'dashed',
      borderRadius: 9,

      backgroundColor:
        'transparent',
    },

    copy: {
      flex: 1,
    },

    label: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    description: {
      marginTop: 2,
      color:
        theme.colors.textSecondary,
      fontSize: 12,
      lineHeight: 16,
    },

    doneButton: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      borderRadius:
        homeRadii.button,
      backgroundColor:
        theme.colors.primary,
    },

    doneText: {
      color: onPrimaryTextColor(theme),
      fontSize: 15,
      fontWeight: '700',
    },

    pressed: {
      opacity: 0.85,
    },
  });
}

export default memo(LegendSheet);
