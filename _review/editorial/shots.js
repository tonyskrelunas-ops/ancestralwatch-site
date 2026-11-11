// usage: node shots.js <baseUrl> <outDir> [label]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [,, base, out] = process.argv;
const PAGES = ['/','/series/','/series/stone-breath/','/series/the-council-fire/','/series/the-far-messengers/','/series/by-lamplight/',
  '/read/','/tools/','/stories/','/stories/the-calm-you-already-stored/','/author/','/reader/','/ja/','/lt/','/lamplight/'];
const SIZES = [{n:'phone',w:390,h:844},{n:'desk',w:1440,h:900}];
const slug = p => p==='/' ? 'home' : p.replace(/^\/|\/$/g,'').replace(/\//g,'-');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser = await chromium.launch();
  const report = {};
  for (const s of SIZES){
    const ctx = await browser.newContext({viewport:{width:s.w,height:s.h}, deviceScaleFactor:1, isMobile:s.w<500, hasTouch:s.w<500});
    await ctx.addInitScript(()=>{ try{ localStorage.setItem('aw.joined', JSON.stringify({name:'Review',at:Date.now()})); localStorage.setItem('aw.first', String(Date.now())); }catch(e){} });
    for (const p of PAGES){
      const page = await ctx.newPage();
      const errs=[]; page.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); }); page.on('pageerror',e=>errs.push('pageerror: '+e.message)); page.on('requestfailed',r=>errs.push('reqfail: '+r.url()));
      await page.goto(base+p,{waitUntil:'load',timeout:60000});
      await page.waitForTimeout(600);
      // scroll through so reveals fire
      const H = await page.evaluate(()=>document.documentElement.scrollHeight);
      for(let y=0;y<H;y+=s.h*0.8){ await page.evaluate(v=>window.scrollTo(0,v),y); await page.waitForTimeout(90); }
      await page.evaluate(()=>window.scrollTo(0,0)); await page.waitForTimeout(500);
      const sw = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, bw:document.body.scrollWidth}));
      const file = path.join(out, `${slug(p)}--${s.n}.png`);
      await page.screenshot({path:file, fullPage:true});
      report[`${p} @${s.n}`] = {errors:errs, scroll:sw};
      console.log(p, s.n, 'errors:', errs.length, 'scrollW', sw.sw, '/', sw.cw);
      await page.close();
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(out,'_report.json'), JSON.stringify(report,null,2));
  await browser.close();
})();
