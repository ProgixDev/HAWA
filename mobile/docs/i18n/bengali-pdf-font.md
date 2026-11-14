# বাংলা (Bengali) PDF export — font, shaping and what was measured

Helvetica (WinAnsi), Cairo, DejaVu, Noto Sans SC/JP/KR and Noto Sans Devanagari have no Bengali. A medical report that contains Bengali text
(`containsBengali`, U+0980–09FF) is drawn with an embedded **Noto Sans Bengali** Regular + Bold (`src/services/pdfBengaliFont.ts`, loaded
only for such reports). Every other report keeps the faces it had before; tests assert that no other report embeds the Bengali face and that a
Hindi report still embeds Devanagari only.

## Approach (same as Hindi, plus four fixes)

Bengali is an abugida with conjuncts (ক্ষ, জ্ঞ, ন্ধ…), ra-phala / ya-phala, reph, a reordered left vowel sign (ে ৈ ো ৌ and ি) and marks placed by
GPOS anchors. pdf-lib's own `drawText` drops the glyph positions, so the exporter does what it does for Hindi: fontkit's Indic shaper lays the
run out (`@pdf-lib/fontkit`, already a dependency), `drawShapedRun` writes one text matrix + one glyph id per glyph, the face is embedded whole
(`subset: false`) and lines are measured word by word (`shapedWidth`). `ensureShapingRuntime()` supplies `regeneratorRuntime` for Hermes.

Bengali differs from Hindi in two ways: the face has the Latin letters too (so Latin inside a Bengali sentence stays in one shaped run), and the
**danda U+0964 is the Bengali full stop** but lives in the Devanagari block — it is in the Bengali subset and routed to the Bengali face, so a
Bengali report never embeds the Devanagari face (a test pins it; a Hindi report keeps using the Devanagari face for its danda).

## Why "glyph coverage" was not enough — what the real render showed

The first Bengali PDF had every glyph (no `.notdef`) and still looked wrong: tofu where a danda was, ra-phala drawn over the next word, a detached
u-kar, i-kar of the wrong shape. The shaped output was therefore compared with **HarfBuzz** (`uharfbuzz`, same font file, script `beng`, language
`bn`; a development tool only, not an app dependency) for every distinct Bengali word of the app (4,401 words: dictionary, 73 articles, 41 pregnancy
weeks), comparing glyph outlines, advances and mark offsets, and rasterised both to PNG (PyMuPDF) to look at them.

Plain fontkit disagreed with HarfBuzz for **2,112 of 4,401 words** (48 %). Root causes, all inside fontkit (version 1.1.1 here; fontkit 2.0.4 has
the same behaviour):

