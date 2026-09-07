# 参考仓更新对照：Folia v0.7.0 / Kumone 0.3.12

- Date: 2026-08-29
- Method: 本地 `.temp` clone `fetch` 到 origin/main
- Product policy: 借能力、性能优先；不整包 Tempera/Pixi、Unblock、weapi、均衡器、automix、mod loader

## Snapshot

| 仓 | HEAD | 版本 | 相对上次 borrow |
|---|---|---|---|
| [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) | `7800c808` | **v0.7.0+43** | 相对 `29882de8` **76 commits** |
| [missuo/kumone](https://github.com/missuo/kumone) | `6bc24e8` | **v0.3.12** | 相对 `a59b348` / 0.2.5 **55 commits** |
| [XxHuberrr/Mineradio](https://github.com/XxHuberrr/Mineradio) | `89c0d23` | **v2.1.0** | **无产品增量** |

## Folia 建议吸收

| 优先级 | 能力 | 结论 |
|---|---|---|
| P0 | **Sleep timer**（`43b6871a` / `--on` `--off`） | **本轮已落地**：设置 → 播放 + 命令面板；桌面端到期 `app.quit`，Web 暂停 |
| P1 | Monet rail 字号/行高/远程字体测量 | 对照 Lyra Monet，有回归再摘 |
| P2 | FM 模式下禁用队列编辑命令 | Lyra 独立 FM 已有，按需对照 |
| P2 | 托盘锁定 / 透明 / 置顶 | Lyra 桌面端已有同类开关 |
| — | ImportConfirmDialog | 仍缺；外观导入仍立即生效 |
| — | dazibao `entry.tsx` | 仍未注册 |

## Folia 明确不做

- **automix / stem / onnxruntime**（#304）
- **Forge 式 mod loader**（#308）
- QQ serverless / Tempera / 均衡器效果链 / Linux 壁纸

## Kumone（只学 UX，不拷 Swift）

0.2.5 → 0.3.12 主增量是 iOS 沉浸播放、逐字 yrc、罗马音、Dock 菜单、空闲 CPU。Lyra 已有逐字歌词、罗马音字幕、托盘/任务栏控制。可对照：空闲时停掉无意义重绘；灰色曲解锁与 SMS **继续不做**。

## Mineradio

仍停在 v2.1.0 + README。既有缺口见 `docs/mineradio-beat-auth-borrow-analysis.md`。
