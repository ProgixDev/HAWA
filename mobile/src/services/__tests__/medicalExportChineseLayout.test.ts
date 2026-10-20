import {PDF_UNSUPPORTED_MARKER, containsChinese, containsCyrillic, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {zh} from '../../i18n/locales/zh';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Simplified Chinese PDF export regression: Helvetica (WinAnsi), Cairo and DejaVu have no hanzi, so a report that
// contains CJK text is drawn entirely with the embedded Noto Sans SC Regular + Bold subset (pdfChineseFont.ts), loaded
// only for such reports. Every other language keeps the faces it had before.

const build = (lines: string[], label = '备注', day = '2026年8月25日') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    '周期记录',
    '全部历史',
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
  await setAppLanguage('zh');
  await i18n.changeLanguage('zh');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('containsChinese', () => {
  it('detects hanzi and fullwidth punctuation and nothing else', () => {
    expect(containsChinese('月经周期')).toBe(true);
    expect(containsChinese('，')).toBe(true);
    expect(containsChinese('Hello çğıİöşü Привет مرحبا 😊')).toBe(false);
    expect(containsCyrillic('月经')).toBe(false);
  });
});

describe('Simplified Chinese PDF export', () => {
  it('draws everyday hanzi, fullwidth punctuation, Latin words and digits with no unsupported marker', async () => {
    const text = '今天有轻微腹痛，体温 36.7 °C，已服用维生素 D（每日一次）。AWA 报告 “示例” ';
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text])));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const char of '今天有轻微腹痛体温已服用维生素每日一次报告示例，（）。“”') {
      expect(all).toContain(char);
    }
    expect(all).toContain('36.7');
    expect(all).toContain('AWA');
  });

  it('draws every character used by the zh interface dictionary (no hanzi of the UI is replaced)', async () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk((zh as Record<string, unknown>).cyclePhase);
    walk((zh as Record<string, unknown>).export);
    walk((zh as Record<string, unknown>).calendar);
    const lines = values.filter(value => !value.includes('{{')).slice(0, 60);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build(lines)));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('the embedded subset covers every hanzi and fullwidth mark of the zh dictionary and of the 41 pregnancy weeks', async () => {
    const chars = new Set<string>();
    const add = (value: string) => Array.from(value).forEach(char => {
      if (/[\u3000-\u303F\u3400-\u9FFF\uFF00-\uFFEF]/.test(char)) {chars.add(char);}
    });
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {add(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    // the language endonyms (appearance.language.*Name, e.g. 日本語) are shown in the language selector only, never in a report
    const interfaceTexts: Record<string, unknown> = {...(zh.appearance as Record<string, unknown>)};
    delete interfaceTexts.language;
    walk({...zh, appearance: interfaceTexts});
    for (let week = 1; week <= 41; week += 1) {
      walk(getPregnancyWeekData(week, 'zh'));
    }
    const all = Array.from(chars).sort();
    expect(all.length).toBeGreaterThan(1000);
    const lines: string[] = [];
    for (let index = 0; index < all.length; index += 40) {
      lines.push(all.slice(index, index + 40).join(''));
    }
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build(lines)));
    const text = drawn.map(piece => piece.text).join('');
    expect(text).not.toContain(PDF_UNSUPPORTED_MARKER);
    const missing = all.filter(char => !text.includes(char));
    expect(missing).toEqual([]);
  });

  it('embeds Noto Sans SC Regular + Bold (and no Helvetica) for a Chinese report', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['轻度头痛'])));
    expect(names.some(name => /^NotoSansSC-Bold/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansSC-Regular/.test(name))).toBe(true);
    expect(names.some(name => /^Helvetica/.test(name))).toBe(false);
    expect(names.some(name => /^Cairo/.test(name))).toBe(false);
  });

  it('a long Chinese note with no spaces wraps inside the margins (broken per character)', async () => {
    const long = '今天早晨起床后感觉特别疲惫，下午逐渐好转，傍晚和朋友在公园散步了很久，晚餐吃得很清淡，喝了很多水，睡前做了十分钟的拉伸。'.repeat(3);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([long])));
    const lineWidth = 595.28 - 50 * 2;
    const noteLines = drawn.filter(piece => /今天|傍晚|拉伸/.test(piece.text) || piece.text.length > 10);
    expect(noteLines.length).toBeGreaterThanOrEqual(2);
    noteLines.forEach(piece => {
      const width = (piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(lineWidth + 0.5);
    });
  });

  it('kinsoku: a wrapped Chinese note never starts a line with closing punctuation nor ends one with an opening bracket', async () => {
    const text = '今天的记录包括：头痛（轻度）、疲劳、腹胀，以及“睡眠不足”。'.repeat(8);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([text])));
    const lines = drawn.map(piece => piece.text).filter(line => /[头痛疲劳腹胀睡眠]/.test(line));
    expect(lines.length).toBeGreaterThanOrEqual(3);
    lines.forEach(line => {
      const body = line.replace(/^\u2022\s*/, '');
      expect(body).not.toMatch(/^[，。、；：？！）”’】》…]/);
      expect(body).not.toMatch(/[（“‘【《]$/);
    });
  });

  it('mixed-language user input never throws: Arabic keeps its own face, Cyrillic/emoji become the marker, hanzi stay', async () => {
    const base64 = await generateMedicalExportPdfBase64(build(['今天头痛 مرحبا بالعالم 😊 Привет cafe']));
    const names = await faces(base64);
    expect(names.some(name => /^NotoSansSC/i.test(name))).toBe(true);
    expect(names.some(name => /^Cairo/i.test(name))).toBe(true);
    const drawn = await extractDrawnText(base64);
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).toContain('今天头痛');
    expect(all).toContain('cafe');
    expect(all).toContain(PDF_UNSUPPORTED_MARKER); // the emoji and the Cyrillic word
    expect(all).not.toContain('Привет');
  });

  it('a character outside the embedded set is replaced by the standard marker and the notice is added', async () => {
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build(['正常 𠀀 文字'])));
    const all = drawn.map(piece => piece.text).join(' ');
    expect(all).toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('other languages are untouched: a French report still uses Helvetica and embeds no Noto face', async () => {
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const model = buildExportReportModel(
      [{date: '2026-08-25', categories: [{category: 'notes', label: 'Notes', lines: ['Mal de tête léger']}]}],
      'Suivi du cycle',
      'Tout l’historique',
      '25 août 2026',
    );
    const names = await faces(await generateMedicalExportPdfBase64(model));
    await setAppLanguage('zh');
    await i18n.changeLanguage('zh');
    expect(names.some(name => /^NotoSansSC/i.test(name))).toBe(false);
    expect(names.some(name => /^Helvetica/.test(name))).toBe(true);
  });
});
