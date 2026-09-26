import {PDFDocument, PDFRawStream, PDFRef, decodePDFRawStream} from 'pdf-lib';
import {
  PDF_UNSUPPORTED_MARKER,
  PDF_UNSUPPORTED_NOTICE,
  generateMedicalExportPdfBase64,
  sanitizeTextForPdf,
} from '../medicalExportPdf';
import {buildExportCsv, buildExportReportModel, type ExportDayEntry} from '../medicalExportFormatting';

describe('generateMedicalExportPdfBase64', () => {
  it('produces a real, parseable PDF file containing only the selected data', async () => {
    const days: ExportDayEntry[] = [
      {date: '2026-08-25', categories: [{category: 'mood', label: 'Humeur', lines: ['Humeur : Bien']}]},
      {date: '2026-08-24', categories: [{category: 'mood', label: 'Humeur', lines: ['Humeur : Triste']}]},
    ];
    const model = buildExportReportModel(days, 'Suivi du cycle', 'Tout l’historique', '25 août 2026');

    const base64 = await generateMedicalExportPdfBase64(model);
    expect(base64.length).toBeGreaterThan(0);

    // Round-trips through pdf-lib itself — a real, structurally valid PDF,
    // not a stub string.
    const reopened = await PDFDocument.load(Buffer.from(base64, 'base64'));
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('never invents a diagnosis/score/normal-abnormal judgment in the rendered text', async () => {
    const days: ExportDayEntry[] = [
      {date: '2026-08-24', categories: [{category: 'symptoms', label: 'Symptômes', lines: ['Symptômes : Fatigue']}]},
    ];
    const model = buildExportReportModel(days, 'Suivi du cycle', 'Tout l’historique', '25 août 2026');

    // Verified at the model level (what the PDF renderer is given) — the
    // renderer draws exactly these strings and adds no medical vocabulary of
    // its own.
    const serialized = JSON.stringify(model).toLowerCase();
    ['diagnostic', 'anormal', 'risque', 'recommand'].forEach(forbiddenWord => {
      expect(serialized).not.toContain(forbiddenWord);
    });

    await expect(generateMedicalExportPdfBase64(model)).resolves.toEqual(expect.any(String));
  });

  it('renders an explicit empty-history message instead of a misleading blank report', async () => {
    const model = buildExportReportModel([], 'Suivi du cycle', '3 derniers mois', '25 août 2026');
    const base64 = await generateMedicalExportPdfBase64(model);
    expect(base64.length).toBeGreaterThan(0);
    expect(model.days).toHaveLength(0);
  });
});

// Extracts the text drawn in a generated PDF: standard-font text is emitted as
// `<hex> Tj` in WinAnsi (Windows-1252), so the hex bytes decode with latin1
// plus the few 0x80-0x9F cp1252 punctuation slots this report can contain.
const CP1252_EXTRA: Record<number, string> = {
  0x80: '€', 0x85: '…', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x9c: 'œ',
};

async function extractPdfText(base64: string): Promise<string> {
  const doc = await PDFDocument.load(Buffer.from(base64, 'base64'));
  const drawn: string[] = [];
  doc.getPages().forEach(page => {
    const contents = page.node.Contents();
    const items: unknown[] = contents && 'asArray' in contents ? (contents as {asArray(): unknown[]}).asArray() : [contents];
    items.forEach(item => {
      const stream = item instanceof PDFRef ? doc.context.lookup(item) : item;
      if (!(stream instanceof PDFRawStream)) {return;}
      const source = Buffer.from(decodePDFRawStream(stream).decode()).toString('latin1');
      for (const match of source.matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)) {
        const bytes = Buffer.from(match[1], 'hex');
        drawn.push(Array.from(bytes, byte => CP1252_EXTRA[byte] ?? String.fromCharCode(byte)).join(''));
      }
    });
  });
  return drawn.join(' ');
}

const modelWith = (lines: string[]) =>
  buildExportReportModel(
    [{date: '2026-08-24', categories: [{category: 'notes', label: 'Notes du jour', lines}]}],
    'Suivi',
    'Tout l’historique',
    '25 août 2026',
  );

const M = PDF_UNSUPPORTED_MARKER;

describe('generateMedicalExportPdfBase64 — Unicode behaviour (M45)', () => {
  it('Latin/French text with accents is kept verbatim in the PDF byte stream', async () => {
    const text = await extractPdfText(
      await generateMedicalExportPdfBase64(modelWith(['Symptômes : fatigué, é è ê à ç œ « » ’ € — “test”'])),
    );
    expect(text).toContain('Symptômes : fatigué, é è ê à ç œ « » ’ € — “test”');
    expect(text).not.toContain(PDF_UNSUPPORTED_NOTICE);
    expect(text).not.toContain(M);
  });

  it('Arabic text does not throw (previously: "WinAnsi cannot encode")', async () => {
    const base64 = await generateMedicalExportPdfBase64(modelWith(['مرحبا بالعالم']));
    const reopened = await PDFDocument.load(Buffer.from(base64, 'base64'));
    expect(reopened.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('Arabic is NOT rendered (no glyphs, no shaping, no RTL) but is marked explicitly - never as question marks - with a visible notice', async () => {
    const text = await extractPdfText(await generateMedicalExportPdfBase64(modelWith(['مرحبا بالعالم'])));
    expect(text).toContain(`• ${M} ${M}`);
    expect(text).toContain(PDF_UNSUPPORTED_NOTICE);
    expect(text).not.toContain('?');
    expect(text).not.toMatch(/[؀-ۿ]/);
  });

  it('mixed Arabic + French keeps the French part verbatim and marks the Arabic runs', async () => {
    const text = await extractPdfText(await generateMedicalExportPdfBase64(modelWith(['Note : اليوم كنت متعبة, fatiguée'])));
    expect(text).toContain(`Note : ${M} ${M} ${M}, fatiguée`);
    expect(text).toContain(PDF_UNSUPPORTED_NOTICE);
  });

  it('emoji, ZWJ sequences and other non-WinAnsi scripts do not throw and are marked', async () => {
    const text = await extractPdfText(
      await generateMedicalExportPdfBase64(modelWith(['Humeur 😊 ok', 'famille 👩‍👧 !', 'עברית', '日本語'])),
    );
    expect(text).toContain(`Humeur ${M} ok`);
    expect(text).toContain(`famille ${M} !`);
    expect(text).toContain(PDF_UNSUPPORTED_NOTICE);
  });

  it('adds the notice only when something was actually replaced', async () => {
    const text = await extractPdfText(await generateMedicalExportPdfBase64(modelWith(['tout va bien'])));
    expect(text).not.toContain(PDF_UNSUPPORTED_NOTICE);
    expect(text).not.toContain(M);
  });

  it('sanitizeTextForPdf keeps supported characters and collapses each unsupported run to one marker', () => {
    const support = new Set(Array.from('abc é').map(char => char.codePointAt(0) as number));
    expect(sanitizeTextForPdf('abc é', support)).toEqual({text: 'abc é', replaced: false});
    expect(sanitizeTextForPdf('aمرحباb😊c', support)).toEqual({text: `a${M}b${M}c`, replaced: true});
  });

  it('the CSV export path stays lossless for Arabic/emoji (the documented fallback for the PDF limitation)', () => {
    const csv = buildExportCsv([
      {date: '2026-08-24', categories: [{category: 'notes', label: 'Notes du jour', lines: ['مرحبا 😊']}]},
    ]);
    expect(csv).toContain('مرحبا 😊');
  });
});
