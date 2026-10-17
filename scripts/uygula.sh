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

# 4) Microsoft'a özel marka kalıntılarını temizle
if [ -f "$KAYNAK/product.json" ]; then
  python3 - "$KAYNAK/product.json" <<'PY'
import json, sys, pathlib
p = pathlib.Path(sys.argv[1])
d = json.loads(p.read_text(encoding='utf-8'))
for k in ('extensionRecommendations','extensionImportantTips','keymapExtensionTips',
          'languageExtensionTips','webExtensionTips','configurationExtensionTips'):
    d.pop(k, None)
p.write_text(json.dumps(d, indent='\t', ensure_ascii=False) + '\n', encoding='utf-8')
PY
  echo "    [ok] Microsoft öneri/trial alanları temizlendi"
fi

echo "==> Elytra katmanı hazır."
