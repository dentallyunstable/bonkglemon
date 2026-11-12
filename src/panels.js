// Paneller: canta + ekipman, depo, beceriler, profil karti, harita.
import { playAnim } from './anim.js';
import { gearPreview } from './gear.js';
import { newShaft } from './shaft.js';
import { QUESTS, QUEST_REROLL, ITEMS, SLOTS, SKILLS, ZONES, RARITY, SETS, VERSION, RECIPES, STATIONS, FURNACE_MS as FURNACE_BASE, FURNACE_MAX, SHOP, SELL, CURRENCY, BUILD, SEEDS, CAMP, GLEMONS, ZONE_SPAWNS, STAGES, COMBOS, ABILITIES, BASIC, EVOLVE_AT, petXpFor, FOODS, TAME, EGG_BATTLES, EGGS, FISH, WATERS, WATER_GLEMONS, TREE2, TREE_ROW_NEED, nodeCost, nodeDesc, respecCost, masteryOf, ENCH, FOSSILS, TREES, GROVE_PLOTS, TOK, burnChance, TASTY_BONUS, zoneOf, NIGHT_HOME, TRAITS, PASSIVES, passiveOf, favOf, BOND, TEAM, NEST, ranchDropOf, TYPE_STRONG, SECRET_HOME, ZONE_DONE, MASTERY, CLASSES, SUBCLASSES, CLASS_RULES, CLASS_TREE, SUB_TREE, STYLE, STYLE_NAME, AFFIX, bonusText, LEGENDS, LEGEND_PUL, LEGEND_ACH, KULE_RULES, BOSS_P2, HARD, STORY, KADIM, ANVIL5, STATION_LVL , BAG_BUY, REROLL_PRICE, ZONE_BASE, DROP_ZONE, NAMES } from './data.js';
import * as PETS from './pets.js';
import { S, xpForLevel } from './state.js';
import * as UI from './ui.js';
import { sfx } from './audio.js';
import { tutFlag, openSettings } from './help.js';
import { iconUrl, todNow, todLeftMin } from './art.js';
import {
  PUL, refreshGoals, goals, goalDef, goalText, goalProgress, readyCount, addPul, clockOk, ACH, SECRET, ACH_GROUPS, TIER_NAMES, TIER_PTS, SECRET_PTS, achTier, achTargets, achPoints, achCount, ACH_TOTAL,
  TITLES, titleOf, ALBUM_RW, albumPct, todayRule, weekendNow, weekendKind, weekendEnds, weekendStarts, nextMidnight, nextMonday, fmtLeft, fullMoon, nextFullMoon,
  merchantHere, merchantNext, merchantStock, weekNum, tourCount, FISH_TOUR, FISH_TOUR_PUL, dayNum,
} from './goals.js';
import { now as gNow } from './clock.js';

const KIND = { aksesuar: 'Glemon aksesuarı', malzeme: 'Malzeme', tuketim: 'Tüketilebilir', silah: 'Silah', kask: 'Kask', gogus: 'Göğüslük', bot: 'Bot', tilsim: 'Tılsım', kazma: 'Kazma', olta: 'Olta', yumurta: 'Yumurta', pelerin: 'Pelerin', alet: 'Alet' };

function slotEl(s, label) {
  const d = UI.el('div', 'slot');
  if (s) {
    const it = ITEMS[s.id];
    d.classList.add('r-' + S.rarityOf(s.id, s.x));
    if (s.x) d.classList.add('q-' + s.x.q);
    d.appendChild(UI.icon(it.icon));
    if (s.n > 1) d.appendChild(UI.el('span', 'n', String(s.n)));
    else if (s.u) d.appendChild(UI.el('span', 'n', `+${s.u}`)); // B4: Ors artisi
    d.title = it.name;
  } else if (label) d.appendChild(UI.el('span', 'lbl', label));
  return d;
}

// 0.11 Mutfak: pisirirken kucuk zamanlama oyunu. Dogru anda "Cevir!" = lezzetli (Tok %20 uzun)
function cookGame(done) {
  if (document.querySelector('.cook-game')) return;
  const host = UI.$('#panel');
  const box = UI.el('div', 'cook-game');
  box.appendChild(UI.el('div', 'cg-title', 'Tavayı doğru anda çevir!'));
  const bar = UI.el('div', 'cg-bar');
  const zone = UI.el('div', 'cg-zone');
  const z0 = 0.2 + Math.random() * 0.55;
  zone.style.left = `${z0 * 100}%`; zone.style.width = '20%';
  const mark = UI.el('div', 'cg-mark');
  bar.appendChild(zone); bar.appendChild(mark);
  box.appendChild(bar);
  const msg = UI.el('div', 'cg-msg', '');
  let over = false; const t0 = performance.now(); let pos = 0;
  const tick = () => {
    if (over) return;
    const t = (performance.now() - t0) / 1100;
    pos = 1 - Math.abs(((t % 2) + 2) % 2 - 1);
    mark.style.left = `${pos * 100}%`;
    if (performance.now() - t0 > 4500) finish(false, 'Geç kaldın, normal pişti.');
    else requestAnimationFrame(tick);
  };
  const finish = (good, text) => {
    if (over) return; over = true;
    msg.textContent = text; msg.className = 'cg-msg ' + (good ? 'good' : '');
    btn.disabled = true;
    sfx(good ? 'perfect' : 'click');
    setTimeout(() => { box.remove(); done(good); }, 750);
  };
  const btn = UI.button('Çevir!', () => { const ok = pos >= z0 && pos <= z0 + 0.2; finish(ok, ok ? 'Lezzetli!' : 'Olmadı, normal pişti.'); }, 'primary');
  box.appendChild(btn);
  box.appendChild(msg);
  host.appendChild(box);
  requestAnimationFrame(tick);
}

function cook(w, r, n, render) {
  const per = r.n || 1;
  if (!S.fits(r.out, n * per) || !S.fits('yanmis_yemek', n * per)) { UI.feed('Çanta dolu!'); return; }
  cookGame((tasty) => {
    if (!canMake(r, n)) return;
    for (const [id, k] of Object.entries(r.mats)) S.removeItem(id, k * n);
    const lvl = S.level('ascilik');
    let good = 0; let burnt = 0;
    for (let i = 0; i < n * per; i++) { if (Math.random() < burnChance(lvl, r.lvl)) burnt++; else good++; }
    if (good) S.addItem(r.out, good);
    if (burnt) S.addItem('yanmis_yemek', burnt);
    if (tasty && good && ITEMS[r.out].tok) S.save.tasty[r.out] = (S.save.tasty[r.out] || 0) + good;
    S.save.stats.cooked = (S.save.stats.cooked || 0) + n;
    S.save.stats.crafted += n;
    sfx(burnt && !good ? 'hurt' : 'craft');
    if (w.player) { w.player.play({ key: 'c_punch', timeScale: 1.4 }); w.player.once('animationcomplete', () => w.idle()); }
    const xp = Math.round(r.xp * n * (good ? 1 : 0.3));
    const parts = [];
    if (good) parts.push(`<img class="ico-inline" src="${iconUrl(ITEMS[r.out].icon)}">${UI.itemName(r.out)}${good > 1 ? ` ×${good}` : ''}${tasty && ITEMS[r.out].tok ? ' (lezzetli!)' : ''}`);
    if (burnt) parts.push(`${burnt} tanesi yandı`);
    UI.feed(`Pişirdin: ${parts.join(', ')}. +${xp} Aşçılık XP`);
    const ups = S.addXp({ ascilik: xp });
    S.changed();
    if (UI.panelOpen() && render) render();
    w.levelUps(ups);
  });
}

function statLines(it) {
  const out = [];
  if (it.power) out.push(`${it.wt === 'yay' ? 'Yay' : it.wt === 'yumruk' ? 'Yumruk' : it.wt === 'asa' ? 'Asa' : 'Kılıç'} gücü +${it.power}`);
  if (it.mana) out.push(`Mana +${it.mana}`);
  if (it.magic) out.push(`Büyü hasarı +%${Math.round(it.magic * 100)}`);
  if (it.drain) out.push(`Büyüyle %${Math.round(it.drain * 100)} can çalma`);
  if (it.luck) out.push(`Şans +${it.luck}`);
  if (it.yem) out.push(it.special ? 'Özel yem: her nadirlik' : it.yem === 'su' ? 'Basit yem: Nadir Su Glemonları' : 'Basit yem: Sıradan Glemonlar');
  if (it.def) out.push(`Savunma +${it.def}`);
  if (it.hp) out.push(`Can +${it.hp}`);
  if (it.spd) out.push(`Hız +${it.spd}`);
  if (it.pick) out.push(`Kazma gücü ${it.pick}`);
  if (it.heal) out.push(`Canın %${Math.round(it.heal * 100)}'ini doldurur`);
  if (it.tok) out.push(`Tok ${it.tok[2]} dk: ${TOK[it.tok[0]].fmt(it.tok[1])}`);
  if (it.food && !it.strong && !it.tok) out.push('Savaşta yersen 3 tur saldırı +%10');
  if (it.strong) out.push(`Savaşta yersen ${it.strong} tur saldırı +%30`);
  if (it.rod) {
    if (it.rod.box) out.push(`Yakalama kutusu +%${Math.round(it.rod.box * 100)}`);
    if (it.rod.bite < 1) out.push('Balık daha çabuk ısırır');
    if (it.rod.rare > 1) out.push('Nadir balık şansı artar');
    if (it.rod.lava) out.push('Lav göllerinde tutar');
  }
  if (it.bait) out.push(it.bait === 'parlak' ? 'Yem: nadir ve efsane balık şansı' : 'Yem: balık daha çabuk ısırır');
  if (it.fish) out.push('Balık');
  if (it.dodge) out.push(`Kaçınma düğmesi %${Math.round(it.dodge * 100)} uzun kalır`);
  if (it.ward) out.push(`Savaşta ${it.ward} saldırıdan korur`);
  if (it.crit) out.push(`Kritik +%${Math.round(it.crit * 100)}`);
  if (it.onHit) out.push(`Vuruşların %${Math.round(it.onHit[1] * 100)} ihtimalle ${it.onHit[0] === 'donma' ? 'dondurur' : 'yakar'}`);
  if (it.fireproof) out.push('Yanma işlemez');
  if (it.darkproof) out.push('Karanlık işlemez');
  if (it.warm) out.push('30 dakika soğuktan korur');
  if (it.fireRes) out.push('30 dakika lavdan korur');
  if (it.egg) out.push(`Çantanda ${S.eggNeed()} savaş taşıyınca çatlar`);
  if (it.revive) out.push(`Bir kez %${Math.round(it.revive * 100)} canla kaldırır`);
  if (it.set) out.push(`${SETS[it.set].name}: ${SETS[it.set].two ? SETS[it.set].bonus : `${SETS[it.set].pieces} parça = ${SETS[it.set].bonus}`}`);
  return out;
}

function detailBox(id, buttons, x = null, u = 0) {
  const box = UI.el('div', 'detail');
  if (!id) { box.appendChild(UI.el('div', 'muted', 'Bir eşyaya dokun.')); return box; }
  const it = ITEMS[id];
  const r = RARITY[S.rarityOf(id, x)];
  const nm = UI.el('div', 'nm', it.name + (u ? ` +${u}` : ''));
  nm.style.color = r.color;
  box.appendChild(nm);
  box.appendChild(UI.el('div', 'muted', `${r.name} · ${KIND[it.kind]}${it.bound ? ' · Takas edilemez' : ''}`));
  for (const l of statLines(it)) box.appendChild(UI.el('div', '', l));
  // 0.13.5 ek ozellikler (kalite) ve efsanevi ozellikler
  for (const [k, v] of [...(x ? x.a : []), ...(it.fx || [])]) {
    const l = UI.el('div', 'affix', `✦ ${AFFIX[k].n(v)}`);
    l.style.color = it.fx ? RARITY.efsanevi.color : r.color;
    box.appendChild(l);
  }
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
  tutFlag('canta');
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
        const d = slotEl(id ? { id, n: 1, x: S.save.eqx[slot], u: S.save.equ[slot] } : null, label);
        if (sel && sel.equip === slot) d.classList.add('sel');
        d.addEventListener('click', () => { sfx('click'); sel = id ? { equip: slot } : null; confirmDrop = false; render(); });
        eq.appendChild(d);
      }
      lay.appendChild(eq);

      const mid = UI.el('div');
      const used = S.save.bag.filter(Boolean).length;
      mid.appendChild(UI.el('div', 'muted', `Çanta ${used}/${S.bagSize()}`));
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
      const sets = S.activeSets().map((x) => (x.tier ? `${x.name} (${x.tier}): ${bonusText(Object.fromEntries(Object.entries(x).filter(([k]) => !['set', 'tier', 'name'].includes(k))))}` : x.bonus)).join(', ');
      st.innerHTML = `<b>Can</b> ${S.hp}/${S.maxHp()} &nbsp; <b>Saldırı</b> ${S.atk()} &nbsp; <b>Savunma</b> ${S.def()}<br><b>Hız</b> ${S.spd()} &nbsp; <b>Kritik</b> %${Math.round(S.crit() * 100)} &nbsp; <b>Kazma</b> ${S.pick()}${sets ? `<br><b>Set</b> ${sets}` : ''}`;
      // 0.8.9: giydigin anda ustunde gorursun
      const pv = gearPreview('idle/0');
      if (pv) {
        const top = UI.el('div', 'bag-top');
        pv.className = 'gear-preview';
        top.appendChild(pv);
        // 0.9: pelerin arkadan gorunur
        const pb = S.save.equip.pelerin && gearPreview('b_idlesway/0');
        if (pb) { pb.className = 'gear-preview'; top.appendChild(pb); }
        top.appendChild(st);
        right.appendChild(top);
      } else right.appendChild(st);

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
        // 0.11: yemek, iksir, matara ve corbalar tek yerden (S.consume)
        if (it.kind === 'tuketim' && (it.heal || it.warm || it.water || it.fireRes || it.tok) && !it.battleOnly) {
          const b = UI.button(it.food ? 'Ye' : 'Kullan', () => {
            const msgs = S.consume(id);
            if (!msgs) return;
            UI.feed(`${UI.itemName(id)}: ${msgs.join(' · ')}`);
            sfx('heal');
            S.changed();
            if (w.refreshHud) w.refreshHud();
            if (!S.save.bag[sel.i]) sel = null;
            render();
          }, 'small red');
          b.disabled = inBattle || (S.hp >= S.maxHp() && !it.warm && !it.water && !it.fireRes && !it.tok);
          btns.push(b);
        }
        if (it.bagPlus) {
          const b = UI.button('Kullan', () => {
            if (it.bagPlus) {
              if (S.bagSize() >= 40) { UI.feed('Çantan en büyük boyda (40).'); return; }
              S.removeItem(id, 1);
              S.save.bagBonus = (S.save.bagBonus || 0) + it.bagPlus;
              while (S.save.bag.length < S.bagSize()) S.save.bag.push(null);
              UI.feed(`Çantan büyüdü! Artık ${S.bagSize()} yuva.`);
            } else {
              S.removeItem(id, 1);
              S.save.waterUntil = gNow() + 30 * 60 * 1000;
              UI.feed('Su içtin: 30 dakika çöl sıcağından etkilenmezsin.');
            }
            sfx('heal');
            S.changed();
            if (!S.save.bag[sel.i]) sel = null;
            render();
          }, 'small red');
          b.disabled = inBattle;
          btns.push(b);
        }
        if (w.home()) {
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
      const xsel = sel && sel.equip ? S.save.eqx[sel.equip] : sel && sel.i !== undefined && S.save.bag[sel.i] ? S.save.bag[sel.i].x : null;
      const usel = sel && sel.equip ? S.save.equ[sel.equip] : sel && sel.i !== undefined && S.save.bag[sel.i] ? S.save.bag[sel.i].u : 0;
      const dbox = detailBox(id, btns, xsel, usel);
      const eslot = sel && sel.i !== undefined && S.save.bag[sel.i];
      if (eslot && ITEMS[eslot.id].egg) dbox.insertBefore(UI.el('div', '', `Çatlamaya: ${eslot.p || 0}/${S.eggNeed()} savaş`), dbox.lastChild.previousSibling);
      right.appendChild(dbox);
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
  if (!w.home()) { UI.feed('Depo sadece evde.'); return; }
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
  tutFlag('beceri');
  UI.openPanel(`Beceriler · Toplam ${S.totalLevel()}`, (body) => {
    const free = Object.keys(TREE2).reduce((t, b) => t + Math.max(0, S.treePoints(b) - S.treeSpent(b)), 0);
    const tb = UI.el('div', 'choice-row');
    tb.appendChild(UI.button(free ? `Yetenek Ağacı (${free} puan)` : 'Yetenek Ağacı', () => openTree(), free ? 'green' : 'primary'));
    body.appendChild(tb);
    for (const s of SKILLS) {
      const row = UI.el('div', 'skill-row' + (s.soon ? ' soon' : ''));
      row.appendChild(UI.el('div', '', s.name));
      const lv = S.level(s.key);
      const vl = S.vlevel(s.key);
      row.appendChild(UI.el('div', 'lv' + (lv >= 99 ? ' max' : ''), lv >= 99 ? `99 ✦${vl > 99 ? ` (${vl})` : ''}` : `${lv}/99`));
      if (s.soon) {
        row.appendChild(UI.el('div', 'muted', `${s.soon} sürümünde gelecek`));
      } else {
        const xp = S.save.skills[s.key];
        // 1.0: 99'dan sonra sanal seviyeye (120) dogru dolar
        const cur = lv >= 99 ? vl : lv;
        const a = xpForLevel(cur); const b = xpForLevel(cur + 1);
        const bar = UI.el('div', 'bar xp' + (lv >= 99 ? ' virt' : ''));
        const f = UI.el('div', 'fill');
        f.style.width = cur >= 120 ? '100%' : `${((xp - a) / (b - a)) * 100}%`;
        bar.appendChild(f);
        bar.appendChild(UI.el('span', '', cur >= 120 ? 'USTA (120)' : lv >= 99 ? `Sanal ${cur + 1}: ${Math.floor(xp)} / ${b} XP` : `${Math.floor(xp)} / ${b} XP`));
        row.appendChild(bar);
        row.appendChild(UI.el('div', 'desc', s.desc));
      }
      body.appendChild(row);
    }
    body.appendChild(UI.el('p', 'muted', 'Manuel savaşta %20 daha fazla XP kazanırsın.'));
  });
}

