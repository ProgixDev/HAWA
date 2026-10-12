import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {StyleSheet, Text} from 'react-native';

import {AwaThemeProvider} from '../../../theme/AwaThemeProvider';
import CycleProgressRing, {phaseLabelFontSize} from '../CycleProgressRing';
import {ru} from '../../../i18n/locales/ru';
import {de} from '../../../i18n/locales/de';
import {fr} from '../../../i18n/locales/fr';
import {en} from '../../../i18n/locales/en';
import {es} from '../../../i18n/locales/es';
import {it as itDictionary} from '../../../i18n/locales/it';
import {tr} from '../../../i18n/locales/tr';

// The phase name in the centre of the cycle ring: long single words (Russian «Фолликулярная», German
// «Follikelphase»/«Menstruation») are scaled down so Android never splits them mid-word, and every name that already
// fitted keeps the original 9.5 — French/English/Spanish/Italian/Turkish are visually unchanged.

type Phases = {cyclePhase: Record<'menstruation' | 'follicular' | 'ovulation' | 'luteal', string>};
const phaseNames = (dictionary: unknown): string[] => {
  const phases = (dictionary as Phases).cyclePhase;
  return [phases.menstruation, phases.follicular, phases.ovulation, phases.luteal];
};

async function renderedFontSize(label: string, size = 116): Promise<number | undefined> {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AwaThemeProvider>
        <CycleProgressRing currentDay={6} cycleLength={28} phaseLabel={label} ringColor="#6D4AE8" size={size} />
      </AwaThemeProvider>,
    );
  });
  const node = renderer.root.findAllByType(Text).find(text => text.props.children === label);
  const fontSize = node ? StyleSheet.flatten(node.props.style).fontSize : undefined;
  act(() => renderer.unmount());
  return fontSize;
}

describe('CycleProgressRing phase label', () => {
  it('keeps 9.5 for every existing French, English, Spanish, Italian and Turkish phase name', () => {
    for (const dictionary of [fr, en, es, itDictionary, tr]) {
      for (const label of phaseNames(dictionary)) {
        expect([label, phaseLabelFontSize(label, 116)]).toEqual([label, 9.5]);
      }
    }
  });

  it('shrinks the long Russian and German names, within the 7–9.5 band, without breaking the short ones', () => {
    const russian = phaseNames(ru).map(label => [label, phaseLabelFontSize(label, 116)] as const);
    const german = phaseNames(de).map(label => [label, phaseLabelFontSize(label, 116)] as const);
    const longRussian = russian.filter(([label]) => Math.max(...label.split(' ').map(word => word.length)) >= 13);
    expect(longRussian.length).toBeGreaterThan(0);
    longRussian.forEach(([, size]) => {
      expect(size).toBeLessThan(9.5);
      expect(size).toBeGreaterThanOrEqual(7);
    });
    [...russian, ...german].forEach(([, size]) => {
      expect(size).toBeLessThanOrEqual(9.5);
      expect(size).toBeGreaterThanOrEqual(7);
    });
    // the German ring names are short enough to stay at (or very near) the base size
    german.forEach(([label, size]) => expect([label, size >= 9]).toEqual([label, true]));
  });

  it('applies the computed size to the rendered text and caps the OS font scale', async () => {
    expect(await renderedFontSize('Фолликулярная фаза')).toBe(phaseLabelFontSize('Фолликулярная фаза', 116));
    expect(await renderedFontSize('Phase folliculaire')).toBe(9.5);
    expect(await renderedFontSize('Follikelphase')).toBe(phaseLabelFontSize('Follikelphase', 116));
  });

  it('scales with the ring size (a smaller ring shrinks the same word further)', () => {
    expect(phaseLabelFontSize('Фолликулярная фаза', 96)).toBeLessThanOrEqual(phaseLabelFontSize('Фолликулярная фаза', 116));
    expect(phaseLabelFontSize('Eisprung', 116)).toBe(9.5);
    expect(phaseLabelFontSize(null, 116)).toBe(9.5);
  });
});
