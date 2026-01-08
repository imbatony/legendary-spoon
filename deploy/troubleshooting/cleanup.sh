#!/bin/bash

# legendary-spoon 清理脚本
# 用于清理安装失败或错误创建的目录

echo "🧹 legendary-spoon 清理工具"
echo "=============================="
echo ""

# 查找可能的错误目录
echo "正在查找可能的安装目录..."
echo ""

# 常见的错误目录模式
POSSIBLE_DIRS=(
    "INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}"
    "/opt/legendary-spoon"
    "./legendary-spoon"
    "$HOME/legendary-spoon"
)

FOUND_DIRS=()
INDEX=1

# 检查当前目录
if [ -d "INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}" ]; then
    echo "[$INDEX] $(pwd)/INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon} (错误安装)"
    FOUND_DIRS+=("$(pwd)/INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}")
    INDEX=$((INDEX + 1))
fi

# 检查其他可能的位置
for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -d "$dir" ] && [ "$dir" != "INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}" ]; then
        echo "[$INDEX] $dir"
        FOUND_DIRS+=("$dir")
        INDEX=$((INDEX + 1))
    fi
done

if [ ${#FOUND_DIRS[@]} -eq 0 ]; then
    echo "✅ 未找到需要清理的目录"
    exit 0
fi

echo ""
echo "找到 ${#FOUND_DIRS[@]} 个可能的安装目录"
echo ""
echo "请选择要清理的目录（多个目录用空格分隔，如：1 2 3）："
echo "输入 'all' 清理所有目录"
echo "输入 'quit' 退出"
echo ""
read -p "请选择: " SELECTION

if [ "$SELECTION" = "quit" ]; then
    echo "❌ 已取消"
    exit 0
fi

# 处理选择
DIRS_TO_DELETE=()

if [ "$SELECTION" = "all" ]; then
    DIRS_TO_DELETE=("${FOUND_DIRS[@]}")
else
    # 解析用户输入的索引
    for index in $SELECTION; do
        if [ "$index" -ge 1 ] && [ "$index" -le ${#FOUND_DIRS[@]} ]; then
            DIRS_TO_DELETE+=("${FOUND_DIRS[$((index-1))]}")
        else
            echo "⚠️  忽略无效索引: $index"
        fi
    done
fi

if [ ${#DIRS_TO_DELETE[@]} -eq 0 ]; then
    echo "❌ 没有选择要删除的目录"
    exit 0
fi

# 确认删除
echo ""
echo "将要删除以下目录:"
for dir in "${DIRS_TO_DELETE[@]}"; do
    echo "  - $dir"
done
echo ""
read -p "确认删除? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ 已取消"
    exit 0
fi

# 执行删除
echo ""
echo "🗑️  开始清理..."
for dir in "${DIRS_TO_DELETE[@]}"; do
    echo "删除: $dir"
    if [ -w "$dir" ]; then
        rm -rf "$dir"
        echo "✅ 已删除"
    else
        echo "需要管理员权限..."
        sudo rm -rf "$dir"
        if [ $? -eq 0 ]; then
            echo "✅ 已删除"
        else
            echo "❌ 删除失败"
        fi
    fi
done

echo ""
echo "🎉 清理完成！"
