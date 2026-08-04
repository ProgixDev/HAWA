import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';

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

const GREEN = '#1E6249';
const ACTIVE_GREEN = '#1D654C';

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

const LOCATION_GLOWS = [
  {top: 122, left: '43%' as const, width: 48, height: 42, borderRadius: 24},
  {top: 88, left: '51%' as const, width: 42, height: 58, borderRadius: 24},
  {top: 24, left: '45%' as const, width: 38, height: 38, borderRadius: 20},
  {top: 69, left: '43%' as const, width: 52, height: 42, borderRadius: 23},
  {top: 21, left: '38%' as const, width: 82, height: 178, borderRadius: 42},
];

export default function JournalSymptomsScreen(): React.JSX.Element {
  const {width} = useWindowDimensions();
  const isSmallScreen = width < 360;
  const navigation =
    useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const locationAnimation = useRef(new Animated.Value(1)).current;

  const [selected, setSelected] = useState<string[]>([
    'Douleurs menstruelles',
    'Fatigue',
  ]);

  const [intensityIndex, setIntensityIndex] = useState(2);
  const [location, setLocation] = useState('Bas ventre');
  const [note, setNote] = useState('');

  useEffect(() => {
    locationAnimation.setValue(0);
    Animated.timing(locationAnimation, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [location, locationAnimation]);
  const [saving, setSaving] = useState(false);

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
          severity: INTENSITIES[intensityIndex].value,
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
            onPress: () => navigation.goBack(),
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
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor="#F8F4EC"
        barStyle="dark-content"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
        style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => navigation.goBack()}
            style={({pressed}) => [
              styles.roundButton,
              pressed && styles.roundButtonPressed,
            ]}>
            <MaterialDesignIcons
              color={GREEN}
              name="arrow-left"
              size={24}
            />
          </Pressable>

          <Text style={styles.pageTitle}>
            Symptômes
          </Text>

          <Pressable
            accessibilityLabel="Enregistrer les symptômes"
            accessibilityRole="button"
            disabled={saving}
            hitSlop={10}
            onPress={save}
            style={({pressed}) => [
              styles.roundButton,
              pressed && styles.roundButtonPressed,
              saving && styles.disabled,
            ]}>
            <MaterialDesignIcons
              color={GREEN}
              name="check"
              size={24}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: Math.max(insets.bottom, 16) + 24},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ImageBackground
            imageStyle={styles.heroImage}
            source={require('../../assets/images/symptoms-header-woman.png')}
            style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                Écoute ton corps
              </Text>

              <Text style={styles.heroSubtitle}>
                Sélectionne les symptômes que{`\n`}
                tu ressens aujourd’hui.
              </Text>
            </View>
          </ImageBackground>

          <View style={styles.card}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}>
                <MaterialDesignIcons
                  color="#2A7354"
                  name="clipboard-pulse-outline"
                  size={18}
                />
              </View>

              <View style={styles.headingCopy}>
                <Text style={styles.sectionTitle}>
                  Symptômes ressentis
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Sélectionne tous les symptômes que tu ressens.
                </Text>
              </View>
            </View>

            <View style={styles.symptomsGrid}>
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
                      styles.symptomChip,
                      isSmallScreen && styles.symptomChipSmall,
                      active && styles.symptomChipActive,
                      pressed && styles.pressed,
                    ]}>
                    <View
                      style={[
                        styles.symptomIconContainer,
                        isSmallScreen && styles.symptomIconContainerSmall,
                        active && styles.symptomIconContainerActive,
                      ]}>
                      {item.image ? (
                        <Image
                          resizeMode="contain"
                          source={item.image}
                          style={[
                            styles.customSymptomIcon,
                            {tintColor: active ? '#FFFFFF' : '#2D7659'},
                          ]}
                        />
                      ) : (
                        <MaterialDesignIcons
                          color={active ? '#FFFFFF' : '#2D7659'}
                          name={item.icon as never}
                          size={isSmallScreen ? 20 : 22}
                        />
                      )}
                    </View>

                    <Text
                      numberOfLines={2}
                      ellipsizeMode="tail"
                      style={[
                        styles.symptomText,
                        isSmallScreen && styles.symptomTextSmall,
                        active && styles.symptomTextActive,
                      ]}>
                      {item.label}
                    </Text>

                    <View
                      style={[
                        styles.selectionIndicator,
                        active && styles.selectionIndicatorActive,
                      ]}>
                      {active ? (
                        <MaterialDesignIcons
                          color={ACTIVE_GREEN}
                          name="check"
                          size={14}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.intensityHeader}>
              <View style={styles.intensityHeaderIcon}>
                <MaterialDesignIcons
                  color={ACTIVE_GREEN}
                  name="signal-cellular-3"
                  size={19}
                />
              </View>

              <View style={styles.intensityHeaderCopy}>
                <Text style={styles.sectionTitleStandalone}>
                  Intensité
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Choisis le niveau qui décrit le mieux ce que tu ressens.
                </Text>
              </View>
            </View>

            <View style={styles.intensityList}>
              {INTENSITIES.map((item, index) => {
                const active = intensityIndex === index;

                return (
                  <Pressable
                    key={item.label}
                    accessibilityLabel={`Intensité ${item.label}. ${item.description}`}
                    accessibilityRole="radio"
                    accessibilityState={{checked: active}}
                    onPress={() => setIntensityIndex(index)}
                    style={({pressed}) => [
                      styles.intensityCard,
                      active && styles.intensityCardActive,
                      pressed && styles.pressed,
                    ]}>
                    <View
                      style={[
                        styles.intensityIconWrap,
                        active && styles.intensityIconWrapActive,
                      ]}>
                      <MaterialDesignIcons
                        color={active ? '#FFFFFF' : ACTIVE_GREEN}
                        name={item.icon as never}
                        size={22}
                      />
                    </View>

                    <View style={styles.intensityContent}>
                      <View style={styles.intensityTitleRow}>
                        <Text
                          style={[
                            styles.intensityLabel,
                            active && styles.intensityLabelActive,
                          ]}>
                          {item.label}
                        </Text>

                        <View style={styles.intensityLevel}>
                          {[1, 2, 3, 4].map(level => (
                            <View
                              key={level}
                              style={[
                                styles.intensityLevelBar,
                                level <= item.level &&
                                  styles.intensityLevelBarFilled,
                                active &&
                                  level <= item.level &&
                                  styles.intensityLevelBarActive,
                              ]}
                            />
                          ))}
                        </View>
                      </View>

                      <Text
                        numberOfLines={2}
                        style={[
                          styles.intensityDescription,
                          active && styles.intensityDescriptionActive,
                        ]}>
                        {item.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.intensityRadio,
                        active && styles.intensityRadioActive,
                      ]}>
                      {active ? (
                        <MaterialDesignIcons
                          color={ACTIVE_GREEN}
                          name="check"
                          size={14}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
              <Text style={styles.sectionTitleStandalone}>
                Localisation{' '}
                <Text style={styles.optional}>
                  (optionnel)
                </Text>
              </Text>

              <Text style={styles.sectionSubtitle}>
                Où ressens-tu principalement{`\n`}
                ces symptômes ?
              </Text>

              <View style={styles.locationPanel}>
                <View style={styles.locationVisual}>
                  <View style={styles.bodyMapGlowLarge} />

                  <Animated.Image
                    source={require('../../assets/images/symptoms-body-map.png')}
                    resizeMode="contain"
                    style={[
                      styles.bodyMapImageModern,
                      {
                        opacity: locationAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.45, 0.7],
                        }),
                        transform: [{
                          scale: locationAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.975, 1],
                          }),
                        }],
                      },
                    ]}
                  />

                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.locationFocusGlow,
                      LOCATION_GLOWS[Math.max(0, LOCATIONS.indexOf(location))],
                      {
                        opacity: locationAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, location === LOCATIONS[4] ? 0.18 : 0.58],
                        }),
                        transform: [{
                          scale: locationAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1],
                          }),
                        }],
                      },
                    ]}
                  />
                </View>

                <Animated.View
                  style={[
                    styles.selectedLocationBadge,
                    {
                      opacity: locationAnimation,
                      transform: [{
                        translateY: locationAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [4, 0],
                        }),
                      }],
                    },
                  ]}>
                  <MaterialDesignIcons
                    color={ACTIVE_GREEN}
                    name={LOCATION_ICONS[location] as never}
                    size={17}
                  />

                  <Text style={styles.selectedLocationText}>
                    Zone sélectionnée : {location}
                  </Text>
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
                        onPress={() => setLocation(item)}
                        style={({pressed}) => [
                          styles.locationChoice,
                          isSmallScreen && styles.locationChoiceSmall,
                          active && styles.locationChoiceActive,
                          pressed && styles.pressed,
                        ]}>
                        <View
                          style={[
                            styles.locationChoiceIcon,
                            active && styles.locationChoiceIconActive,
                          ]}>
                          <MaterialDesignIcons
                            color={active ? ACTIVE_GREEN : '#5C7569'}
                            name={LOCATION_ICONS[item] as never}
                            size={19}
                          />
                        </View>

                        <Text
                          numberOfLines={1}
                          ellipsizeMode="tail"
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
                          {active ? <View style={styles.locationRadioDot} /> : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
          </View>

          <View style={styles.card}>
              <Text style={styles.sectionTitleStandalone}>
                Notes supplémentaires{' '}
                <Text style={styles.optional}>
                  (optionnel)
                </Text>
              </Text>

              <Text style={styles.sectionSubtitle}>
                Ajoute un commentaire si tu le souhaites.
              </Text>

              <View style={styles.noteBox}>
                <TextInput
                  accessibilityLabel="Notes supplémentaires"
                  maxLength={300}
                  multiline
                  onChangeText={setNote}
                  placeholder="Écris ici..."
                  placeholderTextColor="#969D99"
                  style={styles.noteInput}
                  textAlignVertical="top"
                  value={note}
                />

                <Text style={styles.counter}>
                  {note.length} / 300
                </Text>
              </View>
          </View>

          <Pressable
            accessibilityLabel="Enregistrer mes symptômes"
            accessibilityRole="button"
            disabled={saving}
            onPress={save}
            style={({pressed}) => [
              styles.saveButton,
              pressed && styles.pressed,
              saving && styles.disabled,
            ]}>
            {saving ? (
              <Text style={styles.saveText}>
                Enregistrement…
              </Text>
            ) : (
              <>
                <MaterialDesignIcons
                  color="#FFFFFF"
                  name="content-save-outline"
                  size={20}
                />

                <Text style={styles.saveText}>
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
    backgroundColor: '#F8F4EC',
  },

  flex: {
    flex: 1,
  },

  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  roundButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 21,
    backgroundColor: '#EEF2E9',
  },

  roundButtonPressed: {
    opacity: 0.75,
    transform: [{scale: 0.95}],
  },

  pageTitle: {
    marginTop: 10,
    color: '#173D30',
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
    borderColor: '#E0E4D9',
    borderRadius: 20,
    backgroundColor: '#FBF8F1',
  },

  heroImage: {
    borderRadius: 20,
  },

  heroCopy: {
    width: '58%',
    paddingLeft: 28,
  },

  heroTitle: {
    color: '#174A37',
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
  },

  heroSubtitle: {
    marginTop: 7,
    color: '#51635A',
    fontSize: 11.5,
    lineHeight: 16,
  },

  card: {
    borderWidth: 1,
    borderColor: '#E8E2DA',
    borderRadius: 20,
    backgroundColor: 'rgba(255,253,249,0.97)',
    padding: 12,
    shadowColor: '#736A5B',
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
    backgroundColor: '#EDF3E9',
  },

  headingCopy: {
    flex: 1,
    marginLeft: 9,
  },

  sectionTitle: {
    color: '#23513F',
    fontFamily: 'serif',
    fontSize: 15.5,
    fontWeight: '700',
  },

  sectionTitleStandalone: {
    color: '#23513F',
    fontFamily: 'serif',
    fontSize: 14,
    fontWeight: '700',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: '#727C77',
    fontSize: 10.5,
    lineHeight: 14,
  },

  optional: {
    fontFamily: undefined,
    fontSize: 9.5,
    fontWeight: '400',
  },

  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  symptomChip: {
    width: '48.5%',
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E1D9',
    borderRadius: 20,
    backgroundColor: '#FBF9F5',
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#254E3E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },

  symptomChipSmall: {
    minHeight: 64,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  symptomChipActive: {
    borderColor: ACTIVE_GREEN,
    backgroundColor: ACTIVE_GREEN,
    shadowColor: ACTIVE_GREEN,
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  symptomIconContainer: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#EDF3EC',
  },

  symptomIconContainerSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  symptomIconContainerActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  customSymptomIcon: {
    width: 23,
    height: 23,
  },

  symptomText: {
    flex: 1,
    flexShrink: 1,
    marginHorizontal: 8,
    color: '#315344',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },

  symptomTextSmall: {
    marginHorizontal: 6,
    fontSize: 10,
    lineHeight: 13,
  },

  symptomTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  selectionIndicator: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9E2DC',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },

  selectionIndicatorActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#EAF3ED',
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
    borderColor: '#E2E5DE',
    borderRadius: 18,
    backgroundColor: '#FBFAF7',
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: '#315344',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  intensityCardActive: {
    borderColor: '#78A58F',
    backgroundColor: '#EAF4ED',
    shadowColor: ACTIVE_GREEN,
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
    backgroundColor: '#EDF3EE',
  },

  intensityIconWrapActive: {
    backgroundColor: ACTIVE_GREEN,
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
    color: '#294E3F',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },

  intensityLabelActive: {
    color: ACTIVE_GREEN,
  },

  intensityDescription: {
    marginTop: 4,
    color: '#748078',
    fontSize: 10.5,
    lineHeight: 14,
  },

  intensityDescriptionActive: {
    color: '#4F6D60',
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
    backgroundColor: '#D9DFDB',
  },

  intensityLevelBarFilled: {
    backgroundColor: '#88B09B',
  },

  intensityLevelBarActive: {
    backgroundColor: ACTIVE_GREEN,
  },

  intensityRadio: {
    width: 24,
    height: 24,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C9D3CD',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  intensityRadioActive: {
    borderColor: ACTIVE_GREEN,
  },

  locationPanel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E7E2DA',
    borderRadius: 22,
    backgroundColor: '#FBFAF6',
    padding: 12,
  },

  locationVisual: {
    width: '100%',
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#F1F6F1',
  },

  bodyMapGlowLarge: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(73, 135, 102, 0.10)',
  },

  bodyMapImageModern: {
    width: '85%',
    height: 210,
    maxWidth: 210,
  },

  locationFocusGlow: {
    position: 'absolute',
    backgroundColor: '#F19AA4',
    shadowColor: '#E37D89',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 3,
  },

  selectedLocationBadge: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#DCE8DF',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },

  selectedLocationText: {
    flexShrink: 1,
    color: '#24523F',
    fontSize: 12,
    fontWeight: '700',
  },

  locationOptionsModern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 12,
  },

  locationChoice: {
    width: '48.5%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E4DE',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 8,
  },

  locationChoiceSmall: {
    width: '100%',
  },

  locationChoiceActive: {
    borderColor: '#75A78D',
    backgroundColor: '#EAF4ED',
    shadowColor: ACTIVE_GREEN,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },

  locationChoiceIcon: {
    width: 34,
    height: 34,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#F1F4F0',
  },

  locationChoiceIconActive: {
    backgroundColor: '#FFFFFF',
  },

  locationChoiceText: {
    flex: 1,
    flexShrink: 1,
    marginHorizontal: 8,
    color: '#405A4E',
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '600',
  },

  locationChoiceTextActive: {
    color: '#1D654C',
    fontWeight: '700',
  },

  locationRadio: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C9D2CC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  locationRadioActive: {
    borderColor: ACTIVE_GREEN,
  },

  locationRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACTIVE_GREEN,
  },

  noteBox: {
    minHeight: 120,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2DDD6',
    borderRadius: 13,
    backgroundColor: '#FBF9F6',
  },

  noteInput: {
    flex: 1,
    padding: 10,
    paddingBottom: 20,
    color: '#24473A',
    fontSize: 10.5,
  },

  counter: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    color: '#8B928E',
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
  backgroundColor: GREEN,
},

  saveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.8,
    transform: [{scale: 0.99}],
  },

  disabled: {
    opacity: 0.55,
  },
});
