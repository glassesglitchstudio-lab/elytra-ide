/* Elytra AI — Antigravity tarzı sohbet merkezli arayüz (düz JavaScript)
 *
 * İKİ YÜZEY:
 *   1) BASLANGIC SAYFASI (elytra.baslangic) — sohbet merkezli ana ekran.
 *      Antigravity'deki gibi: ortada buyuk prompt kutusu, model secici,
 *      konusma gecmisi raili. Uygulama acilinca OTOMATIK acilir.
 *   2) KENAR CUBUGU (elytra.sohbetGorunum) — kalici sohbet paneli.
 *
 * Duz JS: derleme adimi YOK. Onceki surum TypeScript'ti, derlenmedigi icin
 * hic yuklenmiyordu.
 *
 * SAHTE CEVAP URETMEZ — gercek saglayici API'sine cagri yapar.
 */

const vscode = require('vscode');

const SAGLAYICILAR = {
	nous:       { url: 'https://inference-api.nousresearch.com/v1', ad: 'Nous Research' },
	openrouter: { url: 'https://openrouter.ai/api/v1',              ad: 'OpenRouter' },
	groq:       { url: 'https://api.groq.com/openai/v1',            ad: 'Groq' },
	deepseek:   { url: 'https://api.deepseek.com/v1',               ad: 'DeepSeek' },
	mistral:    { url: 'https://api.mistral.ai/v1',                 ad: 'Mistral' },
	cerebras:   { url: 'https://api.cerebras.ai/v1',                ad: 'Cerebras' },
	google:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai', ad: 'Google' },
};

/** Tum sohbetler — { id, baslik, mesajlar: [{role, content}] } */
let konusmalar = [];
let aktifId = null;
let aktifGorunum = undefined;    // kenar cubugu webview
let baslangicPaneli = undefined; // baslangic sayfasi webview

function ayar() {
	const c = vscode.workspace.getConfiguration('elytra');
	return {
		saglayici: c.get('saglayici', 'nous'),
		model: c.get('model', ''),
		anahtar: c.get('apiAnahtari', ''),
		sicaklik: c.get('sicaklik', 0.3),
		sistem: c.get('sistemMesaji', ''),
	};
}

function yeniKonusma() {
	const k = { id: String(Date.now()), baslik: 'Yeni konuşma', mesajlar: [] };
	konusmalar.unshift(k);
	aktifId = k.id;
	return k;
}

function aktif() {
	return konusmalar.find(k => k.id === aktifId) || yeniKonusma();
}

/** Gerçek API çağrısı. Hata olursa dürüst hata fırlatır. */
async function aiSor(mesajlar) {
	const a = ayar();
	if (!a.anahtar || !a.anahtar.trim()) {
		throw new Error('API anahtarı yok. "API Anahtarı Ayarla" komutunu çalıştır ya da anahtar düğmesine bas.');
	}
	const s = SAGLAYICILAR[a.saglayici];
	if (!s) { throw new Error('Bilinmeyen sağlayıcı: ' + a.saglayici); }

	const msgs = [];
	if (a.sistem && a.sistem.trim()) { msgs.push({ role: 'system', content: a.sistem }); }
	for (const m of mesajlar) { msgs.push({ role: m.role, content: m.content }); }

	const yanit = await fetch(s.url + '/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + a.anahtar.trim(),
		},
		body: JSON.stringify({ model: a.model, messages: msgs, max_tokens: 4096, temperature: a.sicaklik }),
	});
	if (!yanit.ok) {
		const metin = await yanit.text();
		throw new Error('API hatası (' + yanit.status + '): ' + metin.slice(0, 300));
	}
	const veri = await yanit.json();
	const icerik = veri && veri.choices && veri.choices[0] && veri.choices[0].message && veri.choices[0].message.content;
	if (!icerik) { throw new Error('Model boş yanıt döndü.'); }
	return icerik;
}

