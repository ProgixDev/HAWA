import fixture from './fixtures/streetsV2Labels.json';
import {
  MAP_LANGUAGES,
  localizeMapStyle,
  mapLabelsUseLatinFallback,
  localizedNameExpression,
  localizedNameKeys,
  mapLanguageFor,
} from '../mapLanguage';
import type {AwaAppLanguage} from '../../../state/themePreferences';

// Map label language. The served MapTiler streets-v2 style hard-wires ENGLISH in its label layers ("{name:en}", coalesce(name:en, name)),
// while the vector tiles carry name:<lang> for every AWA language. localizeMapStyle() rewrites the text-field expressions to the active
// language with a safe fallback chain (translation → Latin transliteration for Latin-script languages → local name), touching nothing else.

type Style = {version: number; sources: Record<string, unknown>; layers: Array<{id: string; layout: Record<string, unknown>}>};
const style = fixture as unknown as Style;
const textFieldOf = (s: Style, id: string) => s.layers.find(layer => layer.id === id)?.layout['text-field'];

/** Evaluates the tiny expression subset we produce (coalesce / get / step / zoom) on one feature. */
const evaluate = (expression: unknown, props: Record<string, string | undefined>, zoom = 10): unknown => {
  if (!Array.isArray(expression)) {return expression;}
  const [operator, ...args] = expression as [string, ...unknown[]];
  if (operator === 'get') {return props[args[0] as string] ?? null;}
  if (operator === 'zoom') {return zoom;}
  if (operator === 'coalesce') {
    for (const arg of args) {
      const value = evaluate(arg, props, zoom);
      if (value !== null && value !== undefined) {return value;}
    }
    return null;
  }
  if (operator === 'step') {
    const input = evaluate(args[0], props, zoom) as number;
    let output = evaluate(args[1], props, zoom);
    for (let index = 2; index < args.length; index += 2) {
      if (input >= (args[index] as number)) {output = evaluate(args[index + 1], props, zoom);}
    }
    return output;
  }
  throw new Error(`unsupported operator ${operator}`);
};

const LONDON = {name: 'London', 'name:latin': 'London', 'name:en': 'London', 'name:fr': 'Londres', 'name:sq': 'Londra', 'name:ja': 'ロンドン', 'name:ru': 'Лондон', 'name:zh-Hans': '伦敦', 'name:zh': '伦敦', 'name:hi': 'लंदन', 'name:ar': 'لندن'};
// a local place with NO translation in any language (what "Camden Town" / "Chinatown" are in the data)
const CAMDEN = {name: 'Camden Town', 'name:latin': 'Camden Town'};

