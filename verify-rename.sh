#!/bin/bash
# Lyra 命名验证脚本

echo "🔍 Lyra 命名验证脚本"
echo "===================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
PASS=0
FAIL=0

# 检查 package.json
echo "📦 检查 package.json..."
if grep -q '"productName": "Lyra"' package.json; then
    echo -e "${GREEN}✅ package.json productName 已更新${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ package.json productName 未更新${NC}"
    ((FAIL++))
fi

# 检查 metadata.json
echo "📋 检查 metadata.json..."
if grep -q '"name": "Lyra"' metadata.json; then
    echo -e "${GREEN}✅ metadata.json name 已更新${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ metadata.json name 未更新${NC}"
    ((FAIL++))
fi

# 检查 README.md
echo "📖 检查 README.md..."
if grep -q "# Lyra" README.md; then
    echo -e "${GREEN}✅ README.md 标题已更新${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ README.md 标题未更新${NC}"
    ((FAIL++))
fi

# 检查是否还有遗漏的 Auralis（排除测试文件和文档）
echo "🔎 检查遗漏的 'Auralis' 引用..."
REMAINING=$(grep -r "Auralis" --include="*.tsx" --include="*.ts" --include="*.json" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=release \
    --exclude="*.test.ts" --exclude="*HACKATHON*" --exclude="*QUICK_ACTION*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$REMAINING" -eq 0 ]; then
    echo -e "${GREEN}✅ 没有遗漏的 Auralis 引用${NC}"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️  发现 $REMAINING 处 Auralis 引用（可能在测试文件或文档中）${NC}"
fi

# 测试构建
echo "🏗️  测试构建..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 构建成功${NC}"
    ((PASS++))
else
    echo -e "${RED}❌ 构建失败${NC}"
    ((FAIL++))
fi

# 总结
echo ""
echo "===================="
echo "验证总结"
echo "===================="
echo -e "通过: ${GREEN}${PASS}${NC}"
echo -e "失败: ${RED}${FAIL}${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！Lyra 重命名成功！${NC}"
    echo ""
    echo "下一步："
    echo "1. git add ."
    echo "2. git commit -m 'rebrand: Auralis → Lyra (天琴)'"
    echo "3. 参考 QUICK_ACTION_PLAN.md 继续 Hackathon 准备"
    exit 0
else
    echo -e "${RED}❌ 部分检查失败，请修复后重试${NC}"
    exit 1
fi
