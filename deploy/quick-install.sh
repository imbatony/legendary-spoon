#!/bin/bash

# legendary-spoon 快速安装脚本（简化版）
# 用法: bash <(curl -fsSL https://raw.githubusercontent.com/imbatony/legendary-spoon/main/deploy/quick-install.sh)

set -e

echo "🚀 legendary-spoon 快速安装"
echo "=============================="
echo ""

# 默认配置
DEFAULT_INSTALL_DIR="/opt/legendary-spoon"
DEFAULT_PORT=3000

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  请不要使用 root 用户运行此脚本"
    echo "建议使用普通用户运行"
    exit 1
fi

# 检查 Bun 是否已安装
if ! command -v bun &> /dev/null; then
    echo "📦 正在安装 Bun..."
    curl -fsSL https://bun.sh/install | bash
    
    # 加载 Bun 环境变量
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    # 验证安装
    if ! command -v bun &> /dev/null; then
        echo "❌ Bun 安装失败"
        echo "请手动安装: curl -fsSL https://bun.sh/install | bash"
        exit 1
    fi
    
    echo "✅ Bun 安装成功: $(bun --version)"
else
    echo "✅ Bun 已安装: $(bun --version)"
fi

# 检查 Git 是否已安装
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装"
    echo "Ubuntu/Debian: sudo apt-get install git"
    echo "CentOS/RHEL: sudo yum install git"
    exit 1
fi

echo ""
echo "请输入安装路径（直接回车使用默认值）"
read -p "安装路径 [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"

echo ""
echo "📍 安装路径: $INSTALL_DIR"
echo ""

# 检查目录是否已存在
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  目录已存在: $INSTALL_DIR"
    read -p "是否删除并重新安装? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "❌ 安装取消"
        exit 1
    fi
    echo "🗑️  删除旧目录..."
    if [ -w "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "需要管理员权限删除目录..."
        sudo rm -rf "$INSTALL_DIR"
    fi
fi

# 创建父目录（如果需要）
PARENT_DIR=$(dirname "$INSTALL_DIR")
if [ ! -d "$PARENT_DIR" ]; then
    echo "📁 创建父目录..."
    if [ -w "$(dirname "$PARENT_DIR")" ]; then
        mkdir -p "$PARENT_DIR"
    else
        sudo mkdir -p "$PARENT_DIR"
        sudo chown $USER:$USER "$PARENT_DIR"
    fi
fi

# 创建安装目录
echo "📁 创建安装目录..."
if [ -w "$PARENT_DIR" ]; then
    mkdir -p "$INSTALL_DIR"
else
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown $USER:$USER "$INSTALL_DIR"
fi

# 克隆项目
echo "📥 克隆项目..."
git clone https://github.com/imbatony/legendary-spoon.git "$INSTALL_DIR"

# 进入项目目录
cd "$INSTALL_DIR"

# 安装依赖
echo "📦 安装依赖..."
bun install

# 初始化数据库
echo "🗄️  初始化数据库..."
bun run db:init

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p data uploads logs

echo ""
echo "✅ 基础安装完成！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "请选择部署方式:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1) systemd - 推荐，开机自启，稳定可靠"
echo "2) PM2 - 适合 Node.js 开发者"
echo "3) Docker - 容器化部署"
echo "4) 手动运行 - 仅用于测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "请选择 [1-4]: " DEPLOY_METHOD

