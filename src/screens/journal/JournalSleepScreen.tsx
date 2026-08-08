import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences} from '../../state/onboardingPreferences';

const PURPLE = '#6634B5';
const DARK = '#271563';

const QUALITIES = [
  {
    label: 'Très mauvaise',
    icon: 'emoticon-sad-outline',
    color: '#EC6868',
  },
  {
    label: 'Mauvaise',
    icon: 'emoticon-frown-outline',
    color: '#F0785D',
  },
  {
    label: 'Moyenne',
    icon: 'emoticon-neutral-outline',
    color: '#E8A626',
  },
  {
    label: 'Bonne',
    icon: 'emoticon-happy-outline',
    color: '#5C34B2',
  },
  {
    label: 'Excellente',
    icon: 'emoticon-excited-outline',
    color: '#9A45C6',
  },
];

const FEELINGS = [
  {
    label: 'Reposée',
    icon: 'emoticon-happy-outline',
  },
  {
    label: 'Moyenne',
    icon: 'emoticon-neutral-outline',
  },
  {
    label: 'Fatiguée',
    icon: 'emoticon-sad-outline',
  },
];

type TimeField = 'bedtime' | 'wakeTime';

const TIME_OPTIONS = Array.from({length: 96}, (_, index) => {
  const totalMinutes = index * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}`;
});

function durationBetween(
  bedtime: string,
  wakeTime: string,
): {label: string; minutes: number} | null {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!pattern.test(bedtime) || !pattern.test(wakeTime)) {
    return null;
  }

  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);

  let minutes = wh * 60 + wm - (bh * 60 + bm);

  if (minutes < 0) {
    minutes += 1440;
  }

  return {
    minutes,
    label: `${Math.floor(minutes / 60)} h ${String(
      minutes % 60,
    ).padStart(2, '0')} min`,
  };
}

export default function JournalSleepScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;

  /*
   * Responsive top spacing.
   *
   * insets.top automatically adapts to:
   * - Android status bar
   * - Samsung punch-hole cameras
   * - Pixel devices
   * - iPhone notch
   * - Dynamic Island
   *
   * SafeAreaView below excludes the "top" edge so that
   * this padding is not applied twice on iOS.
   */
  const headerTopPadding = Math.max(
    insets.top + (isVerySmallScreen ? 4 : isSmallScreen ? 6 : 8),
    16,
  );

  const [bedtime, setBedtime] = useState('22:45');
  const [wakeTime, setWakeTime] = useState('07:15');
  const [quality, setQuality] = useState('Bonne');
  const [awakenings, setAwakenings] = useState(1);
  const [feeling, setFeeling] = useState('Reposée');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const successToastAnimation = useRef(new Animated.Value(0)).current;
  const successToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTimeField, setActiveTimeField] =
    useState<TimeField | null>(null);

  const duration = useMemo(
    () => durationBetween(bedtime, wakeTime),
    [bedtime, wakeTime],
  );

  const cycleDay = useMemo(() => {
    const start = getCyclePreferences().lastPeriodStart;

    return Math.max(
      1,
      Math.floor(
        (Date.now() - start.getTime()) / 86400000,
      ) + 1,
    );
  }, []);

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const openTimePicker = (field: TimeField) => {
    setActiveTimeField(field);
  };

  const closeTimePicker = () => {
    setActiveTimeField(null);
  };

  const selectTime = (value: string) => {
    if (activeTimeField === 'bedtime') {
      setBedtime(value);
    }

    if (activeTimeField === 'wakeTime') {
      setWakeTime(value);
    }

    closeTimePicker();
  };

  const selectedTime =
    activeTimeField === 'bedtime'
      ? bedtime
      : activeTimeField === 'wakeTime'
        ? wakeTime
        : '';

  useEffect(() => {
    return () => {
      if (successToastTimeout.current) {
        clearTimeout(successToastTimeout.current);
      }
    };
  }, []);

  const showSuccessToast = () => {
    if (successToastTimeout.current) {
      clearTimeout(successToastTimeout.current);
    }

    setSuccessVisible(true);
    successToastAnimation.stopAnimation();
    successToastAnimation.setValue(0);

    Animated.spring(successToastAnimation, {
      toValue: 1,
      damping: 17,
      stiffness: 180,
      mass: 0.85,
      useNativeDriver: true,
    }).start();

    successToastTimeout.current = setTimeout(() => {
      Animated.timing(successToastAnimation, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setSuccessVisible(false);

          // JournalSleepScreen est ouvert depuis CycleHome.
          // goBack() retourne correctement vers CycleHome.
          navigation.goBack();
        }
      });
    }, 2500);
  };

  const hideSuccessToast = () => {
    if (successToastTimeout.current) {
      clearTimeout(successToastTimeout.current);
      successToastTimeout.current = null;
    }

    Animated.timing(successToastAnimation, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setSuccessVisible(false);
      }
    });
  };

  const save = async () => {
    if (saving) {
      return;
    }

    if (!duration) {
      Alert.alert(
        'Horaires incorrects',
        'Utilise le format HH:MM, par exemple 22:45.',
      );
      return;
    }

    try {
      setSaving(true);

      await saveJournalSection(
        new Date().toLocaleDateString('en-CA'),
        'sleep',
        {
          bedtime,
          wakeTime,
          duration: duration.label,
          quality,
          awakenings,
          wakeFeeling: feeling,
          note: note.trim(),
        },
      );

      showSuccessToast();
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer ton sommeil pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={styles.safe}>
      <StatusBar
        backgroundColor="#FBF8FD"
        barStyle="dark-content"
        translucent
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.flex}>
        <View
          style={[
            styles.header,

            isSmallScreen && styles.headerSmall,

            isVerySmallScreen &&
              styles.headerVerySmall,

            {
              paddingTop: headerTopPadding,
            },
          ]}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={navigation.goBack}
            style={[
              styles.back,
              isSmallScreen && styles.backSmall,
            ]}>
            <MaterialDesignIcons
              color={DARK}
              name="chevron-left"
              size={isSmallScreen ? 24 : 28}
            />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text
              style={[
                styles.title,
                isSmallScreen && styles.titleSmall,
              ]}>
              Sommeil
            </Text>

            <Text
              numberOfLines={1}
              style={[
                styles.date,
                isSmallScreen && styles.dateSmall,
              ]}>
              {dateLabel} · Jour {cycleDay} du cycle
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Enregistrer"
            accessibilityRole="button"
            disabled={saving}
            onPress={save}
            style={[
              styles.check,
              isSmallScreen && styles.checkSmall,
            ]}>
            <MaterialDesignIcons
              color="#FFFFFF"
              name="check"
              size={isSmallScreen ? 21 : 25}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,

            isSmallScreen &&
              styles.contentSmall,

            isVerySmallScreen &&
              styles.contentVerySmall,

            {
              paddingBottom:
                Math.max(insets.bottom, 14) + 18,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ImageBackground
            imageStyle={styles.heroImage}
            source={require('../../assets/images/sleep-header-woman.png')}
            style={[
              styles.hero,

              isSmallScreen &&
                styles.heroSmall,

              isVerySmallScreen &&
                styles.heroVerySmall,
            ]}>
            <View
              style={[
                styles.heroCopy,
                isSmallScreen &&
                  styles.heroCopySmall,
              ]}>
              <Text
                style={[
                  styles.heroTitle,
                  isSmallScreen &&
                    styles.heroTitleSmall,
                ]}>
                Prends soin de ton repos, ton corps te
                remercie. ♡
              </Text>

              <Text
                style={[
                  styles.heroText,
                  isSmallScreen &&
                    styles.heroTextSmall,
                ]}>
                Un bon sommeil soutient ton énergie,
                ton humeur et ton équilibre hormonal.
              </Text>
            </View>
          </ImageBackground>

          <Card>
            <Heading
              icon="weather-night"
              title="Heures de sommeil"
            />

            <View
              style={[
                styles.times,
                isVerySmallScreen &&
                  styles.timesVerySmall,
              ]}>
              <TimeInput
                icon="weather-night"
                label="Heure du coucher"
                compact={isSmallScreen}
                onOpen={() =>
                  openTimePicker('bedtime')
                }
                value={bedtime}
              />

              <MaterialDesignIcons
                color={DARK}
                name={
                  isVerySmallScreen
                    ? 'arrow-down'
                    : 'arrow-right'
                }
                size={isSmallScreen ? 19 : 23}
                style={[
                  styles.timeArrow,
                  isVerySmallScreen &&
                    styles.timeArrowVerySmall,
                ]}
              />

              <TimeInput
                icon="weather-sunset-up"
                label="Heure du réveil"
                compact={isSmallScreen}
                onOpen={() =>
                  openTimePicker('wakeTime')
                }
                value={wakeTime}
              />
            </View>

            <View style={styles.durationBox}>
              <View style={styles.durationHalf}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="clock-outline"
                  size={25}
                />

                <View>
                  <Text style={styles.smallLabel}>
                    Durée totale
                  </Text>

                  <Text style={styles.durationValue}>
                    {duration?.label ??
                      '-- h -- min'}
                  </Text>
                </View>
              </View>

              <View style={styles.verticalLine} />

              <View style={styles.goal}>
                <Text style={styles.smallLabel}>
                  Objectif recommandé
                </Text>

                <Text style={styles.goalValue}>
                  7 - 9 h ⓘ
                </Text>
              </View>
            </View>
          </Card>

          <Card>
            <Heading
              icon="star-outline"
              title="Qualité du sommeil"
            />

            <View
              style={[
                styles.qualityRow,
                isSmallScreen &&
                  styles.qualityRowSmall,
              ]}>
              {QUALITIES.map(item => {
                const active =
                  quality === item.label;

                return (
                  <Pressable
                    key={item.label}
                    onPress={() =>
                      setQuality(item.label)
                    }
                    style={[
                      styles.quality,

                      isSmallScreen &&
                        styles.qualitySmall,

                      active &&
                        styles.selected,
                    ]}>
                    <MaterialDesignIcons
                      color={item.color}
                      name={item.icon as never}
                      size={
                        isSmallScreen ? 23 : 27
                      }
                    />

                    <Text style={styles.choiceText}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <View
            style={[
              styles.twoColumns,

              isSmallScreen &&
                styles.twoColumnsSmall,
            ]}>
            <Card style={styles.halfCard}>
              <Heading
                icon="alarm"
                title="Réveils nocturnes"
                subtitle="Combien de fois t’es-tu réveillée ?"
              />

              <View style={styles.counterRow}>
                <Pressable
                  accessibilityLabel="Diminuer le nombre de réveils"
                  onPress={() =>
                    setAwakenings(value =>
                      Math.max(0, value - 1),
                    )
                  }
                  style={styles.roundButton}>
                  <Text style={styles.sign}>−</Text>
                </Pressable>

                <View style={styles.counterCopy}>
                  <Text style={styles.count}>
                    {awakenings}
                  </Text>

                  <Text style={styles.countLabel}>
                    fois cette nuit
                  </Text>
                </View>

                <Pressable
                  accessibilityLabel="Augmenter le nombre de réveils"
                  onPress={() =>
                    setAwakenings(value =>
                      Math.min(20, value + 1),
                    )
                  }
                  style={styles.roundButton}>
                  <Text style={styles.sign}>+</Text>
                </Pressable>
              </View>

              <View style={styles.tip}>
                <MaterialDesignIcons
                  color="#9F72D2"
                  name="weather-night"
                  size={21}
                />

                <Text style={styles.tipText}>
                  C’est normal d’avoir quelques
                  réveils.{'\n'}
                  Ton corps se régule progressivement.
                </Text>
              </View>
            </Card>

            <Card style={styles.halfCard}>
              <Heading
                icon="weather-sunset-up"
                title="Sensation au réveil"
                subtitle="Comment te sens-tu au réveil ?"
              />

              <View style={styles.feelingRow}>
                {FEELINGS.map(item => {
                  const active =
                    feeling === item.label;

                  return (
                    <Pressable
                      key={item.label}
                      onPress={() =>
                        setFeeling(item.label)
                      }
                      style={[
                        styles.feeling,
                        active &&
                          styles.selected,
                      ]}>
                      <MaterialDesignIcons
                        color={
                          active
                            ? PURPLE
                            : '#8969AF'
                        }
                        name={item.icon as never}
                        size={27}
                      />

                      <Text
                        style={styles.choiceText}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.tip}>
                <MaterialDesignIcons
                  color="#A46FD3"
                  name="heart"
                  size={22}
                />

                <Text style={styles.tipText}>
                  Écoute ton corps et accorde-toi
                  {'\n'}
                  du repos si tu en ressens le
                  besoin.
                </Text>
              </View>
            </Card>
          </View>

          <Card>
            <Heading
              icon="pencil-outline"
              title="Commentaire"
              subtitle="Ajoute un commentaire si tu le souhaites."
              optional
            />

            <View style={styles.noteBox}>
              <TextInput
                maxLength={300}
                multiline
                onChangeText={setNote}
                placeholder="Écris ici ce que tu souhaites noter..."
                placeholderTextColor="#7E7489"
                style={styles.note}
                textAlignVertical="top"
                value={note}
              />

              <Text style={styles.noteCount}>
                {note.length} / 300
              </Text>

              <MaterialDesignIcons
                color="#B79AD3"
                name="sprout"
                size={37}
                style={styles.leaf}
              />
            </View>
          </Card>

          <Pressable
            disabled={saving}
            onPress={save}
            style={[
              styles.save,
              saving && styles.disabled,
            ]}>
            <MaterialDesignIcons
              color="#FFFFFF"
              name="content-save"
              size={20}
            />

            <Text style={styles.saveText}>
              {saving
                ? 'Enregistrement…'
                : 'Enregistrer'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {successVisible ? (
        <Animated.View
          style={[
            styles.toast,
            {
              bottom: Math.max(insets.bottom, 18) + 12,
              opacity: successToastAnimation,
              transform: [
                {
                  translateY: successToastAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
                {
                  scale: successToastAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.toastIcon}>
            <MaterialDesignIcons
              color="#FFFFFF"
              name="check"
              size={14}
            />
          </View>

          <Text style={styles.toastText}>
            Sommeil enregistré avec succès ✨
          </Text>

          <Pressable
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            hitSlop={10}
            onPress={hideSuccessToast}
            style={({pressed}) => [
              styles.toastCloseButton,
              pressed && styles.toastCloseButtonPressed,
            ]}>
            <MaterialDesignIcons
              color="#8E83A4"
              name="close"
              size={17}
            />
          </Pressable>
        </Animated.View>
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={closeTimePicker}
        transparent
        visible={activeTimeField !== null}>
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityLabel="Fermer la liste des heures"
            onPress={closeTimePicker}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.timeSheet,
              isSmallScreen &&
                styles.timeSheetSmall,
            ]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name={
                    activeTimeField === 'bedtime'
                      ? 'weather-night'
                      : 'weather-sunset-up'
                  }
                  size={22}
                />
              </View>

              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetTitle}>
                  {activeTimeField === 'bedtime'
                    ? 'Heure du coucher'
                    : 'Heure du réveil'}
                </Text>

                <Text style={styles.sheetSubtitle}>
                  Sélectionne une heure
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Fermer"
                hitSlop={8}
                onPress={closeTimePicker}
                style={styles.sheetClose}>
                <MaterialDesignIcons
                  color={DARK}
                  name="close"
                  size={21}
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.timeOptions,
                {
                  paddingBottom:
                    Math.max(
                      insets.bottom,
                      16,
                    ) + 20,
                },
              ]}
              nestedScrollEnabled
              showsVerticalScrollIndicator={
                false
              }>
              {TIME_OPTIONS.map(option => {
                const active =
                  selectedTime === option;

                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: active,
                    }}
                    key={option}
                    onPress={() =>
                      selectTime(option)
                    }
                    style={({pressed}) => [
                      styles.timeOption,

                      isSmallScreen &&
                        styles.timeOptionSmall,

                      active &&
                        styles.timeOptionActive,

                      pressed &&
                        styles.timeOptionPressed,
                    ]}>
                    <Text
                      style={[
                        styles.timeOptionText,

                        active &&
                          styles.timeOptionTextActive,
                      ]}>
                      {option}
                    </Text>

                    {active ? (
                      <View
                        style={
                          styles.timeOptionCheck
                        }>
                        <MaterialDesignIcons
                          color="#FFFFFF"
                          name="check"
                          size={15}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}): React.JSX.Element {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

function Heading({
  icon,
  title,
  subtitle,
  optional,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  optional?: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.heading}>
      <View style={styles.headingIcon}>
        <MaterialDesignIcons
          color={DARK}
          name={icon as never}
          size={20}
        />
      </View>

      <View style={styles.headingCopy}>
        <Text style={styles.headingTitle}>
          {title}

          {optional ? (
            <Text style={styles.optional}>
              {' '}
              (optionnel)
            </Text>
          ) : null}
        </Text>

        {subtitle ? (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TimeInput({
  icon,
  label,
  value,
  compact,
  onOpen,
}: {
  icon: string;
  label: string;
  value: string;
  compact?: boolean;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.timeColumn,
        compact &&
          styles.timeColumnCompact,
      ]}>
      <Text
        style={[
          styles.timeLabel,
          compact &&
            styles.timeLabelCompact,
        ]}>
        {label}
      </Text>

      <Pressable
        accessibilityLabel={`${label}, ${value}`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({pressed}) => [
          styles.timeBox,

          compact &&
            styles.timeBoxCompact,

          pressed &&
            styles.timeBoxPressed,
        ]}>
        <MaterialDesignIcons
          color={PURPLE}
          name={icon as never}
          size={compact ? 21 : 25}
        />

        <Text
          style={[
            styles.timeText,
            compact &&
              styles.timeTextCompact,
          ]}>
          {value}
        </Text>

        <MaterialDesignIcons
          color={DARK}
          name="chevron-down"
          size={21}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FBF8FD',
  },

  flex: {
    flex: 1,
  },

  /*
   * No fixed paddingTop here.
   * paddingTop is calculated with insets.top
   * directly in the component.
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 8,
    minHeight: 64,
  },

  back: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6DDEE',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: PURPLE,
    fontSize: 27,
    fontWeight: '800',
  },

  date: {
    marginTop: 1,
    color: '#544779',
    fontSize: 11,
  },

  check: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: PURPLE,
  },

  content: {
    paddingHorizontal: 13,
    paddingTop: 8,
    gap: 8,
    paddingBottom: 24,
  },

  hero: {
    height: 150,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#E9D8F5',
  },

  heroImage: {
    borderRadius: 18,
    resizeMode: 'cover',
  },

  heroCopy: {
    width: '43%',
    paddingLeft: 18,
  },

  heroTitle: {
    color: DARK,
    fontSize: 17.5,
    lineHeight: 23,
    fontWeight: '800',
  },

  heroText: {
    marginTop: 12,
    color: '#30205E',
    fontSize: 9.8,
    lineHeight: 15,
  },

  card: {
    padding: 11,
    borderWidth: 1,
    borderColor: '#EAE2EF',
    borderRadius: 19,
    backgroundColor: '#FFFDFF',
    elevation: 1,
  },

  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  headingIcon: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F2E8F8',
  },

  headingCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },

  headingTitle: {
    color: DARK,
    fontSize: 13.5,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 2,
    color: '#5C5272',
    fontSize: 8.5,
  },

  optional: {
    fontSize: 9,
    fontWeight: '500',
  },

  times: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  timeColumn: {
    flex: 1,
  },

  timeLabel: {
    marginBottom: 5,
    color: '#33265F',
    fontSize: 9.5,
    textAlign: 'center',
  },

  timeBox: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DCCCE8',
    borderRadius: 12,
    backgroundColor: '#FCF9FD',
  },

  timeText: {
    flex: 1,
    paddingVertical: 0,
    color: DARK,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },

  timeArrow: {
    marginHorizontal: 10,
    marginBottom: 12,
  },

  durationBox: {
    height: 61,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DCCBE7',
    borderRadius: 12,
    backgroundColor: '#F3E8F8',
  },

  durationHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  smallLabel: {
    color: '#3E3261',
    fontSize: 9,
  },

  durationValue: {
    marginTop: 2,
    color: DARK,
    fontSize: 17,
    fontWeight: '800',
  },

  verticalLine: {
    width: 1,
    height: 39,
    backgroundColor: '#D6C4E3',
  },

  goal: {
    flex: 1,
    alignItems: 'center',
  },

  goalValue: {
    marginTop: 5,
    color: DARK,
    fontSize: 13,
    fontWeight: '800',
  },

  qualityRow: {
    flexDirection: 'row',
    gap: 7,
  },

  quality: {
    flex: 1,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E7DFEC',
    borderRadius: 12,
    backgroundColor: '#FFFCFF',
  },

  selected: {
    borderWidth: 1.5,
    borderColor: '#8449D2',
    backgroundColor: '#F8F1FC',
  },

  choiceText: {
    marginTop: 5,
    color: DARK,
    fontSize: 7.8,
    fontWeight: '600',
    textAlign: 'center',
  },

  twoColumns: {
    flexDirection: 'row',
    gap: 7,
  },

  halfCard: {
    flex: 1,
    minWidth: 0,
  },

  counterRow: {
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },

  roundButton: {
    width: 37,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFD4E8',
    borderRadius: 19,
  },

  sign: {
    color: DARK,
    fontSize: 20,
  },

  counterCopy: {
    alignItems: 'center',
  },

  count: {
    color: DARK,
    fontSize: 22,
    fontWeight: '800',
  },

  countLabel: {
    marginTop: 4,
    color: '#493A6C',
    fontSize: 8,
  },

  tip: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#F3E8F8',
  },

  tipText: {
    flex: 1,
    color: '#4E3D71',
    fontSize: 7.5,
    lineHeight: 11,
  },

  feelingRow: {
    flexDirection: 'row',
    gap: 5,
  },

  feeling: {
    flex: 1,
    height: 69,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5DCEB',
    borderRadius: 11,
  },

  noteBox: {
    height: 91,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2D6E8',
    borderRadius: 12,
    backgroundColor: '#FCF8FD',
  },

  note: {
    height: 70,
    paddingHorizontal: 11,
    paddingTop: 9,
    color: '#392E49',
    fontSize: 10.5,
  },

  noteCount: {
    position: 'absolute',
    right: 10,
    bottom: 7,
    color: '#665B75',
    fontSize: 8,
  },

  leaf: {
    position: 'absolute',
    right: -3,
    bottom: -4,
    opacity: 0.7,
  },

  save: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 18,
    backgroundColor: PURPLE,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  timeBoxPressed: {
    opacity: 0.78,
    backgroundColor: '#F4ECF9',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(28,17,56,0.42)',
  },

  timeSheet: {
    height: '88%',
    overflow: 'hidden',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFDFF',
    paddingTop: 9,
    paddingHorizontal: 14,
    paddingBottom: 18,
  },

  sheetHandle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    borderRadius: 3,
    backgroundColor: '#D8CBE3',
  },

  sheetHeader: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE6F2',
  },

  sheetHeaderIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F2E8F8',
  },

  sheetHeaderCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  sheetTitle: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
  },

  sheetSubtitle: {
    marginTop: 2,
    color: '#6C607A',
    fontSize: 10.5,
  },

  sheetClose: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DDED',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },

  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 12,
  },

  timeOption: {
    width: '23.5%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E7DDEB',
    borderRadius: 14,
    backgroundColor: '#FCF9FD',
  },

  timeOptionActive: {
    borderColor: PURPLE,
    backgroundColor: '#F1E6F8',
  },

  timeOptionPressed: {
    opacity: 0.72,
    transform: [{scale: 0.98}],
  },

  timeOptionText: {
    color: '#3C3150',
    fontSize: 13,
    fontWeight: '700',
  },

  timeOptionTextActive: {
    color: DARK,
    fontWeight: '800',
  },

  timeOptionCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: PURPLE,
  },

  headerSmall: {
    paddingHorizontal: 10,
    paddingBottom: 7,
    minHeight: 58,
  },

  headerVerySmall: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    minHeight: 54,
  },

  backSmall: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },

  checkSmall: {
    width: 40,
    height: 40,
    borderRadius: 14,
  },

  titleSmall: {
    fontSize: 22,
  },

  dateSmall: {
    maxWidth: 210,
    fontSize: 9.5,
  },

  contentSmall: {
    paddingHorizontal: 10,
    paddingTop: 7,
    gap: 7,
  },

  contentVerySmall: {
    paddingHorizontal: 8,
    paddingTop: 6,
    gap: 6,
  },

  heroSmall: {
    height: 128,
    borderRadius: 16,
  },

  heroVerySmall: {
    height: 112,
  },

  heroCopySmall: {
    width: '48%',
    paddingLeft: 13,
  },

  heroTitleSmall: {
    fontSize: 14.5,
    lineHeight: 19,
  },

  heroTextSmall: {
    marginTop: 8,
    fontSize: 8.6,
    lineHeight: 12,
  },

  timesVerySmall: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  timeArrowVerySmall: {
    alignSelf: 'center',
    marginHorizontal: 0,
    marginVertical: 5,
    marginBottom: 5,
  },

  timeColumnCompact: {
    minWidth: 0,
  },

  timeLabelCompact: {
    marginBottom: 4,
    fontSize: 8.6,
  },

  timeBoxCompact: {
    height: 42,
    paddingHorizontal: 8,
  },

  timeTextCompact: {
    fontSize: 16,
  },

  qualityRowSmall: {
    gap: 5,
  },

  qualitySmall: {
    height: 64,
    borderRadius: 10,
  },

  twoColumnsSmall: {
    flexDirection: 'column',
    gap: 6,
  },

  timeSheetSmall: {
    height: '82%',
    paddingHorizontal: 10,
  },

  timeOptionSmall: {
    width: '31.5%',
    height: 44,
    marginBottom: 7,
  },

  toast: {
    position: 'absolute',
    left: '7%',
    right: '7%',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: '#E3D8F2',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#4F2A9C',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.17,
    shadowRadius: 13,
    elevation: 7,
  },

  toastIcon: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: PURPLE,
  },

  toastText: {
    flex: 1,
    minWidth: 0,
    color: '#2F2258',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
  },

  toastCloseButton: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },

  toastCloseButtonPressed: {
    backgroundColor: '#F3EEF8',
    opacity: 0.8,
  },

  disabled: {
    opacity: 0.55,
  },
});