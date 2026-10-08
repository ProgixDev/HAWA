import AsyncStorage from '@react-native-async-storage/async-storage';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Image} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import LibraryScreen from '../LibraryScreen';
import CyclePhasesArticleScreen from '../library/CyclePhasesArticleScreen';
import FertilityWindowArticleScreen from '../library/FertilityWindowArticleScreen';
import FiqhWomenIntroArticleScreen from '../library/FiqhWomenIntroArticleScreen';
import FirstPeriodArticleScreen from '../library/FirstPeriodArticleScreen';
import FirstPeriodComingArticleScreen from '../library/FirstPeriodComingArticleScreen';
import FirstPeriodFaqArticleScreen from '../library/FirstPeriodFaqArticleScreen';
import FirstPeriodIrregularArticleScreen from '../library/FirstPeriodIrregularArticleScreen';
import FirstPeriodProtectionArticleScreen from '../library/FirstPeriodProtectionArticleScreen';
import FirstPeriodSignsArticleScreen from '../library/FirstPeriodSignsArticleScreen';
import HormonalTreatmentsPanoramaArticleScreen from '../library/HormonalTreatmentsPanoramaArticleScreen';
import PatchArticleScreen from '../library/PatchArticleScreen';
import PcosSkinHairArticleScreen from '../library/PcosSkinHairArticleScreen';
import RamadanFastingArticleScreen from '../library/RamadanFastingArticleScreen';
import PregnancyWeeklyArticleScreen from '../library/PregnancyWeeklyArticleScreen';
import PregnancyExerciseArticleScreen from '../library/PregnancyExerciseArticleScreen';
import ExerciseCycleSupportArticleScreen from '../library/ExerciseCycleSupportArticleScreen';
import {
  EDITORIAL_IMAGE_ALT,
  CYCLE_PHASES_HERO,
  EXERCISE_HERO,
  PREGNANCY_EXERCISE_HERO,
  PREGNANCY_FOLLOW_UP_HERO,
  resolveEditorialImage,
} from '../../i18n/editorialImages';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {computePregnancyStatus} from '../../utils/pregnancyTrackingUtils';
import {resetAppLanguageForTests, setAppLanguage, type AwaAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Jest maps every .png to one shared stub, so file identity cannot be observed in a render.
// The image module is therefore replaced by distinctly-labelled sentinel sets ("cycle:it"),
// while the REAL resolveEditorialImage / EDITORIAL_IMAGE_ALT stay in use: each assertion
// proves which language's variant a screen actually selected.
jest.mock('../../i18n/editorialImages', () => {
  const actual = jest.requireActual('../../i18n/editorialImages');
  const sentinel = (name: string) => ({fr: `${name}:fr`, en: `${name}:en`, es: `${name}:es`, it: `${name}:it`});
  return {
    ...actual,
    CYCLE_PHASES_HERO: sentinel('cycle'),
    PREGNANCY_FOLLOW_UP_HERO: sentinel('followup'),
    PREGNANCY_EXERCISE_HERO: sentinel('pregex'),
    EXERCISE_HERO: sentinel('exercise'),
  };
});

// Each article test mounts a large screen once per language; allow for a loaded CI machine.
jest.setTimeout(30000);

const LIB_IMG = path.resolve(__dirname, '../../assets/images/library');
const LIB_SCREENS = path.resolve(__dirname, '../library');
const LANGS = ['fr', 'en', 'es', 'it'] as const;

const IMAGES = [
  {base: 'cycle-phases-hero', size: [1672, 941]},
  {base: 'grossesse_semiane', size: [1774, 887]},
  {base: 'activité_grossesse', size: [1774, 887]},
  {base: 'activité', size: [1774, 887]},
] as const;

// Reads the pixel size from the WebP container header (lossy VP8, lossless VP8L or extended VP8X).
const webpSize = (file: string): [number, number] => {
  const b = fs.readFileSync(file);
  expect(b.subarray(0, 4).toString('ascii')).toBe('RIFF');
  expect(b.subarray(8, 12).toString('ascii')).toBe('WEBP');
  expect(b.readUInt32LE(4) + 8).toBe(b.length); // container length is consistent: not truncated
  const chunk = b.subarray(12, 16).toString('ascii');
  if (chunk === 'VP8 ') {
    return [b.readUInt16LE(26) % 16384, b.readUInt16LE(28) % 16384];
  }
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return [(bits % 16384) + 1, (Math.floor(bits / 16384) % 16384) + 1];
  }
  if (chunk === 'VP8X') {
    return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1];
  }
  throw new Error(`unknown WebP chunk ${chunk} in ${file}`);
};

