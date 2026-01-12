/**
 * 数据库工厂
 * 根据环境变量选择数据库适配器
 */

import type { DatabaseAdapter } from "./types";
import { SQLiteAdapter } from "./adapters/sqlite";
import { SupabaseAdapter } from "./adapters/supabase";

// 从环境变量读取数据库类型，默认为 sqlite
const DB_TYPE = process.env.DB_TYPE || "sqlite";

let db: DatabaseAdapter;

switch (DB_TYPE.toLowerCase()) {
  case "supabase":
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Supabase configuration missing!");
      console.error("Please set SUPABASE_URL and SUPABASE_KEY environment variables.");
      process.exit(1);
    }

    db = new SupabaseAdapter(supabaseUrl, supabaseKey);
    console.log("✅ Using Supabase database");
    break;

  case "sqlite":
  default:
    db = new SQLiteAdapter();
    console.log("✅ Using SQLite database (default)");
    break;
}

export { db };
export default db;
