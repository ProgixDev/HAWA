import React from 'react';
import {StyleSheet} from 'react-native';

import {
  BENGALI_LINE_HEIGHT_RATIO,
  bengaliAdjustment,
  containsBengali,
  containsDevanagari,
  patchAwaRender,
} from '../awaTypography';
import {AWA_TYPESCALE} from '../typescale';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Bengali typography. Android draws Bengali with the system Noto Sans Bengali, whose conjuncts, reph and vowel signs reach about
// 1.40 x the font size, more than the Material line heights (1.25 - 1.43 x). Same rule as Devanagari: while the app language is Bengali
// and only for text that holds Bengali letters, a numeric lineHeight below 1.45 x the font size is raised and tracking is reset to 0.
// Latin / digit-only text and every other language keep their style exactly (no global typography change).

type Rendered = {style: unknown[]};
const makeHost = () => {
  const render = jest.fn((props: Record<string, unknown>) => props);
  const component = {render};
  const undo = patchAwaRender(component as never, false);
  const run = (props: Record<string, unknown>) => (component.render as unknown as (p: Record<string, unknown>, r: unknown) => Rendered)(props, null);
  return {run, undo};
};
const flat = (out: Rendered) => StyleSheet.flatten(out.style as never) as {fontSize?: number; lineHeight?: number; letterSpacing?: number; color?: string; fontFamily?: string};

afterEach(async () => {
  await resetAppLanguageForTests();
});

describe('containsBengali', () => {
  it('finds Bengali in strings, arrays and nested element children, and nowhere else', () => {
    expect(containsBengali('মাসিক চক্র')).toBe(true);
    expect(containsBengali('Day 5 · AWA')).toBe(false);
    expect(containsBengali('28')).toBe(false);
    expect(containsBengali(['Day ', 5, 'দিন'])).toBe(true);
    expect(containsBengali(React.createElement('span', null, ['x', React.createElement('b', null, 'দিন')]))).toBe(true);
    expect(containsBengali(React.createElement('span', null, 'Latin only'))).toBe(false);
    expect(containsBengali(null)).toBe(false);
    expect(containsBengali(undefined)).toBe(false);
    expect(containsBengali(42)).toBe(false);
    expect(containsBengali('Привет 月经 مرحبا मासिक')).toBe(false);
    expect(containsDevanagari('মাসিক চক্র')).toBe(false); // the two scripts are told apart
  });
});

describe('bengaliAdjustment', () => {
  it('uses the same 1.45 x floor as Devanagari, rounded up to half a point, and resets tracking', () => {
    expect(BENGALI_LINE_HEIGHT_RATIO).toBe(1.45);
    expect(bengaliAdjustment({fontSize: 14, lineHeight: 20})).toEqual({lineHeight: 20.5});
    expect(bengaliAdjustment({fontSize: 16, lineHeight: 20})).toEqual({lineHeight: 23.5});
    expect(bengaliAdjustment({fontSize: 14, lineHeight: 20, letterSpacing: 0.25})).toEqual({lineHeight: 20.5, letterSpacing: 0});
    expect(bengaliAdjustment({fontSize: 14, lineHeight: 24, letterSpacing: 0.4})).toEqual({letterSpacing: 0});
    expect(bengaliAdjustment({fontSize: 14, lineHeight: 24})).toBeNull();
    expect(bengaliAdjustment({fontSize: 14})).toBeNull();
    expect(bengaliAdjustment(undefined)).toBeNull();
  });

  it('every Material type role ends up with at least 1.45 x its size, never loses height, and no tracking', () => {
    for (const [role, spec] of Object.entries(AWA_TYPESCALE)) {
      const adjustment = bengaliAdjustment(spec);
      const finalHeight = adjustment?.lineHeight ?? spec.lineHeight;
      expect([role, finalHeight >= spec.fontSize * BENGALI_LINE_HEIGHT_RATIO]).toEqual([role, true]);
      expect([role, finalHeight >= spec.lineHeight]).toEqual([role, true]);
      if (spec.letterSpacing !== 0) {
        expect([role, adjustment?.letterSpacing]).toEqual([role, 0]);
      }
    }
  });
});

describe('the render wrapper', () => {
  it('in Bengali, Bengali text loses its tracking but Latin text keeps it; other languages keep both', async () => {
    const style = {fontSize: 14, lineHeight: 24, letterSpacing: 0.25};
    await setAppLanguage('bn');
    const bengali = makeHost();
    expect(flat(bengali.run({style, children: 'মাসিক চক্র'})).letterSpacing).toBe(0);
    expect(flat(bengali.run({style, children: 'Cycle day'})).letterSpacing).toBe(0.25);
    expect(style.letterSpacing).toBe(0.25); // the caller's style is untouched
    bengali.undo();
    await setAppLanguage('fr');
    const french = makeHost();
    expect(flat(french.run({style, children: 'মাসিক চক্র'})).letterSpacing).toBe(0.25);
    french.undo();
  });

  it('in Bengali, gives Bengali text a roomier line height and keeps its other style (the style object passed in is not mutated)', async () => {
    await setAppLanguage('bn');
    const {run, undo} = makeHost();
    const style = {fontSize: 14, lineHeight: 20, color: 'red'};
    const out = run({style, children: 'মাসিক চক্র'});
    expect(flat(out)).toMatchObject({fontSize: 14, lineHeight: 20.5, color: 'red', fontFamily: 'Inter-Regular'});
    expect(style).toEqual({fontSize: 14, lineHeight: 20, color: 'red'});
    undo();
  });

  it('in Bengali, leaves Latin / digit-only text exactly as it was (the cycle-ring number, "AWA")', async () => {
    await setAppLanguage('bn');
    const {run, undo} = makeHost();
    for (const children of ['28', 'AWA', ['Day ', 5]]) {
      expect(flat(run({style: {fontSize: 24, lineHeight: 26.5}, children})).lineHeight).toBe(26.5);
    }
    undo();
  });

  it('in Bengali, also raises the line height of an input holding Bengali (value, defaultValue or placeholder)', async () => {
    await setAppLanguage('bn');
    const {run, undo} = makeHost();
    for (const field of ['value', 'defaultValue', 'placeholder']) {
      expect([field, flat(run({style: {fontSize: 16, lineHeight: 20}, [field]: 'আপনার নাম লিখুন'})).lineHeight]).toEqual([field, 23.5]);
    }
    undo();
  });

  it('in Bengali, a Devanagari string is not Bengali: the Bengali rule does not apply to it', async () => {
    await setAppLanguage('bn');
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 20}, children: 'मासिक चक्र'})).lineHeight).toBe(20);
    undo();
  });

  it.each(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja', 'ko', 'pt-PT', 'pt-BR'] as const)(
    'in %s nothing changes, even for a Bengali string (no global typography change)',
    async language => {
      await setAppLanguage(language);
      const {run, undo} = makeHost();
      expect(flat(run({style: {fontSize: 14, lineHeight: 20}, children: 'মাসিক চক্র'})).lineHeight).toBe(20);
      undo();
    },
  );

  it('does not touch a style that is already roomy enough in Bengali', async () => {
    await setAppLanguage('bn');
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 24}, children: 'দিন'})).lineHeight).toBe(24);
    undo();
  });
});
