// Map + geocoding language for LocationScreen. Pure functions, no network, no React.
//
// WHY the map was English. MapTiler's `streets-v2` style (config/maps.ts) is served with its label layers hard-wired to ENGLISH:
// `text-field` is "{name:en}" (cities, countries, oceans, continents), ["coalesce", ["get","name:en"], ["get","name"]] (roads, rivers,
// lakes, states, towns, ferries) or a stops function with "{name:en}" (airports); POI and "Place labels" use "{name}" (the local
// name). The style endpoint ignores a `language` parameter. The vector tiles themselves carry one `name:<lang>` property per
// language (verified for fr en es it tr ru de zh zh-Hans id hi sq ja ko pt bn ar, plus `name:latin`), so a label can be localized by
// rewriting the style's `text-field` expressions — which is what localizeMapStyle() does. A label with no translation falls back to
// the Latin transliteration (Latin-script languages only) and finally to the local name `name`; proper names are never translated here.

/** The languages the map labels and the geocoder are asked for: AWA's fourteen languages (themePreferences.AwaAppLanguage; both Portuguese variants are the provider's single `pt`) plus
 * Arabic (supported by the provider; AWA has no Arabic interface yet). Anything else is NOT sent to the provider: the MapTiler
 * geocoder answers an unknown `language` with HTTP 400. */
export const MAP_LANGUAGES = ['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt', 'bn', 'ar', 'da', 'sv', 'no', 'pl', 'uk', 'cs', 'sk', 'hu', 'ro', 'bg', 'sr', 'hr', 'bs', 'sl', 'vi', 'uz', 'az', 'ka', 'hy', 'tg', 'ky', 'tk'] as const;
export type MapLanguage = (typeof MAP_LANGUAGES)[number];

// Languages written in a non-Latin script: when a label has no translation they keep the LOCAL name rather than a Latin transliteration.
const NON_LATIN_SCRIPT: ReadonlySet<MapLanguage> = new Set<MapLanguage>(['ru', 'zh', 'ja', 'ko', 'hi', 'ar', 'bg', 'sr', 'ka', 'hy', 'tg', 'ky']);

// Languages whose script MapLibre Native cannot shape. Its Android library has no text-shaping engine (no HarfBuzz; glyphs are per-code-point SDF ranges),
// so Bengali conjuncts (ক্ষ, ন্দ …), pre-base vowel signs (ি ে ৈ) and split vowels (ো ৌ) would be drawn as loose, mis-ordered letters. For them the map NEVER
// reads `name:<lang>`: the label is the Latin-script name (`name:latin`, then `name:en`, then the local name). The geocoder language is still sent (search
// results and addresses are ordinary React Native text, which Android shapes correctly), and the interface stays in Bengali.
const UNSHAPED_SCRIPT: ReadonlySet<MapLanguage> = new Set<MapLanguage>(['bn']);

/** True when the map labels of this language fall back to the Latin-script name because the renderer cannot shape its script. */
export const mapLabelsUseLatinFallback = (language: MapLanguage): boolean => UNSHAPED_SCRIPT.has(language);

/** The provider language for a BCP-47-ish tag ('fr', 'fr-FR', 'sq-AL', 'ja_JP', 'zh-Hans-CN', 'ar'), or undefined when the provider has no
 * such language (the caller then omits the parameter and gets the provider's default names). */
export function mapLanguageFor(tag: string | null | undefined): MapLanguage | undefined {
  const rawBase = String(tag ?? '').trim().toLowerCase().split(/[-_.]/)[0];
  // MapTiler's Norwegian is the macrolanguage `no` (OSM name:no); AWA's Bokmål code 'nb' maps to it. Nynorsk ('nn') is a separate provider language AWA does not offer.
  const base = rawBase === 'nb' ? 'no' : rawBase;
  return (MAP_LANGUAGES as readonly string[]).includes(base) ? (base as MapLanguage) : undefined;
}

/** The tile properties to read for a language, best first. Simplified Chinese is stored as `name:zh-Hans` (and `name:zh`). */
export function localizedNameKeys(language: MapLanguage): string[] {
  if (UNSHAPED_SCRIPT.has(language)) {return [];}
  if (language === 'no') {return ['name:no', 'name:nb'];}
  return language === 'zh' ? ['name:zh-Hans', 'name:zh'] : [`name:${language}`];
}

