# LOL AI Eval (AI 召唤师神谕)

[English](#english) | [中文](#中文)

---

## English

A Next.js application that integrates the **Riot Games API** and **Large Language Models (LLMs)** (OpenAI/DeepSeek, etc.) to evaluate, roast, or praise Summoners' recent match history. It features an OP.GG-style match history interface, dynamic game data visualization, and shareable match reports.

### 🌟 Key Features

*   **🔮 AI Oracle Evaluation**: Uses an LLM to generate memes roasting or praising players' recent performance based on their match statistics.
*   **🎮 OP.GG-Style Match History**:
    *   **Game Type Identification**: Visually categorizes matches (Ranked Solo/Duo, Ranked Flex, ARAM, Normal Draft, etc.) with custom-themed labels.
    *   **Detailed Stats**: Displays K/D/A, KDA Ratio, Kill Participation, Creep Score (CS & CS/min), and Vision Score.
    *   **Full Build & Loadouts**: Shows summoner spells, primary/secondary runes, six item slots, and trinkets.
    *   **Achievements & Badges**: Identifies multikills (Double Kill up to Pentakill) and awards **MVP/ACE** titles based on performance metrics.
*   **📊 Expandable Match Details (No Extra API Cost)**:
    *   Clicking a match opens a detailed list of all 10 participants.
    *   Displays champion level, item builds, spells, KDA, CS, and damage dealt to champions (visualized with relative damage bars).
    *   **Smart Lobby Rank Detection**: On expansion, the app asynchronously loads the ranks of all 10 players to display individual ranks and calculate the average lobby rank.
*   **📸 Shareable Poster Card**: Generate a high-resolution PNG image of the AI Oracle evaluation and recent match history card with a single click, ready for social sharing.
*   **⚡ Automated CI/CD**: GitHub Actions workflow preconfigured for automatic deployment to cloud servers using PM2.

---

### 💻 Local Development Guide

#### 1. Requirements
*   Node.js (v18 or higher recommended)
*   npm / yarn / pnpm

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the environment variables:
*   `RIOT_API_KEY`: Your Riot Games Developer API Key.
*   `AI_API_KEY`: Your API key for OpenAI, DeepSeek, or any OpenAI-compatible provider.
*   `AI_BASE_URL`: Base URL of your AI provider.
*   `AI_MODEL`: Model name (e.g., `gpt-3.5-turbo`, `deepseek-chat`).

#### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

### 🚀 Deployment Guide (GitHub Actions + PM2)

A preconfigured GitHub Actions workflow (`.github/workflows/deploy.yml`) is available to deploy updates automatically when code is pushed to the `master` branch.

#### 1. Server Setup
Ensure your server has the following installed:
*   Git
*   NVM & Node.js
*   PM2 (`npm install -g pm2`)

#### 2. Repository Secrets
Under your GitHub Repository **Settings** -> **Secrets and variables** -> **Actions**, add:
*   `SERVER_HOST`: Public IP of your server.
*   `SERVER_USER`: Server username (e.g., `root`, `ubuntu`).
*   `SERVER_SSH_KEY`: Private SSH Key contents used to access the server.
*   `SERVER_PORT`: SSH port (default: 22).
*   `ENV_FILE`: Copy all contents of your local `.env.local` file. The deployment runner will dynamically generate the environment file on the server.

---

## 中文

这是一个结合了 **Riot Games API** 和 **AI 大语言模型**（OpenAI/DeepSeek 等）的英雄联盟战绩评价与数据分析工具。项目基于 Next.js 框架构建，提供类似 OP.GG 的战绩展示、动态对局细节以及可分享的 AI 裁决报告。

### 🌟 功能特性

*   **🔮 水晶枢纽 AI 裁决**：根据玩家近期的战绩数据，由 AI 生成毒舌嘲讽或热血赞美的大字报评价。
*   **🎮 OP.GG 风格对战历史**：
    *   **对局类型标记**：区分单双排、灵活组排、大乱斗、匹配等模式，提供彩色标签。
    *   **详细战绩数据**：展示 K/D/A、KDA 比率、击杀参与率、CS（补刀数与分均补刀）、视野得分。
    *   **装备与配置**：展示召唤师技能、主副系符文、六格装备和饰品。
    *   **成就徽章**：自动标记多杀情况（双杀至五杀），并基于算法授予队伍 **MVP/ACE** 勋章。
*   **📊 可展开的对战详情（极低 API 消耗）**：
    *   点击任意对战行即可展开查看双方队伍 10 位玩家的完整信息。
    *   展示英雄等级、出装、技能、KDA、CS、对英雄造成的伤害（带有直观的伤害进度条）。
    *   **智能大厅段位检测**：点击展开时，异步并行拉取 10 位玩家的实时段位，计算并显示该场对局的**平均段位**及个人的段位等级。
*   **📸 战绩大字报分享**：一键生成高清晰度 PNG 分享图，包含 AI 裁决与精美战绩，方便分享至社交平台。
*   **⚡ 自动化部署 CI/CD**：内置 GitHub Actions 工作流，支持代码推送至 `master` 分支后自动通过 PM2 部署至云服务器。

---

### 💻 本地开发指南

#### 1. 环境要求
*   Node.js (推荐 v18 或更高版本)
*   npm / yarn / pnpm

#### 2. 安装依赖
```bash
npm install
```

#### 3. 配置环境变量
复制根目录的示例环境变量文件并重命名为 `.env.local`：
```bash
cp .env.example .env.local
```
然后在 `.env.local` 中填入你的 API 密钥信息：
*   `RIOT_API_KEY`: Riot Games 开发者 API 密钥
*   `AI_API_KEY`: 你的 OpenAI 或 DeepSeek 等兼容平台的 API 密钥
*   `AI_BASE_URL`: AI 接口 of 你的 AI 供应商
*   `AI_MODEL`: 使用的 AI 模型名称

#### 4. 启动开发服务器
```bash
npm run dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可查看效果。

---

### 🚀 部署指南 (GitHub Actions + PM2)

项目已配置好 GitHub Actions 工作流（`.github/workflows/deploy.yml`），当代码 push 到 `master` 分支时会自动触发部署。

#### 1. 服务器准备工作
为了使自动部署生效，你的目标服务器（Ubuntu/CentOS 等）需要安装：
*   Git
*   NVM (Node Version Manager) & Node.js
*   PM2 (`npm install -g pm2`)

#### 2. GitHub 仓库 Secrets 配置
进入你的 GitHub 仓库 -> **Settings** -> **Secrets and variables** -> **Actions**，点击 **New repository secret** 依次添加以下 Secrets：
*   `SERVER_HOST`: 你的服务器公网 IP
*   `SERVER_USER`: 登录服务器的用户名（如 root、ubuntu）
*   `SERVER_SSH_KEY`: 用于登录服务器的 SSH 私钥（`~/.ssh/id_rsa` 的内容）
*   `SERVER_PORT`: SSH 端口（可选，默认为 22）
*   `ENV_FILE`: （**重要**）你的完整环境变量内容。将你本地 `.env.local` 的所有内容复制并粘贴 to 这个 secret 里。自动部署脚本会在服务器上动态生成 `.env.local` 文件。
