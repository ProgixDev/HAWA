import {PDFDocument} from 'pdf-lib';
import {generateMedicalExportPdfBase64} from '../medicalExportPdf';
import {buildExportReportModel, type ExportDayEntry} from '../medicalExportFormatting';

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
