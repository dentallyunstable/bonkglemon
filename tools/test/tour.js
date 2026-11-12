// K6: otomatik kontroller. Her guncellemeden once calistir:
//   node tools/test/tour.js            (veri taramasi + panel turu, yeni ve ilerlemis kayit)
//   node tools/test/tour.js --phone    (ayni tur telefon boyutunda)
// Playwright gerekir. Depo kokunu kucuk bir http sunucusuyla sunar, #t<karakter> test girisini kullanir.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const PHONE = process.argv.includes('--phone');

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, out) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { out.writeHead(404); out.end(); return; }
      out.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(out);
    }).listen(0, () => res(srv));
  });
}

// veri tutarliligi: sayfanin icinde modulleri yukleyip kontrol eder
async function dataScan(page) {
  return page.evaluate(async () => {
    const D = await import('./src/data.js');
    const A = await import('./src/art.js');
    const bad = [];
    const items = D.ITEMS;
    const need = (id, where) => { if (!items[id]) bad.push(`${where}: bilinmeyen esya ${id}`); };
    D.RECIPES.forEach((r, i) => {
      need(r.out, `tarif ${i}`);
      for (const m of Object.keys(r.mats || {})) need(m, `tarif ${i} (${r.out})`);
    });
    for (const [k, g] of Object.entries(D.GLEMONS)) for (const d of g.drops || []) need(Array.isArray(d) ? d[0] : d.id, `Glemon ${k} dusme`);
    for (const s of D.SHOP) need(s.id, 'dukkan');
    for (const id of Object.keys(D.SELL)) need(id, 'satis');
    for (const [id, it] of Object.entries(items)) {
      if (!it.name) bad.push(`esya ${id}: ad yok`);
      if (it.req && !D.SKILLS.some((s) => s.key === it.req[0])) bad.push(`esya ${id}: bilinmeyen beceri ${it.req[0]}`);
      if (!it.icon || !A.hasIcon(it.icon)) bad.push(`esya ${id}: simge yok (${it.icon})`);
    }
    for (const z of D.ZONES) for (const k of D.ZONE_SPAWNS[z.key] || []) if (!D.GLEMONS[Array.isArray(k) ? k[0] : k]) bad.push(`bolge ${z.key}: bilinmeyen Glemon ${k}`);
    return { bad, counts: { items: Object.keys(items).length, recipes: D.RECIPES.length, glemons: Object.keys(D.GLEMONS).length } };
  });
}

// ilerlemis kayit: butun beceriler yuksek, para, malzeme, iki Glemon
async function makeAdvanced(page) {
  await page.evaluate(async () => {
    const { xpForLevel } = await import('./src/state.js');
    const S = window.__S; const D = await import('./src/data.js');
    for (const s of D.SKILLS) S.save.skills[s.key] = xpForLevel(70);
    S.save.gold = 50000;
    for (const id of ['demir_kulcesi', 'dal', 'tas', 'altin_kulcesi', 'saf_kristal', 'yildiz_demiri', 'iksir']) if (D.ITEMS[id]) S.addItem(id, 20);
    for (const id of ['kor_kilic', 'demir_gogus']) if (D.ITEMS[id]) S.addItem(id, 1);
    S.addPet('kutukcuk', 2, false, 40);
    S.save.story.ch = 5;
    S.changed();
  });
}

const PANELS = [
  ['openBag', 'w'], ['openDepo', 'w'], ['openSkills'], ['openTree', 'savas'], ['openAnvil', 'w'], ['openProfile', 'w'],
  ['openMap', 'w'], ['openAhir', 'w'], ['openNest', 'w'], ['openAlbum', 'w'], ['openStation', 'w', 'masa'], ['openStation', 'w', 'firin'],
  ['openStation', 'w', 'kazan'], ['openStation', 'w', 'yem'], ['openStation', 'w', 'mutfak'], ['openShop', 'w'], ['openVillageMap', 'w'],
  ['openLale', 'w'], ['openQuests', 'w'], ['openZindan', 'w'], ['openAchievements', 'w'], ['openTitles', 'w'], ['openEventGate', 'w'],
  ['openMerchant', 'w'], ['openTrophies', 'w'], ['openKule', 'w'], ['openLegends', 'w'], ['openPrep', 'w', 1], ['openClass'], ['openStory', 'w'],
  ['openCredits', 'w'], ['openAlbum', 'w', 'balik'], ['openAhir', 'w', 'yem'], ['openQuests', 'w', 'haftalik'],
];

