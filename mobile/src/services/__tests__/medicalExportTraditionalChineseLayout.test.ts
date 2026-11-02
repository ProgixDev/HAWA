import {PDF_UNSUPPORTED_MARKER, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {zhHant} from '../../i18n/locales/zhHant';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Traditional Chinese (zh-Hant) PDF / CSV export: the Simplified Noto Sans SC subset only holds the GB2312 hanzi, so a zh-Hant report that
// contains CJK text is drawn with the embedded Noto Sans TC Regular + Bold subset (pdfTraditionalChineseFont.ts). Simplified Chinese keeps
// Noto Sans SC, and English (US) keeps Helvetica exactly like English.

const build = (lines: string[], label = '備註', day = '2026年8月25日') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    '月經週期記錄',
    '完整歷史',
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

const text = async (model: ReturnType<typeof build>): Promise<string> =>
  (await extractDrawnText(await generateMedicalExportPdfBase64(model))).map(piece => piece.text).join(' ');

const collect = (...roots: unknown[]): string[] => {
  const chars = new Set<string>();
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      Array.from(node).forEach(char => {
        if (/[㐀-鿿]/.test(char)) {chars.add(char);}
      });
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  };
  roots.forEach(walk);
  return Array.from(chars).sort();
};

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Traditional Chinese PDF export (zh-Hant)', () => {
  beforeAll(async () => {
    await setAppLanguage('zh-Hant');
    await i18n.changeLanguage('zh-Hant');
  });

  it('draws traditional hanzi, Latin words, digits, corner brackets and fullwidth punctuation with no unsupported marker', async () => {
    const sample = '今天輕微腹痛，體溫 36.7°C，服用維生素 D 一次（早上）。AWA 的「範例」報告：週期 21～35 天！';
    const all = await text(build([sample]));
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const char of '今天輕微腹痛體溫服用維生素一次早上範例報告週期「」（）：！') {
      expect([char, all.includes(char)]).toEqual([char, true]);
    }
    expect(all).toContain('36.7');
    expect(all).toContain('AWA');
    expect(all).toContain('備註');
  });

  it('draws every hanzi of the zh-Hant interface dictionary and of the 41 pregnancy weeks', async () => {
    const weeks = Array.from({length: 41}, (_, index) => getPregnancyWeekData(index + 1, 'zh-Hant'));
    weeks.forEach(week => expect(week).toBeDefined());
    const all = collect(zhHant, weeks).filter(char => char !== '简'); // 简 is the Simplified endonym, never drawn in a report
    expect(all.length).toBeGreaterThan(1000);
    const lines: string[] = [];
    for (let index = 0; index < all.length; index += 40) {
      lines.push(all.slice(index, index + 40).join(''));
    }
    const drawn = await text(build(lines));
    expect(drawn).not.toContain(PDF_UNSUPPORTED_MARKER);
    const joined = drawn.replace(/\s+/g, '');
    expect(all.filter(char => !joined.includes(char))).toEqual([]);
  });

  it('embeds Noto Sans TC Regular + Bold (and no Helvetica, Noto Sans SC, JP or KR) for a zh-Hant report', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['輕微頭痛'])));
    expect(names.some(name => /^NotoSansTC-Bold/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansTC-Regular/.test(name))).toBe(true);
    for (const other of [/^NotoSansSC/, /^NotoSansJP/, /^NotoSansKR/, /^Helvetica/, /^Cairo/]) {
      expect([String(other), names.some(name => other.test(name))]).toEqual([String(other), false]);
    }
  });

  it('a long traditional note wraps inside the margins and nothing is lost while wrapping', async () => {
    const long = '早上起床時覺得很疲倦，下午慢慢好轉。晚上和朋友在公園散步很久，喝了很多水，睡前做了十分鐘的伸展運動。'.repeat(3);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([long])));
    const lineWidth = 595.28 - 50 * 2;
    const noteLines = drawn.filter(piece => /早上|晚上|伸展/.test(piece.text) || piece.text.length > 10);
    expect(noteLines.length).toBeGreaterThanOrEqual(2);
    noteLines.forEach(piece => {
      const width = (piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(lineWidth + 0.5);
    });
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined.split('十分鐘的伸展運動。').length - 1).toBe(3);
  });

  it('a very long unspaced token is broken per character inside the margins', async () => {
    const token = '一二三四五六七八九十'.repeat(14);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([token])));
    const lineWidth = 595.28 - 50 * 2;
    const pieces = drawn.filter(piece => /一二三/.test(piece.text));
    expect(pieces.length).toBeGreaterThanOrEqual(2);
    pieces.forEach(piece => {
      const width = (piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(lineWidth + 0.5);
    });
  });

  it('Latin words, digits and Western European letters inside a zh-Hant report use the same face', async () => {
    const all = await text(build(['AWA Premium 2026 çÇ ë Ë é ñ ü 36.7°C']));
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    for (const piece of ['AWA Premium', '2026', 'çÇ ë Ë é ñ ü', '36.7']) {
      expect([piece, all.includes(piece)]).toEqual([piece, true]);
    }
  });

  it('mixed-language user input never throws: Arabic keeps its own face, emoji becomes the marker, traditional hanzi stay', async () => {
    const base64 = await generateMedicalExportPdfBase64(build(['今天頭痛 مرحبا بالعالم 😊 cafe']));
    const names = await faces(base64);
    expect(names.some(name => /^NotoSansTC/i.test(name))).toBe(true);
    expect(names.some(name => /^Cairo/i.test(name))).toBe(true);
    const all = (await extractDrawnText(base64)).map(piece => piece.text).join(' ');
    expect(all).toContain('今天頭痛');
    expect(all).toContain('cafe');
    expect(all).toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('writes a sample report to AWA_PDF_OUT for visual inspection when that variable is set', async () => {
    const out = process.env.AWA_PDF_OUT;
    if (!out) {return;}
    const long = '早上起床時覺得很疲倦（約 7 小時睡眠），下午慢慢好轉。晚上和朋友在公園散步，喝了很多水。AWA 的「週期預測」顯示排卵日約在 2026年9月3日；體溫 36.7°C，維生素 D 每日 1 次。'.repeat(2);
    const model = buildExportReportModel(
      [
        {date: '2026-08-25', categories: [{category: 'notes', label: '備註', lines: [long, '輕微腹痛；已休息。']}, {category: 'symptoms', label: '症狀', lines: ['頭痛', '疲倦', '脹氣']}]},
        {date: '2026-08-26', categories: [{category: 'notes', label: '備註', lines: ['心情平穩，Day 14。']}]},
      ],
      '月經週期記錄',
      '2026年8月1日 – 2026年8月31日',
      '2026年9月1日',
    );
    require('fs').writeFileSync(`${out}/zh-Hant.pdf`, Buffer.from(await generateMedicalExportPdfBase64(model), 'base64'));
  });
});

