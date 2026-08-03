import React, {useState} from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {locations, type SelectedLocation} from '../data/locations';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {setSelectedLocation as saveSelectedLocation} from '../state/onboardingPreferences';

const LOCATION_BACKGROUND = require('../assets/images/location-background.png');
const LOCATION_PIN = require('../assets/images/location-pin.png');
const LOCATION_TARGET = require('../assets/images/location-target.png');

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');

type Props = NativeStackScreenProps<RootStackParamList, 'Location'>;

function LocationScreen({navigation}: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const normalizedQuery = normalize(query.trim());
  const suggestions =
    showSuggestions && normalizedQuery
      ? locations
          .filter(({city, country}) =>
            normalize(`${city} ${country}`).includes(normalizedQuery),
          )
          .slice(0, 5)
      : [];

  const selectLocation = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setQuery(`${location.city}, ${location.country}`);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedLocation(null);
    setShowSuggestions(true);
  };

  const applySearch = () => {
    if (suggestions[0]) {
      selectLocation(suggestions[0]);
    }
  };

  const useCurrentLocation = () => {
    // TODO: connecter la géolocalisation Android réelle plus tard.
    const alger = locations.find(location => location.city === 'Alger');
    if (alger) {
      selectLocation(alger);
    }
  };

  const handleNext = () => {
    if (!selectedLocation) {
      return;
    }
    saveSelectedLocation(selectedLocation);
    navigation.navigate('CycleInformation');
  };

  return (
    <ImageBackground
      source={LOCATION_BACKGROUND}
      resizeMode="cover"
      style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          hidden={false}
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardArea}>
          <View style={styles.content}>
              <Pressable
              accessibilityLabel="Retour"
              accessibilityRole="button"
              hitSlop={12}
              onPress={navigation.goBack}
              style={styles.backButton}>
              <MaterialDesignIcons
                color="#176548"
                name="chevron-left"
                size={30}
              />
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.title}>Où te trouves-tu ?</Text>
              <Text style={styles.subtitle}>
                {'Active ta localisation pour des horaires de prière \net des rappels précis.'}
              </Text>
            </View>

            <View style={styles.searchArea}>
              <View style={styles.searchBox}>
                <MaterialDesignIcons color="#8D9698" name="magnify" size={23} />
                <TextInput
                  accessibilityLabel="Rechercher une ville ou un pays"
                  autoCorrect={false}
                  onChangeText={handleQueryChange}
                  onFocus={() => setShowSuggestions(true)}
                  onSubmitEditing={applySearch}
                  placeholder="Rechercher une ville ou un pays"
                  placeholderTextColor="#989A98"
                  returnKeyType="search"
                  style={styles.input}
                  value={query}
                />
                <Pressable
                  accessibilityLabel="Utiliser ma position actuelle"
                  accessibilityRole="button"
                hitSlop={10}
                onPress={useCurrentLocation}>
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="contain"
                    source={LOCATION_TARGET}
                    style={styles.targetImage}
                  />
                </Pressable>
              </View>

              {suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {suggestions.map(location => (
                    <Pressable
                      key={`${location.city}-${location.country}`}
                      accessibilityLabel={`Sélectionner ${location.city}, ${location.country}`}
                      accessibilityRole="button"
                      onPress={() => selectLocation(location)}
                      style={({pressed}) => [
                        styles.suggestion,
                        pressed && styles.pressed,
                      ]}>
                      <Image
                        accessibilityIgnoresInvertColors
                        resizeMode="contain"
                        source={LOCATION_PIN}
                        style={styles.suggestionPin}
                      />
                      <View style={styles.suggestionCopy}>
                        <Text style={styles.suggestionText}>
                          {location.city}, {location.country}
                        </Text>
                        <Text style={styles.suggestionTimezone}>
                          {location.timezone}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {selectedLocation ? (
              <View style={styles.locationCard}>
                <Image
                  accessibilityIgnoresInvertColors
                  resizeMode="contain"
                  source={LOCATION_PIN}
                  style={styles.locationPin}
                />
                <View style={styles.locationCopy}>
                  <Text style={styles.locationText}>
                    {selectedLocation.city}, {selectedLocation.country}
                  </Text>
                  <Text style={styles.timezoneText}>{selectedLocation.timezone}</Text>
                </View>
                <View style={styles.checkCircle}>
                  <MaterialDesignIcons color="#FFFFFF" name="check" size={17} />
                </View>
              </View>
            ) : (
              <Text style={styles.validation}>Sélectionne une ville pour continuer.</Text>
            )}

            <View
              accessibilityLabel="Mosquée entourée de feuillage"
              style={styles.illustrationSpace}
            />

            <Pressable
              accessibilityLabel="Suivant"
              accessibilityRole="button"
              accessibilityState={{disabled: !selectedLocation}}
              disabled={!selectedLocation}
              onPress={handleNext}
              style={({pressed}) => [
                styles.nextButton,
                !selectedLocation && styles.nextButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.nextText}>Suivant</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {flex: 1, backgroundColor: colors.cream},
  safeArea: {flex: 1},
  keyboardArea: {flex: 1},
  content: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: 38,
    left: spacing.md,
    zIndex: 20,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {alignItems: 'center', marginBottom: spacing.lg},
  title: {
    color: '#083F31',
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 37,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#263031',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  searchArea: {position: 'relative', zIndex: 10},
  searchBox: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD7CA',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 252, 0.94)',
    paddingHorizontal: 13,
  },
  input: {flex: 1, height: 50, marginHorizontal: 8, color: '#172021', fontSize: 14},
  targetImage: {width: 27, height: 27},
  suggestions: {
    position: 'absolute',
    top: 54,
    right: 0,
    left: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD7CA',
    borderRadius: 14,
    backgroundColor: '#FFFEFA',
    elevation: 8,
  },
  suggestion: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E0D4',
    paddingHorizontal: 13,
  },
  suggestionCopy: {marginLeft: 9},
  suggestionPin: {width: 19, height: 22},
  suggestionText: {color: '#25302E', fontSize: 14},
  suggestionTimezone: {marginTop: 1, color: '#7B817D', fontSize: 11},
  locationCard: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1.5,
    borderColor: '#176548',
    borderRadius: 16,
    backgroundColor: 'rgba(247, 248, 240, 0.92)',
    paddingHorizontal: spacing.md,
  },
  locationCopy: {flex: 1, marginLeft: 14},
  locationPin: {width: 27, height: 32},
  locationText: {color: '#18302A', fontSize: 16, fontWeight: '500'},
  timezoneText: {marginTop: 2, color: '#66726C', fontSize: 12},
  checkCircle: {
    width: 25,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#176548',
  },
  validation: {
    minHeight: 24,
    marginTop: spacing.md,
    color: '#8A6C42',
    fontSize: 12,
    textAlign: 'center',
  },
  illustrationSpace: {
    flex: 1,
    minHeight: 230,
  },
  nextButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    borderRadius: 18,
    backgroundColor: '#176548',
    elevation: 3,
  },
  nextButtonDisabled: {backgroundColor: '#9BAFA5', elevation: 0},
  nextText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  pressed: {opacity: 0.82},
});

export default LocationScreen;