async function tour(page, label) {
  const res = await page.evaluate(async (PANELS) => {
    const errs = []; const P = window.__P; const w = window.__BG;
    for (const [fn, ...args] of PANELS) {
      if (!P[fn]) { errs.push(`${fn}: yok`); continue; }
      try {
        P[fn](...args.map((a) => (a === 'w' ? w : a)));
        await new Promise((r) => setTimeout(r, 120));
      } catch (e) { errs.push(`${fn}(${args.slice(1).join(',')}): ${e.message}`); }
      document.querySelector('#panel').innerHTML = '';
    }
    return errs;
  }, PANELS);
  return res.map((e) => `[${label}] ${e}`);
}

async function scenes(page, label) {
  // ev, ilk zindan kati ve geri donus; konsol hatalari ayrica toplanir
  return page.evaluate(async () => {
    const w = window.__BG; const errs = [];
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    try { w.goBase(false); await wait(500); } catch (e) { errs.push('goBase ' + e.message); }
    try { w.enterDungeon(1); await wait(2500); } catch (e) { errs.push('enterDungeon ' + e.message); }
    try { await w.returnBase(); await wait(1500); } catch (e) { errs.push('returnBase ' + e.message); }
    return errs;
  }).then((a) => a.map((e) => `[${label}] ${e}`));
}

async function openGame(opts = {}) {
  const srv = await serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext(opts.phone ? { viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true } : { viewport: { width: 1152, height: 648 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(`http://localhost:${srv.address().port}/index.html#t${opts.char || 'dunstable'}`);
  await page.waitForFunction(() => window.__BG && window.__P && window.__S && window.__S.save, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  return { page, errs, close: async () => { await browser.close(); srv.close(); } };
}
module.exports = { serve, openGame };

// once butun kaynak dosyalarin soz dizimi (sayfa acilmadan once yakalansin)
function syntaxCheck() {
  const { execFileSync } = require('child_process');
  const bad = [];
  for (const f of fs.readdirSync(path.join(ROOT, 'src')).filter((x) => x.endsWith('.js'))) {
    try { execFileSync(process.execPath, ['--input-type=module', '--check'], { input: fs.readFileSync(path.join(ROOT, 'src', f)), stdio: ['pipe', 'pipe', 'pipe'] }); } catch (e) { bad.push(`[soz dizimi] src/${f}: ${String(e.stderr).split('\n').slice(0, 5).join(' | ')}`); }
  }
  return bad;
}
module.exports.syntaxCheck = syntaxCheck;

if (require.main === module) (async () => {
  const sx = syntaxCheck();
  if (sx.length) { console.log('HATALAR:\n' + sx.join('\n')); process.exit(1); }
  const srv = await serve();
  const url = `http://localhost:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext(PHONE ? { viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true } : { viewport: { width: 1152, height: 648 } });
  const page = await ctx.newPage();
  const consoleErrs = [];
  page.on('pageerror', (e) => consoleErrs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|Failed to load resource/.test(m.text())) consoleErrs.push('console: ' + m.text()); });
  await page.goto(url + '#tdunstable');
  await page.waitForFunction(() => window.__BG && window.__P && window.__S && window.__S.save, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const data = await dataScan(page);
  const errs = [...data.bad.map((b) => '[veri] ' + b)];
  errs.push(...await tour(page, 'yeni kayit'));
  errs.push(...await scenes(page, 'yeni kayit'));
  await makeAdvanced(page);
  errs.push(...await tour(page, 'ilerlemis kayit'));
  errs.push(...await scenes(page, 'ilerlemis kayit'));
  await page.evaluate(() => localStorage.clear());
  await browser.close(); srv.close();
  const all = [...errs, ...consoleErrs];
  console.log(`Veri: ${data.counts.items} esya, ${data.counts.recipes} tarif, ${data.counts.glemons} Glemon. Panel: ${PANELS.length} x 2.`);
  if (all.length) { console.log('HATALAR:\n' + all.join('\n')); process.exit(1); }
  console.log('TAMAM: hata yok');
})().catch((e) => { console.error(e); process.exit(1); });
