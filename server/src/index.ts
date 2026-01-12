import { serve } from "bun";
import index from "../../clients/web/index.html";
import db from "../db";
import { existsSync, mkdirSync, statSync } from "fs";
import { join } from "path";
import { unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import {
  generateToken,
  requireAuth,
  requireApiKey,
  requireAnyAuth,
  verifyPassword,
  hashPassword,
} from "./auth";

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

    // ==================== 认证 API ====================

    // 检查是否需要初始化
    "/api/auth/init-status": {
      async GET(req) {
        const hasUsers = await db.hasUsers();
        return Response.json({ initialized: hasUsers });
      },
    },

    // 初始化账号（首次使用）
    "/api/auth/init": {
      async POST(req) {
        try {
          const hasUsers = await db.hasUsers();
          if (hasUsers) {
            return new Response("系统已初始化", { status: 400 });
          }

          const body = await req.json();
          const { username, password } = body;

          if (!username || !password) {
            return new Response("用户名和密码不能为空", { status: 400 });
          }

          if (password.length < 6) {
            return new Response("密码长度至少为 6 位", { status: 400 });
          }

          const user = await db.createUser({ username, password });
          const token = generateToken(user.id, user.username);

          return Response.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              created_at: user.created_at,
            },
          });
        } catch (error) {
          console.error("Init error:", error);
          return new Response("初始化失败", { status: 500 });
        }
      },
    },

    // 登录
    "/api/auth/login": {
      async POST(req) {
        try {
          const body = await req.json();
          const { username, password } = body;

          if (!username || !password) {
            return new Response("用户名和密码不能为空", { status: 400 });
          }

          const user = await db.getUserByUsername(username);
          if (!user) {
            return new Response("用户名或密码错误", { status: 401 });
          }

          const valid = await verifyPassword(password, user.password_hash);
          if (!valid) {
            return new Response("用户名或密码错误", { status: 401 });
          }

          const token = generateToken(user.id, user.username);

          return Response.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              created_at: user.created_at,
            },
          });
        } catch (error) {
          console.error("Login error:", error);
          return new Response("登录失败", { status: 500 });
        }
      },
    },

    // 验证 Token
    "/api/auth/verify": {
      async GET(req) {
        const authResult = await requireAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        return Response.json({
          userId: authResult.userId,
          username: authResult.username,
        });
      },
    },

    // 修改密码
    "/api/auth/change-password": {
      async POST(req) {
        const authResult = await requireAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        try {
          const body = await req.json();
          const { oldPassword, newPassword } = body;

          if (!oldPassword || !newPassword) {
            return new Response("旧密码和新密码不能为空", { status: 400 });
          }

          if (newPassword.length < 6) {
            return new Response("新密码长度至少为 6 位", { status: 400 });
          }

          const user = await db.getUserByUsername(authResult.username);
          if (!user) {
            return new Response("用户不存在", { status: 404 });
          }

          const valid = await verifyPassword(oldPassword, user.password_hash);
          if (!valid) {
            return new Response("旧密码错误", { status: 401 });
          }

          const newHash = await hashPassword(newPassword);
          await db.updateUserPassword(user.id, newHash);

          return Response.json({ success: true, message: "密码修改成功" });
        } catch (error) {
          console.error("Change password error:", error);
          return new Response("修改密码失败", { status: 500 });
        }
      },
    },

    // 重置密码（使用服务器密码文件）
    "/api/auth/reset-password": {
      async POST(req) {
        try {
          const body = await req.json();
          const { username, resetCode, newPassword } = body;

          if (!username || !resetCode || !newPassword) {
            return new Response("缺少必要参数", { status: 400 });
          }

          // 读取服务器上的重置码文件
          const resetFilePath = join(process.cwd(), "data", ".reset_code");
          if (!existsSync(resetFilePath)) {
            return new Response("未找到重置码，请联系管理员", { status: 400 });
          }

          const fileContent = await Bun.file(resetFilePath).text();
          const [storedCode, timestamp] = fileContent.trim().split(":");

          // 验证重置码是否过期（24小时有效）
          const codeAge = Date.now() - parseInt(timestamp);
          if (codeAge > 24 * 60 * 60 * 1000) {
            await unlink(resetFilePath);
            return new Response("重置码已过期", { status: 400 });
          }

          if (resetCode !== storedCode) {
            return new Response("重置码错误", { status: 401 });
          }

          const user = await db.getUserByUsername(username);
          if (!user) {
            return new Response("用户不存在", { status: 404 });
          }

          if (newPassword.length < 6) {
            return new Response("新密码长度至少为 6 位", { status: 400 });
          }

          const newHash = await hashPassword(newPassword);
          await db.updateUserPassword(user.id, newHash);

          // 删除重置码文件
          await unlink(resetFilePath);

          return Response.json({ success: true, message: "密码重置成功" });
        } catch (error) {
          console.error("Reset password error:", error);
          return new Response("重置密码失败", { status: 500 });
        }
      },
    },

    // 生成重置码（服务器端脚本调用）
    "/api/auth/generate-reset-code": {
      async POST(req) {
        try {
          const body = await req.json();
          const { serverSecret } = body;

          // 验证服务器密钥
          const expectedSecret = process.env.SERVER_SECRET || "change-this-secret";
          if (serverSecret !== expectedSecret) {
            return new Response("无权限", { status: 403 });
          }

          // 生成 6 位数字重置码
          const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
          const timestamp = Date.now().toString();

          // 保存到文件
          const dataDir = join(process.cwd(), "data");
          if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
          }

          const resetFilePath = join(dataDir, ".reset_code");
          await Bun.write(resetFilePath, `${resetCode}:${timestamp}`);

          return Response.json({
            resetCode,
            expiresIn: "24 小时",
            message: "重置码已生成，请在 24 小时内使用",
          });
        } catch (error) {
          console.error("Generate reset code error:", error);
          return new Response("生成重置码失败", { status: 500 });
        }
      },
    },

    // ==================== API Key 管理 ====================

    // 获取当前用户的所有 API Key
    "/api/api-keys": {
      async GET(req) {
        const authResult = await requireAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const apiKeys = await db.getUserApiKeys(authResult.userId);
        return Response.json(apiKeys);
      },
      async POST(req) {
        const authResult = await requireAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        try {
          const body = await req.json();
          const { name } = body;

          if (!name || !name.trim()) {
            return new Response("API Key 名称不能为空", { status: 400 });
          }

          const apiKey = await db.createApiKey({
            user_id: authResult.userId,
            name: name.trim(),
          });

          return Response.json(apiKey);
        } catch (error) {
          console.error("Create API key error:", error);
          return new Response("创建 API Key 失败", { status: 500 });
        }
      },
    },

    // 更新和删除 API Key
    "/api/api-keys/:id": {
      async PUT(req) {
        const authResult = await requireAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        try {
          const id = parseInt(req.params.id);
          const body = await req.json();

          const updated = await db.updateApiKey(id, body);
          return Response.json(updated);
        } catch (error) {
          console.error("Update API key error:", error);
          return new Response("更新 API Key 失败", { status: 500 });
        }
      },
      async DELETE(req) {
        const authResult = await requireAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        try {
          const id = parseInt(req.params.id);
          await db.deleteApiKey(id);
          return Response.json({ success: true });
        } catch (error) {
          console.error("Delete API key error:", error);
          return new Response("删除 API Key 失败", { status: 500 });
        }
      },
    },

    // ==================== TODO API ====================
    "/api/todos": {
      async GET(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const todos = await db.getAllTodos();
        return Response.json(todos);
      },
      async POST(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const body = await req.json();
        const todo = await db.createTodo(body);
        return Response.json(todo);
      },
    },

    "/api/todos/:id": {
      async GET(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const id = parseInt(req.params.id);
        const todo = await db.getTodoById(id);
        if (!todo) {
          return new Response("Not found", { status: 404 });
        }
        return Response.json(todo);
      },
      async PUT(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const id = parseInt(req.params.id);
        const body = await req.json();
        const updated = await db.updateTodo(id, body);
        return Response.json(updated);
      },
      async DELETE(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const id = parseInt(req.params.id);
        await db.deleteTodo(id);
        return Response.json({ success: true });
      },
    },

    // Categories API
    "/api/categories": {
      async GET(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const categories = await db.getAllCategories();
        return Response.json(categories);
      },
      async POST(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

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
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

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
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

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
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const reminders = await db.getActiveReminders();
        return Response.json(reminders);
      },
      async POST(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const body = await req.json();
        const reminder = await db.createReminder(body);
        return Response.json(reminder);
      },
    },

    // Files API
    "/api/files": {
      async GET(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

        const files = await db.getAllFiles();
        return Response.json(files);
      },
    },

    "/api/files/storage": {
      async GET(req) {
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

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
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

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
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

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
        const authResult = await requireAnyAuth(req);
        if (authResult instanceof Response) {
          return authResult;
        }

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
