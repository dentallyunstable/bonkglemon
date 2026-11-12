// Basit sentez ses efektleri (dosya gerekmez). Profil'den kapatilabilir.
let ctx = null;
let enabled = true;

export function setSound(on) { enabled = on; syncMusic(); }

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'square', vol = 0.12, slide = 0, delay = 0 } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

const noiseCache = {};
function noise(dur, { vol = 0.15, freq = 1200, delay = 0, q = 1 } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  // ayni uzunluktaki gurultu bir kez uretilir (her vurusta yeniden hesaplanmaz)
  let buf = noiseCache[dur];
  if (!buf) {
    const len = Math.floor(a.sampleRate * dur);
    buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    noiseCache[dur] = buf;
  }
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination);
  s.start(t);
}

const SFX = {
  click: () => tone(660, 0.05, { vol: 0.06 }),
  hit: () => { noise(0.08, { freq: 900, vol: 0.2 }); tone(160, 0.08, { slide: -80, vol: 0.1 }); },
  crit: () => { noise(0.1, { freq: 1600, vol: 0.22 }); tone(330, 0.07); tone(660, 0.1, { delay: 0.05 }); },
  perfect: () => { tone(784, 0.06, { vol: 0.1 }); tone(1046, 0.1, { delay: 0.05, vol: 0.1 }); },
  weak: () => tone(220, 0.08, { vol: 0.06, type: 'triangle' }),
  hurt: () => { noise(0.12, { freq: 500, vol: 0.2 }); tone(220, 0.15, { slide: -120, vol: 0.1 }); },
  dodge: () => noise(0.18, { freq: 2400, vol: 0.12, q: 0.6 }),
  coin: () => { tone(988, 0.06, { vol: 0.07 }); tone(1318, 0.12, { delay: 0.06, vol: 0.07 }); },
  drop: () => { tone(523, 0.07, { vol: 0.08 }); tone(784, 0.09, { delay: 0.07, vol: 0.08 }); },
  rare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { delay: i * 0.08, vol: 0.09 })),
  levelup: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, { delay: i * 0.09, vol: 0.09, type: 'triangle' })),
  heal: () => [440, 554, 659].forEach((f, i) => tone(f, 0.12, { delay: i * 0.07, vol: 0.07, type: 'sine' })),
  chest: () => { tone(330, 0.08, { vol: 0.08 }); tone(494, 0.1, { delay: 0.08, vol: 0.08 }); },
  jump: () => tone(300, 0.15, { slide: 300, vol: 0.07, type: 'triangle' }),
  warn: () => { tone(880, 0.06, { vol: 0.08 }); tone(880, 0.06, { delay: 0.1, vol: 0.08 }); },
  roar: () => { tone(90, 0.6, { type: 'sawtooth', slide: -40, vol: 0.12 }); noise(0.5, { freq: 300, vol: 0.12 }); },
  death: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.2, { delay: i * 0.15, vol: 0.08, type: 'triangle' })),
  win: () => [523, 659, 784].forEach((f, i) => tone(f, 0.12, { delay: i * 0.1, vol: 0.08 })),
  stairs: () => [400, 340, 280, 220].forEach((f, i) => tone(f, 0.08, { delay: i * 0.07, vol: 0.06, type: 'triangle' })),
  vanish: () => tone(200, 0.5, { slide: 900, vol: 0.06, type: 'sine' }),
  mine: () => { noise(0.06, { freq: 2600, vol: 0.14, q: 2 }); tone(140, 0.05, { vol: 0.06, type: 'triangle' }); },
  break: () => { noise(0.16, { freq: 700, vol: 0.2 }); tone(110, 0.12, { slide: -50, vol: 0.08, type: 'triangle' }); },
  gather: () => { noise(0.1, { freq: 3000, vol: 0.08, q: 0.7 }); tone(660, 0.08, { delay: 0.06, vol: 0.06, type: 'sine' }); },
  craft: () => { noise(0.05, { freq: 1800, vol: 0.12 }); noise(0.05, { freq: 1800, vol: 0.12, delay: 0.12 }); tone(784, 0.12, { delay: 0.22, vol: 0.07 }); },
  smelt: () => { noise(0.3, { freq: 400, vol: 0.08, q: 0.5 }); tone(523, 0.1, { delay: 0.2, vol: 0.06, type: 'sine' }); },
  // 0.10 maden kuyusu
  fire: () => { noise(0.25, { freq: 500, vol: 0.12, q: 0.5 }); tone(180, 0.2, { slide: 60, vol: 0.05, type: 'sawtooth' }); },
  splash: () => { noise(0.2, { freq: 1400, vol: 0.12, q: 0.6 }); tone(520, 0.1, { slide: -200, vol: 0.05, type: 'sine' }); },
  place: () => { noise(0.05, { freq: 900, vol: 0.14, q: 1.5 }); tone(260, 0.06, { vol: 0.06, type: 'triangle' }); },
  boom: () => { noise(0.6, { freq: 220, vol: 0.3, q: 0.4 }); tone(70, 0.5, { slide: -30, vol: 0.14, type: 'sawtooth' }); },
};

