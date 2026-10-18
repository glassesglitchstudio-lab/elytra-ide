/* Elytra AI — Cursor ikizi yapay zeka asistanı (düz JavaScript)
 *
 * ÖZELLİKLER:
 *   1) KENAR ÇUBUĞU (elytra.sohbetGorunum - Ctrl+L) — Cursor tarzı kalıcı AI sohbeti:
 *      - Model seçici dropdown (Claude 3.5, DeepSeek R1/V3, Gemini, Qwen vb.)
 *      - @Files, @Code, @Git bağlam çipleri
 *      - /edit, /fix, /explain, /test komutları
 *      - Kod bloklarında "📋 Kopyala" + "⚡ Editöre Uygula" (Cursor özelliği)
 *   2) COMPOSER / BAŞLANGIÇ (elytra.baslangic - Ctrl+I) — tam ekran Cursor Composer paneli:
 *      - Konuşma geçmişi listesi, yeni konuşma oluşturma
 *      - Geniş prompt kutusu ve model değiştirici
 *   3) SATIR İÇİ DÜZENLEME (elytra.inlineEdit - Ctrl+K) — seçili kodu doğrudan düzenleme
 *
 * Düz JS: derleme adımı YOK.
 * SAHTE CEVAP ÜRETMEZ — gerçek sağlayıcı API'sine çağrı yapar.
 * ASLA Ollama / yerel model YOK — yalnızca bulut API'leri.
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

const MODEL_KATALOGU = [
	{ id: 'meituan/longcat-2.5-preview:free', ad: 'LongCat 2.5 Preview', saglayici: 'openrouter', rozet: 'Ücretsiz', aciklama: 'Hızlı ve dengeli genel asistan' },
	{ id: 'deepseek/deepseek-chat:free', ad: 'DeepSeek V3', saglayici: 'openrouter', rozet: 'Ücretsiz', aciklama: 'Güçlü kodlama ve akıl yürütme' },
	{ id: 'deepseek/deepseek-r1:free', ad: 'DeepSeek R1', saglayici: 'openrouter', rozet: 'Düşünce', aciklama: 'Derin muhakeme ve adım adım analiz' },
	{ id: 'gemini-2.5-flash', ad: 'Gemini 2.5 Flash', saglayici: 'google', rozet: 'En Yeni', aciklama: 'Ultra hızlı ve gelişmiş kodlama' },
	{ id: 'gemini-2.0-flash', ad: 'Gemini 2.0 Flash', saglayici: 'google', rozet: 'Hızlı', aciklama: 'Düşük gecikme, yüksek verim' },
	{ id: 'qwen/qwen-2.5-coder-32b-instruct', ad: 'Qwen 2.5 Coder 32B', saglayici: 'openrouter', rozet: 'Kod Uzmanı', aciklama: 'Programlama ve refactor için optimize' },
	{ id: 'anthropic/claude-3.5-sonnet', ad: 'Claude 3.5 Sonnet', saglayici: 'openrouter', rozet: 'Pro Kod', aciklama: 'Cursor seviyesinde kod üretimi' },
	{ id: 'nousresearch/hermes-3-llama-3.1-70b', ad: 'Hermes 3 (70B)', saglayici: 'nous', rozet: 'Nous', aciklama: 'Açık zeka ve karmaşık talimatlar' },
	{ id: 'llama-3.3-70b-versatile', ad: 'Llama 3.3 70B', saglayici: 'groq', rozet: 'Yüksek Hız', aciklama: 'Groq LPU ile anında yanıt' },
	{ id: 'deepseek-chat', ad: 'DeepSeek Chat V3', saglayici: 'deepseek', rozet: 'Resmi', aciklama: 'Doğrudan DeepSeek API\'si' },
	{ id: 'codestral-latest', ad: 'Codestral', saglayici: 'mistral', rozet: 'Mistral', aciklama: 'Kod tamamlama ve üretim' }
];

const BAGLAM_KOMUTLARI = [
	{ id: 'files', ad: '@Files', ipucu: 'Proje dosyasını bağlam olarak ekle', ikon: '📁' },
	{ id: 'code', ad: '@Code', ipucu: 'Aktif editördeki seçili kodu ekle', ikon: '📝' },
	{ id: 'codebase', ad: '@Codebase', ipucu: 'Açık çalışma alanı özetini ekle', ikon: '🧠' },
	{ id: 'docs', ad: '@Docs', ipucu: 'Kütüphane veya dil dokümantasyonu', ikon: '📚' },
	{ id: 'git', ad: '@Git', ipucu: 'Son değişiklikler ve git durumu', ikon: '🔀' },
	{ id: 'web', ad: '@Web', ipucu: 'Web arama bağlamı', ikon: '🌐' }
];

const SLASH_KOMUTLARI = [
	{ id: 'edit', ad: '/edit', ipucu: 'Kodu veya dosyayı talimatlara göre düzenle', ikon: '⚡' },
	{ id: 'explain', ad: '/explain', ipucu: 'Kodun mantığını ve mimarisini açıkla', ikon: '💡' },
	{ id: 'fix', ad: '/fix', ipucu: 'Hataları ve uyarıları tespit edip onar', ikon: '🔧' },
	{ id: 'test', ad: '/test', ipucu: 'Birim testleri ve test senaryoları üret', ikon: '🧪' },
	{ id: 'review', ad: '/review', ipucu: 'Kod kalitesi, güvenlik ve performans incelemesi', ikon: '🛡️' },
	{ id: 'clear', ad: '/clear', ipucu: 'Sohbet geçmişini sıfırla', ikon: '🗑️' }
];

/** Tüm sohbetler — { id, baslik, mesajlar: [{role, content}] } */
let konusmalar = [];
let aktifId = null;
let aktifGorunum = undefined;    // kenar çubuğu webview
let baslangicPaneli = undefined; // composer webview

