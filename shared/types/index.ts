// 共享类型定义，供所有客户端使用

export interface Todo {
  id: number;
  title: string;
  description: string;
  category_id: number | null;
  completed: boolean;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface FileInfo {
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
  description: string;
  remind_date: string;
  repeat_type: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
