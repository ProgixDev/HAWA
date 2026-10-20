import React from 'react';
import {StyleSheet} from 'react-native';

import {
  JAPANESE_LINE_HEIGHT_RATIO,
  containsDevanagari,
  containsJapanese,
  japaneseAdjustment,
  patchAwaRender,
} from '../awaTypography';
import {AWA_TYPESCALE} from '../typescale';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Japanese typography. The UI font stack is Inter / Fraunces with the Android system fonts drawing every glyph they lack, so kana and
// kanji come from the system's Noto Sans CJK JP. The tight Material display / headline lines (1.12 - 1.33 x the size) are raised to
// 1.35 x, and tracking is reset (Japanese is not letter-spaced), ONLY while the app language is Japanese and ONLY for text that holds
// kana or kanji. Chinese, Hindi and every other language keep their style exactly.

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

describe('containsJapanese', () => {
  it('finds hiragana, katakana and kanji in strings, arrays and nested element children, and nowhere else', () => {
    expect(containsJapanese('生理周期')).toBe(true);
    expect(containsJapanese('ひらがな')).toBe(true);
    expect(containsJapanese('カタカナ')).toBe(true);
    expect(containsJapanese('Day 5 · AWA')).toBe(false);
    expect(containsJapanese('28')).toBe(false);
    expect(containsJapanese(['Day ', 5, '日'])).toBe(true);
    expect(containsJapanese(React.createElement('span', null, ['x', React.createElement('b', null, '日目')]))).toBe(true);
    expect(containsJapanese(React.createElement('span', null, 'Latin only'))).toBe(false);
    expect(containsJapanese(null)).toBe(false);
    expect(containsJapanese(undefined)).toBe(false);
    expect(containsJapanese(42)).toBe(false);
    expect(containsJapanese('Привет मासिक مرحبا')).toBe(false);
    expect(containsDevanagari('生理')).toBe(false);
  });
});

describe('japaneseAdjustment', () => {
  it('raises a line height below 1.35 x the font size to it, rounded up to half a point', () => {
    expect(JAPANESE_LINE_HEIGHT_RATIO).toBe(1.35);
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 18})).toEqual({lineHeight: 19});
    expect(japaneseAdjustment({fontSize: 16, lineHeight: 20})).toEqual({lineHeight: 22});
    expect(japaneseAdjustment({fontSize: 24, lineHeight: 26})).toEqual({lineHeight: 32.5});
  });

  it('leaves a roomy line height, a missing one and a missing font size alone', () => {
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 19})).toBeNull();
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 30})).toBeNull();
    expect(japaneseAdjustment({fontSize: 14})).toBeNull();
    expect(japaneseAdjustment({lineHeight: 20})).toBeNull();
    expect(japaneseAdjustment(undefined)).toBeNull();
  });

  it('every Material type role ends up with at least 1.35 x its size, and never loses height', () => {
    for (const [role, spec] of Object.entries(AWA_TYPESCALE)) {
      const adjustment = japaneseAdjustment({fontSize: spec.fontSize, lineHeight: spec.lineHeight});
      const finalHeight = adjustment?.lineHeight ?? spec.lineHeight;
      expect([role, finalHeight >= spec.fontSize * JAPANESE_LINE_HEIGHT_RATIO]).toEqual([role, true]);
      expect([role, finalHeight >= spec.lineHeight]).toEqual([role, true]);
    }
  });

  it('resets a non-zero letterSpacing to 0 and keeps the raised line height in one object', () => {
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 18, letterSpacing: 0.25})).toEqual({lineHeight: 19, letterSpacing: 0});
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 24, letterSpacing: 0.4})).toEqual({letterSpacing: 0});
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 18, letterSpacing: 0})).toEqual({lineHeight: 19});
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 24})).toBeNull();
    expect(japaneseAdjustment({fontSize: 14, lineHeight: 24, letterSpacing: 0})).toBeNull();
  });

  it('every Material type role with tracking ends at letterSpacing 0 for Japanese', () => {
    const withTracking = Object.entries(AWA_TYPESCALE).filter(([, spec]) => spec.letterSpacing !== 0);
    expect(withTracking.length).toBeGreaterThan(5);
    for (const [role, spec] of withTracking) {
      expect([role, japaneseAdjustment(spec)?.letterSpacing]).toEqual([role, 0]);
    }
  });
});

describe('the render wrapper', () => {
  it('in Japanese, kana / kanji text loses its tracking and gets a roomier line, but Latin text keeps both; the caller\'s style is not mutated', async () => {
    const style = {fontSize: 14, lineHeight: 18, letterSpacing: 0.25, color: 'red'};
    await setAppLanguage('ja');
    const japanese = makeHost();
    expect(flat(japanese.run({style, children: '生理周期'}))).toMatchObject({letterSpacing: 0, lineHeight: 19, color: 'red', fontSize: 14, fontFamily: 'Inter-Regular'});
    expect(flat(japanese.run({style, children: 'Cycle day'}))).toMatchObject({letterSpacing: 0.25, lineHeight: 18});
    expect(style).toEqual({fontSize: 14, lineHeight: 18, letterSpacing: 0.25, color: 'red'});
    japanese.undo();
  });

  it('in Japanese, leaves Latin / digit-only text exactly as it was (the cycle-ring number, "AWA")', async () => {
    await setAppLanguage('ja');
    const {run, undo} = makeHost();
    for (const children of ['28', 'AWA', ['Day ', 5]]) {
      expect(flat(run({style: {fontSize: 24, lineHeight: 26.5}, children})).lineHeight).toBe(26.5);
    }
    undo();
  });

  it('in Japanese, also adjusts an input holding Japanese text (value, defaultValue or placeholder)', async () => {
    await setAppLanguage('ja');
    const {run, undo} = makeHost();
    for (const field of ['value', 'defaultValue', 'placeholder']) {
      expect([field, flat(run({style: {fontSize: 16, lineHeight: 20}, [field]: '名前を入力'})).lineHeight]).toEqual([field, 22]);
    }
    undo();
  });

  it.each(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq'] as const)('in %s nothing changes, even for a Japanese string (no global typography change)', async language => {
    await setAppLanguage(language);
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 18, letterSpacing: 0.25}, children: '生理周期'}))).toMatchObject({lineHeight: 18, letterSpacing: 0.25});
    undo();
  });

  it('does not touch a style that is already roomy enough in Japanese', async () => {
    await setAppLanguage('ja');
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 24}, children: '日目'})).lineHeight).toBe(24);
    undo();
  });

  it('Hindi keeps its own rule: Devanagari still gets 1.45 x in Hindi, Japanese text in Hindi is untouched', async () => {
    await setAppLanguage('hi');
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 20}, children: 'मासिक चक्र'})).lineHeight).toBe(20.5);
    expect(flat(run({style: {fontSize: 14, lineHeight: 18}, children: '生理周期'})).lineHeight).toBe(18);
    undo();
  });
});
