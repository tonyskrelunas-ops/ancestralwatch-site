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

   Two voices (11/11/2026). Every reading listed in /assets/audio/readings/voices.json exists twice: <slug>.m4a is
   the masculine voice and <slug>.f.m4a the feminine, each with its own timeline (<slug>.timeline.json and
   <slug>.f.timeline.json: the same sentences, with that voice's times). A small "Voice: Masculine · Feminine"
   control sits under the bar of every such player. Masculine is the default; the choice is remembered on the
   device ('aw.voice') and applied on every page. Switching while the reading plays goes on from the start of the
   same sentence in the other voice. window.AWVoice (get, set, timeline, onChange) is shared with aw-readalong.js;
   the player also fires 'aw:voice' on itself with {voice, time, timeline} just before it swaps the audio. */
(function () {
  'use strict';
  var BASE = '/assets/audio/readings/', VOICES = { m: { label: 'Masculine', suffix: '' }, f: { label: 'Feminine', suffix: '.f' } };
  var STORE = 'aw.voice', voice = 'm', listeners = [], tlCache = {}, manifest = null;
  try { if (localStorage.getItem(STORE) === 'f') voice = 'f'; } catch (e) {}
  function timeline(slug, v) {
    var k = slug + ':' + v;
    if (!tlCache[k]) tlCache[k] = fetch(BASE + slug + VOICES[v].suffix + '.timeline.json').then(function (r) { if (!r.ok) throw new Error('no timeline'); return r.json(); });
    return tlCache[k];
  }
  function voicesFor() {
    if (!manifest) manifest = (window.fetch ? fetch(BASE + 'voices.json').then(function (r) { return r.ok ? r.json() : { readings: [] }; }) : Promise.resolve({ readings: [] })).catch(function () { return { readings: [] }; });
    return manifest;
  }
  function setVoice(v) {
    if (!VOICES[v] || v === voice) return;
    voice = v;
    try { localStorage.setItem(STORE, v); } catch (e) {}
    listeners.slice().forEach(function (fn) { try { fn(v); } catch (e) {} });
  }
  window.AWVoice = { get: function () { return voice; }, set: setVoice, voices: VOICES, timeline: timeline, manifest: voicesFor,
    onChange: function (fn) { listeners.push(fn); return function () { var i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; } };
  // the sentence being read at time t in a timeline, or -1 before the first
  function sentenceAt(tl, t) { var ss = tl && tl.sentences || []; for (var i = ss.length - 1; i >= 0; i--) if (ss[i].start <= t) return i; return -1; }

  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
  function words(s) { s = Math.max(0, Math.round(s || 0)); var m = Math.floor(s / 60), r = s % 60; return (m ? m + (m === 1 ? ' minute ' : ' minutes ') : '') + r + (r === 1 ? ' second' : ' seconds'); }

  function init(el) {
    var a = el.querySelector('audio'), btn = el.querySelector('.aw-listen__btn'), bar = el.querySelector('.aw-listen__bar');
    var fill = el.querySelector('.aw-listen__fill'), knob = el.querySelector('.aw-listen__knob'), tEl = el.querySelector('.aw-listen__t');
    if (!a || !btn || !bar) return;
    var slug = el.getAttribute('data-id') || '', src0 = a.getAttribute('src') || (BASE + slug + '.m4a');
    var DUR0 = parseFloat(el.getAttribute('data-dur')) || 0, DUR = DUR0, key0 = 'aw-listen:' + (slug || src0), key = key0;
    var pending = null, raf = 0, dragging = false, lastSave = 0, label = btn.getAttribute('aria-label') || 'Listen';
    var two = false, v = 'm', durs = { m: DUR0 };  // two voices: filled in once voices.json says this reading has both
    function srcFor(x) { return x === 'm' ? src0 : src0.replace(/\.m4a(\?.*)?$/, VOICES[x].suffix + '.m4a$1'); }
    function keyFor(x) { return x === 'm' ? key0 : key0 + ':' + x; }

    function dur() { return (isFinite(a.duration) && a.duration > 0) ? a.duration : DUR; }
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
    // the place a listener stopped last time, on this device (per voice, once two voices are known)
    function restore() {
      try { var saved = parseFloat(localStorage.getItem(key)); if (saved > 5 && saved < dur() - 8) { pending = saved; el.classList.add('is-started'); } } catch (e) {}
      paint();
    }
    restore();

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

    /* ---- two voices ---- */
    function applyVoice(x, tls) {
      // tls: { m: timeline, f: timeline } — both known, so the current sentence can be found in the other voice
      var wasPlaying = !a.paused, t = now(), newT = t, from = tls[v], to = tls[x];
      if (t > 0 && from && to) {
        var i = sentenceAt(from, t);
        newT = i >= 0 && to.sentences[i] ? to.sentences[i].start + 0.01 : Math.min(t, (to.sentences[0] || { start: t }).start);
      }
      if (to && to.sentences.length) durs[x] = to.sentences[to.sentences.length - 1].end + 0.8;
      if (wasPlaying) a.pause();  // saves the old place under the old voice's key
      v = x; key = keyFor(x); DUR = durs[x] || DUR0;
      try { el.dispatchEvent(new CustomEvent('aw:voice', { detail: { voice: x, time: newT, timeline: to || null, playing: wasPlaying } })); } catch (e) {}
      a.setAttribute('src', srcFor(x)); a.load();
      pending = newT > 0 ? newT : null; if (newT > 0) el.classList.add('is-started'); else el.classList.remove('is-started');
      paint(); paintVoice();
      if (newT > 0) { try { localStorage.setItem(key, String(Math.floor(newT))); } catch (e) {} }
      if (wasPlaying) { var p = a.play(); if (p && p.catch) p.catch(function () { el.classList.remove('is-playing', 'is-waiting'); }); }
    }
    var ui = null;
    function paintVoice() {
      if (!ui) return;
      ui.querySelectorAll('button').forEach(function (b) { var on = b.getAttribute('data-voice') === v; b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    function makeVoiceUI() {
      var body = el.querySelector('.aw-listen__body') || el, row = document.createElement('div'); row.className = 'aw-listen__voice';
      row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Voice');
      var k = document.createElement('span'); k.className = 'aw-listen__voice-k'; k.textContent = 'Voice:'; row.appendChild(k);
      ['m', 'f'].forEach(function (x, i) {
        if (i) { var dot = document.createElement('span'); dot.className = 'aw-listen__voice-dot'; dot.setAttribute('aria-hidden', 'true'); dot.textContent = '·'; row.appendChild(dot); }
        var b = document.createElement('button'); b.type = 'button'; b.className = 'aw-listen__voice-b'; b.setAttribute('data-voice', x);
        b.textContent = VOICES[x].label; b.setAttribute('aria-pressed', x === v ? 'true' : 'false');
        b.addEventListener('click', function () { if (x !== voice) setVoice(x); });
        row.appendChild(b);
      });
      body.appendChild(row); ui = row;
    }
    function switchTo(x) {
      if (!two || x === v) return;
      Promise.all([timeline(slug, 'm').catch(function () { return null; }), timeline(slug, 'f').catch(function () { return null; })])
        .then(function (r) { if (x !== voice || x === v) return; applyVoice(x, { m: r[0], f: r[1] }); });
    }
    if (slug) voicesFor().then(function (man) {
      if (!man || !man.readings || man.readings.indexOf(slug) < 0) return;
      two = true; makeVoiceUI();
      window.AWVoice.onChange(switchTo);
      if (voice !== 'm') {
        if (!a.paused || a.readyState > 0) { switchTo(voice); return; }  // the listener was quick: treat it as a switch
        // the device prefers the other voice: swap the source before anything loads (nothing has, preload="none")
        v = voice; key = keyFor(v); a.setAttribute('src', srcFor(v)); a.load(); pending = null; el.classList.remove('is-started'); restore(); paintVoice();
        timeline(slug, v).then(function (tl) { if (tl.sentences.length) { durs[v] = tl.sentences[tl.sentences.length - 1].end + 0.8; if (v === voice) { DUR = durs[v]; paint(); } } }).catch(function () {});
      }
    });
  }
  function boot() { document.querySelectorAll('.aw-listen').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
