import {
  MAPTILER_GEOCODING_URL,
  MAPTILER_PUBLIC_KEY,
} from '../../config/maps';
import type {MapPlace, MapProvider} from './types';

export type MapProviderErrorCode =
  | 'NOT_CONFIGURED'
  | 'NETWORK'
  | 'INVALID_KEY'
  | 'HTTP'
  | 'INVALID_RESPONSE';

export class MapProviderError extends Error {
  constructor(
    public readonly code: MapProviderErrorCode,
    public readonly status?: number,
  ) {
    super(code);
    this.name = 'MapProviderError';
  }
}

type GeocodingContext = {
  id?: string;
  text?: string;
  text_fr?: string;
  kind?: string;
  place_designation?: string;
  properties?: {kind?: string; place_designation?: string; country_code?: string};
};
type GeocodingFeature = GeocodingContext & {
  center?: [number, number];
  geometry?: {coordinates?: [number, number]};
  place_name?: string;
  place_name_fr?: string;
  place_type?: string[];
  context?: GeocodingContext[];
};
type GeocodingResponse = {features?: GeocodingFeature[]};

const configuredKey = () => {
  if (!MAPTILER_PUBLIC_KEY) {
    throw new MapProviderError('NOT_CONFIGURED');
  }
  return MAPTILER_PUBLIC_KEY;
};

const localizedText = (item?: GeocodingContext) => item?.text_fr ?? item?.text;
const itemKind = (item: GeocodingContext) => item.properties?.kind ?? item.kind;
const itemDesignation = (item: GeocodingContext) =>
  item.properties?.place_designation ?? item.place_designation;
const byPrefix = (items: GeocodingContext[], prefix: string) =>
  items.find(item => item.id?.startsWith(prefix));

const cityText = (feature: GeocodingFeature) => {
  const items = [feature, ...(feature.context ?? [])];
  const virtualPlace = items.find(item =>
    item.id?.startsWith('place.') && itemKind(item) === 'virtual_place',
  );
  const segmentedVirtualPlace = localizedText(virtualPlace)?.includes('/')
    ? localizedText(virtualPlace)?.split('/').at(-1)?.trim()
    : undefined;
  const namedCity = items.find(item =>
    ['city', 'town', 'village'].includes(itemDesignation(item) ?? ''),
  );
  const realPlace = items.find(item =>
    /^(place|locality)\./.test(item.id ?? '') && itemKind(item) !== 'virtual_place',
  );
  const administrativeFallback =
    byPrefix(items, 'county.') ??
    byPrefix(items, 'region.') ??
    byPrefix(items, 'municipality.');
  return segmentedVirtualPlace ??
    localizedText(realPlace ?? namedCity ?? administrativeFallback ?? virtualPlace);
};

const countryText = (feature: GeocodingFeature) => {
  const items = [feature, ...(feature.context ?? [])];
  return localizedText(byPrefix(items, 'country.'));
};

const toPlace = (feature: GeocodingFeature): MapPlace | null => {
  const coordinates = feature.center ?? feature.geometry?.coordinates;
  const [longitude, latitude] = coordinates ?? [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const city = cityText(feature);
  const country = countryText(feature);
  if (!city || !country) {
    return null;
  }

  return {
    city,
    country,
    latitude: latitude as number,
    longitude: longitude as number,
    displayName: feature.place_name_fr ?? feature.place_name,
  };
};

const fetchGeocoding = async (
  path: string,
  mode: 'forward' | 'reverse',
): Promise<GeocodingResponse> => {
  const forwardLimit = mode === 'forward' ? '&limit=5' : '';
  const url =
    `${MAPTILER_GEOCODING_URL}/${path}.json` +
    `?key=${encodeURIComponent(configuredKey())}&language=fr${forwardLimit}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new MapProviderError('NETWORK');
  }

  if (__DEV__ && mode === 'reverse') {
    console.log('Reverse geocoding status:', response.status);
  }
  if (!response.ok) {
    if (__DEV__) {
      console.warn('MapTiler geocoding failed:', response.status);
    }
    if (response.status === 401 || response.status === 403) {
      throw new MapProviderError('INVALID_KEY', response.status);
    }
    throw new MapProviderError('HTTP', response.status);
  }

  try {
    return (await response.json()) as GeocodingResponse;
  } catch {
    throw new MapProviderError('INVALID_RESPONSE', response.status);
  }
};

class MapTilerProvider implements MapProvider {
  async searchPlaces(query: string): Promise<MapPlace[]> {
    const encodedQuery = encodeURIComponent(query.trim());
    const data = await fetchGeocoding(encodedQuery, 'forward');
    return (data.features ?? [])
      .map(toPlace)
      .filter((place): place is MapPlace => place !== null);
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<MapPlace | null> {
    if (__DEV__) {
      console.log('Reverse geocoding coordinates:', {latitude, longitude});
    }
    const coordinatePath = `${longitude},${latitude}`;
    const data = await fetchGeocoding(coordinatePath, 'reverse');
    if (__DEV__) {
      console.log('Reverse geocoding feature count:', data.features?.length ?? 0);
    }
    return (data.features ?? []).map(toPlace).find(place => place !== null) ?? null;
  }
}

export const mapProvider: MapProvider = new MapTilerProvider();
