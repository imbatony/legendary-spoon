#!/bin/bash

# legendary-spoon 部署脚本
# 用法: ./deploy/deploy.sh [production|development]

set -e

ENV="${1:-production}"
PROJECT_DIR="${PROJECT_DIR:-/opt/legendary-spoon}"
SERVICE_NAME="legendary-spoon"

echo "🚀 开始部署 legendary-spoon (环境: $ENV)"

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在: $PROJECT_DIR"
    echo "请设置环境变量 PROJECT_DIR 或修改脚本中的路径"
    exit 1
fi

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
cd "$PROJECT_DIR"
git pull origin main

# 2. 安装依赖
echo "📦 安装依赖..."
bun install --frozen-lockfile

# 3. 数据库迁移（如果需要）
echo "🗄️  检查数据库..."
if [ ! -f "data/mytools.db" ]; then
    echo "初始化数据库..."
    bun run db:init
fi

# 4. 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p data uploads logs

# 5. 重启服务
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "🔄 重启服务..."
    sudo systemctl restart $SERVICE_NAME
    echo "✅ 服务已重启"
else
    echo "▶️  启动服务..."
    sudo systemctl start $SERVICE_NAME
    echo "✅ 服务已启动"
fi

# 6. 检查服务状态
echo "🔍 检查服务状态..."
sleep 2
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ 部署成功！服务正在运行"
    sudo systemctl status $SERVICE_NAME --no-pager -l
else
    echo "❌ 部署失败！服务未能启动"
    sudo journalctl -u $SERVICE_NAME -n 50 --no-pager
    exit 1
fi

echo "🎉 部署完成！"
echo "查看日志: sudo journalctl -u $SERVICE_NAME -f"
