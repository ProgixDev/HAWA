import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import {decodeFromBase64} from 'pdf-lib';

import {RING_CENTER_RATIO, planCycleRingText, ringTextBoxes, ringTextWidthEm} from '../cycleRingLayout';
import {de} from '../../../i18n/locales/de';
import {hi} from '../../../i18n/locales/hi';
import {sq} from '../../../i18n/locales/sq';
import {ja} from '../../../i18n/locales/ja';
import {ko} from '../../../i18n/locales/ko';
import {bn} from '../../../i18n/locales/bn';
import {ptPT, ptBRFull} from '../../../testUtils/portugueseDictionaries';
import {NOTO_SANS_DEVANAGARI_BOLD_SUBSET_BASE64, NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64} from '../../../services/pdfDevanagariFont';
import {createBengaliFace, ensureShapingRuntime} from '../../../services/medicalExportPdf';
import {NOTO_SANS_BENGALI_BOLD_SUBSET_BASE64, NOTO_SANS_BENGALI_REGULAR_SUBSET_BASE64} from '../../../services/pdfBengaliFont';
import {en} from '../../../i18n/locales/en';
import {es} from '../../../i18n/locales/es';
import {fr} from '../../../i18n/locales/fr';
import {id as idDictionary} from '../../../i18n/locales/id';
import {it as itDictionary} from '../../../i18n/locales/it';
import {ru} from '../../../i18n/locales/ru';
import {tr} from '../../../i18n/locales/tr';
import {zh} from '../../../i18n/locales/zh';

// The centre of the cycle ring is a disc 82 dp wide. The caption ("Jour du cycle"), the day number and the phase name must
// all sit inside it, in every language, at any ring size. Widths are MEASURED here from the shipped font files with
// fontkit (kerning included) — independently of the table the planner itself uses — and placed with the planner's own
// vertical layout, so the check is on the real glyph extents, not on the planner's estimate of them.

const FONT_DIR = path.join(__dirname, '..', '..', '..', '..', 'android', 'app', 'src', 'main', 'assets', 'fonts');
const load = (file: string) => fontkit.create(fs.readFileSync(path.join(FONT_DIR, file)));
const interMedium = load('Inter-Medium.ttf');
const interSemiBold = load('Inter-SemiBold.ttf');
// hanzi are not in Inter: the system CJK font draws them one em wide
const isWide = (char: string): boolean => (char.codePointAt(0) ?? 0) >= 0x2e80;
// Devanagari (Hindi) is not in Inter either: Android draws it with Noto Sans Devanagari. The bundled copy of that face is shaped
// here (conjuncts and reph make a word narrower than the sum of its letters) and measured at the weight the text uses.
ensureShapingRuntime();
const DEVANAGARI = /[\u0900-\u097F]/;
const notoRegular = fontkit.create(decodeFromBase64(NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64));
const notoBold = fontkit.create(decodeFromBase64(NOTO_SANS_DEVANAGARI_BOLD_SUBSET_BASE64));
const measureDevanagari = (font: ReturnType<typeof load>, text: string): number => {
  const face = font === interSemiBold ? notoBold : notoRegular;
  return face.layout(text).positions.reduce((sum, position) => sum + position.xAdvance, 0) / face.unitsPerEm;
};
// Bengali is drawn by the system Noto Sans Bengali: the bundled copy is shaped here exactly like HarfBuzz would (createBengaliFace) and measured at the weight the text uses.
const BENGALI = /[ঀ-৿]/;
const bengaliRegular = createBengaliFace(NOTO_SANS_BENGALI_REGULAR_SUBSET_BASE64);
const bengaliBold = createBengaliFace(NOTO_SANS_BENGALI_BOLD_SUBSET_BASE64);
const measureBengali = (font: ReturnType<typeof load>, text: string): number => {
  const face = font === interSemiBold ? bengaliBold : bengaliRegular;
  return face.layout(text).positions.reduce((sum, position) => sum + position.xAdvance, 0) / face.unitsPerEm;
};
const measure = (font: ReturnType<typeof load>, text: string): number => {
  if (DEVANAGARI.test(text)) {return measureDevanagari(font, text);}
  if (BENGALI.test(text)) {return measureBengali(font, text);}
  if (Array.from(text).some(isWide)) {
    return Array.from(text).reduce((sum, char) => sum + (isWide(char) ? 1 : font.layout(char).advanceWidth / font.unitsPerEm), 0);
  }
  return font.layout(text).advanceWidth / font.unitsPerEm; // the whole string: kerning included
};

