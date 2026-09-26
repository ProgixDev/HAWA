import {PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef, decodePDFRawStream} from 'pdf-lib';

// Test helper: reads back what a generated PDF actually DRAWS. Text drawn with
// the embedded Arabic (Type0 / Identity-H) font is a list of glyph ids; the
// font's ToUnicode CMap gives the character(s) each glyph stands for, in the
// order the glyphs are painted (left to right on the page = VISUAL order).
// Standard-font text is WinAnsi bytes.

const CP1252_EXTRA: Record<number, string> = {
  0x80: '€', 0x85: '…', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x9c: 'œ',
};

export type DrawnText = {
  kind: 'latin' | 'arabic';
  /** Text as painted left to right (visual order). */
  text: string;
  /** Glyph ids of the painted glyphs (arabic only). */
  glyphIds: number[];
  /** Advance widths (1/1000 em) of the painted glyphs, from the font's /W array (arabic only). */
  widths: number[];
  /** Font size the text was drawn at. */
  size: number;
};

/** The /W array of the CID font: glyph id -> advance width (1/1000 em). */
function parseWidths(doc: PDFDocument, type0: PDFDict): Map<number, number> {
  const widths = new Map<number, number>();
  const descendants = type0.lookup(PDFName.of('DescendantFonts'), PDFArray);
  const cid = doc.context.lookup(descendants.get(0), PDFDict);
  const w = cid.lookup(PDFName.of('W'), PDFArray);
  let index = 0;
  while (index < w.size()) {
    const first = (w.lookup(index) as PDFNumber).asNumber();
    const next = w.lookup(index + 1);
    if (next instanceof PDFArray) {
      for (let offset = 0; offset < next.size(); offset += 1) {
        widths.set(first + offset, (next.lookup(offset) as PDFNumber).asNumber());
      }
      index += 2;
    } else {
      const last = (next as PDFNumber).asNumber();
      const width = (w.lookup(index + 2) as PDFNumber).asNumber();
      for (let gid = first; gid <= last; gid += 1) {widths.set(gid, width);}
      index += 3;
    }
  }
  return widths;
}

const decodeStream = (doc: PDFDocument, ref: unknown): string | null => {
  const stream = ref instanceof PDFRef ? doc.context.lookup(ref) : ref;
  if (!(stream instanceof PDFRawStream)) {return null;}
  return Buffer.from(decodePDFRawStream(stream).decode()).toString('latin1');
};

function parseToUnicode(cmap: string): Map<number, string> {
  const map = new Map<number, string>();
  const toText = (hex: string): string => {
    let out = '';
    for (let index = 0; index < hex.length; index += 4) {
      out += String.fromCharCode(parseInt(hex.slice(index, index + 4), 16));
    }
    return out;
  };
  for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const entry of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(parseInt(entry[1], 16), toText(entry[2]));
    }
  }
  for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const entry of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const start = parseInt(entry[1], 16);
      const end = parseInt(entry[2], 16);
      const base = parseInt(entry[3], 16);
      for (let code = start; code <= end; code += 1) {map.set(code, String.fromCharCode(base + code - start));}
    }
  }
  return map;
}

export async function extractDrawnText(base64: string): Promise<DrawnText[]> {
  const doc = await PDFDocument.load(Buffer.from(base64, 'base64'));
  const drawn: DrawnText[] = [];
  doc.getPages().forEach(page => {
    const fontDict = page.node.Resources()?.lookup(PDFName.of('Font'), PDFDict);
    const fontInfo = new Map<string, {arabic: boolean; toUnicode: Map<number, string> | null; widths: Map<number, number>}>();
    fontDict?.entries().forEach(([name, ref]) => {
      const font = doc.context.lookup(ref, PDFDict);
      const isType0 = font.get(PDFName.of('Subtype')) === PDFName.of('Type0');
      let toUnicode: Map<number, string> | null = null;
      let widths = new Map<number, number>();
      if (isType0) {
        widths = parseWidths(doc, font);
        const cmapText = decodeStream(doc, font.get(PDFName.of('ToUnicode')));
        toUnicode = cmapText ? parseToUnicode(cmapText) : null;
      }
      fontInfo.set(name.decodeText(), {arabic: isType0, toUnicode, widths});
    });

    const contents = page.node.Contents();
    const items: unknown[] = contents && 'asArray' in contents ? (contents as {asArray(): unknown[]}).asArray() : [contents];
    items.forEach(item => {
      const source = decodeStream(doc, item);
      if (!source) {return;}
      let current: {arabic: boolean; toUnicode: Map<number, string> | null; widths: Map<number, number>} | undefined;
      let size = 0;
      for (const token of source.matchAll(/\/(\S+)\s+([\d.]+)\s+Tf|<([0-9A-Fa-f]+)>\s*Tj/g)) {
        if (token[1]) {
          current = fontInfo.get(token[1]);
          size = parseFloat(token[2]);
        } else if (token[3]) {
          if (current?.arabic) {
            const glyphIds: number[] = [];
            for (let index = 0; index < token[3].length; index += 4) {
              glyphIds.push(parseInt(token[3].slice(index, index + 4), 16));
            }
            const text = glyphIds.map(id => current?.toUnicode?.get(id) ?? '�').join('');
            drawn.push({kind: 'arabic', text, glyphIds, widths: glyphIds.map(id => current?.widths.get(id) ?? 0), size});
          } else {
            const bytes = Buffer.from(token[3], 'hex');
            drawn.push({
              kind: 'latin',
              text: Array.from(bytes, byte => CP1252_EXTRA[byte] ?? String.fromCharCode(byte)).join(''),
              glyphIds: [],
              widths: [],
              size,
            });
          }
        }
      }
    });
  });
  return drawn;
}
