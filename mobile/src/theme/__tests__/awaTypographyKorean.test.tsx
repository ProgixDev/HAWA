import React from 'react';
import {StyleSheet} from 'react-native';

import {
  KOREAN_LINE_HEIGHT_RATIO,
  containsJapanese,
  containsKorean,
  koreanAdjustment,
  patchAwaRender,
} from '../awaTypography';
import {AWA_TYPESCALE} from '../typescale';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Korean typography. The UI font stack is Inter / Fraunces with the Android system fonts drawing every glyph they lack, so Hangul comes
// from the system's Korean font (Noto Sans CJK KR / Samsung One UI Sans KR). The tight Material display / headline lines (1.12 - 1.33 x
// the size) are raised to 1.35 x, and tracking is reset (Korean is not letter-spaced), ONLY while the app language is Korean and ONLY
// for text that holds Hangul. Japanese, Chinese, Hindi and every other language keep their style exactly.

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

describe('containsKorean', () => {
  it('finds Hangul syllables in strings, arrays and nested element children, and nowhere else', () => {
    expect(containsKorean('생리 주기')).toBe(true);
    expect(containsKorean('Day 5 · AWA')).toBe(false);
    expect(containsKorean('28')).toBe(false);
    expect(containsKorean(['Day ', 5, '일'])).toBe(true);
    expect(containsKorean(React.createElement('span', null, ['x', React.createElement('b', null, '일째')]))).toBe(true);
    expect(containsKorean(React.createElement('span', null, 'Latin only'))).toBe(false);
    expect(containsKorean(null)).toBe(false);
    expect(containsKorean(undefined)).toBe(false);
    expect(containsKorean(42)).toBe(false);
    expect(containsKorean('生理周期 ひらがな Привет मासिक مرحبا')).toBe(false);
    expect(containsJapanese('생리 주기')).toBe(false);
  });
});

describe('koreanAdjustment', () => {
  it('raises a line height below 1.35 x the font size to it, rounded up to half a point', () => {
    expect(KOREAN_LINE_HEIGHT_RATIO).toBe(1.35);
    expect(koreanAdjustment({fontSize: 14, lineHeight: 18})).toEqual({lineHeight: 19});
    expect(koreanAdjustment({fontSize: 16, lineHeight: 20})).toEqual({lineHeight: 22});
    expect(koreanAdjustment({fontSize: 24, lineHeight: 26})).toEqual({lineHeight: 32.5});
  });

  it('leaves a roomy line height, a missing one and a missing font size alone', () => {
    expect(koreanAdjustment({fontSize: 14, lineHeight: 19})).toBeNull();
    expect(koreanAdjustment({fontSize: 14, lineHeight: 30})).toBeNull();
    expect(koreanAdjustment({fontSize: 14})).toBeNull();
    expect(koreanAdjustment({lineHeight: 20})).toBeNull();
    expect(koreanAdjustment(undefined)).toBeNull();
  });

  it('every Material type role ends up with at least 1.35 x its size, and never loses height', () => {
    for (const [role, spec] of Object.entries(AWA_TYPESCALE)) {
      const adjustment = koreanAdjustment({fontSize: spec.fontSize, lineHeight: spec.lineHeight});
      const finalHeight = adjustment?.lineHeight ?? spec.lineHeight;
      expect([role, finalHeight >= spec.fontSize * KOREAN_LINE_HEIGHT_RATIO]).toEqual([role, true]);
      expect([role, finalHeight >= spec.lineHeight]).toEqual([role, true]);
    }
  });

  it('every Material type role with tracking ends at letterSpacing 0 for Korean', () => {
    const withTracking = Object.entries(AWA_TYPESCALE).filter(([, spec]) => spec.letterSpacing !== 0);
    expect(withTracking.length).toBeGreaterThan(5);
    for (const [role, spec] of withTracking) {
      expect([role, koreanAdjustment(spec)?.letterSpacing]).toEqual([role, 0]);
    }
  });
});

describe('the render wrapper', () => {
  it('in Korean, Hangul text loses its tracking and gets a roomier line, but Latin text keeps both; the caller\'s style is not mutated', async () => {
    const style = {fontSize: 14, lineHeight: 18, letterSpacing: 0.25, color: 'red'};
    await setAppLanguage('ko');
    const korean = makeHost();
    expect(flat(korean.run({style, children: '생리 주기'}))).toMatchObject({letterSpacing: 0, lineHeight: 19, color: 'red', fontSize: 14, fontFamily: 'Inter-Regular'});
    expect(flat(korean.run({style, children: 'Cycle day'}))).toMatchObject({letterSpacing: 0.25, lineHeight: 18});
    expect(style).toEqual({fontSize: 14, lineHeight: 18, letterSpacing: 0.25, color: 'red'});
    korean.undo();
  });

  it('in Korean, leaves Latin / digit-only text exactly as it was (the cycle-ring number, "AWA")', async () => {
    await setAppLanguage('ko');
    const {run, undo} = makeHost();
    for (const children of ['28', 'AWA', ['Day ', 5]]) {
      expect(flat(run({style: {fontSize: 24, lineHeight: 26.5}, children})).lineHeight).toBe(26.5);
    }
    undo();
  });

  it('in Korean, also adjusts an input holding Hangul (value, defaultValue or placeholder)', async () => {
    await setAppLanguage('ko');
    const {run, undo} = makeHost();
    for (const field of ['value', 'defaultValue', 'placeholder']) {
      expect([field, flat(run({style: {fontSize: 16, lineHeight: 20}, [field]: '이름을 입력하세요'})).lineHeight]).toEqual([field, 22]);
    }
    undo();
  });

  it.each(['fr', 'en', 'es', 'it', 'tr', 'ru', 'de', 'zh', 'id', 'hi', 'sq', 'ja'] as const)('in %s nothing changes, even for a Hangul string (no global typography change)', async language => {
    await setAppLanguage(language);
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 18, letterSpacing: 0.25}, children: '생리 주기'}))).toMatchObject({lineHeight: 18, letterSpacing: 0.25});
    undo();
  });

  it('Japanese text in Korean keeps its own rule (untouched: the Korean layer only reacts to Hangul)', async () => {
    await setAppLanguage('ko');
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 18}, children: '生理周期'})).lineHeight).toBe(18);
    undo();
  });

  it('does not touch a style that is already roomy enough in Korean', async () => {
    await setAppLanguage('ko');
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 24}, children: '일째'})).lineHeight).toBe(24);
    undo();
  });
});
