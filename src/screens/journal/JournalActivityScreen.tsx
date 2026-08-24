import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
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
import {useNavigation, type NavigationProp} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {getCyclePreferences} from '../../state/onboardingPreferences';
import {
  TOP_SPACING_EXTRA,
  TOP_SPACING_EXTRA_COMPACT,
} from '../../theme/spacing';

const PURPLE = '#5B3BA4';
const PURPLE_DARK = '#30205E';
const PURPLE_LIGHT = '#F4EFFA';
const BORDER = '#ECE7EE';
const TEXT_MUTED = '#87818C';

const ACTIVITIES: Array<{
  label: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
}> = [
  {
    label: 'Marche',
    icon: 'walk',
  },
  {
    label: 'Course',
    icon: 'run',
  },
  {
    label: 'Yoga',
    icon: 'meditation',
  },
  {
    label: 'Musculation',
    icon: 'dumbbell',
  },
  {
    label: 'Natation',
    icon: 'swim',
  },
  {
    label: 'Vélo',
    icon: 'bike',
  },
  {
    label: 'Étirements',
    icon: 'human-handsup',
  },
  {
    label: 'Pilates',
    icon: 'human',
  },
  {
    label: 'Danse',
    icon: 'dance-ballroom',
  },
  {
    label: 'Autre',
    icon: 'dots-horizontal-circle-outline',
  },
];

const FEELINGS = [
  {
    label: 'Très fatiguée',
    emoji: '🥵',
  },
  {
    label: 'Fatiguée',
    emoji: '😓',
  },
  {
    label: 'Neutre',
    emoji: '😐',
  },
  {
    label: 'Bien',
    emoji: '🙂',
  },
  {
    label: 'Très bien',
    emoji: '🤩',
  },
];

