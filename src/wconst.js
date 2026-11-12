// K4 (1.0.21): world.js ve parcalarinin (plot, pond, dungeon) ortak sabitleri.
export const PLAYER_HOME = 96;
export const WALK_MODES = ['plot', 'koru'];
// 1.0.5 ev = arsa: soldan patika, kamp atesi, istasyonlar; insa alani YARD_W'den baslar
export const YARD_W = 336;
// 1.0.23 (Eren): istasyonlar tek bir acik hava atolyesinde yan yana (ATOLYE: atolyenin sol ve sag kenari)
export const YX = { tabela: 22, ates: 68, silahlik: 104, masa: 127, firin: 151, kazan: 173, yem: 197, ors: 222, zirh: 245, depo: 268, heykel: 316, tuccar: 44 };
export const ATOLYE = [92, 284];
export const SIT_AFTER = 20000; // bu kadar hareketsiz kalinca oturur
export const SPRINT_DIST = 150; // bundan uzaga dokununca kosar

export function weighted(list) {
  const tot = list.reduce((t, [, w]) => t + w, 0);
  let r = Math.random() * tot;
  for (const [k, w] of list) { r -= w; if (r < 0) return k; }
  return list[0][0];
}
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
