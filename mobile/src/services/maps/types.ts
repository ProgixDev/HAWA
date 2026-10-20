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
  /** The provider language `city` / `country` / `displayName` are written in ('fr', 'ja', …), set when the provider produced them.
   * Absent on a place of unknown origin (a location saved by an older version): LocationScreen then re-asks the provider for the
   * names in the current language, keeping the coordinates. */
  language?: string;
};

export type MapRequestOptions = {
  /** Language of the names asked for; defaults to the app language. A tag the provider does not know ('xx') is not sent. */
  language?: string | null;
  /** Aborts the HTTP request (a newer search, a language switch, leaving the screen). */
  signal?: AbortSignal;
};

export interface MapProvider {
  searchPlaces(query: string, options?: MapRequestOptions): Promise<MapPlace[]>;
  reverseGeocode(
    latitude: number,
    longitude: number,
    options?: MapRequestOptions,
  ): Promise<MapPlace | null>;
  /** The same place with its city / country / address in the requested language. The coordinates, id and timezone are never
   * changed; when the provider has no matching feature near the place (or no translation), the place is returned as it was. */
  localizePlace(place: MapPlace, options?: MapRequestOptions): Promise<MapPlace>;
}
