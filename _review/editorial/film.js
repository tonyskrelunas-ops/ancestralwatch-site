// a 30-second phone film: scrolling the home, then Stone Breath
const { chromium } = require('playwright');
const [,, base, outDir] = process.argv;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, isMobile:true, hasTouch:true, recordVideo:{dir:outDir, size:{width:390,height:844}}});
  await ctx.addInitScript(()=>{ try{ localStorage.setItem('aw.joined', JSON.stringify({name:'Review',at:Date.now()})); localStorage.setItem('aw.first', String(Date.now())); }catch(e){} });
  const page = await ctx.newPage();
  async function glide(ms){
    const H = await page.evaluate(()=>document.documentElement.scrollHeight - innerHeight);
    const steps = Math.round(ms/40); for (let i=0;i<=steps;i++){ const t=i/steps; const e = t<.5 ? 2*t*t : -1+(4-2*t)*t; await page.evaluate(y=>window.scrollTo(0,y), Math.round(H*e)); await page.waitForTimeout(40); }
  }
  await page.goto(base+'/', {waitUntil:'load'}); await page.waitForTimeout(1500); await glide(13000); await page.waitForTimeout(800);
  await page.goto(base+'/series/stone-breath/', {waitUntil:'load'}); await page.waitForTimeout(1500); await glide(12500); await page.waitForTimeout(800);
  const v = page.video(); await page.close(); await ctx.close(); await browser.close();
  console.log('saved', await v.path());
})();
