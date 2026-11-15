/* Marina Maroz — "The Exhibition" */
(function () {
  "use strict";
  var doc = document.documentElement, body = document.body;
  doc.classList.add("js");

  // current page in the menu
  var here = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".menu a").forEach(function (a) {
    if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page");
  });

  // ---------- List of works: floating preview ----------
  var preview = document.querySelector(".cl-preview");
  if (preview && matchMedia("(hover: hover)").matches) {
    var pimg = preview.querySelector("img");
    document.querySelectorAll(".cl-room li a").forEach(function (a) {
      a.addEventListener("mouseenter", function () { pimg.src = a.dataset.img; preview.classList.add("on"); });
      a.addEventListener("mouseleave", function () { preview.classList.remove("on"); });
    });
    addEventListener("mousemove", function (e) {
      var x = Math.min(e.clientX + 40, innerWidth - 280);
      preview.style.transform = "translate(" + x + "px," + (e.clientY - 130) + "px)";
    }, { passive: true });
  }

  if (!body.classList.contains("page-exhibition")) return;

  var NAMES = { entrance: "Entrance", evidences: "Room I · Evidences", harvest: "Room II · Harvest", exlibris: "Room III · Ex libris", exit: "Exit" };
  var hudRoom = document.querySelector(".hud-room");
  var hudCount = document.querySelector(".hud-count b");
  var plan = document.querySelectorAll(".hud-plan a");
  var entrance = document.querySelector(".entrance");

  function setRoom(room) {
    if (body.dataset.room === room) return;
    body.dataset.room = room;
    hudRoom.textContent = NAMES[room] || "";
    plan.forEach(function (a) { a.classList.toggle("on", a.dataset.plan === room); });
  }
  function setCount(n) { hudCount.textContent = n ? String(n).padStart(2, "0") : "00"; }

  // which screen sits in the middle of the viewport
  var screens = document.querySelectorAll(".screen, .xl");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var s = en.target;
      setRoom(s.dataset.room);
      s.classList.add("seen");
      if (s.dataset.work) setCount(s.dataset.work);
      else if (s.classList.contains("room-title") || s.classList.contains("entrance")) setCount(0);
      body.classList.toggle("past-entrance", s !== entrance);
      body.classList.toggle("at-exit", s.dataset.room === "exit");
      body.classList.toggle("on-detail", s.classList.contains("detail"));
    });
  }, { rootMargin: "-49% 0px -49% 0px" });
  screens.forEach(function (s) { io.observe(s); });
  // reveal works a little earlier than the midpoint
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) en.target.classList.add("seen"); });
  }, { threshold: 0.35 });
  document.querySelectorAll(".work, .room-title, .detail").forEach(function (s) { io2.observe(s); });

  // entrance spotlight follows the pointer
  if (entrance && matchMedia("(hover: hover)").matches) {
    entrance.addEventListener("pointermove", function (e) {
      var r = entrance.getBoundingClientRect();
      entrance.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      entrance.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  }

  // ---------- Ex libris: horizontal walk driven by vertical scroll ----------
  var xl = document.querySelector(".xl");
  if (xl) {
    var track = xl.querySelector(".xl-track");
    var items = Array.prototype.slice.call(xl.querySelectorAll(".xl-item"));
    var n = items.length, ticking = false, lastN = -1;
    var update = function () {
      ticking = false;
      var top = xl.getBoundingClientRect().top;
      var step = xl.offsetHeight / n;
      var p = Math.max(0, Math.min(n - 1, -top / step));
      var slot = items[0].offsetWidth;
      track.style.transform = "translate3d(" + (innerWidth / 2 - slot * (p + 0.5)).toFixed(1) + "px,0,0)";
      items.forEach(function (it, i) {
        var d = Math.min(1, Math.abs(i - p));
        it.style.opacity = (1 - d * 0.75).toFixed(3);
        it.style.transform = "scale(" + (1 - d * 0.14).toFixed(4) + ")";
      });
      xl.classList.toggle("moved", p > 0.15);
      var cur = Math.round(p);
      if (top <= innerHeight / 2 && top + xl.offsetHeight >= innerHeight / 2 && cur !== lastN) {
        lastN = cur; setCount(items[cur].querySelector(".art").dataset.n);
      }
      if (top > innerHeight / 2 || top + xl.offsetHeight < innerHeight / 2) lastN = -1;
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    update();
  }

  // arriving with #slug: jump straight there (no smooth travel through the rooms)
  function jump() {
    var id = decodeURIComponent(location.hash.slice(1));
    var t = id && document.getElementById(id);
    if (!t) return;
    doc.style.scrollBehavior = "auto";
    var y = t.getBoundingClientRect().top + scrollY;
    if (t.classList.contains("xl-snap")) y = t.offsetTop + t.parentNode.getBoundingClientRect().top + scrollY;
    scrollTo(0, y);
    requestAnimationFrame(function () { doc.style.scrollBehavior = ""; });
  }
  if (location.hash) { jump(); addEventListener("load", jump); }

  // ---------- Viewer: look closer ----------
  var viewer = document.querySelector(".viewer");
  var arts = Array.prototype.slice.call(document.querySelectorAll(".art"));
  var vimg = viewer.querySelector(".v-stage img");
  var vcap = viewer.querySelector(".v-cap");
  var stage = viewer.querySelector(".v-stage");
  var idx = 0, lastFocus = null;

  function show(i) {
    idx = (i + arts.length) % arts.length;
    var a = arts[idx];
    var lab = a.parentNode.querySelector(".label");
    viewer.classList.remove("zoomed");
    vimg.src = a.dataset.full;
    vimg.alt = a.querySelector("img").alt;
    vcap.innerHTML = "<em>" + lab.querySelector(".t").textContent + "</em>, " + lab.querySelector(".y").textContent +
      " <span>· " + lab.querySelector(".m").textContent + ", " + lab.querySelector(".s").textContent + "</span>";
  }
  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    viewer.hidden = false;
    body.classList.add("viewing");
    viewer.querySelector(".v-close").focus();
  }
  function close() {
    viewer.hidden = true;
    body.classList.remove("viewing");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  arts.forEach(function (a, i) { a.addEventListener("click", function () { open(i); }); });
  document.querySelectorAll(".closer").forEach(function (c) {
    c.addEventListener("click", function () { c.closest(".hang").querySelector(".art").click(); });
  });
  viewer.querySelector(".v-close").addEventListener("click", close);
  viewer.querySelector(".v-prev").addEventListener("click", function () { show(idx - 1); });
  viewer.querySelector(".v-next").addEventListener("click", function () { show(idx + 1); });
  function origin(e) {
    var r = vimg.getBoundingClientRect();
    var x = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
    var y = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100));
    vimg.style.setProperty("--ox", x + "%"); vimg.style.setProperty("--oy", y + "%");
  }
  stage.addEventListener("click", function (e) { origin(e); viewer.classList.toggle("zoomed"); });
  stage.addEventListener("pointermove", function (e) { if (viewer.classList.contains("zoomed")) origin(e); });
  addEventListener("keydown", function (e) {
    if (viewer.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(idx + 1);
    else if (e.key === "ArrowLeft") show(idx - 1);
  });
})();
