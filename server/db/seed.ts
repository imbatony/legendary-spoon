import db from "./index";

// 添加测试待办事项
db.run(
  "INSERT INTO todos (title, description, category_id, priority, due_date) VALUES (?, ?, ?, ?, ?)",
  ["完成项目文档", "编写 README 和使用说明", 1, 2, "2026-01-15"]
);

db.run(
  "INSERT INTO todos (title, description, category_id, priority) VALUES (?, ?, ?, ?)",
  ["购买生活用品", "去超市买菜和日用品", 2, 0]
);

db.run(
  "INSERT INTO todos (title, description, category_id, priority, due_date) VALUES (?, ?, ?, ?, ?)",
  ["学习 Bun 框架", "深入学习 Bun 的 API 和最佳实践", 3, 1, "2026-01-20"]
);

console.log("✅ 测试数据已添加成功！");
db.close();
