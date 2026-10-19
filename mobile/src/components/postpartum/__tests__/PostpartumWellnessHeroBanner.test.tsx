import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Image, Text} from 'react-native';
import {NavigationContainer, createNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import {setAppearanceMode, setAppLanguage, setSelectedThemeId, setTrueBlackEnabled} from '../../../state/themePreferences';
import i18n from '../../../i18n';
import {fr} from '../../../i18n/locales/fr';
import LinearGradient from 'react-native-linear-gradient';
import {HERO_BANNER_FATIGUE, HERO_BANNER_RECOVERY, heroBannerFillLayout, PostpartumWellnessRatingLayout, type HeroBannerSpec} from '../PostpartumWellnessRatingLayout';

// Postpartum → Pain header card: the new postpartum-pain.png is a wide banner photo (subject on the right, pale side on
// the left). With `heroBanner` it is drawn at its own ratio (read from the bundled file, so replacing the artwork cannot distort it) on the right of the card, fading into the card
// surface, and the French copy stays on the themed surface; the cut-out figures of the other categories keep their
// original small contained image.

const Stack = createNativeStackNavigator();
const navRef = createNavigationContainerRef();
const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const PAIN = require('../../../assets/images/postpartum/postpartum-pain.png');
const FATIGUE = require('../../../assets/images/postpartum/postpartum-fatigue.png');
const RECOVERY = require('../../../assets/images/postpartum/postpartum-recovery.png');
const active: ReactTestRenderer.ReactTestRenderer[] = [];

async function render(heroBanner: boolean | HeroBannerSpec, image: number, heroTitle: string = fr.postpartumJournalEntry.pain.heroTitle, heroText: string = fr.postpartumJournalEntry.pain.heroText) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AwaThemeProvider>
          <NavigationContainer ref={navRef}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Test">
                {() => (
                  <PostpartumWellnessRatingLayout
                    adviceIcon="heart-pulse"
                    adviceText="a"
                    adviceTitle="b"
                    dateLabel="d"
                    heroBanner={heroBanner}
                    heroImage={image}
                    heroText={heroText}
                    heroTitle={heroTitle}
                    onSave={jest.fn()}
                    onSelect={jest.fn()}
                    options={[]}
                    title="Douleurs"
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  active.push(renderer);
  return renderer;
}

const flat = (style: unknown): Record<string, unknown> => Object.assign({}, ...(Array.isArray(style) ? style : [style]).filter(Boolean));
const heroImages = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType(Image).filter(node => node.props.accessibilityIgnoresInvertColors);

beforeEach(async () => {
  await setSelectedThemeId('awa-original');
  await setTrueBlackEnabled(false);
  await setAppLanguage('fr');
  await i18n.changeLanguage('fr');
});

afterEach(() => {
  act(() => {
    active.splice(0).forEach(renderer => renderer.unmount());
  });
});

describe.each(['light', 'dark'] as const)('Postpartum pain header card — %s', mode => {
  beforeEach(async () => {
    await setAppearanceMode(mode);
  });

  it('draws the banner photo undistorted (file ratio, cover) and keeps the French copy', async () => {
    const renderer = await render(true, PAIN);
    const [image] = heroImages(renderer);
    expect(heroImages(renderer)).toHaveLength(1);
    expect(image.props.source).toBe(PAIN);
    expect(image.props.resizeMode).toBe('cover');
    // explicit dp size (not an aspect-ratio resolved by the layout engine): the file's ratio, never taller than 220 dp
    const {width, height} = flat(image.props.style) as {width: number; height: number};
    expect(width / height).toBeCloseTo(1908 / 824, 1);
    expect(height).toBeLessThanOrEqual(220);
    expect(height).toBeGreaterThan(100);
    const texts = renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
    expect(texts).toContain('SUIVI POST-PARTUM');
    expect(texts).toContain('Comment te sens-tu\ndans ton corps ?');
    expect(texts).toContain('Noter ton confort aide à mieux comprendre tes besoins au fil des jours.');
  });

  it('Energy card: postpartum-fatigue.png is a full-bleed background of the whole card, under a left-to-right scrim, with the French copy', async () => {
    const renderer = await render(HERO_BANNER_FATIGUE, FATIGUE, fr.postpartumJournalEntry.fatigue.heroTitle, fr.postpartumJournalEntry.fatigue.heroText);
    const [image] = heroImages(renderer);
    expect(heroImages(renderer)).toHaveLength(1);
    expect(image.props.source).toBe(FATIGUE);
    // explicit absolute box in the card's own coordinates (no clip box, no top offset): it covers every edge of the card
    // (no layout pass in the test renderer: the 320 x 176 fallback card, 318 x 174 inside its 1 dp border)
    const {position: placement, left, top, width, height} = flat(image.props.style) as Record<string, number | string>;
    expect(placement).toBe('absolute');
    expect(width as number / (height as number)).toBeCloseTo(1916 / 821, 1);
    expect(top as number).toBeLessThanOrEqual(0);
    expect(left as number).toBeLessThanOrEqual(0);
    expect((top as number) + (height as number)).toBeGreaterThanOrEqual(174);
    expect((left as number) + (width as number)).toBeGreaterThanOrEqual(318);
    // a single full-card scrim above the picture: strongest on the left, fully transparent on the right, no seam
    const scrims = renderer.root.findAllByType(LinearGradient);
    expect(scrims).toHaveLength(1);
    const scrim = scrims[0];
    expect(flat(scrim.props.style)).toMatchObject({position: 'absolute', top: 0, right: 0, bottom: 0, left: 0});
    expect(scrim.props.start).toEqual({x: 0, y: 0});
    expect(scrim.props.end).toEqual({x: 1, y: 0});
    expect(scrim.props.locations[0]).toBe(0);
    expect(scrim.props.locations.every((position: number, index: number, all: number[]) => index === 0 || position > all[index - 1])).toBe(true);
    const alphas = (scrim.props.colors as string[]).map(color => Number(/rgba?\([^)]*,\s*([\d.]+)\)\s*$/.exec(color)?.[1] ?? 1));
    expect(alphas[0]).toBeGreaterThan(0.9);
    expect(alphas[alphas.length - 1]).toBe(0);
    expect(alphas.every((alpha, index) => index === 0 || alpha <= alphas[index - 1])).toBe(true);
    const texts = renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
    expect(texts).toContain('SUIVI POST-PARTUM');
    expect(texts).toContain(fr.postpartumJournalEntry.fatigue.heroTitle);
    expect(texts).toContain(fr.postpartumJournalEntry.fatigue.heroText);
    expect(renderer.root.findAll(node => node.props.numberOfLines === 1 && [node.props.children].flat(Infinity).join('') === 'SUIVI POST-PARTUM').length).toBeGreaterThan(0);
  });

  it('Recovery card: draws postpartum-recovery.png at its own 4:3 ratio, as tall as the card, with the French copy', async () => {
    const renderer = await render(HERO_BANNER_RECOVERY, RECOVERY, fr.postpartumJournalEntry.physicalRecovery.heroTitle, fr.postpartumJournalEntry.physicalRecovery.heroText);
    const [image] = heroImages(renderer);
    expect(heroImages(renderer)).toHaveLength(1);
    expect(image.props.source).toBe(RECOVERY);
    const {width, height} = flat(image.props.style) as {width: number; height: number};
    expect(width / height).toBeCloseTo(1448 / 1086, 1);
    // no layout pass in the test renderer: the 176 dp fallback card height, never taller than 240 dp
    expect(height).toBe(176);
    const texts = renderer.root.findAllByType(Text).map(node => [node.props.children].flat(Infinity).join(''));
    expect(texts).toContain('SUIVI POST-PARTUM');
    expect(texts).toContain('Comment évolue ta récupération ?');
    expect(texts).toContain('Ton bien-être se construit un jour après l’autre, sans pression.');
  });

  it('takes the picture ratio from the bundled asset, not from a constant (artwork swapped for another size)', async () => {
    const spy = jest.spyOn(Image, 'resolveAssetSource').mockReturnValue({uri: 'x', width: 1000, height: 500, scale: 1});
    try {
      const renderer = await render(true, PAIN);
      const {width, height} = flat(heroImages(renderer)[0].props.style) as {width: number; height: number};
      expect(width / height).toBeCloseTo(2, 2);
    } finally {
      spy.mockRestore();
    }
  });

  it('without banner mode the cut-out hero is unchanged', async () => {
    const renderer = await render(false, FATIGUE);
    const [image] = heroImages(renderer);
    expect(image.props.resizeMode).toBe('contain');
    expect(flat(image.props.style)).toMatchObject({width: 172, height: 190});
  });
});

describe('heroBannerFillLayout — full-bleed picture geometry', () => {
  const RATIO = 1916 / 821;
  const spec = HERO_BANNER_FATIGUE as Extract<HeroBannerSpec, {layout: 'fill'}>;

  it.each([
    [296, 203],
    [320, 187],
    [360, 187],
    [412, 171],
    [412, 164],
    [600, 164],
    [320, 400],
  ])('card %i x %i dp: touches all four edges, keeps the ratio, keeps the woman, mug and raised arm inside', (cardWidth, cardHeight) => {
    const innerWidth = cardWidth - 2;
    const innerHeight = cardHeight - 2;
    const {left, top, width, height} = heroBannerFillLayout(spec, RATIO, {width: cardWidth, height: cardHeight});
    expect(width / height).toBeCloseTo(RATIO, 5);
    // every edge covered: no gap above, below, left or right of the picture
    expect(left).toBeLessThanOrEqual(1e-9);
    expect(top).toBeLessThanOrEqual(1e-9);
    expect(left + width).toBeGreaterThanOrEqual(innerWidth - 1e-9);
    expect(top + height).toBeGreaterThanOrEqual(innerHeight - 1e-9);
    // the subject (up to 94 % of the picture's width: raised arm) is inside the card, and the picture is shifted as far right as that allows
    expect((innerWidth - left) / width).toBeGreaterThanOrEqual(spec.focusRight - 1e-9);
    // not zoomed more than the card needs (cover, never an extra scale)
    expect(height).toBeCloseTo(Math.max(innerHeight, innerWidth / RATIO), 5);
  });
});