| # | fontkit behaviour | HarfBuzz / OpenType | fix |
|---|---|---|---|
| 1 | `useMarkFilteringSet` is parsed but never applied | marks outside the lookup's GDEF set are skipped (≈190 of Noto Bengali's ≈400 lookups use a set) | `fontkitOpenTypeFixes.ts` (hooks `shouldIgnore`, attaches each lookup's set) |
| 2 | chaining-context backtrack glyphs matched in text order | backtrack is listed nearest-first | `fontkitOpenTypeFixes.ts` (reverses it, Bengali processors only) |
| 3 | GPOS mark-to-mark compares `ligatureComponent` with `===` (`undefined` vs `0`) | "no component" is one value | `fontkitOpenTypeFixes.ts` (normalises it before GPOS) |
| 4 | the word-initial form of a left vowel sign (`init`) is applied at every syllable start | only at a word start | `guardBengaliSyllables` in `medicalExportPdf.ts` (a ZWNJ — a ZWJ after ং ঃ ঁ — in front of each later syllable; shapes to an empty zero-advance glyph) |

Result with all four: **4,400 of 4,401 words identical to HarfBuzz** (glyph id, advance, x/y offset) in both Regular and Bold; the one exception is
উন্মুক্ত (a u-kar mark 172 units from where HarfBuzz puts it). The visual comparison of the previously broken words (বন্ধ, কেন্দ্রে, ট্র্যাকিং,
ট্রু, স্ক্রিনিং, হৃৎপিণ্ড, ভ্রূণ, গ্রুপ, পদ্ধতি…) matches the HarfBuzz render.

The fixes touch Bengali faces only: they are flagged on the Bengali font's own processors and lookups, so the Hindi face is byte-for-byte as before
(a test compares the Devanagari layout before and after). **Hindi has not been measured against HarfBuzz** — it may carry the same gaps; see the
follow-up in `docs/maps-localization.md` / the final report.

Tests (`src/services/__tests__/medicalExportBengaliLayout.test.ts`): HarfBuzz golden data for 48 words × Regular/Bold
(`fixtures/bengaliHarfBuzzGolden.json`), a mutation guard (without the fixes more than a third of those words differ), PDF read-back of glyph ids and
offsets, page bounds, wrapping (including a very long unspaced token, broken only between syllables), Hermes without `regeneratorRuntime`, CSV round trip.

## Mixed text and wrapping

* Bengali letters, signs, ZWJ/ZWNJ and the danda → Noto Sans Bengali. Latin letters, `•`, `°`, digits and punctuation the face also has follow the
  run they come after; a character neither face has (Cyrillic, hanzi…) becomes the usual « […] » marker with the notice pointing to the CSV export.
* A single token longer than a line is broken only between orthographic units: a consonant keeps its vowel signs and a hasanta keeps the letter it joins.

## The font

* License: SIL Open Font License 1.1, copy in `src/assets/fonts/NotoSansBengali-OFL.txt` (© 2022 The Noto Project Authors).
* Source: Google Fonts `ofl/notosansbengali` variable font (`wght` 100–900, `wdth` 62.5–100), `https://github.com/notofonts/bengali`.
* Cut (fontTools `instancer` to wght 400 / 700, wdth 100, then `subset`): the Bengali block U+0980–09FF, the danda/double danda U+0964–0965, ZWJ/ZWNJ,
  the dotted circle, NBSP, ASCII, Latin-1 letters and the punctuation AWA uses; hinting removed; **all** layout features and the whole GDEF kept
  (the Indic shaper needs rphf, pref, blwf, pstf, half, akhn, cjct, pres, abvs, blws, psts, haln, mark, mkmk, abvm, blwm, dist…). 272 code points,
  564 glyphs, 111,684 B (Regular) / 112,068 B (Bold); the module is 299,563 characters of base64 source. Nothing is decoded unless a Bengali report
  is exported; the APK grows by about 0.3 MB of JavaScript.
* Regenerate: put the variable `.ttf` next to `build_font.py`, run `python -I build_font.py out`, then `node make_module.js` (they are kept with the
  translation tooling in the session scratchpad; the recipe is the paragraph above). Re-run the HarfBuzz comparison before shipping a new cut.

## UI screens

No font is bundled for the screens: Android draws Bengali with the system Noto Sans Bengali. For Bengali text under the Bengali language only
(`awaTypography.ts` → `bengaliAdjustment`, same rule as Devanagari) a numeric `lineHeight` below 1.45 × the font size is raised to it and a non-zero
`letterSpacing` is reset to 0. The cycle ring (`cycleRingLayout.ts`) has its own fitted Bengali advance model (letter 0.681 em, letter after a
hasanta 0.127 em, vowel sign 0.312 em, hasanta/nukta/chandrabindu 0; within −9 % / +6.5 % of the shaped width on the real phase labels), a 1.5 ×
line factor and a 1.12 width margin.

## Not verifiable without a device

Rendering by the real PDF viewers on Android (Google PDF Viewer, Samsung, Huawei Petal), the system font on the phone (weights, EMUI differences) and
copy-paste/search of Bengali text out of the PDF (not checked: the pages are drawn glyph by glyph from glyph ids, so selecting or searching Bengali
text in the viewer may not return Bengali — the CSV export is the lossless alternative, as for Hindi).
