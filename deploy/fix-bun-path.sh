#!/bin/bash

# 快速修复 systemd 服务中的 Bun 路径问题
# 用法: sudo bash deploy/fix-bun-path.sh

set -e

echo "================================"
echo "Bun 路径快速修复工具"
echo "================================"
echo ""

# 检查是否以 sudo 运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 sudo 运行此脚本"
    echo "   sudo bash deploy/fix-bun-path.sh"
    exit 1
fi

# 获取实际用户（即使使用 sudo）
REAL_USER=${SUDO_USER:-$USER}
echo "实际用户: $REAL_USER"

# 1. 检查 Bun 安装
echo ""
echo "步骤 1: 检查 Bun 安装..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 尝试多种方法找到 Bun
BUN_PATH=""

# 方法 1: 使用 sudo -u 执行 which
if [ -n "$SUDO_USER" ]; then
    BUN_PATH=$(sudo -u "$SUDO_USER" bash -c 'which bun 2>/dev/null' || echo "")
fi

# 方法 2: 检查常见位置
if [ -z "$BUN_PATH" ]; then
    COMMON_PATHS=(
        "/home/$REAL_USER/.bun/bin/bun"
        "/usr/local/bin/bun"
        "/usr/bin/bun"
        "$HOME/.bun/bin/bun"
    )
    
    for path in "${COMMON_PATHS[@]}"; do
        if [ -x "$path" ]; then
            BUN_PATH="$path"
            echo "✓ 在常见位置找到 Bun: $path"
            break
        fi
    done
fi

# 方法 3: 使用 find 搜索
if [ -z "$BUN_PATH" ]; then
    echo "在常见位置未找到 Bun，正在搜索..."
    BUN_PATH=$(find /home/$REAL_USER -name bun -type f -executable 2>/dev/null | head -1)
fi

if [ -z "$BUN_PATH" ]; then
    echo "❌ 未找到 Bun 可执行文件"
    echo ""
    echo "请先安装 Bun:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✓ Bun 路径: $BUN_PATH"

# 验证 Bun 可执行
if [ ! -x "$BUN_PATH" ]; then
    echo "❌ Bun 文件存在但不可执行"
    exit 1
fi

# 测试 Bun 版本
BUN_VERSION=$($BUN_PATH --version 2>/dev/null || echo "unknown")
echo "✓ Bun 版本: $BUN_VERSION"

# 获取 Bun 目录
BUN_DIR=$(dirname "$BUN_PATH")
echo "✓ Bun 目录: $BUN_DIR"

# 2. 检查服务文件
echo ""
echo "步骤 2: 检查服务文件..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SERVICE_FILE="/etc/systemd/system/legendary-spoon.service"

if [ ! -f "$SERVICE_FILE" ]; then
    echo "❌ 服务文件不存在: $SERVICE_FILE"
    exit 1
fi

echo "✓ 服务文件存在"

# 显示当前配置
CURRENT_EXEC=$(grep "^ExecStart=" "$SERVICE_FILE" | head -1)
echo "当前 ExecStart: $CURRENT_EXEC"

# 3. 更新服务文件
echo ""
echo "步骤 3: 更新服务文件..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 备份原文件
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.$(date +%Y%m%d%H%M%S)"
echo "✓ 已备份服务文件"

# 更新 ExecStart
sed -i "s|^ExecStart=.*|ExecStart=$BUN_PATH run src/index.ts|g" "$SERVICE_FILE"
echo "✓ 已更新 ExecStart 路径"

# 更新或添加 PATH 环境变量
if grep -q "^Environment=\"PATH=" "$SERVICE_FILE"; then
    sed -i "s|^Environment=\"PATH=.*|Environment=\"PATH=$BUN_DIR:/usr/local/bin:/usr/bin:/bin\"|g" "$SERVICE_FILE"
    echo "✓ 已更新 PATH 环境变量"
else
    # 在 [Service] 下添加 PATH
    sed -i "/^\[Service\]/a Environment=\"PATH=$BUN_DIR:/usr/local/bin:/usr/bin:/bin\"" "$SERVICE_FILE"
    echo "✓ 已添加 PATH 环境变量"
fi

# 更新用户
sed -i "s|^User=.*|User=$REAL_USER|g" "$SERVICE_FILE"
echo "✓ 已更新用户为: $REAL_USER"

# 显示更新后的关键配置
echo ""
echo "更新后的配置:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "^(User=|ExecStart=|Environment=)" "$SERVICE_FILE" | sed 's/^/  /'

# 4. 重载服务
echo ""
echo "步骤 4: 重载并重启服务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

systemctl daemon-reload
echo "✓ 已重载 systemd"

systemctl restart legendary-spoon
echo "✓ 已重启服务"

# 等待服务启动
sleep 2

# 5. 检查服务状态
echo ""
echo "步骤 5: 检查服务状态..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if systemctl is-active --quiet legendary-spoon; then
    echo "✅ 服务运行正常！"
    echo ""
    systemctl status legendary-spoon --no-pager -l
else
    echo "❌ 服务启动失败"
    echo ""
    echo "最近的日志:"
    journalctl -u legendary-spoon -n 20 --no-pager
    exit 1
fi

echo ""
echo "================================"
echo "✅ 修复完成！"
echo "================================"
echo ""
echo "常用命令:"
echo "  查看状态: sudo systemctl status legendary-spoon"
echo "  查看日志: sudo journalctl -u legendary-spoon -f"
echo "  重启服务: sudo systemctl restart legendary-spoon"
echo ""
