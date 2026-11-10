// Balikcilik (0.8.5): olta at, samandira batinca dokun, sonra yakalama cubugu.
// Dunya sahnesi (world.js) gol ekranini ve gol odalarini kurar, burasi bir atisi oynatir.
import { FISH, FISHING, WATERS, WATER_GLEMONS, ITEMS, fishXp, ZONE_CHEST } from './data.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx } from './audio.js';
import { playAnim, wait } from './anim.js';
import { POND, iconUrl } from './art.js';
import { fullMoon } from './goals.js';

const rand = (a, b) => a + Math.random() * (b - a);
function weighted(list) {
  const tot = list.reduce((t, [, w]) => t + w, 0);
  let r = Math.random() * tot;
  for (const [k, w] of list) { r -= w; if (r < 0) return k; }
  return list[0][0];
}

// olta ucunun dunyadaki yeri (karakter karesindeki fishTip pikselinden)
export function rodTip(world) {
  const p = world.player;
  const tip = world.charMeta.fishTip && world.charMeta.fishTip[p.frame.name];
  if (!tip) return { x: p.x + 20, y: p.y - 40 };
  const sx = p.flipX ? -p.scaleX : p.scaleX;
  return { x: p.x + (tip[0] - p.displayOriginX) * sx, y: p.y + (tip[1] - p.displayOriginY) * p.scaleY };
}

// secili yem: cantada yoksa "yok"a duser
export function currentBait() {
  const b = S.save.fishing.bait;
  if (b === 'solucan' && S.countItem('solucan') > 0) return 'solucan';
  if (b === 'parlak' && S.countItem('parlak_yem') > 0) return 'parlak';
  return 'yok';
}
export function cycleBait() {
  const order = ['yok', 'solucan', 'parlak'];
  let i = order.indexOf(S.save.fishing.bait);
  for (let k = 0; k < 3; k++) {
    i = (i + 1) % 3;
    const b = order[i];
    if (b === 'yok' || (b === 'solucan' && S.countItem('solucan') > 0) || (b === 'parlak' && S.countItem('parlak_yem') > 0)) break;
  }
  S.save.fishing.bait = order[i];
  S.changed();
}
export function baitLabel() {
  const b = currentBait();
  if (b === 'solucan') return `Yem: Solucan (${S.countItem('solucan')})`;
  if (b === 'parlak') return `Yem: Parlak (${S.countItem('parlak_yem')})`;
  return 'Yem: Yok';
}

// bu suda ne tutulabilir
export function fishOf(water) {
  // 0.9: Ay Isigi Sazani sadece dolunayda
  return Object.entries(FISH).filter(([, f]) => f.water === water && (!f.moon || fullMoon()));
}

// bir atista ne cikar: balik, sandik ya da Glemon
function roll(water, bait, auto) {
  const lvl = S.level('balikcilik');
  const rod = S.rod() || { rare: 1 };
  const all = fishOf(water);
  const ok = all.filter(([, f]) => f.lvl <= lvl && !f.legend);
  const legend = all.find(([, f]) => f.legend && f.lvl <= lvl);
  const r = Math.random();
  if (r < FISHING.chestChance) return { chest: true };
  if (lvl >= 15 && r < FISHING.chestChance + FISHING.glemonChance) return { glemon: weighted(WATER_GLEMONS) };
  const lmult = (bait === 'parlak' ? 2 : 1) * rod.rare * (S.perk ? S.perk('efsane_avcisi', 2, 1) : 1);
  if (legend && !auto && Math.random() < FISHING.legendChance * lmult) return { fish: legend[0] };
  if (!ok.length) return { fish: null };
  const rareMult = (bait === 'parlak' ? 1.8 : 1) * rod.rare;
  return { fish: weighted(ok.map(([k, f]) => [k, f.w * (f.rarity === 'nadir' ? rareMult : 1)])) };
}