/** Sohbete mesaj gönder, sonucu iki yüzeye de yayınla. */
async function gonderVeYayinla(k, metin) {
	k.mesajlar.push({ role: 'user', content: metin });
	if (k.baslik === 'Yeni konuşma' && metin.length > 2) {
		k.baslik = metin.slice(0, 42) + (metin.length > 42 ? '…' : '');
	}
	try {
		const yanit = await aiSor(k.mesajlar);
		k.mesajlar.push({ role: 'assistant', content: yanit });
		yayinla({ tip: 'yanit', metin: yanit, konusmalar: konusmaOzeti() });
	} catch (e) {
		k.mesajlar.pop();
		yayinla({ tip: 'hata', metin: String((e && e.message) || e), konusmalar: konusmaOzeti() });
	}
}

function konusmaOzeti() {
	return konusmalar.map(k => ({ id: k.id, baslik: k.baslik, adet: k.mesajlar.length }));
}

/** Mesajı iki yüzeye de gönder. */
function yayinla(mesaj) {
	if (aktifGorunum) { try { aktifGorunum.webview.postMessage(mesaj); } catch (_) {} }
	if (baslangicPaneli) { try { baslangicPaneli.webview.postMessage(mesaj); } catch (_) {} }
}

// ─────────────────────────────────────────────────────────────
// Paylaşılan CSS
// ─────────────────────────────────────────────────────────────
const ORTAK_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  background:#141414;color:#e4e4e4;
  font-family:var(--vscode-font-family,"Segoe UI",system-ui,sans-serif);
  font-size:13px;overflow:hidden;
}
button{font-family:inherit;cursor:pointer}
`;

// ─────────────────────────────────────────────────────────────
// 1) BAŞLANGIÇ SAYFASI — sohbet merkezli ana ekran
// ─────────────────────────────────────────────────────────────
class BaslangicPaneli {
	static goster(context) {
		if (baslangicPaneli) { baslangicPaneli.reveal(vscode.ViewColumn.One); return; }

		const panel = vscode.window.createWebviewPanel(
			'elytraBaslangic',
			'Elytra',
			vscode.ViewColumn.One,
			{ enableScripts: true, retainContextWhenHidden: true }
		);
		baslangicPaneli = panel;
		panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'elytra.svg');
		panel.webview.html = BaslangicPaneli.html();

		panel.webview.onDidReceiveMessage(async (m) => {
			switch (m.tip) {
				case 'sor': {
					const k = m.id ? (konusmalar.find(x => x.id === m.id) || yeniKonusma()) : aktif();
					await gonderVeYayinla(k, m.metin);
					break;
				}
				case 'yeni': {
					const k = yeniKonusma();
					panel.webview.postMessage({ tip: 'konusma', id: k.id, mesajlar: [], konusmalar: konusmaOzeti() });
					break;
				}
				case 'ac': {
					const k = konusmalar.find(x => x.id === m.id);
					if (k) {
						aktifId = k.id;
						panel.webview.postMessage({ tip: 'konusma', id: k.id, mesajlar: k.mesajlar, konusmalar: konusmaOzeti() });
					}
					break;
				}
				case 'sil': {
					konusmalar = konusmalar.filter(x => x.id !== m.id);
					if (aktifId === m.id) { aktifId = konusmalar[0] ? konusmalar[0].id : null; }
					const k = aktifId ? konusmalar.find(x => x.id === aktifId) : yeniKonusma();
					panel.webview.postMessage({
						tip: 'konusma', id: k.id,
						mesajlar: k.mesajlar || [], konusmalar: konusmaOzeti(),
					});
					break;
				}
				case 'anahtar': vscode.commands.executeCommand('elytra.setKey'); break;
				case 'ayarlar': vscode.commands.executeCommand('workbench.action.openSettings', 'elytra'); break;
			}
		});

		panel.onDidDispose(() => { baslangicPaneli = undefined; });
	}

	static html() {
		const a = ayar();
		const sagAd = (SAGLAYICILAR[a.saglayici] || {}).ad || a.saglayici;
		return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
${ORTAK_CSS}
body{display:flex;height:100vh;background:#141414}

/* ── Sol rail ── */
#rail{width:238px;flex-shrink:0;border-right:1px solid #262626;
  display:flex;flex-direction:column;background:#171717}
#railUst{padding:14px 14px 10px;border-bottom:1px solid #262626}
#marka{font-size:15px;font-weight:700;letter-spacing:.3px;color:#fff;
  display:flex;align-items:center;gap:8px}
#marka .nokta{width:9px;height:9px;border-radius:50%;background:#4a9eff;box-shadow:0 0 10px #4a9eff}
#yeni{margin:12px 12px 6px;padding:9px 12px;border-radius:8px;border:1px solid #333;
  background:#1f1f1f;color:#e4e4e4;font-size:12.5px;text-align:left;
  display:flex;align-items:center;gap:8px;transition:background .12s}
#yeni:hover{background:#262626;border-color:#3d3d3d}
#railListe{flex:1;overflow-y:auto;padding:6px 8px}
#railListe .bos{color:#5c5c5c;font-size:11.5px;padding:12px 8px;text-align:center}
.oge{padding:8px 10px;border-radius:7px;font-size:12px;color:#a8a8a8;
  display:flex;align-items:center;gap:8px;margin-bottom:2px;transition:background .1s}
.oge:hover{background:#212121;color:#e4e4e4}
.oge.aktif{background:#232323;color:#fff}
.oge .ad{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
.oge .sil{opacity:0;background:none;border:none;color:#666;padding:0 3px;font-size:13px}
.oge:hover .sil{opacity:1}
.oge .sil:hover{color:#f48771}
#railAlt{padding:10px 12px;border-top:1px solid #262626;display:flex;gap:6px;flex-wrap:wrap}
.mini{background:none;border:1px solid #2e2e2e;color:#8a8a8a;border-radius:6px;
  padding:5px 9px;font-size:11px;transition:all .12s}
.mini:hover{background:#212121;color:#e4e4e4;border-color:#3d3d3d}

/* ── Orta alan ── */
#ana{flex:1;display:flex;flex-direction:column;min-width:0}
#ustbar{height:42px;flex-shrink:0;border-bottom:1px solid #262626;
  display:flex;align-items:center;padding:0 16px;gap:10px}
#ustbar .baslik{font-size:12.5px;color:#a8a8a8;flex:1;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── Sohbet ── */
#sohbet{flex:1;overflow-y:auto;padding:26px 0}
#sohbetIc{max-width:780px;margin:0 auto;padding:0 24px}
.mesaj{margin-bottom:20px;line-height:1.72;font-size:13.5px;
  white-space:pre-wrap;word-break:break-word}
.mesaj .etiket{font-size:10.5px;letter-spacing:.7px;font-weight:700;
  margin-bottom:6px;color:#5c5c5c;text-transform:uppercase}
.mesaj.kullanici .etiket{color:#4a9eff}
.mesaj.ai .etiket{color:#7ec699}
.mesaj.hata{color:#f48771}
.mesaj.hata .etiket{color:#f48771}
.mesaj pre{background:#0d0d0d;padding:13px 15px;border-radius:8px;overflow-x:auto;
  margin:10px 0;border:1px solid #262626;font-size:12.5px;line-height:1.6}
.mesaj code{font-family:Consolas,monospace;background:#1f1f1f;padding:1.5px 5px;
  border-radius:4px;font-size:12.5px}
.mesaj pre code{background:none;padding:0}

/* ── Boş durum: ORTADA BÜYÜK MARKA ── */
#bos{flex:1;display:flex;flex-direction:column;align-items:center;
  justify-content:center;padding:0 24px 40px;gap:14px}
#bosMarka{font-size:31px;font-weight:700;letter-spacing:-.5px;color:#fff;
  display:flex;align-items:center;gap:12px}
#bosMarka .nokta{width:16px;height:16px;border-radius:50%;background:#4a9eff;
  box-shadow:0 0 24px #4a9eff}
#bosAlt{color:#6b6b6b;font-size:13.5px}

/* ── Prompt kutusu ── */
#promptAlani{width:100%;max-width:780px;flex-shrink:0;padding:0 24px 18px;margin:0 auto}
#kutu{background:#1c1c1c;border:1px solid #303030;border-radius:14px;
  padding:4px;transition:border-color .15s,box-shadow .15s}
#kutu:focus-within{border-color:#4a9eff;box-shadow:0 0 0 3px rgba(74,158,255,.12)}
#t{width:100%;background:none;border:none;color:#e8e8e8;resize:none;outline:none;
  padding:13px 15px 6px;font-family:inherit;font-size:14px;line-height:1.55;
  min-height:52px;max-height:230px}
#t::placeholder{color:#5c5c5c}
#kutuAlt{display:flex;align-items:center;gap:7px;padding:5px 8px 8px}
.rozet{background:#232323;border:1px solid #2e2e2e;color:#a0a0a0;border-radius:7px;
  padding:5px 10px;font-size:11.5px;display:flex;align-items:center;gap:6px;
  transition:all .12s}
.rozet:hover{background:#2a2a2a;color:#e4e4e4}
.rozet .ok{font-size:9px;color:#6b6b6b}
#gonderBtn{margin-left:auto;background:#4a9eff;color:#fff;border:none;border-radius:9px;
  width:34px;height:34px;display:flex;align-items:center;justify-content:center;
  font-size:16px;transition:filter .12s}
#gonderBtn:hover{filter:brightness(1.15)}
#gonderBtn:disabled{opacity:.35;cursor:default;filter:none}
#ipucu{text-align:center;color:#4d4d4d;font-size:11px;margin-top:9px}
#ipucu kbd{background:#1f1f1f;border:1px solid #2e2e2e;border-radius:4px;
  padding:1px 5px;font-family:Consolas,monospace;font-size:10.5px}
#uyari{max-width:780px;margin:0 auto 12px;padding:9px 13px;border-radius:9px;
  background:rgba(255,170,0,.09);border:1px solid rgba(255,170,0,.22);color:#e8b04b;
  font-size:12px;display:${a.anahtar && a.anahtar.trim() ? 'none' : 'block'}}
</style></head><body>

<div id="rail">
  <div id="railUst"><div id="marka"><span class="nokta"></span>Elytra</div></div>
  <button id="yeni">&#43;&nbsp; Yeni konuşma</button>
  <div id="railListe"><div class="bos">Henüz konuşma yok</div></div>
  <div id="railAlt">
    <button class="mini" id="btnAnahtar">&#128273; Anahtar</button>
    <button class="mini" id="btnAyarlar">&#9881; Ayarlar</button>
  </div>
</div>

<div id="ana">
  <div id="ustbar">
    <span class="baslik" id="ustBaslik">Elytra</span>
  </div>

  <div id="bos">
    <div id="bosMarka"><span class="nokta"></span>Elytra</div>
    <div id="bosAlt">Ne inşa edelim?</div>
  </div>

  <div id="sohbet" style="display:none"><div id="sohbetIc"></div></div>

  <div id="promptAlani">
    <div id="uyari">API anahtarı yok &mdash; <a href="#" id="ak" style="color:#e8b04b">buraya tıkla</a> ve ekle.</div>
    <div id="kutu">
      <textarea id="t" placeholder="Her şeyi sor, @ ile bahset, / ile komutlar" rows="1"></textarea>
      <div id="kutuAlt">
        <button class="rozet" id="modelBtn"><span id="modelAd">${a.model || 'model yok'}</span><span class="ok">&#9660;</span></button>
        <button class="rozet" id="ekle">&#43;</button>
        <button id="gonderBtn" title="Gönder">&#8593;</button>
      </div>
    </div>
    <div id="ipucu"><kbd>Enter</kbd> gönderir &middot; <kbd>Shift</kbd>+<kbd>Enter</kbd> yeni satır</div>
  </div>
</div>

<script>
const vs = acquireVsCodeApi();
const sohbet = document.getElementById('sohbet');
const sohbetIc = document.getElementById('sohbetIc');
const bos = document.getElementById('bos');
const t = document.getElementById('t');
const gonderBtn = document.getElementById('gonderBtn');
const railListe = document.getElementById('railListe');
const ustBaslik = document.getElementById('ustBaslik');
let bekleyen = false, aktifId = null;

function kacir(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function bicimle(s){
  let x = kacir(s);
  x = x.replace(/\`\`\`([\\w+-]*)\\n?([\\s\\S]*?)\`\`\`/g, function(m,d,k){
    return '<pre><code>' + k.replace(/\\n$/,'') + '</code></pre>';
  });
  x = x.replace(/\`([^\`\\n]+)\`/g, '<code>$1</code>');
  x = x.replace(/\\*\\*([^*\\n]+)\\*\\*/g, '<b>$1</b>');
  return x;
}

function mesajEkle(rol, metin){
  bos.style.display = 'none';
  sohbet.style.display = 'block';
  const d = document.createElement('div');
  d.className = 'mesaj ' + (rol === 'user' ? 'kullanici' : rol === 'hata' ? 'hata' : 'ai');
  const etiket = rol === 'user' ? 'Sen' : rol === 'hata' ? 'Hata' : 'Elytra';
  d.innerHTML = '<div class="etiket">' + etiket + '</div>' +
    (rol === 'user' ? kacir(metin) : bicimle(metin));
  sohbetIc.appendChild(d);
  sohbet.scrollTop = sohbet.scrollHeight;
  return d;
}

function railCiz(liste){
  if (!liste || !liste.length){ railListe.innerHTML = '<div class="bos">Henüz konuşma yok</div>'; return; }
  railListe.innerHTML = '';
  liste.forEach(function(k){
    const d = document.createElement('div');
    d.className = 'oge' + (k.id === aktifId ? ' aktif' : '');
    d.innerHTML = '<span class="ad">' + kacir(k.baslik) + '</span><button class="sil" title="Sil">&#215;</button>';
    d.querySelector('.ad').onclick = function(){ vs.postMessage({tip:'ac', id:k.id}); };
    d.querySelector('.sil').onclick = function(ev){ ev.stopPropagation(); vs.postMessage({tip:'sil', id:k.id}); };
    railListe.appendChild(d);
  });
}

function gonder(){
  const m = t.value.trim();
  if (!m || bekleyen) return;
  mesajEkle('user', m);
  t.value = ''; t.style.height = 'auto';
  bekleyen = true; gonderBtn.disabled = true;
  const bek = mesajEkle('ai', 'Düşünüyor...');
  bek.setAttribute('data-bekliyor','1');
  vs.postMessage({ tip:'sor', metin:m, id:aktifId });
}

gonderBtn.onclick = gonder;
t.addEventListener('keydown', function(e){ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); gonder(); } });
t.addEventListener('input', function(){ t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,230)+'px'; });

document.getElementById('yeni').onclick = function(){ vs.postMessage({tip:'yeni'}); };
document.getElementById('btnAnahtar').onclick = function(){ vs.postMessage({tip:'anahtar'}); };
document.getElementById('btnAyarlar').onclick = function(){ vs.postMessage({tip:'ayarlar'}); };
document.getElementById('ak').onclick = function(e){ e.preventDefault(); vs.postMessage({tip:'anahtar'}); };
document.getElementById('modelBtn').onclick = function(){ vs.postMessage({tip:'ayarlar'}); };
document.getElementById('ekle').onclick = function(){ vs.postMessage({tip:'ayarlar'}); };

window.addEventListener('message', function(e){
  const m = e.data;
  if (m.tip === 'konusma'){
    aktifId = m.id;
    sohbetIc.innerHTML = '';
    if (m.mesajlar && m.mesajlar.length){
      m.mesajlar.forEach(function(x){ mesajEkle(x.role === 'user' ? 'user' : 'ai', x.content); });
      bos.style.display = 'none'; sohbet.style.display = 'block';
      const bul = (m.konusmalar || []).find(function(k){ return k.id === m.id; });
      ustBaslik.textContent = bul ? bul.baslik : 'Elytra';
    } else {
      sohbet.style.display = 'none'; bos.style.display = 'flex';
      ustBaslik.textContent = 'Elytra';
    }
    railCiz(m.konusmalar);
    return;
  }
  if (m.tip === 'yanit' || m.tip === 'hata'){
    const bek = sohbetIc.querySelector('[data-bekliyor]');
    if (bek) bek.remove();
    mesajEkle(m.tip === 'hata' ? 'hata' : 'ai', m.metin);
    if (m.konusmalar) railCiz(m.konusmalar);
    bekleyen = false; gonderBtn.disabled = false;
  }
});
t.focus();
</script></body></html>`;
	}
}

