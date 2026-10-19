import {useToday} from '../../hooks/useToday';
import {useDaughterJournal} from '../../hooks/useDaughterJournal';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, useWindowDimensions, type ImageSourcePropType} from 'react-native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {deleteJournalSection, getJournalEntry, saveJournalSection} from '../../state/dailyJournalStore';
import {presentSaveFailure} from '../../services/saveFailure';
import {ClearEntryButton} from '../../components/journal/ClearEntryButton';
import {AwaButton} from '../../components/ui/AwaButton';
import {AwaCard} from '../../components/ui/AwaCard';
import {AwaIconButton} from '../../components/ui/AwaIconButton';
import {AwaText} from '../../components/ui/AwaText';
import type {SymptomSeverity} from '../../types/journal';
import {useAwaTheme} from '../../theme/AwaThemeProvider';
import {JOURNAL_HERO_INK} from '../../components/journal/journalHeroInk';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../../theme/awaThemeTokens';
import {deriveAwaRoles} from '../../theme/semanticRoles';
import {journalOptionLabel} from '../../utils/journalOptionLabels';
import '../../i18n';

type SymptomOption = {
  label: string;
  icon: string;
  image?: ImageSourcePropType;
};

type IntensityOption = {
  labelKey: string;
  descriptionKey: string;
  icon: string;
  level: number;
  value: SymptomSeverity;
};

// SYMPTOMS[].label and LOCATIONS[] are DATA, not just display text — they are
// persisted verbatim as `symptoms.names`/`symptoms.painLocation` in
// dailyJournalStore (see `save()` below) and read back elsewhere (e.g.
// SelectedDayCard's `symptomNames.join(', ')`). The raw French string stays
// the stored/compared/selected value forever (never renamed here) — PHASE 7H
// adds a DISPLAY-ONLY translation via journalOptionLabel('cycleSymptom'/
// 'cycleSymptomLocation', value, t), which falls back to the original French
// string for any value it doesn't recognize (legacy/unknown data). INTENSITIES
// is different: its persisted value is the separate semantic `value` field
// ('mild'/'moderate'/'severe'), so its `label`/`description` were already
// safe, pure DISPLAY text and already localized before this phase.
const SYMPTOMS: SymptomOption[] = [
  {
    label: 'Douleurs menstruelles',
    icon: 'heat-wave',
  },
  {
    label: 'Crampes',
    icon: 'lightning-bolt',
  },
  {
    label: 'Maux de tête',
    icon: 'head-alert-outline',
  },
  {
    label: 'Migraines',
    icon: 'head-flash-outline',
  },
  {
    label: 'Fatigue',
    icon: 'sleep',
  },
  {
    label: 'Ballonnements',
    icon: 'weather-windy',
    image: require('../../assets/images/symptom-bloating.png'),
  },
  {
    label: 'Nausées',
    icon: 'emoticon-sick-outline',
  },
  {
    label: 'Seins sensibles',
    icon: 'human-female',
    image: require('../../assets/images/symptom-seins.png'),

  },
  {
    label: 'Acné',
    icon: 'face-recognition',
    image: require('../../assets/images/symptom-acne.png'),
  },
  {
    label: 'Douleurs lombaires',
    icon: 'human-handsdown',
    image: require('../../assets/images/symptom-back-pain.png'),
  },
  {
    label: 'Douleurs musculaires',
    icon: 'arm-flex-outline',
  },
  {
    label: 'Constipation',
    icon: 'stomach',
    image: require('../../assets/images/symptom-constipation.png'),
  },
  {
    label: 'Diarrhée',
    icon: 'toilet',
  },
  {
    label: 'Pertes',
    icon: 'water-outline',
  },
  {
    label: 'Autre',
    icon: 'dots-horizontal-circle-outline',
  },
];

