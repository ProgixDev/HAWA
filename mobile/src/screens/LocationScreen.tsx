import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {useTranslation} from 'react-i18next';
import '../i18n';

import {IS_MAPS_CONFIGURED} from '../config/maps';
import type {RootStackParamList} from '../navigation/AppNavigator';
import {mapPlaceIdentity, mapProvider, MapProviderError} from '../services/maps/mapProvider';
import {loadMapStyle} from '../services/maps/mapStyle';
import {localizeMapStyle, mapLanguageFor} from '../services/maps/mapLanguage';
import type {MapPlace} from '../services/maps/types';
import {resolveInitialLocation} from '../services/locationInitialization';
import {getHasConfirmedCycleData, getSelectedObjective, setSelectedLocation as saveSelectedLocation} from '../state/onboardingPreferences';
import {getAppLanguage, normalizeAppLanguage} from '../state/themePreferences';
import {spacing} from '../theme/spacing';
import {useAwaTheme} from '../theme/AwaThemeProvider';
import {onPrimaryTextColor, withAlpha, type ResolvedAwaTheme} from '../theme/awaThemeTokens';
import {presentSaveFailure} from '../services/saveFailure';
import {AwaButton} from '../components/ui/AwaButton';
import {AwaCard} from '../components/ui/AwaCard';
import {AwaIconButton} from '../components/ui/AwaIconButton';
import {AwaText} from '../components/ui/AwaText';

const LOCATION_PIN = require('../assets/images/location-pin.png');
const LOCATION_TARGET = require('../assets/images/location-target.png');

type Props = NativeStackScreenProps<RootStackParamList, 'Location'>;
type Feedback = {kind: 'error' | 'info'; text: string} | null;

const geocodingErrorMessage = (error: unknown, t: (key: string) => string) => {
  if (!(error instanceof MapProviderError)) {
    return t('location.errors.generic');
  }
  if (error.code === 'NOT_CONFIGURED') {
    return t('location.errors.notConfigured');
  }
  if (error.code === 'NETWORK') {
    return t('location.errors.network');
  }
  if (error.code === 'INVALID_KEY') {
    return t('location.errors.invalidKey');
  }
  return t('location.errors.generic');
};

