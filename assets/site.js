/* Marina Maroz — catalogue interactions (no dependencies) */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- nav state ---- */
  var page = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
  $$(".h-nav a").forEach(function (a) { if (a.dataset.nav === page) a.setAttribute("aria-current", "page"); });

  /* ---- Minsk clock ---- */
  var clock = $(".h-clock");
  if (clock && window.Intl) {
    var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Minsk", hour: "2-digit", minute: "2-digit" });
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 20000);
  }

  /* ---- Landing: the O of MAROZ cycles through the round plates ---- */
  var o = $(".mega-o");
  if (o) {
    var rounds = [
      ["harvest-time", "04", "Harvest time", 2025, "Mezzotint on paper, ⌀ 50 cm"],
      ["in-the-secret-garden", "24", "In the secret garden", 2025, "Mezzotint on paper, ⌀ 14 cm"],
      ["predestination", "06", "Predestination", 2021, "Mezzotint on paper, ⌀ 40 cm"],
      ["treasure", "14", "Treasure", 2021, "Mezzotint on paper, ⌀ 14 cm"],
      ["reconciliation-circle", "01", "Reconciliation circle", 2025, "Acrylic on hardboard, ⌀ 50 cm"],
      ["cognition", "17", "Cognition", 2023, "Mezzotint on paper, ⌀ 14 cm"],
      ["great-expectations", "05", "Great expectations", 2022, "Mezzotint on paper, ⌀ 40 cm"],
      ["bittersweet-memories", "13", "Bittersweet memories", 2023, "Mezzotint on paper, ⌀ 14 cm"],
      ["salvific-meal", "02", "Salvific meal", 2025, "Acrylic on hardboard, ⌀ 50 cm"],
      ["hommage-magritte", "20", "Hommage René Magritte", 2022, "Mezzotint on paper, ⌀ 14 cm"],
      ["quiet-refuge", "03", "Quiet refuge", 2025, "Acrylic on hardboard, ⌀ 50 cm"]
    ];
    var oi = 0, a = $(".o-a", o), b = $(".o-b", o), fig = $(".o-fig"), txt = $(".o-text");
    rounds.forEach(function (r) { var im = new Image(); im.src = "images/thumb/" + r[0] + ".webp"; });
    var step = function () {
      oi = (oi + 1) % rounds.length;
      var r = rounds[oi], showB = !o.classList.contains("swap");
      (showB ? b : a).src = "images/thumb/" + r[0] + ".webp";
      o.classList.toggle("swap", showB);
      o.href = "works.html#" + r[0];
      fig.textContent = "Fig. " + r[1];
      txt.innerHTML = "<em>" + r[2] + "</em>, " + r[3] + ". " + r[4];
    };
    if (!reduce) setInterval(step, 3600);
    else o.addEventListener("click", function (e) { e.preventDefault(); step(); }, { once: true });
  }

  /* ---- Works ---- */
  var dataEl = $("#works-data");
  if (!dataEl) return;
  var works = JSON.parse(dataEl.textContent);
  var ix = $("#ix"), rows = $$(".row", ix), groups = $$(".grp", ix), plates = $$(".plate");
  var state = { f: "all", sort: "no", view: "index" };

  // filter / sort / view
  function visible() {
    var list = works.map(function (w, i) { return i; }).filter(function (i) {
      return state.f === "all" || works[i].seriesKey === state.f;
    });
    if (state.sort === "title") list.sort(function (x, y) { return works[x].title.localeCompare(works[y].title); });
    if (state.sort === "year") list.sort(function (x, y) { return works[y].year - works[x].year || x - y; });
    return list;
  }
  function apply() {
    var list = visible();
    ix.classList.toggle("flat", state.sort !== "no");
    rows.forEach(function (r) { r.hidden = list.indexOf(+r.dataset.i) < 0; });
    groups.forEach(function (g) { g.hidden = state.f !== "all" && g.dataset.series !== state.f; });
    if (state.sort === "no") {
      // restore catalogue order with group headers
      $$("li", ix).sort(function (p, q) { return order(p) - order(q); }).forEach(function (li) { ix.appendChild(li); });
    } else {
      list.forEach(function (i) { ix.appendChild(rows[i]); });
    }
    plates.forEach(function (p) { p.hidden = list.indexOf(+p.dataset.i) < 0; });
    $$(".cat-filters button").forEach(function (bt) { bt.classList.toggle("on", bt.dataset.f === state.f); });
    $$(".ix-head [data-sort]").forEach(function (bt) { bt.classList.toggle("on", bt.dataset.sort === state.sort); });
    $$(".cat-views button").forEach(function (bt) { bt.classList.toggle("on", bt.dataset.v === state.view); });
    $(".view-index").hidden = state.view !== "index";
    $(".view-scale").hidden = state.view !== "scale";
  }
  function order(li) {
    if (li.classList.contains("row")) return +li.dataset.i * 2 + 1;
    var first = works.findIndex(function (w) { return w.seriesKey === li.dataset.series; });
    return first * 2;
  }
  $$(".cat-filters button").forEach(function (bt) { bt.addEventListener("click", function () { state.f = bt.dataset.f; apply(); }); });
  $$(".ix-head [data-sort]").forEach(function (bt) { bt.addEventListener("click", function () { state.sort = bt.dataset.sort; apply(); }); });
  $$(".cat-views button").forEach(function (bt) { bt.addEventListener("click", function () { state.view = bt.dataset.v; apply(); }); });
  var qs = new URLSearchParams(location.search).get("s");
  if (qs && works.some(function (w) { return w.seriesKey === qs; })) state.f = qs;
  apply();

  // cursor follower
  var fol = $(".follower"), folImg = $("img", fol), folNo = $(".follower-no", fol);
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function loop() {
    cx += (tx - cx) * (reduce ? 1 : .16); cy += (ty - cy) * (reduce ? 1 : .16);
    fol.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .3 ? requestAnimationFrame(loop) : 0;
  }
  function place(e) {
    var w = fol.offsetWidth, h = fol.offsetHeight || w;
    var x = e.clientX + 28, y = e.clientY - h * .5;
    if (x + w > innerWidth - 16) x = e.clientX - w - 28;
    y = Math.max(96, Math.min(y, innerHeight - h - 16));
    tx = x; ty = y;
    if (!raf) raf = requestAnimationFrame(loop);
  }
  if (finePointer) {
    rows.forEach(function (r) {
      r.addEventListener("mouseenter", function (e) {
        var w = works[+r.dataset.i];
        folImg.src = "images/cut/" + w.slug + ".webp";
        folNo.textContent = "No. " + w.no + " — " + w.size;
        r.classList.add("hot"); ix.classList.add("hovering");
        if (!fol.classList.contains("on")) { place(e); cx = tx; cy = ty; loop(); }
        fol.classList.add("on");
      });
      r.addEventListener("mouseleave", function () { r.classList.remove("hot"); });
    });
    ix.addEventListener("mousemove", place);
    ix.addEventListener("mouseleave", function () { fol.classList.remove("on"); ix.classList.remove("hovering"); });
    // warm the cache once idle
    (window.requestIdleCallback || setTimeout)(function () {
      works.forEach(function (w) { var im = new Image(); im.src = "images/cut/" + w.slug + ".webp"; });
    });
  }

  // viewer
  var v = $(".viewer"), vImg = $(".v-img", v), vStage = $(".v-stage", v), vDetail = $(".v-detail", v);
  var cur = -1, showingDetail = false, lastFocus = null;
  function seq() { return visible(); }
  function render() {
    var w = works[cur];
    vImg.classList.remove("ready");
    vImg.onload = function () { vImg.classList.add("ready"); };
    vImg.src = showingDetail ? "images/details/" + w.slug + ".jpg" : "images/cut/" + w.slug + ".webp";
    vImg.alt = w.title + ", " + w.year + (showingDetail ? " (detail)" : "");
    if (vImg.complete) vImg.classList.add("ready");
    vStage.classList.toggle("detail", showingDetail);
    $(".v-no", v).textContent = "No. " + w.no;
    $(".v-title", v).textContent = w.title;
    $(".v-year", v).textContent = w.year;
    $(".v-medium", v).textContent = w.medium;
    $(".v-size", v).textContent = w.size;
    $(".v-series", v).textContent = w.series;
    vDetail.hidden = !w.detail;
    vDetail.classList.toggle("on", showingDetail);
    vDetail.textContent = showingDetail ? "View whole plate" : "View detail";
    history.replaceState(null, "", "#" + w.slug);
  }
  function open(i) {
    if (v.hidden) lastFocus = document.activeElement;
    cur = i; showingDetail = false; v.hidden = false; document.body.classList.add("v-open");
    render(); v.focus({ preventScroll: true });
  }
  function close() {
    v.hidden = true; document.body.classList.remove("v-open");
    history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function go(d) {
    var s = seq(), p = s.indexOf(cur);
    if (p < 0) p = 0;
    open(s[(p + d + s.length) % s.length]);
  }
  rows.forEach(function (r) {
    $("a", r).addEventListener("click", function (e) { e.preventDefault(); open(+r.dataset.i); });
  });
  plates.forEach(function (p) { p.addEventListener("click", function () { open(+p.dataset.i); }); });
  $(".v-prev", v).addEventListener("click", function () { go(-1); });
  $(".v-next", v).addEventListener("click", function () { go(1); });
  $(".v-close", v).addEventListener("click", close);
  vDetail.addEventListener("click", function () { showingDetail = !showingDetail; render(); });
  vStage.addEventListener("click", function (e) { if (e.target === vStage) close(); });
  document.addEventListener("keydown", function (e) {
    if (v.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "Tab") { // keep focus inside the dialog
      var f = $$("button:not([hidden])", v), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var sx = null, sy = null;
  vStage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  vStage.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    sx = null;
  });
  // deep link: works.html#slug
  var hash = decodeURIComponent(location.hash.slice(1));
  var hi = works.findIndex(function (w) { return w.slug === hash; });
  if (hi >= 0) open(hi);
})();
