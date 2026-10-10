import {PDF_UNSUPPORTED_MARKER, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText, type DrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Turkish PDF export audit regression: every Turkish letter and the typographic
// punctuation the report uses is drawn (Cairo subset, one regular weight), and an
// unbreakable token wider than the line is broken instead of running off the page.

const LINE_WIDTH = 595.28 - 50 * 2;
const LETTERS = 'çğıİöşüÇĞÖŞÜ';

const build = (lines: string[], label = 'Notlar') =>
  buildExportReportModel(
    [{date: '2026-08-24', categories: [{category: 'notes', label, lines}]}],
    'Döngü takibi',
    'Tüm geçmiş',
    '25 Ağustos 2026',
  );

beforeAll(async () => {
  await setAppLanguage('tr');
  await i18n.changeLanguage('tr');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Turkish PDF export layout', () => {
  it('draws every Turkish letter, ’ – — “ ” ° × · with no unsupported marker', async () => {
    const text = `${LETTERS} ’ – — “ ” 38,5 °C × 2 · İSTANBUL ığdır Şişli`;
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text], text)));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const char of [...LETTERS, ...'’–—“”°×·']) {
      expect(all).toContain(char);
    }
  });

  it('breaks a token wider than the line so no drawn piece passes the right margin', async () => {
    const long = `https://ornek.com/${'şığüÖÇ'.repeat(40)}`;
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([long, `sonra ${long} bitti`])));
    const pieces = drawn.filter(piece => piece.size > 0);
    expect(pieces.length).toBeGreaterThan(0);
    pieces.forEach(piece => {
      const width = (piece.widths.reduce((sum, w) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(LINE_WIDTH + 0.5);
    });
    // Nothing is lost: the pieces concatenate back to the original characters.
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined).toContain(long.slice(0, 40));
    expect(joined.split('şığüÖÇ').length - 1).toBeGreaterThanOrEqual(80);
  });
});

// Bold weight (Cairo Bold subset, Turkish path only).
const cairoFaces = async (base64: string): Promise<string[]> => {
  const doc = await PDFDocument.load(Buffer.from(base64, 'base64'));
  const names = new Set<string>();
  doc.context.enumerateIndirectObjects().forEach(([, object]) => {
    if (object instanceof PDFDict && object.get(PDFName.of('BaseFont'))) {
      const base = String(object.get(PDFName.of('BaseFont'))).replace(/^\/(?:[A-Z]{6}\+)?/, '');
      if (/^Cairo/.test(base)) {names.add(base);}
    }
  });
  return [...names].sort();
};

describe('Turkish PDF export bold weight', () => {
  const buildDays = (day: string, category: string, line: string) =>
    buildExportReportModel(
      [{date: '2026-08-24', categories: [{category: 'notes', label: category, lines: [line]}]}],
      'Döngü takibi',
      'Tüm geçmiş',
      day,
    );

  it('embeds exactly two Cairo faces (Regular body + Bold headings)', async () => {
    const base64 = await generateMedicalExportPdfBase64(buildDays('25 Ağustos 2026', 'Notlar', 'şiddet: orta'));
    const faces = await cairoFaces(base64);
    expect(faces).toHaveLength(2);
    expect(faces.some(name => /Bold/.test(name))).toBe(true);
    expect(faces.some(name => /Regular/.test(name))).toBe(true);
  });

  it('draws every Turkish letter and ≥ ≤ − in bold headings and in regular body text, no marker', async () => {
    const text = `${LETTERS} ≥ ≤ − İSTANBUL ığdır Şişli`;
    const base64 = await generateMedicalExportPdfBase64(buildDays(text, text, text));
    const all = (await extractDrawnText(base64)).map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    // Date label + category label (bold) + bullet (regular) = three occurrences of each character.
    for (const char of [...LETTERS, ...'≥≤−']) {
      expect(all.split(char).length - 1).toBeGreaterThanOrEqual(3);
    }
  });

  it('measures and draws the headings with the bold face (wider than the same text in regular weight)', async () => {
    const text = 'İşığ Şeker Ağrı gün';
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(buildDays('25 Ağustos 2026', text, text)));
    const advance = (piece: {widths: number[]; size: number}) =>
      (piece.widths.reduce((sum, w) => sum + w, 0) / 1000) * piece.size;
    const label = drawn.find(piece => piece.text === text && piece.size === 10);
    const bullet = drawn.find(piece => piece.text.startsWith('•') && piece.text.includes(text));
    expect(label).toBeDefined();
    expect(bullet).toBeDefined();
    // Same size, same characters: the bold label is measurably wider than the regular one
    // (the bullet piece carries a "• " prefix; its average advance per character is used).
    const perChar = advance(bullet as DrawnText) / (bullet as DrawnText).text.length;
    expect(advance(label as DrawnText)).toBeGreaterThan(perChar * text.length * 1.02);
  });

  it('a long bold heading wraps inside the margins using the bold metrics', async () => {
    const longLabel = `${'Şiddetli başağrısı İstanbul '.repeat(8)}son`;
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(buildDays('25 Ağustos 2026', longLabel, 'x')));
    drawn.filter(piece => piece.size === 10 && piece.widths.length).forEach(piece => {
      expect((piece.widths.reduce((sum, w) => sum + w, 0) / 1000) * piece.size).toBeLessThanOrEqual(LINE_WIDTH - 8 + 0.5);
    });
  });

  it('non-Turkish reports embed no Cairo face at all (fr / en / es / it)', async () => {
    for (const lng of ['fr', 'en', 'es', 'it']) {
      await setAppLanguage(lng as never);
      await i18n.changeLanguage(lng);
      const model = buildExportReportModel(
        [{date: '2026-08-24', categories: [{category: 'notes', label: 'Notes', lines: ['café crème, déjà vu — ñandú à è ì ò ù']}]}],
        'Suivi',
        'Tout',
        '25 août 2026',
      );
      const base64 = await generateMedicalExportPdfBase64(model);
      expect(await cairoFaces(base64)).toHaveLength(0);
      expect(Buffer.from(base64, 'base64').length).toBeLessThan(8000);
    }
    await setAppLanguage('tr');
    await i18n.changeLanguage('tr');
  });
});
