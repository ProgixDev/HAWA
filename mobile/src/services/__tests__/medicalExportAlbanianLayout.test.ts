import {PDF_UNSUPPORTED_MARKER, containsChinese, containsCyrillic, containsDevanagari, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {sq} from '../../i18n/locales/sq';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Albanian PDF / CSV export: Albanian is Latin script and its only special letters, ë Ë ç Ç, are in WinAnsi (the character set of the
// standard PDF fonts). So a report is drawn with the standard Helvetica faces — no font is embedded and the Arabic / Cyrillic / Chinese /
// Devanagari paths are untouched. The CSV uses the same ';' delimiter and the Albanian headers / labels from the sq dictionary.

const build = (lines: string[], label = 'Shënime', day = '25 gusht 2026') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    'Ndjekja e ciklit',
    'I gjithë historiku',
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
  await setAppLanguage('sq');
  await i18n.changeLanguage('sq');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Albanian PDF export', () => {
  it('draws ë, Ë, ç, Ç, Albanian punctuation, digits and AWA with no unsupported marker', async () => {
    const text = 'Dhimbje e lehtë në mëngjes, temperatura 36,7 °C, çfarë ndjen? Vitamina D “një herë në ditë”. Raporti AWA – cikli 28 ditë. ËËÇÇ';
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text])));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const piece of ['Dhimbje e lehtë në mëngjes', 'çfarë ndjen?', 'ËËÇÇ', '36,7', 'AWA', 'Shënime']) {
      expect([piece, all.includes(piece)]).toEqual([piece, true]);
    }
    expect(all).not.toMatch(/Summary|History|Days recorded/);
  });

  it('uses only the standard Helvetica faces (no embedded font)', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['Dhimbje koke e lehtë, gjumë i pakët, çregullime'])));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every(name => /^Helvetica/.test(name))).toBe(true);
  });

  it('the Albanian dictionary needs no CJK, Cyrillic or Devanagari face for its export / calendar / cycle-phase texts', () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    ['cyclePhase', 'export', 'calendar'].forEach(group => walk((sq as Record<string, unknown>)[group]));
    expect(values.length).toBeGreaterThan(20);
    values.forEach(value => {
      expect(containsChinese(value)).toBe(false);
      expect(containsCyrillic(value)).toBe(false);
      expect(containsDevanagari(value)).toBe(false);
    });
  });

  it('draws the Albanian interface export texts without replacing any character', async () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk((sq as Record<string, unknown>).cyclePhase);
    walk((sq as Record<string, unknown>).export);
    // the unsupported-characters notice itself quotes the marker, so it is not part of the sample
    const lines = values.filter(value => !value.includes('{{') && !value.includes(PDF_UNSUPPORTED_MARKER));
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build(lines)));
    expect(drawn.map(piece => piece.text).join(' ')).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('draws every character of the 41 pregnancy weeks and of the whole Albanian dictionary that WinAnsi can hold', async () => {
    const texts: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {texts.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    for (let week = 1; week <= 41; week += 1) {walk(getPregnancyWeekData(week, 'sq'));}
    walk(sq);
    const letters = new Set(texts.join('').match(/\p{L}/gu));
    // every letter used is Basic Latin or one of the WinAnsi letters (ë Ë ç Ç …); the other languages' endonyms are the only exceptions
    const outside = [...letters].filter(letter => !/[A-Za-zÀ-ÿ]/.test(letter) && !/[ğĞşŞıİ]/.test(letter));
    expect(outside.filter(letter => !/[一-鿿Ѐ-ӿऀ-ॿ]/.test(letter))).toEqual([]);
    expect(letters.has('ë') && letters.has('ç') && letters.has('Ë') && letters.has('Ç')).toBe(true);
  });

  it('wraps a long Albanian sentence and an unbroken token without losing text', async () => {
    const sentence = 'Dhimbja shtohet nga mbrëmja dhe pushon vetëm pasi pushon gjatë një kohe të gjatë. '.repeat(4);
    const token = 'rimbursimiiabonimitçregullim'.repeat(6);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([sentence, token])));
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined).toContain('Dhimbjashtohetngambrëmjadhe');
    expect(joined.split('rimbursimiiabonimitçregullim').length - 1).toBeGreaterThanOrEqual(6);
    expect(joined).not.toContain(PDF_UNSUPPORTED_MARKER);
  });
});

describe('Albanian CSV export', () => {
  it('uses the Albanian headers with the same ; delimiter and keeps ë / ç through UTF-8', () => {
    const csv = buildExportCsv(
      [{date: '2026-08-25', categories: [{category: 'notes', label: 'Shënime', lines: ['Dhimbje; e lehtë', 'Ajo tha "mirë", çfarë ëndrre']}]}],
      [],
    );
    const header = csv.split(/\r?\n/)[0];
    const csvTexts = (sq as {export: {csv: Record<string, string>}}).export.csv;
    expect(header).toBe([csvTexts.headerDate, csvTexts.headerCategory, csvTexts.headerValue].join(';'));
    expect(header).not.toMatch(/Date;|Category;|Value$/);
    expect(csv).toContain('"Dhimbje; e lehtë ; Ajo tha ""mirë"", çfarë ëndrre"');
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv); // lossless
    expect(csv).toContain('ë');
    expect(csv).toContain('ç');
  });
});

describe('other languages keep their PDF faces', () => {
  it('Russian still embeds DejaVu, Hindi its Devanagari face, and French stays Helvetica', async () => {
    await setAppLanguage('ru');
    await i18n.changeLanguage('ru');
    const russian = await faces(await generateMedicalExportPdfBase64(build(['Головная боль'], 'Заметки', '25 августа 2026 г.')));
    expect(russian.some(name => /DejaVuSans/.test(name))).toBe(true);
    await setAppLanguage('hi');
    await i18n.changeLanguage('hi');
    const hindi = await faces(await generateMedicalExportPdfBase64(build(['सिरदर्द'], 'नोट्स', '25 अगस्त 2026')));
    expect(hindi.some(name => /NotoSansDevanagari/.test(name))).toBe(true);
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const french = await faces(await generateMedicalExportPdfBase64(build(['café crème'], 'Notes', '25 août 2026')));
    expect(french.every(name => /^Helvetica/.test(name))).toBe(true);
    await setAppLanguage('sq');
    await i18n.changeLanguage('sq');
  });
});
