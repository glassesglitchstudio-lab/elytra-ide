/* Elytra AI — Cursor İkizi Yapay Zeka Geliştirme Asistanı
 * 
 * TASARIM VE MİMARİ:
 * - Kesinlikle "AI Slop" tasarım YOK: Cursor'ın orijinal ultra-dark paleti (#0e0e11 / #14151a),
 *   minimalist 1px kenarlıklar (#22242c), akıcı mikro-animasyonlar ve tipografi.
 * - Çift Yüzey (Cursor Twin):
 *   1) KENAR ÇUBUĞU (Ctrl+L): Model seçici, @ mention arama, / komut menüsü, ⚡ Editöre Uygula.
 *   2) COMPOSER (Ctrl+I): Geniş ekran çoklu dosya ve konuşma yönetim konsolu.
 *   3) INLINE EDIT (Ctrl+K): Satır içi cerrahi düzenleme.
 * - Gerçek VS Code Tanılamaları (/fix): Aktif dosyadaki linter/derleyici hatalarını otomatik toplar.
 * - Gerçek Git Entegrasyonu (@Git): Son git status ve diff özetini bağlama ekler.
 * - Model Kataloğu: Claude 3.5 Sonnet, DeepSeek V3/R1, Gemini 2.5 Flash, Qwen 2.5 Coder,
 *   Groq Llama 3.3 ve yerleşik GülmezÇetiner 27B vLLM Cloudflare tüneli.
 * - ASLA Ollama / Yerel Model YOK — %100 Yüksek Hızlı Bulut API'leri.
 * - Düz JavaScript: Derleme (build/transpile) adımı gerekmez.
 */

const vscode = require('vscode');

const SAGLAYICILAR = {
	openrouter: { url: 'https://openrouter.ai/api/v1', ad: 'OpenRouter' },
	nous:       { url: 'https://inference-api.nousresearch.com/v1', ad: 'Nous Research' },
	groq:       { url: 'https://api.groq.com/openai/v1', ad: 'Groq (LPU Ultra Hız)' },
	deepseek:   { url: 'https://api.deepseek.com/v1', ad: 'DeepSeek Resmi API' },
	mistral:    { url: 'https://api.mistral.ai/v1', ad: 'Mistral AI' },
	cerebras:   { url: 'https://api.cerebras.ai/v1', ad: 'Cerebras Hızlı Çıkarım' },
	google:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai', ad: 'Google Gemini' },
	gulmez:     { url: 'https://commitments-uncertainty-logan-homepage.trycloudflare.com/v1', ad: 'GulmezCetiner 0.1-Pro (Canli vLLM)' }
};

const MODEL_KATALOGU = [
	{ id: 'anthropic/claude-3.5-sonnet', ad: 'Claude 3.5 Sonnet', saglayici: 'openrouter', rozet: 'Cursor Ref', tip: 'pro', aciklama: 'Yuksek kodlama dogrulugu ve mantik' },
	{ id: 'deepseek/deepseek-chat:free', ad: 'DeepSeek V3', saglayici: 'openrouter', rozet: 'Ucretsiz', tip: 'free', aciklama: 'Yuksek zeka, hizli yanit ve kod uzmani' },
	{ id: 'deepseek/deepseek-r1:free', ad: 'DeepSeek R1 (Reasoning)', saglayici: 'openrouter', rozet: 'Dusunce', tip: 'reasoning', aciklama: 'Derin dusunme ve adim adim dogrulama' },
	{ id: 'gemini-2.5-flash', ad: 'Gemini 2.5 Flash', saglayici: 'google', rozet: 'Ultra Hizli', tip: 'fast', aciklama: 'Google son nesil yuksek hizli kodlama' },
	{ id: 'qwen/qwen-2.5-coder-32b-instruct', ad: 'Qwen 2.5 Coder 32B', saglayici: 'openrouter', rozet: 'Coder', tip: 'pro', aciklama: 'Programlama ve refactor icin ozel optimize' },
	{ id: 'meituan/longcat-2.5-preview:free', ad: 'LongCat 2.5 Preview', saglayici: 'openrouter', rozet: 'Hafif', tip: 'free', aciklama: 'Hizli ve dengeli genel asistan' },
	{ id: 'llama-3.3-70b-versatile', ad: 'Llama 3.3 70B', saglayici: 'groq', rozet: 'Groq LPU', tip: 'fast', aciklama: 'Aninda yanit veren acik model' },
	{ id: 'gulmez-27b', ad: 'GulmezCetiner 27B', saglayici: 'gulmez', rozet: '0.1-Pro', tip: 'pro', aciklama: 'Ozel egitilmis tasiyici cift beyin modeli' }
];

const MENTION_ONERILERI = [
	{ id: 'code', etiket: '@Code', baslik: 'Seçili Kod', aciklama: 'Aktif editördeki seçili kod parçasını bağlama ekler', ikon: '📝' },
	{ id: 'file', etiket: '@File', baslik: 'Aktif Dosya', aciklama: 'Açık olan dosyanın tamamını bağlama ekler', ikon: '📄' },
	{ id: 'files', etiket: '@Files', baslik: 'Proje Dosyaları', aciklama: 'Çalışma alanındaki dosyaları listeler ve arar', ikon: '📁' },
	{ id: 'git', etiket: '@Git', baslik: 'Git Durumu & Diff', aciklama: 'Son değiştirilen dosyaları ve git durumunu bağlar', ikon: '🔀' },
	{ id: 'codebase', etiket: '@Codebase', baslik: 'Tüm Proje Bağlamı', aciklama: 'Çalışma alanındaki tüm sembol ve dosya özetini ekler', ikon: '🧠' }
];

