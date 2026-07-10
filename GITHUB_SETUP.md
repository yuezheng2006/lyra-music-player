# 创建新 GitHub 仓库指南

为 Lyra 项目创建独立的 GitHub 仓库。

---

## 📋 步骤总览

1. 在 GitHub 创建新仓库
2. 更改本地 Git 远程地址
3. 推送代码
4. 配置仓库信息

---

## 🎯 方案 A: 使用自动化脚本（推荐）

### 运行迁移脚本

```bash
./setup-new-repo.sh
```

脚本会引导你完成所有步骤。

---

## 🔧 方案 B: 手动操作

### 1. 在 GitHub 创建新仓库

访问：https://github.com/new

**仓库设置：**
- **Repository name**: `lyra-music-player` (推荐) 或 `lyra-player` 或 `Lyra`
- **Description**: `Lyra - 沉浸式音乐播放器 | Immersive music player with 3D stage and AI themes`
- **Visibility**: Public
- **不要勾选**：
  - ❌ Add a README file
  - ❌ Add .gitignore
  - ❌ Choose a license

点击 **Create repository**

### 2. 复制仓库地址

创建完成后，GitHub 会显示仓库地址，例如：
```
https://github.com/YOUR_USERNAME/lyra-music-player.git
```

### 3. 更改本地远程地址

```bash
# 查看当前远程地址
git remote -v

# 移除旧的 origin
git remote remove origin

# 添加新的 origin（替换为你的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/lyra-music-player.git

# 验证
git remote -v
```

### 4. 推送代码

```bash
# 推送到新仓库
git push -u origin main

# 如果有其他分支，也推送
git push --all
git push --tags
```

### 5. 配置仓库信息（在 GitHub 网页上）

#### 添加描述
```
Lyra - 沉浸式音乐播放器 | Immersive music player with 3D stage and AI themes
```

#### 添加网站
```
https://your-vercel-url.vercel.app
```

#### 添加 Topics
```
music-player
electron
react
typescript
three-js
webgl
ai
lyrics
hackathon
```

#### 设置 About
- [x] Use your GitHub Pages website (如果有)
- [x] Releases
- [x] Packages

---

## 📝 推荐的仓库命名方案

### 方案 1: lyra-music-player ⭐ (推荐)
```
https://github.com/YOUR_USERNAME/lyra-music-player
```
- ✅ 清晰明确
- ✅ SEO 友好
- ✅ 容易搜索

### 方案 2: lyra-player
```
https://github.com/YOUR_USERNAME/lyra-player
```
- ✅ 简洁
- ✅ 专业

### 方案 3: Lyra (首字母大写)
```
https://github.com/YOUR_USERNAME/Lyra
```
- ✅ 最简洁
- ⚠️ 可能被占用
- ✅ 品牌一致性强

---

## 🔍 验证推送成功

访问你的 GitHub 仓库页面，确认：
- [ ] README.md 显示正常
- [ ] 所有文件都已上传
- [ ] Commit 历史正确（应该看到 "rebrand: Auralis → Lyra" 的提交）
- [ ] 项目描述和 Topics 已设置

---

## 📦 更新文档中的仓库地址

推送成功后，需要更新以下文档中的仓库地址：

### 自动更新（推荐）

```bash
# 替换所有文档中的旧仓库地址
OLD_REPO="chthollyphile/lyra-music-player"
NEW_REPO="YOUR_USERNAME/lyra-music-player"

find . -type f \( -name "*.md" -o -name "*.json" -o -name "*.html" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  -exec sed -i '' "s|$OLD_REPO|$NEW_REPO|g" {} +

# 提交更新
git add .
git commit -m "docs: update repository URL"
git push
```

### 手动更新

需要更新的文件：
- `README.md`
- `package.json` (repository.url)
- `HACKATHON_SUBMISSION.md`
- `README_HACKATHON.md`
- `VERCEL_DEPLOYMENT.md`
- `showcase.html`
- 其他文档中的链接

---

## 🚀 后续配置（可选）

### 启用 GitHub Pages（如果需要）
Settings → Pages → Source: Deploy from a branch → Branch: main → /docs

### 配置 GitHub Actions（CI/CD）
可以设置自动构建和测试，但 Hackathon 期间不是必须的。

### 设置 Branch Protection
Settings → Branches → Add rule
- Branch name pattern: `main`
- [ ] Require pull request reviews before merging

---

## ⚠️ 常见问题

### 问题 1: 推送失败 (403 Forbidden)
**原因**: 权限不足

**解决**:
```bash
# 检查 Git 凭据
git config --list | grep credential

# 如果使用 HTTPS，确保凭据管理器已设置
git config --global credential.helper osxkeychain  # macOS
git config --global credential.helper manager      # Windows
```

### 问题 2: 仓库名已被占用
**解决**: 使用其他名称，例如：
- `lyra-music-app`
- `lyra-audio-player`
- `lyra-stage-player`

### 问题 3: README 显示不正确
**原因**: Markdown 语法或图片路径问题

**解决**:
```bash
# 检查 README
cat README.md

# 验证图片路径
ls -la img/
```

---

## 📋 完成检查清单

迁移完成后，确认：
- [ ] 新仓库已创建
- [ ] 代码已成功推送
- [ ] Commit 历史完整
- [ ] README 显示正常
- [ ] 仓库描述和 Topics 已设置
- [ ] 文档中的仓库链接已更新
- [ ] 可以正常 clone 新仓库

---

## 🎉 完成！

新仓库创建完成后：

1. **更新 Hackathon 文档**中的仓库地址
2. **继续准备** Hackathon（参考 `NEXT_STEPS.md`）
3. **部署到 Vercel**（参考 `VERCEL_DEPLOYMENT.md`）

你的新仓库地址：
```
https://github.com/YOUR_USERNAME/lyra-music-player
```

---

**下一步**: 
- 推送代码后，运行 `git push origin main`
- 然后开始 UI 优化（参考 `UI_IMPROVEMENTS.md`）