type Expression = unknown[];

/** ["coalesce", name:<lang>, (name:latin), name]: the localized name, then (Latin-script languages) the Latin transliteration,
 * then the local/default name — a label never disappears because a translation is missing. */
export function localizedNameExpression(language: MapLanguage): Expression {
  return [
    'coalesce',
    ...localizedNameKeys(language).map(key => ['get', key]),
    ...(NON_LATIN_SCRIPT.has(language) && !UNSHAPED_SCRIPT.has(language) ? [] : [['get', 'name:latin']]),
    ...(UNSHAPED_SCRIPT.has(language) ? [['get', 'name:en']] : []),
    ['get', 'name'],
  ];
}

type StyleLayer = {id?: string; layout?: Record<string, unknown>};
type StyleLike = {layers?: StyleLayer[]};

const isGetOf = (value: unknown, ...names: string[]): boolean =>
  Array.isArray(value) && value.length === 2 && value[0] === 'get' && typeof value[1] === 'string' && names.includes(value[1]);

const NAME_TOKEN = /^\{(name:en|name)\}$/;
const SINGLE_TOKEN = /^\{([^{}]+)\}$/;

/** Rewrites one `text-field` value, or returns it untouched when it carries no name. `changed` is set when something was localized. */
function localizeTextField(value: unknown, localized: Expression, changed: {value: boolean}): unknown {
  if (typeof value === 'string') {
    if (NAME_TOKEN.test(value.trim())) {
      changed.value = true;
      return localized;
    }
    return value;
  }
  if (Array.isArray(value)) {
    // the style's own English-first pattern: replace the WHOLE coalesce, not each branch
    const branches = value.slice(1);
    if (value[0] === 'coalesce' && branches.some(item => isGetOf(item, 'name:en')) && branches.every(item => isGetOf(item, 'name:en', 'name'))) {
      changed.value = true;
      return localized;
    }
    if (isGetOf(value, 'name:en', 'name')) {
      changed.value = true;
      return localized;
    }
    return value.map(item => localizeTextField(item, localized, changed));
  }
  if (value && typeof value === 'object' && Array.isArray((value as {stops?: unknown}).stops)) {
    // legacy zoom function {"stops": [[8, " "], [9, "{iata}"], [12, "{name:en}"]]} -> ["step", ["zoom"], ...]
    const stops = (value as {stops: Array<[number, unknown]>}).stops;
    if (!stops.some(([, output]) => typeof output === 'string' && NAME_TOKEN.test(output.trim()))) {
      return value;
    }
    const outputs: unknown[] = [];
    for (const [, output] of stops) {
      if (typeof output !== 'string') {return value;}
      const trimmed = output.trim();
      const token = SINGLE_TOKEN.exec(trimmed);
      if (NAME_TOKEN.test(trimmed)) {outputs.push(localized);}
      else if (token) {outputs.push(['get', token[1]]);}
      else if (!/[{}]/.test(output)) {outputs.push(output);}
      else {return value;} // a mixed template we cannot translate safely
    }
    changed.value = true;
    const [firstOutput, ...rest] = outputs;
    return ['step', ['zoom'], firstOutput, ...rest.flatMap((output, index) => [stops[index + 1][0], output])];
  }
  return value;
}

/**
 * The style with its name labels shown in `language`. `en` (and a language the provider does not know) returns the style unchanged —
 * it already reads `name:en`, then `name`. Only the `text-field` of layers that actually carry a name is touched (house numbers,
 * road shields `{ref}`, airport codes `{iata}` stay as they are); sources, camera, fonts and every other property are untouched,
 * so switching language only re-draws labels and never moves the map.
 */
export function localizeMapStyle<T extends StyleLike>(style: T, tag: string | null | undefined): T {
  const language = mapLanguageFor(tag);
  if (!language || language === 'en' || !Array.isArray(style.layers)) {
    return style;
  }
  let anyChanged = false;
  const layers = style.layers.map(layer => {
    const textField = layer.layout?.['text-field'];
    if (textField === undefined) {return layer;}
    const changed = {value: false};
    const next = localizeTextField(textField, localizedNameExpression(language), changed);
    if (!changed.value) {return layer;}
    anyChanged = true;
    return {...layer, layout: {...layer.layout, 'text-field': next}};
  });
  return anyChanged ? {...style, layers} : style;
}
