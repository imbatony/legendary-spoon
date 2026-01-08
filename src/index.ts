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