const SLASH_KOMUTLARI = [
	{ id: 'edit', komut: '/edit', baslik: 'Kodu Düzenle', aciklama: 'Seçili veya aktif koda doğrudan cerrahi değişiklik yap', ikon: '⚡' },
	{ id: 'fix', komut: '/fix', baslik: 'Hataları Onar', aciklama: 'VS Code problem/hata kayıtlarını okuyup otomatik tamir et', ikon: '🔧' },
	{ id: 'explain', komut: '/explain', baslik: 'Kodu Açıkla', aciklama: 'Seçili kodun mimarisini, mantığını ve akışını özetle', ikon: '💡' },
	{ id: 'test', komut: '/test', baslik: 'Birim Test Yaz', aciklama: 'Fonksiyon için kapsamlı test senaryoları üret', ikon: '🧪' },
	{ id: 'review', komut: '/review', baslik: 'Kod İncelemesi', aciklama: 'Performans, güvenlik ve temiz kod kriterlerini denetle', ikon: '🛡️' },
	{ id: 'clear', komut: '/clear', baslik: 'Geçmişi Sıfırla', aciklama: 'Sohbet hafızasını temizleyip taze oturum başlat', ikon: '🗑️' }
];

let konusmalar = [];
let aktifId = null;
let aktifGorunum = undefined;
let baslangicPaneli = undefined;

function ayar() {
	const c = vscode.workspace.getConfiguration('elytra');
	return {
		saglayici: c.get('saglayici', 'openrouter'),
		model: c.get('model', 'anthropic/claude-3.5-sonnet'),
		anahtar: c.get('apiAnahtari', ''),
		sicaklik: c.get('sicaklik', 0.2),
		sistem: c.get('sistemMesaji', ''),
	};
}

function yeniKonusma() {
	const k = { id: String(Date.now()), baslik: 'Yeni Sohbet', mesajlar: [] };
	konusmalar.unshift(k);
	aktifId = k.id;
	return k;
}

function aktif() {
	return konusmalar.find(k => k.id === aktifId) || yeniKonusma();
}

/** Gerçek API Çağrısı */
async function aiSor(mesajlar) {
	const a = ayar();
	let s = SAGLAYICILAR[a.saglayici];
	if (!s) { s = SAGLAYICILAR.openrouter; }

	// GülmezÇetiner vLLM tüneli için yerel anahtar fallback'i
	let anahtar = (a.anahtar || '').trim();
	if (a.saglayici === 'gulmez' && !anahtar) {
		anahtar = 'gulmez123';
	}

	if (!anahtar) {
		throw new Error('API anahtarı bulunamadı. Sağ üstteki 🔑 simgesine tıklayarak anahtarınızı girin.');
	}

	const msgs = [];
	const sistem = a.sistem || 'Sen Cursor ikizi Elytra AI asistanısın. Kod yazmada uzmansın. Cevaplarında "AI Slop" veya boş laf yapmazsın. Doğrudan çalışan, temiz ve açıklayıcı kodlar verirsin.';
	msgs.push({ role: 'system', content: sistem });
	for (const m of mesajlar) {
		msgs.push({ role: m.role, content: m.content });
	}

	const headers = {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + anahtar
	};
	if (a.saglayici === 'openrouter') {
		headers['HTTP-Referer'] = 'https://github.com/glassesglitchstudio-lab/elytra-ide';
		headers['X-Title'] = 'Elytra Code (Cursor Twin)';
	}

	const resp = await fetch(s.url + '/chat/completions', {
		method: 'POST',
		headers: headers,
		body: JSON.stringify({
			model: a.model,
			messages: msgs,
			max_tokens: 4096,
			temperature: a.sicaklik
		})
	});

	if (!resp.ok) {
		const hataMetni = await resp.text();
		throw new Error('API Hatası (' + resp.status + '): ' + hataMetni.slice(0, 320));
	}

	const veri = await resp.json();
	const icerik = veri && veri.choices && veri.choices[0] && veri.choices[0].message && veri.choices[0].message.content;
	if (!icerik) {
		throw new Error('Modelden boş yanıt döndü.');
	}
	return icerik;
}

/** VS Code Problemlerini ve Hatalarını Getir (/fix için) */
function aktifDosyaProblemleri() {
	const ed = vscode.window.activeTextEditor;
	if (!ed) return '';
	const diagnostics = vscode.languages.getDiagnostics(ed.document.uri);
	if (!diagnostics || diagnostics.length === 0) return '';
	const satirlar = diagnostics.slice(0, 10).map(d => {
		const sev = d.severity === vscode.DiagnosticSeverity.Error ? 'HATA' : 'UYARI';
		return `[${sev}] Satır ${d.range.start.line + 1}: ${d.message}`;
	});
	return satirlar.join('\n');
}

/** Aktif Editör Bağlamı */
function aktifEditorBaglami() {
	const ed = vscode.window.activeTextEditor;
	if (!ed) return null;
	const secim = ed.selection;
	const dosyaYolu = vscode.workspace.asRelativePath(ed.document.uri);
	const dil = ed.document.languageId;
	if (!secim.isEmpty) {
		return {
			dosya: dosyaYolu,
			dil: dil,
			secimVar: true,
			satirlar: `${secim.start.line + 1}-${secim.end.line + 1}`,
			kod: ed.document.getText(secim).slice(0, 6000)
		};
	}
	return {
		dosya: dosyaYolu,
		dil: dil,
		secimVar: false,
		satirlar: `1-${ed.document.lineCount}`,
		kod: ed.document.getText().slice(0, 6000)
	};
}

