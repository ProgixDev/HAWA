import fs from 'fs';
import path from 'path';
import fontkit from '@pdf-lib/fontkit';
import {PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, decodeFromBase64, decodePDFRawStream} from 'pdf-lib';

import {PDF_UNSUPPORTED_MARKER, containsDevanagari, ensureShapingRuntime, generateMedicalExportPdfBase64, shapedWidth} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel, escapeCsvField} from '../medicalExportFormatting';
import {NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64} from '../pdfDevanagariFont';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {hi} from '../../i18n/locales/hi';
import i18n from '../../i18n';

jest.mock('@dr.pogodin/react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  exists: jest.fn(),
  mkdir: jest.fn(),
  readDir: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

// Hindi (Devanagari) PDF / CSV export. Helvetica has no Devanagari, and embedding a font is not enough: the text has to be SHAPED
// (conjuncts, reph, vowel-sign reordering) and the glyphs POSITIONED (anusvara, nukta, matras are attached by mark-positioning
// offsets). pdf-lib applies the substitutions but drops the offsets, so the exporter shapes with fontkit and draws every glyph at
// its own position (medicalExportPdf.ts: drawShapedRun). These tests read the PDF back and compare it with fontkit's own shaping.

const build = (lines: string[], label = 'नोट्स', day = '25 अगस्त 2026') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    'मासिक चक्र ट्रैकिंग',
    'पूरा इतिहास',
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

/** The decoded content stream of every page. */
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

type ShapedRun = {glyphs: Array<{id: number}>; positions: Array<{xAdvance: number; yAdvance: number; xOffset: number; yOffset: number}>};
type ShapingFont = {unitsPerEm: number; layout: (text: string) => ShapedRun};
const regularFace = (): ShapingFont => fontkit.create(decodeFromBase64(NOTO_SANS_DEVANAGARI_REGULAR_SUBSET_BASE64)) as unknown as ShapingFont;

beforeAll(async () => {
  ensureShapingRuntime();
  await setAppLanguage('hi');
  await i18n.changeLanguage('hi');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('containsDevanagari', () => {
  it('detects the Devanagari block and nothing else', () => {
    expect(containsDevanagari('मासिक चक्र')).toBe(true);
    expect(containsDevanagari('।')).toBe(true);
    expect(containsDevanagari('Hello çğıİöşü Привет مرحبا 月经 😊 28')).toBe(false);
  });
});

describe('the embedded Devanagari face and the shaper', () => {
  it('forms conjuncts and reph: क्ष ज्ञ श्र द्ध are ONE glyph, धर्म is three, and no character falls back to .notdef', () => {
    const face = regularFace();
    for (const conjunct of ['क्ष', 'ज्ञ', 'श्र', 'द्ध']) {
      expect([conjunct, face.layout(conjunct).glyphs.length]).toEqual([conjunct, 1]);
    }
    expect(face.layout('धर्म').glyphs.length).toBe(3);
    expect(face.layout('ट्रैकिंग').glyphs.length).toBeLessThan([...'ट्रैकिंग'].length);
    expect(face.layout('क़').glyphs.length).toBe(1); // consonant + nukta
  });

  it('measures a line word by word with exactly the advance of the whole shaped line (no kerning against spaces)', () => {
    const face = regularFace();
    const lines = [
      'संयुक्ताक्षर कं ट्रैकिंग रिपोर्ट धर्म',
      'मासिक धर्म के दौरान हल्की ऐंठन, थकान और मूड में बदलाव महसूस होना सामान्य है।',
      '28 दिन; ओव्यूलेशन 14 वें दिन। क़ज़ा रोज़ा नमाज़ ₹500',
      'पीरियड  दो  स्पेस  के  साथ',
    ];
    for (const line of lines) {
      const whole = face.layout(line).positions.reduce((sum, position) => sum + position.xAdvance, 0);
      expect([line, Math.abs(shapedWidth(face, line, 1000) - whole) < 1e-6]).toEqual([line, true]);
    }
  });

  it('positions marks with offsets (anusvara, vowel signs): the very information pdf-lib alone would drop', () => {
    const face = regularFace();
    const withOffset = ['कं', 'ट्रैकिंग', 'रिपोर्ट'].filter(text => face.layout(text).positions.some(p => p.xOffset !== 0 || p.yOffset !== 0));
    expect(withOffset).toEqual(['कं', 'ट्रैकिंग', 'रिपोर्ट']);
  });

  it('draws every Devanagari run of the Hindi dictionary, the 41 pregnancy weeks and the 73 articles without a missing glyph', () => {
    const face = regularFace();
    const strings: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {strings.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk(hi);
    for (let week = 1; week <= 41; week += 1) {walk(getPregnancyWeekData(week, 'hi'));}
    const libraryDir = path.resolve(__dirname, '../../screens/library');
    for (const file of fs.readdirSync(libraryDir).filter(name => /ArticleScreen\.tsx$/.test(name))) {
      const text = fs.readFileSync(path.join(libraryDir, file), 'utf8');
      const start = text.search(/\n {2}hi: \{/);
      strings.push(text.slice(start));
    }
    const runs = new Set<string>();
    for (const value of strings) {
      // maximal runs of characters the face has (Devanagari block, joiners, digits, spaces, common punctuation)
      for (const run of value.match(/[ऀ-ॿ‌‍]+(?:[ ऀ-ॿ‌‍0-9.,;:!?()\-–—‘’“”…]*[ऀ-ॿ‌‍])?/g) ?? []) {runs.add(run);}
    }
    // every distinct word (shaping works word by word, and one layout call per word-chunk keeps this fast)
    const words = new Set<string>();
    runs.forEach(run => run.split(/\s+/).forEach(word => words.add(word)));
    expect(words.size).toBeGreaterThan(3000);
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
  });
});

describe('Hindi PDF export', () => {
  it('draws a Hindi report with Devanagari + Helvetica and no unsupported marker', async () => {
    const pdf = await generateMedicalExportPdfBase64(
      build(['आज हल्का पेट दर्द था, तापमान 36.7 °C, विटामिन D ली। AWA रिपोर्ट', 'मासिक धर्म चक्र: 28 दिन; ओव्यूलेशन 14 वें दिन।']),
    );
    const names = await faces(pdf);
    expect(names.some(name => /^NotoSansDevanagari-Regular/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansDevanagari-Bold/.test(name))).toBe(true);
    expect(names.some(name => /^Helvetica/.test(name))).toBe(true);
    const contents = (await pageContents(pdf)).join('\n');
    expect(contents).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(placedGlyphs(contents).length).toBeGreaterThan(100);
    // the Latin words stay readable Helvetica text ("AWA", the digits and the degree sign are not on the Devanagari face)
    expect(contents).toMatch(/<[0-9a-f]*415741[0-9a-f]*> Tj/i); // "AWA" (0x41 0x57 0x41) is Helvetica text
  });

  it('places every glyph exactly where fontkit\'s shaper put it (glyph ids, advances and mark offsets)', async () => {
    const face = regularFace();
    const lineText = 'संयुक्ताक्षर कं ट्रैकिंग रिपोर्ट धर्म';
    const pdf = await generateMedicalExportPdfBase64(build([lineText]));
    const placed = placedGlyphs((await pageContents(pdf))[0]);
    const expected = face.layout(lineText);
    const ids = expected.glyphs.map(glyph => glyph.id);
    // find the run in the stream
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
    // and at least one glyph of the line really is offset from the baseline / its pen position (the marks)
    expect(expected.positions.some(position => position.xOffset !== 0 || position.yOffset !== 0)).toBe(true);
  });

  it('keeps every drawn glyph inside the page and wraps long Hindi text onto more lines and pages', async () => {
    const sentence = 'मासिक धर्म के दौरान हल्की ऐंठन, थकान और मूड में बदलाव महसूस होना सामान्य है और आराम तथा पर्याप्त पानी से राहत मिल सकती है।';
    const pdf = await generateMedicalExportPdfBase64(build(Array.from({length: 90}, () => sentence)));
    const doc = await PDFDocument.load(Buffer.from(pdf, 'base64'));
    expect(doc.getPageCount()).toBeGreaterThan(1);
    const contents = await pageContents(pdf);
    for (const content of contents) {
      for (const glyph of placedGlyphs(content)) {
        expect(glyph.x).toBeGreaterThan(0);
        expect(glyph.x).toBeLessThan(595.28 - 20);
        expect(glyph.y).toBeGreaterThan(0);
      }
    }
  });

  it('a character neither face has (Cyrillic, hanzi) is replaced by the marker instead of failing', async () => {
    const pdf = await generateMedicalExportPdfBase64(build(['नोट Привет 月经 सामान्य']));
    const contents = (await pageContents(pdf)).join('\n');
    expect(contents).toContain('[');
    expect((await PDFDocument.load(Buffer.from(pdf, 'base64'))).getPageCount()).toBeGreaterThan(0);
  });

  it('does not depend on a global regeneratorRuntime: Hermes has native generators, so React Native does not define it', async () => {
    const scope = globalThis as {regeneratorRuntime?: unknown};
    const saved = scope.regeneratorRuntime;
    scope.regeneratorRuntime = undefined;
    try {
      const pdf = await generateMedicalExportPdfBase64(build(['संयुक्ताक्षर क्ष त्र ज्ञ']));
      expect(placedGlyphs((await pageContents(pdf))[0]).length).toBeGreaterThan(5);
      expect(typeof scope.regeneratorRuntime).toBe('object');
    } finally {
      scope.regeneratorRuntime = saved;
    }
  });

  it('a Hindi report holds only Hindi UI text from the dictionary (no English labels)', async () => {
    const pdf = await generateMedicalExportPdfBase64(build(['सामान्य']));
    const contents = (await pageContents(pdf)).join('\n');
    expect(contents).not.toMatch(/Summary|History|Days recorded/);
    expect(placedGlyphs(contents).length).toBeGreaterThan(40);
  });
});

describe('reports without Devanagari are unchanged', () => {
  // The report headings come from the active app language: these reports are the other languages' ones.
  beforeAll(async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
  });

  afterAll(async () => {
    await setAppLanguage('hi');
    await i18n.changeLanguage('hi');
  });

  it.each([
    ['English', 'Mild cramps in the morning, temperature 36.7 °C'],
    ['French', 'Légères crampes ce matin, température 36,7 °C'],
    ['Turkish', 'Hafif kramp, ağrı, şiş, ışık'],
    ['Russian', 'Лёгкие спазмы утром, температура 36,7 °C'],
    ['Chinese', '今天有轻微腹痛，体温 36.7 °C'],
  ])('a %s report embeds no Devanagari face and draws no shaped glyphs', async (_name, text) => {
    const pdf = await generateMedicalExportPdfBase64(buildExportReportModel([{date: '2026-08-25', categories: [{category: 'notes', label: 'Notes', lines: [text]}]}], 'Cycle', 'All', '25 Aug 2026'));
    expect((await faces(pdf)).some(name => /Devanagari/.test(name))).toBe(false);
    expect(placedGlyphs((await pageContents(pdf)).join('\n'))).toEqual([]);
  });
});

describe('Hindi CSV export', () => {
  it('keeps Devanagari, the ; delimiter, quotes and line breaks intact (UTF-8, lossless)', () => {
    const lines = ['हल्की ऐंठन; थकान', 'दूसरी "पंक्ति"\nतीसरी', 'क्ष त्र ज्ञ श्र ट्रैकिंग'];
    const csv = buildExportCsv([{date: '2026-08-25', categories: [{category: 'notes', label: 'नोट्स', lines}]}] as never);
    // the export joins a category's lines with " ; " into one value, which is quoted because it holds ';', '"' and a line break
    const value = lines.join(' ; ');
    expect(csv).toContain(escapeCsvField(value));
    expect(escapeCsvField(value).startsWith('"')).toBe(true);
    expect(csv).toContain('क्ष त्र ज्ञ श्र ट्रैकिंग');
    // RFC 4180 read-back of the data row: three fields, the value restored character for character
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
    expect(fields).toEqual(['2026-08-25', 'नोट्स', value]);
    const header = csv.split(/\r?\n/)[0];
    expect(header.split(';')).toHaveLength(3);
    expect(/[ऀ-ॿ]/.test(header)).toBe(true); // Hindi headers
    // lossless through UTF-8 (what writeFile(..., 'utf8') produces) and back
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv);
  });
});
