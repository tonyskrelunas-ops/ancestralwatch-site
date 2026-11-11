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
   Nothing loads until the button is pressed (preload="none"). Remembers where a listener stopped, on this device. */
(function () {
  'use strict';
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); var m = Math.floor(s / 60), r = s % 60; return m + ':' + (r < 10 ? '0' : '') + r; }
  function words(s) { s = Math.max(0, Math.round(s || 0)); var m = Math.floor(s / 60), r = s % 60; return (m ? m + (m === 1 ? ' minute ' : ' minutes ') : '') + r + (r === 1 ? ' second' : ' seconds'); }

  function init(el) {
    var a = el.querySelector('audio'), btn = el.querySelector('.aw-listen__btn'), bar = el.querySelector('.aw-listen__bar');
    var fill = el.querySelector('.aw-listen__fill'), knob = el.querySelector('.aw-listen__knob'), tEl = el.querySelector('.aw-listen__t');
    if (!a || !btn || !bar) return;
    var DUR = parseFloat(el.getAttribute('data-dur')) || 0, key = 'aw-listen:' + (el.getAttribute('data-id') || a.getAttribute('src'));
    var pending = null, raf = 0, dragging = false, lastSave = 0, label = btn.getAttribute('aria-label') || 'Listen';

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
  }
  function boot() { document.querySelectorAll('.aw-listen').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
