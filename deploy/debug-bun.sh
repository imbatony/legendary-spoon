#!/bin/bash

# 详细诊断 Bun 可执行文件问题

echo "================================"
echo "Bun 可执行文件详细诊断"
echo "================================"
echo ""

BUN_PATH="/home/azureuser/.bun/bin/bun"

echo "1. 文件存在性检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$BUN_PATH" ]; then
    echo "✓ 文件存在"
else
    echo "❌ 文件不存在"
fi

echo ""
echo "2. 文件详细信息"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -la "$BUN_PATH"

echo ""
echo "3. 文件权限（八进制）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
stat -c "%a %U:%G %n" "$BUN_PATH"

echo ""
echo "4. 可执行性测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -x "$BUN_PATH" ]; then
    echo "✓ 文件可执行"
else
    echo "❌ 文件不可执行"
fi

echo ""
echo "5. 文件类型"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
file "$BUN_PATH"

echo ""
echo "6. 直接执行测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
"$BUN_PATH" --version || echo "❌ 直接执行失败"

echo ""
echo "7. 符号链接检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -L "$BUN_PATH" ]; then
    echo "这是一个符号链接，指向:"
    readlink -f "$BUN_PATH"
    echo ""
    echo "目标文件信息:"
    ls -la "$(readlink -f "$BUN_PATH")"
else
    echo "这是一个普通文件（非符号链接）"
fi

echo ""
echo "8. SELinux 状态"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v getenforce &> /dev/null; then
    echo "SELinux 状态: $(getenforce)"
    ls -Z "$BUN_PATH" 2>/dev/null || echo "无 SELinux 上下文"
else
    echo "SELinux 未安装"
fi

echo ""
echo "9. 以 azureuser 身份测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$EUID" -eq 0 ]; then
    sudo -u azureuser "$BUN_PATH" --version || echo "❌ azureuser 无法执行"
else
    "$BUN_PATH" --version || echo "❌ 当前用户无法执行"
fi

echo ""
echo "10. systemd-run 测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "尝试使用 systemd-run 运行 Bun..."
systemd-run --user=$USER --working-directory=/opt/legendary-spoon \
    --setenv=PATH=/home/azureuser/.bun/bin:/usr/local/bin:/usr/bin:/bin \
    "$BUN_PATH" --version

echo ""
echo "11. 检查动态链接库"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ldd "$BUN_PATH" 2>&1 | head -20

echo ""
echo "12. 当前服务文件配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat /etc/systemd/system/legendary-spoon.service

echo ""
echo "================================"
echo "诊断完成"
echo "================================"
