import { serve } from "bun";
import index from "./index.html";
import db from "../server/db";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // TODO API
    "/api/todos": {
      async GET(req) {
        const todos = db.query("SELECT * FROM todos ORDER BY created_at DESC").all();
        return Response.json(todos);
      },
      async POST(req) {
        const body = await req.json();
        const result = db.run(
          "INSERT INTO todos (title, description, category_id, priority, due_date) VALUES (?, ?, ?, ?, ?)",
          [body.title, body.description, body.category_id, body.priority || 0, body.due_date]
        );
        return Response.json({ id: result.lastInsertRowid, ...body });
      },
    },

    "/api/todos/:id": {
      async GET(req) {
        const id = req.params.id;
        const todo = db.query("SELECT * FROM todos WHERE id = ?").get(id);
        if (!todo) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(todo);
      },
      async PUT(req) {
        const id = req.params.id;
        const body = await req.json();
        
        // 构建更新字段
        const updates: string[] = [];
        const values: any[] = [];
        
        if (body.title !== undefined) {
          updates.push("title = ?");
          values.push(body.title);
        }
        if (body.description !== undefined) {
          updates.push("description = ?");
          values.push(body.description);
        }
        if (body.category_id !== undefined) {
          updates.push("category_id = ?");
          values.push(body.category_id);
        }
        if (body.completed !== undefined) {
          updates.push("completed = ?");
          values.push(body.completed ? 1 : 0);
        }
        if (body.priority !== undefined) {
          updates.push("priority = ?");
          values.push(body.priority);
        }
        if (body.due_date !== undefined) {
          updates.push("due_date = ?");
          values.push(body.due_date);
        }
        
        updates.push("updated_at = CURRENT_TIMESTAMP");
        values.push(id);
        
        db.run(
          `UPDATE todos SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
        
        const updated = db.query("SELECT * FROM todos WHERE id = ?").get(id);
        return Response.json(updated);
      },
      async DELETE(req) {
        const id = req.params.id;
        db.run("DELETE FROM todos WHERE id = ?", [id]);
        return Response.json({ success: true });
      },
    },

    // Categories API
    "/api/categories": {
      async GET(req) {
        const categories = db.query("SELECT * FROM categories").all();
        return Response.json(categories);
      },
    },

    // Reminders API
    "/api/reminders": {
      async GET(req) {
        const reminders = db.query("SELECT * FROM reminders WHERE is_active = 1 ORDER BY remind_date").all();
        return Response.json(reminders);
      },
      async POST(req) {
        const body = await req.json();
        const result = db.run(
          "INSERT INTO reminders (title, description, remind_date, repeat_type) VALUES (?, ?, ?, ?)",
          [body.title, body.description, body.remind_date, body.repeat_type || 'once']
        );
        return Response.json({ id: result.lastInsertRowid, ...body });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
