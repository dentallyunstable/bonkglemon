// Giris ekrani: herkes sadece kendi karakterini, kendi koduyla secebilir.
import { CHARACTERS, VERSION } from './data.js';
import { $, el, button, domSprite } from './ui.js';
import { hasSave } from './state.js';
import { sfx, unlockAudio, playMusic } from './audio.js';

const REMEMBER_KEY = 'bonkglemon.remember';

function store(key, val) {
  try { if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, val); } catch (e) { /* gizli sekme */ }
}
function read(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

// Kodu tek bicime getir: "dnst tvhz" -> "DNST-TVHZ"
export function normalizeCode(s) {
  const c = String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return c.length === 8 ? c.slice(0, 4) + '-' + c.slice(4) : c;
}

export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(bytes);
}

// crypto.subtle olmayan (https olmayan) sayfalar icin kucuk SHA-256
function sha256Fallback(bytes) {
  const K = [];
  const H = [];
  let n = 2; let found = 0;
  const frac = (x) => ((x - Math.floor(x)) * 4294967296) | 0;
  while (found < 64) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
    if (prime) { if (found < 8) H[found] = frac(Math.pow(n, 1 / 2)); K[found] = frac(Math.pow(n, 1 / 3)); found++; }
    n++;
  }
  const l = bytes.length;
  const withPad = new Uint8Array(((l + 9 + 63) >> 6) << 6);
  withPad.set(bytes); withPad[l] = 0x80;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 4, l * 8);
  const w = new Int32Array(64);
  const rotr = (x, r) => (x >>> r) | (x << (32 - r));
  for (let off = 0; off < withPad.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
  }
  return H.map((x) => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

export function forgetLogin() { store(REMEMBER_KEY, null); }

export function showLogin(charMeta, onLogin) {
  playMusic('menu');
  const root = $('#login');
  root.innerHTML = '';
  root.classList.remove('hidden');

  root.appendChild(el('div', 'logo', 'Bonkglemon'));
  root.appendChild(el('div', 'logo-sub', 'Karakterini seç ve kendi kodunla gir'));

  const remembered = read(REMEMBER_KEY);
  let selected = null;

  const cards = el('div', 'chars');
  const codeBox = el('div', 'code-box');

  const enter = (char) => {
    unlockAudio();
    sfx('levelup');
    root.classList.add('hidden');
    root.innerHTML = '';
    onLogin(char);
  };

  for (const c of CHARACTERS) {
    const card = el('button', 'char-card');
    // giris ekraninda karakterler yavasca doner (turn)
    const meta = charMeta[c.key]['front/turn'];
    card.appendChild(domSprite(`assets/chars/${c.key}/front/turn.png`, meta, 1.15));
    card.appendChild(el('div', '', c.name));
    if (hasSave(c.key)) card.appendChild(el('div', 'muted', 'kayıt var'));
    card.addEventListener('click', () => {
      sfx('click');
      selected = c;
      for (const x of cards.children) x.classList.remove('sel');
      card.classList.add('sel');
      if (remembered === c.key) { enter(c.key); return; }
      renderCode();
    });
    cards.appendChild(card);
  }
  root.appendChild(cards);
  root.appendChild(codeBox);

  function renderCode() {
    codeBox.innerHTML = '';
    if (!selected) {
      codeBox.appendChild(el('div', 'muted', remembered
        ? `Bu cihaz ${remembered} olarak hatırlanıyor: kartına dokun.`
        : 'Kodunu arkadaşından (Eren) al. Her kod sadece bir karaktere açılır.'));
      return;
    }
    codeBox.appendChild(el('div', '', `${selected.name} için kod:`));
    const row = el('div', 'code-row');
    const input = el('input', 'code-input', null, { maxlength: '12', placeholder: 'XXXX-XXXX', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
    row.appendChild(input);
    const err = el('div', 'code-err', '');
    const rem = el('label', 'remember');
    const cb = el('input', '', null, { type: 'checkbox' });
    cb.checked = true;
    rem.appendChild(cb); rem.appendChild(document.createTextNode('Bu cihazda beni hatırla'));
    const go = async () => {
      const code = normalizeCode(input.value);
      const h = await sha256Hex(code);
      if (h === selected.hash) {
        if (cb.checked) store(REMEMBER_KEY, selected.key); else store(REMEMBER_KEY, null);
        enter(selected.key);
      } else {
        sfx('hurt');
        err.textContent = 'Bu kod bu karaktere ait değil.';
        input.select();
      }
    };
    row.appendChild(button('Gir', go, 'primary'));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    codeBox.appendChild(row);
    codeBox.appendChild(rem);
    codeBox.appendChild(err);
    setTimeout(() => input.focus(), 50);
  }
  renderCode();

  root.appendChild(el('div', 'version', `sürüm ${VERSION}`));
}
