#!/bin/bash

# 使用 shell 包装器的替代方案
# 如果 systemd 无法直接执行 Bun，我们创建一个 shell 脚本作为中介

set -e

echo "================================"
echo "创建 Shell 包装器方案"
echo "================================"
echo ""

# 检查是否以 sudo 运行
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用 sudo 运行此脚本"
    echo "   sudo bash deploy/fix-with-wrapper.sh"
    exit 1
fi

REAL_USER=${SUDO_USER:-$USER}
INSTALL_DIR="/opt/legendary-spoon"
WRAPPER_SCRIPT="$INSTALL_DIR/start.sh"

echo "步骤 1: 创建启动包装器脚本..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash

# 设置环境变量
export NODE_ENV=production
export PATH="/home/azureuser/.bun/bin:/usr/local/bin:/usr/bin:/bin"

# 切换到项目目录
cd /opt/legendary-spoon

# 启动应用
exec /home/azureuser/.bun/bin/bun run src/index.ts
EOF

chmod +x "$WRAPPER_SCRIPT"
chown $REAL_USER:$REAL_USER "$WRAPPER_SCRIPT"

echo "✓ 已创建包装器脚本: $WRAPPER_SCRIPT"
cat "$WRAPPER_SCRIPT"

echo ""
echo "步骤 2: 更新 systemd 服务文件..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SERVICE_FILE="/etc/systemd/system/legendary-spoon.service"

# 备份
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.wrapper.$(date +%Y%m%d%H%M%S)"

# 创建新的服务文件
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=legendary-spoon - Personal Toolkit Web Application
After=network.target

[Service]
Type=simple
User=$REAL_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/bin/bash $WRAPPER_SCRIPT
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# 安全选项（简化配置避免 namespace 问题）
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo "✓ 已更新服务文件"
echo ""
cat "$SERVICE_FILE"

echo ""
echo "步骤 3: 测试包装器脚本..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "以 $REAL_USER 身份测试..."
sudo -u $REAL_USER bash -c "cd $INSTALL_DIR && timeout 3 bash $WRAPPER_SCRIPT" || echo "✓ 脚本可以执行（timeout 是正常的）"

echo ""
echo "步骤 4: 重载并重启服务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

systemctl daemon-reload
systemctl restart legendary-spoon
sleep 2

echo ""
echo "步骤 5: 检查服务状态..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if systemctl is-active --quiet legendary-spoon; then
    echo "✅ 服务运行成功！"
    echo ""
    systemctl status legendary-spoon --no-pager -l
else
    echo "❌ 服务仍然失败"
    echo ""
    journalctl -u legendary-spoon -n 30 --no-pager
    exit 1
fi

echo ""
echo "================================"
echo "✅ 使用包装器脚本方案完成！"
echo "================================"