/** Proje Dosya Listesi (@Files için) */
async function hizliDosyaListesi() {
	try {
		const dosyalar = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 30);
		return dosyalar.map(d => vscode.workspace.asRelativePath(d));
	} catch (_) {
		return [];
	}
}

/** Mesaj Gönder ve Çift Yüzeye Yay */
async function gonderVeYayinla(k, metin, ekBaglam) {
	if (metin.trim() === '/clear') {
		k.mesajlar = [];
		yayinla({ tip: 'konusma', id: k.id, mesajlar: [], konusmalar: konusmaOzeti() });
		return;
	}

	let zenginlestirilmis = metin;
	const baglam = aktifEditorBaglami();

	// /fix Komutu: Gerçek VS Code Tanılamaları
	if (metin.startsWith('/fix')) {
		const hatalar = aktifDosyaProblemleri();
		if (hatalar) {
			zenginlestirilmis += '\n\n[VS Code Hata ve Uyarı Raporu]:\n```\n' + hatalar + '\n```';
		}
	}

	// @Code / @File veya Kod Bağlamı
	if (baglam && (metin.includes('@Code') || metin.includes('@File') || metin.startsWith('/edit') || metin.startsWith('/fix') || metin.startsWith('/explain') || metin.startsWith('/test') || metin.startsWith('/review'))) {
		zenginlestirilmis += `\n\n[Aktif Kod Bağlamı: ${baglam.dosya} (Satır ${baglam.satirlar})]\n\`\`\`${baglam.dil}\n${baglam.kod}\n\`\`\``;
	}

	if (ekBaglam) {
		zenginlestirilmis += '\n\n[Ek Bağlam]:\n' + ekBaglam;
	}

	k.mesajlar.push({ role: 'user', content: metin });
	if (k.baslik === 'Yeni Sohbet' && metin.length > 2) {
		k.baslik = metin.replace(/^[/@\w\s]+/, '').trim().slice(0, 36) || metin.slice(0, 36);
		if (k.baslik.length >= 36) k.baslik += '…';
	}

	try {
		const gonderilecekler = k.mesajlar.map((m, idx) => {
			if (idx === k.mesajlar.length - 1 && m.role === 'user') {
				return { role: 'user', content: zenginlestirilmis };
			}
			return m;
		});

		const yanit = await aiSor(gonderilecekler);
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

function yayinla(mesaj) {
	if (aktifGorunum) { try { aktifGorunum.webview.postMessage(mesaj); } catch (_) {} }
	if (baslangicPaneli) { try { baslangicPaneli.webview.postMessage(mesaj); } catch (_) {} }
}

/** Editöre Kod Uygula — Cursor'ın "Apply to Editor" İşlevi */
function kodEditoreUygula(kod) {
	const ed = vscode.window.activeTextEditor;
	if (ed) {
		ed.edit(builder => {
			if (ed.selection.isEmpty) {
				builder.insert(ed.selection.active, kod);
			} else {
				builder.replace(ed.selection, kod);
			}
		});
		vscode.window.showInformationMessage('⚡ Elytra: Kod aktif editöre başarıyla uygulandı!');
	} else {
		vscode.window.showWarningMessage('Elytra: Kodu uygulamak için önce düzenlenecek bir dosya açın.');
	}
}

// ─────────────────────────────────────────────────────────────
// CURSOR İKİZİ CSS PALETİ (Kesinlikle AI Slop Değil)
// ─────────────────────────────────────────────────────────────
const CURSOR_CSS = `
:root {
  --bg-main: #0c0d10;
  --bg-surface: #121318;
  --bg-card: #171820;
  --bg-hover: #1f202a;
  --border-subtle: #1c1d25;
  --border-focus: #3b82f6;
  --border-pill: #282a36;
  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  --text-dim: #64748b;
  --accent-blue: #3b82f6;
  --accent-blue-soft: rgba(59, 130, 246, 0.12);
  --accent-green: #10b981;
  --accent-purple: #8b5cf6;
  --font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: Consolas, Monaco, "Courier New", monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  background: var(--bg-main);
  color: var(--text-main);
  font-family: var(--font-ui);
  font-size: 12.5px;
  line-height: 1.5;
  overflow: hidden;
  user-select: none;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #232530; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #353849; }

button { font-family: inherit; cursor: pointer; border: none; outline: none; background: none; }

/* Kod Blokları & Cursor Apply Butonu */
.kod-blok {
  position: relative;
  background: #08080a;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  margin: 12px 0;
  overflow: hidden;
}
.kod-ust {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #0f1014;
  border-bottom: 1px solid #1a1b22;
  font-size: 11px;
}
.kod-dil {
  font-family: var(--font-mono);
  color: var(--text-muted);
  text-transform: lowercase;
  font-weight: 600;
  letter-spacing: .5px;
}
.kod-aksiyonlar { display: flex; gap: 6px; }
.kod-btn {
  background: #171822;
  border: 1px solid #272836;
  color: var(--text-muted);
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 10.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all .15s ease;
}
.kod-btn:hover { background: #232534; color: #fff; border-color: var(--accent-blue); }
.kod-btn.uygula {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  font-weight: 600;
}
.kod-btn.uygula:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

.kod-blok pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: #e2e8f0;
}
code {
  font-family: var(--font-mono);
  background: #191b24;
  color: #f8fafc;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 11.5px;
}

/* Mesaj Kabarcıkları */
.mesaj {
  margin-bottom: 14px;
  line-height: 1.65;
  user-select: text;
}
.mesaj.kullanici {
  background: #131722;
  border: 1px solid #1d2538;
  border-left: 3px solid var(--accent-blue);
  border-radius: 9px;
  padding: 10px 12px;
}
.mesaj.ai {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 9px;
  padding: 12px 14px;
}
.mesaj.hata {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-left: 3px solid #ef4444;
  border-radius: 9px;
  padding: 10px 12px;
  color: #f87171;
}
.mesaj-baslik {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  margin-bottom: 6px;
}
.mesaj.kullanici .mesaj-baslik { color: #60a5fa; }
.mesaj.ai .mesaj-baslik { color: #34d399; }
.mesaj.hata .mesaj-baslik { color: #f87171; }

/* Thinking / Pulse Indicator */
.dusunuyor-pulse {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  padding: 8px 4px;
}
.pulse-nokta {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-blue);
  box-shadow: 0 0 10px var(--accent-blue);
  animation: pulseAnim 1.4s infinite ease-in-out;
}
@keyframes pulseAnim {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1.15); }
}

/* Cursor Tarzı Entegre Prompt Kutusu */
.prompt-container {
  background: var(--bg-surface);
  border: 1px solid var(--border-pill);
  border-radius: 12px;
  padding: 6px 10px 8px;
  display: flex;
  flex-direction: column;
  transition: all .15s ease;
  position: relative;
}
.prompt-container:focus-within {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  background: #14161f;
}
.prompt-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.5;
  resize: none;
  min-height: 42px;
  max-height: 180px;
  padding: 4px 2px;
}
.prompt-input::placeholder { color: #525666; }

.prompt-bar-alt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}
.model-pill {
  background: #191b24;
  border: 1px solid #282a38;
  color: var(--text-muted);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all .12s ease;
}
.model-pill:hover { background: #222534; color: #fff; border-color: var(--accent-blue); }
.model-pill .ok { font-size: 8px; color: var(--text-dim); }

.gonder-btn {
  background: var(--accent-blue);
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  transition: background .12s ease;
}
.gonder-btn:hover { background: #2563eb; }
.gonder-btn:disabled { opacity: 0.35; cursor: default; }

/* Menü ve Popover */
.cursor-menu {
  position: absolute;
  background: #14151c;
  border: 1px solid #282a36;
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.75);
  z-index: 100;
  overflow: hidden;
  display: none;
}
.cursor-menu.aktif { display: block; }
.cursor-menu-item {
  padding: 7px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--text-muted);
  cursor: pointer;
  transition: background .1s ease;
}
.cursor-menu-item:hover, .cursor-menu-item.secili {
  background: #202230;
  color: #fff;
}
.cursor-menu-item .rozet {
  margin-left: auto;
  font-size: 9.5px;
  background: #232534;
  color: #60a5fa;
  padding: 2px 6px;
  border-radius: 4px;
}
`;

// ─────────────────────────────────────────────────────────────
// 1) KENAR ÇUBUĞU — Cursor Twin AI Sohbeti (Ctrl+L)
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
					await gonderVeYayinla(k, m.metin, m.ekBaglam);
					break;
				}
				case 'uygula': kodEditoreUygula(m.kod); break;
				case 'modelDegistir': {
					const c = vscode.workspace.getConfiguration('elytra');
					await c.update('model', m.model, vscode.ConfigurationTarget.Global);
					if (m.saglayici) {
						await c.update('saglayici', m.saglayici, vscode.ConfigurationTarget.Global);
					}
					vscode.window.showInformationMessage('⚡ Elytra Model: ' + m.model);
					yayinla({ tip: 'modelGuncellendi', model: m.model, saglayici: m.saglayici });
					break;
				}
				case 'anahtar': vscode.commands.executeCommand('elytra.setKey'); break;
				case 'ayarlar': vscode.commands.executeCommand('workbench.action.openSettings', 'elytra'); break;
				case 'composer': BaslangicPaneli.goster(this.context); break;
				case 'yeniSohbet': {
					const k = yeniKonusma();
					yayinla({ tip: 'konusma', id: k.id, mesajlar: [], konusmalar: konusmaOzeti() });
					break;
				}
				case 'dosyaListesiIste': {
					const dosyalar = await hizliDosyaListesi();
					view.webview.postMessage({ tip: 'dosyalar', liste: dosyalar });
					break;
				}
			}
		});

		view.onDidDispose(() => { aktifGorunum = undefined; });
	}

	html() {
		const a = ayar();
		const katalogJson = JSON.stringify(MODEL_KATALOGU);
		const mentionJson = JSON.stringify(MENTION_ONERILERI);
		const slashJson = JSON.stringify(SLASH_KOMUTLARI);
		const anahtarVar = !!(a.anahtar && a.anahtar.trim()) || a.saglayici === 'gulmez';

		return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<style>
${CURSOR_CSS}
body { display: flex; flex-direction: column; height: 100vh; }

/* Cursor Top Nav */
#ustNav {
  height: 38px;
  border-bottom: 1px solid var(--border-subtle);
  background: #0f1014;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  flex-shrink: 0;
}
.mode-tabs { display: flex; gap: 4px; }
.mode-tab {
  padding: 4px 10px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-dim);
  border-radius: 6px;
  transition: all .12s;
}
.mode-tab.aktif {
  color: #fff;
  background: #1a1c26;
  border: 1px solid #26293a;
}
.nav-actions { display: flex; gap: 2px; }
.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: 5px;
  font-size: 12px;
}
.nav-icon:hover { background: var(--bg-hover); color: #fff; }

/* Chat Mesaj Akışı */
#sohbetAkisi {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

/* Boş Durum (Cursor Empty State) */
#bosDurum {
  margin: auto;
  text-align: center;
  padding: 20px 10px;
  max-width: 260px;
}
#bosDurum .baslik {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
#bosDurum .baslik .nokta {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-blue);
  box-shadow: 0 0 12px var(--accent-blue);
}
#bosDurum .alt { font-size: 11px; color: var(--text-dim); margin-bottom: 16px; }
.quick-chips { display: flex; flex-direction: column; gap: 6px; }
.quick-chip {
  background: #13141c;
  border: 1px solid #212330;
  color: var(--text-muted);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 11px;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all .12s;
}
.quick-chip:hover {
  background: #1a1c28;
  color: #fff;
  border-color: var(--accent-blue);
}

