/* ============================================================
   Portfolio — main.js
   Theme toggle, mobile nav, scroll reveal, project rendering
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- Theme ---------------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
    });
  }

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navMenu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Project rendering ---------------- */
  var grid = document.getElementById("projectsGrid");
  var filtersEl = document.getElementById("filters");
  var searchEl = document.getElementById("projectSearch");
  var emptyEl = document.getElementById("projectsEmpty");

  var LANG_COLORS = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", PHP: "#4F5D95", Java: "#b07219",
    Kotlin: "#A97BFF", Rust: "#dea584", Python: "#3572A5", HTML: "#e34c26",
    CSS: "#563d7c", Lua: "#000080", Shell: "#89e051", C: "#555555",
    "C++": "#f34b7d", CSharp: "#178600", Go: "#00ADD8", Ruby: "#701516",
    Swift: "#F05138", Dart: "#00B4AB", Vue: "#41b883", Svelte: "#ff3e00"
  };

  var state = { projects: [], lang: "All", query: "" };

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function langColor(lang) {
    return LANG_COLORS[lang] || "var(--muted)";
  }

  function cardTemplate(p) {
    var badges = "";
    if (p.private) badges += '<span class="badge badge-private" title="Private repository">Private</span>';
    if (p.fork) badges += '<span class="badge badge-fork" title="Forked repository">Fork</span>';

    var meta = "";
    if (p.language) {
      meta += '<span class="lang-dot" style="--lang:' + langColor(p.language) + '">' +
              escapeHtml(p.language) + "</span>";
    }
    if (p.stars > 0) {
      meta += "<span>★ " + p.stars + "</span>";
    }

    var links = "";
    if (p.homepage) {
      links += '<a class="project-link" href="' + escapeHtml(p.homepage) +
               '" target="_blank" rel="noopener">Live ↗</a>';
    }
    links += '<a class="project-link" href="' + escapeHtml(p.url) +
             '" target="_blank" rel="noopener">Code ↗</a>';

    return (
      '<article class="project-card">' +
        '<div class="project-head">' +
          '<h3 class="project-name"><a href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener">' +
            escapeHtml(p.name) + "</a></h3>" +
          (badges ? '<span class="project-badges">' + badges + "</span>" : "") +
        "</div>" +
        '<p class="project-desc">' + escapeHtml(p.description) + "</p>" +
        '<div class="project-foot">' + meta + links + "</div>" +
      "</article>"
    );
  }

  function render() {
    if (!grid) return;
    var q = state.query.trim().toLowerCase();
    var list = state.projects.filter(function (p) {
      var langOk = state.lang === "All" || p.language === state.lang;
      var textOk = !q ||
        p.name.toLowerCase().indexOf(q) !== -1 ||
        (p.description || "").toLowerCase().indexOf(q) !== -1;
      return langOk && textOk;
    });

    grid.innerHTML = list.map(cardTemplate).join("");
    if (emptyEl) emptyEl.hidden = list.length !== 0;
  }

  function buildFilters() {
    if (!filtersEl) return;
    var counts = {};
    state.projects.forEach(function (p) {
      if (!p.language) return;
      counts[p.language] = (counts[p.language] || 0) + 1;
    });
    var langs = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    });

    var chips = ['<button class="filter-chip active" data-lang="All">All</button>'];
    langs.forEach(function (lang) {
      chips.push('<button class="filter-chip" data-lang="' + escapeHtml(lang) + '">' +
                 escapeHtml(lang) + " (" + counts[lang] + ")</button>");
    });
    filtersEl.innerHTML = chips.join("");

    filtersEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-chip");
      if (!btn) return;
      state.lang = btn.getAttribute("data-lang");
      Array.prototype.forEach.call(filtersEl.children, function (c) {
        c.classList.toggle("active", c === btn);
      });
      render();
    });
  }

  function updateStats() {
    var langs = {};
    var pub = 0;
    state.projects.forEach(function (p) {
      if (p.language) langs[p.language] = true;
      if (!p.private) pub++;
    });
    var reposEl = document.getElementById("statRepos");
    var langsEl = document.getElementById("statLangs");
    var pubEl = document.getElementById("statPublic");
    if (reposEl) reposEl.textContent = state.projects.length;
    if (langsEl) langsEl.textContent = Object.keys(langs).length;
    if (pubEl) pubEl.textContent = pub;
  }

  function sortProjects(list) {
    return list.slice().sort(function (a, b) {
      var aLive = a.homepage ? 0 : 1;
      var bLive = b.homepage ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });
  }

  if (grid) {
    fetch("data/projects.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        state.projects = sortProjects(data.filter(function (p) { return !p.fork; }));
        buildFilters();
        updateStats();
        render();
      })
      .catch(function (err) {
        grid.innerHTML =
          '<p class="projects-empty">Could not load projects.json. ' +
          "If you opened this file directly, run a local server " +
          "(<code>python3 -m http.server</code>) instead.</p>";
        if (emptyEl) emptyEl.hidden = true;
        console.error("Failed to load projects:", err);
      });
  }

  if (searchEl) {
    searchEl.addEventListener("input", function (e) {
      state.query = e.target.value;
      render();
    });
  }
})();
