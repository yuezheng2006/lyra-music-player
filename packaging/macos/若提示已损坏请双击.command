#!/bin/bash
# Clear Gatekeeper quarantine on Lyra.app and open it.
set -euo pipefail

APP="/Applications/Lyra.app"

if [[ ! -d "$APP" ]]; then
  osascript <<'EOF' || true
display dialog "请先把 Lyra 拖到「应用程序」(Applications)，再双击本脚本。

这不是安装包损坏，而是 macOS 对未公证下载的拦截。" buttons {"好"} default button 1 with title "Lyra 安装提示"
EOF
  exit 1
fi

xattr -cr "$APP" 2>/dev/null || true
xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true

osascript <<'EOF' || true
display dialog "已清除隔离属性，正在打开 Lyra。" buttons {"好"} default button 1 with title "Lyra"
EOF

open "$APP"