case "$DEPLOY_METHOD" in
    1)
        echo ""
        echo "📝 配置 systemd 服务..."
        
        # 获取 Bun 的完整路径
        BUN_PATH=$(which bun)
        if [ -z "$BUN_PATH" ]; then
            echo "❌ 无法找到 Bun 可执行文件"
            exit 1
        fi
        
        echo "Bun 路径: $BUN_PATH"
        
        # 获取 Bun 的目录，用于 PATH 环境变量
        BUN_DIR=$(dirname "$BUN_PATH")
        
        # 复制服务文件
        sudo cp deploy/legendary-spoon.service /etc/systemd/system/
        
        # 替换路径
        sudo sed -i "s|WorkingDirectory=/path/to/legendary-spoon|WorkingDirectory=$INSTALL_DIR|g" /etc/systemd/system/legendary-spoon.service
        sudo sed -i "s|ReadWritePaths=/path/to/legendary-spoon/data /path/to/legendary-spoon/uploads|ReadWritePaths=$INSTALL_DIR/data $INSTALL_DIR/uploads|g" /etc/systemd/system/legendary-spoon.service
        
        # 替换用户
        sudo sed -i "s|User=www-data|User=$USER|g" /etc/systemd/system/legendary-spoon.service
        
        # 替换 Bun 路径（ExecStart 和 PATH）
        sudo sed -i "s|ExecStart=/usr/local/bin/bun|ExecStart=$BUN_PATH|g" /etc/systemd/system/legendary-spoon.service
        sudo sed -i "s|Environment=\"PATH=/usr/local/bin:/usr/bin:/bin\"|Environment=\"PATH=$BUN_DIR:/usr/local/bin:/usr/bin:/bin\"|g" /etc/systemd/system/legendary-spoon.service
        
        # 重载并启动服务
        sudo systemctl daemon-reload
        sudo systemctl enable legendary-spoon
        sudo systemctl start legendary-spoon
        
        # 等待服务启动
        sleep 2
        
        # 检查服务状态
        if sudo systemctl is-active --quiet legendary-spoon; then
            echo ""
            echo "✅ systemd 服务已启动成功！"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "常用命令："
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "查看状态: sudo systemctl status legendary-spoon"
            echo "查看日志: sudo journalctl -u legendary-spoon -f"
            echo "重启服务: sudo systemctl restart legendary-spoon"
            echo "停止服务: sudo systemctl stop legendary-spoon"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        else
            echo ""
            echo "❌ 服务启动失败！"
            echo "查看日志: sudo journalctl -u legendary-spoon -n 50"
            exit 1
        fi
        ;;
        
    2)
        echo ""
        echo "📦 安装 PM2..."
        
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
        else
            echo "✅ PM2 已安装"
        fi
        
        # 修改配置文件
        sed -i "s|cwd: '/path/to/legendary-spoon'|cwd: '$INSTALL_DIR'|g" ecosystem.config.js
        
        # 启动服务
        pm2 start ecosystem.config.js
        pm2 save
        
        echo ""
        echo "设置开机自启..."
        pm2 startup
        
        echo ""
        echo "✅ PM2 服务已启动！"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "常用命令："
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "查看状态: pm2 status"
        echo "查看日志: pm2 logs legendary-spoon"
        echo "重启服务: pm2 restart legendary-spoon"
        echo "停止服务: pm2 stop legendary-spoon"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
        
    3)
        echo ""
        echo "🐳 使用 Docker 部署..."
        
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker 未安装"
            echo "请先安装 Docker: https://docs.docker.com/engine/install/"
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            echo "❌ docker-compose 未安装"
            echo "请先安装 docker-compose"
            exit 1
        fi
        
        # 启动容器
        docker-compose up -d
        
        echo ""
        echo "✅ Docker 容器已启动！"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "常用命令："
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "查看状态: docker-compose ps"
        echo "查看日志: docker-compose logs -f"
        echo "重启容器: docker-compose restart"
        echo "停止容器: docker-compose down"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
        
    4)
        echo ""
        echo "✅ 安装完成！"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "手动运行："
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "cd $INSTALL_DIR"
        echo "bun start"
        echo ""
        echo "或使用 nohup 后台运行："
        echo "nohup bun start > logs/app.log 2>&1 &"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        exit 0
        ;;
        
    *)
        echo ""
        echo "❌ 无效的选择"
        echo ""
        echo "安装已完成，但未配置部署方式"
        echo "请手动运行: cd $INSTALL_DIR && bun start"
        exit 1
        ;;
esac

echo ""
echo "🎉 安装和部署完成！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "访问信息："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "本地访问: http://localhost:$DEFAULT_PORT"
echo "项目目录: $INSTALL_DIR"
echo "详细文档: $INSTALL_DIR/deploy/DEPLOYMENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
