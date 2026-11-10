"""Strip status wording from the framework figure (page Figure 1).

Dashed boxes and the legend ("Demonstrated / Proposed") already mark what is proposed, so per-box
notes such as "Proposed; not evaluated" are removed, and labels and panel subtitles lose their
"proposed" wording. In the exported SVG every label is outlined glyphs in one group,
    <g fill=".." transform="matrix(s 0 0 -s x y)"><title>text</title><use .../>...</g>
so labels are deleted, or retyped from their own glyphs, matched by their title.

Usage:
    python tools/clean_framework_svg.py <exported.svg> static/images/framework.svg
"""
import difflib
import html
import re
import statistics
import sys
from collections import defaultdict

# Labels removed outright
DELETE = {
    "(theory only)",
    "Design target; not performed",
    "PROPOSED · not executed here",
    "Proposed; not evaluated",
    "Physical reconciliation: proposed",
    "ResponseSet: computational analogue only",
}

# Labels retyped without their status words. A letter whose case changes is taken from the same
# label or from another label set in the same font.
EDIT = {
    "Proposed / not evaluated": "Proposed",
    "Extra policy checks: proposed": "Extra policy checks",
    "Verified tool computation (linear layers only)": "Verified tool computation",
    "Proposed isolation: buffered I/O, private memory and KV-cache invalidation":
        "Isolation: buffered I/O, private memory and KV-cache invalidation",
    "Proposed closed loop: evidence feedback, recovery and long-running operation":
        "Closed loop: evidence feedback, recovery and long-running operation",
    "A decision-faithful and recoverable core spanning verified computation, agent decisions and proposed physical execution.":
        "A decision-faithful and recoverable core spanning verified computation, agent decisions and physical execution.",
    "Linear predictor layers demonstrated; other operators remain proposed.  [I.4–I.5]":
        "Linear predictor layers demonstrated.  [I.4–I.5]",
    "Three recovery conditions; actions held until certification. Speculative overlap is proposed.":
        "Three recovery conditions; actions held until certification.",
    "Digital recovery demonstrated; physical reconciliation remains proposed.  [I.2; I.5–I.7]":
        "Digital recovery demonstrated.  [I.2; I.5–I.7]",
    "Demonstrated starting points and proposed extensions for sustained operation.":
        "Demonstrated starting points and extensions for sustained operation.",
}

LABEL = re.compile(r'<g ([^>]*)><title>([^<]*)</title>((?:<use [^>]*/>)*)</g>')
MATRIX = re.compile(r'matrix\(([-\d.]+) 0 0 (-?[\d.]+) ([-\d.]+) ([-\d.]+)\)')
USE = re.compile(r'<use [^>]*/>')
USE_X = re.compile(r' x="([-\d.]+)"')
USE_Y = re.compile(r' y="([-\d.]+)"')
USE_HREF = re.compile(r'href="#([^"]+)"')


def pieces(c):
    """Glyph pieces the exporter writes for a character: none for spaces, two for i, j, ':' and ';'."""
    return 0 if c.isspace() else 2 if c in "ij:;" else 1


def characters(title, body):
    """Each character with its glyph pieces, pen position and glyph identity, or None if they do not line up."""
    uses = USE.findall(body)
    chars, k = [], 0
    for c in title:
        part = uses[k:k + pieces(c)]
        k += pieces(c)
        chars.append({
            "c": c, "uses": part,
            "x": min(float(USE_X.search(u).group(1)) for u in part) if part else None,
            "y": min(float(USE_Y.search(u).group(1)) for u in part) if part else None,
            "key": tuple(USE_HREF.search(u).group(1) for u in part),
        })
    return chars if k == len(uses) else None


def shifted(use, dx, dy=0.0):
    use = USE_X.sub(lambda m: f' x="{float(m.group(1)) + dx:.5f}"', use, count=1)
    if dy:
        use = USE_Y.sub(lambda m: f' y="{float(m.group(1)) + dy:.5f}"', use, count=1)
    return use


def same_font(a, b):
    """Two labels share a font when every lowercase letter they both use has the same glyph."""
    glyphs_a = {ch["c"]: ch["key"] for ch in a if ch["c"].islower()}
    shared = [ch for ch in b if ch["c"] in glyphs_a]
    return len({ch["c"] for ch in shared}) >= 3 and all(glyphs_a[ch["c"]] == ch["key"] for ch in shared)


