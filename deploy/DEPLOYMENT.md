# legendary-spoon 部署指南

## 使用 systemd 部署（推荐）

### 1. 准备服务器环境

```bash
# 安装 Bun
curl -fsSL https://bun.sh/install | bash

# 克隆项目
cd /opt
git clone https://github.com/imbatony/legendary-spoon.git
cd legendary-spoon

# 安装依赖
bun install

# 初始化数据库
bun run db:init
```

### 2. 配置 systemd 服务

```bash
# 复制 service 文件
sudo cp deploy/legendary-spoon.service /etc/systemd/system/

# 编辑文件，修改路径和用户
sudo nano /etc/systemd/system/legendary-spoon.service

# 修改以下内容：
# - User: 改为你的用户名（如 ubuntu, deploy 等）
# - WorkingDirectory: 改为实际项目路径（如 /opt/legendary-spoon）
# - ReadWritePaths: 改为实际数据目录路径
# - ExecStart: 确保 bun 路径正确（运行 which bun 查看）

# 重载 systemd
sudo systemctl daemon-reload

# 启用开机自启
sudo systemctl enable legendary-spoon

# 启动服务
sudo systemctl start legendary-spoon
```

### 3. 管理服务

```bash
# 查看状态
sudo systemctl status legendary-spoon

# 查看日志
sudo journalctl -u legendary-spoon -f

# 重启服务
sudo systemctl restart legendary-spoon

# 停止服务
sudo systemctl stop legendary-spoon

# 禁用开机自启
sudo systemctl disable legendary-spoon
```

---

## 使用 PM2 部署（适合 Node.js 开发者）

### 1. 安装 PM2

```bash
npm install -g pm2
# 或
bun add -g pm2
```

### 2. 创建 PM2 配置文件

项目已包含 `ecosystem.config.js`，可直接使用：

```bash
# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs legendary-spoon

# 重启服务
pm2 restart legendary-spoon

# 停止服务
pm2 stop legendary-spoon

# 设置开机自启
pm2 startup
pm2 save
```

---

## 使用 Docker 部署

### 1. 构建和运行

```bash
# 构建镜像
docker build -t legendary-spoon .

# 运行容器
docker run -d \
  --name legendary-spoon \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/uploads:/app/uploads \
  --restart unless-stopped \
  legendary-spoon

# 查看日志
docker logs -f legendary-spoon

# 停止容器
docker stop legendary-spoon

# 重启容器
docker restart legendary-spoon
```

### 2. 使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

---

## 使用 screen/tmux（简单方案）

### 使用 screen

```bash
# 安装 screen
sudo apt-get install screen

# 创建新会话
screen -S legendary-spoon

# 在 screen 中启动服务
cd /path/to/legendary-spoon
bun start

# 按 Ctrl+A，然后按 D 分离会话

# 重新连接会话
screen -r legendary-spoon

# 查看所有会话
screen -ls
```

### 使用 tmux

```bash
# 安装 tmux
sudo apt-get install tmux

# 创建新会话
tmux new -s legendary-spoon

# 在 tmux 中启动服务
cd /path/to/legendary-spoon
bun start

# 按 Ctrl+B，然后按 D 分离会话

# 重新连接会话
tmux attach -t legendary-spoon

# 查看所有会话
tmux ls
```

---

## 使用 nohup（最简单）

```bash
# 切换到项目目录
cd /path/to/legendary-spoon

# 后台运行
nohup bun start > logs/app.log 2>&1 &

# 查看进程
ps aux | grep bun

# 停止服务（找到 PID 后）
kill <PID>

# 查看日志
tail -f logs/app.log
```

---

## 推荐配置

### 生产环境最佳实践

1. **使用 systemd**（推荐）
   - ✅ 开机自启
   - ✅ 自动重启
   - ✅ 日志管理
   - ✅ 资源限制
   - ✅ 安全隔离

2. **使用 PM2**
   - ✅ 进程管理
   - ✅ 负载均衡
   - ✅ 监控面板
   - ✅ 零停机重启

3. **使用 Docker**
   - ✅ 环境隔离
   - ✅ 易于部署
   - ✅ 可移植性
   - ✅ 扩展性强

### 性能优化建议

```bash
# 1. 使用环境变量
export NODE_ENV=production
export PORT=3000

# 2. 配置反向代理（Nginx）
# 参考 deploy/nginx.conf

# 3. 启用 HTTPS
# 使用 Let's Encrypt 或其他证书

# 4. 配置防火墙
sudo ufw allow 3000/tcp
sudo ufw enable
```

---

## 故障排查

### 常见问题

#### 1. 安装脚本创建了错误的目录名

**问题**: 目录名为 `INSTALL_DIR=${INSTALL_DIR:-/opt/legendary-spoon}` 而不是实际路径

**原因**: 旧版本安装脚本的变量展开问题

**解决方案**:

```bash
# 方法 1: 使用清理脚本（推荐）
bash deploy/cleanup.sh

# 方法 2: 手动删除
rm -rf "INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}"
# 如果需要 sudo 权限
sudo rm -rf "INSTALL_DIR=\${INSTALL_DIR:-/opt/legendary-spoon}"

# 方法 3: 删除当前目录下的错误目录
rm -rf './INSTALL_DIR=$'{INSTALL_DIR:-/opt/legendary-spoon}
```

然后使用最新的安装脚本重新安装：
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/imbatony/legendary-spoon/main/deploy/quick-install.sh)
```

#### 2. 权限被拒绝

**问题**: `Permission denied` 错误

**解决方案**:
```bash
# 检查文件权限
ls -la /path/to/legendary-spoon

# 更改所有者
sudo chown -R $USER:$USER /path/to/legendary-spoon

# 或使用 sudo 运行清理
sudo rm -rf /path/to/problematic/directory
```

#### 3. 检查端口占用
sudo lsof -i :3000
sudo netstat -tuln | grep 3000

# 检查服务状态
sudo systemctl status legendary-spoon

# 查看详细日志
sudo journalctl -u legendary-spoon -n 100 --no-pager

# 检查文件权限
ls -la /path/to/legendary-spoon/data
ls -la /path/to/legendary-spoon/uploads

# 测试配置
bun run src/index.ts
```
