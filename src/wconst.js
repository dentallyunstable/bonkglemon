// K4 (1.0.21): world.js ve parcalarinin (plot, pond, dungeon) ortak sabitleri.
export const PLAYER_HOME = 96;
export const WALK_MODES = ['plot', 'koru'];
// 1.0.5 ev = arsa: soldan patika, kamp atesi, istasyonlar; insa alani YARD_W'den baslar
export const YARD_W = 336;
export const YX = { tabela: 22, ates: 68, masa: 120, firin: 158, kazan: 194, yem: 230, ors: 264, depo: 296, heykel: 322, tuccar: 44 };
export const SIT_AFTER = 20000; // bu kadar hareketsiz kalinca oturur
export const SPRINT_DIST = 150; // bundan uzaga dokununca kosar

export function weighted(list) {
  const tot = list.reduce((t, [, w]) => t + w, 0);
  let r = Math.random() * tot;
  for (const [k, w] of list) { r -= w; if (r < 0) return k; }
  return list[0][0];
}
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
