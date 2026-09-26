import AsyncStorage from '@react-native-async-storage/async-storage';
import fontkit from '@pdf-lib/fontkit';
import {PDFDocument, decodeFromBase64} from 'pdf-lib';

import {
  PDF_UNSUPPORTED_MARKER,
  PDF_UNSUPPORTED_NOTICE,
  generateMedicalExportPdfBase64,
} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {buildMedicalExport} from '../medicalExportOrchestrator';
import {encryptNoteSection} from '../privateNotesEncryption';
import {saveJournalSection} from '../../state/dailyJournalStore';
import {lockIntimacy, unlockIntimacy} from '../../state/privateSectionAuthStore';
import {CAIRO_ARABIC_SUBSET_BASE64} from '../pdfArabicFont';
import {extractDrawnText, type DrawnText} from '../../testUtils/pdfExtract';

// M45 - Arabic in the medical PDF. What these tests PROVE (byte-stream level):
// the Arabic text is drawn with the embedded Arabic font (Type0 / Identity-H),
// as the SHAPED glyph sequence fontkit produces for that string (checked by
// comparing the advance widths of the painted glyphs against an independent
// reference layout of the same font - joined forms differ from isolated ones),
// in VISUAL right-to-left order, right-aligned for an Arabic paragraph, with
// digits / Latin words kept left-to-right. What they do NOT prove: how a viewer
// paints it - that was checked separately by rendering the generated PDFs with
// MuPDF and looking at the images (see the M45 report), not in Jest.
const referenceFont = fontkit.create(decodeFromBase64(CAIRO_ARABIC_SUBSET_BASE64)) as unknown as {
  unitsPerEm: number;
  layout: (text: string) => {glyphs: {advanceWidth: number}[]};
};

/** Advance widths (1/1000 em) fontkit gives the glyphs of `text` - in visual order for Arabic. */
const referenceWidths = (text: string): number[] =>
  referenceFont.layout(text).glyphs.map(glyph => Math.round((glyph.advanceWidth * 1000) / referenceFont.unitsPerEm));

const sameWidths = (drawn: number[], reference: number[]): boolean =>
  drawn.length === reference.length && drawn.every((width, index) => Math.abs(width - reference[index]) <= 1);

/** True when an Arabic piece is the shaped rendering of `logical` (optionally padded by the neutral spaces bidi may attach). */
const isShapedRendering = (piece: DrawnText, logical: string): boolean =>
  piece.kind === 'arabic' &&
  [logical, ` ${logical}`, `${logical} `, ` ${logical} `].some(candidate => sameWidths(piece.widths, referenceWidths(candidate)));

const modelWith = (lines: string[]) =>
  buildExportReportModel(
    [{date: '2026-08-24', categories: [{category: 'notes', label: 'Notes du jour', lines}]}],
    'Suivi',
    'Tout l’historique',
    '25 août 2026',
  );

const drawnFor = async (lines: string[]) => extractDrawnText(await generateMedicalExportPdfBase64(modelWith(lines)));
const arabicPieces = (drawn: DrawnText[]) => drawn.filter(piece => piece.kind === 'arabic');
const latinText = (drawn: DrawnText[]) => drawn.filter(piece => piece.kind === 'latin').map(piece => piece.text).join('|');

describe('French / Latin text is unchanged (no Arabic font is loaded for it)', () => {
  it('1. "Suivi du cycle" is drawn with the standard font and the PDF embeds no Arabic font', async () => {
    const base64 = await generateMedicalExportPdfBase64(modelWith(['Suivi du cycle']));
    const drawn = await extractDrawnText(base64);
    expect(latinText(drawn)).toContain('• Suivi du cycle');
    expect(arabicPieces(drawn)).toHaveLength(0);
    // A French-only report stays tiny: the Arabic font (tens of KB) is never embedded.
    expect(Buffer.from(base64, 'base64').length).toBeLessThan(6000);
    expect(Buffer.from(base64, 'base64').toString('latin1')).not.toContain('/Type0');
  });

  it('2. accents and typographic characters are kept verbatim', async () => {
    const drawn = await drawnFor(['Règles, température, énergie — « fatiguée » œ ’ €']);
    expect(latinText(drawn)).toContain('• Règles, température, énergie — « fatiguée » œ ’ €');
    expect(latinText(drawn)).not.toContain(PDF_UNSUPPORTED_NOTICE);
  });
});

