#!/bin/bash

# legendary-spoon 诊断脚本
# 用于检查安装和配置问题

echo "🔍 legendary-spoon 诊断工具"
echo "=============================="
echo ""

# 检查 Bun
echo "1️⃣  检查 Bun 安装..."
if command -v bun &> /dev/null; then
    BUN_PATH=$(which bun)
    BUN_VERSION=$(bun --version)
    echo "✅ Bun 已安装"
    echo "   路径: $BUN_PATH"
    echo "   版本: $BUN_VERSION"
else
    echo "❌ Bun 未安装"
fi
echo ""

# 检查项目目录
echo "2️⃣  检查项目目录..."
INSTALL_DIR="${1:-/opt/legendary-spoon}"
if [ -d "$INSTALL_DIR" ]; then
    echo "✅ 项目目录存在: $INSTALL_DIR"
    echo "   目录大小: $(du -sh "$INSTALL_DIR" 2>/dev/null | cut -f1)"
    echo "   所有者: $(ls -ld "$INSTALL_DIR" | awk '{print $3":"$4}')"
    echo "   权限: $(ls -ld "$INSTALL_DIR" | awk '{print $1}')"
else
    echo "❌ 项目目录不存在: $INSTALL_DIR"
fi
echo ""

# 检查关键文件
echo "3️⃣  检查关键文件..."
FILES=(
    "$INSTALL_DIR/src/index.ts"
    "$INSTALL_DIR/package.json"
    "$INSTALL_DIR/data/mytools.db"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (不存在)"
    fi
done
echo ""

# 检查关键目录
echo "4️⃣  检查关键目录..."
DIRS=(
    "$INSTALL_DIR/data"
    "$INSTALL_DIR/uploads"
    "$INSTALL_DIR/server"
    "$INSTALL_DIR/src"
)

for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir"
    else
        echo "❌ $dir (不存在)"
    fi
done
echo ""

# 检查依赖
echo "5️⃣  检查依赖安装..."
if [ -d "$INSTALL_DIR/node_modules" ]; then
    echo "✅ node_modules 存在"
    MODULE_COUNT=$(find "$INSTALL_DIR/node_modules" -maxdepth 1 -type d | wc -l)
    echo "   包数量: $((MODULE_COUNT - 1))"
else
    echo "❌ node_modules 不存在"
fi
echo ""

# 检查 systemd 服务
echo "6️⃣  检查 systemd 服务..."
if [ -f "/etc/systemd/system/legendary-spoon.service" ]; then
    echo "✅ 服务文件存在"
    
    # 检查服务状态
    if systemctl list-unit-files | grep -q legendary-spoon.service; then
        echo "✅ 服务已注册"
        
        if systemctl is-enabled legendary-spoon.service &> /dev/null; then
            echo "✅ 服务已启用（开机自启）"
        else
            echo "⚠️  服务未启用"
        fi
        
        if systemctl is-active legendary-spoon.service &> /dev/null; then
            echo "✅ 服务正在运行"
        else
            echo "❌ 服务未运行"
        fi
    else
        echo "❌ 服务未注册"
    fi
    
    # 检查服务配置
    echo ""
    echo "服务配置检查:"
    BUN_IN_SERVICE=$(grep "ExecStart=" /etc/systemd/system/legendary-spoon.service | grep -o '/[^ ]*bun')
    if [ -n "$BUN_IN_SERVICE" ]; then
        echo "   ExecStart Bun 路径: $BUN_IN_SERVICE"
        if [ -x "$BUN_IN_SERVICE" ]; then
            echo "   ✅ Bun 可执行文件存在且可执行"
        else
            echo "   ❌ Bun 可执行文件不存在或不可执行"
        fi
    fi
    
    WORK_DIR=$(grep "WorkingDirectory=" /etc/systemd/system/legendary-spoon.service | cut -d'=' -f2)
    if [ -n "$WORK_DIR" ]; then
        echo "   WorkingDirectory: $WORK_DIR"
        if [ -d "$WORK_DIR" ]; then
            echo "   ✅ 工作目录存在"
        else
            echo "   ❌ 工作目录不存在"
        fi
    fi
    
    SERVICE_USER=$(grep "^User=" /etc/systemd/system/legendary-spoon.service | cut -d'=' -f2)
    if [ -n "$SERVICE_USER" ]; then
        echo "   User: $SERVICE_USER"
        if id "$SERVICE_USER" &> /dev/null; then
            echo "   ✅ 用户存在"
        else
            echo "   ❌ 用户不存在"
        fi
    fi
else
    echo "❌ 服务文件不存在"
fi
echo ""

# 检查端口
echo "7️⃣  检查端口占用..."
if command -v netstat &> /dev/null || command -v ss &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
        echo "⚠️  端口 3000 已被占用"
        if command -v lsof &> /dev/null; then
            echo "   占用进程:"
            sudo lsof -i :3000 2>/dev/null | tail -n +2
        fi
    else
        echo "✅ 端口 3000 可用"
    fi
else
    echo "⚠️  无法检查端口（netstat/ss 未安装）"
fi
echo ""

# 测试运行
echo "8️⃣  测试手动运行..."
if [ -d "$INSTALL_DIR" ] && command -v bun &> /dev/null; then
    echo "尝试在项目目录中运行 bun..."
    cd "$INSTALL_DIR"
    timeout 3 bun run src/index.ts &> /tmp/legendary-spoon-test.log &
    TEST_PID=$!
    sleep 2
    
    if ps -p $TEST_PID > /dev/null; then
        echo "✅ Bun 可以正常启动项目"
        kill $TEST_PID 2>/dev/null
    else
        echo "❌ Bun 启动失败"
        echo "错误日志:"
        cat /tmp/legendary-spoon-test.log
    fi
    rm -f /tmp/legendary-spoon-test.log
else
    echo "⚠️  跳过测试（项目目录或 Bun 不存在）"
fi
echo ""

# 总结和建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 诊断总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 提供修复建议
if [ ! -d "$INSTALL_DIR" ]; then
    echo "❌ 项目未安装，请运行安装脚本"
fi

if ! command -v bun &> /dev/null; then
    echo "❌ Bun 未安装，请安装 Bun"
    echo "   curl -fsSL https://bun.sh/install | bash"
fi

if [ -f "/etc/systemd/system/legendary-spoon.service" ]; then
    if ! systemctl is-active legendary-spoon.service &> /dev/null; then
        echo "💡 服务未运行，尝试以下命令："
        echo "   sudo journalctl -u legendary-spoon -n 50  # 查看日志"
        echo "   sudo systemctl restart legendary-spoon    # 重启服务"
    fi
fi

echo ""
echo "📚 更多帮助:"
echo "   - 部署文档: $INSTALL_DIR/deploy/DEPLOYMENT.md"
echo "   - 故障排查: $INSTALL_DIR/deploy/QUICKFIX.md"
echo "   - 查看日志: sudo journalctl -u legendary-spoon -f"
echo ""
