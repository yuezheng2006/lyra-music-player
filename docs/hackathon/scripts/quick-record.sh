#!/bin/bash
# 快速录制准备脚本（自动化版本）

echo "🎬 Lyra 录制快速准备"
echo ""

# 1. 构建生产版本
echo "步骤 1/5: 构建生产版本..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建完成"
echo ""

# 2. 开启勿扰模式
echo "步骤 2/5: 开启勿扰模式..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturb -boolean true
    defaults -currentHost write ~/Library/Preferences/ByHost/com.apple.notificationcenterui doNotDisturbDate -date "`date -u +\"%Y-%m-%d %H:%M:%S +0000\"`"
    killall NotificationCenter 2>/dev/null
    echo "✅ 勿扰模式已开启"
else
    echo "⚠️  非 macOS 系统，请手动开启勿扰模式"
fi
echo ""

# 3. 打开演示脚本
echo "步骤 3/5: 打开演示脚本..."
if [ -f "VIDEO_SCRIPT.md" ]; then
    open VIDEO_SCRIPT.md
    echo "✅ 演示脚本已打开"
else
    echo "⚠️  未找到 VIDEO_SCRIPT.md"
fi
echo ""

# 4. 启动预览服务器
echo "步骤 4/5: 启动预览服务器..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 准备完成！"
echo ""
echo "下一步："
echo ""
echo "  1. 访问：http://localhost:4173"
echo "  2. 浏览器全屏（Cmd+Ctrl+F）"
echo "  3. 打开录屏工具："
echo "     QuickTime → 文件 → 新建屏幕录制"
echo "  4. 开始录制！"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run preview
