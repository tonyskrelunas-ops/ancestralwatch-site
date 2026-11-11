/* ANCESTRAL WATCH — the Listen player on the free readings (11/10/2026).
   Markup (one per reading):
     <div class="aw-listen" data-id="slug" data-dur="seconds" data-title="Title">
       <button class="aw-listen__btn">…play/pause icons…</button>
       <div class="aw-listen__body">
         <div class="aw-listen__top"><p class="aw-listen__k">Listen · 9 min</p><p class="aw-listen__t">…</p></div>
         <div class="aw-listen__bar" role="slider"><span class="aw-listen__fill"></span><span class="aw-listen__knob"></span></div>
       </div>
       <audio preload="none" src="/assets/audio/readings/slug.m4a"></audio>
     </div>
   Nothing loads until the button is pressed (preload="none"). Remembers where a listener stopped, on this device.

   Two voices (11/11/2026). A reading listed in /assets/audio/readings/voices.json has a second recording, a feminine
   voice, as <slug>.f.m4a with its own <slug>.f.timeline.json. Its player shows a small control, "Voice: Masculine · Feminine".
   Masculine is the default; the choice is kept in localStorage "aw.voice" and applied on every page. Switching swaps the
   audio file, continues from the same sentence (by the two timelines) and keeps playing if it was playing, and tells the
   read-along (aw-readalong.js) with an "aw-voice" event on the player, so it follows the matching timeline. */
