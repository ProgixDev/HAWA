import {MapProviderError, mapProvider} from '../mapProvider';
import type {MapPlace} from '../types';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';

// The geocoder is asked for the ACTIVE AWA language (or an explicit one), only with a language the provider knows (an unknown code is an
// HTTP 400), and a place she already has can be re-asked in another language without moving. Verified against the live MapTiler API:
// `text_<lang>` / `place_name_<lang>` come back for fr en es it tr ru de zh id hi sq ja ar; a place without a translation (Chinatown,
// Camden Town) simply has `text_<lang>` equal to its own name; the by-id endpoint returns no country, so re-localizing searches the name.

const originalFetch = global.fetch;
const jsonResponse = (body: unknown) => ({ok: true, status: 200, json: async () => body}) as unknown as Response;
const feature = (id: string, center: [number, number], lang: Record<string, {city: string; country: string; full: string}>) => {
  const record: Record<string, unknown> = {
    id,
    center,
    place_name: lang.en?.full ?? 'x',
    text: lang.en?.city,
    properties: {kind: 'admin_area', place_designation: 'city'},
    context: [{id: 'country.141', text: lang.en?.country}],
  };
  for (const [code, names] of Object.entries(lang)) {
    record[`text_${code}`] = names.city;
    record[`place_name_${code}`] = names.full;
    (record.context as Array<Record<string, unknown>>)[0][`text_${code}`] = names.country;
  }
  return record;
};

const LONDON = feature('subregion.112', [-0.1278, 51.5074], {
  en: {city: 'Greater London', country: 'United Kingdom', full: 'Greater London, United Kingdom'},
  fr: {city: 'Grand Londres', country: 'Royaume-Uni', full: 'Grand Londres, Royaume-Uni'},
  sq: {city: 'Londra', country: 'Mbretëria e Bashkuar', full: 'Londra, Mbretëria e Bashkuar'},
  ja: {city: 'グレーター・ロンドン', country: 'イギリス', full: 'グレーター・ロンドン, イギリス'},
});
const LONDON_ONTARIO = feature('county.25077', [-81.2497, 42.9834], {
  en: {city: 'London', country: 'Canada', full: 'London, Ontario, Canada'},
  fr: {city: 'London', country: 'Canada', full: 'London, Ontario, Canada'},
});