// ------------------------------------------------------------ yetenek agaci 2.0 (1.0.13)
// Dalin becerilerinde her seviye 1 puan. 1. siradaki yetenekler kademe basi 1 puan, sonra 2, 3...
// Buyuk yetenekler tek seferlik ve daha pahali. Siralar o dala puan harcadikca acilir.
export function openTree(tab = 'savas') {
  if (!TREE2[tab]) tab = 'savas';
  UI.openPanel('Yetenek Ağacı', (body) => {
    const render = () => {
      body.innerHTML = '';
      const tabs = UI.el('div', 'choice-row');
      for (const [b, def] of Object.entries(TREE2)) {
        const free = S.treePoints(b) - S.treeSpent(b);
        tabs.appendChild(UI.button(`${def.name}${free > 0 ? ` (${free})` : ''}`, () => { tab = b; render(); }, tab === b ? 'primary small' : 'small'));
      }
      body.appendChild(tabs);
      const def = TREE2[tab];
      const pts = S.treePoints(tab); const spent = S.treeSpent(tab);
      const names = def.skills.map((k) => SKILLS.find((s) => s.key === k).name).join(', ');
      body.appendChild(UI.el('p', 'muted', `${names}: her seviye 1 puan. Boş puan: ${pts - spent} · Harcanan: ${spent}`));
      if (tab === 'savas') {
        const c = S.cls(); const sb = S.sub();
        const r = UI.el('div', 'choice-row');
        r.appendChild(UI.button(c ? `Sınıf: ${c.name}${sb ? ` · ${sb.name}` : ''}` : 'Sınıf seç', () => openClass(), !c && S.combatLevel() >= CLASS_RULES.unlock ? 'green small' : 'small'));
        body.appendChild(r);
        if (!c) body.appendChild(UI.el('p', 'muted', S.combatLevel() >= CLASS_RULES.unlock ? 'Sınıfını seçince sınıfının yetenekleri de bu dalda açılır.' : `Saldırı, Okçuluk ya da Büyü ${CLASS_RULES.unlock} olunca sınıf seçebilirsin; sınıf yetenekleri de bu dala gelir.`));
      }
      S.treeRows(tab).forEach((row, i) => {
        const open = S.rowOpen(tab, i);
        const h = UI.el('h3', 'tree-h' + (open ? '' : ' locked'), `${i + 1}. sıra · kademe başı ${i + 1} puan${row.some((n) => n.big) ? `, büyük yetenekler ${(i + 1) * 3} puan` : ''}`);
        if (!open) h.appendChild(UI.el('span', 'muted', ` 🔒 bu dala ${TREE_ROW_NEED[i]} puan harca (${spent}/${TREE_ROW_NEED[i]})`));
        body.appendChild(h);
        const rowEl = UI.el('div', 'tree-row');
        for (const n of row) {
          const rk = S.treeRank(tab, n.key);
          const full = rk >= n.max;
          const cost = nodeCost(n, i);
          const card = UI.el('div', 'tree-card' + (full ? ' picked' : rk ? ' part' : '') + (open ? '' : ' off') + (n.big ? ' big' : ''));
          const top = UI.el('div', 'zn', (full ? '✔ ' : '') + n.name);
          if (n.max > 1) top.appendChild(UI.el('span', 'rank', ` ${rk}/${n.max}`));
          card.appendChild(top);
          if (n.cls) card.appendChild(UI.el('div', 'tag', 'Sınıf yeteneği'));
          card.appendChild(UI.el('div', 'muted', n.max > 1 ? `Her kademe: ${nodeDesc(n)}` : nodeDesc(n)));
          if (!full) {
            const b = UI.button(`${rk ? '+1 kademe' : 'Al'} · ${cost} puan`, () => {
              if (S.buyNode(tab, i, n)) {
                sfx('levelup');
                UI.feed(`<span style="color:#ffd04d">★ ${n.name}${n.max > 1 ? ` ${S.treeRank(tab, n.key)}/${n.max}` : ''}</span>`, 'gold');
                render();
              }
            }, 'small green');
            b.disabled = !S.canBuy(tab, i, n);
            card.appendChild(b);
          }
          rowEl.appendChild(card);
        }
        body.appendChild(rowEl);
      });
      // sifirlama: Hanci Lale'nin isi; Cimen Blogu ya da Sifirlama Tasi
      const total = Object.keys(TREE2).reduce((t, b) => t + S.treeSpent(b), 0);
      if (total > 0) {
        const cost = respecCost(Math.round(total / 4));
        const r = UI.el('div', 'choice-row');
        const stone = S.countItem('sifirlama_tasi') > 0;
        const b = UI.button(stone ? 'Lale ile sıfırla (Sıfırlama Taşı)' : `Lale ile sıfırla (${cost} ${CURRENCY})`, () => {
          if (stone) S.removeItem('sifirlama_tasi', 1);
          else if (S.save.gold >= cost) S.save.gold -= cost;
          else return;
          S.save.tree = {};
          S.treeChanged();
          S.hp = Math.min(S.hp, S.maxHp());
          S.changed();
          sfx('coin');
          UI.feed('Hancı Lale yetenek ağacını sıfırladı. Puanların geri geldi!');
          render();
        }, 'small');
        b.disabled = !stone && S.save.gold < cost;
        r.appendChild(b);
        body.appendChild(r);
      }
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ Ors (0.8.5)
// Silah, zirh ve kazma +1..+3 Yildiz Demiriyle, +4 Usta Damgasiyla. Her arti %8. Asla basarisiz olmaz.
// D5 (1.0.18): +1..+3 bedeli esyanin kademesine gore (eskiden hep Yildiz Demiri). +4 ve +5 ayni kaldi.
const ANVIL_TIER = {
  dusuk: [[['demir_kulcesi', 3]], [['demir_kulcesi', 6]], [['demir_kulcesi', 10]]],
  orta: [[['altin_kulcesi', 2], ['saf_kristal', 1]], [['altin_kulcesi', 4], ['saf_kristal', 2]], [['altin_kulcesi', 6], ['saf_kristal', 3]]],
  yuksek: [[['yildiz_demiri', 1]], [['yildiz_demiri', 2]], [['yildiz_demiri', 3]]],
};
const ANVIL_TOP = [[['yildiz_demiri', 2], ['usta_damgasi', 1]], ANVIL5]; // +4 ve +5 (1.0 Kadim isciligi)
const ANVIL_MAX = 5;
function anvilTier(id) {
  const pre = id.split('_')[0];
  if (['tas', 'demir', 'tahta', 'pasli', 'yosun'].includes(pre)) return 'dusuk';
  if (['kristal', 'kor'].includes(pre)) return 'orta';
  if (['bonkit', 'golge'].includes(pre)) return 'yuksek';
  const r = ITEMS[id].req ? ITEMS[id].req[1] : 0;
  return r < 25 ? 'dusuk' : r < 45 ? 'orta' : 'yuksek';
}
const anvilCost = (id, u) => (u < 3 ? ANVIL_TIER[anvilTier(id)][u] : ANVIL_TOP[u - 3]);
let askSalv = null;
export function openAnvil(w) {
  if (S.level('uretim') < STATION_LVL.ors) { UI.feed(`Örs, Üretim ${STATION_LVL.ors} olunca açılır. (Üretim seviyen: ${S.level('uretim')})`); return; }
  UI.openPanel('Örs', (body) => {
    const render = () => {
      body.innerHTML = '';
      body.appendChild(UI.el('p', 'muted', 'Kuşandığın bir eşyayı yükselt. +1, +2, +3: Taş/Demir eşya Demir Külçesi, Kristal/Kor eşya Altın Külçesi ve Saf Kristal, Bonkit ve üstü Yıldız Demiri ister. +4 Usta Damgası da ister, +5 (Kadim işçiliği) Kadim Öz ister. Her artı %8 güç verir. Artı o eşyanın kendisinde kalır. Yükseltme asla başarısız olmaz.'));
      const slots = SLOTS.filter(([k]) => S.save.equip[k] && ['silah', 'kask', 'gogus', 'bot', 'kazma'].includes(k));
      if (!slots.length) body.appendChild(UI.el('p', '', 'Kuşanılmış silah, zırh ya da kazma yok.'));
      for (const [k, label] of slots) {
        const id = S.save.equip[k];
        const it = ITEMS[id];
        const u = S.upg(id);
        const row = UI.el('div', 'shop-row');
        row.appendChild(UI.icon(it.icon));
        const nm = UI.el('div', 'shop-nm', `${label}: ${it.name}${u ? ` +${u}` : ''}`);
        nm.style.color = RARITY[it.rarity].color;
        row.appendChild(nm);
        if (u >= ANVIL_MAX) { row.appendChild(UI.el('div', 'muted', 'En üst seviye')); list(row); continue; }
        const cost = anvilCost(id, u);
        const ok = cost.every(([m, n]) => S.countItem(m) >= n);
        const b = UI.button(`+${u + 1}: ${cost.map(([m, n]) => `${ITEMS[m].name} ×${n}`).join(', ')}`, () => {
          if (!cost.every(([m, n]) => S.countItem(m) >= n)) return;
          for (const [m, n] of cost) S.removeItem(m, n);
          S.save.equ[k] = u + 1; // B4: artis bu esyanin kendisinde
          S.save.stats.bestUpg = Math.max(S.save.stats.bestUpg || 0, u + 1);
          S.changed();
          sfx('craft');
          UI.feed(`<img class="ico-inline" src="${iconUrl(it.icon)}">${UI.itemName(id)} artık +${u + 1}! (%${(u + 1) * 8} güçlü)`, 'gold');
          if (w && w.player) { w.player.setFlipX(false); w.player.play({ key: 'c_punch', timeScale: 1.2 }); w.player.once('animationcomplete', () => w.idle()); }
          render();
        }, ok ? 'small primary' : 'small');
        b.disabled = !ok;
        row.appendChild(b);
        list(row);
      }
      function list(row) { body.appendChild(row); }
      // 0.13.5 Parcalama: cantadaki uretilmis eski esya bozulur, malzemesinin yarisi geri gelir
      body.appendChild(UI.el('h3', '', 'Parçala'));
      body.appendChild(UI.el('p', 'muted', 'Çantandaki eski bir silahı, zırhı ya da kazmayı boz: üretiminde kullanılan malzemelerin yarısı geri gelir. Glemonlardan düşen eşyalar bölgesinin temel malzemesini verir. Kaliteli ve artılı olanlar listede en sonda.'));
      const salv = [];
      S.save.bag.forEach((sl, i) => {
        if (!sl) return;
        const r = RECIPES.find((x) => x.out === sl.id && x.station === 'masa');
        if (ITEMS[sl.id].legend || ITEMS[sl.id].bound || !['silah', 'kask', 'gogus', 'bot', 'kazma', 'tilsim'].includes(ITEMS[sl.id].kind)) return;
        // D7 (1.0.18): tarifi olmayan (dusen) esya bolgenin temel malzemesini verir
        if (!r) { const z = DROP_ZONE[sl.id]; if (!z) return; salv.push({ i, sl, r: null, drop: [[ZONE_BASE[z], ITEMS[sl.id].rarity === 'siradan' ? 1 : 2]] }); return; }
        salv.push({ i, sl, r });
      });
      salv.sort((a, b) => (a.sl.x || a.sl.u ? 1 : 0) - (b.sl.x || b.sl.u ? 1 : 0));
      if (!salv.length) body.appendChild(UI.el('p', '', 'Çantanda parçalanacak üretilmiş eşya yok.'));
      const back = (r) => {
        const out = Object.entries(r.mats).map(([m, k]) => [m, Math.floor(k / 2)]).filter(([, k]) => k > 0);
        if (!out.length) { const [m] = Object.entries(r.mats).sort((a, b) => b[1] - a[1])[0]; out.push([m, 1]); }
        return out;
      };
      for (const { i, sl, r, drop } of salv.slice(0, 8)) {
        const it = ITEMS[sl.id];
        const row = UI.el('div', 'shop-row');
        row.appendChild(UI.icon(it.icon));
        const nm = UI.el('div', 'shop-nm', `${it.name}${sl.u ? ` +${sl.u}` : ''}${sl.x ? ` (${RARITY[sl.x.q].name})` : ''}`);
        nm.style.color = RARITY[S.rarityOf(sl.id, sl.x)].color;
        row.appendChild(nm);
        const out = drop || back(r);
        const b = UI.button(askSalv === sl ? `Emin misin? +${sl.u} kaybolur` : `Parçala: ${out.map(([m, k]) => `${ITEMS[m].name} ×${k}`).join(', ')}`, () => {
          if (S.save.bag[i] !== sl) return;
          // B4: artili esyada once onay
          if (sl.u && askSalv !== sl) { askSalv = sl; render(); return; }
          askSalv = null;
          S.save.bag[i] = null;
          for (const [m, k] of out) { const left = S.addItem(m, k); if (left) S.addItem(m, left, 'depo'); }
          S.save.stats.salvaged = (S.save.stats.salvaged || 0) + 1;
          S.changed();
          sfx('craft');
          UI.feed(`<img class="ico-inline" src="${iconUrl(it.icon)}">${it.name} parçalandı: ${out.map(([m, k]) => `${ITEMS[m].name} ×${k}`).join(', ')} geri geldi.`);
          if (w && w.player) { w.player.setFlipX(false); w.player.play({ key: 'c_punch', timeScale: 1.2 }); w.player.once('animationcomplete', () => w.idle()); }
          render();
        }, 'small blue');
        row.appendChild(b);
        body.appendChild(row);
      }
      // D7 (1.0.18): kalite yeniden cevirme (gec oyun para harcama yeri)
      const qslots = SLOTS.filter(([k]) => S.save.equip[k] && S.save.eqx[k] && REROLL_PRICE[S.save.eqx[k].q]);
      if (qslots.length) {
        body.appendChild(UI.el('h3', '', 'Kaliteyi yeniden çevir'));
        body.appendChild(UI.el('p', 'muted', `Kuşandığın Nadir ya da Epik kaliteli eşyanın ek özelliklerini yeniden çevir. Kalite aynı kalır, özellikler değişir.`));
        for (const [k, label] of qslots) {
          const id = S.save.equip[k]; const x = S.save.eqx[k]; const price = REROLL_PRICE[x.q];
          const row = UI.el('div', 'shop-row');
          row.appendChild(UI.icon(ITEMS[id].icon));
          const nm = UI.el('div', 'shop-nm');
          nm.innerHTML = `<b>${label}: ${UI.escapeHtml(ITEMS[id].name)}</b><br><span class="muted">${x.a.map(([a, v]) => AFFIX[a].n(v)).join(' · ')}</span>`;
          row.appendChild(nm);
          const b = UI.button(`${price}`, () => {
            if (S.save.gold < price) { sfx('weak'); return; }
            const nx = S.affixRoll(id, x.q);
            S.save.gold -= price;
            S.save.eqx[k] = nx;
            S.changed(); sfx('craft');
            UI.feed(`${UI.itemName(id)} yeniden çevrildi: ${nx.a.map(([a, v]) => AFFIX[a].n(v)).join(' · ')}`, 'epic');
            render();
          }, 'small purple');
          b.prepend(Object.assign(document.createElement('img'), { className: 'ico-inline', src: iconUrl('cimen') }));
          b.disabled = S.save.gold < price;
          row.appendChild(b);
          body.appendChild(row);
        }
      }
      // 0.10 kazma ozelligi: ayni anda bir tane (yenisi eskisinin yerine gecer)
      body.appendChild(UI.el('h3', '', 'Kazma özelliği'));
      body.appendChild(UI.el('p', 'muted', `Kazmana bir özellik işle. Aynı anda bir tane olur; yenisini işlersen eskisi gider. Şu an: ${S.save.ench ? ENCH[S.save.ench].name : 'yok'}`));
      for (const [k, e] of Object.entries(ENCH)) {
        const row = UI.el('div', 'shop-row');
        row.appendChild(UI.icon('kazma_demir'));
        const nm = UI.el('div', 'shop-nm');
        nm.innerHTML = `<b>${e.name}</b>${S.save.ench === k ? ' ✓' : ''}<br><span class="muted">${e.desc}</span>`;
        row.appendChild(nm);
        const ok = S.save.ench !== k && e.cost.every(([m, n]) => S.countItem(m) >= n);
        const b = UI.button(S.save.ench === k ? 'İşli' : e.cost.map(([m, n]) => `${ITEMS[m].name} ×${n}`).join(', '), () => {
          if (S.save.ench === k || !e.cost.every(([m, n]) => S.countItem(m) >= n)) return;
          for (const [m, n] of e.cost) S.removeItem(m, n);
          S.save.ench = k;
          S.changed();
          sfx('craft');
          UI.feed(`Kazmana <b>${e.name}</b> işlendi! ${e.desc}`, 'gold');
          render();
        }, ok ? 'small primary' : 'small');
        b.disabled = !ok;
        row.appendChild(b);
        body.appendChild(row);
      }
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ profil karti
function ago(t) {
  const m = Math.floor((gNow() - t) / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export function openProfile(w) {
  // 1.0.16 (Eren): sade profil. Solda kart + beceri seviyeleri, sagda kategorili istatistik kutulari, dusus gunlugu filtre simgesiyle
  let logFilter = 'hepsi';
  let filterOpen = false;
  const FILTERS = [['hepsi', 'Hepsi'], ['nadir', 'Nadir+'], ['epik', 'Epik+'], ['ozel', 'Özel anlar']];
  const SHORT = { madencilik: 'Maden', balikcilik: 'Balık', bag: 'Bağ' };
  UI.openPanel('Profil', (body) => {
    const render = () => {
      body.innerHTML = '';
      const pr = UI.el('div', 'profile');
      const card = UI.el('div', 'card');
      card.appendChild(UI.el('div', 'nm', S.save.char));
      const tt = titleOf();
      if (tt) card.appendChild(UI.el('div', 'title-tag', `“${tt.n}”`));
      const pv = gearPreview('idle/0');
      const pb = S.save.equip.pelerin && gearPreview('b_idlesway/0');
      if (pv) {
        const pics = UI.el('div', 'card-pics');
        pv.className = 'gear-preview';
        pics.appendChild(pv);
        if (pb) { pb.className = 'gear-preview'; pics.appendChild(pb); }
        card.appendChild(pics);
      } else card.appendChild(UI.domSprite(`assets/chars/${S.save.char}/front/idle.png`, w.charMeta['front/idle'], 1.3));
      const gear = UI.el('div', 'gear');
      for (const [slot] of SLOTS) {
        const id = S.save.equip[slot];
        if (id) gear.appendChild(UI.icon(ITEMS[id].icon, ''));
      }
      card.appendChild(gear);
      // beceri seviyeleri, karakterin altinda
      card.appendChild(UI.el('div', 'pf-sub', `Beceriler · Toplam ${S.totalLevel()}`));
      const sg = UI.el('div', 'pf-skills');
      for (const sk of SKILLS) {
        if (sk.soon) continue;
        const c = UI.el('div', 'pf-sk');
        c.appendChild(UI.el('span', 'n', SHORT[sk.key] || sk.name));
        c.appendChild(UI.el('span', 'v' + (S.level(sk.key) >= 99 ? ' max' : ''), String(S.level(sk.key))));
        sg.appendChild(c);
      }
      card.appendChild(sg);
      pr.appendChild(card);

      const info = UI.el('div', 'info');
      const st = S.save.stats;
      const kule = S.save.kule || {};
      const box = (title, items) => {
        const bx = UI.el('div', 'pf-box');
        bx.appendChild(UI.el('div', 'pf-h', title));
        const g = UI.el('div', 'pf-grid');
        for (const [k, v] of items) {
          const c = UI.el('div', 'pf-stat');
          c.appendChild(UI.el('div', 'v', String(v)));
          c.appendChild(UI.el('div', 'k', k));
          g.appendChild(c);
        }
        bx.appendChild(g);
        return bx;
      };
      const boxes = UI.el('div', 'pf-boxes');
      boxes.appendChild(box('Savaş', [
        ['Keşif en derin', `Kat ${st.deepest || 0}`],
        ['Zindan rekoru', `Kat ${st.zindanBest || 0}`],
        ['Kule (en iyi)', `Kat ${kule.all || 0}`],
        ['Yenilen Glemon', st.kills],
        ['Patron', st.bossKills],
        ['Bayılma', st.deaths],
      ]));
      boxes.appendChild(box('Koleksiyon', [
        ['Albüm', `%${Math.round((Object.keys(S.save.album.seen).length / Object.keys(GLEMONS).length) * 100)}`],
        ['Parlak', st.shiny],
        ['Evcil', S.save.pets.length],
        ['Başarım', `${achCount()}/${ACH_TOTAL}`],
      ]));
      boxes.appendChild(box('Ev', [
        ['Ev Puanı', S.baseScore()],
        [CURRENCY, S.save.gold],
        ['Oyun süresi', `${(st.playMs / 3600000).toFixed(1)} sa`],
      ]));
      info.appendChild(boxes);
      const prow = UI.el('div', 'pf-btns');
      prow.appendChild(UI.button(`★ Başarımlar · ${achPoints()} puan`, () => openAchievements(w), 'small primary'));
      prow.appendChild(UI.button('Unvan seç', () => openTitles(w), 'small purple'));
      prow.appendChild(UI.button('Albüm', () => openAlbum(w), 'small blue'));
      info.appendChild(prow);

      // dusus gunlugu: suzgecler filtre simgesinin altinda
      const lh = UI.el('div', 'log-head');
      lh.appendChild(UI.el('h3', '', 'Düşüş günlüğü'));
      const fb = UI.button('', () => { filterOpen = !filterOpen; render(); }, 'tiny pf-filter' + (logFilter !== 'hepsi' ? ' on' : ''));
      fb.title = 'Süz';
      fb.appendChild(UI.icon('ui_filtre', 'ico'));
      fb.appendChild(UI.el('span', '', FILTERS.find((f) => f[0] === logFilter)[1]));
      lh.appendChild(fb);
      if (filterOpen) {
        const menu = UI.el('div', 'pf-fmenu');
        for (const [k, label] of FILTERS) menu.appendChild(UI.button(label, () => { logFilter = k; filterOpen = false; render(); }, logFilter === k ? 'tiny primary' : 'tiny'));
        lh.appendChild(menu);
      }
      info.appendChild(lh);
      const ul = UI.el('ul', 'droplog');
      const rank = { siradan: 0, nadir: 1, epik: 2, efsanevi: 3 };
      const log = S.save.droplog.filter((d) => logFilter === 'hepsi' || (logFilter === 'ozel' ? !d.item : d.item && rank[d.rarity] >= (logFilter === 'nadir' ? 1 : 2))).slice(0, 30);
      if (!log.length) ul.appendChild(UI.el('li', 'muted', logFilter === 'hepsi' ? 'Henüz nadir bir şey düşmedi. Kasmaya devam!' : 'Bu süzgece uyan kayıt yok.'));
      for (const d of log) {
        const li = UI.el('li');
        const when = `<span class="when">${ago(d.t)}</span>`;
        if (d.item && ITEMS[d.item]) li.innerHTML = `${when}${UI.escapeHtml(d.from)} ${UI.itemName(d.item)}`;
        else li.innerHTML = `${when}<span style="color:#ffd04d">✦ ${UI.escapeHtml(d.from)} ${UI.escapeHtml(d.note || '')}</span>`;
        ul.appendChild(li);
      }
      info.appendChild(ul);
      pr.appendChild(info);
      body.appendChild(pr);
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ harita
const BONUS_ON = false; // B12: arkadas sistemi gelince true
function bonusInfo(w, z, ok) {
  UI.choice(`${z.name} · Bonus Patron`, ok
    ? 'Bu mağarada bölgenin bonus patronu yaşıyor. En az 2 oyuncuyla girilir (en fazla 3 oyuncu, her biri 2 Glemon). Patron takımla güçlenir ama takım daha hızlı güçlenir; birlikte girmek her zaman daha kolay. Arkadaş sistemi gelince açılacak.'
    : `Bonus mağarası, ${GLEMONS[z.boss].name} yenilince açılır. En az 2 oyuncu gerekir.`, [{ label: 'Haritaya dön', cls: 'primary', onClick: () => openMap(w) }]);
}
export function openMap(w) {
  if (!w.home()) return;
  UI.openPanel('Keşif', (body) => {
    const deepest = S.save.stats.deepest || 0;
    const kills = S.save.stats.glemons || {};
    if (S.kadimOpen()) { // 1.0 oyun sonrasi Kadim zorluk
      const on = S.save.kadimMode;
      const kr = UI.el('div', 'zone kadim' + (on ? ' on' : ''));
      const kl = UI.el('div');
      kl.appendChild(UI.el('div', 'zn', `Kadim zorluk: ${on ? 'AÇIK' : 'kapalı'}`));
      kl.appendChild(UI.el('div', 'zf', `Glemonlar can ×${KADIM.hp}, saldırı ×${KADIM.atk}. XP ×${KADIM.xp}, eşya ×${KADIM.drop}. Kadim Öz düşer (patron her zaman 2).`));
      kr.appendChild(kl);
      const kb = UI.el('div', 'zb');
      kb.appendChild(UI.button(on ? 'Kapat' : 'Aç', () => { S.save.kadimMode = !on; S.changed(); openMap(w); }, on ? 'small' : 'small purple'));
      kr.appendChild(kb);
      body.appendChild(kr);
    }
    // 1.0.8 (Eren): harita yok; her biyom Eren'in banner'li yatay dugmesi, yumusakca kayarak gelir
    const list = UI.el('div', 'zlist');
    body.appendChild(list);
    ZONES.forEach((z, zi) => {
      const opened = z.open && (!z.after || kills[z.after] > 0);
      const atkOk = S.atk() >= z.atk;
      const row = UI.el('div', 'zone zbanner' + (opened ? '' : ' locked'));
      row.style.backgroundImage = `url(assets/banner/${z.key}.jpg)`;
      row.style.animationDelay = `${zi * 70}ms`;
      const left = UI.el('div', 'zl');
      left.appendChild(UI.el('div', 'zn', (kills[z.boss] > 0 ? '✓ ' : opened ? '' : '🔒 ') + z.name));
      let info;
      if (!z.open) info = `Kat ${z.floors[0]}–${z.floors[1]} · ileride açılacak`;
      else if (!opened) info = `Kat ${z.floors[0]}–${z.floors[1]} · Önce ${GLEMONS[z.after].name}'ı yen`;
      else info = `Kat ${z.floors[0]}–${z.floors[1]} · En derin: ${deepest >= z.floors[0] ? Math.min(deepest, z.floors[1]) : '-'} · Giriş gücü ${z.atk}${atkOk ? '' : ` (sende ${S.atk()})`}`;
      left.appendChild(UI.el('div', 'zf', info));
      if (opened && z.hazard) left.appendChild(UI.el('div', 'zf', z.hazard));
      row.appendChild(left);
      const btns = UI.el('div', 'zb');
      if (opened) {
        const [a] = z.floors;
        for (const f of [a, a + 4, a + 9]) {
          const b = UI.button(`Kat ${f}`, () => w.prepDungeon(f), f === a ? 'primary small' : 'small');
          b.disabled = (f > a && deepest < f) || !atkOk;
          if (!atkOk) b.title = `Saldırı gücün en az ${z.atk} olmalı`;
          else if (b.disabled) b.title = `Önce Kat ${f}'e ulaş`;
          btns.appendChild(b);
        }
        // 1.0.22 (Eren): patron kontrol noktasi; patrona bir kez ulasinca dogrudan patron odasindan baslanir
        if ((S.save.bossCp || {})[z.key] || deepest >= z.floors[1]) {
          const pb = UI.button('Patron', () => w.prepDungeon(z.floors[1], { boss: true }), 'small purple');
          pb.disabled = !atkOk;
          btns.appendChild(pb);
        }
        // B12 (1.0.17, Eren karari): arkadas sistemi rafta, bonus patron dugmesi o donene kadar gizli
        if (BONUS_ON && z.key !== 'orman') { // bonus patron (Orman haric; onu Eren anlatacak)
          const ok = kills[z.boss] > 0;
          const bb = UI.button(ok ? 'Bonus' : '🔒 Bonus', () => bonusInfo(w, z, ok), 'small purple');
          if (!ok) bb.classList.add('locked');
          btns.appendChild(bb);
        }
      }
      row.appendChild(btns);
      list.appendChild(row);
    });
    body.appendChild(UI.el('p', 'muted', 'Her bölgede 5. katta ara patron, 10. katta bölge patronu var. 5 ve 10. katlarda kısayol açılır. Patrona bir kez ulaşınca "Patron" düğmesiyle doğrudan patrondan başlarsın.'));
  }, { wide: true });
}

// ------------------------------------------------------------ Ahir (0.4, 0.12 Yasayan Ahir)
// Evcil Glemonlar: yanina al (Bag 50'de iki tane), huy, pasif, bag kalbi, sevdigi yemek, aksesuar,
// gunluk malzeme, ciftlestirme ve yumurtalar.
function petLine(p) {
  const st = S.petStats(p);
  return `Sv. ${p.lvl} · ${STAGES[p.stage]} · Can ${st.maxHp} · Saldırı ${Math.round(st.atk)} · Hız ${st.spd}`;
}
function fmtMs(ms) {
  const m = Math.ceil(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`;
}
function collectAllRanch(w) {
  const got = {};
  for (const p of S.save.pets) {
    const r = PETS.collectRanch(p);
    if (r) got[r.id] = (got[r.id] || 0) + r.n;
  }
  for (const [id, n] of Object.entries(got)) w.giveDrop(id, n, 'Ahırdan', true);
  if (!Object.keys(got).length) UI.feed('Henüz hazır malzeme yok.');
  S.changed();
}

export function openAhir(w, tab = 'glemon') {
  let sel = S.save.pet || (S.save.pets[0] && S.save.pets[0].id) || null;
  let confirm = false;
  let pickA = null; let pickB = null;
  UI.openPanel(`Ahır · ${S.save.pets.length}/${S.ahirSize()}`, (body) => {
    const render = () => {
      body.innerHTML = '';
      const top = UI.el('div', 'choice-row');
      for (const [k, label] of [['glemon', 'Glemonlar'], ['cift', 'Çiftleştir'], ['yumurta', `Yumurtalar (${S.save.eggs.length})`]]) {
        top.appendChild(UI.button(label, () => { tab = k; confirm = false; render(); }, tab === k ? 'primary small' : 'small'));
      }
      const rc = PETS.readyCount();
      if (rc) top.appendChild(UI.button(`Malzemeleri topla (${rc})`, () => { collectAllRanch(w); render(); }, 'green small'));
      top.appendChild(UI.button('Yem Tezgâhı', () => openStation(w, 'yem'), 'small'));
      top.appendChild(UI.button('Albüm', () => openAlbum(w), 'small blue'));
      body.appendChild(top);
      if (tab === 'cift') { renderBreed(); return; }
      if (tab === 'yumurta') { renderEggs(); return; }
      if (!S.save.pets.length) {
        body.appendChild(UI.el('p', 'choice-text', 'Ahırın boş. Keşifte ya da Zindanda bir Glemon\'un canı %25\'in altına inince savaşta "Yem ver" ile evcilleştirebilirsin.'));
        body.appendChild(UI.el('p', 'muted', 'Her bölgenin yemi farklı: Orman için Orman Turtası (Böğürtlen + Şifalı ot). Yemleri Yem Tezgâhı\'nda yaparsın, Hancı Lale de Orman Turtası satar. Nadir ve Epik Glemonlar özel yem ister ve Glemon Bağı becerisi gerektirir.'));
        return;
      }
      const lay = UI.el('div', 'ahir');
      const grid = UI.el('div', 'pet-grid');
      for (const p of S.save.pets) {
        const c = UI.el('div', 'pet-card' + (p.id === sel ? ' sel' : '') + (p.id === S.save.pet ? ' active' : '') + (p.id === S.save.pet2 ? ' active2' : ''));
        c.appendChild(UI.glemonImg(w.gmeta, p.key, p.stage, p.shiny, { w: 34, h: 30 }));
        const mark = p.id === S.save.pet ? '★ ' : p.id === S.save.pet2 && S.level('bag') >= TEAM.bag2 ? '☆ ' : '';
        c.appendChild(UI.el('div', 'pn', `${mark}${PETS.petDisplayName(p)}`));
        c.appendChild(UI.el('div', 'muted', `Sv. ${p.lvl} `));
        c.appendChild(UI.el('div', 'hearts', PETS.heartsText(p)));
        if (PETS.ranchReady(p)) c.appendChild(UI.el('div', 'rdy', '!'));
        c.addEventListener('click', () => { sfx('click'); sel = p.id; confirm = false; render(); });
        grid.appendChild(c);
      }
      lay.appendChild(grid);
      const p = S.save.pets.find((x) => x.id === sel);
      const box = UI.el('div', 'detail');
      if (p) renderPet(box, p);
      lay.appendChild(box);
      body.appendChild(lay);
      const two = S.level('bag') >= TEAM.bag2;
      body.appendChild(UI.el('p', 'muted', `Ahır ${S.ahirSize()} yer (İnşa seviyenle 30'a kadar büyür). ★ yanındaki Glemon${two ? ', ☆ ikinci yoldaşın' : `. Glemon Bağı ${TEAM.bag2}'de yanına 2. Glemon alırsın`}. Yanında olmayanlar arsanda dolaşır ve günde bir malzeme bırakır (!).`));
    };

    const renderPet = (box, p) => {
      const d = GLEMONS[p.key];
      const nm = UI.el('div', 'nm', PETS.petDisplayName(p));
      nm.style.color = RARITY[d.rarity].color;
      box.appendChild(nm);
      if (p.nick) box.appendChild(UI.el('div', 'muted', S.petName(p)));
      box.appendChild(UI.glemonImg(w.gmeta, p.key, p.stage, p.shiny, { w: 70, h: 56 }));
      box.appendChild(UI.el('div', 'muted', `${RARITY[d.rarity].name} · ${d.type} tipi${d.fly ? ' · uçar' : ''}`));
      const tr = TRAITS[p.huy];
      const trl = UI.el('div', '');
      if (tr) { trl.appendChild(UI.el('span', 'trait', `Huy: ${tr.name}`)); trl.appendChild(UI.el('span', 'muted', tr.desc)); }
      box.appendChild(trl);
      box.appendChild(UI.el('div', '', petLine(p)));
      const ps = passiveOf(p.key);
      if (ps) box.appendChild(UI.el('div', 'passive', `Pasif: ${ps.name} · ${ps.desc}`));
      if (d.special) box.appendChild(UI.el('div', 'passive', `★ Aktif: ${d.special.name} (savaşta 3 sırada bir)`));
      // bag kalbi
      const h = S.hearts(p);
      const hb = UI.el('div', '');
      hb.appendChild(UI.el('span', 'hearts', PETS.heartsText(p)));
      hb.appendChild(UI.el('span', 'muted', h >= BOND.max ? ' Kalp Bağı açık! (MÜKEMMEL vuruştan sonra ★ yeteneği)' : ` ${(p.kalp || 0) % BOND.per}/${BOND.per} · her kalp statlar +%2`));
      box.appendChild(hb);
      const fav = favOf(p.key);
      const favN = S.countItem(fav);
      const fr = UI.el('div', 'row');
      const canFav = PETS.canFeedFav(p);
      fr.appendChild(UI.el('span', 'muted', `Sevdiği yemek: ${ITEMS[fav].name} (${favN})`));
      const fb = UI.button(canFav ? 'Yedir' : 'Bugün yedi', () => {
        const r = PETS.feedPet(p, fav);
        UI.feed(r.ok ? `<span style="color:#ff9ab4">♥ ${PETS.petDisplayName(p)} ${ITEMS[fav].name} yedi: ${r.msg}</span>` : r.msg);
        if (r.ok) { sfx(r.up ? 'levelup' : 'heal'); S.changed(); }
        render();
      }, 'small green');
      fb.disabled = !favN || !canFav || h >= BOND.max;
      fr.appendChild(fb);
      if (S.countItem('glemon_sekeri')) {
        fr.appendChild(UI.button(`Şeker ver (${S.countItem('glemon_sekeri')})`, () => {
          const r = PETS.feedPet(p, 'glemon_sekeri');
          UI.feed(r.ok ? `<span style="color:#ff9ab4">♥ ${PETS.petDisplayName(p)} şekeri çok sevdi: ${r.msg}</span>` : r.msg);
          if (r.ok) { sfx('heal'); S.changed(); }
          render();
        }, 'small'));
      }
      box.appendChild(fr);
      // aksesuar
      const ar = UI.el('div', 'row');
      ar.appendChild(UI.el('span', 'muted', `Aksesuar: ${p.acc ? ITEMS[p.acc].name + ' (' + ITEMS[p.acc].desc.split('. ').slice(1).join('. ') + ')' : 'yok'}`));
      const owned = Object.keys(ITEMS).filter((id) => ITEMS[id].kind === 'aksesuar' && S.countItem(id) > 0);
      for (const id of owned) ar.appendChild(UI.button(`Tak: ${ITEMS[id].name}`, () => { PETS.equipAcc(p, id); sfx('chest'); S.changed(); w.makeFollower(); render(); }, 'small'));
      if (p.acc) ar.appendChild(UI.button('Çıkar', () => { PETS.equipAcc(p, null); S.changed(); w.makeFollower(); render(); }, 'small'));
      if (!p.acc && !owned.length) ar.appendChild(UI.el('span', 'muted', ' · Yem Tezgâhında tasma, atkı, kurdele ve çan yapılır.'));
      box.appendChild(ar);
      // isim (5 kalp)
      if (h >= BOND.max) {
        const nr = UI.el('div', 'row');
        const inp = document.createElement('input');
        inp.type = 'text'; inp.maxLength = 12; inp.placeholder = 'Yeni isim'; inp.value = p.nick || '';
        inp.className = 'name-input';
        nr.appendChild(inp);
        nr.appendChild(UI.button('İsim ver', () => {
          const v = inp.value.replace(/[<>&"]/g, '').trim().slice(0, 12);
          p.nick = v || null; S.changed(); w.makeFollower(); sfx('chest'); render();
        }, 'small purple'));
        box.appendChild(nr);
      }
      // ahir malzemesi
      const drop = ranchDropOf(p.key);
      const isTeam = S.teamPets().some((x) => x.id === p.id);
      box.appendChild(UI.el('div', 'muted', PETS.ranchReady(p) ? `Bıraktığı: ${ITEMS[drop].name} ×${PETS.ranchAmount(p)} hazır!` : `Bıraktığı: ${ITEMS[drop].name} · ${fmtMs(PETS.ranchLeft(p))} sonra${isTeam ? ' (yanındayken de birikir)' : ''}`));
      const cap = S.petCap();
      const a = petXpFor(p.lvl); const b = petXpFor(p.lvl + 1);
      const bar = UI.el('div', 'bar xp');
      const f = UI.el('div', 'fill');
      f.style.width = p.lvl >= cap ? '100%' : `${Math.min(100, ((p.xp - a) / (b - a)) * 100)}%`;
      bar.appendChild(f);
      bar.appendChild(UI.el('span', '', p.lvl >= cap ? `Sınır: Sv. ${cap} (Bağ ${S.level('bag')})` : `${p.xp - a} / ${b - a} XP`));
      box.appendChild(bar);
      const next = p.stage < 2 ? `${STAGES[p.stage + 1]} evrimi: Sv. ${EVOLVE_AT[p.stage]}` : 'En son evrimde (Usta): yumurta bırakabilir';
      box.appendChild(UI.el('div', 'muted', `${next}. Seviye sınırı Glemon Bağı'nın yarısı (şu an ${cap}).`));
      const row = UI.el('div', 'row');
      if (p.id === S.save.pet) {
        row.appendChild(UI.button('Ahırda bırak', () => { S.save.pet = S.save.pet2 || null; S.save.pet2 = null; S.changed(); w.makeFollower(); render(); }, 'small'));
      } else if (p.id === S.save.pet2) {
        row.appendChild(UI.button('Ahırda bırak', () => { S.save.pet2 = null; S.changed(); w.makeFollower(); render(); }, 'small'));
      } else {
        row.appendChild(UI.button('Yanıma al', () => { if (S.save.pet2 === p.id) S.save.pet2 = null; S.save.pet = p.id; S.changed(); w.makeFollower(); sfx('chest'); render(); }, 'primary small'));
        if (S.level('bag') >= TEAM.bag2 && S.save.pet) {
          row.appendChild(UI.button('2. yoldaş yap', () => { S.save.pet2 = p.id; S.changed(); w.makeFollower(); sfx('chest'); render(); }, 'small blue'));
        }
      }
      row.appendChild(UI.button(confirm ? 'Emin misin?' : 'Serbest bırak', () => {
        if (!confirm) { confirm = true; render(); return; }
        S.releasePet(p.id); S.changed(); w.makeFollower(); sel = S.save.pet; confirm = false;
        UI.feed(`${PETS.petDisplayName(p)} doğaya döndü. Hoşça kal!`);
        render();
      }, 'small close'));
      box.appendChild(row);
    };

    const renderBreed = () => {
      body.appendChild(UI.el('p', 'muted', 'İki Usta Glemon (Sv. 35) aynı tipten ya da aynı bölgedense yumurta bırakır. Yavru anne babadan birinin türünü alır, %60 ihtimalle huyunu da. Parlak bir ebeveyn parlak yavru şansını artırır. Her Glemon günde bir kez.'));
      const ustas = S.save.pets.filter((p) => p.stage === 2 && !GLEMONS[p.key].egg);
      if (ustas.length < 2) { body.appendChild(UI.el('p', 'choice-text', 'En az iki Usta Glemon gerekli. Glemonların Sv. 35\'te Usta olur.')); return; }
      const grid = UI.el('div', 'pet-grid');
      for (const p of ustas) {
        const c = UI.el('div', 'pet-card' + (p.id === pickA || p.id === pickB ? ' sel' : ''));
        c.appendChild(UI.glemonImg(w.gmeta, p.key, p.stage, p.shiny, { w: 34, h: 30 }));
        c.appendChild(UI.el('div', 'pn', PETS.petDisplayName(p)));
        c.appendChild(UI.el('div', 'muted', `${GLEMONS[p.key].type}${PETS.breedReady(p) ? '' : ' · yorgun'}`));
        c.addEventListener('click', () => {
          sfx('click');
          if (pickA === p.id) pickA = null; else if (pickB === p.id) pickB = null;
          else if (!pickA) pickA = p.id; else pickB = p.id;
          render();
        });
        grid.appendChild(c);
      }
      body.appendChild(grid);
      const A = S.save.pets.find((x) => x.id === pickA); const B = S.save.pets.find((x) => x.id === pickB);
      const why = PETS.breedWhy(A, B);
      body.appendChild(UI.el('p', why ? 'muted' : 'choice-text', why || `${PETS.petDisplayName(A)} ve ${PETS.petDisplayName(B)} uyumlu!`));
      const bb = UI.button('Yumurta bırakmalarını bekle', () => {
        const r = PETS.breed(A, B);
        if (!r.ok) { UI.feed(r.msg); return; }
        sfx('levelup');
        UI.banner('Bir yumurta!', `${GLEMONS[r.egg.key].name} yumurtası sepete kondu`, 2200, 'gold');
        UI.feed(`<span style="color:#ff9ab4">♥ ${PETS.petDisplayName(A)} ve ${PETS.petDisplayName(B)} bir yumurta bıraktı! Kuluçka Yuvasına koyunca 3 saatte çatlar.</span>`, 'gold');
        pickA = pickB = null;
        S.changed();
        render();
      }, 'primary');
      bb.disabled = !!why;
      body.appendChild(bb);
    };

    const renderEggs = () => {
      body.appendChild(UI.el('p', 'muted', `Yumurta sepeti ${S.save.eggs.length}/${NEST.basket}. Yumurtalar Kuluçka Yuvasında çatlar (arsana koyduğun mobilya, aynı anda 3 yumurta).`));
      const list = UI.el('div', 'album-grid');
      for (const e of S.save.eggs) {
        const c = UI.el('div', 'album-card');
        c.appendChild(UI.icon('glemon_yumurtasi'));
        c.appendChild(UI.el('div', 'pn', `${GLEMONS[e.key].name} yumurtası`));
        c.appendChild(UI.el('div', 'muted', e.huy ? `Huy: ${TRAITS[e.huy].name}` : 'Huy: sürpriz'));
        list.appendChild(c);
      }
      if (S.save.eggs.length) body.appendChild(list);
      const n = PETS.nestReadyCount();
      if (PETS.hasNest()) body.appendChild(UI.button(`Kuluçka Yuvasını aç${n ? ` (${n} hazır!)` : ''}`, () => openNest(w), 'primary'));
      else body.appendChild(UI.el('p', 'choice-text', 'Henüz Kuluçka Yuvan yok. Üretim Masasında yap (4 Kalas, 4 Dal, 2 Yumuşak yün) ve arsana koy.'));
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ Kuluçka Yuvasi (0.12)
export function openNest(w) {
  UI.openPanel('Kuluçka Yuvası', (body) => {
    const render = () => {
      if (!body.isConnected) { clearInterval(iv); return; }
      body.innerHTML = '';
      body.appendChild(UI.el('p', 'muted', `3 yuva. Ahır yumurtaları 3 saatte, efsanevi yumurtalar ${PETS.nestNeed()} savaşta çatlar (çantada ${S.eggNeed()}).`));
      const row = UI.el('div', 'nest-row');
      S.save.nest.forEach((e, slot) => {
        const c = UI.el('div', 'nest-slot');
        if (!e) {
          c.appendChild(UI.el('div', 'pn', 'Boş yuva'));
          S.save.eggs.forEach((x, i) => c.appendChild(UI.button(`Koy: ${GLEMONS[x.key].name}`, () => { PETS.putBasketEgg(slot, i); sfx('chest'); S.changed(); render(); }, 'small')));
          S.save.bag.forEach((x, i) => { if (x && ITEMS[x.id] && ITEMS[x.id].egg) c.appendChild(UI.button(`Koy: ${ITEMS[x.id].name}`, () => { PETS.putBagEgg(slot, i); sfx('chest'); S.changed(); render(); }, 'small purple')); });
          if (!S.save.eggs.length && !S.save.bag.some((x) => x && ITEMS[x.id] && ITEMS[x.id].egg)) c.appendChild(UI.el('div', 'muted', 'Koyacak yumurta yok.'));
        } else {
          const g = GLEMONS[e.key];
          c.appendChild(UI.icon(e.legend ? ITEMS[e.item].icon : 'glemon_yumurtasi'));
          c.appendChild(UI.el('div', 'pn', e.legend ? ITEMS[e.item].name : `${g.name} yumurtası`));
          const pr = PETS.nestProgress(e);
          const bar = UI.el('div', 'bar xp'); const f = UI.el('div', 'fill'); f.style.width = `${pr * 100}%`; bar.appendChild(f);
          bar.appendChild(UI.el('span', '', pr >= 1 ? 'Hazır!' : PETS.nestLeftText(e)));
          c.appendChild(bar);
          if (pr >= 1) c.appendChild(UI.button('Çatlat!', () => {
            const r = PETS.hatch(slot);
            if (!r.ok) { UI.feed(r.msg || 'Olmadı.'); return; }
            const nm = `${r.pet.shiny ? 'Parlak ' : ''}${GLEMONS[r.pet.key].name}`;
            sfx('rare');
            UI.banner('Yumurta çatladı!', `${nm} doğdu!`, 2600, 'gold');
            UI.feed(`<span style="color:#ffd04d">★ ${nm} doğdu! Huyu: ${TRAITS[r.pet.huy].name}. Ahırına gitti.</span>`, 'gold');
            if (w.celebrate) w.celebrate();
            w.makeFollower();
            S.changed();
            render();
          }, 'green small'));
        }
        row.appendChild(c);
      });
      body.appendChild(row);
    };
    const iv = setInterval(render, 5000);
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ Albüm ve Kombo Defteri (0.4 / 0.5 / 0.12 Albüm 2.0)
const STRONG_VS = (t) => TYPE_STRONG[t] || [];
const WEAK_VS = (t) => Object.keys(TYPE_STRONG).filter((x) => (TYPE_STRONG[x] || []).includes(t));
function habitat(k) {
  const d = GLEMONS[k];
  if (d.secret) return d.secret;
  if (d.egg) return `${PETS.ZONE_LABEL[d.egg]} patronunun efsanevi yumurtasından`;
  if (d.water) return 'Balık tutarken oltaya takılır (Balıkçılık 15)';
  if (d.moon) return 'Dolunay Gecesi her bölgede';
  if (d.night) return `Sadece gece Keşifte (çoğu ${PETS.ZONE_LABEL[NIGHT_HOME[k]]})`;
  if (d.boss) return 'Bölge patronu';
  const z = PETS.homeOf(k);
  return z ? `${PETS.ZONE_LABEL[z]} (Keşif, Zindan ve madende o katmanda)` : '?';
}
function speciesPage(w, body, k, back) {
  const d = GLEMONS[k];
  const al = S.save.album;
  const seen = !!al.seen[k];
  const bar = UI.el('div', 'choice-row');
  bar.appendChild(UI.button('← Albüm', back, 'small'));
  body.appendChild(bar);
  if (!seen) {
    body.appendChild(UI.glemonImg(w.gmeta, k, 0, false, { w: 70, h: 56 }, true));
    body.appendChild(UI.el('h3', '', '???'));
    body.appendChild(UI.el('p', 'muted', d.secret ? `Gizli tür. İpucu: ${d.secret}.` : `Henüz görmedin. ${d.boss ? 'Bir bölge patronu.' : `Yaşadığı yer: ${habitat(k)}.`}`));
    return;
  }
  const nm = UI.el('h3', '', d.name);
  nm.style.color = RARITY[d.rarity].color;
  body.appendChild(nm);
  const imgs = UI.el('div', 'choice-row');
  for (let st = 0; st < (d.boss ? 1 : 3); st++) imgs.appendChild(UI.glemonImg(w.gmeta, k, st, false, { w: 56, h: 46 }));
  if (al.shiny[k]) imgs.appendChild(UI.glemonImg(w.gmeta, k, 0, true, { w: 56, h: 46 }));
  body.appendChild(imgs);
  const g = UI.el('div', 'sp-page');
  const row = (l, v) => { g.appendChild(UI.el('div', 'lbl', l)); g.appendChild(UI.el('div', '', v)); };
  row('Tür', `${RARITY[d.rarity].name} · ${d.type} tipi${d.fly ? ' · uçar' : ''}`);
  row('Yaşadığı yer', habitat(k));
  const sv = STRONG_VS(d.type); const wv = WEAK_VS(d.type);
  row('Güçlü olduğu', sv.length ? sv.join(', ') : '-');
  row('Zayıf olduğu', wv.length ? wv.join(', ') : '-');
  if (STYLE[d.type]) row('Savaş tarzı', `${STYLE_NAME[STYLE[d.type][0]]} ile çok etkili, ${STYLE_NAME[STYLE[d.type][1]]} az işler`);
  if (d.special) row('Aktif yetenek', d.special.name);
  const ps = passiveOf(k);
  if (ps) row('Pasif yetenek', `${ps.name}: ${ps.desc}`);
  if (!d.boss) row('Sevdiği yemek', ITEMS[favOf(k)].name);
  if (!d.boss && !d.egg) {
    const home = SECRET_HOME[k] || PETS.homeOf(k);
    const need = TAME.bagReq[d.rarity];
    const foods = FOODS[home];
    row('Evcilleştirme', foods ? `Glemon Bağı ${need}+ · ${d.rarity === 'siradan' || (home === 'su' && d.rarity === 'nadir') ? `${ITEMS[foods[0]].name} ya da ${ITEMS[foods[1]].name}` : ITEMS[foods[1]].name}` : 'Evcilleşmez');
  }
  if (!d.boss) row('Ahırda bıraktığı', ITEMS[ranchDropOf(k)].name);
  const dl = (al.drops || {})[k] || {};
  if (d.drops && d.drops.length) row('Düşürdükleri', d.drops.map(([id]) => (dl[id] ? ITEMS[id].name : '???')).join(', '));
  row('Durum', [al.tamed[k] ? '♥ evcilleştirdin' : 'evcil değil', al.shiny[k] ? '✦ parlağını gördün' : ''].filter(Boolean).join(' · '));
  body.appendChild(g);
  if (!d.boss && !d.egg) {
    const kills = (S.save.stats.glemons || {})[k] || 0;
    const ms = masteryOf(kills);
    body.appendChild(UI.el('h3', '', `Ustalık ${'★'.repeat(ms.lvl)}${'☆'.repeat(MASTERY.length - ms.lvl)}`));
    const mb = UI.el('div', 'mastery-bar');
    for (let i = 0; i < MASTERY.length; i++) mb.appendChild(UI.el('span', i < ms.lvl ? 'on' : ''));
    body.appendChild(mb);
    body.appendChild(UI.el('p', 'muted', `${kills} yenildi${ms.next ? ` · sonraki kademe: ${ms.next}` : ' · tamamlandı!'}. Kademeler: 50 (+%5 hasar), 250 (+%10), 1000 (+%15), 2500 (bu türün parlak çıkma şansı 2 kat).`));
  }
}

export function openAlbum(w, tab = 'glemon') {
  const keys = Object.keys(GLEMONS);
  let page = null;
  UI.openPanel('Albüm', (body) => {
    const render = () => {
      body.innerHTML = '';
      if (page) { speciesPage(w, body, page, () => { page = null; render(); }); return; }
      const al = S.save.album;
      const seen = keys.filter((k) => al.seen[k]).length;
      const tabs = UI.el('div', 'choice-row');
      tabs.appendChild(UI.button(`Glemonlar (${seen}/${keys.length})`, () => { tab = 'glemon'; render(); }, tab === 'glemon' ? 'primary small' : 'small'));
      const fc = S.save.fishing ? S.save.fishing.caught : {};
      const fishN = Object.keys(FISH).filter((k) => fc[k]).length;
      tabs.appendChild(UI.button(`Balıklar (${fishN}/${Object.keys(FISH).length})`, () => { tab = 'balik'; render(); }, tab === 'balik' ? 'primary small' : 'small'));
      tabs.appendChild(UI.button(`Kombo Defteri (${Object.keys(S.save.combos).length}/${Object.keys(COMBOS).length})`, () => { tab = 'kombo'; render(); }, tab === 'kombo' ? 'primary small' : 'small'));
      const fo = S.save.fossils || {};
      tabs.appendChild(UI.button(`Fosiller (${Object.keys(FOSSILS).filter((k) => fo[k]).length}/${Object.keys(FOSSILS).length})`, () => { tab = 'fosil'; render(); }, tab === 'fosil' ? 'primary small' : 'small'));
      body.appendChild(tabs);
      if (tab === 'fosil') {
        body.appendChild(UI.el('p', 'muted', 'Maden kuyusunda fosil bloklarından çıkanlar (8. sıradan aşağıda, Madencilik 10). Nadir olanlar derin ve şanslı kazıcılara.'));
        const grid = UI.el('div', 'album-grid');
        for (const [k, f] of Object.entries(FOSSILS)) {
          const n = fo[k] || 0;
          const c = UI.el('div', 'album-card' + (n ? '' : ' unseen'));
          const im = UI.icon(ITEMS[k].icon);
          if (!n) im.style.filter = 'brightness(0)';
          c.appendChild(im);
          const nm = UI.el('div', 'pn', n ? f.name : '???');
          if (n) nm.style.color = RARITY[ITEMS[k].rarity].color;
          c.appendChild(nm);
          c.appendChild(UI.el('div', 'muted', n ? `${n} bulundu` : f.w <= 8 ? 'çok nadir' : 'nadir'));
          grid.appendChild(c);
        }
        body.appendChild(grid);
        return;
      }
      if (tab === 'balik') {
        body.appendChild(UI.el('p', 'muted', 'Tuttuğun balıklar. Her suyun kendi balıkları var; ★ efsane balıklar çok nadirdir ve sadece elle tutulur.'));
        for (const [wk, wd] of Object.entries(WATERS)) {
          body.appendChild(UI.el('h3', '', wd.name + (wd.lava ? ' (Kor Olta)' : '')));
          const grid = UI.el('div', 'album-grid');
          for (const [k, f] of Object.entries(FISH)) {
            if (f.water !== wk) continue;
            const n = fc[k] || 0;
            const c = UI.el('div', 'album-card' + (n ? '' : ' unseen'));
            const im = UI.icon(ITEMS[k].icon, 'ico fish-ico');
            if (!n) im.style.filter = 'brightness(0)';
            c.appendChild(im);
            const nm = UI.el('div', 'pn', n ? (f.legend ? '★ ' : '') + f.name : '???');
            if (n) nm.style.color = RARITY[f.rarity].color;
            c.appendChild(nm);
            c.appendChild(UI.el('div', 'muted', n ? `${n} tutuldu` : `Balıkçılık ${f.lvl}`));
            grid.appendChild(c);
          }
          body.appendChild(grid);
        }
        return;
      }
      if (tab === 'kombo') {
        body.appendChild(UI.el('p', 'muted', 'Kombolar, durumları ve Glemon yeteneklerini doğru sırayla birleştirince olur. İlk yaptığında buraya yazılır.'));
        for (const [k, c] of Object.entries(COMBOS)) {
          const n = S.save.combos[k];
          const row = UI.el('div', 'zone' + (n ? '' : ' locked'));
          const l = UI.el('div');
          l.appendChild(UI.el('div', 'zn', n ? c.name : '???'));
          l.appendChild(UI.el('div', 'zf', n ? `${c.how} → ${c.result} · ${n} kez` : `İpucu: ${c.hint}`));
          row.appendChild(l);
          body.appendChild(row);
        }
        return;
      }
      body.appendChild(UI.el('div', 'muted', `Albüm %${Math.round((seen / keys.length) * 100)} · Evcilleştirilen tür: ${keys.filter((k) => al.tamed[k]).length} · Bir türe dokun: sayfası açılır.`));
      // 0.9: albumu doldurdukca odul (%25, %50, %75, %100)
      const pct = albumPct();
      const rw = UI.el('div', 'album-rw');
      for (const r of ALBUM_RW) {
        const got = S.save.albumRw[r.pct];
        const ok = pct >= r.pct;
        const label = `%${r.pct}: ${r.gold} ${CURRENCY}, ${r.pul} ${PUL}${r.item ? ', ' + ITEMS[r.item].name : ''}`;
        if (got) rw.appendChild(UI.el('span', 'rw-got', '✓ ' + label));
        else if (ok) rw.appendChild(UI.button('Al · ' + label, () => {
          if (S.save.albumRw[r.pct]) return;
          S.save.albumRw[r.pct] = true;
          S.addGold(r.gold); addPul(r.pul);
          if (r.item) w.giveDrop(r.item, 1, 'Albüm ödülü:');
          sfx('coin');
          UI.feed(`<span style="color:#ffd04d">★ Albüm %${r.pct} ödülü!</span>`, 'gold');
          S.changed();
          render();
        }, 'green tiny'));
        else rw.appendChild(UI.el('span', 'rw-lock', label));
      }
      body.appendChild(rw);
      // 0.12 bolge tamamlama: bolgenin butun turlerini evcillestir
      body.appendChild(UI.el('h3', '', 'Bölge tamamlama'));
      const zr = UI.el('div', 'zone-rw');
      for (const z of PETS.ZONE_KEYS) {
        const t = PETS.zoneTamed(z);
        const label = `${PETS.ZONE_LABEL[z]} ${t.n}/${t.of}`;
        if (S.save.zoneDone[z]) zr.appendChild(UI.el('span', 'rw-got', `✓ ${label}`));
        else if (t.n >= t.of) zr.appendChild(UI.button(`Al · ${label}`, () => {
          S.save.zoneDone[z] = true;
          addPul(ZONE_DONE.pul);
          sfx('levelup');
          UI.banner(`${PETS.ZONE_LABEL[z]} tamam!`, 'O bölgede hasar ve XP +%5', 2400, 'gold');
          UI.feed(`<span style="color:#ffd04d">★ ${PETS.ZONE_LABEL[z]} bölgesinin bütün Glemonlarını evcilleştirdin! O bölgede kalıcı +%5 hasar ve +%5 XP, ${ZONE_DONE.pul} ${PUL}.</span>`, 'gold');
          S.changed();
          render();
        }, 'green tiny'));
        else zr.appendChild(UI.el('span', 'rw-lock', label));
      }
      body.appendChild(zr);
      body.appendChild(UI.el('p', 'muted', 'Bir bölgenin bütün türlerini evcilleştirince o bölgede kalıcı +%5 hasar ve +%5 XP.'));
      const groups = ZONES.filter((z) => z.open).map((z) => [z.name, [...ZONE_SPAWNS[z.key].map(([x]) => x), z.boss]]);
      groups.push(['Efsaneviler (yumurtadan)', Object.values(EGGS)]);
      groups.push(['Su Glemonları (oltaya takılır)', WATER_GLEMONS.map(([k]) => k)]);
      groups.push(['Dolunay Gecesi', ['ay_tavsani']]);
      groups.push(['Gece Glemonları (sadece gece Keşifte)', Object.keys(NIGHT_HOME)]);
      groups.push(['Gizli Türler', Object.keys(SECRET_HOME)]);
      for (const [z, list] of groups) {
        body.appendChild(UI.el('h3', '', z));
        const grid = UI.el('div', 'album-grid');
        for (const k of list) {
          const d = GLEMONS[k];
          const c = UI.el('div', 'album-card' + (al.seen[k] ? '' : ' unseen'));
          c.appendChild(UI.glemonImg(w.gmeta, k, 0, false, { w: 30, h: 26 }, !al.seen[k]));
          const nm = UI.el('div', 'pn', al.seen[k] ? d.name : '???');
          if (al.seen[k]) nm.style.color = RARITY[d.rarity].color;
          c.appendChild(nm);
          const marks = [];
          if (al.tamed[k]) marks.push('♥');
          if (al.shiny[k]) marks.push('✦');
          const kills = (S.save.stats.glemons || {})[k] || 0;
          c.appendChild(UI.el('div', 'muted', al.seen[k] ? (d.egg ? marks.join(' ') || 'Efsanevi' : `${marks.join(' ')} ${kills} yenildi`) : d.secret ? 'Gizli' : d.boss ? 'Patron' : d.egg ? 'Yumurta' : RARITY[d.rarity].name));
          const ms = masteryOf(kills);
          if (al.seen[k] && !d.egg && !d.boss) {
            const me = UI.el('div', 'muted', ms.lvl ? `${'★'.repeat(ms.lvl)}` : `Ustalık: ${kills}/${ms.next}`);
            if (ms.lvl) me.style.color = '#ffd04d';
            c.appendChild(me);
          }
          c.addEventListener('click', () => { sfx('click'); page = k; render(); body.scrollTop = 0; });
          grid.appendChild(c);
        }
        body.appendChild(grid);
      }
      body.appendChild(UI.el('p', 'muted', '♥ evcilleştirdin · ✦ parlak versiyonunu gördün · ★ ustalık kademesi (sayfasında ayrıntı)'));
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ uretim istasyonlari (0.2)
// Firin: bir is (tarif + adet), her biri FURNACE_MS surer, oyun kapaliyken de ilerler.
// 0.8.5: Sicak Firin yetenegi %30 hizli
const fms = () => FURNACE_BASE * S.perk('sicak_firin', 0.7, 1);
export function furnaceState() {
  const f = S.save.furnace;
  if (!f || !f.rid || f.n <= 0) return { working: false, ready: 0, left: 0, out: null };
  const r = RECIPES[f.rid];
  const done = Math.min(f.n, Math.floor((gNow() - f.t0) / fms()));
  return { working: done < f.n, ready: done, left: f.n - done, out: r.out, recipe: r, next: f.t0 + (done + 1) * fms() };
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
    f.t0 += got * fms();
    if (f.n <= 0) { f.rid = null; f.n = 0; }
    S.save.stats.crafted += got;
    sfx('smelt');
    const xp = fs.recipe.xp * got;
    UI.feed(`<img class="ico-inline" src="${iconUrl(ITEMS[fs.out].icon)}">Fırından ${UI.itemName(fs.out)} ×${got} aldın. +${xp} Üretim XP`);
    const ups = S.addXp({ uretim: xp });
    S.changed();
    w.levelUps(ups);
  }
  if (got < fs.ready) UI.feed('Çanta dolu! Fırındakilerin hepsini alamadın.');
  return got;
}

const recipeId = (r) => RECIPES.indexOf(r);
const furnaceIdle = (f) => f.rid === null || f.rid === undefined || f.n <= 0;
// 0.10.5: bazi mobilya tarifleri Us Puani ile acilir (en yuksek puana gore)
const usLocked = (r) => r.us && (S.save.plot.bestScore || 0) < r.us;
const unlocked = (r) => !!S.save.seen[Object.keys(r.mats)[0]] && !usLocked(r);
const lvOf = (r) => S.level(r.station === 'mutfak' ? 'ascilik' : 'uretim');
const canMake = (r, n = 1) => Object.entries(r.mats).every(([id, k]) => S.countItem(id) >= k * n);
function maxMake(r) {
  return Math.min(...Object.entries(r.mats).map(([id, k]) => Math.floor(S.countItem(id) / k)));
}

export function openStation(w, station) {
  const st = STATIONS[station];
  const lk = STATION_LVL[station];
  if (lk && S.level('uretim') < lk && !S.save.flags.stOld) { UI.feed(`${st.name}, Üretim ${lk} olunca açılır. (Üretim seviyen: ${S.level('uretim')})`); return; }
  const list = RECIPES.filter((r) => r.station === station);
  if (station === 'mutfak') list.sort((a, b) => a.lvl - b.lvl);
  let sel = list.find((r) => unlocked(r) && lvOf(r) >= r.lvl && canMake(r)) || list.find(unlocked) || null;
  let timer = null;
  UI.openPanel(st.name, (body) => {
    const render = () => {
      body.innerHTML = '';
      body.appendChild(UI.el('div', 'muted', `${st.desc} · ${station === 'mutfak' ? 'Aşçılık' : 'Üretim'} seviyen: ${S.level(station === 'mutfak' ? 'ascilik' : 'uretim')}`));
      if (station === 'firin') body.appendChild(furnaceBox(w, render));
      if (station === 'masa') { const ar = UI.el('div', 'choice-row'); const ok = S.level('uretim') >= STATION_LVL.ors; const b = UI.button(ok ? 'Örs: eşya yükselt' : `Örs 🔒 Üretim ${STATION_LVL.ors}`, () => openAnvil(w), 'small purple'); b.disabled = !ok; ar.appendChild(b); body.appendChild(ar); }
      const lay = UI.el('div', 'craft');
      const ul = UI.el('div', 'recipes');
      // M3 (1.0.19): kilitli tariflerden sadece seviyesi yeten ilk 3'u ipucuyla; gerisi tek satir
      let hints = 0; let hidden = 0;
      for (const r of list) {
        const it = ITEMS[r.out];
        const row = UI.el('div', 'recipe');
        if (!unlocked(r)) {
          if (hints >= 3 || lvOf(r) < r.lvl) { hidden++; continue; }
          hints++;
          row.classList.add('locked');
          row.appendChild(UI.el('span', 'q', '?'));
          row.appendChild(UI.el('span', 'nm', usLocked(r) ? `Ev Puanı ${r.us} olunca` : `${ITEMS[Object.keys(r.mats)[0]].name} bulunca açılır`));
        } else {
          row.appendChild(UI.icon(it.icon));
          const nm = UI.el('span', 'nm', it.name);
          nm.style.color = RARITY[it.rarity].color;
          row.appendChild(nm);
          if (lvOf(r) < r.lvl) { row.classList.add('lvl'); row.appendChild(UI.el('span', 'lv', `Sv. ${r.lvl}`)); }
          else if (canMake(r)) row.appendChild(UI.el('span', 'ok', '●'));
        }
        if (sel === r) row.classList.add('sel');
        row.addEventListener('click', () => { sfx('click'); sel = r; render(); });
        ul.appendChild(row);
      }
      if (hidden) ul.appendChild(UI.el('div', 'muted recipe-more', `+${hidden} gizli tarif (malzeme buldukça ve seviye atladıkça açılır)`));
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
  const secs = fs.working ? Math.max(1, Math.ceil((fs.next - gNow()) / 1000)) : 0;
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
    box.appendChild(UI.el('div', 'muted', usLocked(r) ? `Bu tarif, arsanın Ev Puanı ${r.us} olunca açılır. Arsana blok koydukça puan artar.` : `Bu tarif, ${ITEMS[Object.keys(r.mats)[0]].name} ilk kez bulunca açılır.`));
    return box;
  }
  const it = ITEMS[r.out];
  const nm = UI.el('div', 'nm', it.name + (r.n ? ` ×${r.n}` : ''));
  nm.style.color = RARITY[it.rarity].color;
  box.appendChild(nm);
  box.appendChild(UI.el('div', 'muted', `${KIND[it.kind]} · +${r.xp} ${station === 'mutfak' ? 'Aşçılık' : 'Üretim'} XP${station === 'firin' ? ' · 5 sn' : ''}`));
  if (station === 'mutfak') {
    const bc = burnChance(S.level('ascilik'), r.lvl);
    box.appendChild(UI.el('div', 'muted', bc > 0 ? `Yanma ihtimali %${Math.round(bc * 100)} (seviyen arttıkça azalır)` : 'Bu yemek artık hiç yanmaz.'));
  }
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
  const lvlOk = lvOf(r) >= r.lvl;
  if (!lvlOk) {
    const req = UI.el('div', '', `Gerekli: ${station === 'mutfak' ? 'Aşçılık' : 'Üretim'} ${r.lvl}`);
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
    const label = station === 'firin' ? (c === 'max' ? `Hepsini koy (${Math.max(0, n)})` : `Ateşe koy ×${c}`) : station === 'mutfak' ? `Pişir ×${c}` : `Üret ×${c}`;
    const b = UI.button(label, () => {
      make(w, station, r, n, render);
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

function make(w, station, r, n, render) {
  if (n <= 0 || !canMake(r, n) || lvOf(r) < r.lvl) return;
  if (station === 'mutfak') { cook(w, r, n, render); return; }
  if (station === 'firin') {
    const f = S.save.furnace;
    const rid = recipeId(r);
    if (!furnaceIdle(f) && f.rid !== rid) return;
    for (const [id, k] of Object.entries(r.mats)) S.removeItem(id, k * n);
    const fs = furnaceState();
    if (furnaceIdle(f)) { f.rid = rid; f.n = 0; f.t0 = gNow(); }
    else if (!fs.working) {
      // bitmis ama alinmamis olanlar korunur, yeni isler simdi baslar
      f.t0 = gNow() - fs.ready * fms();
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
  // 0.8.5 Zanaat yetenekleri: Tutumlu (%10 malzeme gitmez), Cifte Uretim (%8 iki tane)
  let keep = 0; let extra = 0;
  for (let i = 0; i < n; i++) { if (S.has('tutumlu') && Math.random() < 0.1) keep++; if (S.has('cifte_uretim') && Math.random() < 0.08) extra++; }
  for (const [id, k] of Object.entries(r.mats)) S.removeItem(id, k * (n - keep));
  // 0.13.5: Uretim seviyesi arttikca Nadir/Epik kalite sansi artar
  const qb = 1 + S.level('uretim') / 60;
  let qn = 0;
  for (let i = 0; i < n * per; i++) { S.addItem(r.out, 1, 'bag', qb); if (S.lastRoll) qn++; }
  if (extra && S.fits(r.out, extra * per)) S.addItem(r.out, extra * per, 'bag', qb);
  if (qn) UI.feed(`<span style="color:#c08cff">✦ Ustalık! ${qn} tanesi kaliteli çıktı (çantada rengine bak).</span>`, 'epic');
  if (keep) UI.feed(`Tutumlu: ${keep} kez malzemen gitmedi!`);
  if (extra) UI.feed(`Çifte Üretim: ${extra * per} tane fazla çıktı!`);
  // Usta Damgasi: Uretim 75+ iken her uretimde %2
  if (S.level('uretim') >= 75) { let st = 0; for (let i = 0; i < n; i++) if (Math.random() < 0.02) st++; if (st) { UI.giveNote(S.giveSafe('usta_damgasi', st)); UI.feed(`<span style="color:#c08cff">Usta Damgası buldun! (×${st})</span>`, 'epic'); } }
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
  w.levelUps(ups);
}

// ---------------------------------------------------------------- Takas Tezgahi (0.2.1)
// Cimen Blogu ile alisveris. Alinca karakter blogu tezgaha birakir (placeblock).
export function openShop(w) {
  let tab = 'al';
  let ask = null; // B10: satis onayi bekleyen { id, n }
  UI.openPanel('Hancı Lale · Takas', (body) => {
    const render = () => {
      body.innerHTML = '';
      if (ask) {
        const it = ITEMS[ask.id];
        const box = UI.el('div', 'prep-box');
        box.appendChild(UI.el('p', 'choice-text', `Emin misin? ${it.name}${ask.n > 1 ? ` ×${ask.n}` : ''} satılacak (${ask.n * SELL[ask.id]} ${CURRENCY}).${ask.q ? ' Bu kaliteli (✦) bir kopya!' : ''}`));
        const r = UI.el('div', 'choice-row');
        r.appendChild(UI.button('Evet, sat', () => { const a = ask; ask = null; sell(a.id, a.n, true); }, 'red'));
        r.appendChild(UI.button('Vazgeç', () => { ask = null; render(); }, 'small'));
        box.appendChild(r);
        body.appendChild(box);
        return;
      }
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
          // D8 (1.0.18): iksir ve tohum gibi yiginlanan mallarda x5
          if (['malzeme', 'tuketim'].includes(it.kind)) {
            const b5 = UI.button(`×5 (${price * 5})`, () => buy(id, price, 5), 'small blue');
            b5.disabled = S.save.gold < price * 5;
            row.appendChild(b5);
          }
          list.appendChild(row);
        }
        // D7 (1.0.18): gec oyun icin parayla canta yuvasi
        const bought = S.save.bagBought || 0;
        if (bought < BAG_BUY.max) {
          const price = BAG_BUY.price(bought);
          const row = UI.el('div', 'shop-row r-nadir');
          row.appendChild(UI.icon('dock_canta'));
          row.appendChild(UI.el('div', 'shop-nm'));
          row.lastChild.innerHTML = `<b>+${BAG_BUY.step} çanta yuvası</b><div class="muted">Lale çantanı büyütür (${bought}/${BAG_BUY.max} alındı). Her seferinde pahalanır.</div>`;
          const b = UI.button(`${price}`, () => {
            if (S.save.gold < price) { sfx('weak'); return; }
            S.save.gold -= price;
            S.save.bagBought = bought + BAG_BUY.step;
            S.save.bagBonus = (S.save.bagBonus || 0) + BAG_BUY.step;
            for (let i = 0; i < BAG_BUY.step; i++) S.save.bag.push(null);
            S.changed(); sfx('coin');
            UI.feed(`Çantan ${BAG_BUY.step} yuva büyüdü! (−${price} ${CURRENCY})`, 'gold');
            render();
          }, 'small primary');
          b.prepend(Object.assign(document.createElement('img'), { className: 'ico-inline', src: iconUrl('cimen') }));
          b.disabled = S.save.gold < price;
          row.appendChild(b);
          list.appendChild(row);
        }
      } else {
        const have = Object.keys(SELL).filter((id) => S.countItem(id) > 0);
        if (!have.length) list.appendChild(UI.el('p', 'muted', 'Satacak malzemen yok. Keşifte, zindanda ve madende malzeme topla.'));
        for (const id of have) {
          const it = ITEMS[id];
          const n = S.countItem(id);
          const row = UI.el('div', 'shop-row');
          row.appendChild(UI.icon(it.icon));
          const qn = n - plainCount(id);
          row.appendChild(UI.el('div', 'shop-nm', `${it.name} ×${n} · tanesi ${SELL[id]}${qn ? ` · ${qn} tanesi ✦/artılı` : ''}`));
          row.appendChild(UI.button('Sat 1', () => sell(id, 1), 'small'));
          // B10: "Hepsi" kaliteli (✦) kopyalari atlar
          const plain = plainCount(id);
          if (plain > 1) row.appendChild(UI.button(`Hepsi (${plain * SELL[id]})`, () => sell(id, plain), 'small blue'));
          list.appendChild(row);
        }
        body.appendChild(UI.el('p', 'muted', 'Satış fiyatı düşüktür: asıl değer malzemede.'));
      }
      body.appendChild(list);
    };
    const buy = (id, price, n = 1) => {
      if (S.save.gold < price * n) { sfx('weak'); return; }
      if (!S.fits(id, n)) { UI.feed('Çanta dolu!'); if (w.sulk) w.sulk(); return; }
      S.save.gold -= price * n;
      S.addItem(id, n);
      S.changed();
      sfx('coin');
      UI.feed(`<img class="ico-inline" src="${iconUrl(ITEMS[id].icon)}">${UI.itemName(id)}${n > 1 ? ` ×${n}` : ''} aldın! (−${price * n} ${CURRENCY})`);
      // D8 (1.0.18): panel acik kalir, karakter tezgaha birakma animasyonunu arkada oynar
      if (!w.shopBusy) { w.shopBusy = true; w.tradeDone().then(() => { w.shopBusy = false; }); }
      render();
    };
    const plainCount = (id) => S.save.bag.reduce((t, x) => t + (x && x.id === id && !x.x && !x.u ? x.n : 0), 0);
    const sell = (id, n, sure = false) => {
      // B10 (1.0.17): Nadir ve ustu esyada ya da kaliteli kopyada once onay
      const q = plainCount(id) < n;
      if (!sure && (['nadir', 'epik', 'efsanevi'].includes(ITEMS[id].rarity) || q)) { ask = { id, n, q }; render(); return; }
      const got = S.removeItem(id, n);
      S.save.gold += got * SELL[id];
      S.changed();
      sfx('coin');
      render();
    };
    render();
  }, { onClose: () => { if (w.shopClosed) w.shopClosed(); } });
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
      if (w.home() && !w.busy) playAnim(w.player, 'c_cheer', 1).then(() => { if (!w.busy) w.idle(); });
    }, 'primary'));
    body.appendChild(row);
  });
}


// ------------------------------------------------------------ Hanci Lale (0.6)
// Usteki her yere buradan gidilir: arkasindaki haritada noktalar, altta takas ve gorevler.
const LALE_SAYS = [
  'Hoş geldin! Bugün nereye gidiyoruz?',
  'Zindanda en derine kim inecek, merak ediyorum…',
  'Glemonlara iyi bak, onlar da seni korur.',
  'Yorulduysan ateşin başına otur biraz.',
  'Yeni işlerim var, görevlere bir bak!',
];
// 1.0.6 (Eren): harita Eren'in verdigi resim (assets/harita.jpg). Resmin uzerindeki yazi
// levhalari dogrudan dugme: dokununca oraya gidilir. Tek sayfa, ayri koy sayfasi yok.
// Konumlar resmin 2000x1116 olcegine gore [orta x, orta y, genislik, yukseklik].
const MAP_SPOTS = [
  ['Maden', 290, 97, 150, 56, (w) => { UI.closePanel(); w.enterMine(); }],
  [NAMES.koru, 160, 388, 142, 56, (w) => { UI.closePanel(); w.enterKoru(); }],
  [NAMES.meydan, 722, 372, 232, 56, (w) => openLale(w)],
  [NAMES.gol, 188, 841, 132, 56, (w) => { UI.closePanel(); w.enterPond(); }],
  ['Arsa', 705, 678, 150, 56, (w) => { UI.closePanel(); w.enterPlot(); }],
  ['Ahır', 1097, 738, 132, 56, (w) => openAhir(w)],
  ['Etkinlik', 1305, 217, 160, 56, (w) => openEventGate(w)],
  ['Kule', 1675, 142, 132, 56, (w) => openKule(w)],
  ['Keşif', 1610, 406, 150, 56, (w) => openMap(w)],
  ['Zindan', 1840, 777, 172, 56, (w) => openZindan(w)],
];
export function openVillageMap(w) {
  S.fillQuests();
  tutFlag('lale');
  UI.openPanel(NAMES.koyHaritasi, (body) => {
    const box = UI.el('div', 'hubmap wmap');
    box.style.backgroundImage = 'url(assets/harita.jpg)';
    for (const [name, x, y, bw, bh, fn] of MAP_SPOTS) {
      const b = UI.el('button', 'map-spot', name);
      b.title = name;
      b.setAttribute('aria-label', name);
      b.style.left = `${((x - bw / 2) / 2000) * 100}%`;
      b.style.top = `${((y - bh / 2) / 1116) * 100}%`;
      b.style.width = `${(bw / 2000) * 100}%`;
      b.style.height = `${(bh / 1116) * 100}%`;
      b.onclick = () => fn(w);
      box.appendChild(b);
    }
    body.appendChild(box);
  }, { wide: true });
}
export function openLale(w) {
  S.fillQuests();
  UI.openPanel(`${NAMES.meydan} · Hancı Lale`, (body) => {
    body.appendChild(UI.el('p', 'lale-says', `“${LALE_SAYS[Math.floor(Math.random() * LALE_SAYS.length)]}”`));
    { // 1.0 hikaye satiri
      const ch = S.save.story.ch;
      const c = STORY[ch];
      const ready = c && storyProg(c) >= c.n;
      const srow = UI.el('div', 'story-row' + (ready ? ' ready' : ''));
      srow.appendChild(UI.el('span', 'st-t', c ? `Hikâye · Bölüm ${ch + 1}: ${c.t}` : 'Hikâye tamamlandı ✦'));
      srow.appendChild(UI.el('span', 'st-g', c ? (ready ? 'Ödül hazır!' : c.goal) : 'Lale sana minnettar.'));
      srow.appendChild(UI.button(ready ? 'Ödülü al!' : 'Hikâye', () => openStory(w), ready ? 'small green' : 'small primary'));
      body.appendChild(srow);
    }
    const row = UI.el('div', 'choice-row');
    refreshGoals();
    const done = S.save.quests.list.filter((q) => S.questProgress(q) >= q.target).length + readyCount();
    row.appendChild(UI.button('Takas', () => w.goShop(), 'primary'));
    row.appendChild(UI.button(done ? `Görevler (${done} hazır!)` : 'Görevler', () => openQuests(w), done ? 'green' : ''));
    row.appendChild(UI.button('Albüm', () => openAlbum(w), 'small'));
    row.appendChild(UI.button('Yetenekler', () => openTree(), 'small'));
    row.appendChild(UI.button('Patronlar', () => openTrophies(w), 'small'));
    row.appendChild(UI.button('Efsane Vitrini', () => openLegends(w), 'small'));
    { // 0.13 sinif secimi Lale'de
      const c = S.cls();
      const canSub = c && !S.save.cls.sub && S.combatLevel() >= CLASS_RULES.sub;
      const canPick = !c && S.combatLevel() >= CLASS_RULES.unlock;
      row.appendChild(UI.button(canPick ? 'Sınıf seç!' : canSub ? 'Alt sınıf seç!' : c ? `Sınıf: ${c.name}` : 'Sınıflar', () => openClass(), canPick || canSub ? 'small green' : 'small'));
    }
    row.appendChild(UI.button(NAMES.koyHaritasi, () => openVillageMap(w), 'small blue'));
    body.appendChild(row);
  }, { wide: true });
}

// 0.9: Gunluk / Haftalik / Serbest isler (Lale'nin eski 3 gorevi)
export function openQuests(w, tab = 'gunluk') {
  S.fillQuests();
  refreshGoals();
  UI.openPanel('Lale\'nin görevleri', (body) => {
    const render = () => {
      body.innerHTML = '';
      const g = goals();
      const tabs = UI.el('div', 'choice-row tabs');
      const dReady = g.daily.filter((q) => !q.claimed && goalProgress(q, false) >= q.target).length + (!g.dchest && g.daily.length && g.daily.every((q) => q.claimed) ? 1 : 0);
      const wReady = g.weekly.filter((q) => !q.claimed && goalProgress(q, true) >= q.target).length + (!g.wchest && g.weekly.length && g.weekly.every((q) => q.claimed) ? 1 : 0);
      const fReady = S.save.quests.list.filter((q) => S.questProgress(q) >= q.target).length;
      const tb = (k, label, n) => tabs.appendChild(UI.button(n ? `${label} (${n}!)` : label, () => { tab = k; render(); }, tab === k ? 'primary small' : n ? 'green small' : 'small'));
      tb('gunluk', 'Günlük', dReady);
      tb('haftalik', 'Haftalık', wReady);
      tb('serbest', 'Serbest işler', fReady);
      body.appendChild(tabs);
      const pulLine = UI.el('p', 'muted pul-line');
      pulLine.innerHTML = `<img class="ico-inline" src="${iconUrl('lale_pulu')}"><b>${S.save.pul || 0} ${PUL}</b> · sadece görev ve etkinliklerden gelir, Gezgin Tüccar'da geçer.`;
      body.appendChild(pulLine);
      if (!clockOk()) body.appendChild(UI.el('p', 'warn-line', 'Cihazının saati geri alınmış görünüyor. Saat düzelene kadar görevler yenilenmez.'));
      if (tab === 'serbest') { renderFree(); return; }
      const weekly = tab === 'haftalik';
      const list = weekly ? g.weekly : g.daily;
      body.appendChild(UI.el('p', 'muted', weekly
        ? `Her pazartesi yenilenir (kalan ${fmtLeft(nextMonday() - gNow())}). İkisi de bitince Haftalık Sandık: garanti nadir eşya.`
        : `Her gece 00:00'da yenilenir (kalan ${fmtLeft(nextMidnight() - gNow())}). Kaçırırsan ceza yok. Üçü de bitince günün sandığı.`));
      for (const q of list) {
        const prog = goalProgress(q, weekly);
        const ok = prog >= q.target;
        const row = UI.el('div', 'zone quest' + (q.claimed ? ' claimed' : ok ? ' ready' : ''));
        const left = UI.el('div');
        left.appendChild(UI.el('div', 'zn', (q.claimed ? '✓ ' : '') + goalText(q, weekly)));
        const sk = SKILLS.find((x) => x.key === questSkill(q, weekly));
        left.appendChild(UI.el('div', 'zf', `${prog} / ${q.target} · Ödül: ${q.gold} ${CURRENCY}, ${q.xp} ${sk ? sk.name : ''} XP, ${q.pul} ${PUL}`));
        const bar = UI.el('div', 'qbar'); const fill = UI.el('div', 'qfill'); fill.style.width = `${(prog / q.target) * 100}%`; bar.appendChild(fill); left.appendChild(bar);
        row.appendChild(left);
        const btns = UI.el('div', 'zb');
        if (ok && !q.claimed) btns.appendChild(UI.button('Ödülü al', async () => {
          if (q.claimed) return;
          q.claimed = true;
          if (weekly) g.wDone++; else g.dDone++;
          S.addGold(q.gold);
          addPul(q.pul);
          const ups = S.addXp({ [questSkill(q, weekly)]: q.xp });
          S.changed();
          sfx('coin');
          UI.feed(`<span style="color:#ffd04d">★ ${weekly ? 'Haftalık' : 'Günlük'} görev tamam! +${q.gold} ${CURRENCY}, +${q.pul} ${PUL}</span>`, 'gold');
          render();
          await w.levelUps(ups);
        }, 'primary small'));
        row.appendChild(btns);
        body.appendChild(row);
      }
      const allDone = list.length && list.every((q) => q.claimed);
      const opened = weekly ? g.wchest : g.dchest;
      const crow = UI.el('div', 'zone quest chest-row' + (allDone && !opened ? ' ready' : ''));
      const cl = UI.el('div');
      cl.appendChild(UI.el('div', 'zn', weekly ? 'Haftalık Sandık' : 'Günün sandığı'));
      cl.appendChild(UI.el('div', 'zf', opened ? 'Açıldı. Yenisi görevlerle birlikte gelir.' : weekly ? 'İki haftalık görev bitince açılır: malzemeler + garanti nadir eşya.' : 'Üç görev bitince açılır: malzemeler, küçük ihtimalle nadir eşya.'));
      crow.appendChild(cl);
      const cb = UI.el('div', 'zb');
      if (allDone && !opened) cb.appendChild(UI.button('Aç', () => { openGoalChest(w, weekly); render(); }, 'green small'));
      crow.appendChild(cb);
      body.appendChild(crow);
      const back = UI.el('div', 'choice-row');
      back.appendChild(UI.button('Lale\'ye dön', () => openLale(w), 'small'));
      body.appendChild(back);
    };
    const renderFree = () => {
      body.appendChild(UI.el('p', 'muted', `Lale'nin serbest işleri: biri bitince yenisi gelir. Tamamlanan: ${S.save.quests.done}.`));
      for (const q of S.save.quests.list) {
        const prog = S.questProgress(q);
        const ok = prog >= q.target;
        const row = UI.el('div', 'zone quest' + (ok ? ' ready' : ''));
        const left = UI.el('div');
        left.appendChild(UI.el('div', 'zn', q.text));
        const sk = SKILLS.find((x) => x.key === q.skill);
        left.appendChild(UI.el('div', 'zf', `${prog} / ${q.target} · Ödül: ${q.gold} ${CURRENCY} + ${q.xp} ${sk.name} XP`));
        const bar = UI.el('div', 'qbar'); const fill = UI.el('div', 'qfill'); fill.style.width = `${(prog / q.target) * 100}%`; bar.appendChild(fill); left.appendChild(bar);
        row.appendChild(left);
        const btns = UI.el('div', 'zb');
        if (ok) btns.appendChild(UI.button('Ödülü al', async () => {
          S.save.quests.list = S.save.quests.list.filter((x) => x.id !== q.id);
          S.save.quests.done++;
          S.addGold(q.gold);
          const ups = S.addXp({ [q.skill]: q.xp });
          S.fillQuests();
          S.changed();
          sfx('coin');
          UI.feed(`<span style="color:#ffd04d">★ Görev tamam: ${UI.escapeHtml(q.text)}! +${q.gold} ${CURRENCY}, +${q.xp} ${sk.name} XP</span>`, 'gold');
          render();
          await w.levelUps(ups);
        }, 'primary small'));
        else {
          btns.appendChild(UI.button(`Değiştir (${QUEST_REROLL})`, () => {
            if (S.save.gold < QUEST_REROLL) { UI.feed('Yeterli Çimen Bloğu yok.'); return; }
            S.addGold(-QUEST_REROLL);
            const i = S.save.quests.list.findIndex((x) => x.id === q.id);
            S.save.quests.list[i] = S.newQuest(S.save.quests.list.map((x) => x.kind));
            S.changed();
            render();
          }, 'small'));
        }
        row.appendChild(btns);
        body.appendChild(row);
      }
      const back = UI.el('div', 'choice-row');
      back.appendChild(UI.button('Lale\'ye dön', () => openLale(w), 'small'));
      body.appendChild(back);
    };
    render();
  }, { wide: true });
}

function questSkill(q, weekly) { return goalDef(q, weekly).skill; }

// gunluk / haftalik sandik
function openGoalChest(w, weekly) {
  const g = goals();
  if (weekly ? g.wchest : g.dchest) return;
  if (weekly) g.wchest = true; else g.dchest = true;
  sfx('chest');
  const zs = ZONES.filter((z) => z.open && (!z.after || (S.save.stats.glemons[z.after] || 0) > 0));
  const mats = (z) => ({ orman: ['dal', 'mantar', 'diken', 'sifali_ot', 'komur'], magara: ['komur', 'ham_kristal', 'demir_cevheri'], col: ['pul', 'hurma', 'demir_kulcesi'], buz: ['buz_kristali', 'kar_tuyu', 'altin_kulcesi'], kor: ['kor_pulu', 'kivilcim', 'kor_tasi'], golge: ['golge_ozu', 'gece_mantari', 'golge_tasi'], cekirdek: ['yildiz_parcasi', 'meteor_tasi', 'cekirdek_kristali'] }[z.key] || ['dal']);
  const from = weekly ? 'Haftalık Sandıktan' : 'Günün sandığından';
  for (let i = 0; i < (weekly ? 4 : 3); i++) {
    const z = zs[Math.floor(Math.random() * zs.length)];
    const ms = mats(z).filter((id) => ITEMS[id]);
    w.giveDrop(ms[Math.floor(Math.random() * ms.length)], 2 + Math.floor(Math.random() * (weekly ? 6 : 4)), from);
  }
  if (weekly || Math.random() < 0.12 * S.dropMult()) {
    const pool = ['can_tilsimi', 'altin_elma', 'canta_eki', 'parlak_yem', 'buyuk_iksir', 'skarabe_tilsimi', 'yaprak_tilsimi', 'fener', 'orta_iksir'].filter((id) => ITEMS[id] && ITEMS[id].rarity !== 'siradan');
    w.giveDrop(pool[Math.floor(Math.random() * pool.length)], 1, from);
  }
  const gold = Math.round((weekly ? 600 : 120) * (1 + S.totalLevel() / 60));
  S.addGold(gold);
  UI.feed(`<img class="ico-inline" src="${w.coinUrl}">${from} ${gold} ${CURRENCY}!`, 'gold');
  if (weekly) { addPul(3); UI.feed(`<span style="color:#ffd04d">+3 ${PUL}</span>`, 'gold'); }
  S.changed();
}

// ------------------------------------------------------------ Zindan (0.6): sonsuz inis
export function openZindan(w) {
  if (!w.home()) return;
  const best = S.save.stats.zindanBest || 0;
  UI.openPanel('Zindan', (body) => {
    body.appendChild(UI.el('p', 'choice-text', 'Aşağı indikçe Glemonlar güçlenir; sonu yok. Her 5 katta bir ara patron ve büyüyen bir ödül sandığı var. Bayılırsan bu turda bulduklarının yarısı gider, "Eve dön" dersen hepsi seninle.'));
    body.appendChild(UI.el('p', 'zf', `Rekorun: Kat ${best}.`));
    const row = UI.el('div', 'choice-row');
    row.appendChild(UI.button('Kat 1\'den başla', () => w.enterZindan(1), 'primary'));
    for (let f = 11; f <= best; f += 10) row.appendChild(UI.button(`Kat ${f}`, () => w.enterZindan(f), 'small'));
    body.appendChild(row);
  });
}

// ------------------------------------------------------------ 0.9 Basarimlar
export function openAchievements(w, group = 0) {
  UI.openPanel('Başarımlar', (body) => {
    const render = () => {
      body.innerHTML = '';
      body.appendChild(UI.el('p', 'muted', `★ ${achPoints()} puan · ${achCount()}/${ACH_TOTAL} açık. Her başarımın Bronz, Gümüş ve Altın kademesi var (${TIER_PTS.join(' / ')} puan).`));
      const tabs = UI.el('div', 'choice-row tabs');
      ACH_GROUPS.forEach((g, i) => tabs.appendChild(UI.button(g, () => { group = i; render(); }, group === i ? 'primary small' : 'small')));
      tabs.appendChild(UI.button('Gizli', () => { group = 9; render(); }, group === 9 ? 'primary small' : 'small'));
      body.appendChild(tabs);
      const list = UI.el('div', 'ach-list');
      if (group === 9) {
        for (const a of SECRET) {
          const ok = a.v(S.save);
          const row = UI.el('div', 'ach' + (ok ? ' t3' : ' locked'));
          row.appendChild(UI.el('div', 'medal', ok ? '✦' : '?'));
          const tx = UI.el('div', 'ach-tx');
          tx.appendChild(UI.el('div', 'zn', ok ? a.n : '???'));
          tx.appendChild(UI.el('div', 'zf', ok ? `${a.d} · +${SECRET_PTS} puan` : 'Gizli başarım. Oynadıkça kendiliğinden açılır.'));
          row.appendChild(tx);
          list.appendChild(row);
        }
      } else {
        for (const a of ACH.filter((x) => x.g === group)) {
          const t = achTier(a);
          const ts = achTargets(a);
          const v = a.v(S.save);
          const next = ts[Math.min(t, 2)];
          const row = UI.el('div', `ach t${t}`);
          row.appendChild(UI.el('div', 'medal', t ? '★'.repeat(t) : '☆'));
          const tx = UI.el('div', 'ach-tx');
          tx.appendChild(UI.el('div', 'zn', `${a.n}${t ? ` · ${TIER_NAMES[t - 1]}` : ''}`));
          tx.appendChild(UI.el('div', 'zf', t >= 3 ? `${a.d(ts[2])} · tamamlandı!` : `${a.d(next)} · ${Math.min(v, next)}/${next}`));
          const bar = UI.el('div', 'qbar'); const fill = UI.el('div', 'qfill'); fill.style.width = `${Math.min(1, v / next) * 100}%`; bar.appendChild(fill); tx.appendChild(bar);
          row.appendChild(tx);
          list.appendChild(row);
        }
      }
      body.appendChild(list);
      const back = UI.el('div', 'choice-row');
      back.appendChild(UI.button('Profile dön', () => openProfile(w), 'small'));
      body.appendChild(back);
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ 0.9 Unvanlar
export function openTitles(w) {
  UI.openPanel('Unvanlar', (body) => {
    const render = () => {
      body.innerHTML = '';
      body.appendChild(UI.el('p', 'muted', 'Seçtiğin unvan adının altında ve profil kartında yazar. Bazıları bir beceriye küçük XP bonusu verir.'));
      const grid = UI.el('div', 'title-grid');
      for (const t of TITLES) {
        const ok = t.ok();
        const on = S.save.title === t.k;
        const c = UI.el('div', 'title-card' + (on ? ' on' : '') + (ok ? '' : ' locked'));
        c.appendChild(UI.el('div', 'zn', ok ? t.n : `🔒 ${t.n}`));
        const sk = t.bonus && SKILLS.find((x) => x.key === t.bonus[0]);
        c.appendChild(UI.el('div', 'zf', t.req + (sk ? ` · ${sk.name} XP +%${Math.round(t.bonus[1] * 100)}` : '')));
        if (ok && !on) c.addEventListener('click', () => { sfx('click'); S.save.title = t.k; S.changed(); render(); });
        grid.appendChild(c);
      }
      body.appendChild(grid);
      const back = UI.el('div', 'choice-row');
      back.appendChild(UI.button('Profile dön', () => openProfile(w), 'small'));
      body.appendChild(back);
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ 0.9 Etkinlik Kapisi
// Her zaman bir etkinlik acik: Gunun Zindani. Hafta sonu ek etkinlik; Tuccar ve Dolunay da burada duyurulur.
export function openEventGate(w) {
  refreshGoals();
  UI.openPanel('Etkinlik Kapısı', (body) => {
    const now = gNow();
    const ev = S.save.ev;
    const list = UI.el('div', 'event-list');
    const row = (title, sub, timer, btn, cls = '') => {
      const r = UI.el('div', 'zone event ' + cls);
      const tx = UI.el('div');
      tx.appendChild(UI.el('div', 'zn', title));
      tx.appendChild(UI.el('div', 'zf', sub));
      r.appendChild(tx);
      const side = UI.el('div', 'zb');
      if (timer) side.appendChild(UI.el('div', 'ev-timer', timer));
      if (btn) side.appendChild(btn);
      r.appendChild(side);
      list.appendChild(r);
    };
    { // 0.13.5 Sonsuz Kule (kapinin yaninda)
      const k = w.kuleWeek();
      row('Sonsuz Kule', `Her kat tek savaş + rastgele kural. Bu hafta rekorun: Kat ${k.best || 0}. 10 katta bir sandık.`, `⏳ ${fmtLeft(nextMonday() - now)}`, UI.button('Kuleye bak', () => openKule(w), 'purple small'), 'daily');
    }
    const rule = todayRule();
    const doneToday = ev.daily === dayNum();
    row(`Günün Zindanı: ${rule.n}`, `${rule.d} 5 kat, sonunda etkinlik sandığı (3 ${PUL} + ödül sandığı)${doneToday ? '. Bugünün ödülünü aldın, yine de girebilirsin.' : '.'}`,
      `⏳ ${fmtLeft(nextMidnight(now) - now)}`, UI.button('Gir', () => w.enterEvent('gunluk'), doneToday ? 'small' : 'primary small'), 'daily');
    if (weekendNow(now)) {
      const kind = weekendKind(now);
      const left = `⏳ ${fmtLeft(weekendEnds(now) - now)}`;
      if (kind === 'patron') {
        const done = ev.weekend === weekNum(now);
        row('Hafta sonu: Patron Koşusu', `Açtığın bölgelerin patronları arka arkaya. Sonunda 6 ${PUL} ve garanti epik eşya${done ? '. Bu hafta sonunun ödülünü aldın.' : '.'}`, left,
          UI.button('Gir', () => w.enterEvent('patron'), done ? 'small' : 'primary small'), 'weekend');
      } else {
        const n = tourCount();
        const got = ev.tour || [];
        const next = FISH_TOUR.findIndex((t, i) => !got.includes(i));
        let btn = null;
        if (next >= 0 && n >= FISH_TOUR[next] && clockOk()) {
          btn = UI.button(`+${FISH_TOUR_PUL[next]} ${PUL} al`, () => {
            if ((ev.tour || []).includes(next)) return;
            ev.tour = [...(ev.tour || []), next];
            addPul(FISH_TOUR_PUL[next]);
            if (next === 2) w.giveDrop('parlak_yem', 2, 'Balık turnuvasından');
            sfx('coin');
            S.changed();
            openEventGate(w);
          }, 'green small');
        }
        row('Hafta sonu: Balık Turnuvası', `Hafta sonu tuttuğun her balık sayılır: ${n} balık. Eşikler ${FISH_TOUR.join(' / ')}: ${FISH_TOUR_PUL.join(' / ')} ${PUL}${next < 0 ? '. Hepsini aldın!' : '.'}`, left, btn, 'weekend');
      }
    } else {
      row('Hafta sonu etkinliği', `Cuma 00:00'da açılır: ${weekendKind(weekendStarts(now)) === 'patron' ? 'Patron Koşusu' : 'Balık Turnuvası'}.`, `⏳ ${fmtLeft(weekendStarts(now) - now)}`, null, 'soon');
    }
    if (merchantHere(now)) row('Gezgin Tüccar evine geldi!', `Evinin önündeki patikada duruyor. ${PUL} ile 6 özel eşya satıyor.`, null, UI.button('Vitrine bak', () => openMerchant(w), 'purple small'), 'merchant');
    else row('Gezgin Tüccar', 'Cumartesi ve pazar gelir. Vitrini her hafta değişir.', `⏳ ${fmtLeft(merchantNext(now) - now)}`, null, 'soon');
    if (fullMoon(now)) row('Dolunay Gecesi!', 'Parlak Glemon şansı 2 kat, ay otu her yerde, Dolunay Tavşanı ortalarda. Evdeki Gölde Ay Işığı Sazanı!', `⏳ ${fmtLeft(nextMidnight(now) - now)}`, null, 'moon');
    else row('Dolunay Gecesi', 'Takvimdeki dolunayda 24 saat sürer.', `⏳ ${fmtLeft(nextFullMoon(now) - now)}`, null, 'soon');
    body.appendChild(list);
    body.appendChild(UI.el('p', 'muted', `Kaçırırsan ceza yok, etkinlikler dönüp gelir. ${PUL}: ${S.save.pul || 0}`));
  }, { wide: true });
}

// ------------------------------------------------------------ 0.9 Gezgin Tuccar
export function openMerchant(w) {
  UI.openPanel('Gezgin Tüccar', (body) => {
    const render = () => {
      body.innerHTML = '';
      const m = S.save.merch;
      if (m.week !== weekNum()) { m.week = weekNum(); m.bought = {}; }
      body.appendChild(UI.el('p', 'lale-says', '“Uzak diyarlardan geldim! Her şeyden bir tane, sadece bu hafta sonu. Lale Pulu alırım, Çimen Bloğu değil.”'));
      const pl = UI.el('p', 'pul-line');
      pl.innerHTML = `<img class="ico-inline" src="${iconUrl('lale_pulu')}"><b>${S.save.pul || 0} ${PUL}</b>`;
      body.appendChild(pl);
      const grid = UI.el('div', 'merch-grid');
      for (const [id, n, price] of merchantStock()) {
        const it = ITEMS[id];
        const sold = m.bought[id];
        const c = UI.el('div', 'merch-card' + (sold ? ' sold' : ''));
        c.appendChild(UI.icon(it.icon, 'ico'));
        const nm = UI.el('div', 'zn', `${it.name}${n > 1 ? ` ×${n}` : ''}`);
        nm.style.color = (RARITY[it.rarity] || RARITY.siradan).color;
        c.appendChild(nm);
        c.appendChild(UI.el('div', 'zf', it.desc));
        c.appendChild(UI.button(sold ? 'Satıldı' : `${price} ${PUL}`, () => {
          if (sold) return;
          if (!merchantHere()) { UI.feed('Tüccar yola çıktı. Gelecek hafta sonu görüşürüz!'); return; }
          if ((S.save.pul || 0) < price) { UI.feed(`Yeterli ${PUL} yok. Günlük ve haftalık görevlerden kazanılır.`); return; }
          if (!S.fits(id, n)) { UI.feed('Çantan dolu.'); return; }
          S.save.pul -= price;
          m.bought[id] = true;
          S.addItem(id, n);
          sfx('coin');
          UI.feed(`<img class="ico-inline" src="${iconUrl(it.icon)}">${UI.itemName(id)}${n > 1 ? ` ×${n}` : ''} aldın!`, 'rare');
          S.changed();
          render();
        }, sold ? 'small' : 'primary small'));
        grid.appendChild(c);
      }
      body.appendChild(grid);
    };
    render();
  }, { wide: true });
}


// 0.10.5 Kupa Rafi, 0.13.5 Patron gunlugu: kac kez yendin, en hizli sure, dusen nadirler, zor mod
const fmtSec = (ms) => { const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
export function openTrophies(w) {
  UI.openPanel('Patron Günlüğü', (body) => {
    const st = S.save.stats;
    body.appendChild(UI.el('div', 'muted', `Toplam ${st.bossKills || 0} patron zaferi. Bir patronu yenince zor modu açılır: çok daha güçlü, kendi ödülleri var (Kadim efsanevi silah düşebilir). Canı yarıya inen patron 2. aşamaya geçer.`));
    const grid = UI.el('div', 'trophies journal');
    for (const z of ZONES) {
      const n = st.glemons[z.boss] || 0;
      const b = S.save.bossLog[z.boss] || { n: 0, hn: 0, best: 0, bestH: 0, rares: {} };
      const c = UI.el('div', 'trophy' + (n ? '' : ' none'));
      c.appendChild(UI.glemonImg(w.gmeta, z.boss, 0, false, { w: 40, h: 34 }, !n));
      c.appendChild(UI.el('b', '', n ? GLEMONS[z.boss].name : '???'));
      c.appendChild(UI.el('span', 'muted', n ? `${z.name} · ${n} kez` : `${z.name} patronu`));
      if (n) {
        c.appendChild(UI.el('span', 'muted', `En hızlı: ${b.best ? fmtSec(b.best) : '—'}${b.hn ? ` · Zor: ${b.hn} kez, ${fmtSec(b.bestH)}` : ''}`));
        const rares = Object.entries(b.rares).filter(([id]) => ITEMS[id]).map(([id, k]) => `${ITEMS[id].name}${k > 1 ? ` ×${k}` : ''}`);
        c.appendChild(UI.el('span', 'muted', rares.length ? `Düşürdü: ${rares.join(', ')}` : 'Henüz nadir bir şey düşürmedi.'));
        if (w.home()) c.appendChild(UI.button('Zor mod', () => w.enterHardBoss(z.boss), 'small red'));
      }
      grid.appendChild(c);
    }
    body.appendChild(grid);
  }, { wide: true });
}

// 0.13.5 Sonsuz Kule
export function openKule(w) {
  const k = w.kuleWeek();
  UI.openPanel('Sonsuz Kule', (body) => {
    body.appendChild(UI.el('p', 'muted', 'Her kat tek bir savaş ve rastgele bir kural ("Yarım Şifa", "Hızlı Glemonlar"...). 5 katta bir ara patron, 10 katta bir Kule sandığı (yıldız demiri, kaliteli eşya, Lale Pulu; 30. kattan sonra Kadim efsanevi silah şansı, 50. kat ilk seferde garanti). Rekor her pazartesi sıfırlanır.'));
    const info = UI.el('div', 'stats-box');
    info.innerHTML = `<b>Bu hafta rekorun:</b> Kat ${k.best || 0} &nbsp; <b>En iyi rekorun:</b> Kat ${k.all || 0}<br><b>Kontrol noktası:</b> ${k.cp ? `Kat ${k.cp + 1}'den devam edebilirsin` : 'yok (5. katı geçince açılır)'} &nbsp; <b>Sıfırlanmaya:</b> ${fmtLeft(nextMonday() - gNow())}`;
    body.appendChild(info);
    body.appendChild(UI.el('p', 'muted', `Kurallar: ${KULE_RULES.map((r) => r.n).join(', ')}.`));
    const row = UI.el('div', 'choice-row');
    if (!w.home()) row.appendChild(UI.el('div', 'muted', 'Kuleye sadece evden yola çıkabilirsin.'));
    else {
      row.appendChild(UI.button('Kat 1\'den başla', () => w.enterKule(1), k.cp ? 'small' : 'primary'));
      if (k.cp) row.appendChild(UI.button(`Kat ${k.cp + 1}'den devam`, () => w.enterKule(k.cp + 1), 'primary'));
    }
    body.appendChild(row);
  }, { wide: true });
}

// 0.13.5 Efsane Vitrini (efsanevi yol 3: Topla) ve uc yolun ozeti
export function openLegends(w) {
  UI.openPanel('Efsane Vitrini', (body) => {
    const render = () => {
      body.innerHTML = '';
      body.appendChild(UI.el('p', 'muted', 'Efsanevi silahlara üç yol var. Üçü de aynı güçte (güç 64 / 61, Saldırı +%8, Kritik +%5, Can +15), sadece görünüşleri farklı. Kılıç, yay ve asa hâlleri var.'));
      for (const [p, L] of Object.entries(LEGENDS)) body.appendChild(UI.el('div', '', `★ ${L.name} (${L.path}): ${L.how}`));
      const pts = achPoints();
      body.appendChild(UI.el('h3', '', `Şanlı silahlar · ${LEGEND_PUL} ${PUL}, ${LEGEND_ACH} başarım puanı`));
      body.appendChild(UI.el('p', 'muted', `Senin: ${S.save.pul || 0} ${PUL}, ${pts} başarım puanı.`));
      for (const wt of ['kilic', 'yay', 'asa']) {
        const id = `sanli_${wt}`;
        const it = ITEMS[id];
        const row = UI.el('div', 'shop-row r-efsanevi');
        row.appendChild(UI.icon(it.icon));
        const nm = UI.el('div', 'shop-nm');
        nm.innerHTML = `${UI.itemName(id)}<div class="muted">${S.save.seen[id] ? 'Daha önce aldın.' : ''}</div>`;
        row.appendChild(nm);
        const ok = (S.save.pul || 0) >= LEGEND_PUL && pts >= LEGEND_ACH;
        const b = UI.button(`${LEGEND_PUL} ${PUL}`, () => {
          if ((S.save.pul || 0) < LEGEND_PUL || achPoints() < LEGEND_ACH) return;
          if (!S.fits(id)) { UI.feed('Çanta dolu!'); return; }
          S.save.pul -= LEGEND_PUL;
          S.addItem(id, 1, 'bag', 0);
          S.logDrop(id, 'Efsane Vitrininden');
          S.changed();
          sfx('rare');
          UI.banner('EFSANEVİ!', it.name, 2600, 'gold');
          UI.feed(`<img class="ico-inline" src="${iconUrl(it.icon)}">${UI.itemName(id)} senin!`, 'gold');
          render();
        }, ok ? 'small primary' : 'small');
        b.disabled = !ok;
        row.appendChild(b);
        body.appendChild(row);
      }
    };
    render();
  }, { wide: true });
}

// 0.11 Hazirlik ekrani: Kesife cikmadan once bolgenin tehlikesi, yaninda olmasi gerekenler ve yemek
const PREP_NEED = {
  col: { what: 'Sıcak', items: ['su_matarasi'], until: 'waterUntil', how: 'Simya Kazanı: Kaktüs suyu + Pul' },
  buz: { what: 'Soğuk', items: ['sicak_corba', 'balik_corbasi'], until: 'warmUntil', how: 'Mutfak ya da Hancı Lale' },
  kor: { what: 'Lav', items: ['ates_iksiri'], until: 'fireResUntil', how: 'Simya Kazanı ya da Hancı Lale' },
  magara: { what: 'Karanlık', items: ['fener'], carry: true, how: 'Fener taşı (Üretim Masası)' },
  golge: { what: 'Karanlık', items: ['fener'], carry: true, how: 'Fener taşı (Üretim Masası)' },
};
export function openPrep(w, floor, opts = {}) {
  const z = zoneOf(floor);
  UI.openPanel(`Hazırlık · ${z.name}, ${opts.boss ? `Patron (${GLEMONS[z.boss].name})` : `Kat ${floor}`}`, (body) => {
    const render = () => {
      body.innerHTML = '';
      const night = todNow() === 'gece';
      // B1: canta neredeyse doluysa uyar
      const free = S.bagFreeSlots();
      if (free < 3) body.appendChild(UI.el('div', 'prep-bad', `⚠ Çantanda sadece ${free} boş yuva var. Düşen eşyalar önce Depo'ya gider, o da dolarsa bekletilir. Yola çıkmadan çantanı boşaltabilirsin.`));
      if (night) { const n = UI.el('div', 'prep-night', `🌙 Gece (${todLeftMin()} dk kaldı): Glemonlar %15 güçlü ama %30 fazla XP ve eşya veriyor. Sadece gece çıkan Glemonlar var.`); body.appendChild(n); }
      const grid = UI.el('div', 'prep-grid');
      // tehlike
      const need = PREP_NEED[z.key];
      const hz = UI.el('div', 'prep-box');
      hz.appendChild(UI.el('h3', '', 'Tehlike'));
      if (!need) hz.appendChild(UI.el('div', 'prep-ok', 'Bu bölgede özel bir tehlike yok.'));
      else {
        hz.appendChild(UI.el('div', 'muted', z.hazard || need.what));
        const safe = need.carry ? (S.darkproof() || S.countItem('fener') > 0) : (need.until === 'fireResUntil' && S.fireproof()) || gNow() < (S.save[need.until] || 0);
        if (safe) {
          const left = !need.carry && !S.fireproof() ? Math.ceil(((S.save[need.until] || 0) - gNow()) / 60000) : 0;
          hz.appendChild(UI.el('div', 'prep-ok', `✓ Hazırsın${left > 0 ? ` (${left} dk korunuyorsun)` : need.carry ? ` (Fener ×${S.countItem('fener')})` : ''}`));
        } else hz.appendChild(UI.el('div', 'prep-bad', `✗ ${need.what}a karşı korumasızsın.`));
        if (!need.carry) {
          for (const id of need.items) {
            const n = S.countItem(id);
            const row = UI.el('div', 'prep-row');
            row.appendChild(UI.icon(ITEMS[id].icon));
            row.appendChild(UI.el('span', '', `${ITEMS[id].name} ×${n}`));
            const b = UI.button('İç (30 dk)', () => { const m = S.consume(id); if (m) { sfx('heal'); UI.feed(`${UI.itemName(id)}: ${m.join(' · ')}`); S.changed(); w.refreshHud(); } render(); }, 'small blue');
            b.disabled = !n;
            row.appendChild(b);
            hz.appendChild(row);
          }
        }
        if (!safe && !need.items.some((id) => S.countItem(id))) hz.appendChild(UI.el('div', 'muted', `Yapılışı: ${need.how}`));
      }
      grid.appendChild(hz);
      // yemek (Tok)
      const fb = UI.el('div', 'prep-box');
      fb.appendChild(UI.el('h3', '', 'Yemek (Tok)'));
      const left = S.tokLeft();
      if (left) { const t = S.save.tok; fb.appendChild(UI.el('div', 'prep-ok', `✓ ${ITEMS[t.id].name}: ${TOK[t.k].fmt(t.v)} · ${Math.ceil(left / 60000)} dk`)); }
      else fb.appendChild(UI.el('div', 'muted', 'Tok değilsin. Bir yemek ye: etkisi Keşif boyunca sürer.'));
      const foods = [...new Set(S.save.bag.filter((x) => x && ITEMS[x.id].tok).map((x) => x.id))].slice(0, 4);
      for (const id of foods) {
        const row = UI.el('div', 'prep-row');
        row.appendChild(UI.icon(ITEMS[id].icon));
        row.appendChild(UI.el('span', '', `${ITEMS[id].name} ×${S.countItem(id)} · ${TOK[ITEMS[id].tok[0]].fmt(ITEMS[id].tok[1])}`));
        row.appendChild(UI.button('Ye', () => { const m = S.consume(id); if (m) { sfx('heal'); UI.feed(`${UI.itemName(id)}: ${m.join(' · ')}`); S.changed(); w.refreshHud(); } render(); }, 'small red'));
        fb.appendChild(row);
      }
      if (!foods.length) fb.appendChild(UI.el('div', 'muted', 'Çantanda Tok yemeği yok. Kamp ateşindeki Mutfak\'ta pişirebilirsin.'));
      grid.appendChild(fb);
      // can ve hizli kemer
      const hb = UI.el('div', 'prep-box');
      hb.appendChild(UI.el('h3', '', 'Can ve hızlı kemer'));
      const pots = ['iksir_k', 'orta_iksir', 'buyuk_iksir'].map((id) => S.countItem(id)).reduce((a, b) => a + b, 0);
      hb.appendChild(UI.el('div', pots ? 'prep-ok' : 'prep-bad', pots ? `✓ ${pots} can iksiri` : '✗ Can iksirin yok!'));
      const uc = S.save.useCount || {};
      const belt = Object.keys(uc).filter((id) => S.countItem(id) > 0).sort((a, b) => uc[b] - uc[a]).slice(0, 3);
      const br = UI.el('div', 'prep-belt');
      for (const id of belt) { const c = UI.el('div', 'prep-chip'); c.appendChild(UI.icon(ITEMS[id].icon)); c.appendChild(UI.el('span', '', `${S.countItem(id)}`)); br.appendChild(c); }
      hb.appendChild(UI.el('div', 'muted', belt.length ? 'Savaşta tek dokunuşla:' : 'Savaşta en çok kullandığın 3 eşya burada, tek dokunuşla kullanılır.'));
      if (belt.length) hb.appendChild(br);
      grid.appendChild(hb);
      body.appendChild(grid);
      const row = UI.el('div', 'choice-row');
      row.appendChild(UI.button(opts.boss ? 'Patrona git!' : 'Yola çık!', () => w.enterDungeon(floor, opts), 'primary'));
      row.appendChild(UI.button('Geri', () => openVillageMap(w), 'small'));
      body.appendChild(row);
    };
    render();
  }, { wide: true });
}

// ------------------------------------------------------------ 0.13 Siniflar (Hanci Lale)
function askClass(text, fn) {
  UI.choice('Emin misin?', text, [{ label: 'Evet', cls: 'green', onClick: () => { fn(); openClass(); } }, { label: 'Vazgeç', onClick: () => openClass() }]);
}
function classCard(name, lines, btn) {
  const card = UI.el('div', 'tree-card class-card');
  card.appendChild(UI.el('div', 'zn', name));
  for (const [cls, t] of lines) card.appendChild(UI.el('div', cls, t));
  if (btn) card.appendChild(btn);
  return card;
}
export function openClass() {
  UI.openPanel('Sınıflar', (body) => {
    const render = () => {
      body.innerHTML = '';
      const cl = S.save.cls;
      const c = S.cls(); const sb = S.sub();
      const lvl = S.combatLevel();
      body.appendChild(UI.el('p', 'lale-says', c
        ? `“Sınıfın: ${c.name}${sb ? ` · ${sb.name}` : ''}. ${!sb ? (lvl >= CLASS_RULES.sub ? 'Artık alt sınıfını seçebilirsin!' : `Savaş becerin ${CLASS_RULES.sub} olunca alt sınıf seçersin.`) : 'Yolun açık olsun.'}”`
        : lvl >= CLASS_RULES.unlock ? '“Savaşmayı öğrendin. Şimdi bir yol seç! Her sınıf her silahı kullanabilir ama kendi silahında daha güçlüdür.”'
          : `“Saldırı, Okçuluk ya da Büyü ${CLASS_RULES.unlock} olunca sınıfını seçebilirsin. Şu an en yükseği ${lvl}.”`));
      if (c && !sb) {
        body.appendChild(UI.el('h3', '', `${c.name} alt sınıfları (savaş becerisi ${CLASS_RULES.sub})`));
        const row = UI.el('div', 'tree-row');
        for (const k of c.subs) {
          const d = SUBCLASSES[k];
          const b = UI.button('Seç', () => {
            askClass(`${d.name} olacaksın. Sonra Lale'de ${CLASS_RULES.changePul} Lale Pulu ile alt sınıfını değiştirebilirsin.`, () => {
              if (S.pickSub(k)) { sfx('levelup'); UI.banner(`${d.name}!`, d.bonus, 2200, 'gold'); UI.feed(`<span style="color:#ffd04d">★ Alt sınıf: ${d.name}. Yetenek Ağacı'nın Sınıf dalında 2 yeni kat açıldı.</span>`, 'gold'); render(); }
            });
          }, 'small green');
          b.disabled = lvl < CLASS_RULES.sub;
          row.appendChild(classCard(d.name, [['muted', d.desc], ['', d.bonus]], b));
        }
        body.appendChild(row);
      }
      // M6 (1.0.19): alt sinif degistir
      if (c && sb) {
        body.appendChild(UI.el('h3', '', `Alt sınıf değiştir (${CLASS_RULES.changePul} Lale Pulu)`));
        const row = UI.el('div', 'tree-row');
        for (const k of c.subs) {
          if (k === cl.sub) continue;
          const d = SUBCLASSES[k];
          const b = UI.button(`Değiştir (${CLASS_RULES.changePul} Pul)`, () => {
            askClass(`${sb.name} yerine ${d.name} olacaksın. ${sb.name} yeteneklerin iade edilir.`, () => {
              if (S.changeSub(k)) { sfx('levelup'); UI.banner(`${d.name}!`, d.bonus, 2200, 'gold'); render(); }
            });
          }, 'small');
          b.disabled = (S.save.pul || 0) < CLASS_RULES.changePul;
          row.appendChild(classCard(d.name, [['muted', d.desc], ['', d.bonus]], b));
        }
        body.appendChild(row);
      }
      body.appendChild(UI.el('h3', '', c ? 'Sınıf değiştir' : 'Sınıflar'));
      const cost = S.classChangeCost();
      if (c) body.appendChild(UI.el('p', 'muted', cost ? `Değiştirmek ${cost} Lale Pulu (sende ${S.save.pul || 0}). Becerilerin ve eşyaların kaybolmaz; sadece Sınıf dalı ve alt sınıf sıfırlanır.` : 'İlk değişiklik ücretsiz. Becerilerin ve eşyaların kaybolmaz; sadece Sınıf dalı ve alt sınıf sıfırlanır.'));
      const row = UI.el('div', 'tree-row class-grid');
      for (const [k, d] of Object.entries(CLASSES)) {
        const mine = cl.c === k;
        let b = null;
        if (!mine) {
          b = UI.button(c ? 'Bu sınıfa geç' : 'Seç', () => {
            askClass(`${d.name} olacaksın.${c ? ' Sınıf dalındaki seçimlerin sıfırlanır.' : ''}`, () => {
              const first = !c;
              if (!S.pickClass(k)) return;
              // ilk secimde Lale sinif pelerini ve (yoksa) sinif silahini verir
              const gifts = [];
              const cape = `pelerin_${k}`;
              const owns = (id) => S.countItem(id) > 0 || Object.values(S.save.equip).includes(id) || S.save.depo.some((x) => x && x.id === id);
              if (!owns(cape)) { UI.giveNote(S.giveSafe(cape, 1)); gifts.push(ITEMS[cape].name); }
              const hasWpn = [...S.save.bag, ...S.save.depo, { id: S.save.equip.silah }].some((x) => x && x.id && ITEMS[x.id] && ITEMS[x.id].kind === 'silah' && d.wt.includes(ITEMS[x.id].wt || 'kilic'));
              if (!hasWpn) { UI.giveNote(S.giveSafe(d.start, 1)); gifts.push(ITEMS[d.start].name); }
              S.changed();
              sfx('levelup');
              UI.banner(`${d.name}!`, d.ult.name, 2200, 'gold');
              UI.feed(`<span style="color:#ffd04d">★ Sınıfın: ${d.name}. Büyük yeteneğin: ${d.ult.name}.${gifts.length ? ` Lale'nin hediyesi: ${gifts.join(', ')} (çantanda).` : ''}</span>`, 'gold');
              if (first) UI.feed('Yetenek Ağacı\'nın Sınıf dalında sınıfına özel yetenekler açıldı.');
              render();
            });
          }, 'small green');
          b.disabled = lvl < CLASS_RULES.unlock || (S.save.pul || 0) < cost;
        }
        const card = classCard(`${mine ? '✔ ' : ''}${d.name}`, [
          ['muted', d.desc],
          ['', `Silahı: ${d.gear} · ${d.bonus}`],
          ['', `★ ${d.ult.name}: ${d.ult.desc}`],
          ['muted', `Alt sınıflar: ${d.subs.map((x) => SUBCLASSES[x].name).join(', ')}`],
        ], b);
        if (mine) card.classList.add('picked');
        row.appendChild(card);
      }
      body.appendChild(row);
      const r2 = UI.el('div', 'choice-row');
      r2.appendChild(UI.button('Yetenek Ağacı', () => openTree('savas'), 'small'));
      body.appendChild(r2);
    };
    render();
  }, { wide: true });
}

// ---------------------------------------------------------------- 1.0 Lale'nin hikayesi
const storyProg = (c) => Math.min(c.n, c.v(S.save) || 0);
export function storyReady() { const c = STORY[S.save.story.ch]; return !!c && storyProg(c) >= c.n; }
export function openStory(w) {
  UI.openPanel('Lale\'nin hikâyesi', (body) => {
    const render = () => {
      body.innerHTML = '';
      const ch = S.save.story.ch;
      const book = UI.el('div', 'story-book');
      STORY.forEach((c, i) => {
        const done = i < ch;
        const cur = i === ch;
        const el = UI.el('div', 'story-ch' + (done ? ' done' : cur ? ' cur' : ' locked'));
        el.appendChild(UI.el('div', 'sc-t', `${done ? '✓' : cur ? '▶' : '🔒'} Bölüm ${i + 1}${i === STORY.length - 1 ? ' (oyun sonrası)' : ''}: ${i <= ch ? c.t : '???'}`));
        if (cur) {
          for (const line of c.say) el.appendChild(UI.el('p', 'lale-says', `“${line}”`));
          const prog = storyProg(c);
          el.appendChild(UI.el('div', 'zf', `Hedef: ${c.goal} (${prog} / ${c.n})`));
          const bar = UI.el('div', 'qbar'); const fill = UI.el('div', 'qfill'); fill.style.width = `${(prog / c.n) * 100}%`; bar.appendChild(fill); el.appendChild(bar);
          const rw = [`${c.rw.gold} ${CURRENCY}`];
          if (c.rw.pul) rw.push(`${c.rw.pul} ${PUL}`);
          if (c.rw.item) rw.push(`${c.rw.item[1]} ${ITEMS[c.rw.item[0]].name}`);
          el.appendChild(UI.el('div', 'zf', `Ödül: ${rw.join(', ')}`));
          if (prog >= c.n) el.appendChild(UI.button('Ödülü al', () => {
            if (S.save.story.ch !== i) return;
            S.save.story.ch++;
            S.addGold(c.rw.gold);
            if (c.rw.pul) addPul(c.rw.pul);
            if (c.rw.item) UI.giveNote(S.giveSafe(c.rw.item[0], c.rw.item[1]));
            S.changed();
            sfx('levelup');
            UI.banner(`Bölüm ${i + 1} tamam!`, c.t, 2200, 'gold');
            UI.feed(`<span style="color:#ffd04d">★ Hikâye: "${c.t}" bitti! +${c.rw.gold} ${CURRENCY}${c.rw.pul ? `, +${c.rw.pul} ${PUL}` : ''}</span>`, 'gold');
            render();
          }, 'primary'));
        }
        book.appendChild(el);
        if (cur) setTimeout(() => el.scrollIntoView({ block: 'nearest' }), 30);
      });
      body.appendChild(book);
      if (ch >= STORY.length) body.appendChild(UI.el('p', 'lale-says', '“Bütün hikâye bitti. Sen olmasan Bonkit sönerdi. Hanımın kapısı sana her zaman açık!”'));
      if (S.save.ending) body.appendChild(UI.button('Jeneriği tekrar izle', () => openCredits(w, false), 'small'));
    };
    render();
  }, { wide: true });
}

// 1.0 jenerik
export function openCredits(w, first) {
  UI.openPanel('Son', (body) => {
    const box = UI.el('div', 'credits');
    const roll = UI.el('div', 'roll');
    const lines = [
      ['h', 'Bonkglemon'],
      ['p', 'Kadim Bonk uyandı. Kâbuslar dağıldı, Bonkit kristalleri yeniden parlıyor.'],
      ['p', 'Glemonlar sakinleşti. Han yine şarkılarla doldu.'],
      ['s', 'Fikir ve tasarım'], ['n', 'Eren (dunstable)'],
      ['s', 'Yol arkadaşları'], ['n', 'Chegn · Bonkgle'],
      ['s', 'Hancı'], ['n', 'Lale'],
      ['s', 'Kod ve çizim'], ['n', 'Claude'],
      ['s', 'Glemonlar'], ['n', `${Object.keys(GLEMONS).length} tür, hepsi bu dünyaya özgü`],
      ['s', 'Teşekkürler'], ['n', 'Oynadığın için!'],
      ['p', first ? '“Efsane” unvanını kazandın. Haritada Kadim zorluk açıldı.' : 'Macera Kadim zorlukta sürüyor…'],
    ];
    for (const [k, t] of lines) roll.appendChild(UI.el(k === 'h' ? 'h2' : 'div', 'cr-' + k, t));
    box.appendChild(roll);
    body.appendChild(box);
    // yazilar asagidan yukari akar, son satir gorununce durur
    requestAnimationFrame(() => {
      const H = box.clientHeight; const h = roll.scrollHeight;
      if (roll.animate) roll.animate([{ transform: `translateY(${H}px)` }, { transform: `translateY(${Math.min(0, H - h - 16)}px)` }], { duration: 22000, fill: 'forwards', easing: 'linear' });
    });
    body.appendChild(UI.button('Kapat', () => UI.closePanel(), 'primary'));
  }, { wide: true });
}