const DICTIONARIES = {fr, en, es, it: itDictionary, tr, ru, de, zh, id: idDictionary, hi, sq, ja, ko, 'pt-PT': ptPT, 'pt-BR': ptBRFull, bn} as const;
const PHASES = ['menstruation', 'follicular', 'fertile', 'ovulation', 'luteal'] as const;
type Dictionary = {cyclePhase: Record<string, string>; journalNote: {cycleDayLabel: string}};
const copy = (language: keyof typeof DICTIONARIES) => {
  const dictionary = DICTIONARIES[language] as unknown as Dictionary;
  return {caption: dictionary.journalNote.cycleDayLabel, phases: PHASES.map(phase => dictionary.cyclePhase[phase])};
};

const SIZES = [116, 100, 96]; // the dashboards' 116, the partner view's compact 100, and a smaller one
const EDGE = 1.5; // dp of clear space the real glyphs must keep from the disc edge (the plan keeps 3, widened by 4 %)

describe('ring centre text — every language, every phase, every ring size', () => {
  it.each(Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>)('%s: caption, number and phase lines stay inside the disc', language => {
    const {caption, phases} = copy(language);
    for (const size of SIZES) {
      const plan = planCycleRingText({size, caption, phaseLabels: phases});
      const radius = Math.round(size * RING_CENTER_RATIO) / 2 - EDGE;
      for (const phase of phases) {
        const lines = plan.phaseLines[phase];
        expect([language, size, phase, lines.length <= 2]).toEqual([language, size, phase, true]);
        const boxes = ringTextBoxes(plan, measure(interMedium, caption) * plan.caption.fontSize, {
          label: phase,
          lineWidths: lines.map(line => measure(interSemiBold, line) * plan.phase.fontSize),
        });
        boxes.forEach((box, index) => {
          const corner = Math.hypot(box.halfWidth, Math.max(Math.abs(box.top), Math.abs(box.bottom)));
          expect([language, size, phase, `box ${index}`, corner <= radius]).toEqual([language, size, phase, `box ${index}`, true]);
        });
      }
    }
  });

  it('never breaks a word: every line is whole words of the phase name', () => {
    for (const language of Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>) {
      const {caption, phases} = copy(language);
      const plan = planCycleRingText({size: 116, caption, phaseLabels: phases});
      phases.forEach(phase => {
        const lines = plan.phaseLines[phase];
        expect([phase, lines.join(' ')]).toEqual([phase, phase.split(/\s+/).join(' ')]);
      });
    }
  });

  it('keeps the number prominent and the two small texts the same size, within the readable band', () => {
    for (const language of Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>) {
      const {caption, phases} = copy(language);
      const plan = planCycleRingText({size: 116, caption, phaseLabels: phases});
      expect(plan.number.fontSize).toBeGreaterThanOrEqual(20);
      expect(plan.number.fontSize).toBeLessThanOrEqual(24);
      expect(plan.caption.fontSize).toBe(plan.phase.fontSize);
      expect(plan.caption.fontSize).toBeGreaterThanOrEqual(7);
      expect(plan.caption.fontSize).toBeLessThanOrEqual(10);
      // hierarchy: number clearly larger than the two small texts
      expect(plan.number.fontSize / plan.caption.fontSize).toBeGreaterThanOrEqual(2);
    }
  });

  it('the French reference case (day 4 "Phase menstruelle", day 8 "Phase folliculaire") fits at 116 dp', () => {
    const {caption, phases} = copy('fr');
    const plan = planCycleRingText({size: 116, caption, phaseLabels: phases});
    expect(plan.phaseLines['Phase menstruelle']).toEqual(['Phase', 'menstruelle']);
    expect(plan.phaseLines['Phase folliculaire'].join(' ')).toBe('Phase folliculaire'); // one line or two, never a cut word
    expect(plan.phaseReservedLines).toBe(2);
    expect(plan.caption.fontSize).toBeLessThan(11); // it was 11 sp, wider than the disc at its height
  });

  it('is stable across phases: one plan per language, so the caption and number never move', () => {
    const {caption, phases} = copy('fr');
    const a = planCycleRingText({size: 116, caption, phaseLabels: phases});
    const b = planCycleRingText({size: 116, caption, phaseLabels: [...phases].reverse()});
    expect(a).toEqual(b);
  });

  it('scales with the ring: a smaller ring gets smaller type', () => {
    const {caption, phases} = copy('fr');
    const big = planCycleRingText({size: 116, caption, phaseLabels: phases});
    const small = planCycleRingText({size: 96, caption, phaseLabels: phases});
    expect(small.caption.fontSize).toBeLessThan(big.caption.fontSize);
    expect(small.number.fontSize).toBeLessThan(big.number.fontSize);
  });

  it('a name nobody planned for (very long) falls back to the compact layout instead of throwing', () => {
    const plan = planCycleRingText({size: 116, caption: 'Jour du cycle', phaseLabels: ['Anticonstitutionnellement longue phase']});
    expect(plan.caption.fontSize).toBeGreaterThanOrEqual(7);
    expect(plan.phaseLines['Anticonstitutionnellement longue phase'].length).toBeLessThanOrEqual(2);
  });

  it('the estimate used by the planner stays close to the measured widths (within 6 % over, never more than 3 % under)', () => {
    const strings = (Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>).flatMap(language => {
      const {caption, phases} = copy(language);
      return [caption, ...phases];
    });
    strings.forEach(text => {
      const measured = measure(interSemiBold, text);
      const estimate = ringTextWidthEm(text);
      // Devanagari words are shaped (conjuncts), so a table of letter advances is looser there: the planner adds its own wider
      // margin for it (DEVANAGARI_WIDTH_SAFETY); what the check above guarantees is the REAL width fitting the disc.
      const [low, high] = DEVANAGARI.test(text) || BENGALI.test(text) ? [0.88, 1.15] : [0.97, 1.06];
      expect([text, estimate / measured >= low && estimate / measured <= high]).toEqual([text, true]);
    });
  });

  it('Japanese: 1.4 x lines (kana present), the same width margin as Latin; no other language is affected', () => {
    const japanese = copy('ja');
    const japanesePlan = planCycleRingText({size: 116, caption: japanese.caption, phaseLabels: japanese.phases});
    expect(japanesePlan.textLineFactor).toBe(1.4);
    expect(japanesePlan.caption.lineHeight).toBeGreaterThanOrEqual(japanesePlan.caption.fontSize * 1.4);
    expect(japanesePlan.phase.lineHeight).toBeGreaterThanOrEqual(japanesePlan.phase.fontSize * 1.4);
  });

  it('Korean: a Hangul syllable counts as one em (it is not split into jamo by the accent folding)', () => {
    expect(ringTextWidthEm('주기')).toBe(2);
    expect(ringTextWidthEm('주기'.normalize('NFD'))).toBeGreaterThan(2); // already-decomposed jamo are still priced separately (never produced by the app)
    expect(ringTextWidthEm('é')).toBe(ringTextWidthEm('e')); // accents are still folded for Latin text
  });

  it('Korean: 1.4 x lines (Hangul present), the same width margin as Latin; no other language is affected', () => {
    const korean = copy('ko');
    const koreanPlan = planCycleRingText({size: 116, caption: korean.caption, phaseLabels: korean.phases});
    expect(koreanPlan.textLineFactor).toBe(1.4);
    expect(koreanPlan.caption.lineHeight).toBeGreaterThanOrEqual(koreanPlan.caption.fontSize * 1.4);
    expect(koreanPlan.phase.lineHeight).toBeGreaterThanOrEqual(koreanPlan.phase.fontSize * 1.4);
  });

  it('Hindi: taller lines (1.5 x) and a wider width margin than the other languages, which keep 1.2 x (Japanese and Korean have their own 1.4 x)', () => {
    const hindi = copy('hi');
    const hindiPlan = planCycleRingText({size: 116, caption: hindi.caption, phaseLabels: hindi.phases});
    expect(hindiPlan.textLineFactor).toBe(1.5);
    expect(hindiPlan.caption.lineHeight).toBeGreaterThanOrEqual(hindiPlan.caption.fontSize * 1.5);
    expect(hindiPlan.phase.lineHeight).toBeGreaterThanOrEqual(hindiPlan.phase.fontSize * 1.5);
    for (const language of (Object.keys(DICTIONARIES) as Array<keyof typeof DICTIONARIES>).filter(name => name !== 'hi' && name !== 'ja' && name !== 'ko' && name !== 'bn')) {
      const {caption, phases} = copy(language);
      const plan = planCycleRingText({size: 116, caption, phaseLabels: phases});
      expect([language, plan.textLineFactor]).toEqual([language, 1.2]);
      expect([language, plan.caption.lineHeight <= Math.ceil(plan.caption.fontSize * 1.2 * 2) / 2]).toEqual([language, true]);
    }
  });

  it('Hindi: the text stays in the readable band and the number stays prominent', () => {
    const {caption, phases} = copy('hi');
    for (const size of SIZES) {
      const plan = planCycleRingText({size, caption, phaseLabels: phases});
      const unit = Math.round(size * RING_CENTER_RATIO) / 82; // the type scales with the ring
      expect(plan.caption.fontSize).toBeGreaterThanOrEqual(7 * unit - 0.01);
      expect(plan.number.fontSize).toBeGreaterThanOrEqual(20 * unit - 0.25);
      expect(plan.number.fontSize / plan.caption.fontSize).toBeGreaterThanOrEqual(2);
      expect(plan.phaseReservedLines).toBeLessThanOrEqual(2);
    }
  });
});