export function sfx(name) {
  if (!enabled) return;
  try { (SFX[name] || SFX.click)(); } catch (e) { /* ses yoksa sessiz devam */ }
}

export function unlockAudio() { if (enabled) ac(); }

// ------------------------------------------------------------ muzik (Eren'in dosyalari)
// menu: karakter secim ekrani, enemyfight: her savas, boss: patron savaslari (Eren, 0.8.9). Dongu halinde, ses kapaliysa calmaz.
// Tarayici ilk dokunustan once ses calmaya izin vermezse, ilk dokunusta baslar.
const MUSIC = {};
for (const k of ['menu', 'enemyfight', 'boss', 'shop', 'day1', 'day2', 'night1', 'night2']) MUSIC[k] = `assets/music/${k}.mp3`;
const MUSIC_VOL = 0.45;
const tracks = {};
let want = null;     // su an calmasi gereken parca
let fadeTimer = null;

function track(key) {
  if (!tracks[key]) {
    const a = new Audio(MUSIC[key]);
    a.loop = true; a.preload = 'auto'; a.volume = 0;
    tracks[key] = a;
  }
  return tracks[key];
}

function fadeTo(a, vol, ms, then) {
  const start = a.volume; const t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    a.volume = Math.max(0, Math.min(1, start + (vol - start) * k));
    if (k < 1) a._fade = requestAnimationFrame(step); else if (then) then();
  };
  cancelAnimationFrame(a._fade);
  step();
}

let hiddenPause = false; // sekme arkadayken muzik durur
export function pauseMusic(on) { hiddenPause = !!on; syncMusic(); }

function syncMusic() {
  for (const [key, a] of Object.entries(tracks)) {
    if (hiddenPause) { cancelAnimationFrame(a._fade); a.volume = 0; a.pause(); } // arka sekmede rAF calismaz: hemen durdur
    else if (key !== want || !enabled) fadeTo(a, 0, 400, () => a.pause());
  }
  // 1.0 bolge muzikleri sentezle calar
  if (!want || !enabled || hiddenPause || !SONGS[want]) synthStop();
  if (!want || !enabled || hiddenPause) return;
  if (SONGS[want]) { synthStart(want); return; }
  const a = track(want);
  const p = a.play();
  if (p && p.catch) p.catch(() => { /* izin yok: ilk dokunusu bekle */ });
  fadeTo(a, MUSIC_VOL, 600);
}

// restart: parca bastan baslasin mi (false: kaldigi yerden devam)
export function playMusic(key, restart = true) {
  if (want === key) { if (enabled && tracks[key] && tracks[key].paused) syncMusic(); return; }
  want = key;
  if (key && tracks[key] && restart) tracks[key].currentTime = 0;
  syncMusic();
}
export function currentMusic() { return want; }

export function stopMusic() { want = null; syncMusic(); }

// ilk dokunusta (tarayici izni) bekleyen muzigi baslat
['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => {
  if (want && enabled && tracks[want] && tracks[want].paused) syncMusic();
  if (want && enabled && SONGS[want] && !seq) { ac(); setTimeout(syncMusic, 50); }
}, true));

// testler icin
if (typeof __DEV__ === 'undefined' || __DEV__) window.__music = () => ({ want, synth: seq ? seq.key : null, playing: Object.entries(tracks).filter(([, a]) => !a.paused).map(([k]) => k) });

