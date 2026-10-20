import React from 'react';
import {StyleSheet} from 'react-native';

import {
  DEVANAGARI_LINE_HEIGHT_RATIO,
  containsDevanagari,
  devanagariAdjustment,
  devanagariLineHeight,
  patchAwaRender,
} from '../awaTypography';
import {AWA_TYPESCALE} from '../typescale';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Hindi (Devanagari) typography. The UI font stack is Inter / Fraunces with the Android system fonts drawing every glyph they
// lack, so Devanagari comes from the system's Noto Sans Devanagari, whose matras (above the headline) and conjuncts / marks (below
// the baseline) need more vertical room than the Material line heights (1.25 - 1.43 x). The layer therefore raises a numeric
// lineHeight below 1.45 x the font size, ONLY while the app language is Hindi and ONLY for text that holds Devanagari.

type Rendered = {style: unknown[]};
const makeHost = () => {
  const render = jest.fn((props: Record<string, unknown>) => props);
  const component = {render};
  const undo = patchAwaRender(component as never, false);
  const run = (props: Record<string, unknown>) => (component.render as unknown as (p: Record<string, unknown>, r: unknown) => Rendered)(props, null);
  return {run, undo};
};

afterEach(async () => {
  await resetAppLanguageForTests();
});

describe('containsDevanagari', () => {
  it('finds Devanagari in strings, arrays and nested element children, and nowhere else', () => {
    expect(containsDevanagari('मासिक चक्र')).toBe(true);
    expect(containsDevanagari('Day 5 · AWA')).toBe(false);
    expect(containsDevanagari('28')).toBe(false);
    expect(containsDevanagari(['Day ', 5, '।'])).toBe(true);
    expect(containsDevanagari(React.createElement('span', null, ['x', React.createElement('b', null, 'दिन')]))).toBe(true);
    expect(containsDevanagari(React.createElement('span', null, 'Latin only'))).toBe(false);
    expect(containsDevanagari(null)).toBe(false);
    expect(containsDevanagari(undefined)).toBe(false);
    expect(containsDevanagari(42)).toBe(false);
    expect(containsDevanagari('Привет 月经 مرحبا')).toBe(false);
  });
});

describe('devanagariLineHeight', () => {
  it('raises a line height below 1.45 x the font size to it, rounded up to half a point', () => {
    expect(DEVANAGARI_LINE_HEIGHT_RATIO).toBe(1.45);
    expect(devanagariLineHeight({fontSize: 14, lineHeight: 20})).toBe(20.5);
    expect(devanagariLineHeight({fontSize: 16, lineHeight: 20})).toBe(23.5);
    expect(devanagariLineHeight({fontSize: 24, lineHeight: 26})).toBe(35);
  });

  it('leaves a roomy line height, a missing one and a missing font size alone', () => {
    expect(devanagariLineHeight({fontSize: 14, lineHeight: 21})).toBeNull();
    expect(devanagariLineHeight({fontSize: 14, lineHeight: 30})).toBeNull();
    expect(devanagariLineHeight({fontSize: 14})).toBeNull();
    expect(devanagariLineHeight({lineHeight: 20})).toBeNull();
    expect(devanagariLineHeight(undefined)).toBeNull();
  });

  it('every Material type role ends up with at least 1.45 x its size, and never loses height', () => {
    for (const [role, spec] of Object.entries(AWA_TYPESCALE)) {
      const raised = devanagariLineHeight({fontSize: spec.fontSize, lineHeight: spec.lineHeight});
      const finalHeight = raised ?? spec.lineHeight;
      expect([role, finalHeight >= spec.fontSize * DEVANAGARI_LINE_HEIGHT_RATIO]).toEqual([role, true]);
      expect([role, finalHeight >= spec.lineHeight]).toEqual([role, true]);
    }
  });
});

