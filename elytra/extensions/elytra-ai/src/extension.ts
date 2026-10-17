/* Elytra AI — Cursor tarzı AI uzantısı (VS Code fork'u için)
 * Sohbet paneli + satır içi düzenleme + kod açıklama.
 * SAHTE CEVAP ÜRETMEZ: gerçek sağlayıcı API'sine çağrı yapar. */

import * as vscode from 'vscode';

/** Sağlayıcı uç noktaları (elytra-providers kataloğuyla aynı). */
const SAGLAYICILAR: Record<string, { url: string; ad: string }> = {
	nous:       { url: 'https://inference-api.nousresearch.com/v1', ad: 'Nous Research' },
	openrouter: { url: 'https://openrouter.ai/api/v1',              ad: 'OpenRouter' },
	groq:       { url: 'https://api.groq.com/openai/v1',            ad: 'Groq' },
	deepseek:   { url: 'https://api.deepseek.com/v1',               ad: 'DeepSeek' },
	mistral:    { url: 'https://api.mistral.ai/v1',                 ad: 'Mistral' },
	cerebras:   { url: 'https://api.cerebras.ai/v1',                ad: 'Cerebras' },
	google:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai', ad: 'Google' },
};

/** Gerçek API çağrısı — hata durumunda dürüst hata döner. */
async function aiSor(mesaj: string): Promise<string> {
	const cfg = vscode.workspace.getConfiguration('elytra');
	const saglayiciId = cfg.get<string>('saglayici', 'nous');
	const model = cfg.get<string>('model', '');
	const anahtar = cfg.get<string>('apiAnahtari', '');

	if (!anahtar.trim()) {
		throw new Error('API anahtarı yok. Komut paletinden "Elytra: API Anahtarı Ayarla" çalıştır.');
	}
	const s = SAGLAYICILAR[saglayiciId];
	if (!s) {
		throw new Error(`Bilinmeyen sağlayıcı: ${saglayiciId}`);
	}

	const yanit = await fetch(`${s.url}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${anahtar.trim()}`,
		},
		body: JSON.stringify({
			model,
			messages: [{ role: 'user', content: mesaj }],
			max_tokens: 2048,
		}),
	});

	if (!yanit.ok) {
		const metin = await yanit.text();
		throw new Error(`API hatası (${yanit.status}): ${metin.slice(0, 200)}`);
	}
	const veri = await yanit.json() as any;
	const icerik = veri?.choices?.[0]?.message?.content;
	if (!icerik) {
		throw new Error('Model boş yanıt döndü');
	}
	return icerik;
}

/** Sohbet paneli (webview). */
class SohbetPaneli {
	public static aktif: SohbetPaneli | undefined;
	private panel: vscode.WebviewPanel;

	private constructor(panel: vscode.WebviewPanel) {
		this.panel = panel;
		panel.webview.html = this.html();
		panel.webview.onDidReceiveMessage(async (m) => {
			if (m.tip === 'sor') {
				try {
					const yanit = await aiSor(m.metin);
					panel.webview.postMessage({ tip: 'yanit', metin: yanit });
				} catch (e: any) {
					panel.webview.postMessage({ tip: 'hata', metin: String(e.message || e) });
				}
			}
		});
		panel.onDidDispose(() => { SohbetPaneli.aktif = undefined; });
	}

	public static goster() {
		const kolon = vscode.ViewColumn.Beside;
		if (SohbetPaneli.aktif) {
			SohbetPaneli.aktif.panel.reveal(kolon);
			return;
		}
		const panel = vscode.window.createWebviewPanel(
			'elytraSohbet', 'Elytra AI', kolon,
			{ enableScripts: true, retainContextWhenHidden: true }
		);
		SohbetPaneli.aktif = new SohbetPaneli(panel);
	}

