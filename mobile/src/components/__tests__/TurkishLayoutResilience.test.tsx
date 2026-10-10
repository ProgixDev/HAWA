import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Text, type TextProps} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaProvider, type Metrics} from 'react-native-safe-area-context';

import {AwaThemeProvider} from '../../theme/AwaThemeProvider';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {tr as trDictionary} from '../../i18n/locales/tr';

import {AnimatedTabItem} from '../navigation/AnimatedTabItem';
import {PostpartumConsistencyModal} from '../postpartum/PostpartumConsistencyModal';
import PurityStatusCard from '../prayer/PurityStatusCard';

// Turkish strings are not uniformly longer than French, but several are single long words ("İstatistikler") or
// long clauses ("Bugün kılınması gereken namaz: …") rendered in constrained rows. These are structural checks on the
// props/style of the exact Text nodes that were fixed — never pixel assertions: they only prove the node is able
// to shrink or wrap, and that a CTA is sized with minHeight rather than a fixed height.

const TEST_METRICS: Metrics = {frame: {x: 0, y: 0, width: 320, height: 640}, insets: {top: 0, left: 0, right: 0, bottom: 0}};
const activeRenderers: ReactTestRenderer.ReactTestRenderer[] = [];

const flatten = (style: unknown): Record<string, unknown> =>
  Object.assign({}, ...(Array.isArray(style) ? style.flat(Infinity) : [style]).filter(Boolean));
const textOf = (node: ReactTestRenderer.ReactTestInstance): string =>
  [node.props.children].flat(Infinity).map(child => (typeof child === 'string' ? child : '')).join('');
const findText = (renderer: ReactTestRenderer.ReactTestRenderer, value: string) => {
  const match = renderer.root.findAllByType(Text).find(node => textOf(node).includes(value));
  if (!match) {throw new Error(`Text not rendered: ${value}`);}
  return match;
};

async function mount(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={TEST_METRICS}>
        <AwaThemeProvider>{element}</AwaThemeProvider>
      </SafeAreaProvider>,
    );
  });
  activeRenderers.push(renderer);
  return renderer;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await resetAppLanguageForTests();
  await act(async () => {
    await setAppLanguage('tr');
    await i18n.changeLanguage('tr');
  });
});

afterEach(async () => {
  act(() => {
    activeRenderers.splice(0).forEach(renderer => renderer.unmount());
  });
  await i18n.changeLanguage('en');
});

describe('Turkish layout resilience', () => {
  it('shrinks a long tab-bar label to one line and keeps the full text for screen readers', async () => {
    const label = trDictionary.navigation.statistics;
    const renderer = await mount(<AnimatedTabItem focused={false} icon={null} label={label} onPress={() => undefined} />);
    const text = findText(renderer, label);
    const props = text.props as TextProps;
    expect(props.numberOfLines).toBe(1);
    expect(props.adjustsFontSizeToFit).toBe(true);
    expect(flatten(props.style).fontSize).toBeDefined();
    const pressable = renderer.root.findAll(node => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label);
    expect(pressable.length).toBeGreaterThan(0);
  });

  it('lets the consistency-dialog primary CTA grow and wrap without truncating it', async () => {
    const label = trDictionary.postpartumLochia.reopenConsistency.primaryLabel;
    const renderer = await mount(
      <PostpartumConsistencyModal
        infoText={trDictionary.postpartumCycleReturn.consistency.lochiaActiveInfo}
        message={trDictionary.postpartumCycleReturn.consistency.lochiaActiveInfo}
        onPrimary={() => undefined}
        onRequestClose={() => undefined}
        onSecondary={() => undefined}
        primaryLabel={label}
        title={trDictionary.postpartumLochia.header.title}
        visible
      />,
    );
    const text = findText(renderer, label);
    const textProps = text.props as TextProps;
    expect(textProps.numberOfLines).toBeUndefined();
    expect(flatten(textProps.style).flexShrink).toBe(1);
    const button = renderer.root.find(node => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === label);
    const style = flatten(typeof button.props.style === 'function' ? button.props.style({pressed: false}) : button.props.style);
    expect(style.height).toBeUndefined();
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    // the full warning text is never line-clamped
    const warning = findText(renderer, trDictionary.postpartumCycleReturn.consistency.lochiaActiveInfo);
    expect((warning.props as TextProps).numberOfLines).toBeUndefined();
  });

  it('wraps the "prayer due" pill text inside the pill', async () => {
    const prayerName = 'İkindi';
    const expected = trDictionary.prayerTimes.purity.dueBadge.replace('{{prayerName}}', prayerName);
    const renderer = await mount(
      <PurityStatusCard
        error={false}
        loading={false}
        onEdit={() => undefined}
        periodEndDateTime={new Date(2026, 9, 10, 9, 0)}
        result={{
          status: 'pure',
          prayerDue: true,
          prayerName: prayerName as never,
          prayerStart: new Date(2026, 9, 10, 15, 0),
          prayerEnd: new Date(2026, 9, 10, 18, 0),
        }}
      />,
    );
    const text = findText(renderer, expected);
    const props = text.props as TextProps;
    expect(props.numberOfLines).toBeUndefined();
    expect(flatten(props.style).flexShrink).toBe(1);
  });
});
