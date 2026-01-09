# 数据库抽象层说明

## 概述

本项目使用**适配器模式**实现数据库抽象层，支持多种数据存储后端。目前支持：
- ✅ SQLite（默认）
- ✅ Supabase PostgreSQL

## 架构设计

### 文件结构
```
server/db/
├── types.ts              # 数据库接口和类型定义
├── index.ts              # 数据库工厂（根据环境变量选择适配器）
├── init.ts               # SQLite 初始化脚本
├── supabase-migration.sql # Supabase 迁移脚本
└── adapters/
    ├── sqlite.ts         # SQLite 适配器实现
    └── supabase.ts       # Supabase 适配器实现
```

### 核心概念

#### 1. DatabaseAdapter 接口
所有数据库适配器都必须实现 `DatabaseAdapter` 接口，确保一致的 API：

```typescript
interface DatabaseAdapter {
  // 分类操作
  getAllCategories(): Promise<Category[]>
  createCategory(data: CreateCategoryInput): Promise<Category>
  updateCategory(id: number, data: UpdateCategoryInput): Promise<Category | null>
  deleteCategory(id: number): Promise<boolean>
  
  // 待办事项操作
  getAllTodos(): Promise<Todo[]>
  getTodoById(id: number): Promise<Todo | null>
  createTodo(data: CreateTodoInput): Promise<Todo>
  updateTodo(id: number, data: UpdateTodoInput): Promise<Todo | null>
  deleteTodo(id: number): Promise<boolean>
  
  // 文件操作
  getAllFiles(): Promise<FileRecord[]>
  getFileById(id: number): Promise<FileRecord | null>
  createFile(data: CreateFileInput): Promise<FileRecord>
  deleteFile(id: number): Promise<boolean>
  incrementFileDownloadCount(id: number): Promise<void>
  getTotalFileSize(): Promise<number>
  getFileCount(): Promise<number>
  
  // 提醒操作
  getActiveReminders(): Promise<Reminder[]>
  createReminder(data: CreateReminderInput): Promise<Reminder>
  updateReminder(id: number, data: UpdateReminderInput): Promise<Reminder | null>
  deleteReminder(id: number): Promise<boolean>
}
```

#### 2. 数据库工厂
`server/db/index.ts` 根据环境变量 `DB_TYPE` 自动选择合适的适配器：

```typescript
const DB_TYPE = process.env.DB_TYPE || "sqlite";

switch (DB_TYPE) {
  case "supabase":
    db = new SupabaseAdapter(supabaseUrl, supabaseKey);
    break;
  case "sqlite":
  default:
    db = new SQLiteAdapter();
    break;
}

export { db };
```

## 使用方法

### 1. 默认使用 SQLite
无需任何配置，直接运行即可：

```bash
bun dev
```

数据会存储在 `data/mytools.db` 文件中。

### 2. 切换到 Supabase

#### 步骤 1：创建 Supabase 项目
访问 https://supabase.com 创建项目，获取：
- Project URL: `https://xxxxx.supabase.co`
- Anon Key: `eyJhbGci...`

#### 步骤 2：运行迁移脚本
在 Supabase Dashboard 的 SQL Editor 中运行：
```sql
-- 复制 server/db/supabase-migration.sql 的内容并执行
```

#### 步骤 3：配置环境变量
创建 `.env` 文件：
```bash
cp .env.example .env
```

编辑 `.env`：
```bash
DB_TYPE=supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...
```

#### 步骤 4：安装依赖
```bash
bun install
```

#### 步骤 5：启动应用
```bash
bun dev
```

### 3. 在代码中使用数据库

所有数据库操作都通过 `db` 对象完成，**不需要关心底层使用的是哪个数据库**：

```typescript
import { db } from "../server/db";

// 获取所有待办事项
const todos = await db.getAllTodos();

// 创建待办事项
const newTodo = await db.createTodo({
  title: "完成报告",
  description: "2024年度总结",
  category_id: 1,
  priority: 2,
  due_date: "2024-12-31"
});

// 更新待办事项
const updated = await db.updateTodo(1, {
  completed: true
});

// 删除待办事项
await db.deleteTodo(1);
```