function LocationScreen({navigation, route}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();
  const {theme} = useAwaTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const {t, i18n} = useTranslation();
  // The active AWA language (not the Android system locale) drives the map labels, the search results and every address shown here.
  const mapLanguage = mapLanguageFor(normalizeAppLanguage(i18n.language) ?? getAppLanguage());
  const cameraRef = useRef<CameraRef>(null);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reverseRequest = useRef(0);
  // Guards against a race: if she searches, drags the map, or taps the GPS
  // button WHILE the initial suggestion is still resolving (saved location/
  // country detection can take a moment), that explicit choice must win —
  // the resolution effect below checks this before applying its result, so
  // it can never silently overwrite a location she already chose herself.
  const userChangedLocation = useRef(false);

  // Onboarding (default, unchanged behavior) vs. edit — reached from
  // PrayerTimesScreen.tsx's "Modifier" location pill so she can update her
  // saved location without re-entering onboarding. Same screen, same
  // canonical onboardingPreferences location store — only the post-save
  // destination differs.
  const mode = route.params?.mode ?? 'onboarding';
  const isEdit = mode === 'edit';

  // The map's initial camera position: resolved once, asynchronously, by
  // resolveInitialLocation() (saved location, else always the neutral
  // London default — IP/country detection is deliberately never consulted;
  // see that module's header comment).
  // Deliberately starts `null` and stays null until resolution completes, so
  // the map/camera are never mounted with a wrong default center — see the
  // render below, where the map card waits on this exactly like it already
  // waits on `mapStyle`. This is what prevents the previous behavior where
  // every user, worldwide, briefly or permanently saw Algiers.
  const [initialCenter, setInitialCenter] = useState<[number, number]>();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MapPlace[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MapPlace | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  // Doubles as "resolving the initial suggestion" (mount) and "reverse-
  // geocoding a map interaction" (later) — both are the same "figuring out
  // what location to show" state from the user's point of view, and both
  // already render as the existing "Recherche du lieu…" location-card text,
  // so no new UI/state is needed for the initial-resolution case.
  const [resolving, setResolving] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  // The style as downloaded (English labels) — downloaded once; the labels follow the app language through localizeMapStyle().
  const [baseMapStyle, setBaseMapStyle] = useState<StyleSpecification>();
  const mapStyle = useMemo(() => (baseMapStyle ? localizeMapStyle(baseMapStyle, mapLanguage) : undefined), [baseMapStyle, mapLanguage]);
  // True while the names of the selected place are being re-asked in the current language (see the effect below).
  const [localizing, setLocalizing] = useState(false);
  const [mapStyleFailed, setMapStyleFailed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(
    IS_MAPS_CONFIGURED
      ? null
      : {kind: 'info', text: t('location.mapsNotConfigured')},
  );

  useEffect(() => {
    let cancelled = false;
    resolveInitialLocation().then(location => {
      if (cancelled) {return;}
      // A late-arriving initial suggestion must never overwrite a location
      // she already chose herself (search/GPS/map drag) while it was still
      // resolving — but `resolving` must still clear either way, or the
      // screen gets stuck showing the spinner forever instead of her choice.
      if (!userChangedLocation.current) {
        setSelectedLocation(location);
        setQuery(`${location.city}, ${location.country}`);
        setInitialCenter([location.longitude, location.latitude]);
      }
      setResolving(false);
    });
    return () => {cancelled = true;};
    // Runs once per mount — a saved location set later via the search box,
    // the map, or the GPS button updates `selectedLocation` directly and
    // must never be overridden by re-running this resolution.
  }, []);

  // While the names of the selected place are being re-asked in the current language, its previous names are not shown in the search
  // field or the card (they would flash English / another language on screen for a moment).
  const selectedText = selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : null;
  const displayedQuery = localizing && selectedText !== null && query === selectedText ? '' : query;

  const mapHeightStyle =
    height < 720
      ? styles.mapSmall
      : height > 880
        ? styles.mapLarge
        : styles.mapMedium;

  useEffect(() => {
    if (!IS_MAPS_CONFIGURED) {return;}
    let cancelled = false;
    const controller = new AbortController();
    loadMapStyle(controller.signal)
      .then(style => {
        if (!cancelled) {setBaseMapStyle(style);}
      })
      .catch(() => {
        if (!cancelled) {setMapStyleFailed(true);}
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    const requestId = ++reverseRequest.current;
    setResolving(true);
    setFeedback(null);
    try {
      const place = await mapProvider.reverseGeocode(latitude, longitude, {language: mapLanguage});
      if (requestId !== reverseRequest.current) {return;}
      if (place) {
        userChangedLocation.current = true;
        setSelectedLocation(place);
        setInitialCenter(current => current ?? [place.longitude, place.latitude]);
      } else {
        setSelectedLocation(null);
        setFeedback({kind: 'info', text: t('location.noCityFoundHere')});
      }
    } catch (error) {
      if (requestId !== reverseRequest.current) {return;}
      setFeedback({
        kind: 'error',
        text: geocodingErrorMessage(error, t),
      });
    } finally {
      if (requestId === reverseRequest.current) {setResolving(false);}
    }
  }, [t, mapLanguage]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!showSuggestions || trimmed.length < 2 || !IS_MAPS_CONFIGURED) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await mapProvider.searchPlaces(trimmed, {language: mapLanguage, signal: controller.signal});
        if (!cancelled) {
          setSuggestions(results.slice(0, 5));
          setFeedback(results.length ? null : {kind: 'info', text: t('location.noResultsFound')});
        }
      } catch (error) {
        if (!cancelled) {
          setSuggestions([]);
          setFeedback({kind: 'error', text: geocodingErrorMessage(error, t)});
        }
      } finally {
        if (!cancelled) {setSearching(false);}
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, showSuggestions, t, mapLanguage]);

  // LANGUAGE FOLLOWS THE APP. A place whose names are not in the current language — the neutral London default (English literals), a
  // location saved by an older version, a result picked before switching language — gets its names re-asked from the provider in
  // the current language. Only city / country / address change: the coordinates (and so the camera and the marker) never move, nothing
  // is persisted until she confirms, and if the provider has no near match or fails she keeps seeing the names she already had.
  useEffect(() => {
    if (!IS_MAPS_CONFIGURED || !mapLanguage || !selectedLocation || selectedLocation.language === mapLanguage) {
      setLocalizing(false);
      return undefined;
    }
    const place = selectedLocation;
    const controller = new AbortController();
    let cancelled = false;
    setLocalizing(true);
    mapProvider
      .localizePlace(place, {language: mapLanguage, signal: controller.signal})
      .then(localized => {
        if (cancelled || localized === place) {return;}
        setSelectedLocation(current => (current === place ? localized : current));
        setQuery(current => (current === `${place.city}, ${place.country}` ? `${localized.city}, ${localized.country}` : current));
      })
      .catch(() => {
        // offline / provider error / aborted: keep the names she already sees
      })
      .finally(() => {
        if (!cancelled) {setLocalizing(false);}
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [mapLanguage, selectedLocation]);

  useEffect(() => () => {
    if (reverseTimer.current) {clearTimeout(reverseTimer.current);}
  }, []);

  const moveTo = (place: MapPlace) => {
    userChangedLocation.current = true;
    setSelectedLocation(place);
    setQuery(`${place.city}, ${place.country}`);
    setShowSuggestions(false);
    setInitialCenter(current => current ?? [place.longitude, place.latitude]);
    // A search result already carries its own resolved city/country — never
    // leave the screen stuck on the "Finding your location…" spinner (from
    // the still-pending initial resolution) after this explicit choice.
    setResolving(false);
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
        title: t('location.gps.permissionTitle'),
        message: t('location.gps.permissionMessage'),
        buttonPositive: t('location.gps.permissionAllow'),
        buttonNegative: t('location.gps.permissionDeny'),
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const useCurrentLocation = async () => {
    if (!IS_MAPS_CONFIGURED) {
      setFeedback({kind: 'info', text: t('location.gps.configureMapKeyFirst')});
      return;
    }
    setLocating(true);
    setFeedback(null);
    const granted = await requestLocationPermission();
    if (!granted) {
      setLocating(false);
      setFeedback({kind: 'error', text: t('location.gps.permissionDeniedError')});
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
        setFeedback({kind: 'error', text: t('location.gps.positionUnavailable')});
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleNext = async () => {
    if (!selectedLocation) {return;}
    try {
      await saveSelectedLocation(selectedLocation);
    } catch (saveError) {
      // Not persisted (services/saveFailure.ts): stay here with the chosen place intact, no navigation.
      presentSaveFailure(saveError);
      return;
    }
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
    if (objective === 'irregular') {
      // SOPK / Cycles irréguliers has its own dedicated 4-step onboarding
      // (cycle pattern/last period/tracked items/reminders) — the generic
      // Cycle regularity question in CycleInformationScreen doesn't apply
      // here, so it deliberately skips it, the same way Menopause/
      // Contraception do above. Before this branch existed, 'irregular' fell
      // through to the CycleInformation fallthrough below.
      navigation.navigate('IrregularCyclePattern');
      return;
    }
    navigation.navigate('CycleInformation');
  };

  return (
    <LinearGradient
      colors={[...theme.gradients.pageBackground]}
      locations={[0, 0.32, 0.7, 1]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.background}>

      <StatusBar backgroundColor="transparent" barStyle={theme.statusBarStyle} translucent />
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
          <AwaIconButton
            accessibilityLabel={t('location.back')}
            icon="arrow-left"
            onPress={navigation.goBack}
            style={styles.backButton}
          />

          <View style={styles.header}>
            <AwaText accessibilityRole="header" style={styles.title} variant="headlineMedium">{t('location.title')}</AwaText>
            <AwaText colorRole="onSurfaceVariant" style={styles.subtitle} variant="bodyMedium">{t('location.subtitle')}</AwaText>
          </View>

          <View style={styles.searchArea}>
            <View style={styles.searchBox}>
              <MaterialDesignIcons color={theme.colors.textSecondary} name="magnify" size={22} />
              <TextInput
                accessibilityLabel={t('location.searchPlaceholder')}
                autoCorrect={false}
                onChangeText={value => {
                  setQuery(value);
                  setSelectedLocation(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={t('location.searchPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                returnKeyType="search"
                style={styles.input}
                value={displayedQuery}
              />
              {searching ? <ActivityIndicator color={theme.colors.primary} size="small" /> : null}
              <Pressable accessibilityLabel={t('location.useMyLocation')} hitSlop={12} onPress={useCurrentLocation}>
                {locating ? (
                  <ActivityIndicator color={theme.colors.primary} size="small" />
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
                      <Text numberOfLines={2} style={styles.suggestionTitle}>{place.city}, {place.country}</Text>
                      {place.displayName ? <Text numberOfLines={1} style={styles.suggestionDetail}>{place.displayName}</Text> : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={[styles.mapCard, mapHeightStyle]}>
            {IS_MAPS_CONFIGURED && mapStyle && initialCenter ? (
              <>
                <MapLibreMap
                  attribution
                  compass
                  logo={false}
                  mapStyle={mapStyle}
                  onRegionDidChange={handleMapIdle}
                  style={styles.map}>
                  <Camera ref={cameraRef} initialViewState={{center: initialCenter, zoom: 11}} />
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
                  <ActivityIndicator color={theme.colors.primary} size="large" />
                ) : (
                  <MaterialDesignIcons name="map-outline" size={42} color={theme.colors.primary} />
                )}
                <AwaText style={styles.mapUnavailableTitle} variant="titleMedium">
                  {IS_MAPS_CONFIGURED && !mapStyleFailed ? t('location.map.loading') : t('location.map.unavailable')}
                </AwaText>
                <AwaText colorRole="onSurfaceVariant" style={styles.mapUnavailableText} variant="bodySmall">
                  {IS_MAPS_CONFIGURED ? t('location.map.checkConnection') : t('location.map.addKey')}
                </AwaText>
              </View>
            )}
          </View>

          <AwaCard padding="compact" style={styles.locationCard} variant="filled">
            <Image source={LOCATION_PIN} style={styles.locationPin} />
            <View style={styles.locationCopy}>
              <AwaText variant="titleMedium">
                {resolving || localizing ? t('location.resolvingLocation') : selectedText ?? t('location.noPositionSelected')}
              </AwaText>
              <AwaText colorRole="onSurfaceVariant" style={styles.locationHint} variant="bodySmall">{selectedLocation?.timezone ?? t('location.positionSelectedOnMap')}</AwaText>
            </View>
            {resolving || localizing ? <ActivityIndicator color={theme.colors.primary} size="small" /> : selectedLocation ? (
              <View style={styles.checkCircle}><MaterialDesignIcons color={onPrimaryTextColor(theme)} name="check" size={16} /></View>
            ) : null}
          </AwaCard>

          {feedback ? (
            <AwaText
              colorRole={feedback.kind === 'error' ? 'error' : 'onSurfaceVariant'}
              style={feedback.kind === 'error' ? styles.errorText : styles.infoText}
              variant="bodySmall">
              {feedback.text}
            </AwaText>
          ) : null}

          <AwaButton
            disabled={!selectedLocation}
            fullWidth
            label={isEdit ? t('location.save') : t('location.next')}
            onPress={handleNext}
            size="large"
            style={styles.nextButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function createStyles(theme: ResolvedAwaTheme) {
  return StyleSheet.create({
    flex: {flex: 1},
    background: {flex: 1, backgroundColor: theme.colors.background},




    content: {flexGrow: 1, paddingHorizontal: spacing.lg},
    contentNotched: {paddingTop: 8},
    contentRegular: {paddingTop: 18},
    contentBottomNotched: {paddingBottom: 10},
    contentBottomRegular: {paddingBottom: 18},
    backButton: {alignSelf: 'flex-start'},
    header: {alignItems: 'center', marginTop: 4, marginBottom: 16},
    title: {textAlign: 'center'},
    subtitle: {maxWidth: 330, marginTop: 4, textAlign: 'center'},
    searchArea: {zIndex: 10},
    searchBox: {minHeight: 50, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, backgroundColor: withAlpha(theme.colors.surface, 0.95), paddingHorizontal: 16, gap: 8},
    input: {flex: 1, minWidth: 0, minHeight: 50, color: theme.colors.text, fontSize: 14},
    targetImage: {width: 26, height: 26},
    suggestions: {position: 'absolute', top: 54, right: 0, left: 0, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.surface, elevation: 6},
    suggestion: {minHeight: 50, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, paddingHorizontal: 16, gap: 10},
    suggestionPin: {width: 18, height: 22},
    suggestionTitle: {color: theme.colors.text, fontSize: 14, fontWeight: '600'},
    suggestionDetail: {marginTop: 2, color: theme.colors.textSecondary, fontSize: 12},
    mapCard: {overflow: 'hidden', marginTop: 12, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, backgroundColor: theme.colors.primarySoft, elevation: 4},
    mapSmall: {height: 260},
    mapMedium: {height: 300},
    mapLarge: {height: 340},
    map: {flex: 1},
    centerMarker: {position: 'absolute', top: '50%', left: '50%', alignItems: 'center', transform: [{translateX: -18}, {translateY: -38}]},
    centerMarkerImage: {width: 36, height: 44},
    markerShadow: {width: 18, height: 5, marginTop: -3, borderRadius: 9, backgroundColor: withAlpha(theme.colors.primary, 0.2)},
    mapUnavailable: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28},
    mapUnavailableTitle: {marginTop: 8, textAlign: 'center'},
    mapUnavailableText: {marginTop: 4, textAlign: 'center'},
    locationCard: {minHeight: 64, flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16},
    locationPin: {width: 25, height: 30},
    locationCopy: {flex: 1, minWidth: 0, marginHorizontal: 12},
    locationHint: {marginTop: 2},
    checkCircle: {width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: theme.colors.primary},
    errorText: {marginTop: 8, textAlign: 'center'},
    infoText: {marginTop: 8, textAlign: 'center'},
    nextButton: {marginTop: 16},
  });
}

export default LocationScreen;