class Figure:
    def __init__(self, svg):
        self.svg = svg
        self.labels = []
        for m in LABEL.finditer(svg):
            t = MATRIX.search(m.group(1))
            title = html.unescape(m.group(2))
            self.labels.append({"match": m, "title": title, "chars": characters(title, m.group(3)),
                                "x": float(t.group(3)), "y": float(t.group(4)), "scale": float(t.group(1))})
        # advance of each glyph, measured between neighbouring letters across all labels
        widths = defaultdict(list)
        for label in self.labels:
            chars = label["chars"] or []
            for a, b in zip(chars, chars[1:]):
                if a["uses"] and b["uses"]:
                    widths[a["key"]].append(b["x"] - a["x"])
        self.advance = {key: statistics.median(v) for key, v in widths.items()}

    def glyph(self, c, label):
        """Pieces and advance of character c in the font of label."""
        candidates = [label] + [o for o in self.labels if o is not label and o["chars"] and same_font(label["chars"], o["chars"])]
        for other in candidates:
            for ch in other["chars"] or []:
                if ch["c"] == c and ch["key"] in self.advance:
                    return ch, self.advance[ch["key"]]
        sys.exit(f"no glyph for {c!r} in the font of {label['title']!r}")

    def retyped(self, label, new):
        old, chars = label["title"], label["chars"]
        if chars is None:
            sys.exit(f"cannot split {old!r} into glyphs")
        visible = [ch for ch in chars if ch["uses"]]
        centred = visible[0]["x"] < -0.5   # centred labels start left of their origin

        def pen(i):
            """Pen position before character i of the old text."""
            if i == len(chars):
                return -visible[0]["x"] if centred else visible[-1]["x"] + self.advance[visible[-1]["key"]]
            if chars[i]["uses"]:
                return chars[i]["x"]
            prev = chars[i - 1]
            return prev["x"] + self.advance[prev["key"]]

        out, shift = [], 0.0
        for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, old.lower(), new.lower(), autojunk=False).get_opcodes():
            if tag == "delete":
                shift -= pen(i2) - pen(i1)
            elif tag == "equal":
                for i, j in zip(range(i1, i2), range(j1, j2)):
                    ch = chars[i]
                    if old[i] == new[j]:
                        out += [shifted(u, shift) for u in ch["uses"]]
                    else:   # case change, e.g. "isolation" -> "Isolation"
                        src, width = self.glyph(new[j], label)
                        out += [shifted(u, ch["x"] + shift - src["x"], ch["y"] - src["y"]) for u in src["uses"]]
                        shift += width - self.advance[ch["key"]]
            else:
                sys.exit(f"cannot retype {old!r} as {new!r}")
        if centred:   # the text shrank by -shift; move it back onto its centre
            out = [shifted(u, -shift / 2) for u in out]
        m = label["match"]
        return f'<g {m.group(1)}><title>{html.escape(new, quote=False)}</title>{"".join(out)}</g>'

    def clean(self):
        edits, found = {}, set()
        for label in self.labels:
            title, span = label["title"], label["match"].span()
            if title in DELETE:
                found.add(title)
                edits[span] = ""
                # a box title directly above the removed note moves down to sit centred in the box
                for other in self.labels:
                    gap = label["y"] - other["y"]
                    if abs(other["x"] - label["x"]) < 1 and 0 < gap < 2.2 * other["scale"] and "\n" not in other["title"]:
                        y = (other["y"] + label["y"]) / 2
                        edits[other["match"].span()] = MATRIX.sub(
                            lambda t: f"matrix({t.group(1)} 0 0 {t.group(2)} {t.group(3)} {y:.3f})",
                            other["match"].group(0), count=1)
            elif title == "351/402 class-1 objects unchanged":
                edits[span] = (
                    f'<text x="{label["x"]:g}" y="{label["y"]:g}" text-anchor="middle" '
                    'font-family="Arial, sans-serif" font-size="8.5" fill="#05072f">'
                    'Blocker count unchanged: 351/402</text>'
                )
            elif title == "Attention\n(QKᵀV)":
                # Preserve the outlined heading and replace only its second line.
                uses = USE.findall(label["match"].group(3))
                heading = "".join(uses[:sum(pieces(c) for c in "Attention")])
                edits[span] = (
                    f'<g {label["match"].group(1)}><title>Attention</title>{heading}</g>'
                    f'<text x="{label["x"]:g}" y="{label["y"] + 15.3:g}" text-anchor="middle" '
                    'font-family="Arial, sans-serif" font-size="9" fill="#05072f">'
                    '(matmul, softmax)</text>'
                )
            elif title == "Native Agent A1":
                edits[span] = (
                    f'<text x="{label["x"]:g}" y="{label["y"]:g}" text-anchor="middle" '
                    'font-family="Arial, sans-serif" font-size="12" font-weight="bold" '
                    'fill="#05072f">Biomni A1 Agent</text>'
                )
            elif title in EDIT:
                found.add(title)
                edits[span] = self.retyped(label, EDIT[title])
        missing = (DELETE | set(EDIT)) - found
        if missing:
            sys.exit("labels not found: " + "; ".join(sorted(missing)))
        svg = self.svg
        for (start, end), text in sorted(edits.items(), reverse=True):
            svg = svg[:start] + text + svg[end:]
        return svg


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    with open(sys.argv[1], encoding="utf-8") as f:
        cleaned = Figure(f.read()).clean()
    with open(sys.argv[2], "w", encoding="utf-8") as f:
        f.write(cleaned)
