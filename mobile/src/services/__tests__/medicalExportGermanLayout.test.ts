import {PDF_UNSUPPORTED_MARKER, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {PDFDict, PDFDocument, PDFName, StandardFonts} from 'pdf-lib';

// German PDF export: ä ö ü Ä Ö Ü ß, „…“, – and € are all inside WinAnsi, so a German report is drawn with the standard
// Helvetica faces — no font is embedded (the report stays small) and the Arabic (Cairo) / Turkish / Russian (DejaVu)
// paths are untouched. Long German compounds must wrap inside the margins.

const LINE_WIDTH = 595.28 - 50 * 2;
const GERMAN = 'ÄÖÜäöüß';

const build = (lines: string[], label = 'Notizen', day = '25. August 2026') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    'Zyklus-Tracking',
    'Gesamter Verlauf',
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

// Standard fonts carry no /W array in the file, so a drawn piece is measured with the same Helvetica metrics pdf-lib used.
// Body text and bullet continuation lines are Helvetica Regular at size 10; larger pieces are bold headings.
let helvetica: {widthOfTextAtSize(text: string, size: number): number};
let helveticaBold: {widthOfTextAtSize(text: string, size: number): number};
beforeAll(async () => {
  const doc = await PDFDocument.create();
  helvetica = await doc.embedFont(StandardFonts.Helvetica);
  helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
});
const advance = (piece: {text: string; size: number}) =>
  (piece.size <= 10.5 ? helvetica : helveticaBold).widthOfTextAtSize(piece.text, piece.size);

beforeAll(async () => {
  await setAppLanguage('de');
  await i18n.changeLanguage('de');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('German PDF export', () => {
  it('draws every umlaut, ß and the German typographic punctuation, with no unsupported marker', async () => {
    const text = `${GERMAN} „Zitat“ – 38,5 °C × 2 · € Straße Größe Übelkeit Müdigkeit Kopfschmerzen`;
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text], text)));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const char of [...GERMAN, ...'„“–°×·€']) {
      expect(all).toContain(char);
    }
  });

  it('uses only the standard Helvetica faces: nothing is embedded, and the file stays small', async () => {
    const base64 = await generateMedicalExportPdfBase64(build(['Müdigkeit, Übelkeit und Schlafstörungen']));
    const names = await faces(base64);
    expect(names.every(name => /^Helvetica/.test(name))).toBe(true);
    expect(names.some(name => /Cairo|DejaVu/.test(name))).toBe(false);
    expect(Buffer.from(base64, 'base64').length).toBeLessThan(8000);
  });

  it('draws headings, date, category label and bullets in German', async () => {
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build(['Leichte Krämpfe am Vormittag'])));
    const all = drawn.map(piece => piece.text).join('\n');
    expect(all).toContain('25. August 2026');
    expect(all).toContain('Notizen');
    expect(all).toContain('• Leichte Krämpfe am Vormittag');
    expect(all).not.toMatch(/Summary|History|Days recorded|Report/);
  });

  it('wraps long German compounds and a token wider than the line so nothing passes the right margin', async () => {
    const compound = 'Donaudampfschifffahrtsgesellschaftskapitänsmützenabzeichen';
    const sentence = 'Die Beschwerden verstärkten sich im Laufe des Nachmittags deutlich und ließen erst abends spürbar nach. '.repeat(4);
    const long = `https://beispiel.de/${'äöüß'.repeat(60)}`;
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([compound, sentence, long])));
    const pieces = drawn.filter(piece => piece.size > 0 && piece.text.length > 0);
    expect(pieces.length).toBeGreaterThan(3);
    pieces.forEach(piece => {
      expect(advance(piece)).toBeLessThanOrEqual(LINE_WIDTH + 0.5);
    });
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined).toContain('Donaudampfschifffahrtsgesellschaftskapitänsmützenabzeichen'.slice(0, 20));
    expect(joined.split('äöüß').length - 1).toBeGreaterThanOrEqual(60);
  });

  it('keeps other reports unchanged: Russian still embeds DejaVu, Turkish letters still use Cairo, Latin stays Helvetica', async () => {
    await setAppLanguage('ru');
    await i18n.changeLanguage('ru');
    const russian = await faces(await generateMedicalExportPdfBase64(build(['Головная боль'], 'Заметки', '25 августа 2026 г.')));
    expect(russian.some(name => /DejaVuSans/.test(name))).toBe(true);
    await setAppLanguage('tr');
    await i18n.changeLanguage('tr');
    const turkish = await faces(await generateMedicalExportPdfBase64(build(['İstanbul şiddet ığdır'], 'Notlar', '25 Ağustos 2026')));
    expect(turkish.some(name => /^Cairo/.test(name))).toBe(true);
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const french = await faces(await generateMedicalExportPdfBase64(build(['café crème, déjà vu'], 'Notes', '25 août 2026')));
    expect(french.every(name => /^Helvetica/.test(name))).toBe(true);
    await setAppLanguage('de');
    await i18n.changeLanguage('de');
  });
});
