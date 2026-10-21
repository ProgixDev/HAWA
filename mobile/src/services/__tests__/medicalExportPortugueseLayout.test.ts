import {PDF_UNSUPPORTED_MARKER, containsChinese, generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';
import {ptPT, ptBRFull} from '../../testUtils/portugueseDictionaries';
import {getPregnancyWeekData} from '../../data/pregnancyWeekData';
import {PDFDict, PDFDocument, PDFName} from 'pdf-lib';

// Portuguese PDF / CSV export (Portugal and Brazil). Portuguese is written in Latin letters that the standard PDF font (Helvetica, WinAnsi) draws
// completely — á à â ã é ê í ó ô õ ú ç and the typographic punctuation — so a Portuguese report embeds NO extra font and keeps the exact
// behaviour of the French / Spanish / Italian reports. These tests prove it, plus wrapping, page breaks and the lossless UTF-8 CSV.

const build = (lines: string[], label = 'Notas', day = '21 de outubro de 2026') =>
  buildExportReportModel(
    [{date: '2026-10-21', categories: [{category: 'notes', label, lines}]}],
    'Registo do ciclo menstrual',
    'Todo o histórico',
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

afterEach(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe.each(['pt-PT', 'pt-BR'] as const)('Portuguese PDF export (%s)', language => {
  beforeEach(async () => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
  });

  it('is not treated as CJK text and embeds only the standard Helvetica faces (no extra font, no Cairo, no DejaVu, no Noto)', async () => {
    expect(containsChinese('Ação, coração, não, pôr, avó, lição')).toBe(false);
    const names = await faces(await generateMedicalExportPdfBase64(build(['Dor de cabeça ligeira à tarde'])));
    expect(names.length).toBeGreaterThan(0);
    expect(names.every(name => /^Helvetica/.test(name))).toBe(true);
  });

  it('draws every accented letter, the typographic punctuation and the digits with no unsupported marker', async () => {
    const sample = 'Hoje senti uma ligeira dor abdominal à tarde. A temperatura foi de 36,7 °C; tomei vitamina D (1 comprimido) às 8h. “Está tudo bem”, disse – e pôs-se a caminhar… Ação, coração, lição, avô, mãe, órgão, pêssego, ânsia, feijão. ÁÀÂÃÉÊÍÓÔÕÚÇ';
    const all = await text(build([sample]));
    expect(all).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all).not.toContain('�');
    for (const piece of ['ligeira dor abdominal à tarde', '36,7', 'Ação, coração, lição, avô, mãe, órgão, pêssego, ânsia, feijão', 'ÁÀÂÃÉÊÍÓÔÕÚÇ']) {
      expect([piece, all.includes(piece)]).toEqual([piece, true]);
    }
  });

  it('draws every letter used by the Portuguese dictionary and by the 41 pregnancy weeks without replacing any character', async () => {
    const chars = new Set<string>();
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {
        // the endonyms of the other languages (中文, 日本語 …) are shown in the language selector only, never in a report
        Array.from(node).forEach(char => {if (/[A-Za-zÀ-ÿ]/.test(char)) {chars.add(char);}});
      } else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    walk(language === 'pt-PT' ? ptPT : ptBRFull);
    for (let week = 1; week <= 41; week += 1) {
      walk(getPregnancyWeekData(week, language));
    }
    const all = Array.from(chars).sort();
    expect(all.length).toBeGreaterThan(50);
    const drawn = await text(build([all.join('')]));
    expect(drawn).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(all.filter(char => !drawn.replace(/\s+/g, '').includes(char))).toEqual([]);
  });

  it('draws the Portuguese interface export texts (calendar, cycle phases, export labels) without replacing any character', async () => {
    const values: string[] = [];
    const walk = (node: unknown): void => {
      if (typeof node === 'string') {values.push(node);} else if (node && typeof node === 'object') {Object.values(node).forEach(walk);}
    };
    const dictionary = (language === 'pt-PT' ? ptPT : ptBRFull) as unknown as Record<string, unknown>;
    ['cyclePhase', 'export', 'calendar'].forEach(group => walk(dictionary[group]));
    expect(values.length).toBeGreaterThan(20);
    const lines = values.filter(value => !value.includes('{{') && !value.includes(PDF_UNSUPPORTED_MARKER)).slice(0, 80);
    expect(await text(build(lines))).not.toContain(PDF_UNSUPPORTED_MARKER);
  });

  it('wraps a long note at word spaces inside the margins without losing any text', async () => {
    const long = 'De manhã acordei muito cansada, mas à tarde fui melhorando aos poucos. Ao fim do dia passeei com uma amiga no jardim, bebi muita água e fiz dez minutos de alongamentos antes de dormir. '.repeat(4);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([long])));
    const lineWidth = 595.28 - 50 * 2;
    const noteLines = drawn.filter(piece => /cansada|passeei|alongamentos/.test(piece.text) || piece.text.length > 20);
    expect(noteLines.length).toBeGreaterThanOrEqual(3);
    noteLines.forEach(piece => {
      const width = (piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size;
      expect(width).toBeLessThanOrEqual(lineWidth + 0.5);
    });
    const joined = drawn.map(piece => piece.text).join('').replace(/\s+/g, '');
    expect(joined.split('alongamentosantesdedormir.').length - 1).toBe(4); // nothing lost while wrapping
  });

  it('breaks a very long unspaced token inside the margins and creates a clean second page for a long report', async () => {
    const token = 'anticonstitucionalissimamente'.repeat(8);
    const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(build([token])));
    const lineWidth = 595.28 - 50 * 2;
    expect(drawn.filter(piece => /anticonst/.test(piece.text)).length).toBeGreaterThanOrEqual(2);
    drawn.filter(piece => /anticonst/.test(piece.text)).forEach(piece => {
      expect((piece.widths.reduce((sum: number, w: number) => sum + w, 0) / 1000) * piece.size).toBeLessThanOrEqual(lineWidth + 0.5);
    });
    const many = Array.from({length: 90}, (_, index) => `Registo ${index + 1}: dor de cabeça ligeira e cansaço depois do almoço`);
    const doc = await PDFDocument.load(Buffer.from(await generateMedicalExportPdfBase64(build(many)), 'base64'));
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(2);
  });

  it('other scripts typed by the user never throw: Arabic keeps its own face; Hangul, kana and emoji become the standard marker', async () => {
    const base64 = await generateMedicalExportPdfBase64(build(['Dor مرحبا بالعالم 한국어 日本語 😊 cafe']));
    const names = await faces(base64);
    expect(names.some(name => /^Cairo/i.test(name))).toBe(true);
    const all = (await extractDrawnText(base64)).map(piece => piece.text).join(' ');
    expect(all).toContain('cafe');
  });
});

