// the editorial checks: console errors, horizontal scroll at 390, body-text contrast AA, Lithuanian diacritics in Inter Tight
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8200';
const PAGES = ['/','/series/','/series/stone-breath/','/series/the-council-fire/','/series/the-far-messengers/','/series/by-lamplight/',
  '/read/','/tools/','/stories/','/stories/the-calm-you-already-stored/','/author/','/reader/','/ja/','/lt/','/lamplight/'];
const SIZES = [{n:'phone',w:390,h:844},{n:'desk',w:1440,h:900}];
const ENV = /mailerlite|ERR_TUNNEL_CONNECTION_FAILED|fonts\.g/; // outside hosts the sandbox cannot reach
const CONTRAST = `(() => {
  const lum = c => { const [r,g,b] = c.map(v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); }); return .2126*r+.7152*g+.0722*b; };
  const parse = s => { const m = s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null; const p = m[1].split(',').map(Number); return {rgb:p.slice(0,3), a: p.length>3 ? p[3] : 1}; };
  const ratio = (a,b) => { const l1=lum(a), l2=lum(b); return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05); };
  const blend = (fg,bg) => fg.rgb.map((v,i)=> Math.round(v*fg.a + bg[i]*(1-fg.a)));
  const bgOf = el => { let bg=[255,255,255]; const chain=[]; for(let e=el; e; e=e.parentElement){ chain.push(e); }
    // walk from the root down so translucent layers composite in order
    for (const e of chain.reverse()) { const cs=getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage!=='none' && !/gradient\\(rgba\\(0, 0, 0, 0\\)/.test(cs.backgroundImage)) return null; const c=parse(cs.backgroundColor); if(c && c.a>0) bg = blend(c,bg); } return bg; };
  const skip = el => el.closest('.state,.wc-scene,.bookband,.wc-bleed,.wc-band,.es-plate,.hero__bleed,.slab,.band,.ph,.wc-par,.aw-gate,.menu,[aria-hidden="true"],.sr-only,video,.inset,.wc-film__fx,.room__top');
  const out=[]; const els=[...document.querySelectorAll('main p, main li, main cite, main small, main figcaption, main span, main a, main b, main strong, main em, main h1, main h2, main h3, main h4, footer p, footer a, footer li, footer span, header a, header p, .peaks-tie p, .peaks-tie a')];
  for (const el of els) {
    if (skip(el)) continue;
    const txt=(el.childNodes.length? [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('') : '').trim(); if (!txt) continue;
    const r=el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs=getComputedStyle(el); if (cs.visibility==='hidden' || cs.display==='none' || +cs.opacity===0) continue;
    const fg=parse(cs.color); if(!fg) continue; const bg=bgOf(el); if(!bg) continue;
    const size=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight)>=700; const large = size>=24 || (size>=18.66 && bold);
    const need = large ? 3 : 4.5; const c = ratio(blend(fg,bg), bg);
    if (c < need) out.push({txt:txt.slice(0,50), sel:(el.className||el.tagName).toString().slice(0,60), color:cs.color, bg:'rgb('+bg.join(',')+')', ratio:+c.toFixed(2), size});
  }
  return out;
})()`;
(async () => {
  const browser = await chromium.launch(); let fails = 0; const summary = [];
  for (const s of SIZES) {
    const ctx = await browser.newContext({viewport:{width:s.w,height:s.h}, isMobile:s.w<500, hasTouch:s.w<500});
    await ctx.addInitScript(()=>{ try{ localStorage.setItem('aw.joined', JSON.stringify({name:'Review',at:Date.now()})); localStorage.setItem('aw.first', String(Date.now())); }catch(e){} });
    for (const p of PAGES) {
      const page = await ctx.newPage(); const errs=[];
      page.on('console', m => { if (m.type()==='error' && !ENV.test(m.text())) errs.push(m.text()); });
      page.on('pageerror', e => errs.push('pageerror: '+e.message));
      await page.goto(base+p, {waitUntil:'load', timeout:60000}); await page.waitForTimeout(800);
      await page.evaluate(()=>document.fonts.ready);
      const scroll = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
      const hscroll = scroll.sw > scroll.cw;
      const contrast = p==='/lamplight/' ? [] : await page.evaluate(CONTRAST);
      let lt = null;
      if (p==='/lt/') {
        lt = await page.evaluate(async () => {
          const glyphs='ąčęėįšųūžĄČĘĖĮŠŲŪŽ';
          const faces=[...document.fonts].filter(f=>f.family.replace(/"/g,'')==='Inter Tight').map(f=>({status:f.status, range:f.unicodeRange}));
          const h1=document.querySelector('h1'); const fam=getComputedStyle(h1).fontFamily;
          const ok = [...glyphs].every(ch => document.fonts.check('800 40px "Inter Tight"', ch));
          // the real proof: Inter Tight sets these letters at a different width than the fallback face
          const probe=(font)=>{const sp=document.createElement('span'); sp.style.cssText='position:absolute;visibility:hidden;font-size:60px;font-weight:800;white-space:nowrap;font-family:'+font; sp.textContent=glyphs; document.body.appendChild(sp); const w=sp.getBoundingClientRect().width; sp.remove(); return w;};
          return {faces, h1Font:fam, fontsCheck:ok, widthInterTight:probe('"Inter Tight"'), widthFallback:probe('serif'), h1Text:h1.textContent.trim().slice(0,60)};
        });
      }
      const bad = errs.length || (s.w===390 && hscroll) || contrast.length || (lt && !(lt.fontsCheck && lt.widthInterTight!==lt.widthFallback && /Inter Tight/.test(lt.h1Font)));
      if (bad) fails++;
      summary.push({page:p, size:s.n, errors:errs, hscroll, contrast, lt});
      console.log((bad?'FAIL':'ok  '), p, '@'+s.n, 'errors:'+errs.length, 'hscroll:'+hscroll, 'contrast-issues:'+contrast.length, lt?('lt:'+JSON.stringify(lt)):'');
      if (contrast.length) console.log('   ', JSON.stringify(contrast.slice(0,8)));
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  require('fs').writeFileSync(process.argv[3] || '/tmp/claude-0/-home-user-ancestralwatch-site/3ee8e401-289a-52cc-8750-4c64cb7e686f/scratchpad/test-report.json', JSON.stringify(summary,null,2));
  console.log(fails ? `${fails} page/size checks failed` : 'all checks pass');
})();
