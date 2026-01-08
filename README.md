# legendary-spoon

legendary-spoon 是一个专为我自己设计的一个网页版（自适应屏幕）工具集。

## 主要功能
1. **TODO** - 类似微软TODO应用，支持分类（比如，工作，生活）
2. **文件传输** - 类似文件传输助手的功能，支持简单的下载和上传文件，方便多平台传输文件
3. **提醒** - 可以设置提醒，比如孩子生日，结婚纪念日功能
4. 未完待续

## 主要技术栈
- **运行时**: Bun
- **前端**: React 19
- **后端**: Bun Server (内置 HTTP 服务器)
- **数据库**: SQLite
- **语言**: TypeScript

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
│       ├── index.ts    # 数据库连接
│       └── init.ts     # 数据库初始化脚本
├── package.json        # 依赖和脚本
├── tsconfig.json       # TypeScript 配置
├── bunfig.toml         # Bun 配置
└── bun.lock            # 锁文件
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
