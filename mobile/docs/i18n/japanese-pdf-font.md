# Japanese PDF export — font

Helvetica (WinAnsi), Cairo and DejaVu have no kana or kanji, and the existing Noto Sans SC subset (Simplified Chinese) is **not** a Japanese font: it is cut for the 3,755 GB2312
hanzi, contains **no hiragana or katakana at all** (0 of the 176 kana, measured on the embedded subset) and draws the shared kanji with their **Chinese glyph forms** (骨, 直, 角, 令 …). A Japanese medical report that contains CJK text is therefore
drawn entirely with an embedded **Noto Sans JP** Regular + Bold subset (`src/services/pdfJapaneseFont.ts`, loaded only for such reports). `medicalExportPdf.ts` chooses the face by the
**app language** (`i18n.language` starting with `ja`), so a Chinese report keeps Noto Sans SC, a report made only of kanji in Japanese still gets the Japanese forms, and every other
language keeps the faces it had before.

* License: SIL Open Font License 1.1, copy in `src/assets/fonts/NotoSansJP-OFL.txt` (© 2014-2021 Adobe).
* Source: the Google Fonts variable release `NotoSansJP[wght].ttf` (googlefonts/fonts, `ofl/notosansjp`, 9.6 MB — never shipped as is).
* Cut: static instances at wght 400 and 700 (`fontTools.varLib.instancer`), then subset (`fontTools.subset`, hinting removed, features kern / ccmp / locl / mark / mkmk, name table rewritten to
  `NotoSansJP-Regular` / `NotoSansJP-Bold`).
* Character set (4,478 code points, 3,923 glyphs): Basic Latin, Latin-1, Latin Extended-A (the font itself has only ĀāĒēĪīŌōŪū of it, **not** the Turkish letters ğ Ğ ş Ş ı İ), general and CJK
  punctuation, arrows, math and shape symbols, the **complete hiragana and katakana blocks**, full-width forms, the **2,965 JIS X 0208 level-1 kanji** (everyday kanji) and every character used by
  `locales/ja.ts`, the 41 pregnancy weeks, the articles and the legal pages (10 of them are outside level 1: 哺 沐 璧 瞑 胚 胱 腟 膀 蕾 頸; the Chinese endonym 简 of the language selector is requested too but is not in Noto Sans JP, so it is never drawn). Each subset is about 1.03 MB
  (≈ 1.38 MB base64), i.e. about 2.76 MB of JavaScript source in total (a Hermes bytecode string; nothing is decoded unless a Japanese report with CJK text is exported).
* A kanji outside the set (JIS level 2 — names and rare words, extension B) is not drawn: it becomes the standard « […] » marker and the report carries the usual notice pointing to the
  lossless CSV export. Adding JIS level 2 (about 3,390 kanji) would cost roughly another 1 MB per weight.
* Limitations: in a Japanese report, Cyrillic text typed by the user is replaced by the marker and the Turkish letters ğ Ğ ş Ş ı İ also are (the Japanese face has none of them); Arabic still goes
  to Cairo.
* Line breaking: Japanese has no spaces, so a paragraph is broken per character at the margin, with kinsoku rules: a closing mark (、。，．！？）」』】…), the long-vowel mark ー, the wave dash 〜, the middle dot ・,
  iteration marks and **small kana** (ぁぃぅぇぉっゃゅょゎ ァィゥェォッャュョヮヵヶ) never start a line, and an opening bracket or quote (（「『【〈《［｛〔) never ends one (the previous character travels with it). The rules apply
  only to tokens that contain CJK characters, so every other language wraps exactly as before.
* Coverage is tested: every kanji, kana and full-width mark of `ja.ts` and of the 41 pregnancy weeks is drawn without the marker (`medicalExportJapaneseLayout.test.ts`).
* CSV: UTF-8 with the same `;` delimiter; the Japanese headers come from `export.csv.*` in `ja.ts` (tested lossless).

Regenerate: place `NotoSansJP[wght].ttf` next to a copy of the script below, run it, then base64-encode the two output files into `pdfJapaneseFont.ts`
(`NOTO_SANS_JP_REGULAR_SUBSET_BASE64`, `NOTO_SANS_JP_BOLD_SUBSET_BASE64`).

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
# cps = Latin / punctuation / kana / fullwidth ranges + JIS X 0208 level-1 kanji (Shift-JIS 0x889F..0x9872) + characters of locales/ja.ts, the pregnancy weeks, the articles
font = instancer.instantiateVariableFont(TTFont('NotoSansJP[wght].ttf'), {'wght': 400})
opts = subset.Options(); opts.hinting = False; opts.layout_features = ['kern', 'ccmp', 'locl', 'mark', 'mkmk']
s = subset.Subsetter(opts); s.populate(unicodes=sorted(cps)); s.subset(font); font.save('NotoSansJP-Regular-sub.ttf')
```