describe('Traditional Chinese CSV export', () => {
  it('uses the zh-Hant headers with the same ; delimiter and keeps hanzi through UTF-8', async () => {
    await setAppLanguage('zh-Hant');
    await i18n.changeLanguage('zh-Hant');
    const csv = buildExportCsv(
      [{date: '2026-08-25', categories: [{category: 'notes', label: '備註', lines: ['頭痛; 輕微', '她說「沒事」']}]}],
      [],
    );
    const header = csv.split(/\r?\n/)[0];
    const csvTexts = (zhHant as {export: {csv: Record<string, string>}}).export.csv;
    expect(header).toBe([csvTexts.headerDate, csvTexts.headerCategory, csvTexts.headerValue].join(';'));
    expect(csv).toContain('備註');
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv);
  });
});

describe('English (US) and the other Chinese keep their PDF faces', () => {
  it('Simplified Chinese keeps Noto Sans SC, and English (US) is Helvetica like English, with CSV headers from the English dictionary', async () => {
    await setAppLanguage('zh');
    await i18n.changeLanguage('zh');
    const sc = await faces(await generateMedicalExportPdfBase64(build(['轻微头痛'], '备注', '2026年8月25日')));
    expect(sc.some(name => /^NotoSansSC/.test(name))).toBe(true);
    expect(sc.some(name => /^NotoSansTC/.test(name))).toBe(false);

    const latin = (language: 'en' | 'en-US') =>
      buildExportReportModel([{date: '2026-08-25', categories: [{category: 'notes', label: 'Notes', lines: ['Mild headache, 36.7°C']}]}], 'Cycle', 'History', language);
    const result: Record<string, string[]> = {};
    for (const language of ['en', 'en-US'] as const) {
      await setAppLanguage(language);
      await i18n.changeLanguage(language);
      result[language] = await faces(await generateMedicalExportPdfBase64(latin(language)));
      expect(await text(latin(language))).toContain('Mild headache');
    }
    expect(result['en-US']).toEqual(result.en);
    expect(result['en-US'].some(name => /^Helvetica/.test(name))).toBe(true);
    expect(result['en-US'].some(name => /^Noto/.test(name))).toBe(false);
  });
});
