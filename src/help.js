// 1.0 parca 2: ilk adimlar rehberi, "?" yardim kutulari, Rehber kitabi ve Ayarlar
import { S, SAVE_V } from './state.js';
import * as UI from './ui.js';
import { ITEMS, CURRENCY, VERSION } from './data.js';
import { sfx, setSound } from './audio.js';
import { forgetLogin } from './login.js';

// ---------------------------------------------------------------- Rehber kitabi
// Her konu birkac kisa paragraf. "?" dugmeleri de buradan okur.
export const GUIDE = [
  { k: 'temel', t: 'İlk adımlar', p: [
    'Oyun evinde, arsanda başlar. Evin solunda kamp ateşi ve çalışma istasyonları var: Üretim Masası (Üretim 1), Fırın (5), Yem Tezgâhı (10), Simya Kazanı (15) ve Örs (15). Daha soldaki Köy yolu tabelası (ya da Harita düğmesi) haritayı açar. Haritadaki yazılara dokununca oraya gidersin: surların içinde Köy Meydanı, Arsa, Ahır, Göl, Koru ve Maden; surların dışında Keşif, Zindan, Kule ve Etkinlik. Hancı Lale Köy Meydanında.',
    'Keşif\'te odadan odaya ilerlersin. Her bölgenin 5. katında ara patron, 10. katında bölge patronu var. 5 ve 10. katlarda kısayol açılır.',
    'İstediğin an "Eve dön" diyebilirsin, topladıkların güvende kalır. Bayılırsan o turda kazandıklarının yarısı gider.',
    'Lale\'nin görevleri her gün ve her hafta yenilenir. Lale Pulu sadece görevlerden ve etkinliklerden gelir.',
  ] },
  { k: 'savas', t: 'Savaş', p: [
    'Sağ alttaki düğmeyle Oto ve Manuel arasında geçersin. Oto fena değildir ama Manuel savaşta %20 daha fazla XP alırsın.',
    'Manuel savaşta saldırırken çubuk ortadayken basarsan güçlü vuruş yaparsın. Ekranda çıkan kaçınma düğmesine zamanında basarsan hasar almazsın.',
    'Glemonların başındaki küçük simge bir sonraki hamlelerini gösterir: "Alan!" hepsine vurur, "Güçlü" büyük vuruştur. Savun ile karşı vuruş yapabilirsin.',
    'Her Glemonun bir türü var. Kılıç, yay ve asa bazı türlere karşı güçlü, bazılarına karşı zayıftır. Albüm\'de her Glemonun zayıflığı yazar.',
  ] },
  { k: 'beceri', t: 'Beceriler', p: [
    'Her beceri 1\'den 99\'a çıkar. Saldırı, Savunma, Can, Okçuluk ve Büyü savaşta; Madencilik, Toplama, Üretim, Aşçılık, İnşa, Balıkçılık, Şans ve Glemon Bağı kendi işlerinde artar.',
    'Bir beceri 50 olunca Çırak Pelerini, 99 olunca o becerinin parlayan pelerini gelir. İlk 99\'unda evinin önüne altın bir heykelin dikilir.',
    '99\'dan sonra XP birikmeye devam eder ve 120\'ye kadar "sanal seviye" görünür. Bir beceride 120\'ye ulaşan Usta Pelerini kazanır.',
  ] },
  { k: 'uretim', t: 'Üretim ve istasyonlar', p: [
    'Üretim Masası silah, zırh ve alet yapar. Fırın cevheri külçeye çevirir ve yemek pişirir. Simya Kazanı iksir, Mutfak yemek, Yem Tezgâhı Glemon yemi yapar.',
    'Her tarif bir beceri seviyesi ister. Seviyen arttıkça "Ustalık!" şansı artar: ürettiğin eşya Nadir ya da Epik kalitede çıkabilir.',
    'Yemekler açlık doldurmaz, kısa süreli güç verir (Tok). Oyunda açlık ve eşya eskimesi yoktur.',
  ] },
  { k: 'esya', t: 'Eşyalar ve kalite', p: [
    'Silah ve zırhlar bazen ✦ Nadir ya da Epik kalitede düşer. Bunların ek özellikleri vardır (ör. +%5 kritik). Eşyaya dokununca hepsi görünür.',
    'Aynı setin 2 parçası küçük, tamamı büyük bir bonus verir. Örs\'te kuşandığın eşyayı +1\'den +5\'e kadar yükseltirsin, hiç başarısız olmaz.',
    'Örs\'te "Parçala" ile eski bir eşyayı bozup malzemesinin yarısını geri alırsın.',
    'Efsane silahlara 3 yol var: Üret (Yıldız), Düşür (Kadim: zor patronlar ve Kule) ve Topla (Şanlı: Lale\'nin Efsane Vitrini).',
  ] },
  { k: 'glemon', t: 'Glemonlar ve evcilleştirme', p: [
    'Bir Glemonun canı azalınca savaşta ona yem verebilirsin. Her bölgenin sevdiği bir basit yem ve bir özel yem vardır. Özel yem Nadir ve Epikleri de evcilleştirir.',
    'Evcil Glemonların savaşta yanında savaşır, seviye atlar ve evrimleşir. Ahır\'da onları beslersin, her gün malzeme toplarlar.',
    'Efsanevi yumurtalar çantanda taşınınca savaşlarla çatlar. Çok nadir parlak Glemonlar da vardır.',
  ] },
  { k: 'bolge', t: 'Bölgeler ve tehlikeler', p: [
    'Yabani Orman (1-10), Yankı Mağaraları (11-20), Kavurucu Çöl (21-30), Donmuş Zirve (31-40), Kor Diyarı (41-50), Gölge Boşluğu (51-60) ve Yıldız Çekirdeği (61-70).',
    'Her yeni bölge bir önceki patronu yenince ve yeterli Saldırı gücün olunca açılır.',
    'Gün vakti gerçek saate bağlı: 20:00-06:00 arası gece. Gece Glemonlar %15 güçlü ama %30 fazla XP ve eşya verir, gece Glemonları çıkar. Evdeki yatakta uyursan gece atlanır.',
    'Bazı bölgelerin tehlikesi var: Çölde Su Matarası, Zirvede sıcak çorba, Kor Diyarı\'nda Ateş Direnci İksiri, karanlık yerlerde Fener lazım. Çıkmadan önce Hazırlık ekranı söyler.',
  ] },
  { k: 'zindan', t: 'Zindan, Kule ve etkinlikler', p: [
    'Zindan her seferinde değişen, gittikçe zorlaşan katlardan oluşur. Rekorunu kırmaya çalış.',
    'Sonsuz Kule her hafta sıfırlanır. Her katın tuhaf bir kuralı vardır, her 10 katta bir haftalık sandık açılır.',
    'Etkinlik Kapısı\'nda süreli özel zindanlar ve Patron Koşusu var. Patron Günlüğü\'nden bir patronu Zor modda tekrar dövebilirsin.',
  ] },
  { k: 'sinif', t: 'Sınıflar ve yetenek ağacı', p: [
    'Bir savaş becerisi 20 olunca Lale\'den sınıf seçersin: Savaşçı, Nişancı, Büyücü ya da Destek. 50\'de alt sınıf açılır.',
    'Bir dalın becerilerinde her seviye atladığında o dala 1 yetenek puanı gelir. 1. sıradaki yetenekler kademe başı 1 puan, 2. sıradakiler 2 puan… diye gider. Bir dala puan harcadıkça yeni sıralar açılır. Hepsini alabilirsin; istersen Lale\'ye ücretle sıfırlatırsın.',
  ] },
  { k: 'insa', t: 'Ev, inşa ve diğer işler', p: [
    'Topladığın blokları evinin arsasına koyabilirsin. İnşa becerisi ve Ev Puanı böyle artar.',
    'Maden Kuyusu aşağı doğru sonsuzdur; madende bayılırsan o inişte kazdığın cevherlerin yarısı düşer. Koru\'da ağaç dikersin, Göl\'de balık tutarsın. Kamp ateşi, oyunu kapattığında 2 saate kadar küçük bir ödül biriktirir.',
  ] },
  { k: 'son', t: 'Hikâye ve oyun sonu', p: [
    'Lale\'nin hikâyesi 9 bölüm. Her bölüm bir hedef ve ödül verir. Son bölümde Yıldız Çekirdeği\'nin dibinde Kadim Bonk seni bekler.',
    'Kadim Bonk 3 aşamalıdır. Onu yenince jenerik akar, "Efsane" unvanı ve Kadim zorluk açılır.',
    'Kadim zorlukta Glemonlar daha güçlüdür ama daha çok XP ve eşya verir. Kadim Öz ile Örs\'te +5 yaparsın.',
  ] },
  { k: 'kayit', t: 'Kayıt ve yedek', p: [
    'Oyun bu cihazın tarayıcısına kendiliğinden kaydedilir. Ayrıca günde bir kez otomatik yedek alınır (son 3 yedek durur).',
    'Ayarlar\'dan "Yedeği indir" ile kaydını dosya olarak alabilirsin. Başka bir cihazda aynı karakterle girip "Yedeği yükle" dersen ilerlemen oraya taşınır.',
    'Sadece kendi karakterinin yedeği yüklenebilir. Giriş kodun yedekte yazmaz.',
  ] },
];
const GUIDE_BY = Object.fromEntries(GUIDE.map((g) => [g.k, g]));
// panel basligi (bas kismi) -> rehber konusu
const HELP = [
  ['Hancı Lale', 'temel'], ['Köy Meydanı', 'temel'], ['Köy Haritası', 'temel'], ['Lale\'nin görevleri', 'temel'], ['Lale\'nin hikâyesi', 'son'], ['Son', 'son'],
  ['Keşif', 'bolge'], ['Hazırlık', 'bolge'],
  ['Çanta', 'esya'], ['Depo', 'esya'], ['Örs', 'esya'], ['Efsane Vitrini', 'esya'],
  ['Beceriler', 'beceri'], ['Yetenek Ağacı', 'sinif'], ['Sınıflar', 'sinif'],
  ['Albüm', 'glemon'], ['Ahır', 'glemon'], ['Kuluçka', 'glemon'],
  ['Zindan', 'zindan'], ['Sonsuz Kule', 'zindan'], ['Etkinlik', 'zindan'], ['Patron', 'zindan'],
  ['Üretim Masası', 'uretim'], ['Fırın', 'uretim'], ['Simya', 'uretim'], ['Mutfak', 'uretim'], ['Yem Tezgâhı', 'uretim'],
  ['Ayarlar', 'kayit'],
];
export function helpFor(title) {
  const h = HELP.find(([p]) => String(title).startsWith(p));
  return h ? GUIDE_BY[h[1]] : null;
}
// panelin ustunde acilip kapanan kucuk yardim kutusu
function toggleHelp(g, body) {
  const old = body.querySelector(':scope > .help-box');
  if (old) { old.remove(); return; }
  const box = UI.el('div', 'help-box');
  box.appendChild(UI.el('div', 'hb-t', `? ${g.t}`));
  for (const p of g.p) box.appendChild(UI.el('p', '', p));
  box.appendChild(UI.button('Rehberin tamamı', () => openGuide(g.k), 'tiny'));
  body.prepend(box);
  body.scrollTop = 0;
}
UI.setHelpHook((title) => { const g = helpFor(title); return g ? (body) => toggleHelp(g, body) : null; });

