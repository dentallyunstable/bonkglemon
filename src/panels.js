// Paneller: canta + ekipman, depo, beceriler, profil karti, harita.
import { ITEMS, SLOTS, SKILLS, ZONES, BAG_SIZE, RARITY, SETS, VERSION, RECIPES, STATIONS, FURNACE_MS, FURNACE_MAX, SHOP, SELL, CURRENCY, BUILD, SEEDS, CAMP } from './data.js';
import { S, xpForLevel } from './state.js';
import * as UI from './ui.js';
import { sfx, setSound } from './audio.js';
import { forgetLogin } from './login.js';
import { iconUrl } from './art.js';

const KIND = { malzeme: 'Malzeme', tuketim: 'Tüketilebilir', silah: 'Silah', kask: 'Kask', gogus: 'Göğüslük', bot: 'Bot', tilsim: 'Tılsım', kazma: 'Kazma' };

function slotEl(s, label) {
  const d = UI.el('div', 'slot');
  if (s) {
    const it = ITEMS[s.id];
    d.classList.add('r-' + it.rarity);
    d.appendChild(UI.icon(it.icon));
    if (s.n > 1) d.appendChild(UI.el('span', 'n', String(s.n)));
    d.title = it.name;
  } else if (label) d.appendChild(UI.el('span', 'lbl', label));
  return d;
}

function statLines(it) {
  const out = [];
  if (it.power) out.push(`Saldırı gücü +${it.power}`);
  if (it.def) out.push(`Savunma +${it.def}`);
  if (it.hp) out.push(`Can +${it.hp}`);
  if (it.spd) out.push(`Hız +${it.spd}`);
  if (it.pick) out.push(`Kazma gücü ${it.pick}`);
  if (it.heal) out.push(`Canın %${Math.round(it.heal * 100)}'ini doldurur`);
  if (it.food) out.push('Savaşta yersen 3 tur saldırı +%10');
  if (it.revive) out.push(`Bir kez %${Math.round(it.revive * 100)} canla kaldırır`);
  if (it.set) out.push(`${SETS[it.set].name}: ${SETS[it.set].pieces} parça = ${SETS[it.set].bonus}`);
  return out;
}

function detailBox(id, buttons) {
  const box = UI.el('div', 'detail');
  if (!id) { box.appendChild(UI.el('div', 'muted', 'Bir eşyaya dokun.')); return box; }
  const it = ITEMS[id];
  const r = RARITY[it.rarity];
  const nm = UI.el('div', 'nm', it.name);
  nm.style.color = r.color;
  box.appendChild(nm);
  box.appendChild(UI.el('div', 'muted', `${r.name} · ${KIND[it.kind]}${it.bound ? ' · Takas edilemez' : ''}`));
  for (const l of statLines(it)) box.appendChild(UI.el('div', '', l));
  if (it.req) {
    const sk = SKILLS.find((s) => s.key === it.req[0]);
    const ok = S.level(it.req[0]) >= it.req[1];
    const req = UI.el('div', '', `Gerekli: ${sk.name} ${it.req[1]}`);
    req.style.color = ok ? '#62d862' : '#ff6b5a';
    box.appendChild(req);
  }
  box.appendChild(UI.el('div', 'muted', it.desc));
  const row = UI.el('div', 'row');
  for (const b of buttons) if (b) row.appendChild(b);
  box.appendChild(row);
  return box;
}

