# marinamaroz: portfolio site ("The Wheel")

Quarto website rendered into `docs/` and served by GitHub Pages (branch `main`, folder `/docs`).

- `index.qmd`: the wheel of works. **Generated**: edit `images/works.json`, then run `python3 scripts/build_site.py`
  (also makes the ring thumbnails in `images/thumb/`; needs Pillow). `START` in the script sets the opening work.
- `about.qmd`, `contact.qmd`: hand-written HTML blocks.
- `styles/site.css`: all styling. `scripts/site.js`: wheel + lightbox. `partials/`: head, header, script include.
- Screenshot helpers: `index.html?still` skips the intro; `?still&open#<slug>` opens a work; add `&detail` for its detail.

## Publish
    python3 scripts/build_site.py && ~/.local/quarto/bin/quarto render
