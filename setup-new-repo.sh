#!/bin/bash
# 创建新 GitHub 仓库并迁移代码

echo "🚀 Lyra 项目 GitHub 仓库迁移脚本"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}步骤 1: 检查当前状态${NC}"
echo "当前 Git 远程地址："
git remote -v
echo ""

echo -e "${YELLOW}步骤 2: 准备创建新仓库${NC}"
echo "请在 GitHub 上创建新仓库："
echo ""
echo "  仓库名称建议（选一个）："
echo "    • lyra-music-player (推荐)"
echo "    • lyra-player"
echo "    • Lyra"
echo ""
echo "  设置："
echo "    • 可见性：Public"
echo "    • 不要初始化 README、.gitignore 或 LICENSE（我们已有）"
echo ""
echo "创建完成后，复制仓库地址（例如：https://github.com/YOUR_USERNAME/lyra-music-player.git）"
echo ""
read -p "请输入你的新仓库地址: " NEW_REPO_URL
echo ""

if [ -z "$NEW_REPO_URL" ]; then
    echo "❌ 未输入仓库地址，退出"
    exit 1
fi

echo -e "${YELLOW}步骤 3: 更新远程仓库地址${NC}"
echo "移除旧的 origin..."
git remote remove origin

echo "添加新的 origin: $NEW_REPO_URL"
git remote add origin "$NEW_REPO_URL"

echo "验证远程地址："
git remote -v
echo ""

echo -e "${YELLOW}步骤 4: 推送代码到新仓库${NC}"
read -p "确认推送到新仓库？(y/n): " CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    echo "推送代码..."
    git push -u origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 成功！代码已推送到新仓库${NC}"
        echo ""
        echo "你的新仓库地址："
        echo "  $NEW_REPO_URL"
        echo ""
        echo "下一步："
        echo "  1. 访问 GitHub 仓库，确认代码已上传"
        echo "  2. 更新仓库描述：Lyra - 沉浸式音乐播放器"
        echo "  3. 添加 Topics: music-player, electron, react, three-js, ai"
        echo "  4. 继续 Hackathon 准备（参考 NEXT_STEPS.md）"
    else
        echo ""
        echo "❌ 推送失败，请检查："
        echo "  1. GitHub 仓库是否已创建"
        echo "  2. 仓库地址是否正确"
        echo "  3. 是否有推送权限"
    fi
else
    echo "取消推送"
fi
