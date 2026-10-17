/* Elytra AI — Cursor tarzı AI asistanı (düz JavaScript, derleme gerektirmez)
 *
 * NEDEN DÜZ JS: Önceki sürüm TypeScript'ti ve derlenmiyordu (out/ yoktu),
 * bu yüzden uzantı hiç yüklenmiyordu. Düz JS ile derleme adımı gereksiz.
 *
 * SAĞLADIKLARI:
 *   - Kenar çubuğu (activity bar) görünümü + sohbet webview'i
 *   - Satır içi düzenleme (Ctrl+K)
 *   - Kodu açıkla
 *   - API anahtarı yönetimi
 *   - Durum çubuğu
 *
 * SAHTE CEVAP ÜRETMEZ: gerçek sağlayıcı API'sine çağrı yapar; hata olursa
 * dürüst hata gösterir.
 */

const vscode = require('vscode');

/** Sağlayıcı uç noktaları — Ollama/yerel model YOK, yalnızca bulut. */
const SAGLAYICILAR = {
	nous:       { url: 'https://inference-api.nousresearch.com/v1', ad: 'Nous Research' },
	openrouter: { url: 'https://openrouter.ai/api/v1',              ad: 'OpenRouter' },
	groq:       { url: 'https://api.groq.com/openai/v1',            ad: 'Groq' },
	deepseek:   { url: 'https://api.deepseek.com/v1',               ad: 'DeepSeek' },
	mistral:    { url: 'https://api.mistral.ai/v1',                 ad: 'Mistral' },
	cerebras:   { url: 'https://api.cerebras.ai/v1',                ad: 'Cerebras' },
	google:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai', ad: 'Google' },
};

/** Sohbet geçmişi (kenar çubuğu yeniden çizildiğinde korunur). */
let gecmis = [];

/** Aktif webview referansı. */
let aktifGorunum = undefined;

/** Ayarları oku. */
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

/** Gerçek API çağrısı. Hata durumunda dürüst hata fırlatır. */
async function aiSor(mesajlar) {
	const a = ayar();
	if (!a.anahtar || !a.anahtar.trim()) {
		throw new Error('API anahtarı yok. Komut paletinden "Elytra: API Anahtarı Ayarla" çalıştır.');
	}
	const s = SAGLAYICILAR[a.saglayici];
	if (!s) {
		throw new Error('Bilinmeyen sağlayıcı: ' + a.saglayici);
	}

	const govde = { model: a.model, max_tokens: 4096, temperature: a.sicaklik };
	const msgs = [];
	if (a.sistem && a.sistem.trim()) {
		msgs.push({ role: 'system', content: a.sistem });
	}
	for (const m of mesajlar) {
		msgs.push(m);
	}
	govde.messages = msgs;

	const yanit = await fetch(s.url + '/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + a.anahtar.trim(),
		},
		body: JSON.stringify(govde),
	});

	if (!yanit.ok) {
		const metin = await yanit.text();
		throw new Error('API hatası (' + yanit.status + '): ' + metin.slice(0, 300));
	}
	const veri = await yanit.json();
	const icerik = veri && veri.choices && veri.choices[0] && veri.choices[0].message && veri.choices[0].message.content;
	if (!icerik) {
		throw new Error('Model boş yanıt döndü.');
	}
	return icerik;
}

/** Kenar çubuğu sohbet görünümü. */
class SohbetSaglayici {
	constructor(context) {
		this.context = context;
	}

	resolveWebviewView(view) {
		aktifGorunum = view;
		view.webview.options = { enableScripts: true };
		view.webview.html = this.html();

		view.webview.onDidReceiveMessage(async (m) => {
			switch (m.tip) {
				case 'sor': {
					gecmis.push({ role: 'user', content: m.metin });
					try {
						const yanit = await aiSor(gecmis);
						gecmis.push({ role: 'assistant', content: yanit });
						view.webview.postMessage({ tip: 'yanit', metin: yanit });
					} catch (e) {
						gecmis.pop();
						view.webview.postMessage({ tip: 'hata', metin: String((e && e.message) || e) });
					}
					break;
				}
				case 'temizle': {
					gecmis = [];
					view.webview.postMessage({ tip: 'temizlendi' });
					break;
				}
				case 'anahtar': {
					vscode.commands.executeCommand('elytra.setKey');
					break;
				}
				case 'ayarlar': {
					vscode.commands.executeCommand('workbench.action.openSettings', 'elytra');
					break;
				}
			}
		});

		view.onDidDispose(() => { aktifGorunum = undefined; });
	}

