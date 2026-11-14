# Korean PDF export — font

Helvetica (WinAnsi), Cairo and DejaVu have no Hangul, and neither the Noto Sans SC subset (Simplified Chinese) nor the Noto Sans JP subset (Japanese) carries the Hangul syllables
(both are cut for Han / kana). A Korean medical report that contains Hangul is therefore drawn entirely with an embedded **Noto Sans KR** Regular + Bold subset
(`src/services/pdfKoreanFont.ts`, loaded only for such reports). `medicalExportPdf.ts` detects Hangul in the CJK detector (`containsChinese` now also matches the Hangul syllables
U+AC00–D7AF and the compatibility jamo U+3130–318F) and chooses the face by the **app language** (`i18n.language` starting with `ko`), exactly as it already chooses between Noto Sans SC
and Noto Sans JP. Every other language keeps the faces it had before.

* License: SIL Open Font License 1.1, copy in `src/assets/fonts/NotoSansKR-OFL.txt` (© 2014-2021 Adobe).
* Source: the Google Fonts variable release `NotoSansKR[wght].ttf` (google/fonts, `ofl/notosanskr`, 10.4 MB — never shipped as is).
* Cut: static instances at wght 400 and 700 (`fontTools.varLib.instancer`), then subset (`fontTools.subset`, hinting removed, features kern / ccmp / locl / mark / mkmk, name table rewritten to
  `NotoSansKR-Regular` / `NotoSansKR-Bold`).
* Character set (3,785 code points, 3,174 glyphs): Basic Latin, Latin-1, Latin Extended-A (the font has only part of it — **not** the Turkish letters ğ Ğ ş Ş ı İ), general and CJK punctuation, arrows, math
  and shape symbols, the Hangul compatibility jamo block, full-width forms, the **2,350 KS X 1001 Hangul syllables** (the syllables in everyday use) and every character used by
  `locales/ko.ts`, the 41 pregnancy weeks, the articles and the legal pages (all of them are inside KS X 1001: 0 outside). Each subset is about 520 KB (≈ 0.69 MB base64), i.e. about 1.4 MB of
  JavaScript source in total (a Hermes bytecode string; nothing is decoded unless a Korean report with Hangul is exported). No 11,172-syllable full set is shipped: it would cost roughly 3× more.
* A syllable outside the set (a rare personal name typed by the user) is not drawn: it becomes the standard « […] » marker and the report carries the usual notice pointing to the lossless CSV export.
* Limitations: in a Korean report, Cyrillic text typed by the user is replaced by the marker and the Turkish letters ğ Ğ ş Ş ı İ also are (the Korean face has none of them); Arabic still goes to Cairo.
  Hanja are not in the set (the interface never uses them).
* Line breaking: Korean separates words with spaces, so the normal word wrap applies; an unbroken token wider than the line is broken per character (same code path as Chinese/Japanese). The CJK
  kinsoku rules are limited to the punctuation Korean shares with them and do not affect Hangul.
* Coverage is tested: every Hangul syllable of `ko.ts` and of the 41 pregnancy weeks is drawn without the marker (`medicalExportKoreanLayout.test.ts`); Chinese, Japanese, Russian, Hindi and French reports are
  verified to keep their own faces.
* CSV: UTF-8 with the same `;` delimiter; the Korean headers come from `export.csv.*` in `ko.ts` (tested lossless).

Regenerate: download `NotoSansKR[wght].ttf` and `OFL.txt` from `https://github.com/google/fonts/tree/main/ofl/notosanskr`, run the script below, then base64-encode the two output
files into `pdfKoreanFont.ts` (`NOTO_SANS_KR_REGULAR_SUBSET_BASE64`, `NOTO_SANS_KR_BOLD_SUBSET_BASE64`).

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
# cps = Latin / punctuation / compatibility jamo / fullwidth ranges + KS X 1001 Hangul (EUC-KR rows 0xB0A1..0xC8FE, decoded with 'euc_kr') + characters of locales/ko.ts, the pregnancy weeks, the articles
font = instancer.instantiateVariableFont(TTFont('NotoSansKR[wght].ttf'), {'wght': 400})
opts = subset.Options(); opts.hinting = False; opts.layout_features = ['kern', 'ccmp', 'locl', 'mark', 'mkmk']
s = subset.Subsetter(opts); s.populate(unicodes=sorted(cps)); s.subset(font); font.save('NotoSansKR-Regular-sub.ttf')
```
