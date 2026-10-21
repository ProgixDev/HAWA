// Run-time fixes for four places where @pdf-lib/fontkit (the shaper behind the Bengali PDF export, see medicalExportPdf.ts) does not do what
// OpenType and HarfBuzz do. Noto Sans Bengali depends on all four: without them about 12% of the distinct Bengali words of AWA are drawn with a
// wrong glyph variant or a misplaced mark (ra-phala, u-kar, i-kar, conjunct parts); with them 4,400 of 4,401 words are glyph-for-glyph,
// advance-for-advance and offset-for-offset identical to HarfBuzz (docs/i18n/bengali-pdf-font.md describes the measurement).
//
//  1. Mark filtering sets. A lookup with the UseMarkFilteringSet flag must skip every mark that is not in its GDEF set. fontkit parses the set
//     but never applies it, so marks stay in the way of every context match. (~190 of Noto Bengali's ~400 lookups use one.)
//  2. Backtrack order. A chaining context lists its backtrack glyphs nearest-first; fontkit matches them as if they were in text order, so
//     any rule with two or more backtrack glyphs never matches.
//  3. Ligature component. GPOS mark-to-mark attachment compares ligatureComponent with ===, and fontkit leaves it undefined on some glyphs and
//     0 on others for the same meaning (no component), so two marks of one conjunct are not attached to each other.
//  4. (In medicalExportPdf.ts: guardBengaliSyllables) the initial form of a left vowel sign is applied to every syllable, not to word starts.
//
// The fixes touch ONLY the faces they are applied to (a flag on the font's own processors / lookups), never another script's face: Hindi
// (Devanagari) is deliberately left exactly as it was. The two prototype-level hooks are installed once and are inert for any other face.

type GlyphLike = {id: number; isMark?: boolean; ligatureComponent?: number | null};
type CoverageLike = {version: number; glyphs?: number[]; rangeRecords?: Array<{start: number; end: number}>};
type LookupLike = {flags: {flags: Record<string, unknown>}; markFilteringSet?: number};
type LookupListLike = {get: (index: number) => LookupLike; length: number};
type IteratorLike = {flags: {markSet?: Set<number>}; shouldIgnore: (glyph: GlyphLike) => boolean};
type ProcessorLike = {
  glyphIterator?: IteratorLike;
  applyFeatures: (features: unknown, glyphs: GlyphLike[], positions: unknown) => unknown;
  __reverseBacktrack?: boolean;
  __ligatureComponentFixed?: boolean;
};
type OpenTypeProto = {
  match: (this: ProcessorLike, index: number, sequence: unknown[], fn: unknown, matched?: unknown) => unknown;
  __backtrackFix?: boolean;
};
type IteratorProto = {shouldIgnore: (this: IteratorLike, glyph: GlyphLike) => boolean; __markSetFix?: boolean};

/** The pieces of a fontkit font this module reaches into (all private API, pinned by the glyph-parity tests). */
export type FixableFont = {
  layout: (text: string) => unknown;
  GDEF?: {markGlyphSetsDef?: {coverage: CoverageLike[]}};
  GSUB?: {lookupList: LookupListLike};
  GPOS?: {lookupList: LookupListLike};
  _layoutEngine: {engine: {GSUBProcessor?: ProcessorLike; GPOSProcessor?: ProcessorLike}};
};

const coverageSet = (coverage: CoverageLike): Set<number> => {
  const ids = new Set<number>();
  if (coverage.version === 1) {
    (coverage.glyphs ?? []).forEach(id => ids.add(id));
  } else {
    (coverage.rangeRecords ?? []).forEach(range => {
      for (let id = range.start; id <= range.end; id += 1) {
        ids.add(id);
      }
    });
  }
  return ids;
};

/** Makes `font` shape like HarfBuzz for the cases above. Safe to call more than once per font. */
export function applyFontkitOpenTypeFixes(font: FixableFont): void {
  font.layout('ক'); // fontkit builds its processors and glyph iterator lazily
  const {GSUBProcessor, GPOSProcessor} = font._layoutEngine.engine;
  if (!GSUBProcessor || GSUBProcessor.__reverseBacktrack) {
    return;
  }

  // 1. mark filtering sets (hook on the shared iterator class; inert unless a lookup carries a `markSet`)
  const iteratorProto = Object.getPrototypeOf(GSUBProcessor.glyphIterator) as IteratorProto;
  if (!iteratorProto.__markSetFix) {
    iteratorProto.__markSetFix = true;
    const original = iteratorProto.shouldIgnore;
    iteratorProto.shouldIgnore = function shouldIgnore(this: IteratorLike, glyph: GlyphLike): boolean {
      const set = this.flags.markSet;
      return original.call(this, glyph) || (set !== undefined && glyph.isMark === true && !set.has(glyph.id));
    };
  }
  const sets = new Map<number, Set<number>>();
  [font.GSUB, font.GPOS].forEach(table => {
    if (!table) {
      return;
    }
    const list = table.lookupList;
    const get = list.get;
    list.get = function getLookup(this: LookupListLike, index: number): LookupLike {
      const lookup = get.call(this, index);
      const flags = lookup.flags.flags;
      if (flags.useMarkFilteringSet && flags.markSet === undefined && lookup.markFilteringSet !== undefined) {
        const setIndex = lookup.markFilteringSet;
        if (!sets.has(setIndex)) {
          const coverage = font.GDEF?.markGlyphSetsDef?.coverage[setIndex];
          sets.set(setIndex, coverage ? coverageSet(coverage) : new Set<number>());
        }
        flags.markSet = sets.get(setIndex);
      }
      return lookup;
    };
  });

  // 2. backtrack order (hook on the shared OpenType processor class; only for processors flagged below)
  const processorProto = Object.getPrototypeOf(Object.getPrototypeOf(GSUBProcessor)) as OpenTypeProto;
  if (!processorProto.__backtrackFix) {
    processorProto.__backtrackFix = true;
    const originalMatch = processorProto.match;
    processorProto.match = function match(this: ProcessorLike, index: number, sequence: unknown[], fn: unknown, matched?: unknown): unknown {
      return originalMatch.call(this, index, index < 0 && this.__reverseBacktrack ? sequence.slice().reverse() : sequence, fn, matched);
    };
  }
  GSUBProcessor.__reverseBacktrack = true;
  if (GPOSProcessor) {
    GPOSProcessor.__reverseBacktrack = true;

    // 3. ligature component: "none" is undefined on some glyphs and 0 on others
    if (!GPOSProcessor.__ligatureComponentFixed) {
      GPOSProcessor.__ligatureComponentFixed = true;
      const applyFeatures = GPOSProcessor.applyFeatures.bind(GPOSProcessor);
      GPOSProcessor.applyFeatures = (features, glyphs, positions) => {
        glyphs.forEach(glyph => {
          if (!glyph.ligatureComponent) {
            glyph.ligatureComponent = undefined;
          }
        });
        return applyFeatures(features, glyphs, positions);
      };
    }
  }
}
