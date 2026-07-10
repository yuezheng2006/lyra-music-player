#!/bin/bash
# Hackathon 执行步骤自动化脚本

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              🚀 Hackathon 执行助手                             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 步骤 1: 检查用户名是否已更新
echo -e "${YELLOW}步骤 1: 检查 GitHub 用户名状态${NC}"
CHTHOLLYPHILE_COUNT=$(grep -r "chthollyphile" --include="*.md" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l | tr -d ' ')

if [ "$CHTHOLLYPHILE_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️  发现 $CHTHOLLYPHILE_COUNT 处 'chthollyphile' 引用${NC}"
    echo ""
    echo "请先运行以下命令更新用户名："
    echo "  ./update-github-username.sh"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ GitHub 用户名已更新${NC}"
fi

echo ""

# 步骤 2: 检查是否有未提交的更改
echo -e "${YELLOW}步骤 2: 检查 Git 状态${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  发现未提交的更改${NC}"
    echo ""
    read -p "是否提交更改？(y/n): " COMMIT_CHANGES
    
    if [ "$COMMIT_CHANGES" = "y" ] || [ "$COMMIT_CHANGES" = "Y" ]; then
        git add .
        git commit -m "docs: update GitHub username and final preparation"
        echo -e "${GREEN}✅ 更改已提交${NC}"
    fi
else
    echo -e "${GREEN}✅ 工作目录干净${NC}"
fi

echo ""

# 步骤 3: 显示推送指令
echo -e "${YELLOW}步骤 3: GitHub 仓库设置${NC}"
echo ""
echo "请按照以下步骤操作："
echo ""
echo "1. 创建 GitHub 仓库："
echo "   访问：https://github.com/new"
echo "   名称：lyra-music-player"
echo "   描述：Lyra - 沉浸式音乐播放器"
echo "   可见性：Public"
echo ""
echo "2. 创建完成后，运行以下命令推送代码："
echo ""
echo "   git remote remove origin"
echo "   git remote add origin https://github.com/YOUR_USERNAME/lyra-music-player.git"
echo "   git push -u origin main"
echo ""
echo "   (将 YOUR_USERNAME 替换为你的 GitHub 用户名)"
echo ""

read -p "按 Enter 继续查看下一步..."

echo ""

# 步骤 4: 开发指引
echo -e "${YELLOW}步骤 4: 开始开发${NC}"
echo ""
echo "推送代码后，开始 UI 优化："
echo ""
echo "  open START_HERE.md"
echo "  open UI_IMPROVEMENTS.md"
echo "  npm run dev"
echo ""
echo -e "${GREEN}✅ 所有步骤已准备完毕！${NC}"
echo ""
echo "祝你在 Hackathon 中取得优异成绩！🏆"
