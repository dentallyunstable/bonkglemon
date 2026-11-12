// 0.10 Koru: 6 fidan yeri. Agaclar gercek zamanla buyur, baltayla kesilir.
// Agaclar da 16x16 bloklardan kurulur (kutuk + yaprak), Minecraft gibi.
import { GROUND_Y, ITEMS, TREES, GROVE_PLOTS, NAMES } from './data.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx } from './audio.js';
import { playAnim, moveTo, wait } from './anim.js';
import { TOD } from './art.js';
import { now as gNow } from './clock.js';

const LEAF = { mese: 'yaprak', hus: 'hus_yaprak', cam: 'cam_yaprak', kiraz: 'pembe_yaprak' };
const LOG = { mese: 'kutuk', hus: 'hus_kutuk', cam: 'cam_kutuk', kiraz: 'kiraz_kutuk' };
const SAP = Object.fromEntries(Object.entries(TREES).map(([k, t]) => [t.sap, k]));
const plotX = (i) => 52 + i * 56;

function grove() {
  if (!S.save.grove || !Array.isArray(S.save.grove.plots)) {
    // ilk giris: 3 buyumus mese, 3 bos yer
    S.save.grove = { plots: Array.from({ length: GROVE_PLOTS }, (_, i) => (i < 3 ? { k: 'mese', t0: 0 } : { k: null, t0: 0 })) };
  }
  return S.save.grove;
}
function growth(pl) { return pl.k ? Math.min(1, (gNow() - pl.t0) / TREES[pl.k].ms) : 0; }
export function axePower() { return Math.max(0, ...S.save.bag.filter(Boolean).map((s) => ITEMS[s.id].axe || 0)); }

