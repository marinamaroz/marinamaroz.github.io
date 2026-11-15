"""Regenerate index.qmd (the exhibition) and works.qmd (the list of works) from images/works.json.

To add a work: put a JPG in images/works/<slug>.jpg (+ transparent images/cut/<slug>.webp,
+ optional close-up images/details/<slug>.jpg with "detail": true), add an entry to
images/works.json, then run:  python3 scripts/build_works.py && quarto render
"""
import json, os
from html import escape

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
works = json.load(open(os.path.join(root, "images/works.json")))

ROMAN = ["I", "II", "III", "IV", "V"]
SERIES = [
    ("evidences", "Evidences", "2021–2025",
     "Round compositions in mezzotint and acrylic: symbolic still lifes on faith and sacrifice. "
     "Shown in the solo exhibition <em>Evidences</em> at Terra Graphica Sacrum, Palace of Art, Minsk, in 2024."),
    ("harvest", "Harvest", "2020–2025",
     "Soft ground etchings of gathered, bound and abandoned things: stones, husks, leaves, a paper crane."),
    ("exlibris", "Ex libris", "2021–2025",
     "Bookplates in mezzotint, each ⌀ 14 cm: small allegories of reading, memory and dreaming."),
]
NAMES = {k: n for k, n, _, _ in SERIES}
for i, w in enumerate(works):
    w["n"] = i + 1
TOTAL = len(works)


def img(slug):
    p = f"images/cut/{slug}.webp"
    return p if os.path.exists(os.path.join(root, p)) else f"images/works/{slug}.jpg"


def size_of(path):
    try:
        from PIL import Image
        with Image.open(os.path.join(root, path)) as im:
            return im.size
    except Exception:
        return (1000, 1000)


def label(w, extra=""):
    return (f'<div class="label{extra}">'
            f'<span class="no">{w["n"]:02d}</span>'
            f'<span class="t">{escape(w["title"])}</span>'
            f'<span class="y">{w["year"]}</span>'
            f'<span class="m">{escape(w["medium"].capitalize())}</span>'
            f'<span class="s">{escape(w["size"])}</span>'
            f'</div>')


def art(w, cls="art", lazy=True):
    src = img(w["slug"])
    W, H = size_of(src)
    shape = "round" if "⌀" in w["size"] else "rect"
    lz = ' loading="lazy"' if lazy else ""
    return (f'<button class="{cls} {shape}" type="button" data-full="images/works/{w["slug"]}.jpg" '
            f'data-n="{w["n"]}" aria-label="Look closer: {escape(w["title"])}">'
            f'<img src="{src}" width="{W}" height="{H}" alt="{escape(w["title"])}, {w["year"]}, {escape(w["medium"])}"'
            f'{lz} decoding="async"></button>')


out = []
o = out.append
o('---\npagetitle: "Graphic artist & printmaker"\nbody-classes: page-exhibition\n---\n')
o('```{=html}')
o('<div class="hud" aria-hidden="true"><span class="hud-room">Entrance</span>'
  '<span class="hud-plan">' + "".join(
      f'<a href="#{k}" data-plan="{k}" tabindex="-1">{ROMAN[i]}</a>' for i, (k, *_r) in enumerate(SERIES)) +
  f'</span><span class="hud-count"><b>00</b> / {TOTAL}</span></div>')

# Entrance
o('<main class="exhibition" id="main">')
o('<section class="screen entrance" data-room="entrance" id="entrance">'
  '<div class="spot" aria-hidden="true"></div>'
  '<h1 class="marquee"><span class="w1">Marina</span>'
  '<span class="disc"><img src="images/cut/great-expectations.webp" width="900" height="888" alt="Great expectations, 2022, mezzotint"></span>'
  '<span class="w2">Maroz</span></h1>'
  '<p class="ent-meta l">Graphic artist &amp; printmaker<br>Mezzotint, soft ground etching, ex libris</p>'
  '<p class="ent-meta r"><span lang="be">Марына Мароз</span><br>Minsk, Belarus</p>'
  '<a class="enter" href="#evidences"><span>Enter</span><i>Three rooms · twenty-four works</i></a>'
  '</section>')

