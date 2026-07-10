#!/bin/bash
# 批量替换文档中的仓库引用

echo "🔄 更新文档中的仓库引用"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}请输入你的 GitHub 用户名：${NC}"
read -p "GitHub 用户名: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ 未输入用户名，退出"
    exit 1
fi

echo ""
echo -e "${YELLOW}请选择新仓库名称：${NC}"
echo "1. lyra-music-player (推荐)"
echo "2. lyra-player"
echo "3. Lyra"
echo "4. 自定义"
read -p "选择 (1-4): " REPO_CHOICE

case $REPO_CHOICE in
    1)
        NEW_REPO="lyra-music-player"
        ;;
    2)
        NEW_REPO="lyra-player"
        ;;
    3)
        NEW_REPO="Lyra"
        ;;
    4)
        read -p "请输入自定义仓库名: " NEW_REPO
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "将要进行以下替换："
echo "  chthollyphile/folia-major → $GITHUB_USERNAME/$NEW_REPO"
echo ""
read -p "确认执行？(y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "取消操作"
    exit 0
fi

echo ""
echo -e "${YELLOW}开始替换...${NC}"

# 替换 GitHub 仓库 URL
find . -type f \( -name "*.md" -o -name "*.html" \) \
    ! -path "*/node_modules/*" ! -path "*/.git/*" \
    -exec sed -i '' "s|chthollyphile/folia-major|$GITHUB_USERNAME/$NEW_REPO|g" {} +

echo -e "${GREEN}✅ GitHub 仓库 URL 已更新${NC}"

# 替换 Vercel Deploy 按钮 URL
find . -type f -name "*.md" \
    ! -path "*/node_modules/*" ! -path "*/.git/*" \
    -exec sed -i '' "s|repository-url=https://github.com/chthollyphile/folia-major|repository-url=https://github.com/$GITHUB_USERNAME/$NEW_REPO|g" {} +

echo -e "${GREEN}✅ Vercel 部署链接已更新${NC}"

# 更新 package.json 中的 repository
sed -i '' "s|\"repo\": \"folia-major\"|\"repo\": \"$NEW_REPO\"|g" package.json

echo -e "${GREEN}✅ package.json 已更新${NC}"

# 检查是否还有遗漏
REMAINING=$(grep -r "chthollyphile/folia-major" --include="*.md" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "================================"
echo "替换完成！"
echo ""
echo "统计："
echo "  新用户名: $GITHUB_USERNAME"
echo "  新仓库名: $NEW_REPO"
echo "  剩余未替换: $REMAINING 处"
echo ""

if [ "$REMAINING" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  仍有部分引用未替换，请手动检查：${NC}"
    grep -r "chthollyphile/folia-major" --include="*.md" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | head -5
    echo ""
fi

echo "下一步："
echo "  1. 运行: git diff 查看更改"
echo "  2. 确认无误后: git add . && git commit -m 'docs: update repository URLs'"
echo "  3. 创建 GitHub 仓库并推送"
