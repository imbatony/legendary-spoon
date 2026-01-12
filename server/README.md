# Server 后端服务

基于 Bun + SQLite 的后端 API 服务器。

## 技术栈
- Bun (运行时 + HTTP 服务器)
- SQLite (数据库)
- TypeScript

## 目录结构
```
server/
├── src/
│   └── index.ts       # 服务器入口 + API 路由
├── db/
│   ├── index.ts       # 数据库连接
│   ├── init.ts        # 数据库初始化
│   └── seed.ts        # 种子数据
└── uploads/           # 上传文件存储（不提交到 git）
```

## 开发
```bash
# 初始化数据库
bun run db:init

# 启动开发服务器
bun dev
```

## API 端点

### TODO
- `GET /api/todos` - 获取所有待办事项
- `POST /api/todos` - 创建待办事项
- `PUT /api/todos/:id` - 更新待办事项
- `DELETE /api/todos/:id` - 删除待办事项

### 分类
- `GET /api/categories` - 获取所有分类
- `POST /api/categories` - 创建分类

### 文件
- `GET /api/files` - 获取文件列表
- `POST /api/upload` - 上传文件
- `GET /api/download/:id` - 下载文件
- `DELETE /api/files/:id` - 删除文件

### 提醒
- `GET /api/reminders` - 获取提醒列表
- `POST /api/reminders` - 创建提醒
- `PUT /api/reminders/:id` - 更新提醒
- `DELETE /api/reminders/:id` - 删除提醒
