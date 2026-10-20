import {PDF_UNSUPPORTED_MARKER, containsChinese, containsCyrillic, containsDevanagari, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {ja} from '../../i18n/locales/ja';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Japanese PDF / CSV export: Helvetica (WinAnsi), Cairo and DejaVu have no kana or kanji, and Noto Sans SC would draw Chinese forms of the
// shared kanji, so a Japanese report that contains CJK text is drawn entirely with the embedded Noto Sans JP Regular + Bold subset
// (pdfJapaneseFont.ts, loaded only for such reports). Chinese reports keep Noto Sans SC and every other language keeps its own faces.

const build = (lines: string[], label = 'メモ', day = '2026年8月25日') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    '生理周期の記録',
    'すべての履歴',
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

// the same report with Latin labels, for the tests that switch to another language
const buildLatin = (lines: string[], label: string, day: string) =>
  buildExportReportModel([{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}], 'Cycle', 'History', day);

const text = async (model: ReturnType<typeof build>): Promise<string> =>
  (await extractDrawnText(await generateMedicalExportPdfBase64(model))).map(piece => piece.text).join(' ');

beforeAll(async () => {
  await setAppLanguage('ja');
  await i18n.changeLanguage('ja');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('containsChinese (the CJK detector) with Japanese text', () => {
  it('detects hiragana, katakana, kanji and the Japanese punctuation, and nothing else', () => {
    expect(containsChinese('生理周期')).toBe(true);
    expect(containsChinese('ひらがな')).toBe(true);
    expect(containsChinese('カタカナ')).toBe(true);
    expect(containsChinese('ー')).toBe(true);
    expect(containsChinese('Hello çğıİöşü Привет मराठी 😊')).toBe(false);
    expect(containsCyrillic('生理')).toBe(false);
    expect(containsDevanagari('生理')).toBe(false);
  });
});

describe('Japanese PDF export', () => {
  it('draws kanji, hiragana, katakana, full-width punctuation, Latin words and digits with no unsupported marker', async () => {
    const sample = '今日は軽い腹痛があります。体温は36.7°C、ビタミンDを1日1回（朝）飲みました。AWAの「サンプル」レポート ー ・ 〜 ！ ？';
    const all = await text(build([sample]));
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const char of '今日軽腹痛体温飲朝あますがはをのビタミンサプルレポートー・〜！？。、（）「」') {
      expect([char, all.includes(char)]).toEqual([char, true]);
    }
    expect(all).toContain('36.7');
    expect(all).toContain('AWA');
    expect(all).toContain('メモ');
  });

  it('draws every kanji, kana and full-width mark of the ja interface dictionary and of the 41 pregnancy weeks', async () => {
    const chars = new Set<string>();
    const add = (value: string) => Array.from(value).forEach(char => {
      if (/[　-〿぀-ヿ㐀-鿿＀-￯]/.test(char)) {chars.add(char);}
    });
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {add(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk(ja);
    for (let week = 1; week <= 41; week += 1) {
      walk(getPregnancyWeekData(week, 'ja'));
    }
    // the Chinese endonym (简体中文) is a Simplified-Chinese string inside the Japanese dictionary: it is shown in the language selector,
    // never in a report, and 简 is not a Japanese kanji
    chars.delete('简');
    const all = Array.from(chars).sort();
    expect(all.length).toBeGreaterThan(900);
    const lines: string[] = [];
    for (let index = 0; index < all.length; index += 40) {
      lines.push(all.slice(index, index + 40).join(''));
    }
    const drawn = await text(build(lines));
    expect(drawn).not.toContain(PDF_UNSUPPORTED_MARKER);
    const joined = drawn.replace(/\s+/g, '');
    const missing = all.filter(char => !joined.includes(char));
    expect(missing).toEqual([]);
  });

  it('draws the Japanese interface export texts without replacing any character', async () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    ['cyclePhase', 'export', 'calendar'].forEach(group => walk((ja as Record<string, unknown>)[group]));
    expect(values.length).toBeGreaterThan(20);
    // the unsupported-characters notice itself quotes the marker, so it is not part of the sample
    const lines = values.filter(value => !value.includes('{{') && !value.includes(PDF_UNSUPPORTED_MARKER)).slice(0, 80);
    expect(await text(build(lines))).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('embeds Noto Sans JP Regular + Bold (and no Helvetica, no Noto Sans SC) for a Japanese report', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['軽い頭痛'])));
    expect(names.some(name => /^NotoSansJP-Bold/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansJP-Regular/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansSC/.test(name))).toBe(false);
    expect(names.some(name => /^Helvetica/.test(name))).toBe(false);
    expect(names.some(name => /^Cairo/.test(name))).toBe(false);
  });

  it('a Japanese report made only of kanji (no kana) still uses the Japanese face, not the Chinese one', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['頭痛 発熱 腹痛'], '症状', '2026年8月25日')));
    expect(names.some(name => /^NotoSansJP/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansSC/.test(name))).toBe(false);
  });

  it('a long Japanese note with no spaces wraps inside the margins (broken per character)', async () => {
    const long = '今朝は起きたときにとても疲れていましたが、午後には少しずつ楽になりました。夕方は友人と公園を長く散歩し、夕食は軽めにして、水をたくさん飲み、寝る前に十分ほどストレッチをしました。'.repeat(3);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([long])));
    const lineWidth = 595.28 - 50 * 2;
    const noteLines = drawn.filter(piece => /今朝|夕方|ストレッチ/.test(piece.text) || piece.text.length > 10);
    expect(noteLines.length).toBeGreaterThanOrEqual(2);
    noteLines.forEach(piece => {
      const width = (piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(lineWidth + 0.5);
    });
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined.split('ストレッチをしました。').length - 1).toBe(3); // nothing lost while wrapping
  });

  it('kinsoku: a wrapped Japanese note never starts a line with closing punctuation, ー, 〜 or a small kana, nor ends one with an opening bracket', async () => {
    const sample = '今日の記録は「頭痛（軽度）」、疲れ、お腹のはり、そして睡眠不足でした。ゆっくり休んで、ちょっとずつ元気になりたいです。コーヒーを控えめに、ミルクティーにしました〜。';
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([sample.repeat(8)])));
    const lines = drawn.map(piece => piece.text).filter(line => /[頭痛疲睡眠]/.test(line));
    expect(lines.length).toBeGreaterThanOrEqual(3);
    lines.forEach(line => {
      const body = line.replace(/^•\s*/, '');
      expect(body).not.toMatch(/^[、。，．！？）」』】〉》…ー〜・ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ]/);
      expect(body).not.toMatch(/[（「『【〈《]$/);
    });
  });

  it('Latin words, digits and the Western European letters inside a Japanese report are drawn by the same face (no split between typefaces)', async () => {
    const all = await text(build(['AWA Premium 2026 çÇ ë Ë é ñ ü 36.7°C']));
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    for (const piece of ['AWA Premium', '2026', 'çÇ ë Ë é ñ ü', '36.7']) {
      expect([piece, all.includes(piece)]).toEqual([piece, true]);
    }
  });

  it('documented limitation: the Turkish letters ğ Ğ ş Ş ı İ are not in the Japanese face, so a Japanese report replaces them with the standard marker', async () => {
    const all = await text(build(['ğĞşŞıİ']));
    expect(all).toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('mixed-language user input never throws: Arabic keeps its own face, Cyrillic and emoji become the marker, kanji stay', async () => {
    const base64 = await generateMedicalExportPdfBase64(build(['今日は頭痛 مرحبا بالعالم 😊 Привет cafe']));
    const names = await faces(base64);
    expect(names.some(name => /^NotoSansJP/i.test(name))).toBe(true);
    expect(names.some(name => /^Cairo/i.test(name))).toBe(true);
    const all = (await extractDrawnText(base64)).map(piece => piece.text).join(' ');
    expect(all).toContain('今日は頭痛');
    expect(all).toContain('cafe');
    expect(all).toContain(PDF_UNSUPPORTED_MARKER); // the emoji and the Cyrillic word
    expect(all).not.toContain('Привет');
  });

  it('a rare character outside the embedded set (JIS level 2 / extension B) is replaced by the standard marker and the notice is added', async () => {
    const all = await text(build(['通常 𠀀 鰯 の文字']));
    expect(all).toContain(PDF_UNSUPPORTED_MARKER);
  });
});

