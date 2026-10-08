import AsyncStorage from '@react-native-async-storage/async-storage';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import FirstPeriodArticleScreen from '../library/FirstPeriodArticleScreen';
import MenstruationPurityArticleScreen from '../library/MenstruationPurityArticleScreen';
import PregnancyWeeklyArticleScreen from '../library/PregnancyWeeklyArticleScreen';
import PcosIntroArticleScreen from '../library/PcosIntroArticleScreen';
import MenopauseTransitionArticleScreen from '../library/MenopauseTransitionArticleScreen';
import LhTestsArticleScreen from '../library/LhTestsArticleScreen';
import PregnancyWeekScreen from '../pregnancy/PregnancyWeekScreen';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {getPregnancyDating, hydratePregnancyDating, setPregnancyDating} from '../../state/pregnancyPreferences';
import {computePregnancyStatus} from '../../utils/pregnancyTrackingUtils';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import {resolveEditorialLanguage} from '../../i18n/editorialLanguage';
import i18n from '../../i18n';

// Italian editorial localization: the 72 reachable Library articles (CONTENT.it)
// and the 41 pregnancy-week reference entries. Static checks read the real
// article sources; render checks mount real screens.

jest.mock('../../services/privateNotesEncryption', () => ({resolveNoteSection: jest.fn().mockResolvedValue({data: null})}));
jest.mock('../../services/privateJournalEncryption', () => ({resolveIntimacySection: jest.fn().mockResolvedValue({data: null})}));

type Content = Record<string, unknown>;
type ArticleContent = {fr: Content; en: Content; es: Content; it: Content};

const LIB_DIR = path.resolve(__dirname, '../library');
const DEAD = new Set(['UnderstandCycleArticleScreen.tsx']);

