import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type NativeSyntheticEvent,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {
  Camera,
  Map as MapLibreMap,
  UserLocation,
  type CameraRef,
  type StyleSpecification,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import {MaterialDesignIcons} from '@react-native-vector-icons/material-design-icons';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import {IS_MAPS_CONFIGURED} from '../config/maps';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {mapPlaceIdentity, mapProvider, MapProviderError} from '../services/maps/mapProvider';
import {loadMapStyle} from '../services/maps/mapStyle';
import type {MapPlace} from '../services/maps/types';
import {getHasConfirmedCycleData, getSelectedLocation, getSelectedObjective, setSelectedLocation as saveSelectedLocation} from '../state/onboardingPreferences';
import {spacing} from '../theme/spacing';

const LOCATION_PIN = require('../assets/images/location-pin.png');
const LOCATION_TARGET = require('../assets/images/location-target.png');
const FALLBACK_CENTER: [number, number] = [3.0588, 36.7538];

type Props = NativeStackScreenProps<RootStackParamList, 'Location'>;
type Feedback = {kind: 'error' | 'info'; text: string} | null;

const geocodingErrorMessage = (error: unknown) => {
  if (!(error instanceof MapProviderError)) {
    return 'Impossible d’identifier ce lieu pour le moment.';
  }
  if (error.code === 'NOT_CONFIGURED') {
    return 'La clé cartographique doit être configurée.';
  }
  if (error.code === 'NETWORK') {
    return 'Connexion Internet indisponible.';
  }
  if (error.code === 'INVALID_KEY') {
    return 'La clé MapTiler est invalide ou non autorisée.';
  }
  return 'Impossible d’identifier ce lieu pour le moment.';
};

function LocationScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const cameraRef = useRef<CameraRef>(null);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reverseRequest = useRef(0);

  // Onboarding (default, unchanged behavior) vs. edit — reached from
  // PrayerTimesScreen.tsx's "Modifier" location pill so she can update her
  // saved location without re-entering onboarding. Same screen, same
  // canonical onboardingPreferences location store — only the post-save
  // destination differs.
  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  // Prefills whatever location is already saved (regardless of mode) — a
  // form should never blank out a real, previously-entered value. A
  // brand-new user with nothing saved yet still sees the normal empty state,
  // since getSelectedLocation() returns null until she's ever chosen one.
  const initialLocation = getSelectedLocation();
  const [query, setQuery] = useState(
    initialLocation ? `${initialLocation.city}, ${initialLocation.country}` : '',
  );
  const [suggestions, setSuggestions] = useState<MapPlace[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapPlace | null>(initialLocation);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [mapStyle, setMapStyle] = useState<StyleSpecification>();
  const [mapStyleFailed, setMapStyleFailed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(
    IS_MAPS_CONFIGURED
      ? null
      : {kind: 'info', text: 'Configure la clé cartographique pour activer la carte.'},
  );

  const mapHeightStyle =
    height < 720
      ? styles.mapSmall
      : height > 880
        ? styles.mapLarge
        : styles.mapMedium;

  useEffect(() => {
    if (!IS_MAPS_CONFIGURED) {return;}
    let cancelled = false;
    loadMapStyle()
      .then(style => {
        if (!cancelled) {setMapStyle(style);}
      })
      .catch(() => {
        if (!cancelled) {setMapStyleFailed(true);}
      });
    return () => {cancelled = true;};
  }, []);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    const requestId = ++reverseRequest.current;
    setResolving(true);
    setFeedback(null);
    try {
      const place = await mapProvider.reverseGeocode(latitude, longitude);
      if (requestId !== reverseRequest.current) {return;}
      if (place) {
        setSelectedLocation(place);
      } else {
        setSelectedLocation(null);
        setFeedback({kind: 'info', text: 'Aucune ville trouvée à cet endroit.'});
      }
    } catch (error) {
      if (requestId !== reverseRequest.current) {return;}
      setFeedback({
        kind: 'error',
        text: geocodingErrorMessage(error),
      });
    } finally {
      if (requestId === reverseRequest.current) {setResolving(false);}
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!showSuggestions || trimmed.length < 2 || !IS_MAPS_CONFIGURED) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await mapProvider.searchPlaces(trimmed);
        if (!cancelled) {
          setSuggestions(results.slice(0, 5));
          setFeedback(results.length ? null : {kind: 'info', text: 'Aucun résultat trouvé.'});
        }
      } catch (error) {
        if (!cancelled) {
          setSuggestions([]);
          setFeedback({kind: 'error', text: geocodingErrorMessage(error)});
        }
      } finally {
        if (!cancelled) {setSearching(false);}
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, showSuggestions]);

  useEffect(() => () => {
    if (reverseTimer.current) {clearTimeout(reverseTimer.current);}
  }, []);

  const moveTo = (place: MapPlace) => {
    setSelectedLocation(place);
    setQuery(`${place.city}, ${place.country}`);
    setShowSuggestions(false);
    Keyboard.dismiss();
    cameraRef.current?.easeTo({
      center: [place.longitude, place.latitude],
      zoom: 12,
      duration: 700,
    });
  };

  const handleMapIdle = (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    if (!IS_MAPS_CONFIGURED || !event.nativeEvent.userInteraction) {return;}
    const [longitude, latitude] = event.nativeEvent.center;
    if (reverseTimer.current) {clearTimeout(reverseTimer.current);}
    reverseTimer.current = setTimeout(() => reverseGeocode(latitude, longitude), 550);
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      return new Promise<boolean>(resolve => {
        Geolocation.requestAuthorization(
          () => resolve(true),
          () => resolve(false),
        );
      });
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Autoriser la localisation',
        message: 'AWA utilise ta position pour sélectionner précisément ta ville.',
        buttonPositive: 'Autoriser',
        buttonNegative: 'Refuser',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const useCurrentLocation = async () => {
    if (!IS_MAPS_CONFIGURED) {
      setFeedback({kind: 'info', text: 'Configure d’abord la clé cartographique.'});
      return;
    }
    setLocating(true);
    setFeedback(null);
    const granted = await requestLocationPermission();
    if (!granted) {
      setLocating(false);
      setFeedback({kind: 'error', text: 'Autorise la localisation dans les réglages pour utiliser ta position.'});
      return;
    }
    setLocationPermission(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        cameraRef.current?.easeTo({center: [longitude, latitude], zoom: 13, duration: 700});
        reverseGeocode(latitude, longitude).finally(() => setLocating(false));
      },
      () => {
        setLocating(false);
        setFeedback({kind: 'error', text: 'Position indisponible. Vérifie que le GPS est activé.'});
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleNext = async () => {
    if (!selectedLocation) {return;}
    await saveSelectedLocation(selectedLocation);
    // Edit mode (opened from PrayerTimesScreen.tsx) just updates the saved
    // location and returns — active objective is irrelevant here, and this
    // must never continue into onboarding regardless of which objective is
    // active. PrayerTimesScreen.tsx already refreshes on focus via its
    // existing hydrate/subscribe architecture, so goBack() alone is enough.
    if (isEdit) {
      navigation.goBack();
      return;
    }
    // Pregnancy, Postpartum and "Après une fausse couche" each replace the
    // Cycle-specific "Informations de ton cycle" step with their own
    // objective-specific step — every other objective (including Cycle)
    // keeps the existing flow.
    const objective = getSelectedObjective();
    if (objective === 'pregnancy') {
      navigation.navigate('PregnancyDatingSetup');
      return;
    }
    if (objective === 'postpartum') {
      navigation.navigate('PostpartumDeliveryDate');
      return;
    }
    if (objective === 'loss') {
      navigation.navigate('MiscarriageDate');
      return;
    }
    if (objective === 'conceive') {
      // A brand-new TTC user with no confirmed cycle baseline goes through
      // the same CycleInformationScreen every other objective without a
      // dedicated dating step uses (see the fallthrough below) before
      // reaching the TTC-specific onboarding — TTC must never compute
      // "Jour X"/fertile window/ovulation from the hardcoded fallback and
      // present it as personalized. An existing user who already confirmed
      // real cycle data (e.g. re-running onboarding) skips straight ahead,
      // exactly as before, so she's never asked twice.
      navigation.navigate(getHasConfirmedCycleData() ? 'ConceptionTryingDuration' : 'CycleInformation');
      return;
    }
    if (objective === 'contraception') {
      // Contraception has its own dedicated onboarding branch (method/
      // information/reminders) — it deliberately does NOT go through
      // CycleInformationScreen (period-length/regularity data isn't part of
      // the Contraception cahier des charges). SOPK is unaffected and keeps
      // using the CycleInformation fallthrough below.
      navigation.navigate('ContraceptionMethod');
      return;
    }
    if (objective === 'menopause') {
      // Post-ménopause / Ménopause has its own dedicated 4-step onboarding
      // (stage/symptoms/hormonal treatment/lab tracking) — period-length/
      // regularity data isn't part of that flow, so it deliberately skips
      // CycleInformationScreen, the same way Contraception does above.
      navigation.navigate('MenopauseStage');
      return;
    }
    navigation.navigate('CycleInformation');
  };

  return (
    <LinearGradient
      colors={['#FAF8FD', '#F4EFFA', '#EEE7F7', '#E9E1F3']}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>
      <View pointerEvents="none" style={styles.pageBackgroundDecor}>
        <View style={styles.pageGlowTop} />
        <View style={styles.pageGlowMiddle} />
        <View style={styles.pageGlowBottom} />
      </View>

      <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            insets.top > 30 ? styles.contentNotched : styles.contentRegular,
            insets.bottom > 20 ? styles.contentBottomNotched : styles.contentBottomRegular,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable accessibilityLabel="Retour" hitSlop={12} onPress={navigation.goBack} style={styles.backButton}>
            <MaterialDesignIcons name="arrow-left" size={25} color="#6949BE" />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Où te trouves-tu ?</Text>
            <Text style={styles.subtitle}>Active ta localisation pour des horaires de prière et des rappels précis.</Text>
          </View>

          <View style={styles.searchArea}>
            <View style={styles.searchBox}>
              <MaterialDesignIcons color="#796A9D" name="magnify" size={22} />
              <TextInput
                accessibilityLabel="Rechercher une ville"
                autoCorrect={false}
                onChangeText={value => {
                  setQuery(value);
                  setSelectedLocation(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Rechercher une ville"
                placeholderTextColor="#968AAE"
                returnKeyType="search"
                style={styles.input}
                value={query}
              />
              {searching ? <ActivityIndicator color="#6949BE" size="small" /> : null}
              <Pressable accessibilityLabel="Utiliser ma position" hitSlop={10} onPress={useCurrentLocation}>
                {locating ? (
                  <ActivityIndicator color="#6949BE" size="small" />
                ) : (
                  <Image source={LOCATION_TARGET} style={styles.targetImage} />
                )}
              </Pressable>
            </View>
            {showSuggestions && suggestions.length > 0 ? (
              <View style={styles.suggestions}>
                {suggestions.map(place => (
                  <Pressable
                    key={mapPlaceIdentity(place)}
                    onPress={() => moveTo(place)}
                    style={styles.suggestion}>
                    <Image source={LOCATION_PIN} style={styles.suggestionPin} />
                    <View style={styles.flex}>
                      <Text numberOfLines={1} style={styles.suggestionTitle}>{place.city}, {place.country}</Text>
                      {place.displayName ? <Text numberOfLines={1} style={styles.suggestionDetail}>{place.displayName}</Text> : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={[styles.mapCard, mapHeightStyle]}>
            {IS_MAPS_CONFIGURED && mapStyle ? (
              <>
                <MapLibreMap
                  attribution
                  compass
                  logo={false}
                  mapStyle={mapStyle}
                  onRegionDidChange={handleMapIdle}
                  style={styles.map}>
                  <Camera ref={cameraRef} initialViewState={{center: FALLBACK_CENTER, zoom: 11}} />
                  {locationPermission ? <UserLocation animated /> : null}
                </MapLibreMap>
                <View pointerEvents="none" style={styles.centerMarker}>
                  <Image source={LOCATION_PIN} style={styles.centerMarkerImage} />
                  <View style={styles.markerShadow} />
                </View>
              </>
            ) : (
              <View style={styles.mapUnavailable}>
                {IS_MAPS_CONFIGURED && !mapStyleFailed ? (
                  <ActivityIndicator color="#6949BE" size="large" />
                ) : (
                  <MaterialDesignIcons name="map-outline" size={42} color="#8067C8" />
                )}
                <Text style={styles.mapUnavailableTitle}>
                  {IS_MAPS_CONFIGURED && !mapStyleFailed ? 'Chargement de la carte…' : 'Carte indisponible'}
                </Text>
                <Text style={styles.mapUnavailableText}>
                  {IS_MAPS_CONFIGURED ? 'Vérifie ta connexion et la configuration MapTiler.' : 'Ajoute la clé publique MapTiler dans src/config/maps.ts.'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.locationCard}>
            <Image source={LOCATION_PIN} style={styles.locationPin} />
            <View style={styles.locationCopy}>
              <Text numberOfLines={1} style={styles.locationText}>
                {resolving ? 'Recherche du lieu…' : selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Position non sélectionnée'}
              </Text>
              <Text style={styles.locationHint}>{selectedLocation?.timezone ?? 'Position sélectionnée sur la carte'}</Text>
            </View>
            {resolving ? <ActivityIndicator color="#6949BE" size="small" /> : selectedLocation ? (
              <View style={styles.checkCircle}><MaterialDesignIcons color="#FFFFFF" name="check" size={16} /></View>
            ) : null}
          </View>

          {feedback ? <Text style={feedback.kind === 'error' ? styles.errorText : styles.infoText}>{feedback.text}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: !selectedLocation}}
            disabled={!selectedLocation}
            onPress={handleNext}
            style={({pressed}) => [styles.nextButton, !selectedLocation && styles.nextButtonDisabled, pressed && styles.pressed]}>
            <Text style={styles.nextText}>{isEdit ? 'Enregistrer' : 'Suivant'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  background: {flex: 1, backgroundColor: '#F2ECF8'},

  pageBackgroundDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  pageGlowTop: {
    position: 'absolute',
    top: -150,
    right: -110,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(111, 82, 170, 0.07)',
  },

  pageGlowMiddle: {
    position: 'absolute',
    top: '38%',
    left: -130,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 112, 188, 0.045)',
  },

  pageGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: 'rgba(92, 67, 139, 0.05)',
  },
  content: {flexGrow: 1, paddingHorizontal: spacing.lg},
  contentNotched: {paddingTop: 8},
  contentRegular: {paddingTop: 18},
  contentBottomNotched: {paddingBottom: 10},
  contentBottomRegular: {paddingBottom: 18},
  backButton: {width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.88)', elevation: 3},
  header: {alignItems: 'center', marginTop: 4, marginBottom: 14},
  title: {color: '#28166F', fontFamily: 'serif', fontSize: 28, fontWeight: '700', lineHeight: 34, textAlign: 'center'},
  subtitle: {maxWidth: 330, marginTop: 5, color: '#655A8D', fontSize: 13, lineHeight: 18, textAlign: 'center'},
  searchArea: {zIndex: 10},
  searchBox: {minHeight: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D9C9EF', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 13, gap: 8},
  input: {flex: 1, minWidth: 0, height: 50, color: '#2A2050', fontSize: 14},
  targetImage: {width: 26, height: 26},
  suggestions: {position: 'absolute', top: 54, right: 0, left: 0, overflow: 'hidden', borderWidth: 1, borderColor: '#D9C9EF', borderRadius: 14, backgroundColor: '#FFFFFF', elevation: 9},
  suggestion: {minHeight: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E9DFF5', paddingHorizontal: 12, gap: 10},
  suggestionPin: {width: 18, height: 22},
  suggestionTitle: {color: '#2A2050', fontSize: 14, fontWeight: '600'},
  suggestionDetail: {marginTop: 2, color: '#7D7198', fontSize: 11},
  mapCard: {overflow: 'hidden', marginTop: 12, borderWidth: 1, borderColor: '#DCCCF1', borderRadius: 22, backgroundColor: '#EEE5FA', elevation: 4},
  mapSmall: {height: 260},
  mapMedium: {height: 300},
  mapLarge: {height: 340},
  map: {flex: 1},
  centerMarker: {position: 'absolute', top: '50%', left: '50%', alignItems: 'center', transform: [{translateX: -18}, {translateY: -38}]},
  centerMarkerImage: {width: 36, height: 44},
  markerShadow: {width: 18, height: 5, marginTop: -3, borderRadius: 9, backgroundColor: 'rgba(45,24,90,0.20)'},
  mapUnavailable: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28},
  mapUnavailableTitle: {marginTop: 8, color: '#39226F', fontSize: 16, fontWeight: '700'},
  mapUnavailableText: {marginTop: 5, color: '#756A90', fontSize: 12, lineHeight: 17, textAlign: 'center'},
  locationCard: {minHeight: 66, flexDirection: 'row', alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#D9C9EF', borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14},
  locationPin: {width: 25, height: 30},
  locationCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
  locationText: {color: '#2A2050', fontSize: 15, fontWeight: '600'},
  locationHint: {marginTop: 2, color: '#756A90', fontSize: 11},
  checkCircle: {width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#6949BE'},
  errorText: {marginTop: 7, color: '#A83E63', fontSize: 12, lineHeight: 17, textAlign: 'center'},
  infoText: {marginTop: 7, color: '#6E5B94', fontSize: 12, lineHeight: 17, textAlign: 'center'},
  nextButton: {minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderRadius: 17, backgroundColor: '#6949BE', shadowColor: '#4E319A', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.22, shadowRadius: 8, elevation: 4},
  nextButtonDisabled: {backgroundColor: '#B7A9CF', elevation: 0, shadowOpacity: 0},
  nextText: {color: '#FFFFFF', fontSize: 17, fontWeight: '600'},
  pressed: {opacity: 0.82},
});

export default LocationScreen;