describe('Japanese CSV export', () => {
  it('uses the Japanese headers with the same ; delimiter and keeps kana and kanji through UTF-8', () => {
    const csv = buildExportCsv(
      [{date: '2026-08-25', categories: [{category: 'notes', label: 'メモ', lines: ['頭痛; 軽い', '彼女は「大丈夫」と言った']}]}],
      [],
    );
    const header = csv.split(/\r?\n/)[0];
    const csvTexts = (ja as {export: {csv: Record<string, string>}}).export.csv;
    expect(header).toBe([csvTexts.headerDate, csvTexts.headerCategory, csvTexts.headerValue].join(';'));
    expect(header).not.toMatch(/Date;|Category;|Value$/);
    expect(csv).toContain('メモ');
    expect(csv).toContain('"頭痛; 軽い ; 彼女は「大丈夫」と言った"');
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv); // lossless
  });
});

describe('other languages keep their PDF faces', () => {
  it('a Chinese report still embeds Noto Sans SC (not JP), Russian DejaVu, Hindi its Devanagari face, and French stays Helvetica', async () => {
    await setAppLanguage('zh');
    await i18n.changeLanguage('zh');
    const chinese = await faces(await generateMedicalExportPdfBase64(buildLatin(['轻度头痛'], 'Notes', '2026-08-25')));
    expect(chinese.some(name => /^NotoSansSC/.test(name))).toBe(true);
    expect(chinese.some(name => /^NotoSansJP/.test(name))).toBe(false);
    await setAppLanguage('ru');
    await i18n.changeLanguage('ru');
    const russian = await faces(await generateMedicalExportPdfBase64(buildLatin(['Головная боль'], 'Заметки', '25 августа 2026 г.')));
    expect(russian.some(name => /DejaVuSans/.test(name))).toBe(true);
    await setAppLanguage('hi');
    await i18n.changeLanguage('hi');
    const hindi = await faces(await generateMedicalExportPdfBase64(buildLatin(['सिरदर्द'], 'नोट्स', '25 अगस्त 2026')));
    expect(hindi.some(name => /NotoSansDevanagari/.test(name))).toBe(true);
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    const french = await faces(await generateMedicalExportPdfBase64(buildLatin(['café crème'], 'Notes', '25 août 2026')));
    expect(french.every(name => /^Helvetica/.test(name))).toBe(true);
    await setAppLanguage('ja');
    await i18n.changeLanguage('ja');
  });
});
