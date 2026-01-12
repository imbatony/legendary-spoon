# legendary-spoon - GitHub Copilot Instructions

## 项目概述
legendary-spoon 是一个多平台个人工具集，基于 Bun + React + SQLite 构建，支持 Web、Android、Windows 等多种客户端。

## 项目结构
```
legendary-spoon/
├── server/              # 后端服务器 (Bun + SQLite)
│   ├── src/            # 服务器源码（API 路由、业务逻辑）
│   ├── db/             # 数据库相关（连接、初始化、迁移）
│   └── uploads/        # 上传文件存储（不提交到 git）
├── clients/            # 客户端
│   ├── web/           # Web 客户端 (React 19 + TypeScript)
│   ├── android/       # Android 客户端（计划中）
│   └── windows/       # Windows 客户端（计划中）
├── shared/            # 共享代码
│   └── types/         # TypeScript 类型定义（所有客户端共用）
└── deploy/            # 部署脚本和配置
```

## 技术栈

### 后端 (server/)
- **运行时**: Bun (最新版本)
- **数据库**: SQLite (使用 bun:sqlite)
- **语言**: TypeScript
- **文件存储**: 本地文件系统（server/uploads/）

### Web 客户端 (clients/web/)
- **框架**: React 19 + TypeScript
- **构建工具**: Bun 内置构建工具
- **样式**: 原生 CSS
- **热重载**: Bun HMR

### 共享代码 (shared/)
- **类型定义**: shared/types/ - 所有客户端共用的 TypeScript 接口

## 主要功能模块
1. **待办事项 (TODO)** - 支持分类、优先级、截止日期
2. **文件传输** - 文件上传/下载功能
3. **提醒功能** - 支持重复提醒（每日/每周/每月/每年）

## 代码规范

### TypeScript
- 使用严格模式
- 优先使用类型推断
- 接口命名使用 PascalCase
- 类型定义放在文件顶部

### React
- 使用函数组件和 Hooks
- 优先使用 `useState`, `useEffect`, `useCallback`
- 组件文件使用 `.tsx` 扩展名
- Props 接口命名：`ComponentNameProps`

### 数据库
- 使用 `bun:sqlite` 模块
- SQL 使用参数化查询防止注入
- 表名使用小写和下划线
- 启用外键约束

### API 路由
- RESTful 风格
- 路径格式：`/api/资源名`
- 使用 HTTP 动词：GET, POST, PUT, DELETE
- 返回 JSON 格式数据

## 数据库表结构

### categories (分类表)
- id: INTEGER PRIMARY KEY
- name: TEXT (分类名称)
- color: TEXT (颜色代码)
- created_at: DATETIME

### todos (待办事项表)
- id: INTEGER PRIMARY KEY
- title: TEXT (标题)
- description: TEXT (描述)
- category_id: INTEGER (关联分类)
- completed: BOOLEAN (是否完成)
- priority: INTEGER (优先级 0-3)
- due_date: DATETIME (截止日期)
- created_at: DATETIME
- updated_at: DATETIME

### files (文件表)
- id: INTEGER PRIMARY KEY
- filename: TEXT (存储文件名)
- original_name: TEXT (原始文件名)
- file_size: INTEGER (文件大小)
- mime_type: TEXT (MIME 类型)
- upload_date: DATETIME
- download_count: INTEGER

### reminders (提醒表)
- id: INTEGER PRIMARY KEY
- title: TEXT (标题)
- description: TEXT (描述)
- remind_date: DATETIME (提醒时间)
- repeat_type: TEXT ('once', 'daily', 'weekly', 'monthly', 'yearly')
- is_active: BOOLEAN (是否激活)
- created_at: DATETIME
- updated_at: DATETIME

## 文件组织

### server/src/ (后端服务器)
- `index.ts` - 服务器入口和 API 路由

### server/db/ (数据库)
- `index.ts` - 数据库连接
- `init.ts` - 数据库初始化脚本
- `seed.ts` - 种子数据

### clients/web/ (Web 客户端)
- `index.tsx` - React 应用入口（带 HMR）
- `App.tsx` - 主应用组件
- `TodoList.tsx` - 待办事项组件
- `FileTransfer.tsx` - 文件传输组件
- `APITester.tsx` - API 测试组件
- `index.css` - 全局样式
- `index.html` - HTML 模板

### shared/types/ (共享类型)
- `index.ts` - TypeScript 接口定义（Todo, Category, FileInfo, Reminder 等）

## 编码建议

### 创建新的 API 路由时
```typescript
"/api/resource": {
  async GET(req) {
    const data = db.query("SELECT * FROM table").all();
    return Response.json(data);
  },
  async POST(req) {
    const body = await req.json();
    const result = db.run("INSERT INTO table (...) VALUES (?)", [values]);
    return Response.json({ id: result.lastInsertRowid });
  }
}
```

### 创建新的 React 组件时
```typescript
interface ComponentProps {
  // props 定义
}

export function Component({ prop }: ComponentProps) {
  const [state, setState] = useState<Type>(initialValue);
  
  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
}
```

### 数据库查询
```typescript
// 查询多条
const items = db.query("SELECT * FROM table WHERE condition = ?").all(value);

// 查询单条
const item = db.query("SELECT * FROM table WHERE id = ?").get(id);

// 插入
const result = db.run("INSERT INTO table (col) VALUES (?)", [value]);

// 使用事务
db.transaction(() => {
  // 多个操作
})();
```

## 注意事项
- Bun 原生支持 TypeScript，无需额外配置
- 使用 `bun:sqlite` 而非 `better-sqlite3`
- 开发时使用 `bun --hot` 启用热重载
- 静态资源直接 import（如 SVG）
- 环境变量使用 `process.env`
- API 响应统一使用 `Response.json()`

## 常用命令
```bash
bun dev          # 开发模式
bun run build    # 构建静态站点
bun start        # 生产模式
bun run db:init  # 初始化数据库
```
