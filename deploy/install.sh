#!/bin/bash

# legendary-spoon 快速安装脚本
# 用法: curl -fsSL https://raw.githubusercontent.com/imbatony/legendary-spoon/main/deploy/install.sh | bash

set -e

echo "🚀 legendary-spoon 安装脚本"
echo "================================"

# 检测操作系统
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✅ 检测到 Linux 系统"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ 检测到 macOS 系统"
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 检查 Bun 是否已安装
if ! command -v bun &> /dev/null; then
    echo "📦 Bun 未安装，正在安装..."
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
else
    echo "✅ Bun 已安装: $(bun --version)"
fi

# 检查 Git 是否已安装
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装，请先安装 Git"
    exit 1
fi

# 询问安装路径
read -p "请输入安装路径 [默认: /opt/legendary-spoon]: " INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-/opt/legendary-spoon}"

# 创建安装目录
echo "📁 创建安装目录: $INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"
sudo chown $USER:$USER "$INSTALL_DIR"

# 克隆项目
echo "📥 克隆项目..."
git clone https://github.com/imbatony/legendary-spoon.git "$INSTALL_DIR"
cd "$INSTALL_DIR"

# 安装依赖
echo "📦 安装依赖..."
bun install

# 初始化数据库
echo "🗄️  初始化数据库..."
bun run db:init

# 创建必要的目录
mkdir -p data uploads logs

# 询问部署方式
echo ""
echo "请选择部署方式:"
echo "1) systemd (推荐)"
echo "2) PM2"
echo "3) Docker"
echo "4) 仅安装，稍后手动配置"
read -p "请选择 [1-4]: " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo "📝 配置 systemd 服务..."
        sudo cp deploy/legendary-spoon.service /etc/systemd/system/
        sudo sed -i "s|/path/to/legendary-spoon|$INSTALL_DIR|g" /etc/systemd/system/legendary-spoon.service
        sudo sed -i "s|User=www-data|User=$USER|g" /etc/systemd/system/legendary-spoon.service
        BUN_PATH=$(which bun)
        sudo sed -i "s|/usr/local/bin/bun|$BUN_PATH|g" /etc/systemd/system/legendary-spoon.service
        
        sudo systemctl daemon-reload
        sudo systemctl enable legendary-spoon
        sudo systemctl start legendary-spoon
        
        echo "✅ systemd 服务已启动"
        echo "查看状态: sudo systemctl status legendary-spoon"
        echo "查看日志: sudo journalctl -u legendary-spoon -f"
        ;;
    2)
        echo "📦 安装 PM2..."
        npm install -g pm2
        
        echo "📝 配置 PM2..."
        sed -i "s|/path/to/legendary-spoon|$INSTALL_DIR|g" ecosystem.config.js
        
        pm2 start ecosystem.config.js
        pm2 save
        pm2 startup
        
        echo "✅ PM2 服务已启动"
        echo "查看状态: pm2 status"
        echo "查看日志: pm2 logs legendary-spoon"
        ;;
    3)
        echo "🐳 使用 Docker 部署..."
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker 未安装，请先安装 Docker"
            exit 1
        fi
        
        docker-compose up -d
        
        echo "✅ Docker 容器已启动"
        echo "查看状态: docker-compose ps"
        echo "查看日志: docker-compose logs -f"
        ;;
    4)
        echo "✅ 安装完成！"
        echo "项目位置: $INSTALL_DIR"
        echo "手动启动: cd $INSTALL_DIR && bun start"
        ;;
    *)
        echo "❌ 无效的选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 安装完成！"
echo "项目位置: $INSTALL_DIR"
echo "访问地址: http://localhost:3000"
echo ""
echo "详细文档: $INSTALL_DIR/deploy/DEPLOYMENT.md"
