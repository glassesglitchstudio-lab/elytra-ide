#!/usr/bin/env bash
# Elytra Code — Microsoft'a özel (kapalı kaynak) bileşenleri çıkarır.
#
# VSCodium yaklaşımı: OSS kaynağında bulunan ama Microsoft'a özel olan
# parçaları derlemeden çıkarır. Bu parçalar Microsoft'un özel npm
# registry'sinden indirilir ve fork'ta yasal olarak kullanılamaz.
#
# Çıkarılanlar:
#   - extensions/copilot  (Copilot SDK — kapalı kaynak, 317 MB)
#   - build yapılandırmasındaki Copilot görevleri
#
# Kullanım: ./scripts/ozel-cikar.sh <vscode-kaynak-dizini>

set -e

KAYNAK="${1:-vscode-kaynak}"

if [ ! -d "$KAYNAK" ]; then
  echo "[!] VS Code kaynağı bulunamadı: $KAYNAK"
  exit 1
fi

echo "==> Microsoft'a özel bileşenler çıkarılıyor"

# 1) Copilot uzantısını sil (kapalı kaynak SDK)
if [ -d "$KAYNAK/extensions/copilot" ]; then
  rm -rf "$KAYNAK/extensions/copilot"
  echo "    [ok] extensions/copilot silindi (kapalı kaynak)"
else
  echo "    [--] extensions/copilot zaten yok"
fi

# 2) Build yapılandırmasındaki Copilot referanslarını temizle
python3 - "$KAYNAK" <<'PY'
import sys, pathlib, re

kaynak = pathlib.Path(sys.argv[1])
degisen = []

# --- build/npm/dirs.ts : copilot klasörünü listeden çıkar ---
p = kaynak / 'build' / 'npm' / 'dirs.ts'
if p.exists():
    s = p.read_text(encoding='utf-8')
    yeni = re.sub(r"\t'extensions/copilot',\n", "", s)
    if yeni != s:
        p.write_text(yeni, encoding='utf-8')
        degisen.append('build/npm/dirs.ts')

# --- build/gulpfile.vscode.ts : copilot görevlerini çıkar ---
p = kaynak / 'build' / 'gulpfile.vscode.ts'
if p.exists():
    s = p.read_text(encoding='utf-8')
    onceki = s
    # paketleme görevinden copilot shim'i çıkar
    s = s.replace(
        "\t\t\tpackageTask(platform, arch, sourceFolderName, destinationFolderName, opts),\n"
        "\t\t\tprepareCopilotRipgrepShimTask(platform, arch, destinationFolderName)\n",
        "\t\t\tpackageTask(platform, arch, sourceFolderName, destinationFolderName, opts)\n"
    )
    # derleme zincirinden copilot uzantı derlemesini çıkar
    s = s.replace("\t\t\tcompileCopilotExtensionBuildTask,\n", "")
    if s != onceki:
        p.write_text(s, encoding='utf-8')
        degisen.append('build/gulpfile.vscode.ts')

# --- build/lib/extensions.ts : yerleşik liste'den copilot'u çıkar ---
p = kaynak / 'build' / 'lib' / 'extensions.ts'
if p.exists():
    s = p.read_text(encoding='utf-8')
    onceki = s
    s = re.sub(r"\t'copilot',\n", "", s)
    if s != onceki:
        p.write_text(s, encoding='utf-8')
        degisen.append('build/lib/extensions.ts')

# --- build/gulpfile.extensions.ts : copilot derleme görevini devre dışı bırak ---
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
        print(f"    [ok] {d} (Copilot referansları temizlendi)")
else:
    print("    [--] değişiklik gerekmedi")
PY

# 3) Doğrulama
echo "==> Doğrulama"
if [ -d "$KAYNAK/extensions/copilot" ]; then
  echo "    [!] copilot klasörü hâlâ var"
  exit 1
fi
if grep -q "prepareCopilotRipgrepShimTask(platform" "$KAYNAK/build/gulpfile.vscode.ts" 2>/dev/null; then
  echo "    [!] gulpfile'da copilot shim görevi hâlâ çağrılıyor"
  exit 1
fi
echo "    [ok] Copilot tamamen çıkarıldı"
echo "==> Hazır."
