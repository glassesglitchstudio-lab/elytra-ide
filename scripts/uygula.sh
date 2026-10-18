#!/usr/bin/env bash
# Elytra Code — VS Code kaynağına Elytra katmanını uygular.
#
# Kullanım:
#   ./scripts/uygula.sh <vscode-kaynak-dizini>
#
# Ne yapar:
#   1. product.json → Elytra markası (isim, protokol, Open VSX)
#   2. extensions/elytra-ai → AI uzantısı (sohbet + satır içi düzenleme)
#   3. build/npm/dirs.ts → yeni uzantıyı derleme listesine ekler

set -e

KAYNAK="${1:-vscode-kaynak}"
BURASI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "$KAYNAK" ]; then
  echo "[!] VS Code kaynağı bulunamadı: $KAYNAK"
  exit 1
fi

echo "==> Elytra katmanı uygulanıyor: $KAYNAK"

# 1) Marka
cp "$BURASI/elytra/product.json" "$KAYNAK/product.json"
echo "    [ok] product.json (Elytra Code markası)"

# 2) AI uzantısı
mkdir -p "$KAYNAK/extensions/elytra-ai"
cp -r "$BURASI/elytra/extensions/elytra-ai/." "$KAYNAK/extensions/elytra-ai/"
echo "    [ok] extensions/elytra-ai (AI uzantısı)"

# 2b) Tema uzantısı (Cursor tarzı)
mkdir -p "$KAYNAK/extensions/elytra-theme"
cp -r "$BURASI/elytra/extensions/elytra-theme/." "$KAYNAK/extensions/elytra-theme/"
echo "    [ok] extensions/elytra-theme (Elytra Dark teması)"

# 3) Derleme listesine ekle
if ! grep -q "elytra-ai" "$KAYNAK/build/npm/dirs.ts" 2>/dev/null; then
  python3 - "$KAYNAK/build/npm/dirs.ts" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding='utf-8')
s = s.replace("\t'extensions/debug-server-ready',",
              "\t'extensions/debug-server-ready',\n\t'extensions/elytra-ai',", 1)
p.write_text(s, encoding='utf-8')
PY
  echo "    [ok] build/npm/dirs.ts (elytra-ai eklendi)"
else
  echo "    [--] build/npm/dirs.ts (zaten var)"
fi

# 3b) Sandbox segfault kalıcı çözümü (Elytra Code.exe doğrudan çift tıklanınca çökmemesi için)
if [ -f "$KAYNAK/src/main.ts" ]; then
  python3 - "$KAYNAK/src/main.ts" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding='utf-8')
if "no-sandbox" not in s:
    s = "import { app } from 'electron';\napp.commandLine.appendSwitch('no-sandbox');\napp.commandLine.appendSwitch('disable-gpu-sandbox');\n" + s
    p.write_text(s, encoding='utf-8')
    print("    [ok] src/main.ts (en erken aşamada no-sandbox eklendi)")
else:
    print("    [--] src/main.ts (zaten no-sandbox var)")
PY
fi

if [ -f "$KAYNAK/src/mainImpl.ts" ]; then
  python3 - "$KAYNAK/src/mainImpl.ts" <<'PY'
import sys, pathlib
p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding='utf-8')
s = s.replace("app.enableSandbox();", "app.commandLine.appendSwitch('no-sandbox'); app.commandLine.appendSwitch('disable-gpu-sandbox');")
p.write_text(s, encoding='utf-8')
print("    [ok] src/mainImpl.ts (enableSandbox tamamen no-sandbox yapildi)")
PY
fi

# 4) Microsoft'a özel marka kalıntılarını temizle
# NOT: product.json'a sonradan DOKUNULMAZ.
# builtInExtensions / trustedExtensionAuthAccess alanlari derleme icin ZORUNLU;
# silinirse "Cannot read properties of undefined (reading 'filter')" hatasi cikar.

# 5) DOGRULAMA — uzanti gercekten calisabilir durumda mi?
# (Onceki derlemede uzanti TypeScript'ti ve DERLENMEMISTI: out/ yoktu,
#  bu yuzden hic yuklenmiyordu. Artik duz JS ve burada dogrulaniyor.)
echo "==> Dogrulama"
HATA=0
if [ ! -f "$KAYNAK/extensions/elytra-ai/out/extension.js" ]; then
  echo "    [!] out/extension.js YOK — uzanti yuklenmez!"
  HATA=1
else
  echo "    [ok] out/extension.js mevcut ($(wc -c < "$KAYNAK/extensions/elytra-ai/out/extension.js") byte)"
fi
if [ ! -f "$KAYNAK/extensions/elytra-ai/resources/elytra.svg" ]; then
  echo "    [!] kenar cubugu ikonu YOK"
  HATA=1
else
  echo "    [ok] resources/elytra.svg mevcut"
fi
# package.json'da viewsContainers var mi? (kenar cubugu gorunumu)
if ! grep -q '"viewsContainers"' "$KAYNAK/extensions/elytra-ai/package.json" 2>/dev/null; then
  echo "    [!] viewsContainers YOK — kenar cubugu gorunumu olmaz!"
  HATA=1
else
  echo "    [ok] viewsContainers (kenar cubugu gorunumu)"
fi
if [ "$HATA" -ne 0 ]; then
  echo "    [!] DOGRULAMA BASARISIZ"
  exit 1
fi

echo "==> Elytra katmanı hazır."
