import React from 'react';
import {Pressable, ScrollView, Text} from 'react-native';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import WelcomeScreen from '../WelcomeScreen';
import NameOnboardingScreen from '../NameOnboardingScreen';
import i18n from '../../i18n';
import {en} from '../../i18n/locales/en';
import {AWA_COMPONENT_DIMENSION_PROPOSALS} from '../../theme/componentDimensions';
import {awaShapes} from '../../theme/shapes';
import {AWA_PRIMARY_ACTION_LABEL} from '../../theme/typescale';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {THEME_VARIANTS, flattenStyle, renderWithAwaTheme, resetThemeStores} from '../../testUtils/renderWithAwaTheme';

// Name screen layout adjustment (block raised in the upper part of the screen) and the proof that its primary button is
// the documented design-system button, identical to the Welcome primary action except for width and top margin.
// Code-level checks only: how it looks on the phone is a separate (device) validation.

const METRICS: Metrics = {frame: {x: 0, y: 0, width: 360, height: 740}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const wrap = (element: React.ReactElement) => <SafeAreaProvider initialMetrics={METRICS}>{element}</SafeAreaProvider>;
const welcome = () => <WelcomeScreen navigation={{navigate: jest.fn()} as never} route={{key: 'w', name: 'Welcome'} as never} />;
const nameScreen = () => <NameOnboardingScreen navigation={{navigate: jest.fn()} as never} route={{key: 'n', name: 'NameOnboarding'} as never} />;

type StyledElement = React.ReactElement<{style?: unknown}>;

const joined = (node: {props: {children?: unknown}}) =>
  [node.props.children].flat(Infinity).filter(child => typeof child === 'string' || typeof child === 'number').join('');

beforeEach(async () => {
  await resetAppLanguageForTests();
  await setAppLanguage('en');
  await i18n.changeLanguage('en');
});

afterEach(async () => {
  await resetThemeStores();
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Name screen: the block sits in the upper part of the screen, not dead centre', () => {
  it('the scroll content is not vertically centred and still fills the viewport', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    const container = flattenStyle(renderer.root.findByType(ScrollView).props.contentContainerStyle);
    expect(container.flexGrow).toBe(1);
    expect(container.justifyContent).toBeUndefined();
    expect(container.paddingHorizontal).toBe(24);
  });

  it('two flexible spacers frame the block and share the free space 1 : 2 (less above than below)', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    const children = React.Children.toArray(renderer.root.findByType(ScrollView).props.children) as StyledElement[];
    const first = flattenStyle(children[0].props.style);
    const last = flattenStyle(children[children.length - 1].props.style);
    expect(first.flex).toBe(1);
    expect(last.flex).toBe(2);
    expect((first.flex as number) / ((first.flex as number) + (last.flex as number))).toBeLessThan(0.5); // above the centre line
    // nothing but the spacers is flexible: the block between them keeps its natural size
    children.slice(1, -1).forEach(child => {
      expect(flattenStyle(child.props.style ?? {}).flex).toBeUndefined();
    });
    // the first child after the spacer is the header block, so the icon is the top of the visible content
    expect(flattenStyle(children[1].props.style).alignItems).toBe('center');
  });

  it('the spacing inside the raised block is unchanged (icon, label, heading, subtitle, then the form)', async () => {
    const {renderer} = await renderWithAwaTheme(wrap(nameScreen()));
    const styleOf = (text: string) => {
      const node = renderer.root.findAllByType(Text).find(candidate => joined(candidate) === text);
      if (!node) {throw new Error(`no Text "${text}"`);}
      return flattenStyle(node.props.style);
    };
    expect(styleOf(en.onboarding.name.eyebrow).marginTop).toBe(16); // icon -> label
    expect(styleOf(en.onboarding.name.title).marginTop).toBe(8); // label -> heading
    expect(styleOf(en.onboarding.name.formSubtitle).marginTop).toBe(8); // heading -> subtitle
    const header = (React.Children.toArray(renderer.root.findByType(ScrollView).props.children) as StyledElement[])[1];
    expect(flattenStyle(header.props.style).marginBottom).toBe(32); // subtitle -> field label
  });
});

describe('Name primary button is the documented design-system button (same as the Welcome primary action)', () => {
  const BUTTON_KEYS = ['minHeight', 'borderRadius', 'backgroundColor', 'paddingHorizontal', 'paddingVertical', 'borderWidth', 'flexDirection', 'alignItems', 'justifyContent'];
  const LABEL_KEYS = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing', 'color', 'textAlign'];

  it.each(THEME_VARIANTS.map(variant => [variant.label, variant] as const))(
    '%s: identical height, radius, fill and label typography; only width and top margin are local',
    async (_label, variant) => {
      const welcomeRender = await renderWithAwaTheme(wrap(welcome()), variant);
      const nameRender = await renderWithAwaTheme(wrap(nameScreen()), variant);
      const resolved = (renderer: typeof welcomeRender.renderer) => {
        const button = renderer.root.findAllByType(Pressable)[0];
        return flattenStyle((button.props.style as (state: {pressed: boolean}) => unknown)({pressed: false}));
      };
      const labelStyle = (renderer: typeof welcomeRender.renderer, label: string) => {
        const node = renderer.root.findAllByType(Text).find(candidate => joined(candidate) === label);
        if (!node) {throw new Error(`no Text "${label}"`);}
        return flattenStyle(node.props.style);
      };
      const w = resolved(welcomeRender.renderer);
      const n = resolved(nameRender.renderer);
      const wl = labelStyle(welcomeRender.renderer, en.onboarding.welcome.start);
      const nl = labelStyle(nameRender.renderer, en.onboarding.name.next);

      BUTTON_KEYS.forEach(key => expect([key, n[key]]).toEqual([key, w[key]]));
      LABEL_KEYS.forEach(key => expect([key, nl[key]]).toEqual([key, wl[key]]));

      // the documented values themselves
      expect(n.minHeight).toBe(AWA_COMPONENT_DIMENSION_PROPOSALS.button.large);
      expect(n.borderRadius).toBe(awaShapes.full);
      expect(n.backgroundColor).toBe(nameRender.roles.primary);
      expect(nl.fontSize).toBe(AWA_PRIMARY_ACTION_LABEL.fontSize);
      expect(nl.fontWeight).toBe(AWA_PRIMARY_ACTION_LABEL.fontWeight);
      expect(nl.color).toBe(nameRender.roles.onPrimary);

      // no other local styling: the only keys that differ are the width rule and the top margin
      const differing = Array.from(new Set([...Object.keys(w), ...Object.keys(n)])).filter(key => w[key] !== n[key]).sort();
      expect(differing).toEqual(['alignSelf', 'marginTop', 'width']);
      expect(n.marginTop).toBe(24);
      expect(n.alignSelf).toBe('stretch'); // full width, aligned with the input field above it
    },
  );
});
