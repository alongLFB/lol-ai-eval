# LOL AI Eval

这是一个结合 Riot Games API 和 AI（如 OpenAI/DeepSeek）的英雄联盟评价和数据分析工具。项目基于 Next.js 框架构建。

## 功能特性

- 集成 Riot Games API 获取英雄联盟游戏数据
- 集成 AI 大语言模型接口进行对局分析与评价
- 自动化 CI/CD 部署到云服务器（使用 GitHub Actions 和 PM2）

## 本地开发指南

### 1. 环境要求
- Node.js (推荐 v18 或更高版本)
- npm / yarn / pnpm

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制根目录的示例环境变量文件并重命名为 `.env.local`：

```bash
cp .env.example .env.local
```
然后在 `.env.local` 文件中填入你的 API 密钥信息：
- `RIOT_API_KEY`: Riot Games 开发者 API 密钥
- `AI_API_KEY`: 你的 OpenAI 或 DeepSeek 等兼容平台的 API 密钥
- `AI_BASE_URL`: AI 接口的 Base URL
- `AI_MODEL`: 使用的 AI 模型名称

### 4. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可查看效果。

## 部署指南 (GitHub Actions + PM2)

项目已配置好 GitHub Actions 工作流（`.github/workflows/deploy.yml`），当代码 push 到 `master` 分支时会自动触发部署。

### 1. 服务器准备工作
为了使自动部署生效，你的目标服务器（Ubuntu/CentOS 等）需要安装：
- Git
- NVM (Node Version Manager) & Node.js
- PM2 (`npm install -g pm2`)

### 2. GitHub 仓库 Secrets 配置
进入你的 GitHub 仓库 -> **Settings** -> **Secrets and variables** -> **Actions**，点击 **New repository secret** 依次添加以下 Secrets：

- `SERVER_HOST`: 你的服务器公网 IP
- `SERVER_USER`: 登录服务器的用户名（如 root、ubuntu）
- `SERVER_SSH_KEY`: 用于登录服务器的 SSH 私钥（`~/.ssh/id_rsa` 的内容）
- `SERVER_PORT`: SSH 端口（可选，默认为 22）
- `ENV_FILE`: （**重要**）你的完整环境变量内容。将你本地 `.env.local` 的所有内容复制并粘贴到这个 secret 里。自动部署脚本会在服务器上动态生成 `.env.local` 文件。

### 3. 触发部署
完成上述配置后，只要向 GitHub 仓库的 `master` 分支推送代码，GitHub Actions 就会自动：
1. 通过 SSH 登录你的服务器
2. 拉取最新代码 (HTTPS 方式)
3. 生成 `.env.local` 文件
4. 安装依赖并执行打包 (`npm ci` & `npm run build`)
5. 使用 PM2 重启或启动服务

你可以通过服务器执行 `pm2 status` 和 `pm2 logs lol-ai-eval` 来查看项目运行状态和日志。