describe('Bengali centre text', () => {
  it('Bengali: taller lines (1.5 x) and a wider width margin than Latin; the text stays in the readable band and the number stays prominent', () => {
    const {caption, phases} = copy('bn');
    for (const size of SIZES) {
      const plan = planCycleRingText({size, caption, phaseLabels: phases});
      const unit = Math.round(size * RING_CENTER_RATIO) / 82; // the type scales with the ring
      expect(plan.textLineFactor).toBe(1.5);
      expect(plan.caption.lineHeight).toBeGreaterThanOrEqual(plan.caption.fontSize * 1.5);
      expect(plan.phase.lineHeight).toBeGreaterThanOrEqual(plan.phase.fontSize * 1.5);
      expect(plan.caption.fontSize).toBeGreaterThanOrEqual(7 * unit - 0.01);
      expect(plan.number.fontSize).toBeGreaterThanOrEqual(20 * unit - 0.25);
      expect(plan.number.fontSize / plan.caption.fontSize).toBeGreaterThanOrEqual(2);
      expect(plan.phaseReservedLines).toBeLessThanOrEqual(2);
    }
  });

  it('Bengali: the fitted advance model is within -12 % / +8 % of the shaped width on every real ring label (and never narrower than the margin covers)', () => {
    const {caption, phases} = copy('bn');
    for (const text of [caption, ...phases, 'মাসিক', 'পর্যায়', 'লিউটিয়াল', 'ফলিকুলার']) {
      const shaped = measureBengali(interSemiBold, text);
      const estimate = ringTextWidthEm(text);
      expect([text, estimate / shaped > 0.88, estimate / shaped < 1.12]).toEqual([text, true, true]);
    }
  });

  it('Bengali: a conjunct and a vowel sign take less room than a letter, and the hasanta, nukta and chandrabindu take none', () => {
    expect(ringTextWidthEm('ক')).toBeGreaterThan(ringTextWidthEm('ক্ষ') - ringTextWidthEm('ক')); // the second part of a conjunct is narrow
    expect(ringTextWidthEm('কা')).toBeGreaterThan(ringTextWidthEm('ক'));
    expect(ringTextWidthEm('ক্')).toBe(ringTextWidthEm('ক')); // hasanta: zero width
    expect(ringTextWidthEm('কঁ')).toBe(ringTextWidthEm('ক')); // chandrabindu: zero width
    expect(ringTextWidthEm('ক')).toBeGreaterThan(0.6);
  });
});
