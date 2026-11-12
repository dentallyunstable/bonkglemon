// D3 kontrolu: yeni kayitla otomatik savasta oynayan bot. Kullanim: node tools/test/bot.js [dakika] [--pasli]
// Tahta Kilic'i (ilk adim) yapip kusanir, Kat 1'den baslar, odalardaki ilk dugmeye basar, merdivenden iner.
const { openGame } = require('./tour.js');
const MIN = parseFloat(process.argv[2] || '4');
const PASLI = process.argv.includes('--pasli');
(async () => {
  const g = await openGame(); const p = g.page;
  await p.evaluate((pasli) => {
    const S = window.__S;
    S.save.settings.auto = true;
    if (!pasli) { S.removeItem('dal', 5); S.save.equip.silah = 'tahta_kilic'; S.save.stats.crafted = 1; }
    S.changed();
    window.__BG.enterDungeon(1);
  }, PASLI);
  const t0 = Date.now(); let log = []; let deaths = 0; let lastFloor = 0;
  while (Date.now() - t0 < MIN * 60000) {
    await p.waitForTimeout(500);
    const st = await p.evaluate(() => {
      const w = window.__BG; const S = window.__S;
      const panel = document.querySelector('#panel.show');
      const title = panel ? (panel.querySelector('.panel-title') || {}).textContent : null;
      if (panel) {
        const btns = [...panel.querySelectorAll('button.btn')].filter((b) => !b.disabled && !b.classList.contains('close') && !b.classList.contains('help'));
        const yola = btns.find((b) => /Yola çık|Devam|Tamam|Kat 1/.test(b.textContent));
        (yola || btns[0] || panel.querySelector('button.close') || { click() {} }).click();
      } else if (!w.busy && (!w.battle || (w.rooms && w.rooms[w.roomIdx] && w.rooms[w.roomIdx].type === 'uyuyan'))) { // uyuyan Glemon odasinda savas hazir bekler
        const acts = [...document.querySelectorAll('#actions button')].filter((b) => !b.disabled);
        const pref = acts.find((b) => /dinlen|Pusu/i.test(b.textContent)) || acts.find((b) => /İn|Aşağı|Merdiven|Devam|İlerle|Savaş|Saldır|Aç|Topla/.test(b.textContent)) || acts.find((b) => !/Eve dön|Kaç|Gizlice/.test(b.textContent)) || acts[0];
        if (pref) pref.click();
      }
      return { title, floor: w.floor, mode: w.mode, hp: S.hp, max: S.maxHp(), deaths: S.save.stats.deaths, deepest: S.save.stats.deepest, kills: S.save.stats.kills };
    });
    if (st.deaths > deaths) { deaths = st.deaths; log.push(`${Math.round((Date.now() - t0) / 1000)} sn: BAYILDI (kat ${st.floor})`); }
    if (st.title === 'Bayıldın!' || st.mode === 'plot') {
      // eve dondu: tekrar Kat 1
      await p.evaluate(() => { const w = window.__BG; if (w.home() && !w.busy) { window.__S.hp = window.__S.maxHp(); w.enterDungeon(1); } });
    }
    if (st.floor !== lastFloor) { lastFloor = st.floor; log.push(`${Math.round((Date.now() - t0) / 1000)} sn: Kat ${st.floor}, can ${st.hp}/${st.max}, ${st.kills} Glemon`); }
  }
  const fin = await p.evaluate(() => ({ deepest: window.__S.save.stats.deepest, kills: window.__S.save.stats.kills, deaths: window.__S.save.stats.deaths, lv: ['saldiri', 'can', 'savunma'].map((k) => window.__S.level(k)) }));
  console.log(log.join('\n')); console.log('SONUC', JSON.stringify(fin), g.errs);
  await g.close();
})();
