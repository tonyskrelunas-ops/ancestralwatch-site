/* ANCESTRAL WATCH — the sign-up wall (Tony, 11/10/2026: "no one should just be on the ancestral watch site and not
   signup... there maybe a minute"). Same behaviour as AP.gate on ancestralpeaks.com, in this site's own code and look.

   - Counts 60 seconds from the visitor's first page on the site, across pages and visits (localStorage 'aw.first').
   - Then a solid full-page sign-up covers the page until they join: first name, email, Join free, a honeypot.
   - Never over audio or video that is playing with sound: it waits until that stops.
   - Opening any page with ?member once sets a pass on that device, and it never shows there.
   - Joined is remembered in 'aw.joined'. Any sign-up form on the site (the "Keep me posted" forms, the MailerLite
     forms) sets the same key when it is sent, and so does arriving on /thanks/.
   - The sign-up goes where the site's sign-ups go: Web3Forms (the access key the sites share), and the
     tribeawaken-capture list on Netlify, with source 'aw-signup-wall' plus the page path. */
(function () {
  'use strict';
  var WAIT = 60000, KEY = 'aw.joined', FIRST = 'aw.first';
  var W3F = 'https://api.web3forms.com/submit', W3F_KEY = '057975c1-1a1a-465e-9b5e-3fb6692b2106';
  var LIST = 'https://tribeawaken-capture.netlify.app/';
  var html = document.documentElement, q = location.search;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function joined() { return !!get(KEY); }
  function markJoined(name, extra) { var o = { name: String(name || '').split(' ')[0].slice(0, 40), at: Date.now() }; if (extra) for (var k in extra) o[k] = extra[k]; set(KEY, JSON.stringify(o)); }
  var validEmail = function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim()); };

  // every sign-up form already on the site counts as joining, on this device
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.querySelector || f.closest('.aw-gate')) return;
    var em = f.querySelector('input[type=email],input[name=email]'); if (!em || !validEmail(em.value)) return;
    var bot = f.querySelector('input[name=botcheck]'); if (bot && bot.checked) return;
    var nm = f.querySelector('input[name=name],input[name=first_name],input[name="fields[name]"]');
    if (!joined()) markJoined(nm ? nm.value : '', { via: 'form' });
  }, true);

  // keep track of every sound on the page, including players made in script and never added to the page
  var media = [];
  try {
    var P = HTMLMediaElement.prototype, play = P.play;
    P.play = function () { if (media.indexOf(this) < 0) media.push(this); return play.apply(this, arguments); };
  } catch (e) {}
  function playingWithSound() {
    var all = media.concat([].slice.call(document.querySelectorAll('audio,video')));
    for (var i = 0; i < all.length; i++) {
      var m = all[i];
      // a looping bed (the book pages' soundscape) or a muted background film is not something someone is listening to
      if (!m.paused && !m.ended && !m.muted && m.volume > 0 && !m.loop) return true;
    }
    return false;
  }

  var L = (html.getAttribute('lang') || 'en').slice(0, 2);
  var T = {
    en: { h: 'Join the watch.', p: 'Everything here is free: chapter one, the readings, the essays and the practice. Leave your first name and email, and the whole site is yours.',
      name: 'First name', email: 'Email', btn: 'Join free', fine: 'Nothing to pay. If you have joined before, use the same email.',
      noName: 'Your first name, please.', noEmail: 'One more look at the email, please.', joining: 'Joining…', welcome: function (n) { return 'Welcome to the watch, ' + n + '.'; } },
    lt: { h: 'Prisijunk prie mūsų.', p: 'Čia viskas nemokama: pirmas skyrius, skaitiniai, esė ir praktika. Palik savo vardą ir el. pašto adresą, ir visa svetainė tau atvira.',
      name: 'Vardas', email: 'El. paštas', btn: 'Prisijungti nemokamai', fine: 'Nieko mokėti nereikia. Jei jau buvai su mumis, naudok tą patį el. paštą.',
      noName: 'Tavo vardas, prašom.', noEmail: 'Dar kartą pažiūrėk į el. pašto adresą.', joining: 'Jungiamės…', welcome: function (n) { return 'Sveiki, ' + n + '.'; } },
    ja: { h: '無料でご参加ください。', p: 'ここにあるものはすべて無料です。第一章、朗読、エッセイ、そして呼吸の実践。お名前とメールアドレスを残していただければ、サイトのすべてがあなたに開かれます。',
      name: 'お名前', email: 'メールアドレス', btn: '無料で参加する', fine: 'お支払いは一切ありません。以前ご参加の方は、同じメールアドレスをお使いください。',
      noName: 'お名前をご記入ください。', noEmail: 'メールアドレスをもう一度ご確認ください。', joining: '送信中…', welcome: function (n) { return 'ようこそ、' + n + 'さん。'; } }
  };
  var t = T[L] || T.en;

  var CSS = '' +
    'html.aw-gated,html.aw-gated body{overflow:hidden!important}' +
    '.aw-gate{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;' +
      'padding:24px 16px;box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;' +
      'background:#FAF6EC;color:#3B3020;opacity:0;transition:opacity .45s ease;' +
      'font-family:var(--font-body,var(--body,"Inter",system-ui,-apple-system,"Segoe UI",sans-serif));text-align:left}' +
    '.aw-gate.is-in{opacity:1}' +
    '.aw-gate *{box-sizing:border-box}' +
    '.aw-gate__card{width:100%;max-width:460px;margin:auto;background:#FFFCF4;border:1px solid rgba(59,48,32,.16);border-radius:22px;' +
      'padding:30px 26px 24px;box-shadow:0 30px 70px -40px rgba(59,48,32,.55),0 4px 14px -8px rgba(59,48,32,.2)}' +
    '.aw-gate__mk{display:flex;align-items:center;gap:.7rem;margin:0 0 1.4rem}' +
    '.aw-gate__mk img{width:42px;height:auto;display:block}' +
    '.aw-gate__mk span{font-family:var(--font-display,var(--display,"Fraunces",Georgia,serif));font-size:1.08rem;line-height:1.1;font-weight:600;color:#3B3020}' +
    '.aw-gate__mk small{display:block;margin-top:.2rem;font-family:var(--font-body,var(--body,"Inter",system-ui,sans-serif));font-size:.7rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#91691F}' +
    '.aw-gate__rule{height:1px;margin:0 0 1.3rem;background:linear-gradient(90deg,#B98D3E,rgba(185,141,62,0))}' +
    '.aw-gate h2{margin:0;font-family:var(--font-display,var(--display,"Fraunces",Georgia,serif));font-weight:500;font-size:clamp(2rem,7vw,2.5rem);line-height:1.04;letter-spacing:-.015em;color:#3B3020}' +
    '.aw-gate__p{margin:.85rem 0 0;font-size:1.02rem;line-height:1.55;color:#574936}' +
    '.aw-gate label{display:block;margin:1rem 0 0}' +
    '.aw-gate label span{display:block;margin:0 0 .4rem;font-size:.74rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#6E5E48}' +
    '.aw-gate input.aw-gate__in{display:block;width:100%;min-height:52px;margin:0;padding:0 14px;border-radius:14px;border:1px solid rgba(59,48,32,.3);' +
      'background:#fff;color:#3B3020;font:inherit;font-size:16px;line-height:1.2;-webkit-appearance:none;appearance:none;box-shadow:none}' +
    '.aw-gate input.aw-gate__in:focus{outline:2px solid #B98D3E;outline-offset:1px;border-color:#B98D3E}' +
    '.aw-gate .aw-gate__hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important}' +
    '.aw-gate__go{display:flex;align-items:center;justify-content:center;gap:.5em;width:100%;min-height:56px;margin:1.25rem 0 0;padding:0 1.2rem;' +
      'border:0;border-radius:999px;background:#B98D3E;color:#2A2114;font:inherit;font-size:1.05rem;font-weight:600;letter-spacing:.01em;cursor:pointer;' +
      'box-shadow:0 14px 28px -16px rgba(59,48,32,.6);transition:background .2s ease,color .2s ease;-webkit-tap-highlight-color:transparent}' +
    '.aw-gate__go:hover{background:#91691F;color:#FFFCF4}' +
    '.aw-gate__go:focus-visible{outline:2px solid #91691F;outline-offset:3px}' +
    '.aw-gate__go[disabled]{opacity:.75;cursor:default}' +
    '.aw-gate__err{min-height:1.3em;margin:.7rem 0 0;font-size:.93rem;line-height:1.35;color:#8A4B1E}' +
    '.aw-gate__fine{margin:.2rem 0 0;font-size:.86rem;line-height:1.45;color:#6E5E48}' +
    '.aw-gate__done{margin:0;font-family:var(--font-display,var(--display,"Fraunces",Georgia,serif));font-weight:500;font-size:clamp(1.7rem,6vw,2.1rem);line-height:1.15;color:#3B3020;text-align:center;padding:1.2rem 0}' +
    '@media (max-width:420px){.aw-gate__card{padding:24px 20px 20px;border-radius:18px}}' +
    '@media (prefers-reduced-motion:reduce){.aw-gate{transition:none}}';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function send(name, email) {
    var source = 'aw-signup-wall' + location.pathname.replace(/\/$/, '').replace(/\//g, '-');
    try {
      var lb = new URLSearchParams({ 'form-name': 'tribe-capture', email: email, name: name, source: source, edition: L, page: 'ancestralwatch.com' + location.pathname });
      fetch(LIST, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: lb.toString(), keepalive: true }).catch(function () {});
    } catch (e) {}
    var body = { access_key: W3F_KEY, subject: 'The Ancestral Watch — a new sign-up', from_name: 'The Ancestral Watch',
      name: name, email: email, source: source, page: location.pathname, site: 'ancestralwatch.com' };
    var done = fetch(W3F, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.ok; }).catch(function () { return false; });
    // never keep someone waiting on the network: at most four seconds
    return Promise.race([done, new Promise(function (res) { setTimeout(function () { res(false); }, 4000); })]);
  }

  var soundWasOn = false;
  function quiet() {
    try { if (window.AW && AW.sound && AW.sound.isOn && AW.sound.isOn()) { soundWasOn = true; AW.sound.set(false); } } catch (e) {}
    try { var pad = document.querySelector('.sound-toggle[aria-pressed="true"]'); if (pad) pad.click(); } catch (e) {}
    media.concat([].slice.call(document.querySelectorAll('audio,video'))).forEach(function (m) { try { if (!m.paused && !m.muted) m.pause(); } catch (e) {} });
  }

  function show() {
    if (joined() || document.querySelector('.aw-gate')) return;
    var st = document.createElement('style'); st.id = 'aw-gate-css'; st.textContent = CSS; document.head.appendChild(st);
    var g = document.createElement('div');
    g.className = 'aw-gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'awGateH');
    g.setAttribute('data-lenis-prevent', '');
    g.innerHTML = '<form class="aw-gate__card" novalidate>' +
      '<div class="aw-gate__mk"><img src="/assets/img/author-logo.png?v=2" alt="" width="716" height="676"><span>The Ancestral Watch<small>Tony Skrelūnas</small></span></div>' +
      '<div class="aw-gate__rule" aria-hidden="true"></div>' +
      '<h2 id="awGateH">' + esc(t.h) + '</h2>' +
      '<p class="aw-gate__p">' + esc(t.p) + '</p>' +
      '<label><span>' + esc(t.name) + '</span><input class="aw-gate__in" name="name" autocomplete="given-name" autocapitalize="words" required></label>' +
      '<label><span>' + esc(t.email) + '</span><input class="aw-gate__in" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required></label>' +
      '<input class="aw-gate__hp" name="botcheck" type="checkbox" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button class="aw-gate__go" type="submit">' + esc(t.btn) + ' <span aria-hidden="true">→</span></button>' +
      '<p class="aw-gate__err" aria-live="polite"></p>' +
      '<p class="aw-gate__fine">' + esc(t.fine) + '</p>' +
    '</form>';
    ['wheel', 'touchmove'].forEach(function (ev) { g.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    document.body.appendChild(g); html.classList.add('aw-gated');
    quiet();
    requestAnimationFrame(function () { requestAnimationFrame(function () { g.classList.add('is-in'); }); });
    var form = g.querySelector('form'), err = g.querySelector('.aw-gate__err'), btn = g.querySelector('.aw-gate__go');
    var fName = form.querySelector('input[name=name]'), fEmail = form.querySelector('input[name=email]'), fBot = form.querySelector('input[name=botcheck]');
    setTimeout(function () { try { fName.focus({ preventScroll: true }); } catch (e) {} }, 80);
    // keep the keyboard inside the sign-up
    g.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = [fName, fEmail, btn], i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); btn.focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); fName.focus(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = fName.value.trim(), email = fEmail.value.trim();
      if (!name) { err.textContent = t.noName; fName.focus(); return; }
      if (!validEmail(email)) { err.textContent = t.noEmail; fEmail.focus(); return; }
      err.textContent = ''; btn.disabled = true; btn.firstChild.nodeValue = t.joining + ' ';
      markJoined(name);
      var go = fBot.checked ? Promise.resolve(true) : send(name, email);
      go.then(function () {
        form.innerHTML = '<p class="aw-gate__done" role="status">' + esc(t.welcome(name.split(' ')[0])) + '</p>';
        setTimeout(function () {
          g.classList.remove('is-in');
          setTimeout(function () {
            g.remove(); html.classList.remove('aw-gated');
            try { if (soundWasOn && window.AW && AW.sound) AW.sound.set(true); } catch (e2) {}
          }, 460);
        }, 1500);
      });
    });
  }

  function start() {
    if (/[?&]render=1\b/.test(q) || location.protocol === 'file:') return;
    // Tony's own pass, the same as tribeawaken.com/?member and ancestralpeaks.com/?member
    if (/[?&]member\b/.test(q)) { if (!joined()) markJoined('Member', { pass: true }); return; }
    if (/^\/thanks\//.test(location.pathname)) { if (!joined()) markJoined('', { via: 'thanks' }); return; }
    if (joined()) return;
    var first = Date.now(), f = parseInt(get(FIRST), 10);
    if (f && f <= first) first = f; else set(FIRST, String(first));
    function due() {
      if (joined()) return;
      if (playingWithSound()) { setTimeout(due, 2500); return; }
      show();
    }
    setTimeout(due, Math.max(0, WAIT - (Date.now() - first)));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