export function openGuide(k = 'temel') {
  UI.openPanel('Rehber', (body) => {
    const render = () => {
      body.innerHTML = '';
      const wrap = UI.el('div', 'guide');
      const nav = UI.el('div', 'guide-nav');
      for (const g of GUIDE) nav.appendChild(UI.button(g.t, () => { k = g.k; render(); }, g.k === k ? 'tiny primary' : 'tiny'));
      wrap.appendChild(nav);
      const g = GUIDE_BY[k] || GUIDE[0];
      const page = UI.el('div', 'guide-page');
      page.appendChild(UI.el('h3', '', g.t));
      for (const p of g.p) page.appendChild(UI.el('p', '', p));
      if (k === 'temel' && S.save.tut) page.appendChild(UI.button(S.save.tut.done ? 'İlk adımları baştan göster' : 'İlk adımları göster', () => { resetTut(); UI.closePanel(); }, 'small green'));
      wrap.appendChild(page);
      body.appendChild(wrap);
    };
    render();
  }, { wide: true });
}

// ---------------------------------------------------------------- ilk adimlar
// Yeni oyuncuya sag ustte kucuk bir kart: siradaki adim. Yapinca kucuk odul ve sonraki adim.
export const TUT = [
  { t: 'Köy Haritasını aç', h: 'Evin solundaki Köy yolu tabelasına ya da Köy Haritası düğmesine dokun. Her yere haritadan gidilir.', v: (s) => s.tut.f.lale, gold: 20 },
  // D3 (1.0.18): once Tahta Kilic (baslangic cantasinda yeterli Dal var)
  { t: 'Tahta Kılıç yap', h: 'Evindeki Üretim Masası\'na dokun, Tahta Kılıç yap (Dal çantanda), sonra Çanta\'dan kuşan. Paslı Kılıç\'tan daha güçlü.', v: (s) => (s.stats.crafted || 0) >= 1 || (s.equip.silah && s.equip.silah !== 'pasli_kilic'), gold: 30 },
  { t: 'Keşfe çık', h: 'Harita > Keşif > Kat 1. Odadan odaya ilerle.', v: (s) => (s.stats.deepest || 0) >= 1, gold: 30 },
  { t: '3 Glemon yen', h: 'Savaşta Oto ya da Manuel seç. Manuel %20 daha çok XP verir.', v: (s) => s.stats.kills >= 3, gold: 40 },
  { t: 'Çantana bak', h: 'Alttaki Çanta düğmesi. Eşyaya dokununca ne işe yaradığı yazar.', v: (s) => s.tut.f.canta, gold: 20 },
  { t: 'Becerilerine bak', h: 'Alttaki Beceriler düğmesi. Her beceri 99\'a kadar çıkar.', v: (s) => s.tut.f.beceri, gold: 20 },
  { t: 'Hikâyenin 1. bölümünü bitir', h: 'Harita > Köy Meydanı > Hikâye. Bölüm 1 hedefi: Kat 3\'e in.', v: (s) => (s.story && s.story.ch) >= 1, gold: 100, item: ['iksir_k', 3] },
];
function tutState() {
  const s = S.save;
  if (!s.tut || typeof s.tut !== 'object') s.tut = { i: 0, done: false, hide: false, f: {} };
  if (!s.tut.f) s.tut.f = {};
  return s.tut;
}
// eski oyuncular ilk adimlari gormez
export function tutInit() {
  const t = tutState();
  if (!t.seen) { t.seen = true; if (S.save.stats.kills > 30) t.done = true; }
}
export function tutFlag(k) {
  if (!S.save) return;
  const t = tutState();
  if (t.done || t.f[k]) return;
  t.f[k] = true;
  S.changed();
}
function resetTut() { const t = tutState(); t.i = 0; t.done = false; t.hide = false; S.changed(); }
let tutBusy = false;
// HUD her yenilendiginde cagrilir
export function refreshTut(w) {
  const card = UI.$('#tut');
  if (!card || !S.save) return;
  const t = tutState();
  // tamamlanan adimlarin odulu (art arda bitenler tek tek)
  while (!t.done && TUT[t.i] && TUT[t.i].v(S.save) && !tutBusy) {
    const st = TUT[t.i];
    tutBusy = true;
    S.addGold(st.gold);
    if (st.item) UI.giveNote(S.giveSafe(st.item[0], st.item[1]));
    UI.feed(`<span style="color:#8ad08a">✓ İlk adım: ${UI.escapeHtml(st.t)} (+${st.gold} ${CURRENCY}${st.item ? `, ${st.item[1]} ${ITEMS[st.item[0]].name}` : ''})</span>`, 'good');
    sfx('coin');
    t.i++;
    if (t.i >= TUT.length) { t.done = true; UI.banner('İlk adımlar tamam!', 'Gerisi sende. Takılırsan alttaki Rehber\'e bak.', 2600, 'gold'); }
    tutBusy = false;
    S.persistSoon();
  }
  const show = !t.done && !t.hide && !(w && w.battle) && !UI.panelOpen();
  card.classList.toggle('hidden', !show);
  if (!show) return;
  const st = TUT[t.i];
  card.innerHTML = '';
  // M2 (1.0.19): ev disinda (maden, koru, gol, kesif) kucuk "1/7" rozeti; dokununca acilir
  const small = w && w.home && !w.home() && !card._open;
  card.classList.toggle('mini', !!small);
  if (small) {
    card.appendChild(UI.button(`İlk adım ${t.i + 1}/${TUT.length}`, () => { card._open = true; refreshTut(w); }, 'tiny tut-badge'));
    return;
  }
  if (w && w.home && w.home()) card._open = false;
  card.appendChild(UI.el('div', 'tut-h', `İlk adımlar ${t.i + 1}/${TUT.length}`));
  card.appendChild(UI.el('div', 'tut-t', st.t));
  card.appendChild(UI.el('div', 'tut-d', st.h));
  const x = UI.button('Gizle', () => { t.hide = true; S.changed(); UI.feed('İlk adımları Rehber\'den tekrar açabilirsin.'); }, 'tiny');
  card.appendChild(x);
  if (card._open) card.appendChild(UI.button('Küçült', () => { card._open = false; refreshTut(w); }, 'tiny'));
}

