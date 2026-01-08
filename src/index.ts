import { serve } from "bun";
import index from "./index.html";
import db from "../server/db";
import { existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";
import { unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// 确保上传目录存在
const UPLOAD_DIR = join(process.cwd(), "uploads");
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

    // Files API
    "/api/files": {
      async GET(req) {
        const files = db.query("SELECT * FROM files ORDER BY upload_date DESC").all();
        return Response.json(files);
      },
    },

    "/api/files/storage": {
      async GET(req) {
        try {
          // 获取磁盘使用情况
          let diskInfo = { total: 0, used: 0, available: 0 };
          
          // 根据操作系统获取磁盘信息
          const isWindows = process.platform === "win32";
          
          if (isWindows) {
            // Windows: 使用 wmic 或 fsutil
            try {
              const drive = process.cwd().substring(0, 2); // 如 "C:"
              const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /format:list`);
              const lines = stdout.split('\n').filter(line => line.trim());
              
              let freeSpace = 0;
              let totalSpace = 0;
              
              for (const line of lines) {
                if (line.startsWith('FreeSpace=')) {
                  freeSpace = parseInt(line.split('=')[1]);
                } else if (line.startsWith('Size=')) {
                  totalSpace = parseInt(line.split('=')[1]);
                }
              }
              
              diskInfo = {
                total: totalSpace,
                used: totalSpace - freeSpace,
                available: freeSpace
              };
            } catch (error) {
              console.error("Failed to get Windows disk info:", error);
            }
          } else {
            // Linux/macOS: 使用 df 命令
            try {
              const { stdout } = await execAsync(`df -k "${process.cwd()}" | tail -1`);
              const parts = stdout.trim().split(/\s+/);
              // df 输出格式: Filesystem 1K-blocks Used Available Use% Mounted
              const total = parseInt(parts[1]) * 1024; // 转换为字节
              const used = parseInt(parts[2]) * 1024;
              const available = parseInt(parts[3]) * 1024;
              
              diskInfo = { total, used, available };
            } catch (error) {
              console.error("Failed to get disk info:", error);
            }
          }

          // 计算 uploads 目录的总大小
          const files = db.query("SELECT SUM(file_size) as total FROM files").get() as { total: number | null };
          const uploadsSize = files.total || 0;

          return Response.json({
            disk: diskInfo,
            uploads: {
              size: uploadsSize,
              count: db.query("SELECT COUNT(*) as count FROM files").get() as { count: number }
            }
          });
        } catch (error) {
          console.error("Storage info error:", error);
          return Response.json({ error: "Failed to get storage info" }, { status: 500 });
        }
      },
    },

    "/api/files/upload": {
      async POST(req) {
        try {
          const formData = await req.formData();
          const file = formData.get("file") as File;

          if (!file) {
            return new Response("No file provided", { status: 400 });
          }

          // 生成唯一文件名
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 15);
          const ext = file.name.split(".").pop() || "";
          const filename = `${timestamp}_${randomStr}.${ext}`;
          const filepath = join(UPLOAD_DIR, filename);

          // 保存文件
          const arrayBuffer = await file.arrayBuffer();
          await Bun.write(filepath, arrayBuffer);

          // 保存到数据库
          const result = db.run(
            "INSERT INTO files (filename, original_name, file_size, mime_type) VALUES (?, ?, ?, ?)",
            [filename, file.name, file.size, file.type]
          );

          return Response.json({
            id: result.lastInsertRowid,
            filename,
            original_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          });
        } catch (error) {
          console.error("Upload error:", error);
          return new Response("Upload failed", { status: 500 });
        }
      },
    },

    "/api/files/:id": {
      async DELETE(req) {
        try {
          const id = req.params.id;
          const file = db.query("SELECT * FROM files WHERE id = ?").get(id) as any;

          if (!file) {
            return new Response("File not found", { status: 404 });
          }

          // 删除物理文件
          const filepath = join(UPLOAD_DIR, file.filename);
          if (existsSync(filepath)) {
            await unlink(filepath);
          }

          // 从数据库删除记录
          db.run("DELETE FROM files WHERE id = ?", [id]);

          return Response.json({ success: true });
        } catch (error) {
          console.error("Delete error:", error);
          return new Response("Delete failed", { status: 500 });
        }
      },
    },

    "/api/files/:id/download": {
      async GET(req) {
        try {
          const id = req.params.id;
          const file = db.query("SELECT * FROM files WHERE id = ?").get(id) as any;

          if (!file) {
            return new Response("File not found", { status: 404 });
          }

          const filepath = join(UPLOAD_DIR, file.filename);
          if (!existsSync(filepath)) {
            return new Response("File not found on disk", { status: 404 });
          }

          // 更新下载次数
          db.run("UPDATE files SET download_count = download_count + 1 WHERE id = ?", [id]);

          // 读取文件并返回
          const fileContent = Bun.file(filepath);

          return new Response(fileContent, {
            headers: {
              "Content-Type": file.mime_type || "application/octet-stream",
              "Content-Disposition": `attachment; filename="${encodeURIComponent(file.original_name)}"`,
              "Content-Length": file.file_size.toString(),
            },
          });
        } catch (error) {
          console.error("Download error:", error);
          return new Response("Download failed", { status: 500 });
        }
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
