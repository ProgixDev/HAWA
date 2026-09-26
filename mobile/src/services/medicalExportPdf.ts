import {PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage} from 'pdf-lib';
import type {ExportReportModel} from './medicalExportFormatting';

// Local, on-device PDF generation for the Medical Export "Rapport de suivi" —
// pure JS (pdf-lib has zero native modules, so no autolinking/Android
// configuration is needed at all), no server, no upload. This is the
// professional-readable history required by the cahier des charges
// ("Création d'un historique clair pour un professionnel de santé"): a
// sober, chronological export of exactly what the user selected — never a
// diagnosis, a risk score, or a "normal/abnormal" judgment.

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const TITLE_COLOR = rgb(0.18, 0.14, 0.35); // matches AWA's textPrimary family
const TEXT_COLOR = rgb(0.1, 0.1, 0.12);
const MUTED_COLOR = rgb(0.45, 0.43, 0.57);
const RULE_COLOR = rgb(0.85, 0.82, 0.92);

type Cursor = {doc: PDFDocument; page: PDFPage; y: number; font: PDFFont; bold: PDFFont; support: PdfCharSupport};

// pdf-lib's StandardFonts.Helvetica only encodes WinAnsi (Windows-1252):
// drawText()/widthOfTextAtSize() THROW ("WinAnsi cannot encode ...") for any
// character outside it — Arabic script, emoji, and any other non-Latin free
// text a user typed in a note (reproduced in medicalExportPdf.test.ts). A
// throw there used to abort the WHOLE export with a generic error. Embedding a
// Unicode font would need @pdf-lib/fontkit + a bundled Arabic-capable font
// (and separate shaping/bidi handling) — a larger decision, see TECH DECISION
// in the M45 report. Until then the PDF degrades EXPLICITLY, never silently:
// each unrenderable run is replaced by UNSUPPORTED_MARKER and the report
// carries a visible notice pointing to the lossless CSV export.
export const PDF_UNSUPPORTED_MARKER = '[…]';
export const PDF_UNSUPPORTED_NOTICE =
  'Remarque : certains caractères (écriture arabe, émojis…) ne peuvent pas être affichés dans ce PDF et sont remplacés par « […] ». Ils sont conservés tels quels dans l’export CSV.';

type PdfCharSupport = ReadonlySet<number>;

function pdfCharSupport(font: PDFFont): PdfCharSupport {
  return new Set(font.getCharacterSet());
}

/** Replaces every maximal run of characters the PDF font cannot encode by
 * PDF_UNSUPPORTED_MARKER. Everything encodable is kept verbatim (accents,
 * « », ’, €, …). Pure and deterministic; never throws. */
export function sanitizeTextForPdf(text: string, support: PdfCharSupport): {text: string; replaced: boolean} {
  let out = '';
  let replaced = false;
  let inRun = false;
  for (const char of text.normalize('NFC')) {
    const codePoint = char.codePointAt(0) as number;
    if (support.has(codePoint)) {
      out += char;
      inRun = false;
    } else {
      if (!inRun) {out += PDF_UNSUPPORTED_MARKER;}
      inRun = true;
      replaced = true;
    }
  }
  return {text: out, replaced};
}

