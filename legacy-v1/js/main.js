/* TransferLux — interactions */
(function () {
  "use strict";

  var MANAGER = "manager_bus_lux";
  var IMG = function (id, w, h, q) {
    return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=" + w + (h ? "&h=" + h : "") + "&q=" + (q || 70);
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- i18n ---------------- */
  var dict = window.I18N || { uk: {} };
  var lang = "uk";
  // collect Ukrainian originals from the HTML
  $$("[data-i18n]").forEach(function (el) {
    var k = el.getAttribute("data-i18n");
    if (!(k in dict.uk)) dict.uk[k] = el.innerHTML;
  });
  $$("[data-i18n-ph]").forEach(function (el) {
    var k = el.getAttribute("data-i18n-ph");
    if (!(k in dict.uk)) dict.uk[k] = el.getAttribute("placeholder");
  });
  function t(k) { return (dict[lang] && dict[lang][k] != null) ? dict[lang][k] : (dict.uk[k] != null ? dict.uk[k] : k); }

  function setLang(l) {
    if (!dict[l]) l = "uk";
    lang = l;
    document.documentElement.lang = l === "uk" ? "uk" : l;
    $$("[data-i18n]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-ph]").forEach(function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    $$("[data-lang]").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-lang") === l); });
    document.title = t("meta.title");
    store.set("tl-lang", l);
    renderGalleryCaptions();
    renderMapLabels();
  }
  $$("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });

  /* ---------------- Header / menu ---------------- */
  var header = $("#header"), fab = $(".fab"), bookingSec = $("#booking");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle("is-scrolled", y > 30);
    var r = bookingSec.getBoundingClientRect();
    var overForm = r.top < window.innerHeight && r.bottom > 0;
    fab.classList.toggle("is-visible", y > window.innerHeight * 0.6 && !overForm);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = $("#burger"), mmenu = $("#mobileMenu");
  function toggleMenu(open) {
    if (open === undefined) open = !mmenu.classList.contains("is-open");
    mmenu.classList.toggle("is-open", open);
    mmenu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);
  }
  burger.addEventListener("click", function () { toggleMenu(); });
  $$("#mobileMenu a").forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1100 && mmenu.classList.contains("is-open")) toggleMenu(false); });

  // active nav item
  var navLinks = $$(".nav a");
  if ("IntersectionObserver" in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("section[id]").forEach(function (s) { secObs.observe(s); });
  }

  /* ---------------- Reveal ---------------- */
  var reveals = $$(".reveal");
  // stagger siblings
  reveals.forEach(function (el) {
    var p = el.parentElement, sib = $$(":scope > .reveal", p);
    var i = sib.indexOf(el);
    if (sib.length > 1 && i > 0) el.style.setProperty("--d", Math.min(i * 0.07, 0.42) + "s");
  });
  if ("IntersectionObserver" in window) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); rObs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { rObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------------- Card glow follows cursor ---------------- */
  if (window.matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", function (e) {
      var c = e.target.closest && e.target.closest(".card");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px");
      c.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---------------- Fleet tabs ---------------- */
  $$("[data-vehicle]").forEach(function (v) {
    var imgs = $$(".vehicle__media img", v), btns = $$(".vehicle__tabs button", v);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        var n = +b.getAttribute("data-view");
        btns.forEach(function (x) { x.classList.toggle("is-active", x === b); });
        imgs.forEach(function (im, i) { im.classList.toggle("is-active", i === n); });
      });
    });
  });

  /* ---------------- Gallery ---------------- */
  var photos = [
    { id: "photo-1765461734605-34657fa04db2", c: "ext", k: "g.1", s: "is-wide" },
    { id: "photo-1552561018-5fea54c08479", c: "int", k: "g.4", s: "is-tall" },
    { id: "photo-1684208551876-bbfbcf11ab02", c: "seat", k: "g.5" },
    { id: "photo-1688619103602-35c5b27a6619", c: "ext", k: "g.2" },
    { id: "photo-1542705959-878ca346eb20", c: "road", k: "g.7", s: "is-wide" },
    { id: "photo-1570125910130-67cb59733d1d", c: "seat", k: "g.6" },
    { id: "photo-1623835176016-bcaf8bca4a90", c: "ext", k: "g.3", s: "is-tall" },
    { id: "photo-1710969271696-96d56d819088", c: "int", k: "g.8" },
    { id: "photo-1614972973038-0b48128b999c", c: "ext", k: "g.9" },
    { id: "photo-1515445702422-3a80ccfdb236", c: "road", k: "g.10" },
    { id: "photo-1750210505997-ed85e9f8cb12", c: "seat", k: "g.11", s: "is-wide" },
    { id: "photo-1688619102600-976b3bb41aaf", c: "ext", k: "g.12" },
    { id: "photo-1753295687824-22b36f3daa33", c: "int", k: "g.13" },
    { id: "photo-1563916171915-9797367db280", c: "road", k: "g.14" }
  ];
  var grid = $("#galleryGrid");
  grid.innerHTML = photos.map(function (p, i) {
    return '<figure class="gallery__item reveal ' + (p.s || "") + '" data-cat="' + p.c + '" data-i="' + i + '" tabindex="0" role="button">' +
      '<img loading="lazy" decoding="async" alt="" src="' + IMG(p.id, 700, 520) + '" srcset="' + IMG(p.id, 420, 320) + ' 420w, ' + IMG(p.id, 900, 680) + ' 900w" sizes="(max-width:640px) 50vw, (max-width:1100px) 33vw, 25vw">' +
      '<figcaption><small></small><span></span></figcaption></figure>';
  }).join("");
  var items = $$(".gallery__item", grid);
  if ("IntersectionObserver" in window) {
    var gObs = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); gObs.unobserve(e.target); } }); }, { threshold: 0.1 });
    items.forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 0.06 + "s"); gObs.observe(el); });
  } else items.forEach(function (el) { el.classList.add("is-in"); });

  function renderGalleryCaptions() {
    items.forEach(function (el, i) {
      var p = photos[i];
      $("small", el).textContent = t("cat." + p.c);
      $("span", el).textContent = t(p.k);
      $("img", el).alt = t(p.k);
    });
  }

  var filter = "all";
  $$(".filters button").forEach(function (b) {
    b.addEventListener("click", function () {
      filter = b.getAttribute("data-filter");
      $$(".filters button").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      items.forEach(function (el) {
        var show = filter === "all" || el.getAttribute("data-cat") === filter;
        el.classList.toggle("is-hidden", !show);
        el.classList.remove("is-entering");
        if (show) { void el.offsetWidth; el.classList.add("is-entering", "is-in"); }
      });
    });
  });

  /* Lightbox */
  var lb = $("#lightbox"), lbImg = $("img", lb), lbCap = $("figcaption", lb), lbCount = $(".lightbox__count", lb);
  var visible = [], cur = 0, lastFocus = null;
  function openLb(i) {
    visible = items.filter(function (el) { return !el.classList.contains("is-hidden"); }).map(function (el) { return +el.getAttribute("data-i"); });
    cur = Math.max(0, visible.indexOf(i));
    lastFocus = document.activeElement;
    showLb();
    lb.classList.add("is-open"); lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $(".lightbox__close", lb).focus();
  }
  function showLb() {
    var p = photos[visible[cur]];
    lbImg.classList.add("is-loading");
    var w = Math.min(2000, Math.round(window.innerWidth * (window.devicePixelRatio || 1)));
    lbImg.onload = function () { lbImg.classList.remove("is-loading"); };
    lbImg.src = IMG(p.id, w, null, 80);
    lbImg.alt = t(p.k);
    lbCap.textContent = t("cat." + p.c) + " · " + t(p.k);
    lbCount.textContent = (cur + 1) + " / " + visible.length;
  }
  function closeLb() {
    lb.classList.remove("is-open"); lb.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }
  function step(d) { cur = (cur + d + visible.length) % visible.length; showLb(); }
  items.forEach(function (el) {
    el.addEventListener("click", function () { openLb(+el.getAttribute("data-i")); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLb(+el.getAttribute("data-i")); } });
  });
  $(".lightbox__close", lb).addEventListener("click", closeLb);
  $(".lightbox__prev", lb).addEventListener("click", function () { step(-1); });
  $(".lightbox__next", lb).addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox__fig")) closeLb(); });
  var tx = null;
  lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (tx == null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });

  /* ---------------- Map ---------------- */
  var cities = {
    kyiv: [562, 159], lviv: [454, 174], warsaw: [404, 114], prague: [294, 168], berlin: [277, 107], vienna: [326, 215],
    paris: [93, 199], amsterdam: [135, 111], brussels: [126, 149], milan: [207, 284], rome: [262, 373]
  };
  var labelPos = { kyiv: [0, -16, "middle"], lviv: [0, 22, "middle"], warsaw: [0, -13, "middle"], berlin: [0, -13, "middle"], prague: [-10, 4, "end"],
    vienna: [10, 16, "start"], paris: [0, 22, "middle"], amsterdam: [10, -6, "start"], brussels: [10, 12, "start"], milan: [10, 4, "start"], rome: [10, 4, "start"] };
  var countryCity = { kyiv: ["kyiv", "lviv"], warsaw: ["warsaw"], prague: ["prague"], berlin: ["berlin"], vienna: ["vienna"], paris: ["paris"],
    amsterdam: ["amsterdam"], brussels: ["brussels"], rome: ["rome", "milan"] };
  var svg = $("#geoMap"), NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) { var n = document.createElementNS(NS, tag); for (var a in attrs) n.setAttribute(a, attrs[a]); if (parent) parent.appendChild(n); return n; }
  var defs = el("defs", {}, svg);
  var lg = el("linearGradient", { id: "routeGrad", x1: "1", y1: "0", x2: "0", y2: "0" }, defs);
  el("stop", { offset: "0", "stop-color": "#f0d9a4" }, lg); el("stop", { offset: "1", "stop-color": "#a8823f" }, lg);
  var gRoutes = el("g", {}, svg), gAnim = el("g", {}, svg), gCities = el("g", {}, svg);
  var routeEls = {}, cityEls = {}, home = cities.kyiv;
  Object.keys(cities).forEach(function (k, i) {
    var c = cities[k];
    if (k !== "kyiv") {
      var mx = (home[0] + c[0]) / 2, my = (home[1] + c[1]) / 2, dist = Math.hypot(c[0] - home[0], c[1] - home[1]);
      var d = "M" + home[0] + "," + home[1] + " Q" + mx + "," + (my - dist * 0.28) + " " + c[0] + "," + c[1];
      routeEls[k] = el("path", { d: d, class: "route" }, gRoutes);
      var a = el("path", { d: d, class: "route-anim" }, gAnim);
      a.style.animationDelay = (i * 0.45) + "s";
      a.style.animationDuration = (2.5 + dist / 200) + "s";
    }
    var g = el("g", { class: "city" + (k === "kyiv" ? " home" : "") }, gCities);
    el("circle", { class: "halo", cx: c[0], cy: c[1], r: k === "kyiv" ? 10 : 6 }, g).style.animationDelay = (i * 0.3) + "s";
    el("circle", { class: "dot", cx: c[0], cy: c[1], r: k === "kyiv" ? 5 : 3.5 }, g);
    var lp = labelPos[k];
    var tEl = el("text", { x: c[0] + lp[0], y: c[1] + lp[1], "text-anchor": lp[2] }, g);
    tEl.setAttribute("data-city", k);
    cityEls[k] = g;
  });
  function renderMapLabels() { $$("text[data-city]", svg).forEach(function (x) { x.textContent = t("city." + x.getAttribute("data-city")); }); }
  function highlight(key) {
    var list = key ? countryCity[key] || [] : [];
    Object.keys(routeEls).forEach(function (k) { routeEls[k].classList.toggle("is-hl", list.indexOf(k) > -1); });
    Object.keys(cityEls).forEach(function (k) { cityEls[k].classList.toggle("is-hl", list.indexOf(k) > -1); });
  }
  $$("#countries button").forEach(function (b) {
    var k = b.getAttribute("data-city");
    b.addEventListener("mouseenter", function () { highlight(k); });
    b.addEventListener("focus", function () { highlight(k); });
    b.addEventListener("mouseleave", function () { var a = $("#countries button.is-active"); highlight(a ? a.getAttribute("data-city") : null); });
    b.addEventListener("click", function () {
      var on = !b.classList.contains("is-active");
      $$("#countries button").forEach(function (x) { x.classList.remove("is-active"); });
      if (on) b.classList.add("is-active");
      highlight(on ? k : null);
    });
  });

  /* ---------------- Booking form ---------------- */
  var form = $("#bookingForm");
  var selectedService = null;
  $$("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () { selectedService = a.getAttribute("data-service") + ".t"; });
  });
  var customBtn = $("[data-custom-route]");
  if (customBtn) customBtn.addEventListener("click", function () { selectedService = "msg.custom"; setTimeout(function () { form.elements.from.focus({ preventScroll: true }); }, 700); });

  // date: today or later
  var dateInput = form.elements.date;
  function todayStr() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  dateInput.min = todayStr();

  // keep a draft (per-viewer convenience)
  var DRAFT = "tl-draft";
  try {
    var draft = JSON.parse(store.get(DRAFT) || "{}");
    ["name", "from", "to", "pax", "phone", "notes"].forEach(function (n) { if (draft[n]) form.elements[n].value = draft[n]; });
  } catch (e) {}
  form.addEventListener("input", function (e) {
    var f = e.target.closest(".field"); if (f) f.classList.remove("is-invalid");
    var o = {}; ["name", "from", "to", "pax", "phone", "notes"].forEach(function (n) { o[n] = form.elements[n].value; });
    store.set(DRAFT, JSON.stringify(o));
  });

  function validate() {
    var ok = true, first = null;
    function bad(name) { var f = form.elements[name].closest(".field"); f.classList.add("is-invalid"); ok = false; if (!first) first = form.elements[name]; }
    ["name", "from", "to"].forEach(function (n) { if (form.elements[n].value.trim().length < 2) bad(n); });
    var dv = dateInput.value;
    if (!dv || dv < todayStr()) bad("date");
    var ph = form.elements.phone.value.trim(), digits = ph.replace(/\D/g, "");
    if (!/^[+\d\s()\-]+$/.test(ph) || digits.length < 9 || digits.length > 15) bad("phone");
    if (first) first.focus();
    return ok;
  }

  function fmtDate(v) { var p = v.split("-"); return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : v; }

  function buildMessage() {
    var e = form.elements, L = [];
    L.push(t("msg.head"));
    L.push("");
    if (selectedService) L.push("• " + t("msg.service") + ": " + t(selectedService).replace(/<[^>]+>/g, ""));
    L.push("• " + t("msg.name") + ": " + e.name.value.trim());
    L.push("• " + t("msg.from") + ": " + e.from.value.trim());
    L.push("• " + t("msg.to") + ": " + e.to.value.trim());
    L.push("• " + t("msg.date") + ": " + fmtDate(e.date.value));
    L.push("• " + t("msg.pax") + ": " + (e.pax.value === "9+" ? t("f.pax_more") : e.pax.value));
    L.push("• " + t("msg.phone") + ": " + e.phone.value.trim());
    if (e.notes.value.trim()) L.push("• " + t("msg.notes") + ": " + e.notes.value.trim());
    return L.join("\n");
  }

  var modal = $("#sendModal"), reqText = $("#requestText"), copyStatus = $("#copyStatus"), openTg = $("#openTg");

  function fallbackCopy() {
    try {
      reqText.removeAttribute("readonly");
      reqText.focus({ preventScroll: true });
      reqText.select();
      reqText.setSelectionRange(0, reqText.value.length);
      var ok = document.execCommand("copy");
      reqText.setAttribute("readonly", "");
      return ok;
    } catch (e) { reqText.setAttribute("readonly", ""); return false; }
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(); });
    }
    return Promise.resolve(fallbackCopy());
  }
  function setStatus(ok, again) {
    copyStatus.className = "modal__status " + (ok ? "ok" : "warn");
    copyStatus.textContent = ok ? t(again ? "js.copied_again" : "js.copied") : t("js.copyfail");
  }
  function openModal() {
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }
  function closeModal() {
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;
    var text = buildMessage();
    reqText.value = text;
    openTg.href = "https://t.me/" + MANAGER + "?text=" + encodeURIComponent(text);
    copyStatus.className = "modal__status"; copyStatus.textContent = "";
    openModal();
    copyText(text).then(function (ok) { setStatus(ok); });
  });
  $("#copyAgain").addEventListener("click", function () { copyText(reqText.value).then(function (ok) { setStatus(ok, true); }); });
  $(".modal__close", modal).addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  /* ---------------- Keyboard ---------------- */
  document.addEventListener("keydown", function (e) {
    if (lb.classList.contains("is-open")) {
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    } else if (modal.classList.contains("is-open")) {
      if (e.key === "Escape") closeModal();
    } else if (mmenu.classList.contains("is-open") && e.key === "Escape") toggleMenu(false);
  });

  /* ---------------- Init ---------------- */
  $("#year").textContent = new Date().getFullYear();
  setLang(store.get("tl-lang") || "uk");
})();
