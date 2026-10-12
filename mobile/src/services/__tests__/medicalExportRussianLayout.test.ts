import {PDF_UNSUPPORTED_MARKER, containsCyrillic, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText, type DrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Russian PDF export regression: Cyrillic needs an embedded face (Helvetica/WinAnsi and Cairo have no Cyrillic), so a
// Russian report is drawn with the DejaVu Sans Regular + Bold subset, loaded only for Cyrillic text. Headings, dates,
// tables of lines, notes and typographic punctuation all go through the same face; Arabic RTL support, Turkish and the
// Latin languages are untouched.

const LINE_WIDTH = 595.28 - 50 * 2;
const ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя';

const build = (lines: string[], label = 'Заметки', day = '25 августа 2026 г.') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    'Отслеживание цикла',
    'Вся история',
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

const advance = (piece: {widths: number[]; size: number}) => (piece.widths.reduce((sum, w) => sum + w, 0) / 1000) * piece.size;

beforeAll(async () => {
  await setAppLanguage('ru');
  await i18n.changeLanguage('ru');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('containsCyrillic', () => {
  it('detects Russian letters and nothing else', () => {
    expect(containsCyrillic('Привет')).toBe(true);
    expect(containsCyrillic('ё')).toBe(true);
    expect(containsCyrillic('Hello, çğıİöşü, مرحبا')).toBe(false);
  });
});

describe('Russian PDF export', () => {
  it('draws the whole Russian alphabet and the typographic punctuation, with no unsupported marker', async () => {
    const text = `${ALPHABET} «цитата» — № 5 – 38,5 °C ≥ 2 · “x”`;
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text], text)));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const char of [...ALPHABET, ...'«»—№–°≥·']) {
      expect(all).toContain(char);
    }
  });

  it('embeds DejaVu Sans Regular + Bold (and no Helvetica / Cairo) for a Cyrillic report', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['Сильная головная боль'])));
    expect(names.some(name => /^DejaVuSans-Bold/.test(name))).toBe(true);
    expect(names.some(name => /^DejaVuSans-\d+$/.test(name))).toBe(true);
    expect(names.some(name => /^Cairo/.test(name))).toBe(false);
    expect(names.some(name => /^Helvetica/.test(name))).toBe(false);
  });

  it('draws headings, the date, category label and bullets in Cyrillic (title and section headings translated)', async () => {
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build(['Боль внизу живота: умеренная'])));
    const all = drawn.map(piece => piece.text).join('\n');
    expect(all).toContain('25 августа 2026 г.');
    expect(all).toContain('Заметки');
    expect(all).toContain('• Боль внизу живота: умеренная');
    // The fixed report headings come from the Russian dictionary, never English.
    expect(all).toMatch(/[А-Яа-я]{4,}/);
    expect(all).not.toMatch(/Summary|Report|History|Days recorded/);
  });

  it('measures and draws the label with the bold face (wider than the same text in regular weight)', async () => {
    const text = 'Ощущения и настроение';
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text], text)));
    const label = drawn.find(piece => piece.text === text && piece.size === 10);
    const bullet = drawn.find(piece => piece.text.startsWith('•') && piece.text.includes(text));
    expect(label).toBeDefined();
    expect(bullet).toBeDefined();
    const perChar = advance(bullet as DrawnText) / (bullet as DrawnText).text.length;
    expect(advance(label as DrawnText)).toBeGreaterThan(perChar * text.length * 1.02);
  });

  it('wraps long Cyrillic text and breaks an unbreakable token so nothing passes the right margin', async () => {
    const long = `https://пример.рф/${'щёжЪЫ'.repeat(40)}`;
    const sentence = 'Очень длинная запись о самочувствии, которая обязательно должна перенестись на следующую строку. '.repeat(4);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([long, sentence])));
    const pieces = drawn.filter(piece => piece.size > 0 && piece.widths.length);
    expect(pieces.length).toBeGreaterThan(2);
    pieces.forEach(piece => {
      expect(advance(piece)).toBeLessThanOrEqual(LINE_WIDTH + 0.5);
    });
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined.split('щёжЪЫ').length - 1).toBeGreaterThanOrEqual(40);
  });

  it('keeps Latin words, digits and the Turkish letters of the same report in the same face (no marker)', async () => {
    const text = 'AWA PIN 120/80 мм рт. ст., İşığ Şeker — тест';
    const all = (await extractDrawnText(await generateMedicalExportPdfBase64(build([text])))).map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    for (const word of ['AWA', 'PIN', '120/80', 'İşığ', 'Şeker', 'мм рт. ст.']) {
      expect(all).toContain(word);
    }
  });

  it('does not embed any DejaVu face for fr / en / es / it / tr reports', async () => {
    for (const lng of ['fr', 'en', 'es', 'it', 'tr']) {
      await setAppLanguage(lng as never);
      await i18n.changeLanguage(lng);
      const model = buildExportReportModel(
        [{date: '2026-08-24', categories: [{category: 'notes', label: 'Notes', lines: ['café crème, déjà vu — ñandú à è ì ò ù']}]}],
        'Suivi',
        'Tout',
        '25 août 2026',
      );
      const names = await faces(await generateMedicalExportPdfBase64(model));
      expect(names.some(name => /DejaVu/.test(name))).toBe(false);
    }
    await setAppLanguage('ru');
    await i18n.changeLanguage('ru');
  });

  it('keeps Arabic text in a Cyrillic report on the Arabic face (both scripts drawn, no marker)', async () => {
    const text = 'Рамадан — رمضان كريم';
    const base64 = await generateMedicalExportPdfBase64(build([text]));
    const all = (await extractDrawnText(base64)).map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).toContain('Рамадан');
    expect(await faces(base64)).toEqual(expect.arrayContaining([expect.stringMatching(/^Cairo/), expect.stringMatching(/^DejaVuSans-/)]));
  });
});
