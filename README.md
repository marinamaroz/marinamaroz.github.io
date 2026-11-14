# marinamaroz — portfolio site

Quarto website → rendered into `docs/` → served by GitHub Pages (branch `main`, folder `/docs`).

## Edit content
- `index.qmd` — landing (hero image, tagline, 3 selected works)
- `works.qmd` — gallery; each work is one block: `::: {.work data-cat="print|drawing|illustration"}` + image + caption
- `about.qmd`, `contact.qmd` — bio / CV / links
- `theme.scss` — all styling (colors at the top)
- Images go in `images/works/` (JPG ~2000px long edge, < 500 KB each)

## Publish
    quarto render          # rebuilds docs/
    git add -A && git commit -m "update" && git push
