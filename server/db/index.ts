import { Database } from "bun:sqlite";
import { join } from "path";

// 数据库文件路径
const DB_PATH = join(process.cwd(), "data", "mytools.db");

// 创建或打开数据库连接
export const db = new Database(DB_PATH, { create: true });

// 启用外键约束
db.run("PRAGMA foreign_keys = ON");

console.log(`📦 Database connected: ${DB_PATH}`);

export default db;
