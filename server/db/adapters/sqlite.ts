/**
 * SQLite 数据库适配器
 * 封装现有的 SQLite 数据库操作
 */

import { Database } from "bun:sqlite";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import type {
  DatabaseAdapter,
  Category,
  Todo,
  FileRecord,
  Reminder,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTodoInput,
  UpdateTodoInput,
  CreateFileInput,
  CreateReminderInput,
  UpdateReminderInput,
} from "../types";

export class SQLiteAdapter implements DatabaseAdapter {
  private db: Database;

  constructor(dbPath?: string) {
    // 确保 data 目录存在
    const dataDir = join(process.cwd(), "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    const DB_PATH = dbPath || join(dataDir, "mytools.db");
    this.db = new Database(DB_PATH, { create: true });

    // 启用外键约束
    this.db.run("PRAGMA foreign_keys = ON");

    // 初始化数据库表
    this.initTables();

    console.log(`📦 SQLite Database connected: ${DB_PATH}`);
  }

  private initTables() {
    // 创建分类表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建 TODO 表
    this.db.run(`
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
    this.db.run(`
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
    this.db.run(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        remind_date DATETIME NOT NULL,
        repeat_type TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插入默认分类（如果不存在）
    const defaultCategories = [
      { name: "工作", color: "#3b82f6" },
      { name: "生活", color: "#10b981" },
      { name: "学习", color: "#f59e0b" },
    ];

    const insertCategory = this.db.prepare(
      "INSERT OR IGNORE INTO categories (name, color) VALUES (?, ?)"
    );

    for (const category of defaultCategories) {
      insertCategory.run(category.name, category.color);
    }
  }

  // ==================== 分类操作 ====================

  async getAllCategories(): Promise<Category[]> {
    return this.db.query("SELECT * FROM categories").all() as Category[];
  }

  async createCategory(data: CreateCategoryInput): Promise<Category> {
    const result = this.db.run(
      "INSERT INTO categories (name, color) VALUES (?, ?)",
      [data.name, data.color || "#646cff"]
    );
    const category = this.db.query("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid) as Category;
    return category;
  }

  async updateCategory(id: number, data: UpdateCategoryInput): Promise<Category | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push("color = ?");
      values.push(data.color);
    }

    if (updates.length === 0) {
      return this.db.query("SELECT * FROM categories WHERE id = ?").get(id) as Category | null;
    }

    values.push(id);
    this.db.run(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, values);
    return this.db.query("SELECT * FROM categories WHERE id = ?").get(id) as Category | null;
  }

  async deleteCategory(id: number): Promise<boolean> {
    this.db.run("DELETE FROM categories WHERE id = ?", [id]);
    return true;
  }

  async getCategoryTodoCount(id: number): Promise<number> {
    const result = this.db.query("SELECT COUNT(*) as count FROM todos WHERE category_id = ?").get(id) as { count: number };
    return result.count;
  }

  // ==================== 待办事项操作 ====================

  async getAllTodos(): Promise<Todo[]> {
    return this.db.query("SELECT * FROM todos ORDER BY created_at DESC").all() as Todo[];
  }

  async getTodoById(id: number): Promise<Todo | null> {
    return this.db.query("SELECT * FROM todos WHERE id = ?").get(id) as Todo | null;
  }

  async createTodo(data: CreateTodoInput): Promise<Todo> {
    const result = this.db.run(
      "INSERT INTO todos (title, description, category_id, priority, due_date) VALUES (?, ?, ?, ?, ?)",
      [data.title, data.description || null, data.category_id || null, data.priority || 0, data.due_date || null]
    );
    const todo = this.db.query("SELECT * FROM todos WHERE id = ?").get(result.lastInsertRowid) as Todo;
    return todo;
  }

  async updateTodo(id: number, data: UpdateTodoInput): Promise<Todo | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.category_id !== undefined) {
      updates.push("category_id = ?");
      values.push(data.category_id);
    }
    if (data.completed !== undefined) {
      updates.push("completed = ?");
      values.push(data.completed ? 1 : 0);
    }
    if (data.priority !== undefined) {
      updates.push("priority = ?");
      values.push(data.priority);
    }
    if (data.due_date !== undefined) {
      updates.push("due_date = ?");
      values.push(data.due_date);
    }

    if (updates.length === 0) {
      return this.getTodoById(id);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    this.db.run(`UPDATE todos SET ${updates.join(", ")} WHERE id = ?`, values);
    return this.getTodoById(id);
  }

  async deleteTodo(id: number): Promise<boolean> {
    this.db.run("DELETE FROM todos WHERE id = ?", [id]);
    return true;
  }

  // ==================== 文件操作 ====================

  async getAllFiles(): Promise<FileRecord[]> {
    return this.db.query("SELECT * FROM files ORDER BY upload_date DESC").all() as FileRecord[];
  }

  async getFileById(id: number): Promise<FileRecord | null> {
    return this.db.query("SELECT * FROM files WHERE id = ?").get(id) as FileRecord | null;
  }

  async createFile(data: CreateFileInput): Promise<FileRecord> {
    const result = this.db.run(
      "INSERT INTO files (filename, original_name, file_size, mime_type) VALUES (?, ?, ?, ?)",
      [data.filename, data.original_name, data.file_size, data.mime_type]
    );
    const file = this.db.query("SELECT * FROM files WHERE id = ?").get(result.lastInsertRowid) as FileRecord;
    return file;
  }

  async deleteFile(id: number): Promise<boolean> {
    this.db.run("DELETE FROM files WHERE id = ?", [id]);
    return true;
  }

  async incrementFileDownloadCount(id: number): Promise<void> {
    this.db.run("UPDATE files SET download_count = download_count + 1 WHERE id = ?", [id]);
  }

  async getTotalFileSize(): Promise<number> {
    const result = this.db.query("SELECT SUM(file_size) as total FROM files").get() as { total: number | null };
    return result.total || 0;
  }

  async getFileCount(): Promise<number> {
    const result = this.db.query("SELECT COUNT(*) as count FROM files").get() as { count: number };
    return result.count;
  }

  // ==================== 提醒操作 ====================

  async getActiveReminders(): Promise<Reminder[]> {
    return this.db.query("SELECT * FROM reminders WHERE is_active = 1 ORDER BY remind_date").all() as Reminder[];
  }

  async createReminder(data: CreateReminderInput): Promise<Reminder> {
    const result = this.db.run(
      "INSERT INTO reminders (title, description, remind_date, repeat_type) VALUES (?, ?, ?, ?)",
      [data.title, data.description || null, data.remind_date, data.repeat_type || "once"]
    );
    const reminder = this.db.query("SELECT * FROM reminders WHERE id = ?").get(result.lastInsertRowid) as Reminder;
    return reminder;
  }

  async updateReminder(id: number, data: UpdateReminderInput): Promise<Reminder | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.remind_date !== undefined) {
      updates.push("remind_date = ?");
      values.push(data.remind_date);
    }
    if (data.repeat_type !== undefined) {
      updates.push("repeat_type = ?");
      values.push(data.repeat_type);
    }
    if (data.is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return this.db.query("SELECT * FROM reminders WHERE id = ?").get(id) as Reminder | null;
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    this.db.run(`UPDATE reminders SET ${updates.join(", ")} WHERE id = ?`, values);
    return this.db.query("SELECT * FROM reminders WHERE id = ?").get(id) as Reminder | null;
  }

  async deleteReminder(id: number): Promise<boolean> {
    this.db.run("DELETE FROM reminders WHERE id = ?", [id]);
    return true;
  }
}
