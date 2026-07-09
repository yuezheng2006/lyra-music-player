# Vercel 部署指南

完整的 Vercel 部署步骤和注意事项。

## 📋 部署前准备

### 1. 准备后端 API

本项目依赖 NeteaseCloudMusicApiEnhanced，需要单独部署。

#### 方案 A: 使用公共 API（快速但不稳定）
```bash
# 找一个公开的网易云 API 实例
# 注意：公共 API 可能随时失效，不推荐生产使用
https://netease-cloud-music-api-example.vercel.app
```

#### 方案 B: 自己部署（推荐）

1. Fork 项目：https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced

2. 在 Vercel 导入该项目

3. 部署完成后获得 API 地址，例如：
   ```
   https://your-netease-api.vercel.app
   ```

### 2. 准备环境变量

在 Vercel 项目设置中配置以下环境变量：

| 变量名 | 值 | 必填 |
|--------|-----|------|
| `VITE_NETEASE_API_URL` | `https://your-netease-api.vercel.app` | ✅ 是 |
| `VITE_GOOGLE_AI_API_KEY` | 你的 Gemini API Key | ❌ 否 |
| `VITE_APP_NAME` | `Lyra` | ❌ 否 |
| `VITE_ENABLE_AI_THEME` | `true` | ❌ 否 |

---

## 🚀 部署步骤

### 方法 1: 一键部署（推荐）

1. 点击 Deploy 按钮：

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chthollyphile/folia-major)

2. 登录/注册 Vercel 账号

3. 授权 GitHub 访问

4. 配置项目：
   - **Project Name**: `lyra-music-player`（或你喜欢的名字）
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. 添加环境变量（见上表）

6. 点击 **Deploy**

7. 等待 2-3 分钟构建完成

8. 访问你的应用：`https://your-project.vercel.app`

---

### 方法 2: Vercel CLI 部署

#### 安装 Vercel CLI
```bash
npm install -g vercel
```

#### 登录
```bash
vercel login
```

#### 本地测试
```bash
# 确保构建成功
npm run build

# 本地预览
npm run preview
```

#### 部署到生产环境
```bash
# 首次部署
vercel

# 后续部署
vercel --prod
```

#### 设置环境变量
```bash
vercel env add VITE_NETEASE_API_URL production
# 粘贴你的 API 地址后回车

vercel env add VITE_GOOGLE_AI_API_KEY production
# 粘贴你的 API Key 后回车（可选）
```

#### 重新部署
```bash
vercel --prod
```

---

### 方法 3: GitHub 集成（推荐团队协作）

1. 在 Vercel Dashboard 点击 **Add New Project**

2. 从 GitHub 导入你的仓库

3. 配置构建设置：
   ```
   Framework: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. 添加环境变量

5. 点击 **Deploy**

6. 启用自动部署：
   - Push 到 `main` 分支 → 自动部署到生产环境
   - Push 到其他分支 → 自动创建预览环境

---

## 🔧 构建优化

### 1. 减小包体积

#### 检查包大小
```bash
npm run build

