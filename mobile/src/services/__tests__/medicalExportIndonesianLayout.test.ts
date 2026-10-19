import {PDF_UNSUPPORTED_MARKER, containsChinese, containsCyrillic, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {id} from '../../i18n/locales/id';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Indonesian PDF/CSV export: Bahasa Indonesia is plain Latin script (no diacritics beyond ASCII in everyday text), so
// a report is drawn with the standard Helvetica faces — no font is embedded and the Arabic / Cyrillic / Chinese paths
// are untouched. The CSV uses the same ';' delimiter and Indonesian headers/labels from the id dictionary.

const build = (lines: string[], label = 'Catatan', day = '25 Agustus 2026') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    'Pelacakan siklus',
    'Seluruh riwayat',
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

beforeAll(async () => {
  await setAppLanguage('id');
  await i18n.changeLanguage('id');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Indonesian PDF export', () => {
  it('draws Indonesian text, punctuation, digits and AWA with no unsupported marker', async () => {
    const text = 'Kram ringan di pagi hari, suhu tubuh 36,7 °C, vitamin D “sekali sehari”. Laporan AWA – siklus 28 hari.';
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text])));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    expect(all).toContain('Catatan');
    expect(all).toContain('36,7');
    expect(all).toContain('AWA');
    expect(all).not.toMatch(/Summary|History|Days recorded/);
  });

  it('uses only the standard Helvetica faces (no embedded font)', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['Nyeri kepala ringan, kurang tidur'])));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every(name => /^Helvetica/.test(name))).toBe(true);
  });

  it('the id dictionary export/calendar/cyclePhase texts need no CJK or Cyrillic face', () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    ['cyclePhase', 'export', 'calendar'].forEach(group => walk((id as Record<string, unknown>)[group]));
    expect(values.length).toBeGreaterThan(20);
    values.forEach(value => {
      expect(containsChinese(value)).toBe(false);
      expect(containsCyrillic(value)).toBe(false);
    });
  });

  it('draws the Indonesian interface export texts without replacing any character', async () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk((id as Record<string, unknown>).cyclePhase);
    walk((id as Record<string, unknown>).export);
    // the unsupported-characters notice itself quotes the marker, so it is not part of the sample
    const lines = values.filter(value => !value.includes('{{') && !value.includes(PDF_UNSUPPORTED_MARKER));
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build(lines)));
    expect(drawn.map(piece => piece.text).join(' ')).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('wraps a long Indonesian sentence and an unbroken token without losing text', async () => {
    const sentence = 'Keluhan bertambah terasa menjelang sore dan baru mereda setelah beristirahat cukup lama. '.repeat(4);
    const token = 'pengembalianpembayaranberlangganan'.repeat(6);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([sentence, token])));
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined).toContain('Keluhanbertambahterasamenjelangsore');
    expect(joined.split('pengembalianpembayaranberlangganan').length - 1).toBeGreaterThanOrEqual(6);
    expect(joined).not.toContain(PDF_UNSUPPORTED_MARKER);
  });
});

describe('Indonesian CSV export', () => {
  it('uses the Indonesian headers with the same ; delimiter and escapes quoted values', () => {
    const csv = buildExportCsv(
      [{date: '2026-08-25', categories: [{category: 'notes', label: 'Catatan', lines: ['Kram; ringan', 'Ia berkata "baik"']}]}],
      [],
    );
    const header = csv.split(/\r?\n/)[0];
    expect(header).toBe([i18n.t('export.csv.headerDate'), i18n.t('export.csv.headerCategory'), i18n.t('export.csv.headerValue')].join(';'));
    const csvTexts = (id as {export: {csv: Record<string, string>}}).export.csv;
    expect(header).toBe([csvTexts.headerDate, csvTexts.headerCategory, csvTexts.headerValue].join(';'));
    expect(header).not.toMatch(/Date;|Category;|Value$/);
    expect(csv).toContain('"Kram; ringan ; Ia berkata ""baik"""');
  });
});

describe('other languages keep their PDF faces', () => {
  it('Russian still embeds DejaVu and French stays Helvetica', async () => {
    await setAppLanguage('ru');
    await i18n.changeLanguage('ru');
    const russian = await faces(await generateMedicalExportPdfBase64(build(['Головная боль'], 'Заметки', '25 августа 2026 г.')));
    expect(russian.some(name => /DejaVuSans/.test(name))).toBe(true);
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const french = await faces(await generateMedicalExportPdfBase64(build(['café crème'], 'Notes', '25 août 2026')));
    expect(french.every(name => /^Helvetica/.test(name))).toBe(true);
    await setAppLanguage('id');
    await i18n.changeLanguage('id');
  });
});
