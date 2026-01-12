# legendary-spoon

legendary-spoon 是一个专为个人设计的多平台工具集，提供待办事项、文件传输、提醒等功能。

## 项目结构

```
legendary-spoon/
├── server/              # 后端服务器 (Bun + SQLite)
│   ├── src/            # 服务器源码
│   ├── db/             # 数据库相关
│   └── uploads/        # 上传文件存储（不提交到 git）
├── clients/            # 客户端
│   ├── web/           # Web 客户端 (React 19)
│   ├── android/       # Android 客户端（计划中）
│   └── windows/       # Windows 客户端（计划中）
├── shared/            # 共享代码
│   └── types/         # TypeScript 类型定义
├── deploy/            # 部署脚本
└── data/              # 数据文件（不提交到 git）
```

## 主要功能
1. **TODO** - 类似微软 TODO 应用，支持分类（如工作、生活）、优先级、截止日期
2. **文件传输** - 类似文件传输助手，支持上传和下载文件，方便多平台传输
3. **提醒** - 支持设置提醒（孩子生日、结婚纪念日等），支持重复提醒
4. 未完待续

## 主要技术栈
- **运行时**: Bun
- **前端**: React 19
- **后端**: Bun Server (内置 HTTP 服务器)
- **数据库**: SQLite (默认) / Supabase (可选)
- **语言**: TypeScript

## 数据库配置

本项目支持两种数据库后端：

### SQLite (默认)
无需额外配置，开箱即用。数据存储在 `data/mytools.db` 文件中。

### Supabase (可选)
如需使用 Supabase PostgreSQL 数据库：

1. 创建 Supabase 项目：https://supabase.com
2. 复制环境变量配置文件：
   ```bash
   cp .env.example .env
   ```
3. 编辑 `.env` 文件，设置数据库类型和 Supabase 配置：
   ```bash
   DB_TYPE=supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   ```
4. 在 Supabase SQL Editor 中运行迁移脚本：
   ```bash
   cat server/db/supabase-migration.sql
   ```
5. 启动应用即可自动连接到 Supabase

### 切换数据库
只需修改 `.env` 文件中的 `DB_TYPE` 变量即可：
```bash
# 使用 SQLite
DB_TYPE=sqlite

# 使用 Supabase
DB_TYPE=supabase
```

## 开发指南

### 安装依赖
```bash
bun install
```

### 开发模式（带热重载）
```bash
bun dev
```
访问 http://localhost:3000

### 构建生产版本（静态站点）
```bash
bun run build
```

### 运行生产服务器
```bash
bun start
```

### 初始化数据库
```bash
bun run db:init
```

### 添加测试数据
```bash
bun run db:seed
```

## 生产部署

### 快速部署（推荐）

一键安装到 Linux 服务器：

```bash
# 方法 1：在线安装
bash <(curl -fsSL https://raw.githubusercontent.com/imbatony/legendary-spoon/main/deploy/quick-install.sh)

# 方法 2：克隆后安装
git clone https://github.com/imbatony/legendary-spoon.git
cd legendary-spoon
bash deploy/quick-install.sh
```

安装脚本会：
- ✅ 自动检测并安装 Bun
- ✅ 克隆项目到指定目录（默认 `/opt/legendary-spoon`）
- ✅ 安装依赖并初始化数据库
- ✅ 配置 systemd/PM2/Docker 服务（可选择）
- ✅ 自动启动并验证服务

### 手动部署方式

#### 使用 systemd（推荐，已自动配置）
```bash
# 查看服务状态
sudo systemctl status legendary-spoon

# 查看日志
sudo journalctl -u legendary-spoon -f

# 重启服务
sudo systemctl restart legendary-spoon
```

#### 使用 PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 使用 Docker
```bash
docker-compose up -d
```

### 故障排查

如果遇到部署问题：

```bash
# 运行诊断工具
bash deploy/troubleshooting/diagnose.sh

# 查看快速修复指南
cat deploy/QUICKFIX.md

# 查看故障排除工具
ls deploy/troubleshooting/
```

详细文档：
- [完整部署指南](deploy/DEPLOYMENT.md)
- [快速修复指南](deploy/QUICKFIX.md)
- [故障排除工具](deploy/troubleshooting/README.md)

### 更新应用

#### 检查更新
```bash
cd /opt/legendary-spoon
bash check-updates.sh
```

#### 一键更新
```bash
cd /opt/legendary-spoon
bash update.sh
```

更新脚本会自动：停止服务 → 备份数据库 → 拉取代码 → 安装依赖 → 重启服务（失败时自动回滚）

#### 自动检查更新（可选）
```bash
# 每周一上午 9 点检查更新
crontab -e
# 添加: 0 9 * * 1 cd /opt/legendary-spoon && bash check-updates.sh
```


## 项目结构
```
├── src/
│   ├── index.ts        # 服务器入口点和 API 路由
│   ├── frontend.tsx    # React 应用入口点（带 HMR）
│   ├── App.tsx         # 主 React 组件
│   ├── APITester.tsx   # API 测试组件
│   ├── index.html      # HTML 模板
│   ├── index.css       # 样式文件
│   └── *.svg           # 静态资源
├── server/
│   └── db/             # 数据库相关文件
│       ├── index.ts    # 数据库工厂（选择适配器）
│       ├── types.ts    # 数据库接口定义
│       ├── init.ts     # SQLite 初始化脚本
│       ├── supabase-migration.sql  # Supabase 迁移脚本
│       └── adapters/   # 数据库适配器
│           ├── sqlite.ts    # SQLite 适配器
│           └── supabase.ts  # Supabase 适配器
├── .env.example        # 环境变量示例
├── package.json        # 依赖和脚本
├── tsconfig.json       # TypeScript 配置
├── bunfig.toml         # Bun 配置
└── bun.lock            # 锁文件
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