for ri, (key, name, years, blurb) in enumerate(SERIES):
    group = [w for w in works if w["series"] == key]
    o(f'<section class="screen room-title" data-room="{key}" id="{key}">'
      f'<p class="room-no">Room {ROMAN[ri]}</p>'
      f'<h2 class="room-name">{name}</h2>'
      f'<div class="room-intro"><p>{blurb}</p><p class="room-meta">{years} · {len(group)} works</p></div>'
      f'<ol class="room-list">' + "".join(
          f'<li><a href="#{w["slug"]}"><span>{w["n"]:02d}</span>{escape(w["title"])}</a></li>' for w in group) + '</ol>'
      f'<span class="room-cue" aria-hidden="true">↓</span>'
      '</section>')
    if key == "exlibris":
        n = len(group)
        o(f'<section class="xl" data-room="{key}" style="--n:{n}">')
        for i, w in enumerate(group):
            o(f'<span class="xl-snap" id="{w["slug"]}" data-work="{w["n"]}" style="top:calc({i} * 100svh)"></span>')
        o('<div class="xl-sticky"><div class="xl-track">')
        for w in group:
            o(f'<figure class="xl-item">{art(w)}{label(w)}</figure>')
        o('</div><p class="xl-hint">Scroll to walk along the wall</p></div></section>')
        continue
    for w in group:
        o(f'<section class="screen work" data-room="{key}" data-work="{w["n"]}" id="{w["slug"]}">'
          f'<figure class="hang">{art(w)}<figcaption>{label(w)}'
          f'<span class="closer">Look closer</span></figcaption></figure></section>')
        if w.get("detail"):
            o(f'<section class="screen detail" data-room="{key}" data-work="{w["n"]}" id="{w["slug"]}-detail">'
              f'<img src="images/details/{w["slug"]}.jpg" alt="{escape(w["title"])}, detail" loading="lazy" decoding="async">'
              f'<p class="detail-cap"><em>{escape(w["title"])}</em>, {w["year"]} — detail</p></section>')

o('<section class="screen exit" data-room="exit" id="exit">'
  '<p class="room-no">Exit</p>'
  '<p class="exit-text">Marina Maroz (b.&nbsp;1984, Minsk) is a graphic artist and printmaker whose practice centres on etching, '
  'in particular mezzotint and soft ground etching.</p>'
  '<nav class="exit-links"><a href="about.html">About the artist <i>→</i></a>'
  '<a href="works.html">List of works <i>→</i></a>'
  '<a href="contact.html">Contact <i>→</i></a></nav>'
  '<p class="colophon">© 2026 Marina Maroz · All images © the artist</p>'
  '</section>')
o('</main>')
o('<div class="viewer" hidden role="dialog" aria-modal="true" aria-label="Artwork viewer">'
  '<div class="v-stage"><img alt=""></div>'
  '<div class="v-bar"><div class="v-cap"></div><div class="v-ctl">'
  '<button type="button" class="v-prev" aria-label="Previous work">←</button>'
  '<button type="button" class="v-next" aria-label="Next work">→</button>'
  '<button type="button" class="v-close">Close</button></div></div>'
  '<p class="v-hint">Click the print to magnify</p></div>')
o('```')
open(os.path.join(root, "index.qmd"), "w").write("\n".join(out) + "\n")

# List of works
out = []
o = out.append
o('---\npagetitle: "List of works"\nbody-classes: page-list\n---\n')
o('```{=html}')
o('<main class="checklist" id="main">')
o('<header class="cl-head"><p class="kicker">Checklist</p><h1>List of works</h1>'
  f'<p class="cl-sub">Marina Maroz · {TOTAL} works in three rooms, 2020–2025. '
  'Select a title to see it on the wall.</p></header>')
for ri, (key, name, years, blurb) in enumerate(SERIES):
    group = [w for w in works if w["series"] == key]
    o(f'<section class="cl-room"><h2><span>Room {ROMAN[ri]}</span>{name}<small>{years}</small></h2><ol>')
    for w in group:
        o(f'<li><a href="index.html#{w["slug"]}" data-img="{img(w["slug"])}">'
          f'<span class="no">{w["n"]:02d}</span>'
          f'<img class="thumb" src="{img(w["slug"])}" alt="" loading="lazy">'
          f'<span class="t">{escape(w["title"])}</span>'
          f'<span class="y">{w["year"]}</span>'
          f'<span class="m">{escape(w["medium"].capitalize())}</span>'
          f'<span class="s">{escape(w["size"])}</span></a></li>')
    o('</ol></section>')
o('<div class="cl-preview" aria-hidden="true"><img alt=""></div>')
o('</main>')
o('```')
open(os.path.join(root, "works.qmd"), "w").write("\n".join(out) + "\n")
print("index.qmd + works.qmd written:", TOTAL, "works")
