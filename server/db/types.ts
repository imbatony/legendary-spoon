/**
 * 数据库抽象层 - 类型定义
 * 定义所有数据实体和数据库操作接口
 */

// ==================== 数据实体类型 ====================

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  completed: boolean | number;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: number;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  download_count: number;
}

export interface Reminder {
  id: number;
  title: string;
  description: string | null;
  remind_date: string;
  repeat_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

// ==================== 输入类型 ====================

export interface CreateCategoryInput {
  name: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  category_id?: number;
  priority?: number;
  due_date?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  category_id?: number;
  completed?: boolean;
  priority?: number;
  due_date?: string;
}

export interface CreateFileInput {
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  remind_date: string;
  repeat_type?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface UpdateReminderInput {
  title?: string;
  description?: string;
  remind_date?: string;
  repeat_type?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  is_active?: boolean;
}

// ==================== 数据库适配器接口 ====================

/**
 * 数据库适配器接口
 * 所有数据库实现都必须遵循此接口
 */
export interface DatabaseAdapter {
  // ==================== 分类操作 ====================
  
  /**
   * 获取所有分类
   */
  getAllCategories(): Promise<Category[]>;
  
  /**
   * 创建分类
   */
  createCategory(data: CreateCategoryInput): Promise<Category>;
  
  /**
   * 更新分类
   */
  updateCategory(id: number, data: UpdateCategoryInput): Promise<Category | null>;
  
  /**
   * 删除分类
   */
  deleteCategory(id: number): Promise<boolean>;
  
  /**
   * 检查分类是否被使用
   */
  getCategoryTodoCount(id: number): Promise<number>;

  // ==================== 待办事项操作 ====================
  
  /**
   * 获取所有待办事项
   */
  getAllTodos(): Promise<Todo[]>;
  
  /**
   * 根据 ID 获取待办事项
   */
  getTodoById(id: number): Promise<Todo | null>;
  
  /**
   * 创建待办事项
   */
  createTodo(data: CreateTodoInput): Promise<Todo>;
  
  /**
   * 更新待办事项
   */
  updateTodo(id: number, data: UpdateTodoInput): Promise<Todo | null>;
  
  /**
   * 删除待办事项
   */
  deleteTodo(id: number): Promise<boolean>;

  // ==================== 文件操作 ====================
  
  /**
   * 获取所有文件记录
   */
  getAllFiles(): Promise<FileRecord[]>;
  
  /**
   * 根据 ID 获取文件记录
   */
  getFileById(id: number): Promise<FileRecord | null>;
  
  /**
   * 创建文件记录
   */
  createFile(data: CreateFileInput): Promise<FileRecord>;
  
  /**
   * 删除文件记录
   */
  deleteFile(id: number): Promise<boolean>;
  
  /**
   * 增加文件下载次数
   */
  incrementFileDownloadCount(id: number): Promise<void>;
  
  /**
   * 获取所有文件总大小
   */
  getTotalFileSize(): Promise<number>;
  
  /**
   * 获取文件总数
   */
  getFileCount(): Promise<number>;

  // ==================== 提醒操作 ====================
  
  /**
   * 获取所有活跃的提醒
   */
  getActiveReminders(): Promise<Reminder[]>;
  
  /**
   * 创建提醒
   */
  createReminder(data: CreateReminderInput): Promise<Reminder>;
  
  /**
   * 更新提醒
   */
  updateReminder(id: number, data: UpdateReminderInput): Promise<Reminder | null>;
  
  /**
   * 删除提醒
   */
  deleteReminder(id: number): Promise<boolean>;
}