const FALLBACK: MapPlace = {city: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', language: 'en'};

const urlOf = (fetchMock: jest.Mock, call = 0) => new URL(String(fetchMock.mock.calls[call][0]));

beforeEach(async () => {
  await resetAppLanguageForTests();
  await setAppLanguage('fr');
});

afterEach(async () => {
  global.fetch = originalFetch;
  await resetAppLanguageForTests();
});

describe('the language sent to the geocoder', () => {
  it.each([['fr', 'fr'], ['en', 'en'], ['es', 'es'], ['it', 'it'], ['tr', 'tr'], ['ru', 'ru'], ['de', 'de'], ['zh', 'zh'], ['id', 'id'], ['hi', 'hi'], ['sq', 'sq'], ['ja', 'ja'], ['ko', 'ko'], ['pt-PT', 'pt'], ['pt-BR', 'pt'], ['bn', 'bn']] as const)(
    'app language %s -> language=%s (search and reverse geocoding)',
    async (appLanguage, expected) => {
      await setAppLanguage(appLanguage);
      const fetchMock = jest.fn(async () => jsonResponse({features: []}));
      global.fetch = fetchMock as unknown as typeof fetch;
      await mapProvider.searchPlaces('Paris');
      await mapProvider.reverseGeocode(48.85, 2.35);
      expect(urlOf(fetchMock, 0).searchParams.get('language')).toBe(expected);
      expect(urlOf(fetchMock, 1).searchParams.get('language')).toBe(expected);
    },
  );

  it('an explicit language wins over the app language, and region tags are reduced to the language (sq-AL -> sq, ja-JP -> ja, ar -> ar)', async () => {
    const fetchMock = jest.fn(async () => jsonResponse({features: []}));
    global.fetch = fetchMock as unknown as typeof fetch;
    await mapProvider.searchPlaces('Paris', {language: 'sq-AL'});
    await mapProvider.searchPlaces('Paris', {language: 'ja-JP'});
    await mapProvider.searchPlaces('Paris', {language: 'ar'});
    await mapProvider.reverseGeocode(1, 2, {language: 'fr-FR'});
    expect([0, 1, 2, 3].map(call => urlOf(fetchMock, call).searchParams.get('language'))).toEqual(['sq', 'ja', 'ar', 'fr']);
    // MapTiler knows one Portuguese: `pt-PT` / `pt-BR` would be answered with HTTP 400, so both regional tags are reduced to `pt`
    await mapProvider.searchPlaces('Lisboa', {language: 'pt-PT'});
    await mapProvider.searchPlaces('São Paulo', {language: 'pt_BR'});
    expect([4, 5].map(call => urlOf(fetchMock, call).searchParams.get('language'))).toEqual(['pt', 'pt']);
    // Bengali: `bn` is a real MapTiler language (verified live 2026-10-21), `bn-BD` / `bn-IN` are answered with HTTP 400, so every regional tag is reduced to `bn`
    await mapProvider.searchPlaces('Dhaka', {language: 'bn-BD'});
    await mapProvider.searchPlaces('Kolkata', {language: 'bn_IN'});
    expect([6, 7].map(call => urlOf(fetchMock, call).searchParams.get('language'))).toEqual(['bn', 'bn']);
  });

  it('a language the provider does not know is NOT sent (the live API answers HTTP 400), so the request still works with default names', async () => {
    const fetchMock = jest.fn(async () => jsonResponse({features: []}));
    global.fetch = fetchMock as unknown as typeof fetch;
    await mapProvider.searchPlaces('Paris', {language: 'xx-not-a-real-language'});
    await mapProvider.searchPlaces('Paris', {language: null});
    await setAppLanguage('xx-not-a-real-language' as never);
    await mapProvider.searchPlaces('Paris');
    for (const call of [0, 1, 2]) {
      expect(urlOf(fetchMock, call).searchParams.has('language')).toBe(false);
    }
  });

  it('results are read in the requested language and carry it (fr, sq, ja), and a place with no translation keeps its own name', async () => {
    const chinatown = {
      id: 'place.4201801',
      center: [-0.1305, 51.5117],
      text: 'Chinatown',
      text_fr: 'Chinatown',
      text_ja: 'Chinatown',
      place_name_fr: 'Chinatown, Grand Londres, Royaume-Uni',
      place_name_ja: 'Chinatown, Greater London, イギリス',
      properties: {kind: 'place'},
      context: [{id: 'country.141', text: 'United Kingdom', text_fr: 'Royaume-Uni', text_ja: 'イギリス'}],
    };
    global.fetch = (jest.fn(async () => jsonResponse({features: [chinatown]})) as unknown) as typeof fetch;
    const french = await mapProvider.reverseGeocode(51.5117, -0.1305, {language: 'fr'});
    expect(french).toMatchObject({city: 'Chinatown', country: 'Royaume-Uni', language: 'fr'}); // the proper name is kept, the country is localized
    const japanese = await mapProvider.reverseGeocode(51.5117, -0.1305, {language: 'ja'});
    expect(japanese).toMatchObject({city: 'Chinatown', country: 'イギリス', language: 'ja'});
  });
});

describe('localizePlace — same place, names in another language', () => {
  it('re-asks the name with the coordinates as proximity and returns the names in the requested language, coordinates untouched', async () => {
    const fetchMock = jest.fn(async () => jsonResponse({features: [LONDON, LONDON_ONTARIO]}));
    global.fetch = fetchMock as unknown as typeof fetch;

    const localized = await mapProvider.localizePlace(FALLBACK, {language: 'fr'});

    const url = urlOf(fetchMock);
    expect(url.pathname).toMatch(/\/London\.json$/);
    expect(url.searchParams.get('language')).toBe('fr');
    expect(url.searchParams.get('proximity')).toBe('-0.1278,51.5074');
    expect(localized).toMatchObject({city: 'Grand Londres', country: 'Royaume-Uni', displayName: 'Grand Londres, Royaume-Uni', language: 'fr', id: 'subregion.112'});
    expect([localized.latitude, localized.longitude, localized.timezone]).toEqual([51.5074, -0.1278, 'Europe/London']);
    expect(FALLBACK.city).toBe('London'); // the input is not mutated
  });

  it.each([['sq', 'Londra'], ['ja', 'グレーター・ロンドン']])('%s: the place is named %s, the same coordinates', async (language, city) => {
    global.fetch = (jest.fn(async () => jsonResponse({features: [LONDON]})) as unknown) as typeof fetch;
    const localized = await mapProvider.localizePlace(FALLBACK, {language});
    expect(localized.city).toBe(city);
    expect(localized.language).toBe(language);
    expect([localized.latitude, localized.longitude]).toEqual([51.5074, -0.1278]);
  });

  it('a result far from the place (London, Ontario) is never taken: she keeps the place she had', async () => {
    global.fetch = (jest.fn(async () => jsonResponse({features: [LONDON_ONTARIO]})) as unknown) as typeof fetch;
    expect(await mapProvider.localizePlace(FALLBACK, {language: 'fr'})).toBe(FALLBACK);
  });

  it('prefers the feature with the same id among the nearby ones', async () => {
    const neighbour = feature('place.999', [-0.12, 51.51], {fr: {city: 'Voisin', country: 'Royaume-Uni', full: 'Voisin, Royaume-Uni'}});
    global.fetch = (jest.fn(async () => jsonResponse({features: [neighbour, LONDON]})) as unknown) as typeof fetch;
    const localized = await mapProvider.localizePlace({...FALLBACK, id: 'subregion.112'}, {language: 'fr'});
    expect(localized.city).toBe('Grand Londres');
  });

  it('does nothing (no request) when the names are already in the requested language, or the language is unknown, or the name is empty', async () => {
    const fetchMock = jest.fn(async () => jsonResponse({features: [LONDON]}));
    global.fetch = fetchMock as unknown as typeof fetch;
    expect(await mapProvider.localizePlace(FALLBACK, {language: 'en'})).toBe(FALLBACK);
    expect(await mapProvider.localizePlace({...FALLBACK, language: 'fr'}, {language: 'fr'})).toMatchObject({language: 'fr'});
    expect(await mapProvider.localizePlace(FALLBACK, {language: 'xx'})).toBe(FALLBACK);
    expect(await mapProvider.localizePlace({...FALLBACK, city: '  '}, {language: 'fr'})).toMatchObject({city: '  '});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses the app language when none is given (a language switch is picked up on the next call)', async () => {
    await setAppLanguage('ja');
    const fetchMock = jest.fn(async () => jsonResponse({features: [LONDON]}));
    global.fetch = fetchMock as unknown as typeof fetch;
    expect((await mapProvider.localizePlace(FALLBACK)).city).toBe('グレーター・ロンドン');
    expect(urlOf(fetchMock).searchParams.get('language')).toBe('ja');
  });

  it('a place of unknown language (saved by an older version) is re-asked even in English', async () => {
    const saved: MapPlace = {city: 'Londres', country: 'Royaume-Uni', latitude: 51.5074, longitude: -0.1278};
    global.fetch = (jest.fn(async () => jsonResponse({features: [LONDON]})) as unknown) as typeof fetch;
    expect(await mapProvider.localizePlace(saved, {language: 'en'})).toMatchObject({city: 'Greater London', country: 'United Kingdom', language: 'en'});
  });
});

describe('errors and cancellation', () => {
  it('a network failure is a NETWORK error (the screen keeps the names she sees)', async () => {
    global.fetch = (jest.fn(async () => { throw new TypeError('Network request failed'); }) as unknown) as typeof fetch;
    await expect(mapProvider.localizePlace(FALLBACK, {language: 'fr'})).rejects.toMatchObject({code: 'NETWORK'});
    await expect(mapProvider.searchPlaces('Paris')).rejects.toBeInstanceOf(MapProviderError);
  });

  it('HTTP errors: 401 / 403 -> INVALID_KEY, 400 / 500 -> HTTP, malformed JSON -> INVALID_RESPONSE', async () => {
    const respond = (status: number) => ({ok: false, status, json: async () => ({})}) as unknown as Response;
    for (const [status, code] of [[401, 'INVALID_KEY'], [403, 'INVALID_KEY'], [400, 'HTTP'], [500, 'HTTP']] as const) {
      global.fetch = (jest.fn(async () => respond(status)) as unknown) as typeof fetch;
      await expect(mapProvider.localizePlace(FALLBACK, {language: 'fr'})).rejects.toMatchObject({code, status});
    }
    global.fetch = (jest.fn(async () => ({ok: true, status: 200, json: async () => { throw new SyntaxError('bad json'); }})) as unknown) as typeof fetch;
    await expect(mapProvider.searchPlaces('Paris')).rejects.toMatchObject({code: 'INVALID_RESPONSE'});
  });

  it('the AbortSignal reaches fetch, and an aborted request is CANCELLED (not NETWORK): the screen shows no error for it', async () => {
    const controller = new AbortController();
    const fetchMock = jest.fn(async (_url: string, init?: {signal?: AbortSignal}) => {
      controller.abort();
      if (init?.signal?.aborted) {throw new Error('The operation was aborted');}
      return jsonResponse({features: []});
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(mapProvider.searchPlaces('Paris', {signal: controller.signal})).rejects.toMatchObject({code: 'CANCELLED'});
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);

    const second = new AbortController();
    global.fetch = (jest.fn(async () => { second.abort(); throw new Error('aborted'); }) as unknown) as typeof fetch;
    await expect(mapProvider.localizePlace(FALLBACK, {language: 'fr', signal: second.signal})).rejects.toMatchObject({code: 'CANCELLED'});
    await expect(mapProvider.reverseGeocode(1, 2, {signal: second.signal})).rejects.toMatchObject({code: 'CANCELLED'});
  });
});