const INTENSITIES: Array<{
  label: string;
  icon: React.ComponentProps<typeof MaterialDesignIcons>['name'];
  description: string;
}> = [
  {
    label: 'Légère',
    icon: 'heart-outline',
    description: 'Effort doux',
  },
  {
    label: 'Modérée',
    icon: 'lightning-bolt',
    description: 'Effort moyen',
  },
  {
    label: 'Élevée',
    icon: 'fire',
    description: 'Effort intense',
  },
];
export default function JournalActivityScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();

  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();

  const isSmallScreen = width < 370 || height < 720;
  const isVerySmallScreen = width < 340 || height < 640;

  const [activity, setActivity] = useState('Marche');
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('Élevée');
  const [feeling, setFeeling] = useState('Très bien');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const successToastAnimation =
    useRef(new Animated.Value(0)).current;

  const successToastTimeout =
    useRef<ReturnType<typeof setTimeout> | null>(null);

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
    month: 'short',
  }).format(new Date());

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

    try {
      setSaving(true);

      await saveJournalSection(
        new Date().toLocaleDateString('en-CA'),
        'activity',
        {
          none: false,
          type: activity,
          durationMinutes: duration,
          intensity,
          feeling,
          note: note.trim(),
        },
      );

      showSuccessToast();
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer ton activité pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeDuration = (step: number) => {
    setDuration(value =>
      Math.min(
        120,
        Math.max(10, value + step),
      ),
    );
  };

  const durationPercent = Math.max(
    0,
    Math.min(100, (duration / 120) * 100),
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safe}>

      <StatusBar
        backgroundColor="#FBF8FD"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : 'height'
        }
        keyboardVerticalOffset={insets.top}
        style={styles.flex}>

        {/* HEADER */}
        <View
          style={[
            styles.header,
            isSmallScreen && styles.headerSmall,
            isVerySmallScreen &&
              styles.headerVerySmall,
          ]}>

          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({pressed}) => [
              styles.headerButton,
              isSmallScreen &&
                styles.headerButtonSmall,
              pressed && styles.pressed,
            ]}>

            <MaterialDesignIcons
              color={PURPLE}
              name="chevron-left"
              size={isSmallScreen ? 22 : 25}
            />

          </Pressable>

          <View style={styles.headerCopy}>

            <Text
              numberOfLines={1}
              style={[
                styles.title,
                isSmallScreen && styles.titleSmall,
              ]}>
              Activité physique
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
            hitSlop={10}
            onPress={save}
            style={({pressed}) => [
              styles.headerButton,
              styles.headerSave,
              isSmallScreen &&
                styles.headerButtonSmall,
              pressed && styles.pressed,
            ]}>

            <MaterialDesignIcons
              color="#FFFFFF"
              name="check"
              size={isSmallScreen ? 18 : 20}
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
                Math.max(insets.bottom, 16) + 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* HERO — IMAGE CONSERVÉE */}
          <ImageBackground
            imageStyle={styles.heroImage}
            source={require('../../assets/images/activity-header-woman.png')}
            style={styles.hero}>

            <View style={styles.heroCopy}>

              <Text style={styles.heroTitle}>
                Bouge pour ton bien-être ✦
              </Text>

              <Text style={styles.heroText}>
                L’activité physique aide à réduire
                le stress, améliorer l’humeur et
                soulager les symptômes.
              </Text>

            </View>

          </ImageBackground>

          {/* TYPE D'ACTIVITÉ */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="run"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  Type d’activité
                </Text>

                <Text style={styles.hint}>
                  Sélectionne l’activité que tu as pratiquée
                </Text>
              </View>

            </View>

            <View style={styles.activityGrid}>

              {ACTIVITIES.map(item => {
                const active =
                  activity === item.label;

                return (
                  <Pressable
                    accessibilityLabel={item.label}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    key={item.label}
                    onPress={() =>
                      setActivity(item.label)
                    }
                    style={({pressed}) => [
                      styles.activity,
                      active &&
                        styles.activitySelected,
                      pressed &&
                        styles.activityPressed,
                    ]}>

                    <View
                      style={[
                        styles.activityIcon,
                        active &&
                          styles.activityIconSelected,
                      ]}>

                      <MaterialDesignIcons
                        color={
                          active
                            ? '#FFFFFF'
                            : PURPLE
                        }
                        name={item.icon}
                        size={22}
                      />

                    </View>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.activityLabel,
                        active &&
                          styles.activityLabelSelected,
                      ]}>
                      {item.label}
                    </Text>

                    {active ? (
                      <View style={styles.activityCheck}>
                        <MaterialDesignIcons
                          color="#FFFFFF"
                          name="check"
                          size={9}
                        />
                      </View>
                    ) : null}

                  </Pressable>
                );
              })}

            </View>

          </View>

          {/* DURÉE */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="clock-outline"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  Durée
                </Text>

                <Text style={styles.hint}>
                  Combien de temps as-tu bougé ?
                </Text>
              </View>

            </View>

            <View style={styles.durationPremiumBox}>

              <Pressable
                accessibilityLabel="Réduire la durée"
                accessibilityRole="button"
                onPress={() => changeDuration(-10)}
                style={({pressed}) => [
                  styles.durationButton,
                  pressed &&
                    styles.durationButtonPressed,
                ]}>

                <MaterialDesignIcons
                  color={PURPLE}
                  name="minus"
                  size={20}
                />

              </Pressable>

              <View style={styles.durationCenter}>

                <Text style={styles.durationValue}>
                  {duration}
                </Text>

                <Text style={styles.durationUnit}>
                  minutes
                </Text>

              </View>

              <Pressable
                accessibilityLabel="Augmenter la durée"
                accessibilityRole="button"
                onPress={() => changeDuration(10)}
                style={({pressed}) => [
                  styles.durationButton,
                  pressed &&
                    styles.durationButtonPressed,
                ]}>

                <MaterialDesignIcons
                  color={PURPLE}
                  name="plus"
                  size={20}
                />

              </Pressable>

            </View>

            <View style={styles.durationTrack}>

              <View
                style={[
                  styles.durationFill,
                  {
                    width: `${durationPercent}%`,
                  },
                ]}
              />

              <View
                pointerEvents="none"
                style={[
                  styles.durationThumb,
                  {
                    left: `${durationPercent}%`,
                  },
                ]}
              />

            </View>

            <View style={styles.scaleLabels}>

              {[10, 30, 60, 90, 120].map(
                value => {
                  const active =
                    duration === value;

                  return (
                    <Pressable
                      key={value}
                      onPress={() =>
                        setDuration(value)
                      }
                      style={[
                        styles.scaleButton,
                        active &&
                          styles.scaleButtonSelected,
                      ]}>

                      <Text
                        style={[
                          styles.scaleText,
                          active &&
                            styles.scaleTextSelected,
                        ]}>
                        {value}
                      </Text>

                    </Pressable>
                  );
                },
              )}

            </View>

          </View>

          {/* INTENSITÉ */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="pulse"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  Intensité
                </Text>

                <Text style={styles.hint}>
                  Quel était ton niveau d’effort ?
                </Text>
              </View>

            </View>

            <View style={styles.intensityRow}>

              {INTENSITIES.map(item => {
                const active =
                  intensity === item.label;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: active,
                    }}
                    key={item.label}
                    onPress={() =>
                      setIntensity(item.label)
                    }
                    style={({pressed}) => [
                      styles.intensity,
                      active &&
                        styles.intensitySelected,
                      pressed &&
                        styles.intensityPressed,
                    ]}>

                    <View
                      style={[
                        styles.intensityIcon,
                        active &&
                          styles.intensityIconSelected,
                      ]}>

                      <MaterialDesignIcons
                        color={
                          active
                            ? '#FFFFFF'
                            : PURPLE
                        }
                        name={item.icon}
                        size={21}
                      />

                    </View>

                    <Text
                      style={[
                        styles.intensityText,
                        active &&
                          styles.intensityTextSelected,
                      ]}>
                      {item.label}
                    </Text>

                    <Text
                      style={[
                        styles.intensityDescription,
                        active &&
                          styles.intensityDescriptionSelected,
                      ]}>
                      {item.description}
                    </Text>

                    {active ? (
                      <View
                        style={
                          styles.intensityCheck
                        }>
                        <MaterialDesignIcons
                          color="#FFFFFF"
                          name="check"
                          size={9}
                        />
                      </View>
                    ) : null}

                  </Pressable>
                );
              })}

            </View>

          </View>

          {/* RESSENTI */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="emoticon-happy-outline"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.sectionTitle}>
                  Comment te sens-tu après ton activité ?
                </Text>
              </View>

            </View>

            <View style={styles.feelings}>

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
                        styles.feelingSelected,
                    ]}>

                    <Text style={styles.emoji}>
                      {item.emoji}
                    </Text>

                    <Text
                      style={[
                        styles.feelingText,
                        active &&
                          styles.feelingTextSelected,
                      ]}>
                      {item.label}
                    </Text>

                  </Pressable>
                );
              })}

            </View>

          </View>

          {/* COMMENTAIRE */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>

              <View style={styles.sectionHeaderIcon}>
                <MaterialDesignIcons
                  color={PURPLE}
                  name="pencil-outline"
                  size={18}
                />
              </View>

              <View style={styles.sectionHeaderCopy}>

                <Text style={styles.sectionTitle}>
                  Commentaire{' '}
                  <Text style={styles.optional}>
                    (optionnel)
                  </Text>
                </Text>

                <Text style={styles.hint}>
                  Ajoute un commentaire si tu le souhaites.
                </Text>

              </View>

            </View>

            <View style={styles.noteBox}>

              <TextInput
                maxLength={200}
                multiline
                onChangeText={setNote}
                placeholder="Écris ici..."
                placeholderTextColor="#9A96A2"
                style={styles.note}
                textAlignVertical="top"
                value={note}
              />

              <View style={styles.noteFooter}>

                <Text style={styles.counter}>
                  {note.length} / 200
                </Text>

                <MaterialDesignIcons
                  color={PURPLE}
                  name="paperclip"
                  size={18}
                />

                <MaterialDesignIcons
                  color={PURPLE}
                  name="camera-outline"
                  size={19}
                />

              </View>

            </View>

          </View>

          <View style={styles.kindness}>

            <View style={styles.kindnessIcon}>
              <MaterialDesignIcons
                color={PURPLE}
                name="heart-outline"
                size={17}
              />
            </View>

            <Text style={styles.kindnessText}>
              Chaque pas compte. Félicite-toi pour avoir
              pris soin de toi aujourd’hui ! 💜
            </Text>

          </View>

          <Pressable
            accessibilityLabel="Enregistrer l'activité"
            accessibilityRole="button"
            disabled={saving}
            onPress={save}
            style={({pressed}) => [
              styles.save,
              pressed && styles.pressed,
              saving && styles.saveDisabled,
            ]}>

            <MaterialDesignIcons
              color="#FFFFFF"
              name={
                saving
                  ? 'loading'
                  : 'content-save'
              }
              size={18}
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
              bottom:
                Math.max(insets.bottom, 18) + 12,
              opacity: successToastAnimation,
              transform: [
                {
                  translateY:
                    successToastAnimation.interpolate(
                      {
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      },
                    ),
                },
                {
                  scale:
                    successToastAnimation.interpolate(
                      {
                        inputRange: [0, 1],
                        outputRange: [0.97, 1],
                      },
                    ),
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
            Activité enregistrée avec succès ✨
          </Text>

          <Pressable
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            hitSlop={10}
            onPress={hideSuccessToast}
            style={({pressed}) => [
              styles.toastCloseButton,
              pressed &&
                styles.toastCloseButtonPressed,
            ]}>

            <MaterialDesignIcons
              color="#8E83A4"
              name="close"
              size={17}
            />

          </Pressable>

        </Animated.View>
      ) : null}

    </SafeAreaView>
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

  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: TOP_SPACING_EXTRA,
    paddingBottom: 8,
    paddingHorizontal: 14,
  },

  headerSmall: {
    minHeight: 62,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 7,
    paddingHorizontal: 10,
  },

  headerVerySmall: {
    minHeight: 58,
    paddingTop: TOP_SPACING_EXTRA_COMPACT,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },

  headerButton: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F3',
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
  },

  headerButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 13,
  },

  headerSave: {
    borderColor: PURPLE,
    backgroundColor: PURPLE,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  title: {
    color: PURPLE_DARK,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },

  titleSmall: {
    fontSize: 19,
  },

  date: {
    maxWidth: '100%',
    marginTop: 2,
    color: '#77727D',
    fontSize: 11,
    textAlign: 'center',
  },

  dateSmall: {
    fontSize: 9.5,
  },

  content: {
    paddingTop: 8,
    paddingHorizontal: 13,
    gap: 9,
  },

  contentSmall: {
    paddingTop: 6,
    paddingHorizontal: 10,
    gap: 8,
  },

  contentVerySmall: {
    paddingTop: 5,
    paddingHorizontal: 8,
    gap: 7,
  },

  /* HERO IMAGE */
  hero: {
    height: 112,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#F3EAF9',
  },

  heroImage: {
    borderRadius: 20,
    resizeMode: 'cover',
  },

  heroCopy: {
    width: '58%',
    paddingLeft: 15,
    paddingTop: 6,
  },

  heroTitle: {
    color: '#32205F',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },

  heroText: {
    marginTop: 6,
    color: '#4E4860',
    fontSize: 10,
    lineHeight: 15,
  },

  /* CARDS */
  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    backgroundColor: '#FFFDFF',
    padding: 12,
    shadowColor: '#40256F',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.035,
    shadowRadius: 7,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionHeaderIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 11,
    backgroundColor: PURPLE_LIGHT,
  },

  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    color: '#33245C',
    fontSize: 14,
    fontWeight: '700',
  },

  hint: {
    marginTop: 2,
    color: TEXT_MUTED,
    fontSize: 9.5,
  },

  /* ACTIVITÉS */
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },

  activity: {
    position: 'relative',
    width: '18.5%',
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE9EF',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 3,
    paddingVertical: 7,
  },

  activitySelected: {
    borderWidth: 1.5,
    borderColor: '#7957C1',
    backgroundColor: '#F7F2FD',
  },

  activityPressed: {
    opacity: 0.82,
    transform: [{scale: 0.97}],
  },

  activityIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderRadius: 13,
    backgroundColor: '#F3EEF9',
  },

  activityIconSelected: {
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },

  activityLabel: {
    maxWidth: '100%',
    color: '#494250',
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  activityLabelSelected: {
    color: PURPLE,
    fontWeight: '700',
  },

  activityCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: PURPLE,
  },

  /* DURÉE */
  durationPremiumBox: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE4EF',
    borderRadius: 17,
    backgroundColor: '#FBF9FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  durationButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4DDEC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#4A2D75',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  durationButtonPressed: {
    opacity: 0.75,
    transform: [{scale: 0.95}],
  },

  durationCenter: {
    minWidth: 110,
    alignItems: 'center',
    marginHorizontal: 17,
  },

  durationValue: {
    color: PURPLE_DARK,
    fontSize: 29,
    lineHeight: 31,
    fontWeight: '800',
  },

  durationUnit: {
    marginTop: 2,
    color: '#81798A',
    fontSize: 9.5,
    fontWeight: '500',
  },

  durationTrack: {
    position: 'relative',
    height: 6,
    marginTop: 16,
    borderRadius: 5,
    backgroundColor: '#E6E0EB',
  },

  durationFill: {
    height: 6,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },

  durationThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    marginLeft: -8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },

  scaleButton: {
    minWidth: 30,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },

  scaleButtonSelected: {
    backgroundColor: PURPLE_LIGHT,
  },

  scaleText: {
    color: '#8C8591',
    fontSize: 9,
  },

  scaleTextSelected: {
    color: PURPLE,
    fontWeight: '800',
  },

  /* INTENSITÉ */
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
  },

  intensity: {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EBE5EE',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 10,
  },

  intensitySelected: {
    borderWidth: 1.5,
    borderColor: '#7957C1',
    backgroundColor: '#F7F2FD',
  },

  intensityPressed: {
    opacity: 0.8,
    transform: [{scale: 0.97}],
  },

  intensityIcon: {
    width: 37,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
    borderRadius: 13,
    backgroundColor: '#F3EEF9',
  },

  intensityIconSelected: {
    backgroundColor: PURPLE,
  },

  intensityText: {
    color: '#453E4B',
    fontSize: 10,
    fontWeight: '700',
  },

  intensityTextSelected: {
    color: PURPLE_DARK,
  },

  intensityDescription: {
    marginTop: 3,
    color: '#99929D',
    fontSize: 7.5,
    textAlign: 'center',
  },

  intensityDescriptionSelected: {
    color: '#76658F',
  },

  intensityCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: PURPLE,
  },

  /* FEELINGS */
  feelings: {
    flexDirection: 'row',
    gap: 7,
  },

  feeling: {
    flex: 1,
    minWidth: 0,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE8F1',
    borderRadius: 12,
  },

  feelingSelected: {
    borderColor: '#7957C1',
    backgroundColor: '#F5F0FC',
  },

  emoji: {
    fontSize: 20,
  },

  feelingText: {
    marginTop: 3,
    color: '#4A4450',
    fontSize: 8.5,
    textAlign: 'center',
  },

  feelingTextSelected: {
    color: PURPLE,
    fontWeight: '700',
  },

  /* NOTE */
  optional: {
    fontSize: 10,
    fontWeight: '400',
  },

  noteBox: {
    minHeight: 78,
    borderWidth: 1,
    borderColor: '#E9E3EC',
    borderRadius: 13,
    backgroundColor: '#FCFAFD',
  },

  note: {
    minHeight: 48,
    paddingHorizontal: 10,
    paddingTop: 9,
    color: '#3F3847',
    fontSize: 11.5,
  },

  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingBottom: 7,
  },

  counter: {
    marginRight: 'auto',
    color: '#8E8991',
    fontSize: 9,
  },

  /* MESSAGE */
  kindness: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9E1F1',
    borderRadius: 13,
    backgroundColor: '#F5F1F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  kindnessIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  kindnessText: {
    flex: 1,
    marginLeft: 8,
    color: '#635777',
    fontSize: 10,
    lineHeight: 14,
  },

  /* SAVE */
  save: {
    width: '88%',
    maxWidth: 360,
    height: 47,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: PURPLE,
    shadowColor: '#442481',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.17,
    shadowRadius: 7,
    elevation: 4,
  },

  saveText: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  saveDisabled: {
    opacity: 0.55,
  },

  /* TOAST */
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

  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.98}],
  },
});
