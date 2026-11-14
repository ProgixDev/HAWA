# हिन्दी (Hindi) PDF export — font and shaping

Helvetica (WinAnsi), Cairo, DejaVu and Noto Sans SC have no Devanagari. A medical report that contains Devanagari text is
therefore drawn with an embedded **Noto Sans Devanagari** Regular + Bold (`src/services/pdfDevanagariFont.ts`, loaded only for
such reports; `medicalExportPdf.ts` → `containsDevanagari`). Every other language keeps the faces it had before; the tests
assert that no other report embeds the Devanagari face.

## Why embedding the font is not enough

Devanagari is an abugida with **conjuncts, reph, reordered vowel signs and mark positioning**:

* substitutions (GSUB): क + ् + ष → one glyph क्ष; र + ् + म → a reph mark over म; the short « ि » is drawn *before* its consonant;
* positioning (GPOS): the anusvara « ं », nukta « ़ » and the vowel signs above / below are attached to their base letter by
  **mark-positioning offsets**, not by advance width.

`pdf-lib` encodes text through fontkit's `layout()` (so it applies the substitutions) but **drops the glyph positions**, which
mispositions every mark. So the exporter shapes the text itself and draws it glyph by glyph:

1. fontkit's Indic shaper (`@pdf-lib/fontkit`, already a dependency) lays out each Devanagari run → glyph ids + `xAdvance`,
   `xOffset`, `yOffset`;
2. `drawShapedRun` writes one text matrix + one glyph id per glyph (`1 0 0 1 x y Tm <gid> Tj`), so the PDF shows exactly what the
   shaper produced;
3. the face is embedded **whole** (`subset: false`) because pdf-lib renumbers the glyphs of a subset, and the ids written by
   `drawShapedRun` are fontkit's;
4. line breaking measures words with a cached per-word advance (`shapedWidth`); the face has no kerning against the space, a test
   pins that the word-by-word sum equals the advance of the whole line.

### Runtime requirement (Hermes)

fontkit's pre-compiled Indic shaper calls the global `regeneratorRuntime`. React Native defines it only when the engine lacks
native generators, and Hermes has them, so on a phone it would be undefined and the first Hindi PDF would fail. The export
calls `ensureShapingRuntime()` (assigns `@babel/runtime/regenerator`, already a dependency) before shaping. A test deletes the
global and checks that a Hindi PDF is still produced. Jest cannot reveal this on its own: its setup always defines the global.

## Mixed text

* Devanagari letters, signs and the joiners (ZWJ / ZWNJ) → Noto Sans Devanagari.
* Latin letters, `•`, `°` (not in that face) → Helvetica.
* Characters both faces have (space, digits, punctuation) follow the Devanagari text they come after, so a Hindi sentence stays one
  shaped run; a character only the Devanagari face has (₹, danda, double danda) always goes to it, even on a wrapped line that has
  no Devanagari letter.
* A character neither face has (Cyrillic, hanzi, …) becomes the standard « […] » marker with the usual notice pointing to the
  lossless CSV export.

## The font

* License: SIL Open Font License 1.1, copy in `src/assets/fonts/NotoSansDevanagari-OFL.txt` (© 2022 The Noto Project Authors).
* Source: `notofonts/devanagari`, `NotoSansDevanagari-Regular.ttf` / `-Bold.ttf` (version 2.007).
* Subset (`fontTools.subset`, hinting removed, **all** OpenType layout features kept): the Devanagari block (128 code points), ZWJ / ZWNJ,
  space, NBSP, digits and ASCII punctuation, « – — ‘ ’ “ ” … × − ₹ ◌ ». 181 code points, about 152 KB per weight (≈ 203 KB base64,
  406 KB of JavaScript source in total; nothing is decoded unless a Hindi report is exported).
* Regenerate with `make_font_ts.py` (kept with the translation tooling): it rewrites `pdfDevanagariFont.ts` from the two `.ttf` files.

## UI screens

No font is bundled for the screens. The UI font stack is Inter / Fraunces and Android draws every glyph they lack with the system
Noto Sans Devanagari (present on stock Android and on Huawei EMUI). For Devanagari text under the Hindi language only
(`awaTypography.ts` → `devanagariAdjustment`): a numeric `lineHeight` below 1.45 x the font size is raised to it, and a non-zero
`letterSpacing` is reset to 0 (Android spaces per glyph, which would pull vowel signs away from their letter). The cycle ring
(`cycleRingLayout.ts`) uses a 1.5 x line factor and a wider width margin when its caption or phase names are Devanagari.

## Limitations

* No real Android device and no PDF viewer on a phone was used: the PDF was rendered and inspected with PyMuPDF on a desktop. See
  `hindi-manual-android-test-checklist.md` for what remains to be checked.
* Rare Devanagari extensions (Vedic accents U+1CD0–1CF9, Devanagari Extended U+A8E0–A8FF) are not embedded and would become the marker.
* Conjuncts are shaped by fontkit's Indic shaper (a port of the older Indic engine, not the Universal Shaping Engine); the regression
  tests cover every distinct word of the Hindi dictionary, the 41 pregnancy weeks and the 73 articles (no `.notdef` glyph), but a
  very rare conjunct could still be drawn as its component letters. It stays readable.
