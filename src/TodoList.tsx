import { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Todo {
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

interface TodoListProps {
  // 可以在这里添加 props
}

export function TodoList({}: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'active' | 'completed'>('all');

  // 新待办事项表单状态
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    category_id: null as number | null,
    priority: 0,
    due_date: "",
  });

  // 加载分类
  useEffect(() => {
    fetchCategories();
  }, []);

  // 加载待办事项
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/todos");
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTodo,
          due_date: newTodo.due_date || null,
        }),
      });

      if (response.ok) {
        await fetchTodos();
        setNewTodo({
          title: "",
          description: "",
          category_id: null,
          priority: 0,
          due_date: "",
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (response.ok) {
        await fetchTodos();
      }
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!confirm("确定要删除这个待办事项吗？")) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTodos();
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  // 筛选待办事项
  const filteredTodos = todos.filter((todo) => {
    if (filterCategory !== null && todo.category_id !== filterCategory) {
      return false;
    }
    if (filterCompleted === 'active' && todo.completed) {
      return false;
    }
    if (filterCompleted === 'completed' && !todo.completed) {
      return false;
    }
    return true;
  });

  // 获取分类名称和颜色
  const getCategoryInfo = (categoryId: number | null) => {
    const category = categories.find((c) => c.id === categoryId);
    return category || { name: "无分类", color: "#gray" };
  };

  const priorityLabels = ["低", "中", "高", "紧急"];
  const priorityColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <div className="todo-list">
      <div className="todo-header">
        <h2>📝 待办事项</h2>
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "取消" : "+ 新建待办"}
        </button>
      </div>

      {/* 添加待办事项表单 */}
      {showAddForm && (
        <form className="todo-form" onSubmit={handleAddTodo}>
          <div className="form-group">
            <input
              type="text"
              placeholder="待办事项标题..."
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="input-text"
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="描述（可选）"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="input-textarea"
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>分类</label>
              <select
                value={newTodo.category_id || ""}
                onChange={(e) => setNewTodo({ ...newTodo, category_id: e.target.value ? Number(e.target.value) : null })}
                className="input-select"
              >
                <option value="">无分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>优先级</label>
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: Number(e.target.value) })}
                className="input-select"
              >
                <option value={0}>低</option>
                <option value={1}>中</option>
                <option value={2}>高</option>
                <option value={3}>紧急</option>
              </select>
            </div>
            <div className="form-group">
              <label>截止日期</label>
              <input
                type="date"
                value={newTodo.due_date}
                onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                className="input-date"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              添加
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
              取消
            </button>
          </div>
        </form>
      )}

      {/* 筛选器 */}
      <div className="todo-filters">
        <div className="filter-group">
          <label>分类：</label>
          <button
            className={filterCategory === null ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterCategory(null)}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={filterCategory === cat.id ? "filter-btn active" : "filter-btn"}
              onClick={() => setFilterCategory(cat.id)}
              style={{ borderColor: cat.color }}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="filter-group">
          <label>状态：</label>
          <button
            className={filterCompleted === 'all' ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterCompleted('all')}
          >
            全部
          </button>
          <button
            className={filterCompleted === 'active' ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterCompleted('active')}
          >
            未完成
          </button>
          <button
            className={filterCompleted === 'completed' ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterCompleted('completed')}
          >
            已完成
          </button>
        </div>
      </div>

      {/* 待办事项列表 */}
      <div className="todo-items">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : filteredTodos.length === 0 ? (
          <div className="empty-state">
            <p>暂无待办事项</p>
            <p className="empty-hint">点击「新建待办」按钮添加第一个任务</p>
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const categoryInfo = getCategoryInfo(todo.category_id);
            return (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <div className="todo-checkbox">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo)}
                  />
                </div>
                <div className="todo-content">
                  <div className="todo-title">{todo.title}</div>
                  {todo.description && (
                    <div className="todo-description">{todo.description}</div>
                  )}
                  <div className="todo-meta">
                    <span
                      className="todo-category"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.name}
                    </span>
                    <span
                      className="todo-priority"
                      style={{ color: priorityColors[todo.priority] }}
                    >
                      {priorityLabels[todo.priority]}
                    </span>
                    {todo.due_date && (
                      <span className="todo-due-date">
                        📅 {new Date(todo.due_date).toLocaleDateString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="todo-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleDeleteTodo(todo.id)}
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 统计信息 */}
      <div className="todo-stats">
        <span>总计: {todos.length}</span>
        <span>未完成: {todos.filter(t => !t.completed).length}</span>
        <span>已完成: {todos.filter(t => t.completed).length}</span>
      </div>
    </div>
  );
}
