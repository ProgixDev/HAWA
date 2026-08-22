import React, {memo, useEffect, useRef} from 'react';
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

import {homeColors, homeRadii} from '../home/homeTheme';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];

type LegendEntry = {
  color: string;
  label: string;
  description: string;
  outline?: boolean;
  icon?: IconName;
};

// Same colors as MonthCalendarCard.tsx's own spiritual markers — reused
// verbatim, not redefined, so the two never drift apart.
const RAMADAN_MARKER_COLOR = homeColors.primary;
const DHOUL_HIJJA_MARKER_COLOR = '#B7791F';

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

const ENTRIES: LegendEntry[] = [
  {
    color: homeColors.pink,
    label: 'Règles',
    description: 'Jours enregistrés comme période de menstruation.',
  },
  {
    color: '#3E8E56',
    label: 'Fenêtre fertile',
    description:
      'Période où la probabilité de conception est la plus élevée.',
  },
  {
    color: '#8B5CF6',
    label: 'Ovulation',
    description: 'Jour estimé de l’ovulation dans ton cycle.',
  },
  {
    color: '#E0A93E',
    label: 'Humeur',
    description: 'Une humeur a été enregistrée pour ce jour.',
  },
  {
    color: '#2C8E93',
    label: 'Notes / Symptômes',
    description:
      'Une note, un symptôme, ou un autre suivi quotidien (activité, sommeil, hydratation, vie intime) a été enregistré pour ce jour.',
  },
  {
    color: '#211A35',
    label: 'Aujourd’hui',
    description:
      'Repère l’entourage du jour actuel dans le calendrier.',
    outline: true,
  },
];

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
  const insets = useSafeAreaInsets();
  const entries = showSpiritualMarkers ? [...ENTRIES, ...SPIRITUAL_ENTRIES] : ENTRIES;

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

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

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
    backgroundColor: '#FCFAFF',
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
      homeColors.cardBorder,
  },

  title: {
    marginTop: 14,
    color: homeColors.textPrimary,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 4,
    color:
      homeColors.textSecondary,
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
    color: homeColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },

  description: {
    marginTop: 2,
    color:
      homeColors.textSecondary,
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
      homeColors.primary,
  },

  doneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.85,
  },
});

export default memo(LegendSheet);