	/** Sohbet HTML'i — Cursor tarzı koyu arayüz. */
	html() {
		const a = ayar();
		const sagAd = (SAGLAYICILAR[a.saglayici] || {}).ad || a.saglayici;
		const anahtarVar = !!(a.anahtar && a.anahtar.trim());
		return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{
  --bg:var(--vscode-sideBar-background,#1e1e1e);
  --fg:var(--vscode-sideBar-foreground,#cccccc);
  --border:var(--vscode-panel-border,#3c3c3c);
  --input:var(--vscode-input-background,#2a2d2e);
  --accent:#007acc;
  --muted:#8a8a8a;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
  background:var(--bg);color:var(--fg);
  font-family:var(--vscode-font-family,"Segoe UI",system-ui,sans-serif);
  font-size:13px;display:flex;flex-direction:column;overflow:hidden;
}
#ust{
  padding:9px 12px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;gap:8px;flex-shrink:0;
}
#ust .logo{color:var(--accent);font-weight:700;font-size:12px;letter-spacing:.4px}
#ust .bilgi{color:var(--muted);font-size:11px;margin-left:auto;font-family:Consolas,monospace;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%}
#sohbet{flex:1;overflow-y:auto;padding:12px 12px 4px}
.mesaj{padding:9px 11px;border-radius:7px;margin-bottom:10px;line-height:1.62;
  white-space:pre-wrap;word-break:break-word;font-size:12.5px}
.mesaj.kullanici{background:rgba(0,122,204,.16);border-left:2px solid var(--accent)}
.mesaj.ai{background:rgba(255,255,255,.045);border-left:2px solid var(--border)}
.mesaj.hata{background:rgba(241,76,76,.13);border-left:2px solid #f14c4c;color:#f48771}
.mesaj.bekliyor{color:var(--muted);font-style:italic;border-left-color:var(--muted)}
.mesaj code{font-family:Consolas,monospace;background:rgba(255,255,255,.08);
  padding:1px 4px;border-radius:3px;font-size:12px}
.mesaj pre{background:rgba(0,0,0,.32);padding:9px 11px;border-radius:6px;overflow-x:auto;
  margin:7px 0;border:1px solid var(--border)}
.mesaj pre code{background:none;padding:0;font-size:12px;line-height:1.5}
#bos{padding:26px 16px;text-align:center;color:var(--muted);font-size:12px;line-height:1.9}
#bos b{color:var(--accent);display:block;font-size:15px;margin-bottom:8px;letter-spacing:.5px}
#bos kbd{background:rgba(255,255,255,.09);border:1px solid var(--border);border-radius:3px;
  padding:1px 5px;font-family:Consolas,monospace;font-size:11px}
#girdi{border-top:1px solid var(--border);padding:9px 10px;flex-shrink:0}
#kutu{background:var(--input);border:1px solid var(--border);border-radius:7px;
  display:flex;flex-direction:column;transition:border-color .12s}
#kutu:focus-within{border-color:var(--accent)}
textarea{
  background:none;border:none;color:var(--fg);resize:none;outline:none;
  padding:9px 11px 4px;font-family:inherit;font-size:12.5px;line-height:1.5;
  min-height:44px;max-height:190px;
}
#alt{display:flex;align-items:center;gap:6px;padding:4px 7px 7px}
#alt .sol{display:flex;gap:4px}
.mini{
  background:none;border:none;color:var(--muted);cursor:pointer;
  padding:3px 6px;border-radius:4px;font-size:11px;font-family:inherit;
}
.mini:hover{background:rgba(255,255,255,.08);color:var(--fg)}
#gonder{
  margin-left:auto;background:var(--accent);color:#fff;border:none;
  border-radius:5px;padding:5px 15px;font-weight:600;cursor:pointer;font-size:12px;
  font-family:inherit;transition:filter .12s;
}
#gonder:hover{filter:brightness(1.14)}
#gonder:disabled{opacity:.35;cursor:default}
#uyari{
  margin:0 10px 8px;padding:7px 10px;border-radius:6px;font-size:11.5px;
  background:rgba(255,170,0,.11);border-left:2px solid #ffaa00;color:#e8b04b;
  display:${anahtarVar ? 'none' : 'block'};
}
</style></head><body>

<div id="ust">
  <span class="logo">&#9670; ELYTRA AI</span>
  <span class="bilgi">${sagAd} &middot; ${a.model || 'model yok'}</span>
</div>

<div id="uyari">
  API anahtarı yok &mdash; <a href="#" id="ak" style="color:#e8b04b">buraya tıkla</a> ve ekle.
</div>

<div id="sohbet">
  <div id="bos">
    <b>ELYRA AI</b>
    Kod yaz, düzenle, açıkla.<br>
    <kbd>Ctrl</kbd>+<kbd>K</kbd> seçili kodu düzenler<br>
    <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd> sohbeti açar
  </div>
</div>

<div id="girdi">
  <div id="kutu">
    <textarea id="t" placeholder="AI'a sor...  (Enter g&ouml;nderir, Shift+Enter yeni sat&#305;r)" rows="1"></textarea>
    <div id="alt">
      <div class="sol">
        <button class="mini" id="btnAnahtar" title="API anahtar&#305; ekle">&#128273; Anahtar</button>
        <button class="mini" id="btnAyarlar" title="Ayarlar&#305; a&ccedil;">&#9881; Ayarlar</button>
        <button class="mini" id="btnTemizle" title="Sohbeti temizle">&#128465; Temizle</button>
      </div>
      <button id="gonder">G&ouml;nder</button>
    </div>
  </div>
</div>

<script>
const vs = acquireVsCodeApi();
const sohbet = document.getElementById('sohbet');
const bos = document.getElementById('bos');
const t = document.getElementById('t');
const gonderBtn = document.getElementById('gonder');
let bekleyen = null;

/* Basit markdown: kod bloklar&#305;, sat&#305;r i&ccedil;i kod, kal&#305;n */
function bicimle(metin){
  let s = metin.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  s = s.replace(/\`\`\`([\\w+-]*)\\n?([\\s\\S]*?)\`\`\`/g, (m, dil, kod) =>
    '<pre><code>' + kod.replace(/\\n$/,'') + '</code></pre>');
  s = s.replace(/\`([^\`\\n]+)\`/g, '<code>$1</code>');
  s = s.replace(/\\*\\*([^*\\n]+)\\*\\*/g, '<b>$1</b>');
  return s;
}

function ekle(tur, metin, ham){
  if (bos && bos.parentNode) { bos.remove(); }
  const d = document.createElement('div');
  d.className = 'mesaj ' + tur;
  if (ham) { d.textContent = metin; } else { d.innerHTML = bicimle(metin); }
  sohbet.appendChild(d);
  sohbet.scrollTop = sohbet.scrollHeight;
  return d;
}

function gonder(){
  const m = t.value.trim();
  if (!m) return;
  ekle('kullanici', m, true);
  t.value = '';
  t.style.height = 'auto';
  bekleyen = ekle('bekliyor', 'Modele g&ouml;nderiliyor...', true);
  gonderBtn.disabled = true;
  vs.postMessage({ tip: 'sor', metin: m });
}

gonderBtn.onclick = gonder;
t.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gonder(); }
});
t.addEventListener('input', () => {
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight, 190) + 'px';
});

document.getElementById('btnAnahtar').onclick = () => vs.postMessage({ tip: 'anahtar' });
document.getElementById('btnAyarlar').onclick = () => vs.postMessage({ tip: 'ayarlar' });
document.getElementById('btnTemizle').onclick = () => vs.postMessage({ tip: 'temizle' });
document.getElementById('ak').onclick = (e) => { e.preventDefault(); vs.postMessage({ tip: 'anahtar' }); };

window.addEventListener('message', e => {
  const m = e.data;
  if (bekleyen) { bekleyen.remove(); bekleyen = null; }
  gonderBtn.disabled = false;
  if (m.tip === 'yanit') ekle('ai', m.metin);
  else if (m.tip === 'hata') ekle('hata', m.metin, true);
  else if (m.tip === 'temizlendi') {
    sohbet.innerHTML = '<div id="bos"><b>ELYTRA AI</b>Sohbet temizlendi. Yeni soru yaz.</div>';
  }
});
t.focus();
</script></body></html>`;
	}
}

function activate(context) {
	// Kenar çubuğu görünümü
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'elytra.sohbetGorunum',
			new SohbetSaglayici(context),
			{ webviewOptions: { retainContextWhenHidden: true } }
		)
	);

