# marinamaroz — portfolio site ("The Catalogue")

Quarto website → rendered into `docs/` → served by GitHub Pages (branch `main`, folder `/docs`).

## Edit content
- `index.qmd` — landing (giant name, practice statement, contents, detail plate, recent)
- `works.qmd` — GENERATED catalogue index; edit `images/works.json` and run `python3 scripts/build_works.py`
- `about.qmd`, `contact.qmd` — bio / CV / contact
- `partials/` — header, footer, font links; `styles/catalogue.css` — all styling (colours at the top)
- `assets/site.js` — hover preview, filters, sort, to-scale view, viewer

## Add a work
1. `images/works/<slug>.jpg`, transparent `images/cut/<slug>.webp`
2. `cwebp -q 78 -resize 420 0 images/cut/<slug>.webp -o images/thumb/<slug>.webp`
3. add to `images/works.json`, then `python3 scripts/build_works.py && quarto render`