function matchBrace(src: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < src.length; i += 1) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      for (i += 1; i < src.length; i += 1) {
        if (src[i] === '\\') {
          i += 1;
        } else if (src[i] === c) {
          break;
        }
      }
      continue;
    }
    if (c === '{') {
      depth += 1;
    } else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function extractContent(source: string): ArticleContent {
  const match = source.match(/\bconst CONTENT\b[^=]*=\s*\{/) as RegExpMatchArray;
  const open = source.indexOf('{', (match.index as number) + match[0].length - 1);
  const close = matchBrace(source, open);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${source.slice(open, close + 1)});`)() as ArticleContent;
}

function leaves(value: unknown, prefix = '', acc: Array<[string, unknown]> = []): Array<[string, unknown]> {
  if (Array.isArray(value)) {
    value.forEach((item, index) => leaves(item, `${prefix}[${index}]`, acc));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => leaves(item, prefix ? `${prefix}.${key}` : key, acc));
  } else {
    acc.push([prefix, value]);
  }
  return acc;
}

const shape = (value: unknown): unknown =>
  Array.isArray(value)
    ? ['A', value.map(shape)]
    : value && typeof value === 'object'
      ? ['O', Object.entries(value).map(([key, item]) => [key, shape(item)])]
      : ['L', typeof value];

const placeholders = (value: string) => (value.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? []).sort().join('|');
const figures = (value: string) =>
  (value.replace(/\b\d+(?:st|nd|rd|th)\b/gi, ' ').replace(/\b\d+\s?[ºª]/g, ' ').match(/\d+(?:[.,]\d+)?/g) ?? [])
    .map(n => n.replace(',', '.'))
    .sort()
    .join('|');

const articleFiles = fs.readdirSync(LIB_DIR).filter(name => /ArticleScreen\.tsx$/.test(name) && !DEAD.has(name));
const readerSource = fs.readFileSync(path.join(LIB_DIR, 'ArticleReaderScreen.tsx'), 'utf8');
const contents = new Map<string, ArticleContent>(
  articleFiles.map(file => [file, extractContent(fs.readFileSync(path.join(LIB_DIR, file), 'utf8'))]),
);

// Leaves that are legitimately identical to English: icon identifiers, bare figures/units,
// proper nouns, loanwords and the shared "FAQ" label.
const LEGIT_IDENTICAL = (value: string) =>
  /^[a-z]+(?:-[a-z0-9]+)+$/.test(value) ||
  /^[\d\s.,:·\-–/%]+$/.test(value) ||
  value.length <= 4 ||
  /^(PCOS|FAQ|Omega-3|Baby blues|Progesterone|Stress|Dhikr|RAMADAN|Libido|Nifas|NIFAS \(FIQH\)|toilet|sleep|doctor)$/i.test(value) ||
  /^\d+ min\s+·\s+FAQ$/.test(value);

describe('Library articles — Italian content exists and mirrors the English structure', () => {
  it('the reader registers exactly the 72 reachable articles, and every one has an Italian CONTENT block', () => {
    expect(articleFiles).toHaveLength(72);
    const missing = articleFiles.filter(file => !readerSource.includes(file.replace(/\.tsx$/, '')));
    expect(missing).toEqual([]);
    const withoutItalian = articleFiles.filter(file => !contents.get(file)?.it);
    expect(withoutItalian).toEqual([]);
  });

  it('CONTENT has exactly fr, en, es, it — in that order — and the existing fr/en/es blocks are all still present', () => {
    for (const [file, content] of contents) {
      expect([file, Object.keys(content).join()]).toEqual([file, 'fr,en,es,it']);
    }
  });

  it('every Italian block is structurally identical to English: same keys, array lengths, ordering and leaf types', () => {
    const mismatched = [...contents].filter(([, c]) => JSON.stringify(shape(c.en)) !== JSON.stringify(shape(c.it))).map(([f]) => f);
    expect(mismatched).toEqual([]);
    const total = [...contents.values()].reduce((sum, c) => sum + leaves(c.it).length, 0);
    const totalEn = [...contents.values()].reduce((sum, c) => sum + leaves(c.en).length, 0);
    expect(total).toBe(totalEn);
    expect(total).toBe(3615);
  });

  it('no interpolation placeholder is missing/added, and no medical figure (number) changed, in any Italian leaf', () => {
    const placeholderIssues: string[] = [];
    const figureIssues: string[] = [];
    for (const [file, content] of contents) {
      const en = leaves(content.en);
      const it = leaves(content.it);
      en.forEach(([key, value], index) => {
        const italian = it[index][1];
        if (typeof value !== 'string' || typeof italian !== 'string') {
          return;
        }
        if (placeholders(value) !== placeholders(italian)) {
          placeholderIssues.push(`${file}::${key}`);
        }
        if (figures(value) !== figures(italian)) {
          figureIssues.push(`${file}::${key}`);
        }
      });
    }
    expect(placeholderIssues).toEqual([]);
    expect(figureIssues).toEqual([]);
  });

  it('no unintended English remains: every Italian leaf differs from English except legitimate technical terms', () => {
    const untranslated: string[] = [];
    for (const [file, content] of contents) {
      const en = leaves(content.en);
      const it = leaves(content.it);
      en.forEach(([key, value], index) => {
        const italian = it[index][1];
        if (typeof value === 'string' && value === italian && !LEGIT_IDENTICAL(value)) {
          untranslated.push(`${file}::${key} => ${value}`);
        }
      });
    }
    expect(untranslated).toEqual([]);
  });

  it('no English function-word sentences hide inside the Italian text', () => {
    const english = /\b(the|your|you|and|with|for|is|are|this|that|will|have|please|during|before|after|may|can)\b/i;
    const offenders: string[] = [];
    for (const [file, content] of contents) {
      for (const [key, value] of leaves(content.it)) {
        if (typeof value === 'string' && english.test(value)) {
          offenders.push(`${file}::${key} => ${value.slice(0, 80)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('Italian text uses the typographic apostrophe, has no mojibake, and is written as real Italian (accents present)', () => {
    const bad: string[] = [];
    let accented = 0;
    for (const [file, content] of contents) {
      for (const [key, value] of leaves(content.it)) {
        if (typeof value !== 'string') {
          continue;
        }
        if (value.includes("'") || /Ã[\u0080-¿]|Â[ -¿]|�/.test(value)) {
          bad.push(`${file}::${key}`);
        }
        if (/[àèéìòù]/i.test(value)) {
          accented += 1;
        }
      }
    }
    expect(bad).toEqual([]);
    expect(accented).toBeGreaterThan(1000);
  });

  it('article images are language-neutral: the Italian blocks reference no image, and every image the article files require exists', () => {
    for (const [file, content] of contents) {
      expect([file, JSON.stringify(content.it).includes('require(')]).toEqual([file, false]);
      const source = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      for (const match of source.matchAll(/require\('([^']+\.(?:png|jpe?g|webp))'\)/g)) {
        expect([file, fs.existsSync(path.resolve(LIB_DIR, match[1]))]).toEqual([file, true]);
      }
    }
  });

  it('every article resolves its language through the shared resolver (no stale inline French/Spanish-only ternary)', () => {
    for (const file of articleFiles) {
      const source = fs.readFileSync(path.join(LIB_DIR, file), 'utf8');
      expect(source).toMatch(/const lang = resolveEditorialLanguage\(i18n\.language\);/);
      expect(source).not.toMatch(/i18n\.language === 'fr'/);
    }
  });
});

