# marinamaroz — portfolio site

Quarto website → rendered into `docs/` → served by GitHub Pages (branch `main`, folder `/docs`).

## Edit content
- `images/works.json` — all works (series, slug, title, year, medium, size, detail flag).
  After editing it run `python3 scripts/build_works.py` — this regenerates `index.qmd`
  (the exhibition: entrance, three rooms, exit) and `works.qmd` (list of works).
- `about.qmd`, `contact.qmd` — bio / CV / contact (raw HTML blocks)
- `styles/exhibition.css` — all styling (room wall colours at the top)
- `assets/exhibition.js` — room colour changes, ex libris horizontal wall, viewer

## Publish
    quarto render          # rebuilds docs/
    git add -A && git commit -m "update" && git push