function ayar() {
	const c = vscode.workspace.getConfiguration('elytra');
	return {
		saglayici: c.get('saglayici', 'openrouter'),
		model: c.get('model', 'meituan/longcat-2.5-preview:free'),
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
		throw new Error('API anahtarı yok. Kenar çubuğundaki anahtar düğmesine veya "Elytra: API Anahtarı Ayarla" komutuna tıklayın.');
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

/** Proje dosyalarını ara ve listele */
async function projeDosyalariGetir() {
	try {
		const dosyalar = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 40);
		return dosyalar.map(d => vscode.workspace.asRelativePath(d));
	} catch (_) {
		return [];
	}
}

/** Aktif editördeki kod bağlamını getir */
function aktifEditorBaglami() {
	const ed = vscode.window.activeTextEditor;
	if (!ed) return null;
	const secim = ed.selection;
	const kod = secim.isEmpty ? ed.document.getText() : ed.document.getText(secim);
	const dosyaYolu = vscode.workspace.asRelativePath(ed.document.uri);
	return { dosya: dosyaYolu, secimVar: !secim.isEmpty, kod: kod.slice(0, 4000) };
}

/** Sohbete mesaj gönder, sonucu iki yüzeye de yayınla. */
async function gonderVeYayinla(k, metin) {
	let sonMetin = metin;

	// /clear komutu kontrolü
	if (metin.trim() === '/clear') {
		k.mesajlar = [];
		yayinla({ tip: 'konusma', id: k.id, mesajlar: [], konusmalar: konusmaOzeti() });
		return;
	}

	// @code veya /edit bağlamını otomatik zenginleştir
	if (metin.includes('@Code') || metin.startsWith('/edit') || metin.startsWith('/explain') || metin.startsWith('/fix') || metin.startsWith('/test')) {
		const baglam = aktifEditorBaglami();
		if (baglam && baglam.kod) {
			sonMetin = metin + '\n\n[Aktif Kod Bağlamı: ' + baglam.dosya + (baglam.secimVar ? ' (Seçili Bölüm)' : '') + ']\n```\n' + baglam.kod + '\n```';
		}
	}

	k.mesajlar.push({ role: 'user', content: metin });
	if (k.baslik === 'Yeni konuşma' && metin.length > 2) {
		k.baslik = metin.slice(0, 42) + (metin.length > 42 ? '…' : '');
	}
	try {
		const gonderilecekMesajlar = k.mesajlar.map((m, idx) => {
			if (idx === k.mesajlar.length - 1 && m.role === 'user') {
				return { role: 'user', content: sonMetin };
			}
			return m;
		});

		const yanit = await aiSor(gonderilecekMesajlar);
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

/** Editöre kod uygula (Cursor tarzı "Apply to Editor") */
function kodEditoreUygula(kod) {
	const ed = vscode.window.activeTextEditor;
	if (ed) {
		ed.edit(b => {
			if (ed.selection.isEmpty) {
				b.insert(ed.selection.active, kod);
			} else {
				b.replace(ed.selection, kod);
			}
		});
		vscode.window.showInformationMessage('Elytra: Kod editöre uygulandı!');
	} else {
		vscode.window.showWarningMessage('Elytra: Kod uygulamak için önce bir dosya açın.');
	}
}

// ─────────────────────────────────────────────────────────────
// Paylaşılan Cursor CSS
// ─────────────────────────────────────────────────────────────
const CURSOR_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  background:#121214;color:#e2e8f0;
  font-family:var(--vscode-font-family,"Segoe UI",system-ui,sans-serif);
  font-size:13px;overflow:hidden;
}
button{font-family:inherit;cursor:pointer}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#23232a;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#383842}

/* Kod Bloğu ve Cursor Butonları */
.kod-blok{position:relative;background:#0b0b0e;border:1px solid #1e1e24;border-radius:8px;margin:10px 0;overflow:hidden}
.kod-ust{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;background:#141418;border-bottom:1px solid #1e1e24;font-size:11px;color:#94a3b8}
.kod-dil{font-family:Consolas,monospace;text-transform:lowercase;font-weight:600}
.kod-butonlar{display:flex;gap:6px}
.kod-btn{background:#1e1e26;border:1px solid #2b2b36;color:#cbd5e1;padding:3px 8px;border-radius:5px;font-size:10.5px;transition:all .12s}
.kod-btn:hover{background:#2b2b38;color:#fff;border-color:#3b82f6}
.kod-btn.uygula-btn{background:#1e293b;border-color:#3b82f6;color:#60a5fa}
.kod-btn.uygula-btn:hover{background:#2563eb;color:#fff}
.kod-blok pre{margin:0;padding:12px;overflow-x:auto;font-family:Consolas,monospace;font-size:12px;line-height:1.6}
.kod-blok code{background:none!important;padding:0!important;border:none!important}
code{font-family:Consolas,monospace;background:#1a1a20;padding:1.5px 5px;border-radius:4px;font-size:12px;color:#f8fafc}
`;

// ─────────────────────────────────────────────────────────────
// 1) KENAR ÇUBUĞU — Cursor Tarzı AI Sohbeti (Ctrl+L)
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
				case 'uygula': kodEditoreUygula(m.kod); break;
				case 'modelDegistir': {
					const c = vscode.workspace.getConfiguration('elytra');
					await c.update('model', m.model, vscode.ConfigurationTarget.Global);
					if (m.saglayici) {
						await c.update('saglayici', m.saglayici, vscode.ConfigurationTarget.Global);
					}
					vscode.window.showInformationMessage('Elytra Model: ' + m.model);
					yayinla({ tip: 'modelGuncellendi', model: m.model, saglayici: m.saglayici });
					break;
				}
				case 'anahtar': vscode.commands.executeCommand('elytra.setKey'); break;
				case 'ayarlar': vscode.commands.executeCommand('workbench.action.openSettings', 'elytra'); break;
				case 'composer': BaslangicPaneli.goster(this.context); break;
			}
		});
		view.onDidDispose(() => { aktifGorunum = undefined; });
	}

	html() {
		const a = ayar();
		const sagAd = (SAGLAYICILAR[a.saglayici] || {}).ad || a.saglayici;
		const anahtarVar = !!(a.anahtar && a.anahtar.trim());
		const katalogJson = JSON.stringify(MODEL_KATALOGU);

		return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<style>
${CURSOR_CSS}
body{display:flex;flex-direction:column;height:100vh;background:#121214}
#ust{padding:8px 12px;border-bottom:1px solid #1e1e24;display:flex;align-items:center;gap:8px;flex-shrink:0;background:#141416}
#ust .logo{color:#3b82f6;font-weight:700;font-size:12px;letter-spacing:.5px;display:flex;align-items:center;gap:6px}
#ust .logo span{color:#94a3b8;font-weight:400;font-size:11px}
#ust .butonlar{margin-left:auto;display:flex;gap:4px}
.icon-btn{background:none;border:none;color:#64748b;padding:4px 6px;border-radius:5px;font-size:12px}
.icon-btn:hover{background:#1e1e24;color:#f1f5f9}

/* Model Çubuğu */
#modelBari{padding:6px 12px;border-bottom:1px solid #1a1a20;background:#101012;display:flex;align-items:center;gap:6px}
.modelPill{background:#18181c;border:1px solid #282832;color:#94a3b8;border-radius:6px;padding:3px 9px;font-size:11px;display:flex;align-items:center;gap:6px;cursor:pointer;max-width:85%}
.modelPill:hover{background:#202028;color:#f8fafc;border-color:#3b82f6}
.modelPill .ad{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.modelPill .ok{font-size:9px;color:#64748b}

#uyari{margin:8px 10px 0;padding:8px 11px;border-radius:8px;font-size:11.5px;
  background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:#f59e0b;
  display:${anahtarVar ? 'none' : 'block'}}

/* Sohbet Alanı */
#sohbet{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:12px}
.mesaj{padding:10px 12px;border-radius:9px;line-height:1.6;font-size:12.5px;word-break:break-word}
.mesaj.kullanici{background:#1e2433;border-left:2px solid #3b82f6;align-self:flex-end;width:95%}
.mesaj.ai{background:#18181c;border:1px solid #22222a;align-self:flex-start;width:100%}
.mesaj.hata{background:rgba(239,68,68,.1);border-left:2px solid #ef4444;color:#f87171}
.mesaj .etiket{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px;letter-spacing:.6px}
.mesaj.kullanici .etiket{color:#60a5fa}
.mesaj.ai .etiket{color:#34d399}

#bosDurum{padding:30px 10px;text-align:center;color:#64748b;line-height:1.8}
#bosDurum .baslik{color:#3b82f6;font-weight:700;font-size:15px;margin-bottom:6px}
#bosDurum .kisayol{display:inline-block;background:#1a1a20;border:1px solid #282832;border-radius:4px;padding:1px 6px;font-family:Consolas,monospace;font-size:10.5px;color:#cbd5e1;margin:2px}

/* Çipler */
#cipler{display:flex;gap:5px;overflow-x:auto;padding:6px 10px 2px;flex-shrink:0}
.cip{background:#18181c;border:1px solid #24242c;color:#94a3b8;border-radius:6px;padding:3px 8px;font-size:10.5px;cursor:pointer;white-space:nowrap;transition:all .1s}
.cip:hover{background:#22222c;color:#f8fafc;border-color:#3b82f6}

/* Girdi Alanı */
#girdi{padding:8px 10px;background:#141416;border-top:1px solid #1e1e24;flex-shrink:0}
#kutu{background:#18181c;border:1px solid #282832;border-radius:10px;padding:4px;display:flex;flex-direction:column;transition:border-color .15s}
#kutu:focus-within{border-color:#3b82f6;box-shadow:0 0 0 2px rgba(59,130,246,.15)}
#t{background:none;border:none;color:#f1f5f9;resize:none;outline:none;padding:8px 10px;font-family:inherit;font-size:12.5px;line-height:1.5;min-height:38px;max-height:150px}
#kutuAlt{display:flex;align-items:center;justify-content:space-between;padding:4px 6px}
#gonder{background:#3b82f6;color:#fff;border:none;border-radius:7px;padding:4px 12px;font-weight:600;font-size:12px;display:flex;align-items:center;gap:4px}
#gonder:hover{background:#2563eb}
#gonder:disabled{opacity:.35;cursor:default}

/* Model Açılır Menü */
#modelMenu{position:absolute;top:70px;left:10px;right:10px;background:#18181c;border:1px solid #2d2d38;border-radius:10px;box-shadow:0 12px 28px rgba(0,0,0,.7);z-index:90;display:none;max-height:300px;overflow-y:auto;padding:5px}
#modelMenu.aktif{display:block}
.modelOge{padding:7px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:11.5px;color:#cbd5e1;transition:background .1s}
.modelOge:hover{background:#22222e;color:#fff}
.modelOge .ad{font-weight:600}
.modelOge .rozet{margin-left:auto;font-size:9.5px;background:#242432;color:#60a5fa;padding:1px 6px;border-radius:4px}
</style></head><body>

<div id="ust">
  <div class="logo">&#9670; ELYTRA <span>Cursor Edition</span></div>
  <div class="butonlar">
    <button class="icon-btn" id="bComposer" title="Composer (Ctrl+I)">&#9974;</button>
    <button class="icon-btn" id="bAnahtar" title="API Anahtarı">&#128273;</button>
    <button class="icon-btn" id="bAyarlar" title="Ayarlar">&#9881;</button>
  </div>
</div>

<div id="modelBari">
  <div class="modelPill" id="modelSeciciBtn">
    <span class="ad" id="guncelModelAd">${a.model}</span>
    <span class="ok">&#9662;</span>
  </div>
</div>

<div id="modelMenu"></div>

<div id="uyari">API anahtarı eksik &mdash; <a href="#" id="ak" style="color:#f59e0b;font-weight:600">hemen ekle</a></div>

<div id="sohbet">
  <div id="bosDurum">
    <div class="baslik">Cursor AI Sohbeti</div>
    <p>Kod yaz, refactor et, hata ayıkla.</p>
    <div style="margin-top:10px">
      <span class="kisayol">Ctrl+L</span> Sohbet
      <span class="kisayol">Ctrl+K</span> Düzenle
      <span class="kisayol">Ctrl+I</span> Composer
    </div>
  </div>
</div>

<div id="cipler">
  <button class="cip" data-ekle="@Code">📝 @Code</button>
  <button class="cip" data-ekle="/edit ">⚡ /edit</button>
  <button class="cip" data-ekle="/fix ">🔧 /fix</button>
  <button class="cip" data-ekle="/explain ">💡 /explain</button>
  <button class="cip" data-ekle="@Files">📁 @Files</button>
</div>

<div id="girdi">
  <div id="kutu">
    <textarea id="t" placeholder="AI'a sor... (Enter ile gönder, Shift+Enter ile yeni satır)" rows="1"></textarea>
    <div id="kutuAlt">
      <span style="font-size:10px;color:#64748b">Ctrl+L ile odaklan</span>
      <button id="gonder">&#8593; Gönder</button>
    </div>
  </div>
</div>

<script>
const vs = acquireVsCodeApi();
const sohbet = document.getElementById('sohbet');
const t = document.getElementById('t');
const gonderBtn = document.getElementById('gonder');
const modelMenu = document.getElementById('modelMenu');
const modelSeciciBtn = document.getElementById('modelSeciciBtn');
const guncelModelAd = document.getElementById('guncelModelAd');
const modeller = ${katalogJson};

let bekleyen = null;

// Model menüsünü doldur
modeller.forEach(m => {
  const d = document.createElement('div');
  d.className = 'modelOge';
  d.innerHTML = '<span class="ad">' + m.ad + '</span><span class="rozet">' + m.rozet + '</span>';
  d.onclick = () => {
    guncelModelAd.textContent = m.id;
    modelMenu.classList.remove('aktif');
    vs.postMessage({ tip: 'modelDegistir', model: m.id, saglayici: m.saglayici });
  };
  modelMenu.appendChild(d);
});

modelSeciciBtn.onclick = () => modelMenu.classList.toggle('aktif');
document.addEventListener('click', (e) => {
  if (!modelSeciciBtn.contains(e.target) && !modelMenu.contains(e.target)) {
    modelMenu.classList.remove('aktif');
  }
});

function kacir(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function bicimle(s){
  let x = kacir(s);
  // Kod blokları + Cursor Kopyala/Uygula butonları
  x = x.replace(/\`\`\`([\\w+-]*)\\n?([\\s\\S]*?)\`\`\`/g, function(_, dil, kod){
    const d = dil || 'kod';
    const ham = kod.replace(/\\n$/,'');
    return '<div class="kod-blok">' +
      '<div class="kod-ust">' +
        '<span class="kod-dil">' + d + '</span>' +
        '<div class="kod-butonlar">' +
          '<button class="kod-btn" onclick="kopyalaKod(this)">📋 Kopyala</button>' +
          '<button class="kod-btn uygula-btn" onclick="uygulaKod(this)">⚡ Editöre Uygula</button>' +
        '</div>' +
      '</div>' +
      '<pre><code>' + ham + '</code></pre>' +
    '</div>';
  });
  x = x.replace(/\`([^\\\`\\n]+)\`/g, '<code>$1</code>');
  return x;
}

window.kopyalaKod = function(btn) {
  const blok = btn.closest('.kod-blok');
  const kod = blok.querySelector('pre code').innerText;
  navigator.clipboard.writeText(kod);
  const esk = btn.textContent;
  btn.textContent = '✓ Kopyalandı';
  setTimeout(() => btn.textContent = esk, 1500);
};

window.uygulaKod = function(btn) {
  const blok = btn.closest('.kod-blok');
  const kod = blok.querySelector('pre code').innerText;
  vs.postMessage({ tip: 'uygula', kod: kod });
  const esk = btn.textContent;
  btn.textContent = '✓ Uygulandı';
  setTimeout(() => btn.textContent = esk, 1500);
};

function ekle(tur, metin, ham){
  const b = sohbet.querySelector('#bosDurum'); if (b) b.remove();
  const d = document.createElement('div');
  d.className = 'mesaj ' + tur;
  const etiket = tur === 'kullanici' ? 'SEN' : (tur === 'ai' ? 'ELYTRA' : 'HATA');
  d.innerHTML = '<div class="etiket">' + etiket + '</div><div class="icerik">' + (ham ? kacir(metin) : bicimle(metin)) + '</div>';
  sohbet.appendChild(d);
  sohbet.scrollTop = sohbet.scrollHeight;
  return d;
}

function gonder(){
  const m = t.value.trim(); if (!m) return;
  ekle('kullanici', m, true);
  t.value = ''; t.style.height = 'auto';
  bekleyen = ekle('ai', 'Düşünüyor...', true);
  gonderBtn.disabled = true;
  vs.postMessage({ tip: 'sor', metin: m });
}

gonderBtn.onclick = gonder;
t.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gonder(); }
});
t.addEventListener('input', () => {
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight, 150) + 'px';
});

// Çipler
document.querySelectorAll('.cip').forEach(c => {
  c.onclick = () => {
    const val = c.getAttribute('data-ekle');
    t.value = val + t.value;
    t.focus();
  };
});

document.getElementById('bAnahtar').onclick = () => vs.postMessage({ tip: 'anahtar' });
document.getElementById('bAyarlar').onclick = () => vs.postMessage({ tip: 'ayarlar' });
document.getElementById('bComposer').onclick = () => vs.postMessage({ tip: 'composer' });
document.getElementById('ak').onclick = (e) => { e.preventDefault(); vs.postMessage({ tip: 'anahtar' }); };

window.addEventListener('message', (e) => {
  const m = e.data;
  if (bekleyen) { bekleyen.remove(); bekleyen = null; }
  gonderBtn.disabled = false;
  if (m.tip === 'yanit') ekle('ai', m.metin);
  if (m.tip === 'hata') ekle('hata', m.metin, true);
  if (m.tip === 'modelGuncellendi') guncelModelAd.textContent = m.model;
});

t.focus();
</script></body></html>`;
	}
}

// ─────────────────────────────────────────────────────────────
// 2) COMPOSER — Cursor Tarzı Geniş Ekran Paneli (Ctrl+I)
// ─────────────────────────────────────────────────────────────
class BaslangicPaneli {
	static goster(context) {
		if (baslangicPaneli) { baslangicPaneli.reveal(vscode.ViewColumn.One); return; }

		const panel = vscode.window.createWebviewPanel(
			'elytraBaslangic',
			'Elytra Composer',
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
				case 'uygula': kodEditoreUygula(m.kod); break;
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
					panel.webview.postMessage({ tip: 'konusma', id: k.id, mesajlar: k.mesajlar || [], konusmalar: konusmaOzeti() });
					break;
				}
				case 'modelDegistir': {
					const c = vscode.workspace.getConfiguration('elytra');
					await c.update('model', m.model, vscode.ConfigurationTarget.Global);
					if (m.saglayici) {
						await c.update('saglayici', m.saglayici, vscode.ConfigurationTarget.Global);
					}
					vscode.window.showInformationMessage('Elytra Model: ' + m.model);
					yayinla({ tip: 'modelGuncellendi', model: m.model, saglayici: m.saglayici });
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
		const katalogJson = JSON.stringify(MODEL_KATALOGU);

		return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
${CURSOR_CSS}
body{display:flex;height:100vh;background:#121214}

/* Sol rail */
#rail{width:230px;flex-shrink:0;border-right:1px solid #1e1e24;display:flex;flex-direction:column;background:#141416;user-select:none}
#railUst{padding:14px;border-bottom:1px solid #1e1e24}
#marka{font-size:15px;font-weight:700;color:#fff;display:flex;align-items:center;gap:8px}
#marka .nokta{width:9px;height:9px;border-radius:50%;background:#3b82f6;box-shadow:0 0 10px #3b82f6}
#yeni{margin:12px;padding:9px 12px;border-radius:8px;border:1px solid #282832;background:#18181c;color:#e2e8f0;font-size:12.5px;text-align:left;display:flex;align-items:center;gap:8px;transition:background .12s}
#yeni:hover{background:#222228;border-color:#3b82f6}
#railListe{flex:1;overflow-y:auto;padding:6px 8px}
.oge{padding:8px 10px;border-radius:7px;font-size:12px;color:#94a3b8;display:flex;align-items:center;gap:8px;margin-bottom:2px;cursor:pointer}
.oge:hover{background:#1e1e24;color:#f1f5f9}
.oge.aktif{background:#232530;color:#fff}
.oge .ad{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.oge .sil{opacity:0;background:none;border:none;color:#64748b}
.oge:hover .sil{opacity:1}
.oge .sil:hover{color:#ef4444}
#railAlt{padding:10px 12px;border-top:1px solid #1e1e24;display:flex;gap:6px}
.miniBtn{background:none;border:1px solid #282832;color:#94a3b8;border-radius:6px;padding:4px 8px;font-size:11px}
.miniBtn:hover{background:#1e1e24;color:#fff}

/* Orta alan */
#ana{flex:1;display:flex;flex-direction:column;min-width:0;position:relative}
#ustbar{height:42px;flex-shrink:0;border-bottom:1px solid #1e1e24;display:flex;align-items:center;padding:0 16px;gap:10px;background:#141416}
#ustbar .baslik{font-size:12.5px;color:#94a3b8;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#ustbar .modelPill{background:#18181c;border:1px solid #282832;color:#60a5fa;padding:3px 9px;border-radius:6px;font-size:11px;cursor:pointer}

/* Sohbet listesi */
#sohbet{flex:1;overflow-y:auto;padding:24px 0}
#sohbetIc{max-width:760px;margin:0 auto;padding:0 24px}
.mesaj{margin-bottom:20px;line-height:1.7;font-size:13.5px;word-break:break-word}
.mesaj .etiket{font-size:10.5px;letter-spacing:.6px;font-weight:700;margin-bottom:6px;text-transform:uppercase}
.mesaj.kullanici .etiket{color:#60a5fa}
.mesaj.ai .etiket{color:#34d399}
.mesaj.hata{color:#f87171}

/* Boş ekran */
#bos{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 24px 40px;gap:12px}
#bosMarka{font-size:28px;font-weight:700;color:#fff;display:flex;align-items:center;gap:12px}
#bosMarka .nokta{width:14px;height:14px;border-radius:50%;background:#3b82f6;box-shadow:0 0 20px #3b82f6}
#bosAlt{color:#64748b;font-size:13px}
.ornekKutulari{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}
.ornekKutu{background:#18181c;border:1px solid #282832;color:#94a3b8;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;transition:all .12s}
.ornekKutu:hover{background:#202028;color:#f8fafc;border-color:#3b82f6}

/* Prompt kutusu */
#promptAlani{width:100%;max-width:760px;flex-shrink:0;padding:0 24px 18px;margin:0 auto}
#kutu{background:#18181c;border:1px solid #282832;border-radius:12px;padding:4px;position:relative;transition:border-color .15s}
#kutu:focus-within{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15)}
#t{width:100%;background:none;border:none;color:#f8fafc;resize:none;outline:none;padding:12px 14px 6px;font-family:inherit;font-size:13.5px;line-height:1.55;min-height:50px;max-height:220px}
#kutuAlt{display:flex;align-items:center;gap:6px;padding:4px 8px 8px}
.rozet{background:#202028;border:1px solid #282832;color:#94a3b8;border-radius:6px;padding:4px 9px;font-size:11.5px;cursor:pointer}
.rozet:hover{color:#fff;border-color:#3b82f6}
#gonderBtn{margin-left:auto;background:#3b82f6;color:#fff;border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer}
#gonderBtn:hover{background:#2563eb}
#gonderBtn:disabled{opacity:.35;cursor:default}

/* Modal */
#modelModal{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(3px)}
#modelModal.aktif{display:flex}
#modelPencere{width:450px;background:#18181c;border:1px solid #2d2d38;border-radius:12px;padding:16px;box-shadow:0 20px 40px rgba(0,0,0,.8)}
.mSecenek{padding:9px 12px;border-radius:7px;cursor:pointer;display:flex;align-items:center;gap:10px;margin-bottom:4px}
.mSecenek:hover{background:#22222e}
.mSecenek .mAd{font-weight:600;color:#f1f5f9;font-size:12.5px}
.mSecenek .mRozet{margin-left:auto;font-size:10px;background:#242434;color:#60a5fa;padding:2px 7px;border-radius:4px}
</style></head><body>

<div id="rail">
  <div id="railUst"><div id="marka"><span class="nokta"></span>Elytra Composer</div></div>
  <button id="yeni"><span>+</span> Yeni Konuşma</button>
  <div id="railListe"></div>
  <div id="railAlt">
    <button class="miniBtn" id="bAnahtar">&#128273; Anahtar</button>
    <button class="miniBtn" id="bAyarlar">&#9881; Ayarlar</button>
  </div>
</div>

<div id="ana">
  <div id="ustbar">
    <div class="baslik" id="ustBaslik">Yeni Konuşma</div>
    <div class="modelPill" id="ustModelPill">${a.model}</div>
  </div>

  <div id="sohbet">
    <div id="bos">
      <div id="bosMarka"><span class="nokta"></span>Elytra Composer</div>
      <div id="bosAlt">Cursor tarzı AI kodlama ortamı</div>
      <div class="ornekKutulari">
        <div class="ornekKutu" data-sor="/fix Projedeki hataları ve uyarıları tespit et">🔧 Hataları Onar (/fix)</div>
        <div class="ornekKutu" data-sor="/test Aktif fonksiyona birim testleri yaz">🧪 Test Yaz (/test)</div>
        <div class="ornekKutu" data-sor="/explain Bu projenin mimarisini ve akışını açıkla">💡 Kodu Açıkla (/explain)</div>
      </div>
    </div>
    <div id="sohbetIc" style="display:none"></div>
  </div>

  <div id="promptAlani">
    <div id="kutu">
      <textarea id="t" placeholder="Ne inşa edelim? (/edit, /fix, @Code kullanabilirsin)" rows="1"></textarea>
      <div id="kutuAlt">
        <button class="rozet" id="modelSecBtn">${a.model}</button>
        <button class="rozet" id="btnKodEkle">📝 @Code Ekle</button>
        <button id="gonderBtn">&#8593;</button>
      </div>
    </div>
  </div>
</div>

<div id="modelModal">
  <div id="modelPencere">
    <div style="font-weight:700;font-size:14px;color:#fff;margin-bottom:12px">Model Seçin</div>
    <div id="modalListe"></div>
  </div>
</div>

<script>
const vs = acquireVsCodeApi();
const modeller = ${katalogJson};
const t = document.getElementById('t');
const gonderBtn = document.getElementById('gonderBtn');
const sohbetIc = document.getElementById('sohbetIc');
const bos = document.getElementById('bos');
const railListe = document.getElementById('railListe');
const modelModal = document.getElementById('modelModal');
const modalListe = document.getElementById('modalListe');

let aktifKonusmaId = null;
let bekleyen = null;

modeller.forEach(m => {
  const d = document.createElement('div');
  d.className = 'mSecenek';
  d.innerHTML = '<div class="mAd">' + m.ad + '</div><div class="mRozet">' + m.rozet + '</div>';
  d.onclick = () => {
    document.getElementById('ustModelPill').textContent = m.id;
    document.getElementById('modelSecBtn').textContent = m.id;
    modelModal.classList.remove('aktif');
    vs.postMessage({ tip: 'modelDegistir', model: m.id, saglayici: m.saglayici });
  };
  modalListe.appendChild(d);
});

document.getElementById('modelSecBtn').onclick = () => modelModal.classList.add('aktif');
document.getElementById('ustModelPill').onclick = () => modelModal.classList.add('aktif');
modelModal.onclick = (e) => { if(e.target === modelModal) modelModal.classList.remove('aktif'); };

function kacir(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function bicimle(s){
  let x = kacir(s);
  x = x.replace(/\`\`\`([\\w+-]*)\\n?([\\s\\S]*?)\`\`\`/g, function(_, dil, kod){
    const d = dil || 'kod';
    const ham = kod.replace(/\\n$/,'');
    return '<div class="kod-blok">' +
      '<div class="kod-ust">' +
        '<span class="kod-dil">' + d + '</span>' +
        '<div class="kod-butonlar">' +
          '<button class="kod-btn" onclick="kopyalaKod(this)">📋 Kopyala</button>' +
          '<button class="kod-btn uygula-btn" onclick="uygulaKod(this)">⚡ Editöre Uygula</button>' +
        '</div>' +
      '</div>' +
      '<pre><code>' + ham + '</code></pre>' +
    '</div>';
  });
  x = x.replace(/\`([^\\\`\\n]+)\`/g, '<code>$1</code>');
  return x;
}

window.kopyalaKod = function(btn) {
  const blok = btn.closest('.kod-blok');
  const kod = blok.querySelector('pre code').innerText;
  navigator.clipboard.writeText(kod);
  const esk = btn.textContent;
  btn.textContent = '✓ Kopyalandı';
  setTimeout(() => btn.textContent = esk, 1500);
};

window.uygulaKod = function(btn) {
  const blok = btn.closest('.kod-blok');
  const kod = blok.querySelector('pre code').innerText;
  vs.postMessage({ tip: 'uygula', kod: kod });
  const esk = btn.textContent;
  btn.textContent = '✓ Uygulandı';
  setTimeout(() => btn.textContent = esk, 1500);
};

function mesajEkle(tur, metin, ham){
  bos.style.display = 'none';
  sohbetIc.style.display = 'block';
  const d = document.createElement('div');
  d.className = 'mesaj ' + tur;
  const etiket = tur === 'kullanici' ? 'SEN' : (tur === 'ai' ? 'ELYTRA' : 'HATA');
  d.innerHTML = '<div class="etiket">' + etiket + '</div><div>' + (ham ? kacir(metin) : bicimle(metin)) + '</div>';
  sohbetIc.appendChild(d);
  document.getElementById('sohbet').scrollTop = document.getElementById('sohbet').scrollHeight;
  return d;
}

function gonder(){
  const m = t.value.trim(); if (!m) return;
  mesajEkle('kullanici', m, true);
  t.value = ''; t.style.height = 'auto';
  bekleyen = mesajEkle('ai', 'Düşünüyor...', true);
  gonderBtn.disabled = true;
  vs.postMessage({ tip: 'sor', metin: m, id: aktifKonusmaId });
}

gonderBtn.onclick = gonder;
t.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gonder(); }
});
t.addEventListener('input', () => {
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight, 220) + 'px';
});

document.querySelectorAll('.ornekKutu').forEach(k => {
  k.onclick = () => { t.value = k.getAttribute('data-sor'); gonder(); };
});

document.getElementById('btnKodEkle').onclick = () => {
  t.value = '@Code ' + t.value;
  t.focus();
};

document.getElementById('yeni').onclick = () => vs.postMessage({ tip: 'yeni' });
document.getElementById('bAnahtar').onclick = () => vs.postMessage({ tip: 'anahtar' });
document.getElementById('bAyarlar').onclick = () => vs.postMessage({ tip: 'ayarlar' });

function listeyiGuncelle(konusmalar, seciliId) {
  railListe.innerHTML = '';
  konusmalar.forEach(k => {
    const o = document.createElement('div');
    o.className = 'oge' + (k.id === seciliId ? ' aktif' : '');
    o.innerHTML = '<span class="ad">' + kacir(k.baslik) + '</span><button class="sil" title="Sil">&times;</button>';
    o.querySelector('.ad').onclick = () => vs.postMessage({ tip: 'ac', id: k.id });
    o.querySelector('.sil').onclick = (e) => { e.stopPropagation(); vs.postMessage({ tip: 'sil', id: k.id }); };
    railListe.appendChild(o);
  });
}

window.addEventListener('message', (e) => {
  const m = e.data;
  if (bekleyen) { bekleyen.remove(); bekleyen = null; }
  gonderBtn.disabled = false;

  if (m.tip === 'yanit') {
    mesajEkle('ai', m.metin);
    if (m.konusmalar) listeyiGuncelle(m.konusmalar, aktifKonusmaId);
  }
  if (m.tip === 'hata') {
    mesajEkle('hata', m.metin, true);
  }
  if (m.tip === 'konusma') {
    aktifKonusmaId = m.id;
    sohbetIc.innerHTML = '';
    if (!m.mesajlar || m.mesajlar.length === 0) {
      bos.style.display = 'flex';
      sohbetIc.style.display = 'none';
      document.getElementById('ustBaslik').textContent = 'Yeni Konuşma';
    } else {
      bos.style.display = 'none';
      sohbetIc.style.display = 'block';
      m.mesajlar.forEach(x => {
        mesajEkle(x.role === 'user' ? 'kullanici' : 'ai', x.content);
      });
    }
    if (m.konusmalar) listeyiGuncelle(m.konusmalar, aktifKonusmaId);
  }
  if (m.tip === 'modelGuncellendi') {
    document.getElementById('ustModelPill').textContent = m.model;
    document.getElementById('modelSecBtn').textContent = m.model;
  }
});

t.focus();
</script></body></html>`;
	}
}

// ─────────────────────────────────────────────────────────────
// Etkinleştirme (Extension Activation)
// ─────────────────────────────────────────────────────────────
function activate(context) {
	// Kenar Çubuğu Sağlayıcısını Kaydet
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'elytra.sohbetGorunum', new SohbetSaglayici(context),
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);

	// Komutlar
	context.subscriptions.push(
		// Ctrl+L -> Kenar çubuğu sohbetini öne çıkar ve odakla
		vscode.commands.registerCommand('elytra.chat', async () => {
			try {
				await vscode.commands.executeCommand('elytra.sohbetGorunum.focus');
			} catch (_) {
				BaslangicPaneli.goster(context);
			}
		}),

		// Ctrl+I -> Composer / Tam Ekran AI Paneli
		vscode.commands.registerCommand('elytra.baslangic', () => BaslangicPaneli.goster(context)),

		// Sohbeti Temizle
		vscode.commands.registerCommand('elytra.temizle', () => {
			konusmalar = []; aktifId = null;
			yayinla({ tip: 'konusma', id: null, mesajlar: [], konusmalar: [] });
			vscode.window.showInformationMessage('Elytra: Sohbet geçmişi temizlendi.');
		}),

		// Ctrl+K -> Cursor Tarzı Satır İçi Kod Düzenleme
		vscode.commands.registerCommand('elytra.inlineEdit', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) { return; }
			const secim = ed.selection;
			if (secim.isEmpty) {
				vscode.window.showWarningMessage('Elytra (Ctrl+K): Önce düzenlenecek kodu seçin.');
				return;
			}
			const talimat = await vscode.window.showInputBox({
				prompt: 'Cursor Tarzı Düzenleme: Ne yapılsın?',
				placeHolder: 'Örn: Bu fonksiyona tip kontrolleri ekle ve hata yakalamayı düzelt...',
				ignoreFocusOut: true,
			});
			if (!talimat) { return; }
			const mevcut = ed.document.getText(secim);
			await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: 'Elytra AI düzenliyor...' },
				async () => {
					try {
						const yanit = await aiSor([{
							role: 'user',
							content: 'Bu kodu şu talimata göre düzenle ve SADECE düzenlenmiş kodu kod bloğu içinde döndür:\nTalimat: ' + talimat + '\n\nKod:\n' + mevcut
						}]);
						const temiz = yanit.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
						await ed.edit(b => b.replace(secim, temiz));
						vscode.window.showInformationMessage('Elytra: Düzenleme uygulandı!');
					} catch (e) {
						vscode.window.showErrorMessage('Elytra: ' + String((e && e.message) || e));
					}
				}
			);
		}),

		// Kodu Açıkla
		vscode.commands.registerCommand('elytra.explain', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) { return; }
			const secim = ed.selection;
			const kod = secim.isEmpty ? ed.document.getText() : ed.document.getText(secim);
			await vscode.commands.executeCommand('elytra.sohbetGorunum.focus');
			await gonderVeYayinla(aktif(), 'Bu kodu açıkla:\n\n' + kod.slice(0, 8000));
		}),

		// API Anahtarı Ayarla
		vscode.commands.registerCommand('elytra.setKey', async () => {
			const a = ayar();
			const anahtar = await vscode.window.showInputBox({
				prompt: (SAGLAYICILAR[a.saglayici] || {}).ad + ' API Anahtarı',
				password: true,
				ignoreFocusOut: true,
				placeHolder: 'sk-...'
			});
			if (anahtar === undefined) { return; }
			await vscode.workspace.getConfiguration('elytra')
				.update('apiAnahtari', anahtar, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Elytra: API anahtarı başarıyla kaydedildi.');
		})
	);

	// Durum Çubuğu Butonu
	const durum = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	durum.text = '$(sparkle) Elytra (Ctrl+L)';
	durum.tooltip = 'Elytra AI Sohbetini Aç (Ctrl+L)';
	durum.command = 'elytra.chat';
	durum.show();
	context.subscriptions.push(durum);

	// Cursor Davranışı: Açılışta kenar çubuğunu otomatik göster
	setTimeout(() => {
		try {
			vscode.commands.executeCommand('workbench.view.extension.elytra');
		} catch (_) {}
	}, 600);

	// Eğer açık bir proje/dosya yoksa Composer ekranını da aç
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		BaslangicPaneli.goster(context);
	}
}

function deactivate() {}

module.exports = { activate, deactivate };