const INTENSITIES: IntensityOption[] = [
  {
    labelKey: 'journalSymptoms.intensity.mild.label',
    descriptionKey: 'journalSymptoms.intensity.mild.description',
    icon: 'weather-sunny',
    level: 1,
    value: 'mild',
  },
  {
    labelKey: 'journalSymptoms.intensity.moderate.label',
    descriptionKey: 'journalSymptoms.intensity.moderate.description',
    icon: 'weather-partly-cloudy',
    level: 2,
    value: 'moderate',
  },
  {
    labelKey: 'journalSymptoms.intensity.strong.label',
    descriptionKey: 'journalSymptoms.intensity.strong.description',
    icon: 'weather-lightning',
    level: 3,
    value: 'severe',
  },
  {
    labelKey: 'journalSymptoms.intensity.veryStrong.label',
    descriptionKey: 'journalSymptoms.intensity.veryStrong.description',
    icon: 'alert-circle-outline',
    level: 4,
    value: 'severe',
  },
];

const LOCATIONS = [
  'Bas ventre',
  'Dos',
  'Tête',
  'Seins',
  'Corps entier',
];

const LOCATION_ICONS: Record<string, string> = {
  'Bas ventre': 'human-female',
  Dos: 'human-handsdown',
  'Tête': 'head-outline',
  Seins: 'heart-pulse',
  'Corps entier': 'human',
};

const LOCATION_IMAGES: Record<string, ImageSourcePropType> = {
  'Bas ventre': require('../../assets/images/zone_bas_ventre.png'),
  Dos: require('../../assets/images/zone_dos.png'),
  'Tête': require('../../assets/images/zone_tete.png'),
  Seins: require('../../assets/images/zone_seins.png'),
  'Corps entier': require('../../assets/images/zone_corps.png'),
};

