#!/bin/bash

# legendary-spoon 更新检查脚本
# 用法: bash check-updates.sh

INSTALL_DIR="${INSTALL_DIR:-/opt/legendary-spoon}"

echo "🔍 legendary-spoon 更新检查"
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
echo "正在检查更新..."
git fetch origin -q

# 获取版本信息
CURRENT_VERSION=$(git rev-parse --short HEAD)
LATEST_VERSION=$(git rev-parse --short origin/main)
BEHIND=$(git rev-list HEAD...origin/main --count)

echo ""
echo "当前版本: $CURRENT_VERSION"
echo "最新版本: $LATEST_VERSION"
echo ""

if [ "$BEHIND" -eq 0 ]; then
    echo "✅ 已是最新版本"
    echo ""
    echo "最后更新:"
    git log -1 --pretty=format:"%h - %s (%ar by %an)" --color=always
    echo ""
else
    echo "📢 发现 $BEHIND 个新提交"
    echo ""
    echo "更新内容:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    git log HEAD..origin/main --pretty=format:"%h - %s (%ar by %an)" --color=always
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📥 运行以下命令更新:"
    echo "  cd $INSTALL_DIR && bash update.sh"
    echo ""
    echo "或查看详细变更:"
    echo "  cd $INSTALL_DIR && git log HEAD..origin/main"
    echo "  cd $INSTALL_DIR && git diff HEAD origin/main"
fi

echo ""