// ─────────────────────────────────────────────────────────────
// 2) KENAR ÇUBUĞU — kalıcı sohbet paneli
// ─────────────────────────────────────────────────────────────
class SohbetSaglayici {
	constructor(context) { this.context = context; }

	resolveWebviewView(view) {
		aktifGorunum = view;
		view.webview.options = { enableScripts: true };
		view.webview.html = this.html();

		view.webview.onDidReceiveMessage(async (m) => {
			switch (m.tip) {
				case 'sor': {
					const k = aktif();
					await gonderVeYayinla(k, m.metin);
					break;
				}
				case 'anahtar': vscode.commands.executeCommand('elytra.setKey'); break;
				case 'ayarlar': vscode.commands.executeCommand('workbench.action.openSettings', 'elytra'); break;
				case 'baslangic': BaslangicPaneli.goster(this.context); break;
			}
		});
		view.onDidDispose(() => { aktifGorunum = undefined; });
	}

	html() {
		const a = ayar();
		const sagAd = (SAGLAYICILAR[a.saglayici] || {}).ad || a.saglayici;
		const anahtarVar = !!(a.anahtar && a.anahtar.trim());
		return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<style>
${ORTAK_CSS}
body{display:flex;flex-direction:column;height:100vh;background:#141414}
#ust{padding:10px 12px;border-bottom:1px solid #262626;display:flex;align-items:center;gap:8px;flex-shrink:0}
#ust .logo{color:#4a9eff;font-weight:700;font-size:12px;letter-spacing:.4px}
#ust .bilgi{color:#5c5c5c;font-size:10.5px;margin-left:auto;font-family:Consolas,monospace;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52%}
#uyari{margin:10px 10px 0;padding:8px 11px;border-radius:8px;font-size:11.5px;
  background:rgba(255,170,0,.09);border:1px solid rgba(255,170,0,.22);color:#e8b04b;
  display:${anahtarVar ? 'none' : 'block'}}
#sohbet{flex:1;overflow-y:auto;padding:12px}
.mesaj{padding:9px 11px;border-radius:8px;margin-bottom:10px;line-height:1.65;
  white-space:pre-wrap;word-break:break-word;font-size:12.5px}
.mesaj.kullanici{background:rgba(74,158,255,.12);border-left:2px solid #4a9eff}
.mesaj.ai{background:#1c1c1c;border-left:2px solid #303030}
.mesaj.hata{background:rgba(241,76,76,.11);border-left:2px solid #f14c4c;color:#f48771}
.mesaj pre{background:#0d0d0d;padding:9px 11px;border-radius:6px;overflow-x:auto;margin:7px 0;border:1px solid #262626}
.mesaj code{font-family:Consolas,monospace;background:#1f1f1f;padding:1px 4px;border-radius:3px;font-size:12px}
.mesaj pre code{background:none;padding:0}
#bosY{padding:20px 12px;text-align:center;color:#5c5c5c;font-size:11.5px;line-height:1.9}
#bosY b{color:#4a9eff;display:block;font-size:14px;margin-bottom:8px}
#bosY kbd{background:#1f1f1f;border:1px solid #2e2e2e;border-radius:3px;padding:1px 5px;
  font-family:Consolas,monospace;font-size:10.5px}
#girdi{border-top:1px solid #262626;padding:9px 10px;flex-shrink:0}
#kutu{background:#1c1c1c;border:1px solid #303030;border-radius:10px;display:flex;
  flex-direction:column;transition:border-color .12s}
#kutu:focus-within{border-color:#4a9eff}
textarea{background:none;border:none;color:#e8e8e8;resize:none;outline:none;
  padding:9px 11px 4px;font-family:inherit;font-size:12.5px;line-height:1.5;min-height:42px;max-height:170px}
#alt{display:flex;align-items:center;gap:5px;padding:4px 7px 7px}
.mini{background:none;border:none;color:#6b6b6b;padding:3px 6px;border-radius:5px;font-size:11px;font-family:inherit}
.mini:hover{background:#232323;color:#e4e4e4}
#gonder{margin-left:auto;background:#4a9eff;color:#fff;border:none;border-radius:7px;
  padding:5px 14px;font-weight:600;font-size:12px;font-family:inherit}
#gonder:hover{filter:brightness(1.14)}
#gonder:disabled{opacity:.35;cursor:default}
</style></head><body>
<div id="ust"><span class="logo">&#9670; ELYTRA AI</span><span class="bilgi">${sagAd}</span></div>
<div id="uyari">API anahtarı yok &mdash; <a href="#" id="ak" style="color:#e8b04b">ekle</a></div>
<div id="sohbet"><div id="bosY"><b>ELYTRA AI</b>Sor, düzenle, açıkla.<br><kbd>Ctrl</kbd>+<kbd>K</kbd> seçili kodu düzenler</div></div>
<div id="girdi"><div id="kutu">
<textarea id="t" placeholder="AI'a sor..." rows="1"></textarea>
<div id="alt">
  <button class="mini" id="bAnahtar" title="API anahtarı">&#128273;</button>
  <button class="mini" id="bAyarlar" title="Ayarlar">&#9881;</button>
  <button class="mini" id="bTam" title="Tam ekran sohbet">&#9974;</button>
  <button id="gonder">G&ouml;nder</button>
</div></div></div>
<script>
const vs = acquireVsCodeApi();
const sohbet = document.getElementById('sohbet');
const t = document.getElementById('t');
const gonderBtn = document.getElementById('gonder');
let bekleyen = null;
function kacir(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function bicimle(s){
  let x = kacir(s);
  x = x.replace(/\`\`\`([\\w+-]*)\\n?([\\s\\S]*?)\`\`\`/g, function(m,d,k){
    return '<pre><code>' + k.replace(/\\n$/,'') + '</code></pre>';
  });
  x = x.replace(/\`([^\`\\n]+)\`/g,'<code>$1</code>');
  return x;
}
function ekle(tur, metin, ham){
  const b = sohbet.querySelector('#bosY'); if (b) b.remove();
  const d = document.createElement('div'); d.className='mesaj '+tur;
  if (ham) d.textContent = metin; else d.innerHTML = bicimle(metin);
  sohbet.appendChild(d); sohbet.scrollTop = sohbet.scrollHeight; return d;
}
function gonder(){
  const m = t.value.trim(); if(!m) return;
  ekle('kullanici', m, true); t.value=''; t.style.height='auto';
  bekleyen = ekle('ai','Düşünüyor...',true); gonderBtn.disabled=true;
  vs.postMessage({tip:'sor',metin:m});
}
gonderBtn.onclick=gonder;
t.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();gonder();} });
t.addEventListener('input',function(){ t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,170)+'px'; });
document.getElementById('bAnahtar').onclick=function(){vs.postMessage({tip:'anahtar'});};
document.getElementById('bAyarlar').onclick=function(){vs.postMessage({tip:'ayarlar'});};
document.getElementById('bTam').onclick=function(){vs.postMessage({tip:'baslangic'});};
document.getElementById('ak').onclick=function(e){e.preventDefault();vs.postMessage({tip:'anahtar'});};
window.addEventListener('message',function(e){
  const m=e.data;
  if(bekleyen){bekleyen.remove();bekleyen=null;}
  gonderBtn.disabled=false;
  if(m.tip==='yanit')ekle('ai',m.metin);
  if(m.tip==='hata')ekle('hata',m.metin,true);
});
t.focus();
</script></body></html>`;
	}
}

// ─────────────────────────────────────────────────────────────
// Etkinleştirme
// ─────────────────────────────────────────────────────────────
function activate(context) {
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'elytra.sohbetGorunum', new SohbetSaglayici(context),
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('elytra.baslangic', () => BaslangicPaneli.goster(context)),
		vscode.commands.registerCommand('elytra.chat', () => BaslangicPaneli.goster(context)),

		vscode.commands.registerCommand('elytra.temizle', () => {
			konusmalar = []; aktifId = null;
			if (baslangicPaneli) {
				baslangicPaneli.webview.postMessage({ tip: 'konusma', id: null, mesajlar: [], konusmalar: [] });
			}
		}),

		vscode.commands.registerCommand('elytra.inlineEdit', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) { return; }
			const secim = ed.selection;
			if (secim.isEmpty) { vscode.window.showWarningMessage('Elytra: Önce düzenlenecek kodu seç.'); return; }
			const talimat = await vscode.window.showInputBox({ prompt: 'Ne değişsin?', placeHolder: 'Talimat…' });
			if (!talimat) { return; }
			const mevcut = ed.document.getText(secim);
			await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: 'Elytra AI düzenliyor…' },
				async () => {
					try {
						const yanit = await aiSor([{ role: 'user', content:
							'Bu kodu şu talimata göre düzenle ve SADECE kodu döndür:\nTalimat: ' + talimat + '\n\nKod:\n' + mevcut }]);
						const temiz = yanit.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
						await ed.edit(b => b.replace(secim, temiz));
						vscode.window.showInformationMessage('Elytra: Düzenleme uygulandı.');
					} catch (e) {
						vscode.window.showErrorMessage('Elytra: ' + String((e && e.message) || e));
					}
				}
			);
		}),

		vscode.commands.registerCommand('elytra.explain', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) { return; }
			const secim = ed.selection;
			const kod = secim.isEmpty ? ed.document.getText() : ed.document.getText(secim);
			BaslangicPaneli.goster(context);
			await gonderVeYayinla(aktif(), 'Bu kodu açıkla:\n\n' + kod.slice(0, 8000));
		}),

		vscode.commands.registerCommand('elytra.setKey', async () => {
			const anahtar = await vscode.window.showInputBox({
				prompt: 'Sağlayıcı API anahtarı', password: true, ignoreFocusOut: true,
			});
			if (anahtar === undefined) { return; }
			await vscode.workspace.getConfiguration('elytra')
				.update('apiAnahtari', anahtar, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Elytra: API anahtarı kaydedildi.');
		})
	);

	// Durum çubuğu
	const durum = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	durum.text = '$(sparkle) Elytra';
	durum.tooltip = 'Elytra AI sohbetini aç';
	durum.command = 'elytra.baslangic';
	durum.show();
	context.subscriptions.push(durum);

	// AÇILIŞTA sohbet merkezli ana ekran (Antigravity tarzı).
	// Klasör açık değilken göster — çalışma alanı varsa rahatsız etme.
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		BaslangicPaneli.goster(context);
	}
}

function deactivate() {}

module.exports = { activate, deactivate };
