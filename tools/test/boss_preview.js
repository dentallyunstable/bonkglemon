// Plan v2 patron onizlemesi: patron savasini acar, ekran goruntusu alir, canini esigin altina indirip
// faz animasyonunu (11.1) ve yeni fazi cekip kaydeder. Kullanim: node tools/test/boss_preview.js <cikis> [anahtar] [kat]
const { openGame } = require('./tour.js');
const OUT = process.argv[2] || 'onizleme/patron';
const KEY = process.argv[3] || 'agacbasi';
const FLOOR = +(process.argv[4] || 10);
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const g = await openGame(); const p = g.page;
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e && e.stack || e)));
  await p.evaluate(({ key, floor }) => {
    const S = window.__S; const w = window.__BG;
    S.save.settings.auto = false;
    S.save.equip.silah = 'tahta_kilic';
    S.changed();
    w.prepDungeon(floor, { boss: true });
  }, { key: KEY, floor: FLOOR });
  const t0 = Date.now(); let inBattle = false;
  while (Date.now() - t0 < 60000) {
    await p.waitForTimeout(600);
    const st = await p.evaluate(() => {
      const w = window.__BG;
      const panel = document.querySelector('#panel.show');
      if (panel && !(w.battle && w.battle.arena)) {
        const b = [...panel.querySelectorAll('button.btn')].find((x) => /Yola çık|Patron|Başla|Devam|Tamam/.test(x.textContent)) || panel.querySelector('button.close');
        if (b) b.click();
      }
      return { arena: !!(w.battle && w.battle.arena), en: w.battle ? w.battle.enemies.map((e) => e.key) : [] };
    });
    if (st.arena && st.en.length) { inBattle = st.en; break; }
  }
  if (!inBattle) { console.log('patron savasi acilmadi'); await p.screenshot({ path: `${OUT}/0_hata.png` }); await g.close(); process.exit(1); }
  console.log('dusmanlar', inBattle.join(','));
  await p.evaluate(() => { const b = window.__BG.battle; b.enemies.forEach((e) => { e.atk = 0; }); });   // test: oyuncu olmesin
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/1_patron.png` });
  await p.evaluate(() => {
    const b = window.__BG.battle; const e = b.enemies.find((x) => x.data.boss);
    e.hp = Math.round(e.maxHp * 0.3); b.checkPhase(e);
  });
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(220); await p.screenshot({ path: `${OUT}/2_faz_${i}.png` }); }
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${OUT}/3_faz2.png` });
  // 3 asamali patron (Kadim Bonk): canini tekrar esigin altina indir, faz3'u de cek
  const more = await p.evaluate(() => {
    const b = window.__BG.battle; const e = b.enemies.find((x) => x.data.boss);
    const n = b.w.gmeta[e.key] ? b.w.gmeta[e.key].stages.length : 0;
    if (e.ph + 1 >= n) return false;
    e.hp = Math.round(e.maxHp * 0.15); b.checkPhase(e); return true;
  });
  if (more) {
    for (let i = 0; i < 6; i++) { await p.waitForTimeout(220); await p.screenshot({ path: `${OUT}/4_faz_${i}.png` }); }
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `${OUT}/5_faz3.png` });
  }
  const info = await p.evaluate(() => {
    const b = window.__BG.battle; const e = b.enemies.find((x) => x.data.boss);
    return { ph: e.ph, stage: e.stage, tex: e.sprite.texture.key, anim: e.sprite.anims.currentAnim && e.sprite.anims.currentAnim.key };
  });
  console.log(JSON.stringify(info));
  console.log(errs.length ? 'HATA:\n' + errs.join('\n') : 'TAMAM: hata yok');
  await g.close();
})();