describe('resolveEditorialLanguage', () => {
  it.each([
    ['en', 'en'],
    ['fr', 'fr'],
    ['es', 'es'],
    ['it', 'it'],
    ['de', 'en'],
    ['IT', 'en'],
    ['it-IT', 'en'],
    ['', 'en'],
    [undefined, 'en'],
    [null, 'en'],
  ])('%j -> %s', (input, expected) => {
    expect(resolveEditorialLanguage(input as string)).toBe(expected);
  });
});

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const textsOf = (renderer: ReactTestRenderer.ReactTestRenderer): string[] =>
  renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).map(child => (typeof child === 'string' ? child : '')).join(''));

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function switchLanguage(language: AwaAppLanguage) {
  await act(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });
  await settle();
}

async function renderScreen(Component: React.ComponentType<never>) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={Component as never} name="Test" />
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  await settle();
  return renderer;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await switchLanguage('en');
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

const SAMPLE: Array<[string, React.ComponentType<never>, string]> = [
  ['First period', FirstPeriodArticleScreen as never, 'FirstPeriodArticleScreen.tsx'],
  ['Menstruation & purity (religious)', MenstruationPurityArticleScreen as never, 'MenstruationPurityArticleScreen.tsx'],
  ['Pregnancy weekly', PregnancyWeeklyArticleScreen as never, 'PregnancyWeeklyArticleScreen.tsx'],
  ['PCOS intro', PcosIntroArticleScreen as never, 'PcosIntroArticleScreen.tsx'],
  ['Menopause transition', MenopauseTransitionArticleScreen as never, 'MenopauseTransitionArticleScreen.tsx'],
  ['LH tests', LhTestsArticleScreen as never, 'LhTestsArticleScreen.tsx'],
];

describe('Library articles render in Italian and follow runtime language changes', () => {
  it.each(SAMPLE)('%s: Italian title, badge and intro are shown; English/French/Spanish ones are not', async (_name, Screen, file) => {
    const content = contents.get(file) as ArticleContent;
    await switchLanguage('it');
    const texts = textsOf(await renderScreen(Screen));
    for (const field of ['title', 'badge', 'intro']) {
      const italian = content.it[field] as string;
      expect(texts).toContain(italian);
      for (const other of ['en', 'fr', 'es'] as const) {
        const foreign = content[other][field] as string;
        if (foreign !== italian) {
          expect(texts).not.toContain(foreign);
        }
      }
    }
  });

  it('a mounted article updates through EN -> IT -> FR -> ES -> IT with no restart and no stale text', async () => {
    const content = contents.get('FirstPeriodArticleScreen.tsx') as ArticleContent;
    const renderer = await renderScreen(FirstPeriodArticleScreen as never);
    const sequence: Array<'en' | 'it' | 'fr' | 'es'> = ['en', 'it', 'fr', 'es', 'it'];
    for (const language of sequence) {
      await switchLanguage(language);
      const texts = textsOf(renderer);
      expect([language, texts.includes(content[language].title as string)]).toEqual([language, true]);
      for (const other of sequence.filter(l => l !== language)) {
        const stale = content[other].title as string;
        if (stale !== content[language].title) {
          expect(texts).not.toContain(stale);
        }
      }
    }
  });
});

