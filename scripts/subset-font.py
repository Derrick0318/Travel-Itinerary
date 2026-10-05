"""Rebuild assets/fonts/title.woff2: Noto Serif SC Bold trimmed to the characters the site uses.

Run after changing any text:  python scripts/subset-font.py path/to/NotoSerifSC[wght].ttf
Source font: https://github.com/google/fonts/tree/main/ofl/notoserifsc (SIL OFL, see assets/fonts/OFL.txt)
Needs: pip install fonttools brotli
"""
import pathlib, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
text = "".join(p.read_text(encoding="utf-8") for p in [root / "index.html", root / "js/data.js", root / "js/app.js"])
chars = sorted({c for c in text if ord(c) > 0x2E7F} | {chr(c) for c in range(0x20, 0x7F)} | set("°·–→←’“”"))

font = instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 700})
opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = ["kern", "liga", "tnum", "palt"]
sub = subset.Subsetter(opts); sub.populate(text="".join(chars)); sub.subset(font)
out = root / "assets/fonts/title.woff2"
font.flavor = "woff2"; font.save(out)
print(f"{len(chars)} chars -> {out} ({out.stat().st_size // 1024} KB)")
