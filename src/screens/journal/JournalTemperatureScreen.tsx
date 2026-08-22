import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Modal,
  Platform,
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
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {
  getJournalEntry,
  saveJournalSection,
} from '../../state/dailyJournalStore';
import {
  ChoiceChips,
  JournalScreenLayout,
  SectionCard,
} from '../../components/journal/JournalScreenLayout';
import {JournalSaveToast, useJournalSaveToast} from '../../components/journal/JournalSaveToast';
import {LabeledInput} from '../../components/journal/JournalInputs';

const DATE_KEY = () =>
  new Date().toLocaleDateString('en-CA');

const COLORS = {
  primary: '#6337BB',
  primaryDark: '#39205F',

  lavender: '#EEE8F7',
  lavenderSoft: '#F8F5FC',
  lavenderBorder: '#E4DBEF',

  text: '#30263F',
  secondary: '#786D86',
  muted: '#9B91A6',

  white: '#FFFFFF',

  green: '#4F8C6A',
  greenSoft: '#EAF5EE',

  gold: '#B69A69',

  overlay: 'rgba(25, 15, 39, 0.48)',
};

type TemperatureUnit = 'C' | 'F';

export default function JournalTemperatureScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const saveToast = useJournalSaveToast();

  const [value, setValue] = useState('');
  const [unit, setUnit] =
    useState<TemperatureUnit>('C');

  const [time, setTime] = useState('');
  const [timePickerDate, setTimePickerDate] =
    useState(new Date());

  const [timePickerVisible, setTimePickerVisible] =
    useState(false);

  const [method, setMethod] = useState('Orale');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const scale = useRef(
    new Animated.Value(1),
  ).current;

  const temperaturePulse = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    getJournalEntry(DATE_KEY()).then(entry => {
      const current = entry?.temperature;

      if (!current) {
        return;
      }

      setValue(
        String(current.value).replace('.', ','),
      );

      setUnit(current.unit);

      setTime(current.time ?? '');

      setMethod(current.method ?? 'Orale');

      setNote(current.note ?? '');

      if (current.time) {
        const parsed =
          parseTimeToDate(current.time);

        if (parsed) {
          setTimePickerDate(parsed);
        }
      }
    });
  }, []);

  const updateValue = (next: string) => {
    setValue(next);
    setError('');

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.035,
        duration: 90,
        useNativeDriver: true,
      }),

      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    temperaturePulse.setValue(0);

    Animated.timing(temperaturePulse, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const openTimePicker = () => {
    const existingTime =
      parseTimeToDate(time);

    setTimePickerDate(
      existingTime ?? new Date(),
    );

    setTimePickerVisible(true);
  };

  const confirmTime = () => {
    setTime(formatTime(timePickerDate));
    setTimePickerVisible(false);
  };

  const onAndroidTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (event.type === 'dismissed') {
      setTimePickerVisible(false);
      return;
    }

    if (!selectedDate) {
      setTimePickerVisible(false);
      return;
    }

    setTimePickerDate(selectedDate);
    setTime(formatTime(selectedDate));
    setTimePickerVisible(false);
  };

  const save = async () => {
    setError('');

    const number = Number(
      value.replace(',', '.'),
    );

    const min =
      unit === 'C'
        ? 34
        : 93.2;

    const max =
      unit === 'C'
        ? 43
        : 109.4;

    if (
      !Number.isFinite(number) ||
      number < min ||
      number > max
    ) {
      setError(
        `Saisis une température entre ${min} et ${max} °${unit}.`,
      );
      return;
    }

    await saveJournalSection(
      DATE_KEY(),
      'temperature',
      {
        value: number,
        unit,
        time,
        method,
        note: note.trim(),
      },
    );

    saveToast.show(
      'Température enregistrée',
      'Ta température basale a bien été ajoutée au journal.',
      navigation.goBack,
    );
  };

  const temperatureHelper = useMemo(() => {
    if (!value) {
      return 'Ajoute ta mesure du matin';
    }

    const number = Number(
      value.replace(',', '.'),
    );

    if (!Number.isFinite(number)) {
      return 'Vérifie la valeur saisie';
    }

    return 'Mesure prête à être enregistrée';
  }, [value]);

  return (
    <>
      <JournalScreenLayout
        error={error}
        heroLabel="Ta mesure du matin"
        heroSource={require('../../assets/images/conception-journal/basal-temperature.png')}
        hideJournalHeader
        icon="thermometer"
        onSave={save}
        title="Température basale"
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
            TEMPÉRATURE
        ===================================================== */}

        <SectionCard title="Ma température">
          <View style={styles.temperatureHero}>
            <View style={styles.temperatureDecorationOne} />
            <View style={styles.temperatureDecorationTwo} />

            <View style={styles.temperatureTopRow}>
              <View style={styles.temperatureIcon}>
                <MaterialDesignIcons
                  color={COLORS.primary}
                  name="thermometer"
                  size={24}
                />
              </View>

              <View style={styles.temperatureTopCopy}>
                <Text style={styles.temperatureEyebrow}>
                  MESURE DU JOUR
                </Text>

                <Text style={styles.temperatureHelper}>
                  {temperatureHelper}
                </Text>
              </View>

              {value ? (
                <View style={styles.readyBadge}>
                  <MaterialDesignIcons
                    color={COLORS.green}
                    name="check-circle"
                    size={14}
                  />

                  <Text style={styles.readyText}>
                    Ajoutée
                  </Text>
                </View>
              ) : null}
            </View>

            <Animated.View
              style={[
                styles.temperatureValueArea,
                {
                  transform: [{scale}],
                },
              ]}>
              <Text style={styles.value}>
                {value || '—'}
              </Text>

              <Text style={styles.unit}>
                °{unit}
              </Text>
            </Animated.View>
          </View>

          <View style={styles.fieldSpacing}>
            <LabeledInput
              keyboardType="decimal-pad"
              label="Température"
              onChangeText={updateValue}
              placeholder={
                unit === 'C'
                  ? '36,50'
                  : '97,70'
              }
              value={value}
            />
          </View>

          <View style={styles.unitSection}>
            <Text style={styles.smallLabel}>
              Unité
            </Text>

            <ChoiceChips
              onChange={item =>
                setUnit(
                  item === '°C'
                    ? 'C'
                    : 'F',
                )
              }
              options={['°C', '°F']}
              value={`°${unit}`}
            />
          </View>

          {/* =================================================
              TIME PICKER FIELD
          ================================================= */}

          <View style={styles.timeSection}>
            <Text style={styles.smallLabel}>
              Heure de mesure
            </Text>

            <Pressable
              accessibilityLabel="Choisir l’heure de mesure"
              accessibilityRole="button"
              onPress={openTimePicker}
              style={({pressed}) => [
                styles.timeCard,
                time &&
                  styles.timeCardSelected,
                pressed &&
                  styles.timeCardPressed,
              ]}>
              <View style={styles.timeIconBox}>
                <MaterialDesignIcons
                  color={COLORS.primary}
                  name="clock-outline"
                  size={22}
                />
              </View>

              <View style={styles.timeCopy}>
                <Text style={styles.timeLabel}>
                  {time
                    ? 'Mesurée à'
                    : 'Choisir une heure'}
                </Text>

                <Text
                  style={[
                    styles.timeValue,
                    !time &&
                      styles.timePlaceholder,
                  ]}>
                  {time || 'Appuie pour sélectionner'}
                </Text>
              </View>

              <View style={styles.timeArrow}>
                <MaterialDesignIcons
                  color={COLORS.primary}
                  name="chevron-down"
                  size={21}
                />
              </View>
            </Pressable>
          </View>
        </SectionCard>

        {/* =====================================================
            METHOD
        ===================================================== */}

        <SectionCard title="Méthode et commentaire">
          <View style={styles.methodHeading}>
            <View style={styles.methodIcon}>
              <MaterialDesignIcons
                color={COLORS.primary}
                name="thermometer-lines"
                size={19}
              />
            </View>

            <View style={styles.methodCopy}>
              <Text style={styles.methodTitle}>
                Méthode de mesure
              </Text>

              <Text style={styles.methodSubtitle}>
                Choisis la méthode utilisée ce matin.
              </Text>
            </View>
          </View>

          <ChoiceChips
            onChange={setMethod}
            options={[
              'Orale',
              'Axillaire',
              'Rectale',
              'Autre',
            ]}
            value={method}
          />

          <View style={styles.noteSpacing}>
            <LabeledInput
              label="Commentaire (optionnel)"
              maxLength={300}
              multiline
              onChangeText={setNote}
              placeholder="Ajoute une note…"
              value={note}
            />
          </View>
        </SectionCard>

        {/* =====================================================
            TIP
        ===================================================== */}

        <View style={styles.tip}>
          <View style={styles.tipIcon}>
            <MaterialDesignIcons
              color={COLORS.primary}
              name="lightbulb-outline"
              size={21}
            />
          </View>

          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>
              Conseil
            </Text>

            <Text style={styles.tipText}>
              Prends ta température au réveil,
              avant de te lever, idéalement à la
              même heure.
            </Text>
          </View>
        </View>
      </JournalScreenLayout>

      {/* =======================================================
          IOS PREMIUM TIME PICKER
      ======================================================= */}

      {Platform.OS === 'ios' ? (
        <Modal
          animationType="fade"
          onRequestClose={() =>
            setTimePickerVisible(false)
          }
          transparent
          visible={timePickerVisible}>
          <View style={styles.modalRoot}>
            <Pressable
              accessibilityLabel="Fermer le sélecteur d’heure"
              onPress={() =>
                setTimePickerVisible(false)
              }
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.timePickerSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderIcon}>
                  <MaterialDesignIcons
                    color={COLORS.primary}
                    name="clock-outline"
                    size={21}
                  />
                </View>

                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.sheetEyebrow}>
                    HEURE DE MESURE
                  </Text>

                  <Text style={styles.sheetTitle}>
                    À quelle heure ?
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel="Fermer"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() =>
                    setTimePickerVisible(false)
                  }
                  style={({pressed}) => [
                    styles.closeButton,
                    pressed &&
                      styles.closeButtonPressed,
                  ]}>
                  <MaterialDesignIcons
                    color={COLORS.secondary}
                    name="close"
                    size={20}
                  />
                </Pressable>
              </View>

              <View style={styles.pickerHighlight}>
                <MaterialDesignIcons
                  color={COLORS.primary}
                  name="weather-sunset-up"
                  size={17}
                />

                <Text style={styles.pickerHighlightText}>
                  Ta mesure du matin
                </Text>
              </View>

              <View style={styles.pickerContainer}>
                <DateTimePicker
                  display="spinner"
                  locale="fr-FR"
                  mode="time"
                  onChange={(
                    _event,
                    selectedDate,
                  ) => {
                    if (selectedDate) {
                      setTimePickerDate(
                        selectedDate,
                      );
                    }
                  }}
                  value={timePickerDate}
                />
              </View>

              <Text style={styles.selectedTimePreview}>
                {formatTime(timePickerDate)}
              </Text>

              <Pressable
                accessibilityLabel="Confirmer l’heure"
                accessibilityRole="button"
                onPress={confirmTime}
                style={({pressed}) => [
                  styles.confirmButton,
                  pressed &&
                    styles.confirmButtonPressed,
                ]}>
                <MaterialDesignIcons
                  color={COLORS.white}
                  name="check"
                  size={19}
                />

                <Text style={styles.confirmButtonText}>
                  Confirmer l’heure
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* =======================================================
          ANDROID NATIVE CLOCK
      ======================================================= */}

      {Platform.OS === 'android' &&
      timePickerVisible ? (
        <DateTimePicker
          display="clock"
          is24Hour
          mode="time"
          onChange={onAndroidTimeChange}
          value={timePickerDate}
        />
      ) : null}
    </>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(
    'fr-FR',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  ).format(date);
}