## 扩展新的数据库适配器

如果需要添加新的数据库后端（如 MySQL、MongoDB 等）：

### 步骤 1：创建适配器类
在 `server/db/adapters/` 下创建新文件，例如 `mysql.ts`：

```typescript
import type { DatabaseAdapter } from "../types";

export class MySQLAdapter implements DatabaseAdapter {
  // 实现所有接口方法
  async getAllCategories(): Promise<Category[]> {
    // MySQL 实现
  }
  
  async createCategory(data: CreateCategoryInput): Promise<Category> {
    // MySQL 实现
  }
  
  // ... 实现其他所有方法
}
```

### 步骤 2：更新数据库工厂
在 `server/db/index.ts` 中添加新的 case：

```typescript
switch (DB_TYPE.toLowerCase()) {
  case "mysql":
    db = new MySQLAdapter(mysqlConfig);
    break;
  case "supabase":
    db = new SupabaseAdapter(supabaseUrl, supabaseKey);
    break;
  case "sqlite":
  default:
    db = new SQLiteAdapter();
    break;
}
```

### 步骤 3：TypeScript 类型检查
TypeScript 会确保你的适配器正确实现了所有接口方法。如果有遗漏，编译时会报错。

## 优势

### 1. **解耦**
业务逻辑与数据存储实现完全分离，更改数据库不影响业务代码。

### 2. **可测试**
可以轻松创建 Mock 适配器进行单元测试。

### 3. **类型安全**
TypeScript 接口确保所有适配器都有一致的 API。

### 4. **灵活切换**
通过环境变量即可切换数据库，无需修改代码。

### 5. **易于扩展**
添加新数据库只需实现接口，不影响现有代码。

## 注意事项

### 1. 所有操作都是异步的
数据库方法都返回 Promise，使用时需要 `await`：

```typescript
// ✅ 正确
const todos = await db.getAllTodos();

// ❌ 错误
const todos = db.getAllTodos(); // 得到的是 Promise
```

### 2. ID 类型转换
API 路由中的 ID 参数需要转换为数字：

```typescript
async GET(req) {
  const id = parseInt(req.params.id); // 转换为数字
  const todo = await db.getTodoById(id);
}
```

### 3. 布尔值处理
SQLite 使用 0/1 表示布尔值，Supabase 使用 true/false。适配器内部已做统一处理。

### 4. 错误处理
建议在 API 路由中添加 try-catch：

```typescript
async POST(req) {
  try {
    const body = await req.json();
    const todo = await db.createTodo(body);
    return Response.json(todo);
  } catch (error) {
    console.error("Create todo error:", error);
    return new Response("创建失败", { status: 500 });
  }
}
```

## 数据迁移

### 从 SQLite 迁移到 Supabase
1. 导出 SQLite 数据（可编写迁移脚本）
2. 在 Supabase 运行迁移 SQL
3. 导入数据到 Supabase
4. 修改 `.env` 文件切换数据库

### 从 Supabase 回退到 SQLite
1. 导出 Supabase 数据
2. 修改 `.env` 设置 `DB_TYPE=sqlite`
3. 运行 `bun run db:init`
4. 导入数据

## 常见问题

### Q: 如何查看当前使用的是哪个数据库？
A: 启动应用时，控制台会显示：
```
✅ Using SQLite database (default)
# 或
✅ Using Supabase database
```

### Q: 可以同时使用两个数据库吗？
A: 当前设计每次只能使用一个数据库。如需同时使用，需要修改工厂模式，导出多个实例。

### Q: 性能如何？
A: SQLite 适合本地开发和小规模应用；Supabase 适合生产环境和多用户场景。

### Q: 如何添加新的数据库表？
A: 
1. 在 `types.ts` 中定义类型和接口
2. 在所有适配器中实现新方法
3. TypeScript 会提示哪些方法缺失

## 总结

数据库抽象层让项目具有了极大的灵活性：
- 开发时用 SQLite（轻量、快速、无需配置）
- 生产环境用 Supabase（强大、可扩展、实时同步）
- 未来可扩展到任何数据库（MySQL、PostgreSQL、MongoDB 等）

所有这些切换只需修改配置文件，**业务代码保持不变**！
