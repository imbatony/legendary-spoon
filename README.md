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
