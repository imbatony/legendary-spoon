#!/usr/bin/env bun

/**
 * 生成密码重置码
 * 使用方法：bun run server/scripts/generate-reset-code.ts
 */

const SERVER_SECRET = process.env.SERVER_SECRET || "change-this-secret";

async function generateResetCode() {
  try {
    console.log("正在生成密码重置码...\n");

    const response = await fetch("http://localhost:3000/api/auth/generate-reset-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serverSecret: SERVER_SECRET,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("生成失败:", error);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log("✅ 重置码生成成功！\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`重置码: ${data.resetCode}`);
    console.log(`有效期: ${data.expiresIn}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("使用说明：");
    console.log("1. 在登录页面选择「忘记密码」");
    console.log("2. 输入用户名和上述重置码");
    console.log("3. 设置新密码");
    console.log("\n⚠️  注意：重置码仅在 24 小时内有效");
  } catch (error) {
    console.error("生成失败:", error);
    process.exit(1);
  }
}

generateResetCode();
