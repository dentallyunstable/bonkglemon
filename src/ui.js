// Ekran ustu arayuz (HTML): ust bilgi, eylem dugmeleri, paneller, yazilar.
import { sfx } from './audio.js';
import { GAME_W, GAME_H, ITEMS, RARITY } from './data.js';
import { iconUrl } from './art.js';

export const $ = (sel, root = document) => root.querySelector(sel);

// 1.1 cila: giveSafe sonucu (Depo'ya gitti / hic yer yok)
export function giveNote(r) {
  if (!r) return;
  if (r.depo) feed(`Çanta dolu: ${itemName(r.id, false)} ×${r.depo} Depo'ya kondu.`);
  if (r.lost) feed(`Çanta ve Depo dolu! ${itemName(r.id, false)} ×${r.lost} sığmadı.`);
}

export function el(tag, cls, text, attrs) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

export function button(label, onClick, cls = '') {
  const b = el('button', 'btn ' + cls, label);
  b.addEventListener('click', (ev) => { ev.stopPropagation(); sfx('click'); onClick(ev); });
  return b;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ui = () => $('#ui');

// oyun koordinatini (384x216) ekran yuzdesine cevir
// 0.10.5: kamera kayinca (arsa, maden) dunya koordinatli yazilar ekranda dogru yerde dursun
export const view = { x: 0, y: 0 };
export const pctX = (x) => (x / GAME_W) * 100 + '%';
export const pctY = (y) => (y / GAME_H) * 100 + '%';

// ------------------------------------------------------------ yazilar
export function floatText(x, y, text, cls = '') {
  const e = el('div', 'float ' + cls, text);
  e.style.left = pctX(x - view.x); e.style.top = pctY(y - view.y);
  $('#floats').appendChild(e);
  setTimeout(() => e.remove(), 1100);
}

export function bubble(x, y, html, ms = 2600, cls = '') {
  const e = el('div', 'bubble ' + cls);
  e.innerHTML = html;
  e.style.left = pctX(x - view.x); e.style.top = pctY(y - view.y);
  $('#floats').appendChild(e);
  setTimeout(() => e.classList.add('fade'), ms - 400);
  setTimeout(() => e.remove(), ms);
  return e;
}

export function feed(html, cls = '') {
  const box = $('#feed');
  const e = el('div', 'feed-msg ' + cls);
  e.innerHTML = html;
  box.appendChild(e);
  while (box.children.length > 5) box.firstChild.remove();
  setTimeout(() => e.classList.add('fade'), 5200);
  setTimeout(() => e.remove(), 6000);
}

export function banner(title, sub = '', ms = 1800, cls = '') {
  const b = $('#banner');
  b.className = 'show ' + cls;
  b.innerHTML = `<div class="b-title">${escapeHtml(title)}</div>` + (sub ? `<div class="b-sub">${escapeHtml(sub)}</div>` : '');
  clearTimeout(b._t);
  b._t = setTimeout(() => { b.className = ''; }, ms);
}

export function itemName(id, withTag = true) {
  const it = ITEMS[id];
  const r = RARITY[it.rarity];
  const tag = withTag && it.rarity !== 'siradan' ? ` <span class="tag" style="color:${r.color}">[${r.name}]</span>` : '';
  return `<span style="color:${r.color}">${escapeHtml(it.name)}</span>${tag}`;
}

export function icon(name, cls = 'ico') {
  const i = el('img', cls, null, { src: iconUrl(name), alt: '', draggable: 'false' });
  return i;
}

// ------------------------------------------------------------ eylem cubugu
export function setActions(list) {
  const bar = $('#actions');
  bar.innerHTML = '';
  for (const a of list) {
    if (!a) continue;
    const b = button(a.label, a.onClick, a.cls || '');
    if (a.disabled) b.disabled = true;
    if (a.hint) b.title = a.hint;
    bar.appendChild(b);
  }
}

export function setLocation(text) { $('#loc').textContent = text; }

// ------------------------------------------------------------ paneller
let panelClose = null;
let helpHook = null;
export function setHelpHook(fn) { helpHook = fn; }
export function openPanel(title, build, { wide = false, onClose = null } = {}) {
  closePanel();
  const wrap = $('#panel');
  wrap.innerHTML = '';
  wrap.className = 'show' + (wide ? ' wide' : '');
  const box = el('div', 'panel-box');
  const head = el('div', 'panel-head');
  head.appendChild(el('div', 'panel-title', title));
  const body = el('div', 'panel-body');
  // 1.0: "?" yardim dugmesi (konusu olan panellerde)
  const help = helpHook && helpHook(title);
  if (help) head.appendChild(button('?', () => help(body), 'help'));
  head.appendChild(button('✕', () => closePanel(), 'close'));
  box.appendChild(head); box.appendChild(body);
  wrap.appendChild(box);
  panelClose = onClose;
  build(body, box);
  wrap.onclick = (e) => { if (e.target === wrap) closePanel(); };
}

export function closePanel() {
  const wrap = $('#panel');
  if (!wrap.classList.contains('show')) return;
  wrap.className = '';
  wrap.innerHTML = '';
  const fn = panelClose; panelClose = null;
  if (fn) fn();
}

export function panelOpen() { return $('#panel').classList.contains('show'); }

// basit onay/secim kutusu
export function choice(title, text, options) {
  openPanel(title, (body) => {
    body.appendChild(el('p', 'choice-text', text));
    const row = el('div', 'choice-row');
    for (const o of options) row.appendChild(button(o.label, () => { closePanel(); o.onClick && o.onClick(); }, o.cls || ''));
    body.appendChild(row);
  });
}

// ------------------------------------------------------------ DOM sprite
// Karakter onizlemesi (giris ekrani, profil kartı) icin
const domSprites = new Set();
let domLoop = false;
export function domSprite(src, meta, scale = 2) {
  const d = el('div', 'dsprite');
  d.style.width = `calc(${meta.w * scale} * var(--u))`;
  d.style.height = `calc(${meta.h * scale} * var(--u))`;
  d.style.backgroundImage = `url(${src})`;
  d.style.backgroundSize = `calc(${meta.w * meta.frames * scale} * var(--u)) 100%`;
  const s = { d, meta, scale, i: 0, t: 0 };
  domSprites.add(s);
  if (!domLoop) {
    domLoop = true;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      for (const sp of domSprites) {
        if (!sp.d.isConnected) { if (sp.t > 2000) domSprites.delete(sp); sp.t += dt; continue; }
        sp.t += dt;
        const dur = sp.meta.durations[sp.i] || 200;
        if (sp.t >= dur) {
          sp.t = 0; sp.i = (sp.i + 1) % sp.meta.frames;
          sp.d.style.backgroundPosition = `${(sp.i / Math.max(1, sp.meta.frames - 1)) * 100}% 0`;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  return d;
}

export function show(sel, on = true) {
  const e = typeof sel === 'string' ? $(sel) : sel;
  if (e) e.classList.toggle('hidden', !on);
}

// zamanlama cubugu: 0.8 sn, ortaya yakin dokun
export function timingBar(title = 'VUR!', tip = 'Çizgi sarıdayken dokun (veya boşluk tuşu)') {
  return new Promise((resolve) => {
    const ov = $('#overlay');
    ov.innerHTML = '';
    ov.className = 'show';
    const box = el('div', 'timing');
    box.innerHTML = `<div class="lbl">${title}</div><div class="track"><div class="zone-good"></div><div class="zone-perfect"></div><div class="marker"></div></div><div class="tip">${tip}</div>`;
    ov.appendChild(box);
    const marker = box.querySelector('.marker');
    const t0 = performance.now();
    const DUR = 800;
    let done = false;
    const pos = () => Math.min(1, (performance.now() - t0) / DUR);
    const finish = (p) => {
      if (done) return;
      done = true;
      ov.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      marker.style.left = `calc(${p * 100}% - var(--u))`;
      const d = Math.abs(p - 0.5);
      const g = d <= 0.06 ? 'mukemmel' : d <= 0.2 ? 'iyi' : 'zayif';
      setTimeout(() => { ov.className = ''; ov.innerHTML = ''; }, 120);
      resolve(g);
    };
    const tick = () => {
      if (done) return;
      const p = pos();
      marker.style.left = `calc(${p * 100}% - var(--u))`;
      if (p >= 1) { finish(1); return; }
      requestAnimationFrame(tick);
    };
    const onDown = (ev) => { ev.preventDefault(); finish(pos()); };
    const onKey = (ev) => { if (ev.code === 'Space' || ev.key === 'Enter') { ev.preventDefault(); finish(pos()); } };
    ov.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(tick);
  });
}

// kacinma: 0.6 sn icinde dokun
// Kacinma (0.8.5, Eren): her saldirida ekranin rastgele bir yerinde "KAC!" dugmesi cikar,
// halka kuculup bitmeden dugmeye basmak gerekir. Dugmenin disina basmak iskalamaktir.
// ms: bir dugmenin suresi, count: arka arkaya kac dugme (patronlarda 2).
// Sonuc: 'kusursuz' (halkanin ilk yarisinda), true (kacindin) ya da false.
export function dodgePrompt(ms = 900, count = 1, label = 'KAÇ!') {
  return new Promise((resolve) => {
    const ov = $('#overlay');
    ov.innerHTML = '';
    ov.className = 'show dodging';
    let left = count;
    let perfect = true;
    let done = false;
    let timer = null;
    let lastX = -1;
    const finish = (res) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      ov.removeEventListener('pointerdown', onMiss);
      ov.className = ''; ov.innerHTML = '';
      resolve(res);
    };
    const onMiss = (ev) => { if (ev.target === ov) { ev.preventDefault(); finish(false); } };
    ov.addEventListener('pointerdown', onMiss);
    const spawn = () => {
      ov.innerHTML = '';
      // rastgele yer: ust bilgi cubuklari ve alttaki dugmelerden uzak; bir oncekiyle ust uste gelmesin
      let x;
      do { x = 14 + Math.random() * 72; } while (lastX >= 0 && Math.abs(x - lastX) < 18);
      lastX = x;
      const y = 22 + Math.random() * 46;
      const box = el('div', 'dodge' + (label !== 'KAÇ!' ? ' parry' : ''), count > 1 ? `${label} ${count - left + 1}/${count}` : label);
      box.style.left = x + '%';
      box.style.top = y + '%';
      const ring = el('div', 'ring');
      ring.style.animationDuration = ms + 'ms';
      box.appendChild(ring);
      ov.appendChild(box);
      const t0 = performance.now();
      box.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (done || box._hit) return; // 1.1 cila: ayni dugmeye iki kez basmak iki sayilmasin
        box._hit = true;
        if (performance.now() - t0 > ms * 0.5) perfect = false;
        clearTimeout(timer);
        left--;
        box.classList.add('hit');
        if (left <= 0) setTimeout(() => finish(perfect ? 'kusursuz' : true), 90);
        else setTimeout(spawn, 120);
      });
      timer = setTimeout(() => finish(false), ms);
    };
    spawn();
  });
}

export { ui };


// ------------------------------------------------------------ Glemon resmi (Ahir, Albüm)
// Turun resminden ilk kare (durma). sil: siyah siluet (henuz bulunmayanlar)
export function glemonImg(gmeta, key, stage = 0, shiny = false, scale = 2, sil = false) {
  const st = gmeta[key].stages[stage];
  // scale bir kutu da olabilir: {w, h} -> resim kutuya sigacak kadar buyur
  if (typeof scale === 'object') scale = Math.min(scale.w / st.w, scale.h / st.h);
  const d = el('div', 'gimg' + (sil ? ' sil' : ''));
  d.style.width = `calc(${st.w * scale} * var(--u))`;
  d.style.height = `calc(${st.h * scale} * var(--u))`;
  d.style.backgroundImage = `url(assets/glemons/${key}/${stage}.png)`;
  d.style.backgroundSize = `calc(${st.w * st.n * scale} * var(--u)) calc(${st.h * 2 * scale} * var(--u))`;
  d.style.backgroundPosition = `0 ${shiny ? '100%' : '0'}`;
  return d;
}
