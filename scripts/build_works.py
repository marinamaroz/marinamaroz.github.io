"""Regenerate works.qmd from images/works.json.
To add a work: put a JPG in images/works/<slug>.jpg (+ optional transparent images/cut/<slug>.webp),
add an entry to images/works.json, then run:  python3 scripts/build_works.py && quarto render"""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
works = json.load(open(os.path.join(root, "images/works.json")))
SERIES = [
  ("evidences", "Evidences", "2021 – 2025",
   "Round compositions in mezzotint and acrylic: symbolic still lifes on faith and sacrifice, shown in the solo exhibition <em>Evidences</em> at Terra Graphica Sacrum, Palace of Art, Minsk (2024)."),
  ("harvest", "Harvest", "2020 – 2025",
   "Soft ground etchings of gathered, bound and abandoned things: stones, husks, leaves, a paper crane."),
  ("exlibris", "Ex libris", "2021 – 2025",
   "Bookplates in mezzotint, ⌀ 14 cm: small allegories of reading, memory and dreaming."),
]
out = ['---', 'title: "Works"', 'page-layout: full', '---', '',
       '```{=html}', '<nav class="series-nav">' +
       "".join(f'<a href="#{k}">{n}</a>' for k, n, _, _ in SERIES) + '</nav>', '```', '']
for key, name, years, blurb in SERIES:
    out += [f'::: {{.series #{key}}}', '```{=html}',
            f'<header class="series-head"><h2>{name}</h2><span class="years">{years}</span><p>{blurb}</p></header>',
            '```', '', ':::: {.work-grid}']
    for w in (x for x in works if x["series"] == key):
        img = f'images/cut/{w["slug"]}.webp' if os.path.exists(os.path.join(root, f'images/cut/{w["slug"]}.webp')) else f'images/works/{w["slug"]}.jpg'
        desc = f'{w["medium"].capitalize()}, {w["size"]}'
        out += ['::::: {.work}',
                f'![]({img}){{group="{key}" fig-alt="{w["title"]}, {w["year"]}" description="<em>{w["title"]}</em>, {w["year"]}. {desc}"}}',
                '',
                f'[*{w["title"]}*, {w["year"]}]{{.t}} [{desc}]{{.m}}', ':::::', '']
    out += ['::::', '']
    det = [w for w in works if w["series"] == key and w.get("detail")]
    if det:
        out += [':::: {.details}']
        for w in det:
            out += [f'![]({"images/details/" + w["slug"] + ".jpg"}){{group="{key}-details" fig-alt="{w["title"]} (detail)" description="<em>{w["title"]}</em>, {w["year"]} (detail)"}}', '']
        out += ['::::', '']
    out += [':::', '']
open(os.path.join(root, "works.qmd"), "w").write("\n".join(out))
print("works.qmd written:", len(works), "works")