describe('Pregnancy week content — Italian', () => {
  const weeks = Array.from({length: 41}, (_, index) => index + 1);

  it('all 41 weeks (1-41) resolve to Italian content with the same fields as English', () => {
    const missing: number[] = [];
    for (const week of weeks) {
      const italian = getPregnancyWeekData(week, 'it');
      const english = getPregnancyWeekData(week, 'en');
      if (!italian || !english || Object.keys(italian).sort().join() !== Object.keys(english).sort().join()) {
        missing.push(week);
      }
    }
    expect(missing).toEqual([]);
    expect(getPregnancyWeekData(0, 'it')).toBeUndefined();
    expect(getPregnancyWeekData(42, 'it')).toBeUndefined();
  });

  it('EN/IT structural parity: same array lengths, same optional fields, placeholders and figures preserved', () => {
    const issues: string[] = [];
    let total = 0;
    for (const week of weeks) {
      const italian = getPregnancyWeekData(week, 'it') as Record<string, unknown>;
      const english = getPregnancyWeekData(week, 'en') as Record<string, unknown>;
      for (const field of ['babyDescription', 'length', 'comparison', 'bodyChanges', 'toKnow']) {
        const it = italian[field];
        const en = english[field];
        if ((en === undefined) !== (it === undefined)) {
          issues.push(`week${week}.${field} presence`);
          continue;
        }
        if (en === undefined) {
          continue; // weeks 1-3 and 41 have no length/comparison in any language
        }
        if (Array.isArray(en) && (!Array.isArray(it) || it.length !== en.length)) {
          issues.push(`week${week}.${field} length`);
        }
        leaves(en, field).forEach(([key, value], index) => {
          const italianValue = leaves(it, field)[index]?.[1];
          total += 1;
          if (typeof value === 'string' && typeof italianValue === 'string') {
            if (placeholders(value) !== placeholders(italianValue) || figures(value) !== figures(italianValue)) {
              issues.push(`week${week}.${key}`);
            }
            if (value === italianValue && !/^(Kiwi|Avocado|Banana)$/.test(value)) {
              issues.push(`week${week}.${key} untranslated`);
            }
          } else {
            issues.push(`week${week}.${key} missing`);
          }
        });
      }
    }
    expect(issues).toEqual([]);
    expect(total).toBe(200);
  });

  it('week number, image and source references are language-neutral (identical in every language)', () => {
    for (const week of weeks) {
      const reference = getPregnancyWeekData(week, 'en') as Record<string, unknown>;
      for (const language of ['fr', 'es', 'it'] as const) {
        const other = getPregnancyWeekData(week, language) as Record<string, unknown>;
        expect(other.week).toBe(reference.week);
        expect(other.babyImage).toBe(reference.babyImage);
        expect(other.sourceRefs).toEqual(reference.sourceRefs);
      }
    }
  });

  it('English, French and Spanish content are unchanged and still distinct from each other and from Italian', () => {
    for (const week of [4, 12, 20, 40]) {
      const descriptions = (['en', 'fr', 'es', 'it'] as const).map(l => getPregnancyWeekData(week, l)?.babyDescription);
      expect(new Set(descriptions).size).toBe(4);
    }
    expect(getPregnancyWeekData(12, 'en')?.length).toBe('About 5.4 cm');
    expect(getPregnancyWeekData(12, 'fr')?.length).toBe('Environ 5,4 cm');
    expect(getPregnancyWeekData(12, 'it')?.length).toBe('Circa 5,4 cm');
  });

  it('an invalid or missing language falls back to English', () => {
    for (const invalid of ['de', 'IT', 'it-IT', '', null, undefined]) {
      expect(getPregnancyWeekData(12, invalid as never)).toEqual(getPregnancyWeekData(12, 'en'));
    }
  });

  it('pregnancy calculations are independent of the language', async () => {
    const dating = new Date('2026-01-01T12:00:00');
    const now = new Date('2026-04-02T12:00:00');
    const results = [];
    for (const language of ['en', 'it', 'fr', 'es', 'it'] as const) {
      await switchLanguage(language);
      results.push(JSON.stringify(computePregnancyStatus('lastPeriod', dating, now)));
    }
    expect(new Set(results).size).toBe(1);
  });

  it('PregnancyWeekScreen renders the Italian description for the current week, not English, French or Spanish', async () => {
    const now = new Date();
    await setPregnancyDating({method: 'lastPeriod', date: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString()});
    await hydratePregnancyDating();
    const week = computePregnancyStatus('lastPeriod', new Date(getPregnancyDating().date as string), now).week;

    await switchLanguage('it');
    const texts = textsOf(await renderScreen(PregnancyWeekScreen as never));
    expect(texts).toContain(getPregnancyWeekData(week, 'it')?.babyDescription);
    for (const other of ['en', 'fr', 'es'] as const) {
      expect(texts).not.toContain(getPregnancyWeekData(week, other)?.babyDescription);
    }
  });

  it('PregnancyWeekScreen follows IT -> FR -> IT at runtime', async () => {
    const now = new Date();
    await setPregnancyDating({method: 'lastPeriod', date: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString()});
    await hydratePregnancyDating();
    const week = computePregnancyStatus('lastPeriod', new Date(getPregnancyDating().date as string), now).week;

    await switchLanguage('it');
    const renderer = await renderScreen(PregnancyWeekScreen as never);
    expect(textsOf(renderer)).toContain(getPregnancyWeekData(week, 'it')?.babyDescription);
    await switchLanguage('fr');
    expect(textsOf(renderer)).toContain(getPregnancyWeekData(week, 'fr')?.babyDescription);
    expect(textsOf(renderer)).not.toContain(getPregnancyWeekData(week, 'it')?.babyDescription);
    await switchLanguage('it');
    expect(textsOf(renderer)).toContain(getPregnancyWeekData(week, 'it')?.babyDescription);
  });
});
