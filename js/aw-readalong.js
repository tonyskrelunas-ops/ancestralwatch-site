/* ANCESTRAL WATCH — the read-along on the free readings (11/11/2026).
   As the voice reads, the words on the page light up in step with it.

   How it works
   - Each reading page has a Listen player (.aw-listen[data-id=slug], see aw-listen.js) and one or more
     elements marked data-aw-readalong="slug": the title and the body that the voice reads.
   - On load this fetches /assets/audio/readings/<slug>.timeline.json: every sentence of the reading with
     its exact start and end in the audio, and its text.
   - It lines the timeline up with the text on the page (quotes, dashes, case and punctuation ignored;
     a fuzzy match where a name is respelled for the voice), then wraps each sentence in a span
     (.aw-ra__s) and each word in a span (.aw-ra__w). Not one character of the page text changes.
     If the page cannot be lined up with confidence, nothing is wrapped and the player works as before.
   - While the audio plays, one requestAnimationFrame loop moves two classes: is-current on the sentence
     being read, is-word on the word (word times are interpolated inside the sentence by syllable weight).
     Sentences already read get is-read and rest at full ink; the page follows the reading with a gentle
     scroll, unless the visitor has scrolled in the last 4 seconds. Tapping a sentence (or Enter/Space on a
     focused one) plays the reading from there. A small "Read along" switch beside the player turns the
     highlighting off, and that choice is remembered on the device. */
