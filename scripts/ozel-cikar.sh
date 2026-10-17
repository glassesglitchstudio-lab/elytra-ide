#!/usr/bin/env bash
# Elytra Code — Microsoft'a ozel (kapali kaynak) bilesenleri cikarir.
#
# VSCodium yaklasimi: OSS kaynaginda bulunan ama Microsoft'a ozel olan
# parcalari derlemeden cikarir. Bu parcalar Microsoft'un ozel npm
# registry'sinden indirilir ve fork'ta yasal olarak kullanilamaz.
#
# Cikarilanlar:
#   - extensions/copilot  (Copilot SDK — kapali kaynak, 317 MB)
#   - build yapilandirmasindaki Copilot gorevleri
#
# Kullanim: ./scripts/ozel-cikar.sh <vscode-kaynak-dizini>

set -e

KAYNAK="${1:-vscode-kaynak}"

if [ ! -d "$KAYNAK" ]; then
  echo "[!] VS Code kaynagi bulunamadi: $KAYNAK"
  exit 1
fi

echo "==> Microsoft'a ozel bilesenler cikariliyor"

# 1) Copilot uzantisini sil (kapali kaynak SDK)
if [ -d "$KAYNAK/extensions/copilot" ]; then
  rm -rf "$KAYNAK/extensions/copilot"
  echo "    [ok] extensions/copilot silindi (kapali kaynak)"
else
  echo "    [--] extensions/copilot zaten yok"
fi

# 2) Build yapilandirmasindaki Copilot referanslarini temizle
PYTHONIOENCODING=utf-8 python3 - "$KAYNAK" <<'PY'
import sys, pathlib, re

kaynak = pathlib.Path(sys.argv[1])
degisen = []

# --- build/npm/dirs.ts : copilot klasorunu listeden cikar ---
p = kaynak / 'build' / 'npm' / 'dirs.ts'
if p.exists():
    s = p.read_text(encoding='utf-8')
    yeni = re.sub(r"\t'extensions/copilot',\n", "", s)
    if yeni != s:
        p.write_text(yeni, encoding='utf-8')
        degisen.append('build/npm/dirs.ts')

# --- build/gulpfile.vscode.ts : copilot gorevlerini cikar ---
p = kaynak / 'build' / 'gulpfile.vscode.ts'
if p.exists():
    s = p.read_text(encoding='utf-8')
    onceki = s
    # paketleme gorevinden copilot shim'i cikar
    s = s.replace(
        "\t\t\tpackageTask(platform, arch, sourceFolderName, destinationFolderName, opts),\n"
        "\t\t\tprepareCopilotRipgrepShimTask(platform, arch, destinationFolderName)\n",
        "\t\t\tpackageTask(platform, arch, sourceFolderName, destinationFolderName, opts)\n"
    )
    # derleme zincirinden copilot uzanti derlemesini cikar
    s = s.replace("\t\t\tcompileCopilotExtensionBuildTask,\n", "")
    if s != onceki:
        p.write_text(s, encoding='utf-8')
        degisen.append('build/gulpfile.vscode.ts')

# --- build/lib/extensions.ts : yerlesik liste'den copilot'u cikar ---
p = kaynak / 'build' / 'lib' / 'extensions.ts'
if p.exists():
    s = p.read_text(encoding='utf-8')
    onceki = s
    s = re.sub(r"\t'copilot',\n", "", s)
    if s != onceki:
        p.write_text(s, encoding='utf-8')
        degisen.append('build/lib/extensions.ts')

# --- build/gulpfile.extensions.ts : copilot derleme gorevini devre disi birak ---
p = kaynak / 'build' / 'gulpfile.extensions.ts'
if p.exists():
    s = p.read_text(encoding='utf-8')
    onceki = s
    s = s.replace(
        "export const compileCopilotExtensionBuildTask = task.define('compile-copilot-extension-build', () => ext.packageCopilotExtensionStream().pipe(gulp.dest('.build')));",
        "export const compileCopilotExtensionBuildTask = task.define('compile-copilot-extension-build', () => Promise.resolve());"
    )
    if s != onceki:
        p.write_text(s, encoding='utf-8')
        degisen.append('build/gulpfile.extensions.ts')

if degisen:
    for d in degisen:
        print(f"    [ok] {d} (Copilot referanslar temizlendi)")
else:
    print("    [--] degisiklik gerekmedi")
PY

# 3) Dogrulama
echo "==> Dogrulama"
if [ -d "$KAYNAK/extensions/copilot" ]; then
  echo "    [!] copilot klasoru hala var"
  exit 1
fi
if grep -q "prepareCopilotRipgrepShimTask(platform" "$KAYNAK/build/gulpfile.vscode.ts" 2>/dev/null; then
  echo "    [!] gulpfile'da copilot shim gorevi hala cagriliyor"
  exit 1
fi
echo "    [ok] Copilot tamamen cikarildi"
echo "==> Hazir."