const pngSize = (file: string): [number, number] => {
  const buffer = fs.readFileSync(file);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
};

describe('assets: 16 localized WebP files, original sources untouched', () => {
  it('every language variant exists, is a well-formed WebP, and has exactly the original image proportions', () => {
    for (const {base, size} of IMAGES) {
      expect(fs.existsSync(path.join(LIB_IMG, `${base}.png`))).toBe(true); // original PNG kept
      expect(pngSize(path.join(LIB_IMG, `${base}.png`))).toEqual(size);
      for (const lang of LANGS) {
        const file = path.join(LIB_IMG, `${base}.${lang}.webp`);
        expect([file, fs.existsSync(file)]).toEqual([file, true]);
        expect([base, lang, webpSize(file)]).toEqual([base, lang, size]);
        expect(fs.statSync(file).size).toBeGreaterThan(50 * 1024); // not blank/placeholder
        expect(fs.statSync(file).size).toBeLessThan(600 * 1024); // optimized (PNG was 1.4-2.2 MB)
      }
    }
  });

  it('no stale PNG variant is left beside the WebP files (masters live outside the bundle)', () => {
    const stale = fs.readdirSync(LIB_IMG).filter(name => /\.(en|fr|es|it)\.png$/.test(name));
    expect(stale).toEqual([]);
  });

  it('the four per-language variants of each image are genuinely different files', () => {
    for (const {base} of IMAGES) {
      const digests = new Set(LANGS.map(lang => fs.readFileSync(path.join(LIB_IMG, `${base}.${lang}.webp`)).toString('base64')));
      expect(digests.size).toBe(4);
    }
  });

  it('the total shipped size of the 16 variants is far below the former 26.6 MB of PNG', () => {
    const total = IMAGES.flatMap(({base}) => LANGS.map(lang => fs.statSync(path.join(LIB_IMG, `${base}.${lang}.webp`)).size)).reduce((a, b) => a + b, 0);
    expect(total / 1048576).toBeLessThan(5);
  });

  it('editorialImages.ts uses only static require() of existing .webp files, one per language, no dynamic paths', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../i18n/editorialImages.ts'), 'utf8');
    const requires = [...source.matchAll(/require\('([^']+)'\)/g)].map(match => match[1]);
    expect(requires).toHaveLength(16);
    for (const relative of requires) {
      expect([relative, fs.existsSync(path.resolve(__dirname, '../../i18n', relative))]).toEqual([relative, true]);
      expect(relative.endsWith('.webp')).toBe(true);
    }
    const code = source
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');
    expect(code).not.toMatch(/require\(\s*[^'\s]/); // no template/concatenated paths
    for (const {base} of IMAGES) {
      for (const lang of LANGS) {
        expect(requires.filter(r => r.endsWith(`${base}.${lang}.webp`))).toHaveLength(1);
      }
    }
  });

  it('Jest and Metro both treat .webp as a bundled image asset', () => {
    const jestConfig = fs.readFileSync(path.resolve(__dirname, '../../../jest.config.js'), 'utf8');
    expect(jestConfig).toMatch(/png\|webp/);
        const {assetExts} = require('metro-config/src/defaults/defaults') as {assetExts: string[]};
    expect(assetExts).toContain('webp');
  });
});

describe('resolver (real implementation, sentinel sets)', () => {
  const real = jest.requireActual('../../i18n/editorialImages') as typeof import('../../i18n/editorialImages');
  const set = {fr: 'F', en: 'E', es: 'S', it: 'I'} as never;

  it.each([
    ['en', 'E'],
    ['fr', 'F'],
    ['es', 'S'],
    ['it', 'I'],
  ])('language %s selects its own variant', (language, expected) => {
    expect(real.resolveEditorialImage(set, language)).toBe(expected);
  });

  it.each(['de', 'IT', 'it-IT', '', undefined, null])('invalid language %j falls back to English', invalid => {
    expect(real.resolveEditorialImage(set, invalid as never)).toBe('E');
  });

  it('a plain (language-neutral) image passes through untouched', () => {
    expect(real.resolveEditorialImage(12 as never, 'it')).toBe(12);
    const uri = {uri: 'https://example.invalid/a.png'} as never;
    expect(real.resolveEditorialImage(uri, 'it')).toBe(uri);
  });

  it('the shipped sets are complete and keyed fr/en/es/it', () => {
    for (const shipped of [real.CYCLE_PHASES_HERO, real.PREGNANCY_FOLLOW_UP_HERO, real.PREGNANCY_EXERCISE_HERO, real.EXERCISE_HERO]) {
      expect(Object.keys(shipped).sort()).toEqual(['en', 'es', 'fr', 'it']);
    }
    expect(resolveEditorialImage).toBe(real.resolveEditorialImage);
    expect(CYCLE_PHASES_HERO).not.toBe(real.CYCLE_PHASES_HERO); // the mock is in effect for renders
    expect([PREGNANCY_FOLLOW_UP_HERO, PREGNANCY_EXERCISE_HERO, EXERCISE_HERO]).toHaveLength(3);
  });
});

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

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

const imagesOf = (renderer: ReactTestRenderer.ReactTestRenderer, prefix: string) =>
  renderer.root
    .findAllByType(Image)
    .filter(node => typeof node.props.source === 'string' && (node.props.source as string).startsWith(`${prefix}:`));

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

const CYCLE_ARTICLES: Array<[string, React.ComponentType<never>]> = [
  ['CyclePhases', CyclePhasesArticleScreen as never],
  ['FertilityWindow', FertilityWindowArticleScreen as never],
  ['FiqhWomenIntro', FiqhWomenIntroArticleScreen as never],
  ['FirstPeriod', FirstPeriodArticleScreen as never],
  ['FirstPeriodComing', FirstPeriodComingArticleScreen as never],
  ['FirstPeriodFaq', FirstPeriodFaqArticleScreen as never],
  ['FirstPeriodIrregular', FirstPeriodIrregularArticleScreen as never],
  ['FirstPeriodProtection', FirstPeriodProtectionArticleScreen as never],
  ['FirstPeriodSigns', FirstPeriodSignsArticleScreen as never],
  ['HormonalTreatmentsPanorama', HormonalTreatmentsPanoramaArticleScreen as never],
  ['Patch', PatchArticleScreen as never],
  ['PcosSkinHair', PcosSkinHairArticleScreen as never],
  ['RamadanFasting', RamadanFastingArticleScreen as never],
];

describe('the 13 Library articles that show the cover image', () => {
  it('exactly these 13 article files reference the localized cover, none the original file', () => {
    const using = fs
      .readdirSync(LIB_SCREENS)
      .filter(name => /ArticleScreen\.tsx$/.test(name))
      .filter(name => fs.readFileSync(path.join(LIB_SCREENS, name), 'utf8').includes('CYCLE_PHASES_HERO'))
      .map(name => name.replace('ArticleScreen.tsx', ''));
    expect(using.sort()).toEqual(CYCLE_ARTICLES.map(([name]) => name).sort());
    for (const name of fs.readdirSync(LIB_SCREENS).filter(n => /\.tsx$/.test(n))) {
      expect(fs.readFileSync(path.join(LIB_SCREENS, name), 'utf8')).not.toMatch(/cycle-phases-hero\.png|grossesse_semiane\.png|activité_grossesse\.png|activité\.png/);
    }
  });

  it.each(CYCLE_ARTICLES)('%s renders the cover in the selected language for EN, FR, ES and IT', async (_name, Screen) => {
    for (const language of ['en', 'fr', 'es', 'it'] as const) {
      await switchLanguage(language);
      const renderer = await renderScreen(Screen);
      const covers = imagesOf(renderer, 'cycle');
      expect(covers.length).toBeGreaterThan(0);
      for (const node of covers) {
        expect(node.props.source).toBe(`cycle:${language}`);
      }
      act(() => {
        renderer.unmount();
      });
      activeRenderers.pop();
    }
  });

  it('an unrecognized language shows the English cover', async () => {
    await act(async () => {
      await i18n.changeLanguage('de');
    });
    await settle();
    const covers = imagesOf(await renderScreen(FirstPeriodArticleScreen as never), 'cycle');
    expect(covers.length).toBeGreaterThan(0);
    expect(covers.every(node => node.props.source === 'cycle:en')).toBe(true);
  });

  it('a mounted article swaps the cover immediately: EN -> IT -> FR -> ES -> IT, no stale image', async () => {
    const renderer = await renderScreen(FirstPeriodFaqArticleScreen as never); // also has a related-article thumbnail
    for (const language of ['en', 'it', 'fr', 'es', 'it'] as const) {
      await switchLanguage(language);
      const covers = imagesOf(renderer, 'cycle');
      expect(covers.length).toBeGreaterThan(0);
      expect(covers.every(node => node.props.source === `cycle:${language}`)).toBe(true);
    }
  });
});

describe('pregnancy and exercise heroes', () => {
  const HEROES: Array<[string, React.ComponentType<never>, string, keyof typeof EDITORIAL_IMAGE_ALT]> = [
    ['Pregnancy weekly (medical follow-up)', PregnancyWeeklyArticleScreen as never, 'followup', 'pregnancyFollowUp'],
    ['Pregnancy exercise', PregnancyExerciseArticleScreen as never, 'pregex', 'pregnancyExercise'],
    ['Exercise & cycle support', ExerciseCycleSupportArticleScreen as never, 'exercise', 'exercise'],
  ];

  it.each(HEROES)('%s: selected-language image, with a spoken description in that language', async (_name, Screen, prefix, altKey) => {
    for (const language of ['en', 'fr', 'es', 'it'] as const) {
      await switchLanguage(language);
      const renderer = await renderScreen(Screen);
      const heroes = imagesOf(renderer, prefix);
      expect(heroes).toHaveLength(1);
      expect(heroes[0].props.source).toBe(`${prefix}:${language}`);
      expect(heroes[0].props.accessible).toBe(true);
      expect(heroes[0].props.accessibilityLabel).toBe(EDITORIAL_IMAGE_ALT[altKey][language]);
      act(() => {
        renderer.unmount();
      });
      activeRenderers.pop();
    }
  });

  it('the spoken descriptions exist in all four languages, are distinct, and describe the lettering', () => {
    for (const key of Object.keys(EDITORIAL_IMAGE_ALT) as Array<keyof typeof EDITORIAL_IMAGE_ALT>) {
      const values = LANGS.map(lang => EDITORIAL_IMAGE_ALT[key][lang]);
      expect(new Set(values).size).toBe(4);
      expect(values.every(value => value.length > 40)).toBe(true);
    }
    expect(EDITORIAL_IMAGE_ALT.exercise.it).toContain('Muoviti per sentirti bene');
    expect(EDITORIAL_IMAGE_ALT.pregnancyFollowUp.es).toContain('Control médico durante el embarazo');
  });

  it('the cover stays decorative: no accessibility label is attached to it', async () => {
    const renderer = await renderScreen(FirstPeriodArticleScreen as never);
    for (const node of imagesOf(renderer, 'cycle')) {
      expect(node.props.accessibilityLabel).toBeUndefined();
    }
  });
});

describe('Library home — the popular-articles cover thumbnail', () => {
  const LibraryHome = () => <LibraryScreen navigation={{} as never} route={{} as never} />;

  it('follows the app language, including a live switch while the screen stays mounted', async () => {
    const renderer = await renderScreen(LibraryHome as never);
    for (const language of ['en', 'it', 'fr', 'es', 'it'] as const) {
      await switchLanguage(language);
      const thumbs = imagesOf(renderer, 'cycle');
      expect(thumbs.length).toBeGreaterThan(0);
      expect(thumbs.every(node => node.props.source === `cycle:${language}`)).toBe(true);
    }
  });
});

describe('nothing else changed', () => {
  it('week-by-week pregnancy content and calculations are unaffected by the image change', () => {
    for (const language of ['fr', 'en', 'es', 'it'] as const) {
      expect(getPregnancyWeekData(12, language)?.length).toBeTruthy();
    }
    expect(getPregnancyWeekData(12, 'en')?.length).toBe('About 5.4 cm');
    const status = computePregnancyStatus('lastPeriod', new Date('2026-01-01T12:00:00'), new Date('2026-04-02T12:00:00'));
    expect(status.week).toBeGreaterThan(0);
  });
});
