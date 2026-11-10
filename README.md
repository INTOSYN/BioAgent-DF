# BioAgent-DF project page

Project page for **From Tool State to Scientific Action: Auditing Decision Provenance in Biomedical Research Agents**
(Xingyu Yi, Xinya Zhang, Yunshen Zhou, Haoyu Bao · [arXiv:2611.01527](https://arxiv.org/abs/2611.01527)).

A static site with no build step: plain HTML, CSS and JavaScript. The site uses system fonts and pre-rendered MathML. No external font or equation-rendering CDN is needed.

## Languages

The overview, result sections 01–05, data cards, figure captions, methods overview and viewer controls have Chinese and English versions. The mathematical foundations page is also bilingual. Author names, model names, citation metadata and the original paper figure artwork retain their original labels; complete Chinese captions accompany the figures.

- The main page follows the browser language, the saved language choice, or ?lang=zh / ?lang=en.
- The language button switches the text and figure descriptions. Mathematical links expand the relevant explanation on the same page.
- mathematical-methods.html is a standalone file with embedded CSS, JavaScript and MathML. It can be opened offline.

## Preview locally

```bash
cd project-page
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish with GitHub Pages

1. Create a repository (for example `BioAgent-DF`) and push the contents of this folder to its `main` branch.
2. In the repository, open **Settings → Pages**, set **Source** to *Deploy from a branch*, and pick `main` / `(root)`.
3. The page goes live at `https://<user-or-org>.github.io/<repository>/` within a minute or two.

`.nojekyll` tells GitHub Pages to serve the files as they are.

## Before sharing

- **Social preview.** `og:image` and `twitter:image` use a relative path; most sites need an absolute URL, such as
  `https://<user-or-org>.github.io/<repository>/static/images/og-image.jpg`.

The Paper button opens the arXiv PDF (https://arxiv.org/pdf/2611.01527) and the arXiv button the abstract page
(https://arxiv.org/abs/2611.01527); the BibTeX block cites the arXiv entry.

## Layout

Figures are numbered in page order, not with the paper's numbers.

| Section | Page figure | Source |
|---|---|---|
| Overview: TL;DR and key numbers | — | — |
| Abstract: project pitch | — | — |
| Outlook: BioAgent-DF for next-generation labs | Figure 1 | framework figure (not in the paper) |
| 01 · From tool state to scientific action (hERG testing assignment) | Figure 2 | paper Figure 5 |
| M · Mathematical Foundations of Decision Fidelity | — | definition and five expandable explanations |
| 02 · Method: tool-state interventions | Figure 3 | paper Figure B1 |
| 03 · Mechanism: score competition | Figure 4 | paper Figure C1 |
| 04 · Endpoints: what losses and metrics miss | Figure 5 | paper Figure D1 |
| 05 · SciFact claim 431, the closing example | Figure 6 | paper Figure 1 |

Author names in the hero open a small card with each author's role (hover, keyboard focus or tap).

## Updating figures

**Figure 1** is `static/images/framework.svg`, built from the Blender export
`BioAgent_DF_arXiv_Clean_LaTeX/output/web_svg/BioAgent_DF_Framework.svg`. The page version removes status wording, since
dashed boxes and the legend (Demonstrated / Proposed) already mark proposed parts: per-box notes such as "Proposed; not
evaluated" and "(theory only)" are deleted, and labels and panel subtitles lose words like "proposed" and "remain
proposed". After a new export, run:

```bash
python tools/clean_framework_svg.py ../../BioAgent_DF_arXiv_Clean_LaTeX/output/web_svg/BioAgent_DF_Framework.svg static/images/framework.svg
```

The script stops with a message if a label it expects is missing. The Outlook tabs zoom to each panel using the panel
rectangles in `PANELS` in `static/js/main.js`, given in the SVG's 1536 × 1024 units; adjust them if the panel layout
moves. The figure's "class-1 objects" label comes from the anonymized paper; the Figure 1 caption says it means hERG
blockers.

The WebP images in `static/images/` are rendered from the paper's PDF figures at 1200 px and 2400 px wide.
After a figure changes, run:

```bash
pip install pymupdf pillow
python tools/render_figures.py ../figures static/images
```

## Files

```
index.html
static/css/style.css
static/js/main.js
static/images/framework.svg
static/images/figure-{1,5,b1,c1,d1}-{1200,2400}.webp   (named after the paper's figure numbers)
static/images/og-image.jpg
tools/clean_framework_svg.py
tools/render_figures.py
.nojekyll
```

## Mathematical foundations and public overview (2026-11-10)

The main page presents the hERG result before five inline, expandable explanations. Individual steps can be opened separately, and Expand all opens every explanation. Links elsewhere on the page reveal the corresponding panel without navigating away. The separately retained mathematical-methods.html page contains the same five steps: arithmetic checks, localization and attribution, selective recovery, agent execution-state restoration, and certification. Recovery costs are expandable within selective recovery; AdamW and all-reduce are an expandable extension.

The K13418 example uses the current R1 margin to explain M selection. The 68 compounds are additions after R1, not the total recovery workload. The 102/102 result is explicitly scoped to state restoration.

Equations are embedded as MathML with their TeX source retained in data-tex attributes. Editing only data-tex will not update the visible formula: rebuild the associated MathML when a formula changes. No runtime KaTeX script or remote fonts are used. Styles for the main methods overview are in static/css/mathematics.css; standalone styles are embedded in its HTML.

The OSDI motivation links to the official study and scopes its microbenchmark miss rate to that study’s defective-device sample.

This update changes the website only. Original LaTeX and PDF files remain unchanged.

The Chinese explanations were revised for continuous reading. Formula markup and experimental numbers are preserved. The mathematics heading has additional spacing before the definition panel.

The public evidence table presents decision results and accompanying observations. Tool-only native-fault validation and its calibration details were removed from the public pages; their previous web summary is archived outside the site.

The main methods expanders and standalone methods page use the same five step titles and explanation bodies. File-only continuation starts from H_c; execution-state restoration starts from H₀. English and Chinese captions and interface labels are synchronized. The repeated recovery counts are retained in the overview, section 01 and method step 04; Figure 1 has a two-sentence caption with details in its panel tabs.

Navigation uses Mathematics / 数学基础; the section and standalone page retain their full titles. The tagline “Towards Trustworthy and Controllable Fully Automated Wet Labs” stays in English in both language modes. Forward/verification timing comparisons are consolidated in framework panel b. Labels for components validated in this work use “validated”; descriptions of endpoint evaluation retain “evaluated”.

The mathematical notation follows the paper: a = g(p⋆), a = π(H), and boundary distance d(q). The streaming note uses κ for the guard radius and summarizes the archived implementation documentation; intervals containing or touching zero fall back to the original FP64 check. Its formulas are an explanatory presentation, not an additional manuscript theorem or a new kernel-verification result.