describe('mapLanguageFor', () => {
  it.each([
    ['fr', 'fr'], ['fr-FR', 'fr'], ['en', 'en'], ['en-GB', 'en'], ['es-ES', 'es'], ['it', 'it'], ['tr-TR', 'tr'], ['ru-RU', 'ru'], ['de-DE', 'de'],
    ['zh', 'zh'], ['zh-Hans-CN', 'zh'], ['zh_CN', 'zh'], ['id-ID', 'id'], ['hi-IN', 'hi'], ['sq-AL', 'sq'], ['sq-XK', 'sq'], ['ja-JP', 'ja'], ['ja_JP', 'ja'], ['ko', 'ko'], ['ko-KR', 'ko'], ['ko_KR', 'ko'], ['ko-Kore-KR', 'ko'], ['pt', 'pt'], ['pt-PT', 'pt'], ['pt-BR', 'pt'], ['pt_BR', 'pt'], ['pt-Latn-BR', 'pt'],
    ['bn', 'bn'], ['bn-BD', 'bn'], ['bn-IN', 'bn'], ['bn_BD', 'bn'], ['bn_IN', 'bn'], ['bn-Beng-BD', 'bn'],
    ['vi', 'vi'], ['vi-VN', 'vi'], ['vi_VN', 'vi'], ['uz', 'uz'], ['uz-UZ', 'uz'], ['uz_UZ', 'uz'], ['uz-Latn-UZ', 'uz'], ['az', 'az'], ['az-AZ', 'az'], ['az_AZ', 'az'], ['az-Latn-AZ', 'az'], ['ka', 'ka'], ['ka-GE', 'ka'], ['ka_GE', 'ka'], ['ka-Geor-GE', 'ka'], ['hy', 'hy'], ['hy-AM', 'hy'], ['hy_AM', 'hy'], ['hy-Armn-AM', 'hy'], ['tg', 'tg'], ['tg-TJ', 'tg'], ['tg_TJ', 'tg'], ['tg-Cyrl-TJ', 'tg'], ['ky', 'ky'], ['ky-KG', 'ky'], ['ky_KG', 'ky'], ['ky-Cyrl-KG', 'ky'], ['tk', 'tk'], ['tk-TM', 'tk'], ['tk_TM', 'tk'], ['tk-Latn-TM', 'tk'], ['ar', 'ar'], ['ar-DZ', 'ar'], ['da', 'da'], ['da-DK', 'da'], ['da_DK', 'da'], ['  FR  ', 'fr'],
  ])('%s -> %s', (tag, expected) => {
    expect(mapLanguageFor(tag)).toBe(expected);
  });

  it.each([undefined, null, '', '   ', 'xx', 'xx-not-a-real-language', 'zz-ZZ', 'th'])('%j -> undefined (the provider would answer HTTP 400 or has no such names)', tag => {
    expect(mapLanguageFor(tag as never)).toBeUndefined();
  });

  it('knows every language AWA registers (a new AwaAppLanguage must be added to MAP_LANGUAGES or this fails to compile)', () => {
    const registered: Record<AwaAppLanguage, true> = {fr: true, en: true, es: true, it: true, tr: true, ru: true, de: true, zh: true, id: true, hi: true, sq: true, ja: true, ko: true, 'pt-PT': true, 'pt-BR': true, bn: true, da: true, sv: true, nb: true, pl: true, uk: true, cs: true, sk: true, hu: true, ro: true, bg: true, sr: true, hr: true, bs: true, sl: true, ne: true, si: true, th: true, vi: true, uz: true, az: true, ka: true, hy: true, tg: true, ky: true, tk: true};
    for (const language of Object.keys(registered)) {
      const expected = language === 'pt-PT' || language === 'pt-BR' ? 'pt' : language; // the provider has one Portuguese
      expect([language, mapLanguageFor(language)]).toEqual([language, expected]);
      expect(MAP_LANGUAGES).toContain(expected);
    }
    expect(MAP_LANGUAGES).toContain('ar'); // supported by the provider, no AWA interface yet
  });
});

describe('localizedNameExpression — the fallback chain', () => {
  it('French reads name:fr, then the Latin transliteration, then the local name', () => {
    expect(localizedNameExpression('fr')).toEqual(['coalesce', ['get', 'name:fr'], ['get', 'name:latin'], ['get', 'name']]);
  });

  it('non-Latin-script languages (ja, ru, zh, hi, ar) skip the Latin transliteration: the local name is the fallback', () => {
    for (const language of ['ja', 'ru', 'hi', 'ar'] as const) {
      expect(localizedNameExpression(language)).toEqual(['coalesce', ['get', `name:${language}`], ['get', 'name']]);
    }
    expect(localizedNameExpression('zh')).toEqual(['coalesce', ['get', 'name:zh-Hans'], ['get', 'name:zh'], ['get', 'name']]);
    expect(localizedNameKeys('zh')).toEqual(['name:zh-Hans', 'name:zh']);
  });

  it.each([
    ['fr', 'Londres'], ['sq', 'Londra'], ['ja', 'ロンドン'], ['ru', 'Лондон'], ['zh', '伦敦'], ['hi', 'लंदन'], ['ar', 'لندن'], ['en', 'London'],
  ] as const)('%s shows %s when the tile has the translation', (language, expected) => {
    expect(evaluate(localizedNameExpression(language), LONDON)).toBe(expected);
  });

  it.each(MAP_LANGUAGES)('%s: a place with no translation keeps its own (local / Latin) name — never blank, never English by force', language => {
    expect(evaluate(localizedNameExpression(language), CAMDEN)).toBe('Camden Town');
  });

  it('a place with no translation and no Latin name falls back to the local name (Chinese, Japanese, Cyrillic, Devanagari local names)', () => {
    for (const language of MAP_LANGUAGES) {
      expect(evaluate(localizedNameExpression(language), {name: '北京市'})).toBe('北京市');
      expect(evaluate(localizedNameExpression(language), {name: 'Київ'})).toBe('Київ');
    }
  });

  it('a Latin-script language prefers the Latin transliteration to a foreign local script; a non-Latin one does not', () => {
    const props = {name: '東京', 'name:latin': 'Tokyo'};
    expect(evaluate(localizedNameExpression('fr'), props)).toBe('Tokyo');
    expect(evaluate(localizedNameExpression('sq'), props)).toBe('Tokyo');
    expect(evaluate(localizedNameExpression('ru'), props)).toBe('東京');
  });
});