(function () {
  'use strict';
  var FOLLOW_PAUSE = 4000, MIN_COVER = 0.8, MIN_RATIO = 0.62, STORE = 'aw.readalong';
  var reduced = false;
  try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ---------- text normalising ---------- */
  var WORD_RE;
  try { WORD_RE = new RegExp("[\\p{L}\\p{N}]+(?:['’\\u02BC][\\p{L}\\p{N}]+)*", 'gu'); }
  catch (e) { WORD_RE = /[A-Za-z0-9À-ɏͰ-ϿЀ-ӿ぀-ヿ一-鿿]+(?:['’][A-Za-z0-9À-ɏ]+)*/g; }
  function fold(s) {
    s = s.toLowerCase();
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return s.replace(/[‘’ʼ']/g, '').replace(/ł/g, 'l').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss');
  }
  function tokensOf(text) {
    var out = [], m; WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(text))) out.push({ start: m.index, end: m.index + m[0].length, key: fold(m[0]) });
    return out;
  }
  function keys(text) { var t = tokensOf(text), k = []; for (var i = 0; i < t.length; i++) k.push(t[i].key); return k; }
  // similarity of two letter strings: 1 - edit distance / longer length
  function ratio(a, b) {
    if (a === b) return 1; var n = a.length, m = b.length; if (!n || !m) return 0;
    var prev = new Array(m + 1), cur = new Array(m + 1), i, j;
    for (j = 0; j <= m; j++) prev[j] = j;
    for (i = 1; i <= n; i++) {
      cur[0] = i; var ca = a.charCodeAt(i - 1);
      for (j = 1; j <= m; j++) { var c = prev[j - 1] + (ca === b.charCodeAt(j - 1) ? 0 : 1), d = prev[j] + 1, ins = cur[j - 1] + 1; cur[j] = c < d ? (c < ins ? c : ins) : (d < ins ? d : ins); }
      var t = prev; prev = cur; cur = t;
    }
    return 1 - prev[m] / Math.max(n, m);
  }
  function syllables(key) { var m = key.match(/[aeiouy]+/g); return Math.max(1, m ? m.length : (key.length > 3 ? 2 : 1)); }

  /* ---------- the page text as a stream of words ---------- */
  var SKIP = { SCRIPT: 1, STYLE: 1, SVG: 1, NOSCRIPT: 1, TEMPLATE: 1, AUDIO: 1, VIDEO: 1, IMG: 1 };
  function collect(roots) {
    var toks = [], nodes = [];
    roots.forEach(function (root) {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: function (n) {
          if (n.nodeType === 1) {
            if (SKIP[n.tagName] || n.getAttribute('aria-hidden') === 'true' || /(^|\s)(aw-listen|aw-ra__ui)(\s|$)/.test(n.className || '')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_SKIP;
          }
          return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
      });
      var n;
      while ((n = w.nextNode())) {
        var t = tokensOf(n.nodeValue); if (!t.length) continue;
        var ni = nodes.length; nodes.push(n);
        for (var i = 0; i < t.length; i++) { t[i].node = ni; toks.push(t[i]); }
      }
    });
    return { toks: toks, nodes: nodes };
  }

  /* ---------- lining the timeline up with the page ---------- */
  function align(sentences, page) {
    var toks = page.toks, N = toks.length, i, j, k;
    var S = sentences.map(function (s) { var kk = keys(s.text); return { keys: kk, n: kk.length, letters: kk.join(''), from: -1, to: -1 }; });
    function exactAt(s, at) { if (at < 0 || at + s.n > N) return false; for (var q = 0; q < s.n; q++) if (toks[at + q].key !== s.keys[q]) return false; return true; }
    function findExact(s, from, to) { for (var at = from; at + s.n <= to; at++) if (exactAt(s, at)) return at; return -1; }
    // pass 1: the sure things, in order — sentences of four words or more that appear word for word
    var cursor = 0;
    for (i = 0; i < S.length; i++) {
      if (S[i].n < 4) continue;
      j = findExact(S[i], cursor, N);
      if (j >= 0) { S[i].from = j; S[i].to = j + S[i].n; cursor = S[i].to; }
    }
    // pass 2: everything else, inside the gaps the sure things leave — exact first, then by letters
    i = 0;
    while (i < S.length) {
      if (S[i].from >= 0) { i++; continue; }
      var a = i; while (i < S.length && S[i].from < 0) i++;
      var lo = a > 0 ? S[a - 1].to : 0, hi = i < S.length ? S[i].from : N;
      if (a > 0 && S[a - 1].to < 0) { for (k = a - 1; k >= 0 && S[k].to < 0; k--) {} lo = k >= 0 ? S[k].to : 0; }
      var rc = lo;
      for (k = a; k < i; k++) {
        var s = S[k]; if (!s.n || rc >= hi) continue;
        j = findExact(s, rc, hi);
        if (j >= 0) { s.from = j; s.to = j + s.n; rc = s.to; continue; }
        if (s.n < 2 && s.letters.length < 6) continue;
        var best = 0, bestL = 0, maxL = Math.min(hi - rc, Math.ceil(s.n * 1.7) + 1), minL = Math.max(1, Math.floor(s.n * 0.5));
        if (s.n > 12) { minL = Math.max(1, Math.floor(s.n * 0.7)); maxL = Math.min(hi - rc, Math.ceil(s.n * 1.3)); }
        for (var L = minL; L <= maxL; L++) {
          var letters = ''; for (var q = 0; q < L; q++) letters += toks[rc + q].key;
          var r = ratio(s.letters, letters); if (r > best) { best = r; bestL = L; }
        }
        if (best >= MIN_RATIO && (s.n >= 2 || best >= 0.8)) { s.from = rc; s.to = rc + bestL; rc = s.to; }
      }
    }
    var covered = 0, matched = 0;
    for (i = 0; i < S.length; i++) if (S[i].from >= 0) { matched++; covered += S[i].to - S[i].from; }
    return { spans: S, matched: matched, coverage: N ? covered / N : 0, pageWords: N };
  }

  /* ---------- wrapping the page text, without changing a character ---------- */
  function wrap(page, sentences, spans) {
    var toks = page.toks, nodes = page.nodes, perNode = [], i, k;
    for (i = 0; i < nodes.length; i++) perNode.push([]);
    for (i = 0; i < spans.length; i++) {
      var s = spans[i]; if (s.from < 0) continue;
      var runStart = s.from;
      for (k = s.from; k < s.to; k++) {
        if (k + 1 === s.to || toks[k + 1].node !== toks[k].node) { perNode[toks[k].node].push({ si: i, a: runStart, b: k + 1 }); runStart = k + 1; }
      }
    }
    var segs = []; for (i = 0; i < sentences.length; i++) segs.push([]);
    var words = []; for (i = 0; i < sentences.length; i++) words.push([]);
    nodes.forEach(function (node, ni) {
      var runs = perNode[ni]; if (!runs.length) return;
      var text = node.nodeValue, frag = document.createDocumentFragment(), pos = 0;
      runs.forEach(function (run, ri) {
        var first = toks[run.a], last = toks[run.b - 1];
        // the sentence starts at its first word, taking an opening quote or bracket that touches it
        var a = first.start; while (a > pos && !/[\s\p{L}\p{N}]/u.test(text.charAt(a - 1)) && /[‘“"'(\[«]/.test(text.charAt(a - 1))) a--;
        var limit = ri + 1 < runs.length ? toks[runs[ri + 1].a].start : text.length;
        var b = last.end; while (b < limit && !/\s/.test(text.charAt(b))) b++;
        if (a > pos) frag.appendChild(document.createTextNode(text.slice(pos, a)));
        var seg = document.createElement('span'); seg.className = 'aw-ra__s'; seg.setAttribute('data-s', String(run.si));
        var p = a;
        for (var t = run.a; t < run.b; t++) {
          var tk = toks[t], wEnd = tk.end, wLimit = t + 1 < run.b ? toks[t + 1].start : b;
          while (wEnd < wLimit && !/\s/.test(text.charAt(wEnd))) wEnd++;
          if (tk.start > p) seg.appendChild(document.createTextNode(text.slice(p, tk.start)));
          var w = document.createElement('span'); w.className = 'aw-ra__w'; w.textContent = text.slice(tk.start, wEnd);
          seg.appendChild(w); words[run.si].push({ el: w, wt: syllables(tk.key) + 0.35 + (/[,;:—–]$/.test(w.textContent) ? 0.6 : 0) });
          p = wEnd;
        }
        if (b > p) seg.appendChild(document.createTextNode(text.slice(p, b)));
        frag.appendChild(seg); segs[run.si].push(seg); pos = b;
      });
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    });
    // where each word falls inside its sentence, by weight
    var cum = [];
    for (i = 0; i < sentences.length; i++) {
      var ws = words[i], total = 0, c = [0];
      for (k = 0; k < ws.length; k++) total += ws[k].wt;
      for (k = 0; k < ws.length; k++) c.push(c[k] + ws[k].wt / (total || 1));
      cum.push(c);
    }
    return { segs: segs, words: words, cum: cum };
  }

  /* ---------- the toggle beside the player ---------- */
  var T = {
    en: { label: 'Read along', hint: 'Tap any sentence to hear it from there.' },
    lt: { label: 'Skaityk kartu', hint: 'Paliesk bet kurį sakinį ir klausyk nuo jo.' },
    ja: { label: '読みながら聞く', hint: '文をタップすると、そこから再生します。' }
  };
  function makeUI(player, lang, on) {
    var t = T[lang] || T.en, ui = document.createElement('div'); ui.className = 'aw-ra__ui';
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'aw-ra__toggle'; btn.setAttribute('role', 'switch');
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.innerHTML = '<span class="aw-ra__sw" aria-hidden="true"><span class="aw-ra__dot"></span></span><span class="aw-ra__lbl"></span>';
    btn.querySelector('.aw-ra__lbl').textContent = t.label;
    var hint = document.createElement('span'); hint.className = 'aw-ra__hint'; hint.textContent = t.hint;
    ui.appendChild(btn); ui.appendChild(hint);
    if (player.classList.contains('aw-listen--center')) ui.classList.add('aw-ra__ui--center');
    player.parentNode.insertBefore(ui, player.nextSibling);
    return { ui: ui, btn: btn };
  }

  /* ---------- one reading ---------- */
  function setup(player, timeline, roots) {
    var audio = player.querySelector('audio'), btn = player.querySelector('.aw-listen__btn');
    if (!audio || !timeline || !timeline.sentences || !timeline.sentences.length) return null;
    var sentences = timeline.sentences, page = collect(roots), res = align(sentences, page);
    var state = { slug: player.getAttribute('data-id'), matched: res.matched, total: sentences.length, coverage: res.coverage, pageWords: res.pageWords, aligned: false };
    if (res.matched < 3 || res.coverage < MIN_COVER) return state;
    var dom = wrap(page, sentences, res.spans); state.aligned = true;
    var lang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2);
    var on = true; try { on = localStorage.getItem(STORE) !== '0'; } catch (e) {}
    var ui = makeUI(player, lang, on);
    roots.forEach(function (r) {
      r.classList.add('aw-ra');
      try { var c = getComputedStyle(r).color.match(/\d+(\.\d+)?/g); if (c && (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) > 150) r.classList.add('aw-ra--dark'); } catch (e) {}
    });

    var cur = -1, word = -1, raf = 0, started = false, userScrollUntil = 0, selfScrollUntil = 0, pend = null, pendTimer = 0;
    function segsOf(i) { return i >= 0 ? dom.segs[i] : []; }
    function setClass(list, cls, add) { for (var k = 0; k < list.length; k++) list[k].classList[add ? 'add' : 'remove'](cls); }
    function setWord(i, wi) {
      if (wi === word) return;
      var ws = dom.words[i];
      if (word >= 0 && ws[word]) ws[word].el.classList.remove('is-word');
      word = wi; if (wi >= 0 && ws[wi]) ws[wi].el.classList.add('is-word');
    }
    function setSentence(i) {
      if (i === cur) return;
      if (cur >= 0) { setWord(cur, -1); setClass(segsOf(cur), 'is-current', false); }
      // everything before the new sentence has been read; everything after has not
      if (i > cur) { for (var k = Math.max(cur, 0); k < i; k++) setClass(segsOf(k), 'is-read', true); }
      else { for (var q = Math.max(i, 0); q <= cur; q++) setClass(segsOf(q), 'is-read', false); }
      cur = i; word = -1;
      if (i >= 0) { setClass(segsOf(i), 'is-read', false); setClass(segsOf(i), 'is-current', true); follow(i); }
    }
    function follow(i) {
      var segs = segsOf(i); if (!segs.length || !on || audio.paused) return;
      var now = Date.now(); if (now < userScrollUntil) return;
      var r = segs[0].getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      var rb = segs[segs.length - 1].getBoundingClientRect().bottom;
      if (r.top >= vh * 0.16 && rb <= vh * 0.7) return;
      var top = (window.pageYOffset || document.documentElement.scrollTop) + r.top - vh * 0.34;
      selfScrollUntil = now + 1500;
      try { window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, Math.max(0, top)); }
    }
    function tick() {
      var t = pend !== null ? pend : (audio.currentTime || 0), n = sentences.length, i = cur;
      if (i < 0 || sentences[i].start > t) i = -1;
      while (i + 1 < n && sentences[i + 1].start <= t) i++;
      setSentence(i);
      if (i >= 0 && dom.words[i].length) {
        var s = sentences[i], rel = s.end > s.start ? (t - s.start) / (s.end - s.start) : 0, c = dom.cum[i], wi = word < 0 ? 0 : word;
        if (rel >= 1) wi = dom.words[i].length - 1;
        else { if (c[wi] > rel) wi = 0; while (wi + 1 < dom.words[i].length && c[wi + 1] <= rel) wi++; }
        setWord(i, wi);
      }
    }
    function loop() { tick(); if (!audio.paused && on) raf = requestAnimationFrame(loop); }
    function activate() {
      if (!on) return;
      if (!started) { started = true; roots.forEach(function (r) { r.classList.add('aw-ra--on'); }); dom.segs.forEach(function (ss) { setClass(ss, 'aw-ra__s--live', true); for (var k = 0; k < ss.length; k++) ss[k].setAttribute('tabindex', '0'); }); }
    }
    function clearAll() {
      cancelAnimationFrame(raf);
      if (cur >= 0) { setWord(cur, -1); setClass(segsOf(cur), 'is-current', false); }
      for (var k = 0; k < dom.segs.length; k++) setClass(dom.segs[k], 'is-read', false);
      cur = -1; word = -1;
    }
    function deactivate() {
      clearAll(); started = false;
      roots.forEach(function (r) { r.classList.remove('aw-ra--on'); });
      dom.segs.forEach(function (ss) { setClass(ss, 'aw-ra__s--live', false); for (var k = 0; k < ss.length; k++) ss[k].removeAttribute('tabindex'); });
    }
    function setOn(v) {
      on = v; ui.btn.setAttribute('aria-checked', v ? 'true' : 'false');
      try { if (v) localStorage.removeItem(STORE); else localStorage.setItem(STORE, '0'); } catch (e) {}
      if (!v) deactivate(); else if (!audio.paused || (audio.currentTime > 0 && player.classList.contains('is-started'))) { activate(); cancelAnimationFrame(raf); loop(); }
    }
    ui.btn.addEventListener('click', function () { setOn(!on); });

    audio.addEventListener('play', function () { activate(); if (on) { cancelAnimationFrame(raf); loop(); } });
    audio.addEventListener('pause', function () { cancelAnimationFrame(raf); if (on && started) tick(); });
    audio.addEventListener('seeked', function () { pend = null; clearTimeout(pendTimer); if (on && started) tick(); });
    audio.addEventListener('ended', function () {
      cancelAnimationFrame(raf);
      if (!started) return;
      if (cur >= 0) { setWord(cur, -1); setClass(segsOf(cur), 'is-current', false); }
      for (var k = 0; k < dom.segs.length; k++) setClass(dom.segs[k], 'is-read', true);
      cur = -1; word = -1;
      setTimeout(function () { if (audio.paused && !audio.currentTime) deactivate(); }, 1800);
    });

    // the visitor scrolling pauses the follow for four seconds
    function userScrolled() { userScrollUntil = Date.now() + FOLLOW_PAUSE; }
    window.addEventListener('wheel', userScrolled, { passive: true });
    window.addEventListener('touchmove', userScrolled, { passive: true });
    window.addEventListener('scroll', function () { if (Date.now() > selfScrollUntil) userScrolled(); }, { passive: true });
    window.addEventListener('keydown', function (e) {
      if (e.target !== document.body && e.target !== document.documentElement) return;
      if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| |Spacebar)$/.test(e.key)) userScrolled();
    });

    // tap a sentence: hear it from there
    function jump(i) {
      var t = sentences[i].start + 0.01;
      activate();
      pend = t; clearTimeout(pendTimer); pendTimer = setTimeout(function () { pend = null; }, 4000);
      function seek() { try { audio.currentTime = t; } catch (e) {} }
      if (audio.readyState >= 1) seek(); else audio.addEventListener('loadedmetadata', seek, { once: true });
      if (audio.paused) { if (btn) btn.click(); else { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } }
      if (on && started) tick();
    }
    roots.forEach(function (r) {
      r.addEventListener('click', function (e) {
        if (!on) return;
        var seg = e.target && e.target.closest ? e.target.closest('.aw-ra__s') : null; if (!seg || !r.contains(seg)) return;
        if (e.target.closest('a,button')) return;
        try { var sel = window.getSelection(); if (sel && String(sel).length) return; } catch (x) {}
        jump(parseInt(seg.getAttribute('data-s'), 10));
      });
      r.addEventListener('keydown', function (e) {
        if (!on || (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar')) return;
        var seg = e.target && e.target.classList && e.target.classList.contains('aw-ra__s') ? e.target : null; if (!seg) return;
        e.preventDefault(); jump(parseInt(seg.getAttribute('data-s'), 10));
      });
    });

    // the device remembered a place in the reading (aw-listen.js): show it once the voice goes on
    state.sentenceAt = function (t) { for (var i = sentences.length - 1; i >= 0; i--) if (sentences[i].start <= t) return i; return -1; };
    state.current = function () { return cur; };
    state.wordIndex = function () { return word; };
    state.isOn = function () { return on; };
    state.setOn = setOn;
    return state;
  }

  /* ---------- boot ---------- */
  var readings = [];
  function boot() {
    var players = document.querySelectorAll('.aw-listen[data-id]');
    if (!players.length || !window.fetch) return;
    players.forEach(function (player) {
      var slug = player.getAttribute('data-id');
      var roots = [].slice.call(document.querySelectorAll('[data-aw-readalong="' + slug + '"]'));
      if (!roots.length) return;
      var url = '/assets/audio/readings/' + slug + '.timeline.json';
      fetch(url).then(function (r) { if (!r.ok) throw new Error('no timeline'); return r.json(); }).then(function (tl) {
        var st = setup(player, tl, roots); if (st) readings.push(st);
      }).catch(function () { readings.push({ slug: slug, aligned: false, error: true }); });
    });
  }
  window.AWReadAlong = { readings: readings, align: align, collect: collect, keys: keys, ratio: ratio };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
