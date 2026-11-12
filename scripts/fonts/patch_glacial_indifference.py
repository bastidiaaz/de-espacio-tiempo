"""Add the Spanish glyphs Glacial Indifference lacks and export WOFF2.

Glacial Indifference v1.01 (OFL 1.1, no Reserved Font Name) ships without
¿ ¡ « » ·. They are built from the font's own outlines so they match:

- ¿ ¡  question / exclam rotated 180°, top at the x-height.
- ·    period raised to the middle of the x-height.
- « »  chevrons drawn with the font's stem (hyphen thickness) and the
       slope of `<`; skewed by the italic angle in the italic.

Usage (needs `pip install fonttools brotli`):
    python scripts/fonts/patch_glacial_indifference.py <dir with the .otf> public/fonts/glacial-indifference
"""

import math
import sys
from pathlib import Path

from fontTools.pens.areaPen import AreaPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

STYLES = ("Regular", "Bold", "Italic")


def bounds(glyph_set, name):
    pen = BoundsPen(glyph_set)
    glyph_set[name].draw(pen)
    return pen.bounds  # xMin, yMin, xMax, yMax


def measured_slant(glyph_set):
    """dx/dy of the stem of `l`. The italic declares post.italicAngle = 0, so measure it."""
    pen = RecordingPen()
    glyph_set["l"].draw(pen)
    (x0, y0), = pen.value[0][1]
    (x1, y1), = pen.value[1][1]
    return (x1 - x0) / (y1 - y0)


def outer_is_positive(glyph_set):
    """Sign of the area of a simple outer contour in this font."""
    pen = AreaPen(glyph_set)
    glyph_set["period"].draw(pen)
    return pen.value > 0


def add_glyph(font, name, codepoint, width, draw):
    top = font["CFF "].cff.topDictIndex[0]
    glyph_set = font.getGlyphSet()
    # A CFF charstring stores its width as the difference from nominalWidthX, not the advance.
    # Chrome on Windows reads it from there rather than from hmtx: a raw advance shows up as a gap.
    pen = T2CharStringPen(width - top.Private.nominalWidthX, glyph_set)
    draw(pen, glyph_set)
    charstring = pen.getCharString(private=top.Private, globalSubrs=font["CFF "].cff.GlobalSubrs)
    char_strings = top.CharStrings
    char_strings.charStringsIndex.append(charstring)
    char_strings.charStrings[name] = len(char_strings.charStringsIndex) - 1
    order = font.getGlyphOrder()
    # In fontTools the CFF charset may be the very list the font uses as glyph order.
    if name not in top.charset:
        top.charset.append(name)
    if name not in order:
        font.setGlyphOrder(order + [name])

    box = charstring.calcBounds(char_strings)
    font["hmtx"][name] = (width, round(box[0]) if box else 0)
    for table in font["cmap"].tables:
        if table.isUnicode():
            table.cmap[codepoint] = name


def rotated(font, src, name, codepoint, x_height, slant):
    """`src` turned 180° so its baseline lands on the x-height.

    In the italic the turn happens in unslanted space (unskew, rotate, reskew),
    which adds x_height * slant to x; otherwise the glyph leans out to the left.
    """
    width = font["hmtx"][src][0]
    # (x, y) -> (width + x_height * slant - x, x_height - y)
    transform = (-1, 0, 0, -1, width + x_height * slant, x_height)

    def draw(pen, glyph_set):
        glyph_set[src].draw(TransformPen(pen, transform))

    add_glyph(font, name, codepoint, width, draw)


def raised(font, src, name, codepoint, target_center, slant):
    width = font["hmtx"][src][0]
    glyph_set = font.getGlyphSet()
    _, y0, _, y1 = bounds(glyph_set, src)
    dy = target_center - (y0 + y1) / 2

    def draw(pen, gs):
        gs[src].draw(TransformPen(pen, (1, 0, 0, 1, dy * slant, dy)))

    add_glyph(font, name, codepoint, width, draw)


def guillemet(font, name, codepoint, pointing_left, x_height, stem, slant, positive):
    glyph_set = font.getGlyphSet()
    lx0, ly0, lx1, ly1 = bounds(glyph_set, "less")
    run_over_rise = (lx1 - lx0) / (ly1 - ly0)  # slope of `<`

    half = 0.33 * x_height  # each chevron is ~2/3 of the x-height tall
    run = half * 2 * run_over_rise
    # horizontal thickness that gives `stem` measured perpendicular to the arm
    thick = stem * math.hypot(run, half) / half
    side = font["hmtx"]["period"][1]
    gap = 0.55 * thick
    mid = x_height / 2

    def chevron(x0):
        # pointing left: tip at (x0, mid)
        pts = [
            (x0, mid),
            (x0 + run, mid + half),
            (x0 + run + thick, mid + half),
            (x0 + thick, mid),
            (x0 + run + thick, mid - half),
            (x0 + run, mid - half),
        ]
        if not pointing_left:
            right = x0 + run + thick
            pts = [(x0 + right - x, y) for x, y in pts]
        return [(x + (y * slant), y) for x, y in pts]

    first = side
    second = side + thick + gap
    width = round(second + run + thick + side)

    def contour_area(pts):
        return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(pts, pts[1:] + pts[:1])) / 2

    def draw(pen, _gs):
        for x0 in (first, second):
            pts = [(round(x), round(y)) for x, y in chevron(x0)]
            if (contour_area(pts) > 0) != positive:
                pts.reverse()
            pen.moveTo(pts[0])
            for p in pts[1:]:
                pen.lineTo(p)
            pen.closePath()

    add_glyph(font, name, codepoint, width, draw)


def patch(otf_path, out_path):
    font = TTFont(otf_path)
    glyph_set = font.getGlyphSet()
    x_height = font["OS/2"].sxHeight
    slant = measured_slant(glyph_set)
    _, h0, _, h1 = bounds(glyph_set, "hyphen")
    stem = h1 - h0
    positive = outer_is_positive(glyph_set)

    rotated(font, "question", "questiondown", 0xBF, x_height, slant)
    rotated(font, "exclam", "exclamdown", 0xA1, x_height, slant)
    raised(font, "period", "periodcentered", 0xB7, x_height / 2, slant)
    guillemet(font, "guillemotleft", 0xAB, True, x_height, stem, slant, positive)
    guillemet(font, "guillemotright", 0xBB, False, x_height, stem, slant, positive)

    font.flavor = "woff2"
    font.save(out_path)


def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    for style in STYLES:
        name = f"GlacialIndifference-{style}"
        patch(src / f"{name}.otf", out / f"{name}.woff2")
        print(f"{name}.woff2")


if __name__ == "__main__":
    main()
