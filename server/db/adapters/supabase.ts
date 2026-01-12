/**
 * Supabase 数据库适配器
 * 使用 Supabase PostgreSQL 数据库
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  DatabaseAdapter,
  Category,
  Todo,
  FileRecord,
  Reminder,
  User,
  ApiKey,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateTodoInput,
  UpdateTodoInput,
  CreateFileInput,
  CreateReminderInput,
  UpdateReminderInput,
  CreateUserInput,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from "../types";

export class SupabaseAdapter implements DatabaseAdapter {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`📦 Supabase Database connected: ${supabaseUrl}`);
  }

  // ==================== 分类操作 ====================

  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw new Error(`Failed to get categories: ${error.message}`);
    return data || [];
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const { data, error } = await this.supabase
      .from("categories")
      .insert({
        name: input.name,
        color: input.color || "#646cff",
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create category: ${error.message}`);
    return data;
  }

  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category | null> {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.color !== undefined) updateData.color = input.color;

    if (Object.keys(updateData).length === 0) {
      const { data } = await this.supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();
      return data || null;
    }

    const { data, error } = await this.supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update category: ${error.message}`);
    return data;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete category: ${error.message}`);
    return true;
  }

  async getCategoryTodoCount(id: number): Promise<number> {
    const { count, error } = await this.supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id);

    if (error) throw new Error(`Failed to get category todo count: ${error.message}`);
    return count || 0;
  }

  // ==================== 待办事项操作 ====================

  async getAllTodos(): Promise<Todo[]> {
    const { data, error } = await this.supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get todos: ${error.message}`);
    return data || [];
  }

  async getTodoById(id: number): Promise<Todo | null> {
    const { data, error } = await this.supabase
      .from("todos")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get todo: ${error.message}`);
    }
    return data || null;
  }

  async createTodo(input: CreateTodoInput): Promise<Todo> {
    const { data, error } = await this.supabase
      .from("todos")
      .insert({
        title: input.title,
        description: input.description || null,
        category_id: input.category_id || null,
        priority: input.priority || 0,
        due_date: input.due_date || null,
        completed: false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create todo: ${error.message}`);
    return data;
  }

  async updateTodo(id: number, input: UpdateTodoInput): Promise<Todo | null> {
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category_id !== undefined) updateData.category_id = input.category_id;
    if (input.completed !== undefined) updateData.completed = input.completed;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;

    if (Object.keys(updateData).length === 0) {
      return this.getTodoById(id);
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("todos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update todo: ${error.message}`);
    return data;
  }

  async deleteTodo(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from("todos")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete todo: ${error.message}`);
    return true;
  }

  // ==================== 文件操作 ====================

  async getAllFiles(): Promise<FileRecord[]> {
    const { data, error } = await this.supabase
      .from("files")
      .select("*")
      .order("upload_date", { ascending: false });

    if (error) throw new Error(`Failed to get files: ${error.message}`);
    return data || [];
  }

  async getFileById(id: number): Promise<FileRecord | null> {
    const { data, error } = await this.supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get file: ${error.message}`);
    }
    return data || null;
  }

  async createFile(input: CreateFileInput): Promise<FileRecord> {
    const { data, error } = await this.supabase
      .from("files")
      .insert({
        filename: input.filename,
        original_name: input.original_name,
        file_size: input.file_size,
        mime_type: input.mime_type,
        download_count: 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create file record: ${error.message}`);
    return data;
  }

  async deleteFile(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from("files")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete file: ${error.message}`);
    return true;
  }

  async incrementFileDownloadCount(id: number): Promise<void> {
    // Supabase 使用 RPC 调用或者先获取再更新
    const file = await this.getFileById(id);
    if (file) {
      const { error } = await this.supabase
        .from("files")
        .update({ download_count: file.download_count + 1 })
        .eq("id", id);

      if (error) throw new Error(`Failed to increment download count: ${error.message}`);
    }
  }

  async getTotalFileSize(): Promise<number> {
    // Supabase 需要使用 RPC 函数来计算总和
    // 或者获取所有记录然后计算
    const files = await this.getAllFiles();
    return files.reduce((sum, file) => sum + file.file_size, 0);
  }

  async getFileCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from("files")
      .select("*", { count: "exact", head: true });

    if (error) throw new Error(`Failed to get file count: ${error.message}`);
    return count || 0;
  }

  // ==================== 提醒操作 ====================

  async getActiveReminders(): Promise<Reminder[]> {
    const { data, error } = await this.supabase
      .from("reminders")
      .select("*")
      .eq("is_active", true)
      .order("remind_date", { ascending: true });

    if (error) throw new Error(`Failed to get reminders: ${error.message}`);
    return data || [];
  }

  async createReminder(input: CreateReminderInput): Promise<Reminder> {
    const { data, error } = await this.supabase
      .from("reminders")
      .insert({
        title: input.title,
        description: input.description || null,
        remind_date: input.remind_date,
        repeat_type: input.repeat_type || "once",
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create reminder: ${error.message}`);
    return data;
  }

  async updateReminder(id: number, input: UpdateReminderInput): Promise<Reminder | null> {
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.remind_date !== undefined) updateData.remind_date = input.remind_date;
    if (input.repeat_type !== undefined) updateData.repeat_type = input.repeat_type;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    if (Object.keys(updateData).length === 0) {
      const { data } = await this.supabase
        .from("reminders")
        .select("*")
        .eq("id", id)
        .single();
      return data || null;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("reminders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update reminder: ${error.message}`);
    return data;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete reminder: ${error.message}`);
    return true;
  }

  // ==================== 用户操作 ====================

  async createUser(input: CreateUserInput): Promise<User> {
    const passwordHash = await Bun.password.hash(input.password);
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        username: input.username,
        password_hash: passwordHash,
      })
      .select("id, username, created_at, updated_at")
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get user: ${error.message}`);
    }
    return data || null;
  }

  async updateUserPassword(id: number, passwordHash: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(`Failed to update password: ${error.message}`);
    return true;
  }

  async hasUsers(): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) throw new Error(`Failed to check users: ${error.message}`);
    return (count || 0) > 0;
  }

  // ==================== API Key 操作 ====================

  async createApiKey(input: CreateApiKeyInput): Promise<ApiKey> {
    // 生成随机 API Key
    const key = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
    
    const { data, error } = await this.supabase
      .from("api_keys")
      .insert({
        user_id: input.user_id,
        key: key,
        name: input.name,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create API key: ${error.message}`);
    return data;
  }

  async getUserApiKeys(userId: number): Promise<ApiKey[]> {
    const { data, error } = await this.supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get API keys: ${error.message}`);
    return data || [];
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | null> {
    const { data, error } = await this.supabase
      .from("api_keys")
      .select("*")
      .eq("key", key)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to get API key: ${error.message}`);
    }
    return data || null;
  }

  async updateApiKey(id: number, input: UpdateApiKeyInput): Promise<ApiKey | null> {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    if (Object.keys(updateData).length === 0) {
      const { data } = await this.supabase
        .from("api_keys")
        .select("*")
        .eq("id", id)
        .single();
      return data || null;
    }

    const { data, error } = await this.supabase
      .from("api_keys")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update API key: ${error.message}`);
    return data;
  }

  async deleteApiKey(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from("api_keys")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete API key: ${error.message}`);
    return true;
  }

  async updateApiKeyLastUsed(id: number): Promise<void> {
    const { error } = await this.supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(`Failed to update API key last used: ${error.message}`);
  }
}
