import path from 'path';
import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import PostpartumJournalEntryScreen from '../../../screens/PostpartumJournalEntryScreen';
import {hydratePostpartumJournal} from '../../../state/postpartumJournalStore';
import {setAppLanguage} from '../../../state/themePreferences';
import {resolveAwaTheme} from '../../../theme/awaThemeTokens';
import {contrastRatio, parseColor} from '../../../theme/contrast';
import {decodePng, pixelAt} from '../../../testUtils/decodePng';
import i18n from '../../../i18n';
import {fr} from '../../../i18n/locales/fr';
import {
  HERO_BANNER_DESCRIPTION_GAP,
  HERO_BANNER_FATIGUE,
  HERO_BANNER_FILL_TEXT_END,
  HERO_BANNER_TEXT_CONTRAST,
  heroBannerFillLayout,
  heroBannerFillTextColors,
  type HeroBannerSpec,
} from '../PostpartumWellnessRatingLayout';

// Postpartum header cards: Humeur and Sommeil (PostpartumCycleStyleJournalLayout) and Fatigue, Douleurs and Récupération
// (PostpartumWellnessRatingLayout) use the same heading and description typography (DESIGN.md: Inter, heading weight 500, the
// titleMedium / bodySmall roles) and the same heading -> description gap. The Fatigue text reads at WCAG AA in every palette and
// mode, over the real artwork, and its scrim leaves the woman, the mug and the raised arm visible.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 900}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const active: ReactTestRenderer.ReactTestRenderer[] = [];

const CATEGORIES = ['mood', 'sleep', 'fatigue', 'pain', 'physicalRecovery'] as const;