(function () {
  'use strict';
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
  function words(s) { s = Math.max(0, Math.round(s || 0)); var m = Math.floor(s / 60), r = s % 60; return (m ? m + (m === 1 ? ' minute ' : ' minutes ') : '') + r + (r === 1 ? ' second' : ' seconds'); }

  var BASE = '/assets/audio/readings/', VOICES = ['masculine', 'feminine'], STORE = 'aw.voice';
  function stored() { try { var v = localStorage.getItem(STORE); return v === 'feminine' ? 'feminine' : 'masculine'; } catch (e) { return 'masculine'; } }
  function remember(v) { try { if (v === 'feminine') localStorage.setItem(STORE, v); else localStorage.removeItem(STORE); } catch (e) {} }
  function timelineUrl(slug, v) { return BASE + slug + (v === 'feminine' ? '.f' : '') + '.timeline.json'; }
  function audioUrl(slug, v) { return BASE + slug + (v === 'feminine' ? '.f' : '') + '.m4a'; }
  // the readings that have both voices, fetched once and shared with aw-readalong.js
  function voices() {
    if (!window.AWVoices) {
      window.AWVoices = (window.fetch ? fetch(BASE + 'voices.json').then(function (r) { return r.ok ? r.json() : {}; }) : Promise.resolve({}))
        .then(function (j) { return j && j.slugs ? j : { slugs: [] }; }).catch(function () { return { slugs: [] }; });
    }
    return window.AWVoices;
  }
  var timelines = {};
  function timeline(url) {
    if (!timelines[url]) timelines[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error('no timeline'); return r.json(); }).catch(function () { delete timelines[url]; return null; });
    return timelines[url];
  }
  // the same place in the other voice: the same sentence, the same way through it
  function translate(t, from, to) {
    if (!from || !to || !from.sentences || !to.sentences || from.sentences.length !== to.sentences.length) return null;
    var S = from.sentences, i;
    if (t < S[0].start) return t;
    for (i = S.length - 1; i >= 0 && S[i].start > t; i--) {}
    var a = S[i], b = to.sentences[i], len = a.end - a.start, rel = len > 0 ? Math.max(0, Math.min(1, (t - a.start) / len)) : 0;
    return Math.max(0, b.start + rel * (b.end - b.start));
  }

  function init(el) {
    var a = el.querySelector('audio'), btn = el.querySelector('.aw-listen__btn'), bar = el.querySelector('.aw-listen__bar');
    var fill = el.querySelector('.aw-listen__fill'), knob = el.querySelector('.aw-listen__knob'), tEl = el.querySelector('.aw-listen__t');
    if (!a || !btn || !bar) return;
    var DUR = parseFloat(el.getAttribute('data-dur')) || 0, slug = el.getAttribute('data-id'), DURS = null;
    var voice = 'masculine', key = 'aw-listen:' + (slug || a.getAttribute('src'));
    var pending = null, raf = 0, dragging = false, lastSave = 0, label = btn.getAttribute('aria-label') || 'Listen';

    function dur() { return (isFinite(a.duration) && a.duration > 0) ? a.duration : ((DURS && DURS[voice]) || DUR); }
    function now() { return pending !== null ? pending : a.currentTime || 0; }
    function paint() {
      var D = dur(), t = now(), p = D ? Math.min(1, Math.max(0, t / D)) : 0;
      fill.style.transform = 'scaleX(' + p + ')'; if (knob) knob.style.left = (p * 100) + '%';
      tEl.textContent = (t > 0 || el.classList.contains('is-started') ? fmt(t) + ' / ' : '') + fmt(D);
      bar.setAttribute('aria-valuenow', String(Math.floor(t))); bar.setAttribute('aria-valuetext', words(t) + ' of ' + words(D));
    }
    function loop() { paint(); if (!a.paused) raf = requestAnimationFrame(loop); }
    function save(force) {
      var t = a.currentTime || 0, n = Date.now(); if (!force && n - lastSave < 4000) return; lastSave = n;
      try { if (t > 5 && t < dur() - 8) localStorage.setItem(key, String(Math.floor(t))); else localStorage.removeItem(key); } catch (e) {}
    }
    function seekTo(t) {
      t = Math.max(0, Math.min(dur() - 0.25, t));
      if (a.readyState >= 1) { try { a.currentTime = t; pending = null; } catch (e) { pending = t; } } else pending = t;
      el.classList.add('is-started'); paint();
    }
    // the place a listener stopped last time, on this device
    try { var saved = parseFloat(localStorage.getItem(key)); if (saved > 5 && saved < DUR - 8) { pending = saved; el.classList.add('is-started'); } } catch (e) {}
    paint();

    a.addEventListener('loadedmetadata', function () { if (pending !== null) { try { a.currentTime = pending; } catch (e) {} pending = null; } paint(); });
    a.addEventListener('play', function () {
      el.classList.add('is-playing', 'is-started'); btn.setAttribute('aria-label', 'Pause'); cancelAnimationFrame(raf); loop();
      try { if (window.AW && AW.sound && AW.sound.duck) AW.sound.duck(true); } catch (e) {}
    });
    a.addEventListener('pause', function () {
      el.classList.remove('is-playing', 'is-waiting'); btn.setAttribute('aria-label', label); paint(); save(true);
      try { if (window.AW && AW.sound && AW.sound.duck) AW.sound.duck(false); } catch (e) {}
    });
    a.addEventListener('waiting', function () { el.classList.add('is-waiting'); });
    a.addEventListener('playing', function () { el.classList.remove('is-waiting'); });
    a.addEventListener('timeupdate', function () { if (a.paused) paint(); save(false); });
    a.addEventListener('ended', function () { try { localStorage.removeItem(key); } catch (e) {} a.currentTime = 0; pending = null; el.classList.remove('is-started'); paint(); });

    btn.addEventListener('click', function () {
      if (!a.paused) { a.pause(); return; }
      // one reading at a time: pause anything else on the page that is playing with sound
      document.querySelectorAll('audio,video').forEach(function (m) { if (m !== a && !m.paused && !m.muted) m.pause(); });
      try {
        if ('mediaSession' in navigator && window.MediaMetadata) {
          navigator.mediaSession.metadata = new MediaMetadata({ title: el.getAttribute('data-title') || document.title, artist: 'The Ancestral Watch',
            artwork: [{ src: '/assets/img/author-logo.png', sizes: '716x676', type: 'image/png' }] });
        }
      } catch (e) {}
      if (pending !== null && a.readyState >= 1) { try { a.currentTime = pending; pending = null; } catch (e) {} }
      var p = a.play(); if (p && p.catch) p.catch(function () { el.classList.remove('is-playing', 'is-waiting'); });
    });

    function ratio(e) { var r = bar.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }
    bar.addEventListener('pointerdown', function (e) { dragging = true; try { bar.setPointerCapture(e.pointerId); } catch (x) {} seekTo(ratio(e) * dur()); });
    bar.addEventListener('pointermove', function (e) { if (dragging) seekTo(ratio(e) * dur()); });
    bar.addEventListener('pointerup', function () { dragging = false; save(true); });
    bar.addEventListener('pointercancel', function () { dragging = false; });
    bar.addEventListener('keydown', function (e) {
      var k = e.key, t = now();
      if (k === 'ArrowRight' || k === 'ArrowUp') t += 10; else if (k === 'ArrowLeft' || k === 'ArrowDown') t -= 10;
      else if (k === 'Home') t = 0; else if (k === 'End') t = dur() - 1; else if (k === ' ' || k === 'Enter') { btn.click(); e.preventDefault(); return; } else return;
      e.preventDefault(); seekTo(t);
    });
    window.addEventListener('pagehide', function () { if (!a.paused) save(true); });

    /* ---------- the two voices ---------- */
    if (!slug || !window.fetch || !window.Promise) return;
    voices().then(function (j) {
      if (!j.slugs || j.slugs.indexOf(slug) < 0) return;
      DURS = j.duration && j.duration[slug];
      var ui = document.createElement('div'); ui.className = 'aw-listen__voice'; ui.setAttribute('role', 'radiogroup'); ui.setAttribute('aria-label', 'Voice');
      var k = document.createElement('span'); k.className = 'aw-listen__vk'; k.textContent = 'Voice'; ui.appendChild(k);
      var btns = {};
      VOICES.forEach(function (v, i) {
        if (i) { var dot = document.createElement('span'); dot.className = 'aw-listen__vdot'; dot.setAttribute('aria-hidden', 'true'); dot.textContent = '·'; ui.appendChild(dot); }
        var b = document.createElement('button'); b.type = 'button'; b.className = 'aw-listen__v'; b.setAttribute('role', 'radio'); b.setAttribute('data-voice', v);
        b.textContent = v.charAt(0).toUpperCase() + v.slice(1);
        b.addEventListener('click', function () { setVoice(v, true); });
        ui.appendChild(b); btns[v] = b;
      });
      (el.querySelector('.aw-listen__body') || el).appendChild(ui);
      function mark(v) {
        voice = v; el.setAttribute('data-voice', v); key = 'aw-listen:' + slug + (v === 'feminine' ? ':f' : '');
        VOICES.forEach(function (x) { btns[x].setAttribute('aria-checked', x === v ? 'true' : 'false'); btns[x].tabIndex = x === v ? 0 : -1; });
      }
      ui.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault(); setVoice(voice === 'feminine' ? 'masculine' : 'feminine', true); btns[voice].focus();
      });
      function announce(v) {
        try { el.dispatchEvent(new CustomEvent('aw-voice', { bubbles: true, detail: { voice: v, slug: slug, timeline: timelineUrl(slug, v) } })); } catch (e) {}
      }
      var switching = 0;
      function setVoice(v, byHand) {
        if (v === voice) return;
        var from = voice, wasPlaying = !a.paused, t = now(), started = el.classList.contains('is-started') && (t > 0 || wasPlaying), n = ++switching;
        if (byHand) remember(v);
        mark(v); announce(v);
        // the same sentence in the other voice; if the timelines cannot be read, the same way through the reading
        var place = started ? Promise.all([timeline(timelineUrl(slug, from)), timeline(timelineUrl(slug, v))]).then(function (tl) {
          var nt = translate(t, tl[0], tl[1]); if (nt === null) { var D = dur(); nt = D ? t / D * ((DURS && DURS[v]) || D) : 0; } return nt;
        }) : Promise.resolve(null);
        place.then(function (nt) {
          if (n !== switching) return;
          if (wasPlaying) a.pause();
          a.src = audioUrl(slug, v); pending = nt; paint();
          if (nt !== null) { el.classList.add('is-started'); try { if (nt > 5 && nt < dur() - 8) localStorage.setItem(key, String(Math.floor(nt))); else localStorage.removeItem(key); } catch (e) {} }
          if (wasPlaying) { a.load(); var p = a.play(); if (p && p.catch) p.catch(function () { el.classList.remove('is-playing', 'is-waiting'); }); }
        });
      }
      mark(voice);
      // the voice chosen before, on this device: applied before anything has loaded
      var want = stored();
      if (want !== voice) {
        mark(want); announce(want);
        a.src = audioUrl(slug, want);
        // the place remembered is per voice: the same seconds are not the same words in the other voice
        pending = null; el.classList.remove('is-started');
        try { var sv = parseFloat(localStorage.getItem(key)); if (sv > 5 && sv < dur() - 8) { pending = sv; el.classList.add('is-started'); } } catch (e) {}
        paint();
      }
    });
  }
  function boot() { document.querySelectorAll('.aw-listen').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
