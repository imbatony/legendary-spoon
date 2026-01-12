import { serve } from "bun";
import index from "../../clients/web/index.html";
import db from "../db";
import { existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";
import { unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// 确保上传目录存在
const UPLOAD_DIR = join(process.cwd(), "server/uploads");
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
        const todos = await db.getAllTodos();
        return Response.json(todos);
      },
      async POST(req) {
        const body = await req.json();
        const todo = await db.createTodo(body);
        return Response.json(todo);
      },
    },

    "/api/todos/:id": {
      async GET(req) {
        const id = parseInt(req.params.id);
        const todo = await db.getTodoById(id);
        if (!todo) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(todo);
      },
      async PUT(req) {
        const id = parseInt(req.params.id);
        const body = await req.json();
        const updated = await db.updateTodo(id, body);
        return Response.json(updated);
      },
      async DELETE(req) {
        const id = parseInt(req.params.id);
        await db.deleteTodo(id);
        return Response.json({ success: true });
      },
    },

    // Categories API
    "/api/categories": {
      async GET(req) {
        const categories = await db.getAllCategories();
        return Response.json(categories);
      },
      async POST(req) {
        try {
          const body = await req.json();
          if (!body.name || !body.name.trim()) {
            return new Response("分类名称不能为空", { status: 400 });
          }
          
          const category = await db.createCategory({
            name: body.name.trim(),
            color: body.color || '#646cff'
          });
          return Response.json(category);
        } catch (error) {
          console.error("Create category error:", error);
          return new Response("创建分类失败", { status: 500 });
        }
      },
    },

    "/api/categories/:id": {
      async PUT(req) {
        try {
          const id = parseInt(req.params.id);
          const body = await req.json();
          
          const updated = await db.updateCategory(id, body);
          return Response.json(updated);
        } catch (error) {
          console.error("Update category error:", error);
          return new Response("更新分类失败", { status: 500 });
        }
      },
      async DELETE(req) {
        try {
          const id = parseInt(req.params.id);
          
          // 检查是否有待办事项使用此分类
          const count = await db.getCategoryTodoCount(id);
          if (count > 0) {
            return new Response(`无法删除：还有 ${count} 个待办事项使用此分类`, { status: 400 });
          }
          
          await db.deleteCategory(id);
          return Response.json({ success: true });
        } catch (error) {
          console.error("Delete category error:", error);
          return new Response("删除分类失败", { status: 500 });
        }
      },
    },

    // Reminders API
    "/api/reminders": {
      async GET(req) {
        const reminders = await db.getActiveReminders();
        return Response.json(reminders);
      },
      async POST(req) {
        const body = await req.json();
        const reminder = await db.createReminder(body);
        return Response.json(reminder);
      },
    },

    // Files API
    "/api/files": {
      async GET(req) {
        const files = await db.getAllFiles();
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
          const uploadsSize = await db.getTotalFileSize();
          const fileCount = await db.getFileCount();

          return Response.json({
            disk: diskInfo,
            uploads: {
              size: uploadsSize,
              count: fileCount
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
          const fileRecord = await db.createFile({
            filename,
            original_name: file.name,
            file_size: file.size,
            mime_type: file.type,
          });

          return Response.json(fileRecord);
        } catch (error) {
          console.error("Upload error:", error);
          return new Response("Upload failed", { status: 500 });
        }
      },
    },

    "/api/files/:id": {
      async DELETE(req) {
        try {
          const id = parseInt(req.params.id);
          const file = await db.getFileById(id);

          if (!file) {
            return new Response("File not found", { status: 404 });
          }

          // 删除物理文件
          const filepath = join(UPLOAD_DIR, file.filename);
          if (existsSync(filepath)) {
            await unlink(filepath);
          }

          // 从数据库删除记录
          await db.deleteFile(id);

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
          const id = parseInt(req.params.id);
          const file = await db.getFileById(id);

          if (!file) {
            return new Response("File not found", { status: 404 });
          }

          const filepath = join(UPLOAD_DIR, file.filename);
          if (!existsSync(filepath)) {
            return new Response("File not found on disk", { status: 404 });
          }

          // 更新下载次数
          await db.incrementFileDownloadCount(id);

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
