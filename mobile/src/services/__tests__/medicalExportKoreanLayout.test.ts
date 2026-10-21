import {PDF_UNSUPPORTED_MARKER, containsChinese, containsCyrillic, containsDevanagari, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {ko} from '../../i18n/locales/ko';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Korean PDF / CSV export: Helvetica (WinAnsi), Cairo and DejaVu have no Hangul, and the Chinese / Japanese Noto faces do not carry the
// Hangul syllables, so a Korean report that contains Hangul is drawn entirely with the embedded Noto Sans KR Regular + Bold subset
// (pdfKoreanFont.ts, loaded only for such reports). Chinese reports keep Noto Sans SC, Japanese ones Noto Sans JP, and every other
// language keeps its own faces.

const build = (lines: string[], label = '메모', day = '2026년 8월 25일') =>
  buildExportReportModel(
    [{date: '2026-08-25', categories: [{category: 'notes', label, lines}]}],
    '생리 주기 기록',
    '전체 이력',
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
  await setAppLanguage('ko');
  await i18n.changeLanguage('ko');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('containsChinese (the CJK detector) with Korean text', () => {
  it('detects Hangul syllables and compatibility jamo, and nothing else', () => {
    expect(containsChinese('생리 주기')).toBe(true);
    expect(containsChinese('ㅋㅋ')).toBe(true);
    expect(containsChinese('Hello çğıİöşü Привет मराठी 😊')).toBe(false);
    expect(containsCyrillic('생리')).toBe(false);
    expect(containsDevanagari('생리')).toBe(false);
  });
});

describe('Korean PDF export', () => {
  it('draws Hangul, Latin words, digits and ASCII punctuation with no unsupported marker', async () => {
    const sample = '오늘은 가벼운 복통이 있었어요. 체온은 36.7°C, 비타민 D를 하루 1회(아침) 먹었어요. AWA의 “샘플” 리포트 ~ 21~35일!';
    const all = await text(build([sample]));
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const char of '오늘가벼운복통체온비타민하루회아침먹었어요샘플리포트일') {
      expect([char, all.includes(char)]).toEqual([char, true]);
    }
    expect(all).toContain('36.7');
    expect(all).toContain('AWA');
    expect(all).toContain('메모');
  });

  it('draws every Hangul syllable and symbol of the ko interface dictionary and of the 41 pregnancy weeks', async () => {
    const chars = new Set<string>();
    const add = (value: string) => Array.from(value).forEach(char => {
      if (/[가-힣ㄱ-ㆎ]/.test(char)) {chars.add(char);}
    });
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {add(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk(ko);
    for (let week = 1; week <= 41; week += 1) {
      walk(getPregnancyWeekData(week, 'ko'));
    }
    const all = Array.from(chars).sort();
    expect(all.length).toBeGreaterThan(600);
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

  it('draws the Korean interface export texts without replacing any character', async () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    ['cyclePhase', 'export', 'calendar'].forEach(group => walk((ko as Record<string, unknown>)[group]));
    expect(values.length).toBeGreaterThan(20);
    // the unsupported-characters notice itself quotes the marker, so it is not part of the sample
    const lines = values.filter(value => !value.includes('{{') && !value.includes(PDF_UNSUPPORTED_MARKER)).slice(0, 80);
    expect(await text(build(lines))).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('embeds Noto Sans KR Regular + Bold (and no Helvetica, no Noto Sans SC / JP) for a Korean report', async () => {
    const names = await faces(await generateMedicalExportPdfBase64(build(['가벼운 두통'])));
    expect(names.some(name => /^NotoSansKR-Bold/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansKR-Regular/.test(name))).toBe(true);
    expect(names.some(name => /^NotoSansSC/.test(name))).toBe(false);
    expect(names.some(name => /^NotoSansJP/.test(name))).toBe(false);
    expect(names.some(name => /^Helvetica/.test(name))).toBe(false);
    expect(names.some(name => /^Cairo/.test(name))).toBe(false);
  });

  it('a long Korean note wraps inside the margins at word spaces, and nothing is lost while wrapping', async () => {
    const long = '아침에 일어났을 때는 많이 피곤했지만 오후에는 조금씩 나아졌어요. 저녁에는 친구와 공원을 오래 산책했고, 물을 많이 마셨고, 자기 전에 십 분 정도 스트레칭을 했어요. '.repeat(3);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([long])));
    const lineWidth = 595.28 - 50 * 2;
    const noteLines = drawn.filter(piece => /아침|저녁|스트레칭/.test(piece.text) || piece.text.length > 10);
    expect(noteLines.length).toBeGreaterThanOrEqual(2);
    noteLines.forEach(piece => {
      const width = (piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(lineWidth + 0.5);
    });
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined.split('스트레칭을했어요.').length - 1).toBe(3);
  });

  it('a very long unspaced Korean token is broken per character inside the margins', async () => {
    const token = '가나다라마바사아자차카타파하'.repeat(14);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([token])));
    const lineWidth = 595.28 - 50 * 2;
    const pieces = drawn.filter(piece => /가나다/.test(piece.text));
    expect(pieces.length).toBeGreaterThanOrEqual(2);
    pieces.forEach(piece => {
      const width = (piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(lineWidth + 0.5);
    });
    expect(drawn.map(piece => piece.text).join('').replace(/\s+/g, '').replace(/•/g, '')).toContain(token.slice(0, 28));
  });

  it('Latin words, digits and the Western European letters inside a Korean report are drawn by the same face (no split between typefaces)', async () => {
    const all = await text(build(['AWA Premium 2026 çÇ ë Ë é ñ ü 36.7°C']));
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    for (const piece of ['AWA Premium', '2026', 'çÇ ë Ë é ñ ü', '36.7']) {
      expect([piece, all.includes(piece)]).toEqual([piece, true]);
    }
  });

  it('documented limitation: the Turkish letters ğ Ğ ş Ş ı İ are not in the Korean face, so a Korean report replaces them with the standard marker', async () => {
    const all = await text(build(['ğĞşŞıİ']));
    expect(all).toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('mixed-language user input never throws: Arabic keeps its own face, Cyrillic and emoji become the marker, Hangul stays', async () => {
    const base64 = await generateMedicalExportPdfBase64(build(['오늘은 두통 مرحبا بالعالم 😊 Привет cafe']));
    const names = await faces(base64);
    expect(names.some(name => /^NotoSansKR/i.test(name))).toBe(true);
    expect(names.some(name => /^Cairo/i.test(name))).toBe(true);
    const all = (await extractDrawnText(base64)).map(piece => piece.text).join(' ');
    expect(all).toContain('오늘은 두통');
    expect(all).toContain('cafe');
    expect(all).toContain(PDF_UNSUPPORTED_MARKER); // the emoji and the Cyrillic word
    expect(all).not.toContain('Привет');
  });

  it('a rare Hangul syllable outside the embedded set is replaced by the standard marker and the report still builds', async () => {
    const all = await text(build(['보통 뷁 의 글자']));
    expect(all).toContain('보통');
    expect(all.includes('뷁') || all.includes(PDF_UNSUPPORTED_MARKER)).toBe(true);
  });
});

describe('Korean CSV export', () => {
  it('uses the Korean headers with the same ; delimiter and keeps Hangul through UTF-8', () => {
    const csv = buildExportCsv(
      [{date: '2026-08-25', categories: [{category: 'notes', label: '메모', lines: ['두통; 가벼움', '그녀는 “괜찮아요”라고 말했어요']}]}],
      [],
    );
    const header = csv.split(/\r?\n/)[0];
    const csvTexts = (ko as {export: {csv: Record<string, string>}}).export.csv;
    expect(header).toBe([csvTexts.headerDate, csvTexts.headerCategory, csvTexts.headerValue].join(';'));
    expect(header).not.toMatch(/Date;|Category;|Value$/);
    expect(csv).toContain('메모');
    expect(csv).toContain('"두통; 가벼움 ; 그녀는 “괜찮아요”라고 말했어요"');
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv); // lossless
  });
});

describe('other languages keep their PDF faces', () => {
  it('Chinese keeps Noto Sans SC, Japanese Noto Sans JP, Russian DejaVu, Hindi its Devanagari face, and French stays Helvetica', async () => {
    await setAppLanguage('zh');
    await i18n.changeLanguage('zh');
    const chinese = await faces(await generateMedicalExportPdfBase64(buildLatin(['轻度头痛'], 'Notes', '2026-08-25')));
    expect(chinese.some(name => /^NotoSansSC/.test(name))).toBe(true);
    expect(chinese.some(name => /^NotoSansKR/.test(name))).toBe(false);
    await setAppLanguage('ja');
    await i18n.changeLanguage('ja');
    const japanese = await faces(await generateMedicalExportPdfBase64(buildLatin(['軽い頭痛'], 'Notes', '2026-08-25')));
    expect(japanese.some(name => /^NotoSansJP/.test(name))).toBe(true);
    expect(japanese.some(name => /^NotoSansKR/.test(name))).toBe(false);
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
    await setAppLanguage('ko');
    await i18n.changeLanguage('ko');
  });
});
