// Paneller: canta + ekipman, depo, beceriler, profil karti, harita.
import { ITEMS, SLOTS, SKILLS, ZONES, BAG_SIZE, RARITY, SETS, VERSION } from './data.js';
import { S, xpForLevel } from './state.js';
import * as UI from './ui.js';
import { sfx, setSound } from './audio.js';
import { forgetLogin } from './login.js';

const KIND = { malzeme: 'Malzeme', tuketim: 'Tüketilebilir', silah: 'Silah', kask: 'Kask', gogus: 'Göğüslük', bot: 'Bot', tilsim: 'Tılsım' };

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
  if (it.heal) out.push(`Canın %${Math.round(it.heal * 100)}'ini doldurur`);
  if (it.set) out.push(`${SETS[it.set].name}: ${SETS[it.set].pieces} parça = +${SETS[it.set].hp} can`);
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
      const setHp = S.setBonusHp();
      st.innerHTML = `<b>Can</b> ${S.hp}/${S.maxHp()} &nbsp; <b>Saldırı</b> ${S.atk()} &nbsp; <b>Savunma</b> ${S.def()}<br><b>Hız</b> ${S.spd()} &nbsp; <b>Kritik</b> %${Math.round(S.crit() * 100)}${setHp ? ` &nbsp; <b>Set</b> +${setHp} can` : ''}`;
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
            if (S.equipFromBag(sel.i)) { sfx('chest'); sel = { equip: it.kind }; }
            render();
          }, 'primary small');
          b.disabled = inBattle || !S.canEquip(id);
          btns.push(b);
        }
        if (it.kind === 'tuketim') {
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
        <b>Saldırı</b> ${S.level('saldiri')} · <b>Savunma</b> ${S.level('savunma')} · <b>Can</b> ${S.level('can')} &nbsp; <b>Bonk:</b> ${S.save.gold}<br>
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
    for (const z of ZONES) {
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
    body.appendChild(UI.el('p', 'muted', 'Her 5 katta bir kısayol açılır. Kat 5\'te ara patron, Kat 10\'da Ağaçbaşı seni bekliyor.'));
  });
}
