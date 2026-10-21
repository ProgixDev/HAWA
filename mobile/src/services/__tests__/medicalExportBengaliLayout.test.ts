import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import {PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, decodeFromBase64, decodePDFRawStream} from 'pdf-lib';

import {
  PDF_UNSUPPORTED_MARKER,
  containsBengali,
  containsDevanagari,
  createBengaliFace,
  ensureShapingRuntime,
  generateMedicalExportPdfBase64,
  guardBengaliSyllables,
  shapedWidth,
} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel, escapeCsvField} from '../medicalExportFormatting';
import {NOTO_SANS_BENGALI_BOLD_SUBSET_BASE64, NOTO_SANS_BENGALI_REGULAR_SUBSET_BASE64} from '../pdfBengaliFont';
import {NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64} from '../pdfDevanagariFont';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {bn} from '../../i18n/locales/bn';
import i18n from '../../i18n';
import golden from './fixtures/bengaliHarfBuzzGolden.json';

jest.mock('@dr.pogodin/react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  exists: jest.fn(),
  mkdir: jest.fn(),
  readDir: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

// Bengali PDF / CSV export. Helvetica has no Bengali; the report is drawn with Noto Sans Bengali, shaped by fontkit's Indic shaper and drawn glyph by
// glyph (drawShapedRun). fontkit alone does NOT shape Bengali like HarfBuzz (mark filtering sets, backtrack order, ligature components, initial
// forms): fontkitOpenTypeFixes.ts and guardBengaliSyllables make it do so. The reference data in fixtures/bengaliHarfBuzzGolden.json was produced by
// HarfBuzz (uharfbuzz) with the same font; these tests pin the shaper to it and read the PDF back.

const build = (lines: string[], label = 'নোট', day = '25 আগস্ট 2026') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    'মাসিক চক্র ট্র্যাকিং',
    'পুরো ইতিহাস',
    day,
  );

const faces = async (base64: string): Promise<string[]> => {
  const doc = await PDFDocument.load(Buffer.from(base64, 'base64'));
  const names = new Set<string>();
  doc.context.enumerateIndirectObjects().forEach(([, object]) => {
    if (object instanceof PDFDict && object.get(PDFName.of('BaseFont'))) {
      names.add(String(object.get(PDFName.of('BaseFont'))).replace(/^\/(?:[A-Z]{6}\+)?/, ''));
    }
  });
  return [...names].sort();
};

const pageContents = async (base64: string): Promise<string[]> => {
  const doc = await PDFDocument.load(Buffer.from(base64, 'base64'));
  return doc.getPages().map(page => {
    const contents = page.node.Contents();
    const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
    return refs
      .map(ref => {
        const stream = doc.context.lookup(ref as never);
        return Buffer.from(decodePDFRawStream(stream as PDFRawStream).decode()).toString('latin1');
      })
      .join('\n');
  });
};

type Placed = {gid: number; x: number; y: number};
const placedGlyphs = (content: string): Placed[] => {
  const result: Placed[] = [];
  const pattern = /1 0 0 1 ([-\d.e]+) ([-\d.e]+) Tm\s+<([0-9a-fA-F]{4})> Tj/g;
  let match = pattern.exec(content);
  while (match) {
    result.push({x: Number(match[1]), y: Number(match[2]), gid: parseInt(match[3], 16)});
    match = pattern.exec(content);
  }
  return result;
};

type Shaped = {glyphs: Array<{id: number}>; positions: Array<{xAdvance: number; yAdvance: number; xOffset: number; yOffset: number}>; };
type ShapingFace = {unitsPerEm: number; layout: (text: string) => Shaped};
const regularFace = (): ShapingFace => createBengaliFace(NOTO_SANS_BENGALI_REGULAR_SUBSET_BASE64);
const boldFace = (): ShapingFace => createBengaliFace(NOTO_SANS_BENGALI_BOLD_SUBSET_BASE64);
/** What fontkit alone (no fixes, no guard) gives for the same font. */
const plainFace = (base64: string): ShapingFace => fontkit.create(decodeFromBase64(base64)) as unknown as ShapingFace;

