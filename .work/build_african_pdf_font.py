import base64
import io
from pathlib import Path

import matplotlib
from fontTools import subset
from fontTools.ttLib import TTFont


ROOT = Path(r"D:\HAWA")
FONT_DIR = Path(matplotlib.get_data_path()) / "fonts" / "ttf"
OUTPUT = ROOT / "mobile" / "src" / "services" / "pdfAfricanLatinFont.ts"

UNICODES = set()
for start, end in (
    (0x0020, 0x007E),
    (0x00A0, 0x00FF),
    (0x0100, 0x017F),
    (0x0180, 0x024F),
    (0x0250, 0x02AF),
    (0x02B0, 0x02FF),
    (0x0300, 0x036F),
    (0x1E00, 0x1EFF),
    (0x2000, 0x206F),
    (0x20A0, 0x20CF),
):
    UNICODES.update(range(start, end + 1))


def make_subset(filename):
    font = TTFont(FONT_DIR / filename)
    options = subset.Options()
    options.hinting = False
    options.layout_features = ["*"]
    options.glyph_names = True
    options.recommended_glyphs = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=sorted(UNICODES))
    subsetter.subset(font)
    if "glyf" in font:
        font["glyf"].padding = 4
    data = io.BytesIO()
    font.save(data)
    return base64.b64encode(data.getvalue()).decode("ascii")


def declaration(name, value):
    chunks = [value[index : index + 100] for index in range(0, len(value), 100)]
    lines = [f"export const {name} ="]
    lines.extend(f"  '{chunk}' +" for chunk in chunks[:-1])
    lines.append(f"  '{chunks[-1]}';")
    return "\n".join(lines)


regular = make_subset("DejaVuSans.ttf")
bold = make_subset("DejaVuSans-Bold.ttf")
header = """// GENERATED FILE - do not edit by hand.
//
// DejaVu Sans Regular and Bold (license: src/assets/fonts/DejaVu-LICENSE.txt),
// subset for AWA's African Latin-script PDF reports: ASCII, Latin-1,
// Latin Extended-A/B, IPA Extensions, spacing modifiers, combining marks,
// Latin Extended Additional, general punctuation, and currency symbols.
// Hinting is removed; OpenType layout features are preserved; glyf records use
// four-byte padding for Android PDF/font parsers. Embedded offline as base64.
"""
OUTPUT.write_text(
    header
    + "\n"
    + declaration("DEJAVU_AFRICAN_LATIN_REGULAR_SUBSET_BASE64", regular)
    + "\n\n"
    + declaration("DEJAVU_AFRICAN_LATIN_BOLD_SUBSET_BASE64", bold)
    + "\n",
    encoding="utf-8",
)
print(f"wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
