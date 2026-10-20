import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import CycleProgressRing from '../CycleProgressRing';
import {planCycleRingText} from '../cycleRingLayout';
import i18n from '../../../i18n';
import {setAppLanguage} from '../../../state/themePreferences';

// The three texts in the centre of the cycle ring — "Jour du cycle", the day number and the phase name — are sized and
// wrapped by planCycleRingText (cycleRingLayout.ts) so they stay inside the 82 dp disc in every language; the geometry
// itself is checked against the real font files in cycleRingLayout.test.ts. Here: what the component actually draws.

const PHASES = {
  fr: ['Phase menstruelle', 'Phase folliculaire', 'Fenêtre fertile', 'Ovulation', 'Phase lutéale'],
  en: ['Menstrual phase', 'Follicular phase', 'Fertile window', 'Ovulation', 'Luteal phase'],
  ru: ['Менструальная фаза', 'Фолликулярная фаза', 'Фертильное окно', 'Овуляция', 'Лютеиновая фаза'],
} as const;
const CAPTION = {fr: 'Jour du cycle', en: 'Cycle day', ru: 'День цикла'} as const;

const textOf = (node: ReactTestRenderer.ReactTestInstance): string => [node.props.children].flat(Infinity).join('');
const styleOf = (node: ReactTestRenderer.ReactTestInstance) => StyleSheet.flatten(node.props.style) as Record<string, unknown>;

async function renderRing(props: {day: number | null; phaseLabel: string | null; size?: number}) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <CycleProgressRing currentDay={props.day} cycleLength={28} phaseLabel={props.phaseLabel} ringColor="#6D4AE8" size={props.size} />
      </AwaThemeProvider>,
    );
  });
  const texts = renderer.root.findAllByType(Text);
  const caption = texts.find(node => textOf(node) === i18n.t('journalNote.cycleDayLabel'))!;
  const number = texts.find(node => textOf(node) === (props.day === null ? '—' : String(props.day)))!;
  const phase = props.phaseLabel ? texts.find(node => node.props.accessibilityLabel === props.phaseLabel) : undefined;
  return {renderer, caption, number, phase};
}

afterEach(() => {
  jest.clearAllMocks();
});

describe.each(['fr', 'en', 'ru'] as const)('CycleProgressRing centre text — %s', language => {
  beforeEach(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });

  it.each(PHASES[language])('"%s": caption, number and phase are drawn at the planned size, wrapped on whole words', async name => {
    const {renderer, caption, number, phase} = await renderRing({day: 4, phaseLabel: name});
    const plan = planCycleRingText({size: 116, caption: CAPTION[language], phaseLabels: PHASES[language]});

    expect(styleOf(caption)).toMatchObject({fontSize: plan.caption.fontSize, lineHeight: plan.caption.lineHeight, letterSpacing: 0, textAlign: 'center'});
    expect(styleOf(number)).toMatchObject({fontSize: plan.number.fontSize, lineHeight: plan.number.lineHeight, textAlign: 'center'});
    expect(phase).toBeDefined();
    expect(styleOf(phase!)).toMatchObject({fontSize: plan.phase.fontSize, lineHeight: plan.phase.lineHeight, textAlign: 'center'});
    expect(textOf(phase!)).toBe(plan.phaseLines[name].join('\n'));
    expect(textOf(phase!).replace('\n', ' ')).toBe(name); // only a space became a line break: no word is cut
    expect(phase!.props.numberOfLines).toBe(plan.phaseReservedLines);
    // the ring is a fixed-size graphic: its text does not follow the system font size out of the circle
    [caption, number, phase!].forEach(node => expect(node.props.allowFontScaling).toBe(false));
    act(() => renderer.unmount());
  });

  it('hierarchy: the caption is a small label, the number is much larger, the phase is as small as the caption', async () => {
    const {renderer, caption, number, phase} = await renderRing({day: 8, phaseLabel: PHASES[language][1]});
    const small = styleOf(caption).fontSize as number;
    expect(small).toBeLessThan(11); // it was 11 sp, wider than the circle at its height
    expect(styleOf(phase!).fontSize).toBe(small);
    expect(styleOf(number).fontSize as number).toBeGreaterThanOrEqual(2 * small);
    act(() => renderer.unmount());
  });

  it('changing phase never changes the caption, the number or the space reserved for the phase', async () => {
    const first = await renderRing({day: 4, phaseLabel: PHASES[language][0]});
    const second = await renderRing({day: 14, phaseLabel: PHASES[language][3]});
    expect(styleOf(first.caption)).toEqual(styleOf(second.caption));
    expect(styleOf(first.number)).toEqual(styleOf(second.number));
    const heightOf = (node: ReactTestRenderer.ReactTestInstance) => styleOf(node.parent!).height;
    expect(heightOf(first.phase!)).toBe(heightOf(second.phase!));
    act(() => first.renderer.unmount());
    act(() => second.renderer.unmount());
  });
});

describe('CycleProgressRing centre text — edge cases', () => {
  beforeEach(async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
  });

  it('without a phase name only the caption and the number are drawn', async () => {
    const {renderer, phase} = await renderRing({day: 12, phaseLabel: null});
    expect(phase).toBeUndefined();
    expect(renderer.root.findAllByType(Text).map(textOf)).toEqual(['Jour du cycle', '12']);
    act(() => renderer.unmount());
  });

  it('an unavailable day shows a dash, still centred', async () => {
    const {renderer, number} = await renderRing({day: null, phaseLabel: 'Ovulation'});
    expect(textOf(number)).toBe('—');
    expect(styleOf(number).textAlign).toBe('center');
    act(() => renderer.unmount());
  });

  it('a three-digit day (a very late irregular cycle) uses the same planned number size', async () => {
    const two = await renderRing({day: 28, phaseLabel: 'Phase lutéale'});
    const three = await renderRing({day: 104, phaseLabel: 'Phase lutéale'});
    expect(styleOf(three.number).fontSize).toBe(styleOf(two.number).fontSize);
    act(() => two.renderer.unmount());
    act(() => three.renderer.unmount());
  });

  it('a smaller ring (the partner view on a compact screen) gets smaller type, never the 116 dp sizes', async () => {
    const regular = await renderRing({day: 4, phaseLabel: 'Phase menstruelle', size: 116});
    const compact = await renderRing({day: 4, phaseLabel: 'Phase menstruelle', size: 100});
    expect(styleOf(compact.caption).fontSize as number).toBeLessThan(styleOf(regular.caption).fontSize as number);
    expect(styleOf(compact.number).fontSize as number).toBeLessThan(styleOf(regular.number).fontSize as number);
    act(() => regular.renderer.unmount());
    act(() => compact.renderer.unmount());
  });

  it('the phase text keeps the phase colour and a full accessibility name', async () => {
    const {renderer, phase} = await renderRing({day: 4, phaseLabel: 'Phase menstruelle'});
    expect(styleOf(phase!).color).toBe('#6D4AE8');
    expect(phase!.props.accessibilityLabel).toBe('Phase menstruelle'); // not "Phase" and "menstruelle" separately
    act(() => renderer.unmount());
  });
});