describe('localizeMapStyle on the real streets-v2 label layers', () => {
  it('the served style is English: that is the bug (name:en everywhere, none of AWA\'s other languages)', () => {
    const fields = JSON.stringify(style.layers.map(layer => layer.layout['text-field']));
    expect(fields).toContain('name:en');
    expect(fields).not.toMatch(/name:(fr|sq|ja|es|de|it|tr|ru|zh|hi|id)/);
  });

  it('English (and a language the provider does not know) returns the very same style object', () => {
    expect(localizeMapStyle(style, 'en')).toBe(style);
    expect(localizeMapStyle(style, 'en-GB')).toBe(style);
    expect(localizeMapStyle(style, 'xx')).toBe(style);
    expect(localizeMapStyle(style, undefined)).toBe(style);
    expect(localizeMapStyle(style, null)).toBe(style);
  });

  it.each(['fr', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt', 'ar', 'fr-FR', 'sq-AL', 'ja-JP', 'ko-KR', 'pt-BR', 'pt-PT'])('%s: no label layer reads name:en any more, and each reads the language\'s own tile property', language => {
    const localized = localizeMapStyle(style, language);
    const base = mapLanguageFor(language) as string;
    const fields = JSON.stringify(localized.layers.map(layer => layer.layout['text-field']));
    expect(fields).not.toContain('name:en');
    expect(fields).toContain(base === 'zh' ? 'name:zh-Hans' : `name:${base}`);
    expect(fields).toContain('"name"'); // the local-name fallback is always the last resort
  });

  it('rewrites each pattern of the style: "{name:en}" tokens, coalesce(name:en, name), "{name}" and the airport stops function', () => {
    const localized = localizeMapStyle(style, 'ja');
    const expression = localizedNameExpression('ja');
    for (const id of ['City labels', 'Capital city labels', 'Country labels', 'Continent labels', 'Ocean labels']) {
      expect([id, textFieldOf(localized, id)]).toEqual([id, expression]); // "{name:en}"
    }
    for (const id of ['Road labels', 'River labels', 'Lake labels', 'State labels', 'Town labels', 'Ferry', 'Gondola']) {
      expect([id, textFieldOf(localized, id)]).toEqual([id, expression]); // coalesce(name:en, name) replaced as a whole, not nested
    }
    for (const id of ['Place labels', 'Public', 'Sport', 'Education', 'Tourism', 'Culture', 'Shopping', 'Food', 'Transport', 'Park', 'Healthcare', 'Station']) {
      expect([id, textFieldOf(localized, id)]).toEqual([id, expression]); // "{name}" (the local name)
    }
    expect(textFieldOf(localized, 'Airport')).toEqual(['step', ['zoom'], ' ', 9, ['get', 'iata'], 12, expression]);
  });

  it('labels that are not names stay exactly as they are: house numbers, road shields, junction refs, airport gates', () => {
    const localized = localizeMapStyle(style, 'fr');
    expect(textFieldOf(localized, 'Housenumber')).toBe('{housenumber}');
    for (const id of ['Highway junction', 'Highway shield', 'Highway shield (US)', 'Highway shield interstate (US)', 'Airport gate']) {
      expect(textFieldOf(localized, id)).toBe('{ref}');
    }
  });

  it('the airport label shows nothing below zoom 9, the IATA code from 9, the localized name from 12', () => {
    const airport = textFieldOf(localizeMapStyle(style, 'fr'), 'Airport');
    const props = {iata: 'LHR', name: 'Heathrow', 'name:fr': 'Aéroport de Londres-Heathrow'};
    expect(evaluate(airport, props, 8)).toBe(' ');
    expect(evaluate(airport, props, 10)).toBe('LHR');
    expect(evaluate(airport, props, 13)).toBe('Aéroport de Londres-Heathrow');
  });

  it('changes nothing but text-field: same layers in the same order, same ids, fonts, sources and unchanged layers by reference', () => {
    const localized = localizeMapStyle(style, 'sq');
    expect(localized).not.toBe(style);
    expect(localized.layers.map(layer => layer.id)).toEqual(style.layers.map(layer => layer.id));
    expect(localized.version).toBe(style.version);
    expect(localized.sources).toBe(style.sources);
    localized.layers.forEach((layer, index) => {
      const original = style.layers[index];
      expect(layer.layout['text-font']).toEqual(original.layout['text-font']);
      expect({...layer, layout: {...layer.layout, 'text-field': null}}).toEqual({...original, layout: {...original.layout, 'text-field': null}});
    });
    expect(localized.layers.find(layer => layer.id === 'Housenumber')).toBe(style.layers.find(layer => layer.id === 'Housenumber'));
  });

  it('never mutates the style it is given and can be applied again for another language (switching language back and forth)', () => {
    const before = JSON.stringify(style);
    const french = localizeMapStyle(style, 'fr');
    const albanian = localizeMapStyle(style, 'sq');
    const japanese = localizeMapStyle(style, 'ja');
    expect(JSON.stringify(style)).toBe(before);
    expect(JSON.stringify(french)).not.toBe(JSON.stringify(albanian));
    expect(JSON.stringify(albanian)).not.toBe(JSON.stringify(japanese));
    expect(JSON.stringify(localizeMapStyle(style, 'fr'))).toBe(JSON.stringify(french)); // deterministic
  });

  it('every text-field of every localized style is a valid expression for the engine: strings only for plain {tokens}, arrays otherwise', () => {
    for (const language of MAP_LANGUAGES.filter(code => code !== 'en')) { // English returns the served style itself (legacy airport stops included)
      for (const layer of localizeMapStyle(style, language).layers) {
        const field = layer.layout['text-field'];
        expect(typeof field === 'string' || Array.isArray(field)).toBe(true);
        if (typeof field === 'string') {expect(field).toMatch(/^\{[a-z_:]+\}$/);}
      }
    }
  });

  it('a style without layers, or with a layer whose text-field is already something else, is returned safely', () => {
    const empty = {version: 8, sources: {}, layers: []};
    expect(localizeMapStyle(empty, 'fr')).toBe(empty);
    const odd = {layers: [{id: 'a', layout: {'text-field': ['format', 'Hello ', {}, ['get', 'ref'], {}]}}, {id: 'b'}, {id: 'c', layout: {'text-field': '{ref} {name}'}}]};
    expect(localizeMapStyle(odd, 'fr')).toBe(odd); // nothing recognisable as a name label: untouched
  });
});

describe('Bengali map labels: MapLibre Native cannot shape Bengali, so the labels fall back to Latin names (the interface stays Bengali)', () => {
  it('bn is a real provider language (the geocoder answers it), reduced from every regional tag; only bn needs the fallback', () => {
    expect(MAP_LANGUAGES).toContain('bn');
    expect(mapLabelsUseLatinFallback('bn')).toBe(true);
    for (const language of MAP_LANGUAGES.filter(name => name !== 'bn')) {
      expect([language, mapLabelsUseLatinFallback(language)]).toEqual([language, false]);
    }
  });

  it('never asks the tiles for name:bn: Latin transliteration, then the English name, then the local name', () => {
    expect(localizedNameKeys('bn')).toEqual([]);
    const expression = localizedNameExpression('bn');
    const fields = JSON.stringify(expression);
    expect(fields).not.toContain('name:bn');
    expect(fields).toContain('name:latin');
    expect(fields).toContain('name:en');
    expect(evaluate(expression, {name: 'ঢাকা', 'name:latin': 'Dhaka', 'name:en': 'Dhaka', 'name:bn': 'ঢাকা'})).toBe('Dhaka');
    expect(evaluate(expression, {name: 'ঢাকা', 'name:en': 'Dhaka'})).toBe('Dhaka');
    expect(evaluate(expression, {name: 'Camden Town'})).toBe('Camden Town');
  });

  it('the Bengali style rewrites every name label, leaves the non-name labels alone and does not touch other languages', () => {
    const localized = localizeMapStyle(style, 'bn-BD');
    const fields = JSON.stringify(localized.layers.map(layer => layer.layout['text-field']));
    expect(fields).not.toContain('name:bn');
    expect(fields).not.toMatch(/\{name:en\}/);
    expect(textFieldOf(localized, 'City labels')).toEqual(localizedNameExpression('bn'));
    expect(textFieldOf(localized, 'Housenumber')).toBe('{housenumber}');
    expect(textFieldOf(style, 'City labels')).toBe(textFieldOf(localizeMapStyle(style, 'en'), 'City labels'));
    expect(JSON.stringify(localizeMapStyle(style, 'fr').layers.map(layer => layer.layout['text-field']))).toContain('name:fr');
  });
});
