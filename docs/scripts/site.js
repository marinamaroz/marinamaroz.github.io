/* Marina Maroz: the wheel of works, and the impression (lightbox). No dependencies. */
(function () {
  "use strict";

  // current page in the menu
  var page = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
  document.querySelectorAll(".menu a").forEach(function (a) {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
  });

  var wheel = document.getElementById("wheel");
  if (!wheel) return;

  var works = JSON.parse(document.getElementById("works-data").textContent);
  var N = works.length, STEP = 360 / N;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var beads = Array.prototype.slice.call(wheel.querySelectorAll(".bead"));
  var hub = document.getElementById("hub");
  var plates = hub.querySelectorAll(".plate");
  var caption = document.getElementById("caption");
  var $ = function (id) { return document.getElementById(id); };
  var hint = $("hint");

  var mod = function (n, m) { return ((n % m) + m) % m; };
  var idxFor = function (t) { return mod(Math.round(-t / STEP), N); };

  // start position from the hash (#slug), otherwise a quarter-turn settling onto the first work
  var start = Math.max(0, works.findIndex(function (w) { return w.slug === wheel.dataset.start; }));
  var fromHash = works.findIndex(function (w) { return "#" + w.slug === location.hash; });
  var markup = start;
  if (fromHash >= 0) start = fromHash;
  var target = -start * STEP;
  var theta = reduce ? target : target + 75;
  var introUntil = reduce ? 0 : performance.now() + 1500;
  var lastSnap = target, active = -1, shown = -1, plateTimer = 0, snapTimer = 0, moved = false;

  function setTheta(t) { wheel.style.setProperty("--t", t.toFixed(3) + "deg"); }

  function setActive(i) {
    if (i === active) return;
    active = i;
    var w = works[i];
    beads.forEach(function (b, k) { b.classList.toggle("is-active", k === i); });
    caption.classList.add("swap");
    setTimeout(function () {
      $("cap-series").textContent = w.series;
      $("cap-n").textContent = String(i + 1).padStart(2, "0");
      $("cap-title").textContent = w.title;
      $("cap-meta").textContent = w.year + " · " + w.medium + " · " + w.size;
      caption.classList.remove("swap");
    }, 180);
    hub.setAttribute("aria-label", "View " + w.title + " large");
    clearTimeout(plateTimer);
    plateTimer = setTimeout(function () { showPlate(idxFor(target)); }, Math.max(160, introUntil - performance.now()));
  }

  // the hub: two layers; the new plate surfaces out of the dark ground
  var front = 0;
  function showPlate(i) {
    if (i === shown) return;
    shown = i;
    var w = works[i], next = plates[1 - front], cur = plates[front];
    var img = new Image();
    img.onload = function () {
      if (shown !== i) return;
      next.src = w.cut; next.alt = w.title + ", " + w.year;
      requestAnimationFrame(function () {
        cur.classList.remove("is-on"); next.classList.add("is-on"); front = 1 - front;
      });
    };
    img.src = w.cut;
    [1, -1].forEach(function (d) { new Image().src = works[mod(i + d, N)].cut; });
  }

  var running = false;
  function tick() {
    var d = target - theta;
    theta = Math.abs(d) < 0.01 ? target : theta + d * (dragging ? 0.5 : 0.11);
    setTheta(theta);
    setActive(idxFor(theta));
    if (theta !== target || dragging) requestAnimationFrame(tick); else running = false;
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }

  function snap(bias) {
    var d = target - lastSnap, n = Math.round(d / STEP);
    if (n === 0 && Math.abs(d) > 2) n = Math.sign(d);
    if (bias) n += bias;
    target = lastSnap + n * STEP;
    lastSnap = target; kick();
    var w = works[idxFor(target)];
    if (history.replaceState) history.replaceState(null, "", "#" + w.slug);
  }
  function step(n) { target = lastSnap - n * STEP; lastSnap = target; snap(0); touched(); }
  function goTo(i) {
    var cur = idxFor(lastSnap), d = mod(i - cur, N);
    if (d > N / 2) d -= N;
    step(d);
  }
  function touched() { if (!moved) { moved = true; hint.classList.add("gone"); } }

  // scroll / trackpad
  wheel.closest(".stage").addEventListener("wheel", function (e) {
    if (proof.classList.contains("is-open")) return;
    if (innerWidth < 1100 && !wheel.contains(e.target)) return; // let the page scroll on small screens
    e.preventDefault();
    var dy = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (e.deltaMode === 1) dy *= 16;
    target -= Math.max(-40, Math.min(40, dy * 0.14)); kick();
    touched();
    clearTimeout(snapTimer);
    snapTimer = setTimeout(function () { snap(0); }, 130);
  }, { passive: false });

  // drag: turn it like the star wheel of a press
  var dragging = false, startA = 0, startT = 0, vel = 0, lastA = 0, lastTime = 0, travel = 0;
  function angleAt(e) {
    var r = wheel.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  }
  wheel.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    dragging = true; travel = 0; vel = 0;
    startA = lastA = angleAt(e); startT = target; lastTime = performance.now(); kick();
    wheel.setPointerCapture(e.pointerId);
  });
  wheel.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var a = angleAt(e), da = a - lastA;
    if (da > 180) da -= 360; if (da < -180) da += 360;
    var now = performance.now();
    vel = da / Math.max(1, now - lastTime) * 16;
    lastA = a; lastTime = now; travel += Math.abs(da);
    target += da; kick();
    if (travel > 3) { wheel.classList.add("dragging"); touched(); }
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false; wheel.classList.remove("dragging");
    if (travel <= 3) {   // a click, not a turn
      var b = e.target.closest && e.target.closest(".bead");
      if (b) goTo(+b.dataset.i);
      else if (e.target.closest && e.target.closest(".hub")) openProof();
      target = lastSnap = target; // nothing moved
      return;
    }
    target += Math.max(-60, Math.min(60, vel * 9));   // a little momentum
    snap(0);
  }
  wheel.addEventListener("pointerup", endDrag);
  wheel.addEventListener("pointercancel", endDrag);

  // keyboard
  beads.forEach(function (b) {
    b.addEventListener("click", function (e) { if (e.detail === 0) goTo(+b.dataset.i); }); // keyboard activation
  });
  hub.addEventListener("click", function (e) { if (e.detail === 0) openProof(); });
  $("prev").addEventListener("click", function () { step(-1); });
  $("next").addEventListener("click", function () { step(1); });
  $("open").addEventListener("click", function () { openProof(); });
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var open = proof.classList.contains("is-open");
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); step(1); if (open) fillProof(); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); step(-1); if (open) fillProof(); }
    else if (e.key === "Escape" && open) closeProof();
    else if (e.key === "Enter" && !open && document.activeElement === document.body) openProof();
  });

  // ---------- the impression ----------
  var proof = $("proof"), pImg = $("p-img"), pMark = $("plate-mark"), pDetail = $("p-detail");
  var showingDetail = false, lastFocus = null;

  function fillProof() {
    var i = idxFor(lastSnap), w = works[i];
    showingDetail = false; pDetail.textContent = "Detail";
    pDetail.hidden = !w.detail; pDetail.setAttribute("aria-pressed", "false");
    $("p-title").textContent = w.title;
    $("p-med").textContent = w.medium + ", " + w.size;
    $("p-year").textContent = w.year;
    $("p-count").textContent = String(i + 1).padStart(2, "0") + " / " + N + "   " + w.series;
    setProofImage(w.print, w.title + ", " + w.year, !w.round);
  }
  function setProofImage(src, alt, rect) {
    proof.classList.add("loading");
    var img = new Image();
    img.onload = function () {
      pImg.src = src; pImg.alt = alt;
      pMark.classList.toggle("rect", rect);
      requestAnimationFrame(function () { proof.classList.remove("loading"); });
    };
    img.src = src;
  }
  function originFromHub() {
    var r = hub.getBoundingClientRect();
    proof.style.setProperty("--x", (r.left + r.width / 2) + "px");
    proof.style.setProperty("--y", (r.top + r.height / 2) + "px");
    proof.style.setProperty("--r", (r.width / 2) + "px");
    proof.style.setProperty("--rmax", Math.hypot(innerWidth, innerHeight) + "px");
  }
  function openProof() {
    if (proof.classList.contains("is-open")) return;
    lastFocus = document.activeElement;
    fillProof();
    originFromHub();
    proof.hidden = false;
    proof.getBoundingClientRect();
    proof.classList.add("is-open");
    if (history.pushState) history.pushState({ proof: 1 }, "", location.hash);
    setTimeout(function () { $("p-close").focus({ preventScroll: true }); }, 50);
  }
  function closeProof(fromPop) {
    if (!proof.classList.contains("is-open")) return;
    originFromHub();
    proof.classList.remove("is-open");
    setTimeout(function () { if (!proof.classList.contains("is-open")) proof.hidden = true; }, reduce ? 0 : 900);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (!fromPop && history.state && history.state.proof) history.back();
  }
  addEventListener("popstate", function () { closeProof(true); });
  $("p-close").addEventListener("click", function () { closeProof(); });
  $("p-prev").addEventListener("click", function () { step(-1); fillProof(); });
  $("p-next").addEventListener("click", function () { step(1); fillProof(); });
  pDetail.addEventListener("click", function () {
    var w = works[idxFor(lastSnap)];
    showingDetail = !showingDetail;
    pDetail.setAttribute("aria-pressed", String(showingDetail));
    pDetail.textContent = showingDetail ? "Whole plate" : "Detail";
    $("p-title").textContent = w.title + (showingDetail ? " (detail)" : "");
    setProofImage(showingDetail ? w.detail : w.print, w.title + (showingDetail ? " (detail)" : ""), true);
  });
  // simple focus trap
  proof.addEventListener("keydown", function (e) {
    if (e.key !== "Tab") return;
    var f = Array.prototype.filter.call(proof.querySelectorAll("button"), function (b) { return !b.hidden; });
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // swipe between impressions on touch
  var sx = 0;
  proof.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  proof.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 60) { step(dx < 0 ? 1 : -1); fillProof(); }
  });

  // first plate is already in the markup
  if (/[?&]still\b/.test(location.search)) {   // for screenshots: skip the intro
    document.documentElement.classList.remove("js"); theta = target; introUntil = 0;
  }
  shown = start === markup ? start : -1;
  setTheta(theta);
  setActive(start);
  kick();
  if (/[?&]open\b/.test(location.search)) { reduce = true; openProof(); }
  if (/[?&]detail\b/.test(location.search)) pDetail.click();
})();
