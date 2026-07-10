## 下载说明

- Windows：下载 `Lyra-Setup-{{VERSION}}.exe`
- macOS：
  - Apple Silicon：下载 `Lyra-{{VERSION}}-arm64.dmg`
  - Intel Mac：下载 `Lyra-{{VERSION}}-x64.dmg`

## macOS：若提示「应用已损坏」

**不是安装包坏了**（未签名 / 未公证 + 下载隔离属性）。

1. 打开 dmg，把 `Lyra` 拖到 `Applications`，然后关闭 dmg
2. **优先**：双击 dmg 里的「若提示已损坏请双击.command」  
   或终端执行：

```bash
xattr -dr com.apple.quarantine /Applications/Lyra.app
```

3. 再打开 `/Applications/Lyra.app`

完整说明：[{{MACOS_UNSIGNED_HELP_URL}}]({{MACOS_UNSIGNED_HELP_URL}})

## 更新说明

- **Lyra（音波）{{VERSION}}**
- **已可用**：沉浸式视觉（全屏歌词 / 3D 舞台）、多源互通（网易云 / QQ / Coco / Navidrome / 本地曲库）、桌面端安装包
- **支持中**：智能匹配、AI 情绪配色（需模型 Key）

_好像在哪里存在似的，然而哪里都不存在。所谓的故事，其实就是龙_
