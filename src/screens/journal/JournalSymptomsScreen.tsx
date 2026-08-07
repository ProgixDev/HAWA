import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
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
  type ImageSourcePropType,
} from 'react-native';

import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import {
  useNavigation,
  type NavigationProp,
} from '@react-navigation/native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import type {RootStackParamList} from '../../navigation/AppNavigator';
import {saveJournalSection} from '../../state/dailyJournalStore';
import type {SymptomSeverity} from '../../types/journal';

type SymptomOption = {
  label: string;
  icon: string;
  image?: ImageSourcePropType;
};

type IntensityOption = {
  label: string;
  description: string;
  icon: string;
  level: number;
  value: SymptomSeverity;
};

const PURPLE = '#6949BE';
const ACTIVE_PURPLE = '#5D3FA8';

/**
 * Même violet que le bouton ✓
 * utilisé sur la page Sommeil.
 */
const CHECK_PURPLE = '#6634B5';

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
    label: 'Légère',
    description: 'Présente, mais facile à supporter',
    icon: 'weather-sunny',
    level: 1,
    value: 'mild',
  },
  {
    label: 'Modérée',
    description: 'Gênante dans certaines activités',
    icon: 'weather-partly-cloudy',
    level: 2,
    value: 'moderate',
  },
  {
    label: 'Forte',
    description: 'Difficile à ignorer au quotidien',
    icon: 'weather-lightning',
    level: 3,
    value: 'severe',
  },
  {
    label: 'Très forte',
    description: 'Très douloureuse ou invalidante',
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
  const {width} = useWindowDimensions();

  const isSmallScreen = width < 360;

  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();

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

  const save = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      await saveJournalSection(
        new Date().toLocaleDateString('en-CA'),
        'symptoms',
        {
          names: selected,
          severity:
            INTENSITIES[intensityIndex].value,
          painLocation: location,
          note: note.trim(),
        },
      );

      Alert.alert(
        'Journal',
        'Tes symptômes ont été enregistrés.',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.goBack(),
          },
        ],
      );
    } catch {
      Alert.alert(
        'Erreur',
        "Impossible d'enregistrer tes symptômes pour le moment.",
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
        backgroundColor="#F8EFFF"
        barStyle="dark-content"
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
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() =>
              navigation.goBack()
            }
            style={({pressed}) => [
              styles.roundButton,
              pressed &&
                styles.roundButtonPressed,
            ]}>
            <MaterialDesignIcons
              color={PURPLE}
              name="arrow-left"
              size={24}
            />
          </Pressable>

          {/* TITRE */}
          <Text style={styles.pageTitle}>
            Symptômes
          </Text>

          {/* CHECK */}
          <Pressable
            accessibilityLabel="Enregistrer les symptômes"
            accessibilityRole="button"
            disabled={saving}
            hitSlop={10}
            onPress={save}
            style={({pressed}) => [
              styles.checkButton,
              pressed &&
                styles.roundButtonPressed,
              saving &&
                styles.disabled,
            ]}>
            <MaterialDesignIcons
              color="#FFFFFF"
              name="check"
              size={24}
            />
          </Pressable>
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
          {/* HERO */}
          <ImageBackground
            imageStyle={styles.heroImage}
            source={require('../../assets/images/symptoms-header-woman.png')}
            style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                Écoute ton corps
              </Text>

              <Text style={styles.heroSubtitle}>
                Sélectionne les symptômes que
                {'\n'}
                tu ressens aujourd’hui.
              </Text>
            </View>
          </ImageBackground>

          {/* SYMPTÔMES */}
          <View style={styles.card}>
            <View style={styles.symptomsHeader}>
              <View style={styles.symptomsHeaderMain}>
                <View style={styles.headingIcon}>
                  <MaterialDesignIcons
                    color={ACTIVE_PURPLE}
                    name="clipboard-pulse-outline"
                    size={18}
                  />
                </View>

                <View style={styles.headingCopy}>
                  <Text style={styles.sectionTitle}>
                    Symptômes ressentis
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Sélectionne tous les symptômes que tu ressens aujourd’hui.
                  </Text>
                </View>
              </View>

              <View style={styles.symptomCountBadge}>
                <MaterialDesignIcons
                  color={ACTIVE_PURPLE}
                  name="check-circle-outline"
                  size={15}
                />
                <Text style={styles.symptomCountText}>
                  {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.symptomsList}>
              {SYMPTOMS.map(item => {
                const active = selected.includes(item.label);

                return (
                  <Pressable
                    key={item.label}
                    accessibilityLabel={item.label}
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
                      {item.image ? (
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
                          color={active ? '#FFFFFF' : ACTIVE_PURPLE}
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
                        {item.label}
                      </Text>

                      <Text
                        style={[
                          styles.symptomHelperText,
                          active && styles.symptomHelperTextActive,
                        ]}>
                        {active ? 'Ajouté à ton journal' : 'Appuie pour sélectionner'}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.selectionIndicator,
                        active && styles.selectionIndicatorActive,
                      ]}>
                      {active ? (
                        <MaterialDesignIcons
                          color="#FFFFFF"
                          name="check"
                          size={15}
                        />
                      ) : (
                        <MaterialDesignIcons
                          color="#A79BBB"
                          name="plus"
                          size={15}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* INTENSITÉ */}
          <View style={styles.card}>
            <View
              style={
                styles.intensityHeader
              }>
              <View
                style={
                  styles.intensityHeaderIcon
                }>
                <MaterialDesignIcons
                  color={ACTIVE_PURPLE}
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
                  Intensité
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }>
                  Choisis le niveau qui décrit
                  le mieux ce que tu ressens.
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

                  return (
                    <Pressable
                      key={item.label}
                      accessibilityLabel={`Intensité ${item.label}. ${item.description}`}
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
                              ? '#FFFFFF'
                              : ACTIVE_PURPLE
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
                            {item.label}
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
                            item.description
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
                              ACTIVE_PURPLE
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
          </View>

          {/* LOCALISATION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitleStandalone}>
              Localisation{' '}
              <Text style={styles.optional}>
                (optionnel)
              </Text>
            </Text>

            <Text style={styles.sectionSubtitle}>
              Où ressens-tu principalement
              {'\n'}
              ces symptômes ?
            </Text>

            <View style={styles.locationPanel}>
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
                    color={ACTIVE_PURPLE}
                    name="map-marker-outline"
                    size={15}
                  />
                  <Text style={styles.locationVisualTopBadgeText}>
                    Zone du corps
                  </Text>
                </View>
              </View>

              <Animated.View
                style={[
                  styles.selectedLocationBadge,
                  locationBadgeAnimatedStyle,
                ]}>
                <View style={styles.selectedLocationIconWrap}>
                  <MaterialDesignIcons
                    color={ACTIVE_PURPLE}
                    name={LOCATION_ICONS[location] as never}
                    size={18}
                  />
                </View>

                <View style={styles.selectedLocationCopy}>
                  <Text style={styles.selectedLocationEyebrow}>
                    Zone sélectionnée
                  </Text>
                  <Text style={styles.selectedLocationText}>
                    {location}
                  </Text>
                </View>

                <View style={styles.selectedLocationCheck}>
                  <MaterialDesignIcons
                    color="#FFFFFF"
                    name="check"
                    size={14}
                  />
                </View>
              </Animated.View>

              <View style={styles.locationOptionsModern}>
                {LOCATIONS.map(item => {
                  const active = item === location;

                  return (
                    <Pressable
                      key={item}
                      accessibilityLabel={item}
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
                          color={active ? '#FFFFFF' : '#7A6F98'}
                          name={LOCATION_ICONS[item] as never}
                          size={19}
                        />
                      </View>

                      <Text
                        style={[
                          styles.locationChoiceText,
                          active && styles.locationChoiceTextActive,
                        ]}>
                        {item}
                      </Text>

                      <View
                        style={[
                          styles.locationRadio,
                          active && styles.locationRadioActive,
                        ]}>
                        {active ? (
                          <MaterialDesignIcons
                            color="#FFFFFF"
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
          </View>

          {/* NOTES */}
          <View style={styles.card}>
            <Text
              style={
                styles.sectionTitleStandalone
              }>
              Notes supplémentaires{' '}
              <Text
                style={styles.optional}>
                (optionnel)
              </Text>
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }>
              Ajoute un commentaire si tu le
              souhaites.
            </Text>

            <View style={styles.noteBox}>
              <TextInput
                accessibilityLabel="Notes supplémentaires"
                maxLength={300}
                multiline
                onChangeText={setNote}
                placeholder="Écris ici..."
                placeholderTextColor="#9A8FB8"
                style={styles.noteInput}
                textAlignVertical="top"
                value={note}
              />

              <Text style={styles.counter}>
                {note.length} / 300
              </Text>
            </View>
          </View>

          {/* BOUTON ENREGISTRER */}
          <Pressable
            accessibilityLabel="Enregistrer mes symptômes"
            accessibilityRole="button"
            disabled={saving}
            onPress={save}
            style={({pressed}) => [
              styles.saveButton,

              pressed &&
                styles.pressed,

              saving &&
                styles.disabled,
            ]}>
            {saving ? (
              <Text
                style={
                  styles.saveText
                }>
                Enregistrement…
              </Text>
            ) : (
              <>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="content-save-outline"
                  size={20}
                />

                <Text
                  style={
                    styles.saveText
                  }>
                  Enregistrer
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8EFFF',
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

  roundButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6DDEE',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },

  /**
   * Même style de ✓ que Sommeil :
   * fond violet + icône blanche.
   */
  checkButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: CHECK_PURPLE,
    elevation: 2,
  },

  roundButtonPressed: {
    opacity: 0.75,
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  pageTitle: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
  },

  content: {
    paddingHorizontal: 11,
    paddingBottom: 34,
    gap: 8,
  },

  hero: {
    height: 115,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2D8F0',
    borderRadius: 20,
    backgroundColor: '#FCF8FF',
  },

  heroImage: {
    borderRadius: 20,
  },

  heroCopy: {
    width: '58%',
    paddingLeft: 28,
  },

  heroTitle: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },

  heroSubtitle: {
    marginTop: 7,
    color: '#655A8D',
    fontSize: 11.5,
    lineHeight: 16,
  },

  card: {
    borderWidth: 1,
    borderColor: '#E8DFF5',
    borderRadius: 20,
    backgroundColor:
      'rgba(255,253,249,0.97)',
    padding: 12,
    shadowColor: '#5D4394',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 1,
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
    backgroundColor: '#EEE3FA',
  },

  headingCopy: {
    flex: 1,
    marginLeft: 9,
  },

  sectionTitle: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 15.5,
    fontWeight: '700',
  },

  sectionTitleStandalone: {
    color: '#28166F',
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '700',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: '#655A8D',
    fontSize: 10.5,
    lineHeight: 14,
  },

  optional: {
    fontFamily: undefined,
    fontSize: 9.5,
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
    borderColor: '#DED1ED',
    borderRadius: 14,
    backgroundColor: '#F5EEFB',
  },

  symptomCountText: {
    color: ACTIVE_PURPLE,
    fontSize: 10.5,
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
    borderColor: '#E8DFF5',
    borderRadius: 18,
    backgroundColor: '#FFFCFF',
    paddingHorizontal: 11,
    paddingVertical: 10,
    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },

  symptomRowActive: {
    borderColor: '#BCA8DF',
    backgroundColor: '#F4ECFB',
    shadowColor: ACTIVE_PURPLE,
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
    borderRadius: 15,
    backgroundColor: '#F0E8F8',
  },

  symptomIconContainerActive: {
    backgroundColor: ACTIVE_PURPLE,
  },

  customSymptomIcon: {
    width: 26,
    height: 26,
    tintColor: ACTIVE_PURPLE,
  },

  customSymptomIconActive: {
    tintColor: '#FFFFFF',
  },

  symptomCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  symptomText: {
    color: '#34285C',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    flexShrink: 1,
  },

  symptomTextActive: {
    color: '#39256E',
    fontWeight: '800',
  },

  symptomHelperText: {
    marginTop: 3,
    color: '#897DA1',
    fontSize: 9.5,
    lineHeight: 13,
  },

  symptomHelperTextActive: {
    color: '#6D56A0',
    fontWeight: '600',
  },

  selectionIndicator: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD3EA',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  selectionIndicatorActive: {
    borderColor: ACTIVE_PURPLE,
    backgroundColor: ACTIVE_PURPLE,
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
    backgroundColor: '#EEE3FA',
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
    borderColor: '#E8DFF5',
    borderRadius: 18,
    backgroundColor: '#FCFAFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: '#4E319A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  intensityCardActive: {
    borderColor: '#9E86D6',
    backgroundColor: '#EFE6FA',
    shadowColor: ACTIVE_PURPLE,
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
    borderRadius: 15,
    backgroundColor: '#EEE3FA',
  },

  intensityIconWrapActive: {
    backgroundColor: ACTIVE_PURPLE,
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
    color: '#28166F',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },

  intensityLabelActive: {
    color: ACTIVE_PURPLE,
  },

  intensityDescription: {
    marginTop: 4,
    color: '#7A6F98',
    fontSize: 10.5,
    lineHeight: 14,
  },

  intensityDescriptionActive: {
    color: ACTIVE_PURPLE,
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
    backgroundColor: '#DCD3EE',
  },

  intensityLevelBarFilled: {
    backgroundColor: '#B39DDD',
  },

  intensityLevelBarActive: {
    backgroundColor: ACTIVE_PURPLE,
  },

  intensityRadio: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4C9EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  intensityRadioActive: {
    borderColor: ACTIVE_PURPLE,
  },

  locationPanel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8DFF5',
    borderRadius: 22,
    backgroundColor: '#FCFAFF',
    padding: 12,
  },

  locationVisual: {
    width: '100%',
    maxHeight: 340,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1D5F0',
    borderRadius: 20,
    backgroundColor: '#F4EEFB',
  },

  locationGlow: {
    position: 'absolute',
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderWidth: 2,
    borderColor: '#A98ADF',
    borderRadius: 17,
    backgroundColor: 'rgba(105,73,190,0.035)',
  },

  zoneImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
    borderColor: 'rgba(105,73,190,0.16)',
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },

  locationVisualTopBadgeText: {
    color: '#514170',
    fontSize: 9.5,
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
    borderColor: '#DCCFEC',
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    shadowColor: ACTIVE_PURPLE,
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
    borderRadius: 13,
    backgroundColor: '#F0E7FA',
  },

  selectedLocationCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  selectedLocationEyebrow: {
    color: '#8A7CA7',
    fontSize: 8.5,
    fontWeight: '600',
  },

  selectedLocationText: {
    marginTop: 2,
    color: '#28166F',
    fontSize: 13,
    fontWeight: '800',
  },

  selectedLocationCheck: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: ACTIVE_PURPLE,
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
    borderColor: '#E8DFF5',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 8,
  },

  locationChoiceSmall: {
    width: '100%',
  },

  locationChoiceActive: {
    borderColor: ACTIVE_PURPLE,
    backgroundColor: '#F0E7FA',
    shadowColor: ACTIVE_PURPLE,
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
    borderRadius: 11,
    backgroundColor: '#F3ECFB',
  },

  locationChoiceIconActive: {
    backgroundColor: ACTIVE_PURPLE,
  },

  locationChoiceText: {
    flex: 1,
    flexShrink: 1,
    marginHorizontal: 8,
    color: '#655A8D',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '600',
    flexWrap: 'wrap',
  },

  locationChoiceTextActive: {
    color: ACTIVE_PURPLE,
    fontWeight: '800',
  },

  locationRadio: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D4C9EA',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  locationRadioActive: {
    borderColor: ACTIVE_PURPLE,
    backgroundColor: ACTIVE_PURPLE,
  },

  noteBox: {
    minHeight: 120,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8DFF5',
    borderRadius: 13,
    backgroundColor: '#FCFAFF',
  },

  noteInput: {
    flex: 1,
    padding: 10,
    paddingBottom: 20,
    color: '#3D3560',
    fontSize: 10.5,
  },

  counter: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    color: '#8F84AC',
    fontSize: 8.5,
  },

  saveButton: {
    width: '88%',
    maxWidth: 360,
    minHeight: 54,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 18,
    backgroundColor: PURPLE,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.8,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  disabled: {
    opacity: 0.55,
  },
});