// ------------------------------------------------------------ canta
export function openBag(w) {
  let sel = null;
  let confirmDrop = false;
  const inBattle = !!(w.battle && !w.battle.over && $battleVisible());
  UI.openPanel('Çanta ve Ekipman', (body) => {
    const render = () => {
      body.innerHTML = '';
      const lay = UI.el('div', 'bag-layout');
      const eq = UI.el('div', 'equip-col');
      for (const [slot, label] of SLOTS) {
        const id = S.save.equip[slot];
        const d = slotEl(id ? { id, n: 1 } : null, label);
        if (sel && sel.equip === slot) d.classList.add('sel');
        d.addEventListener('click', () => { sfx('click'); sel = id ? { equip: slot } : null; confirmDrop = false; render(); });
        eq.appendChild(d);
      }
      lay.appendChild(eq);

      const mid = UI.el('div');
      const used = S.save.bag.filter(Boolean).length;
      mid.appendChild(UI.el('div', 'muted', `Çanta ${used}/${BAG_SIZE}`));
      const grid = UI.el('div', 'grid');
      S.save.bag.forEach((s, i) => {
        const d = slotEl(s);
        if (sel && sel.i === i) d.classList.add('sel');
        d.addEventListener('click', () => { sfx('click'); sel = s ? { i } : null; confirmDrop = false; render(); });
        grid.appendChild(d);
      });
      mid.appendChild(grid);
      lay.appendChild(mid);

      const right = UI.el('div');
      right.style.flex = '1';
      const st = UI.el('div', 'stats-box');
      const sets = S.activeSets().filter((x) => x.hp || x.defPct).map((x) => x.bonus).join(', ');
      st.innerHTML = `<b>Can</b> ${S.hp}/${S.maxHp()} &nbsp; <b>Saldırı</b> ${S.atk()} &nbsp; <b>Savunma</b> ${S.def()}<br><b>Hız</b> ${S.spd()} &nbsp; <b>Kritik</b> %${Math.round(S.crit() * 100)} &nbsp; <b>Kazma</b> ${S.pick()}${sets ? `<br><b>Set</b> ${sets}` : ''}`;
      right.appendChild(st);

      let id = null;
      const btns = [];
      if (sel && sel.equip) {
        id = S.save.equip[sel.equip];
        if (id) {
          const b = UI.button('Çıkar', () => {
            if (!S.unequip(sel.equip)) UI.feed('Çanta dolu, çıkaramadın.');
            sel = null; render();
          }, 'small');
          b.disabled = inBattle;
          btns.push(b);
        }
      } else if (sel && sel.i !== undefined && S.save.bag[sel.i]) {
        const slot = S.save.bag[sel.i];
        id = slot.id;
        const it = ITEMS[id];
        if (it.kind in S.save.equip) {
          const b = UI.button('Kuşan', () => {
            if (S.equipFromBag(sel.i)) { sfx('chest'); sel = { equip: it.kind }; } else if (w.sulk) w.sulk();
            render();
          }, 'primary small');
          b.disabled = inBattle || !S.canEquip(id);
          btns.push(b);
        }
        if (it.kind === 'tuketim' && it.heal && !it.battleOnly) {
          const b = UI.button('Kullan', () => {
            S.removeItem(id, 1);
            const heal = Math.round(S.maxHp() * it.heal);
            S.hp = Math.min(S.maxHp(), S.hp + heal);
            sfx('heal');
            S.changed();
            if (!S.save.bag[sel.i]) sel = null;
            render();
          }, 'small red');
          b.disabled = inBattle || S.hp >= S.maxHp();
          btns.push(b);
        }
        if (w.mode === 'base') {
          btns.push(UI.button('Depoya koy', () => {
            if (!S.moveSlot('bag', sel.i, 'depo')) UI.feed('Depo dolu.');
            sel = null; render();
          }, 'small blue'));
        }
        if (!it.bound) {
          const b = UI.button(confirmDrop ? 'Emin misin?' : 'At', () => {
            if (!confirmDrop) { confirmDrop = true; render(); return; }
            S.save.bag[sel.i] = null;
            S.changed();
            sel = null; confirmDrop = false; render();
          }, 'small close');
          b.disabled = inBattle;
          btns.push(b);
        }
      }
      if (inBattle) right.appendChild(UI.el('div', 'muted', 'Savaş sırasında eşya değiştiremezsin.'));
      right.appendChild(detailBox(id, btns));
      lay.appendChild(right);
      body.appendChild(lay);
    };
    render();
  }, { wide: true });
}

function $battleVisible() {
  const b = document.querySelector('#battle');
  return b && !b.classList.contains('hidden');
}

