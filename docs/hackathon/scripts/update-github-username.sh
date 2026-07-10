#!/bin/bash
# 更新所有文档中的 GitHub 用户名

echo "🔄 更新 GitHub 用户名"
echo "================================"
echo ""

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
echo "将要进行以下替换："
echo "  chthollyphile → $GITHUB_USERNAME"
echo ""
read -p "确认执行？(y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "取消操作"
    exit 0
fi

echo ""
echo -e "${YELLOW}开始替换...${NC}"

# 替换所有文档中的 GitHub 用户名
find . -type f \( -name "*.md" -o -name "*.html" -o -name "*.json" \) \
    ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" \
    -exec sed -i '' "s|github.com/chthollyphile|github.com/$GITHUB_USERNAME|g" {} +

echo -e "${GREEN}✅ GitHub 用户名已更新${NC}"

# 检查剩余引用
REMAINING=$(grep -r "chthollyphile" --include="*.md" --include="*.html" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "================================"
echo "替换完成！"
echo ""
echo "统计："
echo "  新用户名: $GITHUB_USERNAME"
echo "  剩余引用: $REMAINING 处"
echo ""

if [ "$REMAINING" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  仍有部分引用未替换：${NC}"
    grep -r "chthollyphile" --include="*.md" --include="*.html" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist 2>/dev/null | head -5
    echo ""
fi

echo "下一步："
echo "  1. git diff 查看更改"
echo "  2. git add . && git commit -m 'docs: update GitHub username'"
echo "  3. 创建 GitHub 仓库"
echo "  4. git push"