// the empty zero-advance glyph the syllable guard (ZWNJ / ZWJ) shapes to; HarfBuzz output has none
const GUARD_GLYPH = 5;
const shapedRows = (face: ShapingFace, text: string): number[][] => {
  const run = face.layout(text);
  return run.glyphs
    .map((glyph, index) => [glyph.id, run.positions[index].xAdvance, run.positions[index].xOffset, run.positions[index].yOffset])
    .filter(row => !(row[0] === GUARD_GLYPH && row[1] === 0));
};

beforeAll(async () => {
  ensureShapingRuntime();
  await setAppLanguage('bn');
  await i18n.changeLanguage('bn');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('containsBengali', () => {
  it('detects the Bengali block and nothing else', () => {
    expect(containsBengali('মাসিক চক্র')).toBe(true);
    expect(containsBengali('।')).toBe(false); // the danda is the shared U+0964, not in the Bengali block itself
    expect(containsBengali('Hello çğıİöşü Привет مرحبا 月经 मासिक 😊 28')).toBe(false);
    expect(containsDevanagari('।')).toBe(true);
  });
});

describe('the embedded Bengali face and the shaper', () => {
  it('forms the conjuncts: ক্ষ and জ্ঞ are ONE glyph, and no character falls back to .notdef', () => {
    const face = regularFace();
    for (const conjunct of ['ক্ষ', 'জ্ঞ', 'ত্র']) {
      expect([conjunct, face.layout(conjunct).glyphs.length]).toEqual([conjunct, 1]);
    }
    expect(face.layout('সংস্কৃতি').glyphs.some(glyph => glyph.id === 0)).toBe(false);
    expect(face.layout('।').glyphs.some(glyph => glyph.id === 0)).toBe(false); // the dari is in the Bengali subset
  });

  it('matches HarfBuzz glyph for glyph, advance for advance and mark offset for mark offset (48 words, Regular and Bold)', () => {
    const mismatches: string[] = [];
    for (const [label, face] of [['regular', regularFace()], ['bold', boldFace()]] as const) {
      const reference = (golden as Record<string, Record<string, number[][]>>)[label];
      for (const word of Object.keys(reference)) {
        if (JSON.stringify(shapedRows(face, word)) !== JSON.stringify(reference[word])) {
          mismatches.push(`${label}:${word}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('is NOT what fontkit does on its own: without the fixes a large share of the same words differ (guards the fixes against removal)', () => {
    const face = plainFace(NOTO_SANS_BENGALI_REGULAR_SUBSET_BASE64);
    const reference = (golden as Record<string, Record<string, number[][]>>).regular;
    const words = Object.keys(reference);
    const different = words.filter(word => JSON.stringify(shapedRows(face, word)) !== JSON.stringify(reference[word]));
    expect(different.length).toBeGreaterThan(words.length / 3);
  });

  it('gives the left vowel sign its initial form only at the start of a word (guardBengaliSyllables)', () => {
    expect(guardBengaliSyllables('ভালো')).toBe('ভা‌লো');
    expect(guardBengaliSyllables('সংকেতের')).toBe('সং‍কে‌তে‌র');
    expect(guardBengaliSyllables('ক্ষ')).toBe('ক্ষ'); // a conjunct is one syllable: nothing is inserted after a virama
    expect(guardBengaliSyllables('AWA 28')).toBe('AWA 28');
    const face = regularFace();
    // the second e-kar of জেনে is the plain form, the first the initial form (two different glyphs)
    const ids = face.layout('জেনে').glyphs.map(glyph => glyph.id);
    expect(new Set(ids.filter(id => id !== GUARD_GLYPH)).size).toBeGreaterThanOrEqual(3);
    expect(shapedRows(face, 'জেনে').map(row => row[0])).toEqual((golden as Record<string, Record<string, number[][]>>).regular.জেনে.map(row => row[0]));
  });

  it('measures a line word by word with exactly the advance of the whole shaped line', () => {
    const face = regularFace();
    const lines = [
      'মাসিকের সময় হালকা ব্যথা, ক্লান্তি এবং মেজাজের পরিবর্তন',
      'ট্র্যাকিং এন্ট্রি স্ক্রিনিং হৃৎপিণ্ড ভ্রূণ গ্রুপ',
      '28 দিন; ডিম্বস্ফোটন 14 তম দিন। কাজা রোজা নামাজ',
      'পিরিয়ড  দুই  স্পেস  সহ',
    ];
    for (const line of lines) {
      const whole = face.layout(line).positions.reduce((sum, position) => sum + position.xAdvance, 0);
      expect([line, Math.abs(shapedWidth(face, line, 1000) - whole) < 1e-6]).toEqual([line, true]);
    }
  });

  it('positions marks with offsets (u-kar, ra-phala, i-kar): the information pdf-lib alone would drop', () => {
    const face = regularFace();
    const withOffset = ['ট্র্যাকিং', 'স্বাস্থ্য', 'তাঁর'].filter(text => face.layout(text).positions.some(p => p.xOffset !== 0 || p.yOffset !== 0));
    expect(withOffset).toEqual(['ট্র্যাকিং', 'স্বাস্থ্য', 'তাঁর']);
  });

  it('draws every Bengali word of the dictionary, the 41 pregnancy weeks and the 73 articles without a missing glyph', () => {
    const face = regularFace();
    const strings: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {strings.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk(bn);
    for (let week = 1; week <= 41; week += 1) {walk(getPregnancyWeekData(week, 'bn'));}
    const libraryDir = path.resolve(__dirname, '../../screens/library');
    for (const file of fs.readdirSync(libraryDir).filter(name => /ArticleScreen\.tsx$/.test(name))) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}bn: \{/);
      strings.push(text.slice(start));
    }
    const words = new Set<string>();
    for (const value of strings) {
      for (const word of value.match(/[ঀ-৿‌‍]+/g) ?? []) {words.add(word);}
    }
    expect(words.size).toBeGreaterThan(3500);
    const missing: string[] = [];
    const list = [...words];
    for (let index = 0; index < list.length; index += 40) {
      const chunk = list.slice(index, index + 40);
      if (face.layout(chunk.join(' ')).glyphs.some(glyph => glyph.id === 0)) {
        chunk.forEach(word => {
          if (face.layout(word).glyphs.some(glyph => glyph.id === 0)) {missing.push(word);}
        });
      }
    }
    expect(missing.slice(0, 10)).toEqual([]);
  }, 180000);

  it('leaves the Hindi (Devanagari) face exactly as it was: the Bengali fixes are applied to Bengali faces only', () => {
    const lines = ['संयुक्ताक्षर कं ट्रैकिंग रिपोर्ट धर्म', 'मासिक धर्म के दौरान हल्की ऐंठन, थकान और मूड में बदलाव'];
    const before = lines.map(line => JSON.stringify(plainFace(NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64).layout(line).positions));
    regularFace(); // installs the shared hooks
    boldFace();
    const after = lines.map(line => JSON.stringify(plainFace(NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64).layout(line).positions));
    expect(after).toEqual(before);
  });
});

describe('Bengali PDF export', () => {
  it('draws a Bengali report with Noto Sans Bengali (Regular + Bold) and Helvetica, no Devanagari face, no unsupported marker', async () => {
    const pdf = await generateMedicalExportPdfBase64(
      build(['আজ হালকা পেটব্যথা ছিল, তাপমাত্রা 36.7 °C, ভিটামিন D খেয়েছি। AWA রিপোর্ট', 'মাসিক চক্র: 28 দিন; ডিম্বস্ফোটন 14 তম দিনে।']),
    );
    const names = await faces(pdf);
    expect(names.some(name => /^NotoSansBengali-Regular/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansBengali-Bold/.test(name))).toBe(true);
    expect(names.some(name => /^Helvetica/.test(name))).toBe(true);
    expect(names.some(name => /Devanagari/.test(name))).toBe(false); // the dari (U+0964) is in the Bengali face: no Devanagari face for a full stop
    const contents = (await pageContents(pdf)).join('\n');
    expect(contents).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(placedGlyphs(contents).length).toBeGreaterThan(100);
  });

  it('places every glyph exactly where the shaper put it (glyph ids, advances and mark offsets)', async () => {
    const face = regularFace();
    const lineText = 'সংযুক্তাক্ষর ট্র্যাকিং কেন্দ্রে স্ক্রিনিং শক্তি তাঁর';
    const pdf = await generateMedicalExportPdfBase64(build([lineText]));
    const placed = placedGlyphs((await pageContents(pdf))[0]);
    const expected = face.layout(lineText);
    const ids = expected.glyphs.map(glyph => glyph.id);
    let start = -1;
    for (let index = 0; index + ids.length <= placed.length; index += 1) {
      if (ids.every((gid, offset) => placed[index + offset].gid === gid)) {start = index; break;}
    }
    expect(start).toBeGreaterThanOrEqual(0);
    const size = 10; // list lines are drawn at 10 pt
    const scale = size / face.unitsPerEm;
    let pen = 0;
    const base = placed[start];
    expected.positions.forEach((position, offset) => {
      const drawn = placed[start + offset];
      const expectedX = base.x + (pen + position.xOffset - expected.positions[0].xOffset) * scale;
      const expectedY = base.y + (position.yOffset - expected.positions[0].yOffset) * scale;
      expect([offset, Math.abs(drawn.x - expectedX) < 0.01, Math.abs(drawn.y - expectedY) < 0.01]).toEqual([offset, true, true]);
      pen += position.xAdvance;
    });
    expect(expected.positions.some(position => position.xOffset !== 0 || position.yOffset !== 0)).toBe(true);
  });

  it('keeps every drawn glyph inside the page and wraps long Bengali text onto more lines and pages', async () => {
    const sentence = 'মাসিকের সময় হালকা ব্যথা, ক্লান্তি এবং মেজাজের পরিবর্তন অনুভব করা স্বাভাবিক; বিশ্রাম ও পর্যাপ্ত পানি সাহায্য করতে পারে।';
    const pdf = await generateMedicalExportPdfBase64(build(Array.from({length: 90}, () => sentence)));
    const doc = await PDFDocument.load(Buffer.from(pdf, 'base64'));
    expect(doc.getPageCount()).toBeGreaterThan(1);
    for (const content of await pageContents(pdf)) {
      for (const glyph of placedGlyphs(content)) {
        expect(glyph.x).toBeGreaterThan(0);
        expect(glyph.x).toBeLessThan(595.28 - 20);
        expect(glyph.y).toBeGreaterThan(0);
      }
    }
  }, 120000);

  it('breaks a very long unspaced Bengali token without cutting a syllable and without leaving the page', async () => {
    const token = 'প্রতিষেধকমূলকব্যবস্থাগ্রহণসংক্রান্তপরামর্শ'.repeat(6);
    const pdf = await generateMedicalExportPdfBase64(build([token]));
    const contents = (await pageContents(pdf)).join('\n');
    expect(contents).not.toContain(PDF_UNSUPPORTED_MARKER);
    const glyphs = placedGlyphs(contents);
    expect(glyphs.length).toBeGreaterThan(100);
    glyphs.forEach(glyph => {
      expect(glyph.x).toBeLessThan(595.28 - 20);
    });
    // more than one distinct baseline: the token really was broken over several lines
    expect(new Set(glyphs.map(glyph => glyph.y.toFixed(1))).size).toBeGreaterThan(3);
  }, 120000);

  it('a character no face has (Cyrillic, hanzi) is replaced by the marker instead of failing', async () => {
    const pdf = await generateMedicalExportPdfBase64(build(['নোট Привет 月经 স্বাভাবিক']));
    const contents = (await pageContents(pdf)).join('\n');
    expect(contents).toContain('[');
    expect((await PDFDocument.load(Buffer.from(pdf, 'base64'))).getPageCount()).toBeGreaterThan(0);
  });

  it('does not depend on a global regeneratorRuntime: Hermes has native generators, so React Native does not define it', async () => {
    const scope = globalThis as {regeneratorRuntime?: unknown};
    const saved = scope.regeneratorRuntime;
    scope.regeneratorRuntime = undefined;
    try {
      const pdf = await generateMedicalExportPdfBase64(build(['সংযুক্তাক্ষর ক্ষ ত্র জ্ঞ']));
      expect(placedGlyphs((await pageContents(pdf))[0]).length).toBeGreaterThan(5);
      expect(typeof scope.regeneratorRuntime).toBe('object');
    } finally {
      scope.regeneratorRuntime = saved;
    }
  });

  it('a Bengali report holds only Bengali UI text from the dictionary (no English labels)', async () => {
    const pdf = await generateMedicalExportPdfBase64(build(['স্বাভাবিক']));
    const contents = (await pageContents(pdf)).join('\n');
    expect(contents).not.toMatch(/Summary|History|Days recorded/);
    expect(placedGlyphs(contents).length).toBeGreaterThan(40);
  });
});

describe('reports without Bengali are unchanged', () => {
  beforeAll(async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
  });

  afterAll(async () => {
    await setAppLanguage('bn');
    await i18n.changeLanguage('bn');
  });

  it.each([
    ['English', 'Mild cramps in the morning, temperature 36.7 °C'],
    ['French', 'Légères crampes ce matin, température 36,7 °C'],
    ['Turkish', 'Hafif kramp, ağrı, şiş, ışık'],
    ['Russian', 'Лёгкие спазмы утром, температура 36,7 °C'],
    ['Chinese', '今天有轻微腹痛，体温 36.7 °C'],
  ])('a %s report embeds no Bengali face and draws no shaped glyphs', async (_name, text) => {
    const pdf = await generateMedicalExportPdfBase64(buildExportReportModel([{date: '2026-08-25', categories: [{category: 'notes', label: 'Notes', lines: [text]}]}], 'Cycle', 'All', '25 Aug 2026'));
    expect((await faces(pdf)).some(name => /Bengali|Devanagari/.test(name))).toBe(false);
    expect(placedGlyphs((await pageContents(pdf)).join('\n'))).toEqual([]);
  });

  it('a Hindi report still embeds the Devanagari face and no Bengali face (its danda keeps going to the Devanagari face)', async () => {
    const pdf = await generateMedicalExportPdfBase64(buildExportReportModel([{date: '2026-08-25', categories: [{category: 'notes', label: 'नोट्स', lines: ['हल्की ऐंठन थी। आराम किया।']}]}], 'मासिक चक्र', 'पूरा इतिहास', '25 अगस्त 2026'));
    const names = await faces(pdf);
    expect(names.some(name => /Devanagari/.test(name))).toBe(true);
    expect(names.some(name => /Bengali/.test(name))).toBe(false);
  });
});

describe('Bengali CSV export', () => {
  it('keeps Bengali, the ; delimiter, quotes and line breaks intact (UTF-8, lossless)', () => {
    const lines = ['হালকা ব্যথা; ক্লান্তি', 'দ্বিতীয় "লাইন"\nতৃতীয়', 'ক্ষ জ্ঞ ত্র ট্র্যাকিং'];
    const csv = buildExportCsv([{date: '2026-08-25', categories: [{category: 'notes', label: 'নোট', lines}]}] as never);
    const value = lines.join(' ; ');
    expect(csv).toContain(escapeCsvField(value));
    expect(escapeCsvField(value).startsWith('"')).toBe(true);
    const dataRow = csv.slice(csv.indexOf('\r\n') + 2);
    const fields: string[] = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < dataRow.length; index += 1) {
      const char = dataRow[index];
      if (quoted) {
        if (char === '"' && dataRow[index + 1] === '"') {field += '"'; index += 1;} else if (char === '"') {quoted = false;} else {field += char;}
      } else if (char === '"') {quoted = true;} else if (char === ';') {fields.push(field); field = '';} else {field += char;}
    }
    fields.push(field);
    expect(fields).toEqual(['2026-08-25', 'নোট', value]);
    const header = csv.split(/\r?\n/)[0];
    expect(header.split(';')).toHaveLength(3);
    expect(/[ঀ-৿]/.test(header)).toBe(true); // Bengali headers
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv);
  });
});
