# 校园失物招领平台 (Lost & Found Platform Next)

[![Nuxt 4](https://img.shields.io/badge/Nuxt-4.0-00DC82?logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3.0-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-4.0-5A0EF8?logo=daisyui&logoColor=white)](https://daisyui.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Transformers.js](https://img.shields.io/badge/AI-Transformers.js-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/docs/transformers.js)

针对现代校园场景重构的智能失物招领平台。摒弃了传统的表单填写模式，采用 **AI 图像识别** 和 **向量语义搜索** 技术，让"寻物"和"归还"变得前所未有的简单。

## ✨ 核心特性

### 🧠 AI 智能驱动
*   **零样本图像自动打标**：无需手动填写物品类别。上传图片后，集成 **CLIP** 模型（Zero-Shot Classification）自动识别物品（如钱包、钥匙、校园卡等）及颜色特征。
*   **语义向量搜索**：(开发中) 系统将图片和文本转换为 512 维向量，支持"以图搜图"和模糊语义搜索，彻底解决描述不清的问题。
*   **智能压缩**：自动处理高分辨率图片，智能压缩并调整尺寸以适配 AI 模型输入，确保分析速度。

### 🛡️ 信任构建体系
*   **认领验证流程**：严谨的 `申请 -> 审核 ->通过` 流程，防止冒领。
*   **双向评价系统**：物品归还后，失主和拾主可相互评分（1-5星）及留言。
*   **用户信用画像**：基于评价历史和活跃度生成的信用统计，展示在用户个人主页。

### 🎨 极致用户体验
*   **DaisyUI + UnoCSS**：清新现代的 UI 设计，支持完美的 **深色模式 (Dark Mode)** 切换。
*   **实时通知**：基于 SSE (Server-Sent Events) 的实时消息推送，即时获知认领进度。
*   **响应式设计**：完美适配移动端和桌面端。

## 🛠️ 技术栈

*   **框架**：[Nuxt 4](https://nuxt.com) (Compatibility Mode)
*   **语言**：TypeScript
*   **UI 系统**：DaisyUI + UnoCSS
*   **数据库**：SQLite + [Drizzle ORM](https://orm.drizzle.team)
*   **身份验证**：`nuxt-auth-utils` (基于 Session 的安全认证)
*   **AI 引擎**：[Transformers.js](https://huggingface.co/docs/transformers.js)
    *   视觉模型：`Xenova/clip-vit-base-patch32`
    *   运行环境：Node.js / Bun (Backend)
    *   模型源：`hf-mirror.com` (国内加速)
*   **图片处理**：`sharp` (服务端高性能图片处理)

## 🚀 快速开始

### 前置要求
*   [Node.js](https://nodejs.org/) 18+ 或 [Bun](https://bun.sh/) 1.0+
*   Git

### 1. 克隆项目
```bash
git clone https://github.com/LouisLau-art/lost-and-found-platform-nuxt.git
cd lost-and-found-platform-nuxt
```

### 2. 安装依赖
推荐使用 Bun 以获得极致速度：
```bash
bun install
```

### 3. 初始化数据库
本项目使用 SQLite，无需配置额外的数据库服务。
```bash
bun run db:push
```

### 4. 启动开发服务器
```bash
bun run dev
```
服务器将在 `http://localhost:3000` 启动。

⚠️ **首次运行注意**：
第一次上传图片时，服务器会自动下载 AI 模型（约 300MB）。请确保网络连接正常（已配置国内镜像源，无需梯子）。模型下载后会缓存在 `.cache/huggingface` 目录下。

## 🤖 AI 功能说明

本项目使用了 **CLIP (Contrastive Language-Image Pre-Training)** 技术。

1.  **上传阶段**：
    *   用户上传图片 -> `sharp` 压缩并调整为 224x224 (WebP/JPEG)。
    *   这是因为 CLIP 模型的视觉编码器输入固定为 224px。

2.  **分析阶段**：
    *   Server 端加载 `clip-vit-base-patch32` 模型。
    *   **Zero-Shot Classification**：我们将图片向量与预定义的标签列表（如 Wallet, Phone, Keys...）的文本向量进行比对。
    *   计算余弦相似度，返回置信度最高的标签。

3.  **未来规划**：
    *   将生成的 Image Embedding (512维向量) 存入数据库，实现以图搜图。

## 📂 项目结构

```
.
├── app/                    # Nuxt 4 核心应用代码
│   ├── components/         # Vue 组件
│   ├── composables/        # 组合式函数 (useToast, etc.)
│   ├── layouts/            # 页面布局
│   └── pages/              # 页面路由
├── server/                 # Nitro 服务端代码
│   ├── api/                # API 接口定义
│   ├── database/           # Drizzle Schema & DB 连接
│   └── utils/              # 服务端工具 (AI引擎, Auth)
├── public/                 # 静态资源
└── uno.config.ts           # UnoCSS/DaisyUI 配置
```

## 📄 许可证

[MIT License](./LICENSE)
