/* ANCESTRAL WATCH — THE LAMPLIGHT READING ROOM  (/lamplight/, 11/11/2026)
   One oil lamp lights the room. This script does three things:

   1. The lamplight breathes. A slow, irregular, natural flicker: a few slow sines that never line up,
      plus a small gust now and then that dies away. It moves only the opacity and transform of the three
      glow layers, the flame, and the shade over the page. About thirty frames a second, and it stops
      the moment the tab is hidden. With prefers-reduced-motion the lamp holds still.
   2. Press the lamp to begin. The lamp is a button; pressing it presses the Listen player's own button
      (aw-listen.js), so the voice begins and the read-along (aw-readalong.js) lights the words. On play
      the lamp turns up a little; on pause or at the end it settles low again.
   3. Room tone, off until pressed: a far wind outside and the faintest hiss, synthesized with Web Audio,
      kept far under the voice. window.AW.sound follows the shape the other pages use, so the sign-up wall
      can quiet it and the Listen player can duck it. */
(function () {
  'use strict';
  var lamp = document.getElementById('lamp'), flame = document.getElementById('flame');
  var glows = { wide: document.querySelector('[data-glow="wide"]'), mid: document.querySelector('[data-glow="mid"]'), core: document.querySelector('[data-glow="core"]') };
  var shade = document.querySelector('.page__shade');
  var player = document.querySelector('.aw-listen[data-id="by-lamplight-opening"]');
  var audio = player ? player.querySelector('audio') : null, playBtn = player ? player.querySelector('.aw-listen__btn') : null;
  if (!lamp || !flame || !glows.wide || !glows.mid || !glows.core) return;
  var html = document.documentElement;
  var reduced = false;
  try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- where the flame is on the screen: the glow is centred there ---------- */
  var cx = 0, cy = 0, FPS = 30, STEP = 1000 / FPS;
  function place() {
    var r = flame.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height * 0.6;
    var vh = window.innerHeight || html.clientHeight;
    // when the lamp has scrolled off the top (phone), the light still falls from above
    if (y < -vh * 0.25) y = -vh * 0.25;
    cx = x; cy = y;
  }

  /* ---------- the breathing ---------- */
  var LOW = 0.6, UP = 1, level = LOW, target = LOW;
  var gust = { amp: 0, t0: 0, dur: 1, next: 2.5 + Math.random() * 4 };
  function breath(t) {
    var f = 0.86 + 0.045 * Math.sin(t * 1.31) + 0.035 * Math.sin(t * 2.87 + 0.7) + 0.022 * Math.sin(t * 6.13 + 2.1) + 0.012 * Math.sin(t * 11.7 + 1.3);
    if (t >= gust.next) {
      gust.amp = (Math.random() < 0.5 ? -1 : 1) * (0.04 + Math.random() * 0.07);
      gust.t0 = t; gust.dur = 0.5 + Math.random() * 1.2; gust.next = t + 2.5 + Math.random() * 6.5;
    }
    if (gust.amp) {
      var k = (t - gust.t0) / gust.dur;
      if (k >= 1) gust.amp = 0; else f += gust.amp * Math.sin(k * Math.PI) * (1 - k * 0.5) * Math.cos(k * 9);
    }
    return f;
  }
  var raf = 0, last = 0, start = 0, frames = 0, running = false;
  function paint(ms) {
    var t = (ms - start) / 1000, f = reduced ? 0.9 : breath(t);
    level += (target - level) * 0.045; // the wick turns up and down over a second or so
    var L = level, b = f * L, sway = reduced ? 0 : Math.sin(t * 0.9) * 2.2 + Math.sin(t * 2.3) * 0.8;
    glows.wide.style.opacity = (0.34 + 0.34 * b).toFixed(3);
    glows.wide.style.transform = 'translate(' + (cx + sway * 2).toFixed(1) + 'px,' + cy.toFixed(1) + 'px) scale(' + (0.92 + 0.14 * b).toFixed(4) + ')';
    glows.mid.style.opacity = (0.4 + 0.5 * b).toFixed(3);
    glows.mid.style.transform = 'translate(' + (cx + sway).toFixed(1) + 'px,' + cy.toFixed(1) + 'px) scale(' + (0.9 + 0.2 * b).toFixed(4) + ')';
    glows.core.style.opacity = (0.5 + 0.5 * b).toFixed(3);
    glows.core.style.transform = 'translate(' + (cx + sway * 0.5).toFixed(1) + 'px,' + (cy - 6).toFixed(1) + 'px) scale(' + (0.86 + 0.3 * b).toFixed(4) + ')';
    var fs = 0.72 + 0.34 * L, fw = 0.9 + 0.12 * (f - 0.86) * 4;
    flame.style.transform = 'translate(' + (sway * 0.35).toFixed(2) + 'px,0) scale(' + (fs * fw * 0.98).toFixed(4) + ',' + (fs * (0.94 + (f - 0.86) * 2)).toFixed(4) + ')';
    if (shade) shade.style.opacity = Math.max(0.3, Math.min(0.95, 1.0 - 0.55 * b)).toFixed(3);
  }
  function loop(ms) {
    raf = requestAnimationFrame(loop);
    if (ms - last < STEP) return;
    last = ms; frames++;
    if (frames % 8 === 1) place();
    paint(ms);
  }
  function run() {
    if (running || document.hidden) return;
    running = true; if (!start) start = performance.now();
    place(); last = 0; raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stop(); html.classList.add('lamp-hidden'); try { if (ctx && on) ctx.suspend(); } catch (e) {} }
    else { html.classList.remove('lamp-hidden'); run(); try { if (ctx && on) ctx.resume(); } catch (e) {} }
  });
  window.addEventListener('resize', place);
  window.addEventListener('scroll', function () { if (!running) place(); }, { passive: true });
  if (reduced) { place(); start = performance.now(); paint(start + 1); }
  else run();
  // on scroll with the lamp sticky (laptop) or scrolling away (phone), keep the glow with it
  window.addEventListener('scroll', function () { frames = 0; }, { passive: true });

  /* ---------- the lamp is the switch ---------- */
  var hint = document.getElementById('lampHint');
  function setUp(up) {
    target = up ? UP : LOW;
    lamp.classList.toggle('is-up', up);
    if (up) lamp.classList.add('was-up');
    lamp.setAttribute('aria-pressed', up ? 'true' : 'false');
    lamp.setAttribute('aria-label', up ? 'Turn the lamp down and pause the reading' : (lamp.classList.contains('was-up') ? 'Turn the lamp up and go on with the reading' : 'Light the lamp and begin the reading'));
  }
  if (audio && playBtn) {
    lamp.addEventListener('click', function () { playBtn.click(); });
    audio.addEventListener('play', function () { setUp(true); });
    audio.addEventListener('pause', function () { setUp(false); });
    audio.addEventListener('ended', function () { setUp(false); });
  }

  /* ---------- room tone: a far wind, off until pressed ---------- */
  var ctx = null, master = null, on = false, ducked = false, toneBtn = document.getElementById('roomTone');
  var LEVEL = 0.05, DUCK = 0.45;
  function build() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    var sr = ctx.sampleRate, len = sr * 4, buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0), i;
    // soft brown-ish noise: a leaky integrator over white noise
    var b = 0; for (i = 0; i < len; i++) { var w = Math.random() * 2 - 1; b = (b + 0.02 * w) / 1.02; d[i] = b * 3.5; }
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // the wind: low and slow, its loudness wandering
    var src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 0.5;
    var wind = ctx.createGain(); wind.gain.value = 0.55;
    var lfo1 = ctx.createOscillator(), g1 = ctx.createGain(); lfo1.frequency.value = 0.061; g1.gain.value = 0.28;
    var lfo2 = ctx.createOscillator(), g2 = ctx.createGain(); lfo2.frequency.value = 0.173; g2.gain.value = 0.14;
    lfo1.connect(g1); g1.connect(wind.gain); lfo2.connect(g2); g2.connect(wind.gain);
    src.connect(lp); lp.connect(wind); wind.connect(master);
    // the lamp's hiss: a thread of high noise, barely there
    var src2 = ctx.createBufferSource(); src2.buffer = buf; src2.loop = true; src2.playbackRate.value = 1.7;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 0.7;
    var hiss = ctx.createGain(); hiss.gain.value = 0.045;
    src2.connect(bp); bp.connect(hiss); hiss.connect(master);
    src.start(); src2.start(); lfo1.start(); lfo2.start();
    return true;
  }
  function gainTo(v, s) { if (!master) return; var t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(v, t + (s || 1.2)); }
  function apply() { gainTo(on ? LEVEL * (ducked ? DUCK : 1) : 0, on ? 1.6 : 0.8); }
  function setOn(v) {
    v = !!v; if (v === on) return;
    if (v && !ctx && !build()) return;
    on = v;
    if (on) { try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {} }
    apply();
    if (toneBtn) { toneBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); var st = toneBtn.querySelector('.room__toneState'); if (st) st.textContent = on ? 'on' : 'off'; }
  }
  window.AW = window.AW || {};
  window.AW.sound = { isOn: function () { return on; }, set: setOn, duck: function (v) { ducked = !!v; apply(); } };
  if (toneBtn) toneBtn.addEventListener('click', function () { setOn(!on); });
  window.addEventListener('pagehide', function () { try { if (ctx) ctx.suspend(); } catch (e) {} });

  window.AWLamp = { isRunning: function () { return running; }, frames: function () { return frames; }, level: function () { return level; }, target: function () { return target; }, reduced: reduced, centre: function () { return { x: cx, y: cy }; } };
})();