export const GroveMixin = {
  async enterKoru() {
    UI.closePanel();
    if (this.busy || !this.home()) return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    this.goKoru();
    this.player.x = 12;
    await this.fade(false);
    await moveTo(this.player, 30, { speed: 95, anim: 'c_walk' });
    this.idle();
    this.busy = false;
    if (!S.save.flags.koru) { S.save.flags.koru = 1; UI.feed('Koru! Büyümüş ağaca dokun: baltayla keser, kütük, dal ve fidan alırsın. Boş yere fidan dikersin. Ağaçlar sen yokken de büyür.'); }
  },

  goKoru() {
    this.mode = 'koru';
    this.clearRoom();
    this.bg.setTexture(this.todBg('bg_plot'));
    grove();
    this.koruObjs = [];
    this.drawKoru();
    this.resetPlayer();
    this.applyTod();
    UI.setLocation(NAMES.koru); // K7
    UI.setActions([{ label: 'Eve dön', onClick: () => this.leaveKoru() }]);
  },

  drawKoru() {
    for (const o of this.koruObjs || []) o.destroy();
    for (const l of this.koruLabels || []) l.remove();
    this.koruObjs = [];
    this.koruLabels = [];
    const g = grove();
    g.plots.forEach((pl, i) => {
      const x = plotX(i);
      const add = (o) => { this.koruObjs.push(o); return o; };
      // fidan yeri: toprak kare
      add(this.add.image(x, GROUND_Y + 1, 'blocks', 'tarla').setOrigin(0.5, 0).setDepth(3).setScale(1, 0.5));
      const gr = growth(pl);
      let hit;
      if (!pl.k) {
        hit = add(this.add.rectangle(x, GROUND_Y - 10, 30, 22, 0xffffff, 0.001).setDepth(6));
      } else if (gr < 1) {
        const big = gr >= 0.4;
        if (!big) hit = add(this.add.image(x, GROUND_Y + 2, 'blocks', LEAF[pl.k]).setOrigin(0.5, 1).setDepth(5).setScale(0.5));
        else {
          // genc agac: 2 kutuk, 3x2 yaprak, yarim boy
          const s = 0.6; const B = 16 * s;
          for (let r = 0; r < 2; r++) add(this.add.image(x, GROUND_Y - r * B, 'blocks', LOG[pl.k]).setOrigin(0.5, 1).setDepth(4).setScale(s));
          for (let r = 0; r < 2; r++) for (let c = -1; c <= 1; c++) add(this.add.image(x + c * B, GROUND_Y - (2 + r) * B, 'blocks', LEAF[pl.k]).setOrigin(0.5, 1).setDepth(5).setScale(s));
          hit = add(this.add.rectangle(x, GROUND_Y - 2 * B, 3 * B, 4 * B, 0xffffff, 0.001).setDepth(6));
        }
      } else {
        // buyuk agac: 3 kutuk, 3x2 yaprak + tepe
        const B = 16;
        for (let r = 0; r < 3; r++) add(this.add.image(x, GROUND_Y - r * B, 'blocks', LOG[pl.k]).setOrigin(0.5, 1).setDepth(4));
        for (let r = 0; r < 2; r++) for (let c = -1; c <= 1; c++) add(this.add.image(x + c * B, GROUND_Y - (3 + r) * B, 'blocks', LEAF[pl.k]).setOrigin(0.5, 1).setDepth(5));
        add(this.add.image(x, GROUND_Y - 5 * B, 'blocks', LEAF[pl.k]).setOrigin(0.5, 1).setDepth(5));
        hit = add(this.add.rectangle(x, GROUND_Y - 48, 48, 96, 0xffffff, 0.001).setDepth(6));
      }
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.koruTap(i));
      const txt = !pl.k ? 'Boş' : gr >= 1 ? TREES[pl.k].name : `${TREES[pl.k].name} · ${Math.ceil((TREES[pl.k].ms * (1 - gr)) / 60000)} dk`;
      const l = UI.el('div', 'objlabel', txt);
      l.style.left = UI.pctX(x);
      l.style.top = UI.pctY(GROUND_Y - (!pl.k ? 30 : gr >= 1 ? 108 : gr >= 0.4 ? 56 : 30));
      UI.$('#floats').appendChild(l);
      this.koruLabels.push(l);
      this.labels.push(l);
    });
    for (const o of this.koruObjs) this.roomObjs.push(o);
    const T = TOD[this.tod];
    if (T && T.tint !== 0xffffff) for (const o of this.koruObjs) if (o.setTint) o.setTint(T.tint);
  },

  koruTick() {
    // dakikada bir buyume yazilarini ve buyuyen agaclari tazele
    if (this.mode !== 'koru' || this.busy || this.inBattleView) return;
    this.drawKoru();
  },

  async koruTap(i) {
    if (this.busy || UI.panelOpen() || this.mode !== 'koru') return;
    const pl = grove().plots[i];
    const x = plotX(i);
    if (!pl.k) { this.koruPlantMenu(i); return; }
    const gr = growth(pl);
    if (gr < 1) { UI.floatText(x, GROUND_Y - 40, `${Math.ceil((TREES[pl.k].ms * (1 - gr)) / 60000)} dk sonra büyür`, 'note'); return; }
    const t = TREES[pl.k];
    const axe = axePower();
    if (!axe) { UI.feed('Ağaç kesmek için balta gerekli. Üretim Masası: Tahta Balta (3 Tahta Kalas + 2 Dal).'); this.sulk(); return; }
    if (S.level('toplama') < t.lvl) { UI.floatText(x, GROUND_Y - 40, `Toplama ${t.lvl} gerekli`, 'note'); sfx('weak'); this.sulk(); return; }
    if (!S.fits(t.log)) { UI.floatText(x, GROUND_Y - 40, 'Çanta dolu!', 'note'); this.sulk(); return; }
    this.busy = true;
    this.walkTok++;
    const p = this.player;
    const standX = x - 22;
    await moveTo(p, standX, { speed: 95, anim: 'c_walk' });
    p.setFlipX(false);
    const hits = Math.max(2, 6 - axe * 2);
    for (let h = 0; h < hits; h++) {
      const sw = playAnim(p, 'c_mine', 1.3);
      await wait(this, 230);
      sfx('mine');
      this.chips(x - 6, GROUND_Y - 20, 'toprak', 3);
      this.tweens.add({ targets: this.koruObjs.filter((o) => Math.abs(o.x - x) < 30 && o.y < GROUND_Y + 1 && o.texture && o.texture.key === 'blocks'), x: '+=1', duration: 50, yoyo: true });
      await sw;
    }
    sfx('break');
    // agac devrilir
    const parts = this.koruObjs.filter((o) => Math.abs(o.x - x) < 30 && o.texture && o.texture.key === 'blocks' && o.y <= GROUND_Y);
    await new Promise((res) => this.tweens.add({ targets: parts, alpha: 0, y: '+=6', duration: 380, onComplete: res }));
    const logs = 3 + Math.floor(Math.random() * 3) + (axe >= 2 ? 1 : 0);
    const out = [[t.log, logs], ['dal', 1 + Math.floor(Math.random() * 2)]];
    if (Math.random() < 0.85) out.push([t.sap, 1 + (Math.random() < 0.25 ? 1 : 0)]);
    if (pl.k === 'mese' && Math.random() < 0.2) out.push(['bogurtlen', 1]);
    // 0.10.5: yapraklar da insa blogu olarak duser
    const leaf = { mese: 'yaprak_blogu', hus: 'hus_yaprak_blok', cam: 'cam_yaprak_blok', kiraz: 'pembe_yaprak' }[pl.k];
    if (leaf) out.push([leaf, 1 + Math.floor(Math.random() * 3)]);
    let y = GROUND_Y - 50;
    for (const [id, n] of out) {
      const left = S.addItem(id, n);
      if (left < n) UI.floatText(x, y, `+${n - left} ${ITEMS[id].name}`, 'info');
      if (left) UI.feed(`Çanta dolu! ${ITEMS[id].name} sığmadı.`);
      y -= 10;
    }
    UI.floatText(x, y - 4, `+${t.xp} XP`, 'good');
    S.save.stats.gathered++;
    S.save.stats.trees = (S.save.stats.trees || 0) + 1;
    pl.k = null; pl.t0 = 0;
    // ayni fidan cantadaysa otomatik yeniden dikilir
    const back = Object.entries(TREES).find(([, tt]) => tt === t)[0];
    if (S.removeItem(t.sap, 1) === 1) { pl.k = back; pl.t0 = gNow(); UI.feed(`${ITEMS[t.sap].name} yerine yeniden dikildi.`); }
    const ups = S.addXp({ toplama: t.xp });
    S.changed();
    this.idle();
    this.drawKoru();
    await this.levelUps(ups);
    this.busy = false;
  },

  koruPlantMenu(i) {
    const saps = Object.keys(SAP).filter((id) => S.countItem(id) > 0);
    if (!saps.length) { UI.feed('Dikecek fidanın yok. Ağaç kesince fidan düşer; Hancı Lale de satar.'); this.sulk(); return; }
    UI.openPanel('Fidan dik', (body) => {
      body.appendChild(UI.el('p', 'muted', 'Hangi fidanı dikelim? Ağaçlar oyunda olmasan da büyür.'));
      for (const id of saps) {
        const t = TREES[SAP[id]];
        const row = UI.el('div', 'shop-row');
        row.appendChild(UI.icon(ITEMS[id].icon));
        row.appendChild(UI.el('div', 'shop-nm', `${ITEMS[id].name} ×${S.countItem(id)} · ${Math.round(t.ms / 60000)} dk · Toplama ${t.lvl}`));
        const ok = S.level('toplama') >= t.lvl;
        const b = UI.button(ok ? 'Dik' : `Toplama ${t.lvl}`, () => {
          if (!ok || S.removeItem(id, 1) < 1) return;
          const pl = grove().plots[i];
          pl.k = SAP[id]; pl.t0 = gNow();
          S.changed();
          UI.closePanel();
          sfx('gather');
          this.drawKoru();
          playAnim(this.player, 'c_placeblock', 1.4).then(() => this.idle());
        }, ok ? 'small primary' : 'small');
        b.disabled = !ok;
        row.appendChild(b);
        body.appendChild(row);
      }
    });
  },

  async leaveKoru() {
    if (this.busy || this.mode !== 'koru') return;
    this.busy = true;
    UI.setActions([]);
    this.player.setFlipX(true);
    await moveTo(this.player, -12, { speed: 190, anim: 'c_sprint' });
    await this.fade(true);
    this.koruObjs = null; this.koruLabels = null;
    this.goBase('koru');
    await this.fade(false);
    this.busy = false;
  },
};

