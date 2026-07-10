## 下载说明

- Windows：下载 `Lyra-Setup-{{VERSION}}.exe`
- macOS：
  - Apple Silicon：下载 `Lyra-{{VERSION}}-arm64.dmg`
  - Intel Mac：下载 `Lyra-{{VERSION}}-x64.dmg`
- Linux：
  - Arch Linux / Manjaro：通过 AUR 安装 `yay -S lyra-music-player-bin`
  - Debian / Ubuntu：下载 `lyra-music-player-{{VERSION}}-linux-amd64.deb`
  - Fedora / openSUSE：下载 `lyra-music-player-{{VERSION}}-linux-x86_64.rpm`
  - 其他发行版：下载 `lyra-music-player-{{VERSION}}-linux-x64.tar.gz`

## macOS 安装与「应用已损坏」处理

当前 macOS 包尚未做 Apple 签名 / notarization，Gatekeeper 可能提示「已损坏」。**不是安装包坏了。**

1. 打开 dmg，把 `Lyra` 拖到 `Applications`
2. 关闭 dmg，不要在挂载盘里直接运行
3. 终端执行：

```bash
xattr -dr com.apple.quarantine /Applications/Lyra.app
```

4. 再打开 `/Applications/Lyra.app`

备选：按住 Control 点击 `Lyra.app` →「打开」→ 再点「打开」。  
或：系统设置 → 隐私与安全性 →「仍要打开」。

完整说明：[{{MACOS_UNSIGNED_HELP_URL}}]({{MACOS_UNSIGNED_HELP_URL}})

## 更新说明

- **Lyra（音波）{{VERSION}}**
- **已可用**：沉浸式视觉（全屏歌词 / 3D 舞台）、多源互通（网易云 / QQ / Coco / Navidrome / 本地曲库）、桌面端安装包
- **支持中**：智能匹配、AI 情绪配色（需模型 Key）

_好像在哪里存在似的，然而哪里都不存在。所谓的故事，其实就是龙_
