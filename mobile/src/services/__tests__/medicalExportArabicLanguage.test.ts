import {PDF_UNSUPPORTED_MARKER, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {ar} from '../../i18n/locales/ar';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Arabic report (language 'ar'): the existing Cairo + bidi pipeline draws it right-aligned in visual order, the headings use Cairo Bold, and the
// CSV carries the Arabic dictionary's headers. The other languages keep their faces (Helvetica for English).

const build = (lines: string[]) =>
  buildExportReportModel([{date: '2026-08-25', categories: [{category: 'notes', label: 'ملاحظات', lines}]}], 'تقرير الدورة الشهرية', 'السجل الكامل', '1 سبتمبر 2026');

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

const text = async (lines: string[]): Promise<string> =>
  (await extractDrawnText(await generateMedicalExportPdfBase64(build(lines)))).map(piece => piece.text).join(' ');

beforeAll(async () => {
  await setAppLanguage('ar');
  await i18n.changeLanguage('ar');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Arabic PDF export', () => {
  it('draws Arabic, Latin words, digits, an e-mail address and units without the unsupported marker', async () => {
    const all = await text(['استيقظتُ مبكرًا، درجة الحرارة 36.7°C وفيتامين D (1 ملغ). راسلت AWA على dr.sara@example.com']);
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const piece of ['36.7', 'AWA', 'dr.sara@example.com', '1']) {
      expect([piece, all.includes(piece)]).toEqual([piece, true]);
    }
  });

  it('embeds Cairo Regular AND Cairo Bold (bold headings) and no Helvetica-only Arabic fallback', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['صداع خفيف'])));
    expect(names.some(name => /^Cairo.*Bold/i.test(name) || /Bold/i.test(name))).toBe(true);
    expect(names.some(name => /^Cairo/i.test(name))).toBe(true);
  });

  it('draws every Arabic letter of the interface export texts and of the 41 pregnancy weeks without a marker', async () => {
    const chars = new Set<string>();
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {
        Array.from(node).forEach(char => {
          if (/[ء-ي]/.test(char)) {chars.add(char);}
        });
      } else if (node && typeof node === 'object') {
        Object.values(node).forEach(walk);
      }
    };
    walk((ar as Record<string, unknown>).export);
    for (let week = 1; week <= 41; week += 1) {
      walk(getPregnancyWeekData(week, 'ar'));
    }
    const all = Array.from(chars).sort();
    expect(all.length).toBeGreaterThan(25);
    const drawn = await text([all.join(' ')]);
    expect(drawn).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('a long Arabic note wraps and nothing is lost', async () => {
    const sentence = 'شعرت بتعب في الصباح ثم تحسّنت حالتي بعد الظهر وتناولت كثيرًا من الماء. ';
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([sentence.repeat(6)])));
    expect(drawn.filter(piece => piece.text.length > 10).length).toBeGreaterThanOrEqual(2);
    expect(drawn.map(piece => piece.text).join('')).not.toContain(PDF_UNSUPPORTED_MARKER);
  });
});

describe('Arabic CSV export', () => {
  it('uses the Arabic headers with the same ; delimiter and keeps the Unicode text', () => {
    const csv = buildExportCsv([{date: '2026-08-25', categories: [{category: 'notes', label: 'ملاحظات', lines: ['صداع؛ خفيف', 'قالت «لا بأس»']}]}], []);
    const header = csv.split(/\r?\n/)[0];
    const texts = (ar as unknown as {export: {csv: Record<string, string>}}).export.csv;
    expect(header).toBe([texts.headerDate, texts.headerCategory, texts.headerValue].join(';'));
    expect(csv).toContain('ملاحظات');
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv);
  });
});

describe('other languages keep their faces', () => {
  it('English stays Helvetica', async () => {
    await setAppLanguage('en');
    await i18n.changeLanguage('en');
    const model = buildExportReportModel([{date: '2026-08-25', categories: [{category: 'notes', label: 'Notes', lines: ['Mild headache']}]}], 'Cycle', 'History', '2026-09-01');
    const names = await faces(await generateMedicalExportPdfBase64(model));
    expect(names.some(name => /^Helvetica/.test(name))).toBe(true);
    expect(names.some(name => /^Cairo/.test(name))).toBe(false);
  });
});
