/* AncestralWatch.com — minimal progressive-enhancement JS.
   The site works with JS disabled; this only improves the mobile nav. */
(function () {
  "use strict";

  var toggle = document.querySelector(".nav__toggle");
  var links = document.getElementById("primary-nav");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.getAttribute("data-open") === "true";
      links.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.textContent = open ? "☰" : "✕";
    });

    // Close the mobile menu after following an in-page link
    links.addEventListener("click", function (e) {
      if (e.target.closest("a") && window.innerWidth <= 900) {
        links.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      }
    });

    // Escape closes the menu
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.getAttribute("data-open") === "true") {
        links.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
        toggle.focus();
      }
    });
  }

  // Mobile: the "The Series" label links straight to the series hub (its dropdown is hidden on mobile)
  document.querySelectorAll(".has-menu > button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (window.innerWidth <= 900) { window.location.href = "/series/"; }
    });
  });

  // Email capture is not wired to a provider yet (TODO(Tony): form endpoint).
  document.querySelectorAll("form[data-capture]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.parentElement.querySelector(".capture__note");
      if (note) {
        note.textContent =
          "Thanks! Sign-up is opening shortly — meanwhile, email wisdom@ancestralwatch.com and we'll send the free tool.";
        note.style.color = "var(--amber)";
      }
    });
  });
})();

/* ============================================================
   WORLD-CLASS POLISH — scroll reveal + ambient soundscape
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Scroll reveal (skipped for reduced-motion) ---- */
  if (!reduce && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(
      ".hero__inner > *, .beat, .section > .wrap > *, .starcard, .waypoint, .book-hook, .toolcard, .stat, .character, .story-card, .creed__line, .event-card"
    );
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      if (i % 3 === 1) el.classList.add("d1");
      if (i % 3 === 2) el.classList.add("d2");
      io.observe(el);
    });
    // Safety: reveal everything after 1.6s no matter what
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); });
    }, 1600);
  }

  /* ---- Ambient soundscape: a quiet, generative night-pad. OFF by default. ---- */
  var toggle = document.createElement("button");
  toggle.className = "sound-toggle";
  toggle.setAttribute("aria-pressed", "false");
  toggle.setAttribute("data-on", "false");
  toggle.setAttribute("aria-label", "Toggle ambient sound");
  toggle.innerHTML = '<span class="sound-toggle__ic" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="sound-toggle__label">Sound</span>';
  document.body.appendChild(toggle);

  var ctx = null, master = null, nodes = [], lfo = null, playing = false;
  function build() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 620; lp.Q.value = 0.6;
    lp.connect(master); master.connect(ctx.destination);
    // A soft, open chord (A2 · E3 · A3 · C#4) — warm, unresolved, calm
    [110, 164.81, 220, 277.18].forEach(function (f, i) {
      var o = ctx.createOscillator();
      o.type = i === 3 ? "sine" : "triangle";
      o.frequency.value = f;
      var g = ctx.createGain(); g.gain.value = i === 3 ? 0.11 : 0.2;
      o.detune.value = (i - 1.5) * 4; // gentle chorus spread
      o.connect(g); g.connect(lp); o.start(); nodes.push(o);
    });
    // Slow swell so it breathes rather than drones
    lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
    var lg = ctx.createGain(); lg.gain.value = 0.02;
    lfo.connect(lg); lg.connect(master.gain); lfo.start();
    return true;
  }
  function fade(to, secs) {
    if (!ctx) return;
    var t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.exponentialRampToValueAtTime(Math.max(to, 0.0001), t + secs);
  }
  toggle.addEventListener("click", function () {
    if (!ctx && !build()) { toggle.style.display = "none"; return; }
    if (ctx.state === "suspended") ctx.resume();
    playing = !playing;
    toggle.setAttribute("data-on", String(playing));
    toggle.setAttribute("aria-pressed", String(playing));
    fade(playing ? 0.05 : 0.0001, playing ? 2.2 : 1.2); // deliberately low volume
  });
  // Pause the sound when the tab is hidden; resume state on return
  document.addEventListener("visibilitychange", function () {
    if (!ctx) return;
    if (document.hidden) fade(0.0001, 0.4);
    else if (playing) fade(0.05, 1.5);
  });
})();