// ------------------------------------------------------------ yakalama cubugu
// Basili tut: yesil kutu yukselir, birak: duser. Balik kutunun icindeyken cubuk dolar.
function reelGame(fishKey) {
  const f = FISH[fishKey];
  const lvl = S.level('balikcilik');
  const rod = S.rod() || { box: 0 };
  const extra = S.perk ? S.perk('genis_ag', 0.2, 0) : 0;
  const boxH = Math.max(0.16, Math.min(0.5, 0.3 * (1 + rod.box + extra) + lvl * 0.0008 - (f.diff - 1) * 0.022));
  const ease = Math.max(0.65, Math.min(1, 1 - (lvl - f.lvl) * 0.01));
  const speed = (0.35 + f.diff * 0.22) * ease;
  return new Promise((resolve) => {
    const ov = UI.$('#overlay');
    ov.innerHTML = '';
    ov.className = 'show fishing';
    const wrap = UI.el('div', 'reel');
    const zone = UI.el('div', 'zone');
    const fish = UI.el('img', 'fish');
    fish.src = iconUrl(ITEMS[fishKey].icon);
    const meter = UI.el('div', 'meter');
    const fill = UI.el('i');
    meter.appendChild(fill);
    wrap.append(zone, fish, meter);
    ov.appendChild(wrap);
    ov.appendChild(UI.el('div', 'reel-hint', 'Basılı tut: yeşil kutu yükselir. Balığı kutuda tut!'));
    zone.style.height = `${boxH * 100}%`;
    let hold = false;
    let boxY = 0; let boxV = 0;            // 0 = dip, 1 = tepe (kutunun alti)
    let fy = 0.3; let target = 0.5; let nextT = 0;
    let prog = 0.3;
    let last = performance.now();
    let done = false;
    let t = 0;
    const down = (e) => { e.preventDefault(); hold = true; };
    const up = () => { hold = false; };
    const key = (e) => { if (e.code === 'Space') { e.preventDefault(); hold = e.type === 'keydown'; } };
    ov.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    const finish = (won) => {
      if (done) return;
      done = true;
      ov.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
      setTimeout(() => { ov.className = ''; ov.innerHTML = ''; resolve(won); }, 250);
    };
    const step = (now) => {
      if (done) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      // kutu: basinca yukari ivme, birakinca yercekimi; kenarda seker
      boxV += (hold ? 2.6 : -2.2) * dt;
      boxV = Math.max(-1.4, Math.min(1.4, boxV));
      boxY += boxV * dt;
      if (boxY < 0) { boxY = 0; boxV = Math.abs(boxV) * 0.3; }
      if (boxY > 1 - boxH) { boxY = 1 - boxH; boxV = -Math.abs(boxV) * 0.3; }
      // balik: rastgele hedefe yuzer; kivrak baliklar daha sik ve uzaga ziplar
      if (t > nextT) {
        nextT = t + rand(1.4, 2.6) / (0.6 + f.diff * 0.25);
        if (f.legend === 'dive' && Math.random() < 0.3) target = 0.02;
        else if (f.legend === 'dart' && Math.random() < 0.35) target = fy > 0.5 ? rand(0, 0.2) : rand(0.8, 1);
        else target = Math.max(0, Math.min(1, fy + rand(-0.5, 0.5) * (0.5 + f.diff * 0.12)));
      }
      const sp = speed * (f.legend && Math.abs(target - fy) > 0.5 ? 2.2 : 1);
      fy += Math.sign(target - fy) * Math.min(Math.abs(target - fy), sp * dt);
      fy += Math.sin(t * (3 + f.diff)) * 0.004 * f.diff;
      fy = Math.max(0, Math.min(1, fy));
      const inside = fy >= boxY - 0.02 && fy <= boxY + boxH + 0.02;
      prog += (inside ? 0.3 : -0.17 - f.diff * 0.015) * dt;
      zone.classList.toggle('on', inside);
      zone.style.bottom = `${boxY * 100}%`;
      fish.style.bottom = `calc(${fy * 100}% - var(--fh) / 2)`;
      fill.style.height = `${Math.max(0, Math.min(1, prog)) * 100}%`;
      if (prog >= 1) { sfx('perfect'); finish(true); return; }
      if (prog <= 0) { finish(false); return; }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// ------------------------------------------------------------ bir atis
// sonuc: { fish } | { chest } | { glemon } | null (kacti)
export async function castOnce(world) {
  const spot = world.fishSpot;
  const p = world.player;
  const auto = !!S.save.settings.auto;
  const bait = currentBait();
  const rod = S.rod() || { bite: 1 };
  const out = roll(spot.water, bait, auto);
  if (out.fish === null) {
    const min = Math.min(...fishOf(spot.water).map(([, f]) => f.lvl));
    UI.feed(`Burada tutabileceğin balık yok. Bu suyun ilk balığı Balıkçılık ${min} ister.`);
    world.sulk();
    return { nofish: true };
  }
  if (bait === 'solucan') S.removeItem('solucan', 1);
  if (bait === 'parlak') S.removeItem('parlak_yem', 1);
  // olta at
  p.setFlipX(false);
  await playAnim(p, 'c_fish_cast', 1);
  p.play('c_fish_idle');
  sfx('click');
  const tip = rodTip(world);
  const bob = world.add.image(tip.x, tip.y, 'bobber').setOrigin(0.5, 0.75).setDepth(11);
  world.fishBob = bob;
  const line = world.add.graphics().setDepth(11);
  world.fishLine = line;
  const draw = () => {
    if (!bob.active) return;
    const a = rodTip(world);
    line.clear();
    line.lineStyle(1, 0xe8e4dc, 0.85);
    line.beginPath();
    line.moveTo(a.x, a.y);
    const mx = (a.x + bob.x) / 2; const my = Math.max(a.y, bob.y - 6) + 10;
    for (let i = 1; i <= 10; i++) {
      const k = i / 10;
      line.lineTo((1 - k) * (1 - k) * a.x + 2 * (1 - k) * k * mx + k * k * bob.x, (1 - k) * (1 - k) * a.y + 2 * (1 - k) * k * my + k * k * (bob.y - 5));
    }
    line.strokePath();
  };
  world.events.on('update', draw);
  const cleanup = () => {
    world.events.off('update', draw);
    if (bob.active) bob.destroy();
    if (line.active) line.destroy();
    world.fishBob = null; world.fishLine = null;
  };
  await new Promise((res) => world.tweens.add({
    targets: bob, x: spot.bobX, duration: 520, ease: 'Sine.easeOut', onComplete: res,
  }));
  await new Promise((res) => world.tweens.add({ targets: bob, y: spot.surfY, duration: 520, ease: 'Bounce.easeOut', onComplete: res }));
  const bobIdle = world.tweens.add({ targets: bob, y: spot.surfY + 1, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const ripple = () => { const c = world.add.ellipse(bob.x, spot.surfY + 1, 6, 2).setStrokeStyle(1, 0xc4e0ee, 0.8).setDepth(10); world.tweens.add({ targets: c, scaleX: 3, scaleY: 2, alpha: 0, duration: 700, onComplete: () => c.destroy() }); };
  ripple();
  // bekle: samandira batinca dokun (erken dokunursan balik kacar)
  const biteMul = rod.bite * (bait === 'solucan' ? 0.6 : 1) * (S.perk ? S.perk('sabirli_olta', 0.7, 1) : 1);
  const biteMs = rand(FISHING.biteMs[0], FISHING.biteMs[1]) * biteMul;
  let hooked = false;
  if (auto) {
    await wait(world, biteMs);
    bobIdle.stop();
    bob.y = spot.surfY + 3; ripple(); sfx('warn');
    UI.floatText(bob.x, spot.surfY - 14, '!', 'warn');
    await wait(world, 300);
    hooked = true;
  } else {
    hooked = await new Promise((resolve) => {
      const ov = UI.$('#overlay');
      ov.innerHTML = '';
      ov.className = 'show fishwait';
      ov.appendChild(UI.el('div', 'reel-hint', 'Şamandıra batınca dokun!'));
      let bitten = false; let over = false;
      const timers = [];
      const end = (v) => {
        if (over) return; over = true;
        for (const tm of timers) clearTimeout(tm);
        ov.removeEventListener('pointerdown', tap); window.removeEventListener('keydown', keyTap);
        ov.className = ''; ov.innerHTML = '';
        resolve(v);
      };
      const tap = (e) => { e.preventDefault(); end(bitten ? true : 'erken'); };
      const keyTap = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(e); } };
      ov.addEventListener('pointerdown', tap);
      window.addEventListener('keydown', keyTap);
      // sahte kipirdamalar: samandira hafifce oynar ama batmaz
      for (let i = 0; i < 3; i++) {
        const at = rand(500, biteMs - 400);
        if (at > 0) timers.push(setTimeout(() => { if (!over && bob.active) { world.tweens.add({ targets: bob, y: spot.surfY + 1.5, duration: 90, yoyo: true }); ripple(); } }, at));
      }
      timers.push(setTimeout(() => {
        if (over || !bob.active) return;
        bitten = true;
        bobIdle.stop();
        bob.y = spot.surfY + 4;
        ripple(); ripple();
        sfx('warn');
        UI.floatText(bob.x, spot.surfY - 14, '!', 'warn');
        timers.push(setTimeout(() => end(false), FISHING.hookMs + Math.min(200, S.level('balikcilik') * 2)));
      }, biteMs));
    });
  }
  bobIdle.stop();
  if (hooked !== true) {
    cleanup();
    UI.feed(hooked === 'erken' ? 'Çok erken çektin, balık ürktü.' : 'Balık yemi alıp kaçtı!');
    world.sulk();
    return null;
  }
  // cek
  p.play('c_fish_reel');
  world.tweens.add({ targets: bob, y: spot.surfY + 2, x: bob.x - 2, duration: 120, yoyo: true, repeat: -1 });
  let won;
  if (out.chest || out.glemon) won = true;
  else if (auto) { await wait(world, 1600); won = Math.random() < FISHING.autoChance; }
  else won = await reelGame(out.fish);
  world.tweens.killTweensOf(bob);
  if (!won) {
    cleanup();
    UI.feed(`${FISH[out.fish].name} kaçtı!`);
    world.sulk();
    return null;
  }
  // yakalanan sey sudan oyuncuya ucar
  const a = rodTip(world);
  const what = out.fish ? ITEMS[out.fish].icon : out.chest ? 'chest' : null;
  if (what && what !== 'chest' && world.textures.exists('fishicon_' + out.fish) === false) {
    world.textures.addBase64('fishicon_' + out.fish, iconUrl(what));
    await new Promise((res) => world.textures.once('addtexture', res));
  }
  const key = out.fish ? 'fishicon_' + out.fish : out.chest ? 'chest' : null;
  if (key) {
    const fly = world.add.image(bob.x, spot.surfY, key).setDepth(12).setScale(out.chest ? 0.6 : 1);
    sfx('gather');
    await new Promise((res) => world.tweens.add({ targets: fly, x: p.x + 6, y: a.y - 6, duration: 520, ease: 'Quad.easeOut', onComplete: res }));
    world.tweens.add({ targets: fly, alpha: 0, y: fly.y - 8, duration: 300, onComplete: () => fly.destroy() });
  }
  cleanup();
  out.manual = !auto;
  return out;
}

// sandik ici: altin, deniz cami, (30+) gol incisi, bolge malzemesi
export function chestLoot(water) {
  const lvl = S.level('balikcilik');
  const loot = [];
  if (Math.random() < 0.45) loot.push(['deniz_cami', 1]);
  if (lvl >= 30 && Math.random() < 0.18) loot.push(['gol_incisi', 1]);
  const zc = ZONE_CHEST[water] || ZONE_CHEST.orman;
  loot.push([zc.mats[Math.floor(Math.random() * zc.mats.length)], 1 + Math.floor(Math.random() * 3)]);
  if (Math.random() < 0.3) loot.push(['solucan', 2 + Math.floor(Math.random() * 3)]);
  const gold = Math.round((10 + lvl * 1.5) * rand(0.8, 1.4));
  return { loot, gold };
}

export { fishXp, WATERS, POND };
