import { Database } from "bun:sqlite";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

// 确保 data 目录存在
const dataDir = join(process.cwd(), "data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = join(dataDir, "mytools.db");
const db = new Database(DB_PATH, { create: true });

console.log("🚀 Initializing database...");

// 启用外键约束
db.run("PRAGMA foreign_keys = ON");

// 创建分类表
db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建 TODO 表
db.run(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    completed BOOLEAN DEFAULT 0,
    priority INTEGER DEFAULT 0,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  )
`);

// 创建文件传输表
db.run(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0
  )
`);

// 创建提醒表
db.run(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    remind_date DATETIME NOT NULL,
    repeat_type TEXT, -- 'once', 'daily', 'weekly', 'monthly', 'yearly'
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 插入默认分类
const defaultCategories = [
  { name: "工作", color: "#3b82f6" },
  { name: "生活", color: "#10b981" },
  { name: "学习", color: "#f59e0b" },
];

const insertCategory = db.prepare(
  "INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)"
);

for (const category of defaultCategories) {
  insertCategory.run(category.name, category.color);
}

console.log("✅ Database initialized successfully!");
console.log(`📍 Database location: ${DB_PATH}`);
console.log("\nTables created:");
console.log("  - categories (分类)");
console.log("  - todos (待办事项)");
console.log("  - files (文件传输)");
console.log("  - reminders (提醒)");

db.close();
