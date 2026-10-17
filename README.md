# Elytra Code

**VS Code fork'u + Cursor tarzı AI — ücretsiz, açık kaynak.**

Elytra Code, Microsoft'un açık kaynaklı (MIT) `vscode` kaynağı üzerine Elytra
katmanını uygular: kendi markası, kendi AI uzantısı, kendi derleme hattı.

> Derleme **GitHub Actions** üzerinde çalışır. Kendi bilgisayarın yorulmaz —
> sadece hazır `.exe`'yi indirirsin.

## Ne var?

| Özellik | Durum |
|---|---|
| VS Code tabanı (editör, terminal, git, eklentiler) | ✅ |
| **Elytra AI** uzantısı (sohbet paneli) | ✅ |
| **Satır içi düzenleme** (`Ctrl+K`) — Cursor tarzı | ✅ |
| **Kodu açıkla** komutu | ✅ |
| **7 sağlayıcı** (Nous, OpenRouter, Groq, DeepSeek, Mistral, Cerebras, Google) | ✅ |
| **Open VSX** eklenti galerisi (Microsoft galerisi fork'ta yasal değil) | ✅ |
| Elytra markası (isim, protokol, ikon) | ✅ |

## Mimari

```
elytra-ide/
├── elytra/
│   ├── product.json              # Elytra markası (isim, protokol, Open VSX)
│   └── extensions/elytra-ai/     # AI uzantısı (sohbet + Ctrl+K)
├── scripts/uygula.sh             # VS Code kaynağına katmanı uygular
└── .github/workflows/derle.yml   # GitHub Actions derleme hattı
```

**Neden böyle?** VS Code kaynağı ~937 MB. Onu repoya koymak yerine, Actions
her derlemede kaynağı çeker ve bizim katmanı üzerine uygular. Repo küçük kalır.

## Derleme

GitHub Actions otomatik çalışır (`push` veya elle):

```
Actions → Elytra Code Derle → Run workflow
```

Bittiğinde **Artifacts → elytra-code-win32-x64** indir → `Elytra Code.exe`.

## Yerel derleme (isteğe bağlı)

```bash
git clone --depth 1 https://github.com/microsoft/vscode.git vscode-kaynak
bash scripts/uygula.sh vscode-kaynak
cd vscode-kaynak
npm install
npm run gulp vscode-win32-x64-archive
```

## AI kurulumu

1. `Ctrl+Shift+P` → **Elytra: API Anahtarı Ayarla**
2. Sağlayıcı + model seç (Ayarlar → Elytra AI)
3. `Ctrl+Shift+A` → sohbet paneli açılır
4. Kodu seç → `Ctrl+K` → talimat yaz → AI kodu yeniden yazar

**Sahte cevap yok.** Anahtar yoksa uzantı dürüst hata verir.

## Lisans

- Elytra katmanı: MIT
- VS Code tabanı: MIT (Microsoft)
- Elytra markası ve logosu Microsoft'a ait **değildir** — bu bir bağımsız fork'tur.

## Elytra-AI ürün ailesi

| Ürün | Ne |
|---|---|
| **elytra-ide** (bu repo) | VS Code fork'u + AI |
| [elytra-cli](https://github.com/glassesglitchstudio-lab/elytra-cli) | Rust terminal AI asistanı |
| [elytra-providers](https://github.com/glassesglitchstudio-lab/elytra-providers) | 15 sağlayıcı kataloğu |