// ------------------------------------------------------------ depo
export function openDepo(w) {
  if (w.mode !== 'base') { UI.feed('Depo sadece üste.'); return; }
  UI.openPanel('Depo', (body) => {
    const render = () => {
      body.innerHTML = '';
      body.appendChild(UI.el('div', 'muted', 'Bir eşyaya dokununca diğer tarafa geçer. Depodakiler bayılınca kaybolmaz.'));
      const lay = UI.el('div', 'bag-layout');
      lay.style.marginTop = 'calc(3 * var(--u))';
      const a = UI.el('div');
      a.appendChild(UI.el('h3', '', 'Çanta'));
      const g1 = UI.el('div', 'grid');
      S.save.bag.forEach((s, i) => {
        const d = slotEl(s);
        d.addEventListener('click', () => { if (!s) return; sfx('click'); if (!S.moveSlot('bag', i, 'depo')) UI.feed('Depo dolu.'); render(); });
        g1.appendChild(d);
      });
      a.appendChild(g1);
      const b = UI.el('div');
      b.appendChild(UI.el('h3', '', 'Depo'));
      const g2 = UI.el('div', 'grid wide8');
      S.save.depo.forEach((s, i) => {
        const d = slotEl(s);
        d.addEventListener('click', () => { if (!s) return; sfx('click'); if (!S.moveSlot('depo', i, 'bag')) UI.feed('Çanta dolu.'); render(); });
        g2.appendChild(d);
      });
      b.appendChild(g2);
      lay.appendChild(a); lay.appendChild(b);
      body.appendChild(lay);
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ beceriler
export function openSkills() {
  UI.openPanel(`Beceriler · Toplam ${S.totalLevel()}`, (body) => {
    for (const s of SKILLS) {
      const row = UI.el('div', 'skill-row' + (s.soon ? ' soon' : ''));
      row.appendChild(UI.el('div', '', s.name));
      const lv = S.level(s.key);
      row.appendChild(UI.el('div', 'lv', `${lv}/99`));
      if (s.soon) {
        row.appendChild(UI.el('div', 'muted', `${s.soon} sürümünde gelecek`));
      } else {
        const xp = S.save.skills[s.key];
        const a = xpForLevel(lv); const b = xpForLevel(lv + 1);
        const bar = UI.el('div', 'bar xp');
        const f = UI.el('div', 'fill');
        f.style.width = lv >= 99 ? '100%' : `${((xp - a) / (b - a)) * 100}%`;
        bar.appendChild(f);
        bar.appendChild(UI.el('span', '', lv >= 99 ? 'MAKS' : `${Math.floor(xp)} / ${b} XP`));
        row.appendChild(bar);
        row.appendChild(UI.el('div', 'desc', s.desc));
      }
      body.appendChild(row);
    }
    body.appendChild(UI.el('p', 'muted', 'Manuel savaşta %20 daha fazla XP kazanırsın.'));
  });
}

// ------------------------------------------------------------ profil karti
function ago(t) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export function openProfile(w) {
  UI.openPanel('Profil kartı', (body) => {
    const render = () => {
      body.innerHTML = '';
      const pr = UI.el('div', 'profile');
      const card = UI.el('div', 'card');
      card.appendChild(UI.el('div', 'nm', S.save.char));
      card.appendChild(UI.el('div', 'tl', `Toplam seviye ${S.totalLevel()}`));
      card.appendChild(UI.domSprite(`assets/chars/${S.save.char}/front/idle.png`, w.charMeta['front/idle'], 1.3));
      const gear = UI.el('div', 'gear');
      for (const [slot] of SLOTS) {
        const id = S.save.equip[slot];
        if (id) gear.appendChild(UI.icon(ITEMS[id].icon, ''));
      }
      card.appendChild(gear);
      pr.appendChild(card);

      const info = UI.el('div', 'info');
      const st = S.save.stats;
      const hours = (st.playMs / 3600000).toFixed(1);
      info.innerHTML = `
        <b>En derin kat:</b> ${st.deepest || 0} &nbsp; <b>Yenilen Glemon:</b> ${st.kills}<br>
        <b>Patron:</b> ${st.bossKills} &nbsp; <b>Parlak:</b> ${st.shiny} &nbsp; <b>Bayılma:</b> ${st.deaths}<br>
        <b>Saldırı</b> ${S.level('saldiri')} · <b>Savunma</b> ${S.level('savunma')} · <b>Can</b> ${S.level('can')} &nbsp; <b>${CURRENCY}:</b> ${S.save.gold}<br>
        <b>Üs Puanı:</b> ${S.baseScore()} &nbsp; <b>İnşa</b> ${S.level('insa')}<br>
        <b>Oyun süresi:</b> ${hours} sa`;
      info.appendChild(UI.el('h3', '', 'Düşüş günlüğü'));
      const ul = UI.el('ul', 'droplog');
      const log = S.save.droplog.slice(0, 10);
      if (!log.length) ul.appendChild(UI.el('li', 'muted', 'Henüz nadir bir şey düşmedi. Kasmaya devam!'));
      for (const d of log) {
        const li = UI.el('li');
        const when = `<span class="when">${ago(d.t)}</span>`;
        if (d.item && ITEMS[d.item]) li.innerHTML = `${when}${UI.escapeHtml(d.from)} ${UI.itemName(d.item)}`;
        else li.innerHTML = `${when}<span style="color:#ffd04d">✦ ${UI.escapeHtml(d.from)} ${UI.escapeHtml(d.note || '')}</span>`;
        ul.appendChild(li);
      }
      info.appendChild(ul);
      const row = UI.el('div', 'row');
      row.style.display = 'flex';
      row.style.gap = 'calc(4 * var(--u))';
      row.style.marginTop = 'calc(5 * var(--u))';
      row.appendChild(UI.button(S.save.settings.sound ? 'Ses: açık' : 'Ses: kapalı', () => {
        S.save.settings.sound = !S.save.settings.sound;
        setSound(S.save.settings.sound);
        S.persist();
        render();
      }, 'small blue'));
      row.appendChild(UI.button('Çıkış yap', () => {
        UI.choice('Çıkış', 'Bu cihazdan çıkış yapılsın mı? Tekrar girerken kodun gerekecek. İlerlemen silinmez.', [
          { label: 'Çıkış yap', cls: 'red', onClick: () => { S.persist(); forgetLogin(); location.reload(); } },
          { label: 'Vazgeç', onClick: () => openProfile(w) },
        ]);
      }, 'small red'));
      info.appendChild(row);
      info.appendChild(UI.el('p', 'muted', `Arkadaşlarının kartını görmek (Buluşma) 0.6 sürümünde gelecek. · sürüm ${VERSION}`));
      pr.appendChild(info);
      body.appendChild(pr);
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ harita
export function openMap(w) {
  if (w.mode !== 'base') return;
  UI.openPanel('Harita', (body) => {
    const deepest = S.save.stats.deepest || 0;
    for (const z of ZONES.filter((x) => x.open)) {
      const row = UI.el('div', 'zone' + (z.open ? '' : ' locked'));
      const left = UI.el('div');
      left.appendChild(UI.el('div', 'zn', z.name));
      left.appendChild(UI.el('div', 'zf', z.open ? `Kat ${z.floors[0]}–${z.floors[1]} · En derin: ${Math.min(deepest, z.floors[1]) || '-'}` : `Kat ${z.floors[0]}–${z.floors[1]} · ${z.soon} sürümünde açılacak`));
      row.appendChild(left);
      const btns = UI.el('div', 'zb');
      if (z.open) {
        for (const f of [1, 5, 10]) {
          const b = UI.button(`Kat ${f}`, () => w.enterDungeon(f), f === 1 ? 'primary small' : 'small');
          b.disabled = f > 1 && deepest < f;
          if (b.disabled) b.title = `Önce Kat ${f}'e ulaş`;
          btns.appendChild(b);
        }
      }
      row.appendChild(btns);
      body.appendChild(row);
    }
    const soon = ZONES.filter((x) => !x.open).map((x) => `${x.name} (${x.soon})`).join(', ');
    const mine = UI.el('div', 'zone');
    const ml = UI.el('div');
    ml.appendChild(UI.el('div', 'zn', 'Orman Maden Ocağı'));
    ml.appendChild(UI.el('div', 'zf', `Sakin bir kazı yeri · Kaldığın derinlik: ${S.save.mine.depth} · En derin: ${S.save.stats.deepestMine || 1}`));
    mine.appendChild(ml);
    const mb = UI.el('div', 'zb');
    mb.appendChild(UI.button('Kaza git', () => w.enterMine(S.save.mine.depth), 'blue small'));
    if (S.save.mine.depth > 1) mb.appendChild(UI.button('Derinlik 1', () => w.enterMine(1), 'small'));
    mine.appendChild(mb);
    body.appendChild(mine);
    body.appendChild(UI.el('p', 'muted', `Yakında: ${soon}.`));
    body.appendChild(UI.el('p', 'muted', 'Her 5 katta bir kısayol açılır. Kat 5\'te ara patron, Kat 10\'da Ağaçbaşı seni bekliyor.'));
  });
}

// ------------------------------------------------------------ uretim istasyonlari (0.2)
// Firin: bir is (tarif + adet), her biri FURNACE_MS surer, oyun kapaliyken de ilerler.
export function furnaceState() {
  const f = S.save.furnace;
  if (!f || !f.rid || f.n <= 0) return { working: false, ready: 0, left: 0, out: null };
  const r = RECIPES[f.rid];
  const done = Math.min(f.n, Math.floor((Date.now() - f.t0) / FURNACE_MS));
  return { working: done < f.n, ready: done, left: f.n - done, out: r.out, recipe: r, next: f.t0 + (done + 1) * FURNACE_MS };
}

function collectFurnace(w) {
  const fs = furnaceState();
  if (!fs.ready) return 0;
  const f = S.save.furnace;
  let got = 0;
  for (let i = 0; i < fs.ready; i++) {
    if (!S.fits(fs.out)) break;
    S.addItem(fs.out, 1);
    got++;
  }
  if (got) {
    f.n -= got;
    f.t0 += got * FURNACE_MS;
    if (f.n <= 0) { f.rid = null; f.n = 0; }
    S.save.stats.crafted += got;
    sfx('smelt');
    const xp = fs.recipe.xp * got;
    UI.feed(`<img class="ico-inline" src="${iconUrl(ITEMS[fs.out].icon)}">Fırından ${UI.itemName(fs.out)} ×${got} aldın. +${xp} Üretim XP`);
    const ups = S.addXp({ uretim: xp });
    S.changed();
    for (const u of ups) w.levelUp(u);
  }
  if (got < fs.ready) UI.feed('Çanta dolu! Fırındakilerin hepsini alamadın.');
  return got;
}

const recipeId = (r) => RECIPES.indexOf(r);
const furnaceIdle = (f) => f.rid === null || f.rid === undefined || f.n <= 0;
const unlocked = (r) => !!S.save.seen[Object.keys(r.mats)[0]];
const canMake = (r, n = 1) => Object.entries(r.mats).every(([id, k]) => S.countItem(id) >= k * n);
function maxMake(r) {
  return Math.min(...Object.entries(r.mats).map(([id, k]) => Math.floor(S.countItem(id) / k)));
}

export function openStation(w, station) {
  const st = STATIONS[station];
  const list = RECIPES.filter((r) => r.station === station);
  let sel = list.find((r) => unlocked(r) && S.level('uretim') >= r.lvl && canMake(r)) || list.find(unlocked) || null;
  let timer = null;
  UI.openPanel(st.name, (body) => {
    const render = () => {
      body.innerHTML = '';
      body.appendChild(UI.el('div', 'muted', `${st.desc} · Üretim seviyen: ${S.level('uretim')}`));
      if (station === 'firin') body.appendChild(furnaceBox(w, render));
      const lay = UI.el('div', 'craft');
      const ul = UI.el('div', 'recipes');
      for (const r of list) {
        const it = ITEMS[r.out];
        const row = UI.el('div', 'recipe');
        if (!unlocked(r)) {
          row.classList.add('locked');
          row.appendChild(UI.el('span', 'q', '?'));
          row.appendChild(UI.el('span', 'nm', '???'));
          row.title = `${ITEMS[Object.keys(r.mats)[0]].name} bulunca açılır`;
        } else {
          row.appendChild(UI.icon(it.icon));
          const nm = UI.el('span', 'nm', it.name);
          nm.style.color = RARITY[it.rarity].color;
          row.appendChild(nm);
          if (S.level('uretim') < r.lvl) { row.classList.add('lvl'); row.appendChild(UI.el('span', 'lv', `Sv. ${r.lvl}`)); }
          else if (canMake(r)) row.appendChild(UI.el('span', 'ok', '●'));
        }
        if (sel === r) row.classList.add('sel');
        row.addEventListener('click', () => { sfx('click'); sel = r; render(); });
        ul.appendChild(row);
      }
      lay.appendChild(ul);
      lay.appendChild(recipeDetail(w, station, sel, render));
      body.appendChild(lay);
    };
    render();
    if (station === 'firin') timer = setInterval(() => { if (!UI.panelOpen()) { clearInterval(timer); return; } render(); }, 1000);
  }, { wide: true, onClose: () => { if (timer) clearInterval(timer); } });
}

function furnaceBox(w, render) {
  const box = UI.el('div', 'furnace-box');
  const fs = furnaceState();
  if (!fs.out) {
    box.appendChild(UI.el('div', 'muted', 'Fırın boş. Aşağıdan bir tarif seç ve ateşe koy.'));
    return box;
  }
  box.appendChild(UI.icon(ITEMS[fs.out].icon));
  const txt = UI.el('div', 'ftxt');
  const secs = fs.working ? Math.max(1, Math.ceil((fs.next - Date.now()) / 1000)) : 0;
  txt.innerHTML = `<b>${UI.escapeHtml(ITEMS[fs.out].name)}</b><br>Hazır: ${fs.ready} · Sırada: ${fs.left}${fs.working ? ` · sıradaki ${secs} sn` : ''}`;
  box.appendChild(txt);
  const bar = UI.el('div', 'bar xp');
  const fill = UI.el('div', 'fill');
  const f = S.save.furnace;
  fill.style.width = `${(fs.ready / f.n) * 100}%`;
  bar.appendChild(fill);
  box.appendChild(bar);
  const b = UI.button(`Al (${fs.ready})`, () => { collectFurnace(w); render(); }, 'primary small');
  b.disabled = fs.ready === 0;
  box.appendChild(b);
  return box;
}

function recipeDetail(w, station, r, render) {
  const box = UI.el('div', 'detail');
  if (!r) { box.appendChild(UI.el('div', 'muted', 'Henüz açılmış tarif yok. Malzeme buldukça tarifler açılır.')); return box; }
  if (!unlocked(r)) {
    box.appendChild(UI.el('div', 'nm', '???'));
    box.appendChild(UI.el('div', 'muted', `Bu tarif, ${ITEMS[Object.keys(r.mats)[0]].name} ilk kez bulunca açılır.`));
    return box;
  }
  const it = ITEMS[r.out];
  const nm = UI.el('div', 'nm', it.name + (r.n ? ` ×${r.n}` : ''));
  nm.style.color = RARITY[it.rarity].color;
  box.appendChild(nm);
  box.appendChild(UI.el('div', 'muted', `${KIND[it.kind]} · +${r.xp} Üretim XP${station === 'firin' ? ' · 5 sn' : ''}`));
  if (BUILD[r.out]) box.appendChild(UI.el('div', '', `İnşa bloğu · koymak için İnşa ${BUILD[r.out].lvl}`));
  for (const l of statLines(it)) box.appendChild(UI.el('div', '', l));
  if (it.req) {
    const sk = SKILLS.find((x) => x.key === it.req[0]);
    box.appendChild(UI.el('div', 'muted', `Kuşanmak için: ${sk.name} ${it.req[1]}`));
  }
  const mats = UI.el('div', 'mats');
  for (const [id, k] of Object.entries(r.mats)) {
    const have = S.countItem(id);
    const m = UI.el('div', 'mat' + (have >= k ? ' ok' : ' no'));
    m.appendChild(UI.icon(ITEMS[id].icon));
    m.appendChild(UI.el('span', '', `${ITEMS[id].name} ${have}/${k}`));
    mats.appendChild(m);
  }
  box.appendChild(mats);
  const lvlOk = S.level('uretim') >= r.lvl;
  if (!lvlOk) {
    const req = UI.el('div', '', `Gerekli: Üretim ${r.lvl}`);
    req.style.color = '#ff6b5a';
    box.appendChild(req);
  }
  const row = UI.el('div', 'row');
  const mx = maxMake(r);
  const counts = station === 'firin' ? [1, 5, 'max'] : [1, 5];
  for (const c of counts) {
    let n = c === 'max' ? mx : c;
    if (station === 'firin') {
      const f = S.save.furnace;
      const room = !furnaceIdle(f) && f.rid !== recipeId(r) ? 0 : FURNACE_MAX - (furnaceIdle(f) ? 0 : f.n);
      n = Math.min(n, room);
    }
    const label = station === 'firin' ? (c === 'max' ? `Hepsini koy (${Math.max(0, n)})` : `Ateşe koy ×${c}`) : `Üret ×${c}`;
    const b = UI.button(label, () => {
      make(w, station, r, n);
      render();
    }, c === 1 ? 'primary small' : 'small');
    b.disabled = !lvlOk || n <= 0 || !canMake(r, n);
    row.appendChild(b);
  }
  box.appendChild(row);
  if (station === 'firin') {
    const f = S.save.furnace;
    if (!furnaceIdle(f) && f.rid !== recipeId(r)) box.appendChild(UI.el('div', 'muted', 'Fırın başka bir şey pişiriyor. Önce bitenleri al.'));
  }
  return box;
}

function make(w, station, r, n) {
  if (n <= 0 || !canMake(r, n) || S.level('uretim') < r.lvl) return;
  if (station === 'firin') {
    const f = S.save.furnace;
    const rid = recipeId(r);
    if (!furnaceIdle(f) && f.rid !== rid) return;
    for (const [id, k] of Object.entries(r.mats)) S.removeItem(id, k * n);
    const fs = furnaceState();
    if (furnaceIdle(f)) { f.rid = rid; f.n = 0; f.t0 = Date.now(); }
    else if (!fs.working) {
      // bitmis ama alinmamis olanlar korunur, yeni isler simdi baslar
      f.t0 = Date.now() - fs.ready * FURNACE_MS;
    }
    f.n += n;
    sfx('smelt');
    UI.feed(`Fırına ${n} tane ${UI.itemName(r.out)} koydun. Her biri 5 saniye.`);
    S.changed();
    if (w.refreshFurnace) w.refreshFurnace();
    return;
  }
  // stackable olmayan esyalar icin canta yeri kontrolu
  const per = r.n || 1;
  if (!S.fits(r.out, n * per)) { UI.feed('Çanta dolu!'); return; }
  for (const [id, k] of Object.entries(r.mats)) S.removeItem(id, k * n);
  S.addItem(r.out, n * per);
  S.save.stats.crafted += n;
  sfx('craft');
  // masada ve kazanda elle calisir (punch)
  w.player.setFlipX(false);
  w.player.play({ key: 'c_punch', timeScale: 1.4 });
  w.player.once('animationcomplete', () => w.idle());
  const xp = r.xp * n;
  UI.feed(`<img class="ico-inline" src="${iconUrl(ITEMS[r.out].icon)}">${UI.itemName(r.out)}${n * per > 1 ? ` ×${n * per}` : ''} ürettin! +${xp} Üretim XP`);
  const ups = S.addXp({ uretim: xp });
  S.changed();
  for (const u of ups) w.levelUp(u);
}

// ---------------------------------------------------------------- Takas Tezgahi (0.2.1)
// Cimen Blogu ile alisveris. Alinca karakter blogu tezgaha birakir (placeblock).
export function openShop(w) {
  let tab = 'al';
  UI.openPanel('Takas Tezgâhı', (body) => {
    const render = () => {
      body.innerHTML = '';
      const top = UI.el('div', 'shop-top');
      top.innerHTML = `<img class="ico-inline" src="${iconUrl('cimen')}"><b>${S.save.gold}</b> ${CURRENCY}`;
      const tabs = UI.el('div', 'choice-row');
      const ta = UI.button('Al', () => { tab = 'al'; render(); }, tab === 'al' ? 'primary small' : 'small');
      const ts = UI.button('Sat', () => { tab = 'sat'; render(); }, tab === 'sat' ? 'primary small' : 'small');
      tabs.appendChild(ta); tabs.appendChild(ts);
      top.appendChild(tabs);
      body.appendChild(top);
      const list = UI.el('div', 'shop-list');
      if (tab === 'al') {
        for (const { id, price } of SHOP) {
          const it = ITEMS[id];
          const row = UI.el('div', 'shop-row r-' + it.rarity);
          row.appendChild(UI.icon(it.icon));
          const nm = UI.el('div', 'shop-nm');
          nm.innerHTML = `${UI.itemName(id)}<div class="muted">${UI.escapeHtml(it.desc)}</div>`;
          row.appendChild(nm);
          const b = UI.button(`${price}`, () => buy(id, price), 'small primary');
          b.prepend(Object.assign(document.createElement('img'), { className: 'ico-inline', src: iconUrl('cimen') }));
          b.disabled = S.save.gold < price;
          row.appendChild(b);
          list.appendChild(row);
        }
      } else {
        const have = Object.keys(SELL).filter((id) => S.countItem(id) > 0);
        if (!have.length) list.appendChild(UI.el('p', 'muted', 'Satacak malzemen yok. Zindanda ve madende malzeme topla.'));
        for (const id of have) {
          const it = ITEMS[id];
          const n = S.countItem(id);
          const row = UI.el('div', 'shop-row');
          row.appendChild(UI.icon(it.icon));
          row.appendChild(UI.el('div', 'shop-nm', `${it.name} ×${n} · tanesi ${SELL[id]}`));
          row.appendChild(UI.button('Sat 1', () => sell(id, 1), 'small'));
          if (n > 1) row.appendChild(UI.button(`Hepsi (${n * SELL[id]})`, () => sell(id, n), 'small blue'));
          list.appendChild(row);
        }
        body.appendChild(UI.el('p', 'muted', 'Satış fiyatı düşüktür: asıl değer malzemede.'));
      }
      body.appendChild(list);
    };
    const buy = (id, price) => {
      if (S.save.gold < price) { sfx('weak'); return; }
      if (!S.fits(id)) { UI.feed('Çanta dolu!'); if (w.sulk) w.sulk(); return; }
      S.save.gold -= price;
      S.addItem(id, 1);
      S.changed();
      sfx('coin');
      UI.feed(`<img class="ico-inline" src="${iconUrl(ITEMS[id].icon)}">${UI.itemName(id)} aldın! (−${price} ${CURRENCY})`);
      UI.closePanel();
      w.tradeDone().then(() => { if (w.mode === 'base' && !UI.panelOpen()) openShop(w); });
    };
    const sell = (id, n) => {
      const got = S.removeItem(id, n);
      S.save.gold += got * SELL[id];
      S.changed();
      sfx('coin');
      render();
    };
    render();
  });
}

// ---------------------------------------------------------------- Kamp (0.3)
// Oyun kapaliyken birikenler: girişte kucuk bir hediye. Cantaya sigmayan depoya gider.
export function openCamp(w, rw) {
  const mins = Math.round(rw.ms / 60000);
  const dur = mins >= 60 ? `${Math.floor(mins / 60)} sa ${mins % 60 ? `${mins % 60} dk` : ''}` : `${mins} dk`;
  UI.openPanel('Kamp ödülü', (body) => {
    body.appendChild(UI.el('p', 'choice-text', `Sen yokken (${dur}) kamp ateşinin başında bunlar birikti:`));
    const list = UI.el('div', 'camp-list');
    for (const [id, n] of Object.entries(rw.items)) {
      const m = UI.el('div', 'mat ok');
      m.appendChild(UI.icon(ITEMS[id].icon));
      m.appendChild(UI.el('span', '', `${ITEMS[id].name} ×${n}`));
      list.appendChild(m);
    }
    body.appendChild(list);
    body.appendChild(UI.el('div', 'muted', 'Kamp en fazla 2 saatlik malzeme toplar. XP ve nadir eşya vermez.'));
    const row = UI.el('div', 'choice-row');
    row.appendChild(UI.button('Topla', () => {
      let toDepo = 0;
      for (const [id, n] of Object.entries(rw.items)) {
        const left = S.addItemRaw(id, n, 'bag');
        if (left > 0) toDepo += left - S.addItemRaw(id, left, 'depo');
      }
      sfx('gather');
      UI.feed(`Kamp ödülünü topladın.${toDepo ? ' Çantaya sığmayanlar depoya kondu.' : ''}`);
      S.changed();
      UI.closePanel();
      if (w.mode === 'base') w.player.play('c_cheer');
    }, 'primary'));
    body.appendChild(row);
  });
}