export default function JournalSymptomsScreen(): React.JSX.Element {
  const {t} = useTranslation();
  // Managed daughter profile only (null for the mother, whose screen renders exactly as before): no illustrated hero,
  // no symptom photos or body-zone drawings, compact rows, third-person wording with her first name.
  const {daughter, tx} = useDaughterJournal();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {width} = useWindowDimensions();

  const isSmallScreen = width < 360;

  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();
  // Re-evaluated when the local day changes / the app returns to the
  // foreground — see src/hooks/useToday.ts. "Today's journal" therefore
  // always saves to the CURRENT day, never to the day the screen opened.
  const {todayKey} = useToday();

  const insets = useSafeAreaInsets();

  /**
   * Même logique que la page Sommeil.
   *
   * L'espace supérieur dépend automatiquement
   * de la status bar / notch / Dynamic Island.
   */
  const topSpacing = Math.max(
    insets.top + (isSmallScreen ? 6 : 8),
    16,
  );

  const locationTransition = useRef(new Animated.Value(1)).current;
  const locationBadgeAnimation = useRef(new Animated.Value(1)).current;
  const locationGlowAnimation = useRef(new Animated.Value(0)).current;
  const locationDirectionRef = useRef(1);

  const [selected, setSelected] = useState<string[]>([
    'Douleurs menstruelles',
    'Fatigue',
  ]);

  const [intensityIndex, setIntensityIndex] = useState(2);

  const [location, setLocation] =
    useState('Bas ventre');

  const [displayedLocation, setDisplayedLocation] =
    useState('Bas ventre');

  const [note, setNote] = useState('');

  const [saving, setSaving] = useState(false);
  // M25: true only while saved symptoms exist for today (shows "Effacer").
  const [hasSaved, setHasSaved] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const successToastAnimation = useRef(new Animated.Value(0)).current;
  const successToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Récupère les dimensions originales de l'image
   * sélectionnée pour que le cadre adopte
   * automatiquement le même ratio.
   */
  const locationImageRatio = useMemo(() => {
    const resolved = Image.resolveAssetSource(
      LOCATION_IMAGES[location],
    );

    if (
      !resolved ||
      !resolved.width ||
      !resolved.height
    ) {
      return 1;
    }

    return resolved.width / resolved.height;
  }, [location]);

  /**
   * Objet de style dynamique créé hors du JSX.
   * Cela évite un inline style directement
   * dans le composant.
   */
  const topBarResponsiveStyle = useMemo(
    () => ({
      paddingTop: topSpacing,
    }),
    [topSpacing],
  );

  const locationVisualResponsiveStyle = useMemo(
    () => ({
      aspectRatio: locationImageRatio,
    }),
    [locationImageRatio],
  );

  useEffect(() => {
    locationTransition.stopAnimation();
    locationBadgeAnimation.stopAnimation();
    locationGlowAnimation.stopAnimation();

    locationTransition.setValue(0);
    locationBadgeAnimation.setValue(0);
    locationGlowAnimation.setValue(0);

    Animated.parallel([
      Animated.timing(locationTransition, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(locationBadgeAnimation, {
        toValue: 1,
        damping: 16,
        stiffness: 190,
        mass: 0.82,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(locationGlowAnimation, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(locationGlowAnimation, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({finished}) => {
      if (finished) {
        setDisplayedLocation(location);
      }
    });
  }, [
    location,
    locationBadgeAnimation,
    locationGlowAnimation,
    locationTransition,
  ]);

  const changeLocation = (nextLocation: string) => {
    if (nextLocation === location) {
      return;
    }

    const currentIndex = LOCATIONS.indexOf(location);
    const nextIndex = LOCATIONS.indexOf(nextLocation);
    locationDirectionRef.current = nextIndex >= currentIndex ? 1 : -1;
    setLocation(nextLocation);
  };

  const previousLocationImageStyle = {
    opacity: locationTransition.interpolate({
      inputRange: [0, 0.62, 1],
      outputRange: [1, 0.35, 0],
    }),
    transform: [
      {
        scale: locationTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.018],
        }),
      },
    ],
  };

  const nextLocationImageStyle = {
    opacity: locationTransition.interpolate({
      inputRange: [0, 0.12, 1],
      outputRange: [0, 0.16, 1],
    }),
    transform: [
      {
        translateX: locationTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [locationDirectionRef.current * 18, 0],
        }),
      },
      {
        scale: locationTransition.interpolate({
          inputRange: [0, 0.65, 1],
          outputRange: [0.975, 1.008, 1],
        }),
      },
    ],
  };

  const locationBadgeAnimatedStyle = {
    opacity: locationBadgeAnimation,
    transform: [
      {
        translateY: locationBadgeAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
      {
        scale: locationBadgeAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const locationGlowAnimatedStyle = {
    opacity: locationGlowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.9],
    }),
    transform: [
      {
        scale: locationGlowAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1.015],
        }),
      },
    ],
  };

  const toggleSymptom = (item: string) => {
    setSelected(current =>
      current.includes(item)
        ? current.filter(value => value !== item)
        : [...current, item],
    );
  };

  useEffect(() => {
    return () => {
      if (successToastTimeout.current) {
        clearTimeout(successToastTimeout.current);
      }
    };
  }, []);

  // Reopening today's symptoms shows what was already saved instead of the
  // defaults, so pressing Save without editing rewrites the same values. The
  // note is already decrypted by getJournalEntry(). Names the chips list does
  // not know (saved elsewhere) stay in `selected` and are written back as-is.
  // Both "Forte" and "Très forte" persist as 'severe' (see INTENSITIES), so a
  // saved 'severe' reopens on "Forte" and re-saves as the same 'severe'.
  useEffect(() => {
    let mounted = true;
    getJournalEntry(todayKey).then(entry => {
      const saved = entry?.symptoms;
      if (!mounted || !saved) {
        return;
      }
      setHasSaved(true);
      if (Array.isArray(saved.names)) {
        setSelected(saved.names);
      }
      const savedIntensityIndex = INTENSITIES.findIndex(
        option => option.value === saved.severity,
      );
      if (savedIntensityIndex >= 0) {
        setIntensityIndex(savedIntensityIndex);
      }
      if (saved.painLocation && LOCATIONS.includes(saved.painLocation)) {
        setLocation(saved.painLocation);
        setDisplayedLocation(saved.painLocation);
      }
      setNote(saved.note ?? '');
    });
    return () => {
      mounted = false;
    };
  }, [todayKey]);

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

          // Retour à l'écran précédent.
          // Dans ton flow, JournalSymptomsScreen est ouvert depuis CycleHome,
          // donc goBack() retourne correctement vers CycleHome sans erreur de typage.
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

  // M25: removes the saved symptoms for today (section absent = the canonical
  // empty state); reopening shows the untouched defaults again.
  const clearEntry = async () => {
    try {
      await deleteJournalSection(todayKey, 'symptoms');
    } catch (saveError) {
      presentSaveFailure(saveError);
      return;
    }
    setHasSaved(false);
    navigation.goBack();
  };

  const save = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await saveJournalSection(
        todayKey,
        'symptoms',
        {
          names: selected,
          severity:
            INTENSITIES[intensityIndex].value,
          painLocation: location,
          note: note.trim(),
        },
      );

      showSuccessToast();
    } catch (saveError) {
      presentSaveFailure(saveError, {title: t('journalSymptoms.errorTitle'), message: tx('journalSymptoms.errorMessage', 'symptoms.errorMessage')});
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={styles.safe}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.statusBarStyle}
        translucent
      />

      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={0}
        style={styles.flex}>
        {/* HEADER */}
        <View
          style={[
            styles.topBar,
            topBarResponsiveStyle,
          ]}>
          {/* RETOUR */}
          <AwaIconButton
            accessibilityLabel={t('common.back')}
            icon="arrow-left"
            onPress={() =>
              navigation.goBack()
            }
          />

          {/* TITRE */}
          <AwaText numberOfLines={daughter ? 2 : undefined} style={daughter ? styles.daughterTitle : undefined} variant="headlineSmall">
            {tx('dailyJournal.symptoms', 'titles.symptoms')}
          </AwaText>

          {/* CHECK */}
          <AwaIconButton
            accessibilityLabel={t('journalSymptoms.saveSymptoms')}
            disabled={saving}
            icon="check"
            onPress={save}
            variant="filled"
          />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom:
                Math.max(
                  insets.bottom,
                  16,
                ) + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* HERO (not shown for a daughter's journal) */}
          {daughter ? null : (
            <ImageBackground
              imageStyle={styles.heroImage}
              source={require('../../assets/images/symptoms-header-woman.png')}
              style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>
                  {t('journalSymptoms.heroTitle')}
                </Text>

                <Text style={styles.heroSubtitle}>
                  {t('journalSymptoms.heroSubtitle')}
                </Text>
              </View>
            </ImageBackground>
          )}

          {/* SYMPTÔMES */}
          <AwaCard padding="compact" variant="outlined">
            <View style={styles.symptomsHeader}>
              <View style={styles.symptomsHeaderMain}>
                <View style={styles.headingIcon}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="clipboard-pulse-outline"
                    size={18}
                  />
                </View>

                <View style={styles.headingCopy}>
                  <Text style={styles.sectionTitle}>
                    {tx('journalSymptoms.symptomsFeltTitle', 'symptoms.observedTitle')}
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    {tx('journalSymptoms.symptomsFeltSubtitle', 'symptoms.observedSubtitle')}
                  </Text>
                </View>
              </View>

              <View style={styles.symptomCountBadge}>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="check-circle-outline"
                  size={15}
                />
                <Text style={styles.symptomCountText}>
                  {t('journalSymptoms.selectedCount', {count: selected.length})}
                </Text>
              </View>
            </View>

            <View style={styles.symptomsList}>
              {SYMPTOMS.map(item => {
                const active = selected.includes(item.label);

                return (
                  <Pressable
                    key={item.label}
                    accessibilityLabel={journalOptionLabel('cycleSymptom', item.label, t)}
                    accessibilityRole="checkbox"
                    accessibilityState={{checked: active}}
                    onPress={() => toggleSymptom(item.label)}
                    style={({pressed}) => [
                      styles.symptomRow,
                      active && styles.symptomRowActive,
                      pressed && styles.symptomRowPressed,
                    ]}>
                    <View
                      style={[
                        styles.symptomIconContainer,
                        active && styles.symptomIconContainerActive,
                      ]}>
                      {item.image && !daughter ? (
                        <Image
                          resizeMode="contain"
                          source={item.image}
                          style={[
                            styles.customSymptomIcon,
                            active && styles.customSymptomIconActive,
                          ]}
                        />
                      ) : (
                        <MaterialDesignIcons
                          color={active ? onPrimaryTextColor(theme) : theme.colors.primary}
                          name={item.icon as never}
                          size={22}
                        />
                      )}
                    </View>

                    <View style={styles.symptomCopy}>
                      <Text
                        style={[
                          styles.symptomText,
                          active && styles.symptomTextActive,
                        ]}>
                        {journalOptionLabel('cycleSymptom', item.label, t)}
                      </Text>

                      {daughter ? null : (
                        <Text
                          style={[
                            styles.symptomHelperText,
                            active && styles.symptomHelperTextActive,
                          ]}>
                          {active ? t('journalSymptoms.addedToJournal') : t('journalSymptoms.tapToSelect')}
                        </Text>
                      )}
                    </View>

                    <View
                      style={[
                        styles.selectionIndicator,
                        active && styles.selectionIndicatorActive,
                      ]}>
                      {active ? (
                        <MaterialDesignIcons
                          color={onPrimaryTextColor(theme)}
                          name="check"
                          size={15}
                        />
                      ) : (
                        <MaterialDesignIcons
                          color={theme.colors.textMuted}
                          name="plus"
                          size={15}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </AwaCard>

          {/* INTENSITÉ */}
          <AwaCard padding="compact" variant="outlined">
            <View
              style={
                styles.intensityHeader
              }>
              <View
                style={
                  styles.intensityHeaderIcon
                }>
                <MaterialDesignIcons
                  color={theme.colors.primary}
                  name="signal-cellular-3"
                  size={19}
                />
              </View>

              <View
                style={
                  styles.intensityHeaderCopy
                }>
                <Text
                  style={
                    styles.sectionTitleStandalone
                  }>
                  {t('journalSymptoms.intensitySectionTitle')}
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }>
                  {tx('journalSymptoms.intensitySectionSubtitle', 'symptoms.intensitySubtitle')}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.intensityList
              }>
              {INTENSITIES.map(
                (item, index) => {
                  const active =
                    intensityIndex === index;
                  const label = t(item.labelKey);
                  const description = t(item.descriptionKey);

                  return (
                    <Pressable
                      key={item.labelKey}
                      accessibilityLabel={t('journalSymptoms.intensityAccessibility', {label, description})}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: active,
                      }}
                      onPress={() =>
                        setIntensityIndex(
                          index,
                        )
                      }
                      style={({pressed}) => [
                        styles.intensityCard,

                        active &&
                          styles.intensityCardActive,

                        pressed &&
                          styles.pressed,
                      ]}>
                      <View
                        style={[
                          styles.intensityIconWrap,

                          active &&
                            styles.intensityIconWrapActive,
                        ]}>
                        <MaterialDesignIcons
                          color={
                            active
                              ? onPrimaryTextColor(theme)
                              : theme.colors.primary
                          }
                          name={
                            item.icon as never
                          }
                          size={22}
                        />
                      </View>

                      <View
                        style={
                          styles.intensityContent
                        }>
                        <View
                          style={
                            styles.intensityTitleRow
                          }>
                          <Text
                            style={[
                              styles.intensityLabel,

                              active &&
                                styles.intensityLabelActive,
                            ]}>
                            {label}
                          </Text>

                          <View
                            style={
                              styles.intensityLevel
                            }>
                            {[1, 2, 3, 4].map(
                              level => (
                                <View
                                  key={
                                    level
                                  }
                                  style={[
                                    styles.intensityLevelBar,

                                    level <=
                                      item.level &&
                                      styles.intensityLevelBarFilled,

                                    active &&
                                      level <=
                                        item.level &&
                                      styles.intensityLevelBarActive,
                                  ]}
                                />
                              ),
                            )}
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.intensityDescription,

                            active &&
                              styles.intensityDescriptionActive,
                          ]}>
                          {
                            description
                          }
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.intensityRadio,

                          active &&
                            styles.intensityRadioActive,
                        ]}>
                        {active ? (
                          <MaterialDesignIcons
                            color={
                              theme.colors.primary
                            }
                            name="check"
                            size={14}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                },
              )}
            </View>
          </AwaCard>

          {/* LOCALISATION */}
          <AwaCard padding="compact" variant="outlined">
            <Text style={styles.sectionTitleStandalone}>
              {t('journalSymptoms.locationSectionTitle')}{' '}
              <Text style={styles.optional}>
                {t('journalMood.optional')}
              </Text>
            </Text>

            <Text style={styles.sectionSubtitle}>
              {tx('journalSymptoms.locationSectionSubtitle', 'symptoms.locationSubtitle')}
            </Text>

            <View style={styles.locationPanel}>
              {daughter ? null : (
              <View
                style={[
                  styles.locationVisual,
                  locationVisualResponsiveStyle,
                ]}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.locationGlow,
                    locationGlowAnimatedStyle,
                  ]}
                />

                <Animated.Image
                  source={LOCATION_IMAGES[displayedLocation]}
                  resizeMode="contain"
                  style={[
                    styles.zoneImage,
                    previousLocationImageStyle,
                  ]}
                />

                <Animated.Image
                  source={LOCATION_IMAGES[location]}
                  resizeMode="contain"
                  style={[
                    styles.zoneImage,
                    styles.zoneImageOverlay,
                    nextLocationImageStyle,
                  ]}
                />

                <View style={styles.locationVisualTopBadge}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name="map-marker-outline"
                    size={15}
                  />
                  <Text style={styles.locationVisualTopBadgeText}>
                    {t('journalSymptoms.bodyZone')}
                  </Text>
                </View>
              </View>
              )}

              {daughter ? null : (
              <Animated.View
                style={[
                  styles.selectedLocationBadge,
                  locationBadgeAnimatedStyle,
                ]}>
                <View style={styles.selectedLocationIconWrap}>
                  <MaterialDesignIcons
                    color={theme.colors.primary}
                    name={LOCATION_ICONS[location] as never}
                    size={18}
                  />
                </View>

                <View style={styles.selectedLocationCopy}>
                  <Text style={styles.selectedLocationEyebrow}>
                    {t('journalSymptoms.selectedZone')}
                  </Text>
                  <Text style={styles.selectedLocationText}>
                    {journalOptionLabel('cycleSymptomLocation', location, t)}
                  </Text>
                </View>

                <View style={styles.selectedLocationCheck}>
                  <MaterialDesignIcons
                    color={onPrimaryTextColor(theme)}
                    name="check"
                    size={14}
                  />
                </View>
              </Animated.View>
              )}

              <View style={styles.locationOptionsModern}>
                {LOCATIONS.map(item => {
                  const active = item === location;

                  return (
                    <Pressable
                      key={item}
                      accessibilityLabel={journalOptionLabel('cycleSymptomLocation', item, t)}
                      accessibilityRole="radio"
                      accessibilityState={{checked: active}}
                      onPress={() => changeLocation(item)}
                      style={({pressed}) => [
                        styles.locationChoice,
                        isSmallScreen && styles.locationChoiceSmall,
                        active && styles.locationChoiceActive,
                        pressed && styles.locationChoicePressed,
                      ]}>
                      <View
                        style={[
                          styles.locationChoiceIcon,
                          active && styles.locationChoiceIconActive,
                        ]}>
                        <MaterialDesignIcons
                          color={active ? onPrimaryTextColor(theme) : theme.colors.textSecondary}
                          name={LOCATION_ICONS[item] as never}
                          size={19}
                        />
                      </View>

                      <Text
                        style={[
                          styles.locationChoiceText,
                          active && styles.locationChoiceTextActive,
                        ]}>
                        {journalOptionLabel('cycleSymptomLocation', item, t)}
                      </Text>

                      <View
                        style={[
                          styles.locationRadio,
                          active && styles.locationRadioActive,
                        ]}>
                        {active ? (
                          <MaterialDesignIcons
                            color={onPrimaryTextColor(theme)}
                            name="check"
                            size={12}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </AwaCard>

          {/* NOTES */}
          <AwaCard padding="compact" variant="outlined">
            <Text
              style={
                styles.sectionTitleStandalone
              }>
              {t('journalSymptoms.additionalNotesTitle')}{' '}
              <Text
                style={styles.optional}>
                {t('journalMood.optional')}
              </Text>
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }>
              {t('journalSymptoms.additionalNotesSubtitle')}
            </Text>

            <View style={styles.noteBox}>
              <TextInput
                accessibilityLabel={t('journalSymptoms.additionalNotesTitle')}
                maxLength={300}
                multiline
                onChangeText={setNote}
                placeholder={t('journalSymptoms.notesPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                style={styles.noteInput}
                textAlignVertical="top"
                value={note}
              />

              <Text style={styles.counter}>
                {note.length} / 300
              </Text>
            </View>
          </AwaCard>

          {/* BOUTON ENREGISTRER */}
          <AwaButton
            accessibilityLabel={t('journalSymptoms.saveMySymptoms')}
            icon="content-save-outline"
            label={saving ? t('periodStartSheet.saving') : t('common.save')}
            loading={saving}
            onPress={save}
            size="large"
            style={styles.saveButton}
          />

          {hasSaved ? <ClearEntryButton onConfirm={clearEntry} subject={t('journalSymptoms.clearSubject')} /> : null}
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
              color={onPrimaryTextColor(theme)}
              name="check"
              size={14}
            />
          </View>

          <Text style={styles.toastText}>
            {t('journalSymptoms.savedToast')}
          </Text>

          <Pressable
            accessibilityLabel={t('common.close')}
            accessibilityRole="button"
            hitSlop={10}
            onPress={hideSuccessToast}
            style={({pressed}) => [
              styles.toastCloseButton,
              pressed && styles.toastCloseButtonPressed,
            ]}>
            <MaterialDesignIcons
              color={theme.colors.textSecondary}
              name="close"
              size={17}
            />
          </Pressable>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  flex: {
    flex: 1,
  },

  /**
   * Plus de marginTop fixe.
   * paddingTop est calculé avec insets.top.
   */
  topBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },

  /**
   * Même style de ✓ que Sommeil :
   * fond violet + icône blanche.
   */

  content: {
    paddingHorizontal: 11,
    paddingBottom: 34,
    gap: 8,
  },

  // Daughter journal: the title can wrap and shrinks between the back and save buttons.
  daughterTitle: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
  },

  hero: {
    minHeight: 115,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  heroImage: {
    borderRadius: 12,
  },

  heroCopy: {
    width: '48%',
    paddingLeft: 28,
  },

  heroTitle: {
    color: JOURNAL_HERO_INK.title,
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },

  heroSubtitle: {
    marginTop: 7,
    color: JOURNAL_HERO_INK.body,
    fontSize: 11.5,
    lineHeight: 16,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  headingIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: theme.colors.primarySoft,
  },

  headingCopy: {
    flex: 1,
    marginLeft: 9,
  },

  sectionTitle: {
    color: theme.colors.accent,
    fontSize: 15.5,
    fontWeight: '700',
  },

  sectionTitleStandalone: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  optional: {
    fontFamily: undefined,
    fontSize: 11,
    fontWeight: '400',
  },

  symptomsHeader: {
    marginBottom: 12,
  },

  symptomsHeaderMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  symptomCountBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  symptomCountText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  symptomsList: {
    gap: 8,
  },

  symptomRow: {
    width: '100%',
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },

  symptomRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 2,
  },

  symptomRowPressed: {
    opacity: 0.82,
    transform: [{scale: 0.992}],
  },

  symptomIconContainer: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  symptomIconContainerActive: {
    backgroundColor: theme.colors.primary,
  },

  customSymptomIcon: {
    width: 26,
    height: 26,
    tintColor: theme.colors.primary,
  },

  customSymptomIconActive: {
    tintColor: onPrimaryTextColor(theme),
  },

  symptomCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  symptomText: {
    color: theme.colors.text,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    flexShrink: 1,
  },

  // DESIGN.md: text on the selected (primarySoft) card = onPrimaryContainer.
  symptomTextActive: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
    fontWeight: '800',
  },

  symptomHelperText: {
    marginTop: 3,
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },

  symptomHelperTextActive: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
    fontWeight: '600',
  },

  selectionIndicator: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },

  selectionIndicatorActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  intensityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  intensityHeaderIcon: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  intensityHeaderCopy: {
    flex: 1,
    marginLeft: 10,
  },

  intensityList: {
    marginTop: 12,
    gap: 10,
  },

  intensityCard: {
    width: '100%',
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  intensityCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
  },

  intensityIconWrap: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.primarySoft,
  },

  intensityIconWrapActive: {
    backgroundColor: theme.colors.primary,
  },

  intensityContent: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  intensityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  intensityLabel: {
    flexShrink: 1,
    color: theme.colors.accent,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },

  intensityLabelActive: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
  },

  intensityDescription: {
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },

  intensityDescriptionActive: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
  },

  intensityLevel: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },

  intensityLevelBar: {
    width: 5,
    height: 9,
    borderRadius: 3,
    backgroundColor: withAlpha(theme.colors.primary, 0.14),
  },

  intensityLevelBarFilled: {
    backgroundColor: withAlpha(theme.colors.primary, 0.4),
  },

  intensityLevelBarActive: {
    backgroundColor: theme.colors.primary,
  },

  intensityRadio: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  intensityRadioActive: {
    borderColor: theme.colors.primary,
  },

  locationPanel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    padding: 12,
  },

  locationVisual: {
    width: '100%',
    maxHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  locationGlow: {
    position: 'absolute',
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    backgroundColor: withAlpha(theme.colors.primary, 0.035),
  },

  zoneImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },

  zoneImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  locationVisualTopBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.16),
    borderRadius: 15,
    backgroundColor: withAlpha(theme.colors.surface, 0.88),
  },

  locationVisualTopBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  selectedLocationBadge: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  selectedLocationIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
  },

  selectedLocationCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  selectedLocationEyebrow: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  selectedLocationText: {
    marginTop: 2,
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },

  selectedLocationCheck: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
  },

  locationOptionsModern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
    marginTop: 12,
  },

  locationChoice: {
    width: '48.5%',
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  locationChoiceSmall: {
    width: '100%',
  },

  locationChoiceActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },

  locationChoicePressed: {
    opacity: 0.78,
    transform: [{scale: 0.985}],
  },

  locationChoiceIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSecondary,
  },

  locationChoiceIconActive: {
    backgroundColor: theme.colors.primary,
  },

  locationChoiceText: {
    flex: 1,
    flexShrink: 1,
    marginHorizontal: 8,
    color: theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    flexWrap: 'wrap',
  },

  locationChoiceTextActive: {
    color: deriveAwaRoles(theme).onPrimaryContainer,
    fontWeight: '800',
  },

  locationRadio: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
  },

  locationRadioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  noteBox: {
    minHeight: 120,
    marginTop: 8,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },

  noteInput: {
    flex: 1,
    padding: 10,
    paddingBottom: 20,
    color: theme.colors.text,
    fontSize: 11,
  },

  counter: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    color: theme.colors.textMuted,
    fontSize: 11,
  },

  saveButton: {width: '88%', maxWidth: 360, alignSelf: 'center', marginTop: 12, marginBottom: 8},

  pressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.99,
      },
    ],
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
    borderColor: withAlpha(theme.colors.primary, 0.14),
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },

  toastIcon: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },

  toastText: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.accent,
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
    backgroundColor: theme.colors.surfaceSecondary,
    opacity: 0.8,
  },

  });
}