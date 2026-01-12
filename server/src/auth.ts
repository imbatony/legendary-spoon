/**
 * 认证中间件和工具函数
 */

import db from "../db";

/**
 * JWT Token 生成和验证
 * 使用简单的签名机制（生产环境建议使用 jsonwebtoken 库）
 */

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-production";

interface JWTPayload {
  userId: number;
  username: string;
  exp: number;
}

/**
 * 生成 JWT Token
 */
export function generateToken(userId: number, username: string): string {
  const payload: JWTPayload = {
    userId,
    username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
  };

  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(
    Bun.hash(encodedPayload + SECRET_KEY).toString()
  );

  return `${encodedPayload}.${signature}`;
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    // 验证签名
    const expectedSignature = btoa(
      Bun.hash(encodedPayload + SECRET_KEY).toString()
    );
    if (signature !== expectedSignature) return null;

    // 解码并验证过期时间
    const payload: JWTPayload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * 从请求中提取 Token
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * 从请求中提取 API Key
 */
function extractApiKey(req: Request): string | null {
  const apiKey = req.headers.get("X-API-Key");
  if (apiKey) return apiKey;

  // 也支持从查询参数获取
  const url = new URL(req.url);
  return url.searchParams.get("api_key");
}

/**
 * 认证中间件 - JWT
 */
export async function requireAuth(req: Request): Promise<JWTPayload | Response> {
  const token = extractToken(req);
  if (!token) {
    return new Response(JSON.stringify({ error: "未提供认证 Token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Token 无效或已过期" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return payload;
}

/**
 * 认证中间件 - API Key
 */
export async function requireApiKey(req: Request): Promise<{ userId: number } | Response> {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "未提供 API Key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const keyRecord = await db.getApiKeyByKey(apiKey);
  if (!keyRecord) {
    return new Response(JSON.stringify({ error: "API Key 无效或已禁用" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 更新最后使用时间
  await db.updateApiKeyLastUsed(keyRecord.id);

  return { userId: keyRecord.user_id };
}

/**
 * 认证中间件 - JWT 或 API Key（任一即可）
 */
export async function requireAnyAuth(req: Request): Promise<{ userId: number } | Response> {
  // 优先检查 JWT
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      return { userId: payload.userId };
    }
  }

  // 其次检查 API Key
  const apiKey = extractApiKey(req);
  if (apiKey) {
    const keyRecord = await db.getApiKeyByKey(apiKey);
    if (keyRecord) {
      await db.updateApiKeyLastUsed(keyRecord.id);
      return { userId: keyRecord.user_id };
    }
  }

  return new Response(JSON.stringify({ error: "未提供有效的认证凭据" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}