describe('Arabic is drawn (never replaced)', () => {
  it('3. "متابعة الدورة الشهرية": shaped glyphs, right-to-left order, no marker, no notice', async () => {
    const text = 'متابعة الدورة الشهرية';
    const drawn = await drawnFor([text]);
    const pieces = arabicPieces(drawn);
    expect(pieces).toHaveLength(1);
    expect(isShapedRendering(pieces[0], text)).toBe(true);
    expect(latinText(drawn)).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(latinText(drawn)).not.toContain(PDF_UNSUPPORTED_NOTICE);
    expect(JSON.stringify(drawn)).not.toContain('?');
  });

  it('3b. joining is real: the painted glyphs are NOT the isolated letter forms, and the visual order is the reverse of the logical order', () => {
    const text = 'متابعة';
    const shaped = referenceWidths(text);
    const isolated = Array.from(text).map(letter => referenceWidths(letter)).flat();
    // Cairo builds each letter as ONE glyph, so shaping = choosing the joined form: widths differ.
    expect(shaped).not.toEqual(isolated);
    // Visual order: the FIRST painted glyph is the last letter (ة), in its final form.
    expect(shaped[0]).toBe(referenceWidths('بة')[0]); // final ة (joined to the letter before it)
    expect(shaped[0]).not.toBe(referenceWidths('ة')[0]); // not the isolated form
  });

  it('4. an Arabic sentence "تم تسجيل الأعراض اليوم"', async () => {
    const text = 'تم تسجيل الأعراض اليوم';
    const pieces = arabicPieces(await drawnFor([text]));
    expect(pieces).toHaveLength(1);
    expect(isShapedRendering(pieces[0], text)).toBe(true);
  });

  it('5. mixed "Cycle — متابعة الدورة": the Latin part first (left), the Arabic phrase after it', async () => {
    const drawn = await drawnFor(['Cycle — متابعة الدورة']);
    const kinds = drawn.filter(piece => /•|Cycle|—/.test(piece.text) || piece.kind === 'arabic').map(piece => piece.kind);
    expect(kinds).toEqual(['latin', 'arabic']);
    expect(latinText(drawn)).toContain('• Cycle —');
    expect(isShapedRendering(arabicPieces(drawn)[0], 'متابعة الدورة')).toBe(true);
    expect(latinText(drawn)).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('6. Arabic + number "اليوم 12 من الدورة": right-aligned RTL paragraph, "12" stays "12" (not "21"), between the two Arabic parts', async () => {
    const drawn = await drawnFor(['اليوم 12 من الدورة']);
    const line = drawn.filter(piece => piece.kind === 'arabic' || piece.text.trim() === '12' || piece.text.trim() === '•');
    // Visual left -> right: "من الدورة", "12", "اليوم", bullet (an Arabic paragraph starts at the RIGHT).
    expect(line.map(piece => (piece.kind === 'arabic' ? 'ar' : piece.text.trim()))).toEqual(['ar', '12', 'ar', '•']);
    expect(isShapedRendering(line[0], 'من الدورة')).toBe(true);
    expect(isShapedRendering(line[2], 'اليوم')).toBe(true);
  });

  it('7. Arabic + date: the date keeps its left-to-right digits and separators', async () => {
    const drawn = await drawnFor(['تم التسجيل بتاريخ 26/09/2026']);
    expect(latinText(drawn)).toContain('26/09/2026');
    expect(latinText(drawn)).not.toContain('6202/90/62');
    const pieces = arabicPieces(drawn);
    // The date is the logical END of the sentence: visually the LEFTMOST piece of the line.
    const order = drawn.filter(piece => piece.kind === 'arabic' || piece.text.includes('26/09/2026')).map(piece => piece.kind);
    expect(order[0]).toBe('latin');
    expect(pieces.some(piece => isShapedRendering(piece, 'تم التسجيل بتاريخ'))).toBe(true);
  });

  it('7b. Arabic-Indic digits are numbers: they read left to right inside Arabic text', async () => {
    const drawn = await drawnFor(['اليوم ٣٢١']);
    const digits = arabicPieces(drawn).map(piece => piece.text).join('');
    expect(digits).toContain('٣٢١'); // ToUnicode of the painted glyphs, left to right
    expect(digits).not.toContain('١٢٣');
  });

  it('8. long Arabic text wraps: every line fits the page, no word is lost, lines stay right-aligned Arabic', async () => {
    const text =
      'اليوم شعرت بتعب شديد في الصباح ثم تحسنت حالتي تدريجيا بعد الظهر وذهبت للتمشي قليلا مع صديقتي في الحديقة القريبة من المنزل وتناولت وجبة خفيفة صحية وشربت الكثير من الماء وناموت مبكرا ليلا استعدادا لموعد الطبيب صباح الغد';
    const pieces = arabicPieces(await drawnFor([text]));
    expect(pieces.length).toBeGreaterThanOrEqual(2);

    const maxWidth = 595.28 - 100 - 16; // page - margins - bullet indent
    pieces.forEach(piece => {
      const width = (piece.widths.reduce((sum, w) => sum + w, 0) * piece.size) / 1000;
      expect(width).toBeLessThanOrEqual(maxWidth + 0.5);
    });
    // Nothing lost: each wrap replaces one space by the line break, and the first
    // line keeps the neutral space that follows the (Helvetica) bullet.
    const glyphs = pieces.reduce((sum, piece) => sum + piece.glyphIds.length, 0);
    expect(glyphs).toBe(referenceWidths(text).length - (pieces.length - 1) + 1);
  });

  it('10. an emoji inside Arabic text is replaced explicitly, the Arabic around it is NOT', async () => {
    const drawn = await drawnFor(['متعبة 😊 اليوم']);
    const flat = drawn.filter(piece => piece.kind === 'latin').map(piece => piece.text).join(' ');
    expect(flat).toContain(PDF_UNSUPPORTED_MARKER);
    expect(flat).toContain(PDF_UNSUPPORTED_NOTICE); // (the notice wraps over several lines)
    // One right-to-left run: visual left -> right it starts with the SHAPED "اليوم"
    // (the logical end) and ends with the shaped "متعبة" (the logical start).
    const [piece] = arabicPieces(drawn);
    const starts = referenceWidths('اليوم');
    const ends = referenceWidths('متعبة');
    expect(sameWidths(piece.widths.slice(0, starts.length), starts)).toBe(true);
    // (the run's last painted glyph is the neutral space that follows the Helvetica bullet)
    expect(sameWidths(piece.widths.slice(piece.widths.length - ends.length - 1, piece.widths.length - 1), ends)).toBe(true);
    // The notice never claims Arabic is unsupported any more.
    expect(PDF_UNSUPPORTED_NOTICE).not.toMatch(/arabe/i);
  });

  it('zero-width and bidi control characters (no glyph in the font) are dropped, not turned into markers', async () => {
    const drawn = await drawnFor(['متابعة‏ الدورة‎']);
    expect(latinText(drawn)).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(isShapedRendering(arabicPieces(drawn)[0], 'متابعة الدورة')).toBe(true);
  });

  it('a PDF containing Arabic reopens as a valid document', async () => {
    const base64 = await generateMedicalExportPdfBase64(modelWith(['متابعة الدورة الشهرية', 'Cycle — متابعة الدورة']));
    const reopened = await PDFDocument.load(Buffer.from(base64, 'base64'));
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(1);
    // Only the SUBSET font is embedded (well under the ~70 KB full subset).
    expect(Buffer.from(base64, 'base64').length).toBeLessThan(40000);
  });
});

describe('9. encrypted Arabic note - authorised export only', () => {
  const NOTE = 'اليوم شعرت بتعب شديد وتحسنت بعد الظهر';
  const DATE = '2026-08-21';
  const now = new Date('2026-08-25T12:00:00');

  beforeAll(async () => {
    await AsyncStorage.clear();
    await saveJournalSection(DATE, 'encryptedNote', await encryptNoteSection({text: NOTE, updatedAt: '2026-08-21T10:00:00.000Z'}));
  });
  afterEach(() => lockIntimacy());

  it('stored encrypted; locked -> nothing; unlocked -> the note is drawn shaped in the PDF; storage stays encrypted', async () => {
    const dump = async () => {
      const keys = [...(await AsyncStorage.getAllKeys())].sort();
      return JSON.stringify(await Promise.all(keys.map(async key => [key, await AsyncStorage.getItem(key)])));
    };
    const before = await dump();
    expect(before).not.toContain(NOTE);

    expect(await buildMedicalExport('cycle', 'all', 'pdf', ['notes'], now)).toEqual({kind: 'locked'});

    unlockIntimacy();
    const result = await buildMedicalExport('cycle', 'all', 'pdf', ['notes'], now);
    expect(result.kind).toBe('pdf');
    if (result.kind !== 'pdf') {return;}
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(result.model));
    expect(arabicPieces(drawn).some(piece => isShapedRendering(piece, NOTE))).toBe(true);

    const after = await dump();
    expect(after).toBe(before); // nothing decrypted written back
    expect(after).not.toContain(NOTE);
  });
});

describe('12. CSV stays lossless', () => {
  it('contains the exact original Arabic Unicode string (and emoji)', () => {
    const arabic = 'متابعة الدورة الشهرية — اليوم ١٢ 😊';
    const csv = buildExportCsv([{date: '2026-08-24', categories: [{category: 'notes', label: 'Notes du jour', lines: [arabic]}]}]);
    expect(csv).toContain(arabic);
  });
});
