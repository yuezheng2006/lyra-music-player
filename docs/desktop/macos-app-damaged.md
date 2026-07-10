# macOS 提示：`Lyra.app` 显示「应用已损坏」

**不是安装包坏了。** 当前 macOS 包尚未做 Apple Developer 签名和 notarization；从浏览器（尤其是 Chrome）下载后会带上 quarantine 隔离属性，Gatekeeper 就会把提示写成「已损坏」。

## 最快处理（推荐）

1. 打开 dmg，把 `Lyra` 拖到 `Applications`（应用程序）
2. 关闭 dmg，不要在挂载盘里直接运行
3. 打开「终端」，执行：

```bash
xattr -dr com.apple.quarantine /Applications/Lyra.app
```

4. 再打开 `/Applications/Lyra.app`

从当前 dmg 起，安装盘里也带了「若提示已损坏请双击.command」：先拖到 Applications，再双击该脚本即可。

## 备选：Control 点击打开

部分系统仍可用：

1. 打开 `Applications`
2. 按住 `Control` 点击 `Lyra.app` →「打开」
3. 弹窗里再点「打开」

若弹窗只有「移到废纸篓」而没有「打开」，请直接用上面的终端命令。

## 备选：隐私与安全性

1. 系统设置 → 隐私与安全性
2. 底部若有「已阻止 Lyra」类提示，点「仍要打开」

## 如果还是打不开

- 删掉当前 `Lyra.app` 和已下载的 dmg，重新从 [Releases](https://github.com/yuezheng2006/lyra-music-player/releases) 下载
- 确认打开的是拖进 Applications 后的副本，不是 dmg 里的临时挂载版
- 诊断：`spctl --assess -vv /Applications/Lyra.app`

## 为什么会这样

发布流程会打出可用的 macOS 安装包，但未接入 Apple 签名 / 公证时，较新的 macOS 常把未签名下载标成「已损坏」。接入签名与 notarization 后，这个提示可以消失。
