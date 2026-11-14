# Traditional Chinese (zh-Hant) PDF export — font

The Simplified Chinese subset (`pdfChineseFont.ts`, Noto Sans SC) is cut for the GB2312 hanzi and the characters of `zh.ts`, so it lacks most traditional forms.
A report written in `zh-Hant` that contains CJK text is therefore drawn with an embedded **Noto Sans TC** Regular + Bold subset (`src/services/pdfTraditionalChineseFont.ts`).
`medicalExportPdf.ts` picks it when `i18n.language` starts with `zh-hant`; Simplified Chinese, Japanese and Korean keep their own faces.

* License: SIL OFL 1.1 (`src/assets/fonts/NotoSansTC-OFL.txt`, same Adobe notice as the SC copy).
* Source: Google Fonts variable release `NotoSansTC[wght].ttf` (googlefonts/fonts, `ofl/notosanstc`). Static instances at wght 400 / 700 (`fontTools.varLib.instancer`), subset with
  `fontTools.subset` (hinting removed, features kern / ccmp / locl / mark / mkmk).
* Character set (6,748 code points requested, 6,135 present, ~1.95 MB per weight): Basic Latin, Latin-1, Latin Extended-A, general / CJK punctuation (「」『』 included), arrows,
  math, shapes, full-width forms, the 5,401 **Big5 level-1** hanzi, and every character of `locales/zhHant.ts`, the `'zh-Hant'` blocks of the 73 articles and 41 pregnancy weeks, the legal pages
  and the image descriptions. Measured gaps: 简 (the Simplified endonym), ✦ ✨ and the non-Chinese scripts of the other language names — none is drawn in a report.
* A hanzi outside the set becomes the usual « […] » marker and the report carries the notice pointing to the lossless CSV export.
* CSV: UTF-8, headers from `export.csv.*` in `zhHant.ts`.
* Not verified on a device: layout of a real exported PDF (no PDF was generated in this change).

Regenerate with the same recipe as `japanese-pdf-font.md` (instancer + subsetter), charset = Big5 level 1 + the characters used by the zh-Hant content.

**Glyph-record padding (important).** The subset is saved with `font['glyf'].padding = 4`. pdf-lib's fontkit re-subsetting (`embedFont(..., {subset: true})`) copies glyph records
byte-for-byte; when the records are not 4-byte aligned (fontTools' default) many outlines are lost: the text layer is intact but the characters are drawn blank (verified by
rendering with MuPDF and PDFium). The existing Simplified, Japanese and Korean subsets are not padded and show the same symptom.
