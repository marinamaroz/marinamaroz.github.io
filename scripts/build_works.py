"""Regenerate works.qmd (the catalogue index) from images/works.json.

To add a work:
  1. put the photo in images/works/<slug>.jpg and a transparent cut-out in images/cut/<slug>.webp
  2. make a thumbnail:  cwebp -q 78 -resize 420 0 images/cut/<slug>.webp -o images/thumb/<slug>.webp
  3. add an entry to images/works.json (optional "detail": true + images/details/<slug>.jpg)
  4. python3 scripts/build_works.py && quarto render
"""
import json, os, re, html

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
works = json.load(open(os.path.join(root, "images/works.json"), encoding="utf-8"))

SERIES = {
    "evidences": ("I", "Evidences",
                  "Round compositions in mezzotint and acrylic: symbolic still lifes on faith and sacrifice, "
                  "shown in the solo exhibition <em>Evidences</em> at Terra Graphica Sacrum, Palace of Art, Minsk (2024)."),
    "harvest": ("II", "Harvest",
                "Soft ground etchings of gathered, bound and abandoned things: stones, husks, leaves, a paper crane."),
    "exlibris": ("III", "Ex libris",
                 "Bookplates in mezzotint, ⌀ 14 cm: small allegories of reading, memory and dreaming."),
}


def img_size(path):
    from PIL import Image  # only used at build time
    with Image.open(path) as im:
        return im.size


def physical(w):
    """Return (width_cm, height_cm) using the image's orientation."""
    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", w["size"])]
    if len(nums) == 1:
        return nums[0], nums[0]
    pw, ph = img_size(os.path.join(root, f"images/cut/{w['slug']}.webp"))
    big, small = max(nums), min(nums)
    return (big, small) if pw > ph else (small, big) if ph > pw else (nums[0], nums[1])


esc = html.escape
rows, plates, data = [], [], []
for i, w in enumerate(works):
    no = f"{i + 1:02d}"
    s = w["series"]
    roman, sname, _ = SERIES[s]
    wcm, hcm = physical(w)
    medium = w["medium"][0].upper() + w["medium"][1:]
    entry = dict(no=no, slug=w["slug"], title=w["title"], year=w["year"], medium=medium,
                 size=w["size"], series=sname, seriesKey=s, detail=bool(w.get("detail")), w=wcm, h=hcm)
    data.append(entry)
    first = i == 0 or works[i - 1]["series"] != s
    if first:
        n = sum(1 for x in works if x["series"] == s)
        yrs = [x["year"] for x in works if x["series"] == s]
        rows.append(
            f'<li class="grp" data-series="{s}"><span class="grp-no">{roman}</span>'
            f'<span class="grp-name">{sname}</span><span class="grp-yrs">{min(yrs)}–{max(yrs)}</span>'
            f'<span class="grp-n">{n:02d} works</span><p class="grp-text">{SERIES[s][2]}</p></li>')
    rows.append(
        f'<li class="row" data-i="{i}" data-series="{s}" data-year="{w["year"]}" data-title="{esc(w["title"])}">'
        f'<a href="images/works/{w["slug"]}.jpg" class="row-a">'
        f'<span class="c-no">{no}</span>'
        f'<span class="c-th"><img src="images/thumb/{w["slug"]}.webp" alt="" loading="lazy"></span>'
        f'<span class="c-title">{esc(w["title"])}</span>'
        f'<span class="c-series">{sname}</span>'
        f'<span class="c-year">{w["year"]}</span>'
        f'<span class="c-medium">{esc(medium)}</span>'
        f'<span class="c-size">{esc(w["size"])}</span>'
        f'</a></li>')
    plates.append(
        f'<button class="plate" data-i="{i}" data-series="{s}" style="--w:{wcm:g};--h:{hcm:g}" '
        f'aria-label="{esc(w["title"])}, {w["year"]}">'
        f'<img src="images/thumb/{w["slug"]}.webp" alt="" loading="lazy">'
        f'<span class="plate-cap"><b>{no}</b> {esc(w["title"])}</span></button>')

counts = {k: sum(1 for x in works if x["series"] == k) for k in SERIES}
filters = '<button class="on" data-f="all">All <sup>' + f"{len(works)}" + '</sup></button>' + "".join(
    f'<button data-f="{k}">{v[1]} <sup>{counts[k]:02d}</sup></button>' for k, v in SERIES.items())
years = [w["year"] for w in works]

out = f'''---
pagetitle: "Works"
description: "Catalogue of works by Marina Maroz, {min(years)}–{max(years)}: mezzotint, soft ground etching, ex libris."
---

```{{=html}}
<section class="cat-head">
  <div class="cat-label mono">Catalogue of works</div>
  <h1 class="cat-title">Works <span class="cat-yrs">{min(years)}—{max(years)}</span></h1>
  <p class="cat-intro">{len(works)} works in three series, numbered as a catalogue. Select any title to view the plate large;
  switch to <em>To scale</em> to see every print at its true size relative to the others.</p>
</section>

<div class="cat-bar mono">
  <div class="cat-filters" role="group" aria-label="Series">{filters}</div>
  <div class="cat-views" role="group" aria-label="View">
    <button class="on" data-v="index">Index</button><button data-v="scale">To scale</button>
  </div>
</div>

<section class="view-index">
  <div class="ix-head mono" role="presentation">
    <button data-sort="no" class="on">No.</button><span class="c-th"></span><button data-sort="title">Title</button>
    <span class="c-series">Series</span><button data-sort="year" class="c-year">Year</button>
    <span class="c-medium">Medium</span><span class="c-size">Size</span>
  </div>
  <ol class="ix" id="ix">
{chr(10).join("    " + r for r in rows)}
  </ol>
</section>

<section class="view-scale" hidden>
  <div class="scale-bar mono"><span class="scale-rule"></span>10 cm</div>
  <div class="plates">
{chr(10).join("    " + p for p in plates)}
  </div>
</section>

<div class="follower" aria-hidden="true"><img alt=""><span class="follower-no mono"></span></div>

<div class="viewer" hidden tabindex="-1" role="dialog" aria-modal="true" aria-label="Work viewer">
  <div class="v-stage"><img class="v-img" alt=""></div>
  <aside class="v-meta">
    <div class="v-count mono"><span class="v-no"></span> / {len(works):02d}</div>
    <h2 class="v-title"></h2>
    <dl class="v-dl mono">
      <dt>Year</dt><dd class="v-year"></dd>
      <dt>Medium</dt><dd class="v-medium"></dd>
      <dt>Size</dt><dd class="v-size"></dd>
      <dt>Series</dt><dd class="v-series"></dd>
    </dl>
    <button class="v-detail mono" hidden>View detail</button>
  </aside>
  <div class="v-nav mono">
    <button class="v-prev" aria-label="Previous work">← Prev</button>
    <button class="v-next" aria-label="Next work">Next →</button>
    <button class="v-close" aria-label="Close">Close ✕</button>
  </div>
</div>

<script type="application/json" id="works-data">{json.dumps(data, ensure_ascii=False)}</script>
```
'''
open(os.path.join(root, "works.qmd"), "w", encoding="utf-8").write(out)
print("works.qmd written:", len(works), "works")
