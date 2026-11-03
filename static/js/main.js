(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "bioagent-df-theme";
  var LANG_KEY = "bioagent-df-lang";
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Language (the inline script in <head> picks it before first paint) ---------- */
  var STR = {
    en: {
      langToggle: "Switch to Chinese",
      themeToLight: "Switch to light theme",
      themeToDark: "Switch to dark theme",
      zoomIn: "Click the figure to zoom",
      zoomOut: "Click the figure to fit the screen",
      close: "Close figure viewer",
      tourTabs: "Figure 1 panels",
      tourAll: "Click a panel to zoom in",
      tourPanel: "Click for full screen",
      copy: "Copy",
      copied: "Copied",
      copyFail: "Select and copy"
    },
    zh: {
      langToggle: "切换到英文",
      themeToLight: "切换到浅色主题",
      themeToDark: "切换到深色主题",
      zoomIn: "点击图片放大",
      zoomOut: "点击图片适应屏幕",
      close: "关闭图片查看器",
      tourTabs: "图 1 分图",
      tourAll: "点击分图放大",
      tourPanel: "点击全屏查看",
      copy: "复制",
      copied: "已复制",
      copyFail: "请手动复制"
    }
  };
  var textHooks = [];
  function lang() { return root.getAttribute("data-lang") === "zh" ? "zh" : "en"; }
  function t(key) { return STR[lang()][key]; }
  function onLangChange(fn) { textHooks.push(fn); fn(); }
  function setLang(next) {
    root.setAttribute("data-lang", next);
    root.lang = next === "zh" ? "zh-CN" : "en";
    try { localStorage.setItem(LANG_KEY, next); } catch (e) {}
    try {
      // keep a shared ?lang= link in step with the choice
      var url = new URL(window.location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", next);
        history.replaceState(history.state, "", url.href);
      }
    } catch (e) {}
    textHooks.forEach(function (fn) { fn(); });
  }
  var langToggle = document.querySelector(".lang-toggle");
  if (langToggle) {
    langToggle.addEventListener("click", function () { setLang(lang() === "zh" ? "en" : "zh"); });
    onLangChange(function () { langToggle.setAttribute("aria-label", t("langToggle")); });
  }

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector(".theme-toggle");
  function isDark() {
    var theme = root.getAttribute("data-theme");
    return theme ? theme === "dark" : darkQuery.matches;
  }
  function syncToggle() {
    if (!toggle) return;
    toggle.setAttribute("aria-label", t(isDark() ? "themeToLight" : "themeToDark"));
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      syncToggle();
    });
  }
  if (darkQuery.addEventListener) darkQuery.addEventListener("change", syncToggle);
  onLangChange(syncToggle);

  /* ---------- Author cards: hover or focus on desktop, tap to toggle on touch ---------- */
  var authors = Array.prototype.slice.call(document.querySelectorAll(".author"));
  function placeCard(author) {
    // nudge the centred card so it never leaves the viewport
    var card = author.querySelector(".author-card");
    card.style.setProperty("--dx", "0px");
    var r = card.getBoundingClientRect(), margin = 12, dx = 0;
    if (r.left < margin) dx = margin - r.left;
    else if (r.right > window.innerWidth - margin) dx = window.innerWidth - margin - r.right;
    card.style.setProperty("--dx", Math.round(dx) + "px");
  }
  function setOpen(author, on) {
    author.classList.toggle("open", on);
    author.querySelector(".author-name").setAttribute("aria-expanded", on ? "true" : "false");
  }
  authors.forEach(function (author) {
    var button = author.querySelector(".author-name");
    author.addEventListener("mouseenter", function () { placeCard(author); });
    button.addEventListener("focus", function () { placeCard(author); });
    button.addEventListener("click", function () {
      var on = !author.classList.contains("open");
      authors.forEach(function (other) { if (other !== author) setOpen(other, false); });
      if (on) placeCard(author);
      setOpen(author, on);
      if (!on) button.blur();
    });
  });
  document.addEventListener("click", function (event) {
    authors.forEach(function (author) { if (!author.contains(event.target)) setOpen(author, false); });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    authors.forEach(function (author) {
      if (author.classList.contains("open") || author.contains(document.activeElement)) {
        setOpen(author, false);
        if (author.contains(document.activeElement)) document.activeElement.blur();
      }
    });
  });

  /* ---------- Math (KaTeX loads after this script; plain-text fallbacks stay if it fails) ---------- */
  function renderMath() {
    if (!window.katex) return;
    var nodes = document.querySelectorAll("[data-tex]:not([data-rendered])");
    for (var i = 0; i < nodes.length; i++) {
      try {
        window.katex.render(nodes[i].getAttribute("data-tex"), nodes[i], { throwOnError: false });
        nodes[i].setAttribute("data-rendered", "");
      } catch (e) {}
    }
  }
  var katexScript = document.getElementById("katex-js");
  if (katexScript) katexScript.addEventListener("load", renderMath);
  window.addEventListener("load", renderMath);
  renderMath();

  /* ---------- Hero motif: no travelling pulses when motion is reduced ---------- */
  if (reduceMotion.matches) {
    var dots = document.querySelectorAll(".m-dot");
    for (var d = 0; d < dots.length; d++) dots[d].parentNode.removeChild(dots[d]);
  }

  /* ---------- Sticky nav state and section highlighting ---------- */
  var nav = document.querySelector(".topnav");
  function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  if ("IntersectionObserver" in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    // the abstract has no link of its own; it belongs to the overview
    if (byId.overview) byId.abstract = byId.overview;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("active"); });
        if (byId[entry.target.id]) byId[entry.target.id].classList.add("active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Figure lightbox ---------- */
  var openViewer = null;
  var dialog = document.querySelector(".lightbox");
  if (dialog && typeof dialog.showModal === "function") {
    var stage = dialog.querySelector(".lb-stage");
    var big = stage.querySelector("img");
    var title = dialog.querySelector(".lb-title");
    var hint = dialog.querySelector(".lb-hint");
    var original = dialog.querySelector(".lb-open");
    var closeBtn = dialog.querySelector(".lb-close");
    var zoomFactor = 0;
    var zoomed = false;
    var openCount = 0;

    function syncHint() { if (hint) hint.textContent = t(zoomed ? "zoomOut" : "zoomIn"); }
    function setZoom(on) {
      // Raster figures zoom to their natural size; vector figures (data-zoom) to a multiple of the fitted width
      if (on && !zoomed && zoomFactor) big.style.width = Math.round(big.getBoundingClientRect().width * zoomFactor) + "px";
      if (!on) big.style.width = "";
      zoomed = on;
      stage.classList.toggle("zoomed", on);
      syncHint();
    }
    onLangChange(function () {
      syncHint();
      closeBtn.setAttribute("aria-label", t("close"));
    });

    // focus: optional {x, y} fractions of the figure to centre after zooming in
    openViewer = function (link, focus) {
      var id = ++openCount;
      setZoom(false);
      zoomFactor = parseFloat(link.getAttribute("data-zoom")) || 0;
      var thumb = link.querySelector("img");
      big.src = link.href;
      big.alt = thumb ? thumb.alt : "";
      title.textContent = (lang() === "zh" && link.getAttribute("data-title-zh")) || link.getAttribute("data-title") || "";
      original.href = link.href;
      dialog.showModal();
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
      if (!focus) return;
      function zoomToFocus() {
        if (id !== openCount || !dialog.open) return;
        setZoom(true);
        var r = big.getBoundingClientRect();
        var s = stage.getBoundingClientRect();
        stage.scrollLeft = r.left - s.left + focus.x * r.width - s.width / 2;
        stage.scrollTop = r.top - s.top + focus.y * r.height - s.height / 2;
      }
      if (big.complete && big.naturalWidth) zoomToFocus();
      else big.addEventListener("load", zoomToFocus, { once: true });
    };

    Array.prototype.forEach.call(document.querySelectorAll("a.fig-frame:not(.tour-view)"), function (link) {
      link.addEventListener("click", function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openViewer(link);
      });
    });

    big.addEventListener("click", function (event) {
      var rect = big.getBoundingClientRect();
      var fx = (event.clientX - rect.left) / rect.width;
      var fy = (event.clientY - rect.top) / rect.height;
      var zooming = !zoomed;
      setZoom(zooming);
      if (zooming) {
        // keep the clicked point under the cursor after zooming in
        var r = big.getBoundingClientRect();
        stage.scrollLeft = fx * r.width - (event.clientX - stage.getBoundingClientRect().left);
        stage.scrollTop = fy * r.height - (event.clientY - stage.getBoundingClientRect().top);
      }
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target === stage) dialog.close();
    });
    closeBtn.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("close", function () {
      setZoom(false);
      big.removeAttribute("src");
    });
  }

  /* ---------- Figure 1 tour: tabs zoom the framework figure onto one panel ---------- */
  var tour = document.querySelector(".tour");
  if (tour) {
    var FIG_W = 1536, FIG_H = 1024, PAD = 12, MAX_SCALE = 2.6;
    // Panel rectangles in the SVG's own units (x, y, width, height); update if the figure's layout changes
    var PANELS = {
      a: [4, 4, 1528, 404],
      b: [1, 420, 746, 279],
      c: [757, 420, 778, 279],
      d: [1, 710, 678, 304],
      e: [689, 710, 846, 304]
    };
    var tabs = Array.prototype.slice.call(tour.querySelectorAll('[role="tab"]'));
    var panes = Array.prototype.slice.call(tour.querySelectorAll('[role="tabpanel"]'));
    var tabList = tour.querySelector('[role="tablist"]');
    var view = tour.querySelector(".tour-view");
    var canvas = tour.querySelector(".tour-canvas");
    var layer = tour.querySelector(".tour-layer");
    var spot = tour.querySelector(".tour-spot");
    var tourHint = tour.querySelector(".tour-hint");
    var current = "all";

    function pct(v, total) { return (v / total * 100).toFixed(3) + "%"; }
    function syncTourText() {
      if (tourHint) tourHint.textContent = t(current === "all" ? "tourAll" : "tourPanel");
      if (tabList) tabList.setAttribute("aria-label", t("tourTabs"));
    }
    function show(id, focusTab) {
      current = id;
      tabs.forEach(function (tab) {
        var on = tab.getAttribute("data-panel") === id;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (on && focusTab) tab.focus();
        // on narrow screens the tab strip scrolls sideways; keep the selected tab in view without moving the page
        if (on && tabList && tabList.scrollWidth > tabList.clientWidth) {
          tabList.scrollLeft = tab.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2;
        }
      });
      panes.forEach(function (pane) { pane.hidden = pane.getAttribute("data-panel") !== id; });

      // Fit the panel (plus a margin) into the 3:2 canvas, then clamp so the view never leaves the figure
      var r = PANELS[id], s = 1, x = 0, y = 0;
      if (r) {
        s = Math.max(1, Math.min(FIG_W / (r[2] + 2 * PAD), FIG_H / (r[3] + 2 * PAD), MAX_SCALE));
        x = Math.min(0, Math.max(FIG_W - s * FIG_W, FIG_W / 2 - s * (r[0] + r[2] / 2)));
        y = Math.min(0, Math.max(FIG_H - s * FIG_H, FIG_H / 2 - s * (r[1] + r[3] / 2)));
        spot.style.left = pct(r[0], FIG_W);
        spot.style.top = pct(r[1], FIG_H);
        spot.style.width = pct(r[2], FIG_W);
        spot.style.height = pct(r[3], FIG_H);
      } else {
        spot.style.left = spot.style.top = "0%";
        spot.style.width = spot.style.height = "100%";
      }
      layer.style.setProperty("--s", s.toFixed(4));
      layer.style.transform = "translate(" + pct(x, FIG_W) + ", " + pct(y, FIG_H) + ") scale(" + s.toFixed(4) + ")";
      tour.setAttribute("data-view", id);
      syncTourText();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { show(tab.getAttribute("data-panel")); });
      tab.addEventListener("keydown", function (event) {
        var j = -1;
        if (event.key === "ArrowRight") j = (i + 1) % tabs.length;
        else if (event.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") j = 0;
        else if (event.key === "End") j = tabs.length - 1;
        if (j < 0) return;
        event.preventDefault();
        show(tabs[j].getAttribute("data-panel"), true);
      });
    });

    view.addEventListener("click", function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // On the full figure a pointer click picks the panel under it; otherwise open the viewer
      if (current === "all" && event.detail > 0) {
        var box = canvas.getBoundingClientRect();
        var fx = (event.clientX - box.left) / box.width * FIG_W;
        var fy = (event.clientY - box.top) / box.height * FIG_H;
        var hit = null;
        Object.keys(PANELS).forEach(function (id) {
          var p = PANELS[id];
          if (!hit && fx >= p[0] - 8 && fx <= p[0] + p[2] + 8 && fy >= p[1] - 8 && fy <= p[1] + p[3] + 8) hit = id;
        });
        if (hit) {
          event.preventDefault();
          show(hit);
          return;
        }
      }
      if (!openViewer) return;
      event.preventDefault();
      var r = PANELS[current];
      openViewer(view, r ? { x: (r[0] + r[2] / 2) / FIG_W, y: (r[1] + r[3] / 2) / FIG_H } : null);
    });

    onLangChange(syncTourText);
    show("all");
  }

  /* ---------- Copy BibTeX ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy]"), function (button) {
    var label = button.querySelector("span");
    var state = "copy";
    var resetTimer;
    function render() {
      label.textContent = t(state);
      label.lang = lang() === "zh" ? "zh-CN" : "en";
    }
    function report(ok) {
      state = ok ? "copied" : "copyFail";
      render();
      button.classList.toggle("done", ok);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        state = "copy";
        render();
        button.classList.remove("done");
      }, 1800);
    }
    function fallbackCopy(node) {
      var range = document.createRange();
      range.selectNodeContents(node);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      selection.removeAllRanges();
      return ok;
    }
    onLangChange(render);
    button.addEventListener("click", function () {
      var node = document.getElementById(button.getAttribute("data-copy"));
      if (!node) return;
      var text = node.textContent;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { report(true); }, function () { report(fallbackCopy(node)); });
      } else {
        report(fallbackCopy(node));
      }
    });
  });
})();
