"""Render the paper's PDF figures into the web images used by index.html.

Usage:
    python tools/render_figures.py <figures-dir> static/images

Needs PyMuPDF and Pillow (pip install pymupdf pillow).
"""
import os
import sys

import fitz
from PIL import Image

FIGURES = {
    "Figure_1": "figure-1",
    "Figure_5": "figure-5",
    "Figure_B1": "figure-b1",
    "Figure_C1": "figure-c1",
    "Figure_D1": "figure-d1",
}
WIDTHS = (1200, 2400)


def render(src_dir, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for pdf_name, slug in FIGURES.items():
        page = fitz.open(os.path.join(src_dir, pdf_name + ".pdf"))[0]
        zoom = 3600 / page.rect.width  # oversample, then downsample for smooth edges
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        big = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

        for width in WIDTHS:
            height = round(big.height * width / big.width)
            path = os.path.join(out_dir, f"{slug}-{width}.webp")
            big.resize((width, height), Image.LANCZOS).save(path, "WEBP", quality=90, method=6)
            print(f"{path}  {width}x{height}")

        if slug == "figure-1":
            # 1200x630 social card from panel (a)
            crop = big.crop((0, 0, big.width, round(big.height * 0.672)))
            crop = crop.resize((1200, round(crop.height * 1200 / crop.width)), Image.LANCZOS)
            card = Image.new("RGB", (1200, 630), "white")
            card.paste(crop, (0, (630 - crop.height) // 2))
            card.save(os.path.join(out_dir, "og-image.jpg"), "JPEG", quality=88, optimize=True)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    render(sys.argv[1], sys.argv[2])