const settle = async () => {
  for (let index = 0; index < 8; index += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};

async function renderRoute(category: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen component={PostpartumJournalEntryScreen as never} initialParams={{category}} name="Journal" />
              <Stack.Screen name="MainTabs">{() => <Text>home</Text>}</Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  active.push(renderer);
  await settle();
  return renderer;
}

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...(Array.isArray(style) ? style.flat(Infinity) : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');

async function heroStyles(category: (typeof CATEGORIES)[number]) {
  const renderer = await renderRoute(category);
  const copy = fr.postpartumJournalEntry[category];
  const texts = renderer.root.findAllByType(Text);
  const heading = texts.find(node => textOf(node) === copy.heroTitle);
  const description = texts.find(node => textOf(node) === copy.heroText);
  expect([category, heading !== undefined, description !== undefined]).toEqual([category, true, true]);
  return {heading: flat(heading!.props.style), description: flat(description!.props.style)};
}

beforeEach(async () => {
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
  await hydratePostpartumJournal();
});

afterEach(() => {
  act(() => {
    active.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe('Postpartum header cards — one typography for the heading and the description', () => {
  it.each(CATEGORIES)('%s: titleMedium 16 / 24 at weight 500 for the heading, bodySmall 12 / 16 at weight 400 for the description', async category => {
    const {heading, description} = await heroStyles(category);
    // `emphasized` (weight 600) is gone from the Fatigue / Douleurs / Récupération heading: DESIGN.md headings are 500
    expect(heading).toMatchObject({fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontWeight: '500'});
    expect(description).toMatchObject({fontSize: 12, lineHeight: 16, letterSpacing: 0.4, fontWeight: '400'});
    // no display (serif) face, no hard-coded family: Inter through the typography layer
    expect(heading.fontFamily).toBeUndefined();
    expect(description.fontFamily).toBeUndefined();
  });

  it.each(CATEGORIES)('%s: the description sits 5 dp under the heading', async category => {
    const {description} = await heroStyles(category);
    expect(description.marginTop).toBe(5);
    expect(HERO_BANNER_DESCRIPTION_GAP).toBe(5);
  });

  it('the Fatigue title keeps its French wording and its line break, without the stray space before it', () => {
    expect(fr.postpartumJournalEntry.fatigue.heroTitle).toBe('Comment est\nton énergie ?');
    expect(fr.postpartumJournalEntry.fatigue.heroTitle).not.toMatch(/\s\n/);
  });
});

describe('Postpartum Fatigue header — contrast over the real artwork, in every palette and mode', () => {
  const spec = HERO_BANNER_FATIGUE as Extract<HeroBannerSpec, {layout: 'fill'}>;
  const IMAGE = decodePng(path.join(__dirname, '..', '..', '..', 'assets', 'images', 'postpartum', 'postpartum-fatigue.png'));
  const RATIO = IMAGE.width / IMAGE.height;
  const IDS = ['awa-original', 'lavender-night', 'rose-quartz', 'sage-serenity', 'ocean-calm', 'warm-sand'] as const;
  const MODES: Array<[string, boolean, boolean]> = [
    ['light', false, false],
    ['dark', true, false],
    ['true black', true, true],
  ];
  // card sizes on a 320 / 360 / 412 dp phone (screen - 2 x 20 dp padding; height from the wrapped French text)
  const CARDS = [
    {width: 280, height: 214},
    {width: 320, height: 203},
    {width: 372, height: 175},
  ];

  const alphaAt = (fraction: number): number => {
    const stops = spec.scrim;
    if (fraction <= stops[0][0]) {return stops[0][1];}
    for (let index = 1; index < stops.length; index += 1) {
      const [x1, a1] = stops[index];
      const [x0, a0] = stops[index - 1];
      if (fraction <= x1) {return a0 + ((a1 - a0) * (fraction - x0)) / (x1 - x0);}
    }
    return stops[stops.length - 1][1];
  };
  const layoutFor = (card: {width: number; height: number}) => heroBannerFillLayout(spec, RATIO, card);
  // right edge of the text column as a fraction of the card's inner width (copy 62 % of the card, title / description at most 71 % of it)
  const textEnd = (cardWidth: number): number => {
    const inner = cardWidth - 2;
    return (16 + (parseFloat(spec.copyWidth) / 100 * inner - 16) * (parseFloat(spec.textMaxWidth) / 100)) / inner;
  };
  const luminance = (rgb: number[]): number => {
    const channel = (value: number) => {
      const c = value / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  };
  const toRgb = (color: string): number[] => {
    const {r, g, b} = parseColor(color);
    return [r, g, b];
  };

  it('the scrim is fully solid behind the whole text column, on every phone width', () => {
    for (const width of [240, 280, 320, 372, 412]) {
      expect(textEnd(width)).toBeLessThan(HERO_BANNER_FILL_TEXT_END);
      expect(alphaAt(textEnd(width))).toBe(1);
    }
  });

  it.each(IDS.flatMap(id => MODES.map(([mode, dark, black]) => [id, mode, dark, black] as const)))(
    '%s / %s: heading and description are at least 4.5:1 against every pixel behind the text, artwork included',
    (id, _mode, dark, black) => {
      const theme = resolveAwaTheme(id, dark, black);
      const colors = heroBannerFillTextColors(theme);
      const soft = toRgb(theme.colors.primarySoft);
      // the guard itself: AA plus the margin, against the card surface the scrim is made of
      expect(contrastRatio(colors.heading, theme.colors.primarySoft)).toBeGreaterThanOrEqual(HERO_BANNER_TEXT_CONTRAST - 1e-9);
      expect(contrastRatio(colors.description, theme.colors.primarySoft)).toBeGreaterThanOrEqual(HERO_BANNER_TEXT_CONTRAST - 1e-9);

      let worstHeading = Infinity;
      let worstDescription = Infinity;
      for (const card of CARDS) {
        const inner = {width: card.width - 2, height: card.height - 2};
        const layout = layoutFor(card);
        const end = Math.floor(textEnd(card.width) * inner.width);
        const rows: Array<[string, number, number]> = [
          ['heading', 14 + 28 + 14, 14 + 28 + 14 + 48],
          ['description', 14 + 28 + 14 + 48 + 5, card.height - 14],
        ];
        for (const [kind, y0, y1] of rows) {
          const text = toRgb(kind === 'heading' ? colors.heading : colors.description);
          for (let y = y0; y < y1; y += 2) {
            for (let x = 16; x < end; x += 2) {
              const alpha = alphaAt(x / inner.width);
              const picture = pixelAt(IMAGE, ((x - layout.left) / layout.width) * IMAGE.width, ((y - layout.top) / layout.height) * IMAGE.height);
              const background = soft.map((value, index) => value * alpha + picture[index] * (1 - alpha));
              const ratio = (Math.max(luminance(background), luminance(text)) + 0.05) / (Math.min(luminance(background), luminance(text)) + 0.05);
              if (kind === 'heading') {worstHeading = Math.min(worstHeading, ratio);} else {worstDescription = Math.min(worstDescription, ratio);}
            }
          }
        }
      }
      expect(worstHeading).toBeGreaterThanOrEqual(4.5);
      expect(worstDescription).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each([
    // [card, the most veil each landmark of the artwork may sit under]: the mug is at 62 - 70 %, the face at 70 - 78 %, the raised arm from 80 %
    // of the picture's width. On the narrowest phones (280 dp card) the picture is zoomed by the taller card and the mug's left edge falls inside
    // the text column, which the solid scrim has to protect; everything from the face on stays clear.
    [CARDS[0], {mugLeft: 1, mugRight: 0.3, face: 0.3, arm: 0}],
    [CARDS[1], {mugLeft: 0.6, mugRight: 0.05, face: 0.05, arm: 0}],
    [CARDS[2], {mugLeft: 0.05, mugRight: 0.05, face: 0.05, arm: 0}],
  ] as const)('card %j: the woman, her mug and her raised arm are not hidden by the scrim', (card, limits) => {
    const layout = layoutFor(card);
    const inner = card.width - 2;
    const alphaOfPicture = (fraction: number) => alphaAt((layout.left + fraction * layout.width) / inner);
    expect(alphaOfPicture(0.62)).toBeLessThanOrEqual(limits.mugLeft);
    expect(alphaOfPicture(0.7)).toBeLessThanOrEqual(limits.mugRight);
    expect(alphaOfPicture(0.7)).toBeLessThanOrEqual(limits.face);
    expect(alphaOfPicture(0.78)).toBeLessThanOrEqual(limits.face);
    expect(alphaOfPicture(0.8)).toBeLessThanOrEqual(limits.arm);
    expect(alphaOfPicture(0.94)).toBe(0);
  });
});
