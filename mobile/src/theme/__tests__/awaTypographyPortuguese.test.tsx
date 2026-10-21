import {StyleSheet} from 'react-native';

import {patchAwaRender} from '../awaTypography';
import {AWA_TYPESCALE} from '../typescale';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';

// Portuguese typography: Latin letters with diacritics (á à â ã é ê í ó ô õ ú ç) are drawn by the app's own faces (Inter, Fraunces), which
// contain every one of them, so Portuguese has NO typography layer of its own — no taller line, no tracking reset (unlike Devanagari / Japanese /
// Korean). These tests pin that: in Portugal and Brazil a style is passed through exactly as the caller wrote it, for every Material role.

type Rendered = {style: unknown[]};
const makeHost = () => {
  const render = jest.fn((props: Record<string, unknown>) => props);
  const component = {render};
  const undo = patchAwaRender(component as never, false);
  const run = (props: Record<string, unknown>) => (component.render as unknown as (p: Record<string, unknown>, r: unknown) => Rendered)(props, null);
  return {run, undo};
};
const flat = (out: Rendered) => StyleSheet.flatten(out.style as never) as {fontSize?: number; lineHeight?: number; letterSpacing?: number; fontFamily?: string};

afterEach(async () => {
  await resetAppLanguageForTests();
});

describe.each(['pt-PT', 'pt-BR'] as const)('typography in %s', language => {
  it('keeps the line height and the tracking of every Material type role for accented Portuguese text', async () => {
    await setAppLanguage(language);
    const {run, undo} = makeHost();
    for (const [role, spec] of Object.entries(AWA_TYPESCALE)) {
      const out = flat(run({style: {fontSize: spec.fontSize, lineHeight: spec.lineHeight, letterSpacing: spec.letterSpacing}, children: 'Ação de coração: fase lútea, ovulação'}));
      expect([role, out.lineHeight, out.letterSpacing]).toEqual([role, spec.lineHeight, spec.letterSpacing]);
    }
    undo();
  });

  it('keeps the Inter face for accented Portuguese text (every diacritic is inside the Latin faces)', async () => {
    await setAppLanguage(language);
    const {run, undo} = makeHost();
    expect(flat(run({style: {fontSize: 14, lineHeight: 18}, children: 'áàâãéêíóôõúç ÁÀÂÃÉÊÍÓÔÕÚÇ'})).fontFamily).toBe('Inter-Regular');
    undo();
  });

  it('long Portuguese words stay a Latin line: no wrapper adjusts input value / placeholder either', async () => {
    await setAppLanguage(language);
    const {run, undo} = makeHost();
    for (const field of ['value', 'defaultValue', 'placeholder']) {
      expect([field, flat(run({style: {fontSize: 16, lineHeight: 20}, [field]: 'Introduza o seu nome'})).lineHeight]).toEqual([field, 20]);
    }
    undo();
  });
});