// ---------------------------------------------------------------- Ayarlar
export function applySettings() {
  const st = S.save && S.save.settings;
  const ui = UI.$('#ui');
  if (!st || !ui) return;
  ui.classList.toggle('fs-small', st.fs === 's');
  ui.classList.toggle('fs-big', st.fs === 'l');
  ui.classList.toggle('calm', !!st.calm);
}
const fmtDate = (t) => { const d = new Date(t); return `${d.toLocaleDateString('tr-TR')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
// claude.ai icinde dosya kaydetme 'downloads' izniyle olur; disarida (yerel test) normal indirme
async function saveFile(text) {
  const d = new Date();
  const filename = `bonkglemon-${S.save.char}-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  if (window.claude && window.claude.use) {
    const dl = await window.claude.use('downloads');
    if (dl) {
      try { await dl.save({ filename, data: text }); UI.feed('Yedek dosyası kaydedildi.'); } catch (e) {
        if (e && e.code === 'declined') UI.feed('Kaydetme iptal edildi.');
        else if (e && e.code === 'rate_limited') UI.feed('Biraz bekleyip tekrar dene.');
        else UI.feed('Dosya burada kaydedilemedi. "Metin olarak > Kopyala" ile yedeği alabilirsin.');
      }
      return;
    }
    UI.feed('Dosya burada kaydedilemedi. "Metin olarak > Kopyala" ile yedeği alabilirsin.');
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  UI.feed('Yedek dosyası indirildi.');
}
export function openSettings(w) {
  UI.openPanel('Ayarlar', (body) => {
    const render = () => {
      body.innerHTML = '';
      const st = S.save.settings;
      const row = (label, desc, ctl) => {
        const r = UI.el('div', 'set-row');
        const l = UI.el('div', 'set-l');
        l.appendChild(UI.el('div', 'set-n', label));
        if (desc) l.appendChild(UI.el('div', 'set-d', desc));
        r.appendChild(l);
        const c = UI.el('div', 'set-c');
        for (const b of ctl) c.appendChild(b);
        r.appendChild(c);
        body.appendChild(r);
      };
      const opt = (cur, val, label, fn) => UI.button(label, () => { fn(val); S.persist(); applySettings(); render(); }, cur === val ? 'small primary' : 'small off');
      body.appendChild(UI.el('h3', '', 'Oyun'));
      row('Ses', 'Vuruş, para ve düğme sesleri.', [opt(!!st.sound, true, 'Açık', (v) => { st.sound = v; setSound(v); }), opt(!!st.sound, false, 'Kapalı', (v) => { st.sound = v; setSound(v); })]);
      row('Ekran sarsıntısı', 'Güçlü vuruşlarda ekran sallanır.', [opt(st.shake !== false, true, 'Açık', (v) => { st.shake = v; }), opt(st.shake !== false, false, 'Kapalı', (v) => { st.shake = v; })]);
      row('Yazı boyutu', 'Menülerdeki ve düğmelerdeki yazılar.', [opt(st.fs || 'm', 's', 'Küçük', (v) => { st.fs = v; }), opt(st.fs || 'm', 'm', 'Normal', (v) => { st.fs = v; }), opt(st.fs || 'm', 'l', 'Büyük', (v) => { st.fs = v; })]);
      row('Sakin ekran', 'Yanıp sönen ve parlayan efektler azalır.', [opt(!!st.calm, false, 'Kapalı', (v) => { st.calm = v; }), opt(!!st.calm, true, 'Açık', (v) => { st.calm = v; })]);
      row('Savaş başlangıcı', 'Yeni savaşlar Oto mu Manuel mi başlasın.', [opt(!!st.auto, false, 'Manuel', (v) => { st.auto = v; }), opt(!!st.auto, true, 'Oto', (v) => { st.auto = v; })]);
      const t = tutState();
      row('İlk adımlar', t.done ? 'Hepsi bitti.' : `${t.i}/${TUT.length} adım bitti.`, [UI.button(t.done ? 'Baştan göster' : t.hide ? 'Göster' : 'Gizle', () => { if (t.done) resetTut(); else t.hide = !t.hide; S.changed(); render(); }, 'small')]);
      row('Rehber', 'Oyunun bütün kuralları kısa kısa.', [UI.button('Rehberi aç', () => openGuide('temel'), 'small blue')]);

      body.appendChild(UI.el('h3', '', 'Kayıt ve yedek'));
      body.appendChild(UI.el('p', 'muted', 'Kayıt bu cihazın tarayıcısında. Günde bir kez otomatik yedek alınır. Başka cihaza taşımak için yedeği indirip orada yükle.'));
      row('Yedeği indir', 'Kaydın bir dosya olarak bilgisayarına ya da telefonuna iner.', [UI.button('İndir', () => {
        saveFile(S.exportText());
      }, 'small green')]);
      const file = document.createElement('input');
      file.type = 'file'; file.accept = '.json,application/json'; file.style.display = 'none';
      file.onchange = () => {
        const f = file.files && file.files[0];
        if (!f) return;
        if (f.size > 4 * 1024 * 1024) { UI.feed('Bu dosya çok büyük, yedek olamaz.'); return; }
        const rd = new FileReader();
        rd.onload = () => {
          UI.choice('Yedeği yükle', 'Şu anki ilerlemenin yerine bu yedek gelecek. (Şu anki hali de otomatik yedeklenir, Ayarlar\'dan geri dönebilirsin.) Devam edilsin mi?', [
            { label: 'Yükle', cls: 'red', onClick: () => { const err = S.importText(String(rd.result)); if (err) { UI.feed(err); openSettings(w); } else location.reload(); } },
            { label: 'Vazgeç', onClick: () => openSettings(w) },
          ]);
        };
        rd.readAsText(f);
      };
      body.appendChild(file);
      row('Yedeği yükle', 'Daha önce indirdiğin dosyayı seç.', [UI.button('Dosya seç', () => file.click(), 'small')]);
      // dosya indirme engelliyse: metin olarak kopyala / yapistir
      row('Metin olarak', 'İndirme çalışmazsa yedeği metin olarak kopyalayıp bir yere (ör. not) yapıştırabilirsin.', [
        UI.button('Kopyala', () => {
          const text = S.exportText();
          const ta = UI.el('textarea', 'save-text');
          ta.value = text; ta.readOnly = true;
          body.querySelector('.save-text')?.remove();
          body.appendChild(ta);
          ta.focus(); ta.select();
          let ok = false;
          try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
          if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => UI.feed('Yedek metni kopyalandı.'), () => { if (!ok) UI.feed('Kopyalanamadı: alttaki kutudaki metni elle seçip kopyala.'); });
          else UI.feed(ok ? 'Yedek metni kopyalandı.' : 'Alttaki kutudaki metni elle seçip kopyala.');
          ta.scrollIntoView({ block: 'nearest' });
        }, 'small'),
        UI.button('Yapıştır', () => {
          body.querySelector('.save-text')?.remove();
          const box = UI.el('div', 'save-text');
          const ta = UI.el('textarea');
          ta.placeholder = 'Yedek metnini buraya yapıştır';
          box.appendChild(ta);
          box.appendChild(UI.button('Bu metinden yükle', () => {
            const text = ta.value.trim();
            if (!text) return;
            UI.choice('Yedeği yükle', 'Şu anki ilerlemenin yerine bu yedek gelecek. (Şu anki hali de otomatik yedeklenir.) Devam edilsin mi?', [
              { label: 'Yükle', cls: 'red', onClick: () => { const err = S.importText(text); if (err) { UI.feed(err); openSettings(w); } else location.reload(); } },
              { label: 'Vazgeç', onClick: () => openSettings(w) },
            ]);
          }, 'small green'));
          body.appendChild(box);
          ta.focus();
          box.scrollIntoView({ block: 'nearest' });
        }, 'small'),
      ]);
      const baks = S.backups();
      row('Otomatik yedekler', baks.length ? 'Bu cihazdaki son yedekler. Birine dönersen şu anki hali de yedeklenir.' : 'Henüz otomatik yedek yok.', baks.map((b) => UI.button(fmtDate(b.t), () => {
        UI.choice('Yedeğe dön', `${fmtDate(b.t)} tarihli yedeğe dönülsün mü? Ondan sonra kazandıkların gider.`, [
          { label: 'Dön', cls: 'red', onClick: () => { if (S.restoreBackup(b.t)) location.reload(); else { UI.feed('Bu yedek açılamadı.'); openSettings(w); } } },
          { label: 'Vazgeç', onClick: () => openSettings(w) },
        ]);
      }, 'tiny')));

      body.appendChild(UI.el('h3', '', 'Hesap'));
      row('Çıkış yap', 'Bu cihazdan çıkar. Tekrar girerken kodun gerekir. İlerlemen silinmez.', [UI.button('Çıkış yap', () => {
        UI.choice('Çıkış', 'Bu cihazdan çıkış yapılsın mı? Tekrar girerken kodun gerekecek. İlerlemen silinmez.', [
          { label: 'Çıkış yap', cls: 'red', onClick: () => { S.persist(); forgetLogin(); location.reload(); } },
          { label: 'Vazgeç', onClick: () => openSettings(w) },
        ]);
      }, 'small red')]);
      body.appendChild(UI.el('p', 'muted', `Bonkglemon · sürüm ${VERSION} · kayıt sürümü ${SAVE_V}`));
    };
    render();
  }, { wide: true });
}
