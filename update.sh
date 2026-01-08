#!/bin/bash

# legendary-spoon 一键更新脚本
# 用法: bash update.sh

set -e

INSTALL_DIR="${INSTALL_DIR:-/opt/legendary-spoon}"

echo "🔄 legendary-spoon 更新工具"
echo "=============================="
echo ""
echo "安装目录: $INSTALL_DIR"
echo ""

# 检查目录是否存在
if [ ! -d "$INSTALL_DIR" ]; then
    echo "❌ 目录不存在: $INSTALL_DIR"
    echo "请设置正确的安装目录: export INSTALL_DIR=/path/to/legendary-spoon"
    exit 1
fi

cd "$INSTALL_DIR"

# 检查是否是 git 仓库
if [ ! -d ".git" ]; then
    echo "❌ 这不是一个 git 仓库"
    exit 1
fi

# 获取最新信息
echo "📡 检查更新..."
git fetch origin

# 检查是否有更新
BEHIND=$(git rev-list HEAD...origin/main --count)
if [ "$BEHIND" -eq 0 ]; then
    echo "✅ 已是最新版本"
    echo ""
    echo "当前版本信息:"
    git log -1 --oneline
    exit 0
fi

echo "📢 发现 $BEHIND 个新提交"
echo ""
echo "更新内容:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log HEAD..origin/main --oneline --color=always
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "是否更新? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ 更新取消"
    exit 0
fi

echo ""
echo "🛑 停止服务..."
if sudo systemctl is-active --quiet legendary-spoon; then
    sudo systemctl stop legendary-spoon
    echo "✓ 服务已停止"
else
    echo "⚠️  服务未运行"
fi

# 备份数据库
if [ -f "data/mytools.db" ]; then
    BACKUP_FILE="data/mytools.db.backup.$(date +%Y%m%d%H%M%S)"
    echo ""
    echo "💾 备份数据库..."
    cp data/mytools.db "$BACKUP_FILE"
    echo "✓ 备份已保存: $BACKUP_FILE"
fi

# 保存当前版本（用于回滚）
CURRENT_VERSION=$(git rev-parse HEAD)

echo ""
echo "📥 拉取最新代码..."
if ! git pull origin main; then
    echo "❌ 代码拉取失败"
    exit 1
fi

echo ""
echo "📦 安装依赖..."
if ! bun install; then
    echo "❌ 依赖安装失败，正在回滚..."
    git reset --hard "$CURRENT_VERSION"
    exit 1
fi

# 检查是否需要数据库迁移
if git diff "$CURRENT_VERSION" HEAD --name-only | grep -q "server/db/init.ts"; then
    echo ""
    echo "🗄️  检测到数据库变更，更新数据库..."
    if ! bun run db:init; then
        echo "⚠️  数据库更新失败，但继续..."
    fi
fi

echo ""
echo "🚀 启动服务..."
sudo systemctl start legendary-spoon

# 等待服务启动
sleep 2

echo ""
echo "🔍 检查服务状态..."
if sudo systemctl is-active --quiet legendary-spoon; then
    echo ""
    echo "✅ 更新成功！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    sudo systemctl status legendary-spoon --no-pager -l
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "当前版本:"
    git log -1 --oneline
else
    echo ""
    echo "❌ 服务启动失败，正在回滚..."
    git reset --hard "$CURRENT_VERSION"
    bun install
    sudo systemctl start legendary-spoon
    
    echo ""
    echo "查看错误日志:"
    echo "  sudo journalctl -u legendary-spoon -n 50"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "常用命令:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "查看状态: sudo systemctl status legendary-spoon"
echo "查看日志: sudo journalctl -u legendary-spoon -f"
echo "重启服务: sudo systemctl restart legendary-spoon"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
