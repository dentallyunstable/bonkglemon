// Plan v2 oyun ici onizleme: yeni cizime gecen turu (varsayilan kutukcuk) takimda ve savasta gosterir,
// ekran goruntuleri alir. Kullanim: node tools/test/glemon_preview.js <cikis_klasoru> [anahtar]
const { openGame } = require('./tour.js');
const OUT = process.argv[2] || 'onizleme/oyun';
const KEY = process.argv[3] || 'kutukcuk';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const g = await openGame(); const p = g.page;
  await p.evaluate((key) => {
    const S = window.__S;
    S.save.settings.auto = true;
    S.save.equip.silah = 'tahta_kilic';
    const a = S.addPet(key, 2, false, 12); const b = S.addPet(key, 1, true, 8);
    S.save.pet = a.id; S.save.pet2 = b.id;
    S.save.skills = S.save.skills || {};
    S.changed();
    window.__BG.makeFollower();
  }, KEY);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/1_takipci.png` });
  await p.evaluate((key) => {
    const w = window.__BG;
    w.enemySpecs = () => [{ key, stage: 0 }, { key, stage: 1, shiny: true }, { key, stage: 2 }];
    w.enterDungeon(1);
  }, KEY);
  let shots = 0; const t0 = Date.now();
  while (Date.now() - t0 < 90000 && shots < 8) {
    await p.waitForTimeout(700);
    const st = await p.evaluate(() => {
      const w = window.__BG;
      const panel = document.querySelector('#panel.show');
      if (panel) { const b = [...panel.querySelectorAll('button.btn')].find((x) => /Yola çık|Devam|Tamam|Kat 1/.test(x.textContent)) || panel.querySelector('button.close'); if (b) b.click(); }
      else if (!w.busy && !w.battle) {
        const acts = [...document.querySelectorAll('#actions button')].filter((b) => !b.disabled);
        const pref = acts.find((b) => /Savaş|Saldır|İlerle|Devam|İn/.test(b.textContent)) || acts.find((b) => !/Eve dön|Kaç|Gizlice/.test(b.textContent));
        if (pref) pref.click();
      }
      return { arena: !!(w.battle && w.battle.arena), en: w.battle ? w.battle.enemies.map((e) => e.key) : [] };
    });
    if (st.arena && st.en.includes(KEY)) { await p.screenshot({ path: `${OUT}/2_savas_${shots}.png` }); shots++; await p.waitForTimeout(500); }
  }
  console.log('hatalar', JSON.stringify(g.errs));
  await g.close();
})();
