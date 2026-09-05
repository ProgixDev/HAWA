export type MapPlace = {
  /** The provider's own stable feature id (e.g. MapTiler's "place.123"), when
   * available — the preferred React list key over any derived/composite one. */
  id?: string;
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

