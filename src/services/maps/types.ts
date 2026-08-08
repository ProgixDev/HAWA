export type MapPlace = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  displayName?: string;
};

export interface MapProvider {
  searchPlaces(query: string): Promise<MapPlace[]>;
  reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<MapPlace | null>;
}