# 分析包内容
npx vite-bundle-visualizer
```

#### 优化建议

**移除未使用的依赖：**
```bash
npm install -g depcheck
depcheck
```

**代码分割：**
```typescript
// 使用动态导入
const ThemePark = lazy(() => import('./components/modal/ThemePark'));
```

**压缩资源：**
```bash
# 压缩图片
npm install -g @squoosh/cli
squoosh-cli --webp auto img/*.png
```

### 2. 加速构建

在 `vite.config.ts` 中添加：

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three'],
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', 'framer-motion'],
  },
});
```

---

## 📊 性能检查

### Vercel Analytics（推荐）

1. 在 Vercel 项目设置中启用 Analytics

2. 安装包：
```bash
npm install @vercel/analytics
```

3. 在 `src/main.tsx` 中添加：
```typescript
import { inject } from '@vercel/analytics';

inject();
```

### Lighthouse 审计

部署后运行：
```bash
npx lighthouse https://your-project.vercel.app --view
```

**目标分数：**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## 🐛 常见问题

### 1. 构建失败：内存不足

**错误信息：**
```
JavaScript heap out of memory
```

**解决方案：**

在 `package.json` 中修改构建命令：
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

---

### 2. API 请求跨域错误

**错误信息：**
```
Access to fetch at 'https://...' from origin 'https://your-app.vercel.app' has been blocked by CORS
```

**解决方案：**

确保你的 Netease API 部署配置了 CORS：

在 API 项目的 `vercel.json` 中添加：
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type"
        }
      ]
    }
  ]
}
```

---

### 3. 环境变量未生效

**检查清单：**
- ✅ 变量名以 `VITE_` 开头
- ✅ 在 Vercel Dashboard 中已配置
- ✅ 重新触发部署（环境变量更改需要重新部署）

**验证环境变量：**
```typescript
console.log('API URL:', import.meta.env.VITE_NETEASE_API_URL);
```

---

### 4. 路由 404 错误

**问题：** 刷新页面或直接访问子路径时显示 404

**解决方案：** 已在 `vercel.json` 中配置 SPA 路由重写

如果仍有问题，检查 `vercel.json` 中的 `rewrites` 配置。

---

### 5. 静态资源加载失败

**问题：** 图片、字体等资源 404

**解决方案：**

确保 `vite.config.ts` 中配置了正确的 base：
```typescript
export default defineConfig({
  base: './', // 使用相对路径
});
```

---

## 🌐 自定义域名

### 1. 添加域名

在 Vercel 项目设置 → Domains：

1. 输入你的域名，例如：`lyra.example.com`
2. 选择域名类型（主域名或子域名）
3. 根据提示配置 DNS

### 2. DNS 配置

**A 记录（主域名）：**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 记录（子域名）：**
```
Type: CNAME
Name: lyra
Value: cname.vercel-dns.com
```

### 3. SSL 证书

Vercel 自动提供免费 SSL 证书（Let's Encrypt），通常 5-10 分钟生效。

---

## 🔄 CI/CD 工作流

### 自动化部署

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_NETEASE_API_URL: ${{ secrets.VITE_NETEASE_API_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**设置 GitHub Secrets：**
1. 获取 Vercel Token：https://vercel.com/account/tokens
2. 在 GitHub 项目设置 → Secrets → Actions 添加：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `VITE_NETEASE_API_URL`

---

## 📈 监控与日志

### 1. 查看部署日志

```bash
vercel logs your-deployment-url
```

### 2. 实时日志

```bash
vercel logs your-deployment-url --follow
```

### 3. 查看错误

在 Vercel Dashboard → 项目 → Functions → Logs

---

## 💰 成本估算

### Vercel 免费计划限制

- ✅ 100 GB 带宽/月
- ✅ 无限部署
- ✅ 自动 HTTPS
- ✅ 自动预览环境
- ⚠️ 单个函数执行时间 10 秒

### 优化建议

如果超出免费额度，考虑：
1. 启用图片优化（按需付费）
2. 使用 CDN 缓存静态资源
3. 升级到 Pro 计划（$20/月）

---

## ✅ 部署检查清单

部署前确认：

- [ ] `npm run build` 本地构建成功
- [ ] `npm run preview` 本地预览正常
- [ ] 环境变量已配置
- [ ] Netease API 已部署并可访问
- [ ] 更新 README.md 中的演示链接
- [ ] 测试关键功能（搜索、播放、主题切换）
- [ ] 检查移动端响应式
- [ ] 运行 Lighthouse 审计

部署后验证：

- [ ] 访问生产 URL 正常
- [ ] 搜索功能正常
- [ ] 播放音乐正常
- [ ] 歌词显示正常
- [ ] 主题切换正常
- [ ] 移动端访问正常
- [ ] PWA 安装正常

---

## 🎉 部署完成

你的应用已成功部署到：
```
https://your-project.vercel.app
```

**下一步：**
1. 分享链接给评委/用户
2. 收集反馈
3. 监控性能指标
4. 持续优化

祝 Hackathon 顺利！🚀