	private html(): string {
		const cfg = vscode.workspace.getConfiguration('elytra');
		const model = cfg.get<string>('model', '');
		const sag = cfg.get<string>('saglayici', 'nous');
		return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<style>
:root{--bg:#1e1e1e;--sidebar:#252526;--cizgi:#3c3c3c;--metin:#cccccc;--soluk:#858585;--a:#007acc;--aktif:#37373d}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--metin);font-family:"Segoe UI",system-ui,sans-serif;font-size:13px;height:100vh;display:flex;flex-direction:column}
#ust{padding:10px 12px;border-bottom:1px solid var(--cizgi);background:var(--sidebar);display:flex;gap:8px;align-items:center}
#ust b{color:var(--a);font-size:12px;letter-spacing:.5px}
#ust small{color:var(--soluk);font-size:11px;margin-left:auto;font-family:Consolas,monospace}
#sohbet{flex:1;overflow:auto;padding:12px}
.mesaj{padding:9px 12px;border-radius:6px;margin-bottom:9px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.mesaj.kullanici{background:var(--aktif);border-left:2px solid var(--a)}
.mesaj.ai{background:#2a2d2e;border-left:2px solid var(--a)}
.mesaj.hata{background:rgba(241,76,76,.12);border-left:2px solid #f14c4c;color:#f14c4c}
.mesaj.bekliyor{color:var(--soluk);font-style:italic}
#girdi{padding:10px 12px;border-top:1px solid var(--cizgi);display:flex;gap:8px}
textarea{flex:1;background:var(--bg);color:var(--metin);border:1px solid var(--cizgi);border-radius:6px;padding:8px 10px;font-family:inherit;font-size:13px;resize:none;height:44px;outline:none}
textarea:focus{border-color:var(--a)}
button{background:var(--a);color:#fff;border:none;border-radius:6px;padding:0 18px;font-weight:600;cursor:pointer;font-size:12px}
button:hover{filter:brightness(1.1)}
button:disabled{opacity:.4;cursor:default}
</style></head><body>
<div id="ust"><b>◆ ELYTRA AI</b><small>${sag} · ${model}</small></div>
<div id="sohbet"><div class="mesaj ai">Elytra AI hazır. Sorunu yaz — gerçek modele gönderilir.</div></div>
<div id="girdi"><textarea id="t" placeholder="AI'a sor... (Enter gönderir)"></textarea><button id="b">Gönder</button></div>
<script>
const vscode = acquireVsCodeApi();
const sohbet = document.getElementById('sohbet');
const t = document.getElementById('t');
const b = document.getElementById('b');
function ekle(tur, metin){const d=document.createElement('div');d.className='mesaj '+tur;d.textContent=metin;sohbet.appendChild(d);sohbet.scrollTop=sohbet.scrollHeight;return d;}
function gonder(){
  const m = t.value.trim(); if(!m) return;
  ekle('kullanici', m); t.value='';
  const bek = ekle('bekliyor','Modele gönderiliyor...');
  b.disabled = true;
  vscode.postMessage({tip:'sor', metin:m});
  window._bek = bek;
}
b.onclick = gonder;
t.addEventListener('keydown', e => { if(e.key==='Enter' && !e.shiftKey){e.preventDefault();gonder();} });
window.addEventListener('message', e => {
  const m = e.data;
  if(window._bek){window._bek.remove();window._bek=null;}
  b.disabled = false;
  if(m.tip==='yanit') ekle('ai', m.metin);
  if(m.tip==='hata') ekle('hata', m.metin);
});
</script></body></html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('elytra.chat', () => SohbetPaneli.goster()),

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
						const yanit = await aiSor(
							`Bu kodu şu talimata göre düzenle ve SADECE kodu döndür (açıklama ekleme):\n` +
							`Talimat: ${talimat}\n\nKod:\n${mevcut}`
						);
						const temiz = yanit.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
						await ed.edit(b => b.replace(secim, temiz));
						vscode.window.showInformationMessage('Elytra: Düzenleme uygulandı.');
					} catch (e: any) {
						vscode.window.showErrorMessage('Elytra: ' + String(e.message || e));
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
			SohbetPaneli.goster();
			try {
				const yanit = await aiSor(`Bu kodu açıkla (Türkçe, kısa ve net):\n\n${kod.slice(0, 8000)}`);
				SohbetPaneli.aktif?.['panel'].webview.postMessage({ tip: 'yanit', metin: yanit });
			} catch (e: any) {
				SohbetPaneli.aktif?.['panel'].webview.postMessage({ tip: 'hata', metin: String(e.message || e) });
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

export function deactivate() {}
