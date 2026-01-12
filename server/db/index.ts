/**
 * 数据库工厂
 * 根据环境变量选择数据库适配器
 */

import type { DatabaseAdapter } from "./types";
import { SQLiteAdapter } from "./adapters/sqlite";

// 从环境变量读取数据库类型，默认为 sqlite
const DB_TYPE = process.env.DB_TYPE || "sqlite";

function createDatabase(): DatabaseAdapter {
  switch (DB_TYPE.toLowerCase()) {
    case "supabase":
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Supabase configuration missing!");
        console.error("Please set SUPABASE_URL and SUPABASE_KEY environment variables.");
        process.exit(1);
      }

      // 仅在需要时才导入 Supabase
      try {
        const { SupabaseAdapter } = require("./adapters/supabase");
        const adapter = new SupabaseAdapter(supabaseUrl, supabaseKey);
        console.log("✅ Using Supabase database");
        return adapter;
      } catch (error) {
        console.error("❌ Failed to load Supabase adapter. Please install @supabase/supabase-js");
        console.error("Run: bun add @supabase/supabase-js");
        process.exit(1);
      }

    case "sqlite":
    default:
      const adapter = new SQLiteAdapter();
      console.log("✅ Using SQLite database (default)");
      return adapter;
  }
}

const db = createDatabase();

export { db };
export default db;
