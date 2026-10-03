import {mapProvider} from '../mapProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../../state/themePreferences';

// Phase 7A — the MapTiler geocoding request's `language` query parameter
// must follow the CURRENT AWA app language (never hardcoded French), resolved
// fresh on every call so a mid-session language switch is reflected on the
// very next request — never cached at module scope. This must never change
// the geographic SCOPE of a search (no country restriction is ever added).

const originalFetch = global.fetch;

const jsonResponse = (body: unknown) => ({ok: true, json: async () => body}) as unknown as Response;

const FEATURE_WITH_BOTH_LANGUAGES = {
  id: 'place.123',
  center: [2.3522, 48.8566],
  place_name: 'Paris, France',
  place_name_fr: 'Paris, France',
  place_name_en: 'Paris, France',
  context: [
    {id: 'place.123', text: 'Paris', text_fr: 'Paris', text_en: 'Paris', properties: {kind: 'place'}, place_designation: 'city'},
    {id: 'country.456', text: 'France', text_fr: 'France', text_en: 'France'},
  ],
};

afterEach(async () => {
  global.fetch = originalFetch;
  await resetAppLanguageForTests();
});

describe('mapProvider — geocoding request language', () => {
  it('TEST 3: requests language=fr while the app language is French (default)', async () => {
    const fetchMock = jest.fn(async (_url: string) => jsonResponse({features: [FEATURE_WITH_BOTH_LANGUAGES]}));
    global.fetch = fetchMock as unknown as typeof fetch;

    await mapProvider.searchPlaces('Paris');

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('language=fr');
    expect(calledUrl).not.toContain('language=en');
  });

  it('TEST 4: requests language=en once the app language is switched to English', async () => {
    await setAppLanguage('en');
    const fetchMock = jest.fn(async (_url: string) => jsonResponse({features: [FEATURE_WITH_BOTH_LANGUAGES]}));
    global.fetch = fetchMock as unknown as typeof fetch;

    await mapProvider.searchPlaces('Paris');

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('language=en');
    expect(calledUrl).not.toContain('language=fr');
  });

  it('TEST 5: a runtime language switch is reflected on the very next request — no app restart, no re-import, no stale module-level cache', async () => {
    const fetchMock = jest.fn(async (_url: string) => jsonResponse({features: [FEATURE_WITH_BOTH_LANGUAGES]}));
    global.fetch = fetchMock as unknown as typeof fetch;

    await mapProvider.searchPlaces('Paris');
    expect(fetchMock.mock.calls[0][0] as string).toContain('language=fr');

    await setAppLanguage('en');

    await mapProvider.searchPlaces('Paris');
    expect(fetchMock.mock.calls[1][0] as string).toContain('language=en');
  });

  it('TEST 6: never restricts the search to a country — global search is preserved', async () => {
    const fetchMock = jest.fn(async (_url: string) => jsonResponse({features: []}));
    global.fetch = fetchMock as unknown as typeof fetch;

    await mapProvider.searchPlaces('Tokyo');
    await setAppLanguage('en');
    await mapProvider.searchPlaces('Tokyo');

    fetchMock.mock.calls.forEach(([calledUrl]) => {
      expect(calledUrl as string).not.toMatch(/[?&]country=/);
    });
  });

  it('reads the English place/city name when the app language is English, French when French — never mixed', async () => {
    const feature = {
      id: 'place.789',
      center: [-0.1278, 51.5074],
      text: 'London',
      text_fr: 'Londres',
      text_en: 'London',
      place_name: 'London, United Kingdom',
      place_name_fr: 'Londres, Royaume-Uni',
      place_name_en: 'London, United Kingdom',
      context: [
        {id: 'country.111', text: 'United Kingdom', text_fr: 'Royaume-Uni', text_en: 'United Kingdom'},
      ],
    };
    global.fetch = jest.fn(async (_url: string) => jsonResponse({features: [feature]})) as unknown as typeof fetch;

    const [frResult] = await mapProvider.searchPlaces('London');
    expect(frResult.city).toBe('Londres');
    expect(frResult.country).toBe('Royaume-Uni');

    await setAppLanguage('en');
    const [enResult] = await mapProvider.searchPlaces('London');
    expect(enResult.city).toBe('London');
    expect(enResult.country).toBe('United Kingdom');
  });

  it('reverseGeocode also follows the current app language', async () => {
    const fetchMock = jest.fn(async (_url: string) => jsonResponse({features: [FEATURE_WITH_BOTH_LANGUAGES]}));
    global.fetch = fetchMock as unknown as typeof fetch;

    await mapProvider.reverseGeocode(48.8566, 2.3522);
    expect(fetchMock.mock.calls[0][0] as string).toContain('language=fr');

    await setAppLanguage('en');
    await mapProvider.reverseGeocode(48.8566, 2.3522);
    expect(fetchMock.mock.calls[1][0] as string).toContain('language=en');
  });
});
