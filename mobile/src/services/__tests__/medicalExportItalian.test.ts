import {PDFDocument, StandardFonts} from 'pdf-lib';

import {PDF_UNSUPPORTED_MARKER, PDF_UNSUPPORTED_NOTICE, generateMedicalExportPdfBase64, sanitizeTextForPdf} from '../medicalExportPdf';
import {buildExportReportModel} from '../medicalExportFormatting';
import {extractDrawnText} from '../../testUtils/pdfExtract';
import {en} from '../../i18n/locales/en';
import {it as itDictionary} from '../../i18n/locales/it';
import {resetAppLanguageForTests, setAppLanguage} from '../../state/themePreferences';
import i18n from '../../i18n';

// Italian integration — the shared PDF pipeline must draw Italian text without
// replacing any character (ì and ò are the only characters Italian needs that
// French/Spanish/English do not), keep Arabic + RTL behavior intact, and never
// need the "unsupported character" notice for the Italian export strings.

type AnyRecord = Record<string, unknown>;

const flatten = (obj: AnyRecord, prefix = ''): Array<[string, string]> =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value as AnyRecord, path)
      : [[path, String(value)] as [string, string]];
  });

const modelWith = (lines: string[]) =>
  buildExportReportModel(
    [{date: '2026-08-24', categories: [{category: 'notes', label: 'Note', lines}]}],
    'Monitoraggio del ciclo',
    'Tutta la cronologia',
    '25 agosto 2026',
  );

const latinOf = async (lines: string[]) => {
  const drawn = await extractDrawnText(await generateMedicalExportPdfBase64(modelWith(lines)));
  return {
    drawn,
    latin: drawn.filter(piece => piece.kind === 'latin').map(piece => piece.text).join(' '),
  };
};

beforeEach(async () => {
  await setAppLanguage('it');
  await i18n.changeLanguage('it');
});

afterAll(async () => {
  await resetAppLanguageForTests();
  await i18n.changeLanguage('en');
});

describe('Italian PDF export', () => {
  it('draws Italian accents verbatim — including ì and ò — with no unsupported-character marker', async () => {
    const {latin} = await latinOf(['Umore : così, però già più è perché l’energia — «Attività»', 'Giovedì, lunedì, sabato']);
    expect(latin).toContain('così');
    expect(latin).toContain('però');
    expect(latin).toContain('già più è perché');
    expect(latin).toContain('l’energia');
    expect(latin).toContain('«Attività»');
    expect(latin).toContain('Giovedì, lunedì');
    expect(latin).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(latin).not.toContain(PDF_UNSUPPORTED_NOTICE);
  });

  it('mixed Arabic + Italian keeps the Italian verbatim and still draws the Arabic (RTL support preserved)', async () => {
    const {drawn, latin} = await latinOf(['Nota : اليوم كنت متعبة, stanchezza più forte']);
    expect(latin).toContain('stanchezza più forte');
    expect(latin).not.toContain(PDF_UNSUPPORTED_MARKER);
    expect(drawn.some(piece => piece.kind === 'arabic')).toBe(true);
  });

  it('the report built from real Italian export labels is a valid, drawable PDF', async () => {
    const labels = [
      itDictionary.export.data.cycle.categories.mood,
      itDictionary.export.data.cycle.categories.flow,
      itDictionary.export.data.cycle.categories.symptoms,
      itDictionary.export.enums.mood.veryGood,
      itDictionary.export.enums.flow.heavy,
    ];
    const {latin} = await latinOf(labels);
    for (const label of labels) {
      expect(latin).toContain(label);
    }
  });

  it('every Italian export/journal-option/notification string is fully drawable with the standard Latin font (nothing the English one needs less)', async () => {
    const doc = await PDFDocument.create();
    const helvetica = await doc.embedFont(StandardFonts.Helvetica);
    const support = new Set<number>(helvetica.getCharacterSet());

    const unsupported = (dictionary: AnyRecord) =>
      new Map(
        flatten(dictionary)
          .filter(([path]) => /^(export|journalOptions|notifications|cyclePhase|journalMood|journalSymptoms|journalMenstrualFlow)\./.test(path))
          .filter(([, value]) => sanitizeTextForPdf(value, support).replaced)
          .map(([path, value]) => [path, value] as [string, string]),
      );

    const italianProblems = unsupported(itDictionary as AnyRecord);
    const englishProblems = unsupported(en as AnyRecord);
    // Strings Italian cannot draw must be exactly the ones English cannot either
    // (e.g. an emoji that both dictionaries share) — Italian adds none of its own.
    expect([...italianProblems.keys()].filter(path => !englishProblems.has(path))).toEqual([]);
  });
});