// ------------------------------------------------------------ 1.0 bolge muzikleri (dosyasiz, tarayicida calinir)
// Her bolgenin kendi gamı, hizi ve sesi var. Melodi sabit bir tohumdan uretilir: her acilista ayni sarki.
// Yapi: 4 akorlu dongu, 8 olcu (A A B A), her olcu 8 adim. Bas, arpej, melodi ve hafif davul.
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  hijaz: [0, 1, 4, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], harm: [0, 2, 3, 5, 7, 8, 11], mixo: [0, 2, 4, 5, 7, 9, 10],
  penta: [0, 2, 4, 7, 9, 12, 14],
};
// prog: akor kok derecesi (gam icinde), lead/bass/arp: dalga turu, echo: yanki, drum: 0-2
const SONGS = {
  z_orman: { root: 60, scale: 'major', bpm: 108, prog: [0, 3, 4, 0], lead: 'triangle', arp: 'square', echo: 0.15, drum: 1, seed: 11 },
  z_magara: { root: 57, scale: 'minor', bpm: 88, prog: [0, 5, 3, 4], lead: 'sine', arp: 'triangle', echo: 0.35, drum: 0, seed: 23 },
  z_col: { root: 62, scale: 'hijaz', bpm: 112, prog: [0, 1, 0, 6], lead: 'square', arp: 'triangle', echo: 0.12, drum: 2, seed: 37 },
  z_buz: { root: 64, scale: 'lydian', bpm: 84, prog: [0, 1, 4, 0], lead: 'sine', arp: 'sine', echo: 0.4, drum: 0, seed: 41 },
  z_kor: { root: 55, scale: 'harm', bpm: 132, prog: [0, 5, 3, 4], lead: 'sawtooth', arp: 'square', echo: 0.1, drum: 2, seed: 53 },
  z_golge: { root: 53, scale: 'dorian', bpm: 76, prog: [0, 3, 5, 4], lead: 'triangle', arp: 'sine', echo: 0.45, drum: 0, seed: 67 },
  z_cekirdek: { root: 62, scale: 'lydian', bpm: 96, prog: [0, 4, 5, 1], lead: 'sine', arp: 'triangle', echo: 0.4, drum: 1, seed: 79 },
  z_zindan: { root: 52, scale: 'minor', bpm: 100, prog: [0, 6, 5, 4], lead: 'square', arp: 'triangle', echo: 0.2, drum: 1, seed: 83 },
  z_kule: { root: 57, scale: 'mixo', bpm: 116, prog: [0, 6, 3, 0], lead: 'square', arp: 'square', echo: 0.18, drum: 2, seed: 97 },
  z_maden: { root: 50, scale: 'dorian', bpm: 92, prog: [0, 3, 0, 4], lead: 'triangle', arp: 'triangle', echo: 0.3, drum: 1, seed: 101 },
};
export const SYNTH_KEYS = Object.keys(SONGS);
const SYNTH_VOL = 2.4; // mp3 parcalarla ayni duyulsun
function srng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
// sarkiyi notalara cevir: [{step, m, dur, v, kind}]
function compose(sg) {
  const sc = SCALES[sg.scale];
  const deg = (d) => { const o = Math.floor(d / sc.length); return sg.root + sc[((d % sc.length) + sc.length) % sc.length] + 12 * o; };
  const r = srng(sg.seed);
  const motif = (chord) => { // bir olculuk melodi: guclu vuruslarda akor sesi
    const out = []; let d = chord + 7 + Math.floor(r() * 3);
    for (let i = 0; i < 8; i++) {
      if (i % 4 === 0) d = chord + 7 + [0, 2, 4][Math.floor(r() * 3)];
      else d += [-1, 1, 1, -1, 2, -2, 0][Math.floor(r() * 7)];
      const rest = i % 2 === 1 && r() < 0.35;
      out.push(rest ? null : d);
    }
    return out;
  };
  const A = sg.prog.map((c) => motif(c));
  const B = sg.prog.map((c) => motif(c + 2));
  const bars = [...A, ...A.map((m, i) => (i === 3 ? motif(sg.prog[3]) : m)), ...B, ...A];
  const prog = [...sg.prog, ...sg.prog, ...sg.prog.map((c) => c + 2), ...sg.prog];
  const notes = [];
  bars.forEach((bar, b) => {
    const ch = prog[b];
    bar.forEach((d, i) => {
      const step = b * 8 + i;
      if (d !== null) { const long = i < 7 && bar[i + 1] === null; notes.push({ step, m: deg(d), dur: long ? 2 : 1, v: 0.05, kind: 'lead' }); }
      notes.push({ step, m: deg(ch + [0, 2, 4, 2][i % 4] + 7), dur: 0.5, v: 0.018, kind: 'arp' });
      if (i % 4 === 0) notes.push({ step, m: deg(ch) - 12, dur: 3.5, v: 0.06, kind: 'bass' });
      if (sg.drum && i % 4 === 0) notes.push({ step, kind: 'kick' });
      if (sg.drum > 1 && i % 4 === 2) notes.push({ step, kind: 'hat' });
      if (sg.drum && i % 8 === 4) notes.push({ step, kind: 'snare' });
    });
  });
  return { notes, len: bars.length * 8 };
}
const composed = {};
let seq = null; // calan sarki: {key, t0, next, timer, out}
function synthStart(key) {
  const a = ac(); if (!a) return;
  if (seq && seq.key === key) return;
  synthStop();
  const sg = SONGS[key];
  const c = composed[key] || (composed[key] = compose(sg));
  const out = a.createGain(); out.gain.value = 0;
  out.gain.linearRampToValueAtTime(SYNTH_VOL, a.currentTime + 1.2);
  out.connect(a.destination);
  let fx = out;
  if (sg.echo) { // basit yanki
    const dl = a.createDelay(1); dl.delayTime.value = (60 / sg.bpm) * 0.75;
    const fb = a.createGain(); fb.gain.value = sg.echo;
    const mixIn = a.createGain();
    mixIn.connect(out); mixIn.connect(dl); dl.connect(fb).connect(dl); dl.connect(out);
    fx = mixIn;
  }
  const stepT = 60 / sg.bpm / 2;
  seq = { key, t0: a.currentTime + 0.1, next: 0, out, fx, stepT, c, sg };
  const tick = () => {
    if (!seq) return;
    const until = a.currentTime + 0.3;
    while (seq.t0 + seq.next * stepT < until) {
      const s = seq.next % c.len;
      const t = seq.t0 + seq.next * stepT;
      for (const n of c.notes) if (n.step === s) playNote(a, n, t, stepT, seq.sg, seq.out, seq.fx);
      seq.next++;
    }
  };
  tick();
  seq.timer = setInterval(tick, 100);
}
function playNote(a, n, t, stepT, sg, out, fxIn) {
  if (n.kind === 'kick' || n.kind === 'snare' || n.kind === 'hat') {
    if (n.kind === 'kick') {
      const o = a.createOscillator(); const g = a.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.09, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g).connect(out); o.start(t); o.stop(t + 0.17);
      return;
    }
    const dur = n.kind === 'hat' ? 0.04 : 0.12;
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(); s.buffer = buf;
    const f = a.createBiquadFilter(); f.type = n.kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = n.kind === 'hat' ? 6000 : 1800;
    const g = a.createGain(); g.gain.value = n.kind === 'hat' ? 0.025 : 0.05;
    s.connect(f).connect(g).connect(out); s.start(t);
    return;
  }
  const o = a.createOscillator(); const g = a.createGain();
  o.type = n.kind === 'lead' ? sg.lead : n.kind === 'arp' ? sg.arp : 'triangle';
  o.frequency.setValueAtTime(midi(n.m), t);
  const dur = n.dur * stepT;
  const vol = n.v * (o.type === 'square' || o.type === 'sawtooth' ? 0.55 : 1);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
  o.connect(g).connect(n.kind === 'bass' ? out : fxIn);
  o.start(t); o.stop(t + dur + 0.02);
}
function synthStop() {
  if (!seq) return;
  const s = seq; seq = null;
  clearInterval(s.timer);
  try {
    const a = ac();
    s.out.gain.cancelScheduledValues(a.currentTime);
    s.out.gain.setValueAtTime(s.out.gain.value, a.currentTime);
    s.out.gain.linearRampToValueAtTime(0, a.currentTime + 0.5);
    setTimeout(() => { try { s.out.disconnect(); } catch (e) { /* zaten kopuk */ } }, 2500);
  } catch (e) { /* ses yok */ }
}

// testler ve onizleme icin: sarkiyi sessizce bir ses tamponuna cal
if (typeof __DEV__ === 'undefined' || __DEV__) window.__renderSong = async (key, secs = 30) => {
  const sg = SONGS[key]; const c = compose(sg);
  const a = new OfflineAudioContext(1, 44100 * secs, 44100);
  const out = a.createGain(); out.gain.value = SYNTH_VOL; out.connect(a.destination);
  let fx = out;
  if (sg.echo) { const dl = a.createDelay(1); dl.delayTime.value = (60 / sg.bpm) * 0.75; const fb = a.createGain(); fb.gain.value = sg.echo; const mi = a.createGain(); mi.connect(out); mi.connect(dl); dl.connect(fb).connect(dl); dl.connect(out); fx = mi; }
  const stepT = 60 / sg.bpm / 2;
  for (let k = 0; k * stepT < secs; k++) for (const n of c.notes) if (n.step === k % c.len) playNote(a, n, k * stepT, stepT, sg, out, fx);
  const buf = await a.startRendering();
  return Array.from(buf.getChannelData(0));
};