	// Komutlar
	context.subscriptions.push(
		vscode.commands.registerCommand('elytra.chat', () => {
			vscode.commands.executeCommand('elytra.sohbetGorunum.focus');
		}),

		vscode.commands.registerCommand('elytra.temizle', () => {
			gecmis = [];
			if (aktifGorunum) { aktifGorunum.webview.postMessage({ tip: 'temizlendi' }); }
		}),

		// Cursor'un Cmd+K'sı: seçili kodu AI ile yeniden yaz
		vscode.commands.registerCommand('elytra.inlineEdit', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) { return; }
			const secim = ed.selection;
			if (secim.isEmpty) {
				vscode.window.showWarningMessage('Elytra: Önce düzenlenecek kodu seç.');
				return;
			}
			const talimat = await vscode.window.showInputBox({
				prompt: 'Ne değişsin? (örn. fonksiyonu kısalt, hata kontrolü ekle)',
				placeHolder: 'Talimat…',
			});
			if (!talimat) { return; }
			const mevcut = ed.document.getText(secim);
			await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: 'Elytra AI düzenliyor…' },
				async () => {
					try {
						const yanit = await aiSor([{
							role: 'user',
							content: 'Bu kodu şu talimata göre düzenle ve SADECE kodu döndür (açıklama ekleme):\n' +
								'Talimat: ' + talimat + '\n\nKod:\n' + mevcut,
						}]);
						const temiz = yanit.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
						await ed.edit(b => b.replace(secim, temiz));
						vscode.window.showInformationMessage('Elytra: Düzenleme uygulandı.');
					} catch (e) {
						vscode.window.showErrorMessage('Elytra: ' + String((e && e.message) || e));
					}
				}
			);
		}),

		// Kodu açıkla
		vscode.commands.registerCommand('elytra.explain', async () => {
			const ed = vscode.window.activeTextEditor;
			if (!ed) { return; }
			const secim = ed.selection;
			const kod = secim.isEmpty ? ed.document.getText() : ed.document.getText(secim);
			await vscode.commands.executeCommand('elytra.sohbetGorunum.focus');
			ekleGecmis('user', 'Bu kodu açıkla:\n\n' + kod.slice(0, 8000));
			try {
				const yanit = await aiSor([{ role: 'user', content: 'Bu kodu açıkla (Türkçe, kısa ve net):\n\n' + kod.slice(0, 8000) }]);
				ekleGecmis('assistant', yanit);
				if (aktifGorunum) { aktifGorunum.webview.postMessage({ tip: 'yanit', metin: yanit }); }
			} catch (e) {
				if (aktifGorunum) { aktifGorunum.webview.postMessage({ tip: 'hata', metin: String((e && e.message) || e) }); }
			}
		}),

		// API anahtarı
		vscode.commands.registerCommand('elytra.setKey', async () => {
			const anahtar = await vscode.window.showInputBox({
				prompt: 'Sağlayıcı API anahtarı',
				password: true,
				ignoreFocusOut: true,
			});
			if (anahtar === undefined) { return; }
			await vscode.workspace.getConfiguration('elytra')
				.update('apiAnahtari', anahtar, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage('Elytra: API anahtarı kaydedildi.');
		})
	);

	// Durum çubuğu
	const durum = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	durum.text = '$(sparkle) Elytra AI';
	durum.tooltip = 'Elytra AI sohbetini aç';
	durum.command = 'elytra.chat';
	durum.show();
	context.subscriptions.push(durum);
}

function ekleGecmis(rol, metin) {
	gecmis.push({ role: rol, content: metin });
}

function deactivate() {}

module.exports = { activate, deactivate };