function collectModelStrings(model: ExportReportModel): string[] {
  const strings = [model.objectiveLabel, model.periodLabel, model.generatedAtLabel, ...model.notices];
  model.categoryCounts.forEach(({label}) => strings.push(label));
  model.days.forEach(day => {
    strings.push(day.dateLabel);
    day.categories.forEach(category => {
      strings.push(category.label);
      strings.push(...category.lines);
    });
  });
  return strings;
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  words.forEach(word => {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) {lines.push(current);}
  return lines.length ? lines : [''];
}

function newPage(doc: PDFDocument): PDFPage {
  return doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
}

function ensureSpace(cursor: Cursor, needed: number): void {
  if (cursor.y - needed < MARGIN) {
    cursor.page = newPage(cursor.doc);
    cursor.y = PAGE_HEIGHT - MARGIN;
  }
}

function drawParagraph(
  cursor: Cursor,
  text: string,
  opts: {size: number; bold?: boolean; color?: ReturnType<typeof rgb>; gapAfter?: number; indent?: number},
): void {
  const font = opts.bold ? cursor.bold : cursor.font;
  const indent = opts.indent ?? 0;
  const maxWidth = PAGE_WIDTH - MARGIN * 2 - indent;
  const lines = wrapText(font, sanitizeTextForPdf(text, cursor.support).text, opts.size, maxWidth);
  lines.forEach(line => {
    ensureSpace(cursor, opts.size * 1.4);
    cursor.page.drawText(line, {
      x: MARGIN + indent,
      y: cursor.y,
      size: opts.size,
      font,
      color: opts.color ?? TEXT_COLOR,
    });
    cursor.y -= opts.size * 1.4;
  });
  if (opts.gapAfter) {cursor.y -= opts.gapAfter;}
}

function drawRule(cursor: Cursor): void {
  ensureSpace(cursor, 14);
  cursor.page.drawLine({
    start: {x: MARGIN, y: cursor.y},
    end: {x: PAGE_WIDTH - MARGIN, y: cursor.y},
    thickness: 0.75,
    color: RULE_COLOR,
  });
  cursor.y -= 14;
}

/** Renders the full report as a real PDF file's bytes (base64-encoded, ready
 * to be written to disk with @dr.pogodin/react-native-fs's `writeFile(path,
 * base64, 'base64')` — no separate binary/Uint8Array conversion needed).
 * Every line comes straight from the already-filtered, already-selected-only
 * `model` — this function never re-derives, filters, or invents content. */
export async function generateMedicalExportPdfBase64(model: ExportReportModel): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const support = pdfCharSupport(font);
  const cursor: Cursor = {doc, page: newPage(doc), y: PAGE_HEIGHT - MARGIN, font, bold, support};

  drawParagraph(cursor, 'AWA', {size: 22, bold: true, color: TITLE_COLOR, gapAfter: 2});
  drawParagraph(cursor, 'Rapport de suivi', {size: 15, bold: true, color: TITLE_COLOR, gapAfter: 10});
  drawParagraph(cursor, `Objectif : ${model.objectiveLabel}`, {size: 10.5, color: MUTED_COLOR});
  drawParagraph(cursor, `Période : ${model.periodLabel}`, {size: 10.5, color: MUTED_COLOR});
  drawParagraph(cursor, `Généré le ${model.generatedAtLabel}`, {size: 10.5, color: MUTED_COLOR, gapAfter: 12});

  // Bold shares the regular face's WinAnsi character set, so one check covers both.
  const hasUnsupportedText = collectModelStrings(model).some(value => sanitizeTextForPdf(value, support).replaced);
  const notices = hasUnsupportedText ? [...model.notices, PDF_UNSUPPORTED_NOTICE] : model.notices;

  if (notices.length) {
    notices.forEach(notice => {
      drawParagraph(cursor, notice, {size: 9.5, color: MUTED_COLOR, gapAfter: 2});
    });
    cursor.y -= 4;
  }

  drawRule(cursor);
  cursor.y -= 6;

  drawParagraph(cursor, 'RÉSUMÉ', {size: 12.5, bold: true, color: TITLE_COLOR, gapAfter: 6});
  drawParagraph(cursor, `Nombre de jours renseignés : ${model.totalDays}`, {size: 10.5, gapAfter: 4});
  if (model.categoryCounts.length) {
    model.categoryCounts.forEach(({label, count}) => {
      drawParagraph(cursor, `${label} : ${count} jour${count > 1 ? 's' : ''}`, {size: 10.5, indent: 8});
    });
  }
  cursor.y -= 8;
  drawRule(cursor);
  cursor.y -= 6;

  drawParagraph(cursor, 'HISTORIQUE', {size: 12.5, bold: true, color: TITLE_COLOR, gapAfter: 6});

  if (!model.days.length) {
    drawParagraph(cursor, 'Aucune donnée disponible pour cette période et ces catégories.', {
      size: 10.5,
      color: MUTED_COLOR,
    });
  }

  model.days.forEach(day => {
    ensureSpace(cursor, 24);
    drawParagraph(cursor, day.dateLabel, {size: 11.5, bold: true, gapAfter: 3});
    day.categories.forEach(category => {
      drawParagraph(cursor, category.label, {size: 10, bold: true, indent: 8, gapAfter: 1});
      category.lines.forEach(line => {
        drawParagraph(cursor, `• ${line}`, {size: 10, indent: 16});
      });
      cursor.y -= 2;
    });
    cursor.y -= 6;
  });

  return doc.saveAsBase64();
}