describe('devanagariAdjustment — tracking', () => {
  it('resets a non-zero letterSpacing to 0 and keeps the raised line height in one object', () => {
    expect(devanagariAdjustment({fontSize: 14, lineHeight: 20, letterSpacing: 0.25})).toEqual({lineHeight: 20.5, letterSpacing: 0});
    expect(devanagariAdjustment({fontSize: 14, lineHeight: 24, letterSpacing: 0.4})).toEqual({letterSpacing: 0});
    expect(devanagariAdjustment({fontSize: 14, lineHeight: 20, letterSpacing: 0})).toEqual({lineHeight: 20.5});
    expect(devanagariAdjustment({fontSize: 14, lineHeight: 24})).toBeNull();
    expect(devanagariAdjustment({fontSize: 14, lineHeight: 24, letterSpacing: 0})).toBeNull();
    expect(devanagariAdjustment(undefined)).toBeNull();
  });

  it('every Material type role with tracking ends at letterSpacing 0 for Devanagari', () => {
    const withTracking = Object.entries(AWA_TYPESCALE).filter(([, spec]) => spec.letterSpacing !== 0);
    expect(withTracking.length).toBeGreaterThan(5);
    for (const [role, spec] of withTracking) {
      expect([role, devanagariAdjustment(spec)?.letterSpacing]).toEqual([role, 0]);
    }
  });
});

describe('the render wrapper', () => {
  it('in Hindi, Devanagari text loses its tracking but Latin text keeps it; other languages keep both', async () => {
    const style = {fontSize: 14, lineHeight: 24, letterSpacing: 0.25};
    const flatten = (out: Rendered) => StyleSheet.flatten(out.style as never) as {letterSpacing?: number};
    await setAppLanguage('hi');
    const hindi = makeHost();
    expect(flatten(hindi.run({style, children: 'मासिक चक्र'})).letterSpacing).toBe(0);
    expect(flatten(hindi.run({style, children: 'Cycle day'})).letterSpacing).toBe(0.25);
    expect(style.letterSpacing).toBe(0.25); // the caller's style is untouched
    hindi.undo();
    await setAppLanguage('fr');
    const french = makeHost();
    expect(flatten(french.run({style, children: 'मासिक चक्र'})).letterSpacing).toBe(0.25);
    french.undo();
  });

  const flat = (out: Rendered) => StyleSheet.flatten(out.style as never) as {fontSize?: number; lineHeight?: number; color?: string; fontFamily?: string};

  it('in Hindi, gives Devanagari text a roomier line height and keeps its other style (the style object passed in is not mutated)', async () => {
    await setAppLanguage('hi');
    const {run, undo} = makeHost();
    const style = {fontSize: 14, lineHeight: 20, color: 'red'};
    const out = run({style, children: 'मासिक चक्र'});
    expect(flat(out)).toMatchObject({fontSize: 14, lineHeight: 20.5, color: 'red', fontFamily: 'Inter-Regular'});
    expect(style).toEqual({fontSize: 14, lineHeight: 20, color: 'red'});
    undo();
  });

  it('in Hindi, leaves Latin / digit-only text exactly as it was (the cycle-ring number, "AWA")', async () => {
    await setAppLanguage('hi');
    const {run, undo} = makeHost();
    for (const children of ['28', 'AWA', ['Day ', 5]]) {
      expect(flat(run({style: {fontSize: 24, lineHeight: 26.5}, children})).lineHeight).toBe(26.5);
    }
    undo();
  });

  it('in Hindi, also raises the line height of an input holding Devanagari (value, defaultValue or placeholder)', async () => {
    await setAppLanguage('hi');
    const {run, undo} = makeHost();
    for (const field of ['value', 'defaultValue', 'placeholder']) {
      expect([field, flat(run({style: {fontSize: 16, lineHeight: 20}, [field]: 'अपना नाम लिखें'})).lineHeight]).toEqual([field, 23.5]);
    }
    undo();
  });

  it.each(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id'] as const)('in %s nothing changes, even for a Devanagari string (no global typography change)', async language => {
    await setAppLanguage(language);
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 20}, children: 'मासिक चक्र'})).lineHeight).toBe(20);
    undo();
  });

  it('does not touch a style that is already roomy enough in Hindi', async () => {
    await setAppLanguage('hi');
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 24}, children: 'दिन'})).lineHeight).toBe(24);
    undo();
  });
});