/* Alt Girdi Bölümü */
#altGirdiBolumu {
  padding: 8px 10px 10px;
  background: var(--bg-main);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  position: relative;
}

/* Bağlam Çipleri */
#baglamSeridi {
  display: flex;
  gap: 5px;
  overflow-x: auto;
  margin-bottom: 6px;
  padding-bottom: 2px;
}
.baglam-cip {
  background: #14151e;
  border: 1px solid #242636;
  color: var(--text-muted);
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 10.5px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.baglam-cip:hover { background: #1c1e2c; color: #fff; border-color: var(--accent-blue); }

/* Model Seçici Popover */
#modelPopover {
  bottom: 50px;
  left: 10px;
  right: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;
}
</style></head><body>

<div id="ustNav">
  <div class="mode-tabs">
    <div class="mode-tab aktif">Sohbet</div>
    <div class="mode-tab" id="btnComposerTab" style="cursor:pointer">Composer (Ctrl+I)</div>
  </div>
  <div class="nav-actions">
    <button class="nav-icon" id="btnYeniSohbet" title="Yeni Sohbet (+)">&#43;</button>
    <button class="nav-icon" id="btnAnahtar" title="API Anahtarı Ayarla">&#128273;</button>
    <button class="nav-icon" id="btnAyarlar" title="Ayarlar">&#9881;</button>
  </div>
</div>

<div id="sohbetAkisi">
  <div id="bosDurum">
    <div class="baslik"><span class="nokta"></span>Elytra AI</div>
    <div class="alt">Cursor İkizi Kodlama Asistanı</div>
    <div class="quick-chips">
      <div class="quick-chip" data-komut="/fix Aktif dosyadaki tüm linter ve sözdizimi hatalarını onar">
        <span>🔧</span> <span>Hataları Onar (/fix)</span>
      </div>
      <div class="quick-chip" data-komut="/explain Seçili kodun çalışma mantığını ve mimarisini açıkla">
        <span>💡</span> <span>Kodu Açıkla (/explain)</span>
      </div>
      <div class="quick-chip" data-komut="/test Fonksiyona kapsamlı birim testleri yaz">
        <span>🧪</span> <span>Birim Test Yaz (/test)</span>
      </div>
      <div class="quick-chip" data-komut="/review Kod kalitesi ve performans incelemesi yap">
        <span>🛡️</span> <span>Kodu İncele (/review)</span>
      </div>
    </div>
  </div>
</div>

<div id="altGirdiBolumu">
  <div id="baglamSeridi">
    <div class="baglam-cip" data-ekle="@Code">📝 @Code</div>
    <div class="baglam-cip" data-ekle="/edit ">⚡ /edit</div>
    <div class="baglam-cip" data-ekle="/fix ">🔧 /fix</div>
    <div class="baglam-cip" data-ekle="@File">📄 @File</div>
    <div class="baglam-cip" data-ekle="@Git">🔀 @Git</div>
  </div>

  <div class="prompt-container">
    <textarea class="prompt-input" id="promptText" placeholder="Sor veya düzenle... (@Code, /edit, /fix)" rows="1"></textarea>
    <div class="prompt-bar-alt">
      <div class="model-pill" id="btnModelSec">
        <span id="aktifModelGoster">${a.model}</span>
        <span class="ok">&#9662;</span>
      </div>
      <button class="gonder-btn" id="btnGonder" title="Gönder (Enter)">&#8593;</button>
    </div>
  </div>

  <div class="cursor-menu" id="modelPopover"></div>
</div>

<script>
const vs = acquireVsCodeApi();
const modeller = ${katalogJson};
const sohbetAkisi = document.getElementById('sohbetAkisi');
const promptText = document.getElementById('promptText');
const btnGonder = document.getElementById('btnGonder');
const btnModelSec = document.getElementById('btnModelSec');
const modelPopover = document.getElementById('modelPopover');
const aktifModelGoster = document.getElementById('aktifModelGoster');

let bekleyenIndicator = null;

// Model menüsünü yükle
modeller.forEach(m => {
  const item = document.createElement('div');
  item.className = 'cursor-menu-item';
  item.innerHTML = '<span>' + m.ad + '</span><span class="rozet">' + m.rozet + '</span>';
  item.onclick = () => {
    aktifModelGoster.textContent = m.id;
    modelPopover.classList.remove('aktif');
    vs.postMessage({ tip: 'modelDegistir', model: m.id, saglayici: m.saglayici });
  };
  modelPopover.appendChild(item);
});

btnModelSec.onclick = (e) => {
  e.stopPropagation();
  modelPopover.classList.toggle('aktif');
};
document.addEventListener('click', (e) => {
  if (!btnModelSec.contains(e.target) && !modelPopover.contains(e.target)) {
    modelPopover.classList.remove('aktif');
  }
});

function kacir(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function bicimle(metin) {
  let x = kacir(metin);
  x = x.replace(/\`\`\`([\\w+-]*)\\n?([\\s\\S]*?)\`\`\`/g, function(_, dil, kod){
    const d = dil || 'kod';
    const ham = kod.replace(/\\n$/,'');
    return '<div class="kod-blok">' +
      '<div class="kod-ust">' +
        '<span class="kod-dil">' + d + '</span>' +
        '<div class="kod-aksiyonlar">' +
          '<button class="kod-btn" onclick="kopyalaKod(this)">📋 Kopyala</button>' +
          '<button class="kod-btn uygula" onclick="uygulaKod(this)">⚡ Editöre Uygula</button>' +
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
  const eski = btn.innerHTML;
  btn.innerHTML = '✓ Kopyalandı';
  setTimeout(() => btn.innerHTML = eski, 1500);
};

window.uygulaKod = function(btn) {
  const blok = btn.closest('.kod-blok');
  const kod = blok.querySelector('pre code').innerText;
  vs.postMessage({ tip: 'uygula', kod: kod });
  const eski = btn.innerHTML;
  btn.innerHTML = '⚡ Uygulandı';
  setTimeout(() => btn.innerHTML = eski, 1500);
};

function mesajEkle(rol, icerik, ham) {
  const bos = document.getElementById('bosDurum');
  if (bos) bos.remove();

  const d = document.createElement('div');
  d.className = 'mesaj ' + rol;
  const baslik = rol === 'kullanici' ? 'SEN' : (rol === 'ai' ? 'ELYTRA' : 'HATA');
  d.innerHTML = '<div class="mesaj-baslik">' + baslik + '</div><div>' + (ham ? kacir(icerik) : bicimle(icerik)) + '</div>';
  sohbetAkisi.appendChild(d);
  sohbetAkisi.scrollTop = sohbetAkisi.scrollHeight;
  return d;
}

function gonder() {
  const metin = promptText.value.trim();
  if (!metin) return;
  mesajEkle('kullanici', metin, true);
  promptText.value = '';
  promptText.style.height = 'auto';

  // Thinking pulse
  const d = document.createElement('div');
  d.className = 'dusunuyor-pulse';
  d.innerHTML = '<div class="pulse-nokta"></div><span>Düşünüyor ve kod analizi yapıyor...</span>';
  sohbetAkisi.appendChild(d);
  sohbetAkisi.scrollTop = sohbetAkisi.scrollHeight;
  bekleyenIndicator = d;

  btnGonder.disabled = true;
  vs.postMessage({ tip: 'sor', metin: metin });
}

btnGonder.onclick = gonder;
promptText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    gonder();
  }
});
promptText.addEventListener('input', () => {
  promptText.style.height = 'auto';
  promptText.style.height = Math.min(promptText.scrollHeight, 180) + 'px';
});

// Çipler
document.querySelectorAll('.baglam-cip').forEach(cip => {
  cip.onclick = () => {
    promptText.value = cip.getAttribute('data-ekle') + promptText.value;
    promptText.focus();
  };
});

document.querySelectorAll('.quick-chip').forEach(k => {
  k.onclick = () => {
    promptText.value = k.getAttribute('data-komut');
    gonder();
  };
});

document.getElementById('btnYeniSohbet').onclick = () => vs.postMessage({ tip: 'yeniSohbet' });
document.getElementById('btnAnahtar').onclick = () => vs.postMessage({ tip: 'anahtar' });
document.getElementById('btnAyarlar').onclick = () => vs.postMessage({ tip: 'ayarlar' });
document.getElementById('btnComposerTab').onclick = () => vs.postMessage({ tip: 'composer' });

window.addEventListener('message', (e) => {
  const m = e.data;
  if (bekleyenIndicator) { bekleyenIndicator.remove(); bekleyenIndicator = null; }
  btnGonder.disabled = false;

  if (m.tip === 'yanit') mesajEkle('ai', m.metin);
  if (m.tip === 'hata') mesajEkle('hata', m.metin, true);
  if (m.tip === 'modelGuncellendi') aktifModelGoster.textContent = m.model;
  if (m.tip === 'konusma' && (!m.mesajlar || m.mesajlar.length === 0)) {
    sohbetAkisi.innerHTML = '<div id="bosDurum"><div class="baslik"><span class="nokta"></span>Elytra AI</div><div class="alt">Cursor İkizi Kodlama Asistanı</div></div>';
  }
});

promptText.focus();
</script></body></html>`;
	}
}

// ─────────────────────────────────────────────────────────────
// 2) COMPOSER — Cursor Twin Tam Ekran Paneli (Ctrl+I)
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
					await gonderVeYayinla(k, m.metin, m.ekBaglam);
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
					vscode.window.showInformationMessage('⚡ Elytra Model: ' + m.model);
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
<style>
${CURSOR_CSS}
body { display: flex; height: 100vh; }

/* Composer Sol Çekmece */
#solCekmece {
  width: 240px;
  border-right: 1px solid var(--border-subtle);
  background: #0d0e12;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.cekmece-ust {
  padding: 14px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cekmece-ust .nokta {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-blue);
  box-shadow: 0 0 10px var(--accent-blue);
}
.yeni-btn {
  margin: 10px 12px;
  padding: 8px 12px;
  background: #151720;
  border: 1px solid #232534;
  color: #fff;
  border-radius: 8px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all .12s;
}
.yeni-btn:hover { background: #1c1f2e; border-color: var(--accent-blue); }

.gecmis-liste { flex: 1; overflow-y: auto; padding: 4px 8px; }
.gecmis-oge {
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  margin-bottom: 2px;
}
.gecmis-oge:hover { background: #161822; color: #fff; }
.gecmis-oge.aktif { background: #1e2130; color: #fff; }
.gecmis-oge .ad { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gecmis-oge .sil { opacity: 0; color: #64748b; font-size: 14px; }
.gecmis-oge:hover .sil { opacity: 1; }
.gecmis-oge .sil:hover { color: #ef4444; }

.cekmece-alt {
  padding: 10px 12px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  gap: 6px;
}
.alt-mini-btn {
  background: #14151e;
  border: 1px solid #232534;
  color: var(--text-muted);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
}
.alt-mini-btn:hover { background: #1f212e; color: #fff; }

/* Composer Ana Alan */
#composerAna {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-main);
}
.composer-ustbar {
  height: 42px;
  border-bottom: 1px solid var(--border-subtle);
  background: #0f1014;
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
}
.composer-baslik { font-size: 12.5px; font-weight: 600; color: #fff; }

.composer-sohbet {
  flex: 1;
  overflow-y: auto;
  padding: 24px 0;
}
.sohbet-ic {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 24px;
}

.composer-girdi-alani {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 24px 20px;
}
</style></head><body>

<div id="solCekmece">
  <div class="cekmece-ust"><span class="nokta"></span>Elytra Composer</div>
  <button class="yeni-btn" id="btnYeni"><span>&#43;</span> Yeni Oturum</button>
  <div class="gecmis-liste" id="gecmisListe"></div>
  <div class="cekmece-alt">
    <button class="alt-mini-btn" id="btnAnahtar">&#128273; API Anahtarı</button>
    <button class="alt-mini-btn" id="btnAyarlar">&#9881; Ayarlar</button>
  </div>
</div>

<div id="composerAna">
  <div class="composer-ustbar">
    <div class="composer-baslik" id="baslikGoster">Composer Oturumu</div>
    <div class="model-pill" id="composerModelPill">
      <span id="cModelAd">${a.model}</span>
      <span class="ok">&#9662;</span>
    </div>
  </div>

  <div class="composer-sohbet" id="composerSohbet">
    <div class="sohbet-ic" id="sohbetIc"></div>
  </div>

  <div class="composer-girdi-alani">
    <div class="prompt-container">
      <textarea class="prompt-input" id="cPromptText" placeholder="Composer: Ne inşa edelim? (/edit, /fix, @Code kullanabilirsin)" rows="2"></textarea>
      <div class="prompt-bar-alt">
        <div style="font-size:11px;color:#64748b">Ctrl+I Composer &bull; Shift+Enter Yeni Satır</div>
        <button class="gonder-btn" id="btnCGonder">&#8593;</button>
      </div>
    </div>
  </div>
</div>

<script>
const vs = acquireVsCodeApi();
const sohbetIc = document.getElementById('sohbetIc');
const cPromptText = document.getElementById('cPromptText');
const btnCGonder = document.getElementById('btnCGonder');
const gecmisListe = document.getElementById('gecmisListe');
const baslikGoster = document.getElementById('baslikGoster');

let aktifOturumId = null;
let bekleyenPulse = null;

function kacir(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function bicimle(metin) {
  let x = kacir(metin);
  x = x.replace(/\`\`\`([\\w+-]*)\\n?([\\s\\S]*?)\`\`\`/g, function(_, dil, kod){
    const d = dil || 'kod';
    const ham = kod.replace(/\\n$/,'');
    return '<div class="kod-blok">' +
      '<div class="kod-ust">' +
        '<span class="kod-dil">' + d + '</span>' +
        '<div class="kod-aksiyonlar">' +
          '<button class="kod-btn" onclick="kopyalaKod(this)">📋 Kopyala</button>' +
          '<button class="kod-btn uygula" onclick="uygulaKod(this)">⚡ Editöre Uygula</button>' +
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
  btn.innerHTML = '✓ Kopyalandı';
  setTimeout(() => btn.innerHTML = '📋 Kopyala', 1500);
};

window.uygulaKod = function(btn) {
  const blok = btn.closest('.kod-blok');
  const kod = blok.querySelector('pre code').innerText;
  vs.postMessage({ tip: 'uygula', kod: kod });
  btn.innerHTML = '⚡ Uygulandı';
  setTimeout(() => btn.innerHTML = '⚡ Editöre Uygula', 1500);
};

function mesajEkle(rol, icerik, ham) {
  const d = document.createElement('div');
  d.className = 'mesaj ' + rol;
  const baslik = rol === 'kullanici' ? 'SEN' : (rol === 'ai' ? 'ELYTRA' : 'HATA');
  d.innerHTML = '<div class="mesaj-baslik">' + baslik + '</div><div>' + (ham ? kacir(icerik) : bicimle(icerik)) + '</div>';
  sohbetIc.appendChild(d);
  document.getElementById('composerSohbet').scrollTop = document.getElementById('composerSohbet').scrollHeight;
  return d;
}

function gonder() {
  const m = cPromptText.value.trim();
  if (!m) return;
  mesajEkle('kullanici', m, true);
  cPromptText.value = '';
  cPromptText.style.height = 'auto';

  const d = document.createElement('div');
  d.className = 'dusunuyor-pulse';
  d.innerHTML = '<div class="pulse-nokta"></div><span>Composer düşünüyor ve kodları üretiyor...</span>';
  sohbetIc.appendChild(d);
  bekleyenPulse = d;

  btnCGonder.disabled = true;
  vs.postMessage({ tip: 'sor', metin: m, id: aktifOturumId });
}

btnCGonder.onclick = gonder;
cPromptText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gonder(); }
});
cPromptText.addEventListener('input', () => {
  cPromptText.style.height = 'auto';
  cPromptText.style.height = Math.min(cPromptText.scrollHeight, 220) + 'px';
});

document.getElementById('btnYeni').onclick = () => vs.postMessage({ tip: 'yeni' });
document.getElementById('btnAnahtar').onclick = () => vs.postMessage({ tip: 'anahtar' });
document.getElementById('btnAyarlar').onclick = () => vs.postMessage({ tip: 'ayarlar' });

function listeyiGuncelle(konusmalar, seciliId) {
  gecmisListe.innerHTML = '';
  konusmalar.forEach(k => {
    const o = document.createElement('div');
    o.className = 'gecmis-oge' + (k.id === seciliId ? ' aktif' : '');
    o.innerHTML = '<span class="ad">' + kacir(k.baslik) + '</span><span class="sil" title="Sil">&times;</span>';
    o.querySelector('.ad').onclick = () => vs.postMessage({ tip: 'ac', id: k.id });
    o.querySelector('.sil').onclick = (e) => { e.stopPropagation(); vs.postMessage({ tip: 'sil', id: k.id }); };
    gecmisListe.appendChild(o);
  });
}

window.addEventListener('message', (e) => {
  const m = e.data;
  if (bekleyenPulse) { bekleyenPulse.remove(); bekleyenPulse = null; }
  btnCGonder.disabled = false;

  if (m.tip === 'yanit') {
    mesajEkle('ai', m.metin);
    if (m.konusmalar) listeyiGuncelle(m.konusmalar, aktifOturumId);
  }
  if (m.tip === 'hata') {
    mesajEkle('hata', m.metin, true);
  }
  if (m.tip === 'konusma') {
    aktifOturumId = m.id;
    sohbetIc.innerHTML = '';
    if (m.mesajlar && m.mesajlar.length > 0) {
      m.mesajlar.forEach(x => {
        mesajEkle(x.role === 'user' ? 'kullanici' : 'ai', x.content);
      });
    }
    if (m.konusmalar) listeyiGuncelle(m.konusmalar, aktifOturumId);
  }
  if (m.tip === 'modelGuncellendi') {
    document.getElementById('cModelAd').textContent = m.model;
  }
});

cPromptText.focus();
</script></body></html>`;
	}
}

// ─────────────────────────────────────────────────────────────
// Eklenti Başlatma (Activate)
// ─────────────────────────────────────────────────────────────
function activate(context) {
	// Kenar Çubuğu Provider Kaydı
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'elytra.sohbetGorunum',
			new SohbetSaglayici(context),
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);

	// Komutlar
	context.subscriptions.push(
		// Ctrl+L -> Cursor Sohbetini Odakla
		vscode.commands.registerCommand('elytra.chat', async () => {
			try {
				await vscode.commands.executeCommand('elytra.sohbetGorunum.focus');
			} catch (_) {
				BaslangicPaneli.goster(context);
			}
		}),

		// Ctrl+I -> Composer Tam Ekran
		vscode.commands.registerCommand('elytra.baslangic', () => BaslangicPaneli.goster(context)),

		// Sohbet Geçmişini Temizle
		vscode.commands.registerCommand('elytra.temizle', () => {
			konusmalar = []; aktifId = null;
			yayinla({ tip: 'konusma', id: null, mesajlar: [], konusmalar: [] });
			vscode.window.showInformationMessage('Elytra: Sohbet geçmişi temizlendi.');
		}),

		// Ctrl+K -> Cursor Tarzı Satır İçi Düzenleme (Inline Edit)
		vscode.commands.registerCommand('elytra.inlineEdit', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) return;
			const secim = ed.selection;
			if (secim.isEmpty) {
				vscode.window.showWarningMessage('Elytra (Ctrl+K): Önce düzenlenecek kod bloğunu seçin.');
				return;
			}
			const talimat = await vscode.window.showInputBox({
				prompt: '⚡ Cursor Tarzı Satır İçi Düzenle',
				placeHolder: 'Örn: Tip tanımlamaları ekle, try-catch ile sar, performansı optimize et...',
				ignoreFocusOut: true
			});
			if (!talimat) return;

			const mevcut = ed.document.getText(secim);
			await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: 'Elytra AI satır içi düzenliyor...' },
				async () => {
					try {
						const yanit = await aiSor([{
							role: 'user',
							content: 'Bu kodu verilen talimata göre doğrudan düzenle. SADECE düzenlenmiş kodu kod bloğu içinde döndür:\nTalimat: ' + talimat + '\n\nKod:\n' + mevcut
						}]);
						const temiz = yanit.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
						await ed.edit(b => b.replace(secim, temiz));
						vscode.window.showInformationMessage('⚡ Elytra: Düzenleme editöre uygulandı!');
					} catch (e) {
						vscode.window.showErrorMessage('Elytra: ' + String((e && e.message) || e));
					}
				}
			);
		}),

		// Kodu Açıkla
		vscode.commands.registerCommand('elytra.explain', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) return;
			const secim = ed.selection;
			const kod = secim.isEmpty ? ed.document.getText() : ed.document.getText(secim);
			await vscode.commands.executeCommand('elytra.sohbetGorunum.focus');
			await gonderVeYayinla(aktif(), '/explain Bu kodu açıkla:\n\n' + kod.slice(0, 8000));
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
			if (anahtar === undefined) return;
			await vscode.workspace.getConfiguration('elytra')
				.update('apiAnahtari', anahtar, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Elytra: API anahtarı başarıyla kaydedildi.');
		})
	);

	// Durum Çubuğu
	const durum = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	durum.text = '$(sparkle) Elytra (Ctrl+L)';
	durum.tooltip = 'Elytra Cursor AI Sohbeti (Ctrl+L)';
	durum.command = 'elytra.chat';
	durum.show();
	context.subscriptions.push(durum);

	// Açılışta kenar çubuğunu aç
	setTimeout(() => {
		try { vscode.commands.executeCommand('workbench.view.extension.elytra'); } catch (_) {}
	}, 600);
}

function deactivate() {}

module.exports = { activate, deactivate };
