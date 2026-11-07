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

function noise(dur, { vol = 0.15, freq = 1200, delay = 0, q = 1 } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
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
  boom: () => { noise(0.6, { freq: 220, vol: 0.3, q: 0.4 }); tone(70, 0.5, { slide: -30, vol: 0.14, type: 'sawtooth' }); },
};

export function sfx(name) {
  if (!enabled) return;
  try { (SFX[name] || SFX.click)(); } catch (e) { /* ses yoksa sessiz devam */ }
}

export function unlockAudio() { if (enabled) ac(); }

// ------------------------------------------------------------ muzik (Eren'in dosyalari)
// menu: karakter secim ekrani, enemyfight: her savas. Dongu halinde, ses kapaliysa calmaz.
// Tarayici ilk dokunustan once ses calmaya izin vermezse, ilk dokunusta baslar.
const MUSIC = {};
for (const k of ['menu', 'enemyfight', 'shop', 'day1', 'day2', 'night1', 'night2']) MUSIC[k] = `assets/music/${k}.mp3`;
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

function syncMusic() {
  for (const [key, a] of Object.entries(tracks)) {
    if (key !== want || !enabled) fadeTo(a, 0, 400, () => a.pause());
  }
  if (!want || !enabled) return;
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
}, true));

// testler icin
window.__music = () => ({ want, playing: Object.entries(tracks).filter(([, a]) => !a.paused).map(([k]) => k) });