describe('Portuguese CSV export', () => {
  it.each(['pt-PT', 'pt-BR'] as const)('%s: uses the Portuguese headers with the same ; delimiter and keeps the accents lossless through UTF-8', async language => {
    await setAppLanguage(language);
    await i18n.changeLanguage(language);
    const csv = buildExportCsv(
      [{date: '2026-10-21', categories: [{category: 'notes', label: 'Notas', lines: ['Dor; ligeira', 'Ela disse “está tudo bem”, não é ação']}]}],
      [],
    );
    const header = csv.split(/\r?\n/)[0];
    const csvTexts = ((language === 'pt-PT' ? ptPT : ptBRFull) as unknown as {export: {csv: Record<string, string>}}).export.csv;
    expect(header).toBe([csvTexts.headerDate, csvTexts.headerCategory, csvTexts.headerValue].join(';'));
    expect(header).not.toMatch(/Date;|Category;|Value$/);
    expect(csv).toContain('Notas');
    expect(csv).toContain('"Dor; ligeira ; Ela disse “está tudo bem”, não é ação"');
    expect(Buffer.from(csv, 'utf8').toString('utf8')).toBe(csv); // lossless
  });
});

describe('other languages keep their PDF faces', () => {
  it('Chinese keeps Noto Sans SC, Japanese Noto Sans JP, Korean Noto Sans KR, Russian DejaVu, and French stays Helvetica — Portuguese changed none of them', async () => {
    const latin = (lines: string[], label: string, day: string) =>
      buildExportReportModel([{date: '2026-10-21', categories: [{category: 'notes', label, lines}]}], 'Cycle', 'History', day);
    const expectations: Array<[Parameters<typeof setAppLanguage>[0], string[], RegExp]> = [
      ['zh', ['轻度头痛'], /^NotoSansSC/],
      ['ja', ['軽い頭痛'], /^NotoSansJP/],
      ['ko', ['가벼운 두통'], /^NotoSansKR/],
      ['ru', ['Головная боль'], /DejaVuSans/],
    ];
    for (const [language, lines, face] of expectations) {
      await setAppLanguage(language);
      await i18n.changeLanguage(language);
      expect((await faces(await generateMedicalExportPdfBase64(latin(lines, 'Notes', '2026-10-21')))).some(name => face.test(name))).toBe(true);
    }
    await setAppLanguage('fr');
    await i18n.changeLanguage('fr');
    expect((await faces(await generateMedicalExportPdfBase64(latin(['café crème'], 'Notes', '21 octobre 2026')))).every(name => /^Helvetica/.test(name))).toBe(true);
  });
});
