#!/bin/bash
# Lyra 演示视频录制准备脚本

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║        🎬 Lyra 演示视频录制准备                                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 步骤 1: 构建生产版本
echo -e "${YELLOW}步骤 1: 构建生产版本${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "选择构建类型："
echo "  1. Web 版本（浏览器，推荐）"
echo "  2. 桌面版本（Electron）"
echo "  3. 两者都构建"
echo ""
read -p "请选择 (1-3): " BUILD_CHOICE

case $BUILD_CHOICE in
    1)
        echo ""
        echo -e "${YELLOW}正在构建 Web 版本...${NC}"
        npm run build

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Web 版本构建成功！${NC}"
            echo ""
            echo "启动预览服务器..."
            echo "访问：http://localhost:4173"
            echo ""
            echo "按 Ctrl+C 停止服务器后继续..."
            npm run preview
        else
            echo -e "${RED}❌ 构建失败${NC}"
            exit 1
        fi
        ;;
    2)
        echo ""
        echo -e "${YELLOW}正在构建桌面版本...${NC}"
        npm run build:electron

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ 桌面版本构建成功！${NC}"
            echo ""
            echo "可执行文件位置："
            echo "  macOS: release/mac/"
            ls -lh release/mac/ 2>/dev/null | grep ".app" || echo "  (未找到)"
        else
            echo -e "${RED}❌ 构建失败${NC}"
            exit 1
        fi
        ;;
    3)
        echo ""
        echo -e "${YELLOW}正在构建 Web 和桌面版本...${NC}"
        npm run build && npm run build:electron

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ 所有版本构建成功！${NC}"
        else
            echo -e "${RED}❌ 构建失败${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ 无效选择${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 步骤 2: 录屏工具检查
echo -e "${YELLOW}步骤 2: 检查录屏工具${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 OBS
if command -v obs &> /dev/null; then
    echo -e "${GREEN}✓${NC} OBS Studio 已安装"
else
    echo -e "${YELLOW}✗${NC} OBS Studio 未安装"
    echo "  安装命令: brew install --cask obs"
fi

# 检查 Kap
if [ -d "/Applications/Kap.app" ]; then
    echo -e "${GREEN}✓${NC} Kap 已安装"
else
    echo -e "${YELLOW}✗${NC} Kap 未安装"
    echo "  安装命令: brew install --cask kap"
fi

# QuickTime 总是存在于 macOS
echo -e "${GREEN}✓${NC} QuickTime Player（系统自带）"

echo ""
echo "推荐使用："
echo "  • OBS Studio - 专业级，支持场景切换"
echo "  • QuickTime - 简单快速，适合快速录制"
echo "  • Kap - 开源，轻量级"
echo ""

read -p "是否现在安装 OBS Studio? (y/n): " INSTALL_OBS
if [ "$INSTALL_OBS" = "y" ] || [ "$INSTALL_OBS" = "Y" ]; then
    brew install --cask obs
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 步骤 3: 环境准备
echo -e "${YELLOW}步骤 3: 准备录制环境${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "环境检查清单："
echo ""
echo "  [ ] 关闭通知（勿扰模式）"
echo "  [ ] 清理桌面"
echo "  [ ] 使用纯色壁纸"
echo "  [ ] 隐藏菜单栏图标"
echo "  [ ] 准备好演示音乐"
echo "  [ ] 浏览器/应用全屏"
echo ""

read -p "是否自动开启勿扰模式? (y/n): " ENABLE_DND
if [ "$ENABLE_DND" = "y" ] || [ "$ENABLE_DND" = "Y" ]; then
    # macOS 开启勿扰模式
    if [[ "$OSTYPE" == "darwin"* ]]; then
        defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true
        defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturbDate -date "`date -u +\"%Y-%m-%d %H:%M:%S +0000\"`"
        killall NotificationCenter
        echo -e "${GREEN}✓${NC} 勿扰模式已开启"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 步骤 4: 打开演示脚本
echo -e "${YELLOW}步骤 4: 查看演示脚本${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "VIDEO_SCRIPT.md" ]; then
    echo "演示脚本位置: VIDEO_SCRIPT.md"
    read -p "是否打开查看? (y/n): " OPEN_SCRIPT
    if [ "$OPEN_SCRIPT" = "y" ] || [ "$OPEN_SCRIPT" = "Y" ]; then
        open VIDEO_SCRIPT.md
    fi
else
    echo -e "${YELLOW}⚠️  未找到 VIDEO_SCRIPT.md${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 步骤 5: 录制建议
echo -e "${YELLOW}步骤 5: 录制设置建议${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat << 'RECORDING_TIPS'
📹 录制参数推荐：

分辨率：
  • 1920x1080 (Full HD) - 推荐
  • 2560x1440 (2K) - 高质量

帧率：
  • 60fps - 流畅（推荐）
  • 30fps - 稳定

格式：
  • MP4 (H.264)
  • 码率：8-15 Mbps

音频：
  • 背景音乐音量：30-40%
  • 旁白音量：80-90%

🎬 录制技巧：

1. 预先演练 2-3 次
2. 使用快捷键开始/停止录制
3. 保持鼠标移动流畅
4. 3D 效果展示时放慢节奏
5. 重要功能停留 2-3 秒

⏱️  3分钟分段建议：

0:00-0:15  开场（Logo + 3D 效果）
0:15-0:45  核心功能演示
0:45-1:30  沉浸式体验
1:30-2:15  技术亮点
2:15-2:45  开源生态
2:45-3:00  结尾 CTA

RECORDING_TIPS

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 完成
echo -e "${GREEN}✅ 准备工作完成！${NC}"
echo ""
echo "下一步："
echo ""
echo "  1. 启动应用："
if [ "$BUILD_CHOICE" = "1" ]; then
    echo "     npm run preview"
    echo "     然后访问 http://localhost:4173"
elif [ "$BUILD_CHOICE" = "2" ]; then
    echo "     打开 release/mac/ 中的应用"
fi
echo ""
echo "  2. 打开录屏工具："
echo "     • OBS Studio"
echo "     • QuickTime Player → 文件 → 新建屏幕录制"
echo ""
echo "  3. 查看演示脚本："
echo "     open VIDEO_SCRIPT.md"
echo ""
echo "  4. 开始录制！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎬 祝录制顺利！"
echo ""