function parseTimeToDate(
  time: string,
): Date | null {
  if (!time) {
    return null;
  }

  const match = time.match(
    /^(\d{1,2}):(\d{2})$/,
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0,
  );

  return date;
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  /* ============================================================
     TEMPERATURE HERO
  ============================================================ */

  temperatureHero: {
    position: 'relative',

    overflow: 'hidden',

    minHeight: 140,

    marginBottom: 16,

    borderWidth: 1,
    borderColor:
      'rgba(99,55,187,0.10)',

    borderRadius: 22,

    backgroundColor: '#F7F3FC',

    padding: 14,
  },

  temperatureDecorationOne: {
    position: 'absolute',

    top: -55,
    right: -40,

    width: 130,
    height: 130,

    borderRadius: 65,

    backgroundColor:
      'rgba(99,55,187,0.08)',
  },

  temperatureDecorationTwo: {
    position: 'absolute',

    bottom: -45,
    left: -25,

    width: 95,
    height: 95,

    borderRadius: 48,

    backgroundColor:
      'rgba(82,55,130,0.05)',
  },

  temperatureTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  temperatureIcon: {
    width: 42,
    height: 42,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: '#EAE1F7',
  },

  temperatureTopCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },

  temperatureEyebrow: {
    color: COLORS.primary,

    fontSize: 8,
    fontWeight: '900',

    letterSpacing: 1.05,
  },

  temperatureHelper: {
    marginTop: 3,

    color: COLORS.secondary,

    fontSize: 10.5,
    lineHeight: 14,

    fontWeight: '500',
  },

  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,

    borderRadius: 12,

    backgroundColor: COLORS.greenSoft,

    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  readyText: {
    color: COLORS.green,

    fontSize: 9,
    fontWeight: '800',
  },

  temperatureValueArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',

    alignSelf: 'center',

    marginTop: 13,
  },

  value: {
    color: COLORS.primaryDark,

    fontFamily: 'serif',
    fontSize: 42,
    lineHeight: 49,

    fontWeight: '800',

    letterSpacing: -1,
  },

  unit: {
    marginBottom: 7,
    marginLeft: 5,

    color: COLORS.primary,

    fontSize: 16,

    fontWeight: '800',
  },

  /* ============================================================
     COMMON
  ============================================================ */

  fieldSpacing: {
    marginTop: 2,
  },

  smallLabel: {
    marginBottom: 8,

    color: COLORS.text,

    fontSize: 11.5,
    fontWeight: '800',
  },

  unitSection: {
    marginTop: 14,
  },

  /* ============================================================
     TIME
  ============================================================ */

  timeSection: {
    marginTop: 17,
  },

  timeCard: {
    minHeight: 68,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: COLORS.lavenderBorder,

    borderRadius: 19,

    backgroundColor: COLORS.lavenderSoft,

    paddingHorizontal: 11,
    paddingVertical: 9,
  },

  timeCardSelected: {
    borderColor:
      'rgba(99,55,187,0.24)',

    backgroundColor: '#F5F0FA',
  },

  timeCardPressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.992,
      },
    ],
  },

  timeIconBox: {
    width: 43,
    height: 43,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: '#E9E0F6',
  },

  timeCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },

  timeLabel: {
    color: COLORS.secondary,

    fontSize: 9.5,
    fontWeight: '600',
  },

  timeValue: {
    marginTop: 2,

    color: COLORS.primaryDark,

    fontFamily: 'serif',
    fontSize: 18,

    fontWeight: '800',
  },

  timePlaceholder: {
    color: COLORS.secondary,

    fontFamily: undefined,
    fontSize: 11,

    fontWeight: '600',
  },

  timeArrow: {
    width: 30,
    height: 30,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 11,

    backgroundColor: COLORS.white,
  },

  /* ============================================================
     METHOD
  ============================================================ */

  methodHeading: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  methodIcon: {
    width: 37,
    height: 37,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: '#EEE7F8',
  },

  methodCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 9,
  },

  methodTitle: {
    color: COLORS.text,

    fontSize: 12.5,

    fontWeight: '800',
  },

  methodSubtitle: {
    marginTop: 2,

    color: COLORS.secondary,

    fontSize: 9.5,
    lineHeight: 13,
  },

  noteSpacing: {
    marginTop: 15,
  },

  /* ============================================================
     TIP
  ============================================================ */

  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    borderWidth: 1,
    borderColor:
      'rgba(99,55,187,0.10)',

    borderRadius: 20,

    backgroundColor: '#F1EAF9',

    padding: 13,
  },

  tipIcon: {
    width: 38,
    height: 38,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,

    backgroundColor: '#FFFFFF',
  },

  tipCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },

  tipTitle: {
    color: COLORS.primaryDark,

    fontSize: 12.5,

    fontWeight: '800',
  },

  tipText: {
    marginTop: 3,

    color: '#62566F',

    fontSize: 10.5,
    lineHeight: 16,

    fontWeight: '500',
  },

  /* ============================================================
     TIME PICKER MODAL — iOS
  ============================================================ */

  modalRoot: {
    flex: 1,

    justifyContent: 'flex-end',

    backgroundColor: COLORS.overlay,
  },

  timePickerSheet: {
    overflow: 'hidden',

    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,

    backgroundColor: '#FBF9FD',

    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 25,

    shadowColor: '#28183D',

    shadowOffset: {
      width: 0,
      height: -6,
    },

    shadowOpacity: 0.2,
    shadowRadius: 18,

    elevation: 20,
  },

  sheetHandle: {
    alignSelf: 'center',

    width: 45,
    height: 4,

    marginBottom: 15,

    borderRadius: 2,

    backgroundColor: '#D6CDDF',
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sheetHeaderIcon: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,

    backgroundColor: '#EEE6F8',
  },

  sheetHeaderCopy: {
    flex: 1,
    minWidth: 0,

    marginLeft: 10,
  },

  sheetEyebrow: {
    color: COLORS.primary,

    fontSize: 8,
    fontWeight: '900',

    letterSpacing: 1,
  },

  sheetTitle: {
    marginTop: 2,

    color: COLORS.primaryDark,

    fontFamily: 'serif',
    fontSize: 20,

    fontWeight: '800',
  },

  closeButton: {
    width: 36,
    height: 36,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 18,

    backgroundColor: '#F0EAF5',
  },

  closeButtonPressed: {
    opacity: 0.65,
  },

  pickerHighlight: {
    alignSelf: 'center',

    flexDirection: 'row',
    alignItems: 'center',

    gap: 5,

    marginTop: 18,

    borderRadius: 14,

    backgroundColor: '#EEE7F7',

    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  pickerHighlightText: {
    color: COLORS.primary,

    fontSize: 9.5,
    fontWeight: '700',
  },

  pickerContainer: {
    alignItems: 'center',

    marginTop: 3,
  },

  selectedTimePreview: {
    color: COLORS.primaryDark,

    fontFamily: 'serif',
    fontSize: 30,

    fontWeight: '800',

    textAlign: 'center',
  },

  confirmButton: {
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 7,

    marginTop: 17,

    borderRadius: 27,

    backgroundColor: COLORS.primaryDark,

    shadowColor: COLORS.primaryDark,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.2,
    shadowRadius: 9,

    elevation: 5,
  },

  confirmButtonPressed: {
    opacity: 0.88,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  confirmButtonText: {
    color: COLORS.white,

    fontSize: 14.5,
    fontWeight: '800',
  },
});