# Simplified Chinese PDF export — font

Helvetica (WinAnsi), Cairo and DejaVu have no hanzi, so a medical report that contains CJK text is drawn entirely with
an embedded **Noto Sans SC** Regular + Bold subset (`src/services/pdfChineseFont.ts`, loaded only for such reports;
`medicalExportPdf.ts` → `containsChinese`). Every other language keeps the faces it had before.

* License: SIL Open Font License 1.1, copy in `src/assets/fonts/NotoSansSC-OFL.txt` (© 2014-2021 Adobe).
* Source: the Google Fonts variable release `NotoSansSC[wght].ttf` (googlefonts/fonts, ofl/notosanssc).
* Cut: static instances at wght 400 and 700 (`fontTools.varLib.instancer`), then subset (`fontTools.subset`,
  hinting removed, features kern/ccmp/locl/mark/mkmk, name table rewritten to `NotoSansSC-Regular` /
  `NotoSansSC-Bold`).
* Character set (4,286 code points): Basic Latin, Latin-1, Latin Extended-A, general/CJK punctuation, fullwidth forms,
  the 3,755 GB2312 level-1 hanzi, and every character used by `locales/zh.ts`. Each subset is about 1.17 MB
  (≈ 1.56 MB base64), i.e. about 3.1 MB of JavaScript source (Hermes bytecode strings; nothing is decoded unless a
  Chinese report is exported).
* A hanzi outside the set (rare characters, extension B) is not drawn: it becomes the standard «[…]» marker and the
  report carries the usual notice pointing to the lossless CSV export.
* Limitations: in a Chinese report, Cyrillic text (a Russian note typed by the user) is not drawable by Noto Sans SC
  and is replaced by the marker; Arabic still goes to Cairo.
* Line breaking: a Chinese paragraph without spaces is broken per character at the margin, with kinsoku rules: a
  closing mark (，。、；：？！）”’】》…) is never left at the start of a line and an opening bracket or quote is never left
  at the end of one (the previous character travels with it). The rules apply only to tokens that contain hanzi, so
  every other language wraps exactly as before.
* Coverage is tested: every hanzi and fullwidth mark of `zh.ts` and of the 41 pregnancy weeks is drawn without the
  marker (`medicalExportChineseLayout.test.ts`). Rare hanzi outside GB2312 level 1 (about 3,000 level-2 characters, for
  example in proper names) are not embedded; adding them costs about 1 MB per weight.

Regenerate: place `NotoSansSC[wght].ttf` next to a copy of the script below, run it, then base64-encode the two output
files into `pdfChineseFont.ts` (`NOTO_SANS_SC_REGULAR_SUBSET_BASE64`, `NOTO_SANS_SC_BOLD_SUBSET_BASE64`).

```python
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
# cps = GB2312 level-1 hanzi + characters of locales/zh.ts + Latin / punctuation / fullwidth ranges
font = instancer.instantiateVariableFont(TTFont('NotoSansSC[wght].ttf'), {'wght': 400})
opts = subset.Options(); opts.hinting = False; opts.layout_features = ['kern', 'ccmp', 'locl', 'mark', 'mkmk']
s = subset.Subsetter(opts); s.populate(unicodes=sorted(cps)); s.subset(font); font.save('NotoSansSC-Regular-sub.ttf')
```
